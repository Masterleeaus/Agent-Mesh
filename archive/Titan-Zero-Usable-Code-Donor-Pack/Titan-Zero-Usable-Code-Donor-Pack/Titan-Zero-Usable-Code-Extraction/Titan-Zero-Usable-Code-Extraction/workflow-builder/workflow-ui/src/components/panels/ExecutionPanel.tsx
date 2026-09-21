import React, { useState } from 'react';
import { Panel } from 'reactflow';
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { ExecutionResult } from '@/types/workflow';

interface ExecutionPanelProps {
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  executionStatus?: Record<string, string> | null;
}

const fmt = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ isExecuting, executionResult }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (!isExecuting && !executionResult) return null;

  const isSuccess = executionResult?.status === 'completed';

  const accentColor = isExecuting ? '#3b82f6' : isSuccess ? '#22c55e' : '#ef4444';

  return (
    <Panel position="bottom-center">
      <div
        className="animate-fade-in"
        style={{
          width: 380,
          background: 'var(--bg-panel)',
          border: `1px solid ${accentColor}40`,
          borderRadius: 10,
          boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${accentColor}20`,
          fontFamily: "'Outfit', sans-serif",
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            background: `${accentColor}10`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isExecuting ? (
            <Loader2 size={15} className="animate-spin-custom" style={{ color: accentColor }} />
          ) : isSuccess ? (
            <CheckCircle2 size={15} style={{ color: accentColor }} />
          ) : (
            <XCircle size={15} style={{ color: accentColor }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {isExecuting ? 'Running workflow…' : isSuccess ? 'Execution complete' : 'Execution failed'}
          </span>
          {executionResult && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} />
              {fmt(executionResult.metrics?.totalExecutionTime || 0)}
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '10px 14px' }}>
          {isExecuting && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="animate-running" style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
              Executing nodes sequentially…
            </div>
          )}

          {executionResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Nodes', value: executionResult.metrics?.totalNodes || 0, color: 'var(--text-secondary)' },
                  { label: 'Passed', value: executionResult.metrics?.completedNodes || 0, color: '#22c55e' },
                  { label: 'Failed', value: executionResult.metrics?.failedNodes || 0, color: '#ef4444' },
                ].map(m => (
                  <div key={m.label} style={{ background: 'var(--bg-card)', borderRadius: 7, padding: '7px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: m.color, lineHeight: 1.2 }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Global error */}
              {executionResult.error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', marginBottom: 3 }}>
                    Error · {executionResult.error.nodeId}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(239,68,68,0.8)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {typeof executionResult.error.error === 'string' ? executionResult.error.error : JSON.stringify(executionResult.error.error)}
                  </div>
                </div>
              )}

              {/* Node results */}
              {Object.keys(executionResult.nodeResults || {}).length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Node Results
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Object.entries(executionResult.nodeResults).map(([nodeId, result]) => (
                      <div key={nodeId} style={{ background: 'var(--bg-card)', borderRadius: 7, overflow: 'hidden', border: `1px solid ${result.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                        <button
                          onClick={() => toggle(nodeId)}
                          style={{
                            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                            padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                          }}
                        >
                          {result.success
                            ? <CheckCircle2 size={12} style={{ color: '#22c55e', flexShrink: 0 }} />
                            : <XCircle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                          }
                          <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {nodeId}
                          </span>
                          {result.metadata?.executionTime !== undefined && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {fmt(result.metadata.executionTime)}
                            </span>
                          )}
                          {expanded.has(nodeId) ? <ChevronDown size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronRight size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                        </button>

                        {expanded.has(nodeId) && (
                          <div style={{ padding: '0 10px 8px', borderTop: '1px solid var(--border-subtle)' }}>
                            {result.success && Object.keys(result.outputs || {}).length > 0 && (
                              <pre style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", background: 'var(--bg-input)', borderRadius: 5, padding: '6px 8px', marginTop: 6, overflow: 'auto', maxHeight: 120 }}>
                                {JSON.stringify(result.outputs, null, 2)}
                              </pre>
                            )}
                            {!result.success && result.error && (
                              <div style={{ fontSize: 11, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace", background: 'rgba(239,68,68,0.06)', borderRadius: 5, padding: '6px 8px', marginTop: 6 }}>
                                {result.error.code}: {result.error.message}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                <span>Start: {new Date(executionResult.startTime).toLocaleTimeString()}</span>
                {executionResult.endTime && <span>End: {new Date(executionResult.endTime).toLocaleTimeString()}</span>}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.6 }}>#{executionResult.executionId.slice(-8)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};
