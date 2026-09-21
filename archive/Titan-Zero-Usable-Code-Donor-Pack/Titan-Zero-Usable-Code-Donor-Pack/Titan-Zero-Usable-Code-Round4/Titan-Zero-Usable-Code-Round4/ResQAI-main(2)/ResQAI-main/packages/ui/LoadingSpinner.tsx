import type { FC, CSSProperties } from 'react';

interface LoadingSpinnerProps {
  text?: string;
  style?: CSSProperties;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  text = 'Loading...',
  style,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '60vh',
      color: 'var(--text-muted, var(--muted, #6b6353))',
      ...style,
    }}
  >
    {text}
  </div>
);
