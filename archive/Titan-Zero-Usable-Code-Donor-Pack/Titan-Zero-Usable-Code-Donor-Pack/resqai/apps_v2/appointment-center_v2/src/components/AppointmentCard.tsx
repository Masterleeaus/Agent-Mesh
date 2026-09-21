import type { AppointmentCardVM } from '../models/view-models';
import { StatusBadge } from '../../../shared/src/components';

interface AppointmentCardProps {
  appointment: AppointmentCardVM;
  onClick?: () => void;
}

const cardStyle: React.CSSProperties = {
  padding: '8px 10px',
  marginBottom: 6,
  borderRadius: 6,
  background: '#243049',
  border: '1px solid #2a3a4e',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
};

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.background = '#2a3a4e'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#243049'; }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{appointment.customerName}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{appointment.timeSlot}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <StatusBadge variant={appointment.statusVariant as any} size="sm">
          {appointment.status}
        </StatusBadge>
      </div>
    </div>
  );
}
