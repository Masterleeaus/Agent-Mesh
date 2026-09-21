import type { FC } from 'react';
import { Card, StatusBadge } from '../../../shared/src/components';
import type { HealthStatus } from '../models/dto';

interface HealthScanResultCardProps {
  accountName: string;
  score: number;
  previousScore: number | null;
  status: HealthStatus;
  trigger: string;
  scannedAt: string;
  findingCount: number;
  onClick?: () => void;
}

function statusVariant(status: HealthStatus): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'healthy': return 'success';
    case 'warning': return 'warning';
    case 'critical': return 'error';
    default: return 'neutral';
  }
}

export const HealthScanResultCard: FC<HealthScanResultCardProps> = ({ accountName, score, previousScore, status, trigger, scannedAt, findingCount, onClick }) => {
  const scoreDiff = previousScore !== null ? score - previousScore : 0;

  return (
    <Card hoverable clickable onClick={onClick} style={{ background: '#131c2f', border: '1px solid #243049' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#e6ecf5' }}>{accountName}</div>
          <div style={{ fontSize: 12, color: '#8b9bb5', marginTop: 4 }}>
            {trigger} · {scannedAt} · {findingCount} finding{findingCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5' }}>{score}</span>
            <StatusBadge variant={statusVariant(status)} size="sm">{status}</StatusBadge>
          </div>
          {previousScore !== null && (
            <div style={{ fontSize: 12, color: scoreDiff >= 0 ? '#41d1c4' : '#ef4444', marginTop: 2 }}>
              {scoreDiff >= 0 ? '+' : ''}{scoreDiff} from previous
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
