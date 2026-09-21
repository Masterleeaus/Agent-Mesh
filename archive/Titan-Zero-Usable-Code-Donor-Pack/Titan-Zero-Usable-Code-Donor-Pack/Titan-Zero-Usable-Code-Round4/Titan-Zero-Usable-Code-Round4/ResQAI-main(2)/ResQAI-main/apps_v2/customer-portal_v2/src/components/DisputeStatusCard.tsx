import { Card, StatusBadge, ProgressIndicator } from '../../../shared/src/components';
import { DisputeStatus } from '../models/dto';

interface DisputeStatusCardProps {
  status: DisputeStatus;
  filedDate: string;
  resolutionDate: string | null;
}

const statusOrder: DisputeStatus[] = [
  DisputeStatus.Filed,
  DisputeStatus.UnderReview,
  DisputeStatus.Investigation,
  DisputeStatus.ResolutionProposed,
  DisputeStatus.Accepted,
  DisputeStatus.Closed,
];

const badgeVariant: Record<DisputeStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [DisputeStatus.Filed]: 'neutral',
  [DisputeStatus.UnderReview]: 'info',
  [DisputeStatus.Investigation]: 'warning',
  [DisputeStatus.ResolutionProposed]: 'info',
  [DisputeStatus.Accepted]: 'success',
  [DisputeStatus.Rejected]: 'error',
  [DisputeStatus.Escalated]: 'error',
  [DisputeStatus.Closed]: 'neutral',
};

const progressColor: Record<DisputeStatus, 'primary' | 'success' | 'warning' | 'error'> = {
  [DisputeStatus.Filed]: 'primary',
  [DisputeStatus.UnderReview]: 'primary',
  [DisputeStatus.Investigation]: 'warning',
  [DisputeStatus.ResolutionProposed]: 'primary',
  [DisputeStatus.Accepted]: 'success',
  [DisputeStatus.Rejected]: 'error',
  [DisputeStatus.Escalated]: 'error',
  [DisputeStatus.Closed]: 'success',
};

export function DisputeStatusCard({ status, filedDate, resolutionDate }: DisputeStatusCardProps) {
  const currentIdx = statusOrder.includes(status) ? statusOrder.indexOf(status) : 0;
  const progress = statusOrder.includes(status) ? ((currentIdx + 1) / statusOrder.length) * 100 : 50;

  return (
    <Card padding="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Dispute Status</span>
          <StatusBadge variant={badgeVariant[status]}>{status.replace(/_/g, ' ')}</StatusBadge>
        </div>
        <ProgressIndicator value={progress} variant="linear" size="md" color={progressColor[status]} showLabel labelPosition="right" />
        <div style={{ fontSize: 12, color: '#6b7b95' }}>
          Filed: {new Date(filedDate).toLocaleDateString()}
          {resolutionDate && <> | Resolved: {new Date(resolutionDate).toLocaleDateString()}</>}
        </div>
      </div>
    </Card>
  );
}
