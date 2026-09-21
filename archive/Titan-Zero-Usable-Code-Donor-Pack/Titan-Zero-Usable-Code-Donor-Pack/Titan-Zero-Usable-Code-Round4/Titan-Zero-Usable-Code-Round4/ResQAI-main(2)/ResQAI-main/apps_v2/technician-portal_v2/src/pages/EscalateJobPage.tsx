import { useState, type FC } from 'react';
import { Card, Button } from '@resqai/foundation';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';

interface EscalateJobPageProps { jobId: string; }

export const EscalateJobPage: FC<EscalateJobPageProps> = ({ jobId }) => {
  const { addNotification } = useAppContext();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEscalate = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await technicianService.escalateJob(jobId, { reason: reason.trim() });
      addNotification({ type: 'warning', title: 'Job escalated', message: 'Job has been escalated to Operations Manager.' });
      window.location.hash = `#/jobs/${jobId}`;
    } catch {
      addNotification({ type: 'error', title: 'Failed to escalate', message: 'Could not escalate the job.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Escalate Job</h1>
      <Card variant="bordered">
        <p style={{ fontSize: 13, color: '#ff6b6b', margin: '0 0 12px' }}>
          Escalating this job will notify operations management for immediate attention.
        </p>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Reason for escalation *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Requires supervisor approval, customer demanding manager, safety concern, etc."
            rows={4}
            style={{
              width: '100%', padding: 10, background: '#131c2f', color: '#e6ecf5',
              border: '1px solid #243049', borderRadius: 6, fontSize: 13, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
            aria-label="Escalation reason"
          />
        </div>
        <Button variant="danger" onClick={handleEscalate} disabled={!reason.trim() || submitting} loading={submitting}>
          Escalate Job
        </Button>
      </Card>
    </div>
  );
};
