# EmptyState

A centered placeholder component for empty list views and no-results states.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Heading text |
| description | string | — | Supporting description |
| icon | ReactNode | — | Custom icon element |
| action | ReactNode | — | Call-to-action content (e.g. button) |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Controls spacing and typography scale |
| style | CSSProperties | — | Root element styles |
| className | string | — | CSS class |

## Size reference

| Size | Icon | Title | Description | Padding |
|------|------|-------|-------------|---------|
| sm | 32px | base | xs | 1.5rem |
| md | 48px | lg | sm | 2.5rem |
| lg | 64px | xl | base | 3.5rem |

## Usage

```tsx
import { EmptyState } from '../EmptyState';

function Example() {
  return (
    <EmptyState
      title="No results found"
      description="Try adjusting your search or filter criteria."
      size="md"
      action={<button>Clear Filters</button>}
    />
  );
}
```

## Testing strategy

- Verify title, description render in the DOM
- Verify icon slot renders custom element
- Verify action slot renders call-to-action
- Verify size prop applies correct padding and font sizes
- Verify description respects maxWidth constraint
