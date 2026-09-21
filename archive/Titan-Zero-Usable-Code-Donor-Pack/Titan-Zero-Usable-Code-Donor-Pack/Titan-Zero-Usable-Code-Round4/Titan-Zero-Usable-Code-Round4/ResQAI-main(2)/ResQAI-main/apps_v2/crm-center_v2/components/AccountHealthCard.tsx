import type { FC } from 'react';
import { Card, StatusBadge } from '../../../shared/src/components';
import { HealthGauge } from './HealthGauge';
import type { HealthStatus } from '../models/dto';

interface AccountHealthCardProps {
  accountName: string;
  healthScore: number;
  healthStatus: HealthStatus;
  openTickets: number;
  onClick?: () => void;
}

function statusVariantForHealth(status: HealthStatus): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'healthy': return 'success';
    case 'warning': return 'warning';
    case 'critical': return 'error';
    default: return 'neutral';
  }
}

export const AccountHealthCard: FC<AccountHealthCardProps> = ({ accountName, healthScore, healthStatus, openTickets, onClick }) => {
  return (
    <Card hoverable clickable onClick={onClick} style={{ background: '#131c2f', border: '1px solid #243049', minWidth: 220 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0' }}>
        <HealthGauge score={healthScore} size={90} strokeWidth={8} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#e6ecf5', marginBottom: 4 }}>{accountName}</div>
          <StatusBadge variant={statusVariantForHealth(healthStatus)} size="sm">{healthStatus}</StatusBadge>
        </div>
        <div style={{ fontSize: 12, color: '#8b9bb5' }}>
          {openTickets} open ticket{openTickets !== 1 ? 's' : ''}
        </div>
      </div>
    </Card>
  );
};
