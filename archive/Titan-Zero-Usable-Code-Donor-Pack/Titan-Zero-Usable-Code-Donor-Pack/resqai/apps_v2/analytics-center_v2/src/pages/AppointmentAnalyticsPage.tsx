import { useState } from 'react';
import { Card, Table, Filter, Skeleton, ErrorState, EmptyState } from '../../../../shared/src/components';
import type { TableColumn, FilterGroup } from '../../../../shared/src/components';
import type { AppointmentMetricsDTO } from '../models/dto';
import { useMetrics } from '../hooks';
import { analyticsService } from '../services';

const filterGroups: FilterGroup[] = [
  { id: 'status', label: 'Status', options: [{ label: 'Scheduled', value: 'scheduled' }, { label: 'Completed', value: 'completed' }, { label: 'No Show', value: 'noshow' }, { label: 'Cancelled', value: 'cancelled' }] },
  { id: 'type', label: 'Type', options: [{ label: 'Installation', value: 'installation' }, { label: 'Repair', value: 'repair' }, { label: 'Maintenance', value: 'maintenance' }, { label: 'Consultation', value: 'consultation' }] },
];

export function AppointmentAnalyticsPage() {
  const { data, loading, error, refetch } = useMetrics<AppointmentMetricsDTO>(() => analyticsService.getAppointmentMetrics());
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

  const columns: TableColumn[] = [
    { key: 'status', header: 'Status' },
    { key: 'count', header: 'Count', align: 'right' },
  ];

  if (error) {
    return <ErrorState title="Appointment Analytics Error" message={error} onRetry={refetch} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Skeleton variant="text" width={240} height={28} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" height={100} />)}
        </div>
        <Skeleton variant="rectangular" height={300} />
      </div>
    );
  }

  if (!data) {
    return <EmptyState title="No Appointment Data" description="Appointment analytics data is not available yet" />;
  }

  const statusData = data.appointmentsByStatus.map((s, i) => ({ id: i, ...s }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Appointment Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Total Bookings</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{data.totalBookings}</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Completion Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{(data.completionRate * 100).toFixed(1)}%</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>No-Show Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{(data.noShowRate * 100).toFixed(1)}%</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Avg Duration</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{data.avgDuration}min</div>
        </Card>
      </div>

      <Filter groups={filterGroups} values={filterValues} onChange={(g: string, v: string, c: boolean) => setFilterValues((prev) => ({ ...prev, [g]: c ? [...(prev[g] || []), v] : (prev[g] || []).filter((x) => x !== v) }))} onClear={() => setFilterValues({})} />

      <Card padding="none" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #243049', fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Appointments by Status</div>
        {statusData.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6b7a95' }}>No appointment data available</div>
        ) : (
          <Table columns={columns} data={statusData} />
        )}
      </Card>
    </div>
  );
}
