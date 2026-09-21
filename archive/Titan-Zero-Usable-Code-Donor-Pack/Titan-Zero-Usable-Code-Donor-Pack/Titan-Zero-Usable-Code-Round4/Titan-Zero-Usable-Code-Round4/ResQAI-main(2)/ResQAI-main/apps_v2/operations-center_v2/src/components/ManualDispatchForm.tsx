import { useState, type FC } from 'react';
import { Button, Input, Dropdown } from '@resqai/foundation';
import type { TechnicianDTO, OperationDTO } from '../models/dto';

interface ManualDispatchFormProps {
  operations: OperationDTO[];
  technicians: TechnicianDTO[];
  onSubmit: (operationId: string, technicianId: string, notes: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ManualDispatchForm: FC<ManualDispatchFormProps> = ({ operations, technicians, onSubmit, onCancel, loading }) => {
  const [operationId, setOperationId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pendingOps = operations.filter(op => op.status === 'pending_dispatch' || op.status === 'dispatched');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!operationId) errs.operationId = 'Operation is required';
    if (!technicianId) errs.technicianId = 'Technician is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(operationId, technicianId, notes);
    }
  };

  return (
    <div role="form" aria-label="Manual dispatch form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label htmlFor="operation" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>Operation *</label>
        <Dropdown
          id="operation"
          value={operationId}
          onChange={setOperationId}
          options={pendingOps.map(op => ({ label: `${op.id} - ${op.title}`, value: op.id }))}
          placeholder="Select operation"
          aria-label="Select operation"
        />
        {errors.operationId && <span style={{ color: '#f87171', fontSize: 12 }} role="alert">{errors.operationId}</span>}
      </div>
      <div>
        <label htmlFor="technician" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>Technician *</label>
        <Dropdown
          id="technician"
          value={technicianId}
          onChange={setTechnicianId}
          options={technicians.filter(t => t.isOnline).map(t => ({ label: `${t.name} - ${t.region} (${t.status})`, value: t.id }))}
          placeholder="Select technician"
          aria-label="Select technician"
        />
        {errors.technicianId && <span style={{ color: '#f87171', fontSize: 12 }} role="alert">{errors.technicianId}</span>}
      </div>
      <div>
        <label htmlFor="notes" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 6,
            background: '#0f1729', border: '1px solid #243049',
            color: '#e6ecf5', fontSize: 13, minHeight: 60, resize: 'vertical',
            fontFamily: 'inherit',
          }}
          aria-label="Dispatch notes"
        />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading} aria-label="Submit dispatch">{loading ? 'Dispatching...' : 'Dispatch'}</Button>
      </div>
    </div>
  );
};
