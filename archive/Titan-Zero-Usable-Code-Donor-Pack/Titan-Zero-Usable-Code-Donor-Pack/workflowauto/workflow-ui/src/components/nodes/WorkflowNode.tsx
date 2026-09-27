import React, { useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, CloudUpload, Sparkles, Brain, GitBranch, ArrowRightLeft, Shuffle, Globe, Clock, Bell, BarChart3, Cpu } from 'lucide-react';

interface WorkflowNodeData {
  nodeType: string;
  inputs: Record<string, any>;
  config: Record<string, any>;
}

const NODE_META: Record<string, { name: string; Icon: React.ElementType; category: 'saas' | 'ai' | 'logic' | 'utility'; desc: string }> = {
  aspire_fetch_opportunity: { name: 'Fetch Opportunity',  Icon: Database,       category: 'saas',    desc: 'Retrieve opportunity from Aspire' },
  aspire_create_proposal:   { name: 'Create Proposal',    Icon: CloudUpload,    category: 'saas',    desc: 'Generate proposal in Aspire' },
  ai_text_generation:       { name: 'AI Text Generation', Icon: Sparkles,       category: 'ai',      desc: 'Generate text using Claude AI' },
  ai_data_analysis:         { name: 'AI Data Analysis',   Icon: Brain,          category: 'ai',      desc: 'Analyze data with ML' },
  conditional:              { name: 'Conditional',        Icon: GitBranch,      category: 'logic',   desc: 'Branch on condition' },
  transform:                { name: 'Transform',          Icon: ArrowRightLeft, category: 'logic',   desc: 'Reshape data fields' },
  loop:                     { name: 'Loop',               Icon: Shuffle,        category: 'logic',   desc: 'Iterate over collection' },
  http_request:             { name: 'HTTP Request',       Icon: Globe,          category: 'utility', desc: 'Call REST API' },
  delay:                    { name: 'Delay',              Icon: Clock,          category: 'utility', desc: 'Pause workflow' },
  notification:             { name: 'Notification',       Icon: Bell,           category: 'utility', desc: 'Send alert' },
  ai_data_analysis_2:       { name: 'Analytics',          Icon: BarChart3,      category: 'utility', desc: 'Chart data' },
};

const CATEGORY_COLORS = {
  saas:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', glow: 'rgba(59,130,246,0.25)' },
  ai:      { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', glow: 'rgba(168,85,247,0.25)' },
  logic:   { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  glow: 'rgba(34,197,94,0.25)' },
  utility: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', glow: 'rgba(245,158,11,0.25)' },
};

export const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  const meta = useMemo(() => {
    return NODE_META[data.nodeType] ?? {
      name: data.nodeType.split('_').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' '),
      Icon: Cpu,
      category: 'utility' as const,
      desc: 'Custom node',
    };
  }, [data.nodeType]);

  const { color, bg, glow } = CATEGORY_COLORS[meta.category];
  const { Icon } = meta;

  const configEntries = Object.entries(data.config || {}).slice(0, 2);
  const inputCount = Object.keys(data.inputs || {}).length;

  return (
    <div
      className="animate-node-appear"
      style={{
        width: 220,
        background: 'var(--bg-card)',
        borderRadius: 10,
        border: selected ? `1.5px solid ${color}` : '1px solid var(--border-default)',
        boxShadow: selected
          ? `0 0 0 3px ${glow}, 0 4px 20px rgba(0,0,0,0.5)`
          : '0 2px 12px rgba(0,0,0,0.4)',
        transition: 'all 0.15s ease',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: color, borderColor: 'var(--bg-canvas)', left: -5, width: 10, height: 10 }}
      />

      {/* Header */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          borderRadius: '9px 9px 0 0',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: `${color}22`,
            border: `1px solid ${color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            flexShrink: 0,
          }}
        >
          <Icon size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meta.name}
          </div>
          <div style={{ fontSize: 10, color: color, fontFamily: "'JetBrains Mono', monospace", opacity: 0.8 }}>
            {data.nodeType}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '9px 12px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: configEntries.length > 0 ? 8 : 0, lineHeight: 1.5 }}>
          {meta.desc}
        </div>

        {configEntries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {configEntries.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k}</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80, fontFamily: "'JetBrains Mono', monospace" }}>
                  {String(v).slice(0, 16)}{String(v).length > 16 ? '…' : ''}
                </span>
              </div>
            ))}
            {Object.keys(data.config || {}).length > 2 && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                +{Object.keys(data.config).length - 2} more
              </div>
            )}
          </div>
        )}

        {inputCount > 0 && configEntries.length === 0 && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '3px 7px', borderRadius: 5, display: 'inline-block' }}>
            {inputCount} input{inputCount !== 1 ? 's' : ''} configured
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: color, borderColor: 'var(--bg-canvas)', right: -5, width: 10, height: 10 }}
      />
    </div>
  );
};
