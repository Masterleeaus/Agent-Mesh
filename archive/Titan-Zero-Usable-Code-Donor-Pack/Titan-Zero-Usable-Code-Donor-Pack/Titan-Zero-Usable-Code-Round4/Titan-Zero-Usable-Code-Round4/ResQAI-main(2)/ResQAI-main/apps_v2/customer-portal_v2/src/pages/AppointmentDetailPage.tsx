import { useState } from 'react';
import { useAppointmentDetail } from '../hooks/useAppointmentDetail';
import { Card, Button, StatusBadge, Skeleton, EmptyState, ErrorState } from '../../../shared/src/components';
import { AppointmentStatus } from '../models/dto';
import { CustomerService } from '../services/customer-service';
import { useNavigate } from '../routes/useNavigate';

interface AppointmentDetailPageProps {
  appointmentId: string;
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [AppointmentStatus.Scheduled]: 'info',
  [AppointmentStatus.Confirmed]: 'info',
  [AppointmentStatus.InProgress]: 'warning',
  [AppointmentStatus.Completed]: 'success',
  [AppointmentStatus.Cancelled]: 'error',
  [AppointmentStatus.NoShow]: 'error',
};

export function AppointmentDetailPage({ appointmentId }: AppointmentDetailPageProps) {
  const { data, loading, error } = useAppointmentDetail(appointmentId);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(true);
    try {
      await CustomerService.cancelAppointment({ appointmentId, reason: 'Customer requested cancellation' });
      window.location.reload();
    } catch {
      alert('Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton variant="rectangular" height={40} width={200} />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load appointment" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  if (!data) {
    return <EmptyState title="Appointment not found" description={`No appointment found with ID ${appointmentId}.`} action={<Button variant="primary" onClick={() => navigate('/appointments')}>Back to Appointments</Button>} />;
  }

  const canModify = data.status === AppointmentStatus.Scheduled || data.status === AppointmentStatus.Confirmed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')}>&larr; Back</Button>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: '8px 0 0' }}>{data.serviceType}</h1>
        </div>
        <StatusBadge variant={statusVariant[data.status]} size="md">{data.status.replace(/_/g, ' ')}</StatusBadge>
      </div>

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div><span style={{ color: '#6b7b95', fontSize: 12 }}>Date</span><div style={{ color: '#e6ecf5', fontSize: 14, fontWeight: 600 }}>{new Date(data.scheduledDate).toLocaleDateString()}</div></div>
          <div><span style={{ color: '#6b7b95', fontSize: 12 }}>Time</span><div style={{ color: '#e6ecf5', fontSize: 14, fontWeight: 600 }}>{data.scheduledTime}</div></div>
          <div><span style={{ color: '#6b7b95', fontSize: 12 }}>Technician</span><div style={{ color: '#e6ecf5', fontSize: 14, fontWeight: 600 }}>{data.technicianName ?? 'Unassigned'}</div></div>
          <div><span style={{ color: '#6b7b95', fontSize: 12 }}>Contact</span><div style={{ color: '#e6ecf5', fontSize: 14, fontWeight: 600 }}>{data.technicianPhone ?? 'N/A'}</div></div>
          <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#6b7b95', fontSize: 12 }}>Address</span><div style={{ color: '#e6ecf5', fontSize: 14, fontWeight: 600 }}>{data.address}</div></div>
          {data.notes && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#6b7b95', fontSize: 12 }}>Notes</span><div style={{ color: '#e6ecf5', fontSize: 14 }}>{data.notes}</div></div>}
        </div>
      </Card>

      {canModify && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => alert('Reschedule flow - select new date/time')}>Reschedule</Button>
          <Button variant="danger" onClick={handleCancel} loading={cancelling}>Cancel Appointment</Button>
        </div>
      )}
    </div>
  );
}
