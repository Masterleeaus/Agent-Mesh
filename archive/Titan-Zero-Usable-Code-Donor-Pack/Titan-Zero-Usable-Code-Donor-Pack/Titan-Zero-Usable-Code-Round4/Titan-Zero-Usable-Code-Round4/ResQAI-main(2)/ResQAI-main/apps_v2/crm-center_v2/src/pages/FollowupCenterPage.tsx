import { useState } from 'react';
import { useFollowups } from '../../hooks/useFollowups';
import { Table, Filter, StatusBadge, Button, Skeleton, EmptyState, ErrorState, Pagination } from '../../../../shared/src/components';
import type { TableColumn } from '../../../../shared/src/components';
import { FollowupList } from '../../components';
import { navigate } from '../../state/AppContext';
import type { FollowupListItemVM } from '../../models/view-models';

export default function FollowupCenterPage() {
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const { data, total, loading, error, refetch } = useFollowups({ status: statusFilter.join(','), priority: priorityFilter.join(','), page, pageSize: 20 });

  if (loading && data.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton variant="rectangular" height={40} width={300} />
        <div style={{ marginTop: 16 }}><Skeleton variant="rectangular" height={300} /></div>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load followups" /></div>;
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Followup Center</h1>
        <Button variant="primary" onClick={() => navigate('/followups/new')}>New Followup</Button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Filter
          groups={[{ id: 'status', label: 'Status', type: 'checkbox', options: [
            { label: 'Open', value: 'open' }, { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' }, { label: 'Waiting', value: 'waiting' }, { label: 'Cancelled', value: 'cancelled' },
          ]}]}
          values={{ status: statusFilter }}
          onChange={(id: string, value: string, checked: boolean) => { setStatusFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value)); setPage(1); }}
          onClear={() => { setStatusFilter([]); setPage(1); }}
        />
        <Filter
          groups={[{ id: 'priority', label: 'Priority', type: 'checkbox', options: [
            { label: 'Urgent', value: 'urgent' }, { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' }, { label: 'Low', value: 'low' },
          ]}]}
          values={{ priority: priorityFilter }}
          onChange={(id: string, value: string, checked: boolean) => { setPriorityFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value)); setPage(1); }}
          onClear={() => { setPriorityFilter([]); setPage(1); }}
        />
        <Button variant="ghost" size="sm" onClick={refetch}>Refresh</Button>
      </div>
      {data.length === 0 ? (
        <EmptyState title="No followups" description="No followups match your criteria." action={<Button variant="primary" onClick={() => navigate('/followups/new')}>Create Followup</Button>} />
      ) : (
        <>
          <FollowupList data={data} loading={false} onRowClick={(row: FollowupListItemVM) => navigate(`/followups/${row.id}`)} />
          {totalPages > 1 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
