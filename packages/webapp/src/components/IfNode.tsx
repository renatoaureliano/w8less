import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

type IfNodeData = {
  value1?: string;
  operator?: string;
  value2?: string;
  onChange?: (id: string, val: { value1?: string; operator?: string; value2?: string }) => void;
  status?: 'success' | 'error' | 'pending';
};

type CustomNodeProps = NodeProps & {
  data: IfNodeData;
};

const styleBase: React.CSSProperties = {
  padding: '12px',
  borderRadius: '4px',
  background: '#fff',
  minWidth: '240px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
  position: 'relative',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#333',
  marginBottom: '6px',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px',
  marginBottom: '8px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '12px',
};

const handleGroupStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
  gap: '8px',
  marginTop: '12px',
};

const handleLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#fff',
  padding: '4px 8px',
  borderRadius: '3px',
  textAlign: 'center' as const,
  flex: 1,
};

export function IfNode({ data, id }: CustomNodeProps) {
  const onValue1Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange && data.onChange(id, {
      value1: e.target.value,
      operator: data.operator,
      value2: data.value2
    });
  }, [data, id]);

  const onOperatorChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    data.onChange && data.onChange(id, {
      value1: data.value1,
      operator: e.target.value,
      value2: data.value2
    });
  }, [data, id]);

  const onValue2Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange && data.onChange(id, {
      value1: data.value1,
      operator: data.operator,
      value2: e.target.value
    });
  }, [data, id]);

  const borderColor = data.status === 'success' ? '#22c55e' : data.status === 'error' ? '#ef4444' : '#f97316';
  const style = { ...styleBase, border: `2px solid ${borderColor}` };

  return (
    <div style={style}>
      <Handle type="target" position={Position.Top} />

      <label style={labelStyle}>🔀 IF (Decisão)</label>

      <input
        placeholder="Valor 1 (ex: {{ $input.age }})"
        defaultValue={data.value1 || ''}
        onChange={onValue1Change}
        className="nodrag"
        style={inputStyle}
      />

      <select
        defaultValue={data.operator || '=='}
        onChange={onOperatorChange}
        className="nodrag"
        style={inputStyle}
      >
        <option value="==">== (igual)</option>
        <option value="!=">!= (diferente)</option>
        <option value=">">&gt; (maior)</option>
        <option value="<">&lt; (menor)</option>
        <option value=">=">&gt;= (maior ou igual)</option>
        <option value="<=">&lt;= (menor ou igual)</option>
        <option value="contains">contains (contém)</option>
      </select>

      <input
        placeholder="Valor 2 (ex: 18)"
        defaultValue={data.value2 || ''}
        onChange={onValue2Change}
        className="nodrag"
        style={inputStyle}
      />

      {/* Duas saídas: True e False */}
      <div style={handleGroupStyle}>
        <div style={{ ...handleLabelStyle, background: '#22c55e' }}>
          ✓ True
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ bottom: '-15px', left: '30%', background: '#22c55e' }}
          />
        </div>
        <div style={{ ...handleLabelStyle, background: '#ef4444' }}>
          ✗ False
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ bottom: '-15px', right: '30%', background: '#ef4444' }}
          />
        </div>
      </div>
    </div>
  );
}

export default IfNode;
