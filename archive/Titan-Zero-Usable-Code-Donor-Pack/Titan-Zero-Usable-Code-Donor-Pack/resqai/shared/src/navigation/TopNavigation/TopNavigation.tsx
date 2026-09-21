import { useState, type FC } from 'react';
import type { TopNavigationProps, TopNavItem } from './TopNavigation.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

export const TopNavigation: FC<TopNavigationProps> = ({ items, activeId, onSelect, style, className }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: spacing[0.5], ...style }} className={className}>
      {items.map(item => {
        const isActive = activeId === item.id;
        const isHovered = hoveredId === item.id;
        return (
          <button
            key={item.id} type="button" disabled={item.disabled}
            onClick={() => { if (!item.disabled) onSelect(item); }}
            onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: spacing[1.5], height: 36,
              padding: `0 ${spacing[2.5]}`, border: 'none', borderRadius: radius.md,
              backgroundColor: isActive ? 'var(--accent-light, #dbeafe)' : isHovered ? 'var(--bg-page, #f8fafc)' : 'transparent',
              color: isActive ? 'var(--accent, #2563eb)' : 'var(--text-secondary, #475569)',
              fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body,
              fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
              cursor: item.disabled ? 'not-allowed' : 'pointer', opacity: item.disabled ? 0.4 : 1,
              transition: `background-color ${animation.duration.fast} ${animation.easing.ease}`,
              whiteSpace: 'nowrap',
            }}
          >
            {item.icon && <span style={{ display: 'flex' }}>{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, padding: '0 4px', borderRadius: radius.full, fontSize: typography.fontSize.xs, backgroundColor: isActive ? 'var(--accent, #2563eb)' : 'var(--bg-page, #f1f5f9)', color: isActive ? '#ffffff' : 'var(--text-muted, #94a3b8)' }}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
