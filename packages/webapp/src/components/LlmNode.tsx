import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

type LlmNodeData = {
  apiKey?: string;
  model?: string;
  prompt?: string;
  onChange?: (id: string, val: { apiKey?: string; model?: string; prompt?: string }) => void;
  status?: 'success' | 'error' | 'pending';
};

type CustomNodeProps = NodeProps & {
  data: LlmNodeData;
};

const styleBase: React.CSSProperties = {
  padding: '12px',
  borderRadius: '8px',
  background: '#fff',
  minWidth: '280px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
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

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px',
  marginBottom: '8px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '12px',
  minHeight: '60px',
  fontFamily: 'monospace',
};

export function LlmNode({ data, id }: CustomNodeProps) {
  const onApiKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange && data.onChange(id, { 
      apiKey: e.target.value, 
      model: data.model,
      prompt: data.prompt
    });
  }, [data, id]);

  const onModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    data.onChange && data.onChange(id, { 
      apiKey: data.apiKey,
      model: e.target.value,
      prompt: data.prompt
    });
  }, [data, id]);

  const onPromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    data.onChange && data.onChange(id, { 
      apiKey: data.apiKey,
      model: data.model,
      prompt: e.target.value
    });
  }, [data, id]);

  const borderColor = data.status === 'success' ? '#22c55e' : data.status === 'error' ? '#ef4444' : '#a855f7';
  const style = { ...styleBase, border: `2px solid ${borderColor}` };

  return (
    <div className="w8less-node" style={style}>
      <Handle type="target" position={Position.Top} />

      <div className="w8less-header">
        <div style={{ fontWeight: 700 }}>🤖 LLM AI</div>
      </div>

      <div className="w8less-body">
        <label className="w8less-label">API Key</label>
        <input
          type="password"
          placeholder="sk-..."
          defaultValue={data.apiKey || ''}
          onChange={onApiKeyChange}
          className="nodrag w8less-input"
        />

        <label className="w8less-label">Model</label>
        <select
          defaultValue={data.model || 'gpt-3.5-turbo'}
          onChange={onModelChange}
          className="nodrag w8less-input"
        >
          <option value="gpt-3.5-turbo">🤖 OpenAI (gpt-3.5-turbo)</option>
          <option value="gpt-4o">🤖 OpenAI (gpt-4o)</option>
          <option value="gemini-pro">🔮 Google Gemini (gemini-pro)</option>
          <option value="mock-pro">🎭 Simulador Grátis (mock-pro)</option>
        </select>

        <label className="w8less-label">Prompt (Use {"{{"} $input.propriedade {"}}"} para variáveis)</label>
        <textarea
          placeholder={`Exemplo: Escreva um poema sobre {{ $input.theme }}`}
          defaultValue={data.prompt || ''}
          onChange={onPromptChange}
          className="nodrag w8less-input"
          style={{ minHeight: 60, fontFamily: 'monospace' }}
        />
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default LlmNode;
