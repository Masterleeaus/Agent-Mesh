import React from 'react';
import type { TimelineEventVM } from '../models';

interface AccountTimelineProps {
  events: TimelineEventVM[];
  loading?: boolean;
}

const eventColors: Record<string, string> = {
  note: '#3b82f6',
  followup: '#f59e0b',
  dispute: '#ef4444',
  ticket: '#8b5cf6',
  scan: '#16a34a',
  default: '#64748b',
};

function SkeletonEvent() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0' }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#334155', flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, width: '60%', backgroundColor: '#334155', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 12, width: '35%', backgroundColor: '#334155', borderRadius: 4 }} />
      </div>
    </div>
  );
}

export function AccountTimeline({ events, loading }: AccountTimelineProps) {
  if (loading) {
    return <div>{[1, 2, 3].map((i) => <SkeletonEvent key={i} />)}</div>;
  }

  if (events.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#8b9bb5', fontSize: 13 }}>No recent activity</div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      {events.map((event, idx) => {
        const dotColor = eventColors[event.type] || eventColors.default;
        const isLast = idx === events.length - 1;
        return (
          <div key={event.id} style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 16, position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0, zIndex: 1 }} />
              {!isLast && <div style={{ width: 2, flex: 1, backgroundColor: '#334155', minHeight: 24 }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 4 }}>
              <div style={{ fontSize: 13, color: '#e6ecf5', marginBottom: 2 }}>{event.description}</div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#8b9bb5' }}>
                <span style={{ textTransform: 'capitalize' }}>{event.type}</span>
                <span>&middot;</span>
                <span>{new Date(event.timestamp).toLocaleString()}</span>
                <span>&middot;</span>
                <span>{event.actor}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
