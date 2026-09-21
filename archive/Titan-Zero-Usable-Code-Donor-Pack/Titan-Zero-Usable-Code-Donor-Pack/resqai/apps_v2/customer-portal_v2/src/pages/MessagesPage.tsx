import { useState } from 'react';
import { useMessages } from '../hooks/useMessages';
import { Card, SearchBar, StatusBadge, Table, Skeleton, EmptyState, ErrorState, Pagination } from '../../../shared/src/components';

export function MessagesPage() {
  const [page, setPage] = useState(1);
  const { data, total, loading, error } = useMessages(page);

  if (error) {
    return <ErrorState title="Failed to load messages" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  const columns = [
    { key: 'subject', header: 'Subject', width: 'auto', render: (_: unknown, row: Record<string, unknown>) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {row.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#41d1c4', flexShrink: 0 }} />}
        <span style={{ fontWeight: row.unread ? 600 : 400, color: row.unread ? '#e6ecf5' : '#8b9bb5' }}>{String(row.subject)}</span>
      </div>
    )},
    { key: 'senderName', header: 'From', width: '140px' },
    { key: 'createdAt', header: 'Date', width: '140px', render: (_: unknown, row: Record<string, unknown>) => new Date(String(row.createdAt)).toLocaleString() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Messages</h1>

      <Card padding="md">
        {loading ? (
          <Skeleton variant="table" />
        ) : data.length === 0 ? (
          <EmptyState title="No messages" description="You don't have any messages yet." />
        ) : (
          <Table
            columns={columns}
            data={data.map((m) => ({ ...m, id: m.id }))}
            onRowClick={(row: Record<string, unknown>) => {
              const ticketId = String(row.ticketId || '');
              if (ticketId) window.location.hash = `/tickets/${ticketId}`;
            }}
          />
        )}
      </Card>

      {total > 20 && (
        <Pagination currentPage={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />
      )}
    </div>
  );
}