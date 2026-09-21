# Table

Flex-based data table with sortable columns, row selection, loading skeleton, empty state, sticky header, and compact mode.

## Props

| Prop | Type | Default |
|------|------|---------|
| columns | TableColumn[] | required |
| data | T[] | required |
| loading | boolean | false |
| emptyMessage | string | 'No data' |
| sortable | boolean | false |
| onSort | function | - |
| sortKey | string | - |
| sortDirection | 'asc' \| 'desc' | 'asc' |
| onRowClick | function | - |
| selectedRowId | string \| number | - |
| compact | boolean | false |
| stickyHeader | boolean | false |
| maxHeight | string | - |
| style | CSSProperties | - |
| className | string | - |

## Usage

```tsx
<Table
  columns={[
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status', render: v => <Badge>{v}</Badge> },
    { key: 'role', header: 'Role' },
  ]}
  data={accounts}
  sortable
  onSort={(k, d) => setSort(k, d)}
  onRowClick={row => navigate(row.id)}
  stickyHeader
  maxHeight="400px"
/>
```

## Testing

Test column rendering, sort click toggles direction, row click handler, loading skeleton renders correct row/column count, empty state message, sticky header behavior, compact mode spacing.
