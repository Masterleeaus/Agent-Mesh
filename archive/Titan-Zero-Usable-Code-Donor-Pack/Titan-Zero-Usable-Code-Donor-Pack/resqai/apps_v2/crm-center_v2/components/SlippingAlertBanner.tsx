import type { FC } from 'react';
import { Button } from '../../../shared/src/components';

interface SlippingAlertBannerProps {
  overdueCount: number;
  onViewClick?: () => void;
}

export const SlippingAlertBanner: FC<SlippingAlertBannerProps> = ({ overdueCount, onViewClick }) => {
  if (overdueCount === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 14 }}>
          {overdueCount} followup{overdueCount !== 1 ? 's' : ''} overdue
        </span>
        <span style={{ color: '#8b9bb5', fontSize: 13, marginLeft: 8 }}>
          Action required to prevent account slippage
        </span>
      </div>
      {onViewClick && (
        <Button variant="danger" size="sm" onClick={onViewClick}>
          View Overdue
        </Button>
      )}
    </div>
  );
};
