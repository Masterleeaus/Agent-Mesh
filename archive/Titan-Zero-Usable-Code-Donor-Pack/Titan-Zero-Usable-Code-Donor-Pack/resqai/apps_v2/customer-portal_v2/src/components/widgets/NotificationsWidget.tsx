import { Card } from '../../../../shared/src/components';
import type { NotificationListItemVM } from '../../models/view-models';

interface NotificationsWidgetProps {
  notifications: NotificationListItemVM[];
  unreadCount: number;
  loading?: boolean;
  onViewAll?: () => void;
  onMarkRead?: (id: string) => void;
}

export function NotificationsWidget({ notifications, unreadCount, loading, onViewAll, onMarkRead }: NotificationsWidgetProps) {
  if (loading) {
    return (
      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Notifications</span>}>
        <div style={{ height: 100, background: '#1a2744', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      </Card>
    );
  }

  return (
    <Card padding="md" header={
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Notifications</span>
        {unreadCount > 0 && (
          <span style={{ background: '#e74c3c', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{unreadCount}</span>
        )}
      </div>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {notifications.length === 0 ? (
          <div style={{ color: '#6b7b95', fontSize: 12, textAlign: 'center', padding: 16 }}>No notifications</div>
        ) : (
          notifications.slice(0, 4).map((n) => (
            <div key={n.id}
                 style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid #1a2744', cursor: 'pointer', opacity: n.read ? 0.6 : 1 }}
                 onClick={() => { onMarkRead?.(n.id); if (n.link) window.location.hash = n.link; }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.read ? '#243049' : '#41d1c4', flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: '#e6ecf5' }}>{n.title}</div>
                <div style={{ fontSize: 11, color: '#8b9bb5' }}>{n.message}</div>
              </div>
            </div>
          ))
        )}
      </div>
      {onViewAll && (
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <button onClick={onViewAll} style={{ background: 'none', border: 'none', color: '#41d1c4', fontSize: 12, cursor: 'pointer' }}>View All</button>
        </div>
      )}
    </Card>
  );
}