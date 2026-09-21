import { useState, type FC } from 'react';
import { Card, Button, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { useJobDetail } from '../hooks/useJobDetail';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';

interface ServiceNotesPageProps { jobId: string; }

const categories = ['observation', 'diagnosis', 'resolution', 'recommendation', 'customer_request', 'other'] as const;

export const ServiceNotesPage: FC<ServiceNotesPageProps> = ({ jobId }) => {
  const { detail, loading, error, refetch } = useJobDetail(jobId);
  const { addNotification } = useAppContext();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('observation');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await technicianService.addNotes(jobId, { content: content.trim(), category: category as typeof categories[number] });
      addNotification({ type: 'success', title: 'Note added', message: 'Service note has been saved.' });
      setContent('');
      refetch();
    } catch {
      addNotification({ type: 'error', title: 'Failed to add note', message: 'Could not save the service note.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={300} /></div>;
  if (error) return <div style={{ padding: 24 }}><ErrorState title="Failed to load notes" message={error} onRetry={refetch} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Service Notes</h1>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Add Note</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', background: '#131c2f', color: '#e6ecf5',
              border: '1px solid #243049', borderRadius: 6, fontSize: 13,
            }}
          >
            {categories.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Enter your service note..."
          rows={4}
          style={{
            width: '100%', padding: 10, background: '#131c2f', color: '#e6ecf5',
            border: '1px solid #243049', borderRadius: 6, fontSize: 13, resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
          aria-label="Service note content"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          loading={submitting}
          style={{ marginTop: 8 }}
        >
          Save Note
        </Button>
      </Card>

      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Previous Notes</h3>
      {detail && detail.notes.length === 0 ? (
        <EmptyState title="No notes" description="No service notes have been added yet." size="sm" />
      ) : (
        detail?.notes.map(note => (
          <Card key={note.id} variant="bordered" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#41d1c4', textTransform: 'uppercase' }}>{note.category}</span>
              <span style={{ fontSize: 11, color: '#5a6a85' }}>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#8b9bb5', lineHeight: 1.5 }}>{note.content}</p>
            <span style={{ fontSize: 11, color: '#5a6a85', marginTop: 4, display: 'block' }}>{note.technicianName}</span>
          </Card>
        ))
      )}
    </div>
  );
};
