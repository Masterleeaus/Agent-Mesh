import type { FC, CSSProperties } from 'react';

interface SkeletonLoaderProps {
  lines?: number;
  width?: string;
  height?: string;
  style?: CSSProperties;
}

export const SkeletonLoader: FC<SkeletonLoaderProps> = ({
  lines = 3,
  width = '100%',
  height = '14px',
  style,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        style={{
          width: i === lines - 1 ? '60%' : width,
          height,
          borderRadius: 4,
          background: 'var(--border, rgba(255,255,255,0.05))',
          animation: 'pulse 1.5s infinite',
        }}
      />
    ))}
  </div>
);
