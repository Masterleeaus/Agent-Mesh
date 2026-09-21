# Sidebar

Collapsible sidebar navigation with nested items, icon+label+badge rendering.

## Features
- **Collapsed/expanded** — `collapsed` prop toggles between full and icon-only mode; `onToggle` callback provides a hamburger button.
- **Nested items** — `children` on a `SidebarItem` renders an expandable sub-tree with a chevron indicator.
- **Active item** — highlighted with `var(--accent, #2563eb)` background; `activeId` controls selection.
- **Dark theme** — sidebar background is `var(--bg-sidebar, #1e293b)` with light text.
- **Header/Footer/Logo** — custom nodes above and below the item list.
- **Badges** — rendered as pills with `badgeVariant` color mapping.
