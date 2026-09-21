import { useState, type FC } from 'react';
import type { NavigationProps, NavItem } from './Navigation.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

export const Navigation: FC<NavigationProps> = ({
  items, activeId, onNavigate, variant = 'vertical', compact = false, style, className, itemStyle, activeItemStyle,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const isHorizontal = variant === 'horizontal';

  const renderItem = (item: NavItem, depth = 0): React.ReactNode => {
    if (item.divider) {
      return <div key={`divider-${depth}`} style={{ borderTop: '1px solid var(--border, #e2e8f0)', margin: `${spacing[1]} 0` }} />;
    }

    const isActive = activeId === item.id;
    const isHovered = hoveredId === item.id;

    const base: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: spacing[2],
      padding: compact ? `${spacing[1.5]} ${spacing[2]}` : `${spacing[2]} ${spacing[3]}`,
      borderRadius: radius.md, cursor: item.disabled ? 'not-allowed' : 'pointer',
      opacity: item.disabled ? 0.4 : 1,
      backgroundColor: isActive ? 'var(--accent-light, #dbeafe)' : isHovered ? 'var(--bg-page, #f8fafc)' : 'transparent',
      color: isActive ? 'var(--accent, #2563eb)' : 'var(--text-primary, #0f172a)',
      fontSize: compact ? typography.fontSize.xs : typography.fontSize.sm,
      fontFamily: typography.fontFamily.body,
      fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
      transition: `background-color ${animation.duration.fast} ${animation.easing.ease}`,
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      ...(isActive ? activeItemStyle : itemStyle),
    } as React.CSSProperties;

    const content = (
      <div
        key={item.id} style={base}
        onClick={() => { if (!item.disabled) onNavigate(item); }}
        onMouseEnter={() => setHoveredId(item.id)}
        onMouseLeave={() => setHoveredId(null)}
        role="button" tabIndex={item.disabled ? -1 : 0}
        onKeyDown={e => { if (e.key === 'Enter' && !item.disabled) onNavigate(item); }}
      >
        {item.icon && <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>}
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.badge && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, padding: `0 4px`, borderRadius: radius.full, fontSize: typography.fontSize.xs, backgroundColor: 'var(--accent, #2563eb)', color: '#ffffff' }}>{item.badge}</span>}
      </div>
    );

    return content;
  };

  return (
    <nav style={{
      display: 'flex', flexDirection: isHorizontal ? 'row' : 'column',
      gap: isHorizontal ? spacing[1] : spacing[0.5], ...style,
    }} className={className}>
      {items.map(item => renderItem(item))}
    </nav>
  );
};
