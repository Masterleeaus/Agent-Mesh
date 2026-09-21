import { useState, type FC } from 'react';
import { Card, Button, Skeleton, EmptyState, ErrorState, StatusBadge } from '@resqai/foundation';
import type { CustomerComplaintDTO } from '../models/dto';
import { resolutionService } from '../services/resolution-service';
import { useAppContext } from '../state/AppContext';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

interface CustomerComplaintReviewPageProps {
  caseId: string;
}

export const CustomerComplaintReviewPage: FC<CustomerComplaintReviewPageProps> = ({ caseId }) => {
  const { addNotification } = useAppContext();
  const [complaints, setComplaints] = useState<CustomerComplaintDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    (async () => {
      try {
        const res = await resolutionService.listCustomerComplaints();
        const filtered = res.data.filter(c => c.caseId === caseId);
        setComplaints(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  });

  const handleResolve = async (complaintId: string) => {
    try {
      await resolutionService.approveResolution({ resolutionId: complaintId });
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: 'resolved' as const } : c));
      addNotification({ type: 'success', title: 'Complaint resolved', message: 'Customer complaint has been marked as resolved.' });
    } catch { /* ignore */ }
  };

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/disputes/${caseId}`; }} style={{ marginBottom: 16 }}>← Back to Case</Button>
        <ErrorState title="Failed to load complaints" message={error} onRetry={() => setError(null)} />
      </div>
    );
  }

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_COMPLAINTS}>
      <div style={{ padding: 24 }}>
        <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/disputes/${caseId}`; }} style={{ marginBottom: 16 }}>← Back to Case</Button>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Customer Complaint Review</h1>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8b9bb5' }}>Case: {caseId}</p>

        {loading && (
          <div role="status" aria-label="Loading">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={120} style={{ marginBottom: 8 }} />)}
          </div>
        )}

        {!loading && complaints.length === 0 && (
          <EmptyState title="No complaints found" description="No customer complaints have been filed for this case." />
        )}

        {!loading && complaints.length > 0 && complaints.map(complaint => (
          <Card key={complaint.id} variant="bordered" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#e6ecf5' }}>{complaint.subject}</h3>
              <StatusBadge variant={complaint.status === 'resolved' ? 'success' : complaint.status === 'open' ? 'error' : 'warning'}>
                {complaint.status}
              </StatusBadge>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Description</span>
              <p style={{ margin: 0, fontSize: 13, color: '#c0c8d8' }}>{complaint.description}</p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Desired Outcome</span>
              <p style={{ margin: 0, fontSize: 13, color: '#c0c8d8' }}>{complaint.desiredOutcome}</p>
            </div>
            {complaint.status !== 'resolved' && complaint.status !== 'dismissed' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button size="sm" variant="primary" onClick={() => handleResolve(complaint.id)}>Mark Resolved</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </PermissionGuard>
  );
};
