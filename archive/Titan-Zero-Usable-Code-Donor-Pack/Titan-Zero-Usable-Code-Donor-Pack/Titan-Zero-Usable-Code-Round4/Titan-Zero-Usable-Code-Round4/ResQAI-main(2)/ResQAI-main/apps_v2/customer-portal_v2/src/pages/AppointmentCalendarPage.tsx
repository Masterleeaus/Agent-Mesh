import { useAppointmentCalendar } from '../hooks/useAppointmentCalendar';
import { Card, Button, Skeleton, EmptyState, ErrorState } from '../../../shared/src/components';

export function AppointmentCalendarPage() {
  const { days, loading, error, navigateMonth, year, month } = useAppointmentCalendar();

  if (error) {
    return <ErrorState title="Failed to load calendar" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  const monthLabel = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const eventMap = new Map(days.map((d) => [d.date, d.appointments]));

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Appointment Calendar</h1>

      <Card padding="md">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>&larr; Previous</Button>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#e6ecf5' }}>{monthLabel}</span>
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>Next &rarr;</Button>
        </div>

        {loading ? (
          <Skeleton variant="rectangular" height={300} />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 8 }}>
              {dayNames.map((d) => <div key={d} style={{ fontSize: 11, color: '#6b7b95', padding: 6, fontWeight: 600 }}>{d}</div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {calendarDays.map((d, i) => {
                if (d === null) return <div key={`e-${i}`} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const dayEvents = eventMap.get(dateStr) || [];

                return (
                  <div key={d}
                    style={{
                      minHeight: 80, padding: 6, borderRadius: 8, cursor: 'pointer',
                      background: isToday ? 'rgba(65,209,196,0.15)' : 'transparent',
                      border: isToday ? '1px solid #41d1c4' : '1px solid transparent',
                    }}
                    onClick={() => { if (dayEvents.length > 0) window.location.hash = `/appointments/${dayEvents[0].id}`; }}>
                    <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? '#41d1c4' : '#e6ecf5', marginBottom: 4 }}>{d}</div>
                    {dayEvents.map((ev) => (
                      <div key={ev.id} style={{ fontSize: 9, color: '#8b9bb5', background: '#1a2744', borderRadius: 4, padding: '2px 4px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.scheduledTime} {ev.serviceType}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {days.length > 0 && (
        <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Appointments This Month</span>}>
          {days.flatMap((d) => d.appointments).length === 0 ? (
            <EmptyState title="No appointments this month" size="sm" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {days.flatMap((d) => d.appointments.map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a2744', cursor: 'pointer' }}
                     onClick={() => { window.location.hash = `/appointments/${a.id}`; }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e6ecf5' }}>{a.serviceType}</div>
                    <div style={{ fontSize: 11, color: '#6b7b95' }}>{new Date(a.scheduledDate).toLocaleDateString()} at {a.scheduledTime}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#8b9bb5' }}>{a.technicianName ?? 'Unassigned'}</span>
                </div>
              )))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}