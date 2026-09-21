import { useState } from 'react';
import { Card, Tabs, Skeleton, ErrorState } from '../../../../shared/src/components';
import type { Tab } from '../../../../shared/src/components';
import { KpiDashboardGrid, TimeSeriesChart, DataExportButton, DateRangeNavigator, DataFreshnessIndicator } from '../components';
import { useExecutiveDashboard } from '../hooks';
import type { DateRangePreset, ExportFormat } from '../models/dto';
import type { KpiCardVM, TimeSeriesDataPointVM } from '../models/view-models';

export function ExecutiveDashboardPage() {
  const { data, loading, error, refetch } = useExecutiveDashboard();
  const [dateRange, setDateRange] = useState<DateRangePreset>('last30Days' as DateRangePreset);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'trends', label: 'Trends' },
    { id: 'comparison', label: 'Comparison' },
  ];

  const kpiCards: KpiCardVM[] = data
    ? [
        { id: 'tickets', label: 'Total Tickets', value: data.totalTickets.toLocaleString(), trend: { value: data.totalTickets, previousValue: data.totalTickets - data.ticketChange, percentChange: data.ticketChange, direction: data.ticketChange >= 0 ? 'up' : 'down' } },
        { id: 'appointments', label: 'Appointments', value: data.totalAppointments.toLocaleString(), trend: { value: data.totalAppointments, previousValue: data.totalAppointments - data.appointmentChange, percentChange: data.appointmentChange, direction: data.appointmentChange >= 0 ? 'up' : 'down' } },
        { id: 'disputes', label: 'Active Disputes', value: data.activeDisputes.toLocaleString(), trend: { value: data.activeDisputes, previousValue: data.activeDisputes - data.disputeChange, percentChange: data.disputeChange, direction: data.disputeChange >= 0 ? 'up' : 'down' } },
        { id: 'accounts', label: 'Accounts at Risk', value: data.accountsAtRisk.toLocaleString(), trend: { value: data.accountsAtRisk, previousValue: data.accountsAtRisk - data.accountRiskChange, percentChange: data.accountRiskChange, direction: data.accountRiskChange >= 0 ? 'up' : 'down' } },
        { id: 'resolution', label: 'Avg Resolution Time', value: `${data.avgResolutionTime}h`, trend: { value: data.avgResolutionTime, previousValue: data.avgResolutionTime, percentChange: 0, direction: 'flat' } },
        { id: 'completion', label: 'Completion Rate', value: `${(data.completionRate * 100).toFixed(1)}%`, trend: { value: data.completionRate * 100, previousValue: data.completionRate * 100, percentChange: 0, direction: 'flat' } },
        { id: 'noshow', label: 'No-Show Rate', value: `${(data.noShowRate * 100).toFixed(1)}%`, trend: { value: data.noShowRate * 100, previousValue: data.noShowRate * 100, percentChange: 0, direction: 'flat' } },
        { id: 'healthy', label: 'Healthy Accounts', value: data.healthyAccounts.toLocaleString(), trend: { value: data.healthyAccounts, previousValue: data.healthyAccounts, percentChange: 0, direction: 'flat' } },
      ]
    : [];

  const chartData: TimeSeriesDataPointVM[] = [
    { date: '2025-01', value: 120, secondaryValue: 90 },
    { date: '2025-02', value: 145, secondaryValue: 110 },
    { date: '2025-03', value: 132, secondaryValue: 105 },
    { date: '2025-04', value: 158, secondaryValue: 130 },
    { date: '2025-05', value: 172, secondaryValue: 148 },
    { date: '2025-06', value: 165, secondaryValue: 140 },
  ];

  if (error) {
    return <ErrorState title="Dashboard Error" message={error} onRetry={refetch} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={240} height={28} />
          <Skeleton variant="rectangular" width={160} height={32} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} variant="card" height={120} />)}
        </div>
        <Skeleton variant="rectangular" height={240} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Executive Dashboard</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <DataFreshnessIndicator lastUpdated={data?.lastUpdated ?? null} />
          <DateRangeNavigator value={dateRange} onChange={setDateRange} />
          <DataExportButton onExport={(fmt: ExportFormat) => console.log('Export', fmt)} />
        </div>
      </div>

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} variant="underline" />

      {activeTab === 'overview' && (
        <>
          <KpiDashboardGrid metrics={kpiCards} columns={4} />
          <TimeSeriesChart data={chartData} title="Tickets vs Appointments Trend" height={200} />
        </>
      )}

      {activeTab === 'trends' && (
        <TimeSeriesChart data={chartData} title="Trend Analysis" height={300} />
      )}

      {activeTab === 'comparison' && (
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 8 }}>Period Comparison</div>
          <div style={{ color: '#8b9bb5', fontSize: 13 }}>Select two date ranges to compare performance across all domains.</div>
        </Card>
      )}
    </div>
  );
}
