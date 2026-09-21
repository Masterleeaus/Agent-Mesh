# TopNavigation

Horizontal top navigation bar.

## Props

- `items` — array of `TopNavItem` with `id`, `label`, optional `icon`, `badge`
- `activeId` — currently active item ID
- `onSelect` — callback when an item is clicked

## Behavior

- Active item gets accent background and color
- Hover state with page background
- Badges render as accent pills for active item, neutral pills for inactive
- Disabled items are non-interactive with reduced opacity
