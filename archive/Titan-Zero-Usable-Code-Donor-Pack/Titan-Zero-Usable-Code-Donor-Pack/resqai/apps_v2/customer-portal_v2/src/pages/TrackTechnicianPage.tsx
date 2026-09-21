import { useState } from 'react';
import { useCustomerAppointments } from '../hooks/useCustomerAppointments';
import { useLiveTechnicianStatus } from '../hooks/useTechnicianTracking';
import { Card, StatusBadge, Skeleton, EmptyState, ErrorState, Button, Dropdown } from '../../../shared/src/components';
import type { DropdownOption } from '../../../shared/src/components';
import { AppointmentStatus } from '../models/dto';

export function TrackTechnicianPage() {
  const { data: appointments } = useCustomerAppointments();
  const activeAppointments = appointments.filter((a) => a.status === AppointmentStatus.Confirmed || a.status === AppointmentStatus.InProgress || a.status === AppointmentStatus.Scheduled);
  const [selectedId, setSelectedId] = useState(activeAppointments.length > 0 ? activeAppointments[0].id : '');

  const { data: tracking, loading: trackingLoading, error: trackingError } = useLiveTechnicianStatus(selectedId);

  const appointmentOptions: DropdownOption[] = activeAppointments.map((a) => ({
    value: a.id,
    label: `${a.serviceType} - ${new Date(a.scheduledDate).toLocaleDateString()} ${a.scheduledTime}`,
  }));

  const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    en_route: 'info', on_site: 'warning', in_progress: 'warning', completed: 'success',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Track Technician</h1>

      {activeAppointments.length === 0 ? (
        <EmptyState title="No active appointments" description="You don't have any upcoming appointments to track."
          action={<Button variant="primary" onClick={() => { window.location.hash = '/appointments/book'; }}>Book an Appointment</Button>} />
      ) : (
        <>
          <div style={{ maxWidth: 400 }}>
            <Dropdown options={appointmentOptions} value={selectedId} onChange={setSelectedId} label="Select Appointment" />
          </div>

          {trackingLoading ? (
            <Card padding="md">
              <Skeleton variant="card" />
            </Card>
          ) : trackingError ? (
            <ErrorState title="Tracking unavailable" message={trackingError} />
          ) : !tracking ? (
            <EmptyState title="No tracking data" description="Tracking information is not yet available for this appointment." />
          ) : (
            <Card padding="lg">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#e6ecf5' }}>{tracking.technicianName}</div>
                    <div style={{ fontSize: 13, color: '#8b9bb5' }}>{tracking.serviceType}</div>
                  </div>
                  <StatusBadge variant={statusVariant[tracking.status] ?? 'info'} size="md">{tracking.status.replace(/_/g, ' ')}</StatusBadge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {tracking.etaMinutes !== null && (
                    <div style={{ background: '#0b1220', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                      <div style={{ fontSize: 36, fontWeight: 700, color: '#41d1c4' }}>{tracking.etaMinutes}</div>
                      <div style={{ fontSize: 12, color: '#8b9bb5' }}>Minutes Away</div>
                    </div>
                  )}
                  {tracking.estimatedArrival && (
                    <div style={{ background: '#0b1220', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#e6ecf5' }}>{new Date(tracking.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div style={{ fontSize: 12, color: '#8b9bb5' }}>Estimated Arrival</div>
                    </div>
                  )}
                </div>

                <div style={{ background: '#0b1220', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#8b9bb5', fontSize: 12 }}>Current Location</span>
                    <span style={{ color: '#e6ecf5', fontSize: 13 }}>{tracking.currentLocation ?? 'Location pending'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8b9bb5', fontSize: 12 }}>Phone</span>
                    <span style={{ color: '#e6ecf5', fontSize: 13 }}>{tracking.technicianPhone}</span>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#6b7b95', textAlign: 'center' }}>
                  Last updated: {new Date(tracking.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}