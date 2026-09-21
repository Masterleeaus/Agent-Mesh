import type { CSSProperties, ReactNode } from 'react';

export interface TableLayoutProps {
  topbar?: ReactNode;
  header?: ReactNode;
  filters?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
  className?: string;
  contentStyle?: CSSProperties;
}
