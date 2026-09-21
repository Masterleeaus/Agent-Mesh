import { useState, useRef, useEffect, type FC } from 'react';
import type { ApplicationSwitcherProps, AppLink } from './ApplicationSwitcher.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

export const ApplicationSwitcher: FC<ApplicationSwitcherProps> = ({
  apps, currentAppId, onSelect, label = 'Applications', compact = false, style, className,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentApp = apps.find(a => a.id === currentAppId);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', ...style }} className={className}>
      <button type="button" onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: spacing[2], height: compact ? 32 : 40,
        padding: `0 ${spacing[3]}`, border: '1px solid var(--border, #e2e8f0)',
        borderRadius: radius.md, backgroundColor: 'var(--bg-card, #ffffff)',
        cursor: 'pointer', fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body,
        color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap',
      }}>
        {currentApp?.icon && <span style={{ display: 'flex' }}>{currentApp.icon}</span>}
        <span>{currentApp?.label || label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: `transform ${animation.duration.fast} ${animation.easing.ease}` }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: spacing[1], minWidth: 240,
          backgroundColor: 'var(--bg-elevated, #ffffff)', border: '1px solid var(--border, #e2e8f0)',
          borderRadius: radius.md, boxShadow: '0px 8px 16px rgba(0,0,0,0.1)', zIndex: 1000,
          padding: spacing[1], overflow: 'hidden',
        }}>
          {apps.map(app => {
            const isCurrent = app.id === currentAppId;
            return (
              <div
                key={app.id} onClick={() => { if (!app.disabled) { onSelect(app); setOpen(false); } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: spacing[2], padding: spacing[2.5],
                  borderRadius: radius.md, cursor: app.disabled ? 'not-allowed' : 'pointer',
                  backgroundColor: isCurrent ? 'var(--accent-light, #dbeafe)' : 'transparent',
                  opacity: app.disabled ? 0.4 : 1, transition: `background-color ${animation.duration.fast} ${animation.easing.ease}`,
                }}
              >
                {app.icon && <span style={{ display: 'flex', fontSize: 20, color: 'var(--accent, #2563eb)' }}>{app.icon}</span>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: 'var(--text-primary, #0f172a)', fontFamily: typography.fontFamily.body }}>{app.label}</div>
                  {app.description && <div style={{ fontSize: typography.fontSize.xs, color: 'var(--text-muted, #94a3b8)', fontFamily: typography.fontFamily.body }}>{app.description}</div>}
                </div>
                {app.badge !== undefined && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 20, padding: `0 ${spacing[1]}`, borderRadius: radius.full, fontSize: typography.fontSize.xs, backgroundColor: 'var(--accent, #2563eb)', color: '#ffffff' }}>{app.badge}</span>}
                {isCurrent && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #2563eb)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
