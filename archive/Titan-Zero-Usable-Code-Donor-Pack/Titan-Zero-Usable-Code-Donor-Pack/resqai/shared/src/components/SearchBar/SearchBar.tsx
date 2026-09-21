import { useState, useEffect, useRef, type FC } from 'react';
import type { SearchBarProps } from './SearchBar.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

const sizeConfig = { sm: { height: 32, fontSize: typography.fontSize.xs, px: 10 }, md: { height: 40, fontSize: typography.fontSize.sm, px: 12 }, lg: { height: 48, fontSize: typography.fontSize.base, px: 14 } };
const variantBg = { default: 'var(--bg-input, #ffffff)', filled: 'var(--bg-page, #f8fafc)', minimal: 'transparent' };

export const SearchBar: FC<SearchBarProps> = ({
  value, onChange, placeholder = 'Search...', onSearch, debounceMs = 300,
  size = 'md', variant = 'default', autoFocus = false, disabled = false, style, className,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const sc = sizeConfig[size];
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalValue(value); }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) onChange(localValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { onSearch?.(localValue); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: sc.height, padding: `0 ${sc.px}px`, backgroundColor: disabled ? 'var(--bg-page, #f8fafc)' : variantBg[variant], border: variant === 'default' ? '1px solid var(--border, #e2e8f0)' : 'none', borderRadius: radius.lg, transition: `border-color ${animation.duration.fast} ${animation.easing.ease}`, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : undefined, width: '100%', ...style }} className={className}>
      <svg width={sc.fontSize === typography.fontSize.base ? 18 : 16} height={sc.fontSize === typography.fontSize.base ? 18 : 16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted, #94a3b8)" strokeWidth="2" style={{ flexShrink: 0, marginRight: spacing[2] }}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        type="text" value={localValue} disabled={disabled}
        onChange={e => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder} autoFocus={autoFocus}
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: sc.fontSize, fontFamily: typography.fontFamily.body, color: 'var(--text-primary, #0f172a)' }}
        aria-label={placeholder}
      />
      {localValue && !disabled && (
        <button type="button" onClick={() => { setLocalValue(''); onChange(''); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: spacing[1], color: 'var(--text-muted, #94a3b8)', flexShrink: 0 }} aria-label="Clear">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      )}
    </div>
  );
};
