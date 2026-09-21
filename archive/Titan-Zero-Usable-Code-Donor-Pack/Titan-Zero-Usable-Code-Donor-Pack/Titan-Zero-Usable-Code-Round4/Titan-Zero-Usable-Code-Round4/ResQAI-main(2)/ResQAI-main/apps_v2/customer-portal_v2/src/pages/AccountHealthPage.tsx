import { useAccountHealth } from '../hooks/useAccountHealth';
import { Card, ProgressIndicator, StatusBadge, Table, Skeleton, EmptyState, ErrorState } from '../../../shared/src/components';
import { HealthStatus } from '../models/dto';

const statusColor: Record<HealthStatus, 'success' | 'warning' | 'error' | 'info'> = {
  [HealthStatus.Excellent]: 'success',
  [HealthStatus.Good]: 'info',
  [HealthStatus.Fair]: 'warning',
  [HealthStatus.Poor]: 'warning',
  [HealthStatus.Critical]: 'error',
};

const badgeVariant: Record<HealthStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [HealthStatus.Excellent]: 'success',
  [HealthStatus.Good]: 'info',
  [HealthStatus.Fair]: 'warning',
  [HealthStatus.Poor]: 'error',
  [HealthStatus.Critical]: 'error',
};

export function AccountHealthPage() {
  const { account, health, followups, loading, error } = useAccountHealth();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton variant="rectangular" height={40} width={200} />
        <Skeleton variant="card" />
        <Skeleton variant="table" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load account health" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  if (!health) {
    return <EmptyState title="No health data" description="Account health information is not available." />;
  }

  const followupColumns = [
    { key: 'note', header: 'Note', width: 'auto' },
    { key: 'dueDate', header: 'Due Date', width: '120px', render: (_: unknown, row: Record<string, unknown>) => new Date(String(row.dueDate)).toLocaleDateString() },
    { key: 'status', header: 'Status', width: '100px' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Account Health</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#8b9bb5' }}>Health Score</span>
            <ProgressIndicator value={health.healthScore} variant="circular" size="lg" color={statusColor[health.healthStatus]} showLabel labelPosition="bottom" />
            <StatusBadge variant={badgeVariant[health.healthStatus]}>{health.healthStatus}</StatusBadge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><span style={{ fontSize: 12, color: '#6b7b95' }}>Open Tickets</span><div style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5' }}>{health.openTicketsCount}</div></div>
            <div><span style={{ fontSize: 12, color: '#6b7b95' }}>Resolved Tickets</span><div style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5' }}>{health.resolvedTicketsCount}</div></div>
            <div><span style={{ fontSize: 12, color: '#6b7b95' }}>Upcoming Appointments</span><div style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5' }}>{health.upcomingAppointmentsCount}</div></div>
            <div><span style={{ fontSize: 12, color: '#6b7b95' }}>Completed Appointments</span><div style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5' }}>{health.completedAppointmentsCount}</div></div>
            <div><span style={{ fontSize: 12, color: '#6b7b95' }}>Pending Follow-ups</span><div style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5' }}>{health.pendingFollowupsCount}</div></div>
            <div><span style={{ fontSize: 12, color: '#6b7b95' }}>Account Age</span><div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{health.accountAge}</div></div>
          </div>
        </Card>
      </div>

      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Pending Follow-ups</span>}>
        {followups.length === 0 ? (
          <EmptyState title="No pending follow-ups" size="sm" />
        ) : (
          <Table columns={followupColumns} data={followups.map((f) => ({ ...f, id: f.id }))} />
        )}
      </Card>

      {account && (
        <div style={{ fontSize: 12, color: '#6b7b95' }}>
          Account #{account.accountNumber} | Status: {account.status} | Since {new Date(account.createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
