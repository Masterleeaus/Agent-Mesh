import type { FC } from 'react';
import type { TimelineEntryVM } from '../models/view-models';

interface AccountTimelineProps {
  entries: TimelineEntryVM[];
}

const typeColors: Record<string, string> = {
  note: '#6b7280',
  ticket: '#f59e0b',
  followup: '#41d1c4',
  scan: '#3b82f6',
  appointment: '#8b5cf6',
  dispute: '#ef4444',
};

const typeIcons: Record<string, string> = {
  note: '📝',
  ticket: '🎫',
  followup: '📋',
  scan: '🔍',
  appointment: '📅',
  dispute: '⚖️',
};

export const AccountTimeline: FC<AccountTimelineProps> = ({ entries }) => {
  if (entries.length === 0) {
    return <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, padding: 24 }}>No recent activity</div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      {entries.map((entry, idx) => (
        <div key={entry.id} style={{ display: 'flex', gap: 12, paddingBottom: idx < entries.length - 1 ? 16 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: `${typeColors[entry.type]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {typeIcons[entry.type] || '📌'}
            </div>
            {idx < entries.length - 1 && <div style={{ width: 2, flex: 1, backgroundColor: '#243049', marginTop: 4 }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: idx < entries.length - 1 ? 4 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#e6ecf5' }}>{entry.title}</span>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{entry.timestamp}</span>
            </div>
            <div style={{ fontSize: 12, color: '#8b9bb5', marginTop: 2 }}>{entry.description}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{entry.user}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
