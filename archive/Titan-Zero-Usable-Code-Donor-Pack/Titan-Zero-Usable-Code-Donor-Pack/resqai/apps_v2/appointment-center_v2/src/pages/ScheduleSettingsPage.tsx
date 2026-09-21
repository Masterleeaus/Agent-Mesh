import { useState, useEffect } from 'react';
import { Card, Form, Button, Input, Dropdown, Skeleton } from '../../../shared/src/components';
import { useScheduleSettings } from '../hooks';

export function ScheduleSettingsPage() {
  const { settings, loading, error, refetch } = useScheduleSettings();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(settings);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await new Promise(r => setTimeout(r, 500));
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Card padding="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton variant="text" height={40} />
            <Skeleton variant="text" height={40} />
            <Skeleton variant="text" height={40} />
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card padding="lg" style={{ textAlign: 'center' }}>
        <div style={{ color: '#ef4444', marginBottom: 8 }}>Failed to load settings</div>
        <Button variant="secondary" onClick={refetch}>Retry</Button>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Card padding="lg" variant="elevated">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Schedule Settings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Default Slot Duration (minutes)" type="number" value={String(form.defaultSlotDuration)} onChange={e => setForm({ ...form, defaultSlotDuration: Number(e.target.value) })} />
          <Input label="Default Buffer (minutes)" type="number" value={String(form.defaultBufferMinutes)} onChange={e => setForm({ ...form, defaultBufferMinutes: Number(e.target.value) })} />
          <Input label="Max Appointments Per Day" type="number" value={String(form.maxAppointmentsPerDay)} onChange={e => setForm({ ...form, maxAppointmentsPerDay: Number(e.target.value) })} />
          <Input label="Working Hours Start" value={form.workingHoursStart} onChange={e => setForm({ ...form, workingHoursStart: e.target.value })} />
          <Input label="Working Hours End" value={form.workingHoursEnd} onChange={e => setForm({ ...form, workingHoursEnd: e.target.value })} />
          {success && <div style={{ color: '#41d1c4', fontSize: 13 }}>Settings saved successfully!</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSave} loading={saving}>Save Settings</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
