import type { FC, CSSProperties } from 'react';

interface EmptyStateProps {
  message?: string;
  style?: CSSProperties;
}

export const EmptyState: FC<EmptyStateProps> = ({
  message = 'No data found.',
  style,
}) => (
  <div
    style={{
      textAlign: 'center',
      padding: 48,
      color: 'var(--text-muted, var(--muted, #8b9bb5))',
      ...style,
    }}
  >
    {message}
  </div>
);
