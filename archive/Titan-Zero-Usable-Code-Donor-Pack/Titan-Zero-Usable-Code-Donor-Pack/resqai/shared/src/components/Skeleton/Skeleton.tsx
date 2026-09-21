import { useMemo, type FC } from 'react';
import type { SkeletonProps } from './Skeleton.types';
import { radius, spacing } from '../../design-system/tokens';

const baseStyle: React.CSSProperties = {
  backgroundColor: 'var(--border, #e2e8f0)',
  animation: 'pulse 1.5s ease-in-out infinite',
};

export const Skeleton: FC<SkeletonProps> = ({
  variant = 'text', width, height, lines = 1,
  lineHeight = 14, spacing: lineSpacing = 8, borderRadius, style, className,
}) => {
  const commonStyle = useMemo(() => ({
    ...baseStyle,
    borderRadius: borderRadius || (variant === 'circular' ? '50%' : variant === 'text' ? radius.sm : radius.md),
    width: width || (variant === 'circular' ? (height || 40) : '100%'),
    height: height || (variant === 'text' ? lineHeight : variant === 'circular' ? 40 : 100),
    ...style,
  } as React.CSSProperties), [variant, width, height, lineHeight, borderRadius, style]);

  if (variant === 'card') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], padding: spacing[4], border: '1px solid var(--border, #e2e8f0)', borderRadius: radius.lg, ...style }} className={className}>
        <div style={{ ...baseStyle, width: '40%', height: 14, borderRadius: radius.sm }} />
        <div style={{ ...baseStyle, width: '100%', height: 80, borderRadius: radius.md }} />
        <div style={{ ...baseStyle, width: '60%', height: 12, borderRadius: radius.sm }} />
        <div style={{ ...baseStyle, width: '80%', height: 12, borderRadius: radius.sm }} />
      </div>
    );
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: lineSpacing, width: width || '100%', ...style }} className={className}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} style={{ ...baseStyle, width: i === lines - 1 ? '60%' : '100%', height: lineHeight, borderRadius: radius.sm }} />
        ))}
      </div>
    );
  }

  return <div style={commonStyle} className={className} />;
};
