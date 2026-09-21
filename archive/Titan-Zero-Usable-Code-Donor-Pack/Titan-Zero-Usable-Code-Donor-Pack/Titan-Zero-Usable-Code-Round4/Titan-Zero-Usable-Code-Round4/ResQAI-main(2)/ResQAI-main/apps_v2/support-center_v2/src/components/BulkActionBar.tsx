import { type FC } from 'react';
import { Button } from '@resqai/foundation';

interface BulkActionBarProps {
  selectedCount: number;
  onAssign: () => void;
  onEscalate: () => void;
  onClose: () => void;
  onClear: () => void;
}

export const BulkActionBar: FC<BulkActionBarProps> = ({ selectedCount, onAssign, onEscalate, onClose, onClear }) => {
  if (selectedCount === 0) return null;

  return (
    <div role="toolbar" aria-label={`${selectedCount} tickets selected`} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 8,
      background: '#131c2f', border: '1px solid #41d1c4',
      marginBottom: 12,
    }}>
      <span style={{ fontSize: 13, color: '#e6ecf5', fontWeight: 600 }}>{selectedCount} selected</span>
      <div style={{ flex: 1 }} />
      <Button size="sm" variant="outline" onClick={onAssign}>Assign</Button>
      <Button size="sm" variant="outline" onClick={onEscalate}>Escalate</Button>
      <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
      <Button size="sm" variant="ghost" onClick={onClear}>Clear</Button>
    </div>
  );
};
