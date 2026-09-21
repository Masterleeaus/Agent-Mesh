import { type FC } from 'react';
import type { EscalationDTO } from '../models/dto';
import { Skeleton, EmptyState } from '@resqai/foundation';

interface EscalationListTableProps {
  escalations: EscalationDTO[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const statusColors: Record<string, string> = {
  open: '#f87171',
  acknowledged: '#f59e0b',
  resolved: '#4ade80',
  closed: '#8b9bb5',
};

const priorityColors: Record<string, string> = {
  critical: '#f87171',
  high: '#f59e0b',
  normal: '#60a5fa',
  low: '#8b9bb5',
};

export const EscalationListTable: FC<EscalationListTableProps> = ({ escalations, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div role="status" aria-label="Loading escalations">
        <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <p>{error}</p>
        <button onClick={onRetry} style={{ background: 'none', border: '1px solid #f87171', color: '#f87171', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  if (escalations.length === 0) {
    return <EmptyState title="No Escalations" message="All operations are running smoothly." />;
  }

  return (
    <div role="region" aria-label="Escalation list table" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #243049', color: '#8b9bb5' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Operation</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Priority</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Reason</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Escalated By</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {escalations.map((esc) => (
            <tr key={esc.id} style={{ borderBottom: '1px solid #1a2744' }} role="row">
              <td style={{ padding: '10px 12px', color: '#e6ecf5', fontWeight: 500 }}>{esc.operationTitle}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ color: priorityColors[esc.priority] || '#8b9bb5', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>{esc.priority}</span>
              </td>
              <td style={{ padding: '10px 12px', color: '#c8d0dc', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{esc.reason}</td>
              <td style={{ padding: '10px 12px', color: '#e6ecf5' }}>{esc.escalatedBy}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ color: statusColors[esc.status] || '#8b9bb5', fontSize: 12, textTransform: 'capitalize' }}>{esc.status}</span>
              </td>
              <td style={{ padding: '10px 12px', color: '#8b9bb5', whiteSpace: 'nowrap' }}>{new Date(esc.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
