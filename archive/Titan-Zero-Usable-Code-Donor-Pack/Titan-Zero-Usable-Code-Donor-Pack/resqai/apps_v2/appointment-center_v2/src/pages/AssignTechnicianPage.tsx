import { useState } from 'react';
import { Card, Button, Dropdown, Skeleton, EmptyState } from '../../../shared/src/components';
import { useAppointmentDetail, useTechnicians } from '../hooks';
import { appointmentService } from '../services';
import { AssignmentConfirmationDialog } from '../components';

interface AssignTechnicianPageProps {
  id?: string;
}

export function AssignTechnicianPage({ id }: AssignTechnicianPageProps) {
  const { appointment, loading: loadingAppt, refetch } = useAppointmentDetail(id);
  const { technicians, loading: loadingTechs } = useTechnicians();
  const [selectedId, setSelectedId] = useState(appointment?.technicianId || '');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = technicians.map(t => ({
    value: t.id,
    label: `${t.name} · ★${t.rating} · ${t.skills.slice(0, 2).join(', ')}`,
    description: `${t.activeAppointments} active · ${t.location}`,
  }));

  const handleConfirm = async () => {
    if (!id || !selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await appointmentService.assignTechnician(id, { technicianId: selectedId });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to assign technician');
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (loadingAppt || loadingTechs) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Skeleton variant="card" height={300} />
      </div>
    );
  }

  if (!appointment) {
    return <EmptyState title="Appointment not found" description="The requested appointment does not exist." />;
  }

  if (success) {
    return (
      <Card variant="elevated" padding="lg" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ color: '#4ade80', marginBottom: 8 }}>Technician Assigned!</h2>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>The technician has been assigned to this appointment.</p>
        <Button onClick={() => window.location.hash = `#/appointments/${id}`}>Back to Appointment</Button>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Card variant="elevated" padding="lg">
        <div style={{ marginBottom: 4 }}>
          <Button size="sm" variant="ghost" onClick={() => window.location.hash = `#/appointments/${id}`} style={{ marginBottom: 8 }}>
            ← Back to Appointment
          </Button>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Assign Technician</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          {appointment.appointment.customerName} — {appointment.appointment.serviceTypeName} on {appointment.appointment.date}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Dropdown
            label="Select Technician"
            options={options}
            value={selectedId}
            onChange={v => setSelectedId(v as string)}
            placeholder="Choose a technician..."
            searchable
          />
          {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => window.location.hash = `#/appointments/${id}`}>Cancel</Button>
            <Button onClick={() => setShowConfirm(true)} disabled={!selectedId}>Continue</Button>
          </div>
        </div>
      </Card>

      <AssignmentConfirmationDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        technicianName={technicians.find(t => t.id === selectedId)?.name || 'Selected Technician'}
        customerName={appointment.appointment.customerName}
      />
    </div>
  );
}
