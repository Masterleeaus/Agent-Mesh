import type { CSSProperties, ReactNode } from 'react';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusBadgeProps {
  children: ReactNode;
  variant?: StatusVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
  pulse?: boolean;
  style?: CSSProperties;
  className?: string;
}
