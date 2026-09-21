import type { CSSProperties, ReactNode } from 'react';

export interface SplitLayoutProps {
  left: ReactNode;
  right: ReactNode;
  defaultRatio?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  gutter?: number;
  direction?: 'horizontal' | 'vertical';
  style?: CSSProperties;
  className?: string;
}
