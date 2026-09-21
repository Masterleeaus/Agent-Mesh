import { type FC } from 'react';
import { Dialog, Button } from '@resqai/foundation';
import type { OperationDTO } from '../models/dto';

interface EscalationConfirmationDialogProps {
  open: boolean;
  operation?: OperationDTO;
  reason?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const EscalationConfirmationDialog: FC<EscalationConfirmationDialogProps> = ({ open, operation, reason, onConfirm, onCancel, loading }) => {
  return (
    <Dialog open={open} onClose={onCancel} title="Confirm Escalation" aria-label="Escalation confirmation dialog">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 360 }}>
        <p style={{ margin: 0, color: '#8b9bb5', fontSize: 13 }}>
          This operation will be escalated to management.
        </p>
        <div style={{ background: '#0f1729', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Operation: </span><span style={{ color: '#e6ecf5', fontSize: 13 }}>{operation?.title}</span></div>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Reason: </span><span style={{ color: '#e6ecf5', fontSize: 13 }}>{reason}</span></div>
        </div>
        <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171', borderRadius: 6, padding: 12, color: '#f87171', fontSize: 13 }}>
          {'\u26A0'} This action will trigger notification to management
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} disabled={loading} aria-label="Confirm escalation">{loading ? 'Escalating...' : 'Confirm Escalation'}</Button>
        </div>
      </div>
    </Dialog>
  );
};
