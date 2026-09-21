import { Card, Table, EmptyState, Skeleton } from '../../../shared/src/components';
import type { AppointmentHistoryEventDTO } from '../models/dto';

interface AppointmentHistoryTableProps {
  events: AppointmentHistoryEventDTO[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const eventIconMap: Record<string, { icon: string; color: string }> = {
  created: { icon: '+', color: '#41d1c4' },
  assigned: { icon: '→', color: '#60a5fa' },
  rescheduled: { icon: '↻', color: '#f59e0b' },
  cancelled: { icon: '✕', color: '#ef4444' },
  completed: { icon: '✓', color: '#4ade80' },
  confirmed: { icon: '✓', color: '#4ade80' },
  in_progress: { icon: '●', color: '#f59e0b' },
  no_show: { icon: '!', color: '#ef4444' },
  updated: { icon: '✎', color: '#94a3b8' },
};

export function AppointmentHistoryTable({ events, loading, error, onRetry }: AppointmentHistoryTableProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="text" height={36} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#ef4444' }}>
        <p style={{ margin: '0 0 8px', fontSize: 13 }}>{error}</p>
        {onRetry && <button onClick={onRetry} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 12 }}>Retry</button>}
      </div>
    );
  }

  if (!events.length) {
    return <EmptyState title="No activity" description="No events recorded for this appointment." size="sm" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {events.map(event => {
        const ei = eventIconMap[event.eventType] || { icon: '•', color: '#94a3b8' };
        return (
          <div key={event.id} style={{
            display: 'flex', gap: 12, padding: '8px 12px', borderRadius: 6,
            background: '#1a2332', border: '1px solid #2a3a4e', alignItems: 'flex-start',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 12,
              background: `${ei.color}20`, color: ei.color, fontWeight: 700, flexShrink: 0,
            }}>
              {ei.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#e2e8f0' }}>{event.description}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                {event.actorName} · {new Date(event.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
