import { useState, type FC } from 'react';
import { Card, Button, Skeleton, ErrorState } from '@resqai/foundation';
import { useJobDetail } from '../hooks/useJobDetail';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';

interface CompleteJobPageProps { jobId: string; }

export const CompleteJobPage: FC<CompleteJobPageProps> = ({ jobId }) => {
  const { detail, loading, error, refetch } = useJobDetail(jobId);
  const { addNotification } = useAppContext();
  const [completionNotes, setCompletionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!completionNotes.trim()) return;
    setSubmitting(true);
    try {
      await technicianService.completeJob(jobId, { completionNotes: completionNotes.trim() });
      addNotification({ type: 'success', title: 'Job completed', message: 'Job has been marked as completed.' });
      window.location.hash = `#/jobs/${jobId}`;
    } catch {
      addNotification({ type: 'error', title: 'Failed to complete', message: 'Could not complete the job.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={300} /></div>;
  if (error) return <div style={{ padding: 24 }}><ErrorState title="Failed to load" message={error} onRetry={refetch} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Complete Job</h1>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 4px' }}>{detail?.job.title}</h3>
        <p style={{ fontSize: 13, color: '#8b9bb5', margin: '0 0 16px' }}>{detail?.customer.name} &middot; {detail?.customer.address}</p>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>
            Completion Notes * <span style={{ color: '#5a6a85', fontWeight: 400 }}>(describe work performed)</span>
          </label>
          <textarea
            value={completionNotes}
            onChange={e => setCompletionNotes(e.target.value)}
            placeholder="Describe the work performed, any issues found, resolutions applied, and recommendations..."
            rows={5}
            style={{
              width: '100%', padding: 10, background: '#131c2f', color: '#e6ecf5',
              border: '1px solid #243049', borderRadius: 6, fontSize: 13, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
            aria-label="Completion notes"
          />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button variant="primary" onClick={handleComplete} disabled={!completionNotes.trim() || submitting} loading={submitting}>
            Complete Job
          </Button>
          <span style={{ fontSize: 11, color: '#5a6a85' }}>
            Make sure to capture signature and upload evidence first.
          </span>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Button variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}/signature`; }}>
          Capture Signature
        </Button>
        <Button variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}/photos`; }}>
          Upload Photos
        </Button>
        <Button variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}/notes`; }}>
          Add Notes
        </Button>
        <Button variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}/parts`; }}>
          Record Parts
        </Button>
      </div>
    </div>
  );
};
