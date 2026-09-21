import type { FC } from 'react';
import type { TableLayoutProps } from './TableLayout.types';
import { spacing } from '../../design-system/tokens';

export const TableLayout: FC<TableLayoutProps> = ({
  topbar, header, filters, search, actions, children, pagination, footer, style, className, contentStyle,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', ...style }} className={className}>
    {topbar}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: spacing[6], gap: spacing[4], backgroundColor: 'var(--bg-page, #f8fafc)' }}>
      {header}
      {(search || filters || actions) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3], flexWrap: 'wrap' }}>
          {search && <div style={{ minWidth: 280, flex: '0 1 auto' }}>{search}</div>}
          {filters && <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center', flex: 1 }}>{filters}</div>}
          {actions && <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center', marginLeft: 'auto' }}>{actions}</div>}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', ...contentStyle }}>{children}</div>
      {pagination && <div style={{ display: 'flex', justifyContent: 'center', paddingTop: spacing[2] }}>{pagination}</div>}
      {footer}
    </div>
  </div>
);
