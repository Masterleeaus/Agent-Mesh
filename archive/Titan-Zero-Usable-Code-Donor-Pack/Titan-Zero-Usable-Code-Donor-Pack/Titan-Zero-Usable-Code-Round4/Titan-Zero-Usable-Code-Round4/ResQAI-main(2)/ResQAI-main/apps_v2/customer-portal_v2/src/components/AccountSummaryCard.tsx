import { Card, ProgressIndicator, StatusBadge } from '../../../shared/src/components';
import { HealthStatus } from '../models/dto';

interface AccountSummaryCardProps {
  healthScore: number;
  healthStatus: HealthStatus;
  openTickets: number;
  nextAppointment: string | null;
  loading?: boolean;
}

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

export function AccountSummaryCard({ healthScore, healthStatus, openTickets, nextAppointment, loading }: AccountSummaryCardProps) {
  if (loading) {
    return (
      <Card padding="md">
        <div style={{ height: 180, background: '#1a2744', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      </Card>
    );
  }

  return (
    <Card padding="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#8b9bb5' }}>Account Health</span>
          <StatusBadge variant={badgeVariant[healthStatus]}>{healthStatus}</StatusBadge>
        </div>
        <ProgressIndicator value={healthScore} variant="circular" size="lg" color={statusColor[healthStatus]} showLabel labelPosition="bottom" />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><span style={{ fontSize: 12, color: '#6b7b95' }}>Open Tickets</span><div style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5' }}>{openTickets}</div></div>
          <div><span style={{ fontSize: 12, color: '#6b7b95' }}>Next Appointment</span><div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{nextAppointment ?? 'None'}</div></div>
        </div>
      </div>
    </Card>
  );
}
