import { Card, Skeleton } from '../../../shared/src/components';
import type { AppointmentDTO } from '../models/dto';

interface TodayAppointmentsProps {
  appointments: AppointmentDTO[];
  loading?: boolean;
  onAppointmentClick?: (id: string) => void;
}

export function TodayAppointments({ appointments, loading, onAppointmentClick }: TodayAppointmentsProps) {
  if (loading) {
    return (
      <Card variant="bordered" padding="md">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Today's Appointments</div>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="text" height={32} style={{ marginBottom: 8 }} />)}
      </Card>
    );
  }

  return (
    <Card variant="bordered" padding="md">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Today's Appointments</div>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#41d1c4' }}>{appointments.length}</span>
      </div>
      {appointments.length === 0 ? (
        <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '16px 0' }}>No appointments today</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {appointments.slice(0, 5).map(apt => (
            <div
              key={apt.id}
              onClick={() => onAppointmentClick?.(apt.id)}
              style={{
                padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                background: '#1a2332', border: '1px solid #2a3a4e',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{apt.customerName}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{apt.timeSlot} · {apt.serviceTypeName}</div>
              </div>
              <div style={{
                fontSize: 11, padding: '2px 6px', borderRadius: 4,
                background: apt.status === 'completed' ? '#1a3a2a' :
                            apt.status === 'in_progress' ? '#2a3a1a' : '#1e2a4a',
                color: apt.status === 'completed' ? '#4ade80' :
                       apt.status === 'in_progress' ? '#f59e0b' : '#60a5fa',
              }}>
                {apt.status.replace(/_/g, ' ')}
              </div>
            </div>
          ))}
          {appointments.length > 5 && (
            <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: 4 }}>
              +{appointments.length - 5} more
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
