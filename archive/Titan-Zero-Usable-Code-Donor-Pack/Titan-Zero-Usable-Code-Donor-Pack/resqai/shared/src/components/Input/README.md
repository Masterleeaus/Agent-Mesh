# Input

Form input with label, error, hint, icon, and clearable support.

## Props
| Prop | Type | Default |
|------|------|---------|
| value | string | required |
| onChange | function | required |
| label | string | - |
| error | string | - |
| type | InputType | 'text' |
| size | InputSize | 'md' |
| icon | ReactNode | - |
| clearable | boolean | false |

## Usage
```tsx
<Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
<Input label="Password" type="password" error="Required" icon={<LockIcon />} />
<Input label="Search" icon={<SearchIcon />} clearable onClear={() => setQuery('')} />
```

## Testing
Test value binding, error state, focus/blur styling, clearable button, disabled state, and keyboard navigation.
