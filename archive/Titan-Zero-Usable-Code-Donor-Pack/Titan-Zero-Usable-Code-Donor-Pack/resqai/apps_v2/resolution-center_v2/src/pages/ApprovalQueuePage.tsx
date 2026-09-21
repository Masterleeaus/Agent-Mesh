import { useState, type FC } from 'react';
import { Card, Button, Skeleton, EmptyState, ErrorState, StatusBadge, Pagination } from '@resqai/foundation';
import { useApprovals } from '../hooks/useApprovals';
import { resolutionService } from '../services/resolution-service';
import { useAppContext } from '../state/AppContext';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

export const ApprovalQueuePage: FC = () => {
  const { addNotification } = useAppContext();
  const [page, setPage] = useState(1);
  const { approvals, total, loading, error, refetch } = useApprovals({ page, pageSize: 25 });
  const totalPages = Math.max(1, Math.ceil(total / 25));
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await resolutionService.approveResolution({ resolutionId: id, comments: 'Approved by resolution specialist.' });
      addNotification({ type: 'success', title: 'Approved', message: 'Resolution has been approved.' });
      refetch();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    setActionLoading(id);
    try {
      await resolutionService.rejectResolution({ resolutionId: id, reason });
      addNotification({ type: 'warning', title: 'Rejected', message: 'Resolution has been rejected.' });
      refetch();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_APPROVALS}>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Approval Queue</h1>

        {loading && (
          <div role="status" aria-label="Loading">
            <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={80} style={{ marginBottom: 8 }} />)}
          </div>
        )}
        {error && <ErrorState title="Failed to load approvals" message={error} onRetry={refetch} />}
        {!loading && !error && approvals.length === 0 && <EmptyState title="No pending approvals" description="All approvals have been processed." />}

        {!loading && !error && approvals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approvals.map(a => (
              <Card key={a.id} variant="bordered" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>{a.type.replace(/_/g, ' ')} — {a.id}</span>
                      <StatusBadge variant={a.status === 'pending' ? 'warning' : a.status === 'approved' ? 'success' : 'error'}>
                        {a.status}
                      </StatusBadge>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: 12, color: '#8b9bb5' }}>Requested by {a.requestedByName} | Case: {a.caseId}</p>
                  </div>
                </div>
                {a.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.APPROVE_RESOLUTION}>
                      <Button size="sm" variant="primary" onClick={() => handleApprove(a.id)} loading={actionLoading === a.id}>Approve</Button>
                    </PermissionGuard>
                    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.REJECT_RESOLUTION}>
                      <Button size="sm" variant="danger" onClick={() => handleReject(a.id)} loading={actionLoading === a.id}>Reject</Button>
                    </PermissionGuard>
                  </div>
                )}
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
