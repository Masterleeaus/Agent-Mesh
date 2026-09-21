import { Card, Skeleton } from '../../../shared/src/components';
import type { AppointmentDTO } from '../models/dto';

interface UpcomingAppointmentsProps {
  appointments: AppointmentDTO[];
  loading?: boolean;
  onAppointmentClick?: (id: string) => void;
}

export function UpcomingAppointments({ appointments, loading, onAppointmentClick }: UpcomingAppointmentsProps) {
  if (loading) {
    return (
      <Card variant="bordered" padding="md">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Upcoming</div>
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} variant="text" height={32} style={{ marginBottom: 8 }} />)}
      </Card>
    );
  }

  return (
    <Card variant="bordered" padding="md">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Upcoming</div>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa' }}>{appointments.length}</span>
      </div>
      {appointments.length === 0 ? (
        <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '16px 0' }}>No upcoming appointments</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {appointments.slice(0, 4).map(apt => (
            <div
              key={apt.id}
              onClick={() => onAppointmentClick?.(apt.id)}
              style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', background: '#1a2332', border: '1px solid #2a3a4e' }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{apt.customerName}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {apt.timeSlot}</div>
            </div>
          ))}
          {appointments.length > 4 && (
            <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: 4 }}>+{appointments.length - 4} more</div>
          )}
        </div>
      )}
    </Card>
  );
}
