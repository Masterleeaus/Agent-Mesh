import { useState } from 'react';
import { Card, Table, Filter, Skeleton, ErrorState, EmptyState } from '../../../../shared/src/components';
import type { TableColumn, FilterGroup } from '../../../../shared/src/components';
import type { SupportMetricsDTO } from '../models/dto';
import { useMetrics } from '../hooks';
import { analyticsService } from '../services';

const filterGroups: FilterGroup[] = [
  { id: 'status', label: 'Status', options: [{ label: 'Open', value: 'open' }, { label: 'In Progress', value: 'in_progress' }, { label: 'Resolved', value: 'resolved' }, { label: 'Closed', value: 'closed' }] },
  { id: 'priority', label: 'Priority', options: [{ label: 'Critical', value: 'critical' }, { label: 'High', value: 'high' }, { label: 'Medium', value: 'medium' }, { label: 'Low', value: 'low' }] },
];

export function SupportAnalyticsPage() {
  const { data, loading, error, refetch } = useMetrics<SupportMetricsDTO>(() => analyticsService.getSupportMetrics());
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

  const columns: TableColumn[] = [
    { key: 'agentName', header: 'Agent' },
    { key: 'ticketsAssigned', header: 'Assigned', align: 'right' },
    { key: 'ticketsResolved', header: 'Resolved', align: 'right' },
    { key: 'avgResponseTime', header: 'Avg Response', align: 'right' },
    { key: 'avgResolutionTime', header: 'Avg Resolution', align: 'right' },
    { key: 'satisfactionScore', header: 'Satisfaction', align: 'right' },
  ];

  if (error) {
    return <ErrorState title="Support Analytics Error" message={error} onRetry={refetch} />;
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
    return <EmptyState title="No Support Data" description="Support analytics data is not available yet" />;
  }

  const agentData = data.agentMetrics.map((a) => ({ id: a.agentId, ...a }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Support Analytics</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Total Tickets</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{data.totalTickets}</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>SLA Compliance</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{(data.slaComplianceRate * 100).toFixed(1)}%</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Avg Response</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{data.avgResponseTime}m</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Avg Resolution</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{data.avgResolutionTime}h</div>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <Filter groups={filterGroups} values={filterValues} onChange={(g: string, v: string, c: boolean) => setFilterValues((prev) => ({ ...prev, [g]: c ? [...(prev[g] || []), v] : (prev[g] || []).filter((x) => x !== v) }))} onClear={() => setFilterValues({})} />
      </div>

      <Card padding="none" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #243049', fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Agent Performance</div>
        {agentData.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6b7a95' }}>No agent performance data available</div>
        ) : (
          <Table columns={columns} data={agentData} />
        )}
      </Card>
    </div>
  );
}
