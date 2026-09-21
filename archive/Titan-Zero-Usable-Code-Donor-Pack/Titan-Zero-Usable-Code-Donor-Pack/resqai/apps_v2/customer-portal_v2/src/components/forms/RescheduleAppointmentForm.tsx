import { useState, type FormEvent } from 'react';
import { Card, Form, Button } from '../../../../shared/src/components';
import { useAvailableSlots } from '../../hooks/useAvailableSlots';
import { CustomerService } from '../../services/customer-service';

interface RescheduleAppointmentFormProps {
  appointmentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RescheduleAppointmentForm({ appointmentId, onSuccess, onCancel }: RescheduleAppointmentFormProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: slots, loading: slotsLoading } = useAvailableSlots(selectedDate);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) { setError('Please select a date and time slot.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await CustomerService.rescheduleAppointment({ appointmentId, newDate: selectedDate, newTimeSlot: selectedSlot, reason });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding="md">
      <Form onSubmit={handleSubmit} layout="vertical">
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8b9bb5', marginBottom: 4 }}>New Date</label>
          <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #243049', background: '#131c2f', color: '#e6ecf5', fontSize: 14, outline: 'none' }} />
        </div>

        {selectedDate && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#8b9bb5', marginBottom: 4 }}>Available Time Slots</label>
            {slotsLoading ? (
              <div style={{ color: '#8b9bb5', fontSize: 13 }}>Loading available slots...</div>
            ) : slots.length === 0 ? (
              <div style={{ color: '#6b7b95', fontSize: 13 }}>No available slots for this date</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {slots.map((slot) => (
                  <button key={slot} type="button" onClick={() => setSelectedSlot(slot)}
                    style={{ padding: '8px', borderRadius: 6, border: selectedSlot === slot ? '2px solid #41d1c4' : '1px solid #243049', background: selectedSlot === slot ? 'rgba(65,209,196,0.1)' : '#131c2f', color: selectedSlot === slot ? '#41d1c4' : '#e6ecf5', cursor: 'pointer', fontSize: 12 }}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8b9bb5', marginBottom: 4 }}>Reason for Rescheduling (optional)</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let us know why..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #243049', background: '#131c2f', color: '#e6ecf5', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }} />
        </div>

        {error && <div style={{ color: '#e74c3c', fontSize: 13, marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" loading={submitting} disabled={!selectedDate || !selectedSlot}>Confirm Reschedule</Button>
        </div>
      </Form>
    </Card>
  );
}