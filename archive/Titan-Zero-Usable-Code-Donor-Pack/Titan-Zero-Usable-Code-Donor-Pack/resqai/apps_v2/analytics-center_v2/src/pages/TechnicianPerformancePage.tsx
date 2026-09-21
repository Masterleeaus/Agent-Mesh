import { useTechnicianPerformance } from '../hooks/useTechnicianPerformance';
import { KpiDashboardGrid, BarChart, TimeSeriesChart, TechnicianRankingsTable, Leaderboard, DataFreshnessIndicator } from '../components';
import { Tabs, ErrorState, EmptyState } from '../../../../shared/src/components';
import type { KpiCardVM, LeaderboardEntryVM, BarChartDataVM, TimeSeriesDataPointVM } from '../models/view-models';

export function TechnicianPerformancePage() {
  const { data, loading, error, refetch } = useTechnicianPerformance();

  if (error) return <ErrorState title="Failed to load" message={error} onRetry={refetch} />;

  const kpiCards: KpiCardVM[] = data?.length ? [
    { id: 'total-techs', label: 'Active Technicians', value: String(data.length), trend: { value: data.length, previousValue: 4, percentChange: 25, direction: 'up' } },
    { id: 'avg-completion', label: 'Avg Completion Rate', value: `${(data.reduce((s, t) => s + t.completionRate, 0) / data.length).toFixed(1)}%`, trend: { value: 90, previousValue: 87, percentChange: 3.4, direction: 'up' } },
    { id: 'avg-csat', label: 'Avg Customer Satisfaction', value: `${(data.reduce((s, t) => s + t.customerSatisfaction, 0) / data.length).toFixed(1)}`, trend: { value: 4.6, previousValue: 4.5, percentChange: 2.2, direction: 'up' } },
    { id: 'total-appts', label: 'Total Appointments', value: String(data.reduce((s, t) => s + t.appointmentsCompleted, 0)), trend: { value: 617, previousValue: 580, percentChange: 6.4, direction: 'up' } },
  ] : [];

  const leaderboard: LeaderboardEntryVM[] = (data || []).map((t, i) => ({
    rank: i + 1, name: t.technicianName, value: t.productivityScore, change: 3, trend: i < 3 ? 'up' : 'flat',
  }));

  const chartData: BarChartDataVM[] = (data || []).map((t) => ({
    label: t.technicianName.split(' ')[0], value: t.productivityScore, color: '#41d1c4',
  }));

  const trendPoints: TimeSeriesDataPointVM[] = data?.[0]?.trendData.map((td) => ({
    date: td.date, value: td.completed, label: td.date,
  })) || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Technician Performance</h1>
        <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
      </div>

      <KpiDashboardGrid metrics={kpiCards} loading={loading} columns={4} />

      <div style={{ marginTop: 24 }}>
        <Tabs
          tabs={[
            { id: 'rankings', label: 'Rankings' },
            { id: 'productivity', label: 'Productivity Chart' },
            { id: 'trend', label: 'Trend' },
          ]}
          activeTab="rankings"
          onChange={() => {}}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <TechnicianRankingsTable
          rows={(data || []).map((t, i) => ({
            rank: i + 1, name: t.technicianName, appointments: t.appointmentsCompleted,
            completionRate: `${t.completionRate}%`, satisfaction: t.customerSatisfaction,
            productivity: t.productivityScore,
          }))}
          loading={loading}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <BarChart data={chartData} title="Productivity Scores" loading={loading} height={250} />
        <Leaderboard entries={leaderboard} title="Top Technicians" loading={loading} maxEntries={5} />
      </div>

      <div style={{ marginTop: 16 }}>
        <TimeSeriesChart data={trendPoints} title="Top Technician Trend (Appointments Completed)" loading={loading} height={200} />
      </div>
    </div>
  );
}
