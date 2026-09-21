import { useEffect, type FC } from 'react';
import type { NotificationProps, NotificationVariant } from './Notification.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

const variantStyles: Record<NotificationVariant, { bg: string; border: string; iconColor: string; textColor: string }> = {
  success: { bg: 'var(--success-light, #dcfce7)', border: 'var(--success, #16a34a)', iconColor: 'var(--success, #16a34a)', textColor: 'var(--text-primary, #0f172a)' },
  warning: { bg: 'var(--warning-light, #fef9c3)', border: 'var(--warning, #ca8a04)', iconColor: 'var(--warning, #ca8a04)', textColor: 'var(--text-primary, #0f172a)' },
  error: { bg: 'var(--error-light, #fce4e4)', border: 'var(--error, #dc2626)', iconColor: 'var(--error, #dc2626)', textColor: 'var(--text-primary, #0f172a)' },
  info: { bg: 'var(--info-light, #dbeafe)', border: 'var(--info, #2563eb)', iconColor: 'var(--info, #2563eb)', textColor: 'var(--text-primary, #0f172a)' },
};

const defaultIcons: Record<NotificationVariant, JSX.Element> = {
  success: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  warning: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  error: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
  info: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
};

export const Notification: FC<NotificationProps> = ({
  children, variant = 'info', title, onClose, action, dismissible = true,
  autoClose, icon, compact = false, style, className,
}) => {
  const vs = variantStyles[variant];

  useEffect(() => {
    if (!autoClose || !onClose) return;
    const timer = setTimeout(onClose, autoClose);
    return () => clearTimeout(timer);
  }, [autoClose, onClose]);

  return (
    <div
      style={{
        display: 'flex', alignItems: compact ? 'center' : 'flex-start',
        gap: spacing[3], padding: compact ? `${spacing[2]} ${spacing[3]}` : spacing[4],
        backgroundColor: vs.bg, borderLeft: `4px solid ${vs.border}`,
        borderRadius: radius.md, color: vs.textColor,
        fontFamily: typography.fontFamily.body, ...style,
      }}
      className={className}
      role="alert"
    >
      <div style={{ color: vs.iconColor, flexShrink: 0, marginTop: compact ? 0 : 2 }}>
        {icon || defaultIcons[variant]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm, marginBottom: compact ? 0 : spacing[1] }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: compact ? typography.fontSize.xs : typography.fontSize.sm, color: 'var(--text-secondary, #475569)' }}>
          {children}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      {dismissible && onClose && (
        <button
          type="button" onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted, #94a3b8)', flexShrink: 0, borderRadius: radius.sm }}
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      )}
    </div>
  );
};
