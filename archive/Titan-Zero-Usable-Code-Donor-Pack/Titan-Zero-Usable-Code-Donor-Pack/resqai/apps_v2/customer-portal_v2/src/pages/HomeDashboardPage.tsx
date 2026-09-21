import { useDashboard } from '../hooks/useDashboard';
import { Card, StatusBadge, Skeleton, EmptyState, ErrorState, Loader } from '../../../shared/src/components';
import { AccountSummaryCard } from '../components/AccountSummaryCard';
import { AppointmentCard } from '../components/AppointmentCard';
import { HealthStatus } from '../models/dto';

export function HomeDashboardPage() {
  const { data, loading, error } = useDashboard();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Skeleton variant="rectangular" height={120} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Skeleton variant="rectangular" height={180} />
          <Skeleton variant="rectangular" height={180} />
          <Skeleton variant="rectangular" height={180} />
        </div>
        <Skeleton variant="rectangular" height={200} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={error}
        onRetry={() => window.location.reload()}
        retryLabel="Retry"
      />
    );
  }

  if (!data) {
    return <EmptyState title="No dashboard data" description="Could not retrieve your dashboard information." />;
  }

  const statusVariant: Record<HealthStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    [HealthStatus.Excellent]: 'success',
    [HealthStatus.Good]: 'info',
    [HealthStatus.Fair]: 'warning',
    [HealthStatus.Poor]: 'error',
    [HealthStatus.Critical]: 'error',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card padding="md" variant="elevated" style={{ background: 'linear-gradient(135deg, #131c2f, #1a2a4a)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Welcome back, {data.customerName}</h1>
            <p style={{ fontSize: 13, color: '#8b9bb5', marginTop: 4 }}>Here's your account overview.</p>
          </div>
          <StatusBadge variant={statusVariant[data.healthStatus]}>
            {data.healthStatus}
          </StatusBadge>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <AccountSummaryCard
          healthScore={data.healthScore}
          healthStatus={data.healthStatus}
          openTickets={data.openTicketsCount}
          nextAppointment={data.upcomingAppointment ? `${new Date(data.upcomingAppointment.scheduledDate).toLocaleDateString()} ${data.upcomingAppointment.scheduledTime}` : null}
        />
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#8b9bb5' }}>Open Tickets</span>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#e6ecf5' }}>{data.openTicketsCount}</div>
            <span style={{ fontSize: 12, color: '#6b7b95' }}>Click to view all tickets</span>
          </div>
        </Card>
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#8b9bb5' }}>Next Appointment</span>
            {data.upcomingAppointment ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e6ecf5' }}>{data.upcomingAppointment.serviceType}</div>
                <div style={{ fontSize: 12, color: '#6b7b95' }}>
                  {new Date(data.upcomingAppointment.scheduledDate).toLocaleDateString()} at {data.upcomingAppointment.scheduledTime}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: '#6b7b95' }}>No upcoming appointments</div>
            )}
          </div>
        </Card>
      </div>

      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Recent Activity</span>}>
        {data.recentActivity.length === 0 ? (
          <EmptyState title="No recent activity" size="sm" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.recentActivity.map((act) => (
              <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a2744' }}>
                <span style={{ fontSize: 18 }}>
                  {act.type === 'ticket' ? '🎫' : act.type === 'appointment' ? '📅' : '⚖️'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#e6ecf5' }}>{act.description}</div>
                  <div style={{ fontSize: 11, color: '#6b7b95' }}>{new Date(act.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
