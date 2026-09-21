# Skeleton

Content placeholder with text (single/multi-line), circular, rectangular, and card variants.

## Props

| Prop | Type | Default |
|------|------|---------|
| variant | 'text' \| 'circular' \| 'rectangular' \| 'card' | 'text' |
| width | string \| number | - |
| height | string \| number | - |
| lines | number | 1 |
| lineHeight | number | 14 |
| spacing | number | 8 |
| borderRadius | string | - |
| style | CSSProperties | - |
| className | string | - |

## Usage

```tsx
<Skeleton variant="text" lines={3} />
<Skeleton variant="circular" width={40} height={40} />
<Skeleton variant="card" />
<Skeleton variant="rectangular" height={200} />
<Skeleton variant="text" width="60%" />
```

## Testing

Test multi-line text skeleton renders correct line count with last line shorter, circular variant is round (borderRadius 50%), card variant renders all child skeleton elements, animation class present, custom dimensions override defaults.
