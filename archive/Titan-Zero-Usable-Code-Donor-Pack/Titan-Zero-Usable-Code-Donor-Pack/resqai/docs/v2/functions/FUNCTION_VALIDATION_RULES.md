# Function Validation Rules — ResQAI V2

> Comprehensive validation rules across all functions, organized by validation category.

---

## 1. Field Presence Validation

### Required Fields (by function)

| Function | Required Fields | Missing Field Behavior |
|----------|----------------|----------------------|
| authenticate_user | email | Returns error "Invalid email format" (via handler) |
| validate_session | session_id | N/A (Pydantic validation) |
| create_user | email, name, role_id | Error: "Invalid email format" for bad email |
| update_user | user_id | Returns success with no updates if all optionals empty |
| assign_user_role | user_id, role_id, assigned_by | N/A |
| create_role | name | Error: "Role name already exists" (uniqueness, not presence) |
| manage_permission | action, role_id, resource, permission_action | N/A |
| record_audit | entity_type, entity_id, action, actor_type | N/A |
| create_ticket | customer_id, channel, subject, message | Error: "Missing required fields: ..." |
| update_ticket_v2 | ticket_id | Not found if missing/invalid |
| assign_ticket | ticket_id, assigned_to, assigned_by | N/A |
| escalate_ticket | ticket_id, escalation_reason, escalated_by | N/A |
| close_ticket | ticket_id, resolution_summary, closed_by | N/A |
| check_ticket_urgency | ticket_id, urgency | N/A |
| create_appointment | customer_id, service_type, scheduled_date | N/A |
| create_work_order | appointment_id, technician_id, customer_id, service_description | N/A |
| create_customer | name | Error: "name is required" |
| create_technician | name | Error: "Technician name is required" |
| create_inventory_item | name, sku | N/A |
| create_followup | account_id, type, subject | N/A |
| resolve_dispute | dispute_id, action | Error: "Unknown action 'X'. Must be 'approve' or 'reject'" |
| resolve_dispute_v2 | dispute_id, resolution_type, resolved_by | N/A |

### Optional Fields with Defaults

| Function | Field | Default | Notes |
|----------|-------|---------|-------|
| create_ticket | urgency | "normal" | Enum validated |
| create_appointment | duration_minutes | 60 | Positive int |
| create_technician | max_daily_jobs | 4 | Positive int |
| create_technician | timezone | "UTC" | String |
| create_role | is_system | false | Bool |
| manage_permission | scope | "own" | Enum: own, department, all |
| search_tickets | limit | 50 | Max cap |
| search_tickets | offset | 0 | Pagination |
| list_users | limit | 100 | Max cap |
| list_appointments | limit | 100 | Capped at 1000 internally |
| list_technicians | limit | 100 | Capped at 1000 internally |
| list_followups | limit | 100 | - |
| list_disputes | limit | 100 | - |
| query_audit_log | limit | 100 | - |
| query_audit_log | offset | 0 | Pagination |
| create_inventory_item | reorder_threshold | 10 | Int |
| create_inventory_item | reorder_quantity | 50 | Int |
| close_ticket | send_notification | false | Bool |
| escalate_ticket | target_urgency | "urgent" | Overrides ticket urgency |
| collect_resolved_tickets | lookback_days | 7 | Int |
| fetch_upcoming_appointments | days_ahead | 2 | Int |
| fetch_upcoming_appointments | statuses | ["confirmed","scheduled"] | List of strings |
| create_followup | priority | "normal" | Enum validated |
| create_followup_tasks | category | "remediation" | String |
| create_operations_tasks | scope | "daily" | Enum: daily, weekly, ad_hoc |
| flag_slipping_followups | days_ahead | 7 | Int |
| flag_slipping_followups | top_n | 20 | Int |
| flag_slipping_followups | include_statuses | ["pending","in_progress"] | List |
| account_health_scan | lookback_days | 120 | Int |
| account_health_scan | top_n_riskiest | 10 | Int |
| schedule_report | format | "pdf" | Enum: pdf, csv, xlsx |
| schedule_report | is_active | true | Bool |

---

## 2. Format Validation

### Email Format

| Function | Field | Rule | Error |
|----------|-------|------|-------|
| authenticate_user | email | Must contain "@" | "Invalid email format" |
| create_user | email | Must contain "@" | "Invalid email format" |
| update_user | email | Must contain "@" (implicit) | Not explicitly validated |
| create_customer | primary_email | String | Not explicitly validated |
| update_customer | primary_email | String | Not explicitly validated |

### UUID / ID Format

All entity ID fields (`*_id`) are treated as opaque strings. No explicit UUID format validation is performed at the function layer. Invalid IDs result in "not found" errors.

### Date / DateTime Format

| Function | Field | Format |
|----------|-------|--------|
| create_appointment | scheduled_date | ISO 8601 datetime string |
| query_audit_log | date_from, date_to | ISO timestamp string |
| create_followup | due_date | ISO date string (optional) |
| list_followups | due_date_from, due_date_to | ISO date string comparison |
| fetch_upcoming_appointments | scheduled_date | ISO 8601 (string comparison) |
| account_health_scan | today | Python `date` object |
| flag_slipping_followups | today | Python `date` object |
| schedule_report | - | UTC ISO timestamps computed internally |
| analytics_aggregation | date_from, date_to | Python `date` objects (converted to UTC datetimes internally) |

### Phone Format

Phone numbers are free-form strings in `primary_phone` fields. No format validation is performed.

---

## 3. Business Rule Validation

### Status Transition Validation

| Function | Entity | Valid Transitions | Guard |
|----------|--------|-------------------|-------|
| close_ticket | tickets | Any -> closed | Rejects if already "closed" (status "already_closed") |
| complete_appointment | appointments | Any -> completed | Rejects if already "completed" |
| complete_followup | followups | Any -> completed | Rejects if already "completed" |
| resolve_dispute_v2 | disputes | Any -> closed | Rejects if already "closed" |
| assign_appointment_technician | appointments | Any -> in_progress | Automatically sets status |
| accept_appointment | appointments | Any -> accepted | Requires technician to already be assigned |
| update_work_order | work_orders | Any -> completed | Sets completed_at when status="completed" |
| update_ticket_v2 | tickets | Any status | Sets closed_at when status="closed" |

### State Machine Rules

**Ticket Lifecycle:**
```
new -> classified -> drafted -> approved_to_send -> sent -> closed
```
No hard enforcement — status is a free string at the function layer. Workflows are expected to enforce ordering.

**Appointment Lifecycle:**
```
scheduled -> accepted -> in_progress -> completed
scheduled -> cancelled
```

**Follow-up Lifecycle:**
```
pending -> completed
pending -> missed (not set by function)
```

**Dispute Lifecycle (v2):**
```
open -> closed
open -> investigating -> closed
```

### Dependency Checks

| Function | Dependency | Behavior on Missing |
|----------|-----------|-------------------|
| create_appointment | Customer must exist | Returns error "Customer X not found" |
| create_followup | Account must exist | Returns error "Account X not found" |
| create_work_order | Appointment must exist | Returns error "Appointment X not found" |
| assign_user_role | User must exist, Role must exist | Returns "not_found" with specific error |
| accept_appointment | Appointment must have technician assigned | Returns error "Appointment has no technician assigned" |
| assign_ticket | Ticket must exist | Returns "not_found" |
| escalate_ticket | Ticket must exist | Returns "not_found" |
| close_ticket | Ticket must exist | Returns "not_found" |
| update_ticket_v2 | Ticket must exist | Returns "not_found" |
| complete_appointment | Appointment must exist | Returns "not_found" |
| cancel_appointment | Appointment must exist | Returns "not_found" |
| update_user | User must exist | Returns "not_found" |
| update_technician | Technician must exist | Returns "not_found" |
| update_technician_skills | Technician must exist | Returns "not_found" |
| get_appointment | Appointment must exist | Returns "not_found" |
| get_customer | Customer must exist | Returns error "Customer X not found" |
| update_customer | Customer must exist | Returns error "Customer X not found" |
| get_work_order | Work order must exist | Returns "not_found" |
| update_work_order | Work order must exist | Returns "not_found" |
| update_inventory_item | Item must exist | Returns "not_found" |
| complete_followup | Follow-up must exist | Returns error "Followup X not found" |
| resolve_dispute | Dispute must exist | Returns error "Dispute X not found" |
| resolve_dispute_v2 | Dispute must exist | Returns error "Dispute X not found" |
| update_account_health | Account must exist | Returns error "Account X not found" |
| execute_report | Report must exist | Returns "not_found" |
| schedule_report | Report must exist | Returns "not_found" |
| track_notification | Notification must exist | Returns "not_found" |
| finalize_dispatch | Ticket must exist | Returns "not_found" |

---

## 4. Uniqueness Validation

| Function | Field | Rule | Error Status | Error Message |
|----------|-------|------|-------------|---------------|
| create_user | email | Email must not already exist | error | "Email already exists" |
| create_role | name | Role name must not already exist | error | "Role name already exists" |
| create_inventory_item | sku | SKU must not already exist | conflict | "SKU 'X' already exists" |

---

## 5. Range Validation

### Numeric Ranges

| Function | Field | Constraints | Enforcement |
|----------|-------|------------|-------------|
| create_appointment | duration_minutes | Positive int | Pydantic type (default 60) |
| create_technician | max_daily_jobs | Positive int (default 4) | Pydantic type |
| create_inventory_item | unit_price_cents | int (default 0) | Pydantic type |
| create_inventory_item | quantity_on_hand | int (default 0) | Pydantic type |
| create_inventory_item | reorder_threshold | int (default 10) | Pydantic type |
| create_inventory_item | reorder_quantity | int (default 50) | Pydantic type |
| list_inventory | limit | int (default 100) | Pydantic type |
| list_appointments | limit | Capped at 1000 internally | Hard cap in handler |
| list_technicians | limit | Capped at 1000 internally | Hard cap in handler |
| search_tickets | limit | int (default 50) | Pydantic type |
| search_tickets | offset | int (default 0) | Pagination |
| flag_slipping_followups | days_ahead | int (default 7) | Pydantic type |
| flag_slipping_followups | top_n | int (default 20) | Result cap |
| account_health_scan | lookback_days | int (default 120) | Pydantic type |
| account_health_scan | top_n_riskiest | int (default 10) | Result cap |
| update_account_health | health_score | float | No explicit range check |

### Date Ranges

| Function | Field | Rule |
|----------|-------|------|
| list_appointments | scheduled_date_from, scheduled_date_to | Inclusive range |
| query_audit_log | date_from, date_to | Inclusive range (string comparison) |
| list_followups | due_date_from, due_date_to | String comparison (>=, <=) |
| analytics_aggregation | date_from, date_to | date_to defaults to date_from |
| collect_resolved_tickets | lookback_days | lookback_date = today - lookback_days |
| fetch_upcoming_appointments | days_ahead | horizon = today + days_ahead |

### String Length Limits

No explicit string length constraints are enforced at the function layer. All string fields are free-form within Pydantic defaults.

---

## 6. Enum Validation

### Literal / Enum Fields

| Function | Field | Allowed Values |
|----------|-------|---------------|
| manage_permission | action | "grant", "revoke" |
| manage_permission | scope | "own" (default), "department", "all" |
| create_ticket | channel | "email", "phone", "web", "chat" |
| create_ticket | urgency | "low", "normal", "high", "urgent" |
| search_tickets | urgency | "low", "normal", "high", "urgent" |
| search_tickets | channel | "email", "phone", "web", "chat" |
| update_ticket_v2 | status | "new", "classified", "drafted", "sent", "approved_to_send", "closed" |
| create_customer | timezone | Free string (default "UTC") |
| create_technician | timezone | Free string (default "UTC") |
| update_account_health | health | "healthy", "watch", "slipping", "critical" |
| update_account_health_status | health_category | "healthy", "warning", "critical" |
| resolve_dispute | action | "approve", "reject" |
| resolve_dispute_v2 | resolution_type | "full_refund", "partial_refund", "redo_service", "discount_credit", "no_action", "escalate_legal" |
| dispatch_notification_v2 | channel | "in_app", "email", "sms" |
| send_bulk_notification | channel | "in_app", "email", "sms" |
| dispatch_notifications | channel | "email", "sms" |
| schedule_report | frequency | "daily", "weekly", "monthly" |
| schedule_report | format | "pdf", "csv", "xlsx" |
| analytics_aggregation | period | "daily", "weekly", "monthly" |
| create_followup | priority | "low", "normal", "high", "urgent" (free string, not Literal) |
| create_operations_tasks | scope | "daily", "weekly", "ad_hoc" |
| finalize_dispatch | status | "dispatched", "manual_assignment", "escalation" |
| update_user | status | "active", "suspended", "inactive" |
| list_users | status | "active", "suspended", "inactive" |

### Status Fields (free string, no Literal enforcement)

These status fields are free strings at the function layer (used for filtering, not validation):

| Function | Field | Commonly Used Values |
|----------|-------|---------------------|
| list_appointments | status | "scheduled", "in_progress", "completed", "cancelled", "accepted" |
| list_technicians | status | "active", "inactive" |
| list_technicians | availability | "available", "busy" |
| list_work_orders | status | "created", "in_progress", "completed", "cancelled" |
| list_disputes | status | "open", "investigating", "closed" |
| list_followups | status | "pending", "completed", "in_progress", "missed", "cancelled" |
| search_tickets | status | "new", "classified", "drafted", "sent", "approved_to_send", "closed" |

---

## 7. Cross-Field Validation

| Function | Fields | Rule | Error |
|----------|--------|------|-------|
| authenticate_user | auth_provider, auth_provider_id | If auth_provider is provided, user's stored auth_provider must match | "Auth provider mismatch" |
| authenticate_user | auth_provider_id, auth_provider_id (user) | If auth_provider_id is provided, user's stored auth_provider_id must match | "Auth provider ID mismatch" |
| manage_permission | action, existing permissions | When granting, skip if already exists (idempotent). When revoking, find and delete matching permissions | N/A (idempotent) |
| complete_appointment | parts_used, inventory | If parts_used provided, creates inventory_transactions for each part | N/A (creates records) |
| update_inventory_item | quantity_on_hand, previous_quantity | Computes and logs change delta to inventory_transactions | N/A |
| dispatch_notifications | reminder.channel, allowed channels | Reminder channel must be in allowed channels list | "Channel 'X' not in allowed channels" |
| execute_report | config.tables, params.filters | Merges config filters with param overrides | N/A |
| create_followup | account_id, customer_id | Account must exist (customer_id is optional) | "Account X not found" |
| resolve_dispute | action, ticket_id | If action=approve and ticket_id provided, closes the related ticket | N/A |
| resolve_dispute_v2 | dispute_id, ticket_id | If dispute is resolved and has linked ticket, closes the ticket (if not already closed) | N/A |
| update_ticket_record | approved_to_send, status | If both are true/approved_to_send, sends email via Gmail connector | N/A (error logged to operations_log) |
| close_ticket | send_notification, customer.email | If true, sends resolution email via Gmail connector | N/A (error silently caught) |

---

## 8. Reference Integrity (Foreign Key Checks)

| Source Function | FK Field | Referenced Table | Check Performed |
|----------------|----------|-----------------|-----------------|
| create_appointment | customer_id | customers | Yes - returns error if not found |
| create_followup | account_id | accounts | Yes - returns error if not found |
| create_work_order | appointment_id | appointments | Yes - returns error if not found |
| assign_user_role | user_id | users | Yes - returns "not_found" |
| assign_user_role | role_id | user_roles | Yes - returns "not_found" |
| update_user | role_id | user_roles | No explicit check |
| update_ticket_v2 | ticket_id | tickets | Yes - returns "not_found" |
| assign_ticket | ticket_id | tickets | Yes - returns "not_found" |
| escalate_ticket | ticket_id | tickets | Yes - returns "not_found" |
| close_ticket | ticket_id | tickets | Yes - returns "not_found" |
| get_appointment | appointment_id | appointments | Yes - returns "not_found" |
| get_customer | customer_id | customers | Yes - returns "not_found" |
| update_customer | customer_id | customers | Yes - returns "not_found" |
| get_work_order | work_order_id | work_orders | Yes - returns "not_found" |
| update_work_order | work_order_id | work_orders | Yes - returns "not_found" |
| update_inventory_item | item_id | inventory_items | Yes - returns "not_found" |
| complete_followup | followup_id | followups | Yes - returns "not_found" |
| resolve_dispute | dispute_id | disputes | Yes - returns "not_found" |
| resolve_dispute_v2 | dispute_id | disputes | Yes - returns "not_found" |
| update_account_health | account_id | accounts | Yes - returns "not_found" |
| execute_report | report_id | analytics_reports | Yes - returns "not_found" |
| schedule_report | report_id | analytics_reports | Yes - returns "not_found" |
| track_notification | notification_id | notifications | Yes - returns "not_found" |
| finalize_dispatch | ticket_id | tickets | Yes - returns "not_found" |
| accept_appointment | appointment_id | appointments | Yes - returns "not_found" |
| complete_appointment | appointment_id | appointments | Yes - returns "not_found" |
| cancel_appointment | appointment_id | appointments | Yes - returns "not_found" |
| update_technician | technician_id | technicians | Yes - returns "not_found" |
| update_technician_skills | technician_id | technicians | Yes - returns "not_found" |
| update_user | user_id | users | Yes - returns "not_found" |

**Functions with NO referential integrity checks:**
- record_audit (writes to audit_log without checking entity existence)

---

## Validation Rule Summary by Error Code

| Error Code | Used By | Condition |
|------------|---------|-----------|
| "Missing required fields" | create_ticket | customer_id, channel, subject, message not provided |
| "Invalid email format" | authenticate_user, create_user | Email lacks "@" |
| "Email already exists" | create_user | Duplicate email |
| "User not found" | authenticate_user | No user with that email |
| "Auth provider mismatch" | authenticate_user | Provider doesn't match |
| "Auth provider ID mismatch" | authenticate_user | Provider ID doesn't match |
| "Role name already exists" | create_role | Duplicate role name |
| "SKU 'X' already exists" | create_inventory_item | Duplicate SKU |
| "name is required" | create_customer | Blank name |
| "Technician name is required" | create_technician | Blank name |
| "Appointment X not found" | create_work_order | Missing appointment |
| "Account X not found" | create_followup | Missing account |
| "Customer X not found" | create_appointment | Missing customer |
| "Appointment has no technician assigned" | accept_appointment | No technician on appointment |
| "already completed" / "already closed" | complete_appointment, close_ticket, complete_followup, resolve_dispute_v2 | Idempotency guard |
| "Unknown action" | resolve_dispute | Action not "approve" or "reject" |
