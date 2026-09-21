import { useState, type FC } from 'react';
import { Table, Card, StatusBadge, Skeleton, EmptyState, ErrorState, Pagination } from '@resqai/foundation';
import type { TableColumn } from '@resqai/foundation';
import { useTickets } from '../hooks/useTickets';
import type { TicketListItem } from '../models/view-models';

const columns: TableColumn<TicketListItem>[] = [
  { key: 'subject', header: 'Subject', sortable: true },
  { key: 'customerName', header: 'Customer' },
  { key: 'urgency', header: 'Urgency' },
  { key: 'ownerName', header: 'Assignee' },
  { key: 'age', header: 'Age (hrs)' },
];

export const EscalationsPage: FC = () => {
  const [page, setPage] = useState(1);
  const { tickets, total, loading, error, refetch } = useTickets({ isEscalated: true, page, pageSize: 25 });
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleNavigate = (id: string) => {
    window.location.hash = `#/tickets/${id}`;
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Escalations</h1>
        <StatusBadge variant="error" dot>{total} Active</StatusBadge>
      </div>

      <Card variant="elevated" role="region" aria-label="Escalated tickets">
        {loading ? (
          <div style={{ padding: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
          </div>
        ) : error ? (
          <ErrorState title="Failed to load escalations" message={error} onRetry={refetch} />
        ) : tickets.length === 0 ? (
          <EmptyState title="No active escalations" description="All escalated tickets have been resolved." />
        ) : (
          <Table
            columns={columns}
            data={tickets as unknown as TicketListItem[]}
            onRowClick={(row) => handleNavigate(row.id as string)}
          />
        )}
      </Card>

      {totalPages > 1 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};
