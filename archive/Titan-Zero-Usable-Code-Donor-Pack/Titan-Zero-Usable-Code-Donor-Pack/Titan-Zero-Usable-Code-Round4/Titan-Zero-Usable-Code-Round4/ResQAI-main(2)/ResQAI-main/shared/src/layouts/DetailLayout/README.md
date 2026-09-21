# DetailLayout

Detail/record view layout with optional breadcrumbs, header, metadata, tabs, and sidebar.

## Zones

| Slot           | Description                        |
|----------------|------------------------------------|
| `topbar`       | Top navigation bar                 |
| `breadcrumbs`  | Breadcrumb trail                   |
| `header`       | Page title and primary actions     |
| `metadata`     | Key-value metadata row             |
| `tabs`         | Tab navigation                     |
| `children`     | Main detail content                |
| `sidebar`      | Right or left detail sidebar       |

## Props

- `sidebarPosition` — `'right'` (default) or `'left'`
- `sidebarWidth` — sidebar width in px (default 320)
- `contentStyle` — additional styles for `<main>` content area

## Layout Flow

Zones render top-to-bottom in order: topbar, breadcrumbs, header, metadata, tabs, content, with sidebar alongside.
