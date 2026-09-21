import { useState, useMemo } from 'react';
import { Card, Filter, SearchBar, StatusBadge, Button, Skeleton, EmptyState, ErrorState } from '../../../shared/src/components';
import { ScheduleCalendar } from '../components';
import { useAppointments } from '../hooks';
import { useAppContext } from '../state';
import type { AppointmentDTO } from '../models/dto';
import type { ScheduleDayVM, AppointmentCardVM } from '../models/view-models';

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  scheduled: 'info', confirmed: 'info', in_progress: 'warning',
  completed: 'success', cancelled: 'error', no_show: 'error', rescheduled: 'warning',
};

function toCardVM(a: AppointmentDTO): AppointmentCardVM {
  return {
    id: a.id, customerName: a.customerName, serviceTypeName: a.serviceTypeName,
    technicianName: a.technicianName, timeSlot: a.timeSlot, date: a.date,
    status: a.status, statusVariant: statusVariantMap[a.status] || 'neutral',
    durationMinutes: a.durationMinutes, type: a.type,
  };
}

const filterGroups = [
  {
    id: 'status', label: 'Status',
    options: [
      { value: 'scheduled', label: 'Scheduled' }, { value: 'confirmed', label: 'Confirmed' },
      { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
];

function groupByDate(appointments: AppointmentDTO[]): ScheduleDayVM[] {
  const grouped: Record<string, AppointmentDTO[]> = {};
  appointments.forEach(a => {
    if (!grouped[a.date]) grouped[a.date] = [];
    grouped[a.date].push(a);
  });
  return Object.entries(grouped).map(([date, aps]) => {
    const d = new Date(date);
    return {
      date, dayLabel: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short' }),
      dayNum: d.getDate(), appointments: aps.map(toCardVM),
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

export function CalendarViewPage() {
  const { viewMode, setViewMode, activeFilters, setActiveFilters } = useAppContext();
  const { appointments, total, loading, error, refetch } = useAppointments(activeFilters);
  const [search, setSearch] = useState('');

  const days = useMemo(() => {
    const filtered = search
      ? appointments.filter(a => a.customerName.toLowerCase().includes(search.toLowerCase()))
      : appointments;
    return groupByDate(filtered);
  }, [appointments, search]);

  if (error) {
    return <ErrorState title="Failed to load schedule" message={error} onRetry={refetch} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Calendar View</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{total} appointment{total !== 1 ? 's' : ''}</p>
      </div>

      <Card variant="elevated" padding="md">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, maxWidth: 320 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by customer..." />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['day', 'week', 'month'] as const).map(mode => (
              <Button key={mode} size="sm" variant={viewMode === mode ? 'primary' : 'secondary'}
                onClick={() => setViewMode(mode)}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
            <Button size="sm" variant={viewMode === 'timeline' ? 'primary' : 'secondary'}
              onClick={() => window.location.hash = '#/timeline'}>
              Timeline
            </Button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 200, flexShrink: 0 }}>
            <Filter
              groups={filterGroups}
              values={activeFilters}
              onChange={(groupId, value, checked) => {
                const current = (activeFilters[groupId] || []) as string[];
                setActiveFilters({
                  ...activeFilters,
                  [groupId]: checked ? [...current, value] : current.filter((v: string) => v !== value),
                });
              }}
              onClear={() => setActiveFilters({})}
            />
          </div>
          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} variant="card" />)}
              </div>
            ) : days.length === 0 ? (
              <EmptyState title="No appointments scheduled" description="Schedule a new appointment to get started."
                action={<Button onClick={() => window.location.hash = '#/appointments/new'}>New Appointment</Button>}
              />
            ) : (
              <ScheduleCalendar
                days={days}
                viewMode={viewMode}
                onAppointmentClick={id => window.location.hash = `#/appointments/${id}`}
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
