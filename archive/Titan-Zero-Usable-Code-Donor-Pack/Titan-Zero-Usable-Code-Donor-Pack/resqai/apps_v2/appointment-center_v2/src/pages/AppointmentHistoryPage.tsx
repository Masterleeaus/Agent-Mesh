import { useState } from 'react';
import { Card, Filter, Pagination, Tabs, Skeleton, EmptyState, ErrorState } from '../../../shared/src/components';
import { AppointmentHistoryTable } from '../components';
import { useAllHistory } from '../hooks/useAppointmentHistory';

const eventTypeOptions = [
  { value: 'created', label: 'Created' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'no_show', label: 'No Show' },
];

export function AppointmentHistoryPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);

  const { history, loading, error, refetch } = useAllHistory(
    dateFrom || dateTo || eventType ? { dateFrom, dateTo, eventType: eventType || undefined } : undefined
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Appointment History</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Track all appointment activity</p>
      </div>

      <Card variant="elevated" padding="md">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #334155', background: '#1a2332', color: '#e2e8f0', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #334155', background: '#1a2332', color: '#e2e8f0', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Event Type</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #334155', background: '#1a2332', color: '#e2e8f0', fontSize: 13 }}>
              <option value="">All Events</option>
              {eventTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div>
            <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
          </div>
        ) : error ? (
          <ErrorState title="Failed to load history" message={error} onRetry={refetch} />
        ) : !history || history.events.length === 0 ? (
          <EmptyState title="No activity recorded" description="No appointment events match your filters." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.events.slice((page - 1) * 20, page * 20).map(event => {
              const apptName = event.appointmentId;
              return (
                <div key={event.id} style={{
                  display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 6,
                  background: '#1a2332', border: '1px solid #2a3a4e', cursor: 'pointer',
                }} onClick={() => window.location.hash = `#/appointments/${event.appointmentId}`}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 12,
                    background: event.eventType === 'completed' ? '#1a3a2a' :
                                event.eventType === 'cancelled' ? '#3a1a1a' :
                                event.eventType === 'assigned' ? '#1a2a3a' : '#2a2a1a',
                    color: event.eventType === 'completed' ? '#4ade80' :
                           event.eventType === 'cancelled' ? '#ef4444' :
                           event.eventType === 'assigned' ? '#60a5fa' : '#f59e0b',
                    fontWeight: 700, flexShrink: 0,
                  }}>
                    {event.eventType === 'created' ? '+' : event.eventType === 'completed' ? '✓' : event.eventType === 'cancelled' ? '✕' : '→'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#e2e8f0' }}>{event.description}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {event.actorName} · {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
            {history.events.length > 20 && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                <Pagination currentPage={page} totalPages={Math.ceil(history.events.length / 20)} onPageChange={setPage} />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
