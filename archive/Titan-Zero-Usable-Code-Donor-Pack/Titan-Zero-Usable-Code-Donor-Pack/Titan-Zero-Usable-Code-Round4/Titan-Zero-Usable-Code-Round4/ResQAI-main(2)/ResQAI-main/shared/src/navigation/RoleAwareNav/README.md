# RoleAwareNav

Navigation wrapper that filters menu items based on user roles and permissions.

## Props

- `items` — array of `RoleNavItem` with optional `roles[]` and `permissions[]` filters
- `userRoles` — current user's role list
- `userPermissions` — current user's permission list
- `activeId` — currently active item ID
- `onNavigate` — callback with the original `RoleNavItem` (preserving roles/permissions data)
- `fallback` — rendered when no items are visible after filtering
- `variant` — `'vertical'` (default) or `'horizontal'`

## Behavior

- Items with `roles` are only shown if the user has at least one matching role
- Items with `permissions` are only shown if the user has at least one matching permission
- Items without role/permission filters are always visible
- Dividers are always visible
- Filtering applies recursively to nested children

## Integration

Wraps the `Navigation` component from `components/Navigation`. The `onNavigate` callback receives the original `RoleNavItem` so role/permission data is preserved.
