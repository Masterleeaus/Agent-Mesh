import React, { memo } from 'react';
import type { HealthFilter } from '../state/atoms';

interface FilterBarProps {
  current: HealthFilter;
  onFilter: (filter: HealthFilter) => void;
  counts: Record<HealthFilter, number>;
}

const FILTERS: { key: HealthFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'healthy', label: 'Healthy' },
  { key: 'watch', label: 'watch' },
  { key: 'slipping', label: 'Slipping' },
  { key: 'critical', label: 'Critical' },
];

export const FilterBar = memo(function FilterBar({ current, onFilter, counts }: FilterBarProps) {
  return (
    <div style={styles.bar}>
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onFilter(f.key)}
          style={{
            ...styles.chip,
            ...(current === f.key ? styles.chipActive : {}),
          }}
        >
          {f.label}
          <span style={styles.count}>({counts[f.key]})</span>
        </button>
      ))}
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    padding: '8px 0',
  },
  chip: {
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid var(--line, #e7e0cf)',
    background: 'transparent',
    color: 'var(--muted, #6b6353)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: 'var(--ink, #1a1813)',
    color: 'var(--card, #fffefa)',
    borderColor: 'var(--ink, #1a1813)',
  },
  count: {
    marginLeft: 4,
    opacity: 0.7,
  },
};
