import { StatusBadge, Skeleton } from '../../../shared/src/components';
import type { TechnicianScheduleResponse } from '../models/api-responses';

interface TechnicianDayViewProps {
  schedule: TechnicianScheduleResponse | null;
  loading?: boolean;
}

const timelineStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', paddingLeft: 80,
};

const timeLabelStyle: React.CSSProperties = {
  position: 'absolute', left: 0, fontSize: 12, color: '#64748b', lineHeight: '36px',
};

export function TechnicianDayView({ schedule, loading }: TechnicianDayViewProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="text" height={36} />)}
      </div>
    );
  }

  if (!schedule) return null;

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
        {schedule.technician.name} · {schedule.date}
      </div>
      <div style={timelineStyle}>
        {schedule.slots.map(slot => (
          <div key={slot.time} style={{ position: 'relative', minHeight: 36, display: 'flex', alignItems: 'center' }}>
            <div style={timeLabelStyle}>{slot.time}</div>
            {slot.appointment ? (
              <div style={{
                flex: 1, marginLeft: 12, padding: '6px 12px', borderRadius: 6,
                background: '#243049', border: '1px solid #2a3a4e',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, color: '#e2e8f0' }}>
                  {slot.appointment.customerName} — {slot.appointment.serviceTypeName}
                </span>
                <StatusBadge variant={slot.appointment.status as any} size="sm">
                  {slot.appointment.status}
                </StatusBadge>
              </div>
            ) : (
              <div style={{ flex: 1, marginLeft: 12, padding: '6px 12px', color: '#475569', fontSize: 12 }}>
                Available
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
