import { useState, useMemo } from 'react';
import { Card, SearchBar, Pagination } from '../../../shared/src/components';
import { AppointmentQueueTable } from '../components';
import { useAppointments } from '../hooks';
import { AppointmentStatus } from '../models/dto';

export function CancelledAppointmentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { appointments, total, loading, error, refetch } = useAppointments({ status: [AppointmentStatus.Cancelled], pageSize: 50 });

  const filtered = useMemo(() => {
    if (!search) return appointments;
    const q = search.toLowerCase();
    return appointments.filter(a =>
      a.customerName.toLowerCase().includes(q) ||
      a.serviceTypeName.toLowerCase().includes(q) ||
      a.technicianName.toLowerCase().includes(q) ||
      (a.reason && a.reason.toLowerCase().includes(q))
    );
  }, [appointments, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / 25));
  const paged = filtered.slice((page - 1) * 25, page * 25);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Cancelled Appointments</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{total} cancelled appointment{total !== 1 ? 's' : ''}</p>
      </div>

      <Card variant="elevated" padding="md">
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search cancelled appointments..." />
        </div>
        <AppointmentQueueTable
          appointments={paged}
          loading={loading}
          error={error}
          onRetry={refetch}
          onRowClick={id => window.location.hash = `#/appointments/${id}`}
          emptyMessage="No cancelled appointments."
        />
        {totalPages > 1 && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
