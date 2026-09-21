# PermissionGuard

Conditionally renders children based on user permissions.

## Props

- `permissions` — required permission(s) to check
- `userPermissions` — current user's assigned permissions
- `mode` — `'any'` (default, at least one match) or `'all'` (must match all)
- `fallback` — content to render when access is denied (default `null`)
