# ResQAI V2 — Function Security Model

> **Version:** 2.0.0  
> **Status:** FINAL  
> **Date:** 2026-06-30

---

## Table of Contents

1. [Authentication Layer](#1-authentication-layer)
2. [Authorization Model](#2-authorization-model)
3. [Function-Level Permission Matrix](#3-function-level-permission-matrix)
4. [Permission Enforcement Points](#4-permission-enforcement-points)
5. [Data Access Controls](#5-data-access-controls)
6. [Secret Management](#6-secret-management)
7. [Security Audit Requirements](#7-security-audit-requirements)

---

## 1. Authentication Layer

### 1.1 Session-Based Authentication

ResQAI V2 uses session-based authentication via two dedicated functions:

| Function | Type | Purpose |
|----------|------|---------|
| `authenticate_user` | PUBLIC | Authenticate user credentials, create session |
| `validate_session` | PUBLIC | Validate session token freshness and validity |

**Flow:**

```
User → authenticate_user(email, auth_provider) → creates user_sessions_v2 record → returns session_token UUID
Client → validate_session(session_id) → checks is_active, expires_at → returns valid/invalid
```

**Session Properties:**
- Token: UUID v4 stored in `user_sessions_v2.session_token` (hashed)
- Expiry: 24 hours from creation (`expires_at`)
- Refresh: JWT refresh token in `user_sessions_v2.refresh_token` (hashed)
- Invalidation: `deactivate-user` sets `is_active = false` on all user sessions

### 1.2 API Token Authentication (V2)

The `generate-api-token` function provides machine-to-machine authentication:

- Token format: `rk_{random_64_hex}` (prefixed, high-entropy)
- Storage: `api_tokens_v2` table (token hash stored, raw token returned once at creation)
- Scopes: Token-bound permission subset scoped to specific resources/actions
- Rotation: Tokens rotated via `rotate-credentials` function
- Expiry: Configurable TTL (default 90 days)

### 1.3 JWT Token Validation

JWT tokens are validated at the API gateway layer:

- Algorithm: RS256 (asymmetric key pair)
- Claims: `sub` (user_id), `role` (role_id), `permissions` (array of `resource:action`), `iat`, `exp`
- Validation: Signature verification, expiry check, audience check
- Key rotation: Public keys published at `/.well-known/jwks.json`

### 1.4 Session Expiry Handling

| Condition | Action |
|-----------|--------|
| Token expired | Return `valid: false` with error `Session expired` |
| Token invalidated | Return `valid: false` with error `Session invalidated` |
| Token not found | Return `valid: false` with error `Session not found` |
| 5 minutes before expiry | Refresh token auto-extends session |
| After expiry + 24h | Session record purged by cleanup job |

---

## 2. Authorization Model

### 2.1 RBAC Architecture

ResQAI V2 implements Role-Based Access Control (RBAC) through three tables:

```
user_roles_v2 ──── defines role_name, priority, is_system_role
       │
       ├── users_v2 (each user has a role_id FK)
       │
       └── role_permissions_v2 (role_id + resource + action_type + is_granted + conditions)
```

### 2.2 Seeded Roles

| Role | Priority | Description | Scope |
|------|:--------:|-------------|-------|
| **super_admin** | 100 | Full system access, all resources, all actions | Global |
| **admin** | 90 | System administration, user management, config | Global |
| **manager** | 70 | Department oversight, reports, team management | Department |
| **agent** | 50 | Ticket handling, customer communication, case work | Assigned |
| **technician** | 40 | Field work, work order management, inventory | Self + Assigned |
| **dispatcher** | 45 | Dispatch coordination, technician assignment | Department |
| **customer** | 20 | Self-service: own tickets, appointments, feedback | Self only |
| **viewer** | 10 | Read-only access to dashboards and reports | Read only |

### 2.3 Permission Format

Permissions follow the `{resource}:{action}` convention:

| Component | Values | Example |
|-----------|--------|---------|
| **resource** | `tickets`, `appointments`, `work_orders`, `users`, `customers`, `accounts`, `inventory`, `disputes`, `notifications`, `analytics`, `reports`, `audit_log`, `system_settings`, `feature_flags`, `connectors`, `roles`, `permissions` | `tickets:create` |
| **action** | `create`, `read`, `update`, `delete`, `manage` | `admin:users:manage` |
| **scope** | `own`, `department`, `all` | Applied as RLS policy parameter |

### 2.4 Permission Inheritance and Hierarchy

```
super_admin ──> all permissions (implicit, bypasses RLS)
     │
     v
admin ──> admin:* + inherited: manager, agent, technician, dispatcher
     │
     v
manager ──> manager:* + inherited: agent, technician, dispatcher
     │
     v
agent ────> tickets:* (own+assigned), customers:read, followups:*
     │
     v
technician ──> work_orders:* (assigned), inventory:read, appointments:read
     │
     v
dispatcher ──> appointments:read, technicians:read, dispatches:*
     │
     v
customer ──> tickets:read (own), appointments:read (own), feedback:create
     │
     v
viewer ──> dashboards:read, reports:read (no mutation)
```

**Inheritance Rules:**
1. Higher-priority roles inherit all permissions of lower-priority roles
2. Explicit `deny` rules override inherited `grant` rules (negative permissions)
3. Scope cascades: `all` > `department` > `own`
4. Manager inherits from all agents/technicians they supervise

---

## 3. Function-Level Permission Matrix

### Legend

| Column | Values |
|--------|--------|
| **Auth Required** | Yes / No |
| **Min Role** | Minimum role level to invoke |
| **Required Permissions** | Specific `resource:action` entries |
| **Tables Read** | Database tables read during execution |
| **Tables Write** | Database tables written during execution |
| **Connectors** | External connectors used |
| **Access Level** | PUBLIC (no auth), PROTECTED (auth required), INTERNAL (workflow only) |

### 3.1 Ticket Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| validate-ticket-input | No | — | None | None | None | None | PUBLIC |
| check-ticket-urgency | No | — | None | None | None | None | PUBLIC |
| update-ticket-record | Yes | agent | tickets:update | tickets_v2 | tickets_v2 | gmail | PROTECTED |
| classify-ticket-sla-tier | Yes | agent | system_settings:read | system_settings_v2 | None | None | PROTECTED |
| check-sla-deadline | Yes | agent | tickets:read, system_settings:read | tickets_v2, system_settings_v2 | None | None | PROTECTED |
| batch-sla-check | No | — | tickets:read, system_settings:read | tickets_v2, system_settings_v2 | None | None | INTERNAL |
| collect-resolved-tickets | Yes | agent | tickets:read | tickets_v2 | None | discord | PROTECTED |

### 3.2 Appointment Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| assign-appointment-technician | Yes | dispatcher | appointments:update, technicians:read, technician_skills:read | appointments_v2, technicians_v2, technician_skills_v2 | appointments_v2 | None | PROTECTED |
| fetch-upcoming-appointments | Yes | agent | appointments:read | appointments_v2 | None | None | PROTECTED |
| schedule-appointment-reminders | Yes | agent | appointments:read, appointment_reminders:write, notification_templates:read | appointments_v2, notification_templates_v2 | appointment_reminders_v2 | None | PROTECTED |
| check-reminder-window | No | — | None | None | None | None | PUBLIC |

### 3.3 Dispatch Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| finalize-dispatch | Yes | dispatcher | dispatches:update, technicians:read, tickets:read | dispatches_v2, technicians_v2, tickets_v2 | dispatches_v2 | None | PROTECTED |
| calculate-dispatch-priority | No | — | None | None | None | None | PUBLIC |

### 3.4 Work Order Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| create-work-order | Yes | dispatcher | appointments:read, technicians:read, work_orders:write | appointments_v2, technicians_v2 | work_orders_v2 | None | PROTECTED |
| update-work-order-stage | Yes | technician | work_orders:update, work_order_stages:update | work_orders_v2, work_order_stages_v2 | work_orders_v2, work_order_stages_v2 | None | PROTECTED |
| complete-work-order | Yes | technician | work_orders:update, work_order_stages:update | work_orders_v2, work_order_stages_v2 | work_orders_v2, work_order_stages_v2 | None | PROTECTED |

### 3.5 Dispute Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| resolve-dispute | Yes | manager | disputes:update, appointments:read, customers:read | disputes_v2, appointments_v2, customers_v2 | disputes_v2 | discord, gmail | PROTECTED |

### 3.6 CRM Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| account-health-scan | Yes | manager | accounts:read, disputes:read, followups:read, feedback:read, tickets:read, appointments:read, account_health_scans:write | accounts_v2, disputes_v2, followups_v2, feedback_v2, tickets_v2, appointments_v2 | account_health_scans_v2 | None | PROTECTED |
| update-account-health-status | Yes | manager | accounts:update, account_health_scans:read | accounts_v2, account_health_scans_v2 | accounts_v2 | discord | PROTECTED |
| flag-slipping-followups | Yes | manager | followups:read | followups_v2 | None | None | PROTECTED |
| create-followup-tasks | Yes | agent | accounts:read, customers:read, followups:write | accounts_v2, customers_v2 | followups_v2 | None | PROTECTED |
| finalize-slippage-review | Yes | manager | followups:update, tasks:write | followups_v2 | followups_v2, tasks_v2 | discord | PROTECTED |
| generate-account-score | No | — | None | None | None | None | PUBLIC |

### 3.7 Customer Experience Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| process-feedback-survey | Yes | customer | feedback_surveys:read, feedback:write | feedback_surveys_v2 | feedback_v2 | None | PROTECTED |
| analyze-feedback-sentiment | Yes | agent | feedback:update | None | feedback_v2 | None | PROTECTED |

### 3.8 Knowledge Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| extract-knowledge-gap | Yes | agent | tickets:read, ticket_messages:read, knowledge_articles:read, knowledge_categories:read | tickets_v2, ticket_messages_v2, knowledge_articles_v2, knowledge_categories_v2 | None | None | PROTECTED |
| search-knowledge-articles | Yes | agent | knowledge_articles:read, knowledge_categories:read | knowledge_articles_v2, knowledge_categories_v2 | None | None | PROTECTED |
| suggest-knowledge-article | No | — | None | None | None | None | PUBLIC |

### 3.9 Notification Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| render-notification-template | Yes | agent | notification_templates:read | notification_templates_v2 | None | None | PROTECTED |
| dispatch-notifications | Yes | agent | notification_templates:read, notification_channels:read, notifications:write | notification_templates_v2, notification_channels_v2, notifications_v2 | notifications_v2 | gmail, twilio | PROTECTED |
| process-notification-delivery | Yes | agent | notifications:update | notifications_v2 | notifications_v2 | None | PROTECTED |

### 3.10 Operations Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| create-operations-tasks | Yes | manager | tasks:write, technicians:read | tasks_v2, technicians_v2 | tasks_v2, task_assignments_v2 | None | PROTECTED |
| generate-standup-report | Yes | manager | tickets:read, appointments:read, dispatches:read, tasks:read, work_orders:read, accounts:read, followups:read, feedback:read | tickets_v2, appointments_v2, dispatches_v2, tasks_v2, work_orders_v2, accounts_v2, followups_v2, feedback_v2 | operations_log | None | PROTECTED |

### 3.11 Reporting Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| generate-report-data | Yes | manager | analytics_reports:read, analytics_schedules:read, domain tables:read | analytics_reports_v2, analytics_schedules_v2, ALL domain tables | None | None | PROTECTED |
| send-report | Yes | manager | analytics_reports:read, analytics_schedules:read, users:read | analytics_reports_v2, analytics_schedules_v2, users_v2 | None | gmail | PROTECTED |

### 3.12 Analytics Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| sync-events-analytics | No | — | events:read, analytics_reports:write | events_v2 | analytics_reports_v2 | None | INTERNAL |
| calculate-metric-trend | Yes | manager | events:read, analytics_reports:read | events_v2, analytics_reports_v2 | None | None | PROTECTED |
| batch-metric-aggregation | No | — | events:read, analytics_reports:read/write, domain tables:read | events_v2, analytics_reports_v2, ALL domain tables | analytics_reports_v2 | None | INTERNAL |

### 3.13 Administration Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| provision-user | Yes | admin | users:write, roles:read, role_permissions:read, user_roles:write | users_v2, roles_v2, role_permissions_v2 | users_v2, user_roles_v2 | gmail | PROTECTED |
| deactivate-user | Yes | admin | users:update, user_roles:read, user_sessions:update | users_v2, user_roles_v2, user_sessions_v2 | users_v2, user_sessions_v2 | None | PROTECTED |
| validate-config-change | Yes | admin | system_settings:read, feature_flags:read | system_settings_v2, feature_flags_v2 | None | None | PROTECTED |
| apply-config-change | Yes | admin | system_settings:write, feature_flags:write | system_settings_v2, feature_flags_v2 | system_settings_v2, feature_flags_v2 | None | PROTECTED |
| log-audit-event | No | — | audit_log:write | None | audit_log_v2 | None | INTERNAL |

### 3.14 Inventory Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| check-inventory-level | Yes | technician | inventory_items:read, inventory_transactions:read | inventory_items_v2, inventory_transactions_v2 | None | None | PROTECTED |
| reorder-inventory | Yes | manager | inventory_items:update, inventory_transactions:write | inventory_items_v2 | inventory_items_v2, inventory_transactions_v2 | None | PROTECTED |
| record-inventory-transaction | Yes | technician | inventory_items:update, inventory_transactions:write | inventory_items_v2 | inventory_items_v2, inventory_transactions_v2 | None | PROTECTED |

### 3.15 Security Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| validate-permissions | No | — | role_permissions:read, user_roles:read | role_permissions_v2, user_roles_v2 | None | None | INTERNAL |
| generate-api-token | Yes | admin | api_tokens:write | None | api_tokens_v2 | None | PROTECTED |
| rotate-credentials | Yes | admin | connectors:update | connectors_v2 | connectors_v2 | None | PROTECTED |

### 3.16 Automation Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| verify-workflow-health | Yes | admin | workflow_instances:read, system_settings:read | workflow_instances_v2, system_settings_v2 | None | None | PROTECTED |
| recover-workflow-instance | Yes | admin | workflow_instances:update | workflow_instances_v2 | workflow_instances_v2 | None | PROTECTED |
| reset-circuit-breaker | Yes | admin | circuit_breakers:update | circuit_breakers_v2 | circuit_breakers_v2 | None | PROTECTED |

### 3.17 Quality Domain Functions

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| evaluate-quality-score | Yes | manager | quality_metrics:read, quality_scores:write | quality_metrics_v2 | quality_scores_v2 | None | PROTECTED |
| flag-quality-violation | Yes | manager | quality_violations:write | None | quality_violations_v2 | None | PROTECTED |

### 3.18 V1 Deployed Functions (Legacy Transition)

| Function | Auth Required | Min Role | Required Permissions | Tables Read | Tables Write | Connectors | Access Level |
|----------|:------------:|:--------:|---------------------|-------------|-------------|------------|:------------:|
| create_ticket | Yes | agent | tickets:write | None | tickets, operations_log, events | None | PROTECTED |
| update_ticket_v2 | Yes | agent | tickets:update | tickets | tickets, operations_log, events | None | PROTECTED |
| assign_ticket | Yes | agent | tickets:update | tickets | tickets, operations_log, events | None | PROTECTED |
| close_ticket | Yes | agent | tickets:update | tickets, customers | tickets, operations_log, events | gmail | PROTECTED |
| escalate_ticket | Yes | agent | tickets:update | tickets | tickets, operations_log, events | discord | PROTECTED |
| search_tickets | Yes | agent | tickets:read | tickets | None | None | PROTECTED |
| create_appointment | Yes | agent | appointments:write | customers | appointments, operations_log | None | PROTECTED |
| accept_appointment | Yes | technician | appointments:update | appointments | appointments, operations_log | None | PROTECTED |
| complete_appointment | Yes | technician | appointments:update, inventory:write | appointments | appointments, inventory_transactions, operations_log | None | PROTECTED |
| cancel_appointment | Yes | agent | appointments:update | appointments | appointments, operations_log | None | PROTECTED |
| list_appointments | Yes | agent | appointments:read | appointments | None | None | PROTECTED |
| get_appointment | Yes | agent | appointments:read | appointments | None | None | PROTECTED |
| create_technician | Yes | admin | technicians:write | None | technicians, operations_log | None | PROTECTED |
| update_technician | Yes | admin | technicians:update | technicians | technicians, operations_log | None | PROTECTED |
| list_technicians | Yes | agent | technicians:read | technicians | None | None | PROTECTED |
| update_technician_skills | Yes | admin | technicians:update | technicians | technicians, operations_log | None | PROTECTED |
| create_customer | Yes | agent | customers:write | None | customers, accounts, operations_log | None | PROTECTED |
| update_customer | Yes | agent | customers:update | customers | customers, operations_log | None | PROTECTED |
| get_customer | Yes | agent | customers:read | customers, accounts | None | None | PROTECTED |
| search_customers | Yes | agent | customers:read | customers | None | None | PROTECTED |
| create_followup | Yes | agent | followups:write, accounts:update | accounts | followups, accounts, operations_log | None | PROTECTED |
| complete_followup | Yes | agent | followups:update, accounts:update | followups, accounts | followups, accounts, operations_log | None | PROTECTED |
| list_followups | Yes | agent | followups:read | followups | None | None | PROTECTED |
| update_account_health | Yes | manager | accounts:update | accounts | accounts, account_health_scans, operations_log | None | PROTECTED |
| update_account_health_status | Yes | manager | accounts:update | None | operations_log | discord | PROTECTED |
| account_health_scan | Yes | manager | accounts:read, followups:read, disputes:read, tickets:read, appointments:read, customers:read | accounts, customers, followups, disputes, appointments | accounts (write_back) | None | PROTECTED |
| resolve_dispute | Yes | manager | disputes:update, tickets:update | disputes, tickets | disputes, tickets, operations_log | discord | PROTECTED |
| resolve_dispute_v2 | Yes | manager | disputes:update, tickets:update | disputes, tickets | disputes, tickets, operations_log | discord, gmail | PROTECTED |
| list_disputes | Yes | agent | disputes:read | disputes | None | None | PROTECTED |
| finalize_dispatch | Yes | dispatcher | tickets:update | tickets | tickets, operations_log | discord | PROTECTED |
| create_work_order | Yes | dispatcher | work_orders:write | appointments | work_orders, operations_log | None | PROTECTED |
| update_work_order | Yes | technician | work_orders:update | work_orders | work_orders, operations_log | None | PROTECTED |
| get_work_order | Yes | technician | work_orders:read | work_orders | None | None | PROTECTED |
| list_work_orders | Yes | technician | work_orders:read | work_orders | None | None | PROTECTED |
| create_inventory_item | Yes | admin | inventory:write | None | inventory_items, operations_log | None | PROTECTED |
| update_inventory_item | Yes | admin | inventory:update | inventory_items | inventory_items, inventory_transactions, operations_log | None | PROTECTED |
| list_inventory | Yes | technician | inventory:read | inventory_items | None | None | PROTECTED |
| create_followup_tasks | Yes | manager | tasks:write | None | tasks, operations_log | None | PROTECTED |
| create_operations_tasks | Yes | manager | tasks:write | None | tasks, operations_log | None | PROTECTED |
| finalize_slippage_review | Yes | manager | operations_log:write | None | operations_log | discord | PROTECTED |
| flag_slipping_followups | Yes | manager | followups:read, accounts:read, customers:read | followups, accounts, customers | None | None | PROTECTED |
| dispatch_notifications | Yes | agent | operations_log:write | None | operations_log | gmail, twilio | PROTECTED |
| dispatch_notification_v2 | Yes | agent | notifications:write | None | notifications, operations_log | gmail, twilio | PROTECTED |
| send_bulk_notification | Yes | agent | notifications:write | None | notifications | gmail, twilio | PROTECTED |
| track_notification | Yes | agent | notifications:read, notifications:update | notifications | notifications (mark_read) | None | PROTECTED |
| analytics_aggregation | Yes | manager | tickets:read, appointments:read, customers:read, users:read | tickets, appointments, customers, users | None | None | PROTECTED |
| dashboard_metrics | Yes | manager | tickets:read, appointments:read, customers:read, users:read, account_health:read, followups:read, work_orders:read | tickets, appointments, customers, users, account_health, followups, work_orders | None | None | PROTECTED |
| create_report | Yes | manager | analytics_reports:write | None | analytics_reports | None | PROTECTED |
| schedule_report | Yes | manager | analytics_schedules:write | analytics_reports | analytics_schedules, operations_log | None | PROTECTED |
| execute_report | Yes | manager | analytics_reports:read, domain tables:read | analytics_reports, dynamic tables | operations_log | None | PROTECTED |
| create_user | Yes | admin | users:write | users | users, operations_log | None | PROTECTED |
| update_user | Yes | admin | users:update | users | users, operations_log | None | PROTECTED |
| list_users | Yes | admin | users:read | users | None | None | PROTECTED |
| create_role | Yes | admin | roles:write | user_roles | user_roles, operations_log | None | PROTECTED |
| assign_user_role | Yes | admin | users:update, roles:read | users, user_roles | users, operations_log | None | PROTECTED |
| manage_permission | Yes | admin | permissions:write | role_permissions | role_permissions, operations_log | None | PROTECTED |
| list_permissions | Yes | admin | permissions:read | role_permissions, user_roles | None | None | PROTECTED |
| record_audit | No | — | audit_log:write | None | audit_log | None | INTERNAL |
| query_audit_log | Yes | admin | audit_log:read | audit_log | None | None | PROTECTED |
| authenticate_user | No | — | None | users | users, user_sessions, operations_log | None | PUBLIC |
| validate_session | No | — | None | user_sessions | None | None | PUBLIC |

---

## 4. Permission Enforcement Points

### 4.1 Function Entry Gate (Lemma Platform)

The Lemma platform enforces permissions at function invocation:

1. **Authentication Check**: Extract and validate Bearer token / session token
2. **Authorization Check**: Resolve user role → retrieve role permissions → compare against function's declared `required_permissions`
3. **Deny Decision**: Return `403 Forbidden` with structured error payload
4. **Allow Decision**: Create authenticated context for function execution

```json
{
  "status": "error",
  "error": {
    "code": "FORBIDDEN",
    "message": "Missing required permission: tickets:update",
    "details": {
      "actor_id": "uuid",
      "actor_role": "viewer",
      "required_permissions": ["tickets:update"],
      "matched": [],
      "missing": ["tickets:update"]
    }
  }
}
```

### 4.2 Application Middleware

Middleware intercepts all API calls before reaching function handlers:

| Layer | Check | Action |
|-------|-------|--------|
| Rate Limiter | Requests/sec per user/IP | `429 Too Many Requests` |
| Session Validator | Token freshness, validity | `401 Unauthorized` |
| Permission Guard | Resource-level permissions | `403 Forbidden` |
| Audit Logger | Log every authenticated request | Write to audit_log_v2 |
| Correlation ID Injector | Ensure every request has correlation_id | Inject if missing |

### 4.3 API Gateway

The API Gateway provides perimeter security:

| Feature | Implementation |
|---------|---------------|
| TLS termination | TLS 1.3, HSTS headers |
| Request validation | Schema validation against function input schema |
| CORS policy | Origin whitelist per domain |
| Request size limit | 10 MB max payload |
| Rate limiting | 1000 req/min per tenant, 100 req/min per user |
| IP allow/deny list | Configurable via system_settings_v2 |
| DDoS protection | AWS Shield / Cloudflare |

---

## 5. Data Access Controls

### 5.1 Row-Level Security (RLS)

RLS policies are defined per table in the Lemma platform:

| Table | RLS Policy | Scope |
|-------|-----------|-------|
| tickets_v2 | `tenant_id = session.tenant_id OR assigned_to = session.user_id OR customer_id = session.customer_id` | Tenant + Assignment + Self |
| appointments_v2 | `technician_id = session.user_id OR customer_id = session.customer_id OR tenant_access` | Self + Assignment |
| customers_v2 | `created_by = session.user_id OR tenant_manage_access OR admin_access` | Creator + Manager |
| accounts_v2 | `tenant_manager_access OR admin_access` | Manager/Admin only |
| work_orders_v2 | `technician_id = session.user_id OR tenant_dispatch_access` | Self + Dispatch |
| notifications_v2 | `user_id = session.user_id OR admin_access` | Self + Admin |
| users_v2 | `id = session.user_id OR admin_access` | Self + Admin |
| audit_log_v2 | `admin_access OR manager_read_access` | Admin/Manager |

### 5.2 Function-Level Data Filtering

Functions implement explicit data filtering:

- **Output filtering**: Functions strip sensitive fields from output based on caller's role
- **Parameter validation**: Functions validate `account_id`, `customer_id` against caller's scope
- **Entity relationship checks**: Functions verify entity ownership before mutation (e.g., `ticket.customer_id == session.customer_id`)

### 5.3 Audit Trail for All Data Access

Every data access is recorded:

| Access Type | Audit Record | Retention |
|-------------|-------------|-----------|
| Read | Logged for sensitive tables (accounts_v2, audit_log_v2, users_v2) | 30 days |
| Create | Full before/after snapshot in audit_log_v2 | 7 years |
| Update | Full before/after snapshot with changed_fields | 7 years |
| Delete | Full record snapshot marking deleted_at | 7 years |
| Denied Access | Actor, resource, required permission, timestamp | 1 year |
| Connector Call | Connector name, operation, status, duration | 90 days |

---

## 6. Secret Management

### 6.1 Connector Credentials

| Storage | Encryption | Access |
|---------|-----------|--------|
| `connectors_v2.api_key` | AES-256-GCM (BYTEA column) | Admin only via function calls |
| `connectors_v2.secret` | AES-256-GCM (BYTEA column) | Admin only via function calls |
| `connectors_v2.provider_config` | AES-256-GCM (encrypted JSONB) | Admin only |

### 6.2 API Token Hashing

- Tokens are stored as SHA-256 hashes in `api_tokens_v2`
- Raw token is returned exactly once at creation via `generate-api-token`
- Token validation compares SHA-256(provided_token) against stored hash
- Hash collision check at creation time (SHA-256 collision probability negligible)

### 6.3 Credential Rotation Policy

| Secret Type | Rotation Frequency | Method |
|-------------|:------------------:|--------|
| API tokens | 90 days | `rotate-credentials` generates new token, expires old |
| Connector secrets | 180 days | Admin re-configures via admin-center_v2 |
| JWT signing keys | 365 days | Key rotation with 30-day overlap window |
| Database passwords | 365 days | Managed via infrastructure automation |

---

## 7. Security Audit Requirements

### 7.1 Denied Access Logging

Every permission denial produces a structured audit entry:

```json
{
  "actor_id": "uuid",
  "actor_type": "user",
  "action": "permission_denied",
  "entity_type": "function",
  "entity_id": "update-ticket-record",
  "details": {
    "required_permissions": ["tickets:update"],
    "matched_permissions": [],
    "missing_permissions": ["tickets:update"],
    "reason": "insufficient_role"
  },
  "correlation_id": "uuid"
}
```

### 7.2 Token Generation Logging

Every API token generation is logged with:

| Field | Value | Sensitivity |
|-------|-------|:-----------:|
| Token ID | `token_id` UUID | Safe to log |
| Actor | `generated_by` user ID | Safe to log |
| Timestamp | `generated_at` | Safe to log |
| Scopes | Array of `{resource, action}` pairs | Safe to log |
| Expiry | `expires_at` | Safe to log |
| **Token Value** | **NEVER LOGGED** | **Never captured in logs** |

### 7.3 Credential Rotation Logging

Every credential rotation is logged with fingerprints only:

| Field | Value | Notes |
|-------|-------|-------|
| Connector ID | `connector_id` UUID | Safe to log |
| Rotated by | `rotated_by` user ID | Safe to log |
| Timestamp | `rotated_at` | Safe to log |
| Key fingerprint | `SHA-256(last_4_bytes)` | Partial hash only |
| Rotation type | `full` or `key_only` | Safe to log |
| **Full credential** | **NEVER LOGGED** | **Never captured in logs** |
