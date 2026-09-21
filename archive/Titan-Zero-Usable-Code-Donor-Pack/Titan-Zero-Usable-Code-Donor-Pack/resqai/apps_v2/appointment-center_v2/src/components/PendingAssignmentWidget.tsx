import { Card, Button, Skeleton } from '../../../shared/src/components';
import type { AppointmentDTO } from '../models/dto';

interface PendingAssignmentWidgetProps {
  appointments: AppointmentDTO[];
  loading?: boolean;
  onAssign?: (id: string) => void;
  onAppointmentClick?: (id: string) => void;
}

export function PendingAssignmentWidget({ appointments, loading, onAssign, onAppointmentClick }: PendingAssignmentWidgetProps) {
  if (loading) {
    return (
      <Card variant="bordered" padding="md">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Pending Assignment</div>
        <Skeleton variant="text" height={32} />
      </Card>
    );
  }

  return (
    <Card variant="bordered" padding="md">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Pending Assignment</div>
        <span style={{ fontSize: 20, fontWeight: 700, color: appointments.length > 0 ? '#f59e0b' : '#4ade80' }}>
          {appointments.length}
        </span>
      </div>
      {appointments.length === 0 ? (
        <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '16px 0' }}>All appointments assigned</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {appointments.slice(0, 3).map(apt => (
            <div
              key={apt.id}
              style={{ padding: '6px 10px', borderRadius: 6, background: '#1a2332', border: '1px solid #2a3a4e' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', cursor: 'pointer' }}
                  onClick={() => onAppointmentClick?.(apt.id)}>
                  {apt.customerName}
                </div>
                <Button size="sm" variant="outline" onClick={() => onAssign?.(apt.id)}>Assign</Button>
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{apt.date} · {apt.timeSlot} · {apt.serviceTypeName}</div>
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
