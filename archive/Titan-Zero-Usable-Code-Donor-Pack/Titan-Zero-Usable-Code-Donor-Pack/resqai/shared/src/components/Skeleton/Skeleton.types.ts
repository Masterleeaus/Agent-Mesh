import type { CSSProperties } from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  borderRadius?: string;
  style?: CSSProperties;
  className?: string;
}
