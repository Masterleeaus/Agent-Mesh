import { useMemo, type FC } from 'react';
import type { ProgressIndicatorProps } from './ProgressIndicator.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

const colorMap = {
  primary: 'var(--accent, #2563eb)',
  success: 'var(--success, #16a34a)',
  warning: 'var(--warning, #d97706)',
  error: 'var(--error, #dc2626)',
};

const sizeMap = {
  sm: { height: 6, fontSize: typography.fontSize.xs, circleSize: 32, strokeWidth: 4 },
  md: { height: 8, fontSize: typography.fontSize.xs, circleSize: 48, strokeWidth: 6 },
  lg: { height: 12, fontSize: typography.fontSize.sm, circleSize: 64, strokeWidth: 8 },
};

export const ProgressIndicator: FC<ProgressIndicatorProps> = ({
  value, max = 100, variant = 'linear', size = 'md', color = 'primary',
  showLabel = false, labelPosition = 'right', indeterminate = false,
  style, className, trackStyle, fillStyle,
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const sc = sizeMap[size];
  const fillColor = colorMap[color];

  if (variant === 'circular') {
    const r = (sc.circleSize - sc.strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (indeterminate ? 0.25 : pct / 100) * circ;
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: spacing[1], ...style }} className={className}>
        <svg width={sc.circleSize} height={sc.circleSize} viewBox={`0 0 ${sc.circleSize} ${sc.circleSize}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={sc.circleSize / 2} cy={sc.circleSize / 2} r={r} fill="none" stroke="var(--border, #e2e8f0)" strokeWidth={sc.strokeWidth} />
          <circle cx={sc.circleSize / 2} cy={sc.circleSize / 2} r={r} fill="none" stroke={fillColor} strokeWidth={sc.strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: `stroke-dashoffset ${animation.duration.slower} ${animation.easing.ease}` }} />
        </svg>
        {showLabel && <span style={{ fontSize: sc.fontSize, color: 'var(--text-secondary, #475569)', fontFamily: typography.fontFamily.body }}>{Math.round(pct)}%</span>}
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: spacing[2], width: '100%', ...style,
  };
  const trackStyleObj: React.CSSProperties = {
    flex: 1, height: sc.height, backgroundColor: 'var(--border, #e2e8f0)', borderRadius: radius.full, overflow: 'hidden', ...trackStyle,
  };
  const fillStyleObj: React.CSSProperties = {
    height: '100%', backgroundColor: fillColor, borderRadius: radius.full,
    width: indeterminate ? '30%' : `${pct}%`,
    transition: `width ${animation.duration.slower} ${animation.easing.ease}`,
    animation: indeterminate ? 'indeterminate 1.5s ease-in-out infinite' : undefined,
    ...fillStyle,
  };

  return (
    <div style={containerStyle} className={className}>
      {(showLabel && labelPosition === 'top') && <span style={{ fontSize: sc.fontSize, color: 'var(--text-secondary, #475569)', fontFamily: typography.fontFamily.body }}>{Math.round(pct)}%</span>}
      <div style={trackStyleObj}><div style={fillStyleObj} /></div>
      {(showLabel && labelPosition === 'right') && <span style={{ fontSize: sc.fontSize, color: 'var(--text-secondary, #475569)', fontFamily: typography.fontFamily.body, whiteSpace: 'nowrap' }}>{Math.round(pct)}%</span>}
    </div>
  );
};
