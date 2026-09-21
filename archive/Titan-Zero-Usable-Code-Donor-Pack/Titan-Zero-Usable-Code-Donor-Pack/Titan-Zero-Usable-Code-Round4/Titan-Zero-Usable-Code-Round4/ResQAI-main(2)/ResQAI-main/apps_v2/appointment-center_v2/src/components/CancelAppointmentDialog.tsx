import { useState } from 'react';
import { Dialog, Button, Input } from '../../../shared/src/components';

interface CancelAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  customerName: string;
  submitting?: boolean;
}

export function CancelAppointmentDialog({ open, onClose, onConfirm, customerName, submitting }: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }
    onConfirm(reason);
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Cancel Appointment"
      size="sm"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={handleClose}>Keep Appointment</Button>
          <Button variant="danger" onClick={handleConfirm} loading={submitting}>Cancel Appointment</Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
          This will cancel the appointment for <strong style={{ color: '#e2e8f0' }}>{customerName}</strong>.
        </p>
        <Input
          label="Cancellation Reason"
          value={reason}
          onChange={e => { setReason(e.target.value); setError(''); }}
          placeholder="Why is this being cancelled?"
          error={error}
        />
      </div>
    </Dialog>
  );
}
