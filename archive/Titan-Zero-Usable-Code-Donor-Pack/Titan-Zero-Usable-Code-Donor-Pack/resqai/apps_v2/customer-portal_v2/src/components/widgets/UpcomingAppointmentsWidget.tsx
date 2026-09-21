import { Card, StatusBadge } from '../../../../shared/src/components';
import type { UpcomingAppointmentVM } from '../../models/view-models';
import { AppointmentStatus } from '../../models/dto';

interface UpcomingAppointmentsWidgetProps {
  appointments: UpcomingAppointmentVM[];
  loading?: boolean;
  onViewAll?: () => void;
}

const badgeVariant: Record<AppointmentStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [AppointmentStatus.Scheduled]: 'info',
  [AppointmentStatus.Confirmed]: 'info',
  [AppointmentStatus.InProgress]: 'warning',
  [AppointmentStatus.Completed]: 'success',
  [AppointmentStatus.Cancelled]: 'error',
  [AppointmentStatus.NoShow]: 'error',
};

export function UpcomingAppointmentsWidget({ appointments, loading, onViewAll }: UpcomingAppointmentsWidgetProps) {
  if (loading) {
    return (
      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Upcoming Appointments</span>}>
        <div style={{ height: 120, background: '#1a2744', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      </Card>
    );
  }

  return (
    <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Upcoming Appointments</span>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {appointments.length === 0 ? (
          <div style={{ color: '#6b7b95', fontSize: 12, textAlign: 'center', padding: 16 }}>No upcoming appointments</div>
        ) : (
          appointments.slice(0, 5).map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1a2744', cursor: 'pointer' }}
                 onClick={() => { window.location.hash = `/appointments/${a.id}`; }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e6ecf5' }}>{a.serviceType}</div>
                <div style={{ fontSize: 11, color: '#6b7b95' }}>{new Date(a.scheduledDate).toLocaleDateString()} at {a.scheduledTime}</div>
              </div>
              <StatusBadge variant={badgeVariant[a.status]} size="sm">{a.status.replace(/_/g, ' ')}</StatusBadge>
            </div>
          ))
        )}
      </div>
      {onViewAll && (
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <button onClick={onViewAll} style={{ background: 'none', border: 'none', color: '#41d1c4', fontSize: 12, cursor: 'pointer' }}>View All</button>
        </div>
      )}
    </Card>
  );
}