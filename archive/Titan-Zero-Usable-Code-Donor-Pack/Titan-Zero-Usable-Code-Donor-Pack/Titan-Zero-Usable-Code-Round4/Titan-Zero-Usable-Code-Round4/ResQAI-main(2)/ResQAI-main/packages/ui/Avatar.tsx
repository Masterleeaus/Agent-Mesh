import type { FC, CSSProperties } from 'react';

interface AvatarProps {
  name: string;
  size?: number;
  style?: CSSProperties;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const Avatar: FC<AvatarProps> = ({ name, size = 32, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'var(--accent)',
      color: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: size * 0.4,
      flexShrink: 0,
      ...style,
    }}
  >
    {initials(name)}
  </div>
);
