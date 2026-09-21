import { useState, useMemo, type FC } from 'react';
import type { SidebarProps, SidebarItem } from './Sidebar.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

export const Sidebar: FC<SidebarProps> = ({
  items, activeId, onNavigate, collapsed = false, onToggle,
  header, footer, logo, title, width = 260, collapsedWidth = 64,
  style, className, itemStyle, activeItemStyle,
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const currentWidth = collapsed ? collapsedWidth : width;

  const renderItem = (item: SidebarItem, depth = 0) => {
    const isActive = activeId === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.id] ?? false;

    return (
      <div key={item.id}>
        <div
          onClick={() => {
            if (item.disabled) return;
            if (hasChildren) setExpandedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }));
            onNavigate(item);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: spacing[2],
            padding: `${spacing[2]} ${spacing[3]}`,
            margin: `0 ${spacing[2]}`,
            borderRadius: radius.md,
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            opacity: item.disabled ? 0.4 : 1,
            backgroundColor: isActive ? 'var(--accent, #2563eb)' : 'transparent',
            color: isActive ? '#ffffff' : 'var(--text-secondary, #cbd5e1)',
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.body,
            fontWeight: isActive ? typography.fontWeight.medium : typography.fontWeight.regular,
            transition: `background-color ${animation.duration.fast} ${animation.easing.ease}, color ${animation.duration.fast} ${animation.easing.ease}`,
            whiteSpace: 'nowrap',
            justifyContent: collapsed ? 'center' : undefined,
            paddingLeft: collapsed ? spacing[2] : depth > 0 ? `${16 + depth * 16}px` : spacing[3],
            ...(isActive ? activeItemStyle : itemStyle),
          } as React.CSSProperties}
          title={collapsed ? item.label : undefined}
        >
          {item.icon && <span style={{ display: 'flex', flexShrink: 0, fontSize: 18 }}>{item.icon}</span>}
          {!collapsed && (
            <>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              {item.badge && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 20, padding: `0 ${spacing[1]}`, fontSize: typography.fontSize.xs, borderRadius: radius.full, backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--accent, #2563eb)', color: '#ffffff' }}>{item.badge}</span>
              )}
              {hasChildren && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(90deg)' : undefined, transition: `transform ${animation.duration.fast} ${animation.easing.ease}` }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </>
          )}
        </div>
        {hasChildren && isExpanded && !collapsed && (
          <div>
            {item.children!.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      width: currentWidth, height: '100vh', display: 'flex', flexDirection: 'column',
      backgroundColor: 'var(--bg-sidebar, #1e293b)', overflow: 'hidden',
      transition: `width ${animation.duration.normal} ${animation.easing.ease}`,
      ...style,
    }} className={className}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? spacing[3] : `${spacing[3]} ${spacing[4]}`, minHeight: 56, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {collapsed ? logo : (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            {logo}
            {title && <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: '#ffffff', fontFamily: typography.fontFamily.heading }}>{title}</span>}
          </div>
        )}
        {onToggle && !collapsed && (
          <button type="button" onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', borderRadius: radius.md, background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
        )}
      </div>
      {header}
      <div style={{ flex: 1, overflow: 'auto', padding: `${spacing[2]} 0` }}>
        {items.map(item => renderItem(item))}
      </div>
      {footer}
      {onToggle && collapsed && (
        <div style={{ padding: spacing[2], borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
          <button type="button" onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 'none', borderRadius: radius.md, background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};
