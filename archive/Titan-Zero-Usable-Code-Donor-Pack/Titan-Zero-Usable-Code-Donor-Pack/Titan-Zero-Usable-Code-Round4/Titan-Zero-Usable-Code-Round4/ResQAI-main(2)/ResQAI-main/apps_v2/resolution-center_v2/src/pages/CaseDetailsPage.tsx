import { useState, type FC } from 'react';
import { Card, Button, StatusBadge, Skeleton, EmptyState, ErrorState, Tabs, Dialog } from '@resqai/foundation';
import type { Tab } from '@resqai/foundation';
import { useCaseDetail } from '../hooks/useCaseDetail';
import { EvidenceViewer } from '../components/EvidenceViewer';
import { Timeline } from '../components/Timeline';
import { ResolutionForm } from '../components/ResolutionForm';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';
import { useAppContext } from '../state/AppContext';
import { resolutionService } from '../services/resolution-service';

interface CaseDetailsPageProps {
  caseId: string;
}

const detailTabs: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'activity', label: 'Activity' },
  { id: 'resolution', label: 'Resolution' },
];

export const CaseDetailsPage: FC<CaseDetailsPageProps> = ({ caseId }) => {
  const { detail, loading, error, refetch } = useCaseDetail(caseId);
  const { addNotification } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [submitting, setSubmitting] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [escReason, setEscReason] = useState('');
  const [closeResolution, setCloseResolution] = useState('');

  const handleCreateResolution = async (data: { type: import('../models/dto').ResolutionType; resolution: string; notes?: string; amount?: number }) => {
    setSubmitting(true);
    try {
      await resolutionService.createResolution({ caseId, ...data });
      addNotification({ type: 'success', title: 'Resolution created', message: 'Resolution has been submitted for approval.' });
      refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!escReason.trim()) return;
    try {
      await resolutionService.escalateCase({ caseId, reason: escReason, escalateTo: 'Operations Manager' });
      addNotification({ type: 'warning', title: 'Case escalated', message: 'Case has been escalated to Operations Manager.' });
      setShowEscalateDialog(false);
      setEscReason('');
      refetch();
    } catch { /* ignore */ }
  };

  const handleClose = async () => {
    if (!closeResolution.trim()) return;
    try {
      await resolutionService.closeCase({ caseId, resolution: closeResolution });
      addNotification({ type: 'success', title: 'Case closed', message: 'Case has been closed successfully.' });
      setShowCloseDialog(false);
      setCloseResolution('');
      refetch();
    } catch { /* ignore */ }
  };

  if (error) {
    return (
      <div style={{ padding: 24 }} role="alert">
        <Button size="sm" variant="ghost" onClick={() => { window.location.hash = '#/disputes'; }} style={{ marginBottom: 16 }}>← Back to Queue</Button>
        <ErrorState title="Failed to load case" message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = '#/disputes'; }} style={{ marginBottom: 16 }}>← Back to Queue</Button>

      {loading && (
        <div>
          <Skeleton variant="rectangular" height={40} style={{ marginBottom: 16 }} />
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} variant="text" style={{ marginBottom: 8 }} />)}
        </div>
      )}

      {!loading && detail && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e6ecf5' }}>{detail.case.summary}</h1>
              <p style={{ margin: '4px 0', fontSize: 13, color: '#8b9bb5' }}>Case #{caseId} | {detail.case.type.replace(/_/g, ' ')} | {detail.case.customerName}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <StatusBadge variant={detail.case.priority === 'critical' ? 'error' : detail.case.priority === 'high' ? 'warning' : 'info'}>
                {detail.case.priority}
              </StatusBadge>
              <StatusBadge variant={detail.case.status === 'closed' || detail.case.status === 'resolved' ? 'success' : detail.case.status === 'escalated' ? 'error' : 'info'}>
                {detail.case.status.replace(/_/g, ' ')}
              </StatusBadge>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.ESCALATE_CASE}>
              <Button size="sm" variant="danger" onClick={() => setShowEscalateDialog(true)}>Escalate</Button>
            </PermissionGuard>
            <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.CLOSE_CASE}>
              <Button size="sm" variant="ghost" onClick={() => setShowCloseDialog(true)}>Close Case</Button>
            </PermissionGuard>
          </div>

          <Tabs tabs={detailTabs} activeId={activeTab} onChange={setActiveTab} />

          <div style={{ marginTop: 16 }}>
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Card variant="bordered" style={{ padding: 16 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#e6ecf5' }}>Case Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    <span style={{ color: '#8b9bb5' }}>Type</span><span style={{ color: '#e6ecf5' }}>{detail.case.type.replace(/_/g, ' ')}</span>
                    <span style={{ color: '#8b9bb5' }}>Customer</span><span style={{ color: '#e6ecf5' }}>{detail.case.customerName}</span>
                    {detail.case.technicianName && <><span style={{ color: '#8b9bb5' }}>Technician</span><span style={{ color: '#e6ecf5' }}>{detail.case.technicianName}</span></>}
                    {detail.case.accountName && <><span style={{ color: '#8b9bb5' }}>Account</span><span style={{ color: '#e6ecf5' }}>{detail.case.accountName}</span></>}
                    <span style={{ color: '#8b9bb5' }}>Created</span><span style={{ color: '#e6ecf5' }}>{new Date(detail.case.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: '12px 0 0', fontSize: 13, color: '#c0c8d8' }}>{detail.case.description}</p>
                </Card>
                {detail.dispute && (
                  <Card variant="bordered" style={{ padding: 16 }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#e6ecf5' }}>Dispute Info</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                      <span style={{ color: '#8b9bb5' }}>Reason</span><span style={{ color: '#e6ecf5' }}>{detail.dispute.reason.replace(/_/g, ' ')}</span>
                      {detail.dispute.amount && <><span style={{ color: '#8b9bb5' }}>Amount</span><span style={{ color: '#e6ecf5' }}>${detail.dispute.amount}</span></>}
                      <span style={{ color: '#8b9bb5' }}>Status</span><span style={{ color: '#e6ecf5' }}>{detail.dispute.status.replace(/_/g, ' ')}</span>
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: 13, color: '#c0c8d8' }}>{detail.dispute.description}</p>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'evidence' && (
              <EvidenceViewer evidence={detail.evidence.map(e => ({ id: e.id, caseId: e.caseId, type: e.type, title: e.title, uploadedByName: e.uploadedByName, createdAt: e.createdAt }))} loading={false} />
            )}

            {activeTab === 'activity' && (
              <Timeline events={detail.timeline.map(t => ({ id: t.id, type: t.type, description: t.description, actorName: t.actorName, metadata: t.metadata, createdAt: t.createdAt }))} loading={false} />
            )}

            {activeTab === 'resolution' && (
              <div>
                {detail.resolution ? (
                  <Card variant="bordered" style={{ padding: 16 }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#e6ecf5' }}>Current Resolution</h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#c0c8d8' }}>{detail.resolution.resolution}</p>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <StatusBadge variant="info">{detail.resolution.type.replace(/_/g, ' ')}</StatusBadge>
                      <StatusBadge variant={detail.resolution.status === 'resolved' ? 'success' : 'warning'}>
                        {detail.resolution.status.replace(/_/g, ' ')}
                      </StatusBadge>
                    </div>
                  </Card>
                ) : (
                  <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.CREATE_RESOLUTION}>
                    <ResolutionForm caseId={caseId} onSubmit={handleCreateResolution} submitting={submitting} />
                  </PermissionGuard>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !detail && (
        <EmptyState title="Case not found" description={`Case ${caseId} could not be found.`} />
      )}

      <Dialog open={showEscalateDialog} onClose={() => setShowEscalateDialog(false)} title="Escalate Case">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5' }}>Escalation Reason</label>
          <textarea
            value={escReason}
            onChange={(e) => setEscReason(e.target.value)}
            placeholder="Describe why this case needs escalation..."
            style={{ width: '100%', minHeight: 80, background: '#0f1729', border: '1px solid #243049', borderRadius: 6, color: '#e6ecf5', padding: 8, fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button size="sm" variant="ghost" onClick={() => setShowEscalateDialog(false)}>Cancel</Button>
            <Button size="sm" variant="danger" onClick={handleEscalate} disabled={!escReason.trim()}>Confirm Escalation</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showCloseDialog} onClose={() => setShowCloseDialog(false)} title="Close Case">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5' }}>Resolution Summary</label>
          <textarea
            value={closeResolution}
            onChange={(e) => setCloseResolution(e.target.value)}
            placeholder="Describe how this case was resolved..."
            style={{ width: '100%', minHeight: 80, background: '#0f1729', border: '1px solid #243049', borderRadius: 6, color: '#e6ecf5', padding: 8, fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button size="sm" variant="ghost" onClick={() => setShowCloseDialog(false)}>Cancel</Button>
            <Button size="sm" variant="primary" onClick={handleClose} disabled={!closeResolution.trim()}>Confirm Close</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
