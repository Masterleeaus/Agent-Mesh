import { Dialog, Button } from '../../../shared/src/components';

interface CancellationConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customerName: string;
  reason: string;
}

export function CancellationConfirmationDialog({ open, onClose, onConfirm, customerName, reason }: CancellationConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Confirm Cancellation"
      size="sm"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Go Back</Button>
          <Button variant="danger" onClick={onConfirm}>Yes, Cancel</Button>
        </div>
      }
    >
      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
        <p style={{ margin: '0 0 8px' }}>
          Are you sure you want to cancel the appointment for <strong style={{ color: '#e2e8f0' }}>{customerName}</strong>?
        </p>
        {reason && (
          <p style={{ margin: 0 }}>
            Reason: <span style={{ color: '#e2e8f0' }}>{reason}</span>
          </p>
        )}
      </div>
    </Dialog>
  );
}
