# RoleGuard

Conditionally renders children based on user roles.

## Props

- `roles` — required role(s) to check
- `userRoles` — current user's assigned roles
- `mode` — `'any'` (default, at least one match) or `'all'` (must match all)
- `fallback` — content to render when access is denied (default `null`)
