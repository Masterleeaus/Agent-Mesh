import { Dialog, Button } from '../../../../shared/src/components';

interface DeleteReportDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reportName: string;
  loading?: boolean;
}

export function DeleteReportDialog({ open, onClose, onConfirm, reportName, loading }: DeleteReportDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Delete Report">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
        <p style={{ color: '#8b9bb5', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
          Are you sure you want to delete <strong style={{ color: '#e6ecf5' }}>{reportName}</strong>?
        </p>
        <p style={{ color: '#ef4444', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          This action cannot be undone. Any associated scheduled deliveries will also be removed.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
        </div>
      </div>
    </Dialog>
  );
}
