import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Card, Button, Skeleton, EmptyState, ErrorState, Pagination } from '../../../shared/src/components';

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, total, unreadCount, loading, error, markRead, markAllRead } = useNotifications(page);

  if (error) {
    return <ErrorState title="Failed to load notifications" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Notifications</h1>
          {unreadCount > 0 && <span style={{ fontSize: 12, color: '#8b9bb5' }}>{unreadCount} unread</span>}
        </div>
        {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={markAllRead}>Mark All Read</Button>}
      </div>

      <Card padding="md">
        {loading ? (
          <Skeleton variant="table" />
        ) : data.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up!" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.map((n) => (
              <div key={n.id}
                   style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #1a2744', cursor: n.link ? 'pointer' : 'default', opacity: n.read ? 0.6 : 1 }}
                   onClick={() => { if (!n.read) markRead(n.id); if (n.link) window.location.hash = n.link; }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? '#243049' : '#41d1c4', flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: n.read ? 400 : 600, color: '#e6ecf5' }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: '#8b9bb5', marginTop: 2 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: '#6b7b95', marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.read && (
                  <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                    style={{ background: 'none', border: 'none', color: '#8b9bb5', cursor: 'pointer', fontSize: 12, padding: 4 }}>Mark read</button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {total > 20 && (
        <Pagination currentPage={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />
      )}
    </div>
  );
}