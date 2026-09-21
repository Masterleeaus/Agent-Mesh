import { type FC } from 'react';

interface EscalationBannerProps {
  reason?: string;
  escalatedTo?: string;
}

export const EscalationBanner: FC<EscalationBannerProps> = ({ reason, escalatedTo }) => {
  return (
    <div role="alert" style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 8,
      background: 'rgba(248, 113, 113, 0.1)',
      border: '1px solid rgba(248, 113, 113, 0.3)',
      marginBottom: 12,
    }}>
      <span style={{ fontSize: 16 }}>🚩</span>
      <div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>Escalated</span>
        {reason && <span style={{ fontSize: 12, color: '#fca5a5', marginLeft: 8 }}>{reason}</span>}
        {escalatedTo && <span style={{ fontSize: 12, color: '#fca5a5', marginLeft: 4 }}>→ {escalatedTo}</span>}
      </div>
    </div>
  );
};
