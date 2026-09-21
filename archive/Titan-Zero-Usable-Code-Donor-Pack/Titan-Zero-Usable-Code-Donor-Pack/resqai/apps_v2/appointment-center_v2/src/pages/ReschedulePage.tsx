import { useState } from 'react';
import { Card, Form, Button, Input, Dropdown } from '../../../shared/src/components';
import { useAppointmentDetail, useAvailableSlots } from '../hooks';
import { appointmentService } from '../services';

interface ReschedulePageProps {
  id?: string;
}

export function ReschedulePage({ id }: ReschedulePageProps) {
  const { appointment, loading: loadingAppt } = useAppointmentDetail(id);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { slots, loading: slotsLoading } = useAvailableSlots(newDate, appointment?.serviceTypeId);

  const handleSubmit = async () => {
    if (!newDate || !newTimeSlot || !reason.trim()) {
      setError('All fields are required');
      return;
    }
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      await appointmentService.reschedule(id, { newDate, newTimeSlot, reason });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card padding="lg" variant="elevated" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ color: '#41d1c4', marginBottom: 8 }}>Rescheduled!</h2>
        <Button onClick={() => window.location.hash = `#/appointments/${id}`}>Back to Appointment</Button>
      </Card>
    );
  }

  if (loadingAppt) {
    return <Card padding="lg"><div style={{ color: '#94a3b8' }}>Loading appointment...</div></Card>;
  }

  if (!appointment) {
    return <Card padding="lg"><div style={{ color: '#ef4444' }}>Appointment not found</div></Card>;
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Card padding="lg" variant="elevated">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Reschedule Appointment</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          {appointment.customerName} — {appointment.date} at {appointment.timeSlot}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="New Date" type="date" value={newDate} onChange={e => { setNewDate(e.target.value); setNewTimeSlot(''); }} />
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 6 }}>New Time Slot</label>
            {slotsLoading ? (
              <div style={{ color: '#64748b', fontSize: 13 }}>Loading slots...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {slots.map(s => (
                  <button
                    key={s.start}
                    disabled={!s.available}
                    onClick={() => setNewTimeSlot(s.start)}
                    style={{
                      padding: '8px 12px', borderRadius: 6, border: '1px solid #334155',
                      background: newTimeSlot === s.start ? '#41d1c4' : s.available ? '#1a2332' : '#111827',
                      color: newTimeSlot === s.start ? '#0b1220' : s.available ? '#e2e8f0' : '#475569',
                      cursor: s.available ? 'pointer' : 'not-allowed',
                      fontWeight: newTimeSlot === s.start ? 600 : 400, fontSize: 13,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Input label="Reason for rescheduling" value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why..." />
          {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => window.location.hash = `#/appointments/${id}`}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>Confirm Reschedule</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
