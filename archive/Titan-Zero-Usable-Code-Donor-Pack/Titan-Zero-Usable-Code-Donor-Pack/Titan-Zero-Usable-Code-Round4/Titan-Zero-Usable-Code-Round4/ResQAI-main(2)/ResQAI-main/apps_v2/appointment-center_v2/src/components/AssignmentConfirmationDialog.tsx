import { Dialog, Button } from '../../../shared/src/components';

interface AssignmentConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  technicianName: string;
  customerName: string;
}

export function AssignmentConfirmationDialog({ open, onClose, onConfirm, technicianName, customerName }: AssignmentConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Confirm Assignment"
      size="sm"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </div>
      }
    >
      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>
          Assign <strong style={{ color: '#e2e8f0' }}>{technicianName}</strong> to the appointment for <strong style={{ color: '#e2e8f0' }}>{customerName}</strong>?
        </p>
      </div>
    </Dialog>
  );
}
