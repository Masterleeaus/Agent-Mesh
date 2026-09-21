import type { CSSProperties } from 'react';

export interface ProgressIndicatorProps {
  value: number;
  max?: number;
  variant?: 'linear' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  labelPosition?: 'top' | 'right' | 'bottom';
  indeterminate?: boolean;
  style?: CSSProperties;
  className?: string;
  trackStyle?: CSSProperties;
  fillStyle?: CSSProperties;
}
