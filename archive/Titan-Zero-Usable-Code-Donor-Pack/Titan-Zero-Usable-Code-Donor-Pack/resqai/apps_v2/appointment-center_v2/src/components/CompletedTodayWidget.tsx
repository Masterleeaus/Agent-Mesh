import { Card, Skeleton } from '../../../shared/src/components';
import type { AppointmentDTO } from '../models/dto';

interface CompletedTodayWidgetProps {
  appointments: AppointmentDTO[];
  total?: number;
  loading?: boolean;
  onAppointmentClick?: (id: string) => void;
}

export function CompletedTodayWidget({ appointments, total, loading, onAppointmentClick }: CompletedTodayWidgetProps) {
  if (loading) {
    return (
      <Card variant="bordered" padding="md">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Completed Today</div>
        <Skeleton variant="text" height={32} />
      </Card>
    );
  }

  return (
    <Card variant="bordered" padding="md">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Completed Today</div>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>
          {appointments.length}{total !== undefined ? `/${total}` : ''}
        </span>
      </div>
      {appointments.length === 0 ? (
        <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '16px 0' }}>No completions yet today</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {appointments.slice(0, 3).map(apt => (
            <div
              key={apt.id}
              onClick={() => onAppointmentClick?.(apt.id)}
              style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', background: '#1a2332', border: '1px solid #2a3a4e' }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{apt.customerName}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{apt.serviceTypeName} · {apt.technicianName}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
