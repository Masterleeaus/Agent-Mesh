# ResQAI V2 — Function Reference

> Version: 2.0.0
> Generated: 2026-06-29

## Overview

Total Functions: 66
Domains: Support, Appointments, Technicians, CRM, Resolution, Operations, Notifications, Analytics, Administration, Authentication

## Function Index

| # | Function Name | Domain | Type | Status |
|---|--------------|--------|------|--------|
| 1 | create_ticket | Support | Command | Active |
| 2 | update_ticket_v2 | Support | Command | Active |
| 3 | assign_ticket | Support | Command | Active |
| 4 | close_ticket | Support | Command | Active |
| 5 | escalate_ticket | Support | Command | Active |
| 6 | search_tickets | Support | Query | Active |
| 7 | update_ticket_record | Support | Command | Active |
| 8 | check_ticket_urgency | Support | Function | Active |
| 9 | collect_resolved_tickets | Support | Query | Active |
| 10 | create_appointment | Appointments | Command | Active |
| 11 | assign_appointment_technician | Appointments | Command | Active |
| 12 | accept_appointment | Appointments | Command | Active |
| 13 | complete_appointment | Appointments | Command | Active |
| 14 | cancel_appointment | Appointments | Command | Active |
| 15 | list_appointments | Appointments | Query | Active |
| 16 | get_appointment | Appointments | Query | Active |
| 17 | fetch_upcoming_appointments | Appointments | Query | Active |
| 18 | create_technician | Technicians | Command | Active |
| 19 | update_technician | Technicians | Command | Active |
| 20 | list_technicians | Technicians | Query | Active |
| 21 | update_technician_skills | Technicians | Command | Active |
| 22 | create_customer | CRM | Command | Active |
| 23 | update_customer | CRM | Command | Active |
| 24 | get_customer | CRM | Query | Active |
| 25 | search_customers | CRM | Query | Active |
| 26 | create_followup | CRM | Command | Active |
| 27 | complete_followup | CRM | Command | Active |
| 28 | list_followups | CRM | Query | Active |
| 29 | update_account_health | CRM | Command | Active |
| 30 | update_account_health_status | CRM | Command | Active |
| 31 | account_health_scan | CRM | Function | Active |
| 32 | resolve_dispute | Resolution | Command | Active |
| 33 | resolve_dispute_v2 | Resolution | Command | Active |
| 34 | list_disputes | Resolution | Query | Active |
| 35 | finalize_dispatch | Operations | Command | Active |
| 36 | create_work_order | Operations | Command | Active |
| 37 | update_work_order | Operations | Command | Active |
| 38 | get_work_order | Operations | Query | Active |
| 39 | list_work_orders | Operations | Query | Active |
| 40 | create_inventory_item | Operations | Command | Active |
| 41 | update_inventory_item | Operations | Command | Active |
| 42 | list_inventory | Operations | Query | Active |
| 43 | create_followup_tasks | Operations | Command | Active |
| 44 | create_operations_tasks | Operations | Command | Active |
| 45 | finalize_slippage_review | Operations | Command | Active |
| 46 | flag_slipping_followups | Operations | Query | Active |
| 47 | dispatch_notifications | Notifications | Command | Active |
| 48 | dispatch_notification_v2 | Notifications | Command | Active |
| 49 | send_bulk_notification | Notifications | Command | Active |
| 50 | track_notification | Notifications | Query | Active |
| 51 | analytics_aggregation | Analytics | Query | Active |
| 52 | dashboard_metrics | Analytics | Query | Active |
| 53 | create_report | Analytics | Command | Active |
| 54 | schedule_report | Analytics | Command | Active |
| 55 | execute_report | Analytics | Query | Active |
| 56 | create_user | Administration | Command | Active |
| 57 | update_user | Administration | Command | Active |
| 58 | list_users | Administration | Query | Active |
| 59 | create_role | Administration | Command | Active |
| 60 | assign_user_role | Administration | Command | Active |
| 61 | manage_permission | Administration | Command | Active |
| 62 | list_permissions | Administration | Query | Active |
| 63 | record_audit | Administration | Command | Active |
| 64 | query_audit_log | Administration | Query | Active |
| 65 | authenticate_user | Authentication | Command | Active |
| 66 | validate_session | Authentication | Query | Active |

---

## 1. Support

---

### create_ticket

**File**: `functions/create-ticket/src/handler.py`

#### Purpose
Creates a new support ticket from a customer submission. Validates required fields, persists the ticket record, logs the operation, and publishes a `ticket.created` event.

#### Input Schema
```json
{
  "customer_id": "string (required) — ID of the customer",
  "customer_name": "string (optional) — Display name",
  "channel": "string (required) — email, phone, web, chat",
  "subject": "string (required) — Short summary",
  "message": "string (required) — Full description",
  "request_type": "string (optional) — new_booking, complaint, billing, etc.",
  "urgency": "string (default: normal) — low, normal, high, urgent",
  "created_by": "string (optional) — User or workflow that created the ticket"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "ticket_id": "string (optional) — UUID of the new ticket",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- `customer_id`, `channel`, `subject`, and `message` are required (falsy check)
- Missing required fields return status `error` with field names

#### Authorization
Required permissions from function.json

#### Business Rules
- Default status is `new`
- Default urgency is `normal`
- Creates an entry in `operations_log` with action `ticket.created`
- Publishes event `ticket.created` with customer_id, channel, urgency payload

#### Database Operations
- Read: None
- Write: tickets, operations_log, events

#### Events Published
- `ticket.created` — payload: customer_id, channel, urgency

#### Audit Logging
Logged via `operations_log` table with action `ticket.created`

#### Error Handling
Returns error status with field names if validation fails

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates a new ticket record

---

### update_ticket_v2

**File**: `functions/update-ticket-v2/src/handler.py`

#### Purpose
Updates an existing ticket's status, assignment, notes, draft reply, or resolution summary. Publishes a `ticket.updated` event with changed fields.

#### Input Schema
```json
{
  "ticket_id": "string (required) — ID of the ticket to update",
  "status": "string (optional) — new, classified, drafted, sent, approved_to_send, closed",
  "assigned_to": "string (optional) — Technician or agent to assign",
  "human_notes": "string (optional) — Internal notes",
  "draft_reply": "string (optional) — Draft reply to customer",
  "approved_to_send": "bool (optional) — Approval flag for draft",
  "resolution_summary": "string (optional) — Resolution summary",
  "updated_by": "string (optional) — Actor performing update"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "ticket_id": "string — Echoed ticket_id",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Ticket must exist (returns `not_found` if missing)
- Only non-None fields are applied as updates
- Setting status to `closed` automatically sets `closed_at` timestamp

#### Authorization
Required permissions from function.json

#### Business Rules
- Sets `updated_at` on every update
- Sets `closed_at` when status transitions to `closed`
- Logs action `ticket.updated` with list of changed field names
- Publishes `ticket.updated` event with updated_fields and new_status

#### Database Operations
- Read: tickets
- Write: tickets, operations_log, events

#### Events Published
- `ticket.updated` — payload: updated_fields, new_status

#### Audit Logging
Logged via `operations_log` table with action `ticket.updated`

#### Error Handling
Returns `not_found` status if ticket does not exist

#### Retry Strategy
None — single attempt

#### Idempotency
Partially idempotent — updating same fields to same values produces same result

---

### assign_ticket

**File**: `functions/assign-ticket/src/handler.py`

#### Purpose
Assigns or reassigns a ticket to a technician or agent. Logs assignment history and publishes a `ticket.assigned` event.

#### Input Schema
```json
{
  "ticket_id": "string (required) — ID of the ticket",
  "assigned_to": "string (required) — Technician or agent to assign",
  "assigned_by": "string (required) — User or workflow performing assignment",
  "assignment_note": "string (optional) — Note explaining the assignment"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "ticket_id": "string — Echoed ticket_id",
  "assigned_to": "string — The assignee",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Ticket must exist (returns `not_found` if missing)
- `assigned_to` and `assigned_by` are required

#### Authorization
Required permissions from function.json

#### Business Rules
- Appends assignment history to `human_notes` when `assignment_note` is provided
- Uses action `ticket.reassigned` if previously assigned, else `ticket.assigned`
- Publishes `ticket.assigned` event with previous/new assignee

#### Database Operations
- Read: tickets
- Write: tickets, operations_log, events

#### Events Published
- `ticket.assigned` — payload: previous_assignee, new_assignee, assigned_by

#### Audit Logging
Logged via `operations_log` — action: ticket.assigned or ticket.reassigned

#### Error Handling
Returns `not_found` if ticket missing

#### Retry Strategy
None — single attempt

#### Idempotency
Not fully idempotent — adding assignment_note each time appends to human_notes

---

### close_ticket

**File**: `functions/close-ticket/src/handler.py`

#### Purpose
Closes a ticket with a resolution summary. Optionally sends an email notification to the customer via the Gmail connector.

#### Input Schema
```json
{
  "ticket_id": "string (required) — ID of the ticket",
  "resolution_summary": "string (required) — Resolution summary",
  "resolution_reasoning": "string (optional) — Detailed reasoning",
  "closed_by": "string (required) — User or workflow closing the ticket",
  "send_notification": "bool (default: false) — Send email to customer"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, already_closed, or error",
  "ticket_id": "string — Echoed ticket_id",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Ticket must exist (returns `not_found`)
- Ticket must not already be closed (returns `already_closed`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Sets status to `closed`, `closed_at` timestamp, and `resolution_summary`
- If `send_notification` is true, looks up customer email and sends via Gmail connector
- Discord alert not used (unlike escalate_ticket)
- Publishes `ticket.closed` event

#### Database Operations
- Read: tickets, customers
- Write: tickets, operations_log, events

#### Events Published
- `ticket.closed` — payload: resolution_summary, closed_by

#### Audit Logging
Logged via `operations_log` — action: ticket.closed

#### Error Handling
Returns `not_found` or `already_closed` status codes

#### Retry Strategy
None — single attempt

#### Idempotency
Idempotent for already-closed tickets (returns `already_closed`)

---

### escalate_ticket

**File**: `functions/escalate-ticket/src/handler.py`

#### Purpose
Escalates a ticket by increasing its urgency, recording the reason, and posting an alert to Discord.

#### Input Schema
```json
{
  "ticket_id": "string (required) — ID of the ticket",
  "escalation_reason": "string (required) — Reason for escalation",
  "escalated_by": "string (required) — User or workflow that escalated",
  "target_urgency": "string (default: urgent) — Target urgency level"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "ticket_id": "string — Echoed ticket_id",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Ticket must exist (returns `not_found` if missing)

#### Authorization
Required permissions from function.json

#### Business Rules
- Sets `escalated_at`, `escalation_reason`, and updates `urgency`
- Posts alert to Discord `support-alerts` channel via `resqai-discord` connector
- Failure to post Discord alert is silently caught
- Publishes `ticket.escalated` event

#### Database Operations
- Read: tickets
- Write: tickets, operations_log, events

#### Events Published
- `ticket.escalated` — payload: escalation_reason, target_urgency, escalated_by

#### Audit Logging
Logged via `operations_log` — action: ticket.escalated

#### Error Handling
Returns `not_found` if ticket missing; Discord failure silently ignored

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call updates timestamps and re-publishes events

---

### search_tickets

**File**: `functions/search-tickets/src/handler.py`

#### Purpose
Searches tickets with optional filters for status, urgency, assigned_to, channel, and customer name. Supports pagination via offset/limit.

#### Input Schema
```json
{
  "status": "string (optional) — new, classified, drafted, sent, approved_to_send, closed",
  "urgency": "string (optional) — low, normal, high, urgent",
  "assigned_to": "string (optional) — Filter by assignee",
  "customer_name": "string (optional) — Substring match on customer name",
  "channel": "string (optional) — email, phone, web, chat",
  "limit": "int (default: 50) — Max results",
  "offset": "int (default: 0) — Pagination offset"
}
```

#### Output Schema
```json
{
  "total": "int — Total matching tickets",
  "results": [
    {
      "ticket_id": "string",
      "customer_name": "string (optional)",
      "subject": "string",
      "status": "string",
      "urgency": "string",
      "assigned_to": "string (optional)",
      "created_at": "string",
      "channel": "string (optional)"
    }
  ]
}
```

#### Validation Rules
- Max 1000 records loaded from database for filtering

#### Authorization
Required permissions from function.json

#### Business Rules
- Loads all tickets (up to 1000) and filters in-memory
- `customer_name` filter is case-insensitive substring match
- Returns total count across all matches, not just the page

#### Database Operations
- Read: tickets
- Write: None

#### Events Published
None

#### Audit Logging
Not directly logged (read-only operation)

#### Error Handling
No explicit error handling — exceptions propagate

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent — same filters return same results

---

### update_ticket_record

**File**: `functions/update-ticket-record/src/handler.py`

#### Purpose
Updates ticket status and approval flag after the ticket intake workflow completes. Optionally sends email notification via Gmail if approved to send.

#### Input Schema
```json
{
  "ticket_id": "string (required) — ID of the ticket",
  "status": "string (required) — New status",
  "approved_to_send": "bool (optional) — Approval flag",
  "assigned_to": "string (optional) — Sets ticket owner",
  "human_notes": "string (optional) — Internal notes",
  "resolution_summary": "string (optional)",
  "resolution_reasoning": "string (optional)",
  "analysis_status": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "ticket_id": "string — Echoed ticket_id",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Ticket must exist (returns `not_found`)
- `status` is required

#### Authorization
Used internally by ticket-intake workflow

#### Business Rules
- Maps `assigned_to` to `owner` field in ticket record
- If `approved_to_send` and status is `approved_to_send`, sends email via Gmail connector
- Email uses `draft_reply` from ticket or `resolution_summary` as body
- Logs both successful email sends and failures

#### Database Operations
- Read: tickets, customers
- Write: tickets, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `ticket-intake workflow complete`

#### Error Handling
Email failures are caught and logged but do not block the operation

#### Retry Strategy
None — single attempt for DB, email failures logged only

#### Idempotency
Not fully idempotent — email notifications may be re-sent on retry

---

### check_ticket_urgency

**File**: `functions/check-ticket-urgency/src/handler.py`

#### Purpose
Determines if a ticket is urgent based on its urgency level. Used as a routing decision point in workflows.

#### Input Schema
```json
{
  "ticket_id": "string (required) — Ticket ID",
  "urgency": "string (required) — Urgency level",
  "classification_status": "string (optional)"
}
```

#### Output Schema
```json
{
  "routing": "string — The urgency value (routing hint)",
  "ticket_id": "string — Echoed ticket_id",
  "is_urgent": "bool — True if urgency is high or urgent"
}
```

#### Validation Rules
None

#### Authorization
No side effects — typically used as workflow condition

#### Business Rules
- `is_urgent` is true when urgency is `high` or `urgent`
- `routing` echoes the urgency value for workflow branching

#### Database Operations
- Read: None
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (pure function)

#### Error Handling
No error handling (pure function)

#### Retry Strategy
None

#### Idempotency
Fully idempotent — same input always produces same output

---

### collect_resolved_tickets

**File**: `functions/collect-resolved-tickets/src/handler.py`

#### Purpose
Collects tickets that have been resolved (closed) within a lookback window. Posts a summary to Discord for daily satisfaction monitoring.

#### Input Schema
```json
{
  "lookback_days": "int (default: 7) — Days back to search",
  "today": "date (optional) — Override date for testing",
  "max_tickets": "int (default: 50) — Max tickets to return"
}
```

#### Output Schema
```json
{
  "today": "string — ISO date",
  "lookback_days": "int",
  "total_found": "int",
  "tickets": [
    {
      "ticket_id": "string",
      "customer_name": "string",
      "subject": "string",
      "message": "string",
      "channel": "string",
      "request_type": "string",
      "urgency": "string",
      "owner": "string (optional)",
      "status": "string",
      "human_notes": "string (optional)",
      "closed_at": "string"
    }
  ]
}
```

#### Validation Rules
- `max_tickets` limits the DB list call (not applied retroactively)

#### Authorization
Required permissions from function.json

#### Business Rules
- Filters tickets by status `closed`
- Posts daily summary to Discord channel `support-reviews`
- Discord failure silently ignored
- Used for daily satisfaction monitoring workflow

#### Database Operations
- Read: tickets
- Write: None (Discord post is external)

#### Events Published
None directly

#### Audit Logging
Not directly logged (read-only aside from Discord post)

#### Error Handling
Discord failures silently ignored

#### Retry Strategy
None — single attempt

#### Idempotency
Not fully idempotent — Discord notification re-sent each call

---

## 2. Appointments

---

### create_appointment

**File**: `functions/create-appointment/src/handler.py`

#### Purpose
Creates a new service appointment for a customer. Validates customer existence and persists the appointment record.

#### Input Schema
```json
{
  "customer_id": "string (required) — UUID of the customer",
  "service_type": "string (required) — Type of service",
  "scheduled_date": "string (required) — ISO 8601 datetime",
  "duration_minutes": "int (default: 60) — Duration in minutes",
  "notes": "string (optional) — Optional notes",
  "created_by": "string (optional) — Actor who created the appointment"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "appointment_id": "string (optional) — The new appointment UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Customer must exist in `customers` table (returns error if not found)

#### Authorization
Required permissions from function.json

#### Business Rules
- Default duration is 60 minutes
- Default status is `scheduled`
- Logs action `appointment_created` in operations_log

#### Database Operations
- Read: customers
- Write: appointments, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: appointment_created

#### Error Handling
Wrapped in try/except — returns error status with exception message

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates a new appointment record

---

### assign_appointment_technician

**File**: `functions/assign-appointment-technician/src/handler.py`

#### Purpose
Assigns a technician to an appointment, updating its status to in_progress. Logs manager notes if provided.

#### Input Schema
```json
{
  "appointment_id": "string (required) — The appointment UUID",
  "technician_name": "string (required) — Name of the technician",
  "manager_notes": "string (optional) — Notes from approving manager",
  "technician_id": "string (optional) — Technician UUID"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "appointment_id": "string — Updated appointment UUID",
  "technician_name": "string — Assigned technician",
  "audit_logged": "bool — True if operations_log written",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Appointment must exist (returns `not_found`)
- `technician_name` is required

#### Authorization
Used by appointment-assignment workflow

#### Business Rules
- Sets appointment status to `in_progress`
- Appends manager notes to log entry if provided
- Logged as `appointment_technician_assigned` in operations_log

#### Database Operations
- Read: appointments
- Write: appointments, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: appointment_technician_assigned

#### Error Handling
Wrapped in try/except — returns error status with exception message

#### Retry Strategy
None — single attempt

#### Idempotency
Not fully idempotent — re-assigning may overwrite previous assignment

---

### accept_appointment

**File**: `functions/accept-appointment/src/handler.py`

#### Purpose
Allows a technician to accept an assigned appointment, updating its status to accepted.

#### Input Schema
```json
{
  "appointment_id": "string (required) — UUID of the appointment",
  "technician_id": "string (required) — UUID of the accepting technician",
  "technician_name": "string (required) — Name of the technician",
  "notes": "string (optional) — Optional notes"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "appointment_id": "string — The accepted appointment UUID",
  "technician_id": "string — The technician UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Appointment must exist (returns `not_found`)
- Appointment must have a technician assigned (returns error if not)

#### Authorization
Required permissions from function.json

#### Business Rules
- Sets status to `accepted`
- Logs action `appointment_accepted` with technician info

#### Database Operations
- Read: appointments
- Write: appointments, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: appointment_accepted

#### Error Handling
Wrapped in try/except — returns error status with exception message

#### Retry Strategy
None — single attempt

#### Idempotency
Idempotent — re-accepting same appointment updates status to accepted again

---

### complete_appointment

**File**: `functions/complete-appointment/src/handler.py`

#### Purpose
Marks an appointment as completed. Records work summary, customer signature, and parts used. Creates inventory transactions for consumed parts.

#### Input Schema
```json
{
  "appointment_id": "string (required) — UUID of the appointment",
  "completed_by": "string (required) — Actor completing the appointment",
  "work_summary": "string (optional) — Summary of work performed",
  "parts_used": [
    {
      "part_name": "string (required)",
      "quantity": "int (required)",
      "part_number": "string (optional)"
    }
  ],
  "customer_signature": "string (optional) — Base64 signature or reference"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "appointment_id": "string — Completed appointment UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Appointment must exist (returns `not_found`)
- Appointment must not already be completed (returns error)

#### Authorization
Required permissions from function.json

#### Business Rules
- Sets status to `completed` with `completed_at` timestamp
- Creates `inventory_transactions` for each part used (transaction_type: usage)
- Logs action `appointment_completed` with parts count

#### Database Operations
- Read: appointments
- Write: appointments, inventory_transactions, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: appointment_completed

#### Error Handling
Wrapped in try/except — returns error status with exception message

#### Retry Strategy
None — single attempt

#### Idempotency
Already-completed appointments return error (not idempotent)

---

### cancel_appointment

**File**: `functions/cancel-appointment/src/handler.py`

#### Purpose
Cancels an appointment with a reason, recording cancellation metadata.

#### Input Schema
```json
{
  "appointment_id": "string (required) — UUID of the appointment",
  "cancellation_reason": "string (required) — Reason for cancellation",
  "cancelled_by": "string (required) — Actor cancelling"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "appointment_id": "string — Cancelled appointment UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Appointment must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Sets status to `cancelled` with `cancelled_at` timestamp and `cancellation_reason`
- Logs action `appointment_cancelled`

#### Database Operations
- Read: appointments
- Write: appointments, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: appointment_cancelled

#### Error Handling
Wrapped in try/except — returns error status with exception message

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call overwrites cancellation metadata

---

### list_appointments

**File**: `functions/list-appointments/src/handler.py`

#### Purpose
Lists appointments with optional filters for status, technician, customer, and date range.

#### Input Schema
```json
{
  "status": "string (optional) — Filter by status",
  "technician_id": "string (optional) — Filter by technician",
  "customer_id": "string (optional) — Filter by customer",
  "scheduled_date_from": "date (optional) — Start date (inclusive)",
  "scheduled_date_to": "date (optional) — End date (inclusive)",
  "limit": "int (default: 100) — Max results"
}
```

#### Output Schema
```json
{
  "total": "int — Total matching appointments",
  "appointments": [
    {
      "appointment_id": "string",
      "customer_id": "string",
      "customer_name": "string (optional)",
      "technician_id": "string (optional)",
      "technician_name": "string (optional)",
      "service_type": "string",
      "scheduled_date": "string",
      "status": "string",
      "duration_minutes": "int",
      "notes": "string (optional)"
    }
  ]
}
```

#### Validation Rules
- Limit capped at 1000

#### Authorization
Required permissions from function.json

#### Business Rules
- Date filters converted to ISO format for querying
- Empty list returned on exception (silent failure)

#### Database Operations
- Read: appointments
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
Returns empty result on exception

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

### get_appointment

**File**: `functions/get-appointment/src/handler.py`

#### Purpose
Retrieves full details of a single appointment by UUID.

#### Input Schema
```json
{
  "appointment_id": "string (required) — UUID of the appointment"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "appointment": {
    "appointment_id": "string",
    "customer_id": "string (optional)",
    "customer_name": "string (optional)",
    "technician_id": "string (optional)",
    "technician_name": "string (optional)",
    "service_type": "string (optional)",
    "scheduled_date": "string (optional)",
    "status": "string (optional)",
    "duration_minutes": "int (optional)",
    "notes": "string (optional)",
    "work_summary": "string (optional)",
    "completed_at": "string (optional)",
    "cancelled_at": "string (optional)",
    "cancellation_reason": "string (optional)",
    "customer_signature": "string (optional)",
    "created_by": "string (optional)",
    "created_at": "string (optional)"
  },
  "error": "string (optional)"
}
```

#### Validation Rules
- Appointment must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Returns all available fields including work_summary, timestamps, signature

#### Database Operations
- Read: appointments
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
Returns `not_found` or `error` status

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

### fetch_upcoming_appointments

**File**: `functions/fetch-upcoming-appointments/src/handler.py`

#### Purpose
Fetches appointments scheduled within a configurable future window. Used by the appointment reminder workflow.

#### Input Schema
```json
{
  "today": "date (optional) — Override date for testing",
  "days_ahead": "int (default: 2) — Days ahead to look",
  "statuses": ["string"] (default: ["confirmed", "scheduled"]) — Statuses to include
}
```

#### Output Schema
```json
{
  "today": "string — ISO date",
  "count": "int — Number of upcoming appointments",
  "appointments": [
    {
      "appointment_id": "string",
      "customer_id": "string",
      "customer_name": "string",
      "technician": "string (optional)",
      "status": "string",
      "scheduled_date": "string",
      "scheduled_time": "string (optional)",
      "service_type": "string (optional)",
      "notes": "string (optional)",
      "location": "string (optional)"
    }
  ]
}
```

#### Validation Rules
- Filters by statuses list (default: confirmed, scheduled)
- Filters by date range from `today` to `today + days_ahead`

#### Authorization
Required permissions from function.json

#### Business Rules
- Calculates date window as `[today, today + days_ahead]`
- Filters appointments whose `scheduled_date` falls within the window
- Loads up to 200 records from the database

#### Database Operations
- Read: appointments
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent — same date parameters return same results

---

## 3. Technicians

---

### create_technician

**File**: `functions/create-technician/src/handler.py`

#### Purpose
Creates a new technician record with contact info, certifications, and workload configuration.

#### Input Schema
```json
{
  "name": "string (required) — Full name",
  "primary_phone": "string (optional) — Phone number",
  "primary_email": "string (optional) — Email address",
  "timezone": "string (default: UTC) — Timezone",
  "certification": "list (optional) — Certifications or skills",
  "max_daily_jobs": "int (default: 4) — Max jobs per day",
  "notes": "string (optional) — Optional notes",
  "created_by": "string (optional) — Actor creating the technician"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "technician_id": "string (optional) — New technician UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- `name` must be non-empty after stripping whitespace

#### Authorization
Required permissions from function.json

#### Business Rules
- Default availability is `available`
- Default status is `active`
- Logs action `technician_created` in operations_log

#### Database Operations
- Read: None
- Write: technicians, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: technician_created

#### Error Handling
Wrapped in try/except — returns error status with exception message

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates a new technician record

---

### update_technician

**File**: `functions/update-technician/src/handler.py`

#### Purpose
Updates an existing technician's editable fields. Only provided fields are applied.

#### Input Schema
```json
{
  "technician_id": "string (required) — UUID of the technician",
  "name": "string (optional) — Updated name",
  "primary_phone": "string (optional) — Updated phone",
  "primary_email": "string (optional) — Updated email",
  "status": "string (optional) — Updated status",
  "notes": "string (optional) — Updated notes",
  "max_daily_jobs": "int (optional) — Updated max daily jobs",
  "updated_by": "string (optional) — Actor performing update"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "technician_id": "string — Updated technician UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Technician must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Only non-None fields are applied as updates
- If no fields to update, returns success without making changes
- Logs action `technician_updated` with list of changed field names

#### Database Operations
- Read: technicians
- Write: technicians, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: technician_updated

#### Error Handling
Wrapped in try/except — returns error status with exception message

#### Retry Strategy
None — single attempt

#### Idempotency
Idempotent for same field values

---

### list_technicians

**File**: `functions/list-technicians/src/handler.py`

#### Purpose
Lists technicians with optional filters for status, availability, and minimum rating.

#### Input Schema
```json
{
  "status": "string (optional) — active, inactive",
  "availability": "string (optional) — available, busy",
  "min_rating": "float (optional) — Minimum rating",
  "limit": "int (default: 100) — Max results"
}
```

#### Output Schema
```json
{
  "total": "int — Total matching technicians",
  "technicians": [
    {
      "technician_id": "string",
      "name": "string",
      "primary_phone": "string (optional)",
      "primary_email": "string (optional)",
      "availability": "string (optional)",
      "status": "string (optional)",
      "rating": "float (optional)",
      "current_jobs_count": "int (optional)",
      "max_daily_jobs": "int (optional)"
    }
  ]
}
```

#### Validation Rules
- Limit capped at 1000

#### Authorization
Required permissions from function.json

#### Business Rules
- Returns empty list on exception (silent failure)

#### Database Operations
- Read: technicians
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
Returns empty result on exception

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

### update_technician_skills

**File**: `functions/update-technician-skills/src/handler.py`

#### Purpose
Replaces the skills/certifications list for a technician.

#### Input Schema
```json
{
  "technician_id": "string (required) — UUID of the technician",
  "skills": ["string"] (required) — List of skills to set
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "technician_id": "string — Updated technician UUID",
  "skills": ["string"] — The updated skills list",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Technician must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Replaces the entire `certification` field with the new skills list
- Logs action `technician_skills_updated` with skill names in result

#### Database Operations
- Read: technicians
- Write: technicians, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: technician_skills_updated

#### Error Handling
Wrapped in try/except — returns error status with empty skills list

#### Retry Strategy
None — single attempt

#### Idempotency
Idempotent — setting same skills list produces same result

---

## 4. CRM

---

### create_customer

**File**: `functions/create-customer/src/handler.py`

#### Purpose
Creates a new customer record and an associated account with default health settings.

#### Input Schema
```json
{
  "name": "string (required)",
  "primary_phone": "string (optional)",
  "primary_email": "string (optional)",
  "customer_type": "string (optional)",
  "timezone": "string (default: UTC)",
  "communication_prefs": "dict (optional)",
  "notes": "string (optional)",
  "tags": ["string"] (optional)",
  "created_by": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "customer_id": "string (optional) — New customer UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- `name` must be non-empty after stripping whitespace

#### Authorization
Required permissions from function.json

#### Business Rules
- Creates a corresponding `accounts` record with health=`healthy`, health_score=1.0
- Default customer status is `active`
- Logs action `create_customer` with customer_id and account_id

#### Database Operations
- Read: None
- Write: customers, accounts, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: create_customer

#### Error Handling
Returns error status if name is missing

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates a new customer+account pair

---

### update_customer

**File**: `functions/update-customer/src/handler.py`

#### Purpose
Updates an existing customer's editable fields. Only provided fields are applied.

#### Input Schema
```json
{
  "customer_id": "string (required)",
  "name": "string (optional)",
  "primary_phone": "string (optional)",
  "primary_email": "string (optional)",
  "status": "string (optional)",
  "customer_type": "string (optional)",
  "timezone": "string (optional)",
  "communication_prefs": "dict (optional)",
  "notes": "string (optional)",
  "tags": "list (optional)",
  "updated_by": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "customer_id": "string — Echoed customer_id",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Customer must exist (returns error)

#### Authorization
Required permissions from function.json

#### Business Rules
- Only non-None fields are applied
- Sets `updated_at` timestamp
- Logs action `update_customer` with list of changed field names

#### Database Operations
- Read: customers
- Write: customers, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: update_customer

#### Error Handling
Returns error status if customer not found

#### Retry Strategy
None — single attempt

#### Idempotency
Idempotent for same field values

---

### get_customer

**File**: `functions/get-customer/src/handler.py`

#### Purpose
Retrieves a customer record with optional account details.

#### Input Schema
```json
{
  "customer_id": "string (required)",
  "include_account": "bool (default: false) — Also fetch account record"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "customer": "dict (optional) — Customer record",
  "account": "dict (optional) — Account record if requested",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Customer must exist (returns error)

#### Authorization
Required permissions from function.json

#### Business Rules
- When `include_account` is true, queries `accounts` by `customer_id`
- Account lookup is optional and does not fail if missing

#### Database Operations
- Read: customers, accounts
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
Returns error status if customer not found

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

### search_customers

**File**: `functions/search-customers/src/handler.py`

#### Purpose
Searches customers by optional query string (name substring match) and filters.

#### Input Schema
```json
{
  "query": "string (optional) — Name substring search",
  "status": "string (optional) — Filter by status",
  "customer_type": "string (optional) — Filter by type",
  "limit": "int (default: 50) — Max results"
}
```

#### Output Schema
```json
{
  "total": "int — Total matching customers",
  "results": [
    {
      "customer_id": "string",
      "name": "string",
      "primary_email": "string (optional)",
      "primary_phone": "string (optional)",
      "status": "string (optional)",
      "customer_type": "string (optional)",
      "tags": ["string"]
    }
  ]
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
- `query` filter is case-insensitive substring match on name
- Combines filter-based query with client-side name filtering
- Results capped at `limit`

#### Database Operations
- Read: customers
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

### create_followup

**File**: `functions/create-followup/src/handler.py`

#### Purpose
Creates a follow-up task linked to an account. Increments the account's open_followups counter.

#### Input Schema
```json
{
  "account_id": "string (required)",
  "customer_id": "string (optional)",
  "type": "string (required)",
  "subject": "string (required)",
  "priority": "string (default: normal)",
  "due_date": "string (optional)",
  "assigned_to": "string (optional)",
  "related_ticket_id": "string (optional)",
  "related_appointment_id": "string (optional)",
  "related_dispute_id": "string (optional)",
  "notes": "string (optional)",
  "created_by": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "followup_id": "string (optional) — New followup UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Account must exist in `accounts` table (returns error)

#### Authorization
Required permissions from function.json

#### Business Rules
- Default status is `pending`
- Increments `open_followups` counter on the account record
- Logs action `create_followup` in operations_log

#### Database Operations
- Read: accounts
- Write: followups, accounts, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: create_followup

#### Error Handling
Returns error status if account not found

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates a new followup and increments counter

---

### complete_followup

**File**: `functions/complete-followup/src/handler.py`

#### Purpose
Marks a follow-up as completed. Decrements the account's open_followups counter.

#### Input Schema
```json
{
  "followup_id": "string (required)",
  "completed_by": "string (required)",
  "notes": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "followup_id": "string — Echoed followup_id",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Followup must exist (returns error)
- Followup must not already be completed (returns error)

#### Authorization
Required permissions from function.json

#### Business Rules
- Sets status to `completed`, `completed_at`, `completed_by`, `completion_notes`
- Decrements `open_followups` on the linked account (min 0)
- Logs action `complete_followup`

#### Database Operations
- Read: followups, accounts
- Write: followups, accounts, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: complete_followup

#### Error Handling
Returns error if followup not found or already completed

#### Retry Strategy
None — single attempt

#### Idempotency
Already-completed followups return error (not idempotent)

---

### list_followups

**File**: `functions/list-followups/src/handler.py`

#### Purpose
Lists follow-up tasks with optional filters for account, customer, status, assignee, and due date range.

#### Input Schema
```json
{
  "account_id": "string (optional)",
  "customer_id": "string (optional)",
  "status": "string (optional)",
  "assigned_to": "string (optional)",
  "due_date_from": "string (optional)",
  "due_date_to": "string (optional)",
  "limit": "int (default: 100)"
}
```

#### Output Schema
```json
{
  "total": "int — Total matching followups",
  "followups": [
    {
      "followup_id": "string",
      "account_id": "string",
      "customer_id": "string (optional)",
      "type": "string",
      "subject": "string",
      "status": "string",
      "priority": "string",
      "due_date": "string (optional)",
      "assigned_to": "string (optional)",
      "related_ticket_id": "string (optional)",
      "related_appointment_id": "string (optional)",
      "notes": "string (optional)"
    }
  ]
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
- Date filters are string-based comparisons on `due_date` field
- Results capped at `limit`

#### Database Operations
- Read: followups
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

### update_account_health

**File**: `functions/update-account-health/src/handler.py`

#### Purpose
Updates an account's health status and score. Records a health scan entry with risk factor analysis.

#### Input Schema
```json
{
  "account_id": "string (required)",
  "health_score": "float (required)",
  "health": "string (required) — healthy, watch, slipping, critical",
  "scan_notes": "string (optional)",
  "triggered_by": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "account_id": "string",
  "health_before": "string — Previous health state",
  "health_after": "string — New health state",
  "error": "string (optional)"
}
```

#### Validation Rules
- Account must exist (returns error)
- `health` must be one of: healthy, watch, slipping, critical

#### Authorization
Required permissions from function.json

#### Business Rules
- Creates a scan record in `account_health_scans` with before/after states
- Computes risk factors based on health degradation transitions:
  - healthy→watch: slight_degradation
  - healthy→slipping: moderate_degradation
  - healthy→critical: severe_degradation
  - watch→slipping: moderate_degradation
  - watch→critical: severe_degradation
  - slipping→critical: critical_degradation
- Adds `requires_attention` for slipping/critical, `escalation_needed` for critical
- Logs action `update_account_health`

#### Database Operations
- Read: accounts
- Write: accounts, account_health_scans, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: update_account_health

#### Error Handling
Returns error if account not found

#### Retry Strategy
None — single attempt

#### Idempotency
Not fully idempotent — creates new scan record each call

---

### update_account_health_status

**File**: `functions/update-account-health-status/src/handler.py`

#### Purpose
Workflow handler for account health monitoring. Logs the health branch taken and optionally posts critical alerts to Discord.

#### Input Schema
```json
{
  "health_category": "string (required) — healthy, warning, critical",
  "coordination_status": "string (required) — Echo for audit context",
  "today": "date (required) — ISO date of workflow run",
  "summary": "string (optional) — Agent-generated summary",
  "recovery_notes": "string (optional) — Recovery plan notes"
}
```

#### Output Schema
```json
{
  "status": "string — always 'completed'",
  "accounts_updated": "int — Number of accounts updated",
  "audit_logged": "bool — True if operations_log written"
}
```

#### Validation Rules
None

#### Authorization
Used by account_health_monitor workflow

#### Business Rules
- Logs health branch details to operations_log
- If `health_category` is `critical`, posts alert to Discord `support-alerts` channel
- Discord failure silently ignored

#### Database Operations
- Read: None
- Write: operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `account_health_monitor workflow`

#### Error Handling
Discord failures silently ignored

#### Retry Strategy
None — single attempt

#### Idempotency
Not fully idempotent — Discord alert re-sent each call

---

### account_health_scan

**File**: `functions/account-health-scan/src/handler.py`

#### Purpose
Runs a comprehensive health scan across all accounts. Evaluates engagement, followups, disputes, and relationship status to assign a health rating.

#### Input Schema
```json
{
  "today": "date (optional) — Override date",
  "lookback_days": "int (default: 120) — Engagement window",
  "write_back": "bool (default: true) — Update account health fields",
  "top_n_riskiest": "int (default: 10) — Top riskiest accounts",
  "relationship_overrides": "{account_id: string} — Override relationship statuses"
}
```

#### Output Schema
```json
{
  "today": "string",
  "scan_params": "dict",
  "totals": {
    "scanned": "int",
    "wrote_back": "int",
    "signpost_totals": "dict"
  },
  "by_health": "{healthy: int, watch: int, slipping: int, critical: int}",
  "top_risk": ["AccountHealthRow"],
  "all_rows": ["AccountHealthRow"]
}
```

#### Validation Rules
None

#### Authorization
Typically run as a scheduled script or CLI

#### Business Rules
- Loads fixtures for accounts, customers, followups, disputes, appointments
- Evaluates open followups, open/critical disputes, last contact/service dates
- Assigns health: healthy, watch, slipping, or critical
- Generates risk signposts with labels: no_contact, no_service, high_overdue_followups, open_dispute, critical_dispute, single_service_relationship, stale_relationship_status
- Sorts riskiest accounts first
- When `write_back` is true, updates account health fields

#### Database Operations
- Read: accounts, customers, followups, disputes, appointments
- Write: accounts (when write_back=true)

#### Events Published
None

#### Audit Logging
Not directly (bulk scan operation)

#### Error Handling
No explicit error handling in scan function

#### Retry Strategy
None — single pass

#### Idempotency
Idempotent — re-running with same data produces same results

---

## 5. Resolution

---

### resolve_dispute

**File**: `functions/resolve-dispute/src/handler.py`

#### Purpose
Resolves or rejects a dispute. Approving closes the dispute and optionally the linked ticket. Posts results to Discord.

#### Input Schema
```json
{
  "dispute_id": "string (required)",
  "action": "string (required) — 'approve' or 'reject'",
  "recommended_resolution": "string (optional)",
  "resolution_reason": "string (optional)",
  "confidence": "float (optional)",
  "human_notes": "string (optional)",
  "analysis_status": "string (optional)",
  "ticket_id": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "dispute_id": "string — Echoed dispute_id",
  "ticket_id": "string (optional)",
  "error": "string (optional)"
}
```

#### Validation Rules
- Dispute must exist (returns error)
- Action must be `approve` or `reject` (returns error for unknown action)

#### Authorization
Used by dispute-resolution workflow

#### Business Rules
- **Approve**: Sets dispute status to `closed`, closes linked ticket if provided, posts to Discord #support-escalations
- **Reject**: Resets dispute to status `open`, clears resolution fields for re-analysis, posts to Discord
- Discord failure silently ignored

#### Database Operations
- Read: disputes, tickets
- Write: disputes, tickets, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `dispute resolution approved` or `dispute resolution rejected`

#### Error Handling
Returns error for unknown action; Discord failures silently ignored

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — re-approving may re-close ticket

---

### resolve_dispute_v2

**File**: `functions/resolve-dispute-v2/src/handler.py`

#### Purpose
V2 dispute resolution with typed resolution types. Closes the dispute and optionally notifies the customer.

#### Input Schema
```json
{
  "dispute_id": "string (required)",
  "resolution_type": "string (required) — full_refund, partial_refund, redo_service, discount_credit, no_action, escalate_legal",
  "resolution_notes": "string (optional)",
  "resolved_by": "string (required)",
  "notify_customer": "bool (default: false)"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "dispute_id": "string",
  "resolution_type": "string",
  "error": "string (optional)"
}
```

#### Validation Rules
- Dispute must exist (returns error)
- Dispute must not already be closed (returns error)

#### Authorization
Required permissions from function.json

#### Business Rules
- Sets status to `closed` with `resolution_type`, `resolution_notes`, `resolved_by`
- If linked ticket exists and is not closed, closes it
- If `notify_customer` is true, sends notification to Discord `customer-notifications` channel and customer email via Gmail
- Email/Discord failures silently ignored

#### Database Operations
- Read: disputes, tickets
- Write: disputes, tickets, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: resolve_dispute_v2

#### Error Handling
Returns error if dispute not found or already closed; notification failures ignored

#### Retry Strategy
None — single attempt

#### Idempotency
Already-closed disputes return error (not idempotent)

---

### list_disputes

**File**: `functions/list-disputes/src/handler.py`

#### Purpose
Lists disputes with optional filters for status, customer, appointment, or ticket.

#### Input Schema
```json
{
  "status": "string (optional)",
  "customer_id": "string (optional)",
  "appointment_id": "string (optional)",
  "ticket_id": "string (optional)",
  "limit": "int (default: 100)"
}
```

#### Output Schema
```json
{
  "total": "int — Total matching disputes",
  "disputes": [
    {
      "dispute_id": "string",
      "customer_id": "string (optional)",
      "appointment_id": "string (optional)",
      "ticket_id": "string (optional)",
      "status": "string",
      "customer_claim": "string (optional)",
      "provider_claim": "string (optional)",
      "evidence_summary": "string (optional)",
      "recommended_resolution": "string (optional)",
      "confidence": "float (optional)",
      "created_at": "string (optional)"
    }
  ]
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
- Results capped at `limit`

#### Database Operations
- Read: disputes
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

## 6. Operations

---

### finalize_dispatch

**File**: `functions/finalize-dispatch/src/handler.py`

#### Purpose
Finalizes an urgent dispatch. Closes the ticket, assigns technician, and posts a Discord alert.

#### Input Schema
```json
{
  "ticket_id": "string (required) — The ticket UUID",
  "assigned_technician": "string (optional) — Technician name",
  "dispatch_notes": "string (optional) — Notes from dispatch",
  "dispatcher": "string (required) — workflow:urgent-dispatch or human:manager",
  "status": "string (required) — dispatched, manual_assignment, or escalation"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "ticket_id": "string — Echoed ticket_id",
  "audit_logged": "bool — True if operations_log written",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Ticket must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Sets ticket status to `closed`
- Optionally sets `owner` to assigned technician
- If status is `dispatched` or `manual_assignment`, posts to Discord `support-alerts`
- Discord failure silently ignored

#### Database Operations
- Read: tickets
- Write: tickets, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `urgent dispatch`

#### Error Handling
Returns `not_found` if ticket missing; Discord failures ignored

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call re-closes ticket and re-posts to Discord

---

### create_work_order

**File**: `functions/create-work-order/src/handler.py`

#### Purpose
Creates a work order linked to an appointment. Generates a UUID for the work order ID.

#### Input Schema
```json
{
  "appointment_id": "string (required) — Appointment UUID",
  "technician_id": "string (required) — Technician UUID",
  "customer_id": "string (required) — Customer UUID",
  "service_description": "string (required) — Service to perform",
  "customer_notes": "string (optional) — Customer notes",
  "created_by": "string (optional) — Actor creating the work order"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "work_order_id": "string (optional) — Created work order UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Appointment must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Generates UUID v4 for work_order_id
- Default status is `created`
- Logs action `create_work_order`

#### Database Operations
- Read: appointments
- Write: work_orders, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: create_work_order

#### Error Handling
Returns `not_found` if appointment missing

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates a new work order

---

### update_work_order

**File**: `functions/update-work-order/src/handler.py`

#### Purpose
Updates a work order with status, technician notes, parts used, photos, and signature.

#### Input Schema
```json
{
  "work_order_id": "string (required) — Work order UUID",
  "status": "string (optional) — New status",
  "technician_notes": "string (optional) — Technician notes",
  "parts_used": "[{part_id, quantity}] (optional) — Parts list",
  "photos": "[string] (optional) — Photo attachment URLs",
  "signature_ref": "string (optional) — Signature reference",
  "updated_by": "string (optional) — Actor updating"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "work_order_id": "string — Updated work order UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Work order must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Setting status to `completed` automatically sets `completed_at` timestamp
- If no updates provided, returns success without modifying anything
- Logs action `update_work_order` with changed field names

#### Database Operations
- Read: work_orders
- Write: work_orders, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: update_work_order

#### Error Handling
Returns `not_found` if work order missing

#### Retry Strategy
None — single attempt

#### Idempotency
Idempotent for same field values

---

### get_work_order

**File**: `functions/get-work-order/src/handler.py`

#### Purpose
Retrieves a full work order record by UUID.

#### Input Schema
```json
{
  "work_order_id": "string (required) — Work order UUID"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "work_order": "dict (optional) — Full work order record",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Work order must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Returns the raw record from the work_orders table

#### Database Operations
- Read: work_orders
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
Returns `not_found` if work order missing

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

### list_work_orders

**File**: `functions/list-work-orders/src/handler.py`

#### Purpose
Lists work orders with optional filters for technician, status, or appointment.

#### Input Schema
```json
{
  "technician_id": "string (optional)",
  "status": "string (optional)",
  "appointment_id": "string (optional)",
  "limit": "int (default: 100)"
}
```

#### Output Schema
```json
{
  "total": "int — Total matching work orders",
  "work_orders": [
    {
      "work_order_id": "string",
      "appointment_id": "string",
      "technician_id": "string",
      "customer_id": "string",
      "status": "string",
      "service_description": "string",
      "started_at": "string (optional)",
      "completed_at": "string (optional)",
      "parts_used": "[dict] (optional)",
      "photos": "[string] (optional)"
    }
  ]
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
None

#### Database Operations
- Read: work_orders
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

### create_inventory_item

**File**: `functions/create-inventory-item/src/handler.py`

#### Purpose
Creates a new inventory item with SKU, pricing, stock levels, and reorder settings. Validates SKU uniqueness.

#### Input Schema
```json
{
  "name": "string (required) — Display name",
  "sku": "string (required) — Unique SKU identifier",
  "description": "string (optional)",
  "category": "string (optional)",
  "unit_price_cents": "int (default: 0)",
  "quantity_on_hand": "int (default: 0)",
  "reorder_threshold": "int (default: 10)",
  "reorder_quantity": "int (default: 50)",
  "supplier_info": "string (optional)",
  "created_by": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success, conflict, or error",
  "item_id": "string (optional) — New item UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- SKU must be unique (returns `conflict` if already exists)
- Generates UUID v4 for item_id

#### Authorization
Required permissions from function.json

#### Business Rules
- Checks for existing item with same SKU before creation
- Logs action `create_inventory_item`

#### Database Operations
- Read: inventory_items
- Write: inventory_items, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: create_inventory_item

#### Error Handling
Returns `conflict` status for duplicate SKU

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — duplicate SKU returns conflict instead of creating duplicate

---

### update_inventory_item

**File**: `functions/update-inventory-item/src/handler.py`

#### Purpose
Updates an inventory item's fields. Records a transaction when quantity changes.

#### Input Schema
```json
{
  "item_id": "string (required) — Item UUID",
  "name": "string (optional)",
  "description": "string (optional)",
  "category": "string (optional)",
  "unit_price_cents": "int (optional)",
  "quantity_on_hand": "int (optional)",
  "reorder_threshold": "int (optional)",
  "reorder_quantity": "int (optional)",
  "supplier_info": "string (optional)",
  "updated_by": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "item_id": "string — Updated item UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Item must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- When `quantity_on_hand` changes, creates an `inventory_transactions` record
- Transaction records previous_quantity, new_quantity, change amount, reason `manual_update`
- Logs action `update_inventory_item` with changed field names

#### Database Operations
- Read: inventory_items
- Write: inventory_items, inventory_transactions, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: update_inventory_item

#### Error Handling
Returns `not_found` if item missing

#### Retry Strategy
None — single attempt

#### Idempotency
Not fully idempotent — quantity changes create new transaction records

---

### list_inventory

**File**: `functions/list-inventory/src/handler.py`

#### Purpose
Lists inventory items with optional category filter and low-stock-only mode.

#### Input Schema
```json
{
  "category": "string (optional) — Filter by category",
  "low_stock_only": "bool (default: false) — Only items below reorder threshold",
  "limit": "int (default: 100) — Max results"
}
```

#### Output Schema
```json
{
  "total": "int — Total matching items",
  "items": [
    {
      "item_id": "string",
      "name": "string",
      "sku": "string",
      "category": "string (optional)",
      "quantity_on_hand": "int",
      "reorder_threshold": "int",
      "unit_price_cents": "int",
      "supplier_info": "string (optional)"
    }
  ]
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
- When `low_stock_only` is true, filters items where `quantity_on_hand < reorder_threshold`

#### Database Operations
- Read: inventory_items
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

### create_followup_tasks

**File**: `functions/create-followup-tasks/src/handler.py`

#### Purpose
Creates remediation tasks from a list of health/analysis agent recommendations. Used by the followup-slippage workflow.

#### Input Schema
```json
{
  "recommendations": [
    {
      "account_id": "string (required)",
      "customer_id": "string (required)",
      "action": "string (required) — Action description",
      "priority": "string (default: normal)",
      "due_offset_days": "int (default: 3)",
      "notes": "string (optional)"
    }
  ],
  "today": "date (optional) — Override date",
  "category": "string (default: remediation)"
}
```

#### Output Schema
```json
{
  "tasks_created": "int — Number of tasks created",
  "audit_logged": "bool — True if operations_log written"
}
```

#### Validation Rules
None

#### Authorization
Used by followup-slippage workflow

#### Business Rules
- Creates tasks in the `tasks` table with status `pending`
- Due date set to `today` (regardless of `due_offset_days` field — note: offset field exists but not used in handler)
- Logs action `create_followup_tasks` with count and category

#### Database Operations
- Read: None
- Write: tasks, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: create_followup_tasks

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates new task records

---

### create_operations_tasks

**File**: `functions/create-operations-tasks/src/handler.py`

#### Purpose
Creates operational tasks from coordinator agent recommendations, targeted at specific teams (dispatch, field, office).

#### Input Schema
```json
{
  "recommendations": [
    {
      "team": "string (required) — dispatch, field, or office",
      "action": "string (required) — Action description",
      "priority": "string (default: normal)",
      "assigned_to": "string (optional)",
      "notes": "string (optional)"
    }
  ],
  "today": "date (optional) — Override date",
  "scope": "string (default: daily) — daily, weekly, or ad_hoc"
}
```

#### Output Schema
```json
{
  "tasks_created": "int — Number of tasks created",
  "teams": "[string] — Teams that received tasks",
  "audit_logged": "bool — True if operations_log written"
}
```

#### Validation Rules
None

#### Authorization
Used by daily-standup workflow

#### Business Rules
- Creates tasks in the `tasks` table with status `pending`
- Tracks unique set of teams
- Category set to `operations`
- Due date set to today
- Logs action `create_operations_tasks` with count, scope, and teams

#### Database Operations
- Read: None
- Write: tasks, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: create_operations_tasks

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates new task records

---

### finalize_slippage_review

**File**: `functions/finalize-slippage-review/src/handler.py`

#### Purpose
Finalizes a followup slippage review. Records the review outcome and optionally posts a Discord alert.

#### Input Schema
```json
{
  "slippage_counts": "dict (required) — Counts from slippage scan",
  "slipping_followups": "list (required) — List of slipping followups",
  "coordinator_summary": "string (optional) — Summary from coordinator",
  "coordinator_recommendations": "list (default: [])",
  "human_notes": "string (optional)",
  "approved": "bool (required) — Whether reminders were approved",
  "workflow_run_time": "string (required) — ISO timestamp"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "audit_logged": "bool — True if operations_log written",
  "followup_count": "int — Number of slipping followups processed",
  "error": "string (optional)"
}
```

#### Validation Rules
None

#### Authorization
Used by followup-slippage-detector workflow

#### Business Rules
- Logs detailed result with counts and up to 10 followup IDs
- If approved and slipping count > 0, posts alert to Discord `support-alerts`
- Discord failure silently ignored

#### Database Operations
- Read: None
- Write: operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `followup-slippage review`

#### Error Handling
Wrapped in try/except — returns error status on exception

#### Retry Strategy
None — single attempt

#### Idempotency
Not fully idempotent — Discord alert re-sent each call

---

### flag_slipping_followups

**File**: `functions/flag-slipping-followups/src/handler.py`

#### Purpose
Scans all followups to identify those that are slipping (overdue, due today, or due soon). Runs as a standalone script or CLI.

#### Input Schema
```json
{
  "today": "date (optional) — Override date",
  "days_ahead": "int (default: 7) — Days ahead for 'due soon'",
  "include_statuses": "[string] (default: [pending, in_progress])",
  "top_n": "int (default: 20) — Cap result size"
}
```

#### Output Schema
```json
{
  "today": "string",
  "window": "dict — Date window info",
  "counts": "dict — Slippage counts by bucket",
  "top": [
    {
      "followup_id": "string",
      "account_id": "string",
      "customer_id": "string",
      "customer_name": "string",
      "subject": "string",
      "type": "string",
      "status": "string",
      "priority": "string",
      "due_date": "string",
      "days_overdue": "int",
      "severity": "string — critical, high, medium, low",
      "bucket": "string — overdue, due_today, due_soon",
      "owner": "string (optional)",
      "related_appointment_id": "string (optional)",
      "related_ticket_id": "string (optional)",
      "notes": "string (optional)"
    }
  ]
}
```

#### Validation Rules
None

#### Authorization
Typically run as a scheduled script or CLI

#### Business Rules
- Loads followups, accounts, customers from fixtures
- Computes slippage by comparing due_date against today
- Buckets: overdue (past due), due_today, due_soon (within days_ahead)
- Assigns severity based on days_overdue
- Sorts by severity descending

#### Database Operations
- Read: followups, accounts, customers
- Write: None

#### Events Published
None

#### Audit Logging
Not directly logged (standalone scan)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single pass

#### Idempotency
Fully idempotent — same data produces same results

---

## 7. Notifications

---

### dispatch_notifications

**File**: `functions/dispatch-notifications/src/handler.py`

#### Purpose
Dispatches appointment reminder notifications via email (Gmail) or SMS (Twilio). Supports batch delivery with per-recipient failure tracking.

#### Input Schema
```json
{
  "reminders": [
    {
      "appointment_id": "string (required)",
      "customer_id": "string (required)",
      "customer_name": "string (required)",
      "channel": "string (required) — email or sms",
      "recipient": "string (required) — Email or phone",
      "message": "string (required) — Message body",
      "technician": "string (optional)"
    }
  ],
  "channels": "[string] (default: [email, sms]) — Allowed channels"
}
```

#### Output Schema
```json
{
  "dispatched": "int — Successful dispatches",
  "failures": [
    {
      "appointment_id": "string",
      "channel": "string",
      "reason": "string"
    }
  ]
}
```

#### Validation Rules
- Each reminder's channel must be in the allowed channels list

#### Authorization
Used by appointment-reminders workflow

#### Business Rules
- Email sent via `resqai-gmail` connector
- SMS sent via `resqai-twilio` connector
- Failures are collected per-recipient (channel not allowed or connector error)
- Logs total dispatched and failures count

#### Database Operations
- Read: None
- Write: operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: dispatch_notifications

#### Error Handling
Per-recipient errors collected without failing the entire batch

#### Retry Strategy
None — single attempt per recipient

#### Idempotency
Not idempotent — each call re-dispatches all reminders

---

### dispatch_notification_v2

**File**: `functions/dispatch-notification-v2/src/handler.py`

#### Purpose
Dispatches a single notification via email or SMS and persists a notification record.

#### Input Schema
```json
{
  "recipient_id": "string (required) — UUID of recipient",
  "recipient_type": "string (required) — user or customer",
  "notification_type": "string (required) — Type/category",
  "channel": "string (required) — in_app, email, or sms",
  "subject": "string (required) — Subject line",
  "body": "string (required) — Body content",
  "correlation_id": "string (optional) — For grouping"
}
```

#### Output Schema
```json
{
  "status": "string — success, sent, failed, or error",
  "notification_id": "string (optional) — Notification UUID",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- Channel must be one of: in_app, email, sms

#### Authorization
Required permissions from function.json

#### Business Rules
- For email/sms channels, dispatches via appropriate connector
- Creates a notification record with dispatch status
- Logs action `dispatch_notification_v2` with channel and status

#### Database Operations
- Read: None
- Write: notifications, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: dispatch_notification_v2

#### Error Handling
Returns `failed` status with error message on connector failure

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates new notification record

---

### send_bulk_notification

**File**: `functions/send-bulk-notification/src/handler.py`

#### Purpose
Sends the same notification template to multiple recipients via email or SMS. Persists individual notification records with per-recipient status.

#### Input Schema
```json
{
  "notification_type": "string (required)",
  "subject_template": "string (required)",
  "body_template": "string (required)",
  "recipients": [
    {
      "recipient_id": "string (required)",
      "recipient_type": "string (required) — user or customer",
      "channel": "string (required) — in_app, email, or sms",
      "recipient_address": "string (required) — Email or phone"
    }
  ],
  "correlation_id": "string (optional)"
}
```

#### Output Schema
```json
{
  "total_dispatched": "int — Number of successful dispatches",
  "results": [
    {
      "notification_id": "string",
      "recipient_id": "string",
      "status": "string — sent or failed",
      "error": "string (optional)"
    }
  ]
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
- Sends email via `resqai-gmail` or SMS via `resqai-twilio`
- Creates notification record per recipient
- Collects per-recipient status and error messages
- Returns total dispatched count

#### Database Operations
- Read: None
- Write: notifications

#### Events Published
None

#### Audit Logging
Not directly logged (notification records serve as audit trail)

#### Error Handling
Per-recipient errors collected without failing the entire batch

#### Retry Strategy
None — single attempt per recipient

#### Idempotency
Not idempotent — each call creates new notification records

---

### track_notification

**File**: `functions/track-notification/src/handler.py`

#### Purpose
Retrieves a notification by ID or correlation ID. Optionally marks it as read.

#### Input Schema
```json
{
  "notification_id": "string (optional) — UUID to find",
  "correlation_id": "string (optional) — Correlation ID to find by",
  "mark_read": "bool (default: false) — Mark as read"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "notification": "dict (optional) — Notification record",
  "error": "string (optional) — Error details"
}
```

#### Validation Rules
- At least one of `notification_id` or `correlation_id` should be provided

#### Authorization
Required permissions from function.json

#### Business Rules
- Looks up by `notification_id` first; if not found, tries `correlation_id`
- If `mark_read` is true and status is not already `read`, updates to `read`

#### Database Operations
- Read: notifications
- Write: notifications (when mark_read is true)

#### Events Published
None

#### Audit Logging
Not logged (simple lookup/update)

#### Error Handling
Returns `not_found` if no matching notification

#### Retry Strategy
None — single attempt

#### Idempotency
Idempotent — re-marking read has no additional effect

---

## 8. Analytics

---

### analytics_aggregation

**File**: `functions/analytics-aggregation/src/handler.py`

#### Purpose
Aggregates metrics across tickets, appointments, customers, and users for a given date range. Computes resolution times, status/urgency distributions, and appointment completion counts.

#### Input Schema
```json
{
  "period": "string (required) — daily, weekly, or monthly",
  "date_from": "date (required) — Start date",
  "date_to": "date (optional) — End date (defaults to date_from)"
}
```

#### Output Schema
```json
{
  "period": "string",
  "date_from": "date",
  "date_to": "date",
  "metrics": {
    "total_tickets": "int",
    "open_tickets": "int",
    "closed_tickets": "int",
    "avg_resolution_time_hours": "float",
    "total_appointments": "int",
    "completed_appointments": "int",
    "cancelled_appointments": "int",
    "total_customers": "int",
    "total_technicians": "int",
    "tickets_by_status": "dict",
    "tickets_by_urgency": "dict"
  }
}
```

#### Validation Rules
- If `date_to` is not provided, defaults to `date_from` (single-day aggregation)

#### Authorization
Required permissions from function.json

#### Business Rules
- Filters tickets and appointments by creation date within range
- Resolution time computed as hours between `created_at` and `resolved_at`/`closed_at`
- Technicians identified as users with role `technician`
- All data loaded in-memory for computation

#### Database Operations
- Read: tickets, appointments, customers, users
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent — same date range produces same metrics

---

### dashboard_metrics

**File**: `functions/dashboard-metrics/src/handler.py`

#### Purpose
Computes real-time dashboard summary metrics across all major entities: tickets, appointments, technicians, account health, and followups.

#### Input Schema
```json
{
  "include_trends": "bool (default: false) — Include trend data"
}
```

#### Output Schema
```json
{
  "tickets_summary": {
    "total": "int",
    "by_status": "dict",
    "by_urgency": "dict"
  },
  "appointments_summary": {
    "total": "int",
    "by_status": "dict"
  },
  "technician_summary": {
    "total_technicians": "int",
    "active_work_orders": "int"
  },
  "account_health_summary": {
    "total_accounts": "int",
    "average_score": "float",
    "healthy_count": "int (score >= 80)",
    "at_risk_count": "int (score < 80)"
  },
  "followup_summary": {
    "total": "int",
    "pending": "int",
    "overdue": "int"
  },
  "trends": "dict (optional) — When include_trends is true"
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
- Loads all records from 7 tables: tickets, appointments, customers, users, account_health, followups, work_orders
- Technicians identified as users with role `technician`
- Healthy accounts defined as score >= 80
- When `include_trends` is true, includes total counts as trend baseline

#### Database Operations
- Read: tickets, appointments, customers, users, account_health, followups, work_orders
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent (same data same results; trends may vary with data)

---

### create_report

**File**: `functions/create-report/src/handler.py`

#### Purpose
Creates a new analytics report definition with configuration.

#### Input Schema
```json
{
  "name": "string (required) — Report name",
  "description": "string (optional)",
  "config": "dict (required) — Config with tables, metrics, filters",
  "is_public": "bool (default: false) — Public access flag",
  "created_by": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "report_id": "string (optional) — New report UUID",
  "error": "string (optional)"
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
- Stores config as a JSON dict in `analytics_reports` table
- Sets created_at and updated_at timestamps

#### Database Operations
- Read: None
- Write: analytics_reports

#### Events Published
None

#### Audit Logging
Not directly logged

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates a new report

---

### schedule_report

**File**: `functions/schedule-report/src/handler.py`

#### Purpose
Schedules a report for recurring delivery. Validates report existence and computes next run time.

#### Input Schema
```json
{
  "report_id": "string (required) — Report UUID",
  "frequency": "string (required) — daily, weekly, or monthly",
  "recipients": "[string] (required) — Email recipients",
  "format": "string (default: pdf) — pdf, csv, xlsx",
  "is_active": "bool (default: true)"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "schedule_id": "string (optional) — New schedule UUID",
  "error": "string (optional)"
}
```

#### Validation Rules
- Report must exist in `analytics_reports` (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Computes next scheduled run: daily=+1d, weekly=+1w, monthly=+30d
- Next run always set to 06:00 UTC
- Logs action `report scheduled` with report_id and frequency

#### Database Operations
- Read: analytics_reports
- Write: analytics_schedules, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `report scheduled`

#### Error Handling
Returns `not_found` if report missing

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates a new schedule

---

### execute_report

**File**: `functions/execute-report/src/handler.py`

#### Purpose
Executes a report by evaluating its config against live data. Supports count, sum, and avg metrics across configured tables.

#### Input Schema
```json
{
  "report_id": "string (required) — Report UUID",
  "params": "dict (optional) — Override filters, date ranges"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "report_id": "string",
  "data": "dict — Report data keyed by metric/table",
  "generated_at": "string — ISO timestamp",
  "error": "string (optional)"
}
```

#### Validation Rules
- Report must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Reads report config for table definitions, filters, and metrics
- Supports metric types: `count`, `sum`, `avg`
- Merges report-level filters with runtime parameter overrides
- Logs action `report executed` with list of queried tables

#### Database Operations
- Read: analytics_reports, dynamic tables from config
- Write: operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `report executed`

#### Error Handling
Returns `not_found` if report missing

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent — same params produce same data

---

## 9. Administration

---

### create_user

**File**: `functions/create-user/src/handler.py`

#### Purpose
Creates a new user account with email, name, role, and optional auth provider configuration.

#### Input Schema
```json
{
  "email": "string (required) — Email address",
  "name": "string (required) — Display name",
  "role_id": "string (required) — Role UUID",
  "auth_provider": "string (optional) — External auth provider",
  "auth_provider_id": "string (optional) — External user ID",
  "preferences_config": "dict (optional) — Preferences JSON",
  "created_by": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "user_id": "string (optional) — New user UUID",
  "error": "string (optional)"
}
```

#### Validation Rules
- Email must contain `@` (validation via string check)
- Email must be unique (checks existing users)

#### Authorization
Required permissions from function.json

#### Business Rules
- Default status is `active`
- Logs action `user created` with email and role_id

#### Database Operations
- Read: users
- Write: users, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `user created`

#### Error Handling
Returns error for invalid email format or duplicate email

#### Retry Strategy
None — single attempt

#### Idempotency
Duplicate email returns error instead of creating duplicate

---

### update_user

**File**: `functions/update-user/src/handler.py`

#### Purpose
Updates a user's name, email, role, status, or preferences.

#### Input Schema
```json
{
  "user_id": "string (required) — User UUID",
  "name": "string (optional)",
  "email": "string (optional)",
  "role_id": "string (optional)",
  "status": "string (optional) — active, suspended, inactive",
  "preferences_config": "dict (optional)",
  "updated_by": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "user_id": "string — Echoed user_id",
  "error": "string (optional)"
}
```

#### Validation Rules
- User must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Only non-None fields are applied
- Sets `updated_at` timestamp
- Logs action `user updated` with changed field names

#### Database Operations
- Read: users
- Write: users, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `user updated`

#### Error Handling
Returns `not_found` if user missing

#### Retry Strategy
None — single attempt

#### Idempotency
Idempotent for same field values

---

### list_users

**File**: `functions/list-users/src/handler.py`

#### Purpose
Lists users with optional role and status filters.

#### Input Schema
```json
{
  "role_id": "string (optional) — Filter by role",
  "status": "string (optional) — active, suspended, inactive",
  "limit": "int (default: 100) — Max results"
}
```

#### Output Schema
```json
{
  "total": "int — Total matching users",
  "users": [
    {
      "user_id": "string",
      "email": "string",
      "name": "string",
      "role_id": "string",
      "status": "string",
      "last_login_at": "string (optional)",
      "created_at": "string"
    }
  ]
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
None

#### Database Operations
- Read: users
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

### create_role

**File**: `functions/create-role/src/handler.py`

#### Purpose
Creates a new user role with a unique name.

#### Input Schema
```json
{
  "name": "string (required) — Unique role name",
  "description": "string (optional)",
  "is_system": "bool (default: false) — System-managed role flag"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "role_id": "string (optional) — New role UUID",
  "error": "string (optional)"
}
```

#### Validation Rules
- Role name must be unique (returns error if exists)

#### Authorization
Required permissions from function.json

#### Business Rules
- Logs action `role created` with name

#### Database Operations
- Read: user_roles
- Write: user_roles, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `role created`

#### Error Handling
Returns error for duplicate role name

#### Retry Strategy
None — single attempt

#### Idempotency
Duplicate name returns error instead of creating duplicate

---

### assign_user_role

**File**: `functions/assign-user-role/src/handler.py`

#### Purpose
Assigns a role to a user, validating both user and role exist.

#### Input Schema
```json
{
  "user_id": "string (required) — User UUID",
  "role_id": "string (required) — Role UUID",
  "assigned_by": "string (required) — Actor performing assignment"
}
```

#### Output Schema
```json
{
  "status": "string — success, not_found, or error",
  "user_id": "string",
  "role_id": "string",
  "error": "string (optional)"
}
```

#### Validation Rules
- User must exist (returns `not_found`)
- Role must exist (returns `not_found`)

#### Authorization
Required permissions from function.json

#### Business Rules
- Updates `role_id` on user record with timestamp
- Logs action `user role assigned`

#### Database Operations
- Read: users, user_roles
- Write: users, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `user role assigned`

#### Error Handling
Returns `not_found` if user or role missing

#### Retry Strategy
None — single attempt

#### Idempotency
Idempotent — assigning same role to same user produces same result

---

### manage_permission

**File**: `functions/manage-permission/src/handler.py`

#### Purpose
Grants or revokes a permission (resource + action + scope) for a role.

#### Input Schema
```json
{
  "action": "string (required) — grant or revoke",
  "role_id": "string (required) — Role UUID",
  "resource": "string (required) — e.g. tickets, users_v2",
  "permission_action": "string (required) — e.g. datastore.record.read",
  "scope": "string (default: own) — own, department, all"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "role_id": "string",
  "resource": "string",
  "permission_action": "string",
  "error": "string (optional)"
}
```

#### Validation Rules
- `action` must be `grant` or `revoke`

#### Authorization
Required permissions from function.json

#### Business Rules
- **Grant**: Creates permission record if it does not already exist (idempotent create)
- **Revoke**: Deletes all matching permission records for the role+resource+action
- Logs action `permission granted` or `permission revoked`

#### Database Operations
- Read: role_permissions
- Write: role_permissions, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `permission granted` or `permission revoked`

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Idempotent — granting existing permission is a no-op; revoking non-existent permission is a no-op

---

### list_permissions

**File**: `functions/list-permissions/src/handler.py`

#### Purpose
Lists all permission assignments with optional filters for role or resource. Resolves role names.

#### Input Schema
```json
{
  "role_id": "string (optional) — Filter by role",
  "resource": "string (optional) — Filter by resource",
  "limit": "int (default: 200) — Max results"
}
```

#### Output Schema
```json
{
  "total": "int — Total matching permissions",
  "permissions": [
    {
      "permission_id": "string",
      "role_id": "string",
      "role_name": "string",
      "resource": "string",
      "action": "string",
      "scope": "string"
    }
  ]
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
- Resolves role names via cached lookups to `user_roles` table

#### Database Operations
- Read: role_permissions, user_roles
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only operation)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

### record_audit

**File**: `functions/record-audit/src/handler.py`

#### Purpose
Records a detailed audit entry capturing state changes, actor info, and metadata for compliance tracking.

#### Input Schema
```json
{
  "entity_type": "string (required) — e.g. ticket, user",
  "entity_id": "string (required) — UUID of entity",
  "action": "string (required) — e.g. created, updated, deleted",
  "actor_type": "string (required) — user, system, workflow",
  "actor_id": "string (optional) — Actor UUID",
  "previous_state": "dict (optional) — Before snapshot",
  "new_state": "dict (optional) — After snapshot",
  "changed_fields": "[string] (optional) — Changed field names",
  "ip_address": "string (optional)",
  "user_agent": "string (optional)",
  "correlation_id": "string (optional)"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "audit_id": "string (optional) — Audit entry UUID",
  "error": "string (optional)"
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
- Stores full before/after snapshots for complete audit trail
- Supports correlation_id for tracing related events across entities

#### Database Operations
- Read: None
- Write: audit_log

#### Events Published
None

#### Audit Logging
This is the dedicated audit logging function — writes to `audit_log` table

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates a new audit entry

---

### query_audit_log

**File**: `functions/query-audit-log/src/handler.py`

#### Purpose
Queries the audit log with filters for entity, action, actor, date range, and correlation ID. Supports pagination.

#### Input Schema
```json
{
  "entity_type": "string (optional)",
  "entity_id": "string (optional)",
  "action": "string (optional)",
  "actor_type": "string (optional)",
  "actor_id": "string (optional)",
  "correlation_id": "string (optional)",
  "date_from": "string (optional) — ISO timestamp",
  "date_to": "string (optional) — ISO timestamp",
  "limit": "int (default: 100)",
  "offset": "int (default: 0)"
}
```

#### Output Schema
```json
{
  "total": "int — Total matching entries",
  "entries": [
    {
      "audit_id": "string",
      "entity_type": "string",
      "entity_id": "string",
      "action": "string",
      "actor_type": "string",
      "actor_id": "string (optional)",
      "previous_state": "dict (optional)",
      "new_state": "dict (optional)",
      "changed_fields": "[string]",
      "ip_address": "string (optional)",
      "correlation_id": "string (optional)",
      "created_at": "string"
    }
  ]
}
```

#### Validation Rules
None

#### Authorization
Required permissions from function.json

#### Business Rules
- Results ordered by `-created_at` (most recent first)
- Supports pagination via offset/limit

#### Database Operations
- Read: audit_log
- Write: None

#### Events Published
None

#### Audit Logging
Reads the audit log (logged operation itself is not re-audited)

#### Error Handling
No explicit error handling

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent

---

## 10. Authentication

---

### authenticate_user

**File**: `functions/authenticate-user/src/handler.py`

#### Purpose
Authenticates a user by email. Optionally validates auth provider. Creates a session token on success.

#### Input Schema
```json
{
  "email": "string (required) — User email",
  "password": "string (optional) — Legacy password auth",
  "auth_provider": "string (optional) — OAuth provider name",
  "auth_provider_id": "string (optional) — External user ID"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "user_id": "string (optional) — Authenticated user UUID",
  "name": "string (optional) — User display name",
  "email": "string (optional) — User email",
  "role": "string (optional) — Role UUID",
  "token": "string (optional) — Session UUID (token)",
  "error": "string (optional)"
}
```

#### Validation Rules
- User must exist with matching email (returns error)
- If auth_provider provided, must match user record
- If auth_provider_id provided, must match user record

#### Authorization
Public endpoint (no auth required)

#### Business Rules
- Updates `last_login_at` on successful authentication
- Creates a `user_sessions` record with 24-hour expiration
- Session token is the session UUID returned as `token`
- Logs action `user authentication`

#### Database Operations
- Read: users
- Write: users, user_sessions, operations_log

#### Events Published
None

#### Audit Logging
Logged via `operations_log` — action: `user authentication`

#### Error Handling
Returns error for user not found or auth provider mismatch

#### Retry Strategy
None — single attempt

#### Idempotency
Not idempotent — each call creates a new session and updates last_login_at

---

### validate_session

**File**: `functions/validate-session/src/handler.py`

#### Purpose
Validates whether a session token is still valid. Checks existence, invalidation flag, and expiration.

#### Input Schema
```json
{
  "session_id": "string (required) — Session UUID to validate"
}
```

#### Output Schema
```json
{
  "status": "string — success or error",
  "user_id": "string (optional) — Associated user UUID",
  "valid": "bool — Whether session is valid",
  "error": "string (optional)"
}
```

#### Validation Rules
- Session must exist (returns valid=false with error)
- Session must not be invalidated
- Session must not be expired (compares expires_at against current UTC time)

#### Authorization
Public endpoint (no auth required)

#### Business Rules
- Returns `valid: false` with descriptive error for: not found, invalidated, or expired
- Does not modify any records

#### Database Operations
- Read: user_sessions
- Write: None

#### Events Published
None

#### Audit Logging
Not logged (read-only validation)

#### Error Handling
Returns valid=false with error message for each failure scenario

#### Retry Strategy
None — single attempt

#### Idempotency
Fully idempotent
