import type { FC, ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  padding?: number;
}

export const Card: FC<CardProps> = ({
  children,
  style,
  className,
  onClick,
  padding = 20,
}) => (
  <div
    className={className}
    onClick={onClick}
    style={{
      background: 'var(--bg-card, var(--card, #fffefa))',
      borderRadius: 'var(--radius, 8px)',
      border: '1px solid var(--border, var(--line, #e7e0cf))',
      padding,
      ...(onClick ? { cursor: 'pointer' } : {}),
      ...style,
    }}
  >
    {children}
  </div>
);
