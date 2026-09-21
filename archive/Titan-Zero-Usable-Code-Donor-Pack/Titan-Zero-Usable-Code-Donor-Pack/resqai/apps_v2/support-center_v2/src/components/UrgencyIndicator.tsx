import { type FC } from 'react';
import type { Urgency } from '../models/dto';

interface UrgencyIndicatorProps {
  urgency: Urgency;
}

const colors: Record<Urgency, string> = {
  low: '#4ade80',
  normal: '#60a5fa',
  high: '#fbbf24',
  critical: '#f87171',
};

const labels: Record<Urgency, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  critical: 'Critical',
};

export const UrgencyIndicator: FC<UrgencyIndicatorProps> = ({ urgency }) => {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: colors[urgency] }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[urgency], display: 'inline-block' }} />
      {labels[urgency]}
    </span>
  );
};
