# ErrorState

A composable error display with icon, message, retry button, and full-page mode.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | 'Something went wrong' | Error heading |
| message | string | — | Custom error message (overrides error) |
| error | Error \| string | — | Error object or string to derive message |
| icon | ReactNode | — | Custom error icon |
| action | ReactNode | — | Additional action content |
| onRetry | () => void | — | Retry button callback |
| retryLabel | string | 'Try Again' | Retry button text |
| fullPage | boolean | false | Centers in full viewport height |
| style | CSSProperties | — | Content wrapper styles |
| className | string | — | CSS class |

## Message resolution

1. If `message` is provided, use it directly
2. If `error` is a string, use as message
3. If `error` is an Error, use `.message`
4. Fallback: generic error message

## Usage

```tsx
import { ErrorState } from '../ErrorState';

function Example() {
  return (
    <ErrorState
      error={new Error('Failed to load data')}
      onRetry={() => fetchData()}
      fullPage
    />
  );
}
```

## Testing strategy

- Verify title, message, icon render correctly
- Verify error prop (string and Error) resolves to message
- Verify onRetry fires with correct label
- Verify fullPage applies minHeight viewport
- Verify fallback message when no props provided
