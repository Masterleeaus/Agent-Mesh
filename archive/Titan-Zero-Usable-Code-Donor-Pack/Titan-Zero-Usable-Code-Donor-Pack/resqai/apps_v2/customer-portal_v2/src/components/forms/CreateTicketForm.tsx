import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Card, Form, Input, Button, Dropdown } from '../../../../shared/src/components';
import type { DropdownOption } from '../../../../shared/src/components';
import { RequestType, Channel } from '../../models/dto';
import { CustomerService } from '../../services/customer-service';
import type { CreateTicketRequest } from '../../models/api-requests';

interface CreateTicketFormProps {
  onSuccess: (ticketId: string) => void;
  onCancel: () => void;
}

const requestTypeOptions: DropdownOption[] = [
  { value: RequestType.Support, label: 'Support' },
  { value: RequestType.Billing, label: 'Billing' },
  { value: RequestType.Technical, label: 'Technical' },
  { value: RequestType.General, label: 'General' },
  { value: RequestType.Complaint, label: 'Complaint' },
];

const channelOptions: DropdownOption[] = [
  { value: Channel.Email, label: 'Email' },
  { value: Channel.Phone, label: 'Phone' },
  { value: Channel.Chat, label: 'Chat' },
  { value: Channel.Portal, label: 'Portal' },
];

export function CreateTicketForm({ onSuccess, onCancel }: CreateTicketFormProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState(RequestType.Support);
  const [channel, setChannel] = useState(Channel.Portal);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!subject.trim()) errs.push('Subject is required');
    if (!message.trim()) errs.push('Message is required');
    if (message.trim().length < 10) errs.push('Message must be at least 10 characters');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors([]);
    try {
      const req: CreateTicketRequest = { subject, message, requestType, channel, phone, email };
      const result = await CustomerService.createTicket(req);
      onSuccess(result.id);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to create ticket']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding="md">
      <Form onSubmit={handleSubmit} layout="vertical">
        <Input label="Subject" value={subject} onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)} required placeholder="Brief description of the issue" />
        <Input label="Message" value={message} onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)} required placeholder="Detailed description of your issue" multiline rows={4} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Dropdown options={requestTypeOptions} value={requestType} onChange={setRequestType} label="Request Type" />
          <Dropdown options={channelOptions} value={channel} onChange={setChannel} label="Preferred Contact Channel" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Phone" type="tel" value={phone} onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} placeholder="For callback" />
          <Input label="Email" type="email" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="For email updates" />
        </div>
        {errors.length > 0 && (
          <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid #e74c3c', borderRadius: 8, padding: 12 }}>
            {errors.map((err, i) => <div key={i} style={{ color: '#e74c3c', fontSize: 13 }}>{err}</div>)}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" loading={submitting}>Submit Ticket</Button>
        </div>
      </Form>
    </Card>
  );
}