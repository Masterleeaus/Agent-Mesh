import React, { useState } from 'react';
import { Search, Database, Brain, GitBranch, Globe, Clock, Bell, Shuffle, ArrowRightLeft, CloudUpload, Sparkles, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';

interface NodeDef {
  id: string;
  name: string;
  description: string;
  category: 'saas' | 'ai' | 'logic' | 'utility';
  Icon: React.ElementType;
}

const NODES: NodeDef[] = [
  { id: 'aspire_fetch_opportunity', name: 'Fetch Opportunity',   description: 'Retrieve opportunity from Aspire CRM',     category: 'saas',    Icon: Database },
  { id: 'aspire_create_proposal',   name: 'Create Proposal',     description: 'Generate proposal in Aspire system',        category: 'saas',    Icon: CloudUpload },
  { id: 'ai_text_generation',       name: 'AI Text Generation',  description: 'Generate text with Claude AI',              category: 'ai',      Icon: Sparkles },
  { id: 'ai_data_analysis',         name: 'AI Data Analysis',    description: 'Analyze data with machine learning',        category: 'ai',      Icon: Brain },
  { id: 'conditional',              name: 'Conditional',         description: 'Branch on field condition',                 category: 'logic',   Icon: GitBranch },
  { id: 'transform',                name: 'Transform',           description: 'Map and reshape data fields',               category: 'logic',   Icon: ArrowRightLeft },
  { id: 'loop',                     name: 'Loop',                description: 'Iterate over a collection',                 category: 'logic',   Icon: Shuffle },
  { id: 'http_request',             name: 'HTTP Request',        description: 'Call any REST API endpoint',                category: 'utility', Icon: Globe },
  { id: 'delay',                    name: 'Delay',               description: 'Pause workflow for a duration',             category: 'utility', Icon: Clock },
  { id: 'notification',             name: 'Notification',        description: 'Send email, SMS or push alerts',            category: 'utility', Icon: Bell },
  { id: 'ai_data_analysis_2',       name: 'Analytics',           description: 'Chart and aggregate data outputs',          category: 'utility', Icon: BarChart3 },
];

const CATEGORIES = [
  { id: 'saas',    label: 'SaaS Integrations',   color: 'var(--color-saas)',    bg: 'var(--color-saas-bg)' },
  { id: 'ai',      label: 'AI & Machine Learning',color: 'var(--color-ai)',      bg: 'var(--color-ai-bg)' },
  { id: 'logic',   label: 'Logic & Control',       color: 'var(--color-logic)',   bg: 'var(--color-logic-bg)' },
  { id: 'utility', label: 'Utilities',             color: 'var(--color-utility)', bg: 'var(--color-utility-bg)' },
] as const;

export const NodeLibrary: React.FC = () => {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (cat: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  const filtered = search
    ? NODES.filter(n => n.name.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase()))
    : null;

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('application/reactflow', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{ width: 240, background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="text-xs font-semibold mb-2 tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
          Nodes
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes…"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto pb-4">
        {filtered ? (
          /* Search results */
          <div className="px-2 pt-1">
            {filtered.length === 0 ? (
              <div className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No nodes found</div>
            ) : (
              filtered.map(node => {
                const cat = CATEGORIES.find(c => c.id === node.category)!;
                return <NodeItem key={node.id} node={node} color={cat.color} bg={cat.bg} onDragStart={onDragStart} />;
              })
            )}
          </div>
        ) : (
          /* Categorized */
          CATEGORIES.map(cat => {
            const catNodes = NODES.filter(n => n.category === cat.id);
            const open = !collapsed.has(cat.id);
            return (
              <div key={cat.id} className="mb-1">
                <button
                  onClick={() => toggle(cat.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors hover:opacity-80"
                  style={{ color: cat.color }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: cat.color }}
                  />
                  <span className="uppercase tracking-wider text-[10px] flex-1 text-left">{cat.label}</span>
                  {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>

                {open && (
                  <div className="px-2 space-y-0.5">
                    {catNodes.map(node => (
                      <NodeItem key={node.id} node={node} color={cat.color} bg={cat.bg} onDragStart={onDragStart} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div
        className="px-3 py-2 text-[10px] text-center shrink-0"
        style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}
      >
        Drag nodes onto the canvas
      </div>
    </div>
  );
};

const NodeItem: React.FC<{
  node: NodeDef;
  color: string;
  bg: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
}> = ({ node, color, bg, onDragStart }) => {
  const { Icon } = node;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, node.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all select-none"
      style={{
        background: hovered ? bg : 'transparent',
        border: `1px solid ${hovered ? color + '40' : 'transparent'}`,
      }}
      title={node.description}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all"
        style={{ background: hovered ? color + '25' : 'var(--bg-card)', color: color }}
      >
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate" style={{ color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {node.name}
        </div>
      </div>
    </div>
  );
};
