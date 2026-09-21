# Admin Center V2 — Routes

## Router Implementation

The application uses a custom hash-based router implemented in `src/routes/index.tsx`. Key functions:

- `matchRoute(hash)` — Parses `window.location.hash` into `{ route, params }`
- `Routes` component — Subscribes to `hashchange` event, renders matching page
- Dynamic segments — `/users/:id`, `/roles/:id`, `/applications/:id`

## Route Definitions

```
/                        → AdminDashboardPage
/users                   → UserManagementPage
/users/new               → CreateUserPage
/users/:id               → UserDetailPage({ userId })
/roles                   → RoleManagerPage
/roles/new               → CreateRolePage
/roles/:id               → RoleDetailPage({ roleId })
/permissions             → PermissionsPage
/applications            → ApplicationsPage
/applications/:id        → ApplicationDetailPage({ appId })
/workflows               → WorkflowManagerPage
/workflow-runs           → WorkflowRunsPage
/functions               → FunctionManagerPage
/function-runs           → FunctionRunsPage
/agents                  → AgentManagerPage
/agent-activity          → AgentActivityPage
/database                → DatabaseExplorerPage
/events                  → EventBusMonitorPage
/integrations            → IntegrationsPage
/connectors              → ConnectorConfigPage
/notifications           → NotificationCenterPage
/feature-flags           → FeatureFlagsPage
/settings                → SystemSettingsPage
/security                → SecurityCenterPage
/audit                   → AuditLogPage
/platform-health         → PlatformHealthPage
/errors                  → ErrorCenterPage
/monitoring              → MonitoringDashboardPage
/api-keys                → APIKeysPage
/organizations           → OrganizationsPage
/teams                   → TeamsPage
```

## Navigation

All navigation is performed by setting `window.location.hash = '#/path'`. The `hashchange` event triggers a re-render with the new route.
