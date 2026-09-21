import { useState } from 'react';
import { Card, Table, Filter, Skeleton, ErrorState, EmptyState } from '../../../../shared/src/components';
import type { TableColumn, FilterGroup } from '../../../../shared/src/components';
import type { DisputeMetricsDTO } from '../models/dto';
import { useMetrics } from '../hooks';
import { analyticsService } from '../services';

const filterGroups: FilterGroup[] = [
  { id: 'status', label: 'Status', options: [{ label: 'Open', value: 'open' }, { label: 'Under Review', value: 'review' }, { label: 'Resolved', value: 'resolved' }, { label: 'Escalated', value: 'escalated' }] },
  { id: 'reason', label: 'Reason', options: [{ label: 'Billing', value: 'billing' }, { label: 'Service', value: 'service' }, { label: 'Quality', value: 'quality' }, { label: 'Other', value: 'other' }] },
];

export function DisputeAnalyticsPage() {
  const { data, loading, error, refetch } = useMetrics<DisputeMetricsDTO>(() => analyticsService.getDisputeMetrics());
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

  const columns: TableColumn[] = [
    { key: 'status', header: 'Status' },
    { key: 'count', header: 'Count', align: 'right' },
  ];

  if (error) {
    return <ErrorState title="Dispute Analytics Error" message={error} onRetry={refetch} />;
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
    return <EmptyState title="No Dispute Data" description="Dispute analytics data is not available yet" />;
  }

  const statusData = data.disputesByStatus.map((s, i) => ({ id: i, ...s }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Dispute Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Total Disputes</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{data.totalDisputes}</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Resolution Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{(data.resolutionRate * 100).toFixed(1)}%</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Avg Resolution</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{data.avgResolutionDays}d</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Resolved</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#41d1c4' }}>{data.resolvedDisputes}</div>
        </Card>
      </div>

      <Filter groups={filterGroups} values={filterValues} onChange={(g: string, v: string, c: boolean) => setFilterValues((prev) => ({ ...prev, [g]: c ? [...(prev[g] || []), v] : (prev[g] || []).filter((x) => x !== v) }))} onClear={() => setFilterValues({})} />

      <Card padding="none" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #243049', fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Disputes by Status</div>
        {statusData.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6b7a95' }}>No dispute data available</div>
        ) : (
          <Table columns={columns} data={statusData} />
        )}
      </Card>
    </div>
  );
}
