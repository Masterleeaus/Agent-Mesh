import { Card, StatusBadge } from '../../../shared/src/components';
import type { AppointmentListItemVM } from '../models/view-models';
import { AppointmentStatus } from '../models/dto';

interface AppointmentCardProps {
  appointment: AppointmentListItemVM;
  onClick?: () => void;
}

const statusVariant: Record<AppointmentStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [AppointmentStatus.Scheduled]: 'info',
  [AppointmentStatus.Confirmed]: 'info',
  [AppointmentStatus.InProgress]: 'warning',
  [AppointmentStatus.Completed]: 'success',
  [AppointmentStatus.Cancelled]: 'error',
  [AppointmentStatus.NoShow]: 'error',
};

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  return (
    <Card padding="md" clickable onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{appointment.serviceType}</div>
          <div style={{ fontSize: 12, color: '#6b7b95', marginTop: 4 }}>
            {new Date(appointment.scheduledDate).toLocaleDateString()} at {appointment.scheduledTime}
          </div>
          {appointment.technicianName && (
            <div style={{ fontSize: 12, color: '#8b9bb5', marginTop: 2 }}>Tech: {appointment.technicianName}</div>
          )}
        </div>
        <StatusBadge variant={statusVariant[appointment.status]}>{appointment.status.replace(/_/g, ' ')}</StatusBadge>
      </div>
    </Card>
  );
}
