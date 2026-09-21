import { type FC } from 'react';
import { Dialog, Button } from '@resqai/foundation';

interface ConflictWarningDialogProps {
  open: boolean;
  title: string;
  message: string;
  onAcknowledge: () => void;
  onOverride: () => void;
  onCancel: () => void;
}

export const ConflictWarningDialog: FC<ConflictWarningDialogProps> = ({ open, title, message, onAcknowledge, onOverride, onCancel }) => {
  return (
    <Dialog open={open} onClose={onCancel} title={title} aria-label="Conflict warning dialog">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 360 }}>
        <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171', borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>{'\u26A0'}</div>
          <p style={{ margin: 0, color: '#f87171', fontSize: 14, textAlign: 'center' }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="ghost" onClick={onAcknowledge} aria-label="Acknowledge conflict">Acknowledge</Button>
          <Button variant="primary" onClick={onOverride} aria-label="Override conflict warning">Override</Button>
        </div>
      </div>
    </Dialog>
  );
};
