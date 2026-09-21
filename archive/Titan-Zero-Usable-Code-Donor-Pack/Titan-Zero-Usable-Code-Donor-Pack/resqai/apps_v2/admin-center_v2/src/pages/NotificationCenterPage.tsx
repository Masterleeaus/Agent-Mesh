import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Card, Button, StatusBadge, Skeleton, EmptyState, ErrorState, Pagination } from '@resqai/foundation';
import type { NotificationDTO } from '../models';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 16, cursor: 'pointer' };
const unreadCard: React.CSSProperties = { ...cardStyle, borderLeft: '3px solid #41d1c4' };
const notifTitle: React.CSSProperties = { color: '#e6ecf5', fontSize: 14, fontWeight: 500 };
const notifMsg: React.CSSProperties = { color: '#8b9bb5', fontSize: 13, marginTop: 4 };
const notifTime: React.CSSProperties = { color: '#6a7a94', fontSize: 11, marginTop: 4 };

const typeVariant: Record<string, 'success' | 'warning' | 'error' | 'info'> = { info: 'info', warning: 'warning', error: 'error', success: 'success' };

export function NotificationCenterPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, total, loading, error, markRead, dismiss, refetch } = useNotifications(filter === 'unread' ? { read: false } : undefined);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(total / 20);

  if (error) return <ErrorState title="Failed to load notifications" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Notification Center</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => setFilter('all')}>All</Button>
          <Button size="sm" variant={filter === 'unread' ? 'primary' : 'secondary'} onClick={() => setFilter('unread')}>Unread</Button>
        </div>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3,4].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No notifications" description={filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'} />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.map(n => (
              <Card key={n.id} style={n.read ? cardStyle : unreadCard} onClick={() => { if (!n.read) markRead(n.id); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusBadge variant={typeVariant[n.type] || 'info'} size="sm">{n.type}</StatusBadge>
                    <span style={notifTitle}>{n.title}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); dismiss(n.id); }}>✕</Button>
                </div>
                <div style={notifMsg}>{n.message}</div>
                <div style={notifTime}>{new Date(n.createdAt).toLocaleString()}</div>
              </Card>
            ))}
          </div>
          {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
