# Admin Center V2 — Permission Matrix

## Permission by Page

| Page | Required Permission | Purpose |
|------|-------------------|---------|
| Executive Dashboard | `admin:view_dashboard` | View system metrics and alerts |
| User Management | `admin:manage_users` | List, search, view users |
| Create User | `admin:manage_users` | Create new user accounts |
| User Detail | `admin:manage_users` | View/edit user profile, roles |
| Role Manager | `admin:manage_roles` | List roles |
| Create Role | `admin:manage_roles` | Create new roles |
| Role Detail | `admin:manage_roles` | View/edit role permissions |
| Permissions | `admin:manage_roles` | View permission assignments |
| Applications | `admin:manage_applications` | View application registry |
| Application Detail | `admin:manage_applications` | View application details |
| Workflow Manager | `admin:manage_workflows` | List and manage workflows |
| Workflow Runs | `admin:manage_workflows` | View workflow execution history |
| Function Manager | `admin:manage_functions` | List and manage functions |
| Function Runs | `admin:manage_functions` | View function execution history |
| Agent Manager | `admin:manage_agents` | List and manage AI agents |
| Agent Activity | `admin:manage_agents` | View agent activity metrics |
| Database Explorer | `admin:manage_database` | Browse tables, run queries |
| Event Bus | `admin:view_events` | View event bus metrics |
| Integrations | `admin:manage_integrations` | View third-party integrations |
| Connectors | `admin:manage_connectors` | Manage connector configurations |
| Notifications | `admin:manage_notifications` | View and manage notifications |
| Feature Flags | `admin:manage_feature_flags` | Toggle feature flags |
| System Settings | `admin:manage_settings` | View/edit system configuration |
| Security Center | `admin:manage_security` | Manage API keys, sessions, security |
| Audit Log | `admin:view_audit` | View audit trail |
| Platform Health | `admin:view_monitoring` | View platform health metrics |
| Error Center | `admin:view_errors` | View and resolve errors |
| Monitoring | `admin:view_monitoring` | View monitoring dashboard |
| API Keys | `admin:manage_api_keys` | Manage API keys |
| Organizations | `admin:manage_organizations` | View organizations |
| Teams | `admin:manage_teams` | View and create teams |

## Role Permission Mapping (Default)

| Role | Permissions |
|------|-------------|
| Super Admin | All permissions |
| Support Manager | `view_dashboard`, `manage_users`, `manage_roles`, `view_audit` |
| Analyst | `view_dashboard`, `view_monitoring`, `view_events` |
| Viewer | `view_dashboard` |

## Permission Groups

- **Administration**: Users, Roles, Permissions, Organizations, Teams
- **Platform**: Applications, Workflows, Functions, Agents, Database
- **Monitoring**: Dashboard, Events, Health, Errors
- **Security**: Audit, Security Center, API Keys
- **Configuration**: Integrations, Connectors, Notifications, Feature Flags, Settings
