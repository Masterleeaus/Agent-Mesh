# ResQAI V2 — API Endpoint Reference

> **Version:** 2.0.0
> **Generated:** 2026-06-29

## Overview

ResQAI V2 functions are deployed as Lemma Platform serverless functions. Each function is callable via the Lemma SDK or the Lemma Platform API.

**Base URL:** `{pod-api-url}/api/v1/functions/`

**Authentication:** Bearer token via Lemma SDK authentication.

---

## Endpoints

### Domain Legend

| Domain | Description |
|--------|-------------|
| Authentication & User Management | User creation, authentication, session validation, roles, and permissions |
| Customer Management | Customer CRUD and search |
| Ticket Support | Ticket intake, classification, assignment, escalation, and closure |
| Appointment Scheduling | Appointment lifecycle management |
| Work Orders | Work order CRUD and technician assignment |
| Technician Management | Technician CRUD and skills management |
| Follow-ups | Follow-up creation, completion, slippage detection, and remediation |
| Inventory | Inventory item management and tracking |
| Dispute Resolution | Dispute listing and resolution |
| Account Health | Health scoring, scanning, and status updates |
| Notifications | Notification dispatch, tracking, and bulk sending |
| Analytics & Reports | Dashboard metrics, aggregation, reports, and scheduling |
| Audit & Operations | Audit logging and querying |
| Operations Tasks | Daily operations task creation |

---

### Authentication & User Management

#### `POST /functions/authenticate_user`

**Description:** Authenticates a user by email against stored records, validates auth provider if specified, updates `last_login_at`, creates a session, and logs the operation.

**Input:**
```json
{
  "email": "user@example.com",
  "password": "plain-text-password (optional)",
  "auth_provider": "google (optional)",
  "auth_provider_id": "external-user-id (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "user_id": "uuid",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "role-uuid",
  "token": "session-uuid",
  "error": null
}
```

**Permissions Required:** `users_v2` (read, write), `user_sessions_v2` (create), `operations_log` (read, create)

---

#### `POST /functions/validate_session`

**Description:** Validates whether a session token is still active, not expired, and not invalidated.

**Input:**
```json
{
  "session_id": "session-uuid"
}
```

**Output:**
```json
{
  "status": "success",
  "user_id": "uuid",
  "valid": true,
  "error": null
}
```

**Permissions Required:** `user_sessions_v2` (read)

---

#### `POST /functions/create_user`

**Description:** Creates a new user record with validated email, unique email check, and status active.

**Input:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role_id": "role-uuid",
  "auth_provider": "google (optional)",
  "auth_provider_id": "external-id (optional)",
  "preferences_config": { "theme": "dark" },
  "created_by": "admin-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "user_id": "uuid",
  "error": null
}
```

**Permissions Required:** `users_v2` (read, create), `operations_log` (read, create)

---

#### `POST /functions/update_user`

**Description:** Updates an existing user record with provided fields and logs the operation.

**Input:**
```json
{
  "user_id": "uuid",
  "name": "New Name (optional)",
  "email": "new@example.com (optional)",
  "role_id": "new-role-uuid (optional)",
  "status": "active | suspended | inactive (optional)",
  "preferences_config": { "theme": "light" },
  "updated_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "user_id": "uuid",
  "error": null
}
```

**Permissions Required:** `users_v2` (read, write), `operations_log` (read, create)

---

#### `POST /functions/list_users`

**Description:** Lists users with optional role and status filters.

**Input:**
```json
{
  "role_id": "uuid (optional)",
  "status": "active | suspended | inactive (optional)",
  "limit": 100
}
```

**Output:**
```json
{
  "total": 50,
  "users": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role_id": "uuid",
      "status": "active",
      "last_login_at": "2026-01-01T00:00:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

**Permissions Required:** `users_v2` (read)

---

#### `POST /functions/create_role`

**Description:** Creates a new user role with unique name check and logs the operation.

**Input:**
```json
{
  "name": "admin",
  "description": "Administrator role (optional)",
  "is_system": false
}
```

**Output:**
```json
{
  "status": "success",
  "role_id": "uuid",
  "error": null
}
```

**Permissions Required:** `user_roles_v2` (read, create), `operations_log` (read, create)

---

#### `POST /functions/assign_user_role`

**Description:** Assigns a role to a user. Validates that both user and role exist.

**Input:**
```json
{
  "user_id": "uuid",
  "role_id": "uuid",
  "assigned_by": "actor-uuid"
}
```

**Output:**
```json
{
  "status": "success",
  "user_id": "uuid",
  "role_id": "uuid",
  "error": null
}
```

**Permissions Required:** `users` (read, write), `user_roles` (read), `operations_log` (create)

---

#### `POST /functions/manage_permission`

**Description:** Grants or revokes a permission on a resource for a role.

**Input:**
```json
{
  "action": "grant | revoke",
  "role_id": "uuid",
  "resource": "tickets",
  "permission_action": "datastore.record.read",
  "scope": "own | department | all"
}
```

**Output:**
```json
{
  "status": "success",
  "role_id": "uuid",
  "resource": "tickets",
  "permission_action": "datastore.record.read",
  "error": null
}
```

**Permissions Required:** `role_permissions_v2` (read, create, write), `operations_log` (read, create)

---

#### `POST /functions/list_permissions`

**Description:** Lists permissions with optional role and resource filters, including role names.

**Input:**
```json
{
  "role_id": "uuid (optional)",
  "resource": "tickets (optional)",
  "limit": 200
}
```

**Output:**
```json
{
  "total": 30,
  "permissions": [
    {
      "permission_id": "uuid",
      "role_id": "uuid",
      "role_name": "Admin",
      "resource": "tickets",
      "action": "datastore.record.read",
      "scope": "all"
    }
  ]
}
```

**Permissions Required:** `role_permissions_v2` (read), `user_roles_v2` (read)

---

### Customer Management

#### `POST /functions/create_customer`

**Description:** Creates a new customer record and a corresponding account record with default health `healthy`.

**Input:**
```json
{
  "name": "Acme Corp",
  "primary_phone": "+1234567890 (optional)",
  "primary_email": "contact@acme.com (optional)",
  "customer_type": "business (optional)",
  "timezone": "UTC",
  "communication_prefs": { "email": true, "sms": false },
  "notes": "VIP customer (optional)",
  "tags": ["vip", "enterprise"],
  "created_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "customer_id": "uuid",
  "error": null
}
```

**Permissions Required:** `customers_v2` (create), `accounts_v2` (create), `operations_log` (create)

---

#### `POST /functions/update_customer`

**Description:** Updates an existing customer record. Only fields with non-None values are applied.

**Input:**
```json
{
  "customer_id": "uuid",
  "name": "New Name (optional)",
  "primary_phone": "+1234567890 (optional)",
  "primary_email": "new@example.com (optional)",
  "status": "active (optional)",
  "customer_type": "residential (optional)",
  "timezone": "US/Eastern (optional)",
  "communication_prefs": { "email": true },
  "notes": "Updated notes (optional)",
  "tags": ["vip"],
  "updated_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "customer_id": "uuid",
  "error": null
}
```

**Permissions Required:** `customers_v2` (read, write), `operations_log` (create)

---

#### `POST /functions/get_customer`

**Description:** Retrieves a customer by ID. Optionally includes the linked account record.

**Input:**
```json
{
  "customer_id": "uuid",
  "include_account": false
}
```

**Output:**
```json
{
  "status": "success",
  "customer": { ... },
  "account": { ... },
  "error": null
}
```

**Permissions Required:** `customers_v2` (read), `accounts_v2` (read)

---

#### `POST /functions/search_customers`

**Description:** Searches for customers with optional filters by status, type, and name substring query.

**Input:**
```json
{
  "query": "Acme (optional)",
  "status": "active (optional)",
  "customer_type": "business (optional)",
  "limit": 50
}
```

**Output:**
```json
{
  "total": 5,
  "results": [
    {
      "customer_id": "uuid",
      "name": "Acme Corp",
      "primary_email": "contact@acme.com",
      "primary_phone": "+1234567890",
      "status": "active",
      "customer_type": "business",
      "tags": ["vip"]
    }
  ]
}
```

**Permissions Required:** `customers_v2` (read)

---

### Ticket Support

#### `POST /functions/create_ticket`

**Description:** Creates a new support ticket with status `new`, logs the operation, and emits a `ticket.created` event.

**Input:**
```json
{
  "customer_id": "uuid",
  "customer_name": "John Doe (optional)",
  "channel": "email | phone | web | chat",
  "subject": "Cannot login to account",
  "message": "Full description of the issue...",
  "request_type": "new_booking | complaint | billing (optional)",
  "urgency": "low | normal | high | urgent",
  "created_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "ticket_id": "uuid",
  "error": null
}
```

**Permissions Required:** `tickets_v2` (read, write), `operations_log` (read, write), `events_v2` (read, write)

---

#### `POST /functions/assign_ticket`

**Description:** Assigns a ticket to a technician or agent. Records reassignment history and emits a `ticket.assigned` event.

**Input:**
```json
{
  "ticket_id": "uuid",
  "assigned_to": "agent-or-technician-name",
  "assigned_by": "actor-uuid",
  "assignment_note": "Urgent customer request (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "ticket_id": "uuid",
  "assigned_to": "agent-name",
  "error": null
}
```

**Permissions Required:** `tickets` (read, write), `operations_log` (create), `events` (create)

---

#### `POST /functions/search_tickets`

**Description:** Searches tickets with optional filters by status, urgency, assignee, customer name, and channel. Returns paginated results.

**Input:**
```json
{
  "status": "new | classified | drafted | sent | approved_to_send | closed (optional)",
  "urgency": "low | normal | high | urgent (optional)",
  "assigned_to": "agent-name (optional)",
  "customer_name": "John (optional)",
  "channel": "email | phone | web | chat (optional)",
  "limit": 50,
  "offset": 0
}
```

**Output:**
```json
{
  "total": 25,
  "results": [
    {
      "ticket_id": "uuid",
      "customer_name": "John Doe",
      "subject": "Cannot login",
      "status": "new",
      "urgency": "high",
      "assigned_to": "agent-name",
      "created_at": "2026-06-29T10:00:00Z",
      "channel": "email"
    }
  ]
}
```

**Permissions Required:** `tickets_v2` (read)

---

#### `POST /functions/check_ticket_urgency`

**Description:** Routing function for the ticket-intake workflow. Evaluates urgency and returns a routing signal: `urgent` or `normal`.

**Input:**
```json
{
  "ticket_id": "uuid",
  "urgency": "low | normal | high | urgent",
  "classification_status": "classified (optional)"
}
```

**Output:**
```json
{
  "routing": "urgent | normal",
  "ticket_id": "uuid",
  "is_urgent": true
}
```

**Permissions Required:** None (no datastore grants)

---

#### `POST /functions/update_ticket_v2`

**Description:** Updates an existing ticket with full field support. Optionally closes the ticket when status changes to `closed`.

**Input:**
```json
{
  "ticket_id": "uuid",
  "status": "new | classified | drafted | sent | approved_to_send | closed (optional)",
  "assigned_to": "agent (optional)",
  "human_notes": "Internal notes (optional)",
  "draft_reply": "Draft response to customer (optional)",
  "approved_to_send": true (optional),
  "resolution_summary": "Issue resolved by... (optional)",
  "updated_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "ticket_id": "uuid",
  "error": null
}
```

**Permissions Required:** `tickets_v2` (read, write), `operations_log` (read, write), `events_v2` (read, write)

---

#### `POST /functions/update_ticket_record`

**Description:** Finalizes the ticket record after the intake workflow completes. Sets status to `approved_to_send`, stamps owner, resolution summary, and human notes.

**Input:**
```json
{
  "ticket_id": "uuid",
  "status": "new | classified | drafted | approved_to_send | sent | closed",
  "approved_to_send": true (optional),
  "assigned_to": "owner (optional)",
  "human_notes": "Approved by manager (optional)",
  "resolution_summary": "Recommended resolution (optional)",
  "resolution_reasoning": "Full reasoning (optional)",
  "analysis_status": "completed (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "ticket_id": "uuid",
  "error": null
}
```

**Permissions Required:** `tickets` (read, write), `operations_log` (read, write), `gmail` (connector.use)

---

#### `POST /functions/close_ticket`

**Description:** Closes a ticket with resolution details. Optionally sends an email notification to the customer.

**Input:**
```json
{
  "ticket_id": "uuid",
  "resolution_summary": "Issue was resolved by...",
  "resolution_reasoning": "Detailed reasoning (optional)",
  "closed_by": "actor-uuid",
  "send_notification": false
}
```

**Output:**
```json
{
  "status": "success",
  "ticket_id": "uuid",
  "error": null
}
```

**Permissions Required:** `tickets_v2` (read, write), `operations_log` (read, write), `events_v2` (read, write), `resqai-gmail` (connector.use)

---

#### `POST /functions/escalate_ticket`

**Description:** Escalates a ticket with reason and updated urgency. Logs the escalation and optionally sends a Discord alert.

**Input:**
```json
{
  "ticket_id": "uuid",
  "escalation_reason": "Customer threatening legal action",
  "escalated_by": "actor-uuid",
  "target_urgency": "urgent"
}
```

**Output:**
```json
{
  "status": "success",
  "ticket_id": "uuid",
  "error": null
}
```

**Permissions Required:** `tickets_v2` (read, write), `operations_log` (read, write), `events_v2` (read, write), `resqai-discord` (connector.use)

---

#### `POST /functions/collect_resolved_tickets`

**Description:** Queries tickets closed within the given window. Returns structured list for satisfaction monitoring workflow. Posts a Discord summary.

**Input:**
```json
{
  "lookback_days": 7,
  "today": "2026-06-29 (optional)",
  "max_tickets": 50
}
```

**Output:**
```json
{
  "today": "2026-06-29",
  "lookback_days": 7,
  "total_found": 12,
  "tickets": [
    {
      "ticket_id": "uuid",
      "customer_name": "John Doe",
      "subject": "Cannot login",
      "message": "...",
      "channel": "email",
      "request_type": "complaint",
      "urgency": "high",
      "owner": "agent",
      "status": "closed",
      "human_notes": "...",
      "closed_at": "2026-06-28T15:00:00Z"
    }
  ]
}
```

**Permissions Required:** `tickets` (read), `discord` (connector.use)

---

### Appointment Scheduling

#### `POST /functions/create_appointment`

**Description:** Creates a new appointment record with status `scheduled` and writes an audit log entry.

**Input:**
```json
{
  "customer_id": "uuid",
  "service_type": "HVAC Repair",
  "scheduled_date": "2026-07-01T10:00:00",
  "duration_minutes": 60,
  "notes": "Customer prefers morning (optional)",
  "created_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "appointment_id": "uuid",
  "error": null
}
```

**Permissions Required:** `customers` (read), `appointment_v2` (read, write), `operations_log` (read, write)

---

#### `POST /functions/get_appointment`

**Description:** Retrieves a single appointment by ID with full details.

**Input:**
```json
{
  "appointment_id": "uuid"
}
```

**Output:**
```json
{
  "status": "success",
  "appointment": {
    "appointment_id": "uuid",
    "customer_id": "uuid",
    "customer_name": "John Doe",
    "technician_id": "uuid",
    "technician_name": "Jane Smith",
    "service_type": "HVAC Repair",
    "scheduled_date": "2026-07-01T10:00:00",
    "status": "scheduled",
    "duration_minutes": 60,
    "notes": "...",
    "work_summary": null,
    "completed_at": null,
    "cancelled_at": null,
    "cancellation_reason": null,
    "customer_signature": null,
    "created_by": "actor",
    "created_at": "2026-06-29T10:00:00Z"
  },
  "error": null
}
```

**Permissions Required:** `appointment_v2` (read)

---

#### `POST /functions/list_appointments`

**Description:** Lists appointments with optional filters by status, technician, customer, and date range.

**Input:**
```json
{
  "status": "scheduled (optional)",
  "technician_id": "uuid (optional)",
  "customer_id": "uuid (optional)",
  "scheduled_date_from": "2026-07-01 (optional)",
  "scheduled_date_to": "2026-07-07 (optional)",
  "limit": 100
}
```

**Output:**
```json
{
  "total": 15,
  "appointments": [
    {
      "appointment_id": "uuid",
      "customer_id": "uuid",
      "customer_name": "John Doe",
      "technician_id": "uuid",
      "technician_name": "Jane Smith",
      "service_type": "HVAC Repair",
      "scheduled_date": "2026-07-01T10:00:00",
      "status": "scheduled",
      "duration_minutes": 60,
      "notes": "..."
    }
  ]
}
```

**Permissions Required:** `appointment_v2` (read)

---

#### `POST /functions/accept_appointment`

**Description:** Allows a technician to accept an appointment, updating its status to `accepted`.

**Input:**
```json
{
  "appointment_id": "uuid",
  "technician_id": "uuid",
  "technician_name": "Jane Smith",
  "notes": "Will arrive at 10 AM (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "appointment_id": "uuid",
  "technician_id": "uuid",
  "error": null
}
```

**Permissions Required:** `appointments` (read, write), `operations_log` (create)

---

#### `POST /functions/assign_appointment_technician`

**Description:** Assigns a technician to an appointment and updates status to `in_progress`.

**Input:**
```json
{
  "appointment_id": "uuid",
  "technician_name": "Jane Smith",
  "manager_notes": "Customer requested this tech (optional)",
  "technician_id": "uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "appointment_id": "uuid",
  "technician_name": "Jane Smith",
  "audit_logged": true,
  "error": null
}
```

**Permissions Required:** `appointments` (read, write), `operations_log` (create)

---

#### `POST /functions/complete_appointment`

**Description:** Marks an appointment as completed. Records completion time, optionally creates inventory transactions, and writes an audit log entry.

**Input:**
```json
{
  "appointment_id": "uuid",
  "completed_by": "technician-uuid",
  "work_summary": "Replaced compressor unit (optional)",
  "parts_used": [
    { "part_name": "Compressor", "quantity": 1, "part_number": "CMP-123" }
  ],
  "customer_signature": "base64-encoded-image (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "appointment_id": "uuid",
  "error": null
}
```

**Permissions Required:** `appointment_v2` (read, write), `inventory_transactions` (read, write), `operations_log` (read, write)

---

#### `POST /functions/cancel_appointment`

**Description:** Cancels an appointment with reason and updates status to `cancelled`.

**Input:**
```json
{
  "appointment_id": "uuid",
  "cancellation_reason": "Customer rescheduled",
  "cancelled_by": "actor-uuid"
}
```

**Output:**
```json
{
  "status": "success",
  "appointment_id": "uuid",
  "error": null
}
```

**Permissions Required:** `appointment_v2` (read, write), `operations_log` (read, write)

---

#### `POST /functions/fetch_upcoming_appointments`

**Description:** Queries appointments within a future date window and status filter. Used by the appointment-reminders workflow.

**Input:**
```json
{
  "today": "2026-06-29 (optional)",
  "days_ahead": 2,
  "statuses": ["confirmed", "scheduled"]
}
```

**Output:**
```json
{
  "today": "2026-06-29",
  "count": 8,
  "appointments": [
    {
      "appointment_id": "uuid",
      "customer_id": "uuid",
      "customer_name": "John Doe",
      "technician": "Jane Smith",
      "status": "confirmed",
      "scheduled_date": "2026-07-01",
      "scheduled_time": "10:00",
      "service_type": "HVAC Repair",
      "notes": "...",
      "location": "123 Main St"
    }
  ]
}
```

**Permissions Required:** `appointments` (read)

---

### Work Orders

#### `POST /functions/create_work_order`

**Description:** Creates a new work order for a technician appointment and logs the operation.

**Input:**
```json
{
  "appointment_id": "uuid",
  "technician_id": "uuid",
  "customer_id": "uuid",
  "service_description": "Replace HVAC compressor unit",
  "customer_notes": "Unit making loud noise (optional)",
  "created_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "work_order_id": "uuid",
  "error": null
}
```

**Permissions Required:** `appointments_v2` (read), `work_orders_v2` (create), `operations_log` (create)

---

#### `POST /functions/get_work_order`

**Description:** Retrieves a work order by its UUID and returns full details.

**Input:**
```json
{
  "work_order_id": "uuid"
}
```

**Output:**
```json
{
  "status": "success",
  "work_order": { ... },
  "error": null
}
```

**Permissions Required:** `work_orders_v2` (read)

---

#### `POST /functions/list_work_orders`

**Description:** Lists work orders with optional filters for technician, status, or appointment.

**Input:**
```json
{
  "technician_id": "uuid (optional)",
  "status": "in_progress (optional)",
  "appointment_id": "uuid (optional)",
  "limit": 100
}
```

**Output:**
```json
{
  "total": 20,
  "work_orders": [
    {
      "work_order_id": "uuid",
      "appointment_id": "uuid",
      "technician_id": "uuid",
      "customer_id": "uuid",
      "status": "in_progress",
      "service_description": "Replace compressor",
      "started_at": "2026-07-01T10:00:00Z",
      "completed_at": null,
      "parts_used": [],
      "photos": []
    }
  ]
}
```

**Permissions Required:** `work_orders_v2` (read)

---

#### `POST /functions/update_work_order`

**Description:** Updates an existing work order with status, notes, parts, photos, or signature.

**Input:**
```json
{
  "work_order_id": "uuid",
  "status": "completed (optional)",
  "technician_notes": "Unit is now operational (optional)",
  "parts_used": [{ "part_id": "uuid", "quantity": 1 }],
  "photos": ["https://...jpg"],
  "signature_ref": "https://...signature.png",
  "updated_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "work_order_id": "uuid",
  "error": null
}
```

**Permissions Required:** `work_orders_v2` (read, write), `operations_log` (create)

---

### Technician Management

#### `POST /functions/create_technician`

**Description:** Creates a new technician record with status `active` and availability `available`.

**Input:**
```json
{
  "name": "Jane Smith",
  "primary_phone": "+1234567890 (optional)",
  "primary_email": "jane@example.com (optional)",
  "timezone": "US/Eastern",
  "certification": ["HVAC", "Electrical"],
  "max_daily_jobs": 4,
  "notes": "Prefers morning shifts (optional)",
  "created_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "technician_id": "uuid",
  "error": null
}
```

**Permissions Required:** `technician_v2` (read, write), `operations_log` (read, write)

---

#### `POST /functions/list_technicians`

**Description:** Lists technicians with optional filters by status, availability, and minimum rating.

**Input:**
```json
{
  "status": "active (optional)",
  "availability": "available (optional)",
  "min_rating": 4.0,
  "limit": 100
}
```

**Output:**
```json
{
  "total": 10,
  "technicians": [
    {
      "technician_id": "uuid",
      "name": "Jane Smith",
      "primary_phone": "+1234567890",
      "primary_email": "jane@example.com",
      "availability": "available",
      "status": "active",
      "rating": 4.5,
      "current_jobs_count": 2,
      "max_daily_jobs": 4
    }
  ]
}
```

**Permissions Required:** `technician_v2` (read)

---

#### `POST /functions/update_technician`

**Description:** Updates an existing technician record with provided fields.

**Input:**
```json
{
  "technician_id": "uuid",
  "name": "New Name (optional)",
  "primary_phone": "+1234567890 (optional)",
  "primary_email": "new@example.com (optional)",
  "status": "active | inactive (optional)",
  "notes": "Updated notes (optional)",
  "max_daily_jobs": 5,
  "updated_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "technician_id": "uuid",
  "error": null
}
```

**Permissions Required:** `technician_v2` (read, write), `operations_log` (read, write)

---

#### `POST /functions/update_technician_skills`

**Description:** Updates the certification/skills list for a technician.

**Input:**
```json
{
  "technician_id": "uuid",
  "skills": ["HVAC", "Electrical", "Plumbing"]
}
```

**Output:**
```json
{
  "status": "success",
  "technician_id": "uuid",
  "skills": ["HVAC", "Electrical", "Plumbing"],
  "error": null
}
```

**Permissions Required:** `technician_v2` (read, write), `operations_log` (read, write)

---

### Follow-ups

#### `POST /functions/create_followup`

**Description:** Creates a new followup record with status `pending` for a given account. Increments the account's `open_followups` counter.

**Input:**
```json
{
  "account_id": "uuid",
  "customer_id": "uuid (optional)",
  "type": "call_back | email | site_visit",
  "subject": "Follow up on repair satisfaction",
  "priority": "normal",
  "due_date": "2026-07-06 (optional)",
  "assigned_to": "agent-name (optional)",
  "related_ticket_id": "uuid (optional)",
  "related_appointment_id": "uuid (optional)",
  "related_dispute_id": "uuid (optional)",
  "notes": "Customer reported noise again (optional)",
  "created_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "followup_id": "uuid",
  "error": null
}
```

**Permissions Required:** `accounts_v2` (read, write), `followups_v2` (create), `operations_log` (create)

---

#### `POST /functions/complete_followup`

**Description:** Marks a followup as completed. Updates status to `completed`, sets `completed_at`, and decrements the account's `open_followups` counter.

**Input:**
```json
{
  "followup_id": "uuid",
  "completed_by": "actor-uuid",
  "notes": "Customer confirmed satisfaction (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "followup_id": "uuid",
  "error": null
}
```

**Permissions Required:** `followups_v2` (read, write), `accounts_v2` (read, write), `operations_log` (create)

---

#### `POST /functions/list_followups`

**Description:** Lists followup records with optional filters and pagination.

**Input:**
```json
{
  "account_id": "uuid (optional)",
  "customer_id": "uuid (optional)",
  "status": "pending (optional)",
  "assigned_to": "agent (optional)",
  "due_date_from": "2026-07-01 (optional)",
  "due_date_to": "2026-07-07 (optional)",
  "limit": 100
}
```

**Output:**
```json
{
  "total": 25,
  "followups": [
    {
      "followup_id": "uuid",
      "account_id": "uuid",
      "customer_id": "uuid",
      "type": "call_back",
      "subject": "Follow up on repair",
      "status": "pending",
      "priority": "normal",
      "due_date": "2026-07-06",
      "assigned_to": "agent",
      "related_ticket_id": null,
      "related_appointment_id": "uuid",
      "notes": "..."
    }
  ]
}
```

**Permissions Required:** `followups_v2` (read)

---

#### `POST /functions/flag_slipping_followups`

**Description:** Deterministic scan that finds overdue/at-risk followups and ranks them by slip severity.

**Input:**
```json
{
  "today": "2026-06-29 (optional)",
  "days_ahead": 7,
  "include_statuses": ["pending", "in_progress"],
  "top_n": 20
}
```

**Output:**
```json
{
  "today": "2026-06-29",
  "window": { "days_ahead": 7, "cutoff": "2026-07-06" },
  "counts": { "overdue": 5, "due_today": 2, "due_soon": 8 },
  "top": [
    {
      "followup_id": "uuid",
      "account_id": "uuid",
      "customer_id": "uuid",
      "customer_name": "John Doe",
      "subject": "Follow up on repair",
      "type": "call_back",
      "status": "pending",
      "priority": "high",
      "due_date": "2026-06-25",
      "days_overdue": 4,
      "severity": "critical | high | medium | low",
      "bucket": "overdue | due_today | due_soon",
      "owner": "agent",
      "related_appointment_id": null,
      "related_ticket_id": null,
      "notes": null
    }
  ]
}
```

**Permissions Required:** `customers` (read), `accounts` (read), `followups` (read)

---

#### `POST /functions/finalize_slippage_review`

**Description:** Logs the result of a followup-slippage review cycle. Sends a Discord alert if slippage is detected.

**Input:**
```json
{
  "slippage_counts": { "slipping": 5, "overdue": 3, "due_today": 1, "due_soon": 1 },
  "slipping_followups": [],
  "coordinator_summary": "Agent notes",
  "coordinator_recommendations": [],
  "human_notes": "Reviewed by manager",
  "approved": true,
  "workflow_run_time": "2026-06-29T10:00:00Z"
}
```

**Output:**
```json
{
  "status": "success",
  "audit_logged": true,
  "followup_count": 5,
  "error": null
}
```

**Permissions Required:** `operations_log` (read, write), `discord` (connector.use)

---

#### `POST /functions/create_followup_tasks`

**Description:** Creates followup remediation tasks from recommendations generated by health/analysis agents.

**Input:**
```json
{
  "recommendations": [
    {
      "account_id": "uuid",
      "customer_id": "uuid",
      "action": "Call customer about overdue invoice",
      "priority": "high",
      "due_offset_days": 3,
      "notes": "Customer has not responded to emails"
    }
  ],
  "today": "2026-06-29 (optional)",
  "category": "remediation"
}
```

**Output:**
```json
{
  "tasks_created": 3,
  "audit_logged": true
}
```

**Permissions Required:** `tasks` (create), `operations_log` (create)

---

### Inventory

#### `POST /functions/create_inventory_item`

**Description:** Creates a new inventory item with a unique SKU and logs the operation.

**Input:**
```json
{
  "name": "HVAC Compressor",
  "sku": "CMP-001",
  "description": "Standard compressor unit (optional)",
  "category": "HVAC",
  "unit_price_cents": 15000,
  "quantity_on_hand": 50,
  "reorder_threshold": 10,
  "reorder_quantity": 50,
  "supplier_info": "Acme Parts Inc.",
  "created_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "item_id": "uuid",
  "error": null
}
```

**Permissions Required:** `inventory_items_v2` (create), `operations_log` (create)

---

#### `POST /functions/update_inventory_item`

**Description:** Updates an inventory item, records quantity changes as inventory transactions, and logs the operation.

**Input:**
```json
{
  "item_id": "uuid",
  "name": "New Name (optional)",
  "description": "Updated description (optional)",
  "category": "New Category (optional)",
  "unit_price_cents": 16000,
  "quantity_on_hand": 45,
  "reorder_threshold": 10,
  "reorder_quantity": 50,
  "supplier_info": "New Supplier (optional)",
  "updated_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "item_id": "uuid",
  "error": null
}
```

**Permissions Required:** `inventory_items_v2` (read, write), `inventory_transactions_v2` (create), `operations_log` (create)

---

#### `POST /functions/list_inventory`

**Description:** Lists inventory items with optional category and low-stock filters.

**Input:**
```json
{
  "category": "HVAC (optional)",
  "low_stock_only": false,
  "limit": 100
}
```

**Output:**
```json
{
  "total": 50,
  "items": [
    {
      "item_id": "uuid",
      "name": "HVAC Compressor",
      "sku": "CMP-001",
      "category": "HVAC",
      "quantity_on_hand": 45,
      "reorder_threshold": 10,
      "unit_price_cents": 15000,
      "supplier_info": "Acme Parts Inc."
    }
  ]
}
```

**Permissions Required:** `inventory_items_v2` (read)

---

### Dispute Resolution

#### `POST /functions/list_disputes`

**Description:** Lists dispute records with optional filters. Returns paginated results.

**Input:**
```json
{
  "status": "open (optional)",
  "customer_id": "uuid (optional)",
  "appointment_id": "uuid (optional)",
  "ticket_id": "uuid (optional)",
  "limit": 100
}
```

**Output:**
```json
{
  "total": 8,
  "disputes": [
    {
      "dispute_id": "uuid",
      "customer_id": "uuid",
      "appointment_id": "uuid",
      "ticket_id": "uuid",
      "status": "open",
      "customer_claim": "Service was incomplete",
      "provider_claim": "Service was completed per agreement",
      "evidence_summary": "...",
      "recommended_resolution": "Partial refund",
      "confidence": 0.85,
      "created_at": "2026-06-28T10:00:00Z"
    }
  ]
}
```

**Permissions Required:** `disputes` (read)

---

#### `POST /functions/resolve_dispute`

**Description:** Finalizes a dispute resolution after human approval. Updates dispute and related ticket. Idempotent.

**Input:**
```json
{
  "dispute_id": "uuid",
  "action": "approve | reject",
  "recommended_resolution": "Partial refund of $50 (optional)",
  "resolution_reason": "Customer partially at fault (optional)",
  "confidence": 0.85,
  "human_notes": "Approved by manager (optional)",
  "analysis_status": "completed (optional)",
  "ticket_id": "uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "dispute_id": "uuid",
  "ticket_id": "uuid",
  "error": null
}
```

**Permissions Required:** `disputes` (read, write), `tickets` (read, write), `operations_log` (read, write), `discord` (connector.use), `gmail` (connector.use)

---

#### `POST /functions/resolve_dispute_v2`

**Description:** Enhanced dispute resolution. Validates the dispute, applies resolution type, updates status to `closed`, optionally notifies customer, updates linked ticket status, and writes an audit entry.

**Input:**
```json
{
  "dispute_id": "uuid",
  "resolution_type": "full_refund | partial_refund | redo_service | discount_credit | no_action | escalate_legal",
  "resolution_notes": "Issued $50 credit (optional)",
  "resolved_by": "actor-uuid",
  "notify_customer": false
}
```

**Output:**
```json
{
  "status": "success",
  "dispute_id": "uuid",
  "resolution_type": "partial_refund",
  "error": null
}
```

**Permissions Required:** `disputes` (read, write), `tickets` (read, write), `operations_log` (create), `discord` (connector.use), `gmail` (connector.use)

---

### Account Health

#### `POST /functions/account_health_scan`

**Description:** Scans all accounts and computes health scores, risk signals, and relationship statuses. Optionally writes results back to the database.

**Input:**
```json
{
  "today": "2026-06-29 (optional)",
  "lookback_days": 120,
  "write_back": true,
  "top_n_riskiest": 10,
  "relationship_overrides": { "account-id": "active" }
}
```

**Output:**
```json
{
  "today": "2026-06-29",
  "scan_params": { "lookback_days": 120, "write_back": true, "top_n_riskiest": 10 },
  "totals": { "healthy": 40, "watch": 10, "slipping": 5, "critical": 2 },
  "by_health": { ... },
  "top_risk": [
    {
      "account_id": "uuid",
      "customer_id": "uuid",
      "name": "Acme Corp",
      "relationship_status": "active",
      "prior_health": "healthy",
      "new_health": "slipping",
      "prior_score": 85.0,
      "new_score": 62.0,
      "score_delta": -23.0,
      "open_followups": 3,
      "overdue_followups": 2,
      "open_disputes": 1,
      "days_since_last_contact": 45,
      "days_since_last_service": 60,
      "signposts": [
        { "label": "high_overdue_followups", "weight": 0.3 }
      ],
      "summary": "Account has 2 overdue followups and 1 open dispute"
    }
  ],
  "all_rows": []
}
```

**Permissions Required:** `accounts` (read, write), `followups` (read), `disputes` (read), `tickets` (read), `appointments` (read), `customers` (read), `operations_log` (create)

---

#### `POST /functions/update_account_health`

**Description:** Updates the health score and category for an account. Records previous health, creates a scan record with risk factors, and writes an audit entry.

**Input:**
```json
{
  "account_id": "uuid",
  "health_score": 75.0,
  "health": "healthy | watch | slipping | critical",
  "scan_notes": "Recent engagement improved (optional)",
  "triggered_by": "workflow:account-health-monitor (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "account_id": "uuid",
  "health_before": "slipping",
  "health_after": "watch",
  "error": null
}
```

**Permissions Required:** `accounts_v2` (read, write), `account_health_scans_v2` (create), `operations_log` (create)

---

#### `POST /functions/update_account_health_status`

**Description:** Post-processing for account health monitoring workflow. Updates relationship status based on health category and logs the audit entry. Idempotent. Sends Discord alert on critical.

**Input:**
```json
{
  "health_category": "healthy | warning | critical",
  "coordination_status": "completed",
  "today": "2026-06-29",
  "summary": "All accounts healthy (optional)",
  "recovery_notes": "Escalated to management (optional)"
}
```

**Output:**
```json
{
  "status": "completed",
  "accounts_updated": 0,
  "audit_logged": true
}
```

**Permissions Required:** `accounts` (read, write), `operations_log` (read, write), `tasks` (read, write), `discord` (connector.use)

---

### Notifications

#### `POST /functions/dispatch_notification_v2`

**Description:** Creates a notification record and dispatches it via the specified channel (`in_app`, `email`, or `sms`).

**Input:**
```json
{
  "recipient_id": "uuid",
  "recipient_type": "user | customer",
  "notification_type": "appointment_reminder",
  "channel": "in_app | email | sms",
  "subject": "Appointment Reminder",
  "body": "Your appointment is tomorrow at 10 AM",
  "correlation_id": "uuid (optional)"
}
```

**Output:**
```json
{
  "status": "sent",
  "notification_id": "uuid",
  "error": null
}
```

**Permissions Required:** `notifications_v2` (create, read, write), `operations_log` (create), `resqai-gmail` (connector.use), `resqai-twilio` (connector.use)

---

#### `POST /functions/dispatch_notifications`

**Description:** Dispatches appointment reminder notifications to technicians and customers via email or SMS using configured connectors.

**Input:**
```json
{
  "reminders": [
    {
      "appointment_id": "uuid",
      "customer_id": "uuid",
      "customer_name": "John Doe",
      "channel": "email | sms",
      "recipient": "john@example.com",
      "message": "Reminder: Your appointment is tomorrow at 10 AM",
      "technician": "Jane Smith (optional)"
    }
  ],
  "channels": ["email", "sms"]
}
```

**Output:**
```json
{
  "dispatched": 5,
  "failures": [
    { "appointment_id": "uuid", "channel": "sms", "reason": "Invalid phone number" }
  ]
}
```

**Permissions Required:** `resqai-gmail` (connector.use), `resqai-twilio` (connector.use), `operations_log` (create)

---

#### `POST /functions/send_bulk_notification`

**Description:** Dispatches notifications to multiple recipients, recording each result.

**Input:**
```json
{
  "notification_type": "promotional",
  "subject_template": "Special Offer",
  "body_template": "Dear customer, check out our special offer...",
  "recipients": [
    {
      "recipient_id": "uuid",
      "recipient_type": "customer",
      "channel": "email",
      "recipient_address": "john@example.com"
    }
  ],
  "correlation_id": "uuid (optional)"
}
```

**Output:**
```json
{
  "total_dispatched": 10,
  "results": [
    {
      "notification_id": "uuid",
      "recipient_id": "uuid",
      "status": "sent",
      "error": null
    }
  ]
}
```

**Permissions Required:** `notifications_v2` (create, read), `resqai-gmail` (connector.use), `resqai-twilio` (connector.use)

---

#### `POST /functions/track_notification`

**Description:** Finds a notification by ID or correlation ID, optionally marks it as read, and returns its details.

**Input:**
```json
{
  "notification_id": "uuid (optional)",
  "correlation_id": "uuid (optional)",
  "mark_read": false
}
```

**Output:**
```json
{
  "status": "success",
  "notification": { ... },
  "error": null
}
```

**Permissions Required:** `notifications_v2` (read, write)

---

### Analytics & Reports

#### `POST /functions/dashboard_metrics`

**Description:** Computes all dashboard KPIs from existing data including ticket, appointment, technician, account health, and follow-up summaries.

**Input:**
```json
{
  "include_trends": false
}
```

**Output:**
```json
{
  "tickets_summary": { "new": 5, "in_progress": 3, "closed": 20 },
  "appointments_summary": { "scheduled": 10, "completed": 15, "cancelled": 2 },
  "technician_summary": { "total": 8, "available": 3, "busy": 5 },
  "account_health_summary": { "healthy": 40, "slipping": 5, "critical": 2 },
  "followup_summary": { "pending": 12, "overdue": 3 },
  "trends": null
}
```

**Permissions Required:** `tickets` (read), `appointments_v2` (read), `customers` (read), `users` (read), `account_health` (read), `followups_v2` (read), `work_orders_v2` (read)

---

#### `POST /functions/analytics_aggregation`

**Description:** Aggregates metrics over a date range for tickets, appointments, customers, and technicians.

**Input:**
```json
{
  "period": "daily | weekly | monthly",
  "date_from": "2026-06-01",
  "date_to": "2026-06-29 (optional, defaults to date_from)"
}
```

**Output:**
```json
{
  "period": "weekly",
  "date_from": "2026-06-01",
  "date_to": "2026-06-29",
  "metrics": {
    "total_tickets": 45,
    "open_tickets": 8,
    "closed_tickets": 37,
    "avg_resolution_time_hours": 24.5,
    "total_appointments": 30,
    "completed_appointments": 25,
    "cancelled_appointments": 3,
    "total_customers": 60,
    "total_technicians": 8,
    "tickets_by_status": { "new": 5, "closed": 37, "in_progress": 3 },
    "tickets_by_urgency": { "low": 10, "normal": 25, "high": 7, "urgent": 3 }
  }
}
```

**Permissions Required:** `tickets` (read), `appointments` (read), `customers` (read), `users` (read)

---

#### `POST /functions/create_report`

**Description:** Creates a new analytics report configuration.

**Input:**
```json
{
  "name": "Monthly Support Report",
  "description": "Aggregated support metrics (optional)",
  "config": { "tables": ["tickets", "appointments"], "metrics": ["count", "avg_resolution"] },
  "is_public": false,
  "created_by": "actor-uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "report_id": "uuid",
  "error": null
}
```

**Permissions Required:** `analytics_reports_v2` (create)

---

#### `POST /functions/execute_report`

**Description:** Executes a report by pulling data from configured tables and returning aggregated results.

**Input:**
```json
{
  "report_id": "uuid",
  "params": { "date_from": "2026-06-01", "date_to": "2026-06-29" }
}
```

**Output:**
```json
{
  "status": "success",
  "report_id": "uuid",
  "data": { "total_tickets": 45, "avg_resolution_hours": 24.5 },
  "generated_at": "2026-06-29T10:00:00Z",
  "error": null
}
```

**Permissions Required:** `analytics_reports_v2` (read), `operations_log` (read, create)

---

#### `POST /functions/schedule_report`

**Description:** Schedules a report for recurring delivery at a specified frequency.

**Input:**
```json
{
  "report_id": "uuid",
  "frequency": "daily | weekly | monthly",
  "recipients": ["manager@example.com"],
  "format": "pdf | csv | xlsx",
  "is_active": true
}
```

**Output:**
```json
{
  "status": "success",
  "schedule_id": "uuid",
  "error": null
}
```

**Permissions Required:** `analytics_reports_v2` (read), `analytics_schedules_v2` (create), `operations_log` (read, create)

---

### Audit & Operations

#### `POST /functions/record_audit`

**Description:** Records an audit log entry for any entity action within the system.

**Input:**
```json
{
  "entity_type": "ticket",
  "entity_id": "uuid",
  "action": "updated",
  "actor_type": "user | system | workflow",
  "actor_id": "uuid (optional)",
  "previous_state": { "status": "new" },
  "new_state": { "status": "classified" },
  "changed_fields": ["status"],
  "ip_address": "192.168.1.1 (optional)",
  "user_agent": "Mozilla/5.0... (optional)",
  "correlation_id": "uuid (optional)"
}
```

**Output:**
```json
{
  "status": "success",
  "audit_id": "uuid",
  "error": null
}
```

**Permissions Required:** `audit_log_v2` (create)

---

#### `POST /functions/query_audit_log`

**Description:** Queries the audit log with comprehensive filters, ordered by `created_at` descending.

**Input:**
```json
{
  "entity_type": "ticket (optional)",
  "entity_id": "uuid (optional)",
  "action": "updated (optional)",
  "actor_type": "user (optional)",
  "actor_id": "uuid (optional)",
  "correlation_id": "uuid (optional)",
  "date_from": "2026-06-01T00:00:00Z (optional)",
  "date_to": "2026-06-29T23:59:59Z (optional)",
  "limit": 100,
  "offset": 0
}
```

**Output:**
```json
{
  "total": 200,
  "entries": [
    {
      "audit_id": "uuid",
      "entity_type": "ticket",
      "entity_id": "uuid",
      "action": "updated",
      "actor_type": "user",
      "actor_id": "uuid",
      "previous_state": { "status": "new" },
      "new_state": { "status": "classified" },
      "changed_fields": ["status"],
      "ip_address": "192.168.1.1",
      "correlation_id": "uuid",
      "created_at": "2026-06-29T10:00:00Z"
    }
  ]
}
```

**Permissions Required:** `audit_log_v2` (read)

---

### Operations Tasks

#### `POST /functions/create_operations_tasks`

**Description:** Creates daily operations tasks from the operations-coordinator agent's recommendations.

**Input:**
```json
{
  "recommendations": [
    {
      "team": "dispatch | field | office",
      "action": "Schedule follow-up inspection",
      "priority": "normal",
      "assigned_to": "dispatcher-1 (optional)",
      "notes": "Customer called about noise (optional)"
    }
  ],
  "today": "2026-06-29 (optional)",
  "scope": "daily | weekly | ad_hoc"
}
```

**Output:**
```json
{
  "tasks_created": 5,
  "teams": ["dispatch", "field"],
  "audit_logged": true
}
```

**Permissions Required:** `tasks` (create), `operations_log` (create)

---

## Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success — the operation completed as expected |
| 400 | Validation error — invalid input parameters |
| 404 | Resource not found — the specified entity does not exist |
| 409 | Conflict — duplicate key or conflicting state |
| 500 | Internal error — unexpected server-side failure |

## Common Rate Limit

All functions: **100 requests per minute** per pod instance.

## Error Output Pattern

All functions follow a consistent error output pattern:

```json
{
  "status": "error",
  "error": "Human-readable error description",
  "...": "Type-specific fields may still be present"
}
```

## Notes

- All timestamps use ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`).
- UUIDs are version 4 UUID strings.
- Empty or `null` optional fields are omitted from output where practical.
- Paginated list endpoints return `total` (total matching count) alongside results.
- Functions tagged *Idempotent* can be safely re-run with the same inputs.
