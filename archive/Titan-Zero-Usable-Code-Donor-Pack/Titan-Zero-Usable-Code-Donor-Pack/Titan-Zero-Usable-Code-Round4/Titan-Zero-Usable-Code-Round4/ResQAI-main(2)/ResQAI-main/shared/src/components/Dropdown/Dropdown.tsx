import { useState, useRef, useEffect, useMemo, useCallback, type FC } from 'react';
import type { DropdownProps, DropdownOption } from './Dropdown.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

const sizeConfig = {
  sm: { height: 32, fontSize: typography.fontSize.xs, px: 10 },
  md: { height: 40, fontSize: typography.fontSize.sm, px: 12 },
  lg: { height: 48, fontSize: typography.fontSize.base, px: 14 },
};

export function Dropdown<T = string>({
  options, value, onChange, placeholder = 'Select...', label, error,
  disabled = false, clearable = false, searchable = false, loading = false,
  size = 'md', noOptionsMessage = 'No options', style, className, menuStyle,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const sc = sizeConfig[size];

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchable || !search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, searchable, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false); setSearch(''); setFocusedIdx(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((option: DropdownOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false); setSearch(''); setFocusedIdx(-1);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') { setIsOpen(true); setFocusedIdx(0); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setFocusedIdx(prev => Math.min(prev + 1, filteredOptions.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setFocusedIdx(prev => Math.max(prev - 1, 0)); break;
      case 'Enter': if (focusedIdx >= 0 && filteredOptions[focusedIdx]) handleSelect(filteredOptions[focusedIdx]); break;
      case 'Escape': setIsOpen(false); setSearch(''); setFocusedIdx(-1); break;
    }
  };

  const triggerBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: `${sc.height}px`, padding: `0 ${sc.px}px`,
    backgroundColor: disabled ? 'var(--bg-page, #f8fafc)' : 'var(--bg-input, #ffffff)',
    border: `1px solid ${error ? 'var(--error, #dc2626)' : 'var(--border, #e2e8f0)'}`,
    borderRadius: radius.md, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `border-color ${animation.duration.fast} ${animation.easing.ease}`,
    fontSize: sc.fontSize, fontFamily: typography.fontFamily.body,
    color: selectedOption ? 'var(--text-primary, #0f172a)' : 'var(--text-placeholder, #94a3b8)',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }} className={className}>
      {label && (
        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: 'var(--text-secondary, #475569)', marginBottom: spacing[1], fontFamily: typography.fontFamily.body }}>
          {label}
        </div>
      )}
      <div
        role="combobox" aria-expanded={isOpen} aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0} onKeyDown={handleKeyDown}
        onClick={() => { if (!disabled) { setIsOpen(!isOpen); setSearch(''); } }}
        style={triggerBase}
      >
        {searchable && isOpen ? (
          <input
            autoFocus value={search} onChange={e => setSearch(e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: sc.fontSize, fontFamily: typography.fontFamily.body, color: 'var(--text-primary, #0f172a)' }}
            placeholder={placeholder}
          />
        ) : (
          <span>{selectedOption?.label || placeholder}</span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
          {clearable && value && !disabled && (
            <span onClick={handleClear} style={{ display: 'flex', cursor: 'pointer', color: 'var(--text-muted, #94a3b8)' }} role="button" tabIndex={-1}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </span>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : undefined, transition: `transform ${animation.duration.fast} ${animation.easing.ease}` }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {error && <div style={{ fontSize: typography.fontSize.xs, color: 'var(--error, #dc2626)', marginTop: spacing[0.5], fontFamily: typography.fontFamily.body }}>{error}</div>}
      {isOpen && (
        <div role="listbox" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: spacing[1],
          backgroundColor: 'var(--bg-elevated, #ffffff)', border: '1px solid var(--border, #e2e8f0)',
          borderRadius: radius.md, boxShadow: '0px 4px 6px rgba(0,0,0,0.1)', zIndex: 1000,
          maxHeight: '256px', overflowY: 'auto', ...menuStyle,
        }}>
          {loading ? (
            <div style={{ padding: spacing[3], textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: typography.fontSize.sm }}>Loading...</div>
          ) : filteredOptions.length === 0 ? (
            <div style={{ padding: spacing[3], textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: typography.fontSize.sm }}>{noOptionsMessage}</div>
          ) : filteredOptions.map((option, idx) => (
            <div
              key={String(option.value)}
              role="option" aria-selected={value === option.value}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setFocusedIdx(idx)}
              style={{
                display: 'flex', alignItems: 'center', gap: spacing[2],
                padding: `${spacing[2]} ${sc.px}px`, cursor: option.disabled ? 'not-allowed' : 'pointer',
                backgroundColor: value === option.value ? 'var(--accent-light, #dbeafe)' : focusedIdx === idx ? 'var(--bg-page, #f8fafc)' : 'transparent',
                color: option.disabled ? 'var(--text-disabled, #cbd5e1)' : 'var(--text-primary, #0f172a)',
                fontSize: sc.fontSize, fontFamily: typography.fontFamily.body,
                transition: `background-color ${animation.duration.fast} ${animation.easing.ease}`,
              }}
            >
              {option.icon && <span style={{ display: 'flex', color: 'var(--text-muted, #94a3b8)' }}>{option.icon}</span>}
              <div style={{ flex: 1 }}>
                <div>{option.label}</div>
                {option.description && <div style={{ fontSize: typography.fontSize.xs, color: 'var(--text-muted, #94a3b8)', marginTop: spacing[0.5] }}>{option.description}</div>}
              </div>
              {value === option.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #2563eb)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
