import { type FC } from 'react';
import { Card, Button, StatusBadge, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { useDashboard } from '../hooks/useDashboard';
import { useAppContext } from '../state/AppContext';
import { PermissionGuard } from '../components/PermissionGuard';
import { TECHNICIAN_PORTAL_PERMISSIONS } from '../contracts/permissions';
import type { JobListItemVM } from '../models/view-models';

function JobCard({ job, onClick }: { job: JobListItemVM; onClick: () => void }) {
  const urgencyColor = job.priority === 'urgent' ? '#ff6b6b' : job.priority === 'high' ? '#f0c040' : '#8b9bb5';
  return (
    <Card variant="bordered" onClick={onClick} style={{ cursor: 'pointer', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: urgencyColor, flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: '#e6ecf5' }}>{job.title}</span>
          </div>
          <span style={{ fontSize: 12, color: '#8b9bb5' }}>{job.customerName}</span>
          <span style={{ fontSize: 12, color: '#5a6a85', marginLeft: 12 }}>{job.customerAddress}</span>
        </div>
        <StatusBadge variant={job.status === 'completed' ? 'success' : job.status === 'escalated' ? 'error' : 'info'}>
          {job.status.replace('_', ' ')}
        </StatusBadge>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: '#5a6a85' }}>
        <span>{new Date(job.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>{job.estimatedDuration} min</span>
        <span>{job.serviceType}</span>
      </div>
    </Card>
  );
}

export const DashboardPage: FC = () => {
  const { dashboard, loading, error, refetch } = useDashboard();
  const { networkStatus } = useAppContext();

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <ErrorState title="Failed to load dashboard" message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Dashboard</h1>
        {networkStatus === 'offline' && (
          <span style={{ fontSize: 12, color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', padding: '4px 12px', borderRadius: 4 }}>
            Offline Mode — Changes will sync when connected
          </span>
        )}
      </div>

      {loading ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={100} />)}
          </div>
          <Skeleton variant="rectangular" height={200} />
        </div>
      ) : dashboard ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <Card variant="bordered">
              <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Jobs</span>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#41d1c4', margin: '8px 0 0' }}>{dashboard.totalJobsToday}</p>
            </Card>
            <Card variant="bordered">
              <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</span>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#4ecdc4', margin: '8px 0 0' }}>{dashboard.completedJobsToday}</p>
            </Card>
            <Card variant="bordered">
              <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Rate</span>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#f0c040', margin: '8px 0 0' }}>{dashboard.completionRate}%</p>
            </Card>
            <Card variant="bordered">
              <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Urgent Jobs</span>
              <p style={{ fontSize: 28, fontWeight: 700, color: dashboard.urgentJobs.length > 0 ? '#ff6b6b' : '#4ecdc4', margin: '8px 0 0' }}>{dashboard.urgentJobs.length}</p>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Current Assignment</h2>
              {dashboard.currentJob ? (
                <JobCard job={dashboard.currentJob} onClick={() => { window.location.hash = `#/jobs/${dashboard.currentJob!.id}`; }} />
              ) : (
                <EmptyState title="No current job" description="You have no active job right now." size="sm" />
              )}

              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e6ecf5', margin: '16px 0 12px' }}>Next Appointment</h2>
              {dashboard.nextAppointment ? (
                <JobCard job={dashboard.nextAppointment} onClick={() => { window.location.hash = `#/jobs/${dashboard.nextAppointment!.id}`; }} />
              ) : (
                <EmptyState title="No upcoming appointments" description="No more jobs scheduled for today." size="sm" />
              )}
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Today's Schedule</h2>
              {dashboard.todayJobs.length === 0 ? (
                <EmptyState title="No jobs today" description="You have no jobs scheduled for today." size="sm" />
              ) : (
                dashboard.todayJobs.map(job => (
                  <JobCard key={job.id} job={job} onClick={() => { window.location.hash = `#/jobs/${job.id}`; }} />
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Card variant="bordered">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Urgent Jobs</h3>
              {dashboard.urgentJobs.length === 0 ? (
                <EmptyState title="No urgent jobs" description="All jobs are under control." size="sm" />
              ) : (
                dashboard.urgentJobs.map(job => (
                  <JobCard key={job.id} job={job} onClick={() => { window.location.hash = `#/jobs/${job.id}`; }} />
                ))
              )}
            </Card>
            <Card variant="bordered">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Alerts & Messages</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 0' }}>
                <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.VIEW_NOTIFICATIONS}>
                  <Button variant="ghost" onClick={() => { window.location.hash = '#/notifications'; }}>
                    Notifications ({dashboard.unreadNotifications})
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission={TECHNICIAN_PORTAL_PERMISSIONS.VIEW_MESSAGES}>
                  <Button variant="ghost" onClick={() => { window.location.hash = '#/messages'; }}>
                    Messages ({dashboard.unreadMessages})
                  </Button>
                </PermissionGuard>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <EmptyState title="No data" description="Dashboard data is not available." />
      )}
    </div>
  );
};
