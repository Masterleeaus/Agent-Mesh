import { useMemo, type FC } from 'react';
import type { StatusBadgeProps, StatusVariant } from './StatusBadge.types';
import { radius, spacing, typography } from '../../design-system/tokens';

const variantColors: Record<StatusVariant, { bg: string; color: string; dot: string }> = {
  success: { bg: 'var(--success-light, #dcfce7)', color: 'var(--success-dark, #15803d)', dot: 'var(--success, #16a34a)' },
  warning: { bg: 'var(--warning-light, #fef3c7)', color: 'var(--warning-dark, #b45309)', dot: 'var(--warning, #d97706)' },
  error: { bg: 'var(--error-light, #fee2e2)', color: 'var(--error-dark, #b91c1c)', dot: 'var(--error, #dc2626)' },
  info: { bg: 'var(--info-light, #dbeafe)', color: 'var(--info-dark, #1d4ed8)', dot: 'var(--info, #2563eb)' },
  neutral: { bg: 'var(--bg-page, #f1f5f9)', color: 'var(--text-secondary, #475569)', dot: 'var(--text-muted, #94a3b8)' },
};

const sizeStyles = {
  sm: { height: 20, fontSize: typography.fontSize.xs, px: spacing[2], dotSize: 6 },
  md: { height: 24, fontSize: typography.fontSize.xs, px: spacing[2.5], dotSize: 8 },
};

export const StatusBadge: FC<StatusBadgeProps> = ({
  children, variant = 'neutral', dot = true, size = 'md', pulse = false, style, className,
}) => {
  const vc = variantColors[variant];
  const ss = sizeStyles[size];

  const badgeStyle = useMemo(() => ({
    display: 'inline-flex', alignItems: 'center', gap: spacing[1.5],
    height: `${ss.height}px`, padding: `0 ${ss.px}px`,
    backgroundColor: vc.bg, color: vc.color,
    borderRadius: radius.full, fontSize: ss.fontSize,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.body,
    whiteSpace: 'nowrap' as const,
    ...style,
  } as React.CSSProperties), [vc, ss, style]);

  return (
    <span style={badgeStyle} className={className}>
      {dot && (
        <span style={{
          width: ss.dotSize, height: ss.dotSize, borderRadius: '50%',
          backgroundColor: vc.dot, flexShrink: 0,
          animation: pulse ? 'pulse 2s infinite' : undefined,
        }} />
      )}
      {children}
    </span>
  );
};
