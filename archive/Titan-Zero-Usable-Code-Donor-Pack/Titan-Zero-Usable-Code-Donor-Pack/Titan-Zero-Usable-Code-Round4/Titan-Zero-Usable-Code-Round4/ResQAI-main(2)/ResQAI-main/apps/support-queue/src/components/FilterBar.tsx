import React, { memo } from 'react';
import type { FilterMode } from '../state/atoms';

interface FilterBarProps {
  current: FilterMode;
  onFilter: (mode: FilterMode) => void;
  counts: Record<FilterMode, number>;
}

const FILTERS: { key: FilterMode; label: string }[] = [
  { key: 'open', label: 'All open' },
  { key: 'urgent', label: 'Urgent only' },
  { key: 'new', label: 'New' },
  { key: 'awaiting_approval', label: 'Awaiting approval' },
  { key: 'all', label: 'All' },
];

export const FilterBar = memo(function FilterBar({ current, onFilter, counts }: FilterBarProps) {
  return (
    <div style={styles.bar}>
      {FILTERS.map((f) => (
        <button
          key={f.key}
          className={current === f.key ? 'badge good' : 'badge plain'}
          onClick={() => onFilter(f.key)}
          style={styles.chip}
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
    gap: 8,
    flexWrap: 'wrap',
    padding: '12px 0',
  },
  chip: {
    cursor: 'pointer',
    fontSize: 13,
    border: 'none',
  },
  count: {
    marginLeft: 4,
    opacity: 0.7,
  },
};
