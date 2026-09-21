import { useState } from 'react';
import { Card, Button, Input, Dropdown, Form } from '../../../../shared/src/components';
import { navigate } from '../../state/AppContext';
import type { CreateFollowupRequest } from '../../models/api-requests';

export default function NewFollowupPage() {
  const [form, setForm] = useState<CreateFollowupRequest>({
    accountId: '',
    customerId: '',
    type: 'call',
    subject: '',
    priority: 'medium',
    dueDate: '',
    owner: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      navigate('/followups');
    } catch {
      setSubmitting(false);
    }
  };

  const update = (field: keyof CreateFollowupRequest, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/followups')}>← Back</Button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>New Followup</h1>
      </div>
      <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <Form onSubmit={handleSubmit} spacing="normal" layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Account ID *</label>
              <Input value={form.accountId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('accountId', e.target.value)} placeholder="Account ID" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Customer ID</label>
              <Input value={form.customerId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('customerId', e.target.value)} placeholder="Customer ID" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Type *</label>
              <Dropdown
                options={[{ value: 'call', label: 'Call' }, { value: 'email', label: 'Email' }, { value: 'meeting', label: 'Meeting' }, { value: 'task', label: 'Task' }, { value: 'other', label: 'Other' }]}
                value={form.type}
                onChange={(v: string) => update('type', v)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Priority *</label>
              <Dropdown
                options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]}
                value={form.priority}
                onChange={(v: string) => update('priority', v)}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Subject *</label>
              <Input value={form.subject} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('subject', e.target.value)} placeholder="Followup subject" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Due Date *</label>
              <Input value={form.dueDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('dueDate', e.target.value)} type="date" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Owner *</label>
              <Input value={form.owner} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('owner', e.target.value)} placeholder="Assignee name" required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Notes</label>
              <textarea
                value={form.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('notes', e.target.value)}
                placeholder="Additional notes..."
                style={{
                  width: '100%', minHeight: 80, padding: '8px 12px', borderRadius: 6,
                  background: '#0b1220', border: '1px solid #243049', color: '#e6ecf5',
                  fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="ghost" onClick={() => navigate('/followups')}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Create Followup</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
