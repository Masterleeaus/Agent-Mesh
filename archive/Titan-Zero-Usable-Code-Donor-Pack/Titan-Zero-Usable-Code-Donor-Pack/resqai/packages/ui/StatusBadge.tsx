import type { FC } from 'react';
import { STATUS_COLOR_MAP } from '../config/constants';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
  const color = STATUS_COLOR_MAP[status] || 'var(--text-muted)';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        background: `${color}20`,
        color,
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};
