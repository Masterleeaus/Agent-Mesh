import type { CSSProperties, ReactNode } from 'react';

export interface DetailLayoutProps {
  topbar?: ReactNode;
  breadcrumbs?: ReactNode;
  header?: ReactNode;
  metadata?: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: number;
  style?: CSSProperties;
  className?: string;
  contentStyle?: CSSProperties;
}
