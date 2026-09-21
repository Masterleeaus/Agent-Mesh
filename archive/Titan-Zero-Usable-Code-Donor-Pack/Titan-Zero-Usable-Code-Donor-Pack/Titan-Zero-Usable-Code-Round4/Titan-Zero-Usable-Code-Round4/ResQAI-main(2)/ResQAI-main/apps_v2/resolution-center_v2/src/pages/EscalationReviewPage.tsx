import { useState, type FC } from 'react';
import { Card, Button, Skeleton, EmptyState, ErrorState, StatusBadge, Pagination } from '@resqai/foundation';
import { useEscalations } from '../hooks/useEscalations';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

export const EscalationReviewPage: FC = () => {
  const [page, setPage] = useState(1);
  const { escalations, total, loading, error, refetch } = useEscalations({ page, pageSize: 25 });
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleNavigate = (caseId: string) => { window.location.hash = `#/disputes/${caseId}`; };

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_ESCALATIONS}>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Escalation Review</h1>

        {loading && (
          <div role="status" aria-label="Loading escalations">
            <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={80} style={{ marginBottom: 8 }} />)}
          </div>
        )}
        {error && <ErrorState title="Failed to load escalations" message={error} onRetry={refetch} />}
        {!loading && !error && escalations.length === 0 && <EmptyState title="No escalations" description="There are no escalated cases requiring review." />}

        {!loading && !error && escalations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {escalations.map(esc => (
              <Card key={esc.id} variant="bordered" style={{ padding: 16, cursor: 'pointer' }} onClick={() => handleNavigate(esc.caseId)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>Escalation — {esc.id}</span>
                      <StatusBadge variant={esc.status === 'pending_review' ? 'error' : esc.status === 'under_review' ? 'warning' : 'success'}>
                        {esc.status.replace(/_/g, ' ')}
                      </StatusBadge>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: 12, color: '#8b9bb5' }}>
                      From: {esc.escalatedByName} → To: {esc.escalatedToName} | Case: {esc.caseId}
                    </p>
                    <p style={{ margin: '4px 0', fontSize: 13, color: '#c0c8d8' }}>{esc.reason}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};
