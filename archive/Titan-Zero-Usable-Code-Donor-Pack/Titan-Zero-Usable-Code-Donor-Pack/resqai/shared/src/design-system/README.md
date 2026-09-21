# Design System

Foundation tokens and theme provider for all ResQAI V2 applications.

## Tokens

| Token | Light | Dark | Description |
|-------|-------|------|-------------|
| Colors | `lightColors` | `darkColors` | Full color palette with status colors |
| Typography | `typography` | — | Font families, sizes, weights, line heights |
| Spacing | `spacing` | — | 24-step spacing scale (0–48rem) |
| Elevation | `lightElevation` | `darkElevation` | 6-level shadow system |
| Borders | `borders` | — | Width and style tokens |
| Radius | `radius` | — | 6-level border radius scale |
| Animation | `animation` | — | Durations, easings, keyframes |
| Breakpoints | `breakpoints` | — | Responsive breakpoint constants + media query helpers |

## ThemeProvider

Wraps the application and provides `theme` object with `colors` and `elevation` matching the active mode.

```tsx
<ThemeProvider defaultMode="light">
  <App />
</ThemeProvider>
```

```tsx
const { theme, toggleMode, setMode } = useTheme();
```

## createThemeStyles

Generates a `ThemeStyles` object with pre-computed style sets for common patterns: surfaces, text, inputs, dividers, focus rings.

## Dependencies

- React 18+

## Testing Strategy

- Token values match design tokens
- ThemeProvider sets correct mode and persists to localStorage
- useTheme throws error outside provider
- createThemeStyles generates correct light/dark values
- Media query helpers generate correct strings
