import { useMemo, type FC } from 'react';
import type { TabsProps, Tab } from './Tabs.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

export const Tabs: FC<TabsProps> = ({
  tabs, activeId, onChange, variant = 'underline', size = 'md', fullWidth = false, scrollable = false, style, className, tabStyle, activeTabStyle,
}) => {
  const sizeConfig = { sm: { height: 32, fontSize: typography.fontSize.xs, px: spacing[2] }, md: { height: 40, fontSize: typography.fontSize.sm, px: spacing[3] }, lg: { height: 48, fontSize: typography.fontSize.base, px: spacing[4] } };
  const sc = sizeConfig[size];

  return (
    <div style={{
      display: 'flex', borderBottom: variant === 'underline' ? '1px solid var(--border, #e2e8f0)' : 'none',
      gap: variant === 'pills' ? spacing[1] : 0, overflow: scrollable ? 'auto' : undefined,
      width: fullWidth ? '100%' : undefined,
      ...style,
    }} className={className} role="tablist">
      {tabs.map(tab => {
        const isActive = activeId === tab.id;
        const isUnderline = variant === 'underline';
        const isPills = variant === 'pills';
        const isButtons = variant === 'buttons';

        const base: React.CSSProperties = {
          display: 'inline-flex', alignItems: 'center', gap: spacing[1.5],
          height: sc.height, padding: `0 ${sc.px}`, cursor: tab.disabled ? 'not-allowed' : 'pointer',
          fontSize: sc.fontSize, fontFamily: typography.fontFamily.body, fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
          color: isActive ? (isUnderline ? 'var(--accent, #2563eb)' : isPills ? '#ffffff' : 'var(--accent, #2563eb)') : 'var(--text-secondary, #475569)',
          backgroundColor: isPills && isActive ? 'var(--accent, #2563eb)' : isPills ? 'transparent' : isButtons && isActive ? 'var(--accent-light, #dbeafe)' : isButtons ? 'transparent' : 'transparent',
          border: isButtons ? `1px solid ${isActive ? 'var(--accent, #2563eb)' : 'var(--border, #e2e8f0)'}` : 'none',
          borderRadius: isPills ? radius.full : isButtons ? radius.md : 0,
          borderBottom: isUnderline && isActive ? `2px solid var(--accent, #2563eb)` : isUnderline ? '2px solid transparent' : undefined,
          marginBottom: isUnderline ? -1 : 0,
          opacity: tab.disabled ? 0.4 : 1,
          whiteSpace: 'nowrap', transition: `color ${animation.duration.fast} ${animation.easing.ease}, background-color ${animation.duration.fast} ${animation.easing.ease}, border-color ${animation.duration.fast} ${animation.easing.ease}`,
          flex: fullWidth ? 1 : undefined, justifyContent: 'center',
          ...(isActive ? activeTabStyle : tabStyle),
        };

        return (
          <button
            key={tab.id} role="tab" aria-selected={isActive}
            disabled={tab.disabled} onClick={() => { if (!tab.disabled) onChange(tab.id); }}
            style={base}
          >
            {tab.icon && <span style={{ display: 'flex' }}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {(tab.count !== undefined || tab.badge) && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 18, height: 18, padding: `0 4px`, borderRadius: radius.full,
                fontSize: typography.fontSize.xs,
                backgroundColor: isPills && isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-page, #f1f5f9)',
                color: isActive && isPills ? '#ffffff' : 'var(--text-muted, #94a3b8)',
              }}>
                {tab.count ?? tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
