import { useState, type FC } from 'react';
import { Card, Button, Skeleton, ErrorState } from '@resqai/foundation';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';

interface PauseJobPageProps { jobId: string; }

export const PauseJobPage: FC<PauseJobPageProps> = ({ jobId }) => {
  const { addNotification } = useAppContext();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePause = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await technicianService.pauseJob(jobId, { reason: reason.trim() });
      addNotification({ type: 'success', title: 'Job paused', message: 'Job has been paused.' });
      window.location.hash = `#/jobs/${jobId}`;
    } catch {
      addNotification({ type: 'error', title: 'Failed to pause', message: 'Could not pause the job.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Pause Job</h1>
      <Card variant="bordered">
        <p style={{ fontSize: 13, color: '#8b9bb5', margin: '0 0 12px' }}>
          Pausing this job will mark it as paused. You can resume it later.
        </p>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Reason for pausing *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Waiting for parts, customer requested break, etc."
            rows={3}
            style={{
              width: '100%', padding: 10, background: '#131c2f', color: '#e6ecf5',
              border: '1px solid #243049', borderRadius: 6, fontSize: 13, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
            aria-label="Pause reason"
          />
        </div>
        <Button variant="warning" onClick={handlePause} disabled={!reason.trim() || submitting} loading={submitting}>
          Pause Job
        </Button>
      </Card>
    </div>
  );
};
