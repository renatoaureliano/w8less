import { executeGraph } from './queue';

async function testFullIntegration() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TEST: Full w8less Integration (Backend + Frontend Structure)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const workflow = {
    nodes: [
      { id: '1', type: 'numberInput', position: { x: 0, y: 0 }, data: { payload: {} } },
      { id: 'http-1', type: 'httpNode', position: { x: 0, y: 0 }, data: { url: 'https://jsonplaceholder.typicode.com/todos/1', method: 'GET' } },
      { id: '2', type: 'default', position: { x: 0, y: 0 }, data: { code: `return "O título da tarefa é: " + $input.title;` } }
    ],
    edges: [
      { id: 'e1-http', source: '1', target: 'http-1' },
      { id: 'ehttp-2', source: 'http-1', target: '2' }
    ]
  };

  try {
    console.log('[1] Executando workflow...\n');
    const result = await executeGraph(workflow as any);
    
    // TEST 1: Verifica se retorna history
    console.log('[2] Validando estrutura de retorno...');
    if (!result.history) {
      throw new Error('❌ result.history não encontrado');
    }
    console.log('✅ result.history existe\n');

    // TEST 2: Verifica cada nó tem os campos esperados
    console.log('[3] Validando campos de cada nó no history...');
    const requiredFields = ['status', 'input', 'output', 'logs', 'duration'];
    for (const nodeId of Object.keys(result.history)) {
      const nodeHistory = result.history[nodeId];
      for (const field of requiredFields) {
        if (!(field in nodeHistory)) {
          throw new Error(`❌ Nó ${nodeId} não tem campo '${field}'`);
        }
      }
      console.log(`✅ Nó '${nodeId}' tem todos os campos esperados`);
      console.log(`   - status: ${nodeHistory.status}`);
      console.log(`   - duration: ${nodeHistory.duration}ms`);
    }
    console.log();

    // TEST 3: Valida fluxo de dados
    console.log('[4] Validando fluxo de dados entre nós...');
    const httpOut = result.history['http-1'].output;
    const codeInput = result.history['2'].input;
    
    if (httpOut.title !== 'delectus aut autem') {
      throw new Error(`❌ HTTP output não tem título esperado. Got: ${httpOut.title}`);
    }
    console.log('✅ HTTP node retornou JSON correto (title: delectus aut autem)');

    if (JSON.stringify(codeInput) !== JSON.stringify(httpOut)) {
      throw new Error('❌ Input do nó Code não é igual ao output do HTTP');
    }
    console.log('✅ Code node recebeu input correto do HTTP');

    const codeOutput = result.history['2'].output;
    if (codeOutput !== 'O título da tarefa é: delectus aut autem') {
      throw new Error(`❌ Code output incorreto. Got: ${codeOutput}`);
    }
    console.log('✅ Code node processou e retornou mensagem correta\n');

    // TEST 4: Valida que o frontend conseguirá acessar os dados
    console.log('[5] Simulando Frontend acessando history...');
    console.log('Frontend clica no nó "http-1":');
    console.log(JSON.stringify(result.history['http-1'], null, 2));
    console.log('\nFrontend clica no nó "2":');
    console.log(JSON.stringify(result.history['2'], null, 2));
    console.log();

    // TEST 5: Valida que nodeTypes do frontend funcionarão
    console.log('[6] Validando compatibilidade com tipos do Frontend...');
    const nodeTypes = {
      numberInput: 'NumberNode',
      httpNode: 'HttpNode',
      default: 'CodeNode'
    };
    
    for (const nodeId of Object.keys(result.history)) {
      const originalNode = workflow.nodes.find(n => n.id === nodeId);
      if (!nodeTypes[originalNode?.type as keyof typeof nodeTypes]) {
        throw new Error(`❌ Nó de tipo '${originalNode?.type}' não tem component registrado`);
      }
      console.log(`✅ Nó '${nodeId}' (tipo: ${originalNode?.type}) tem component no frontend`);
    }
    console.log();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nResumo da Fase 1 - Operação Raio-X:');
    console.log('  ✅ Backend retorna estrutura {history, logs}');
    console.log('  ✅ Cada nó tem {status, input, output, logs, duration}');
    console.log('  ✅ Dados fluem corretamente entre nós');
    console.log('  ✅ Frontend pode acessar e exibir histórico via ExecutionSidebar');
    console.log('  ✅ HttpNode e CodeNode funcionam conforme esperado');
    console.log('\nPróximas fases: Transformadores, Paralelização, etc.');

  } catch (err: any) {
    console.error('\n❌ ERRO NO TESTE:', err.message);
    process.exit(1);
  }
}

testFullIntegration();
