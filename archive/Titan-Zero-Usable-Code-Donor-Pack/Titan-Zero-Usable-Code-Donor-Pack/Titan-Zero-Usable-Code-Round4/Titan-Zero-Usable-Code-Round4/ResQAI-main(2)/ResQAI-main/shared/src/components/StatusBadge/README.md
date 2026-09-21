# StatusBadge

Status indicator with colored dot, 5 variants, 2 sizes, and optional pulse animation.

## Variants

- `success` (green), `warning` (amber), `error` (red), `info` (blue), `neutral` (gray)

## Props

| Prop | Type | Default |
|------|------|---------|
| children | ReactNode | required |
| variant | StatusVariant | 'neutral' |
| dot | boolean | true |
| size | 'sm' \| 'md' | 'md' |
| pulse | boolean | false |
| style | CSSProperties | - |
| className | string | - |

## Usage

```tsx
<StatusBadge variant="success" pulse>Active</StatusBadge>
<StatusBadge variant="error" dot={false}>Offline</StatusBadge>
<StatusBadge variant="warning" size="sm">Pending</StatusBadge>
<StatusBadge variant="info">Processing</StatusBadge>
```

## Testing

Test variant color mapping, dot rendering, pulse animation class, size differences (height/font/dot), custom style override, children rendering.
