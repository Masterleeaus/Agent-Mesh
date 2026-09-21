# Form

A layout component with Field and Section sub-components for building forms.

## Props

### Form

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | required | Form content |
| onSubmit | (e) => void | — | Submit handler |
| spacing | 'compact' \| 'normal' \| 'relaxed' | 'normal' | Gap between fields |
| layout | 'vertical' \| 'horizontal' \| 'inline' | 'vertical' | Form field layout |
| noValidate | boolean | false | Disable browser validation |
| style | CSSProperties | — | Root element styles |
| className | string | — | CSS class |

### Form.Field

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | required | Input control |
| label | string | — | Field label text |
| error | string | — | Error message shown below |
| hint | string | — | Hint text shown below |
| required | boolean | false | Show asterisk indicator |
| layout | 'vertical' \| 'horizontal' | — | Override form layout for this field |
| style | CSSProperties | — | Styles |
| className | string | — | CSS class |

### Form.Section

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | required | Section content |
| title | string | — | Section heading |
| description | string | — | Section description text |
| style | CSSProperties | — | Styles |
| className | string | — | CSS class |

## Usage

```tsx
import { Form } from '../Form';

function Example() {
  return (
    <Form onSubmit={e => e.preventDefault()}>
      <Form.Section title="Personal Info" description="Enter your details">
        <Form.Field label="Name" required>
          <input type="text" />
        </Form.Field>
        <Form.Field label="Email" error="Invalid email">
          <input type="email" />
        </Form.Field>
      </Form.Section>
    </Form>
  );
}
```

## Testing strategy

- Render with all spacing/layout variants, verify gap and flexDirection
- Form.Field: verify label renders, error vs hint precedence, required asterisk
- Form.Section: verify title, description render in DOM
- Verify noValidate disables HTML validation
