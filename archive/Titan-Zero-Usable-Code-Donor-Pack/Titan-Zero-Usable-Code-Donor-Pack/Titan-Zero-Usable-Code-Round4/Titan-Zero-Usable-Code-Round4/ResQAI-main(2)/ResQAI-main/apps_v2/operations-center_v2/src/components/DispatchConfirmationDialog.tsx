import { type FC } from 'react';
import { Dialog, Button } from '@resqai/foundation';
import type { OperationDTO, TechnicianDTO } from '../models/dto';

interface DispatchConfirmationDialogProps {
  open: boolean;
  operation?: OperationDTO;
  technician?: TechnicianDTO;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const DispatchConfirmationDialog: FC<DispatchConfirmationDialogProps> = ({ open, operation, technician, onConfirm, onCancel, loading }) => {
  return (
    <Dialog open={open} onClose={onCancel} title="Confirm Dispatch" aria-label="Dispatch confirmation dialog">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 360 }}>
        <p style={{ margin: 0, color: '#8b9bb5', fontSize: 13 }}>
          Are you sure you want to dispatch the following operation?
        </p>
        <div style={{ background: '#0f1729', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Operation: </span><span style={{ color: '#e6ecf5', fontSize: 13 }}>{operation?.title}</span></div>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Technician: </span><span style={{ color: '#e6ecf5', fontSize: 13 }}>{technician?.name}</span></div>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Region: </span><span style={{ color: '#e6ecf5', fontSize: 13, textTransform: 'capitalize' }}>{operation?.region}</span></div>
        </div>
        {operation?.conflictWarning && (
          <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171', borderRadius: 6, padding: 12, color: '#f87171', fontSize: 13 }}>
            {'\u26A0'} {operation.conflictWarning}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} disabled={loading} aria-label="Confirm dispatch">{loading ? 'Dispatching...' : 'Confirm Dispatch'}</Button>
        </div>
      </div>
    </Dialog>
  );
};
