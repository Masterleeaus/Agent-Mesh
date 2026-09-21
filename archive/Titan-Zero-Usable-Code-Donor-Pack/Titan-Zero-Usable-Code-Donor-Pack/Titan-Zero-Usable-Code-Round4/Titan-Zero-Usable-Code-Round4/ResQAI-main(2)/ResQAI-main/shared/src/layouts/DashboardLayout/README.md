# DashboardLayout

Standard application shell with sidebar, topbar, and scrollable content zone.

## Zones

| Slot       | Description                     |
|------------|---------------------------------|
| `sidebar`  | Left navigation panel           |
| `topbar`   | Top header bar                  |
| `children` | Main scrollable content area    |

## Props

- `sidebarWidth` — width of sidebar (passed to Sidebar component)
- `sidebarCollapsed` — collapsed state (passed to Sidebar component)
- `contentStyle` — additional styles for the `<main>` content area
