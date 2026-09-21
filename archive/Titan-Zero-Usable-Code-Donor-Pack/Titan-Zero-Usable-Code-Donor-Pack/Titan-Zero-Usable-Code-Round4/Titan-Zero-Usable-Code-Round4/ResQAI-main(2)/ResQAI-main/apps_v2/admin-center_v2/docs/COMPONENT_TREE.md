# Admin Center V2 — Component Tree

## App Shell

```
App
├── AppProvider
└── Routes
    └── AppLayout
        ├── Sidebar (26 items)
        ├── Topbar
        └── <main>
            └── [Active Page]
```

## Pages (32)

### Dashboard
- `AdminDashboardPage` — Stat cards, event chart, system health, alerts

### User Management
- `UserManagementPage` — `UserTable`, search, pagination
- `UserDetailPage` — Profile, roles, activity, sessions tabs
- `CreateUserPage` — `UserForm`, role/app access selection

### Role Management
- `RoleManagerPage` — Role table with click-to-view
- `RoleDetailPage` — Role info, `PermissionCheckboxTree`, edit form
- `CreateRolePage` — Role form with `PermissionCheckboxTree`, app scope
- `PermissionsPage` — Permission overview via role table + `RolePermissionTree`

### Application Management
- `ApplicationsPage` — `ApplicationCard` grid
- `ApplicationDetailPage` — Detail card, tabs (overview/workflows/functions/agents)

### Workflow Management
- `WorkflowManagerPage` — Workflow table, run dialog, restart action
- `WorkflowRunsPage` — Run history, filter by workflow, restart

### Function Management
- `FunctionManagerPage` — Function table, run dialog, restart
- `FunctionRunsPage` — Run history, filter by function, restart

### Agent Management
- `AgentManagerPage` — Agent table, detail dialog, restart
- `AgentActivityPage` — Agent stats, activity table

### Platform Tools
- `DatabaseExplorerPage` — Table list, SQL query editor
- `EventBusMonitorPage` — Event stats, by-type table, recent events
- `MonitoringDashboardPage` — `MetricCard`s, `EventVolumeChart`, sessions
- `PlatformHealthPage` — `MetricCard`s, `SystemHealthCard`s, alerts
- `ErrorCenterPage` — Error table, detail dialog, resolve action

### Security
- `SecurityCenterPage` — Tabs: API keys, sessions, security settings
- `AuditLogPage` — `AuditLogTable`, export, pagination
- `APIKeysPage` — API key table, revoke dialog

### Configuration
- `ConnectorConfigPage` — `ConnectorCard` grid, add dialog
- `IntegrationsPage` — Integration table, config dialog
- `NotificationCenterPage` — Notification cards, mark read, dismiss
- `FeatureFlagsPage` — `FeatureFlagToggle` list
- `SystemSettingsPage` — Settings list, edit dialog

### Organizations & Teams
- `OrganizationsPage` — Organization table
- `TeamsPage` — Team table, create dialog

## Reusable Components (19)

| Component | Purpose |
|-----------|---------|
| `SystemHealthCard` | Service health card with status badge |
| `UserTable` | User list with search |
| `UserForm` | Create user form |
| `RolePermissionTree` | Role permission tree view/edit |
| `FeatureFlagToggle` | Toggle switch for feature flags |
| `AuditLogTable` | Audit log with search |
| `EventVolumeChart` | Bar chart for event volume |
| `ConnectorCard` | Connector status card |
| `ActiveSessionList` | Active sessions table |
| `ConfigEditor` | Key-value config editor |
| `PermissionCheckboxTree` | Hierarchical permission checkboxes |
| `PermissionGuard` | Permission-based rendering guard |
| `ApplicationCard` | Application card with status |
| `WorkflowStatusBadge` | Workflow status/run status badges |
| `FunctionStatusBadge` | Function status/run status badges |
| `AgentStatusBadge` | Agent status badge |
| `NotificationBell` | Notification bell with badge count |
| `MetricCard` | Platform metric display card |
| `ErrorSeverityBadge` | Error severity/status badges |
