# SearchBar

A debounced search input with icon, clear button, and keyboard search trigger.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string | required | Controlled input value |
| onChange | (value: string) => void | required | Debounced change handler |
| placeholder | string | 'Search...' | Input placeholder |
| onSearch | (value: string) => void | — | Triggered on Enter key |
| debounceMs | number | 300 | Debounce delay in ms |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Height and font size |
| variant | 'default' \| 'filled' \| 'minimal' | 'default' | Background style |
| autoFocus | boolean | false | Auto-focus on mount |
| disabled | boolean | false | Disabled state |
| style | CSSProperties | — | Root container styles |
| className | string | — | CSS class |

## Variants

| Variant | Background |
|---------|------------|
| default | var(--bg-input) with border |
| filled | var(--bg-page) |
| minimal | transparent, no border |

## Usage

```tsx
import { SearchBar } from '../SearchBar';

function Example() {
  const [query, setQuery] = useState('');
  return (
    <SearchBar
      value={query}
      onChange={setQuery}
      onSearch={v => console.log('Search:', v)}
      placeholder="Find resources..."
      size="lg"
      variant="filled"
    />
  );
}
```

## Testing strategy

- Verify debounced onChange fires after debounceMs delay
- Verify onSearch fires on Enter key
- Verify clear button resets value and calls onChange('')
- Verify controlled value updates via prop changes
- Verify disabled state prevents interaction
- Verify size/variant apply correct dimensions and background
