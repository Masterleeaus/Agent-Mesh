import { useMemo, useRef, useState, type FC } from 'react';
import type { InputProps, InputSize } from './Input.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

const sizeConfig: Record<InputSize, { height: number; fontSize: string; px: number }> = {
  sm: { height: 32, fontSize: typography.fontSize.xs, px: 10 },
  md: { height: 40, fontSize: typography.fontSize.sm, px: 12 },
  lg: { height: 48, fontSize: typography.fontSize.base, px: 14 },
};

export const Input: FC<InputProps> = ({
  value, onChange, placeholder, label, error, hint, disabled = false, readOnly = false,
  required = false, type = 'text', size = 'md', icon, iconPosition = 'left', clearable = false,
  maxLength, name, id, autoFocus = false, autoComplete, onFocus, onBlur, onKeyDown, onClear,
  style, className, inputStyle, inputClassName,
}) => {
  const sc = sizeConfig[size];
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const containerStyle = useMemo(() => ({ display: 'flex', flexDirection: 'column' as const, gap: spacing[1], width: '100%', ...style }), [style]);
  const labelStyle = useMemo(() => ({ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: 'var(--text-secondary, #475569)', fontFamily: typography.fontFamily.body }), []);
  const wrapperStyle = useMemo(() => ({
    display: 'flex', alignItems: 'center', height: `${sc.height}px`, padding: `0 ${sc.px}px`,
    backgroundColor: disabled ? 'var(--bg-page, #f8fafc)' : 'var(--bg-input, #ffffff)',
    border: `1px solid ${error ? 'var(--error, #dc2626)' : focused ? 'var(--border-focus, #2563eb)' : 'var(--border, #e2e8f0)'}`,
    borderRadius: radius.md, transition: `border-color ${animation.duration.fast} ${animation.easing.ease}, box-shadow ${animation.duration.fast} ${animation.easing.ease}`,
    boxShadow: focused && !error ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : undefined,
    cursor: disabled ? 'not-allowed' : 'text', opacity: disabled ? 0.5 : 1,
  }), [sc, error, focused, disabled]);

  const inputBaseStyle = useMemo(() => ({
    flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent',
    fontSize: sc.fontSize, fontFamily: typography.fontFamily.body,
    color: 'var(--text-primary, #0f172a)', padding: 0, margin: 0, width: '100%', minWidth: 0,
  } as React.CSSProperties), [sc]);

  const iconStyle = useMemo(() => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: focused ? 'var(--accent, #2563eb)' : 'var(--text-muted, #94a3b8)',
    transition: `color ${animation.duration.fast} ${animation.easing.ease}`,
    marginLeft: iconPosition === 'right' ? spacing[2] : undefined,
    marginRight: iconPosition === 'left' ? spacing[2] : undefined,
  }), [focused, iconPosition]);

  const errorStyle = useMemo(() => ({ fontSize: typography.fontSize.xs, color: 'var(--error, #dc2626)', marginTop: spacing[0.5], fontFamily: typography.fontFamily.body }), []);
  const hintStyle = useMemo(() => ({ fontSize: typography.fontSize.xs, color: 'var(--text-muted, #94a3b8)', marginTop: spacing[0.5], fontFamily: typography.fontFamily.body }), []);

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => { setFocused(true); onFocus?.(e); };
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => { setFocused(false); onBlur?.(e); };

  return (
    <div style={containerStyle} className={className}>
      {label && (
        <label style={labelStyle} htmlFor={id || name}>
          {label}{required && <span style={{ color: 'var(--error, #dc2626)', marginLeft: spacing[0.5] }}>*</span>}
        </label>
      )}
      <div style={wrapperStyle} className={inputClassName}>
        {icon && iconPosition === 'left' && <span style={iconStyle}>{icon}</span>}
        <input
          ref={inputRef}
          id={id || name} name={name} type={type} value={value}
          onChange={onChange} placeholder={placeholder} disabled={disabled}
          readOnly={readOnly} required={required} maxLength={maxLength}
          autoFocus={autoFocus} autoComplete={autoComplete}
          onFocus={handleFocus} onBlur={handleBlur} onKeyDown={onKeyDown}
          style={{ ...inputBaseStyle, ...inputStyle }} className={inputClassName}
          aria-invalid={!!error} aria-describedby={error ? `${id || name}-error` : undefined}
        />
        {icon && iconPosition === 'right' && <span style={iconStyle}>{icon}</span>}
        {clearable && value.length > 0 && !disabled && (
          <button type="button" onClick={onClear} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: spacing[1], color: 'var(--text-muted, #94a3b8)', marginLeft: spacing[1], borderRadius: radius.sm }} aria-label="Clear" tabIndex={-1}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        )}
      </div>
      {error && <span id={`${id || name}-error`} style={errorStyle} role="alert">{error}</span>}
      {hint && !error && <span style={hintStyle}>{hint}</span>}
    </div>
  );
};
