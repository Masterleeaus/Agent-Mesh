import { type FC } from 'react';
import { Card, StatusBadge, ProgressIndicator, Table, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import type { TableColumn } from '@resqai/foundation';
import { useSLAMetrics } from '../hooks/useSLAMetrics';
import type { AgentSLAMetricVM } from '../models/view-models';

const agentColumns: TableColumn<AgentSLAMetricVM>[] = [
  { key: 'agentName', header: 'Agent' },
  { key: 'totalTickets', header: 'Total' },
  { key: 'breached', header: 'Breached' },
  { key: 'compliancePercent', header: 'Compliance' },
];

export const SLADashboardPage: FC = () => {
  const { metrics, loading, error, refetch } = useSLAMetrics();

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>SLA Dashboard</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="card" height={120} />)}
        </div>
        <Skeleton variant="rectangular" height={200} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>SLA Dashboard</h1>
        <ErrorState title="Failed to load SLA metrics" message={error} onRetry={refetch} />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>SLA Dashboard</h1>
        <EmptyState title="No SLA data" description="SLA metrics are not available yet." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>SLA Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }} role="region" aria-label="SLA summary cards">
        <Card variant="elevated" aria-label="SLA compliance rate">
          <div style={{ textAlign: 'center', padding: 16 }}>
            <ProgressIndicator value={metrics.compliancePercent} variant="circular" size="lg" color={metrics.compliancePercent >= 90 ? 'success' : metrics.compliancePercent >= 75 ? 'warning' : 'error'} showLabel />
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#8b9bb5' }}>SLA Compliance</p>
          </div>
        </Card>

        <Card variant="elevated" aria-label="Breached SLA count">
          <div style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#f87171' }}>{metrics.breached}</div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8b9bb5' }}>Breached SLA</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7b95' }}>out of {metrics.total} total</p>
          </div>
        </Card>

        <Card variant="elevated" aria-label="Within SLA count">
          <div style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#4ade80' }}>{metrics.total - metrics.breached}</div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8b9bb5' }}>Within SLA</p>
            <StatusBadge variant={metrics.compliancePercent >= 90 ? 'success' : 'warning'}>
              {metrics.compliancePercent.toFixed(1)}% compliant
            </StatusBadge>
          </div>
        </Card>
      </div>

      <Card variant="bordered" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#e6ecf5' }}>Agent SLA Performance</h3>
        <Table columns={agentColumns} data={metrics.byAgent} />
      </Card>

      <Card variant="bordered">
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#e6ecf5' }}>Avg Response Time by Channel</h3>
        {Object.keys(metrics.avgResponseTimeByChannel).length === 0 ? (
          <EmptyState title="No data" description="Response time data unavailable." size="sm" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(metrics.avgResponseTimeByChannel).map(([channel, time]) => (
              <div key={channel} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0b1220', borderRadius: 6 }}>
                <span style={{ fontSize: 13, color: '#c8d0dc', textTransform: 'capitalize' }}>{channel}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e6ecf5' }}>{(time / 60).toFixed(0)} min</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
