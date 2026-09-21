import { useMemo, type FC } from 'react';
import type { TopbarProps } from './Topbar.types';
import { spacing, typography } from '../../design-system/tokens';

export const Topbar: FC<TopbarProps> = ({
  children, left, center, right, height = 56,
  border = true, sticky = true, style, className,
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height, padding: `0 ${spacing[4]}`, gap: spacing[3],
    backgroundColor: 'var(--bg-topbar, #ffffff)',
    borderBottom: border ? '1px solid var(--border, #e2e8f0)' : 'none',
    position: sticky ? 'sticky' : undefined, top: 0, zIndex: 100,
    ...style,
  }} className={className}>
    {left && <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>{left}</div>}
    {center && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing[2] }}>{center}</div>}
    {children}
    {right && <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>{right}</div>}
  </div>
);
