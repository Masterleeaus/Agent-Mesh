# Button

Enterprise button with 5 variants, 3 sizes, loading spinner, and icon support.

## Variants
- `primary` — main call to action
- `secondary` — alternative bordered action
- `danger` — destructive action
- `ghost` — minimal, no background
- `outline` — bordered accent

## Sizes
- `sm` (32px), `md` (40px), `lg` (48px)

## Usage
```tsx
<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="danger" loading>Deleting...</Button>
<Button variant="ghost" icon={<Icon name="settings" />}>Settings</Button>
```

## Testing
Test variant rendering, click handling, disabled state, loading spinner, focus ring, and hover transitions.
