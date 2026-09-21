import { useState } from 'react';
import { useFeedback } from '../hooks/useFeedback';
import { SubmitFeedbackForm } from '../components/forms/SubmitFeedbackForm';
import { FeedbackConfirmationDialog } from '../components/dialogs/FeedbackConfirmationDialog';
import { Card, Rating, StatusBadge, Skeleton, EmptyState, ErrorState, Button } from '../../../shared/src/components';

export function FeedbackPage() {
  const { data, total, loading, error, submitting, submitFeedback } = useFeedback();
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmitSuccess = () => {
    setShowForm(false);
    setShowConfirm(true);
  };

  if (error) {
    return <ErrorState title="Failed to load feedback" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Feedback</h1>
        <Button variant="primary" onClick={() => setShowForm(true)}>Submit Feedback</Button>
      </div>

      {showForm && (
        <SubmitFeedbackForm onSuccess={handleSubmitSuccess} onCancel={() => setShowForm(false)} />
      )}

      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Your Feedback History</span>}>
        {loading ? (
          <Skeleton variant="table" />
        ) : data.length === 0 ? (
          <EmptyState title="No feedback yet" description="You haven't submitted any feedback. Share your experience!" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.map((fb) => (
              <div key={fb.id} style={{ padding: '12px 0', borderBottom: '1px solid #1a2744' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#8b9bb5', textTransform: 'capitalize' }}>{fb.category}</span>
                  <div>
                    {[1, 2, 3, 4, 5].map((s) => <span key={s} style={{ color: s <= fb.rating ? '#f0b429' : '#243049', fontSize: 14 }}>★</span>)}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#e6ecf5' }}>{fb.comment}</div>
                <div style={{ fontSize: 11, color: '#6b7b95', marginTop: 4 }}>{new Date(fb.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <FeedbackConfirmationDialog open={showConfirm} onClose={() => setShowConfirm(false)} />
    </div>
  );
}