import { Card, StatusBadge } from '../../../shared/src/components';
import { AppointmentStatus } from '../models/dto';
import type { AppointmentListItemVM } from '../models/view-models';

interface ServiceHistoryListProps {
  services: AppointmentListItemVM[];
}

const statusVariant: Record<AppointmentStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [AppointmentStatus.Scheduled]: 'info',
  [AppointmentStatus.Confirmed]: 'info',
  [AppointmentStatus.InProgress]: 'warning',
  [AppointmentStatus.Completed]: 'success',
  [AppointmentStatus.Cancelled]: 'error',
  [AppointmentStatus.NoShow]: 'error',
};

export function ServiceHistoryList({ services }: ServiceHistoryListProps) {
  if (services.length === 0) {
    return <div style={{ color: '#6b7b95', fontSize: 13, padding: 16, textAlign: 'center' }}>No service history available.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {services.map((s) => (
        <Card key={s.id} padding="sm">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e6ecf5' }}>{s.serviceType}</div>
              <div style={{ fontSize: 11, color: '#6b7b95', marginTop: 2 }}>
                {new Date(s.scheduledDate).toLocaleDateString()} - {s.technicianName ?? 'Unassigned'}
              </div>
            </div>
            <StatusBadge variant={statusVariant[s.status]} size="sm">{s.status.replace(/_/g, ' ')}</StatusBadge>
          </div>
        </Card>
      ))}
    </div>
  );
}
