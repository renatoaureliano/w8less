import { Queue, Worker } from 'bullmq';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import type { WorkflowDefinition, W8Node, W8Edge } from '@w8less/shared';
import IORedis from 'ioredis';
import vm from 'vm';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';

// Conexão Redis
const connection = new IORedis({
  host: 'localhost', 
  port: 6379,
  maxRetriesPerRequest: null
});

export const workflowQueue = new Queue('workflow-execution', { connection });

// --- TEMPLATE ENGINE SIMPLES ---
function replaceTemplateVariables(template: string, context: any): string {
  // Primeiro trata {{ $input }} (sem propriedade) - usa o contexto inteiro
  let result = template.replace(/\{\{\s*\$input\s*\}\}/g, () => {
    return String(context);
  });
  
  // Depois trata {{ $input.propriedade }} (com propriedade)
  result = result.replace(/\{\{\s*\$input\.(\w+)\s*\}\}/g, (match, key) => {
    return context?.[key] !== undefined ? String(context[key]) : match;
  });
  
  return result;
}

// --- AVALIADOR DE CONDIÇÕES ---
function evaluateCondition(value1: any, operator: string, value2: any): boolean {
  // Converte strings numéricas em números para comparações
  const num1 = isNaN(Number(value1)) ? value1 : Number(value1);
  const num2 = isNaN(Number(value2)) ? value2 : Number(value2);

  switch (operator) {
    case '==':
      return num1 == num2;
    case '!=':
      return num1 != num2;
    case '>':
      return num1 > num2;
    case '<':
      return num1 < num2;
    case '>=':
      return num1 >= num2;
    case '<=':
      return num1 <= num2;
    case 'contains':
      return String(num1).includes(String(num2));
    default:
      console.warn(`⚠️  Operador desconhecido: ${operator}`);
      return false;
  }
}

// --- ENCONTRAR PRÓXIMO NÓ ---
function findNextNode(
  currentNode: W8Node,
  edges: W8Edge[],
  nodeMap: Map<string, W8Node>,
  flowContext: any
): W8Node | undefined {
  
  // Se for um IF Node, usa o resultado previamente avaliado (que está em flowContext como boolean)
  if (currentNode.type === 'ifNode') {
    const handleId = flowContext === true ? 'true' : 'false';
    
    const nextEdge = edges.find(
      e => e.source === currentNode.id && e.sourceHandle === handleId
    );

    if (nextEdge) {
      return nodeMap.get(nextEdge.target);
    }
    console.log(`       ⚠️  Nenhuma aresta ${handleId} encontrada para IF Node`);
    return undefined;
  }

  // Para outros nós, busca qualquer aresta de saída
  const nextEdge = edges.find(e => e.source === currentNode.id);
  if (nextEdge) {
    return nodeMap.get(nextEdge.target);
  }
  return undefined;
}

// --- O CÉREBRO DA EXECUÇÃO ---
// --- O CÉREBRO DA EXECUÇÃO ---
export async function executeGraph(workflow: WorkflowDefinition) {
  const { nodes, edges } = workflow;
  const executionLog: string[] = [];
  
  let flowContext: any = {};

  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  type ExecutionHistory = {
    [nodeId: string]: {
      status: 'success' | 'error' | 'pending';
      input: any;
      output: any;
      logs: string[];
      duration: number;
    }
  };

  const history: ExecutionHistory = {};
  
  // 👇 MUDANÇA 1: Agora aceitamos 'input' OU 'numberInput' como início
  let currentNode = nodes.find(n => n.type === 'input' || n.type === 'numberInput');

  // Se não encontrar input tradicional, permita iniciar por webhook caso tenha initialPayload
  if (!currentNode) {
    currentNode = nodes.find(n => n.type === 'webhookNode' && n.data && (n.data.initialPayload || n.data.payload));
  }

  if (!currentNode) {
    throw new Error("Workflow sem nó de início (type='input' | 'numberInput' | 'webhookNode with payload')!");
  }

  while (currentNode) {
    console.log(`[Exec] 👉 Visitando Nó: ${currentNode.data.label || currentNode.type} (${currentNode.type})`);

    // Initialize history entry for this node
    if (!history[currentNode.id]) {
      history[currentNode.id] = { status: 'pending', input: null, output: null, logs: [], duration: 0 };
    }

    const start = Date.now();
    // capture input for this node
    history[currentNode.id].input = flowContext;

    // WEBHOOK NODE: injeta initialPayload como contexto
    if (currentNode.type === 'webhookNode') {
      try {
        flowContext = currentNode.data?.initialPayload || currentNode.data?.payload || {};
        console.log(`       🎣 Webhook initial payload:`, flowContext);
        history[currentNode.id].output = flowContext;
        history[currentNode.id].status = 'success';
        history[currentNode.id].logs.push('Webhook payload injected');
        history[currentNode.id].duration = Date.now() - start;
      } catch (err: any) {
        console.error(`       ❌ Erro ao processar webhook:`, err.message);
        executionLog.push(`Erro Webhook: ${err.message}`);
        history[currentNode.id].output = { __webhook_error: err.message };
        history[currentNode.id].status = 'error';
        history[currentNode.id].logs.push(`Erro: ${err.message}`);
        history[currentNode.id].duration = Date.now() - start;
      }
    }

    // 👇 MUDANÇA 2: Extraímos os dados se for nosso nó customizado
    if (currentNode.type === 'input' || currentNode.type === 'numberInput') {
      // O dado vem do 'payload' que definimos no Frontend
      flowContext = currentNode.data.payload || {};
      console.log(`       🎒 Peguei a carga inicial:`, flowContext);
      history[currentNode.id].output = flowContext;
      history[currentNode.id].status = 'success';
      history[currentNode.id].logs.push('Loaded initial payload');
      history[currentNode.id].duration = Date.now() - start;
    }

    // Se for HTTP NODE, executamos a chamada externa
    if (currentNode.type === 'httpNode') {
      try {
        const urlStr = currentNode.data.url;
        const method = (currentNode.data.method || 'GET').toUpperCase();
        console.log(`       🌐 Fazendo ${method} ${urlStr}`);

        const urlObj = new URL(urlStr);
        const lib = urlObj.protocol === 'https:' ? https : http;

        const json = await new Promise<any>((resolve, reject) => {
          const req = lib.request(urlObj, { method }, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (res.statusCode && res.statusCode >= 400) {
                  reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                } else {
                  resolve(parsed);
                }
              } catch (e: any) {
                reject(new Error(`Invalid JSON: ${e.message}`));
              }
            });
          });
          req.on('error', (err) => reject(err));
          req.end();
        });

        flowContext = json;
        executionLog.push(`HTTP ${method} ${urlStr} -> OK`);
        console.log(`       ✨ HTTP result:`, json);

        history[currentNode.id].output = json;
        history[currentNode.id].status = 'success';
        history[currentNode.id].logs.push(`HTTP ${method} ${urlStr} -> OK`);
        history[currentNode.id].duration = Date.now() - start;
      } catch (err: any) {
        console.error(`       ❌ Erro HTTP:`, err.message);
        executionLog.push(`Erro HTTP: ${err.message}`);
        flowContext = { __http_error: err.message };

        history[currentNode.id].output = { __http_error: err.message };
        history[currentNode.id].status = 'error';
        history[currentNode.id].logs.push(`Erro HTTP: ${err.message}`);
        history[currentNode.id].duration = Date.now() - start;
      }
    }

    // IF NODE
    if (currentNode.type === 'ifNode') {
      try {
        console.log(`       🔀 Processando IF Node...`);

        const value1Raw = currentNode.data.value1 || '';
        const value2Raw = currentNode.data.value2 || '';
        const operator = currentNode.data.operator || '==';

        // Substitui variáveis
        const value1 = replaceTemplateVariables(value1Raw, flowContext);
        const value2 = replaceTemplateVariables(value2Raw, flowContext);

        console.log(`       📊 Avaliando: "${value1}" ${operator} "${value2}"`);
        const result = evaluateCondition(value1, operator, value2);
        console.log(`       📊 Resultado: ${result ? '✓ TRUE' : '✗ FALSE'}`);

        // A saída de um IF é o resultado da avaliação (boolean)
        flowContext = result;
        executionLog.push(`IF: "${value1}" ${operator} "${value2}" -> ${result}`);

        history[currentNode.id].output = result;
        history[currentNode.id].status = 'success';
        history[currentNode.id].logs.push(`IF evaluation: ${result}`);
        history[currentNode.id].duration = Date.now() - start;

      } catch (err: any) {
        console.error(`       ❌ Erro IF:`, err.message);
        executionLog.push(`Erro IF: ${err.message}`);

        history[currentNode.id].output = { __error: err.message };
        history[currentNode.id].status = 'error';
        history[currentNode.id].logs.push(`Erro IF: ${err.message}`);
        history[currentNode.id].duration = Date.now() - start;
      }
    }

    // LLM NODE 🤖
    if (currentNode.type === 'llmNode') {
      console.log(`       🤖 Executando LLM...`);
      
      try {
        const apiKey = currentNode.data.apiKey;
        const model = currentNode.data.model || 'gpt-3.5-turbo';
        const promptTemplate = currentNode.data.prompt || '';

        // ✅ Substitui variáveis no prompt ANTES de chamar qualquer API
        const finalPrompt = replaceTemplateVariables(promptTemplate, flowContext);
        console.log(`       📝 Prompt final:`, finalPrompt);

        let llmResponse: string;

        // CASO 1: SIMULADOR GRÁTIS (mock-pro)
        if (model === 'mock-pro') {
          console.log(`       🎭 Usando Modo Simulador`);
          llmResponse = `[SIMULADOR] Processando: ${finalPrompt}`;
          executionLog.push(`LLM (${model}) -> Simulador OK`);
        }
        // CASO 2: GOOGLE GEMINI
        else if (model === 'gemini-pro') {
          const geminiKey = process.env.GEMINI_API_KEY;
          if (!geminiKey || !geminiKey.trim()) {
            throw new Error('GEMINI_API_KEY não configurada no .env');
          }

          try {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const genModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
            const result = await genModel.generateContent(finalPrompt);
            llmResponse = result.response.text() || 'Erro ao processar resposta do Gemini';
            console.log(`       ✨ Gemini Response:`, llmResponse);
            executionLog.push(`LLM (${model}) -> OK`);
          } catch (apiError: any) {
            console.error(`       ❌ Erro na API Gemini:`, apiError.message);
            throw new Error(`Erro Gemini: ${apiError.message}`);
          }
        }
        // CASO 3: OPENAI (padrão)
        else {
          if (apiKey && apiKey.trim()) {
            // Usa API real da OpenAI
            try {
              const client = new OpenAI({ apiKey });
              const completion = await client.chat.completions.create({
                model: model || 'gpt-3.5-turbo',
                max_tokens: 1024,
                messages: [
                  { role: 'user', content: finalPrompt }
                ]
              });
              
              llmResponse = completion.choices[0].message.content || 'Erro ao processar resposta';
              console.log(`       ✨ OpenAI Response:`, llmResponse);
              executionLog.push(`LLM (${model}) -> OK`);
            } catch (apiError: any) {
              console.log(`       ⚠️  Erro na API OpenAI, usando mock:`, apiError.message);
              // Fallback para mock se a API falhar
              llmResponse = finalPrompt.toLowerCase().includes('negativo') ? 'NEGATIVO' : 'POSITIVO';
            }
          } else {
            // Mock quando não há API Key
            console.log(`       💭 Usando mock (sem API Key)...`);
            llmResponse = finalPrompt.toLowerCase().includes('negativo') ? 'NEGATIVO' : 'POSITIVO';
            executionLog.push(`LLM (${model}) -> Mock (sem API Key)`);
          }
        }

        flowContext = llmResponse;
        executionLog.push(`LLM (${model}) -> OK`);

        history[currentNode.id].output = llmResponse;
        history[currentNode.id].status = 'success';
        history[currentNode.id].logs.push(`LLM (${model}) -> ${llmResponse.substring(0, 100)}...`);
        history[currentNode.id].duration = Date.now() - start;

      } catch (err: any) {
        console.error(`       ❌ Erro LLM:`, err.message);
        executionLog.push(`Erro LLM: ${err.message}`);
        flowContext = { __llm_error: err.message };

        history[currentNode.id].output = { __llm_error: err.message };
        history[currentNode.id].status = 'error';
        history[currentNode.id].logs.push(`Erro LLM: ${err.message}`);
        history[currentNode.id].duration = Date.now() - start;
      }
    }
    if (currentNode.type === 'default' && currentNode.data.code) {
      console.log(`       💻 Executando código com input...`);
      
      try {
        const sandbox = { 
          console: console, 
          $input: flowContext, 
          result: null 
        };
        
        vm.createContext(sandbox);
        
        const userCode = `result = (() => { ${currentNode.data.code} })();`;
        vm.runInContext(userCode, sandbox);

        console.log(`       ✨ Resultado:`, sandbox.result);
        executionLog.push(`Resultado: ${sandbox.result}`);
        // Atualiza o contexto para o próximo nó
        flowContext = sandbox.result;

        history[currentNode.id].output = sandbox.result;
        history[currentNode.id].status = 'success';
        history[currentNode.id].logs.push(`Resultado: ${sandbox.result}`);
        history[currentNode.id].duration = Date.now() - start;

      } catch (err: any) {
        console.error(`       ❌ Erro:`, err.message);
        executionLog.push(`Erro: ${err.message}`);
        history[currentNode.id].output = { __error: err.message };
        history[currentNode.id].status = 'error';
        history[currentNode.id].logs.push(`Erro: ${err.message}`);
        history[currentNode.id].duration = Date.now() - start;
      }
    }

    await new Promise(r => setTimeout(r, 500));

    // ✨ USAR A NOVA FUNÇÃO PARA ENCONTRAR O PRÓXIMO NÓ
    const nextNode = findNextNode(currentNode, edges, nodeMap, flowContext);
    
    if (nextNode) {
      console.log(`       🔗 Passando para: ${nextNode.id}`);
      currentNode = nextNode;
    } else {
      console.log(`       🛑 Fim da execução.`);
      currentNode = undefined;
    }
  }

  return { history, logs: executionLog };
}

// --- O WORKER ---
const worker = new Worker('workflow-execution', async (job) => {
  console.log(`[Worker] ⚙️ Iniciando Job ${job.id}...`);

  try {
    const payload = job.data as any;

    let nodes: any[] | undefined = payload.nodes;
    let edges: any[] | undefined = payload.edges;

    // Se veio um workflowId, buscamos no banco
    if (payload.workflowId) {
      console.log(`[Worker] 🔎 Buscando workflow ${payload.workflowId} no banco...`);
      const wf = await prisma.workflow.findUnique({ where: { id: payload.workflowId } });
      if (!wf) throw new Error('Workflow não encontrado: ' + payload.workflowId);
      nodes = wf.nodes as any[];
      edges = wf.edges as any[];
    }

    // Se houver initialPayload (webhook), injeta nos nós webhook
    if (payload.initialPayload && Array.isArray(nodes)) {
      nodes = nodes.map(n => {
        if (n.type === 'webhookNode') {
          return { ...n, data: { ...n.data, initialPayload: payload.initialPayload } };
        }
        return n;
      });
    }

    if (!nodes || !edges) throw new Error('Dados do workflow incompletos (nodes/edges)');

    const workflow: WorkflowDefinition = { nodes, edges } as any;

    // Executa
    const result = await executeGraph(workflow);

    console.log(`[Worker] ✅ Job ${job.id} finalizado com sucesso!`);
    return { status: 'success', history: result.history, logs: result.logs };
  } catch (error: any) {
    console.error(`[Worker] ❌ Erro na execução:`, error);
    throw error;
  }

}, { connection });

worker.on('failed', (job, err) => {
  console.error(`[Worker] ❌ Falha crítica no Job ${job?.id}: ${err.message}`);
});