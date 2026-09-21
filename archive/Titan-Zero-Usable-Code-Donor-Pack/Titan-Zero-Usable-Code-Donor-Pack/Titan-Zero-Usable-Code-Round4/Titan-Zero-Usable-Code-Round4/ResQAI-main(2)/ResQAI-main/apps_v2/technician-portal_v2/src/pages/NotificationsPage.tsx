import { type FC } from 'react';
import { Card, Button, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationsPage: FC = () => {
  const { notifications, loading, error, refetch, markRead, markAllRead } = useNotifications();

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Notifications</h1>
        {notifications.some(n => !n.read) && (
          <Button size="sm" variant="ghost" onClick={markAllRead}>Mark All Read</Button>
        )}
      </div>

      {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={72} style={{ marginBottom: 8 }} />)}
      {!loading && error && <ErrorState title="Failed to load notifications" message={error} onRetry={refetch} />}
      {!loading && !error && notifications.length === 0 && (
        <EmptyState title="No notifications" description="You're all caught up!" />
      )}
      {!loading && !error && notifications.map(n => (
        <Card
          key={n.id}
          variant="bordered"
          onClick={() => { if (!n.read) markRead(n.id); if (n.jobId) window.location.hash = `#/jobs/${n.jobId}`; }}
          style={{ cursor: n.jobId ? 'pointer' : 'default', marginBottom: 8, opacity: n.read ? 0.7 : 1 }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
              background: n.read ? '#1a2744' : '#41d1c4',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: n.read ? 400 : 600, fontSize: 14, color: '#e6ecf5' }}>{n.title}</span>
                <span style={{ fontSize: 11, color: '#5a6a85', flexShrink: 0, marginLeft: 8 }}>{n.timeAgo}</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8b9bb5' }}>{n.message}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
