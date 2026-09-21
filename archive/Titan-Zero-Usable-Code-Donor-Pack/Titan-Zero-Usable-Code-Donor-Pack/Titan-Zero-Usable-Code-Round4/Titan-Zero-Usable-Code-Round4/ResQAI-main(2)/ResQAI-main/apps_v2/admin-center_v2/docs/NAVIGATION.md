# Admin Center V2 — Navigation

## Sidebar Structure

The sidebar contains 26 navigation items organized into logical groups:

### Overview
- `/` — Executive Dashboard

### Administration
- `/users` — User Management
- `/roles` — Role Manager
- `/permissions` — Permissions
- `/organizations` — Organizations
- `/teams` — Teams

### Platform
- `/applications` — Applications
- `/workflows` — Workflow Manager
- `/workflow-runs` — Workflow Runs
- `/functions` — Function Manager
- `/function-runs` — Function Runs
- `/agents` — Agent Manager
- `/agent-activity` — Agent Activity
- `/database` — Database Explorer

### Monitoring
- `/events` — Event Bus
- `/monitoring` — Monitoring Dashboard
- `/platform-health` — Platform Health
- `/errors` — Error Center

### Security
- `/audit` — Audit Log
- `/security` — Security Center
- `/api-keys` — API Keys

### Configuration
- `/integrations` — Integrations
- `/connectors` — Connectors
- `/notifications` — Notifications
- `/feature-flags` — Feature Flags
- `/settings` — System Settings

## Route Table

| Hash Route | Page Component | Parameters |
|------------|---------------|------------|
| `#/` | `AdminDashboardPage` | — |
| `#/users` | `UserManagementPage` | — |
| `#/users/new` | `CreateUserPage` | — |
| `#/users/:id` | `UserDetailPage` | `id` |
| `#/roles` | `RoleManagerPage` | — |
| `#/roles/new` | `CreateRolePage` | — |
| `#/roles/:id` | `RoleDetailPage` | `id` |
| `#/permissions` | `PermissionsPage` | — |
| `#/applications` | `ApplicationsPage` | — |
| `#/applications/:id` | `ApplicationDetailPage` | `appId` |
| `#/workflows` | `WorkflowManagerPage` | — |
| `#/workflow-runs` | `WorkflowRunsPage` | — |
| `#/functions` | `FunctionManagerPage` | — |
| `#/function-runs` | `FunctionRunsPage` | — |
| `#/agents` | `AgentManagerPage` | — |
| `#/agent-activity` | `AgentActivityPage` | — |
| `#/database` | `DatabaseExplorerPage` | — |
| `#/events` | `EventBusMonitorPage` | — |
| `#/integrations` | `IntegrationsPage` | — |
| `#/connectors` | `ConnectorConfigPage` | — |
| `#/notifications` | `NotificationCenterPage` | — |
| `#/feature-flags` | `FeatureFlagsPage` | — |
| `#/settings` | `SystemSettingsPage` | — |
| `#/security` | `SecurityCenterPage` | — |
| `#/audit` | `AuditLogPage` | — |
| `#/platform-health` | `PlatformHealthPage` | — |
| `#/errors` | `ErrorCenterPage` | — |
| `#/monitoring` | `MonitoringDashboardPage` | — |
| `#/api-keys` | `APIKeysPage` | — |
| `#/organizations` | `OrganizationsPage` | — |
| `#/teams` | `TeamsPage` | — |

## Navigation Pattern

All navigation uses `window.location.hash = '#/path'`. The `AppLayout` receives `activeRoute` and `onNavigate` props. The `Sidebar` component from `@resqai/foundation` handles active state detection and click navigation.
