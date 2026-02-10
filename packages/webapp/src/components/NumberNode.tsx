import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

// 1. 👇 Definimos o formato exato dos NOSSOS dados
type MyNodeData = {
  payload: { valor: number };
  onChange?: (id: string, val: { valor: number }) => void;
  status?: 'success' | 'error' | 'pending';
};

// 2. 👇 Criamos um tipo customizado que FORÇA o 'data' a ser o que a gente quer
// Isso sobrescreve o tipo padrão do React Flow para este componente
type CustomNodeProps = NodeProps & {
  data: MyNodeData;
};

const nodeStyleBase = {
  padding: '15px',
  borderRadius: '10px',
  background: '#fff',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  minWidth: '150px',
  textAlign: 'center' as const,
};

const labelStyle = {
  display: 'block',
  marginBottom: '5px',
  color: '#555',
  fontWeight: 'bold',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
};

const inputStyle = {
  width: '100%',
  padding: '5px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  textAlign: 'center' as const,
};

// 3. 👇 Usamos o 'CustomNodeProps' aqui
export function NumberNode({ data, id }: CustomNodeProps) {
  
  const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    // Agora o TypeScript tem certeza absoluta que onChange existe
    if (data.onChange) {
      data.onChange(id, { valor: Number(evt.target.value) });
    }
  }, [data, id]);

  const borderColor = data.status === 'success' ? '#22c55e' : data.status === 'error' ? '#ef4444' : '#7c3aed';
  const nodeStyle = { border: `2px solid ${borderColor}` };

  return (
    <div className="w8less-node" style={nodeStyle}>
      <Handle type="target" position={Position.Top} />

      <div className="w8less-header">
        <span>🔢</span>
        <div className="w8less-label" style={{ margin: 0 }}>Entrada</div>
      </div>

      <div className="w8less-body">
        <input
          id={`num-${id}`}
          name="number"
          type="number"
          defaultValue={data.payload?.valor || 0}
          onChange={onChange}
          className="nodrag w8less-input"
        />
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}