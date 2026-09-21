import { useState, type FC } from 'react';
import { Button, Input, Dropdown } from '@resqai/foundation';
import type { TechnicianDTO, OperationDTO } from '../models/dto';

interface ReassignTechnicianFormProps {
  operation?: OperationDTO;
  technicians: TechnicianDTO[];
  onSubmit: (operationId: string, currentTechnicianId: string, newTechnicianId: string, reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ReassignTechnicianForm: FC<ReassignTechnicianFormProps> = ({ operation, technicians, onSubmit, onCancel, loading }) => {
  const [newTechnicianId, setNewTechnicianId] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableTechs = technicians.filter(t => t.isOnline && t.id !== operation?.technicianId);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!newTechnicianId) errs.newTechnicianId = 'New technician is required';
    if (!reason.trim()) errs.reason = 'Reason for reassignment is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate() && operation) {
      onSubmit(operation.id, operation.technicianId || '', newTechnicianId, reason);
    }
  };

  return (
    <div role="form" aria-label="Reassign technician form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: '#e6ecf5', fontSize: 13 }}>
        Reassigning: <strong>{operation?.title || '\u2014'}</strong>
      </div>
      {operation?.technicianName && (
        <div style={{ color: '#8b9bb5', fontSize: 13 }}>
          Current technician: <span style={{ color: '#c8d0dc' }}>{operation.technicianName}</span>
        </div>
      )}
      <div>
        <label htmlFor="newTech" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>New Technician *</label>
        <Dropdown
          id="newTech"
          value={newTechnicianId}
          onChange={setNewTechnicianId}
          options={availableTechs.map(t => ({ label: `${t.name} - ${t.region} (${t.status})`, value: t.id }))}
          placeholder="Select new technician"
          aria-label="Select new technician"
        />
        {errors.newTechnicianId && <span style={{ color: '#f87171', fontSize: 12 }} role="alert">{errors.newTechnicianId}</span>}
      </div>
      <div>
        <label htmlFor="reason" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>Reason *</label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 6,
            background: '#0f1729', border: '1px solid #243049',
            color: '#e6ecf5', fontSize: 13, minHeight: 60, resize: 'vertical',
            fontFamily: 'inherit',
          }}
          aria-label="Reassignment reason"
        />
        {errors.reason && <span style={{ color: '#f87171', fontSize: 12 }} role="alert">{errors.reason}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading} aria-label="Confirm reassignment">{loading ? 'Reassigning...' : 'Reassign'}</Button>
      </div>
    </div>
  );
};
