import React from 'react';
import type { FollowupDTO } from '../models';
import type { StatusBadgeProps } from '../../../../shared/src/components';

const priorityColors: Record<string, { bg: string; fg: string }> = {
  low: { bg: '#1e293b', fg: '#94a3b8' },
  medium: { bg: '#dbeafe22', fg: '#3b82f6' },
  high: { bg: '#fef3c722', fg: '#f59e0b' },
  urgent: { bg: '#fee2e222', fg: '#ef4444' },
};

const statusColors: Record<string, { bg: string; fg: string }> = {
  open: { bg: '#dbeafe22', fg: '#3b82f6' },
  in_progress: { bg: '#fef3c722', fg: '#f59e0b' },
  completed: { bg: '#dcfce722', fg: '#16a34a' },
  overdue: { bg: '#fee2e222', fg: '#ef4444' },
};

function toTitle(v: string) {
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface FollowupListProps {
  followups: FollowupDTO[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (followup: FollowupDTO) => void;
}

function SkeletonRow() {
  return (
    <tr>
      {[40, 30, 20, 15, 20, 25].map((w, i) => (
        <td key={i} style={{ padding: '10px 12px' }}>
          <div style={{ height: 14, width: `${w}%`, backgroundColor: '#334155', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
        </td>
      ))}
    </tr>
  );
}

export function FollowupList({ followups, loading, emptyMessage = 'No followups found', onRowClick }: FollowupListProps) {
  if (loading) {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #334155' }}>
            {['Subject', 'Type', 'Priority', 'Status', 'Due Date', 'Owner'].map((h) => (
              <th key={h} style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#8b9bb5', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        </tbody>
      </table>
    );
  }

  if (followups.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#8b9bb5', fontSize: 14 }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #334155' }}>
            {['Subject', 'Type', 'Priority', 'Status', 'Due Date', 'Owner'].map((h) => (
              <th key={h} style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#8b9bb5', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {followups.map((f) => {
            const pc = priorityColors[f.priority] || priorityColors.medium;
            const sc = statusColors[f.status] || statusColors.open;
            return (
              <tr
                key={f.id}
                onClick={() => onRowClick?.(f)}
                style={{
                  borderBottom: '1px solid #334155',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e293b'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <td style={{ padding: '10px 12px', fontSize: 13, color: '#e6ecf5', fontWeight: 500 }}>{f.subject}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: '#cbd5e1' }}>{toTitle(f.type)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: pc.bg, color: pc.fg }}>
                    {toTitle(f.priority)}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: sc.bg, color: sc.fg }}>
                    {toTitle(f.status)}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: f.status === 'overdue' ? '#ef4444' : '#cbd5e1' }}>
                  {new Date(f.dueDate).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: '#cbd5e1' }}>{f.ownerName}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
