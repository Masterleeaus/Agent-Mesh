# Breadcrumbs

Breadcrumb trail for page hierarchy navigation.

## Props

- `items` — array of `BreadcrumbItem` with `label`, optional `href` and `icon`
- `separator` — custom separator (string or ReactNode, default `'/'`)
- `maxItems` — truncate to this many items with ellipsis (0 = no truncation)
- `size` — `'sm'`, `'md'` (default), or `'lg'`

## Behavior

- Last item is rendered as plain text (current page)
- Items with `href` render as links
- Truncation shows first item, ellipsis, and last N-2 items
