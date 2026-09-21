import type { FC, ReactNode, CSSProperties } from 'react';

interface SectionHeaderProps {
  title: string;
  count?: number;
  action?: ReactNode;
  style?: CSSProperties;
}

export const SectionHeader: FC<SectionHeaderProps> = ({
  title,
  count,
  action,
  style,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0 4px',
      ...style,
    }}
  >
    <h2
      style={{
        fontSize: 16,
        fontWeight: 700,
        margin: 0,
        fontFamily: "'Fraunces', serif",
        color: 'var(--text-primary, var(--ink, #1a1813))',
      }}
    >
      {title}
    </h2>
    {count !== undefined && (
      <span
        style={{
          fontSize: 12,
          color: 'var(--text-muted, var(--muted, #6b6353))',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {count} {count === 1 ? 'item' : 'items'}
      </span>
    )}
    {action}
  </div>
);
