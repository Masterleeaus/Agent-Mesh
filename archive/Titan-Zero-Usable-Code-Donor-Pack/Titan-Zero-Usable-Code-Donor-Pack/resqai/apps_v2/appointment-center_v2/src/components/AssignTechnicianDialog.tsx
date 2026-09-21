import { useState } from 'react';
import { Dialog, Button, Dropdown } from '../../../shared/src/components';
import { useTechnicians } from '../hooks';

interface AssignTechnicianDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (technicianId: string) => void;
  currentTechnicianId?: string;
  submitting?: boolean;
}

export function AssignTechnicianDialog({ open, onClose, onConfirm, currentTechnicianId, submitting }: AssignTechnicianDialogProps) {
  const { technicians, loading } = useTechnicians();
  const [selectedId, setSelectedId] = useState(currentTechnicianId || '');
  const [error, setError] = useState('');

  const options = technicians.map(t => ({
    value: t.id,
    label: `${t.name} (${t.skills.slice(0, 2).join(', ')}) · ★${t.rating}`,
    description: `${t.activeAppointments} active · ${t.location}`,
  }));

  const handleConfirm = () => {
    if (!selectedId) {
      setError('Please select a technician');
      return;
    }
    onConfirm(selectedId);
  };

  const handleClose = () => {
    setSelectedId(currentTechnicianId || '');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Assign Technician"
      size="md"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm} loading={submitting}>Assign</Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Dropdown
          label="Select Technician"
          options={options}
          value={selectedId}
          onChange={v => { setSelectedId(v as string); setError(''); }}
          placeholder="Choose a technician..."
          searchable
          error={error}
        />
      </div>
    </Dialog>
  );
}
