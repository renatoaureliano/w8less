import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

type WebhookNodeData = {
  workflowId?: string | null;
  apiUrl?: string;
  initialPayload?: any;
  onChange?: (id: string, val: any) => void;
};

type Props = NodeProps & { data: WebhookNodeData };

const containerStyle: React.CSSProperties = {
  padding: 10,
  minWidth: 260,
  borderRadius: 8,
  background: '#fff',
  boxShadow: '0 4px 8px rgba(0,0,0,0.04)'
};

export default function WebhookNode({ id, data }: Props) {
  const workflowId = data?.workflowId || null;
  const apiUrl = data?.apiUrl || '';

  const hasSaved = Boolean(workflowId);
  const url = hasSaved ? `${apiUrl.replace(/\/$/, '')}/hooks/${workflowId}` : '';

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      alert('URL copiada para a área de transferência');
    } catch (e) {
      console.error('Erro ao copiar URL', e);
      alert('Falha ao copiar URL');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>⚡ Webhook</div>

      {!hasSaved ? (
        <div style={{ color: '#334155', fontSize: 13 }}>💾 Salve o workflow para gerar a URL</div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input readOnly value={url} style={{ flex: 1, padding: 6, fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }} />
          <button onClick={copy} style={{ padding: '6px 8px', borderRadius: 6, background: '#0f172a', color: '#fff', border: 'none', cursor: 'pointer' }}>📋 Copiar</button>
        </div>
      )}

      {/* Apenas saída (source) */}
      <Handle type="source" position={Position.Bottom} id="handle" />
    </div>
  );
}
