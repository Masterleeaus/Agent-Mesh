# Dropdown

Searchable/clearable dropdown with keyboard navigation, loading state, and empty state.

## Props
| Prop | Type | Default |
|------|------|---------|
| options | DropdownOption[] | required |
| value | T | - |
| onChange | (value: T) => void | required |
| searchable | boolean | false |
| clearable | boolean | false |
| size | 'sm' \| 'md' \| 'lg' | 'md' |

## Usage
```tsx
<Dropdown options={statusOptions} value={status} onChange={setStatus} label="Status" />
<Dropdown options={users} searchable clearable value={userId} onChange={setUserId} />
```

## Testing
Test option selection, keyboard navigation (arrow keys, enter, escape), search filtering, clearable button, disabled state, click outside to close.
