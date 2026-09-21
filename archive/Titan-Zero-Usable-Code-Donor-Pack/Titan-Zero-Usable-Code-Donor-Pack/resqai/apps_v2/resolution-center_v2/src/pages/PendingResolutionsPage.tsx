import { useState, type FC } from 'react';
import { Card, SearchBar, Filter, Pagination, Button, Skeleton, EmptyState, ErrorState, StatusBadge } from '@resqai/foundation';
import type { FilterGroup } from '@resqai/foundation';
import { useResolutions } from '../hooks/useResolutions';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

const filterGroups: FilterGroup[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'checkbox',
    options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Pending Approval', value: 'pending_approval' },
      { label: 'In Review', value: 'in_review' },
    ],
  },
];

export const PendingResolutionsPage: FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

  const filterParams: Record<string, unknown> = { page, pageSize: 25, search };
  Object.entries(filterValues).forEach(([key, vals]) => { if (vals.length > 0) filterParams[key] = vals; });

  const { resolutions, total, loading, error, refetch } = useResolutions(filterParams as Parameters<typeof useResolutions>[0]);
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleNavigate = (caseId: string) => { window.location.hash = `#/disputes/${caseId}`; };

  const handleFilterChange = (groupId: string, value: string, checked: boolean) => {
    setFilterValues(prev => {
      const current = prev[groupId] || [];
      return { ...prev, [groupId]: checked ? [...current, value] : current.filter(v => v !== value) };
    });
    setPage(1);
  };

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_PENDING}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Pending Resolutions</h1>
        </div>
        <Card variant="bordered" style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search pending resolutions..." aria-label="Search resolutions" />
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
            {error && <ErrorState title="Failed to load" message={error} onRetry={refetch} />}
            {!loading && !error && resolutions.length === 0 && <EmptyState title="No pending resolutions" description="All resolutions have been processed." />}
            {!loading && !error && resolutions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {resolutions.map(r => (
                  <Card key={r.id} variant="bordered" style={{ padding: 12, cursor: 'pointer' }} onClick={() => handleNavigate(r.caseId)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>{r.type.replace(/_/g, ' ')} — {r.id}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8b9bb5' }}>Created by {r.createdByName} | Case: {r.caseId}</p>
                      </div>
                      <StatusBadge variant={r.status === 'pending_approval' ? 'warning' : 'info'}>
                        {r.status.replace(/_/g, ' ')}
                      </StatusBadge>
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
