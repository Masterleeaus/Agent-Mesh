import React, { useState } from 'react';
import { Play, Save, FolderOpen, RotateCcw, Pencil, Check, X, Loader2, CheckCircle2, AlertCircle, Zap, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/App';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';
import { cn } from '@/lib/utils';

export const WorkflowToolbar: React.FC = () => {
  const { theme, toggle: toggleTheme } = useTheme();
  const {
    workflowName,
    workflowDescription,
    workflowId,
    setWorkflowMetadata,
    saveWorkflow,
    loadWorkflow,
    resetWorkflow,
    executeWorkflow,
    clearExecution,
    isExecuting,
    executionResult,
    nodes,
    edges,
    selectedNode,
    setNodes,
    setEdges,
    setSelectedNode,
  } = useWorkflowStore();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(workflowName);

  const handleSave = () => {
    const workflow = saveWorkflow();
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          loadWorkflow(JSON.parse(ev.target?.result as string));
        } catch {
          alert('Invalid workflow file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('Reset workflow? All nodes and connections will be cleared.')) {
      resetWorkflow();
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedNode) return;
    setNodes(nodes.filter(n => n.id !== selectedNode.id));
    setEdges(edges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const commitName = () => {
    setWorkflowMetadata({ id: workflowId, name: nameValue || 'Untitled Workflow', description: workflowDescription });
    setEditingName(false);
  };

  const statusColor = executionResult
    ? executionResult.status === 'completed' ? '#22c55e'
    : executionResult.status === 'failed' ? '#ef4444'
    : '#f59e0b'
    : undefined;

  return (
    <div
      className="flex items-center gap-2 px-4 shrink-0"
      style={{
        height: 52,
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 mr-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
          <Zap size={14} className="text-white" />
        </div>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
          Aspire Flow
        </span>
      </div>

      <div className="h-5 w-px mx-1" style={{ background: 'var(--border-default)' }} />

      {/* Workflow name */}
      {editingName ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
            className="text-sm font-medium px-2 py-1 rounded outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-focus)', width: 200 }}
          />
          <button onClick={commitName} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--status-success)' }}>
            <Check size={14} />
          </button>
          <button onClick={() => setEditingName(false)} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setNameValue(workflowName); setEditingName(true); }}
          className="flex items-center gap-1.5 px-2 py-1 rounded group"
          style={{ color: 'var(--text-primary)' }}
          title="Click to rename"
        >
          <span className="text-sm font-medium">{workflowName}</span>
          <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
        </button>
      )}

      {/* Workflow stats */}
      <div className="text-xs px-2 py-1 rounded ml-1" style={{ color: 'var(--text-muted)', background: 'var(--border-subtle)' }}>
        {nodes.length} nodes · {edges.length} edges
      </div>

      {/* Execution status badge */}
      {executionResult && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium" style={{ color: statusColor, background: `${statusColor}20` }}>
          {executionResult.status === 'completed' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {executionResult.status === 'completed'
            ? `Done in ${((executionResult.metrics?.totalExecutionTime || 0) / 1000).toFixed(1)}s`
            : `Failed${executionResult.error ? ` · ${executionResult.error.nodeId}` : ''}`
          }
          <button onClick={clearExecution} className="ml-1 opacity-60 hover:opacity-100">
            <X size={10} />
          </button>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Delete selected */}
      {selectedNode && (
        <button
          onClick={handleDeleteSelected}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all"
          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          title="Delete selected node"
        >
          <X size={12} />
          Delete node
        </button>
      )}

      {/* File ops */}
      <ToolbarButton onClick={handleLoad} title="Load workflow from file" icon={<FolderOpen size={14} />} label="Load" />
      <ToolbarButton onClick={handleSave} title="Save workflow to file" icon={<Save size={14} />} label="Save" />
      <ToolbarButton onClick={handleReset} title="Reset workflow" icon={<RotateCcw size={14} />} label="Reset" danger />

      <div className="h-5 w-px mx-1" style={{ background: 'var(--border-default)' }} />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
        style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <div className="h-5 w-px mx-1" style={{ background: 'var(--border-default)' }} />

      {/* Execute */}
      <button
        onClick={() => nodes.length > 0 && executeWorkflow()}
        disabled={isExecuting || nodes.length === 0}
        className={cn(
          'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
          isExecuting ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
        )}
        style={{
          background: nodes.length === 0 ? 'var(--border-default)' : 'var(--accent)',
          color: nodes.length === 0 ? 'var(--text-muted)' : 'white',
        }}
        title={nodes.length === 0 ? 'Add nodes to run' : isExecuting ? 'Running…' : 'Execute workflow'}
      >
        {isExecuting
          ? <><Loader2 size={14} className="animate-spin-custom" /> Running…</>
          : <><Play size={14} fill="currentColor" /> Execute</>
        }
      </button>
    </div>
  );
};

const ToolbarButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title?: string;
  danger?: boolean;
}> = ({ onClick, icon, label, title, danger }) => (
  <button
    onClick={onClick}
    title={title}
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all hover:opacity-90"
    style={{
      color: danger ? '#ef4444' : 'var(--text-secondary)',
      background: 'transparent',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
  >
    {icon}
    {label}
  </button>
);
