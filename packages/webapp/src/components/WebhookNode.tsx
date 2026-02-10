import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

type WebhookNodeData = {
  workflowId?: string | null;
  apiUrl?: string;
  initialPayload?: any;
  onChange?: (id: string, val: any) => void;
};

type Props = NodeProps & { data: WebhookNodeData };

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
    <div className="w8less-node border-l-4 border-l-amber-500" style={{ borderLeft: '4px solid #f59e0b' }}>
      <div className="w8less-header">
        <div style={{ fontWeight: 700 }}>⚡ Webhook</div>
      </div>

      <div className="w8less-body">
        {!hasSaved ? (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>💾 Salve o workflow para gerar a URL</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input readOnly value={url} className="w8less-input" />
            <button onClick={copy} className="nodrag" style={{ padding: '6px 8px', borderRadius: 6, background: '#0f172a', color: '#fff', border: 'none', cursor: 'pointer' }}>📋 Copiar</button>
          </div>
        )}
      </div>

      {/* Apenas saída (source) */}
      <Handle type="source" position={Position.Bottom} id="handle" />
    </div>
  );
}
