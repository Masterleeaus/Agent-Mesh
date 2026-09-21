# Permissions

Conditional rendering guards for role-based access control, feature flags, and application access.

## Guards

| Guard              | Purpose                                      |
|--------------------|----------------------------------------------|
| `RoleGuard`        | Show/hide based on user roles                |
| `PermissionGuard`  | Show/hide based on user permissions          |
| `FeatureGuard`     | Show/hide based on feature flags             |
| `ApplicationGuard` | Show/hide based on application access        |

## Composition

Guards can be nested to require multiple conditions:

```tsx
<RoleGuard roles={['admin']}>
  <FeatureGuard feature="analytics" enabledFeatures={features}>
    <AnalyticsDashboard />
  </FeatureGuard>
</RoleGuard>
```

## Testing

- Test each guard with matching and non-matching inputs
- Verify fallback renders when access is denied
- Test `mode` prop (`'any'` vs `'all'`) for role/permission guards
- For composed guards, verify all conditions must pass
