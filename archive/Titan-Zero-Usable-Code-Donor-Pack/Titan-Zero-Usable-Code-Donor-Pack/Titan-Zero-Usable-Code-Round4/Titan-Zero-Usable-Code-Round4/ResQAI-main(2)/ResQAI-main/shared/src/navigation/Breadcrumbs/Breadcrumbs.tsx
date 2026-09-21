import { useMemo, type FC } from 'react';
import type { BreadcrumbsProps, BreadcrumbItem } from './Breadcrumbs.types';
import { spacing, typography } from '../../design-system/tokens';

const sizeMap = { sm: { fontSize: typography.fontSize.xs, height: 28 }, md: { fontSize: typography.fontSize.sm, height: 32 }, lg: { fontSize: typography.fontSize.base, height: 40 } };

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ items, separator = '/', maxItems = 0, size = 'md', style, className }) => {
  const sc = sizeMap[size];
  const displayItems = useMemo(() => {
    if (!maxItems || items.length <= maxItems) return items;
    return [items[0], { label: '...' }, ...items.slice(items.length - (maxItems - 2))];
  }, [items, maxItems]);

  return (
    <nav style={{ display: 'flex', alignItems: 'center', height: sc.height, gap: spacing[1], ...style }} className={className} aria-label="Breadcrumb">
      {displayItems.map((item, idx) => {
        const isLast = idx === displayItems.length - 1;
        const sep = typeof separator === 'string' ? (
          <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: sc.fontSize }}>{separator}</span>
        ) : separator;
        return (
          <div key={`${item.label}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            {idx > 0 && sep}
            {item.href && !isLast ? (
              <a href={item.href} style={{ display: 'flex', alignItems: 'center', gap: spacing[1], fontSize: sc.fontSize, fontFamily: typography.fontFamily.body, color: 'var(--text-secondary, #475569)', textDecoration: 'none', cursor: 'pointer' }}>
                {item.icon} <span>{item.label}</span>
              </a>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1], fontSize: sc.fontSize, fontFamily: typography.fontFamily.body, color: isLast ? 'var(--text-primary, #0f172a)' : 'var(--text-secondary, #475569)', fontWeight: isLast ? typography.fontWeight.semibold : typography.fontWeight.regular }}>
                {item.icon} {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};
