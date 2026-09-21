import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Form, Input, Button } from '../../../../shared/src/components';
import { CustomerService } from '../../services/customer-service';

interface UpdateTicketFormProps {
  ticketId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function UpdateTicketForm({ ticketId, onSuccess, onCancel }: UpdateTicketFormProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) { setError('Message cannot be empty.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await CustomerService.updateTicket({ ticketId, message });
      setMessage('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} layout="vertical">
      <Input label="Add a message" value={message} onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)} placeholder="Type your message here..." multiline rows={3} />
      {error && <div style={{ color: '#e74c3c', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="primary" loading={submitting}>Send</Button>
      </div>
    </Form>
  );
}