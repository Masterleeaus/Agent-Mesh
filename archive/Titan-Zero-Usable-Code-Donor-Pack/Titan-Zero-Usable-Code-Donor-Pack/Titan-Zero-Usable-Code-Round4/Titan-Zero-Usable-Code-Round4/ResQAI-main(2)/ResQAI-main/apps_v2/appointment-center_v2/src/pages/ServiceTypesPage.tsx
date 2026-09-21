import { useState } from 'react';
import { Card, Table, Button, Dialog, Form, Input, Dropdown, Skeleton, EmptyState, ErrorState } from '../../../shared/src/components';
import { useServiceTypes } from '../hooks';
import { appointmentService } from '../services';
import type { ServiceTypeDTO } from '../models/dto';

export function ServiceTypesPage() {
  const { services, loading, error, refetch } = useServiceTypes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceTypeDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', durationMinutes: 60, bufferMinutes: 15, requiredSkills: '' });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', durationMinutes: 60, bufferMinutes: 15, requiredSkills: '' });
    setDialogOpen(true);
  };

  const openEdit = (svc: ServiceTypeDTO) => {
    setEditing(svc);
    setForm({
      name: svc.name,
      description: svc.description,
      durationMinutes: svc.durationMinutes,
      bufferMinutes: svc.bufferMinutes,
      requiredSkills: svc.requiredSkills.join(', '),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        durationMinutes: form.durationMinutes,
        bufferMinutes: form.bufferMinutes,
        requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (editing) {
        await appointmentService.updateServiceType(editing.id, payload);
      } else {
        await appointmentService.createServiceType(payload);
      }
      setDialogOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return <ErrorState title="Failed to load service types" message={error} onRetry={refetch} />;
  }

  const columns = [
    { key: 'name', header: 'Name', width: '1fr' },
    { key: 'description', header: 'Description', width: '2fr' },
    { key: 'durationMinutes', header: 'Duration', width: '80px' },
    { key: 'bufferMinutes', header: 'Buffer', width: '80px' },
    { key: 'requiredSkills', header: 'Skills', width: '1fr' },
    { key: 'actions', header: '', width: '60px' },
  ];

  const data = services.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: `${s.durationMinutes}m`,
    bufferMinutes: `${s.bufferMinutes}m`,
    requiredSkills: s.requiredSkills.join(', '),
    actions: <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>Edit</Button>,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Service Types</h2>
        <Button onClick={openNew}>Add Service Type</Button>
      </div>
      <Card padding="md" variant="elevated">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="text" height={40} />)}
          </div>
        ) : data.length === 0 ? (
          <EmptyState title="No service types defined" description="Create your first service type to get started." action={<Button onClick={openNew}>Add Service Type</Button>} />
        ) : (
          <Table columns={columns} data={data} />
        )}
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? 'Edit Service Type' : 'New Service Type'}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. AC Repair" />
          <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
          <div style={{ display: 'flex', gap: 12 }}>
            <Input label="Duration (min)" type="number" value={String(form.durationMinutes)} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
            <Input label="Buffer (min)" type="number" value={String(form.bufferMinutes)} onChange={e => setForm({ ...form, bufferMinutes: Number(e.target.value) })} />
          </div>
          <Input label="Required Skills (comma-separated)" value={form.requiredSkills} onChange={e => setForm({ ...form, requiredSkills: e.target.value })} placeholder="e.g. hvac, electrical" />
        </div>
      </Dialog>
    </div>
  );
}
