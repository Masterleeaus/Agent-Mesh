import { Card } from '../../../../shared/src/components';
import type { ActivityVM } from '../../models/view-models';

interface RecentActivityWidgetProps {
  activities: ActivityVM[];
  loading?: boolean;
}

const typeIcons: Record<string, string> = { ticket: '🎫', appointment: '📅', dispute: '⚖️', billing: '💳', feedback: '⭐' };

export function RecentActivityWidget({ activities, loading }: RecentActivityWidgetProps) {
  if (loading) {
    return (
      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Recent Activity</span>}>
        <div style={{ height: 150, background: '#1a2744', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      </Card>
    );
  }

  return (
    <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Recent Activity</span>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {activities.length === 0 ? (
          <div style={{ color: '#6b7b95', fontSize: 12, textAlign: 'center', padding: 16 }}>No recent activity</div>
        ) : (
          activities.slice(0, 6).map((act) => (
            <div key={act.id}
                 style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid #1a2744', cursor: act.link ? 'pointer' : 'default' }}
                 onClick={() => { if (act.link) window.location.hash = act.link; }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{typeIcons[act.type] ?? '📌'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#e6ecf5' }}>{act.description}</div>
                <div style={{ fontSize: 10, color: '#6b7b95', marginTop: 2 }}>{new Date(act.timestamp).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}