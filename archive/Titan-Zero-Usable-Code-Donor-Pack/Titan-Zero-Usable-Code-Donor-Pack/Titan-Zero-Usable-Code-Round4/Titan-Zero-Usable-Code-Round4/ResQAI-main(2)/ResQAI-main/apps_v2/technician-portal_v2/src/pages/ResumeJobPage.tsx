import { useState, type FC } from 'react';
import { Card, Button } from '@resqai/foundation';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';

interface ResumeJobPageProps { jobId: string; }

export const ResumeJobPage: FC<ResumeJobPageProps> = ({ jobId }) => {
  const { addNotification } = useAppContext();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleResume = async () => {
    setSubmitting(true);
    try {
      await technicianService.resumeJob(jobId, { notes: notes.trim() || undefined });
      addNotification({ type: 'success', title: 'Job resumed', message: 'Job has been resumed.' });
      window.location.hash = `#/jobs/${jobId}`;
    } catch {
      addNotification({ type: 'error', title: 'Failed to resume', message: 'Could not resume the job.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Resume Job</h1>
      <Card variant="bordered">
        <p style={{ fontSize: 13, color: '#8b9bb5', margin: '0 0 12px' }}>
          Resume this job to continue working on it.
        </p>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any notes about resuming..."
            rows={3}
            style={{
              width: '100%', padding: 10, background: '#131c2f', color: '#e6ecf5',
              border: '1px solid #243049', borderRadius: 6, fontSize: 13, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
            aria-label="Resume notes"
          />
        </div>
        <Button variant="primary" onClick={handleResume} disabled={submitting} loading={submitting}>
          Resume Job
        </Button>
      </Card>
    </div>
  );
};
