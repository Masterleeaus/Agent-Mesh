import { useState, type FC } from 'react';
import { Card, Button, Skeleton, EmptyState, ErrorState, Checkbox } from '@resqai/foundation';
import { useJobDetail } from '../hooks/useJobDetail';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';

interface JobChecklistPageProps { jobId: string; }

export const JobChecklistPage: FC<JobChecklistPageProps> = ({ jobId }) => {
  const { detail, loading, error, refetch } = useJobDetail(jobId);
  const { addNotification } = useAppContext();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (itemId: string, completed: boolean, checklistId: string) => {
    setUpdating(itemId);
    try {
      await technicianService.updateChecklistItem(jobId, { itemId, completed, notes: completed ? 'Completed by technician' : '' });
      addNotification({ type: 'success', title: 'Checklist updated', message: 'Checklist item status updated.' });
      refetch();
    } catch {
      addNotification({ type: 'error', title: 'Failed to update', message: 'Could not update checklist item.' });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={300} /></div>;
  if (error) return <div style={{ padding: 24 }}><ErrorState title="Failed to load checklist" message={error} onRetry={refetch} /></div>;
  if (!detail || !detail.checklist) return <div style={{ padding: 24 }}><EmptyState title="No checklist" description="This job has no checklist." /></div>;

  const { checklist } = detail;
  const total = checklist.items.length;
  const completed = checklist.items.filter(i => i.completed).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>{checklist.name}</h1>
      <p style={{ fontSize: 13, color: '#8b9bb5', margin: '0 0 16px' }}>{completed} of {total} items completed ({progress}%)</p>

      <div style={{ height: 6, background: '#1a2744', borderRadius: 3, marginBottom: 16 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#41d1c4', borderRadius: 3, transition: 'width 0.3s' }} />
      </div>

      <Card variant="bordered">
        {checklist.items.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
            borderBottom: '1px solid #1a2744',
          }}>
            <div style={{ marginTop: 2 }}>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleToggle(item.id, !item.completed, jobId)}
                disabled={updating === item.id}
                style={{ accentColor: '#41d1c4', width: 18, height: 18, cursor: 'pointer' }}
                aria-label={`Mark "${item.label}" as ${item.completed ? 'incomplete' : 'complete'}`}
              />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: 14, color: item.completed ? '#5a6a85' : '#e6ecf5',
                textDecoration: item.completed ? 'line-through' : 'none',
              }}>
                {item.label}
              </span>
              {item.required && <span style={{ fontSize: 11, color: '#f0c040', marginLeft: 6 }}>(required)</span>}
              {item.completedAt && (
                <span style={{ fontSize: 11, color: '#5a6a85', display: 'block', marginTop: 2 }}>
                  Done {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};
