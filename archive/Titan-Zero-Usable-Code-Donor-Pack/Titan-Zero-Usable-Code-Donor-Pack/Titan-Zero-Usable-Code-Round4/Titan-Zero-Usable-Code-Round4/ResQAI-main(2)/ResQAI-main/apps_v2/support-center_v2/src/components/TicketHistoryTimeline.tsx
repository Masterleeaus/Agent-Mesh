import { type FC } from 'react';
import { Skeleton, EmptyState } from '@resqai/foundation';
import type { TimelineEventVM } from '../models/view-models';

interface TicketHistoryTimelineProps {
  events: TimelineEventVM[];
  loading: boolean;
}

export const TicketHistoryTimeline: FC<TicketHistoryTimelineProps> = ({ events, loading }) => {
  if (loading) {
    return <div style={{ padding: 16 }}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={40} style={{ marginBottom: 8 }} />)}</div>;
  }

  if (events.length === 0) {
    return <EmptyState title="No activity" description="No timeline events recorded yet." size="sm" />;
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 20 }}>
      {events.map((event, idx) => (
        <div key={event.id} style={{ position: 'relative', paddingBottom: 16, paddingLeft: 16 }}>
          <div style={{
            position: 'absolute', left: -16, top: 4,
            width: 10, height: 10, borderRadius: '50%',
            background: idx === 0 ? '#41d1c4' : '#243049',
            border: '2px solid #0b1220',
          }} />
          {idx < events.length - 1 && <div style={{
            position: 'absolute', left: -12, top: 14,
            width: 2, bottom: 0, background: '#243049',
          }} />}
          <div style={{ fontSize: 12, fontWeight: 600, color: '#e6ecf5' }}>{event.description}</div>
          <div style={{ fontSize: 11, color: '#6b7b95', marginTop: 2 }}>
            {event.actorName} · {new Date(event.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};
