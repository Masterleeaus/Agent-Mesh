import { useMemo, type FC } from 'react';
import type { LoaderProps, LoaderSize } from './Loader.types';
import { spacing, typography } from '../../design-system/tokens';

const sizeMap: Record<LoaderSize, number> = { sm: 16, md: 24, lg: 40 };
const colorMap = { primary: 'var(--accent, #2563eb)', secondary: 'var(--text-muted, #94a3b8)', white: '#ffffff' };

const Spinner: FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Dots: FC<{ size: number; color: string }> = ({ size, color }) => (
  <span style={{ display: 'inline-flex', gap: spacing[1], alignItems: 'center' }}>
    {[0, 0.2, 0.4].map((delay, i) => (
      <span key={i} style={{ width: size * 0.3, height: size * 0.3, borderRadius: '50%', backgroundColor: color, animation: `pulse 1.4s ease-in-out ${delay}s infinite` }} />
    ))}
  </span>
);

const Bar: FC<{ size: number; color: string }> = ({ size, color }) => (
  <span style={{ display: 'inline-block', width: size * 3, height: size * 0.15, borderRadius: '999px', backgroundColor: `${color}33`, overflow: 'hidden', position: 'relative' }}>
    <span style={{ display: 'block', height: '100%', width: '30%', borderRadius: '999px', backgroundColor: color, animation: 'indeterminate 1.5s ease-in-out infinite' }} />
  </span>
);

export const Loader: FC<LoaderProps> = ({
  size = 'md', variant = 'spinner', color = 'primary',
  text, fullPage = false, overlay = false, style, className,
}) => {
  const s = sizeMap[size];
  const c = colorMap[color];

  const loader = (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: spacing[2] }}>
      {variant === 'spinner' && <Spinner size={s} color={c} />}
      {variant === 'dots' && <Dots size={s} color={c} />}
      {variant === 'bar' && <Bar size={s} color={c} />}
      {text && <span style={{ fontSize: typography.fontSize.sm, color: c, fontFamily: typography.fontFamily.body }}>{text}</span>}
    </span>
  );

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: overlay ? 'rgba(0,0,0,0.3)' : 'var(--bg-page, #f8fafc)', zIndex: 9999,
        ...style,
      }} className={className}>
        {loader}
      </div>
    );
  }

  return <span style={style} className={className}>{loader}</span>;
};
