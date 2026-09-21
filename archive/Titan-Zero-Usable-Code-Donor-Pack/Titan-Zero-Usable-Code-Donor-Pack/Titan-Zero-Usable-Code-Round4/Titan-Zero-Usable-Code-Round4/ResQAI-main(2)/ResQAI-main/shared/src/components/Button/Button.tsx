import { useMemo, type FC } from 'react';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

const variantStyles: Record<ButtonVariant, { bg: string; color: string; border: string; hoverBg: string; hoverBorder: string; activeBg: string }> = {
  primary: { bg: 'var(--accent, #2563eb)', color: '#ffffff', border: 'var(--accent, #2563eb)', hoverBg: 'var(--accent-hover, #1d4ed8)', hoverBorder: 'var(--accent-hover, #1d4ed8)', activeBg: 'var(--accent-active, #1e40af)' },
  secondary: { bg: 'var(--bg-card, #ffffff)', color: 'var(--text-primary, #0f172a)', border: 'var(--border, #e2e8f0)', hoverBg: 'var(--bg-page, #f8fafc)', hoverBorder: 'var(--border-hover, #cbd5e1)', activeBg: 'var(--bg-page, #f1f5f9)' },
  danger: { bg: 'var(--error, #dc2626)', color: '#ffffff', border: 'var(--error, #dc2626)', hoverBg: 'var(--error-dark, #b91c1c)', hoverBorder: 'var(--error-dark, #b91c1c)', activeBg: 'var(--error-dark, #991b1b)' },
  ghost: { bg: 'transparent', color: 'var(--text-primary, #0f172a)', border: 'transparent', hoverBg: 'var(--bg-page, #f1f5f9)', hoverBorder: 'transparent', activeBg: 'var(--bg-page, #e2e8f0)' },
  outline: { bg: 'transparent', color: 'var(--accent, #2563eb)', border: 'var(--accent, #2563eb)', hoverBg: 'var(--accent-light, #dbeafe)', hoverBorder: 'var(--accent, #2563eb)', activeBg: 'var(--accent-light, #bfdbfe)' },
};

const sizeStyles: Record<ButtonSize, { height: number; px: number; fontSize: string; gap: number }> = {
  sm: { height: 32, px: 12, fontSize: typography.fontSize.sm, gap: 6 },
  md: { height: 40, px: 16, fontSize: typography.fontSize.sm, gap: 8 },
  lg: { height: 48, px: 20, fontSize: typography.fontSize.base, gap: 10 },
};

export const Button: FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', disabled = false, loading = false,
  fullWidth = false, icon, iconPosition = 'left', type = 'button',
  onClick, style, className, ariaLabel, tabIndex,
}) => {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  const baseStyle = useMemo(() => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${ss.gap}px`,
    height: `${ss.height}px`,
    padding: `0 ${ss.px}px`,
    fontSize: ss.fontSize,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.body,
    lineHeight: typography.lineHeight.none,
    color: vs.color,
    backgroundColor: vs.bg,
    border: `1px solid ${vs.border}`,
    borderRadius: radius.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : undefined,
    transition: `background-color ${animation.duration.fast} ${animation.easing.ease}, border-color ${animation.duration.fast} ${animation.easing.ease}, opacity ${animation.duration.fast} ${animation.easing.ease}`,
    outline: 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    width: fullWidth ? '100%' : undefined,
    textDecoration: 'none',
  } as React.CSSProperties), [vs, ss, disabled, fullWidth]);

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={(e) => { if (!disabled && !loading) onClick?.(e); }}
      style={{ ...baseStyle, ...style }}
      className={className}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.backgroundColor = vs.hoverBg; e.currentTarget.style.borderColor = vs.hoverBorder; } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.backgroundColor = vs.bg; e.currentTarget.style.borderColor = vs.border; } }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.backgroundColor = vs.activeBg; }}
      onMouseUp={e => { if (!disabled) e.currentTarget.style.backgroundColor = vs.hoverBg; }}
      onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)'; }}
      onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
          <svg width={ss.height * 0.4} height={ss.height * 0.4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </span>
      ) : icon && iconPosition === 'left' ? icon : null}
      {children}
      {icon && iconPosition === 'right' && !loading ? icon : null}
    </button>
  );
};
