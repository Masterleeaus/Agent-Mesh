# Admin Center V2 — Backend Dependencies

## Required Backend Services

| Service | API Endpoints | Purpose |
|---------|--------------|---------|
| User Service | `GET/POST/PUT/DELETE /api/users` | User CRUD, status, app access |
| Role Service | `GET/POST/PUT/DELETE /api/roles` | Role CRUD, permission mapping |
| Audit Service | `GET /api/audit-log, GET /api/audit-log/export` | Audit log retrieval and export |
| Settings Service | `GET/PUT /api/settings` | System configuration management |
| Connector Service | `GET/POST/PUT/DELETE /api/connectors` | Third-party connector management |
| Event Bus Service | `GET /api/events/metrics, GET /api/events/recent` | Event monitoring and metrics |
| Session Service | `GET /api/sessions, POST /api/sessions/:id/logout` | Active session management |
| Application Service | `GET /api/applications, GET /api/applications/:id` | Application registry |
| Workflow Service | `GET /api/workflows, GET /api/workflow-runs, POST /api/workflows/:id/restart` | Workflow management |
| Function Service | `GET /api/functions, GET /api/function-runs, POST /api/functions/:id/restart` | Function management |
| Agent Service | `GET /api/agents, GET /api/agents/:id, POST /api/agents/:id/restart` | Agent management |
| Integration Service | `GET /api/integrations` | Third-party integration registry |
| Notification Service | `GET /api/notifications, PUT /api/notifications/:id/read, DELETE /api/notifications/:id` | Notification center |
| API Key Service | `GET /api/api-keys, POST /api/api-keys/:id/revoke` | API key management |
| Organization Service | `GET /api/organizations` | Multi-tenant org management |
| Team Service | `GET/POST /api/teams` | Team management |
| Platform Metrics Service | `GET /api/metrics` | Platform monitoring metrics |
| Error Service | `GET /api/errors, PUT /api/errors/:id/resolve` | Error tracking and resolution |

## Auth Dependencies

- Lemma SDK authentication via `ProtectedApp` wrapper
- Permission checking via `@resqai/foundation` `PermissionGuard`
- Token management via `lemma-sdk`

## Database Tables (Future)

- `users` — User accounts and profiles
- `roles` — Role definitions
- `role_permissions` — Permission assignments
- `audit_logs` — Audit trail
- `system_settings` — Configuration key-value store
- `connectors` — Third-party connector configs
- `sessions` — Active user sessions
- `applications` — Application registry
- `workflows` — Workflow definitions
- `workflow_runs` — Workflow execution history
- `functions` — Function definitions
- `function_runs` — Function execution history
- `agents` — AI agent definitions
- `integrations` — Third-party integration configs
- `notifications` — User notification records
- `api_keys` — API key management
- `organizations` — Multi-tenant organizations
- `teams` — Team definitions
- `platform_metrics` — Historical metric data
- `error_logs` — Error tracking records
- `feature_flags` — Feature flag toggles
