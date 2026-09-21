import type { CSSProperties, ReactNode } from 'react';

export interface DashboardLayoutProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  sidebarWidth?: number;
  sidebarCollapsed?: boolean;
  style?: CSSProperties;
  className?: string;
  contentStyle?: CSSProperties;
}
