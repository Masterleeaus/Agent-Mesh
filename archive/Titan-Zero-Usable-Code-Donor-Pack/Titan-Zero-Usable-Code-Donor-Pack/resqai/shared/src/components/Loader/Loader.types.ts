import type { CSSProperties } from 'react';

export type LoaderSize = 'sm' | 'md' | 'lg';
export type LoaderVariant = 'spinner' | 'dots' | 'bar';

export interface LoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullPage?: boolean;
  overlay?: boolean;
  style?: CSSProperties;
  className?: string;
}
