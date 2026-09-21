import type { FC, ReactNode, CSSProperties } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'accent' | 'good' | 'warn' | 'bad' | 'plain' | 'urgent' | 'high' | 'normal' | 'low';
  style?: CSSProperties;
  className?: string;
}

const colorMap: Record<string, string> = {
  accent: 'var(--accent)',
  good: 'var(--good)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
  plain: 'var(--text-muted)',
  urgent: 'var(--bad)',
  high: 'var(--warn)',
  normal: 'var(--accent)',
  low: 'var(--text-muted)',
};

export const Badge: FC<BadgeProps> = ({
  children,
  variant = 'plain',
  style,
  className,
}) => {
  const color = colorMap[variant] || colorMap.plain;
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: `${color}20`,
        color,
        ...style,
      }}
    >
      {children}
    </span>
  );
};
