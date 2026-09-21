import { type FC } from 'react';
import type { OperationDTO } from '../models/dto';
import { Skeleton, EmptyState } from '@resqai/foundation';

interface CompletedOperationsTableProps {
  operations: OperationDTO[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOperationClick: (id: string) => void;
}

export const CompletedOperationsTable: FC<CompletedOperationsTableProps> = ({ operations, loading, error, onRetry, onOperationClick }) => {
  if (loading) {
    return (
      <div role="status" aria-label="Loading completed operations">
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

  const completed = operations.filter(op => op.status === 'completed');

  if (completed.length === 0) {
    return <EmptyState title="No Completed Operations" message="No operations have been completed yet." />;
  }

  return (
    <div role="region" aria-label="Completed operations table" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #243049', color: '#8b9bb5' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>ID</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Title</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Type</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Customer</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Technician</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Region</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Completed</th>
          </tr>
        </thead>
        <tbody>
          {completed.map((op) => (
            <tr
              key={op.id}
              style={{ borderBottom: '1px solid #1a2744', cursor: 'pointer' }}
              onClick={() => onOperationClick(op.id)}
              role="row"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onOperationClick(op.id); }}
            >
              <td style={{ padding: '10px 12px', color: '#60a5fa', fontFamily: 'monospace' }}>{op.id}</td>
              <td style={{ padding: '10px 12px', color: '#e6ecf5', fontWeight: 500 }}>{op.title}</td>
              <td style={{ padding: '10px 12px', color: '#8b9bb5' }}>{op.type}</td>
              <td style={{ padding: '10px 12px', color: '#c8d0dc' }}>{op.customerName}</td>
              <td style={{ padding: '10px 12px', color: '#c8d0dc' }}>{op.technicianName || '\u2014'}</td>
              <td style={{ padding: '10px 12px', color: '#8b9bb5', textTransform: 'capitalize' }}>{op.region}</td>
              <td style={{ padding: '10px 12px', color: '#8b9bb5', whiteSpace: 'nowrap' }}>
                {op.completedAt ? new Date(op.completedAt).toLocaleDateString() : '\u2014'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
