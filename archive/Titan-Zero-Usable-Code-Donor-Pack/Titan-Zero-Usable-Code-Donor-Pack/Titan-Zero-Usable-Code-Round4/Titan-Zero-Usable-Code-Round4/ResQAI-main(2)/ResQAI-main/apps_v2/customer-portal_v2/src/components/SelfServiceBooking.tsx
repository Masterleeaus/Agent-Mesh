import { useState } from 'react';
import { Card, Button, Dropdown, Form } from '../../../shared/src/components';
import type { DropdownOption } from '../../../shared/src/components';
import { useAvailableSlots } from '../hooks/useAvailableSlots';
import { CustomerService } from '../services/customer-service';
import type { BookAppointmentRequest } from '../models/api-requests';

interface SelfServiceBookingProps {
  onComplete: (appointmentId: string) => void;
  onCancel: () => void;
}

const serviceTypes: DropdownOption[] = [
  { value: 'hvac_maintenance', label: 'HVAC Maintenance' },
  { value: 'plumbing_repair', label: 'Plumbing Repair' },
  { value: 'electrical_service', label: 'Electrical Service' },
  { value: 'general_inspection', label: 'General Inspection' },
];

export function SelfServiceBooking({ onComplete, onCancel }: SelfServiceBookingProps) {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: slots, loading: slotsLoading } = useAvailableSlots(selectedDate);

  const canProceedFromStep1 = serviceType !== '';
  const canProceedFromStep2 = selectedDate !== '';
  const canProceedFromStep3 = selectedSlot !== '';

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const req: BookAppointmentRequest = { serviceType, date: selectedDate, timeSlot: selectedSlot };
      const result = await CustomerService.bookAppointment(req);
      setStep(4);
      onComplete(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding="lg">
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? '#41d1c4' : '#243049' }} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3 style={{ color: '#e6ecf5', fontSize: 16, margin: '0 0 8px' }}>Select Service Type</h3>
          <p style={{ color: '#8b9bb5', fontSize: 13, marginBottom: 16 }}>Choose the type of service you need.</p>
          <Form>
            <Dropdown options={serviceTypes} value={serviceType} onChange={setServiceType} label="Service Type" placeholder="Choose a service" />
          </Form>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" disabled={!canProceedFromStep1} onClick={() => setStep(2)}>Next</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 style={{ color: '#e6ecf5', fontSize: 16, margin: '0 0 8px' }}>Select Date</h3>
          <p style={{ color: '#8b9bb5', fontSize: 13, marginBottom: 16 }}>Pick a date for your appointment.</p>
          <Form>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #243049', background: '#131c2f', color: '#e6ecf5', fontSize: 14, outline: 'none' }}
            />
          </Form>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" disabled={!canProceedFromStep2} onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 style={{ color: '#e6ecf5', fontSize: 16, margin: '0 0 8px' }}>Select Time Slot</h3>
          <p style={{ color: '#8b9bb5', fontSize: 13, marginBottom: 16 }}>Choose an available time.</p>
          {slotsLoading ? (
            <div style={{ color: '#8b9bb5', fontSize: 13 }}>Loading available slots...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: '10px', borderRadius: 8, border: selectedSlot === slot ? '2px solid #41d1c4' : '1px solid #243049',
                    background: selectedSlot === slot ? 'rgba(65,209,196,0.1)' : '#131c2f', color: selectedSlot === slot ? '#41d1c4' : '#e6ecf5',
                    cursor: 'pointer', fontSize: 13, fontWeight: selectedSlot === slot ? 700 : 400,
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button variant="primary" disabled={!canProceedFromStep3} loading={submitting} onClick={handleSubmit}>Confirm Booking</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>&#10003;</div>
          <h3 style={{ color: '#e6ecf5', fontSize: 16, margin: '0 0 8px' }}>Appointment Booked!</h3>
          <p style={{ color: '#8b9bb5', fontSize: 13 }}>Your appointment has been confirmed.</p>
        </div>
      )}

      {error && <div style={{ color: '#e74c3c', fontSize: 13, marginTop: 8 }}>{error}</div>}
    </Card>
  );
}
