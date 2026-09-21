import type { FC } from 'react';
import { Card, StatusBadge } from '../../../shared/src/components';
import type { RiskLevel } from '../models/dto';

interface RiskSignalCardProps {
  type: string;
  description: string;
  level: RiskLevel;
  category: string;
  acknowledged: boolean;
  detectedAt: string;
  accountName: string;
  onAcknowledge?: () => void;
}

function levelVariant(level: RiskLevel): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (level) {
    case 'critical': return 'error';
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'neutral';
  }
}

function levelColor(level: RiskLevel): string {
  switch (level) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#f59e0b';
    case 'low': return '#41d1c4';
    default: return '#6b7280';
  }
}

export const RiskSignalCard: FC<RiskSignalCardProps> = ({ type, description, level, category, acknowledged, detectedAt, accountName }) => {
  return (
    <Card style={{ background: '#131c2f', border: `1px solid ${acknowledged ? '#243049' : levelColor(level)}40`, borderLeft: `3px solid ${levelColor(level)}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#e6ecf5' }}>{type}</span>
            <StatusBadge variant={levelVariant(level)} size="sm">{level}</StatusBadge>
            {acknowledged && <span style={{ fontSize: 11, color: '#6b7280' }}>Acknowledged</span>}
          </div>
          <div style={{ fontSize: 13, color: '#8b9bb5', marginBottom: 4 }}>{accountName} · {category}</div>
          <div style={{ fontSize: 13, color: '#c8d0dc' }}>{description}</div>
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>{detectedAt}</div>
      </div>
    </Card>
  );
};
