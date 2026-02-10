import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

type OutputNodeData = {
  label?: string;
};

type Props = NodeProps & { data: OutputNodeData };

export default function OutputNode({ id, data }: Props) {
  return (
    <div className="w8less-node border-l-4 border-l-slate-500" style={{ borderLeft: '4px solid #64748b' }}>
      <Handle type="target" position={Position.Left} />

      <div className="w8less-header">
        <div style={{ fontWeight: 700 }}>🏁 Debug / Output</div>
      </div>

      <div className="w8less-body">
        <div style={{ color: '#a1a5b1', fontSize: 12 }}>
          Resultado final do fluxo. Clique aqui e veja a Sidebar →
        </div>
      </div>
    </div>
  );
}
