import { useTrendAnalysis } from '../hooks/useTrendAnalysis';
import { AreaChart, BarChart, KpiDashboardGrid, DataFreshnessIndicator, ComparePeriodsForm } from '../components';
import { ErrorState, Card } from '../../../../shared/src/components';
import type { KpiCardVM, BarChartDataVM } from '../models/view-models';

export function TrendAnalysisPage() {
  const { data, loading, error, refetch } = useTrendAnalysis();

  if (error) return <ErrorState title="Failed to load" message={error} onRetry={refetch} />;

  const kpiCards: KpiCardVM[] = data ? data.series.map((s, i) => ({
    id: `trend-${i}`, label: s.label,
    value: s.change > 0 ? `+${s.change.toFixed(1)}%` : `${s.change.toFixed(1)}%`,
    trend: { value: s.dataPoints[s.dataPoints.length - 1]?.value || 0, previousValue: s.dataPoints[0]?.value || 0, percentChange: s.change, direction: s.change >= 0 ? 'up' : 'down' as const },
  })) : [];

  const correlationData: BarChartDataVM[] = (data?.correlations || []).map((c, i) => ({
    label: `${c.metricA} vs ${c.metricB}`, value: Math.round(c.coefficient * 100),
    color: c.coefficient > 0.7 ? '#22c55e' : c.coefficient > 0.4 ? '#f59e0b' : '#8b9bb5',
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Trend Analysis</h1>
        <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
      </div>

      <KpiDashboardGrid metrics={kpiCards} loading={loading} columns={4} />

      <div style={{ marginTop: 16 }}>
        <ComparePeriodsForm onCompare={(a, b) => {}} loading={false} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        {(data?.series || []).slice(0, 4).map((s, i) => (
          <AreaChart
            key={i}
            data={s.dataPoints.map((dp) => ({ date: dp.date, value: dp.value }))}
            title={s.label}
            height={200}
            color={['#41d1c4', '#7c3aed', '#f59e0b', '#22c55e'][i]}
            loading={loading}
          />
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <BarChart data={correlationData} title="Metric Correlations" loading={loading} height={200} />
      </div>

      <div style={{ marginTop: 16 }}>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>Date Range</div>
          <div style={{ color: '#8b9bb5', fontSize: 13 }}>
            {data?.dateRange.start} to {data?.dateRange.end} &middot; Granularity: {data?.granularity}
          </div>
        </Card>
      </div>
    </div>
  );
}
