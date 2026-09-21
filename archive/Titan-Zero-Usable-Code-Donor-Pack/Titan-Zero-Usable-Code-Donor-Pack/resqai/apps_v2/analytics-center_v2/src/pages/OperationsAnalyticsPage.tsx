import { useState } from 'react';
import { Card, Table, Filter, Skeleton, ErrorState, EmptyState } from '../../../../shared/src/components';
import type { TableColumn, FilterGroup } from '../../../../shared/src/components';
import type { OperationsMetricsDTO } from '../models/dto';
import { useMetrics } from '../hooks';
import { analyticsService } from '../services';

const filterGroups: FilterGroup[] = [
  { id: 'type', label: 'Task Type', options: [{ label: 'Dispatch', value: 'dispatch' }, { label: 'Maintenance', value: 'maintenance' }, { label: 'Inspection', value: 'inspection' }, { label: 'Follow-up', value: 'followup' }] },
];

export function OperationsAnalyticsPage() {
  const { data, loading, error, refetch } = useMetrics<OperationsMetricsDTO>(() => analyticsService.getOperationsMetrics());
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

  const columns: TableColumn[] = [
    { key: 'assignee', header: 'Assignee' },
    { key: 'pending', header: 'Pending', align: 'right' },
    { key: 'inProgress', header: 'In Progress', align: 'right' },
    { key: 'completed', header: 'Completed', align: 'right' },
    { key: 'total', header: 'Total', align: 'right' },
  ];

  if (error) {
    return <ErrorState title="Operations Analytics Error" message={error} onRetry={refetch} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Skeleton variant="text" width={240} height={28} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" height={100} />)}
        </div>
        <Skeleton variant="rectangular" height={300} />
      </div>
    );
  }

  if (!data) {
    return <EmptyState title="No Operations Data" description="Operations analytics data is not available yet" />;
  }

  const workloadData = data.workloadDistribution.map((w, i) => ({ id: i, ...w, total: w.pending + w.inProgress + w.completed }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Operations Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Total Tasks</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{data.totalTasks}</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Completion Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{(data.taskCompletionRate * 100).toFixed(1)}%</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Pending Dispatch</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>{data.pendingDispatch}</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Avg Duration</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{data.avgTaskDuration}h</div>
        </Card>
      </div>

      <Filter groups={filterGroups} values={filterValues} onChange={(g: string, v: string, c: boolean) => setFilterValues((prev) => ({ ...prev, [g]: c ? [...(prev[g] || []), v] : (prev[g] || []).filter((x) => x !== v) }))} onClear={() => setFilterValues({})} />

      <Card padding="none" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #243049', fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Workload Distribution</div>
        {workloadData.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6b7a95' }}>No workload data available</div>
        ) : (
          <Table columns={columns} data={workloadData} />
        )}
      </Card>
    </div>
  );
}
