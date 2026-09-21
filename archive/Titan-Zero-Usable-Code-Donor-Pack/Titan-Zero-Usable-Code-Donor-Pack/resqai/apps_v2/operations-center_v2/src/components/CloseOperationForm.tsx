import { useState, type FC } from 'react';
import { Button, Input } from '@resqai/foundation';
import type { OperationDTO } from '../models/dto';

interface CloseOperationFormProps {
  operation?: OperationDTO;
  onSubmit: (operationId: string, resolution: string, actualDuration?: number) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const CloseOperationForm: FC<CloseOperationFormProps> = ({ operation, onSubmit, onCancel, loading }) => {
  const [resolution, setResolution] = useState('');
  const [actualDuration, setActualDuration] = useState(operation?.estimatedDuration?.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!resolution.trim()) errs.resolution = 'Resolution summary is required';
    if (actualDuration && isNaN(Number(actualDuration))) errs.actualDuration = 'Must be a number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate() && operation) {
      onSubmit(operation.id, resolution, actualDuration ? Number(actualDuration) : undefined);
    }
  };

  return (
    <div role="form" aria-label="Close operation form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: '#e6ecf5', fontSize: 13 }}>
        Closing: <strong>{operation?.title || '\u2014'}</strong>
      </div>
      <div>
        <label htmlFor="resolution" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>Resolution Summary *</label>
        <textarea
          id="resolution"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 6,
            background: '#0f1729', border: '1px solid #243049',
            color: '#e6ecf5', fontSize: 13, minHeight: 80, resize: 'vertical',
            fontFamily: 'inherit',
          }}
          placeholder="Describe how the operation was resolved..."
          aria-label="Resolution summary"
        />
        {errors.resolution && <span style={{ color: '#f87171', fontSize: 12 }} role="alert">{errors.resolution}</span>}
      </div>
      <div>
        <label htmlFor="duration" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>Actual Duration (minutes)</label>
        <Input
          id="duration"
          value={actualDuration}
          onChange={setActualDuration}
          placeholder="e.g. 180"
          type="number"
          aria-label="Actual duration in minutes"
        />
        {errors.actualDuration && <span style={{ color: '#f87171', fontSize: 12 }} role="alert">{errors.actualDuration}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading} aria-label="Confirm close">{loading ? 'Closing...' : 'Close Operation'}</Button>
      </div>
    </div>
  );
};
