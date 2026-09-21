import { useMemo, useState, type FC } from 'react';
import type { CardProps } from './Card.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

const paddingValues = { none: '0px', sm: spacing[3], md: spacing[4], lg: spacing[6] };

const variantStyles = {
  default: { bg: 'var(--bg-card, #ffffff)', border: '1px solid var(--border, #e2e8f0)', shadow: 'none' },
  elevated: { bg: 'var(--bg-elevated, #ffffff)', border: 'none', shadow: '0px 2px 4px rgba(0,0,0,0.06), 0px 4px 6px rgba(0,0,0,0.1)' },
  bordered: { bg: 'var(--bg-card, #ffffff)', border: '2px solid var(--border, #e2e8f0)', shadow: 'none' },
  flat: { bg: 'transparent', border: 'none', shadow: 'none' },
};

export const Card: FC<CardProps> = ({
  children, padding = 'md', variant = 'default', clickable = false,
  hoverable = false, onClick, header, footer, style, className, role,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const vs = variantStyles[variant];

  const cardStyle = useMemo(() => ({
    backgroundColor: vs.bg,
    border: vs.border,
    borderRadius: radius.lg,
    boxShadow: isHovered && hoverable ? '0px 8px 16px rgba(0,0,0,0.1)' : vs.shadow,
    padding: paddingValues[padding],
    cursor: clickable ? 'pointer' : undefined,
    transition: `box-shadow ${animation.duration.normal} ${animation.easing.ease}, border-color ${animation.duration.normal} ${animation.easing.ease}`,
    ...style,
  } as React.CSSProperties), [vs, padding, isHovered, hoverable, style]);

  return (
    <div
      style={cardStyle} className={className} role={role || (clickable ? 'button' : undefined)}
      onClick={clickable ? onClick : undefined}
      onMouseEnter={() => { if (hoverable) setIsHovered(true); }}
      onMouseLeave={() => { if (hoverable) setIsHovered(false); }}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(e as unknown as MouseEvent<HTMLDivElement>); } } : undefined}
    >
      {header && (
        <div style={{ marginBottom: padding === 'none' ? 0 : spacing[3], paddingBottom: padding === 'none' ? 0 : spacing[3], borderBottom: '1px solid var(--border, #e2e8f0)' }}>
          {header}
        </div>
      )}
      {children}
      {footer && (
        <div style={{ marginTop: padding === 'none' ? 0 : spacing[3], paddingTop: padding === 'none' ? 0 : spacing[3], borderTop: '1px solid var(--border, #e2e8f0)' }}>
          {footer}
        </div>
      )}
    </div>
  );
};
