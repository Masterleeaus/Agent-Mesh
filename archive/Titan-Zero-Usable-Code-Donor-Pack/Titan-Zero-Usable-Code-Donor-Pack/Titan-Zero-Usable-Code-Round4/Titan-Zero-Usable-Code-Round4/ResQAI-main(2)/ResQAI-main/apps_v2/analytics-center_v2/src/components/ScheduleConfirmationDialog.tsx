import { Dialog, Button } from '../../../../shared/src/components';
import type { ReportFrequency } from '../models/dto';

interface ScheduleConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  frequency: ReportFrequency;
  loading?: boolean;
}

export function ScheduleConfirmationDialog({ open, onClose, onConfirm, frequency, loading }: ScheduleConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Confirm Schedule">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
        <p style={{ color: '#8b9bb5', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
          This report will be scheduled for delivery on a <strong style={{ color: '#e6ecf5', textTransform: 'capitalize' }}>{frequency}</strong> basis.
          Recipients will receive the report via email at the scheduled interval.
        </p>
        <p style={{ color: '#6b7a95', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          You can modify or cancel this schedule at any time from the Scheduled Reports page.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} loading={loading}>Create Schedule</Button>
        </div>
      </div>
    </Dialog>
  );
}
