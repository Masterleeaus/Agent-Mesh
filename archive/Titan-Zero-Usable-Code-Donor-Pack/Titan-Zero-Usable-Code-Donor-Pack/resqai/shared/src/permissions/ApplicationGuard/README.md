# ApplicationGuard

Conditionally renders children based on application access.

## Props

- `application` — application identifier to check
- `allowedApplications` — list of applications the user can access
- `fallback` — content to render when access is denied (default `null`)
