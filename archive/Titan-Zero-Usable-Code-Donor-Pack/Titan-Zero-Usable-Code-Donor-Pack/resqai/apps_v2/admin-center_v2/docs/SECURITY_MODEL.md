# Admin Center V2 — Security Model

## Authentication

Authentication is handled by the Lemma SDK via `ProtectedApp` wrapper in `main.tsx`. The SDK manages tokens, session validation, and automatic redirects for unauthenticated users.

## Authorization

Permissions are enforced at two levels:

### 1. Route-Level Guards
The `PermissionGuard` component conditionally renders content based on user permissions. Pages that require specific permissions show a "Permission Denied" fallback state.

### 2. Permission Constants

Defined in `src/contracts/permissions.ts`:

| Constant | String Value | Description |
|----------|--------------|-------------|
| `ADMIN_VIEW_DASHBOARD` | `admin:view_dashboard` | View executive dashboard |
| `ADMIN_MANAGE_USERS` | `admin:manage_users` | Create/edit/delete users |
| `ADMIN_MANAGE_ROLES` | `admin:manage_roles` | Create/edit/delete roles |
| `ADMIN_VIEW_AUDIT` | `admin:view_audit` | View audit log |
| `ADMIN_MANAGE_SETTINGS` | `admin:manage_settings` | Modify system settings |
| `ADMIN_MANAGE_CONNECTORS` | `admin:manage_connectors` | Manage connectors |
| `ADMIN_VIEW_EVENTS` | `admin:view_events` | View event bus |
| `ADMIN_EXPORT_AUDIT` | `admin:export_audit` | Export audit log |
| `ADMIN_MANAGE_APPLICATIONS` | `admin:manage_applications` | Manage applications |
| `ADMIN_MANAGE_WORKFLOWS` | `admin:manage_workflows` | Manage workflows |
| `ADMIN_MANAGE_FUNCTIONS` | `admin:manage_functions` | Manage functions |
| `ADMIN_MANAGE_AGENTS` | `admin:manage_agents` | Manage agents |
| `ADMIN_VIEW_MONITORING` | `admin:view_monitoring` | View monitoring |
| `ADMIN_MANAGE_INTEGRATIONS` | `admin:manage_integrations` | Manage integrations |
| `ADMIN_MANAGE_NOTIFICATIONS` | `admin:manage_notifications` | Manage notifications |
| `ADMIN_MANAGE_FEATURE_FLAGS` | `admin:manage_feature_flags` | Manage feature flags |
| `ADMIN_MANAGE_SECURITY` | `admin:manage_security` | Manage security settings |
| `ADMIN_MANAGE_API_KEYS` | `admin:manage_api_keys` | Manage API keys |
| `ADMIN_MANAGE_ORGANIZATIONS` | `admin:manage_organizations` | Manage organizations |
| `ADMIN_MANAGE_TEAMS` | `admin:manage_teams` | Manage teams |
| `ADMIN_VIEW_ERRORS` | `admin:view_errors` | View error center |
| `ADMIN_MANAGE_DATABASE` | `admin:manage_database` | Access database explorer |

## API Key Security

- API keys are masked in the UI (`resq_prod_****`)
- Keys can be revoked with confirmation dialog
- Expired keys are automatically marked inactive
- Audit trail maintained for all key operations

## Session Security

- Active sessions visible in Security Center
- Force logout capability for individual sessions
- Session timeout configured in system settings
- IP address tracking for all sessions

## Audit Trail

- All admin actions are logged with actor, action, target, IP, timestamp
- Audit log is exportable to CSV
- Comprehensive event tracking across all operations
