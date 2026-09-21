import { Card, Skeleton } from '../../../shared/src/components';
import type { AppointmentDTO } from '../models/dto';

interface OverdueAppointmentsProps {
  appointments: AppointmentDTO[];
  loading?: boolean;
  onAppointmentClick?: (id: string) => void;
}

export function OverdueAppointments({ appointments, loading, onAppointmentClick }: OverdueAppointmentsProps) {
  if (loading) {
    return (
      <Card variant="bordered" padding="md">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Overdue</div>
        <Skeleton variant="text" height={32} />
      </Card>
    );
  }

  return (
    <Card variant="bordered" padding="md">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Overdue</div>
        <span style={{ fontSize: 20, fontWeight: 700, color: appointments.length > 0 ? '#ef4444' : '#4ade80' }}>
          {appointments.length}
        </span>
      </div>
      {appointments.length === 0 ? (
        <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '16px 0' }}>No overdue appointments</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {appointments.slice(0, 3).map(apt => (
            <div
              key={apt.id}
              onClick={() => onAppointmentClick?.(apt.id)}
              style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', background: '#3a1a1a', border: '1px solid #5a2020' }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5' }}>{apt.customerName}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{apt.date} · {apt.timeSlot} · {apt.serviceTypeName}</div>
            </div>
          ))}
          {appointments.length > 3 && (
            <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: 4 }}>+{appointments.length - 3} more</div>
          )}
        </div>
      )}
    </Card>
  );
}
