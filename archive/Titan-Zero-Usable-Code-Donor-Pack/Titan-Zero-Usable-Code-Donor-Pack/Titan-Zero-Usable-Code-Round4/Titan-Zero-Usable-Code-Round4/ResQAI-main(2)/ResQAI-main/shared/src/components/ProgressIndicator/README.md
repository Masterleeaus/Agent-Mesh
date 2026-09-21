# ProgressIndicator

Linear and circular progress bar with label, indeterminate mode, 3 sizes, 4 colors, and configurable label position.

## Props

| Prop | Type | Default |
|------|------|---------|
| value | number | required |
| max | number | 100 |
| variant | 'linear' \| 'circular' | 'linear' |
| size | 'sm' \| 'md' \| 'lg' | 'md' |
| color | 'primary' \| 'success' \| 'warning' \| 'error' | 'primary' |
| showLabel | boolean | false |
| labelPosition | 'top' \| 'right' \| 'bottom' | 'right' |
| indeterminate | boolean | false |
| style | CSSProperties | - |
| className | string | - |
| trackStyle | CSSProperties | - |
| fillStyle | CSSProperties | - |

## Usage

```tsx
<ProgressIndicator value={75} variant="linear" showLabel />
<ProgressIndicator value={60} variant="circular" color="success" size="lg" showLabel />
<ProgressIndicator indeterminate variant="linear" color="primary" />
<ProgressIndicator value={42} showLabel labelPosition="top" />
```

## Testing

Test value clamping (0-100), indeterminate animation class, circular SVG rendering and stroke-dashoffset calculation, label positioning, color variants, size differences.
