import { useDashboard } from '../hooks/useDashboard';
import { useCustomerSatisfaction } from '../hooks/useCustomerSatisfaction';
import { Card, StatusBadge, Skeleton, EmptyState, ErrorState, Button } from '../../../shared/src/components';
import { AccountSummaryCard } from '../components/AccountSummaryCard';
import { OpenTicketsWidget, UpcomingAppointmentsWidget, RecentActivityWidget, TechnicianETAWidget, NotificationsWidget, CustomerSatisfactionWidget, QuickActionsWidget } from '../components/widgets';
import { HealthStatus } from '../models/dto';
import { useCustomerTickets } from '../hooks/useCustomerTickets';

export function CustomerDashboardPage() {
  const { data, loading, error } = useDashboard();
  const { data: satisfaction } = useCustomerSatisfaction();
  const { data: tickets } = useCustomerTickets(1);

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
      <ErrorState title="Failed to load dashboard" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />
    );
  }

  if (!data) {
    return <EmptyState title="No dashboard data" description="Could not retrieve your dashboard information." />;
  }

  const statusVariant: Record<HealthStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    [HealthStatus.Excellent]: 'success', [HealthStatus.Good]: 'info', [HealthStatus.Fair]: 'warning', [HealthStatus.Poor]: 'error', [HealthStatus.Critical]: 'error',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card padding="md" variant="elevated" style={{ background: 'linear-gradient(135deg, #131c2f, #1a2a4a)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Welcome back, {data.customerName}</h1>
            <p style={{ fontSize: 13, color: '#8b9bb5', marginTop: 4 }}>Here's your account overview.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {data.unreadNotifications > 0 && (
              <StatusBadge variant="warning">{data.unreadNotifications} unread</StatusBadge>
            )}
            <StatusBadge variant={statusVariant[data.healthStatus]}>{data.healthStatus}</StatusBadge>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <AccountSummaryCard healthScore={data.healthScore} healthStatus={data.healthStatus} openTickets={data.openTicketsCount} nextAppointment={data.upcomingAppointment ? `${new Date(data.upcomingAppointment.scheduledDate).toLocaleDateString()} ${data.upcomingAppointment.scheduledTime}` : null} />
        <OpenTicketsWidget tickets={tickets.map((t) => ({ id: t.id, subject: t.subject, status: t.status, requestType: t.requestType, priority: t.priority, createdAt: t.createdAt, updatedAt: t.updatedAt, hasUnreadMessages: false }))} onViewAll={() => { window.location.hash = '/tickets'; }} />
        {data.upcomingAppointment ? (
          <UpcomingAppointmentsWidget appointments={[data.upcomingAppointment]} onViewAll={() => { window.location.hash = '/appointments'; }} />
        ) : (
          <CustomerSatisfactionWidget satisfaction={satisfaction} />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <RecentActivityWidget activities={data.recentActivity} />
        <QuickActionsWidget />
      </div>
    </div>
  );
}