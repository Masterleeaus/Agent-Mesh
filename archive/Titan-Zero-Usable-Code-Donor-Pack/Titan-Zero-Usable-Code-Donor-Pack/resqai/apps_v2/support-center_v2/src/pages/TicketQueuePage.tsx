import { useState, type FC } from 'react';
import { Card, Filter, SearchBar, Pagination, Button, Skeleton, EmptyState } from '@resqai/foundation';
import { TicketList, BulkActionBar, KanbanView } from '../components';
import { useTickets } from '../hooks/useTickets';
import { useAppContext } from '../state/AppContext';
import { PermissionGuard } from '../components/PermissionGuard';
import { SUPPORT_CENTER_PERMISSIONS } from '../contracts/permissions';
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
      { label: 'Escalated', value: 'escalated' },
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
  {
    id: 'requestType',
    label: 'Type',
    type: 'checkbox',
    options: [
      { label: 'Question', value: 'question' },
      { label: 'Problem', value: 'problem' },
      { label: 'Feature', value: 'feature_request' },
      { label: 'Billing', value: 'billing' },
      { label: 'Other', value: 'other' },
    ],
  },
  {
    id: 'channel',
    label: 'Channel',
    type: 'checkbox',
    options: [
      { label: 'Phone', value: 'phone' },
      { label: 'Email', value: 'email' },
      { label: 'Chat', value: 'chat' },
      { label: 'Portal', value: 'portal' },
    ],
  },
];

export const TicketQueuePage: FC = () => {
  const { selectedTicketIds, toggleTicketSelection, clearSelection, viewMode, setViewMode } = useAppContext();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

  const filterParams: Record<string, unknown> = { page, pageSize: 25, search };
  Object.entries(filterValues).forEach(([key, vals]) => {
    if (vals.length > 0) filterParams[key] = vals;
  });

  const { tickets, total, loading, error, refetch } = useTickets(filterParams as Parameters<typeof useTickets>[0]);

  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleNavigate = (id: string) => {
    window.location.hash = `#/tickets/${id}`;
  };

  const handleFilterChange = (groupId: string, value: string, checked: boolean) => {
    setFilterValues(prev => {
      const current = prev[groupId] || [];
      return {
        ...prev,
        [groupId]: checked ? [...current, value] : current.filter(v => v !== value),
      };
    });
    setPage(1);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Ticket Queue</h1>
        <PermissionGuard permission={SUPPORT_CENTER_PERMISSIONS.CREATE_TICKET}>
          <Button onClick={() => { window.location.hash = '#/tickets/new'; }} aria-label="Create new ticket">+ New Ticket</Button>
        </PermissionGuard>
      </div>

      <BulkActionBar
        selectedCount={selectedTicketIds.length}
        onAssign={() => {}}
        onEscalate={() => {}}
        onClose={() => {}}
        onClear={clearSelection}
      />

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search tickets by subject, customer, or message..." aria-label="Search tickets" />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button size="sm" variant={viewMode === 'table' ? 'primary' : 'ghost'} onClick={() => setViewMode('table')} aria-label="Table view">Table</Button>
            <Button size="sm" variant={viewMode === 'kanban' ? 'primary' : 'ghost'} onClick={() => setViewMode('kanban')} aria-label="Kanban view">Kanban</Button>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <Card variant="bordered" role="region" aria-label="Filters">
            <Filter
              groups={filterGroups}
              values={filterValues}
              onChange={handleFilterChange}
              onClear={() => setFilterValues({})}
            />
          </Card>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading && viewMode === 'table' && (
            <div role="status" aria-label="Loading tickets">
              <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
            </div>
          )}
          {!loading && viewMode === 'table' && (
            <TicketList
              tickets={tickets}
              loading={false}
              error={error}
              onRetry={refetch}
              onTicketClick={handleNavigate}
              selectedIds={selectedTicketIds}
              onToggleSelect={toggleTicketSelection}
            />
          )}
          {viewMode === 'kanban' && (
            <KanbanView
              tickets={tickets}
              loading={loading}
              onTicketClick={handleNavigate}
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
