import { useState, type FC } from 'react';
import { Card, Button, Input, Dropdown } from '@resqai/foundation';
import type { DropdownOption } from '@resqai/foundation';
import type { ResolutionType } from '../models/dto';

interface ResolutionFormProps {
  caseId: string;
  onSubmit: (data: { type: ResolutionType; resolution: string; notes?: string; amount?: number }) => void;
  submitting: boolean;
}

const resolutionTypeOptions: DropdownOption[] = [
  { value: 'full_refund', label: 'Full Refund' },
  { value: 'partial_refund', label: 'Partial Refund' },
  { value: 'rework', label: 'Rework' },
  { value: 'credit', label: 'Credit' },
  { value: 'apology', label: 'Apology' },
  { value: 'other', label: 'Other' },
];

export const ResolutionForm: FC<ResolutionFormProps> = ({ caseId, onSubmit, submitting }) => {
  const [type, setType] = useState<ResolutionType>('partial_refund');
  const [resolution, setResolution] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    if (!resolution.trim()) return;
    onSubmit({
      type,
      resolution,
      notes: notes || undefined,
      amount: amount ? parseFloat(amount) : undefined,
    });
  };

  return (
    <Card variant="bordered" style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#e6ecf5' }}>Create Resolution</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#8b9bb5', marginBottom: 4 }}>Resolution Type</label>
          <Dropdown options={resolutionTypeOptions} value={type} onChange={(v) => setType(v as ResolutionType)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#8b9bb5', marginBottom: 4 }}>Resolution Details</label>
          <Input as="textarea" value={resolution} onChange={setResolution} placeholder="Describe the proposed resolution..." multiline rows={4} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#8b9bb5', marginBottom: 4 }}>Amount (if applicable)</label>
          <Input type="number" value={amount} onChange={setAmount} placeholder="0.00" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#8b9bb5', marginBottom: 4 }}>Notes (internal)</label>
          <Input as="textarea" value={notes} onChange={setNotes} placeholder="Internal notes..." multiline rows={2} />
        </div>
        <Button onClick={handleSubmit} loading={submitting} disabled={!resolution.trim()}>Submit Resolution</Button>
      </div>
    </Card>
  );
};
