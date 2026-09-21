import { useState, type FC, type FormEvent } from 'react';
import { Card, Form, Button, Input, Dropdown } from '@resqai/foundation';
import type { DropdownOption } from '@resqai/foundation';
import { ticketService } from '../services/ticket-service';
import { useAppContext } from '../state/AppContext';
import type { RequestType, Channel, Urgency } from '../models/dto';

const requestTypeOptions: DropdownOption<RequestType>[] = [
  { value: 'question', label: 'Question' },
  { value: 'problem', label: 'Problem' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'billing', label: 'Billing' },
  { value: 'other', label: 'Other' },
];

const channelOptions: DropdownOption<Channel>[] = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'chat', label: 'Chat' },
  { value: 'portal', label: 'Portal' },
  { value: 'social', label: 'Social' },
];

const urgencyOptions: DropdownOption<Urgency>[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const NewTicketPage: FC = () => {
  const { addNotification } = useAppContext();
  const [customerSearch, setCustomerSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('question');
  const [channel, setChannel] = useState<Channel>('phone');
  const [urgency, setUrgency] = useState<Urgency>('normal');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerResults, setCustomerResults] = useState<{ id: string; name: string }[]>([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!customerSearch.trim()) e.customerSearch = 'Customer is required';
    if (!subject.trim()) e.subject = 'Subject is required';
    if (!message.trim()) e.message = 'Message is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCustomerSearch = async (val: string) => {
    setCustomerSearch(val);
    if (val.trim().length >= 2) {
      const res = await ticketService.searchCustomers(val);
      setCustomerResults(res.data.map(c => ({ id: c.id, name: c.name })));
    } else {
      setCustomerResults([]);
    }
  };

  const selectCustomer = (id: string, name: string) => {
    setCustomerSearch(id);
    setSelectedCustomerName(name);
    setCustomerResults([]);
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await ticketService.create({
        customerId: customerSearch,
        subject,
        message,
        requestType,
        channel,
        urgency,
        phone: phone || undefined,
        email: email || undefined,
      });
      addNotification({ type: 'success', title: 'Ticket Created', message: `Ticket "${subject}" has been created.` });
      window.location.hash = '#/';
    } catch {
      setErrors({ submit: 'Failed to create ticket. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = '#/'; }} style={{ marginBottom: 16 }} aria-label="Back to queue">← Back to Queue</Button>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Create New Ticket</h1>

      <Card variant="elevated" role="form" aria-label="New ticket form">
        <Form onSubmit={handleSubmit} layout="vertical">
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label htmlFor="customer-search" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5', fontWeight: 500 }}>Customer Search *</label>
              <Input
                id="customer-search"
                value={customerSearch}
                onChange={e => handleCustomerSearch(e.target.value)}
                placeholder="Search customers..."
                error={errors.customerSearch}
                aria-describedby={errors.customerSearch ? 'customer-error' : undefined}
                aria-invalid={!!errors.customerSearch}
              />
              {errors.customerSearch && <span id="customer-error" style={{ color: '#f87171', fontSize: 11 }} role="alert">{errors.customerSearch}</span>}
              {customerResults.length > 0 && (
                <div style={{ background: '#131c2f', border: '1px solid #243049', borderRadius: 6, marginTop: 4 }}>
                  {customerResults.map(c => (
                    <div key={c.id} onClick={() => selectCustomer(c.id, c.name)} onKeyDown={e => { if (e.key === 'Enter') selectCustomer(c.id, c.name); }} role="option" tabIndex={0} aria-label={`Select customer ${c.name}`} style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#e6ecf5' }}>
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
              {selectedCustomerName && <span style={{ fontSize: 11, color: '#4ade80' }}>Selected: {selectedCustomerName}</span>}
            </div>

            <div>
              <label htmlFor="ticket-subject" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5', fontWeight: 500 }}>Subject *</label>
              <Input id="ticket-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ticket subject" error={errors.subject} aria-invalid={!!errors.subject} />
              {errors.subject && <span style={{ color: '#f87171', fontSize: 11 }} role="alert">{errors.subject}</span>}
            </div>

            <div>
              <label htmlFor="ticket-message" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5', fontWeight: 500 }}>Message *</label>
              <textarea
                id="ticket-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe the issue..."
                rows={5}
                aria-invalid={!!errors.message}
                style={{
                  width: '100%', padding: 10, borderRadius: 8, border: '1px solid #243049',
                  background: '#131c2f', color: '#e6ecf5', fontSize: 13, resize: 'vertical',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              {errors.message && <span style={{ color: '#f87171', fontSize: 11 }} role="alert">{errors.message}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="request-type" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5', fontWeight: 500 }}>Request Type</label>
                <Dropdown options={requestTypeOptions} value={requestType} onChange={v => setRequestType(v as RequestType)} />
              </div>
              <div>
                <label htmlFor="channel" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5', fontWeight: 500 }}>Channel</label>
                <Dropdown options={channelOptions} value={channel} onChange={v => setChannel(v as Channel)} />
              </div>
              <div>
                <label htmlFor="urgency" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5', fontWeight: 500 }}>Urgency</label>
                <Dropdown options={urgencyOptions} value={urgency} onChange={v => setUrgency(v as Urgency)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="phone" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5', fontWeight: 500 }}>Phone</label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel" />
              </div>
              <div>
                <label htmlFor="email" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5', fontWeight: 500 }}>Email</label>
                <Input id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" />
              </div>
            </div>

            {errors.submit && <div style={{ color: '#f87171', fontSize: 12, padding: 8, background: 'rgba(248,113,113,0.1)', borderRadius: 6 }} role="alert">{errors.submit}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={() => { window.location.hash = '#/' }}>Cancel</Button>
              <Button type="submit" loading={submitting}>Create Ticket</Button>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};
