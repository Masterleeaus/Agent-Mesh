import React, { memo } from 'react';
import type { OperationsLogEntry } from '../types';

const sectionStyle: React.CSSProperties = {
  background: 'var(--color-surface, #1e1e2e)',
  borderRadius: 'var(--radius-lg, 12px)',
  padding: '20px 24px',
  border: '1px solid var(--color-border, #2a2a3e)',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid var(--color-border, #2a2a3e)',
  color: 'var(--color-text-secondary, #888)',
  fontWeight: 500,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--color-border, #2a2a3e)',
  color: 'var(--color-text, #eee)',
};

interface OperationsLogProps {
  entries: OperationsLogEntry[];
}

export const OperationsLog = memo(function OperationsLog({ entries }: OperationsLogProps) {
  if (entries.length === 0) {
    return (
      <div style={sectionStyle}>
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text, #eee)',
          }}
        >
          Recent Operations Log
        </h3>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary, #888)', margin: 0 }}>
          No log entries yet.
        </p>
      </div>
    );
  }

  return (
    <div style={sectionStyle}>
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--color-text, #eee)',
        }}
      >
        Recent Operations Log
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Timestamp</th>
              <th style={thStyle}>Actor</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Result</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td style={tdStyle}>
                  {new Date(entry.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td style={tdStyle}>{entry.actor}</td>
                <td style={tdStyle}>
                  <code
                    style={{
                      fontSize: 13,
                      background: 'rgba(255,255,255,0.05)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      color: 'var(--color-primary, #6366f1)',
                    }}
                  >
                    {entry.action}
                  </code>
                </td>
                <td style={{ ...tdStyle, color: 'var(--color-text-secondary, #aaa)', fontSize: 13 }}>
                  {entry.result || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
