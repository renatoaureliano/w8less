import React from 'react';

type ExecutionSidebarProps = {
  selectedNodeId: string | null;
  executionData?: any;
};

export default function ExecutionSidebar({ selectedNodeId, executionData }: ExecutionSidebarProps) {
  if (!selectedNodeId || !executionData) {
    return (
      <div className="w8less-sidebar">
        <div style={{ color: '#64748b', textAlign: 'center', paddingTop: 40 }}>
          Selecione um nó para ver os detalhes
        </div>
      </div>
    );
  }

  const nodeExecution = executionData[selectedNodeId];
  if (!nodeExecution) {
    return (
      <div className="w8less-sidebar">
        <div style={{ color: '#64748b', textAlign: 'center', paddingTop: 40 }}>
          Nó ainda não foi executado
        </div>
      </div>
    );
  }

  // Formata JSON com indentação
  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="w8less-sidebar">
      <div style={{ padding: 16, borderBottom: '1px solid #3f3f46' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700 }}>
          📊 Execução
        </h3>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          Status: <span style={{ color: nodeExecution.status === 'success' ? '#22c55e' : '#ef4444' }}>
            {nodeExecution.status === 'success' ? '✅ Sucesso' : '❌ Erro'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
          Duração: {nodeExecution.duration}ms
        </div>
      </div>

      {/* INPUT RECEBIDO */}
      {nodeExecution.input !== null && (
        <div style={{ padding: 16, borderBottom: '1px solid #3f3f46' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 700, color: '#e4e4e7' }}>
            📥 Input Recebido
          </h4>
          <pre
            style={{
              background: '#0f172a',
              border: '1px solid #3f3f46',
              borderRadius: 6,
              padding: 10,
              fontSize: 10,
              color: '#a1a5b1',
              overflowX: 'auto',
              margin: 0,
              maxHeight: 200,
              overflowY: 'auto'
            }}
          >
            {formatJson(nodeExecution.input)}
          </pre>
        </div>
      )}

      {/* OUTPUT GERADO */}
      {nodeExecution.output !== null && (
        <div style={{ padding: 16, borderBottom: '1px solid #3f3f46' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 700, color: '#e4e4e7' }}>
            📤 Output Gerado
          </h4>
          <pre
            style={{
              background: '#0f172a',
              border: '1px solid #3f3f46',
              borderRadius: 6,
              padding: 10,
              fontSize: 10,
              color: '#22c55e',
              overflowX: 'auto',
              margin: 0,
              maxHeight: 200,
              overflowY: 'auto'
            }}
          >
            {formatJson(nodeExecution.output)}
          </pre>
        </div>
      )}

      {/* LOGS */}
      {nodeExecution.logs && nodeExecution.logs.length > 0 && (
        <div style={{ padding: 16 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 700, color: '#e4e4e7' }}>
            📝 Logs
          </h4>
          <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
            {nodeExecution.logs.map((log: string, idx: number) => (
              <div key={idx}>• {log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
