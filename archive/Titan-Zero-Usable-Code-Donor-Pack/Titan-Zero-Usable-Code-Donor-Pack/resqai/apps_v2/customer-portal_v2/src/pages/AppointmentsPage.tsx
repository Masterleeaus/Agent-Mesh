import { useState } from 'react';
import { useCustomerAppointments } from '../hooks/useCustomerAppointments';
import { Card, Button, StatusBadge, Filter, Table, Skeleton, EmptyState, ErrorState, Pagination } from '../../../shared/src/components';
import type { FilterGroup } from '../../../shared/src/components';
import { AppointmentStatus } from '../models/dto';

const filterGroups: FilterGroup[] = [
  { id: 'status', label: 'Status', options: [
    { value: AppointmentStatus.Scheduled, label: 'Scheduled' }, { value: AppointmentStatus.Confirmed, label: 'Confirmed' },
    { value: AppointmentStatus.Completed, label: 'Completed' }, { value: AppointmentStatus.Cancelled, label: 'Cancelled' },
  ]},
];

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [AppointmentStatus.Scheduled]: 'info',
  [AppointmentStatus.Confirmed]: 'info',
  [AppointmentStatus.InProgress]: 'warning',
  [AppointmentStatus.Completed]: 'success',
  [AppointmentStatus.Cancelled]: 'error',
  [AppointmentStatus.NoShow]: 'error',
};

export function AppointmentsPage() {
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const { data, total, loading, error } = useCustomerAppointments(page);

  const handleFilterChange = (groupId: string, value: string, checked: boolean) => {
    setFilterValues((prev) => {
      const current = prev[groupId] ?? [];
      return { ...prev, [groupId]: checked ? [...current, value] : current.filter((v) => v !== value) };
    });
  };

  if (error) {
    return <ErrorState title="Failed to load appointments" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  const columns = [
    { key: 'serviceType', header: 'Service', width: 'auto' },
    { key: 'scheduledDate', header: 'Date', width: '120px', render: (_: unknown, row: Record<string, unknown>) => new Date(String(row.scheduledDate)).toLocaleDateString() },
    { key: 'scheduledTime', header: 'Time', width: '80px' },
    { key: 'technicianName', header: 'Technician', width: '140px' },
    { key: 'status', header: 'Status', width: '120px', render: (_: unknown, row: Record<string, unknown>) => (
      <StatusBadge variant={statusVariant[String(row.status)]}>{String(row.status).replace(/_/g, ' ')}</StatusBadge>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Appointments</h1>
        <Button variant="primary" onClick={() => { window.location.hash = '/appointments/book'; }}>Book Appointment</Button>
      </div>

      <Filter groups={filterGroups} values={filterValues} onChange={handleFilterChange} />

      <Card padding="md">
        {loading ? (
          <Skeleton variant="table" />
        ) : data.length === 0 ? (
          <EmptyState title="No appointments" description="You don't have any appointments scheduled." action={<Button variant="primary" onClick={() => { window.location.hash = '/appointments/book'; }}>Book Now</Button>} />
        ) : (
          <Table
            columns={columns}
            data={data.map((a) => ({ ...a, id: a.id }))}
            onRowClick={(row: Record<string, unknown>) => { window.location.hash = `/appointments/${row.id}`; }}
          />
        )}
      </Card>

      {total > 10 && (
        <Pagination currentPage={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
      )}
    </div>
  );
}
