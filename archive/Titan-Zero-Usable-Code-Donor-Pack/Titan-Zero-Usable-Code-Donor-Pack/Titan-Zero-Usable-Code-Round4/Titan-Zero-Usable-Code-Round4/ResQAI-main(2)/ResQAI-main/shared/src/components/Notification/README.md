# Notification & NotificationCenter

Inline alert banner (Notification) and stacked toast system (NotificationCenter).

## Props

### Notification

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | required | Alert message content |
| variant | 'success' \| 'warning' \| 'error' \| 'info' | 'info' | Visual style with icon and color |
| title | string | — | Bold title above message |
| onClose | () => void | — | Dismiss callback |
| action | ReactNode | — | Action element (e.g. button) |
| dismissible | boolean | true | Show close button |
| autoClose | number | — | Auto-dismiss timeout in ms |
| icon | ReactNode | — | Custom icon (overrides default) |
| compact | boolean | false | Reduced padding and font size |
| style | CSSProperties | — | Root element styles |
| className | string | — | CSS class |

### NotificationCenter

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| notifications | NotificationToast[] | required | Queue of toasts |
| onDismiss | (id: string) => void | required | Dismiss handler |
| position | 'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left' | 'top-right' | Fixed position |
| maxVisible | number | 5 | Max visible toasts |
| style | CSSProperties | — | Container styles |
| className | string | — | CSS class |

### NotificationToast

| Prop | Type | Description |
|------|------|-------------|
| id | string | Unique identifier |
| message | string | Toast message text |
| variant | NotificationVariant | Visual style |
| title | string | Toast title |
| duration | number | Auto-dismiss duration (overrides autoClose) |
| dismissible | boolean | Show close button |
| action | ReactNode | Action content |
| icon | ReactNode | Custom icon |
| compact | boolean | Compact mode |

## Variant colors

| Variant | Background | Border |
|---------|------------|--------|
| success | var(--success-light) | var(--success) |
| warning | var(--warning-light) | var(--warning) |
| error | var(--error-light) | var(--error) |
| info | var(--info-light) | var(--info) |

## Usage

```tsx
import { Notification, NotificationCenter } from '../Notification';

function Example() {
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  const addToast = () => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message: 'Saved successfully', variant: 'success', duration: 3000 }]);
  };

  return (
    <>
      <button onClick={addToast}>Show Toast</button>
      <NotificationCenter
        notifications={toasts}
        onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))}
        position="bottom-right"
      />
      <Notification variant="warning" title="Deprecated" onClose={() => {}}>
        This feature will be removed in v2.
      </Notification>
    </>
  );
}
```

## Testing strategy

- Verify variant applies correct background, border, and icon colors
- Verify dismissible close button calls onClose
- Verify autoClose timer fires onClose after specified duration
- Verify compact mode reduces padding
- NotificationCenter: verify position maps to correct fixed coordinates
- Verify maxVisible limits rendered toasts
- Verify fade-out animation on dismiss
