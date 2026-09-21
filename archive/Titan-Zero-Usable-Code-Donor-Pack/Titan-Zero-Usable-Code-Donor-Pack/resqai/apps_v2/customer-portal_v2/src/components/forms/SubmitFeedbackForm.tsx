import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Card, Form, Input, Button, Dropdown } from '../../../../shared/src/components';
import type { DropdownOption } from '../../../../shared/src/components';
import { FeedbackCategory } from '../../models/dto';
import { CustomerService } from '../../services/customer-service';
import type { SubmitFeedbackRequest } from '../../models/api-requests';

interface SubmitFeedbackFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  relatedAppointmentId?: string;
  relatedTicketId?: string;
}

const categoryOptions: DropdownOption[] = [
  { value: FeedbackCategory.Service, label: 'Service Quality' },
  { value: FeedbackCategory.Technician, label: 'Technician' },
  { value: FeedbackCategory.Billing, label: 'Billing' },
  { value: FeedbackCategory.Support, label: 'Support' },
  { value: FeedbackCategory.General, label: 'General' },
];

export function SubmitFeedbackForm({ onSuccess, onCancel, relatedAppointmentId, relatedTicketId }: SubmitFeedbackFormProps) {
  const [category, setCategory] = useState(FeedbackCategory.Service);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const req: SubmitFeedbackRequest = { category, rating, comment, relatedAppointmentId, relatedTicketId };
      await CustomerService.submitFeedback(req);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding="md">
      <Form onSubmit={handleSubmit} layout="vertical">
        <Dropdown options={categoryOptions} value={category} onChange={setCategory} label="Category" />

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8b9bb5', marginBottom: 8 }}>Rating</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: star <= rating ? '#f0b429' : '#243049', padding: '0 2px' }}>
                ★
              </button>
            ))}
          </div>
        </div>

        <Input label="Comments" value={comment} onChange={(e: ChangeEvent<HTMLInputElement>) => setComment(e.target.value)} placeholder="Share your experience..." multiline rows={3} />

        {error && <div style={{ color: '#e74c3c', fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" loading={submitting}>Submit Feedback</Button>
        </div>
      </Form>
    </Card>
  );
}