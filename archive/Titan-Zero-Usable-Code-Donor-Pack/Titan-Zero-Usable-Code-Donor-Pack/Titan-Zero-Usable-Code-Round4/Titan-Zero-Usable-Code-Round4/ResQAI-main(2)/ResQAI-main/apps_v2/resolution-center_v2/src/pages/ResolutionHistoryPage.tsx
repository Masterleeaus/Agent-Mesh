import { useState, type FC } from 'react';
import { Card, SearchBar, Filter, Pagination, Button, Skeleton, EmptyState, ErrorState, StatusBadge } from '@resqai/foundation';
import type { FilterGroup } from '@resqai/foundation';
import { useCases } from '../hooks/useCases';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

const filterGroups: FilterGroup[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'checkbox',
    options: [
      { label: 'Resolved', value: 'resolved' },
      { label: 'Closed', value: 'closed' },
    ],
  },
  {
    id: 'type',
    label: 'Type',
    type: 'checkbox',
    options: [
      { label: 'Dispute', value: 'dispute' },
      { label: 'Complaint', value: 'complaint' },
      { label: 'Escalation', value: 'escalation' },
    ],
  },
];

export const ResolutionHistoryPage: FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

  const filterParams: Record<string, unknown> = { page, pageSize: 25, search, status: ['resolved', 'closed'] };
  Object.entries(filterValues).forEach(([key, vals]) => { if (vals.length > 0) filterParams[key] = vals; });

  const { cases, total, loading, error, refetch } = useCases(filterParams as Parameters<typeof useCases>[0]);
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleNavigate = (id: string) => { window.location.hash = `#/disputes/${id}`; };

  const handleFilterChange = (groupId: string, value: string, checked: boolean) => {
    setFilterValues(prev => {
      const current = prev[groupId] || [];
      return { ...prev, [groupId]: checked ? [...current, value] : current.filter(v => v !== value) };
    });
    setPage(1);
  };

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_HISTORY}>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Resolution History</h1>
        <Card variant="bordered" style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search resolved or closed cases..." aria-label="Search history" />
        </Card>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 220, flexShrink: 0 }}>
            <Card variant="bordered" role="region" aria-label="Filters">
              <Filter groups={filterGroups} values={filterValues} onChange={handleFilterChange} onClear={() => setFilterValues({})} />
            </Card>
          </div>
          <div style={{ flex: 1 }}>
            {loading && (
              <div role="status" aria-label="Loading">
                <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
              </div>
            )}
            {error && <ErrorState title="Failed to load history" message={error} onRetry={refetch} />}
            {!loading && !error && cases.length === 0 && <EmptyState title="No history found" description="No resolved or closed cases match your criteria." />}
            {!loading && !error && cases.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cases.map(c => (
                  <Card key={c.id} variant="bordered" style={{ padding: 12, cursor: 'pointer' }} onClick={() => handleNavigate(c.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>{c.summary}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8b9bb5' }}>{c.customerName} | {c.type.replace(/_/g, ' ')}</p>
                      </div>
                      <StatusBadge variant={c.status === 'closed' ? 'success' : 'info'}>{c.status}</StatusBadge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};
