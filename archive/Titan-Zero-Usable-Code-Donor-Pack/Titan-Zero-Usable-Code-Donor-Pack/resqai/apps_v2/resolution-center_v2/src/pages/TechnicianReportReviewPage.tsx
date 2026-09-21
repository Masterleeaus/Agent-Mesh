import { useState, type FC } from 'react';
import { Card, Button, Skeleton, EmptyState, ErrorState, StatusBadge } from '@resqai/foundation';
import type { TechnicianReportDTO } from '../models/dto';
import { resolutionService } from '../services/resolution-service';
import { useAppContext } from '../state/AppContext';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

interface TechnicianReportReviewPageProps {
  caseId: string;
}

export const TechnicianReportReviewPage: FC<TechnicianReportReviewPageProps> = ({ caseId }) => {
  const { addNotification } = useAppContext();
  const [reports, setReports] = useState<TechnicianReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  useState(() => {
    (async () => {
      try {
        const res = await resolutionService.listTechnicianReports();
        const filtered = res.data.filter(r => r.caseId === caseId);
        setReports(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  });

  const handleApprove = async (reportId: string) => {
    setApproving(reportId);
    try {
      await resolutionService.approveResolution({ resolutionId: reportId });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'approved' as const } : r));
      addNotification({ type: 'success', title: 'Report approved', message: 'Technician report has been approved.' });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (reportId: string) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await resolutionService.rejectResolution({ resolutionId: reportId, reason });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'rejected' as const } : r));
      addNotification({ type: 'warning', title: 'Report rejected', message: 'Technician report has been rejected.' });
    } catch { /* ignore */ }
  };

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/disputes/${caseId}`; }} style={{ marginBottom: 16 }}>← Back to Case</Button>
        <ErrorState title="Failed to load reports" message={error} onRetry={() => setError(null)} />
      </div>
    );
  }

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_TECHNICIAN_REPORTS}>
      <div style={{ padding: 24 }}>
        <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/disputes/${caseId}`; }} style={{ marginBottom: 16 }}>← Back to Case</Button>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Technician Report Review</h1>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8b9bb5' }}>Case: {caseId}</p>

        {loading && (
          <div role="status" aria-label="Loading">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={120} style={{ marginBottom: 8 }} />)}
          </div>
        )}

        {!loading && reports.length === 0 && (
          <EmptyState title="No reports found" description="No technician reports have been submitted for this case." />
        )}

        {!loading && reports.length > 0 && reports.map(report => (
          <Card key={report.id} variant="bordered" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#e6ecf5' }}>{report.summary}</h3>
              <StatusBadge variant={report.status === 'approved' ? 'success' : report.status === 'rejected' ? 'error' : 'info'}>
                {report.status}
              </StatusBadge>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 12, color: '#8b9bb5', display: 'block' }}>Technician</span>
                <span style={{ fontSize: 13, color: '#e6ecf5' }}>{report.technicianName}</span>
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#8b9bb5', display: 'block' }}>Date</span>
                <span style={{ fontSize: 13, color: '#e6ecf5' }}>{new Date(report.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Findings</span>
              <p style={{ margin: 0, fontSize: 13, color: '#c0c8d8' }}>{report.findings}</p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Actions Taken</span>
              <p style={{ margin: 0, fontSize: 13, color: '#c0c8d8' }}>{report.actionsTaken}</p>
            </div>
            {report.partsUsed.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Parts Used</span>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#c0c8d8' }}>
                  {report.partsUsed.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Recommendations</span>
              <p style={{ margin: 0, fontSize: 13, color: '#c0c8d8' }}>{report.recommendations}</p>
            </div>
            {report.status === 'submitted' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button size="sm" variant="primary" onClick={() => handleApprove(report.id)} loading={approving === report.id}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => handleReject(report.id)}>Reject</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </PermissionGuard>
  );
};
