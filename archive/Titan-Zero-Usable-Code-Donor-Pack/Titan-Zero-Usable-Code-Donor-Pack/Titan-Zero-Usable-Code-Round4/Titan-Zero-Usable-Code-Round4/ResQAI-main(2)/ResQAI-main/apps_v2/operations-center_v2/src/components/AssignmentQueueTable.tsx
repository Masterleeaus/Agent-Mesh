import { type FC } from 'react';
import type { OperationDTO } from '../models/dto';
import { Skeleton, EmptyState } from '@resqai/foundation';

interface AssignmentQueueTableProps {
  operations: OperationDTO[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOperationClick: (id: string) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

export const AssignmentQueueTable: FC<AssignmentQueueTableProps> = ({ operations, loading, error, onRetry, onOperationClick, selectedIds, onToggleSelect }) => {
  if (loading) {
    return (
      <div role="status" aria-label="Loading assignment queue">
        <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
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

  if (operations.length === 0) {
    return <EmptyState title="No Assignments" message="All operations have been assigned." />;
  }

  return (
    <div role="region" aria-label="Assignment queue table" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #243049', color: '#8b9bb5' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}><input type="checkbox" aria-label="Select all" /></th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>ID</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Title</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Priority</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Technician</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Scheduled</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {operations.filter(op => op.status !== 'completed' && op.status !== 'cancelled').map((op) => {
            const priorityColor = op.priority === 'critical' ? '#f87171' : op.priority === 'high' ? '#f59e0b' : op.priority === 'normal' ? '#60a5fa' : '#8b9bb5';
            const statusColor = op.status === 'in_progress' ? '#4ade80' : op.status === 'dispatched' ? '#60a5fa' : op.status === 'on_hold' ? '#f59e0b' : '#8b9bb5';
            return (
              <tr
                key={op.id}
                style={{ borderBottom: '1px solid #1a2744', cursor: 'pointer' }}
                onClick={() => onOperationClick(op.id)}
                role="row"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onOperationClick(op.id); }}
              >
                <td style={{ padding: '10px 12px' }} onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.includes(op.id)} onChange={() => onToggleSelect(op.id)} aria-label={`Select ${op.id}`} />
                </td>
                <td style={{ padding: '10px 12px', color: '#60a5fa', fontFamily: 'monospace' }}>{op.id}</td>
                <td style={{ padding: '10px 12px', color: '#e6ecf5', fontWeight: 500 }}>{op.title}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: priorityColor, fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>{op.priority}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#c8d0dc' }}>{op.technicianName || '\u2014'}</td>
                <td style={{ padding: '10px 12px', color: '#8b9bb5' }}>{op.scheduledStart ? new Date(op.scheduledStart).toLocaleString() : '\u2014'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: statusColor, fontWeight: 500, fontSize: 12 }}>{op.status.replace('_', ' ')}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
