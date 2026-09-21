import { type FC } from 'react';
import { Card, Button, StatusBadge, Tabs, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import type { Tab } from '@resqai/foundation';
import { useJobDetail } from '../hooks/useJobDetail';
import { PermissionGuard } from '../components/PermissionGuard';
import { TECHNICIAN_PORTAL_PERMISSIONS } from '../contracts/permissions';

const detailTabs: Tab[] = [
  { id: 'details', label: 'Details' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'notes', label: 'Notes' },
  { id: 'parts', label: 'Parts' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'timeline', label: 'Timeline' },
];

interface JobDetailPageProps { jobId: string; }

export const JobDetailPage: FC<JobDetailPageProps> = ({ jobId }) => {
  const { detail, loading, error, refetch } = useJobDetail(jobId);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton variant="text" width={300} height={32} style={{ marginBottom: 16 }} />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <ErrorState title="Failed to load job" message={error} onRetry={refetch} />
      </div>
    );
  }

  if (!detail) {
    return <div style={{ padding: 24 }}><EmptyState title="Job not found" description="The requested job could not be found." /></div>;
  }

  const { job, customer } = detail;
  const urgencyColor = job.priority === 'urgent' ? '#ff6b6b' : job.priority === 'high' ? '#f0c040' : job.priority === 'normal' ? '#4ecdc4' : '#8b9bb5';

  const handleNavigate = (path: string) => { window.location.hash = `#/jobs/${jobId}/${path}`; };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = '#/today'; }} style={{ marginBottom: 12 }}>
        &larr; Back
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: urgencyColor }} />
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e6ecf5' }}>{job.title}</h1>
          </div>
          <div style={{ fontSize: 12, color: '#8b9bb5' }}>
            Job #{jobId} &middot; {customer.name} &middot; {customer.address}, {customer.city}
          </div>
        </div>
        <StatusBadge variant={job.status === 'completed' ? 'success' : job.status === 'escalated' ? 'error' : 'info'}>
          {job.status.replace('_', ' ')}
        </StatusBadge>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.VIEW_JOBS}>
          <Button size="sm" variant="ghost" onClick={() => handleNavigate('navigation')}>Directions</Button>
        </PermissionGuard>
        <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.VIEW_JOB_DETAIL}>
          <Button size="sm" variant="ghost" onClick={() => handleNavigate('customer')}>Customer Info</Button>
        </PermissionGuard>
        <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.UPDATE_PROGRESS}>
          <Button size="sm" variant="ghost" onClick={() => handleNavigate('checklist')}>Checklist</Button>
        </PermissionGuard>
        <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.ADD_NOTES}>
          <Button size="sm" variant="ghost" onClick={() => handleNavigate('notes')}>Add Notes</Button>
        </PermissionGuard>
        <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.UPLOAD_PHOTOS}>
          <Button size="sm" variant="ghost" onClick={() => handleNavigate('photos')}>Photos</Button>
        </PermissionGuard>
        <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.UPLOAD_VIDEOS}>
          <Button size="sm" variant="ghost" onClick={() => handleNavigate('videos')}>Video</Button>
        </PermissionGuard>
        <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.CAPTURE_SIGNATURE}>
          <Button size="sm" variant="ghost" onClick={() => handleNavigate('signature')}>Signature</Button>
        </PermissionGuard>
        <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.USE_PARTS}>
          <Button size="sm" variant="ghost" onClick={() => handleNavigate('parts')}>Parts Used</Button>
        </PermissionGuard>
        <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.REQUEST_INVENTORY}>
          <Button size="sm" variant="ghost" onClick={() => handleNavigate('inventory')}>Request Parts</Button>
        </PermissionGuard>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(job.status === 'assigned' || job.status === 'en_route' || job.status === 'on_site') && (
          <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.PAUSE_JOB}>
            <Button size="sm" variant="ghost" onClick={() => handleNavigate('pause')}>Pause Job</Button>
          </PermissionGuard>
        )}
        {job.status === 'paused' && (
          <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.RESUME_JOB}>
            <Button size="sm" variant="primary" onClick={() => handleNavigate('resume')}>Resume Job</Button>
          </PermissionGuard>
        )}
        <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.ESCALATE_JOB}>
          <Button size="sm" variant="danger" onClick={() => handleNavigate('escalate')}>Escalate</Button>
        </PermissionGuard>
        <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.COMPLETE_JOB}>
          <Button size="sm" variant="primary" onClick={() => handleNavigate('complete')}>Complete Job</Button>
        </PermissionGuard>
      </div>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Service Type</span>
            <p style={{ margin: '4px 0', color: '#e6ecf5' }}>{job.serviceType.replace('_', ' ')}</p>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Priority</span>
            <p style={{ margin: '4px 0', color: urgencyColor }}>{job.priority}</p>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Scheduled</span>
            <p style={{ margin: '4px 0', color: '#e6ecf5' }}>{new Date(job.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(job.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Duration</span>
            <p style={{ margin: '4px 0', color: '#e6ecf5' }}>{job.estimatedDuration} minutes</p>
          </div>
        </div>
      </Card>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 8px' }}>Description</h3>
        <p style={{ fontSize: 13, color: '#8b9bb5', lineHeight: 1.5, margin: 0 }}>{job.description}</p>
      </Card>

      <Tabs tabs={detailTabs} activeId="details" onChange={() => {}} />

      <div style={{ marginTop: 16 }}>
        {detail.timeline.map(event => (
          <div key={event.id} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#41d1c4', marginTop: 4, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#e6ecf5' }}>{event.description}</p>
              <span style={{ fontSize: 11, color: '#5a6a85' }}>{event.actorName} &middot; {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Button variant="ghost" onClick={() => { window.location.hash = '#/messages'; }}>Messages ({detail.messages.filter(m => !m.read).length})</Button>
      </div>
    </div>
  );
};
