import type { CSSProperties, ReactNode, MouseEvent } from 'react';

export interface CardProps {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'bordered' | 'flat';
  clickable?: boolean;
  hoverable?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  header?: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
  className?: string;
  role?: string;
}
