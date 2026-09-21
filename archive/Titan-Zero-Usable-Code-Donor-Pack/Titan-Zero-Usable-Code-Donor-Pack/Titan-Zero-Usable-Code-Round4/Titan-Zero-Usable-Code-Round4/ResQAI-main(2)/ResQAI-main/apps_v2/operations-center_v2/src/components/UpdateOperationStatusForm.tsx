import { useState, type FC } from 'react';
import { Button, Dropdown } from '@resqai/foundation';
import type { OperationDTO, OperationStatus } from '../models/dto';

interface UpdateOperationStatusFormProps {
  operation?: OperationDTO;
  onSubmit: (operationId: string, status: OperationStatus, notes?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

const statusOptions: { label: string; value: OperationStatus }[] = [
  { label: 'Pending Dispatch', value: 'pending_dispatch' },
  { label: 'Dispatched', value: 'dispatched' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Escalated', value: 'escalated' },
];

export const UpdateOperationStatusForm: FC<UpdateOperationStatusFormProps> = ({ operation, onSubmit, onCancel, loading }) => {
  const [newStatus, setNewStatus] = useState<OperationStatus>(operation?.status || 'pending_dispatch');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!newStatus) errs.newStatus = 'Status is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate() && operation) {
      onSubmit(operation.id, newStatus, notes || undefined);
    }
  };

  return (
    <div role="form" aria-label="Update operation status form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: '#e6ecf5', fontSize: 13 }}>
        Updating: <strong>{operation?.title || '\u2014'}</strong>
      </div>
      <div style={{ color: '#8b9bb5', fontSize: 13 }}>
        Current status: <span style={{ color: '#c8d0dc', textTransform: 'capitalize' }}>{(operation?.status || '').replace('_', ' ')}</span>
      </div>
      <div>
        <label htmlFor="newStatus" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>New Status *</label>
        <Dropdown
          id="newStatus"
          value={newStatus}
          onChange={(v) => setNewStatus(v as OperationStatus)}
          options={statusOptions.map(s => ({ label: s.label, value: s.value }))}
          aria-label="Select new status"
        />
        {errors.newStatus && <span style={{ color: '#f87171', fontSize: 12 }} role="alert">{errors.newStatus}</span>}
      </div>
      <div>
        <label htmlFor="statusNotes" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>Notes</label>
        <textarea
          id="statusNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 6,
            background: '#0f1729', border: '1px solid #243049',
            color: '#e6ecf5', fontSize: 13, minHeight: 60, resize: 'vertical',
            fontFamily: 'inherit',
          }}
          aria-label="Status change notes"
        />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading} aria-label="Confirm status change">{loading ? 'Updating...' : 'Update Status'}</Button>
      </div>
    </div>
  );
};
