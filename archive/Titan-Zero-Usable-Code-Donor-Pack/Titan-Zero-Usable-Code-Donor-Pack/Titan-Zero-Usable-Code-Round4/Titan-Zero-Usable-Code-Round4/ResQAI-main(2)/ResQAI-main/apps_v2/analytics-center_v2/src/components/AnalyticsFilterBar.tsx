import { Filter, Button } from '../../../../shared/src/components';
import type { FilterGroup, ActiveFilter } from '../../../../shared/src/components';

interface AnalyticsFilterBarProps {
  groups: FilterGroup[];
  values: Record<string, string[]>;
  onChange: (groupId: string, value: string, checked: boolean) => void;
  onClear: () => void;
  onApply?: () => void;
  activeFilters?: ActiveFilter[];
}

export function AnalyticsFilterBar({ groups, values, onChange, onClear, onApply, activeFilters }: AnalyticsFilterBarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Filter
          groups={groups}
          values={values}
          onChange={onChange}
          onClear={onClear}
          onApply={onApply}
          searchable
          searchPlaceholder="Search filters..."
        />
        {activeFilters && activeFilters.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {activeFilters.map((f, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  background: 'rgba(65, 209, 196, 0.1)',
                  border: '1px solid rgba(65, 209, 196, 0.2)',
                  borderRadius: 12,
                  fontSize: 11,
                  color: '#41d1c4',
                }}
              >
                {f.groupLabel}: {f.label}
              </span>
            ))}
            <Button variant="ghost" size="sm" onClick={onClear}>Clear all</Button>
          </div>
        )}
      </div>
    </div>
  );
}
