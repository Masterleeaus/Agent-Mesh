import React from 'react';

interface AccountQuickActionsProps {
  accountId: string;
  onScheduleScan?: (accountId: string) => void;
  onCreateFollowup?: (accountId: string) => void;
  onAddNote?: (accountId: string) => void;
}

const btnBase: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  cursor: 'pointer',
  border: '1px solid #334155',
  backgroundColor: 'transparent',
  color: '#cbd5e1',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s, color 0.15s',
};

export function AccountQuickActions({ accountId, onScheduleScan, onCreateFollowup, onAddNote }: AccountQuickActionsProps) {
  const actions: { label: string; onClick: () => void; hoverColor: string }[] = [];
  if (onScheduleScan) actions.push({ label: 'Schedule Scan', onClick: () => onScheduleScan(accountId), hoverColor: '#16a34a' });
  if (onCreateFollowup) actions.push({ label: 'Create Follow-up', onClick: () => onCreateFollowup(accountId), hoverColor: '#3b82f6' });
  if (onAddNote) actions.push({ label: 'Add Note', onClick: () => onAddNote(accountId), hoverColor: '#8b5cf6' });

  if (actions.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          style={btnBase}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${a.hoverColor}22`; e.currentTarget.style.color = a.hoverColor; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
