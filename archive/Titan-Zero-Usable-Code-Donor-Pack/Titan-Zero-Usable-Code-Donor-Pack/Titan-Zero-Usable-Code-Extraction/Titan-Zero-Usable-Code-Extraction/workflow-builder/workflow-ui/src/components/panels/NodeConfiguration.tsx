import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Settings2 } from 'lucide-react';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';

const NODE_FIELDS: Record<string, Array<{ key: string; label: string; type: 'text' | 'textarea' | 'number' | 'select'; desc?: string; options?: string[] }>> = {
  aspire_fetch_opportunity: [
    { key: 'workspace_id',   label: 'Workspace ID',   type: 'text',   desc: 'Aspire workspace identifier' },
    { key: 'opportunity_id', label: 'Opportunity ID', type: 'text',   desc: 'ID of opportunity to fetch' },
  ],
  aspire_create_proposal: [
    { key: 'workspace_id', label: 'Workspace ID', type: 'text', desc: 'Aspire workspace identifier' },
    { key: 'customer_id',  label: 'Customer ID',  type: 'text', desc: 'Customer identifier' },
    { key: 'template_id',  label: 'Template ID',  type: 'text', desc: 'Proposal template' },
  ],
  ai_text_generation: [
    { key: 'prompt',      label: 'Prompt',       type: 'textarea', desc: 'Text generation prompt' },
    { key: 'model',       label: 'Model',        type: 'select',   desc: 'Claude model to use', options: ['claude-sonnet-4-6', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
    { key: 'max_tokens',  label: 'Max Tokens',   type: 'number',   desc: 'Max tokens to generate' },
    { key: 'temperature', label: 'Temperature',  type: 'number',   desc: 'Randomness 0–1' },
  ],
  conditional: [
    { key: 'field_path', label: 'Field Path', type: 'text',   desc: 'Path to evaluate (e.g. data.status)' },
    { key: 'operator',   label: 'Operator',   type: 'select', desc: 'Comparison', options: ['==', '!=', '>', '<', '>=', '<=', 'contains', 'exists'] },
    { key: 'value',      label: 'Value',      type: 'text',   desc: 'Value to compare against' },
  ],
  transform: [
    { key: 'mapping', label: 'Field Mapping', type: 'textarea', desc: 'JSON mapping: {"output_key": "input.path"}' },
  ],
};

const categoryOf = (nodeType: string) => {
  if (nodeType.startsWith('aspire_')) return 'saas';
  if (nodeType.startsWith('ai_')) return 'ai';
  if (['conditional', 'transform', 'loop'].includes(nodeType)) return 'logic';
  return 'utility';
};

const CATEGORY_COLOR = {
  saas:    '#3b82f6',
  ai:      '#a855f7',
  logic:   '#22c55e',
  utility: '#f59e0b',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 9px',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-default)',
  borderRadius: 6,
  fontSize: 12,
  fontFamily: "'Outfit', sans-serif",
  outline: 'none',
  transition: 'border-color 0.15s',
};

export const NodeConfiguration: React.FC = () => {
  const { selectedNode, nodes, setNodes, setSelectedNode } = useWorkflowStore();
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    setConfig(selectedNode?.data?.config || {});
  }, [selectedNode?.id]);

  if (!selectedNode) return null;

  const nodeType = selectedNode.data?.nodeType || '';
  const category = categoryOf(nodeType);
  const color = CATEGORY_COLOR[category];
  const fields = NODE_FIELDS[nodeType] || [];
  const title = nodeType.split('_').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ');

  const persist = (next: Record<string, any>) => {
    setConfig(next);
    setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, config: next } } : n));
  };

  const set = (k: string, v: any) => persist({ ...config, [k]: v });
  const remove = (k: string) => { const c = { ...config }; delete c[k]; persist(c); };
  const addCustom = () => set(`field_${Object.keys(config).length + 1}`, '');

  const customKeys = Object.keys(config).filter(k => !fields.some(f => f.key === k));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <Settings2 size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{selectedNode.id}</div>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Schema fields */}
        {fields.length > 0 && (
          <Section title="Parameters">
            {fields.map(f => (
              <FieldRow key={f.key} label={f.label} desc={f.desc}>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    value={config[f.key] || ''}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={`Enter ${f.label.toLowerCase()}…`}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                  />
                ) : f.type === 'select' ? (
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={config[f.key] || ''}
                    onChange={e => set(f.key, e.target.value)}
                  >
                    <option value="">— select —</option>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'number' ? (
                  <input
                    type="number"
                    style={inputStyle}
                    value={config[f.key] ?? ''}
                    onChange={e => set(f.key, parseFloat(e.target.value) || 0)}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                  />
                ) : (
                  <input
                    type="text"
                    style={inputStyle}
                    value={config[f.key] || ''}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={`Enter ${f.label.toLowerCase()}…`}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                  />
                )}
              </FieldRow>
            ))}
          </Section>
        )}

        {/* Custom fields */}
        <Section
          title="Custom Fields"
          action={
            <button
              onClick={addCustom}
              style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <Plus size={11} /> Add
            </button>
          }
        >
          {customKeys.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>No custom fields</div>
          ) : (
            customKeys.map(k => (
              <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <input
                  style={{ ...inputStyle, flex: '0 0 80px', fontSize: 11 }}
                  value={k}
                  onChange={e => {
                    const c = { ...config };
                    const v = c[k];
                    delete c[k];
                    c[e.target.value] = v;
                    persist(c);
                  }}
                />
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={String(config[k])}
                  onChange={e => set(k, e.target.value)}
                />
                <button
                  onClick={() => remove(k)}
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', paddingTop: 7 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </Section>

        {/* Input expressions */}
        {Object.keys(selectedNode.data?.inputs || {}).length > 0 && (
          <Section title="Input Expressions">
            {Object.entries(selectedNode.data.inputs).map(([k, v]) => (
              <FieldRow key={k} label={k}>
                <div style={{ ...inputStyle, cursor: 'default', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {JSON.stringify(v)}
                </div>
              </FieldRow>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</div>
      {action}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {children}
    </div>
  </div>
);

const FieldRow: React.FC<{ label: string; desc?: string; children: React.ReactNode }> = ({ label, desc, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
      {label}
      {desc && <span style={{ display: 'block', fontWeight: 400, color: 'var(--text-muted)', fontSize: 10, marginTop: 1 }}>{desc}</span>}
    </label>
    {children}
  </div>
);
