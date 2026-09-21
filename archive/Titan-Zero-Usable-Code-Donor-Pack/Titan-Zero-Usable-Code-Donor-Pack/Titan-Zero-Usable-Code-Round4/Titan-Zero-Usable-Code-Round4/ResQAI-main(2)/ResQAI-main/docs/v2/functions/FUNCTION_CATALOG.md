# RESQAI V2 — Master Function Catalog

> Merged Catalog — V1 Deployed + V2 Planned  
> Principal Integration Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Authentication & Security](#1-authentication--security-domain-functions)
2. [Administration](#2-administration-domain-functions)
3. [Support / Ticket](#3-support--ticket-domain-functions)
4. [Appointment](#4-appointment-domain-functions)
5. [Technician](#5-technician-domain-functions)
6. [CRM](#6-crm-domain-functions)
7. [Operations](#7-operations-domain-functions)
8. [Resolution / Dispute](#8-resolution--dispute-domain-functions)
9. [Work Order](#9-work-order-domain-functions)
10. [Dispatch](#10-dispatch-domain-functions)
11. [Notification](#11-notification-domain-functions)
12. [Analytics](#12-analytics-domain-functions)
13. [Reporting](#13-reporting-domain-functions)
14. [Knowledge](#14-knowledge-domain-functions)
15. [Inventory](#15-inventory-domain-functions)
16. [Customer Experience](#16-customer-experience-domain-functions)
17. [Automation](#17-automation-domain-functions)
18. [Quality](#18-quality-domain-functions)

---

## Function Count Summary

| Domain | Functions | Count |
|--------|-----------|:-----:|
| Authentication & Security | authenticate-user, validate-session, validate-permissions, generate-api-token, rotate-credentials | 5 |
| Administration | create-user, update-user, list-users, create-role, assign-user-role, manage-permission, list-permissions, record-audit, query-audit-log, provision-user, deactivate-user, validate-config-change, apply-config-change, log-audit-event | 14 |
| Support / Ticket | create-ticket, update-ticket-v2, update-ticket-record, assign-ticket, close-ticket, escalate-ticket, search-tickets, check-ticket-urgency, collect-resolved-tickets, validate-ticket-input, classify-ticket-sla-tier, check-sla-deadline, batch-sla-check | 13 |
| Appointment | create-appointment, list-appointments, get-appointment, assign-appointment-technician, accept-appointment, complete-appointment, cancel-appointment, fetch-upcoming-appointments, schedule-appointment-reminders, check-reminder-window | 10 |
| Technician | create-technician, update-technician, update-technician-skills, list-technicians | 4 |
| CRM | create-customer, update-customer, get-customer, search-customers, create-followup, complete-followup, list-followups, account-health-scan, update-account-health, update-account-health-status, flag-slipping-followups, create-followup-tasks, finalize-slippage-review, generate-account-score | 14 |
| Operations | create-operations-tasks, dashboard-metrics, generate-standup-report | 3 |
| Resolution / Dispute | resolve-dispute, resolve-dispute-v2, list-disputes | 3 |
| Work Order | create-work-order, update-work-order, get-work-order, list-work-orders, update-work-order-stage, complete-work-order | 6 |
| Dispatch | finalize-dispatch, calculate-dispatch-priority | 2 |
| Notification | dispatch-notifications, dispatch-notification-v2, send-bulk-notification, track-notification, render-notification-template, process-notification-delivery | 6 |
| Analytics | analytics-aggregation, create-report, schedule-report, execute-report, sync-events-analytics, calculate-metric-trend, batch-metric-aggregation | 7 |
| Reporting | generate-report-data, send-report | 2 |
| Knowledge | extract-knowledge-gap, search-knowledge-articles, suggest-knowledge-article | 3 |
| Inventory | create-inventory-item, update-inventory-item, list-inventory, check-inventory-level, reorder-inventory, record-inventory-transaction | 6 |
| Customer Experience | process-feedback-survey, analyze-feedback-sentiment | 2 |
| Automation | verify-workflow-health, recover-workflow-instance, reset-circuit-breaker | 3 |
| Quality | evaluate-quality-score, flag-quality-violation | 2 |
| **Total** | | **~107** |

> *~107 unique functions: ~55 V1 deployed + ~52 V2 planned (many overlap between versions).*

---

## Attribute Legend

Each function entry contains these attributes:

| Attribute | Description |
|-----------|-------------|
| **Status** | `v1 deployed`, `v2 planned`, or `v1 deployed + v2 planned` |
| **Type** | DETERMINISTIC, READER, WRITER, AGGREGATOR, TRANSFORMER, ORCHESTRATOR, API |
| **Purpose** | One-line functional intent |
| **Business Domain** | Primary domain the function belongs to |
| **Owner Application** | Primary app that owns/defines the function |
| **Input Schema** | Expected input fields and types |
| **Output Schema** | Return fields and types |
| **Validation Rules** | Business validation constraints |
| **Referenced Tables** | Tables read or written |
| **Read Ops** | Tables with read permissions |
| **Write Ops** | Tables with write/create permissions |
| **Update Ops** | Tables with update permissions |
| **Published Events** | Events emitted by the function |
| **Consumed Events** | Events that trigger or are consumed by the function |
| **Called By** | Apps / agents / workflows that invoke this function |
| **Calls To** | Sub-functions or connectors called |
| **AI Agent Dependencies** | Agents that depend on this function |
| **Workflow Dependencies** | Workflows that use this function |
| **Auth Requirements** | Required actor authentication |
| **Authorization Requirements** | Required permission grants |
| **Error Handling** | Error scenarios and responses |
| **Retry Policy** | Retry count and backoff strategy |
| **Timeout Policy** | Maximum execution time |
| **Idempotency Strategy** | How duplicate invocations are prevented |
| **Audit Requirements** | What is logged to audit trail |
| **Logging Requirements** | What is written to operations_log |
| **Performance Requirements** | Expected runtime / throughput |
| **Caching Policy** | Whether results are cached |
| **Version Strategy** | How versioning is handled |

---

## 1. Authentication & Security Domain Functions

---

### 1.1 authenticate-user

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Authenticate a user by email against stored records, validate auth provider if specified, update last_login_at, create a session, and log the operation |
| **Business Domain** | Authentication & Security |
| **Owner Application** | admin-center (v2) |
| **Input Schema** | `{email: string, password?: string, auth_provider?: string, auth_provider_id?: string}` |
| **Output Schema** | `{status: "success"|"error", user_id?: string, name?: string, email?: string, role?: string, token?: string, error?: string}` |
| **Validation Rules** | Email must exist in users table; if auth_provider specified, must match stored value; if auth_provider_id specified, must match stored value |
| **Referenced Tables** | users_v2, user_sessions_v2, operations_log |
| **Read Ops** | users_v2 (table.read, record.read), user_sessions_v2 (table.read) |
| **Write Ops** | user_sessions_v2 (record.create), operations_log (record.create) |
| **Update Ops** | users_v2 (record.write — last_login_at) |
| **Published Events** | None (session created internally) |
| **Consumed Events** | Login form submission (customer-portal, admin-center) |
| **Called By** | admin-center_v2, customer-portal_v2 (v1) |
| **Calls To** | None (direct DB access) |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None (direct invocation) |
| **Auth Requirements** | None (unauthenticated — this IS the auth function) |
| **Authorization Requirements** | None (unauthenticated) |
| **Error Handling** | User not found → error; Auth provider mismatch → error; Auth provider ID mismatch → error |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | Not idempotent (creates new session each call) |
| **Audit Requirements** | operations_log: action="user authentication", result includes user_id and email |
| **Logging Requirements** | Login attempt recorded to operations_log regardless of success/failure |
| **Performance Requirements** | <100ms |
| **Caching Policy** | None (must be real-time) |
| **Version Strategy** | Single version; V2 migrate to OAuth2 with identity provider abstraction |

---

### 1.2 validate-session

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Validate whether a session token is still active, not expired, and not invalidated |
| **Business Domain** | Authentication & Security |
| **Owner Application** | admin-center (v2) |
| **Input Schema** | `{session_token: string}` |
| **Output Schema** | `{valid: bool, user_id?: string, expires_at?: string, error?: string}` |
| **Validation Rules** | Session must exist; must not be expired; must not have is_invalidated=true |
| **Referenced Tables** | user_sessions_v2 |
| **Read Ops** | user_sessions_v2 (table.read, record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Called by middleware on every authenticated request |
| **Called By** | ALL V2 applications (via auth middleware) |
| **Calls To** | None (direct DB access) |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None (middleware-level) |
| **Auth Requirements** | None (called before auth is established) |
| **Authorization Requirements** | None |
| **Error Handling** | Session not found → invalid; Session expired → invalid; Session invalidated → invalid |
| **Retry Policy** | 1 retry: 500ms |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | Read-only, naturally idempotent |
| **Audit Requirements** | N/A (read-only) |
| **Logging Requirements** | N/A (no mutation) |
| **Performance Requirements** | <10ms (called on every request) |
| **Caching Policy** | 30s TTL for session cache (token to validity) |
| **Version Strategy** | Single version; V2 plan to replace with JWT-based validation |

---

### 1.3 validate-permissions

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | DETERMINISTIC |
| **Purpose** | Check if a user or agent has the required permissions for a given action on a resource |
| **Business Domain** | Authentication & Security |
| **Owner Application** | admin-center_v2 |
| **Input Schema** | `{actor_id, actor_type: "user"|"agent", required_permissions: string[], resource_type, resource_id?}` |
| **Output Schema** | `{authorized: bool, matched_permissions: string[], missing_permissions: string[], decision: "granted"|"denied"|"ambiguous"}` |
| **Validation Rules** | Actor must exist; required_permissions must be non-empty; resource_type must be a known type |
| **Referenced Tables** | role_permissions_v2, user_roles_v2 |
| **Read Ops** | role_permissions_v2 (read), user_roles_v2 (read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Called before every WRITER/ORCHESTRATOR function execution |
| **Called By** | ALL V2 applications (via permission middleware) |
| **Calls To** | None |
| **AI Agent Dependencies** | ALL agents (via function guard) |
| **Workflow Dependencies** | ALL V2 workflows |
| **Auth Requirements** | Requires valid session (authenticated user/agent) |
| **Authorization Requirements** | role_permissions_v2 (read), user_roles_v2 (read) |
| **Error Handling** | Actor not found → denied; resource_type unknown → ambiguous |
| **Retry Policy** | 0 retries (deterministic) |
| **Timeout Policy** | 15ms |
| **Idempotency Strategy** | Implicit (input hash) |
| **Audit Requirements** | If denied → audit log entry with actor, resource, missing permissions |
| **Logging Requirements** | Denied attempts logged to audit_log_v2 |
| **Performance Requirements** | <15ms |
| **Caching Policy** | 60s TTL for role-permission lookup cache |
| **Version Strategy** | V2 only; replaces V1 inline permission checks |

---

### 1.4 generate-api-token

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | WRITER |
| **Purpose** | Generate a scoped API token for programmatic access with expiry |
| **Business Domain** | Authentication & Security |
| **Owner Application** | admin-center_v2 |
| **Input Schema** | `{user_id, token_name, scopes: string[], expires_in_days: int, created_by}` |
| **Output Schema** | `{token_id, token_preview: string (first 8 chars), scopes, expires_at, full_token: string (single return)}` |
| **Validation Rules** | User must exist; expires_in_days must be 1-365; token_name must be unique per user |
| **Referenced Tables** | users_v2 |
| **Read Ops** | users_v2 (read) |
| **Write Ops** | users_v2 (write — token hash stored) |
| **Update Ops** | N/A |
| **Published Events** | None |
| **Consumed Events** | User or admin requests token generation |
| **Called By** | admin-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None (direct invocation) |
| **Auth Requirements** | Authenticated user with token management permissions |
| **Authorization Requirements** | users_v2 (read/write) |
| **Error Handling** | User not found → error; invalid scope → error; duplicate token_name → error |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 50ms |
| **Idempotency Strategy** | `user_id + token_name + scope_hash` (24h TTL) |
| **Audit Requirements** | token_id (not token value), scopes, expires_at, created_by, correlation_id |
| **Logging Requirements** | Token generation logged to audit_log_v2 |
| **Performance Requirements** | <50ms |
| **Caching Policy** | None |
| **Version Strategy** | V2 only |

---

### 1.5 rotate-credentials

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | ORCHESTRATOR |
| **Purpose** | Rotate connector credentials with validation, backup, and rollback capability |
| **Business Domain** | Authentication & Security |
| **Owner Application** | admin-center_v2 |
| **Input Schema** | `{connector_id, rotated_by, reason: "scheduled"|"compromised"|"expired", force_rotate?: bool}` |
| **Output Schema** | `{connector_id, rotation_id, previous_credential_fingerprint, new_credential_fingerprint, status: "active", health_check_passed: bool}` |
| **Validation Rules** | Connector must exist; reason must be valid enum; force_rotate bypasses expiry check |
| **Referenced Tables** | connectors_v2, system_settings_v2 |
| **Read Ops** | connectors_v2 (read), system_settings_v2 (read) |
| **Write Ops** | connectors_v2 (write — credential store), audit_log_v2 (write) |
| **Update Ops** | connectors_v2 (update) |
| **Published Events** | `system.config.changed` (credential update) |
| **Consumed Events** | Scheduled rotation trigger, security incident |
| **Called By** | admin-center_v2 |
| **Calls To** | Provider health check API |
| **AI Agent Dependencies** | admin-connector-manager_v2 |
| **Workflow Dependencies** | None (direct invocation or automation schedule) |
| **Auth Requirements** | Authenticated admin |
| **Authorization Requirements** | connectors_v2 (read/write), system_settings_v2 (read) |
| **Error Handling** | Connector not found → rollback; health check fails → rollback to previous credentials |
| **Retry Policy** | 3 retries: exponential 1s, 5s, 15s; rollback on failure |
| **Timeout Policy** | 2s |
| **Idempotency Strategy** | `connector_id + rotation_request_id` (24h TTL) |
| **Audit Requirements** | connector_id, rotation_id, old/new fingerprint (not value), rotated_by, reason, correlation_id |
| **Logging Requirements** | Full rotation audit trail |
| **Performance Requirements** | <2s (including provider API call) |
| **Caching Policy** | None |
| **Version Strategy** | V2 only |

---

## 2. Administration Domain Functions

---

### 2.1 create-user

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Create a new user record with validated email, unique email check, and status active. Log the operation |
| **Business Domain** | Administration |
| **Owner Application** | admin-center (v2) |
| **Input Schema** | `{email: string, name: string, role_id: string, auth_provider?: string, auth_provider_id?: string, preferences_config?: dict, created_by?: string}` |
| **Output Schema** | `{status: "success"|"error", user_id?: string, error?: string}` |
| **Validation Rules** | Email must contain "@"; email must be unique across users; name must not be empty |
| **Referenced Tables** | users_v2, operations_log |
| **Read Ops** | users_v2 (table.read, record.read — duplicate check) |
| **Write Ops** | users_v2 (record.create), operations_log (record.create) |
| **Update Ops** | None |
| **Published Events** | None (V1); V2 plan: `user.created` |
| **Consumed Events** | Admin user creation form submission |
| **Called By** | admin-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | user-provisioning_v2 (v2) |
| **Auth Requirements** | Authenticated admin user |
| **Authorization Requirements** | users_v2 (read/create) |
| **Error Handling** | Invalid email → error; Email already exists → error |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `email + created_by` (24h TTL, prevent duplicate user creation) |
| **Audit Requirements** | operations_log: action="user created", result includes user_id, email, role_id |
| **Logging Requirements** | User creation details logged to operations_log |
| **Performance Requirements** | <100ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 standalone; V2 uses provision-user orchestrator with notification and onboarding |

---

### 2.2 update-user

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Update user profile fields (name, email, role_id, status, preferences) with partial update support |
| **Business Domain** | Administration |
| **Owner Application** | admin-center (v2) |
| **Input Schema** | `{user_id: string, name?: string, email?: string, role_id?: string, status?: string, preferences_config?: dict, updated_by?: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", user_id: string, error?: string}` |
| **Validation Rules** | User must exist; if email changes, must be unique; status must be active/suspended/inactive |
| **Referenced Tables** | users_v2, operations_log |
| **Read Ops** | users_v2 (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | users_v2 (record.write) |
| **Published Events** | None |
| **Consumed Events** | Admin update request |
| **Called By** | admin-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated admin user |
| **Authorization Requirements** | users_v2 (read/write) |
| **Error Handling** | User not found → not_found; No updates provided → success (no-op) |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `user_id + updated_fields_hash` (1h TTL) |
| **Audit Requirements** | operations_log: action="user updated", result includes user_id and changed fields |
| **Logging Requirements** | User update details logged to operations_log |
| **Performance Requirements** | <100ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 standalone; V2 inherits as part of user lifecycle management |

---

### 2.3 list-users

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | List users with optional role and status filters |
| **Business Domain** | Administration |
| **Owner Application** | admin-center (v2) |
| **Input Schema** | `{role_id?: string, status?: string, limit?: int, offset?: int}` |
| **Output Schema** | `{total: int, users: [{user_id, name, email, role_id, status, created_at}]}` |
| **Validation Rules** | None (query-only) |
| **Referenced Tables** | users_v2 |
| **Read Ops** | users_v2 (table.read, record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Admin center user management view |
| **Called By** | admin-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated admin user |
| **Authorization Requirements** | users_v2 (read) |
| **Error Handling** | N/A (read-only) |
| **Retry Policy** | 1 retry: 500ms |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | Read-only, naturally idempotent |
| **Audit Requirements** | N/A (read-only) |
| **Logging Requirements** | N/A (no mutation) |
| **Performance Requirements** | <200ms for 1000 users |
| **Caching Policy** | 30s TTL |
| **Version Strategy** | V1 standalone; V2 adds pagination and advanced filtering |

---

### 2.4 create-role

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Create a new user role with unique name check and optional system-role flag |
| **Business Domain** | Administration |
| **Owner Application** | admin-center (v2) |
| **Input Schema** | `{name: string, description?: string, is_system?: bool}` |
| **Output Schema** | `{status: "success"|"error", role_id?: string, error?: string}` |
| **Validation Rules** | Role name must be unique; name must not be empty; is_system only settable by system users |
| **Referenced Tables** | user_roles_v2, operations_log |
| **Read Ops** | user_roles_v2 (record.read — duplicate check) |
| **Write Ops** | user_roles_v2 (record.create), operations_log (record.create) |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Admin role creation form |
| **Called By** | admin-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated admin user |
| **Authorization Requirements** | user_roles_v2 (read/create), operations_log (write) |
| **Error Handling** | Role name exists → error |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `role_name` (24h TTL, duplicate name rejected) |
| **Audit Requirements** | operations_log: action="role created", result includes role_id and name |
| **Logging Requirements** | Role creation logged to operations_log |
| **Performance Requirements** | <50ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 standalone; V2 integrates with permission management |

---

### 2.5 assign-user-role

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Assign a role to a user, validating both the user and role exist |
| **Business Domain** | Administration |
| **Owner Application** | admin-center (v2) |
| **Input Schema** | `{user_id: string, role_id: string, assigned_by: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", user_id: string, role_id: string, error?: string}` |
| **Validation Rules** | User must exist; role must exist |
| **Referenced Tables** | users_v2, user_roles_v2, operations_log |
| **Read Ops** | users_v2 (record.read), user_roles_v2 (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | users_v2 (record.write — role_id field) |
| **Published Events** | None |
| **Consumed Events** | Admin role assignment form |
| **Called By** | admin-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | user-provisioning_v2 (v2) |
| **Auth Requirements** | Authenticated admin user |
| **Authorization Requirements** | users_v2 (read/write), user_roles_v2 (read) |
| **Error Handling** | User not found → not_found; Role not found → not_found |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `user_id + role_id + assigned_by` (1h TTL) |
| **Audit Requirements** | operations_log: action="user role assigned", result includes user_id and role_id |
| **Logging Requirements** | Role assignment logged to operations_log |
| **Performance Requirements** | <50ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 standalone; V2 extends with role hierarchy support |

---

### 2.6 manage-permission

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Grant or revoke a permission on a resource for a role |
| **Business Domain** | Administration |
| **Owner Application** | admin-center (v2) |
| **Input Schema** | `{role_id: string, resource_type: string, resource_name: string, permission_id: string, action: "grant"|"revoke"}` |
| **Output Schema** | `{status: "success"|"error", error?: string}` |
| **Validation Rules** | Role must exist; resource_type must be known; permission_id must be valid for resource_type |
| **Referenced Tables** | role_permissions_v2, operations_log |
| **Read Ops** | role_permissions_v2 (record.read) |
| **Write Ops** | role_permissions_v2 (record.create if grant, record.delete if revoke), operations_log (record.create) |
| **Update Ops** | role_permissions_v2 (record.write) |
| **Published Events** | None |
| **Consumed Events** | Admin permission management form |
| **Called By** | admin-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated super-admin user |
| **Authorization Requirements** | role_permissions_v2 (read/create/write), operations_log (write) |
| **Error Handling** | Role not found → error; Invalid permission → error |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `role_id + resource_name + permission_id + action` (24h TTL) |
| **Audit Requirements** | operations_log: action includes role_id, resource, permission, action type |
| **Logging Requirements** | Permission change logged to operations_log |
| **Performance Requirements** | <50ms |
| **Caching Policy** | Invalidate role-permission cache on change |
| **Version Strategy** | V1 standalone; V2 integrates with validate-permissions middleware |

---

### 2.7 list-permissions

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | List permissions with optional role and resource filters, including role names |
| **Business Domain** | Administration |
| **Owner Application** | admin-center (v2) |
| **Input Schema** | `{role_id?: string, resource_type?: string, limit?: int, offset?: int}` |
| **Output Schema** | `{total: int, permissions: [{role_id, role_name, resource_type, resource_name, permission_id}]}` |
| **Validation Rules** | None (query-only) |
| **Referenced Tables** | role_permissions_v2, user_roles_v2 |
| **Read Ops** | role_permissions_v2 (record.read), user_roles_v2 (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Admin permission view |
| **Called By** | admin-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated admin user |
| **Authorization Requirements** | role_permissions_v2 (read), user_roles_v2 (read) |
| **Error Handling** | N/A (read-only) |
| **Retry Policy** | 1 retry: 500ms |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | Read-only, naturally idempotent |
| **Audit Requirements** | N/A (read-only) |
| **Logging Requirements** | N/A (no mutation) |
| **Performance Requirements** | <100ms |
| **Caching Policy** | 60s TTL |
| **Version Strategy** | V1 standalone; V2 extends with pagination |

---

### 2.8 record-audit

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Record an audit log entry for any entity action within the system |
| **Business Domain** | Administration |
| **Owner Application** | admin-center (v2) |
| **Input Schema** | `{action: string, entity_type: string, entity_id: string, actor: string, before_state?: dict, after_state?: dict, metadata?: dict, timestamp?: string}` |
| **Output Schema** | `{status: "success"|"error", audit_id?: string, error?: string}` |
| **Validation Rules** | action and entity_type must be non-empty |
| **Referenced Tables** | audit_log_v2 |
| **Read Ops** | None |
| **Write Ops** | audit_log_v2 (record.create) |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Called by ALL WRITER functions after mutation (V1 pattern) |
| **Called By** | ALL V1 and V2 applications (via functions or direct call) |
| **Calls To** | None |
| **AI Agent Dependencies** | ALL agents |
| **Workflow Dependencies** | ALL V1 and V2 workflows |
| **Auth Requirements** | Authenticated system or user |
| **Authorization Requirements** | audit_log_v2 (create) |
| **Error Handling** | N/A (fire-and-forget; errors logged internally) |
| **Retry Policy** | 3 retries: exponential 1s, 5s, 15s (critical: must succeed) |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `audit_correlation_key + action + entity_id` (1h TTL) |
| **Audit Requirements** | Self-logging omitted to prevent recursion |
| **Logging Requirements** | Direct write to audit_log_v2 |
| **Performance Requirements** | <20ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 uses record-audit; V2 replaces with log-audit-event (standardized format) |

---

### 2.9 query-audit-log

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Query the audit log with comprehensive filters, ordered by created_at descending |
| **Business Domain** | Administration |
| **Owner Application** | admin-center (v2) |
| **Input Schema** | `{actor?: string, entity_type?: string, entity_id?: string, action?: string, from_timestamp?: string, to_timestamp?: string, limit?: int, offset?: int}` |
| **Output Schema** | `{total: int, entries: [{audit_id, action, entity_type, entity_id, actor, timestamp, metadata}]}` |
| **Validation Rules** | None (query-only) |
| **Referenced Tables** | audit_log_v2 |
| **Read Ops** | audit_log_v2 (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Admin audit view, compliance queries |
| **Called By** | admin-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated admin or auditor |
| **Authorization Requirements** | audit_log_v2 (read) |
| **Error Handling** | N/A (read-only) |
| **Retry Policy** | 1 retry: 500ms |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | Read-only, naturally idempotent |
| **Audit Requirements** | N/A (read-only) |
| **Logging Requirements** | N/A (no mutation) |
| **Performance Requirements** | <500ms for 1000 entries |
| **Caching Policy** | None (audit data must be real-time) |
| **Version Strategy** | V1 standalone; V2 enhanced with export and aggregation |

---

### 2.10 provision-user

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | ORCHESTRATOR |
| **Purpose** | Provision a new user account with role, permissions, and default settings |
| **Business Domain** | Administration |
| **Owner Application** | admin-center_v2 |
| **Input Schema** | `{email, full_name, role_id, department, notify_user?: bool, created_by}` |
| **Output Schema** | `{user_id, email, role_id, status: "active"|"pending_verification", welcome_sent: bool}` |
| **Validation Rules** | Email must be valid; email must be unique; role_id must reference an active role |
| **Referenced Tables** | users_v2, roles_v2, role_permissions_v2 |
| **Read Ops** | users_v2 (read), roles_v2 (read), role_permissions_v2 (read) |
| **Write Ops** | users_v2 (write), user_roles_v2 (write) |
| **Update Ops** | N/A |
| **Published Events** | `user.created` |
| **Consumed Events** | Admin user creation request |
| **Called By** | admin-center_v2 |
| **Calls To** | dispatch-notifications (welcome email) |
| **AI Agent Dependencies** | admin-manager_v2 |
| **Workflow Dependencies** | user-provisioning_v2 |
| **Auth Requirements** | Authenticated admin |
| **Authorization Requirements** | users_v2 (read/write), roles_v2 (read), role_permissions_v2 (read), user_roles_v2 (write) |
| **Error Handling** | Email exists → rollback; role not found → rollback |
| **Retry Policy** | 3 retries: exponential 1s, 5s, 15s |
| **Timeout Policy** | 200ms |
| **Idempotency Strategy** | `email + created_by` (24h TTL) |
| **Audit Requirements** | before/after user record, role assignment, created_by, correlation_id |
| **Logging Requirements** | Full provisioning audit trail |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V2 only; replaces create-user for full lifecycle |

---

### 2.11 deactivate-user

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | WRITER |
| **Purpose** | Deactivate a user account with session invalidation and notification |
| **Business Domain** | Administration |
| **Owner Application** | admin-center_v2 |
| **Input Schema** | `{user_id, deactivated_by, reason, notify_user?: bool, reassign_tickets_to?}` |
| **Output Schema** | `{user_id, previous_status, new_status: "disabled", disabled_at}` |
| **Validation Rules** | User must exist and be active; reason must be provided |
| **Referenced Tables** | users_v2, user_roles_v2, user_sessions_v2 |
| **Read Ops** | users_v2 (read), user_roles_v2 (read), user_sessions_v2 (read) |
| **Write Ops** | users_v2 (write), user_sessions_v2 (write — invalidate) |
| **Update Ops** | users_v2 (write status change) |
| **Published Events** | `user.disabled` |
| **Consumed Events** | Admin user deactivation request |
| **Called By** | admin-center_v2 |
| **Calls To** | dispatch-notifications (if notify_user) |
| **AI Agent Dependencies** | admin-manager_v2 |
| **Workflow Dependencies** | user-provisioning_v2 |
| **Auth Requirements** | Authenticated admin |
| **Authorization Requirements** | users_v2 (read/write), user_roles_v2 (read), user_sessions_v2 (read/write) |
| **Error Handling** | User not found → error; already disabled → idempotent no-op |
| **Retry Policy** | 3 retries: exponential 1s, 5s, 15s |
| **Timeout Policy** | 100ms |
| **Idempotency Strategy** | `user_id + deactivation_request_id` (24h TTL) |
| **Audit Requirements** | before/after user status, deactivated_by, reason, reassignment details, correlation_id |
| **Logging Requirements** | Full deactivation audit trail |
| **Performance Requirements** | <100ms |
| **Caching Policy** | None |
| **Version Strategy** | V2 only |

---

### 2.12 validate-config-change

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | DETERMINISTIC |
| **Purpose** | Validate a proposed configuration change against schema, constraints, and impact analysis |
| **Business Domain** | Administration |
| **Owner Application** | admin-center_v2 |
| **Input Schema** | `{setting_key, new_value, category, change_type: "system"|"feature_flag"|"threshold"|"connector"}` |
| **Output Schema** | `{valid: bool, errors: string[], warnings: string[], impact: {apps_affected: string[], workflows_affected: string[]}, suggested_revert_timeout?: int}` |
| **Validation Rules** | setting_key must exist in system_settings_v2; new_value must match expected type; change_type must be valid |
| **Referenced Tables** | system_settings_v2, feature_flags_v2 |
| **Read Ops** | system_settings_v2 (read), feature_flags_v2 (read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Configuration change request |
| **Called By** | admin-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | admin-system-config_v2 |
| **Workflow Dependencies** | system-config-management_v2 |
| **Auth Requirements** | Authenticated admin |
| **Authorization Requirements** | system_settings_v2 (read), feature_flags_v2 (read) |
| **Error Handling** | Setting not found → invalid; type mismatch → invalid with error message |
| **Retry Policy** | 0 retries (deterministic) |
| **Timeout Policy** | 50ms |
| **Idempotency Strategy** | Implicit (input hash) |
| **Audit Requirements** | N/A (no mutation; validation logged by caller) |
| **Logging Requirements** | None |
| **Performance Requirements** | <50ms |
| **Caching Policy** | 30s TTL for setting definitions |
| **Version Strategy** | V2 only |

---

### 2.13 apply-config-change

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | WRITER |
| **Purpose** | Apply a validated configuration change and emit refresh signal |
| **Business Domain** | Administration |
| **Owner Application** | admin-center_v2 |
| **Input Schema** | `{setting_key, new_value, previous_value, changed_by, validated_by_validation_id, revert_timeout_minutes?}` |
| **Output Schema** | `{setting_key, previous_value, new_value, applied_at, config_version: int}` |
| **Validation Rules** | Must be called after validate-config-change; setting_key must exist |
| **Referenced Tables** | system_settings_v2, feature_flags_v2 |
| **Read Ops** | system_settings_v2 (read), feature_flags_v2 (read) |
| **Write Ops** | system_settings_v2 (write) or feature_flags_v2 (write) |
| **Update Ops** | N/A |
| **Published Events** | `system.config.changed` |
| **Consumed Events** | After validate-config-change passes |
| **Called By** | admin-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | admin-system-config_v2 |
| **Workflow Dependencies** | system-config-management_v2 |
| **Auth Requirements** | Authenticated admin |
| **Authorization Requirements** | system_settings_v2 (read/write), feature_flags_v2 (read/write) |
| **Error Handling** | Setting not found → error; validation ID not found → error |
| **Retry Policy** | 3 retries: exponential 1s, 5s, 15s |
| **Timeout Policy** | 50ms |
| **Idempotency Strategy** | `setting_key + change_request_id` (24h TTL) |
| **Audit Requirements** | before/after setting value, changed_by, validation reference, config version, correlation_id |
| **Logging Requirements** | Full config change audit trail |
| **Performance Requirements** | <50ms |
| **Caching Policy** | Invalidate config cache on change |
| **Version Strategy** | V2 only |

---

### 2.14 log-audit-event

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | WRITER |
| **Purpose** | Write a structured audit log entry for any system mutation |
| **Business Domain** | Administration |
| **Owner Application** | admin-center_v2 |
| **Input Schema** | `{actor_id, actor_type: "user"|"agent"|"system", action, entity_type, entity_id, before_state?, after_state?, correlation_id, source_ip?, metadata?}` |
| **Output Schema** | `{audit_id, recorded_at}` |
| **Validation Rules** | actor_id and action required; entity_type must be a known domain entity |
| **Referenced Tables** | None |
| **Read Ops** | None |
| **Write Ops** | audit_log_v2 (write) |
| **Update Ops** | N/A |
| **Published Events** | None |
| **Consumed Events** | Called by ALL WRITER/AGGREGATOR functions after mutation |
| **Called By** | ALL V2 applications (via functions or direct call) |
| **Calls To** | None |
| **AI Agent Dependencies** | ALL agents (via functions) |
| **Workflow Dependencies** | ALL V2 workflows |
| **Auth Requirements** | Authenticated system component |
| **Authorization Requirements** | audit_log_v2 (write) |
| **Error Handling** | N/A (fire-and-forget with internal retry) |
| **Retry Policy** | 3 retries: exponential 1s, 5s, 15s |
| **Timeout Policy** | 20ms |
| **Idempotency Strategy** | `audit_correlation_key + action + entity_id` (1h TTL) |
| **Audit Requirements** | Self-logging omitted to prevent recursion |
| **Logging Requirements** | Direct write to audit_log_v2 |
| **Performance Requirements** | <20ms |
| **Caching Policy** | None |
| **Version Strategy** | V2 standardized replacement for V1 record-audit |

---

## 3. Support / Ticket Domain Functions

---

### 3.1 create-ticket

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Create a new support ticket with status "new", log the operation, and emit a ticket.created event |
| **Business Domain** | Support / Ticket |
| **Owner Application** | support-center (v2) |
| **Input Schema** | `{customer_id: string, customer_name?: string, channel: string, subject: string, message: string, request_type?: string, urgency: string (default "normal"), created_by?: string}` |
| **Output Schema** | `{status: "success"|"error", ticket_id?: string, error?: string}` |
| **Validation Rules** | customer_id, channel, subject, message are required; channel must be email/phone/web/chat; urgency must be low/normal/high/urgent |
| **Referenced Tables** | tickets_v2 (v1: "tickets"), operations_log, events_v2 (v1: "events") |
| **Read Ops** | tickets_v2 (record.read), operations_log (record.read), events_v2 (record.read) |
| **Write Ops** | tickets_v2 (record.create), operations_log (record.create), events_v2 (record.create) |
| **Update Ops** | None |
| **Published Events** | `ticket.created` (via events table) |
| **Consumed Events** | Ticket creation form submission |
| **Called By** | customer-portal_v2, support-center_v2, agent: request-classifier |
| **Calls To** | None |
| **AI Agent Dependencies** | request-classifier (triggered after creation) |
| **Workflow Dependencies** | ticket-intake_v2 (v2), ticket-auto-response_v2 (v2) |
| **Auth Requirements** | Authenticated user or system |
| **Authorization Requirements** | tickets_v2 (read/write), operations_log (read/write), events_v2 (read/write) |
| **Error Handling** | Missing required fields → error with details |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | Not idempotent (creates new ticket each call; duplicates prevented by workflow) |
| **Audit Requirements** | operations_log: action="ticket.created", result includes ticket_id, channel, urgency |
| **Logging Requirements** | Ticket creation logged to operations_log |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 creates raw ticket; V2 validate-ticket-input + create-ticket split |

---

### 3.2 update-ticket-v2

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Enhanced ticket update with status, priority, assignment, notes, and escalation management |
| **Business Domain** | Support / Ticket |
| **Owner Application** | support-center (v2) |
| **Input Schema** | `{ticket_id: string, status?: string, priority?: string, assigned_owner?: string, escalation_level?: string, changed_by: string, reason: string, internal_notes?: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", ticket_id: string, error?: string}` |
| **Validation Rules** | Ticket must exist; status transitions must be valid (e.g., closed → reopened requires override) |
| **Referenced Tables** | tickets_v2, operations_log, events_v2 |
| **Read Ops** | tickets_v2 (record.read) |
| **Write Ops** | operations_log (record.create), events_v2 (record.create) |
| **Update Ops** | tickets_v2 (record.write) |
| **Published Events** | `ticket.status_changed`, `ticket.assigned`, `ticket.escalated` (as applicable) |
| **Consumed Events** | Called synchronously by agents and workflows |
| **Called By** | support-center_v2, agent: support-manager, agent: support-reply-drafter, agent: support-escalation-manager |
| **Calls To** | None |
| **AI Agent Dependencies** | support-manager_v2, support-reply-drafter_v2, support-escalation-manager_v2 |
| **Workflow Dependencies** | ticket-intake_v2, ticket-escalation_v2, ticket-auto-response_v2 |
| **Auth Requirements** | Authenticated user or agent |
| **Authorization Requirements** | tickets_v2 (read/write), operations_log (write), events_v2 (write) |
| **Error Handling** | Ticket not found → not_found; Invalid status transition → error |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `ticket_id + field_set_hash` (1h TTL) |
| **Audit Requirements** | operations_log: action includes update type, result includes changed fields |
| **Logging Requirements** | Update details logged to operations_log |
| **Performance Requirements** | <100ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 enhanced update; V2 uses update-ticket-record with stricter schema |

---

### 3.3 update-ticket-record

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed + v2 planned` |
| **Type** | WRITER |
| **Purpose** | Update ticket status, priority, assigned_owner, or escalation_level with validation |
| **Business Domain** | Support / Ticket |
| **Owner Application** | support-center_v2 |
| **Input Schema** | `{ticket_id, status?, priority?, assigned_owner?, escalation_level?, changed_by, reason}` |
| **Output Schema** | `{ticket_id, previous_status, new_status, previous_owner, new_owner}` |
| **Validation Rules** | Ticket must exist; status transitions must follow state machine; reason must be provided for escalation |
| **Referenced Tables** | tickets_v2 |
| **Read Ops** | tickets_v2 (read) |
| **Write Ops** | tickets_v2 (write) |
| **Update Ops** | tickets_v2 (update) |
| **Published Events** | `ticket.status.changed` |
| **Consumed Events** | None (called synchronously) |
| **Called By** | support-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | support-manager_v2, support-reply-drafter_v2, support-escalation-manager_v2 |
| **Workflow Dependencies** | ticket-intake_v2, ticket-escalation_v2, ticket-auto-response_v2 |
| **Auth Requirements** | Authenticated user or agent |
| **Authorization Requirements** | tickets_v2 (read/write) |
| **Error Handling** | Ticket not found → error; invalid transition → error |
| **Retry Policy** | 3 retries: exponential 1s, 5s, 15s |
| **Timeout Policy** | 50ms |
| **Idempotency Strategy** | `workflow_instance_id + node_id` (24h TTL) |
| **Audit Requirements** | before/after record state, actor, correlation_id, timestamp |
| **Logging Requirements** | Full before/after state change logged |
| **Performance Requirements** | <50ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed as update-ticket-v2; V2 refines as update-ticket-record with stricter validation |

---

### 3.4 assign-ticket

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Assign or reassign a ticket to an agent or technician. Log the assignment and emit a ticket.assigned event |
| **Business Domain** | Support / Ticket |
| **Owner Application** | support-center (v2) |
| **Input Schema** | `{ticket_id: string, assigned_to: string, assigned_by: string, assignment_note?: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", ticket_id: string, assigned_to: string, error?: string}` |
| **Validation Rules** | Ticket must exist; assigned_to must be a valid user/technician |
| **Referenced Tables** | tickets_v2, operations_log, events_v2 |
| **Read Ops** | tickets_v2 (record.read) |
| **Write Ops** | operations_log (record.create), events_v2 (record.create) |
| **Update Ops** | tickets_v2 (record.write — assigned_to field) |
| **Published Events** | `ticket.assigned` (or `ticket.reassigned` if previously assigned) |
| **Consumed Events** | Assignment form submission or workflow trigger |
| **Called By** | support-center_v2, agent: request-classifier, agent: support-manager |
| **Calls To** | None |
| **AI Agent Dependencies** | request-classifier, support-manager |
| **Workflow Dependencies** | ticket-intake_v2 |
| **Auth Requirements** | Authenticated user or agent |
| **Authorization Requirements** | tickets_v2 (read/write), operations_log (write), events_v2 (write) |
| **Error Handling** | Ticket not found → not_found |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `ticket_id + assigned_to + assigned_by` (1h TTL) |
| **Audit Requirements** | operations_log: action="ticket.assigned" or "ticket.reassigned", result includes from/to/by |
| **Logging Requirements** | Assignment details logged to operations_log |
| **Performance Requirements** | <100ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 standalone; V2 integrates with update-ticket-record |

---

### 3.5 close-ticket

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Close a ticket with resolution details. Optionally send an email notification to the customer |
| **Business Domain** | Support / Ticket |
| **Owner Application** | support-center (v2) |
| **Input Schema** | `{ticket_id: string, resolution_summary: string, resolution_reasoning?: string, closed_by: string, send_notification?: bool}` |
| **Output Schema** | `{status: "success"|"not_found"|"already_closed"|"error", ticket_id: string, error?: string}` |
| **Validation Rules** | Ticket must exist; ticket must not already be closed; resolution_summary must be provided |
| **Referenced Tables** | tickets_v2, operations_log, events_v2, customers |
| **Read Ops** | tickets_v2 (record.read), customers (record.read if notification needed) |
| **Write Ops** | operations_log (record.create), events_v2 (record.create) |
| **Update Ops** | tickets_v2 (record.write — status, closed_at, resolution_summary) |
| **Published Events** | `ticket.closed` |
| **Consumed Events** | Close ticket form submission |
| **Called By** | support-center_v2, agent: support-manager |
| **Calls To** | resqai-gmail connector (if send_notification=true) |
| **AI Agent Dependencies** | support-manager |
| **Workflow Dependencies** | ticket-auto-response_v2 |
| **Auth Requirements** | Authenticated user or agent |
| **Authorization Requirements** | tickets_v2 (read/write), operations_log (write), events_v2 (write), resqai-gmail (connector.use) |
| **Error Handling** | Ticket not found → not_found; Already closed → already_closed |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `ticket_id + closed_by` (24h TTL, prevent double-close) |
| **Audit Requirements** | operations_log: action="ticket.closed", result includes ticket_id and resolution |
| **Logging Requirements** | Close details logged to operations_log |
| **Performance Requirements** | <200ms (includes optional email send) |
| **Caching Policy** | None |
| **Version Strategy** | V1 standalone; V2 integrates with collect-resolved-tickets for feedback triggers |

---

### 3.6 escalate-ticket

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Escalate a ticket by updating escalation fields and notifying the support-alerts Discord channel |
| **Business Domain** | Support / Ticket |
| **Owner Application** | support-center (v2) |
| **Input Schema** | `{ticket_id: string, escalation_reason: string, escalated_by: string, target_urgency?: string (default "urgent")}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", ticket_id: string, error?: string}` |
| **Validation Rules** | Ticket must exist; escalation_reason must be non-empty; target_urgency must be a valid urgency level |
| **Referenced Tables** | tickets_v2, operations_log, events_v2 |
| **Read Ops** | tickets_v2 (record.read) |
| **Write Ops** | operations_log (record.create), events_v2 (record.create) |
| **Update Ops** | tickets_v2 (record.write — escalated_at, escalation_reason, urgency) |
| **Published Events** | `ticket.escalated` |
| **Consumed Events** | Escalate button in support center |
| **Called By** | support-center_v2, agent: support-escalation-manager |
| **Calls To** | resqai-discord connector (support-alerts channel) |
| **AI Agent Dependencies** | support-escalation-manager |
| **Workflow Dependencies** | ticket-escalation_v2 |
| **Auth Requirements** | Authenticated user or agent |
| **Authorization Requirements** | tickets_v2 (read/write), operations_log (write), events_v2 (write), resqai-discord (connector.use) |
| **Error Handling** | Ticket not found → not_found; Discord notification failure → logged but escalation proceeds |
| **Retry Policy** | 2 retries: linear 1s, 3s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `ticket_id + escalation_reason` (1h TTL) |
| **Audit Requirements** | operations_log: action="ticket.escalated", result includes reason, urgency, escalated_by |
| **Logging Requirements** | Escalation details logged to operations_log |
| **Performance Requirements** | <200ms (includes Discord notification) |
| **Caching Policy** | None |
| **Version Strategy** | V1 standalone; V2 integrates with SLA enforcement workflow |

---
### 3.7 search-tickets

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Search tickets with optional filters by status, urgency, assigned_to, customer_name, and channel. Returns paginated results. |
| **Business Domain** | Support / Ticket |
| **Owner Application** | support-center (v2) |
| **Input Schema** | `{status?: string, urgency?: string, assigned_to?: string, customer_name?: string, channel?: string, limit: int (default 50), offset: int (default 0)}` |
| **Output Schema** | `{total: int, results: Array<{ticket_id, customer_name?, subject, status, urgency, assigned_to?, created_at, channel?}>}` |
| **Validation Rules** | Valid filter values for status, urgency, assigned_to; limit capped at 1000 |
| **Referenced Tables** | tickets |
| **Read Ops** | tickets (record.read, table.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Support center search UI |
| **Called By** | support-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | tickets (read) |
| **Error Handling** | None (returns empty results on error) |
| **Retry Policy** | None |
| **Timeout Policy** | 10s |
| **Idempotency Strategy** | Naturally idempotent (reads only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <500ms for typical queries |
| **Caching Policy** | None (reads from source every call) |
| **Version Strategy** | V1 deployed; V2 planned with full-text search, advanced filtering, and pagination |

---
### 3.8 check-ticket-urgency

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Routing function for ticket-intake workflow. Evaluates urgency value from request-classifier and returns 'urgent' or 'normal' routing signal. |
| **Business Domain** | Support / Ticket |
| **Owner Application** | ticket-intake workflow |
| **Input Schema** | `{ticket_id: string, urgency: string, classification_status?: string}` |
| **Output Schema** | `{routing: string, ticket_id: string, is_urgent: bool}` |
| **Validation Rules** | urgency must be one of: low, normal, high, urgent |
| **Referenced Tables** | None (stateless) |
| **Read Ops** | None |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | request-classifier output in ticket-intake workflow |
| **Called By** | ticket-intake workflow |
| **Calls To** | None |
| **AI Agent Dependencies** | request-classifier (provides urgency input) |
| **Workflow Dependencies** | ticket-intake workflow |
| **Auth Requirements** | Workflow execution context |
| **Authorization Requirements** | None (stateless) |
| **Error Handling** | None — simple mapping function |
| **Retry Policy** | None |
| **Timeout Policy** | 1s |
| **Idempotency Strategy** | Naturally idempotent (pure function) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <50ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 extends with more routing criteria |

---
### 3.9 collect-resolved-tickets

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Query tickets closed within a given window, return structured list for satisfaction monitoring workflow, and post summary to Discord support-reviews channel |
| **Business Domain** | Support / Ticket |
| **Owner Application** | satisfaction-monitor (v2) |
| **Input Schema** | `{lookback_days: int (default 7), today?: date, max_tickets: int (default 50)}` |
| **Output Schema** | `{today: str, lookback_days: int, total_found: int, tickets: Array<{ticket_id, customer_name, subject, message, channel, request_type, urgency, owner?, status, human_notes?, closed_at}>}` |
| **Validation Rules** | lookback_days must be >= 1; max_tickets capped at 200 |
| **Referenced Tables** | tickets |
| **Read Ops** | tickets (record.read, table.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | `tickets.resolved.collected` |
| **Consumed Events** | Daily satisfaction monitoring schedule |
| **Called By** | satisfaction-monitor_v2, nightly schedule |
| **Calls To** | resqai-discord connector (support-reviews channel) |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | satisfaction-monitor_v2 |
| **Auth Requirements** | Authenticated user or scheduled task |
| **Authorization Requirements** | tickets (read), resqai-discord (connector.use) |
| **Error Handling** | Discord notification failure silently swallowed |
| **Retry Policy** | 1 retry: 2s |
| **Timeout Policy** | 10s |
| **Idempotency Strategy** | Naturally idempotent (read-only with idempotent Discord message) |
| **Audit Requirements** | None (read-only) |
| **Logging Requirements** | Discord notification is the log |
| **Performance Requirements** | <2s for 200 tickets |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with configurable channels and customer satisfaction scoring |

---
### 3.10 validate-ticket-input

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / VALIDATOR |
| **Purpose** | Validates ticket creation input against schema rules before persisting |
| **Business Domain** | Support / Ticket |
| **Owner Application** | support-center (v2) |
| **Input Schema** | `{subject: string, message: string, customer_id: string, channel: string, request_type: string, urgency?: string, attachments?: string[]}` |
| **Output Schema** | `{valid: bool, errors: Array<{field, message}>, sanitized_input?: object}` |
| **Validation Rules** | subject required (3-500 chars); message required; customer_id must reference valid customer; channel must be valid enum; request_type required |
| **Referenced Tables** | customers |
| **Read Ops** | customers (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | create-ticket (called before write) |
| **Called By** | create-ticket_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | ticket-intake_v2 |
| **Auth Requirements** | Authenticated user or agent |
| **Authorization Requirements** | customers (read) |
| **Error Handling** | Returns structured error list; does not throw |
| **Retry Policy** | None |
| **Timeout Policy** | 2s |
| **Idempotency Strategy** | Naturally idempotent (pure validation) |
| **Audit Requirements** | None |
| **Logging Requirements** | Validation failures logged to operations_log |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V2 planned — new function in V2 catalog |

---
### 3.11 classify-ticket-sla-tier

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / CLASSIFIER |
| **Purpose** | Classify a ticket into an SLA tier based on request type, urgency, and customer tier |
| **Business Domain** | Support / Ticket |
| **Owner Application** | support-center (v2) |
| **Input Schema** | `{ticket_id: string, request_type: string, urgency: string, customer_tier: string, channel: string}` |
| **Output Schema** | `{ticket_id: string, sla_tier: "critical"|"premium"|"standard"|"basic", sla_deadline: datetime, escalation_path: string}` |
| **Validation Rules** | urgency and customer_tier must be valid enums; request_type must be recognized |
| **Referenced Tables** | sla_policies, customers |
| **Read Ops** | sla_policies (record.read), customers (record.read) |
| **Write Ops** | tickets_v2 (record.write — sla fields) |
| **Update Ops** | tickets_v2 (sla_tier, sla_deadline) |
| **Published Events** | `ticket.sla.classified` |
| **Consumed Events** | Ticket created/updated |
| **Called By** | ticket-intake_v2 workflow |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | ticket-intake_v2 |
| **Auth Requirements** | Authenticated user or workflow |
| **Authorization Requirements** | sla_policies (read), customers (read), tickets_v2 (write) |
| **Error Handling** | Unrecognized request_type defaults to standard tier |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `ticket_id` (idempotent on reclassification) |
| **Audit Requirements** | operations_log: action="ticket.sla.classified" |
| **Logging Requirements** | SLA classification logged to operations_log |
| **Performance Requirements** | <300ms |
| **Caching Policy** | sla_policies cached 1h, customers cached 5m |
| **Version Strategy** | V2 planned — new function for SLA enforcement |

---
### 3.12 check-sla-deadline

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / READER |
| **Purpose** | Check if a ticket is approaching or past its SLA deadline and return the remaining time and breach status |
| **Business Domain** | Support / Ticket |
| **Owner Application** | sla-monitor (v2) |
| **Input Schema** | `{ticket_id: string}` |
| **Output Schema** | `{ticket_id: string, sla_deadline: datetime, remaining_seconds: int, is_breached: bool, breach_at?: datetime, status: "ok"|"warning"|"breached"}` |
| **Validation Rules** | Ticket must exist and have sla_deadline set |
| **Referenced Tables** | tickets_v2 |
| **Read Ops** | tickets_v2 (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | `ticket.sla.warning` (if approaching), `ticket.sla.breached` (if breached) |
| **Consumed Events** | SLA monitor polling |
| **Called By** | sla-monitor_v2, escalated-ticket workflow |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | sla-monitor_v2 |
| **Auth Requirements** | Authenticated user or scheduled task |
| **Authorization Requirements** | tickets_v2 (read) |
| **Error Handling** | Missing sla_deadline → returns status="no_sla" |
| **Retry Policy** | None |
| **Timeout Policy** | 2s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | Breach events logged to operations_log |
| **Logging Requirements** | Warning and breach events logged |
| **Performance Requirements** | <100ms |
| **Caching Policy** | tickets_v2 cached 30s for polling efficiency |
| **Version Strategy** | V2 planned — part of SLA enforcement system |

---
### 3.13 batch-sla-check

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / BATCH |
| **Purpose** | Batch check SLA deadlines for multiple tickets in a single call, used by the SLA monitor scheduler |
| **Business Domain** | Support / Ticket |
| **Owner Application** | sla-monitor (v2) |
| **Input Schema** | `{ticket_ids: string[], check_warning_threshold: int (seconds before deadline)}` |
| **Output Schema** | `{results: Array<{ticket_id, status, remaining_seconds, is_breached}>, summary: {total: int, breached: int, warning: int, ok: int}}` |
| **Validation Rules** | Max 100 ticket_ids per batch; each ticket_id must be valid UUID |
| **Referenced Tables** | tickets_v2 |
| **Read Ops** | tickets_v2 (record.read, table.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | `ticket.sla.batch-checked` |
| **Consumed Events** | SLA monitor scheduled tick |
| **Called By** | sla-monitor_v2 scheduler |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | sla-monitor_v2 |
| **Auth Requirements** | Scheduled task or authenticated user |
| **Authorization Requirements** | tickets_v2 (read) |
| **Error Handling** | Failed individual lookups return partial results |
| **Retry Policy** | 1 retry on partial failure: 2s |
| **Timeout Policy** | 10s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | Batch summary logged |
| **Performance Requirements** | <1s for 100 tickets |
| **Caching Policy** | None (fresh reads) |
| **Version Strategy** | V2 planned — batch optimization for SLA monitoring |

## 4. Appointment Domain Functions

### 4.1 create-appointment

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed + v2 planned` |
| **Type** | API / WRITER |
| **Purpose** | Create a new appointment record with customer, technician, time slot, and status fields |
| **Business Domain** | Appointment |
| **Owner Application** | appointment-scheduler (v2) |
| **Input Schema** | `{customer_id: string, technician_id: string, scheduled_date: datetime, duration_minutes: int, service_type: string, notes?: string, location?: string, created_by: string}` |
| **Output Schema** | `{status: "success"|"error", appointment_id?: string, error?: string}` |
| **Validation Rules** | customer_id and technician_id must exist; scheduled_date must be in the future; duration_minutes must be > 0; no double-booking for same technician at same time |
| **Referenced Tables** | appointment_v2, customers, technician_v2, operations_log |
| **Read Ops** | customers (record.read), technician_v2 (record.read), appointment_v2 (record.read — conflict check) |
| **Write Ops** | appointment_v2 (record.create), operations_log (record.create) |
| **Update Ops** | None |
| **Published Events** | `appointment.created` |
| **Consumed Events** | Schedule appointment UI |
| **Called By** | appointment-scheduler_v2, support-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | appointment-intake_v2 |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | customers (read), technician_v2 (read), appointment_v2 (read/write), operations_log (write) |
| **Error Handling** | Double-booking conflict → error with conflicting appointment details |
| **Retry Policy** | 1 retry: 1s (only for transient errors) |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `customer_id + technician_id + scheduled_date` (24h TTL) |
| **Audit Requirements** | operations_log: action="appointment.created", actor=created_by |
| **Logging Requirements** | Creation details logged to operations_log |
| **Performance Requirements** | <300ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed (appointments table); V2 planned (appointment_v2 with enhanced fields) |

---
### 4.2 list-appointments

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | List appointments with optional filters by status, technician_id, date range |
| **Business Domain** | Appointment |
| **Owner Application** | appointment-scheduler (v2) |
| **Input Schema** | `{status?: string, technician_id?: string, date_from?: date, date_to?: date, limit?: int, offset?: int}` |
| **Output Schema** | `{total: int, appointments: Array<{appointment_id, customer_id, customer_name, technician_id, technician_name, scheduled_date, duration_minutes, service_type, status, location?, notes?}>}` |
| **Validation Rules** | status must be valid enum; date_from before date_to |
| **Referenced Tables** | appointment_v2, customers, technician_v2 |
| **Read Ops** | appointment_v2 (record.read, table.read), customers (record.read), technician_v2 (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Appointment board UI |
| **Called By** | appointment-scheduler_v2, ops-dashboard_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | appointment_v2 (read), customers (read), technician_v2 (read) |
| **Error Handling** | Invalid filter values return empty result set |
| **Retry Policy** | None |
| **Timeout Policy** | 10s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <500ms |
| **Caching Policy** | Optional 30s cache for dashboard views |
| **Version Strategy** | V1 deployed; V2 with enhanced filtering and aggregation |

---
### 4.3 get-appointment

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Get a single appointment by ID with full detail including customer and technician info |
| **Business Domain** | Appointment |
| **Owner Application** | appointment-scheduler (v2) |
| **Input Schema** | `{appointment_id: string}` |
| **Output Schema** | `{appointment_id, customer_id, customer_name, customer_phone?, technician_id, technician_name, scheduled_date, duration_minutes, service_type, status, location?, notes?, work_summary?, customer_signature?, completed_at?, created_at, updated_at}` |
| **Validation Rules** | appointment_id must be a valid UUID |
| **Referenced Tables** | appointment_v2, customers, technician_v2 |
| **Read Ops** | appointment_v2 (record.read), customers (record.read), technician_v2 (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Appointment detail view UI |
| **Called By** | appointment-scheduler_v2, technician-mobile-app_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | appointment_v2 (read), customers (read), technician_v2 (read) |
| **Error Handling** | Not found → returns null with status "not_found" |
| **Retry Policy** | None |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <100ms |
| **Caching Policy** | Optional 30s cache |
| **Version Strategy** | V1 deployed; V2 with enriched data joins |

---
### 4.4 assign-appointment-technician

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Assign or reassign a technician to an existing appointment |
| **Business Domain** | Appointment |
| **Owner Application** | appointment-scheduler (v2) |
| **Input Schema** | `{appointment_id: string, technician_id: string, assigned_by: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", appointment_id: string, previous_technician_id?: string}` |
| **Validation Rules** | Appointment must exist; technician_id must be active and available; no double-booking conflict |
| **Referenced Tables** | appointment_v2, technician_v2, operations_log |
| **Read Ops** | appointment_v2 (record.read), technician_v2 (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | appointment_v2 (technician_id, updated_at) |
| **Published Events** | `appointment.technician.assigned` |
| **Consumed Events** | Appointment board drag-and-drop, auto-assignment workflow |
| **Called By** | appointment-scheduler_v2, dispatch_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | appointment-assignment_v2 |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | appointment_v2 (read/write), technician_v2 (read), operations_log (write) |
| **Error Handling** | Technician conflict → error with available alternatives |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `appointment_id + technician_id` (1h TTL) |
| **Audit Requirements** | operations_log: action="appointment.technician.assigned" |
| **Logging Requirements** | Previous and new technician logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 with availability checking before assignment |

---
### 4.5 accept-appointment

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Accept an appointment (technician confirms they will perform the job) |
| **Business Domain** | Appointment |
| **Owner Application** | technician-mobile-app (v2) |
| **Input Schema** | `{appointment_id: string, technician_id: string, notes?: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", appointment_id: string}` |
| **Validation Rules** | Appointment must exist and be in "scheduled" status; technician_id must match assigned technician |
| **Referenced Tables** | appointment_v2, operations_log |
| **Read Ops** | appointment_v2 (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | appointment_v2 (status → "accepted", updated_at) |
| **Published Events** | `appointment.accepted` |
| **Consumed Events** | Technician mobile app accept button |
| **Called By** | technician-mobile-app_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | appointment-lifecycle_v2 |
| **Auth Requirements** | Authenticated technician |
| **Authorization Requirements** | appointment_v2 (read/write), operations_log (write) |
| **Error Handling** | Wrong technician → error; already accepted → idempotent success |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `appointment_id + "accept"` (idempotent — re-run returns same result) |
| **Audit Requirements** | operations_log: action="appointment.accepted", actor=technician_id |
| **Logging Requirements** | Acceptance logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 with notification to customer |

---
### 4.6 complete-appointment

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Mark an appointment as completed with work summary, customer signature, and optional parts usage tracking |
| **Business Domain** | Appointment |
| **Owner Application** | technician-mobile-app (v2) |
| **Input Schema** | `{appointment_id: string, completed_by: string, work_summary?: string, customer_signature?: string, parts_used?: Array<{part_name, quantity, part_number}>}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", appointment_id: string, error?: string}` |
| **Validation Rules** | Appointment must exist and not already completed; parts_used items require part_name and quantity > 0 |
| **Referenced Tables** | appointment_v2, inventory_transactions, operations_log |
| **Read Ops** | appointment_v2 (record.read) |
| **Write Ops** | inventory_transactions (record.create for each part), operations_log (record.create) |
| **Update Ops** | appointment_v2 (status, completed_at, work_summary, customer_signature) |
| **Published Events** | `appointment.completed` |
| **Consumed Events** | Technician mobile app complete button |
| **Called By** | technician-mobile-app_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | appointment-lifecycle_v2, inventory-reconciliation_v2 |
| **Auth Requirements** | Authenticated technician |
| **Authorization Requirements** | appointment_v2 (read/write), inventory_transactions (read/write), operations_log (write) |
| **Error Handling** | Already completed → error; inventory write failures → logged but completion proceeds |
| **Retry Policy** | 1 retry: 2s (on inventory write failure) |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `appointment_id + "complete"` (skip if already completed) |
| **Audit Requirements** | operations_log: action="appointment_completed", includes parts summary |
| **Logging Requirements** | Parts used, work summary, and completion time logged |
| **Performance Requirements** | <500ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed (appointments + inventory_transactions); V2 planned with photo attachments |

---
### 4.7 cancel-appointment

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Cancel an appointment with a reason, releasing the technician's slot |
| **Business Domain** | Appointment |
| **Owner Application** | appointment-scheduler (v2) |
| **Input Schema** | `{appointment_id: string, cancelled_by: string, cancellation_reason: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", appointment_id: string}` |
| **Validation Rules** | Appointment must exist and not already cancelled/completed; cancellation_reason required |
| **Referenced Tables** | appointment_v2, operations_log |
| **Read Ops** | appointment_v2 (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | appointment_v2 (status → "cancelled", cancellation_reason, updated_at) |
| **Published Events** | `appointment.cancelled` |
| **Consumed Events** | Cancel button in scheduler UI |
| **Called By** | appointment-scheduler_v2, support-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | appointment-lifecycle_v2 |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | appointment_v2 (read/write), operations_log (write) |
| **Error Handling** | Already completed → error (cannot cancel completed) |
| **Retry Policy** | None |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `appointment_id + "cancel"` (idempotent — re-cancel returns success) |
| **Audit Requirements** | operations_log: action="appointment.cancelled", reason=cancellation_reason |
| **Logging Requirements** | Cancellation reason and actor logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 with customer notification and rescheduling flow |

---
### 4.8 fetch-upcoming-appointments

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Fetch appointments scheduled for the upcoming period (today/tomorrow/this week) for a given technician or all technicians |
| **Business Domain** | Appointment |
| **Owner Application** | technician-mobile-app (v2) |
| **Input Schema** | `{technician_id?: string, days_ahead: int (default 7), include_statuses: string[] (default ["scheduled","accepted"])}` |
| **Output Schema** | `{appointments: Array<{appointment_id, customer_name, customer_phone?, customer_address?, scheduled_date, service_type, duration_minutes, status, location?, notes?}>}` |
| **Validation Rules** | days_ahead must be 1-30; technician_id must be valid if provided |
| **Referenced Tables** | appointment_v2, customers, technician_v2 |
| **Read Ops** | appointment_v2 (record.read, table.read), customers (record.read), technician_v2 (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Technician mobile app dashboard, reminder scheduler |
| **Called By** | technician-mobile-app_v2, reminder-scheduler_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | appointment-reminder_v2 |
| **Auth Requirements** | Authenticated technician or scheduler |
| **Authorization Requirements** | appointment_v2 (read), customers (read), technician_v2 (read) |
| **Error Handling** | Invalid technician_id returns empty list |
| **Retry Policy** | None |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <300ms |
| **Caching Policy** | Optional 60s cache |
| **Version Strategy** | V1 deployed; V2 with routing optimization data |

---
### 4.9 schedule-appointment-reminders

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / SCHEDULER |
| **Purpose** | Schedule reminder notifications for upcoming appointments based on configurable lead times |
| **Business Domain** | Appointment |
| **Owner Application** | notification-service (v2) |
| **Input Schema** | `{reminder_lead_times: Array<{hours_before: int, channel: string}>, batch_size?: int}` |
| **Output Schema** | `{scheduled_count: int, errors: Array<{appointment_id, error}>, summary: object}` |
| **Validation Rules** | hours_before must be positive; channel must be valid notification channel |
| **Referenced Tables** | appointment_v2, reminders, notification_queue |
| **Read Ops** | appointment_v2 (record.read, table.read — filter upcoming) |
| **Write Ops** | reminders (record.create), notification_queue (record.create) |
| **Update Ops** | None |
| **Published Events** | `appointment.reminder.scheduled` |
| **Consumed Events** | Daily scheduler cron |
| **Called By** | scheduler-cron_v2 |
| **Calls To** | dispatch-notifications_v2 |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | appointment-reminder_v2 |
| **Auth Requirements** | Scheduled task |
| **Authorization Requirements** | appointment_v2 (read), reminders (write), notification_queue (write) |
| **Error Handling** | Individual appointment failures logged but batch continues |
| **Retry Policy** | 2 retries: linear 2s, 5s |
| **Timeout Policy** | 30s for batch |
| **Idempotency Strategy** | `appointment_id + reminder_time` (skip if already scheduled) |
| **Audit Requirements** | operations_log: action="reminders.scheduled" |
| **Logging Requirements** | Summary of scheduled reminders logged |
| **Performance Requirements** | <5s for 100 appointments |
| **Caching Policy** | None |
| **Version Strategy** | V2 planned — new function for proactive notifications |

---
### 4.10 check-reminder-window

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / READER |
| **Purpose** | Check if any appointments fall within the reminder window and need notification dispatch |
| **Business Domain** | Appointment |
| **Owner Application** | notification-service (v2) |
| **Input Schema** | `{window_minutes: int}` |
| **Output Schema** | `{appointments_due: Array<{appointment_id, customer, technician, scheduled_date, channel}>, count: int}` |
| **Validation Rules** | window_minutes must be 1-1440 |
| **Referenced Tables** | appointment_v2, reminders |
| **Read Ops** | appointment_v2 (record.read, table.read), reminders (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Reminder scheduler polling |
| **Called By** | reminder-poller_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | appointment-reminder_v2 |
| **Auth Requirements** | Scheduled task |
| **Authorization Requirements** | appointment_v2 (read), reminders (read) |
| **Error Handling** | None (returns empty list on error) |
| **Retry Policy** | None |
| **Timeout Policy** | 10s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <2s |
| **Caching Policy** | None |
| **Version Strategy** | V2 planned — polling optimization for reminder dispatch |

## 5. Technician Domain Functions

### 5.1 create-technician

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Create a new technician record with status 'active' and availability 'available' |
| **Business Domain** | Technician |
| **Owner Application** | admin-console (v2) |
| **Input Schema** | `{name: string, primary_phone?: string, primary_email?: string, timezone?: string, certification?: string[], max_daily_jobs?: int, notes?: string, created_by: string}` |
| **Output Schema** | `{status: "success"|"error", technician_id?: string, error?: string}` |
| **Validation Rules** | name is required and non-empty; primary_email must be valid email if provided; max_daily_jobs must be > 0 |
| **Referenced Tables** | technician_v2, operations_log |
| **Read Ops** | None |
| **Write Ops** | technician_v2 (record.create), operations_log (record.create) |
| **Update Ops** | None |
| **Published Events** | `technician.created` |
| **Consumed Events** | Admin console create technician form |
| **Called By** | admin-console_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated admin user |
| **Authorization Requirements** | technician_v2 (write), operations_log (write) |
| **Error Handling** | Missing name → validation error; duplicate email → conflict error |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `email + name` (24h TTL) |
| **Audit Requirements** | operations_log: action="technician_created", includes technician_id and name |
| **Logging Requirements** | Creation details logged to operations_log |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with onboarding workflow |

---
### 5.2 update-technician

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Update technician profile fields including contact info, certifications, and status |
| **Business Domain** | Technician |
| **Owner Application** | admin-console (v2) |
| **Input Schema** | `{technician_id: string, name?: string, primary_phone?: string, primary_email?: string, timezone?: string, certification?: string[], max_daily_jobs?: int, status?: string, availability?: string, notes?: string, updated_by: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", technician_id: string}` |
| **Validation Rules** | technician_id must exist; status must be valid enum (active, inactive, suspended); availability must be valid |
| **Referenced Tables** | technician_v2, operations_log |
| **Read Ops** | technician_v2 (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | technician_v2 (record.write — any provided fields) |
| **Published Events** | `technician.updated` |
| **Consumed Events** | Admin console edit technician form |
| **Called By** | admin-console_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated admin user |
| **Authorization Requirements** | technician_v2 (read/write), operations_log (write) |
| **Error Handling** | Not found → not_found; invalid status → validation error |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `technician_id + hash(fields)` (1h TTL) |
| **Audit Requirements** | operations_log: action="technician.updated", includes changed fields |
| **Logging Requirements** | Field changes logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with field-level audit |

---
### 5.3 update-technician-skills

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Update technician skills and certifications, replacing the existing skill set |
| **Business Domain** | Technician |
| **Owner Application** | admin-console (v2) |
| **Input Schema** | `{technician_id: string, skills: string[], certifications?: string[], updated_by: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", technician_id: string, skills_count: int}` |
| **Validation Rules** | technician_id must exist; skills array must have at least one skill; max 50 skills |
| **Referenced Tables** | technician_v2, operations_log |
| **Read Ops** | technician_v2 (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | technician_v2 (skills, certifications) |
| **Published Events** | `technician.skills.updated` |
| **Consumed Events** | Admin console skills editor |
| **Called By** | admin-console_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated admin user |
| **Authorization Requirements** | technician_v2 (read/write), operations_log (write) |
| **Error Handling** | Not found → not_found |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `technician_id + hash(skills)` (1h TTL) |
| **Audit Requirements** | operations_log: action="technician.skills.updated" |
| **Logging Requirements** | Skill set changes logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with skill gap analysis |

---
### 5.4 list-technicians

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | List technicians with optional filtering by status, availability, and skill |
| **Business Domain** | Technician |
| **Owner Application** | admin-console (v2) |
| **Input Schema** | `{status?: string, availability?: string, skill?: string, limit?: int, offset?: int}` |
| **Output Schema** | `{total: int, technicians: Array<{technician_id, name, primary_phone?, primary_email?, timezone?, status, availability, skills: string[], certifications?: string[], max_daily_jobs, current_jobs_count?, notes?}>}` |
| **Validation Rules** | status and availability must be valid enums; limit capped at 100 |
| **Referenced Tables** | technician_v2 |
| **Read Ops** | technician_v2 (record.read, table.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Admin console technician list, dispatch UI |
| **Called By** | admin-console_v2, dispatch_v2, appointment-scheduler_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | operations-coordinator (for skill-based filtering) |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | technician_v2 (read) |
| **Error Handling** | None (returns empty list for invalid filters) |
| **Retry Policy** | None |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <300ms |
| **Caching Policy** | Optional 60s cache |
| **Version Strategy** | V1 deployed; V2 planned with availability calendar |

## 6. CRM Domain Functions

### 6.1 create-customer

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Create a new customer record with contact information and metadata |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{name: string, phone?: string, email?: string, address?: string, company?: string, notes?: string, created_by: string}` |
| **Output Schema** | `{status: "success"|"error", customer_id?: string, error?: string}` |
| **Validation Rules** | name is required; email must be valid format if provided; phone must be valid format if provided |
| **Referenced Tables** | customers, operations_log |
| **Read Ops** | None |
| **Write Ops** | customers (record.create), operations_log (record.create) |
| **Update Ops** | None |
| **Published Events** | `customer.created` |
| **Consumed Events** | CRM create customer form |
| **Called By** | crm_v2, support-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | customers (write), operations_log (write) |
| **Error Handling** | Duplicate email → conflict error |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `email + name` (24h TTL) |
| **Audit Requirements** | operations_log: action="customer.created" |
| **Logging Requirements** | Customer creation logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with duplicate detection |

---
### 6.2 update-customer

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Update customer contact information and metadata fields |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{customer_id: string, name?: string, phone?: string, email?: string, address?: string, company?: string, notes?: string, updated_by: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", customer_id: string}` |
| **Validation Rules** | customer_id must exist; email must be valid format if provided |
| **Referenced Tables** | customers, operations_log |
| **Read Ops** | customers (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | customers (record.write — any provided fields) |
| **Published Events** | `customer.updated` |
| **Consumed Events** | CRM edit customer form |
| **Called By** | crm_v2, support-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | customers (read/write), operations_log (write) |
| **Error Handling** | Not found → not_found |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `customer_id + hash(fields)` (1h TTL) |
| **Audit Requirements** | operations_log: action="customer.updated" |
| **Logging Requirements** | Changed fields logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with field-level audit trail |

---
### 6.3 get-customer

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Get a single customer record by ID with full detail including account and relationship info |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{customer_id: string}` |
| **Output Schema** | `{customer_id, name, phone?, email?, address?, company?, notes?, account_id?, relationship_status?, health_score?, health?, created_at, updated_at}` |
| **Validation Rules** | customer_id must be valid UUID |
| **Referenced Tables** | customers, accounts |
| **Read Ops** | customers (record.read), accounts (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | CRM customer detail view |
| **Called By** | crm_v2, support-center_v2, agent: account-health-monitor |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | customers (read), accounts (read) |
| **Error Handling** | Not found → returns null with status "not_found" |
| **Retry Policy** | None |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <100ms |
| **Caching Policy** | Optional 30s cache |
| **Version Strategy** | V1 deployed; V2 planned with enriched relationship data |

---
### 6.4 search-customers

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Search customers by name, phone, email, or company with paginated results |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{query: string, limit?: int (default 20), offset?: int (default 0)}` |
| **Output Schema** | `{total: int, results: Array<{customer_id, name, phone?, email?, company?, relationship_status?}>}` |
| **Validation Rules** | query must be at least 2 characters; limit capped at 100 |
| **Referenced Tables** | customers, accounts |
| **Read Ops** | customers (record.read, table.read), accounts (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | CRM search bar, ticket creation customer lookup |
| **Called By** | crm_v2, support-center_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | customers (read), accounts (read) |
| **Error Handling** | No results → empty result array |
| **Retry Policy** | None |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <300ms |
| **Caching Policy** | Optional 60s cache for frequent searches |
| **Version Strategy** | V1 deployed; V2 planned with full-text search and fuzzy matching |

---
### 6.5 create-followup

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Create a follow-up record for a customer account with due date, priority, and type |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{account_id: string, subject: string, type: string, priority: string, due_date: date, assigned_to?: string, notes?: string, related_appointment_id?: string, related_ticket_id?: string, created_by: string}` |
| **Output Schema** | `{status: "success"|"error", followup_id?: string, error?: string}` |
| **Validation Rules** | account_id must exist; subject required; type must be valid enum; priority must be valid; due_date must be today or future |
| **Referenced Tables** | followups, accounts, operations_log |
| **Read Ops** | accounts (record.read) |
| **Write Ops** | followups (record.create), operations_log (record.create) |
| **Update Ops** | None |
| **Published Events** | `followup.created` |
| **Consumed Events** | CRM follow-up creation form |
| **Called By** | crm_v2, agent: account-health-monitor |
| **Calls To** | None |
| **AI Agent Dependencies** | account-health-monitor (auto-creates followups from health scan) |
| **Workflow Dependencies** | followup-lifecycle_v2 |
| **Auth Requirements** | Authenticated user or agent |
| **Authorization Requirements** | accounts (read), followups (write), operations_log (write) |
| **Error Handling** | Past due_date → warning but still creates |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `account_id + subject + due_date` (24h TTL) |
| **Audit Requirements** | operations_log: action="followup.created" |
| **Logging Requirements** | Follow-up details logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with smart due-date suggestions |

---
### 6.6 complete-followup

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Mark a follow-up as completed with resolution notes |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{followup_id: string, completed_by: string, resolution_notes?: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", followup_id: string}` |
| **Validation Rules** | followup_id must exist and not already completed |
| **Referenced Tables** | followups, operations_log |
| **Read Ops** | followups (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | followups (status → "completed", completed_at, resolution_notes) |
| **Published Events** | `followup.completed` |
| **Consumed Events** | CRM follow-up completion UI |
| **Called By** | crm_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | followup-lifecycle_v2 |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | followups (read/write), operations_log (write) |
| **Error Handling** | Already completed → idempotent success |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `followup_id + "complete"` (skip if already completed) |
| **Audit Requirements** | operations_log: action="followup.completed", actor=completed_by |
| **Logging Requirements** | Resolution notes logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with satisfaction survey trigger |

---
### 6.7 list-followups

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | List follow-ups with filtering by account, status, priority, and due date range |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{account_id?: string, status?: string, priority?: string, due_from?: date, due_to?: date, limit?: int, offset?: int}` |
| **Output Schema** | `{total: int, followups: Array<{followup_id, account_id, subject, type, priority, status, due_date, assigned_to?, completed_at?, resolution_notes?, notes?}>}` |
| **Validation Rules** | status, priority must be valid enums; due_from before due_to |
| **Referenced Tables** | followups |
| **Read Ops** | followups (record.read, table.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | CRM follow-up list view |
| **Called By** | crm_v2, agent: account-health-monitor |
| **Calls To** | None |
| **AI Agent Dependencies** | account-health-monitor (reads followups for health scoring) |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | followups (read) |
| **Error Handling** | None (returns empty list) |
| **Retry Policy** | None |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <300ms |
| **Caching Policy** | Optional 30s cache |
| **Version Strategy** | V1 deployed; V2 planned with aggregation and trend data |

---
### 6.8 account-health-scan

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed + v2 planned` |
| **Type** | API / ANALYZER |
| **Purpose** | Deterministic per-account health scan. Combines recency, slip risk, dispute load, and journey depth into a 0..1 score + bucket. Optionally writes back to accounts table. |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{today?: date, lookback_days: int (default 120), write_back: bool (default true), top_n_riskiest: int (default 10), relationship_overrides?: dict<string,string>}` |
| **Output Schema** | `{today: str, scan_params: dict, totals: {scanned: int, wrote_back: int, signpost_totals: dict}, by_health: {healthy: int, watch: int, slipping: int, critical: int}, top_risk: Array<AccountHealthRow>, all_rows: Array<AccountHealthRow>}` |
| **Validation Rules** | lookback_days >= 1; top_n_riskiest >= 1; relationship_overrides must be valid status values |
| **Referenced Tables** | customers, accounts, appointments, disputes, followups |
| **Read Ops** | customers (record.read, table.read), accounts (record.read, table.read), appointments (record.read, table.read), disputes (record.read, table.read), followups (record.read, table.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | accounts (health, health_score, open_followups, overdue_followups, open_disputes — when write_back=true) |
| **Published Events** | `account.health.scanned` |
| **Consumed Events** | Nightly schedule, CRM health scan panel |
| **Called By** | agent: account-health-monitor, scheduled task |
| **Calls To** | None |
| **AI Agent Dependencies** | account-health-monitor (calls this function) |
| **Workflow Dependencies** | account-health_v2 |
| **Auth Requirements** | Authenticated user, agent, or scheduled task |
| **Authorization Requirements** | customers (read), accounts (read/write), appointments (read), disputes (read), followups (read), operations_log (write) |
| **Error Handling** | Missing relationships → skips gracefully; invalid account IDs → logged and skipped |
| **Retry Policy** | 2 retries: linear 2s, 5s |
| **Timeout Policy** | 30s for batch scan |
| **Idempotency Strategy** | `today + hash(relationship_overrides)` — re-running with same params produces same scores |
| **Audit Requirements** | operations_log: action="account_health.scanned", includes scan_params and totals |
| **Logging Requirements** | Scan summary written to operations_log |
| **Performance Requirements** | <5s for 100 accounts |
| **Caching Policy** | None (fresh read every scan) |
| **Version Strategy** | V1 deployed (deterministic scoring engine); V2 planned with trend tracking |

---
### 6.9 update-account-health

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Update account health fields (health score, health status, risk signals) for a single account |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{account_id: string, health_score?: float, health?: "healthy"|"watch"|"slipping"|"critical", risk_signals?: string[], updated_by: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", account_id: string}` |
| **Validation Rules** | account_id must exist; health_score must be 0.0-1.0; health must be valid enum |
| **Referenced Tables** | accounts, operations_log |
| **Read Ops** | accounts (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | accounts (record.write — health fields) |
| **Published Events** | `account.health.updated` |
| **Consumed Events** | Health scan write-back, manual CRM edit |
| **Called By** | account-health-scan (write_back), crm_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | account-health-monitor |
| **Workflow Dependencies** | account-health_v2 |
| **Auth Requirements** | Authenticated user or agent |
| **Authorization Requirements** | accounts (read/write), operations_log (write) |
| **Error Handling** | Not found → not_found |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `account_id + health_score` (idempotent — rewriting same score is no-op) |
| **Audit Requirements** | operations_log: action="account.health.updated" |
| **Logging Requirements** | Health score and status changes logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with trend history |

---
### 6.10 update-account-health-status

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Update only the health status bucket for an account (lightweight status change without full scan) |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{account_id: string, health: "healthy"|"watch"|"slipping"|"critical", updated_by: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", account_id: string}` |
| **Validation Rules** | account_id must exist; health must be valid enum |
| **Referenced Tables** | accounts, operations_log |
| **Read Ops** | accounts (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | accounts (health status field) |
| **Published Events** | `account.health.status.updated` |
| **Consumed Events** | Manual override in CRM health panel |
| **Called By** | crm_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | accounts (read/write), operations_log (write) |
| **Error Handling** | Not found → not_found |
| **Retry Policy** | None |
| **Timeout Policy** | 2s |
| **Idempotency Strategy** | `account_id + health` (same status is no-op) |
| **Audit Requirements** | operations_log: action="account.health.status.updated" |
| **Logging Requirements** | Status change logged |
| **Performance Requirements** | <100ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with notification on status change |

---
### 6.11 flag-slipping-followups

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed + v2 planned` |
| **Type** | API / ANALYZER |
| **Purpose** | Deterministic scan that finds overdue/at-risk followups and ranks them by slip severity. No LLM, no side effects unless explicitly requested. |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{today?: date, days_ahead: int (default 7), include_statuses: string[] (default ["pending","in_progress"]), top_n: int (default 20)}` |
| **Output Schema** | `{today: str, window: {days_ahead, include_statuses}, counts: {overdue, due_today, due_soon, total}, top: Array<SlippingFollowup>}` |
| **Validation Rules** | days_ahead >= 1; top_n >= 1; include_statuses must be valid followup statuses |
| **Referenced Tables** | followups, accounts, customers |
| **Read Ops** | followups (record.read, table.read), accounts (record.read, table.read), customers (record.read, table.read) |
| **Write Ops** | None (read-only by design) |
| **Update Ops** | None |
| **Published Events** | `followup.slippage.flagged` |
| **Consumed Events** | Nightly health schedule, CRM "Check Slippage" button |
| **Called By** | agent: account-health-monitor, crm_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | account-health-monitor (calls this function as part of health analysis) |
| **Workflow Dependencies** | followup-slippage_v2 |
| **Auth Requirements** | Authenticated user, agent, or scheduled task |
| **Authorization Requirements** | followups (read), accounts (read), customers (read) |
| **Error Handling** | Missing account/customer references → followup still returned with null fields |
| **Retry Policy** | None |
| **Timeout Policy** | 10s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None (read-only) |
| **Logging Requirements** | None |
| **Performance Requirements** | <2s for 500 followups |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed (standalone deterministic scan); V2 planned with trend comparison |

---
### 6.12 create-followup-tasks

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Create followup remediation tasks from recommendations generated by health/analysis agents |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{recommendations: Array<{account_id, title, description?, priority, assigned_to?, due_date?}>, created_by: string}` |
| **Output Schema** | `{status: "success"|"partial"|"error", tasks_created: int, task_ids: string[], errors?: Array<{index, error}>}` |
| **Validation Rules** | At least one recommendation required; each must have account_id and title; priority must be valid |
| **Referenced Tables** | tasks, operations_log |
| **Read Ops** | None |
| **Write Ops** | tasks (record.create), operations_log (record.create) |
| **Update Ops** | None |
| **Published Events** | `followup.tasks.created` |
| **Consumed Events** | Account health monitor output |
| **Called By** | agent: account-health-monitor |
| **Calls To** | None |
| **AI Agent Dependencies** | account-health-monitor (generates recommendations) |
| **Workflow Dependencies** | followup-slippage_v2 |
| **Auth Requirements** | Authenticated agent or user |
| **Authorization Requirements** | tasks (create), operations_log (create) |
| **Error Handling** | Partial failure — some tasks created, others returned as errors |
| **Retry Policy** | 1 retry: 2s (on individual failures) |
| **Timeout Policy** | 10s |
| **Idempotency Strategy** | `hash(recommendations)` — skip if identical batch already created (1h window) |
| **Audit Requirements** | operations_log: action="followup.tasks.created" |
| **Logging Requirements** | Task creation summary logged |
| **Performance Requirements** | <500ms for 20 tasks |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with task assignment routing |

---
### 6.13 finalize-slippage-review

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Log the result of a followup-slippage review cycle. Writes audit entry and optionally notifies Discord. |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{review_id: string, reviewed_by: string, decisions: Array<{followup_id, action: "dismiss"|"reassign"|"escalate"|"complete", notes?: string}>, notify_discord?: bool}` |
| **Output Schema** | `{status: "success"|"error", review_id: string, actions_taken: int, discord_notified: bool}` |
| **Validation Rules** | At least one decision required; followup_id must exist; action must be valid enum |
| **Referenced Tables** | operations_log |
| **Read Ops** | None |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | None |
| **Published Events** | `followup.slippage.reviewed` |
| **Consumed Events** | CRM slippage review panel |
| **Called By** | crm_v2 |
| **Calls To** | resqai-discord connector (when notify_discord=true) |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | followup-slippage_v2 |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | operations_log (write), resqai-discord (connector.use) |
| **Error Handling** | Discord notification failure → logged but review proceeds |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `review_id` (skip if already logged) |
| **Audit Requirements** | operations_log: action="slippage.review.finalized", includes decisions |
| **Logging Requirements** | All review decisions logged |
| **Performance Requirements** | <300ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with automated action execution |

---
### 6.14 generate-account-score

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / ANALYZER |
| **Purpose** | Generate a composite account health score from weighted factors including engagement recency, followup compliance, dispute history, and service depth |
| **Business Domain** | CRM |
| **Owner Application** | crm (v2) |
| **Input Schema** | `{account_id: string, weights?: {recency_weight?: float, followup_weight?: float, dispute_weight?: float, depth_weight?: float}}` |
| **Output Schema** | `{account_id: string, score: float, bucket: "healthy"|"watch"|"slipping"|"critical", factors: {recency_score, followup_score, dispute_score, depth_score}, details: object}` |
| **Validation Rules** | account_id must exist; weights must sum to ~1.0 if provided |
| **Referenced Tables** | accounts, customers, followups, disputes, appointments |
| **Read Ops** | accounts (record.read), customers (record.read), followups (record.read), disputes (record.read), appointments (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | `account.score.generated` |
| **Consumed Events** | CRM health panel, nightly scheduler |
| **Called By** | crm_v2, scheduled task |
| **Calls To** | None |
| **AI Agent Dependencies** | account-health-monitor |
| **Workflow Dependencies** | account-health_v2 |
| **Auth Requirements** | Authenticated user or agent |
| **Authorization Requirements** | accounts (read), customers (read), followups (read), disputes (read), appointments (read) |
| **Error Handling** | Insufficient data → score with warning flags |
| **Retry Policy** | None |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `account_id + date` — same inputs produce same score |
| **Audit Requirements** | operations_log: action="account.score.generated" |
| **Logging Requirements** | Score factors logged |
| **Performance Requirements** | <500ms |
| **Caching Policy** | Score cached 1h per account |
| **Version Strategy** | V2 planned — new function for weighted composite scoring |

## 7. Operations Domain Functions

### 7.1 create-operations-tasks

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Create daily operations tasks from the operations-coordinator agent's recommendations. Writes task records and logs the operation. |
| **Business Domain** | Operations |
| **Owner Application** | ops-dashboard (v2) |
| **Input Schema** | `{recommendations: Array<{title: string, description?: string, priority: string, assigned_to?: string, due_date?: date, source: string}>, created_by: string}` |
| **Output Schema** | `{status: "success"|"partial"|"error", tasks_created: int, task_ids: string[], errors?: Array<{index, error}>}` |
| **Validation Rules** | At least one recommendation required; each requires title and priority; priority must be valid enum |
| **Referenced Tables** | tasks, operations_log |
| **Read Ops** | None |
| **Write Ops** | tasks (record.create), operations_log (record.create) |
| **Update Ops** | None |
| **Published Events** | `operations.tasks.created` |
| **Consumed Events** | Operations coordinator agent output |
| **Called By** | agent: operations-coordinator, ops-dashboard_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | operations-coordinator (generates recommendations) |
| **Workflow Dependencies** | daily-standup_v2 |
| **Auth Requirements** | Authenticated agent or user |
| **Authorization Requirements** | tasks (create), operations_log (create) |
| **Error Handling** | Partial failure — some tasks created, errors returned per index |
| **Retry Policy** | 1 retry: 2s |
| **Timeout Policy** | 10s |
| **Idempotency Strategy** | `hash(recommendations)` (1h TTL) |
| **Audit Requirements** | operations_log: action="operations.tasks.created" |
| **Logging Requirements** | Task creation summary logged |
| **Performance Requirements** | <500ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with dependency tracking |

---
### 7.2 dashboard-metrics

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Compute all dashboard KPIs from existing data including ticket, appointment, technician, account health, and follow-up summaries |
| **Business Domain** | Operations |
| **Owner Application** | ops-dashboard (v2) |
| **Input Schema** | `{include_trends?: bool (default false)}` |
| **Output Schema** | `{tickets_summary: {total, by_status, by_urgency}, appointments_summary: {total, by_status}, technician_summary: {total_technicians, active_work_orders}, account_health_summary: {total_accounts, average_score, healthy_count, at_risk_count}, followup_summary: {total, pending, overdue}, trends?: {total_tickets, total_appointments, total_customers}}` |
| **Validation Rules** | None |
| **Referenced Tables** | tickets, appointments_v2, customers, users, account_health, followups_v2, work_orders_v2 |
| **Read Ops** | tickets (record.read, table.read), appointments_v2 (record.read, table.read), customers (record.read, table.read), users (record.read, table.read), account_health (record.read, table.read), followups_v2 (record.read, table.read), work_orders_v2 (record.read, table.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Ops dashboard /dashboard endpoint |
| **Called By** | ops-dashboard_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | operations-coordinator (consumes dashboard data) |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | tickets (read), appointments_v2 (read), customers (read), users (read), account_health (read), followups_v2 (read), work_orders_v2 (read) |
| **Error Handling** | Any table read failure → returns partial results with available data |
| **Retry Policy** | None |
| **Timeout Policy** | 15s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <3s for all tables |
| **Caching Policy** | Results cached 60s (dashboard refreshes) |
| **Version Strategy** | V1 deployed (reads multiple tables); V2 planned with real-time WebSocket push |

---
### 7.3 generate-standup-report

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / GENERATOR |
| **Purpose** | Generate a daily standup report summarizing yesterday's completions, today's priorities, and blocking issues |
| **Business Domain** | Operations |
| **Owner Application** | ops-dashboard (v2) |
| **Input Schema** | `{report_date?: date, include_technician_summary?: bool, include_ticket_summary?: bool, include_blockers?: bool}` |
| **Output Schema** | `{report_date: str, summary: {tickets_closed: int, appointments_completed: int, tasks_completed: int, open_urgent_tickets: int}, sections: {completed?: Array, priorities?: Array, blockers?: Array}, generated_at: str}` |
| **Validation Rules** | report_date must not be in the future |
| **Referenced Tables** | tickets, appointments_v2, tasks, operations_log |
| **Read Ops** | tickets (record.read, table.read), appointments_v2 (record.read, table.read), tasks (record.read, table.read), operations_log (record.read, table.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Daily standup button, scheduled morning report |
| **Called By** | ops-dashboard_v2, scheduled task |
| **Calls To** | None |
| **AI Agent Dependencies** | operations-coordinator (provides context) |
| **Workflow Dependencies** | daily-standup_v2 |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | tickets (read), appointments_v2 (read), tasks (read), operations_log (read) |
| **Error Handling** | No data for date → empty sections |
| **Retry Policy** | None |
| **Timeout Policy** | 10s |
| **Idempotency Strategy** | `report_date` (same date produces same report) |
| **Audit Requirements** | None |
| **Logging Requirements** | Report generation logged to operations_log |
| **Performance Requirements** | <2s |
| **Caching Policy** | Report cached 5m for same date |
| **Version Strategy** | V2 planned — new function for daily ops standup |

## 8. Resolution / Dispute Domain Functions

### 8.1 resolve-dispute

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Resolve a service dispute by updating its status to 'resolved' with a resolution note |
| **Business Domain** | Resolution / Dispute |
| **Owner Application** | resolution-center (v2) |
| **Input Schema** | `{dispute_id: string, resolution: string, resolved_by: string, resolution_notes?: string, customer_compensation?: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", dispute_id: string}` |
| **Validation Rules** | dispute_id must exist; resolution must be a valid resolution type; dispute must be in 'under_review' or 'investigating' status |
| **Referenced Tables** | disputes, operations_log |
| **Read Ops** | disputes (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | disputes (status → "resolved", resolution, resolved_at, resolved_by, resolution_notes, customer_compensation) |
| **Published Events** | `dispute.resolved` |
| **Consumed Events** | Resolution center resolve button |
| **Called By** | resolution-center_v2, agent: resolution-advisor (after human approval) |
| **Calls To** | None |
| **AI Agent Dependencies** | resolution-advisor (provides resolution recommendation) |
| **Workflow Dependencies** | dispute-resolution_v2 |
| **Auth Requirements** | Authenticated user or agent |
| **Authorization Requirements** | disputes (read/write), operations_log (write) |
| **Error Handling** | Wrong status → error (must be under_review or investigating) |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `dispute_id + "resolve"` (skip if already resolved) |
| **Audit Requirements** | operations_log: action="dispute.resolved", includes resolution |
| **Logging Requirements** | Resolution details logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with compensation tracking |

---
### 8.2 resolve-dispute-v2

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Enhanced dispute resolution with compensation processing, customer notification trigger, and detailed audit trail |
| **Business Domain** | Resolution / Dispute |
| **Owner Application** | resolution-center (v2) |
| **Input Schema** | `{dispute_id: string, resolution: string, resolved_by: string, resolution_notes?: string, compensation_type?: string, compensation_amount?: float, notify_customer?: bool, followup_required?: bool}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", dispute_id: string, compensation_processed: bool, customer_notified: bool}` |
| **Validation Rules** | dispute_id must exist; compensation_amount must be >= 0 if provided; resolution must be valid enum |
| **Referenced Tables** | disputes, operations_log, notification_queue |
| **Read Ops** | disputes (record.read) |
| **Write Ops** | operations_log (record.create), notification_queue (record.create — if notify_customer) |
| **Update Ops** | disputes (all resolution fields) |
| **Published Events** | `dispute.resolved.v2`, `dispute.compensation.processed` |
| **Consumed Events** | Resolution center V2 resolve panel |
| **Called By** | resolution-center_v2 |
| **Calls To** | dispatch-notifications_v2 (if notify_customer) |
| **AI Agent Dependencies** | resolution-advisor (recommends resolution) |
| **Workflow Dependencies** | dispute-resolution_v2 |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | disputes (read/write), operations_log (write), notification_queue (write) |
| **Error Handling** | Compensation processing failure → dispute still resolved, compensation marked as pending |
| **Retry Policy** | 1 retry: 2s (on compensation/notification failure) |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `dispute_id + resolution` (1h TTL) |
| **Audit Requirements** | operations_log: action="dispute.resolved.v2", includes all resolution fields |
| **Logging Requirements** | Full resolution audit trail logged |
| **Performance Requirements** | <300ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed (V2 named variant); V2 planned with full compensation workflow |

---
### 8.3 list-disputes

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | List disputes with optional filtering by status, customer_id, and date range |
| **Business Domain** | Resolution / Dispute |
| **Owner Application** | resolution-center (v2) |
| **Input Schema** | `{status?: string, customer_id?: string, date_from?: date, date_to?: date, limit?: int, offset?: int}` |
| **Output Schema** | `{total: int, disputes: Array<{dispute_id, customer_id, customer_name, subject, status, urgency, created_at, assigned_to?, resolution?, resolved_at?}>}` |
| **Validation Rules** | status must be valid enum; date_from before date_to |
| **Referenced Tables** | disputes, customers |
| **Read Ops** | disputes (record.read, table.read), customers (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Resolution center list view |
| **Called By** | resolution-center_v2, agent: resolution-advisor |
| **Calls To** | None |
| **AI Agent Dependencies** | resolution-advisor (reads disputes for analysis) |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user or agent |
| **Authorization Requirements** | disputes (read), customers (read) |
| **Error Handling** | None (returns empty list) |
| **Retry Policy** | None |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <300ms |
| **Caching Policy** | Optional 30s cache |
| **Version Strategy** | V1 deployed; V2 planned with aggregation and trend data |

## 9. Work Order Domain Functions

### 9.1 create-work-order

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Create a new work order with customer, technician, service details, and initial status |
| **Business Domain** | Work Order |
| **Owner Application** | work-order-manager (v2) |
| **Input Schema** | `{customer_id: string, technician_id: string, service_type: string, description: string, scheduled_date?: datetime, priority: string, location?: string, parts_required?: string[], notes?: string, created_by: string}` |
| **Output Schema** | `{status: "success"|"error", work_order_id?: string, work_order_number?: string, error?: string}` |
| **Validation Rules** | customer_id and technician_id must exist; service_type must be valid; description required; priority must be valid enum |
| **Referenced Tables** | work_orders_v2, customers, technician_v2, operations_log |
| **Read Ops** | customers (record.read), technician_v2 (record.read) |
| **Write Ops** | work_orders_v2 (record.create), operations_log (record.create) |
| **Update Ops** | None |
| **Published Events** | `work-order.created` |
| **Consumed Events** | Work order creation form |
| **Called By** | work-order-manager_v2, appointment-scheduler_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | work-order-lifecycle_v2 |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | customers (read), technician_v2 (read), work_orders_v2 (write), operations_log (write) |
| **Error Handling** | Missing customer/technician → validation error |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `customer_id + service_type + scheduled_date` (24h TTL) |
| **Audit Requirements** | operations_log: action="work_order.created" |
| **Logging Requirements** | Work order creation details logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with auto-numbering and templates |

---
### 9.2 update-work-order

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Update work order fields including scheduling, assignment, priority, and notes |
| **Business Domain** | Work Order |
| **Owner Application** | work-order-manager (v2) |
| **Input Schema** | `{work_order_id: string, technician_id?: string, scheduled_date?: datetime, priority?: string, description?: string, location?: string, parts_required?: string[], notes?: string, updated_by: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", work_order_id: string}` |
| **Validation Rules** | work_order_id must exist and not be in "completed" or "cancelled" status |
| **Referenced Tables** | work_orders_v2, operations_log |
| **Read Ops** | work_orders_v2 (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | work_orders_v2 (record.write — any provided fields) |
| **Published Events** | `work-order.updated` |
| **Consumed Events** | Work order edit form |
| **Called By** | work-order-manager_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | work-order-lifecycle_v2 |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | work_orders_v2 (read/write), operations_log (write) |
| **Error Handling** | Completed/cancelled work orders reject updates |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `work_order_id + hash(fields)` (1h TTL) |
| **Audit Requirements** | operations_log: action="work_order.updated" |
| **Logging Requirements** | Changed fields logged |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed; V2 planned with change approval workflow |

---
### 9.3 get-work-order

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Get a single work order by ID with full detail including customer, technician, and parts info |
| **Business Domain** | Work Order |
| **Owner Application** | work-order-manager (v2) |
| **Input Schema** | `{work_order_id: string}` |
| **Output Schema** | `{work_order_id, customer_id, customer_name, technician_id, technician_name, service_type, description, status, priority, scheduled_date?, location?, parts_required?: string[], notes?, created_at, updated_at, completed_at?}` |
| **Validation Rules** | work_order_id must be valid UUID |
| **Referenced Tables** | work_orders_v2, customers, technician_v2 |
| **Read Ops** | work_orders_v2 (record.read), customers (record.read), technician_v2 (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Work order detail view |
| **Called By** | work-order-manager_v2, technician-mobile-app_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | work_orders_v2 (read), customers (read), technician_v2 (read) |
| **Error Handling** | Not found → returns null with status "not_found" |
| **Retry Policy** | None |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <100ms |
| **Caching Policy** | Optional 30s cache |
| **Version Strategy** | V1 deployed; V2 planned with related data enrichment |

---
### 9.4 list-work-orders

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | List work orders with optional filters by status, technician, customer, and date range |
| **Business Domain** | Work Order |
| **Owner Application** | work-order-manager (v2) |
| **Input Schema** | `{status?: string, technician_id?: string, customer_id?: string, date_from?: date, date_to?: date, limit?: int, offset?: int}` |
| **Output Schema** | `{total: int, work_orders: Array<{work_order_id, work_order_number?, customer_name, technician_name, service_type, status, priority, scheduled_date?}>}` |
| **Validation Rules** | status must be valid enum; date_from before date_to |
| **Referenced Tables** | work_orders_v2, customers, technician_v2 |
| **Read Ops** | work_orders_v2 (record.read, table.read), customers (record.read), technician_v2 (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Work order list view |
| **Called By** | work-order-manager_v2, ops-dashboard_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | operations-coordinator (reads work orders for prioritization) |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | work_orders_v2 (read), customers (read), technician_v2 (read) |
| **Error Handling** | None (returns empty list) |
| **Retry Policy** | None |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <300ms |
| **Caching Policy** | Optional 30s cache |
| **Version Strategy** | V1 deployed; V2 planned with advanced filtering |

---
### 9.5 update-work-order-stage

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / WRITER |
| **Purpose** | Advance or change the work order stage/status through its lifecycle (created → assigned → in_progress → completed → invoiced) |
| **Business Domain** | Work Order |
| **Owner Application** | work-order-manager (v2) |
| **Input Schema** | `{work_order_id: string, stage: string, updated_by: string, notes?: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"invalid_transition"|"error", work_order_id: string, previous_stage: string, current_stage: string}` |
| **Validation Rules** | Stage transition must be valid per lifecycle state machine; work_order_id must exist |
| **Referenced Tables** | work_orders_v2, operations_log |
| **Read Ops** | work_orders_v2 (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | work_orders_v2 (status/stage, updated_at) |
| **Published Events** | `work-order.stage.changed` |
| **Consumed Events** | Work order stage advancement UI |
| **Called By** | work-order-manager_v2, technician-mobile-app_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | work-order-lifecycle_v2 |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | work_orders_v2 (read/write), operations_log (write) |
| **Error Handling** | Invalid transition → error with valid next stages |
| **Retry Policy** | 1 retry: 1s |
| **Timeout Policy** | 3s |
| **Idempotency Strategy** | `work_order_id + stage` (skip if already at stage) |
| **Audit Requirements** | operations_log: action="work_order.stage.changed" |
| **Logging Requirements** | Stage transition logged with previous and current stage |
| **Performance Requirements** | <200ms |
| **Caching Policy** | None |
| **Version Strategy** | V2 planned — new function for state machine enforcement |

---
### 9.6 complete-work-order

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / WRITER |
| **Purpose** | Finalize a work order as completed with completion notes, time tracking, and parts verification |
| **Business Domain** | Work Order |
| **Owner Application** | work-order-manager (v2) |
| **Input Schema** | `{work_order_id: string, completed_by: string, completion_notes?: string, labor_hours?: float, parts_used?: Array<{part_name, quantity}>, customer_signature?: string}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", work_order_id: string, completed_at: str, parts_verified: bool}` |
| **Validation Rules** | work_order_id must exist and be in "in_progress" stage; labor_hours must be >= 0 |
| **Referenced Tables** | work_orders_v2, inventory_transactions, operations_log |
| **Read Ops** | work_orders_v2 (record.read) |
| **Write Ops** | inventory_transactions (record.create), operations_log (record.create) |
| **Update Ops** | work_orders_v2 (status → "completed", completed_at, completion_notes, labor_hours) |
| **Published Events** | `work-order.completed` |
| **Consumed Events** | Work order completion form |
| **Called By** | work-order-manager_v2, technician-mobile-app_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | work-order-lifecycle_v2, inventory-reconciliation_v2 |
| **Auth Requirements** | Authenticated technician |
| **Authorization Requirements** | work_orders_v2 (read/write), inventory_transactions (write), operations_log (write) |
| **Error Handling** | Parts verification failure → work order completed, inventory flagged |
| **Retry Policy** | 1 retry: 2s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `work_order_id + "complete"` (skip if already completed) |
| **Audit Requirements** | operations_log: action="work_order.completed" |
| **Logging Requirements** | Completion details including parts and labor logged |
| **Performance Requirements** | <500ms |
| **Caching Policy** | None |
| **Version Strategy** | V2 planned — new function for work order completion workflow |

## 10. Dispatch Domain Functions

### 10.1 finalize-dispatch

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Finalize an urgent ticket dispatch. Updates ticket with assigned technician, closes ticket, writes audit log, and sends Discord notification. Idempotent. |
| **Business Domain** | Dispatch |
| **Owner Application** | dispatch (v2) |
| **Input Schema** | `{ticket_id: string, assigned_technician?: string, dispatch_notes?: string, dispatcher: string, status: "dispatched"|"manual_assignment"|"escalation"}` |
| **Output Schema** | `{status: "success"|"not_found"|"error", ticket_id: string, audit_logged: bool, error?: string}` |
| **Validation Rules** | Ticket must exist and not already be closed; dispatcher required; status must be valid enum |
| **Referenced Tables** | tickets, operations_log |
| **Read Ops** | tickets (record.read) |
| **Write Ops** | operations_log (record.create) |
| **Update Ops** | tickets (status, owner, human_notes) |
| **Published Events** | `dispatch.finalized` |
| **Consumed Events** | Urgent dispatch workflow |
| **Called By** | urgent-dispatch workflow, dispatch_v2 |
| **Calls To** | resqai-discord connector (support-alerts channel) |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | urgent-dispatch_v2 |
| **Auth Requirements** | Authenticated user or workflow |
| **Authorization Requirements** | tickets (read/write), operations_log (write), resqai-discord (connector.use) |
| **Error Handling** | Ticket not found → not_found; Discord failure → logged, dispatch proceeds |
| **Retry Policy** | 1 retry: 2s |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | `ticket_id + dispatcher` — re-running with same inputs overwrites state idempotently |
| **Audit Requirements** | operations_log: action="urgent dispatch", includes assignment and status |
| **Logging Requirements** | Dispatch details logged |
| **Performance Requirements** | <300ms (includes Discord) |
| **Caching Policy** | None |
| **Version Strategy** | V1 deployed (tickets table); V2 planned (tickets_v2 with dispatch-specific fields) |

---
### 10.2 calculate-dispatch-priority

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / ANALYZER |
| **Purpose** | Calculate dispatch priority score for pending tickets based on urgency, SLA deadline, customer tier, and technician availability |
| **Business Domain** | Dispatch |
| **Owner Application** | dispatch (v2) |
| **Input Schema** | `{ticket_ids?: string[], limit?: int (default 20)}` |
| **Output Schema** | `{priorities: Array<{ticket_id, priority_score: float, factors: {urgency_score, sla_score, customer_tier_score, wait_time_score}, recommended_action: string}>, generated_at: str}` |
| **Validation Rules** | If ticket_ids provided, max 50 per batch; tickets must exist and be unassigned |
| **Referenced Tables** | tickets_v2, sla_policies, customers, technician_v2 |
| **Read Ops** | tickets_v2 (record.read, table.read), sla_policies (record.read), customers (record.read), technician_v2 (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | `dispatch.priority.calculated` |
| **Consumed Events** | Dispatch board, urgent dispatch workflow |
| **Called By** | dispatch_v2, urgent-dispatch_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | dispatch-priority_v2 |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | tickets_v2 (read), sla_policies (read), customers (read), technician_v2 (read) |
| **Error Handling** | Missing ticket IDs → scans all unassigned urgent tickets |
| **Retry Policy** | None |
| **Timeout Policy** | 5s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <500ms |
| **Caching Policy** | Priority scores cached 30s |
| **Version Strategy** | V2 planned — new function for intelligent dispatch routing |

## 11. Notification Domain Functions

### 11.1 dispatch-notifications

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Dispatch a notification to a single recipient via specified channel (Discord, email, SMS) |
| **Business Domain** | Notification |
| **Owner Application** | notification-service (v2) |
| **Input Schema** | `{recipient: string, channel: string, template_name: string, template_data: object, priority?: string (default "normal")}` |
| **Output Schema** | `{status: "sent"|"failed", notification_id?: string, channel_used: string, error?: string}` |
| **Validation Rules** | channel must be supported (discord, email, sms); template_name must exist; recipient required |
| **Referenced Tables** | notification_queue, notification_log |
| **Read Ops** | notification_templates (record.read) |
| **Write Ops** | notification_queue (record.create), notification_log (record.create) |
| **Update Ops** | None |
| **Published Events** | `notification.dispatched` |
| **Consumed Events** | Other functions/workflows that need to send notifications |
| **Called By** | support-center_v2, dispatch_v2, escalation workflows |
| **Calls To** | Discord connector (via resqai-discord), email connector, SMS connector |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user or workflow |
| **Authorization Requirements** | notification_templates (read), notification_queue (write), notification_log (write) |
| **Error Handling** | Channel delivery failure → logged, status returned as failed |
| **Retry Policy** | 2 retries: linear 2s, 5s |
| **Timeout Policy** | 10s |
| **Idempotency Strategy** | `notification_id` (dedup on creation) |
| **Audit Requirements** | notification_log: delivery status recorded |
| **Logging Requirements** | Delivery attempt and result logged |
| **Performance Requirements** | <1s for Discord, <3s for email/SMS |
| **Caching Policy** | Templates cached 1h |
| **Version Strategy** | V1 deployed; V2 planned with delivery tracking |

---
### 11.2 dispatch-notification-v2

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / WRITER |
| **Purpose** | Enhanced notification dispatch with templating, multi-channel fallback, delivery tracking, and priority queuing |
| **Business Domain** | Notification |
| **Owner Application** | notification-service (v2) |
| **Input Schema** | `{recipient: string, channels: string[], template_name: string, template_data: object, fallback_behavior?: "sequential"|"all", priority?: string, tracking_id?: string}` |
| **Output Schema** | `{status: "delivered"|"partial"|"failed", tracking_id: string, channel_results: Array<{channel, status, error?}>, primary_channel: string}` |
| **Validation Rules** | At least one channel required; fallback_behavior defaults to "sequential"; tracking_id auto-generated if not provided |
| **Referenced Tables** | notification_queue, notification_log, notification_templates |
| **Read Ops** | notification_templates (record.read) |
| **Write Ops** | notification_queue (record.create), notification_log (record.create) |
| **Update Ops** | notification_log (delivery status updates) |
| **Published Events** | `notification.v2.dispatched`, `notification.v2.channel.failed` |
| **Consumed Events** | All workflow notification needs |
| **Called By** | Multiple workflows (dispute, appointment, escalation, CRM) |
| **Calls To** | Discord connector, email connector, SMS connector |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user or workflow |
| **Authorization Requirements** | notification_templates (read), notification_queue (write), notification_log (read/write) |
| **Error Handling** | Primary channel fails → fallback to next channel; all fail → "failed" status |
| **Retry Policy** | 2 retries per channel: exponential 2s, 4s |
| **Timeout Policy** | 15s total |
| **Idempotency Strategy** | `tracking_id` (dedup across all channels) |
| **Audit Requirements** | notification_log: full delivery audit with per-channel results |
| **Logging Requirements** | Per-channel delivery status and fallback actions logged |
| **Performance Requirements** | <2s per channel |
| **Caching Policy** | Templates cached 1h |
| **Version Strategy** | V1 deployed (V2 named variant); V2 planned with read receipts |

---
### 11.3 send-bulk-notification

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / BATCH |
| **Purpose** | Send the same notification template to multiple recipients in a single batch call |
| **Business Domain** | Notification |
| **Owner Application** | notification-service (v2) |
| **Input Schema** | `{recipients: string[], channel: string, template_name: string, template_data: object | Array, batch_size?: int (default 50)}` |
| **Output Schema** | `{status: "completed"|"partial"|"failed", total: int, succeeded: int, failed: int, errors?: Array<{recipient, error}>}` |
| **Validation Rules** | Max 500 recipients per batch; each recipient must be valid format for channel; template_data can be shared or per-recipient array |
| **Referenced Tables** | notification_queue, notification_log |
| **Read Ops** | notification_templates (record.read) |
| **Write Ops** | notification_queue (record.create batch), notification_log (record.create batch) |
| **Update Ops** | None |
| **Published Events** | `notification.bulk.sent` |
| **Consumed Events** | Marketing campaigns, system announcements |
| **Called By** | admin-console_v2, scheduled tasks |
| **Calls To** | Discord connector, email connector, SMS connector |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated admin user |
| **Authorization Requirements** | notification_templates (read), notification_queue (write), notification_log (write) |
| **Error Handling** | Individual recipient failures → batch continues, errors collected |
| **Retry Policy** | 1 retry per recipient: 2s |
| **Timeout Policy** | 30s for full batch |
| **Idempotency Strategy** | `batch_id` (dedup on batch level) |
| **Audit Requirements** | notification_log: batch summary with success/failure counts |
| **Logging Requirements** | Batch delivery summary logged |
| **Performance Requirements** | <5s for 100 recipients |
| **Caching Policy** | Templates cached 1h |
| **Version Strategy** | V1 deployed; V2 planned with recipient segmentation |

---
### 11.4 track-notification

| Attribute | Value |
|-----------|-------|
| **Status** | `v1 deployed` |
| **Type** | API / READER |
| **Purpose** | Track delivery status of a notification by tracking ID or notification ID |
| **Business Domain** | Notification |
| **Owner Application** | notification-service (v2) |
| **Input Schema** | `{notification_id?: string, tracking_id?: string}` |
| **Output Schema** | `{status: "delivered"|"pending"|"failed"|"not_found", notification: {id, tracking_id, recipient, channel, template, status, attempted_at, delivered_at?, error?}}` |
| **Validation Rules** | Either notification_id or tracking_id must be provided |
| **Referenced Tables** | notification_log |
| **Read Ops** | notification_log (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Notification history UI |
| **Called By** | notification-service_v2, admin-console_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | notification_log (read) |
| **Error Handling** | Not found → "not_found" status |
| **Retry Policy** | None |
| **Timeout Policy** | 2s |
| **Idempotency Strategy** | Naturally idempotent (read-only) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <100ms |
| **Caching Policy** | Optional 10s cache for polling scenarios |
| **Version Strategy** | V1 deployed; V2 planned with delivery analytics |

---
### 11.5 render-notification-template

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / RENDERER |
| **Purpose** | Render a notification template with provided data, returning the rendered content without sending it |
| **Business Domain** | Notification |
| **Owner Application** | notification-service (v2) |
| **Input Schema** | `{template_name: string, template_data: object, channel?: string}` |
| **Output Schema** | `{rendered: {subject?: string, body: string, channel_specific?: object}, template_name: string, variables_used: string[]}` |
| **Validation Rules** | template_name must exist in template store; all required template variables must be provided |
| **Referenced Tables** | notification_templates |
| **Read Ops** | notification_templates (record.read) |
| **Write Ops** | None |
| **Update Ops** | None |
| **Published Events** | None |
| **Consumed Events** | Preview mode in admin console |
| **Called By** | notification-service_v2, admin-console_v2 |
| **Calls To** | None |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | None |
| **Auth Requirements** | Authenticated user |
| **Authorization Requirements** | notification_templates (read) |
| **Error Handling** | Missing variables → error with list of required vars |
| **Retry Policy** | None |
| **Timeout Policy** | 1s |
| **Idempotency Strategy** | Naturally idempotent (pure render) |
| **Audit Requirements** | None |
| **Logging Requirements** | None |
| **Performance Requirements** | <100ms |
| **Caching Policy** | Templates cached 1h |
| **Version Strategy** | V2 planned — new function for template preview and testing |

---
### 11.6 process-notification-delivery

| Attribute | Value |
|-----------|-------|
| **Status** | `v2 planned` |
| **Type** | API / WORKER |
| **Purpose** | Background worker that picks queued notifications from notification_queue and delivers them via the appropriate channel connector |
| **Business Domain** | Notification |
| **Owner Application** | notification-service (v2) |
| **Input Schema** | `{batch_size?: int (default 20), max_retries?: int (default 3)}` |
| **Output Schema** | `{processed: int, succeeded: int, failed: int, requeued: int, details: Array<{notification_id, channel, status, error?}>}` |
| **Validation Rules** | batch_size max 50; processes only "pending" status notifications |
| **Referenced Tables** | notification_queue, notification_log, notification_templates |
| **Read Ops** | notification_queue (record.read, table.read — filter pending), notification_templates (record.read) |
| **Write Ops** | notification_log (record.create) |
| **Update Ops** | notification_queue (status → "processing"|"delivered"|"failed", attempt_count) |
| **Published Events** | `notification.delivery.processed` |
| **Consumed Events** | Scheduled worker tick |
| **Called By** | scheduler-cron_v2 |
| **Calls To** | Discord connector, email connector, SMS connector |
| **AI Agent Dependencies** | None |
| **Workflow Dependencies** | notification-delivery_v2 |
| **Auth Requirements** | Scheduled task |
| **Authorization Requirements** | notification_queue (read/write), notification_log (write), notification_templates (read) |
| **Error Handling** | Transient failures → requeue with incremented attempt_count; max retries exceeded → mark as failed |
| **Retry Policy** | 3 retries per notification: exponential 2s, 5s, 10s |
| **Timeout Policy** | 60s per batch |
| **Idempotency Strategy** | `notification_id` (skip already-delivered) |
| **Audit Requirements** | notification_log: delivery attempt records |
| **Logging Requirements** | Per-notification delivery status logged |
| **Performance Requirements** | <10s for 20 notifications |
| **Caching Policy** | Templates cached 1h |
| **Version Strategy** | V2 planned — new background worker for async delivery |
