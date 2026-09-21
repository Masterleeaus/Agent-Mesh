import type { CSSProperties, ReactNode } from 'react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  icon?: ReactNode;
  action?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  fullPage?: boolean;
  style?: CSSProperties;
  className?: string;
}
