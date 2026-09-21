import { useState } from 'react';
import { Card, Button, Input, Dropdown, Form } from '../../../../shared/src/components';
import { navigate } from '../../state/AppContext';

export default function CreateTaskPage() {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', assignee: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { navigate('/tasks'); }, 500);
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>← Back</Button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Create Task</h1>
      </div>
      <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <Form onSubmit={handleSubmit} spacing="normal" layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Title *</label>
              <Input value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('title', e.target.value)} placeholder="Task title" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Priority *</label>
              <Dropdown options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} value={form.priority} onChange={(v: string) => update('priority', v)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Due Date</label>
              <Input value={form.dueDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('dueDate', e.target.value)} type="date" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Assignee *</label>
              <Input value={form.assignee} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('assignee', e.target.value)} placeholder="Assignee name" required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Description</label>
              <textarea value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('description', e.target.value)} placeholder="Task description..." style={{ width: '100%', minHeight: 100, padding: '8px 12px', borderRadius: 6, background: '#0b1220', border: '1px solid #243049', color: '#e6ecf5', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="ghost" onClick={() => navigate('/tasks')}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Create Task</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
