import type { FC, ReactNode, MouseEvent, CSSProperties } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
  className?: string;
  type?: 'button' | 'submit';
}

const variantStyles: Record<string, CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: '#000',
    border: 'none',
  },
  secondary: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  },
  danger: {
    background: 'transparent',
    color: 'var(--bad)',
    border: '1px solid var(--bad)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
  },
};

const sizeStyles: Record<string, CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: 12 },
  md: { padding: '8px 16px', fontSize: 13 },
  lg: { padding: '12px 28px', fontSize: 15 },
};

export const Button: FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'secondary',
  size = 'md',
  style,
  className,
  type = 'button',
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={className}
    style={{
      borderRadius: 'var(--radius, 6px)',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      fontFamily: 'inherit',
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    }}
  >
    {children}
  </button>
);
