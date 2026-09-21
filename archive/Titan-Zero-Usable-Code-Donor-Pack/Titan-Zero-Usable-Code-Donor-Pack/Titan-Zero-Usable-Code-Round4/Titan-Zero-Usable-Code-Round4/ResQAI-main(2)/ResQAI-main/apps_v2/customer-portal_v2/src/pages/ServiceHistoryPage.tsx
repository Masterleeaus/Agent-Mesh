import { useState } from 'react';
import { useServiceHistory } from '../hooks/useServiceHistory';
import { Card, StatusBadge, Table, Skeleton, EmptyState, ErrorState, Pagination, Button } from '../../../shared/src/components';
import { AppointmentStatus } from '../models/dto';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [AppointmentStatus.Completed]: 'success',
  [AppointmentStatus.Cancelled]: 'error',
  [AppointmentStatus.NoShow]: 'error',
  [AppointmentStatus.InProgress]: 'warning',
  [AppointmentStatus.Scheduled]: 'info',
  [AppointmentStatus.Confirmed]: 'info',
};

export function ServiceHistoryPage() {
  const [page, setPage] = useState(1);
  const { data, total, loading, error } = useServiceHistory(page);

  if (error) {
    return <ErrorState title="Failed to load service history" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  const columns = [
    { key: 'serviceType', header: 'Service', width: 'auto' },
    { key: 'scheduledDate', header: 'Date', width: '120px', render: (_: unknown, row: Record<string, unknown>) => new Date(String(row.scheduledDate)).toLocaleDateString() },
    { key: 'technicianName', header: 'Technician', width: '140px' },
    { key: 'status', header: 'Status', width: '120px', render: (_: unknown, row: Record<string, unknown>) => (
      <StatusBadge variant={statusVariant[String(row.status)] ?? 'neutral'}>{String(row.status).replace(/_/g, ' ')}</StatusBadge>
    )},
    { key: 'completedAt', header: 'Completed', width: '120px', render: (_: unknown, row: Record<string, unknown>) => row.completedAt ? new Date(String(row.completedAt)).toLocaleDateString() : '-' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Service History</h1>

      <Card padding="md">
        {loading ? (
          <Skeleton variant="table" />
        ) : data.length === 0 ? (
          <EmptyState title="No service history" description="We don't have any past service records for your account."
            action={<Button variant="primary" onClick={() => { window.location.hash = '/appointments/book'; }}>Book an Appointment</Button>} />
        ) : (
          <Table
            columns={columns}
            data={data.map((s) => ({ ...s, id: s.id }))}
            onRowClick={(row: Record<string, unknown>) => { window.location.hash = `/appointments/${row.appointmentId || row.id}`; }}
          />
        )}
      </Card>

      {total > 10 && (
        <Pagination currentPage={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
      )}
    </div>
  );
}