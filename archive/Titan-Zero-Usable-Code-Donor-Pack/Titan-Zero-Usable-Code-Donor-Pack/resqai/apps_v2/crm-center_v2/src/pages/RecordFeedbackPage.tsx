import { useState } from 'react';
import { Card, Button, Input, Dropdown, Form } from '../../../../shared/src/components';
import { navigate } from '../../state/AppContext';

export default function RecordFeedbackPage() {
  const [form, setForm] = useState({ customerName: '', category: 'service', sentiment: 'positive', rating: 5, subject: '', description: '', source: 'manual' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { navigate('/feedback'); }, 500);
  };

  const update = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/feedback')}>← Back</Button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Record Feedback</h1>
      </div>
      <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <Form onSubmit={handleSubmit} spacing="normal" layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Customer *</label>
              <Input value={form.customerName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('customerName', e.target.value)} placeholder="Customer name" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Category *</label>
              <Dropdown options={[{ value: 'service', label: 'Service' }, { value: 'support', label: 'Support' }, { value: 'product', label: 'Product' }, { value: 'billing', label: 'Billing' }, { value: 'general', label: 'General' }]} value={form.category} onChange={(v: string) => update('category', v)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Sentiment *</label>
              <Dropdown options={[{ value: 'positive', label: 'Positive' }, { value: 'neutral', label: 'Neutral' }, { value: 'negative', label: 'Negative' }]} value={form.sentiment} onChange={(v: string) => update('sentiment', v)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Rating *</label>
              <Dropdown options={[1, 2, 3, 4, 5].map(n => ({ value: n, label: `${n}/5` }))} value={form.rating} onChange={(v: number) => update('rating', v)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Subject *</label>
              <Input value={form.subject} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('subject', e.target.value)} placeholder="Feedback subject" required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>Description</label>
              <textarea value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('description', e.target.value)} placeholder="Detailed feedback..." style={{ width: '100%', minHeight: 100, padding: '8px 12px', borderRadius: 6, background: '#0b1220', border: '1px solid #243049', color: '#e6ecf5', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="ghost" onClick={() => navigate('/feedback')}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Record Feedback</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
