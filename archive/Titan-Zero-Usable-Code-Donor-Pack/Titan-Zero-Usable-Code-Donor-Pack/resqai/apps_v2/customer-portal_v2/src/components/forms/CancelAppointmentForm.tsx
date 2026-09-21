import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Card, Form, Input, Button } from '../../../../shared/src/components';
import { CustomerService } from '../../services/customer-service';

interface CancelAppointmentFormProps {
  appointmentId: string;
  serviceType: string;
  scheduledDate: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CancelAppointmentForm({ appointmentId, serviceType, scheduledDate, onSuccess, onCancel }: CancelAppointmentFormProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Please provide a reason for cancellation.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await CustomerService.cancelAppointment({ appointmentId, reason });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding="md" variant="bordered" style={{ borderColor: '#e74c3c' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e74c3c', marginBottom: 4 }}>Cancel {serviceType}</div>
        <div style={{ fontSize: 12, color: '#8b9bb5' }}>Scheduled for {new Date(scheduledDate).toLocaleDateString()}</div>
        <div style={{ fontSize: 11, color: '#6b7b95', marginTop: 8 }}>This action cannot be undone. Please confirm you want to cancel this appointment.</div>
      </div>
      <Form onSubmit={handleSubmit} layout="vertical">
        <Input label="Reason for Cancellation" value={reason} onChange={(e: ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} required placeholder="Tell us why you're cancelling..." />
        {error && <div style={{ color: '#e74c3c', fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={onCancel}>Keep Appointment</Button>
          <Button type="submit" variant="danger" loading={submitting}>Confirm Cancellation</Button>
        </div>
      </Form>
    </Card>
  );
}