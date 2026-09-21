import { type FC } from 'react';
import type { RequestType, Urgency } from '../models/dto';

interface ClassificationBadgesProps {
  type?: string;
  urgency?: Urgency;
}

const badgeBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  marginRight: 4,
};

const urgencyColors: Record<string, React.CSSProperties> = {
  low: { background: '#1a3a2a', color: '#4ade80' },
  normal: { background: '#1a2a3a', color: '#60a5fa' },
  high: { background: '#3a2a1a', color: '#fbbf24' },
  critical: { background: '#3a1a1a', color: '#f87171' },
};

const typeColors: Record<string, React.CSSProperties> = {
  question: { background: '#1a2744', color: '#93c5fd' },
  problem: { background: '#3a1a1a', color: '#fca5a5' },
  feature_request: { background: '#1a3a2a', color: '#86efac' },
  billing: { background: '#3a2a1a', color: '#fcd34d' },
  other: { background: '#243049', color: '#c8d0dc' },
};

export const ClassificationBadges: FC<ClassificationBadgesProps> = ({ type, urgency }) => {
  return (
    <span>
      {type && <span style={{ ...badgeBase, ...(typeColors[type] || typeColors.other) }}>{type.replace('_', ' ')}</span>}
      {urgency && <span style={{ ...badgeBase, ...(urgencyColors[urgency] || urgencyColors.normal) }}>{urgency}</span>}
    </span>
  );
};
