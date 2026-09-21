import { type FC } from 'react';
import { Dialog, Button } from '@resqai/foundation';
import type { OperationDTO, TechnicianDTO } from '../models/dto';

interface ReassignmentConfirmationDialogProps {
  open: boolean;
  operation?: OperationDTO;
  currentTechnician?: TechnicianDTO;
  newTechnician?: TechnicianDTO;
  reason?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ReassignmentConfirmationDialog: FC<ReassignmentConfirmationDialogProps> = ({ open, operation, currentTechnician, newTechnician, reason, onConfirm, onCancel, loading }) => {
  return (
    <Dialog open={open} onClose={onCancel} title="Confirm Reassignment" aria-label="Reassignment confirmation dialog">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 360 }}>
        <p style={{ margin: 0, color: '#8b9bb5', fontSize: 13 }}>
          This operation will be reassigned to a different technician.
        </p>
        <div style={{ background: '#0f1729', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Operation: </span><span style={{ color: '#e6ecf5', fontSize: 13 }}>{operation?.title}</span></div>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>From: </span><span style={{ color: '#f87171', fontSize: 13 }}>{currentTechnician?.name || operation?.technicianName || '\u2014'}</span></div>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>To: </span><span style={{ color: '#4ade80', fontSize: 13 }}>{newTechnician?.name}</span></div>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Reason: </span><span style={{ color: '#e6ecf5', fontSize: 13 }}>{reason}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} disabled={loading} aria-label="Confirm reassignment">{loading ? 'Reassigning...' : 'Confirm Reassignment'}</Button>
        </div>
      </div>
    </Dialog>
  );
};
