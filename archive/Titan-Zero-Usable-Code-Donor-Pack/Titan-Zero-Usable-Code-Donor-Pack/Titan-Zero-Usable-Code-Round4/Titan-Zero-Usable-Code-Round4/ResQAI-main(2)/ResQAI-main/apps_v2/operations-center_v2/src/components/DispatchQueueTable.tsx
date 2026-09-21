import { type FC } from 'react';
import type { OperationDTO } from '../models/dto';
import { Skeleton, EmptyState } from '@resqai/foundation';

interface DispatchQueueTableProps {
  operations: OperationDTO[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOperationClick: (id: string) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

export const DispatchQueueTable: FC<DispatchQueueTableProps> = ({ operations, loading, error, onRetry, onOperationClick, selectedIds, onToggleSelect }) => {
  if (loading) {
    return (
      <div role="status" aria-label="Loading dispatch queue">
        <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
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
    return <EmptyState title="No Operations" message="No operations pending dispatch." />;
  }

  return (
    <div role="region" aria-label="Dispatch queue table" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #243049', color: '#8b9bb5' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}><input type="checkbox" aria-label="Select all" /></th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>ID</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Title</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Priority</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Type</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Customer</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Region</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Duration</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((op) => {
            const priorityColor = op.priority === 'critical' ? '#f87171' : op.priority === 'high' ? '#f59e0b' : op.priority === 'normal' ? '#60a5fa' : '#8b9bb5';
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
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(op.id)}
                    onChange={() => onToggleSelect(op.id)}
                    aria-label={`Select operation ${op.id}`}
                  />
                </td>
                <td style={{ padding: '10px 12px', color: '#60a5fa', fontFamily: 'monospace' }}>{op.id}</td>
                <td style={{ padding: '10px 12px', color: '#e6ecf5', fontWeight: 500 }}>{op.title}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: priorityColor, fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>{op.priority}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#8b9bb5' }}>{op.type}</td>
                <td style={{ padding: '10px 12px', color: '#c8d0dc' }}>{op.customerName}</td>
                <td style={{ padding: '10px 12px', color: '#8b9bb5' }}>{op.region}</td>
                <td style={{ padding: '10px 12px', color: '#8b9bb5' }}>{Math.floor(op.estimatedDuration / 60)}h {op.estimatedDuration % 60}m</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
