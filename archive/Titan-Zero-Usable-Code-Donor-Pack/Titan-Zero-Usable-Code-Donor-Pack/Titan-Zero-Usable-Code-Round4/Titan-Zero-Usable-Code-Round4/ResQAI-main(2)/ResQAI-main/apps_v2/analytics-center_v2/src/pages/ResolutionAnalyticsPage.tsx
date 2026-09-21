import { useResolutionAnalytics } from '../hooks/useResolutionAnalytics';
import { KpiDashboardGrid, BarChart, TimeSeriesChart, DataFreshnessIndicator } from '../components';
import { ErrorState, Table as SharedTable } from '../../../../shared/src/components';
import type { KpiCardVM, BarChartDataVM, TimeSeriesDataPointVM } from '../models/view-models';

export function ResolutionAnalyticsPage() {
  const { data, loading, error, refetch } = useResolutionAnalytics();

  if (error) return <ErrorState title="Failed to load" message={error} onRetry={refetch} />;

  const kpiCards: KpiCardVM[] = data ? [
    { id: 'total-res', label: 'Total Resolutions', value: String(data.totalResolutions), trend: { value: data.totalResolutions, previousValue: 280, percentChange: 11.4, direction: 'up' } },
    { id: 'resolved', label: 'Resolved', value: String(data.resolvedCount), trend: { value: data.resolvedCount, previousValue: 215, percentChange: 14.0, direction: 'up' } },
    { id: 'res-rate', label: 'Resolution Rate', value: `${data.resolutionRate}%`, trend: { value: data.resolutionRate, previousValue: 76.8, percentChange: 2.2, direction: 'up' } },
    { id: 'avg-days', label: 'Avg Resolution Days', value: String(data.avgResolutionDays), trend: { value: data.avgResolutionDays, previousValue: 5.2, percentChange: -7.7, direction: 'down' } },
    { id: 'escalations', label: 'Escalations', value: String(data.escalations), trend: { value: data.escalations, previousValue: 32, percentChange: -12.5, direction: 'down' } },
  ] : [];

  const typeBars: BarChartDataVM[] = (data?.resolutionsByType || []).map((t, i) => ({
    label: t.type, value: t.count, color: ['#41d1c4', '#7c3aed', '#f59e0b', '#ef4444'][i],
  }));

  const trendData: TimeSeriesDataPointVM[] = (data?.trendData || []).map((td) => ({
    date: td.date, value: td.resolved, secondaryValue: td.opened,
  }));

  const assigneeColumns = [
    { key: 'assignee', label: 'Assignee', width: '30%' },
    { key: 'resolved', label: 'Resolved', width: '25%' },
    { key: 'escalated', label: 'Escalated', width: '25%' },
    { key: 'escalationRate', label: 'Esc. Rate', width: '20%' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Resolution Analytics</h1>
        <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
      </div>

      <KpiDashboardGrid metrics={kpiCards} loading={loading} columns={5} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <BarChart data={typeBars} title="Resolutions by Type" loading={loading} height={250} />
        <TimeSeriesChart data={trendData} title="Resolution Trend (Resolved vs Opened)" loading={loading} height={250} />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ background: '#131c2f', border: '1px solid #243049', borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>Assignee Performance</div>
          {loading ? (
            <div style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />)}
            </div>
          ) : (
            <SharedTable
              columns={assigneeColumns}
              rows={(data?.resolutionsByAssignee || []).map((a) => ({
                assignee: a.assignee, resolved: a.resolved, escalated: a.escalated,
                escalationRate: `${((a.escalated / (a.resolved + a.escalated || 1)) * 100).toFixed(1)}%`,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
