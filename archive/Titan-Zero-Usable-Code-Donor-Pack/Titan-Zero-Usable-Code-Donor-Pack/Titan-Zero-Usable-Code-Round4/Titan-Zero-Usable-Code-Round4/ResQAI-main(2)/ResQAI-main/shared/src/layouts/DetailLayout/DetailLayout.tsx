import type { FC } from 'react';
import type { DetailLayoutProps } from './DetailLayout.types';
import { spacing } from '../../design-system/tokens';

export const DetailLayout: FC<DetailLayoutProps> = ({
  topbar, breadcrumbs, header, metadata, tabs, children, sidebar,
  sidebarPosition = 'right', sidebarWidth = 320, style, className, contentStyle,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', ...style }} className={className}>
    {topbar}
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {breadcrumbs && <div style={{ padding: `${spacing[2]} ${spacing[6]}`, borderBottom: '1px solid var(--border, #e2e8f0)', backgroundColor: 'var(--bg-card, #ffffff)' }}>{breadcrumbs}</div>}
        {header && <div style={{ padding: `${spacing[4]} ${spacing[6]}`, borderBottom: '1px solid var(--border, #e2e8f0)', backgroundColor: 'var(--bg-card, #ffffff)' }}>{header}</div>}
        {metadata && <div style={{ padding: `0 ${spacing[6]}`, backgroundColor: 'var(--bg-card, #ffffff)' }}>{metadata}</div>}
        {tabs && <div style={{ padding: `0 ${spacing[6]}`, backgroundColor: 'var(--bg-card, #ffffff)' }}>{tabs}</div>}
        <main style={{ flex: 1, padding: spacing[6], backgroundColor: 'var(--bg-page, #f8fafc)', overflow: 'auto', ...contentStyle }}>{children}</main>
      </div>
      {sidebar && (
        <div style={{ width: sidebarWidth, flexShrink: 0, borderLeft: sidebarPosition === 'right' ? '1px solid var(--border, #e2e8f0)' : undefined, borderRight: sidebarPosition === 'left' ? '1px solid var(--border, #e2e8f0)' : undefined, overflow: 'auto', backgroundColor: 'var(--bg-card, #ffffff)' }}>
          {sidebar}
        </div>
      )}
    </div>
  </div>
);
