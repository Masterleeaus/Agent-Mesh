import { useState, type FC } from 'react';
import { Button, Input, Dropdown } from '@resqai/foundation';
import type { OperationDTO } from '../models/dto';

interface EscalateOperationFormProps {
  operation?: OperationDTO;
  onSubmit: (operationId: string, reason: string, escalateTo?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

const escalationTargets = [
  { label: 'Regional Manager', value: 'regional-manager' },
  { label: 'Operations Director', value: 'operations-director' },
  { label: 'VP of Operations', value: 'vp-operations' },
  { label: 'Executive Team', value: 'executive' },
];

export const EscalateOperationForm: FC<EscalateOperationFormProps> = ({ operation, onSubmit, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  const [escalateTo, setEscalateTo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!reason.trim()) errs.reason = 'Escalation reason is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate() && operation) {
      onSubmit(operation.id, reason, escalateTo || undefined);
    }
  };

  return (
    <div role="form" aria-label="Escalate operation form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: '#e6ecf5', fontSize: 13 }}>
        Escalating: <strong>{operation?.title || '\u2014'}</strong>
      </div>
      <div>
        <label htmlFor="escReason" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>Reason *</label>
        <textarea
          id="escReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 6,
            background: '#0f1729', border: '1px solid #243049',
            color: '#e6ecf5', fontSize: 13, minHeight: 80, resize: 'vertical',
            fontFamily: 'inherit',
          }}
          placeholder="Describe why this operation needs to be escalated..."
          aria-label="Escalation reason"
        />
        {errors.reason && <span style={{ color: '#f87171', fontSize: 12 }} role="alert">{errors.reason}</span>}
      </div>
      <div>
        <label htmlFor="escTo" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>Escalate To</label>
        <Dropdown
          id="escTo"
          value={escalateTo}
          onChange={setEscalateTo}
          options={escalationTargets}
          placeholder="Select recipient (optional)"
          aria-label="Select escalation target"
        />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading} aria-label="Confirm escalation">{loading ? 'Escalating...' : 'Escalate'}</Button>
      </div>
    </div>
  );
};
