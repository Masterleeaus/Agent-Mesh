import type { FC, CSSProperties } from 'react';
import { Button } from './Button';

interface ErrorBoxProps {
  message: string;
  onRetry?: () => void;
  style?: CSSProperties;
}

export const ErrorBox: FC<ErrorBoxProps> = ({ message, onRetry, style }) => (
  <div style={{ textAlign: 'center', padding: 48, ...style }}>
    <div style={{ color: 'var(--bad, #e74c3c)', marginBottom: 16 }}>
      {message}
    </div>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
);
