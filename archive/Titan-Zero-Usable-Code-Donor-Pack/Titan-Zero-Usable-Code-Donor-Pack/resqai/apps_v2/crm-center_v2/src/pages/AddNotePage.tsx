import { useState } from 'react';
import { Card, Button, Input, Dropdown, Form } from '../../../../shared/src/components';
import { navigate } from '../../state/AppContext';

export default function AddNotePage() {
  const [form, setForm] = useState({ title: '', content: '', category: 'general', accountName: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { navigate('/notes'); }, 500);
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/notes')}>← Back</Button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Add Note</h1>
      </div>
      <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <Form onSubmit={handleSubmit} spacing="normal" layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Account</label>
              <Input value={form.accountName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('accountName', e.target.value)} placeholder="Account name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Category *</label>
              <Dropdown options={[{ value: 'general', label: 'General' }, { value: 'account', label: 'Account' }, { value: 'support', label: 'Support' }, { value: 'billing', label: 'Billing' }, { value: 'meeting', label: 'Meeting' }]} value={form.category} onChange={(v: string) => update('category', v)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Title *</label>
              <Input value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('title', e.target.value)} placeholder="Note title" required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Content *</label>
              <textarea value={form.content} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('content', e.target.value)} placeholder="Note content..." required style={{ width: '100%', minHeight: 150, padding: '8px 12px', borderRadius: 6, background: '#0b1220', border: '1px solid #243049', color: '#e6ecf5', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="ghost" onClick={() => navigate('/notes')}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Save Note</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
