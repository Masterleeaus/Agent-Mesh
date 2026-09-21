import { useAuditAnalytics } from '../hooks/useAuditAnalytics';
import { KpiDashboardGrid, BarChart, TimeSeriesChart, DataFreshnessIndicator } from '../components';
import { ErrorState, Card, Table as SharedTable } from '../../../../shared/src/components';
import type { KpiCardVM, BarChartDataVM, TimeSeriesDataPointVM } from '../models/view-models';

export function AuditAnalyticsPage() {
  const { data, loading, error, refetch } = useAuditAnalytics();

  if (error) return <ErrorState title="Failed to load" message={error} onRetry={refetch} />;

  const kpiCards: KpiCardVM[] = data ? [
    { id: 'total-actions', label: 'Total Actions', value: String(data.totalActions), trend: { value: data.totalActions, previousValue: 1680, percentChange: 9.6, direction: 'up' } },
    { id: 'unique-users', label: 'Unique Users', value: String(data.uniqueUsers), trend: { value: data.uniqueUsers, previousValue: 25, percentChange: 12.0, direction: 'up' } },
    { id: 'avg-daily', label: 'Avg Daily Actions', value: String(Math.round(data.totalActions / 30)), trend: { value: Math.round(data.totalActions / 30), previousValue: 56, percentChange: 9.5, direction: 'up' } },
  ] : [];

  const actionBars: BarChartDataVM[] = (data?.actionsByType || []).map((a, i) => ({
    label: a.action, value: a.count, color: ['#41d1c4', '#7c3aed', '#f59e0b', '#22c55e', '#ef4444', '#8b9bb5'][i],
  }));

  const trendData: TimeSeriesDataPointVM[] = (data?.trendData || []).map((td) => ({
    date: td.date, value: td.actions,
  }));

  const actionColumns = [
    { key: 'userName', label: 'User', width: '18%' },
    { key: 'action', label: 'Action', width: '18%' },
    { key: 'resource', label: 'Resource', width: '22%' },
    { key: 'details', label: 'Details', width: '22%' },
    { key: 'timestamp', label: 'Time', width: '20%' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Audit Analytics</h1>
        <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
      </div>

      <KpiDashboardGrid metrics={kpiCards} loading={loading} columns={3} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <BarChart data={actionBars} title="Actions by Type" loading={loading} height={250} />
        <TimeSeriesChart data={trendData} title="Action Trend" loading={loading} height={250} />
      </div>

      <div style={{ marginTop: 16 }}>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>Recent Actions</div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
                  <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
                  <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
                  <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : (
            <SharedTable
              columns={actionColumns}
              rows={(data?.recentActions || []).map((a) => ({
                userName: a.userName, action: a.action, resource: a.resource,
                details: a.details, timestamp: new Date(a.timestamp).toLocaleString(),
              }))}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
