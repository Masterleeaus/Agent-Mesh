# Dialog

A modal dialog overlay component with title, content, and footer sections.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| open | boolean | required | Controls dialog visibility |
| onClose | () => void | required | Callback when dialog is dismissed |
| title | string | — | Dialog title rendered in header |
| children | ReactNode | required | Dialog body content |
| footer | ReactNode | — | Footer actions rendered at bottom |
| size | 'sm' \| 'md' \| 'lg' \| 'xl' \| 'fullscreen' | 'md' | Predefined width constraint |
| closeOnOverlay | boolean | true | Click on overlay dismisses |
| closeOnEscape | boolean | true | Escape key dismisses |
| showClose | boolean | true | Show X close button in header |
| preventScroll | boolean | true | Lock body scroll when open |
| style | CSSProperties | — | Root dialog panel styles |
| className | string | — | CSS class for the dialog panel |
| contentStyle | CSSProperties | — | Styles for the content area |

## Usage

```tsx
import { Dialog } from '../Dialog';
import { useState } from 'react';

function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Confirm" size="sm">
        <p>Are you sure?</p>
      </Dialog>
    </>
  );
}
```

## Size reference

| Size | Max width |
|------|-----------|
| sm | 400px |
| md | 544px |
| lg | 720px |
| xl | 960px |
| fullscreen | 100% |

## Testing strategy

- Render with open=true and open=false, verify visibility
- Trigger onClose by overlay click (closeOnOverlay), escape key (closeOnEscape), and close button
- Verify scroll lock is applied/removed on mount/unmount
- Verify size prop maps to correct maxWidth
- Verify aria-modal, role="dialog", aria-label attributes
