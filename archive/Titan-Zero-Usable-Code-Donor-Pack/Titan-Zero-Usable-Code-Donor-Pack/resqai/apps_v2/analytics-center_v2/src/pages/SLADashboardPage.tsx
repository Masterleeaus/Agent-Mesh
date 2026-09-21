import { useSLAMetrics } from '../hooks/useSLAMetrics';
import { KpiDashboardGrid, BarChart, TimeSeriesChart, SLAReportsTable, DataFreshnessIndicator } from '../components';
import { ErrorState } from '../../../../shared/src/components';
import type { KpiCardVM, BarChartDataVM, TimeSeriesDataPointVM } from '../models/view-models';

export function SLADashboardPage() {
  const { data, loading, error, refetch } = useSLAMetrics();

  if (error) return <ErrorState title="Failed to load" message={error} onRetry={refetch} />;

  const kpiCards: KpiCardVM[] = data ? [
    { id: 'overall', label: 'Overall SLA', value: `${data.overallCompliance}%`, trend: { value: data.overallCompliance, previousValue: 92.5, percentChange: 1.4, direction: 'up' } },
    { id: 'support-sla', label: 'Support SLA', value: `${data.supportSLA}%`, trend: { value: data.supportSLA, previousValue: 93.8, percentChange: 0.5, direction: 'up' } },
    { id: 'ops-sla', label: 'Operations SLA', value: `${data.operationsSLA}%`, trend: { value: data.operationsSLA, previousValue: 91.0, percentChange: 1.2, direction: 'up' } },
    { id: 'appt-sla', label: 'Appointment SLA', value: `${data.appointmentSLA}%`, trend: { value: data.appointmentSLA, previousValue: 95.8, percentChange: 0.7, direction: 'up' } },
    { id: 'res-sla', label: 'Resolution SLA', value: `${data.resolutionSLA}%`, trend: { value: data.resolutionSLA, previousValue: 89.5, percentChange: 0.8, direction: 'up' } },
    { id: 'breaches', label: 'SLA Breaches', value: String(data.breaches), trend: { value: data.breaches, previousValue: 22, percentChange: 9.1, direction: 'up' } },
  ] : [];

  const complianceBars: BarChartDataVM[] = (data?.complianceByDomain || []).map((d, i) => ({
    label: d.domain, value: d.compliance,
    color: d.compliance >= d.target ? '#22c55e' : d.compliance >= d.target * 0.95 ? '#f59e0b' : '#ef4444',
  }));

  const breachTrend: TimeSeriesDataPointVM[] = (data?.breachTrend || []).map((bt) => ({
    date: bt.date, value: bt.breaches,
  }));

  const slaRows = (data?.complianceByDomain || []).map((d) => ({
    domain: d.domain, target: `${d.target}%`, actual: `${d.compliance}%`,
    status: d.compliance >= d.target ? 'Compliant' : d.compliance >= d.target * 0.95 ? 'Warning' : 'Breached',
    breaches: data?.breaches || 0,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>SLA Dashboard</h1>
        <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
      </div>

      <KpiDashboardGrid metrics={kpiCards} loading={loading} columns={3} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <BarChart data={complianceBars} title="SLA Compliance by Domain" loading={loading} height={250} />
        <TimeSeriesChart data={breachTrend} title="SLA Breach Trend" loading={loading} height={250} />
      </div>

      <div style={{ marginTop: 16 }}>
        <SLAReportsTable rows={slaRows} title="SLA Details" loading={loading} />
      </div>
    </div>
  );
}
