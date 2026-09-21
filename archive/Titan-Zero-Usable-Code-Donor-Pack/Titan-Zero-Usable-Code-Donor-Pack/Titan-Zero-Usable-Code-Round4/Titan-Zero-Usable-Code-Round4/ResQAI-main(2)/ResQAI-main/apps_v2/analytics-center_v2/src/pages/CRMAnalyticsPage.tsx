import { useCRMAnalytics } from '../hooks/useCRMAnalytics';
import { KpiDashboardGrid, BarChart, TimeSeriesChart, PieChart, DataFreshnessIndicator } from '../components';
import { ErrorState } from '../../../../shared/src/components';
import type { KpiCardVM, BarChartDataVM, TimeSeriesDataPointVM, PieChartSliceVM } from '../models/view-models';

export function CRMAnalyticsPage() {
  const { data, loading, error, refetch } = useCRMAnalytics();

  if (error) return <ErrorState title="Failed to load" message={error} onRetry={refetch} />;

  const kpiCards: KpiCardVM[] = data ? [
    { id: 'total-accts', label: 'Total Accounts', value: String(data.totalAccounts), trend: { value: data.totalAccounts, previousValue: 422, percentChange: 4.3, direction: 'up' } },
    { id: 'new-accts', label: 'New Accounts', value: String(data.newAccounts), trend: { value: data.newAccounts, previousValue: 14, percentChange: 28.6, direction: 'up' } },
    { id: 'active-deals', label: 'Active Deals', value: String(data.activeDeals), trend: { value: data.activeDeals, previousValue: 48, percentChange: 8.3, direction: 'up' } },
    { id: 'deal-value', label: 'Pipeline Value', value: `$${(data.dealValue / 1000000).toFixed(1)}M`, trend: { value: data.dealValue, previousValue: 2500000, percentChange: 13.6, direction: 'up' } },
    { id: 'conversion', label: 'Conversion Rate', value: `${data.conversionRate}%`, trend: { value: data.conversionRate, previousValue: 36.2, percentChange: 6.4, direction: 'up' } },
    { id: 'engagement', label: 'Engagement Rate', value: `${data.engagementRate}%`, trend: { value: data.engagementRate, previousValue: 68.5, percentChange: 5.3, direction: 'up' } },
  ] : [];

  const tierBars: BarChartDataVM[] = (data?.accountsByTier || []).map((t, i) => ({
    label: t.tier, value: t.count, color: ['#41d1c4', '#7c3aed', '#f59e0b', '#22c55e'][i],
  }));

  const pipelinePie: PieChartSliceVM[] = (data?.pipelineByStage || []).map((p, i) => ({
    label: p.stage, value: p.count, percentage: (p.count / (data?.activeDeals || 1)) * 100,
    color: ['#41d1c4', '#7c3aed', '#f59e0b', '#22c55e'][i],
  }));

  const trend: TimeSeriesDataPointVM[] = (data?.trendData || []).map((td) => ({
    date: td.date, value: td.accounts, secondaryValue: td.deals,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>CRM Analytics</h1>
        <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
      </div>

      <KpiDashboardGrid metrics={kpiCards} loading={loading} columns={3} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <BarChart data={tierBars} title="Accounts by Tier" loading={loading} height={250} />
        <PieChart data={pipelinePie} title="Pipeline by Stage" loading={loading} size={200} />
      </div>

      <div style={{ marginTop: 16 }}>
        <TimeSeriesChart data={trend} title="Accounts & Deals Trend" loading={loading} height={200} />
      </div>
    </div>
  );
}
