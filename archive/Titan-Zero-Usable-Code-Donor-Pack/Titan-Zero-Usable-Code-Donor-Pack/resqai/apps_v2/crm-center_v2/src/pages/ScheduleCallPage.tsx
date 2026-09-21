import { useState } from 'react';
import { Card, Button, Input, Dropdown, Form } from '../../../../shared/src/components';
import { navigate } from '../../state/AppContext';

export default function ScheduleCallPage() {
  const [form, setForm] = useState({ customerName: '', subject: '', scheduledDate: '', duration: '30', notes: '', owner: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { navigate('/followups'); }, 500);
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/followups')}>← Back</Button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Schedule Call</h1>
      </div>
      <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <Form onSubmit={handleSubmit} spacing="normal" layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Customer *</label>
              <Input value={form.customerName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('customerName', e.target.value)} placeholder="Customer name" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Owner *</label>
              <Input value={form.owner} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('owner', e.target.value)} placeholder="Assigned to" required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Subject *</label>
              <Input value={form.subject} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('subject', e.target.value)} placeholder="Call subject" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Date & Time *</label>
              <input value={form.scheduledDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('scheduledDate', e.target.value)} type="datetime-local" required style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: '#0b1220', border: '1px solid #243049', color: '#e6ecf5', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Duration *</label>
              <Dropdown options={[{ value: '15', label: '15 min' }, { value: '30', label: '30 min' }, { value: '45', label: '45 min' }, { value: '60', label: '60 min' }]} value={form.duration} onChange={(v: string) => update('duration', v)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Notes</label>
              <textarea value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('notes', e.target.value)} placeholder="Call agenda and notes..." style={{ width: '100%', minHeight: 100, padding: '8px 12px', borderRadius: 6, background: '#0b1220', border: '1px solid #243049', color: '#e6ecf5', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="ghost" onClick={() => navigate('/followups')}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Schedule Call</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
