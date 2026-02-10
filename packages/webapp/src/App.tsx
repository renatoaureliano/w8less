import React, { useCallback, useState, useEffect } from 'react';
import { NumberNode } from './components/NumberNode';
import { HttpNode } from './components/HttpNode'; // Verifique se a importação está correta (default vs named)
import LlmNode from './components/LlmNode';
import IfNode from './components/IfNode';
import WebhookNode from './components/WebhookNode';
import OutputNode from './components/OutputNode';
import ExecutionSidebar from './components/ExecutionSidebar';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
  numberInput: NumberNode,
  httpNode: HttpNode,
  llmNode: LlmNode,
  ifNode: IfNode,
  webhookNode: WebhookNode,
  outputNode: OutputNode,
};

// 👇 IMPORTANTE: Coloque o seu link do Codespaces aqui (sem barra no final)
// Use o mesmo link que você pegou na aba PORTS para a porta 3001
const API_URL = 'https://effective-invention-jqw95p7vw5qh5qr9-3001.app.github.dev'; 

export default function App() {
  // --- 1. ESTADOS DO REACT FLOW ---
  // 1. 👇 CORREÇÃO AQUI: Adicione <Node> antes dos parênteses
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // --- 2. ESTADOS DE GERENCIAMENTO (SALVAR/CARREGAR) ---
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState<string>('');
  const [workflows, setWorkflows] = useState<{id:string, name:string}[]>([]);
  const [loading, setLoading] = useState(false);

  // --- 3. ESTADOS DE EXECUÇÃO E INSPEÇÃO ---
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // --- EFEITO: Carregar lista de workflows ao abrir ---
  useEffect(() => {
    fetch(`${API_URL}/workflows`)
      .then(r => r.json())
      .then(setWorkflows)
      .catch((err) => console.error("Erro ao listar workflows. O backend está rodando?", err));
  }, []);

  // --- FUNÇÃO: Carregar workflow selecionado ---
  const loadWorkflow = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/workflows/${id}`);
      const wf = await res.json();
      
      // Restaura o estado
      setNodes(wf.nodes || []);
      setEdges(wf.edges || []);
      setWorkflowId(wf.id);
      setWorkflowName(wf.name);
      
      // Limpa resultados anteriores
      setExecutionResult(null);
      setSelectedNodeId(null);
    } catch (error) {
      alert("Erro ao carregar workflow");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÃO: Salvar workflow (POST/PUT) ---
  const saveWorkflow = async () => {
    const name = workflowName || prompt('Nome do workflow:', workflowName || 'Meu Fluxo') || '';
    if (!name) return;
    
    setWorkflowName(name);
    const payload = { name, nodes, edges };
    
    try {
      let res;
      if (workflowId) {
        // Atualizar existente
        res = await fetch(`${API_URL}/workflows/${workflowId}`, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(payload) 
        });
      } else {
        // Criar novo
        res = await fetch(`${API_URL}/workflows`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(payload) 
        });
      }
      
      const data = await res.json();
      setWorkflowId(data.id);
      alert('Workflow salvo com sucesso!');

      // Atualiza lista do dropdown
      const list = await fetch(`${API_URL}/workflows`).then(r => r.json());
      setWorkflows(list);
    } catch (error) {
      alert("Erro ao salvar. Verifique o console.");
      console.error(error);
    }
  };

  // --- FUNÇÃO: Atualizar dados dos nós (Digitando nos inputs) ---
  // 2. 👇 CORREÇÃO AQUI: Tipagem explícita dentro do setNodes
  const onNodeDataChange = useCallback((id: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          // Se for NumberNode, mantém a estrutura antiga
          if (node.type === 'numberInput') {
            // as Node -> Garante pro TS que isso é um nó válido
            return { ...node, data: { ...node.data, payload: newData } } as Node;
          }
          // Se for os outros nós, merge direto
          return { ...node, data: { ...node.data, ...newData } } as Node;
        }
        return node;
      })
    );
  }, [setNodes]);

  // --- FUNÇÃO: Deletar nó selecionado ---
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    // Remove o nó selecionado
    setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
    // Remove edges conectadas ao nó
    setEdges(prev => prev.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    // Limpa seleção para fechar sidebar
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  // --- FUNÇÃO: Adicionar novo nó (Toolbar) ---
  const addNewNode = useCallback((type: string) => {
    const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : Date.now().toString();

    const offset = Math.floor(Math.random() * 120);
    const position = { x: 100 + offset, y: 100 + offset };

    let data: any = {};
    switch (type) {
      case 'httpNode':
      case 'webhookNode':
        data = { url: 'https://', method: 'GET', headers: [], body: '' };
        break;
      case 'llmNode':
        data = { prompt: '', model: 'gpt-4', temperature: 0.7 };
        break;
      case 'ifNode':
        data = { condition: 'payload.value > 0' };
        break;
      case 'numberInput':
        data = { payload: 0, label: '' };
        break;
      case 'outputNode':
        data = { label: 'Final' };
        break;
      default:
        data = {};
    }

    const newNode: Node = { id, type, position, data } as Node;
    setNodes((prev) => [...prev, newNode]);
  }, [setNodes]);

  // --- PREPARAÇÃO DOS NÓS (Injeção de handlers e estilos de status) ---
  const nodesWithHandler = nodes.map(node => {
    // Verifica o status dessa execução para pintar a borda
    const status = executionResult?.[node.id]?.status;
    let style = node.style || {};

    // Se tiver status, aplica cor na borda (Sucesso = Verde, Erro = Vermelho)
    if (status) {
      style = { 
        ...style, 
        border: `3px solid ${status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : '#fbbf24'}` 
      };
    }

    return {
      ...node,
      style,
      data: { 
        ...node.data, 
        onChange: onNodeDataChange,
        // informa o workflowId e API URL para o WebhookNode
        workflowId: workflowId,
        apiUrl: API_URL,
      },
    };
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // --- FUNÇÃO: Executar Workflow (Run) ---
  const runWorkflow = async () => {
    try {
      const payload = { nodes, edges };

      // 1. Envia o pedido
      const response = await fetch(`${API_URL}/workflows/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const jobId = data.jobId; 
      
      alert(`Job ${jobId} iniciado! Aguardando...`);
      
      // 2. Polling (Verificar status)
      const interval = setInterval(async () => {
        try {
          const checkResp = await fetch(`${API_URL}/workflows/jobs/${jobId}`);
          const jobData = await checkResp.json();
          
          if (jobData.state === 'completed') {
            clearInterval(interval);
            // Salva o histórico para a Sidebar e para pintar as bordas
            setExecutionResult(jobData.result.history || null);
            
            const logs = jobData.result.logs || []; 
            alert(`✅ SUCESSO!\n\n${logs[logs.length - 1]}`);
          } 
          else if (jobData.state === 'failed') {
             clearInterval(interval);
             alert("❌ Ocorreu um erro no processamento.");
          }
        } catch (e) {
          console.error("Erro no polling", e);
        }
      }, 1000);

    } catch (error) {
      console.error(error);
      alert('Erro ao conectar com backend');
    }
  };

  // --- RENDERIZAÇÃO ---
  return (
    <div className="app-shell dark" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* BARRA DE FERRAMENTAS SUPERIOR */}
      <div className="w8less-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button 
          onClick={runWorkflow}
          style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ▶ RODAR
        </button>
        
        <div style={{ width: 1, height: 24, background: '#cbd5e1' }} /> {/* Separador */}

        <button
          onClick={saveWorkflow}
          style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          💾 SALVAR
        </button>

        <select
          value={workflowId || ''}
          onChange={e => { if (e.target.value) loadWorkflow(e.target.value); }}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: 200 }}
        >
          <option value=''>📂 Abrir Workflow...</option>
          {workflows.map(wf => (
            <option key={wf.id} value={wf.id}>{wf.name}</option>
          ))}
        </select>
        
        {loading && <span style={{ color: '#64748b', fontSize: 14 }}>Carregando...</span>}
        {workflowName && <span style={{ marginLeft: 'auto', color: '#334155', fontWeight: 600 }}>Arquivo: {workflowName}</span>}
      </div>

      {/* BARRA DE FERRAMENTAS DE NÓS (Logo abaixo do header) */}
      <div className="w8less-toolbar" style={{ gap: 10, padding: 8, alignItems: 'center' }}>
        <button onClick={() => addNewNode('httpNode')}>🌐 HTTP Request</button>
        <button onClick={() => addNewNode('llmNode')}>🧠 AI / LLM</button>
        <button onClick={() => addNewNode('ifNode')}>🔀 Decisão (IF)</button>
        <button onClick={() => addNewNode('webhookNode')}>⚡ Webhook</button>
        <button onClick={() => addNewNode('numberInput')}>🔢 Input Manual</button>
        <button onClick={() => addNewNode('outputNode')}>🏁 Output</button>

        <button
          onClick={deleteSelectedNode}
          disabled={!selectedNodeId}
          className={selectedNodeId ? 'danger' : ''}
          style={{ marginLeft: 8 }}
        >
          🗑️ Deletar
        </button>
      </div>

      {/* ÁREA PRINCIPAL (Grafo + Sidebar) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ÁREA DO GRAFO */}
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodesWithHandler}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            // permitir deletar via teclado e sincronizar seleção/estado
            deleteKeyCode={['Backspace', 'Delete']}
            onNodesDelete={(deleted) => {
              const deletedIds = deleted.map(d => d.id);
              setNodes(prev => prev.filter(n => !deletedIds.includes(n.id)));
              setEdges(prev => prev.filter(e => !deletedIds.includes(e.source) && !deletedIds.includes(e.target)));
              setSelectedNodeId(null);
            }}
            defaultEdgeOptions={{ type: 'smoothstep', animated: false, style: { stroke: '#52525b', strokeWidth: 2 } }}
          >
            <Background color="#3f3f46" variant={BackgroundVariant.Dots} gap={24} />
            <Controls />
          </ReactFlow>
        </div>

        {/* SIDEBAR DE INSPEÇÃO */}
        <ExecutionSidebar selectedNodeId={selectedNodeId} executionData={executionResult} />
      </div>
    </div>
  );
}