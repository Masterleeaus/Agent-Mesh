# Function Output Schemas — ResQAI V2

> Complete output schema documentation for all ~68 functions across 17 domains.

---

## Standard Error Response Contract

Every function returns errors in this shape:

```json
{
  "status": "error | not_found | conflict | already_closed",
  "error": "Human-readable error description"
}
```

Additionally, functions that operate on a specific entity echo the identifying field(s) (e.g. `ticket_id`, `user_id`, `appointment_id`) even on error.

---

## Authentication & Security (5 functions)

### authenticate_user

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| user_id | `string?` | Authenticated user UUID |
| name | `string?` | Display name of the authenticated user |
| email | `string?` | Email of the authenticated user |
| role | `string?` | Role ID assigned to the user |
| token | `string?` | Session token (session UUID) for subsequent requests |

**Conditional Fields (on error):**
| Field | Type | Description |
|-------|------|-------------|
| error | `string?` | Error detail if authentication failed |

**Status Codes:** success, error

### validate_session

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | Always "success" |
| valid | `bool` | Whether the session is currently valid |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| user_id | `string?` | Returned if session exists (even if expired/invalidated) |
| error | `string?` | Returned when valid=false ("Session not found", "Session has been invalidated", "Session has expired") |

**Status Codes:** success (always), error

### create_user

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| user_id | `string?` | UUID of the created user |

**Conditional Fields (on error):**
| Field | Type | Description |
|-------|------|-------------|
| error | `string?` | Error detail ("Invalid email format", "Email already exists") |

**Status Codes:** success, error

### update_user

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| user_id | `string` | Echoed user_id of the updated user |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | Returned on not_found or error |

**Status Codes:** success, not_found, error

### assign_user_role

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| user_id | `string` | Echoed user_id |
| role_id | `string` | Echoed role_id |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | Returned when user or role is not found |

**Status Codes:** success, not_found, error

---

## Administration (14 functions)

### create_role

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| role_id | `string?` | UUID of the created role |

**Conditional Fields (on error):**
| Field | Type | Description |
|-------|------|-------------|
| error | `string?` | "Role name already exists" |

**Status Codes:** success, error

### list_users

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total | `int` | Total number of users matching filters |
| users | `list[UserItem]` | List of user items |

**UserItem fields:** user_id, email, name, role_id, status, last_login_at?, created_at

**Status Codes:** success (only - no error state)

### list_permissions

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total | `int` | Total number of permissions matching filters |
| permissions | `list[PermissionItem]` | List of permission items |

**PermissionItem fields:** permission_id, role_id, role_name, resource, action, scope

**Status Codes:** success (only)

### manage_permission

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |
| role_id | `string` | Echoed role_id |
| resource | `string` | Echoed resource name |
| permission_action | `string` | Echoed permission action |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On error |

**Status Codes:** success, error

### record_audit

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| audit_id | `string?` | UUID of the created audit entry |

**Conditional Fields (on error):**
| Field | Type | Description |
|-------|------|-------------|
| error | `string?` | Error detail |

**Status Codes:** success, error

### query_audit_log

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total | `int` | Total number of entries matching filters |
| entries | `list[AuditEntry]` | List of audit entries |

**AuditEntry fields:** audit_id, entity_type, entity_id, action, actor_type, actor_id?, previous_state?, new_state?, changed_fields[], ip_address?, correlation_id?, created_at

**Status Codes:** success (only)

### create_customer
*(See CRM)*

### update_customer
*(See CRM)*

### get_customer
*(See CRM)*

### search_customers
*(See CRM)*

### create_inventory_item
*(See Inventory)*

### update_inventory_item
*(See Inventory)*

### list_inventory
*(See Inventory)*

### create_report
*(See Reporting)*

### execute_report
*(See Reporting)*

### schedule_report
*(See Reporting)*

---

## Support / Ticket (13 functions)

### create_ticket

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| ticket_id | `string?` | ID of the newly created ticket |

**Conditional Fields (on error):**
| Field | Type | Description |
|-------|------|-------------|
| error | `string?` | "Missing required fields: ..." |

**Status Codes:** success, error

### update_ticket_v2

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| ticket_id | `string` | Echoed ticket_id for workflow tracking |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found or error |

**Status Codes:** success, not_found, error

### search_tickets

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total | `int` | Total number of matching tickets |
| results | `list[TicketSearchResult]` | List of matching ticket results |

**TicketSearchResult fields:** ticket_id, customer_name?, subject, status, urgency, assigned_to?, created_at, channel?

**Status Codes:** success (only)

### assign_ticket

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| ticket_id | `string` | Echoed ticket_id |
| assigned_to | `string` | The assignee |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found or error |

**Status Codes:** success, not_found, error

### escalate_ticket

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| ticket_id | `string` | Echoed ticket_id |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found or error |

**Status Codes:** success, not_found, error

### close_ticket

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", "already_closed", or "error" |
| ticket_id | `string` | Echoed ticket_id |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found, already_closed, or error |

**Status Codes:** success, not_found, already_closed, error

### update_ticket_record

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| ticket_id | `string` | Echoed ticket_id |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found |

**Status Codes:** success, not_found, error

### check_ticket_urgency

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| routing | `string` | The urgency level (passthrough) |
| ticket_id | `string` | Echoed ticket_id |
| is_urgent | `bool` | true if urgency is "high" or "urgent" |

**Status Codes:** success (only - no error state)

### collect_resolved_tickets

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| today | `string` | ISO date of the reference date |
| lookback_days | `int` | Lookback window used |
| total_found | `int` | Number of closed tickets found |
| tickets | `list[ResolvedTicket]` | List of resolved ticket data |

**ResolvedTicket fields:** ticket_id, customer_name, subject, message, channel, request_type, urgency, owner?, status, human_notes?, closed_at

**Status Codes:** success (only - no error state)

### finalize_dispatch

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| ticket_id | `string` | Echoed ticket_id |
| audit_logged | `bool` | True if operations_log entry was written |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found or error |

**Status Codes:** success, not_found, error

---

## Appointment (10 functions)

### create_appointment

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| appointment_id | `string?` | The new appointment UUID |

**Conditional Fields (on error):**
| Field | Type | Description |
|-------|------|-------------|
| error | `string?` | "Customer X not found" or exception detail |

**Status Codes:** success, error

### get_appointment

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| appointment | `AppointmentDetail?` | Full appointment details |

**AppointmentDetail fields:** appointment_id, customer_id?, customer_name?, technician_id?, technician_name?, service_type?, scheduled_date?, status?, duration_minutes?, notes?, work_summary?, completed_at?, cancelled_at?, cancellation_reason?, customer_signature?, created_by?, created_at?

**Conditional Fields (on error):**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found or error |

**Status Codes:** success, not_found, error

### list_appointments

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total | `int` | Total number of matching appointments |
| appointments | `list[AppointmentItem]` | List of matching appointments |

**AppointmentItem fields:** appointment_id, customer_id, customer_name?, technician_id?, technician_name?, service_type, scheduled_date, status, duration_minutes, notes?

**On exception:** Returns total=0, appointments=[]

**Status Codes:** success (graceful degradation on error)

### assign_appointment_technician

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| appointment_id | `string` | The appointment UUID that was updated |
| technician_name | `string` | The technician assigned |
| audit_logged | `bool` | True if operations_log entry was written |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found or error |

**Status Codes:** success, not_found, error

### accept_appointment

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| appointment_id | `string` | The appointment UUID that was accepted |
| technician_id | `string` | The technician UUID who accepted |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found, error, or missing technician assignment |

**Status Codes:** success, not_found, error

### complete_appointment

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| appointment_id | `string` | The appointment UUID that was completed |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found, already completed, or error |

**Status Codes:** success, not_found, error

### cancel_appointment

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| appointment_id | `string` | The appointment UUID that was cancelled |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found or error |

**Status Codes:** success, not_found, error

### fetch_upcoming_appointments

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| today | `string` | Reference date ISO string |
| count | `int` | Number of upcoming appointments |
| appointments | `list[Appointment]` | List of upcoming appointments |

**Appointment fields:** appointment_id, customer_id, customer_name, technician?, status, scheduled_date, scheduled_time?, service_type?, notes?, location?

**Status Codes:** success (only)

### create_work_order
*(See Work Order)*

### update_work_order
*(See Work Order)*

---

## Technician (4 functions)

### create_technician

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| technician_id | `string?` | The new technician UUID |

**Conditional Fields (on error):**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | "Technician name is required" or exception detail |

**Status Codes:** success, error

### update_technician

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| technician_id | `string` | The technician UUID that was updated |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found or error |

**Status Codes:** success, not_found, error

### update_technician_skills

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| technician_id | `string` | The technician UUID that was updated |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| skills | `list[string]` | The updated list of skills |

**Conditional Fields (on error):**
| Field | Type | Condition |
|-------|------|-----------|
| skills | `list` | Empty list [] |
| error | `string?` | On not_found or error |

**Status Codes:** success, not_found, error

### list_technicians

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total | `int` | Total number of matching technicians |
| technicians | `list[TechnicianItem]` | List of matching technicians |

**TechnicianItem fields:** technician_id, name, primary_phone?, primary_email?, availability?, status?, rating?, current_jobs_count?, max_daily_jobs?

**On exception:** Returns total=0, technicians=[]

**Status Codes:** success (graceful degradation on error)

---

## CRM (14 functions)

### create_customer

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| customer_id | `string?` | The created customer UUID |

**Conditional Fields (on error):**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | "name is required" |

**Status Codes:** success, error

### update_customer

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |
| customer_id | `string` | Echoed customer UUID |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found |

**Status Codes:** success, error

### get_customer

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |

**Conditional Fields (on success):**
| Field | Type | Condition |
|-------|------|-----------|
| customer | `dict?` | Full customer record |
| account | `dict?` | Account record (only if include_account=true) |

**Conditional Fields (on error):**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found |

**Status Codes:** success, error

### search_customers

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total | `int` | Total number of matching customers |
| results | `list[CustomerSearchResult]` | List of matching customers |

**CustomerSearchResult fields:** customer_id, name, primary_email?, primary_phone?, status?, customer_type?, tags[]

**Status Codes:** success (only)

### create_followup

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| followup_id | `string?` | The created follow-up UUID |

**Conditional Fields (on error):**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | "Account X not found" |

**Status Codes:** success, error

### complete_followup

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |
| followup_id | `string` | Echoed follow-up UUID |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found or already completed |

**Status Codes:** success, error

### list_followups

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total | `int` | Total number of matching followups |
| followups | `list[FollowupItem]` | List of matching followups |

**FollowupItem fields:** followup_id, account_id, customer_id?, type, subject, status, priority, due_date?, assigned_to?, related_ticket_id?, related_appointment_id?, notes?

**Status Codes:** success (only)

### account_health_scan

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| today | `string` | ISO date of scan |
| scan_params | `dict` | Scan parameters used |
| totals | `dict` | Total accounts scanned, wrote_back, signpost_totals |
| by_health | `dict` | Counts per health category |
| top_risk | `list[AccountHealthRow]` | Top N riskiest accounts |
| all_rows | `list[AccountHealthRow]` | All scanned accounts |

**AccountHealthRow fields:** account_id, customer_id, name, relationship_status, prior_health, new_health, prior_score?, new_score, score_delta, open_followups, overdue_followups, open_disputes, days_since_last_contact?, days_since_last_service?, signposts[], summary

**Status Codes:** success (only)

### update_account_health

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |
| account_id | `string` | Echoed account UUID |
| health_before | `string` | Health status before update |
| health_after | `string` | Health status after update |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found or error |

**Status Codes:** success, error

### update_account_health_status

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `Literal["completed"]` | Always "completed" |
| accounts_updated | `int` | Number of accounts updated |
| audit_logged | `bool` | True if an operations_log entry was written |

**Status Codes:** completed (always)

### create_followup_tasks

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| tasks_created | `int` | Number of tasks successfully created |
| audit_logged | `bool` | True if an operations_log entry was written |

**Status Codes:** success (only)

### list_disputes

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total | `int` | Total number of matching disputes |
| disputes | `list[DisputeItem]` | List of matching disputes |

**DisputeItem fields:** dispute_id, customer_id?, appointment_id?, ticket_id?, status, customer_claim?, provider_claim?, evidence_summary?, recommended_resolution?, confidence?, created_at?

**Status Codes:** success (only)

### resolve_dispute

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |
| dispute_id | `string` | Echoed dispute UUID |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| ticket_id | `string?` | If provided in input |
| error | `string?` | On not_found or unknown action |

**Status Codes:** success, error

### resolve_dispute_v2

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |
| dispute_id | `string` | Echoed dispute UUID |
| resolution_type | `string` | Echoed resolution type |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found or already closed |

**Status Codes:** success, error

---

## Operations (5 functions)

### create_followup_tasks
*(See CRM)*

### create_operations_tasks

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| tasks_created | `int` | Number of operations tasks created |
| teams | `list[string]` | List of teams that received tasks |
| audit_logged | `bool` | True if an operations_log entry was written |

**Status Codes:** success (only)

### finalize_dispatch
*(See Support / Ticket)*

### flag_slipping_followups

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| today | `string` | Reference date ISO string |
| window | `dict` | Lookback/lookahead window parameters |
| counts | `dict` | Counts of slipping, overdue, due_today, due_soon |
| top | `list[SlippingFollowup]` | Top N slipping followups |

**SlippingFollowup fields:** followup_id, account_id, customer_id, customer_name, subject, type, status, priority, due_date, days_overdue, severity (critical/high/medium/low), bucket (overdue/due_today/due_soon), owner?, related_appointment_id?, related_ticket_id?, notes?

**Status Codes:** success (only)

### finalize_slippage_review

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |
| audit_logged | `bool` | True if operations_log entry was written |
| followup_count | `int` | Number of slipping followups processed |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On exception |

**Status Codes:** success, error

---

## Resolution / Dispute (3 functions)
*(See CRM)*

---

## Work Order (6 functions)

### create_work_order

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| work_order_id | `string?` | The created work order UUID |

**Conditional Fields (on error):**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | "Appointment X not found" |

**Status Codes:** success, not_found, error

### update_work_order

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| work_order_id | `string` | The updated work order UUID |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found |

**Status Codes:** success, not_found, error

### get_work_order

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| work_order | `dict?` | The full work order record |

**Conditional Fields (on error):**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found |

**Status Codes:** success, not_found, error

### list_work_orders

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total | `int` | Total number of work orders matching the filters |
| work_orders | `list[WorkOrderItem]` | List of work order items |

**WorkOrderItem fields:** work_order_id, appointment_id, technician_id, customer_id, status, service_description, started_at?, completed_at?, parts_used?, photos?

**Status Codes:** success (only)

---

## Notification (6 functions)

### dispatch_notifications

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| dispatched | `int` | Number of notifications successfully dispatched |
| failures | `list[dict]` | List of failed dispatch attempts with reason |

**Failure dict fields:** appointment_id, channel, reason

**Status Codes:** success (only - partial success tracked in failures list)

### dispatch_notification_v2

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "sent", "failed", or "error" |

**Conditional Fields (on success):**
| Field | Type | Condition |
|-------|------|-------------|
| notification_id | `string?` | The created notification UUID |

**Conditional Fields (on failure):**
| Field | Type | Condition |
|-------|------|-----------|
| notification_id | `string?` | The created notification UUID (even on failure) |
| error | `string?` | Error detail if dispatch failed |

**Status Codes:** sent, failed, error

### send_bulk_notification

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total_dispatched | `int` | Number of notifications successfully dispatched |
| results | `list[BulkNotificationResult]` | Per-recipient dispatch results |

**BulkNotificationResult fields:** notification_id, recipient_id, status (sent/failed), error?

**Status Codes:** success (only - per-recipient status tracked in results)

### track_notification

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| notification | `dict?` | The notification record details |

**Conditional Fields (on error/not_found):**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | "Notification not found" |

**Status Codes:** success, not_found, error

---

## Analytics (7 functions)

### analytics_aggregation

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| period | `string` | The aggregation period used |
| date_from | `date` | Start date of the aggregation range |
| date_to | `date` | End date of the aggregation range |
| metrics | `AggregatedMetrics` | Computed aggregate metrics |

**AggregatedMetrics fields:** total_tickets, open_tickets, closed_tickets, avg_resolution_time_hours, total_appointments, completed_appointments, cancelled_appointments, total_customers, total_technicians, tickets_by_status{}, tickets_by_urgency{}

**Status Codes:** success (only)

### dashboard_metrics

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| tickets_summary | `dict` | Summary of ticket counts by status and urgency |
| appointments_summary | `dict` | Summary of appointment counts by status |
| technician_summary | `dict` | Summary of technician workload and availability |
| account_health_summary | `dict` | Summary of account health scores |
| followup_summary | `dict` | Summary of pending and overdue follow-ups |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| trends | `dict?` | If include_trends=true |

**Status Codes:** success (only)

### execute_report

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| report_id | `string` | Echoed report_id |
| data | `dict` | Aggregated report data keyed by metric or table |
| generated_at | `string` | ISO timestamp when the report was generated |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found |

**Status Codes:** success, not_found, error

### create_report

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success" or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| report_id | `string?` | UUID of the created report |

**Conditional Fields (on error):**
| Field | Type | Description |
|-------|------|-------------|
| error | `string?` | Error detail |

**Status Codes:** success, error

### schedule_report

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| schedule_id | `string?` | UUID of the created schedule |

**Conditional Fields (on error):**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found |

**Status Codes:** success, not_found, error

---

## Inventory (6 functions)

### create_inventory_item

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "conflict", or "error" |

**Conditional Fields (on success):**
| Field | Type | Description |
|-------|------|-------------|
| item_id | `string?` | The created inventory item UUID |

**Conditional Fields (on error):**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | "SKU 'X' already exists" |

**Status Codes:** success, conflict, error

### update_inventory_item

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| status | `string` | "success", "not_found", or "error" |
| item_id | `string` | The updated inventory item UUID |

**Conditional Fields:**
| Field | Type | Condition |
|-------|------|-----------|
| error | `string?` | On not_found |

**Status Codes:** success, not_found, error

### list_inventory

**Always Returned:**
| Field | Type | Description |
|-------|------|-------------|
| total | `int` | Total number of items matching the filters |
| items | `list[InventoryItem]` | List of inventory items |

**InventoryItem fields:** item_id, name, sku, category?, quantity_on_hand, reorder_threshold, unit_price_cents, supplier_info?

**Status Codes:** success (only)
