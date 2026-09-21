import { useState } from 'react';
import { useCustomerTickets } from '../hooks/useCustomerTickets';
import { Card, SearchBar, Filter, StatusBadge, Pagination, Table, Skeleton, EmptyState, ErrorState, Button } from '../../../shared/src/components';
import type { FilterGroup } from '../../../shared/src/components';
import { TicketStatus, RequestType } from '../models/dto';

const filterGroups: FilterGroup[] = [
  { id: 'status', label: 'Status', options: [
    { value: TicketStatus.Open, label: 'Open' }, { value: TicketStatus.InProgress, label: 'In Progress' },
    { value: TicketStatus.WaitingOnCustomer, label: 'Waiting on Customer' }, { value: TicketStatus.Resolved, label: 'Resolved' },
  ]},
  { id: 'requestType', label: 'Type', options: [
    { value: RequestType.Support, label: 'Support' }, { value: RequestType.Billing, label: 'Billing' },
    { value: RequestType.Technical, label: 'Technical' }, { value: RequestType.General, label: 'General' },
  ]},
];

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [TicketStatus.Open]: 'warning',
  [TicketStatus.InProgress]: 'info',
  [TicketStatus.WaitingOnCustomer]: 'neutral',
  [TicketStatus.WaitingOnInternal]: 'info',
  [TicketStatus.Resolved]: 'success',
  [TicketStatus.Closed]: 'neutral',
};

export function MyTicketsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const { data, total, loading, error } = useCustomerTickets(page);

  const handleFilterChange = (groupId: string, value: string, checked: boolean) => {
    setFilterValues((prev) => {
      const current = prev[groupId] ?? [];
      return { ...prev, [groupId]: checked ? [...current, value] : current.filter((v) => v !== value) };
    });
  };

  if (error) {
    return <ErrorState title="Failed to load tickets" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  const columns = [
    { key: 'id', header: 'ID', width: '100px' },
    { key: 'subject', header: 'Subject', width: 'auto' },
    { key: 'status', header: 'Status', width: '140px', render: (_: unknown, row: Record<string, unknown>) => (
      <StatusBadge variant={statusVariant[String(row.status)]}>{String(row.status).replace(/_/g, ' ')}</StatusBadge>
    )},
    { key: 'requestType', header: 'Type', width: '100px' },
    { key: 'priority', header: 'Priority', width: '80px' },
    { key: 'createdAt', header: 'Created', width: '120px', render: (_: unknown, row: Record<string, unknown>) => new Date(String(row.createdAt)).toLocaleDateString() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>My Tickets</h1>
        <Button variant="primary" onClick={() => { window.location.hash = '/tickets/new'; }}>New Ticket</Button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search tickets..." />
        </div>
        <Filter groups={filterGroups} values={filterValues} onChange={handleFilterChange} />
      </div>

      <Card padding="md">
        {loading ? (
          <Skeleton variant="table" />
        ) : data.length === 0 ? (
          <EmptyState title="No tickets" description="You don't have any support tickets yet." action={<Button variant="primary" onClick={() => { window.location.hash = '/tickets/new'; }}>Create Ticket</Button>} />
        ) : (
          <Table
            columns={columns}
            data={data.map((t) => ({ ...t, id: t.id }))}
            onRowClick={(row: Record<string, unknown>) => { window.location.hash = `/tickets/${row.id}`; }}
          />
        )}
      </Card>

      {total > 10 && (
        <Pagination currentPage={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
      )}
    </div>
  );
}
