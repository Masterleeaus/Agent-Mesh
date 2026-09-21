import type { AppointmentDTO } from '../models/dto';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';

interface TimelineViewProps {
  appointments: AppointmentDTO[];
  loading?: boolean;
  onAppointmentClick?: (id: string) => void;
}

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 22;

function getTimePosition(timeSlot: string): number {
  const hour = parseInt(timeSlot.split(':')[0], 10);
  return (hour - START_HOUR) * HOUR_HEIGHT;
}

function getDurationHeight(timeSlot: string): number {
  const [start, end] = timeSlot.split('-');
  const startH = parseInt(start.split(':')[0], 10);
  const endH = parseInt(end.split(':')[0], 10);
  return (endH - startH) * HOUR_HEIGHT;
}

export function TimelineView({ appointments, loading, onAppointmentClick }: TimelineViewProps) {
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  if (loading) {
    return (
      <div style={{ padding: 16, color: '#64748b', fontSize: 13 }}>
        Loading timeline...
      </div>
    );
  }

  if (!appointments.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        No appointments to display on the timeline.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 60, minHeight: totalHeight }}>
      {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
        const hour = START_HOUR + i;
        const top = i * HOUR_HEIGHT;
        return (
          <div key={hour} style={{ position: 'absolute', top, left: 0, right: 0, height: HOUR_HEIGHT, borderTop: '1px solid #2a3a4e', display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ position: 'absolute', left: -55, top: -8, fontSize: 11, color: '#64748b', width: 50, textAlign: 'right' }}>
              {hour.toString().padStart(2, '0')}:00
            </div>
          </div>
        );
      })}
      {appointments.map(apt => {
        const top = getTimePosition(apt.timeSlot);
        const height = getDurationHeight(apt.timeSlot);
        return (
          <div
            key={apt.id}
            onClick={() => onAppointmentClick?.(apt.id)}
            style={{
              position: 'absolute', top, left: 0, right: 0, height,
              marginLeft: 8, marginRight: 8, padding: '6px 10px',
              borderRadius: 6, cursor: 'pointer', overflow: 'hidden',
              background: apt.status === 'completed' ? '#1a3a2a' :
                          apt.status === 'cancelled' ? '#3a1a1a' :
                          apt.status === 'in_progress' ? '#2a3a1a' : '#1e2a4a',
              border: `1px solid ${apt.status === 'completed' ? '#4ade80' :
                                     apt.status === 'cancelled' ? '#ef4444' :
                                     apt.status === 'in_progress' ? '#f59e0b' : '#3b82f6'}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{apt.customerName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{apt.serviceTypeName} · {apt.technicianName}</div>
            <AppointmentStatusBadge status={apt.status} size="sm" />
          </div>
        );
      })}
    </div>
  );
}
