import { type FC } from 'react';
import { Card, Skeleton, EmptyState } from '@resqai/foundation';
import type { TimelineEventVM } from '../models/view-models';

interface TimelineProps {
  events: TimelineEventVM[];
  loading: boolean;
}

export const Timeline: FC<TimelineProps> = ({ events, loading }) => {
  if (loading) {
    return (
      <div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return <EmptyState title="No activity" description="No timeline events for this case." size="sm" />;
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 20 }}>
      <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: '#1a2744' }} />
      {events.map((ev, idx) => (
        <div key={ev.id} style={{ position: 'relative', paddingBottom: 16 }}>
          <div style={{ position: 'absolute', left: -16, top: 4, width: 10, height: 10, borderRadius: '50%', background: '#41d1c4', border: '2px solid #0b1220' }} />
          <div style={{ marginLeft: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#8b9bb5' }}>{new Date(ev.createdAt).toLocaleString()}</p>
            <p style={{ margin: '2px 0', fontSize: 13, color: '#e6ecf5' }}>{ev.description}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#6b7b95' }}>by {ev.actorName}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
