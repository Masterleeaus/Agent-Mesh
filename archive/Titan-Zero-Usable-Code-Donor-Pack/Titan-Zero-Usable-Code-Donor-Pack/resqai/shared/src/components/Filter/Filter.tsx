import { useState, useMemo, type FC } from 'react';
import type { FilterProps, ActiveFilter } from './Filter.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

export const Filter: FC<FilterProps> = ({ groups, values, onChange, onClear, onApply, searchable = false, searchPlaceholder = 'Search filters...', style, className }) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    const q = search.toLowerCase();
    return groups.map(g => ({ ...g, options: g.options.filter(o => o.label.toLowerCase().includes(q)) })).filter(g => g.options.length > 0);
  }, [groups, search]);

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const result: ActiveFilter[] = [];
    for (const group of groups) {
      const vals = values[group.id] || [];
      for (const v of vals) {
        const opt = group.options.find(o => o.value === v);
        if (opt) result.push({ groupId: group.id, groupLabel: group.label, value: v, label: opt.label });
      }
    }
    return result;
  }, [groups, values]);

  const totalActive = activeFilters.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], ...style }} className={className}>
      {searchable && (
        <div style={{ display: 'flex', alignItems: 'center', height: 32, padding: `0 ${spacing[2]}`, border: '1px solid var(--border, #e2e8f0)', borderRadius: radius.md, backgroundColor: 'var(--bg-input, #ffffff)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted, #94a3b8)" strokeWidth="2" style={{ marginRight: spacing[1] }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body, color: 'var(--text-primary, #0f172a)' }} />
        </div>
      )}
      {totalActive > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[1] }}>
          {activeFilters.map(af => (
            <span key={`${af.groupId}-${af.value}`} style={{ display: 'inline-flex', alignItems: 'center', gap: spacing[1], padding: `2px ${spacing[2]}`, fontSize: typography.fontSize.xs, backgroundColor: 'var(--accent-light, #dbeafe)', color: 'var(--accent, #2563eb)', borderRadius: radius.full, fontFamily: typography.fontFamily.body }}>
              {af.label}
              <button type="button" onClick={() => onChange(af.groupId, af.value, false)} style={{ display: 'flex', padding: 0, border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </span>
          ))}
          {onClear && <button type="button" onClick={onClear} style={{ padding: `2px ${spacing[2]}`, fontSize: typography.fontSize.xs, border: 'none', background: 'transparent', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', fontFamily: typography.fontFamily.body }}>Clear all</button>}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
        {filteredGroups.map(group => (
          <div key={group.id} style={{ border: '1px solid var(--border, #e2e8f0)', borderRadius: radius.md, overflow: 'hidden' }}>
            <div onClick={() => setExpanded(prev => ({ ...prev, [group.id]: !prev[group.id] }))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${spacing[2]} ${spacing[3]}`, cursor: 'pointer', backgroundColor: 'var(--bg-page, #f8fafc)', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, fontFamily: typography.fontFamily.body, color: 'var(--text-primary, #0f172a)' }}>
              <span>{group.label}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded[group.id] ? 'rotate(180deg)' : undefined, transition: `transform ${animation.duration.fast} ${animation.easing.ease}` }}><polyline points="6 9 12 15 18 9" /></svg>
            </div>
            {(expanded[group.id] ?? true) && (
              <div style={{ padding: spacing[1] }}>
                {group.options.map(opt => {
                  const checked = (values[group.id] || []).includes(opt.value);
                  return (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: spacing[2], padding: `${spacing[1.5]} ${spacing[2]}`, cursor: 'pointer', fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body, color: 'var(--text-primary, #0f172a)', borderRadius: radius.sm, transition: `background-color ${animation.duration.fast} ${animation.easing.ease}` }}>
                      <input type="checkbox" checked={checked} onChange={e => onChange(group.id, opt.value, e.target.checked)} style={{ accentColor: 'var(--accent, #2563eb)' }} />
                      <span style={{ flex: 1 }}>{opt.label}</span>
                      {opt.count !== undefined && <span style={{ fontSize: typography.fontSize.xs, color: 'var(--text-muted, #94a3b8)' }}>({opt.count})</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      {onApply && (
        <button type="button" onClick={onApply} style={{ width: '100%', height: 36, border: 'none', borderRadius: radius.md, backgroundColor: 'var(--accent, #2563eb)', color: '#ffffff', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, cursor: 'pointer', fontFamily: typography.fontFamily.body }}>
          Apply Filters {totalActive > 0 && `(${totalActive})`}
        </button>
      )}
    </div>
  );
};
