import { useState, type FC } from 'react';
import { Card, SearchBar, Filter, Pagination, Button, Skeleton } from '@resqai/foundation';
import type { FilterGroup } from '@resqai/foundation';
import { useDisputes } from '../hooks/useDisputes';
import { DisputeListTable } from '../components/DisputeListTable';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

const filterGroups: FilterGroup[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'checkbox',
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Investigating', value: 'investigating' },
      { label: 'Pending Resolution', value: 'pending_resolution' },
      { label: 'Resolved', value: 'resolved' },
      { label: 'Escalated', value: 'escalated' },
    ],
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'checkbox',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Normal', value: 'normal' },
      { label: 'High', value: 'high' },
      { label: 'Critical', value: 'critical' },
    ],
  },
  {
    id: 'reason',
    label: 'Reason',
    type: 'checkbox',
    options: [
      { label: 'Billing', value: 'billing' },
      { label: 'Service Quality', value: 'service_quality' },
      { label: 'Damage', value: 'damage' },
      { label: 'No Show', value: 'no_show' },
      { label: 'Incomplete Work', value: 'incomplete_work' },
    ],
  },
];

export const DisputeQueuePage: FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

  const filterParams: Record<string, unknown> = { page, pageSize: 25, search };
  Object.entries(filterValues).forEach(([key, vals]) => { if (vals.length > 0) filterParams[key] = vals; });

  const { disputes, total, loading, error, refetch } = useDisputes(filterParams as Parameters<typeof useDisputes>[0]);
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
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_DISPUTES}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Dispute Queue</h1>
        </div>
        <Card variant="bordered" style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search disputes by customer or description..." aria-label="Search disputes" />
        </Card>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 220, flexShrink: 0 }}>
            <Card variant="bordered" role="region" aria-label="Filters">
              <Filter groups={filterGroups} values={filterValues} onChange={handleFilterChange} onClear={() => setFilterValues({})} />
            </Card>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <DisputeListTable
              disputes={disputes}
              loading={loading}
              error={error}
              onRetry={refetch}
              onDisputeClick={(id) => { const d = disputes.find(x => x.id === id); if (d) handleNavigate(d.caseId); }}
            />
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
