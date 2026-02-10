import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

type HttpNodeData = {
  url?: string;
  method?: string;
  onChange?: (id: string, val: { url?: string; method?: string }) => void;
  status?: 'success' | 'error' | 'pending';
};

type CustomNodeProps = NodeProps & {
  data: HttpNodeData;
};

const styleBase: React.CSSProperties = {};

export function HttpNode({ data, id }: CustomNodeProps) {
  const onUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange && data.onChange(id, { url: e.target.value, method: data.method });
  }, [data, id]);

  const onMethodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    data.onChange && data.onChange(id, { url: data.url, method: e.target.value });
  }, [data, id]);

  const borderColor = data.status === 'success' ? '#22c55e' : data.status === 'error' ? '#ef4444' : '#3b82f6';
  const style = { border: `2px solid ${borderColor}` };

  return (
    <div className="w8less-node" style={style}>
      <Handle type="target" position={Position.Top} />

      <div className="w8less-header">
        <div style={{ fontWeight: 700 }}>🌐 HTTP Request</div>
      </div>

      <div className="w8less-body">
        <input
          placeholder="https://api.exemplo.com/endpoint"
          defaultValue={data.url || ''}
          onChange={onUrlChange}
          className="nodrag w8less-input"
        />

        <select defaultValue={data.method || 'GET'} onChange={onMethodChange} className="nodrag w8less-input">
          <option>GET</option>
          <option>POST</option>
        </select>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default HttpNode;
