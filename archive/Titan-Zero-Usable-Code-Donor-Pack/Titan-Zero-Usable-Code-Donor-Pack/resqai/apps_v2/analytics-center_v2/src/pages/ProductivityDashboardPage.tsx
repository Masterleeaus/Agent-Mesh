import { useProductivityMetrics } from '../hooks/useProductivityMetrics';
import { KpiDashboardGrid, BarChart, TimeSeriesChart, Leaderboard, DataFreshnessIndicator } from '../components';
import { ErrorState } from '../../../../shared/src/components';
import type { KpiCardVM, BarChartDataVM, TimeSeriesDataPointVM, LeaderboardEntryVM } from '../models/view-models';

export function ProductivityDashboardPage() {
  const { data, loading, error, refetch } = useProductivityMetrics();

  if (error) return <ErrorState title="Failed to load" message={error} onRetry={refetch} />;

  const kpiCards: KpiCardVM[] = data ? [
    { id: 'overall-prod', label: 'Overall Productivity', value: `${data.overallProductivity}%`, trend: { value: data.overallProductivity, previousValue: 84.2, percentChange: 2.6, direction: 'up' } },
    { id: 'ticket-tput', label: 'Ticket Throughput', value: String(data.ticketThroughput), trend: { value: data.ticketThroughput, previousValue: 40.1, percentChange: 6.0, direction: 'up' } },
    { id: 'appt-tput', label: 'Appointment Throughput', value: String(data.appointmentThroughput), trend: { value: data.appointmentThroughput, previousValue: 36.5, percentChange: 4.7, direction: 'up' } },
    { id: 'task-completion', label: 'Task Completion', value: `${data.avgTaskCompletion}%`, trend: { value: data.avgTaskCompletion, previousValue: 79.5, percentChange: 2.9, direction: 'up' } },
    { id: 'utilization', label: 'Agent Utilization', value: `${data.agentUtilization}%`, trend: { value: data.agentUtilization, previousValue: 76.2, percentChange: 3.0, direction: 'up' } },
    { id: 'res-tput', label: 'Resolution Throughput', value: String(data.resolutionThroughput), trend: { value: data.resolutionThroughput, previousValue: 7.8, percentChange: 7.7, direction: 'up' } },
  ] : [];

  const teamBars: BarChartDataVM[] = (data?.productivityByTeam || []).map((t, i) => ({
    label: t.team, value: t.score, color: t.change >= 0 ? '#22c55e' : '#ef4444',
  }));

  const throughputTrend: TimeSeriesDataPointVM[] = (data?.throughputTrend || []).map((tt) => ({
    date: tt.date, value: tt.tickets, secondaryValue: tt.appointments,
  }));

  const leaderboard: LeaderboardEntryVM[] = (data?.topPerformers || []).map((p, i) => ({
    rank: i + 1, name: p.name, value: p.score, change: 4, trend: 'up' as const,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Productivity Dashboard</h1>
        <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
      </div>

      <KpiDashboardGrid metrics={kpiCards} loading={loading} columns={3} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <BarChart data={teamBars} title="Productivity by Team" loading={loading} height={250} />
        <TimeSeriesChart data={throughputTrend} title="Throughput Trend" loading={loading} height={250} />
      </div>

      <div style={{ marginTop: 16 }}>
        <Leaderboard entries={leaderboard} title="Top Performers" loading={loading} maxEntries={5} />
      </div>
    </div>
  );
}
