# Filter

Multi-group checkbox filter panel with search, active chips, collapsible groups, and apply/clear actions.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| groups | FilterGroup[] | required | Filter group definitions |
| values | Record<string, string[]> | required | Current selected values per group |
| onChange | (groupId, value, checked) => void | required | Selection change handler |
| onClear | () => void | — | Clear all filters handler |
| onApply | () => void | — | Apply button handler |
| searchable | boolean | false | Enable filter search input |
| searchPlaceholder | string | 'Search filters...' | Search input placeholder |
| style | CSSProperties | — | Root container styles |
| className | string | — | CSS class |

### FilterGroup

| Prop | Type | Description |
|------|------|-------------|
| id | string | Unique group identifier |
| label | string | Group display label |
| options | FilterOption[] | List of selectable options |
| type | 'checkbox' \| 'radio' \| 'switch' | Selection type (default checkbox) |

### FilterOption

| Prop | Type | Description |
|------|------|-------------|
| label | string | Display label |
| value | string | Option value |
| count | number | Optional result count badge |

## Usage

```tsx
import { Filter } from '../Filter';

const groups = [
  { id: 'status', label: 'Status', options: [
    { label: 'Active', value: 'active', count: 12 },
    { label: 'Inactive', value: 'inactive', count: 4 },
  ]},
];

function Example() {
  const [values, setValues] = useState<Record<string, string[]>>({});
  return (
    <Filter
      groups={groups}
      values={values}
      onChange={(g, v, c) => setValues(prev => ({
        ...prev,
        [g]: c ? [...(prev[g]||[]), v] : (prev[g]||[]).filter(x => x !== v)
      }))}
      searchable
      onApply={() => console.log('Apply', values)}
    />
  );
}
```

## Testing strategy

- Verify checkbox toggle updates values and calls onChange with correct params
- Verify active filter chips render with removable X button
- Verify search filters groups/options by label text
- Verify collapsible groups toggle on header click
- Verify onApply and onClear callbacks fire correctly
