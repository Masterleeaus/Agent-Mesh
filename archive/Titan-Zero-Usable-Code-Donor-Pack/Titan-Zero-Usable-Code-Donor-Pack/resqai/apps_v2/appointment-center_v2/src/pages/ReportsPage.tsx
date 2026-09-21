import { useState } from 'react';
import { Card, Button, Input, Skeleton, EmptyState, ErrorState } from '../../../shared/src/components';
import { appointmentService } from '../services';
import type { ReportStatsVM } from '../models/view-models';

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportStatsVM | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.getReport({ dateFrom, dateTo });
      setReport(res.report);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Reports</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Appointment analytics and reporting</p>
      </div>

      <Card variant="elevated" padding="md">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20 }}>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} label="From" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} label="To" />
          <Button onClick={handleGenerate} loading={loading}>Generate Report</Button>
        </div>

        {error && <ErrorState title="Report failed" message={error} />}

        {loading && !report && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="card" height={100} />)}
          </div>
        )}

        {report && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
              Report: {report.period}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <Card variant="bordered" padding="md">
                <div style={{ fontSize: 12, color: '#64748b' }}>Total</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>{report.totalAppointments}</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div style={{ fontSize: 12, color: '#64748b' }}>Completed</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{report.completedAppointments}</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div style={{ fontSize: 12, color: '#64748b' }}>Cancelled</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{report.cancelledAppointments}</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div style={{ fontSize: 12, color: '#64748b' }}>Completion Rate</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#41d1c4' }}>{report.completionRate}%</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div style={{ fontSize: 12, color: '#64748b' }}>Avg Duration</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>{report.averageDuration}m</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div style={{ fontSize: 12, color: '#64748b' }}>On-Time Rate</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{report.onTimeRate}%</div>
              </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card variant="bordered" padding="md">
                <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>By Status</div>
                {report.byStatus.map(s => (
                  <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#e2e8f0', borderBottom: '1px solid #2a3a4e' }}>
                    <span>{s.status}</span>
                    <span style={{ fontWeight: 600 }}>{s.count}</span>
                  </div>
                ))}
              </Card>

              <Card variant="bordered" padding="md">
                <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>By Technician</div>
                {report.byTechnician.map(t => (
                  <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#e2e8f0', borderBottom: '1px solid #2a3a4e' }}>
                    <span>{t.name}</span>
                    <span style={{ fontWeight: 600 }}>{t.completed}/{t.count}</span>
                  </div>
                ))}
              </Card>
            </div>

            <Card variant="bordered" padding="md">
              <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Daily Count</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                {report.dailyCounts.map(d => (
                  <div key={d.date} style={{
                    padding: '8px', borderRadius: 6, textAlign: 'center',
                    background: '#1a2332', border: '1px solid #2a3a4e',
                  }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{d.count}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {!report && !loading && !error && (
          <EmptyState title="No report generated" description="Select a date range and click Generate Report." />
        )}
      </Card>
    </div>
  );
}
