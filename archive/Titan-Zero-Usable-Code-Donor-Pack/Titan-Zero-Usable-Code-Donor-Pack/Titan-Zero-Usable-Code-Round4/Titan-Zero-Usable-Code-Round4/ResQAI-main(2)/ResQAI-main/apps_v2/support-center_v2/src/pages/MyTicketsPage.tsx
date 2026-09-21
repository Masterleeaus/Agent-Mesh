import { useState, type FC } from 'react';
import { SearchBar, Filter, Pagination, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { TicketList } from '../components';
import { useTickets } from '../hooks/useTickets';
import type { FilterGroup } from '@resqai/foundation';

const filterGroups: FilterGroup[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'checkbox',
    options: [
      { label: 'New', value: 'new' },
      { label: 'Open', value: 'open' },
      { label: 'Pending', value: 'pending' },
      { label: 'Resolved', value: 'resolved' },
      { label: 'Closed', value: 'closed' },
    ],
  },
  {
    id: 'urgency',
    label: 'Urgency',
    type: 'checkbox',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Normal', value: 'normal' },
      { label: 'High', value: 'high' },
      { label: 'Critical', value: 'critical' },
    ],
  },
];

export const MyTicketsPage: FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

  const { tickets, total, loading, error, refetch } = useTickets({ ownerId: '@me', page, pageSize: 25, search, ...filterValues });
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleNavigate = (id: string) => {
    window.location.hash = `#/tickets/${id}`;
  };

  const handleFilterChange = (groupId: string, value: string, checked: boolean) => {
    setFilterValues(prev => ({
      ...prev,
      [groupId]: checked ? [...(prev[groupId] || []), value] : (prev[groupId] || []).filter(v => v !== value),
    }));
    setPage(1);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>My Tickets</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search my tickets..." aria-label="Search my tickets" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          <Filter groups={filterGroups} values={filterValues} onChange={handleFilterChange} onClear={() => setFilterValues({})} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div>
              <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
            </div>
          ) : error ? (
            <ErrorState title="Failed to load tickets" message={error} onRetry={refetch} />
          ) : tickets.length === 0 ? (
            <EmptyState title="No tickets assigned" description="You have no tickets assigned to you." />
          ) : (
            <TicketList
              tickets={tickets}
              loading={false}
              error={null}
              onRetry={refetch}
              onTicketClick={handleNavigate}
              selectedIds={[]}
              onToggleSelect={() => {}}
            />
          )}
          {totalPages > 1 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
