import type { FC } from 'react';
import type { DashboardLayoutProps } from './DashboardLayout.types';

export const DashboardLayout: FC<DashboardLayoutProps> = ({
  sidebar, topbar, children, sidebarWidth, sidebarCollapsed,
  style, className, contentStyle,
}) => (
  <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', ...style }} className={className}>
    {sidebar}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {topbar}
      <main style={{ flex: 1, overflow: 'auto', padding: '24px', backgroundColor: 'var(--bg-page, #f8fafc)', ...contentStyle }}>
        {children}
      </main>
    </div>
  </div>
);
