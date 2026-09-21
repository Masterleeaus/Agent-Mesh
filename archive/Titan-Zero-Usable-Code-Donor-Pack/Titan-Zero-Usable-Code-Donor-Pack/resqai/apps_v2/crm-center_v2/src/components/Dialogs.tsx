import { type FC } from 'react';
import { Dialog, Button } from '../../../../shared/src/components';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'primary', onConfirm, onCancel,
}) => (
  <Dialog open={open} onClose={onCancel} title={title} size="sm"
    footer={
      <>
        <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </>
    }>
    <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1', lineHeight: 1.5 }}>{message}</p>
  </Dialog>
);

export const FollowupConfirmationDialog: FC<{ open: boolean; onConfirm: () => void; onCancel: () => void }> = (props) => (
  <ConfirmDialog open={props.open} title="Follow-up Created" message="The follow-up has been scheduled successfully. All assigned team members will be notified." confirmLabel="OK" onConfirm={props.onConfirm} onCancel={props.onCancel} />
);

export const TaskCompletionDialog: FC<{ open: boolean; onConfirm: () => void; onCancel: () => void }> = (props) => (
  <ConfirmDialog open={props.open} title="Complete Task" message="Mark this task as completed? This action can be reversed if needed." confirmLabel="Complete" variant="primary" onConfirm={props.onConfirm} onCancel={props.onCancel} />
);

export const FeedbackConfirmationDialog: FC<{ open: boolean; onConfirm: () => void; onCancel: () => void }> = (props) => (
  <ConfirmDialog open={props.open} title="Feedback Recorded" message="Customer feedback has been recorded successfully. Thank you." confirmLabel="OK" onConfirm={props.onConfirm} onCancel={props.onCancel} />
);

export const CustomerMergeWarningDialog: FC<{ open: boolean; onConfirm: () => void; onCancel: () => void }> = (props) => (
  <ConfirmDialog open={props.open} title="Merge Customers" message="Warning: Merging customer records is irreversible. All data from the secondary customer will be transferred to the primary customer. Are you sure you want to proceed?" confirmLabel="Merge Records" variant="danger" onConfirm={props.onConfirm} onCancel={props.onCancel} />
);
