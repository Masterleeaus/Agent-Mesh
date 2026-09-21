import { useCustomerAnalytics } from '../hooks/useCustomerAnalytics';
import { KpiDashboardGrid, PieChart, TimeSeriesChart, CustomerMetricsTable, DataFreshnessIndicator } from '../components';
import { ErrorState, EmptyState } from '../../../../shared/src/components';
import type { KpiCardVM, PieChartSliceVM, TimeSeriesDataPointVM } from '../models/view-models';

export function CustomerAnalyticsPage() {
  const { data, loading, error, refetch } = useCustomerAnalytics();

  if (error) return <ErrorState title="Failed to load" message={error} onRetry={refetch} />;

  const kpiCards: KpiCardVM[] = data ? [
    { id: 'total-cust', label: 'Total Customers', value: String(data.totalCustomers), trend: { value: data.totalCustomers, previousValue: 2750, percentChange: 3.6, direction: 'up' } },
    { id: 'active-cust', label: 'Active Customers', value: String(data.activeCustomers), trend: { value: data.activeCustomers, previousValue: 2080, percentChange: 5.3, direction: 'up' } },
    { id: 'avg-csat', label: 'Avg Satisfaction', value: String(data.averageSatisfaction), trend: { value: data.averageSatisfaction, previousValue: 4.5, percentChange: 2.2, direction: 'up' } },
    { id: 'retention', label: 'Retention Rate', value: `${data.retentionRate}%`, trend: { value: data.retentionRate, previousValue: 90.2, percentChange: 1.4, direction: 'up' } },
    { id: 'churn', label: 'Churn Rate', value: `${data.churnRate}%`, trend: { value: data.churnRate, previousValue: 9.8, percentChange: -13.3, direction: 'down' } },
    { id: 'at-risk', label: 'At Risk', value: String(data.atRiskCustomers), trend: { value: data.atRiskCustomers, previousValue: 120, percentChange: 20.8, direction: 'up' } },
  ] : [];

  const segmentPie: PieChartSliceVM[] = (data?.customersBySegment || []).map((s, i) => ({
    label: s.segment, value: s.count, percentage: (s.count / (data?.totalCustomers || 1)) * 100,
    color: ['#41d1c4', '#7c3aed', '#f59e0b', '#22c55e'][i],
  }));

  const satisfactionTrend: TimeSeriesDataPointVM[] = (data?.satisfactionTrend || []).map((st) => ({
    date: st.date, value: st.score,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Customer Analytics</h1>
        <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
      </div>

      <KpiDashboardGrid metrics={kpiCards} loading={loading} columns={3} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <PieChart data={segmentPie} title="Customers by Segment" loading={loading} size={200} />
        <TimeSeriesChart data={satisfactionTrend} title="Satisfaction Trend" loading={loading} height={200} />
      </div>

      <div style={{ marginTop: 16 }}>
        <CustomerMetricsTable
          title="Customer Feedback"
          rows={(data?.topFeedback || []).map((f) => ({
            customerName: f.customerName, segment: f.sentiment === 'positive' ? 'Happy' : f.sentiment === 'neutral' ? 'Neutral' : 'At Risk',
            satisfaction: f.sentiment === 'positive' ? 4.5 : f.sentiment === 'neutral' ? 3.5 : 2.0,
            retention: f.sentiment === 'positive' ? '95%' : f.sentiment === 'neutral' ? '85%' : '60%',
            status: f.sentiment === 'positive' ? 'Healthy' : f.sentiment === 'neutral' ? 'At Risk' : 'Churned',
          }))}
          loading={loading}
        />
      </div>
    </div>
  );
}
