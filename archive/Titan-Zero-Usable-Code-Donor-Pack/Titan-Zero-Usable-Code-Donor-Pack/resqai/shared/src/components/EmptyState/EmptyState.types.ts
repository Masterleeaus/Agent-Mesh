import type { CSSProperties, ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
  className?: string;
}
