import { type FC } from 'react';
import type { TimelineEventDTO } from '../models/dto';
import { Skeleton, EmptyState } from '@resqai/foundation';

interface OperationsTimelineTableProps {
  events: TimelineEventDTO[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const typeIcons: Record<string, string> = {
  dispatch: '\u27A1',
  assignment: '\u{1F464}',
  status_change: '\u{1F504}',
  note: '\u{1F4DD}',
  escalation: '\u26A0',
  completion: '\u2705',
  conflict: '\u26D4',
};

const typeColors: Record<string, string> = {
  dispatch: '#60a5fa',
  assignment: '#a78bfa',
  status_change: '#f59e0b',
  note: '#8b9bb5',
  escalation: '#f87171',
  completion: '#4ade80',
  conflict: '#f87171',
};

export const OperationsTimelineTable: FC<OperationsTimelineTableProps> = ({ events, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div role="status" aria-label="Loading timeline">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="text" height={32} style={{ marginBottom: 8 }} />)}
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

  if (events.length === 0) {
    return <EmptyState title="No Events" message="No timeline events recorded." />;
  }

  const sorted = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div role="region" aria-label="Operations timeline" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #243049', color: '#8b9bb5' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Time</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Type</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Actor</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Operation</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((event) => (
            <tr key={event.id} style={{ borderBottom: '1px solid #1a2744' }} role="row">
              <td style={{ padding: '10px 12px', color: '#8b9bb5', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 12 }}>
                {new Date(event.createdAt).toLocaleTimeString()}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ color: typeColors[event.type] || '#8b9bb5', fontSize: 14 }}>{typeIcons[event.type] || '\u2022'} </span>
                <span style={{ color: typeColors[event.type] || '#8b9bb5', fontSize: 12, textTransform: 'capitalize' }}>{event.type.replace('_', ' ')}</span>
              </td>
              <td style={{ padding: '10px 12px', color: '#c8d0dc' }}>{event.description}</td>
              <td style={{ padding: '10px 12px', color: '#e6ecf5' }}>{event.actorName}</td>
              <td style={{ padding: '10px 12px', color: '#60a5fa', fontFamily: 'monospace' }}>{event.operationId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
