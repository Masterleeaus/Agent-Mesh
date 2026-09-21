# Loader

Loading indicator with 3 variants (spinner, dots, bar), 3 sizes, 3 colors, optional text, and full-page overlay mode.

## Props

| Prop | Type | Default |
|------|------|---------|
| size | 'sm' \| 'md' \| 'lg' | 'md' |
| variant | 'spinner' \| 'dots' \| 'bar' | 'spinner' |
| color | 'primary' \| 'secondary' \| 'white' | 'primary' |
| text | string | - |
| fullPage | boolean | false |
| overlay | boolean | false |
| style | CSSProperties | - |
| className | string | - |

## Usage

```tsx
<Loader />
<Loader variant="dots" size="lg" text="Loading..." />
<Loader variant="bar" color="white" />
<Loader fullPage overlay />
<Loader variant="spinner" color="secondary" />
```

## Testing

Test variant rendering (3 sub-components), size mapping (16/24/40px), fullPage overlay position fixed, text display, color prop applies correct color, animation CSS class present.
