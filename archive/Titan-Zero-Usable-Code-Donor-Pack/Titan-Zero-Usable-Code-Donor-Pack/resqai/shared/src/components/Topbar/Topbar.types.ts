import type { CSSProperties, ReactNode } from 'react';

export interface TopbarProps {
  children?: ReactNode;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  height?: number;
  border?: boolean;
  sticky?: boolean;
  style?: CSSProperties;
  className?: string;
}

export interface TopbarNavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}
