import React from 'react';
import type { RiskSignalVM } from '../models';

interface RiskSignalCardProps {
  signal: RiskSignalVM;
  onAcknowledge?: (id: string) => void;
}

const severityColors: Record<string, { bg: string; fg: string }> = {
  info: { bg: '#dbeafe22', fg: '#3b82f6' },
  warning: { bg: '#fef3c722', fg: '#f59e0b' },
  critical: { bg: '#fee2e222', fg: '#ef4444' },
};

export function RiskSignalCard({ signal, onAcknowledge }: RiskSignalCardProps) {
  const sc = severityColors[signal.severity] || severityColors.info;

  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        border: `1px solid ${signal.acknowledged ? '#334155' : sc.fg + '44'}`,
        borderRadius: 8,
        padding: 16,
        opacity: signal.acknowledged ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: sc.bg, color: sc.fg, textTransform: 'capitalize' }}>
            {signal.severity}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#e6ecf5' }}>{signal.type}</span>
        </div>
        <span style={{ fontSize: 11, color: '#8b9bb5', whiteSpace: 'nowrap' }}>
          {new Date(signal.detectedAt).toLocaleDateString()}
        </span>
      </div>
      <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8 }}>{signal.description}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#8b9bb5' }}>{signal.accountName}</span>
        {!signal.acknowledged && onAcknowledge && (
          <button
            onClick={() => onAcknowledge(signal.id)}
            style={{
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 600,
              color: '#3b82f6',
              backgroundColor: 'transparent',
              border: '1px solid #334155',
              borderRadius: 6,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3b82f622'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Acknowledge
          </button>
        )}
        {signal.acknowledged && (
          <span style={{ fontSize: 11, color: '#16a34a' }}>&#10003; Acknowledged</span>
        )}
      </div>
    </div>
  );
}
