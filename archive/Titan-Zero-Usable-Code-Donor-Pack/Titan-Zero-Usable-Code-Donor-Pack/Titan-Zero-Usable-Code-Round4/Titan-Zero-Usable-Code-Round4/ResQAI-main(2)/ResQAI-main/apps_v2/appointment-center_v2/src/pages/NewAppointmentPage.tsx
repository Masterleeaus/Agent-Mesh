import { useState } from 'react';
import { Card, Form, Button, Input, Dropdown } from '../../../shared/src/components';
import { TechnicianPicker, ServiceTypeSelector, TimeSlotPicker, ConflictWarning, BookingWizard } from '../components';
import { useAvailableSlots, useTechnicians } from '../hooks';
import { appointmentService } from '../services';
import type { BookingWizardStepVM, ConflictWarningVM } from '../models/view-models';
import type { TimeSlotDTO } from '../models/dto';

const steps: BookingWizardStepVM[] = [
  { step: 0, title: 'Select Service', description: 'Choose service type' },
  { step: 1, title: 'Choose Time', description: 'Pick date & time slot' },
  { step: 2, title: 'Assign Technician', description: 'Select technician' },
  { step: 3, title: 'Confirm', description: 'Review and submit' },
];

export function NewAppointmentPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    customerName: '',
    serviceTypeId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '',
    technicianId: '',
    notes: '',
  });

  const { slots, loading: slotsLoading } = useAvailableSlots(formData.date, formData.serviceTypeId);

  const warnings: ConflictWarningVM[] = [];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.customerName.trim()) errs.customerName = 'Customer name is required';
    if (!formData.serviceTypeId) errs.serviceTypeId = 'Service type is required';
    if (!formData.date) errs.date = 'Date is required';
    if (!formData.timeSlot) errs.timeSlot = 'Time slot is required';
    if (!formData.technicianId) errs.technicianId = 'Technician is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await appointmentService.create({
        customerId: formData.customerName,
        serviceTypeId: formData.serviceTypeId,
        date: formData.date,
        timeSlot: formData.timeSlot,
        technicianId: formData.technicianId,
        notes: formData.notes,
      });
      setSuccess(true);
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to create appointment' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card padding="lg" variant="elevated" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ color: '#41d1c4', marginBottom: 8 }}>Appointment Created!</h2>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>The appointment has been scheduled successfully.</p>
        <Button onClick={() => { window.location.hash = '#/'; }}>Back to Schedule</Button>
      </Card>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Customer Name"
              value={formData.customerName}
              onChange={e => setFormData({ ...formData, customerName: e.target.value })}
              error={errors.customerName}
              placeholder="Enter customer name"
            />
            <ServiceTypeSelector
              value={formData.serviceTypeId}
              onChange={v => setFormData({ ...formData, serviceTypeId: v, timeSlot: '' })}
              error={errors.serviceTypeId}
            />
          </div>
        );
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value, timeSlot: '' })}
              error={errors.date}
            />
            <TimeSlotPicker
              slots={slots}
              selected={formData.timeSlot}
              onSelect={s => setFormData({ ...formData, timeSlot: s.start })}
              loading={slotsLoading}
            />
            {errors.timeSlot && <div style={{ color: '#ef4444', fontSize: 12 }}>{errors.timeSlot}</div>}
          </div>
        );
      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TechnicianPicker
              value={formData.technicianId}
              onChange={v => setFormData({ ...formData, technicianId: v })}
              error={errors.technicianId}
            />
            <Input
              label="Notes (optional)"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special instructions..."
            />
          </div>
        );
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#e2e8f0' }}>
            <div><strong style={{ color: '#94a3b8' }}>Customer:</strong> {formData.customerName}</div>
            <div><strong style={{ color: '#94a3b8' }}>Date:</strong> {formData.date}</div>
            <div><strong style={{ color: '#94a3b8' }}>Time:</strong> {formData.timeSlot || 'Not selected'}</div>
            <div><strong style={{ color: '#94a3b8' }}>Technician ID:</strong> {formData.technicianId}</div>
            {formData.notes && <div><strong style={{ color: '#94a3b8' }}>Notes:</strong> {formData.notes}</div>}
            {warnings.length > 0 && <ConflictWarning warnings={warnings} />}
            {errors.submit && <div style={{ color: '#ef4444', fontSize: 13 }}>{errors.submit}</div>}
          </div>
        );
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <BookingWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleSubmit}
        submitting={submitting}
      >
        {renderStep()}
      </BookingWizard>
    </div>
  );
}
