# ResQAI V2 — Data Contracts

> **Phase:** B.2 — Enterprise Data Layer Integration  
> **Date:** 2026-06-30  
> **Purpose:** Define data contracts between all applications and the enterprise data layer

---

## 1. Contract Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTERPRISE DATA LAYER                      │
│                    41 Tables, 235 Indexes                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  DATA ACCESS API                          │ │
│  │  READ    → SELECT (filtered, paginated, sorted)           │ │
│  │  WRITE   → INSERT (validated, audited)                    │ │
│  │  UPDATE  → UPDATE (version-checked, audited)              │ │
│  │  DELETE  → soft_delete (deleted_at set)                   │ │
│  │  SEARCH  → Full-text search via FTS indexes               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │ support   │  │ appoint   │  │ operation │  │technician │ │
│  │ -center   │  │ -center   │  │ -center   │  │ -portal   │ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │ resolution│  │   crm     │  │ customer  │  │ analytics │ │
│  │ -center   │  │ -center   │  │ -portal   │  │ -center   │ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │
│  ┌───────────┐                                                │
│  │  admin    │                                                │
│  │ -center   │                                                │
│  └───────────┘                                                │
└─────────────────────────────────────────────────────────────┘
```

## 2. Application Data Contracts

### 2.1 support-center_v2 → Enterprise Tables

| Contract | Direction | Tables | Fields | Filter |
|:---------|:---------:|:-------|:-------|:-------|
| Ticket Queue Read | → Read | tickets_v2, customers_v2, users_v2 | id, ticket_number, subject, status, priority, customer_id, assigned_to, created_at, sla_due_at | status≠closed, deleted_at IS NULL |
| Ticket Detail Read | → Read | tickets_v2, customers_v2, ticket_messages_v2, ticket_attachments_v2 | All ticket fields + messages + attachments | ticket_id = $1 |
| Ticket Create | Write → | tickets_v2 | subject, description, customer_id, channel, request_type, urgency | — |
| Ticket Update | Update → | tickets_v2 | ticket_status, assigned_to, internal_notes, priority | version check |
| Message Create | Write → | ticket_messages_v2 | ticket_id, message_body, sender_type, sender_id, message_type, is_internal | — |
| Attachment Create | Write → | ticket_attachments_v2 | ticket_id, message_id, file_name, file_path, file_size_bytes, mime_type | — |
| Customer Search | → Read | customers_v2 | id, first_name, last_name, email | text search |
| SLA Metrics | → Read | tickets_v2 | COUNT, AVG, breach count | date range, team |
| Template CRUD | ↔ CRUD | (app-local storage) | id, name, subject, body, variables | — |

### 2.2 appointment-center_v2 → Enterprise Tables

| Contract | Direction | Tables | Fields | Filter |
|:---------|:---------:|:-------|:-------|:-------|
| Appointment List | → Read | appointments_v2, customers_v2, technicians_v2 | id, scheduled_start, scheduled_end, status, customer_name, tech_name | status, technician, date range |
| Appointment Detail | → Read | appointments_v2, appointment_reminders_v2, dispatches_v2 | All fields + reminders + dispatch | id = $1 |
| Appointment Create | Write → | appointments_v2 | customer_id, technician_id, scheduled_start, scheduled_end, service_type, address_id, notes | — |
| Appointment Update | Update → | appointments_v2 | appointment_status, technician_id, notes | id, version |
| Appointment Reschedule | Update → | appointments_v2 | scheduled_start, scheduled_end, notes | id, version |
| Appointment Cancel | Update → | appointments_v2 | appointment_status='cancelled', cancellation_reason | id, version |
| Technician List | → Read | technicians_v2, technician_skills_v2 | id, name, availability, rating, skills | is_active, deleted_at IS NULL |
| Technician Schedule | → Read | appointments_v2, technicians_v2 | id, scheduled_start, scheduled_end, status | technician_id, date range |
| Service Types | → Read | reference_data_v2 | id, value, label, sort_order | category='service_type' |
| Available Slots | → Read | appointments_v2, technicians_v2 | scheduled_start, technician_id | date range, availability |

### 2.3 operations-center_v2 → Enterprise Tables

| Contract | Direction | Tables | Fields | Filter |
|:---------|:---------:|:-------|:-------|:-------|
| Dashboard Read | → Read | dispatches_v2, work_orders_v2, technicians_v2 | Aggregated counts, live metrics | date=today |
| Dispatch Queue | → Read | dispatches_v2, technicians_v2 | id, status, type, tech_name, created_at | dispatch_status='pending' |
| Dispatch Create | Write → | dispatches_v2 | technician_id, dispatch_type, appointment_id, work_order_id, notes | — |
| Dispatch Update | Update → | dispatches_v2 | dispatch_status, acknowledged_at, en_route_at, on_site_at, completed_at | id, version |
| Work Order List | → Read | work_orders_v2, tickets_v2, technicians_v2 | id, order_number, status, tech_name, scope, created_at | status, technician, date |
| Work Order Create | Write → | work_orders_v2 | ticket_id, technician_id, scope_of_work, customer_notes | — |
| Work Order Update | Update → | work_orders_v2 | work_order_status, technician_id, labor_hours, cost_cents | id, version |
| Work Order Reassign | Update → | work_orders_v2 | technician_id, internal_notes | id, version |
| Technician Status | → Read | technicians_v2, dispatches_v2 | id, name, availability, location, current_job | is_active |
| Escalation Queue | → Read | work_orders_v2, tickets_v2 | id, order_number, scope, ticket_subject | escalated status |
| Operations Timeline | → Read | work_order_stages_v2, work_orders_v2 | stage_name, entered_at, exited_at, duration | work_order_id, date |
| Task Create | Write → | tasks_v2 | title, description, priority, due_at, account_id | — |

### 2.4 technician-portal_v2 → Enterprise Tables

| Contract | Direction | Tables | Fields | Filter |
|:---------|:---------:|:-------|:-------|:-------|
| Dashboard Read | → Read | work_orders_v2, dispatches_v2, notifications_v2 | Job summary, notifications | technician_id, date=today |
| Today Jobs | → Read | work_orders_v2, appointments_v2, dispatches_v2 | id, order_number, status, scheduled_start, customer | technician_id, date=today |
| Job Detail | → Read | work_orders_v2, work_order_stages_v2, customers_v2, customer_addresses_v2 | All job fields + stages + customer + address | id = $1 |
| Job Status Update | Update → | work_orders_v2 | work_order_status, labor_hours, notes | id, version |
| Job Complete | Update → | work_orders_v2 | work_order_status='completed', completed_at, materials_used, labor_hours, cost_cents, signed_off_by, signed_off_at | id, version |
| Stage Create | Write → | work_order_stages_v2 | work_order_id, stage_name, entered_at, notes | — |
| Dispatch Acknowledge | Update → | dispatches_v2 | dispatch_status='acknowledged', acknowledged_at | id |
| Parts Request | Write → | inventory_transactions_v2 | item_id, quantity, reference_type='work_order', reference_id | — |
| Parts Lookup | → Read | inventory_items_v2 | id, sku, name, quantity_on_hand, unit_cost_cents | is_active, search |
| Service Notes | Write → | (app-local / work_order attachments) | work_order_id, note_text, created_at | — |
| Photo Upload | Write → | (app-local / work_order attachments) | work_order_id, file, metadata | — |
| Messages | ↔ CRUD | notifications_v2 | user_id, title, body, channel='in_app' | user_id |
| Profile Update | Update → | technicians_v2, users_v2 | technician_availability, current_lat, current_lng, phone | id |

### 2.5 resolution-center_v2 → Enterprise Tables

| Contract | Direction | Tables | Fields | Filter |
|:---------|:---------:|:-------|:-------|:-------|
| Dashboard Read | → Read | disputes_v2 | Aggregated counts by status | — |
| Dispute Queue | → Read | disputes_v2, customers_v2, tickets_v2 | id, dispute_number, status, reason, customer, created_at | status≠closed |
| Dispute Detail | → Read | disputes_v2, dispute_evidence_v2, tickets_v2, work_orders_v2 | All fields + evidence + related entities | id = $1 |
| Dispute Update | Update → | disputes_v2 | dispute_status, resolution_notes, resolved_by, resolved_at | id, version |
| Dispute Escalate | Update → | disputes_v2 | dispute_status='escalated', escalated_to | id, version |
| Evidence Create | Write → | dispute_evidence_v2 | dispute_id, evidence_type, file_path, file_name, description | — |
| Resolution Create | Write → | disputes_v2 | dispute_status='closed', resolution_notes, resolved_by | id, version |
| Knowledge Base | → Read | knowledge_articles_v2, knowledge_categories_v2 | title, content, category, tags | published, deleted_at IS NULL |

### 2.6 crm-center_v2 → Enterprise Tables

| Contract | Direction | Tables | Fields | Filter |
|:---------|:---------:|:-------|:-------|:-------|
| Account Dashboard | → Read | accounts_v2, customers_v2, account_health_scans_v2 | Account list with health, MRR, customer count | health condition |
| Account Detail | → Read | accounts_v2, customers_v2, followups_v2, account_health_scans_v2 | All account fields + contacts + followups + health | id = $1 |
| Account Create | Write → | accounts_v2 | account_name, account_number, subscription_tier, industry, assigned_rep_id | — |
| Account Update | Update → | accounts_v2 | account_health, subscription_tier, notes, assigned_rep_id | id, version |
| Customer Create | Write → | customers_v2 | first_name, last_name, email, phone, account_id, customer_tier | — |
| Customer Update | Update → | customers_v2 | customer_status, relationship_status, notes, last_contacted_at | id, version |
| Followup List | → Read | followups_v2, accounts_v2, customers_v2 | id, type, status, scheduled_at, assigned_to, account, customer | status, assignee, date |
| Followup Create | Write → | followups_v2 | account_id, customer_id, ticket_id, assigned_to, followup_type, scheduled_at | — |
| Followup Update | Update → | followups_v2 | followup_status, notes, outcome | id |
| Followup Attempt | Write → | followup_attempts_v2 | followup_id, attempt_number, attempt_type, outcome, response_summary | — |
| Task List | → Read | tasks_v2, task_assignments_v2 | id, title, status, priority, due_at, assignees | status, account_id |
| Task Create | Write → | tasks_v2 | title, description, priority, due_at, account_id, ticket_id | — |
| Task Update | Update → | tasks_v2 | task_status, actual_hours | id, version |
| Health Scan Create | Write → | account_health_scans_v2 | account_id, scan_score, previous_score, score_delta, account_health, scan_factors, risk_indicators | — |
| Feedback Record | Write → | feedback_v2 | ticket_id, customer_id, rating, comment, feedback_source | — |
| Feedback Read | → Read | feedback_v2, customers_v2 | All feedback fields + customer | date range, sentiment |

### 2.7 customer-portal_v2 → Enterprise Tables

| Contract | Direction | Tables | Fields | Filter |
|:---------|:---------:|:-------|:-------|:-------|
| Dashboard | → Read | customers_v2, accounts_v2, tickets_v2, appointments_v2, notifications_v2 | Profile, health, recent tickets, upcoming appointments, notifications | customer_id |
| Profile Read | → Read | customers_v2, users_v2 | Profile fields + user settings | id, user_id |
| Profile Update | Update → | customers_v2, users_v2 | first_name, last_name, email, phone, locale, timezone | id, version |
| My Tickets | → Read | tickets_v2 | id, number, subject, status, priority, created_at | customer_id, deleted_at IS NULL |
| Ticket Create | Write → | tickets_v2 | subject, description, request_type, urgency, channel='portal' | — |
| Ticket Messages | → Read | ticket_messages_v2 | id, message_body, sender_type, created_at | ticket_id |
| My Appointments | → Read | appointments_v2 | id, scheduled_start, scheduled_end, status, technician_id | customer_id |
| Appointment Book | Write → | appointments_v2 | customer_id, service_type, scheduled_start, address_id | — |
| Appointment Cancel | Update → | appointments_v2 | appointment_status='cancelled', cancellation_reason | id, customer_id |
| Disputes | → Read | disputes_v2 | id, number, status, reason, created_at | customer_id |
| Dispute Create | Write → | disputes_v2 | ticket_id, dispute_reason | — |
| Knowledge Base | → Read | knowledge_articles_v2, knowledge_categories_v2 | title, content, category | published |
| Feedback Submit | Write → | feedback_v2 | ticket_id, rating, comment, feedback_source | — |
| Notification List | → Read | notifications_v2 | id, title, body, notification_status, created_at | user_id |
| Notification Update | Update → | notifications_v2 | notification_status='read', read_at | id |
| Account Health | → Read | accounts_v2, account_health_scans_v2, followups_v2 | health, score, scans, followups | customer_id → account_id |

### 2.8 analytics-center_v2 → Enterprise Tables

| Contract | Direction | Tables | Fields | Filter |
|:---------|:---------:|:-------|:-------|:-------|
| Executive Dashboard | → Read | tickets_v2, appointments_v2, accounts_v2, disputes_v2 | Aggregate KPIs | date range |
| Support Analytics | → Read | tickets_v2, customers_v2 | Ticket metrics, trends, SLA data | date range, channel |
| Operations Analytics | → Read | tasks_v2, work_orders_v2 | Task completion, workload | date range |
| Appointment Analytics | → Read | appointments_v2, technicians_v2 | Booking metrics, status distribution | date range |
| Account Analytics | → Read | accounts_v2, followups_v2, account_health_scans_v2 | Health distribution, MRR trends | date range |
| Technician Performance | → Read | technicians_v2, work_orders_v2, feedback_v2 | Rating, completion rate, customer feedback | date range |
| Customer Analytics | → Read | customers_v2, feedback_v2, accounts_v2 | NPS, satisfaction trends, segments | date range |
| Report CRUD | ↔ CRUD | analytics_reports_v2 | All report fields | owner, type |
| Schedule CRUD | ↔ CRUD | analytics_schedules_v2 | All schedule fields | report_id |

### 2.9 admin-center_v2 → Enterprise Tables

| Contract | Direction | Tables | Fields | Filter |
|:---------|:---------:|:-------|:-------|:-------|
| Dashboard | → Read | users_v2, system_settings_v2, feature_flags_v2, audit_log_v2 | Platform overview, alerts | — |
| User CRUD | ↔ CRUD | users_v2, user_roles_v2 | All user fields + role | role, status |
| User Session List | → Read | user_sessions_v2 | Session fields | user_id |
| Force Logout | Update → | user_sessions_v2 | is_active='false' | session_id |
| Role CRUD | ↔ CRUD | user_roles_v2, role_permissions_v2 | Role fields + permission tree | — |
| Permission Update | Update → | role_permissions_v2 | is_granted | role_id, resource, action |
| Settings CRUD | ↔ CRUD | system_settings_v2 | All setting fields | category |
| Feature Flag CRUD | ↔ CRUD | feature_flags_v2 | All flag fields | group |
| Connector CRUD | ↔ CRUD | connectors_v2 | All connector fields | type |
| Audit Log | → Read | audit_log_v2, users_v2 | All audit fields + user | table, action, date |
| Event Bus | → Read | events_v2 | Event fields + metrics | type, date |
| Notification Read | → Read | notifications_v2, notification_templates_v2, notification_channels_v2 | All notification config | type, channel |

---

## 3. Cross-Application Data Flow Contracts

| Data Flow | Source App | Target App | Tables | Trigger |
|:----------|:----------:|:----------:|:-------|:--------|
| Ticket Created → Appointment | support-center_v2 | appointment-center_v2 | tickets_v2, appointments_v2 | request_type=new_booking |
| Dispatch Created → Tech Portal | operations-center_v2 | technician-portal_v2 | dispatches_v2, work_orders_v2 | dispatch.created event |
| Appointment Complete → Feedback | appointment-center_v2 | customer-portal_v2 | appointments_v2, feedback_v2 | status=completed |
| Dispute Resolved → Account Health | resolution-center_v2 | crm-center_v2 | disputes_v2, accounts_v2 | dispute_status=closed |
| Health Scan Trigger → CRM | analytics-center_v2 | crm-center_v2 | account_health_scans_v2 | scan threshold breached |
| Ticket Closed → Analytics | support-center_v2 | analytics-center_v2 | tickets_v2 | status=closed |
| User Created → All Apps | admin-center_v2 | All apps | users_v2 | user.created event |

---

> **End of DATA_CONTRACTS.md**
