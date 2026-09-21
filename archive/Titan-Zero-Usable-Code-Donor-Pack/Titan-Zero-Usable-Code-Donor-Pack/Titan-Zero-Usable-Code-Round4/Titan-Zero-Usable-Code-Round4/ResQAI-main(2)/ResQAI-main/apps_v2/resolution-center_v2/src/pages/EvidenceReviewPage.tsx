import { type FC } from 'react';
import { Card, Button, Skeleton, EmptyState, ErrorState, StatusBadge } from '@resqai/foundation';
import { useEvidence } from '../hooks/useEvidence';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

interface EvidenceReviewPageProps {
  caseId: string;
}

export const EvidenceReviewPage: FC<EvidenceReviewPageProps> = ({ caseId }) => {
  const { evidence, total, loading, error, refetch } = useEvidence(caseId);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/disputes/${caseId}`; }} style={{ marginBottom: 16 }}>← Back to Case</Button>
        <ErrorState title="Failed to load evidence" message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_EVIDENCE}>
      <div style={{ padding: 24 }}>
        <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/disputes/${caseId}`; }} style={{ marginBottom: 16 }}>← Back to Case</Button>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Evidence Review</h1>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8b9bb5' }}>Case: {caseId} | {total} items</p>

        {loading && (
          <div role="status" aria-label="Loading">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={80} style={{ marginBottom: 8 }} />)}
          </div>
        )}

        {!loading && evidence.length === 0 && (
          <EmptyState title="No evidence found" description="No evidence has been uploaded for this case." />
        )}

        {!loading && !error && evidence.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {evidence.map(ev => (
              <Card key={ev.id} variant="bordered" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>{ev.title}</span>
                      <StatusBadge variant="info" style={{ fontSize: 10 }}>{ev.type}</StatusBadge>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#8b9bb5' }}>Uploaded by {ev.uploadedByName} on {new Date(ev.createdAt).toLocaleDateString()}</p>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <Button size="sm" variant="primary" onClick={() => window.open(ev.url, '_blank')}>View</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};
