import { Dialog, Button } from '../../../../shared/src/components';
import type { ExportFormat } from '../models/dto';

interface ExportConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  format: ExportFormat;
  loading?: boolean;
}

export function ExportConfirmationDialog({ open, onClose, onConfirm, format, loading }: ExportConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Confirm Export">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
        <p style={{ color: '#8b9bb5', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
          You are about to export analytics data as <strong style={{ color: '#e6ecf5', textTransform: 'uppercase' }}>{format}</strong>.
          This operation may take a few moments depending on data volume.
        </p>
        <p style={{ color: '#6b7a95', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          The exported file will be available for download from the Export Center once processing is complete.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} loading={loading}>Export</Button>
        </div>
      </div>
    </Dialog>
  );
}
