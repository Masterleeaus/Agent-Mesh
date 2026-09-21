import { useMemo, type FC } from 'react';
import type { EmptyStateProps } from './EmptyState.types';
import { spacing, typography } from '../../design-system/tokens';

const sizeConfig = { sm: { iconSize: 32, titleSize: typography.fontSize.base, descSize: typography.fontSize.xs, padding: spacing[6] }, md: { iconSize: 48, titleSize: typography.fontSize.lg, descSize: typography.fontSize.sm, padding: spacing[10] }, lg: { iconSize: 64, titleSize: typography.fontSize.xl, descSize: typography.fontSize.base, padding: spacing[14] } };

export const EmptyState: FC<EmptyStateProps> = ({ title, description, icon, action, size = 'md', style, className }) => {
  const sc = sizeConfig[size];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: sc.padding, textAlign: 'center', ...style }} className={className}>
      {icon && <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: spacing[2] }}>{icon}</div>}
      <h3 style={{ margin: 0, fontSize: sc.titleSize, fontWeight: typography.fontWeight.semibold, color: 'var(--text-primary, #0f172a)', fontFamily: typography.fontFamily.heading }}>{title}</h3>
      {description && <p style={{ margin: 0, fontSize: sc.descSize, color: 'var(--text-secondary, #475569)', fontFamily: typography.fontFamily.body, maxWidth: 400 }}>{description}</p>}
      {action && <div style={{ marginTop: spacing[2] }}>{action}</div>}
    </div>
  );
};
