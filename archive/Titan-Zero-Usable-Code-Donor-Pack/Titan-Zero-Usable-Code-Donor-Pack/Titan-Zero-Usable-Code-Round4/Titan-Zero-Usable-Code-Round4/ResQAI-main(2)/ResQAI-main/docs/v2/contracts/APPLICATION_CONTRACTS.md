# RESQAI V2 — Application Integration Contracts

> Phase 3.3 — Integration Contracts  
> Principal Enterprise Solution Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Contract Format](#1-contract-format)
2. [support-center_v2](#2-support-center_v2)
3. [operations-center_v2](#3-operations-center_v2)
4. [appointment-center_v2](#4-appointment-center_v2)
5. [technician-portal_v2](#5-technician-portal_v2)
6. [resolution-center_v2](#6-resolution-center_v2)
7. [crm-center_v2](#7-crm-center_v2)
8. [analytics-center_v2](#8-analytics-center_v2)
9. [customer-portal_v2](#9-customer-portal_v2)
10. [admin-center_v2](#10-admin-center_v2)

---

## 1. Contract Format

### Application Contract Template

```
### Application: {name}

#### Frontend Responsibilities
{list}

#### Backend Responsibilities
{list}

#### Shared Responsibilities
{list}
```

### Page Contract Template

```
#### Page: {name} ({route})

**Data Required:** {list}
**Data Produced:** {list}
**API Calls:** {list}
**Future Function Calls:** {list}
**Future Workflow Triggers:** {list}
**Future Agent Requests:** {list}
**Notifications:** {list}
**Permissions:** {list}
**Events Produced:** {list}
**Events Consumed:** {list}
```

### Widget Contract Template

```
##### Widget: {name}

**Input Contract:** {schema}
**Output Contract:** {schema}
**Refresh Strategy:** {strategy}
**Caching Strategy:** {strategy}
**Offline Behavior:** {behavior}
**Loading Strategy:** {strategy}
```

### Table Contract Template

```
##### Table: {name}

**Source Table:** {table}
**Expected Columns:** {list}
**Sorting:** {columns}
**Filtering:** {columns}
**Searching:** {columns}
**Pagination:** {default/pageSize}
**Relationships:** {list}
**Live Updates:** {yes/no}
```

### Form Contract Template

```
##### Form: {name}

**Validation Contract:** {rules}
**Submission Contract:** {target}
**Response Contract:** {schema}
**Failure Contract:** {schema}
**Permission Contract:** {permission}
```

### Action Contract Template

```
##### Action: {name}

**Required Permission:** {permission}
**Backend Function:** {function}
**Workflow Trigger:** {workflow}
**Agent Trigger:** {agent}
**Database Update:** {table/columns}
**Notification:** {type/channel}
**Audit Log:** {entry}
```

---

## 2. support-center_v2

### Application Contract

#### Frontend Responsibilities
- Render ticket queue with real-time updates
- Display ticket detail with message thread and timeline
- Provide AI-assisted reply drafting UI
- Show SLA countdown timers in real time
- Manage ticket lifecycle (create, classify, draft, approve, close)
- Handle escalation workflow UI
- Manage reply templates
- Display agent performance metrics

#### Backend Responsibilities
- Serve ticket records with filtering, sorting, pagination
- Execute ticket state transitions with validation
- Run urgency classification and SLA tier determination
- Manage ticket assignment and ownership
- Emit lifecycle events on every state change
- Audit all mutations to audit_log_v2
- Enforce role-based access on all operations

#### Shared Responsibilities
- Ticket data consistency between frontend cache and backend state
- Real-time synchronization via event stream
- AI classification results surfaced promptly to agent
- Approval workflow coordination between multiple agents

---

### Page Contracts

#### Page: TicketQueuePage (`/tickets`)

**Data Required:** tickets_v2 (paginated, filtered), customers_v2 (lookup), operations_log_v2 (recent activity)
**Data Produced:** Ticket selection state, filter criteria, sort configuration
**API Calls:** GET /api/v2/tickets (paginated, filtered, sorted), GET /api/v2/tickets/:id, GET /api/v2/customers/search
**Future Function Calls:** check-ticket-urgency, classify-ticket-sla-tier
**Future Workflow Triggers:** ticket-intake_v2 (on new ticket), sla-enforcement_v2
**Future Agent Requests:** request-classifier_v2, support-reply-drafter_v2
**Notifications:** New ticket assigned (in-app), SLA breach warning (in-app)
**Permissions:** view_tickets, create_ticket
**Events Produced:** None (pass-through)
**Events Consumed:** ticket.created, ticket.status.changed, ticket.classified, notification.new

#### Page: TicketDetailPage (`/tickets/:id`)

**Data Required:** tickets_v2 (single record), ticket_messages_v2 (thread), ticket_attachments_v2, operations_log_v2 (timeline), customers_v2
**Data Produced:** Draft reply content, status update action, assignment change
**API Calls:** GET /api/v2/tickets/:id, GET /api/v2/tickets/:id/messages, PUT /api/v2/tickets/:id/status, PUT /api/v2/tickets/:id/assign
**Future Function Calls:** update-ticket-record, check-sla-deadline
**Future Workflow Triggers:** ticket-escalation_v2 (on escalate), support-escalation-manager_v2
**Future Agent Requests:** support-reply-drafter_v2 (draft reply)
**Notifications:** @mention (in-app), SLA breach (in-app)
**Permissions:** view_tickets, draft_reply, escalate
**Events Produced:** ticket.reply.drafted, ticket.status.changed, ticket.escalated
**Events Consumed:** ticket.reply.sent, ticket.status.changed, notification.new

#### Page: NewTicketPage (`/tickets/new`)

**Data Required:** customers_v2 (search), system_settings_v2 (request types)
**Data Produced:** New ticket_v2 record
**API Calls:** POST /api/v2/tickets, GET /api/v2/customers/search
**Future Function Calls:** validate-ticket-input, check-ticket-urgency
**Future Workflow Triggers:** ticket-intake_v2
**Future Agent Requests:** request-classifier_v2
**Notifications:** Ticket created confirmation (in-app)
**Permissions:** create_ticket
**Events Produced:** ticket.created
**Events Consumed:** None

#### Page: MyTicketsPage (`/my-tickets`)

**Data Required:** tickets_v2 (filtered by assigned_owner = current user)
**Data Produced:** Ticket selection, filter state
**API Calls:** GET /api/v2/tickets?assigned_owner={userId}
**Future Function Calls:** None
**Future Workflow Triggers:** None
**Future Agent Requests:** None
**Notifications:** None
**Permissions:** view_tickets
**Events Produced:** None
**Events Consumed:** ticket.status.changed, ticket.assigned, notification.new

#### Page: EscalationsPage (`/escalations`)

**Data Required:** tickets_v2 (filtered: escalation_level > 0), operations_log_v2 (escalation events)
**Data Produced:** Escalation action (resolve, reassign)
**API Calls:** GET /api/v2/tickets?escalated=true, PUT /api/v2/tickets/:id/escalation
**Future Function Calls:** update-ticket-record
**Future Workflow Triggers:** support-escalation-manager_v2
**Future Agent Requests:** None
**Notifications:** New escalation (in-app, email)
**Permissions:** escalate, manage_queues
**Events Produced:** ticket.escalated
**Events Consumed:** ticket.escalated, ticket.status.changed

#### Page: SLADashboardPage (`/sla`)

**Data Required:** tickets_v2 (SLA metrics aggregated), system_settings_v2 (SLA config)
**Data Produced:** SLA filter configuration
**API Calls:** GET /api/v2/sla/summary, GET /api/v2/sla/breaches
**Future Function Calls:** check-sla-deadline, batch-sla-check
**Future Workflow Triggers:** sla-enforcement_v2
**Future Agent Requests:** None
**Notifications:** SLA breach (in-app, email, discord)
**Permissions:** view_sla
**Events Produced:** None
**Events Consumed:** ticket.sla_breached

#### Page: TemplatesPage (`/templates`)

**Data Required:** notification_templates_v2 (reply templates)
**Data Produced:** Template CRUD actions
**API Calls:** GET /api/v2/templates, POST /api/v2/templates, PUT /api/v2/templates/:id, DELETE /api/v2/templates/:id
**Future Function Calls:** render-notification-template
**Future Workflow Triggers:** None
**Future Agent Requests:** None
**Notifications:** None
**Permissions:** manage_templates
**Events Produced:** None
**Events Consumed:** None

#### Page: QueueSettingsPage (`/settings`)

**Data Required:** system_settings_v2 (queue config, routing rules)
**Data Produced:** Settings updates
**API Calls:** GET /api/v2/settings/queue, PUT /api/v2/settings/queue
**Future Function Calls:** validate-config-change, apply-config-change
**Future Workflow Triggers:** system-config-management_v2
**Future Agent Requests:** None
**Notifications:** None
**Permissions:** manage_queues
**Events Produced:** None
**Events Consumed:** system.config.changed

---

### Widget Contracts

##### Widget: TicketList

**Input Contract:** filters (status, priority, channel, dateRange, assignedTo), sortConfig (field, direction), pagination (page, pageSize)
**Output Contract:** tickets (TicketVM[]), totalCount, page, pageSize, loading, error
**Refresh Strategy:** Poll every 30s + event-driven refresh on ticket.created, ticket.status.changed
**Caching Strategy:** In-memory cache with 60s TTL; invalidated on mutation
**Offline Behavior:** Display last cached data with stale indicator; mutations queued
**Loading Strategy:** Skeleton placeholders (12 rows)

##### Widget: TicketDetailPanel

**Input Contract:** ticketId (uuid)
**Output Contract:** ticket (TicketDetailVM), messages (MessageVM[]), timeline (TimelineEvent[]), loading, error
**Refresh Strategy:** Event-driven on ticket.status.changed, ticket.reply.sent
**Caching Strategy:** In-memory cache per ticketId; invalidated on mutation
**Offline Behavior:** Show cached ticket with stale indicator; disable mutations
**Loading Strategy:** Skeleton detail layout

##### Widget: SLAStopwatch

**Input Contract:** ticketId, slaDeadline (timestamp)
**Output Contract:** timeRemaining (ms), percentageElapsed, status (ok|warning|breached)
**Refresh Strategy:** Real-time tick every 1s; recalculated on status change
**Caching Strategy:** None (real-time)
**Offline Behavior:** Pause timer; resume on reconnection with server reconciliation
**Loading Strategy:** Static "calculating..." placeholder

---

### Table Contracts

##### Table: Tickets

**Source Table:** tickets_v2
**Expected Columns:** id, customer_id, customer_name, subject, request_type, channel, urgency, status, assigned_owner, escalation_level, sla_deadline, created_at, updated_at
**Sorting:** created_at (default DESC), urgency, status, priority, updated_at
**Filtering:** status (multi-select), urgency, channel, request_type, assigned_owner, dateRange (created_at), escalation_level
**Searching:** subject (partial match), customer_name, ticket_id
**Pagination:** 25 default, max 100
**Relationships:** customers_v2 (customer_id), ticket_messages_v2 (ticket_id), ticket_attachments_v2 (ticket_id), operations_log_v2 (entity_id = ticket_id)
**Live Updates:** Yes — subscribeToTable on tickets_v2

##### Table: Ticket Messages

**Source Table:** ticket_messages_v2
**Expected Columns:** id, ticket_id, author_type, author_id, content, content_type, created_at
**Sorting:** created_at ASC
**Filtering:** ticket_id
**Searching:** content (full-text)
**Pagination:** 50 default, max 200
**Relationships:** tickets_v2 (ticket_id)
**Live Updates:** Yes — subscribeToTable on ticket_messages_v2

---

### Form Contracts

##### Form: NewTicket

**Validation Contract:** subject (required, 3-200 chars), message (required, 10-5000 chars), request_type (required, enum), channel (required, enum), customer_id (required, valid uuid), phone or email (at least one)
**Submission Contract:** POST /api/v2/tickets with CreateTicketRequest DTO
**Response Contract:** 201 — TicketResponse (id, status, created_at, customer_id)
**Failure Contract:** 400 — ValidationErrorResponse (field errors array), 409 — DuplicateTicketResponse
**Permission Contract:** create_ticket

##### Form: ReplyDraft

**Validation Contract:** ticket_id (required, valid uuid, status in [new, in_progress, waiting]), message_content (required, 1-10000 chars), use_ai_draft (optional boolean)
**Submission Contract:** PUT /api/v2/tickets/:id/draft with DraftReplyRequest DTO
**Response Contract:** 200 — DraftReplyResponse (draft_id, created_at, ticket_id)
**Failure Contract:** 400 — ValidationErrorResponse, 403 — InsufficientPermissionsResponse, 409 — TicketClosedResponse
**Permission Contract:** draft_reply

##### Form: ApproveReply

**Validation Contract:** ticket_id (required), draft_id (required), approval (required, enum: approve|reject), manager_notes (optional, max 1000 chars)
**Submission Contract:** PUT /api/v2/tickets/:id/draft/approve with ApproveReplyRequest DTO
**Response Contract:** 200 — ApproveReplyResponse (ticket_id, new_status, approved_by)
**Failure Contract:** 400 — ValidationErrorResponse, 403 — InsufficientPermissionsResponse
**Permission Contract:** approve_reply

---

### Action Contracts

##### Action: CreateTicket

**Required Permission:** create_ticket
**Backend Function:** validate-ticket-input (pre-validation)
**Workflow Trigger:** ticket-intake_v2
**Agent Trigger:** request-classifier_v2
**Database Update:** INSERT into tickets_v2
**Notification:** Ticket created confirmation (in-app) to creator
**Audit Log:** ticket.created — actor, customer_id, subject, request_type, channel

##### Action: EscalateTicket

**Required Permission:** escalate
**Backend Function:** update-ticket-record
**Workflow Trigger:** support-escalation-manager_v2
**Agent Trigger:** None
**Database Update:** UPDATE tickets_v2 SET escalation_level, status
**Notification:** Ticket escalated (in-app, email) to manager, assignee
**Audit Log:** ticket.escalated — actor, escalation_level, reason, previous_level

##### Action: ApproveReply

**Required Permission:** approve_reply
**Backend Function:** update-ticket-record
**Workflow Trigger:** None
**Agent Trigger:** None
**Database Update:** UPDATE tickets_v2 SET status = 'approved_to_send'
**Notification:** Reply ready to send (in-app) to agent
**Audit Log:** ticket.reply.approved — actor, draft_id, ticket_id

---

## 3. operations-center_v2

### Application Contract

#### Frontend Responsibilities
- Render operations dashboard with aggregated KPIs
- Display task kanban board with drag-and-drop
- Show dispatch center with real-time urgent queue
- Present daily standup reports
- Visualize technician workload

#### Backend Responsibilities
- Aggregate cross-domain KPI data
- Serve task records with kanban-compatible status groupings
- Manage dispatch lifecycle with real-time status tracking
- Generate daily standup reports from aggregated data
- Serve technician workload calculations

#### Shared Responsibilities
- KPI consistency between dashboard and domain sources
- Dispatch acknowledgment lifecycle (sent → ack → declined → reassign)
- Task status changes propagated to task board participants

---

### Page Contracts

#### Page: DashboardPage (`/`)

**Data Required:** tickets_v2 (urgent, count), tasks_v2 (active, count), appointments_v2 (today, count), dispatches_v2 (active), followups_v2 (overdue), operations_log_v2 (recent)
**Data Produced:** Dashboard filter state
**API Calls:** GET /api/v2/operations/dashboard
**Future Function Calls:** generate-standup-report, create-operations-tasks
**Future Workflow Triggers:** daily-standup_v2, urgent-dispatch_v2
**Future Agent Requests:** operations-coordinator_v2
**Notifications:** Urgent dispatch (in-app, discord), blocker detected (in-app)
**Permissions:** view_dashboard
**Events Produced:** None
**Events Consumed:** ticket.escalated, ticket.classified (urgent), appointment.status.changed, followup.slippage.detected, account.health.changed (critical)

#### Page: TaskBoardPage (`/tasks`)

**Data Required:** tasks_v2 (all with status grouping), task_assignments_v2, technicians_v2
**Data Produced:** Task status transition, assignment changes
**API Calls:** GET /api/v2/tasks, PUT /api/v2/tasks/:id/status, PUT /api/v2/tasks/:id/assign
**Future Function Calls:** create-operations-tasks
**Future Workflow Triggers:** None
**Future Agent Requests:** operations-coordinator_v2 (recommend tasks)
**Notifications:** Task assigned (in-app)
**Permissions:** manage_tasks
**Events Produced:** task.created, task.status.changed
**Events Consumed:** task.assigned, task.status.changed

#### Page: DispatchCenterPage (`/dispatches`)

**Data Required:** dispatches_v2 (active), tickets_v2 (dispatch-related), technicians_v2 (availability), operations_log_v2
**Data Produced:** Dispatch actions (initiate, cancel, reassign)
**API Calls:** GET /api/v2/dispatches, POST /api/v2/dispatches, PUT /api/v2/dispatches/:id/reassign
**Future Function Calls:** finalize-dispatch, calculate-dispatch-priority
**Future Workflow Triggers:** urgent-dispatch_v2, standard-dispatch_v2
**Future Agent Requests:** dispatch-coordinator_v2
**Notifications:** Dispatch sent (push to technician), dispatch escalated (in-app to manager)
**Permissions:** manage_dispatch
**Events Produced:** dispatch.initiated, dispatch.completed
**Events Consumed:** dispatch.acknowledged, dispatch.declined, dispatch.completed

#### Page: DailyStandupPage (`/standup`)

**Data Required:** operations_log_v2 (day summary), tickets_v2 (daily metrics), appointments_v2 (daily), tasks_v2 (daily), followups_v2 (overdue)
**Data Produced:** Standup report configuration
**API Calls:** GET /api/v2/operations/standup/today, POST /api/v2/operations/standup/generate
**Future Function Calls:** generate-standup-report
**Future Workflow Triggers:** daily-standup_v2
**Future Agent Requests:** operations-coordinator_v2
**Notifications:** Standup ready (in-app, email)
**Permissions:** view_standup
**Events Produced:** daily.standup.generated
**Events Consumed:** None

#### Page: TechnicianWorkloadPage (`/technicians`)

**Data Required:** technicians_v2 (all), appointments_v2 (assigned), tasks_v2 (assigned), technician_skills_v2
**Data Produced:** Technician selection
**API Calls:** GET /api/v2/technicians/workload
**Future Function Calls:** None
**Future Workflow Triggers:** None
**Future Agent Requests:** None
**Notifications:** None
**Permissions:** view_technicians
**Events Produced:** None
**Events Consumed:** technician.availability.changed

---

### Form Contracts

##### Form: NewTask

**Validation Contract:** title (required, 3-200 chars), description (optional, max 5000 chars), assigned_to (required, valid uuid of technician/user), priority (required, enum: low|normal|high|critical), due_date (required, future timestamp), category (optional)
**Submission Contract:** POST /api/v2/tasks with CreateTaskRequest DTO
**Response Contract:** 201 — TaskResponse (id, title, status, assigned_to, due_date, created_at)
**Failure Contract:** 400 — ValidationErrorResponse, 404 — UserNotFoundResponse
**Permission Contract:** manage_tasks

##### Form: DispatchCoordination

**Validation Contract:** ticket_id (required, valid uuid, urgency >= high), technician_id (required, valid uuid, availability = available), notes (optional, max 2000 chars), priority (required, enum: normal|high|emergency)
**Submission Contract:** POST /api/v2/dispatches with DispatchRequest DTO
**Response Contract:** 201 — DispatchResponse (id, ticket_id, technician_id, status, dispatched_at)
**Failure Contract:** 400 — ValidationErrorResponse, 409 — TechnicianBusyResponse
**Permission Contract:** manage_dispatch

---

## 4. appointment-center_v2

### Application Contract

#### Frontend Responsibilities
- Render schedule calendar (monthly/weekly/daily views)
- Display appointment cards with technician, customer, status
- Provide AI-powered technician suggestion display
- Manage appointment booking wizard
- Show conflict detection warnings
- Handle reschedule and cancellation workflows

#### Backend Responsibilities
- Serve appointment records with calendar-compatible queries
- Manage technician assignment with conflict detection
- Calculate schedule conflicts and availability
- Handle appointment state machine transitions
- Generate reminder schedules
- Emit lifecycle events

#### Shared Responsibilities
- Calendar data consistency across views
- Technician availability reflected accurately in real time
- Booking slot availability synchronized between booking attempts

---

### Page Contracts

#### Page: ScheduleBoardPage (`/`)

**Data Required:** appointments_v2 (date-range filtered), technicians_v2 (availability), customers_v2 (lookup)
**Data Produced:** Calendar view config (date range, view mode), appointment selection
**API Calls:** GET /api/v2/appointments?from={date}&to={date}, GET /api/v2/technicians/availability
**Future Function Calls:** fetch-upcoming-appointments
**Future Workflow Triggers:** appointment-assignment_v2, appointment-reminders_v2
**Future Agent Requests:** tech-suggester_v2
**Notifications:** Schedule conflict (in-app), appointment cancelled (in-app)
**Permissions:** view
**Events Produced:** None (pass-through)
**Events Consumed:** appointment.created, appointment.assigned, appointment.status.changed, appointment.cancelled

#### Page: AppointmentDetailPage (`/appointments/:id`)

**Data Required:** appointments_v2 (single), customers_v2, technicians_v2, operations_log_v2 (timeline)
**Data Produced:** Status update, technician reassignment
**API Calls:** GET /api/v2/appointments/:id, PUT /api/v2/appointments/:id/status
**Future Function Calls:** assign-appointment-technician
**Future Workflow Triggers:** appointment-assignment_v2
**Future Agent Requests:** tech-suggester_v2
**Notifications:** Appointment updated (in-app)
**Permissions:** view, edit
**Events Produced:** appointment.status.changed, appointment.assigned
**Events Consumed:** appointment.status.changed

#### Page: NewAppointmentPage (`/appointments/new`)

**Data Required:** customers_v2 (search), technicians_v2 (available), service_types_v2, system_settings_v2 (scheduling rules)
**Data Produced:** New appointment record
**API Calls:** POST /api/v2/appointments, GET /api/v2/technicians/available-slots
**Future Function Calls:** assign-appointment-technician
**Future Workflow Triggers:** appointment-assignment_v2
**Future Agent Requests:** tech-suggester_v2
**Notifications:** Appointment confirmed (in-app, email to customer)
**Permissions:** create
**Events Produced:** appointment.created
**Events Consumed:** None

---

## 5. technician-portal_v2

### Application Contract

#### Frontend Responsibilities
- Display today's schedule with job timeline
- Present job detail with customer info, actions, notes
- Enable job status progression (en route → on site → working → complete)
- Show assigned tasks with completion checklists
- Provide photo upload and notes for job completion
- Toggle availability status
- Display notification feed

#### Backend Responsibilities
- Serve technician-scoped appointments and tasks
- Process job status transitions with GPS validation
- Store job notes and photo attachments
- Track technician availability state
- Manage notification queue for technician
- Emit status change events

#### Shared Responsibilities
- GPS location accuracy for on-site verification
- Photo upload progress and retry management
- Job status consistency between field and operations center

---

### Page Contracts

#### Page: MyDayPage (`/`)

**Data Required:** appointments_v2 (today, technician_id = current), tasks_v2 (today, assigned_to = current), notifications_v2 (unread count)
**Data Produced:** Job selection, status update
**API Calls:** GET /api/v2/technicians/:id/day, GET /api/v2/notifications?unread=true
**Future Function Calls:** fetch-upcoming-appointments
**Future Workflow Triggers:** appointment-reminders_v2, urgent-dispatch_v2
**Future Agent Requests:** None
**Notifications:** New dispatch (push, SMS), schedule change (push)
**Permissions:** view_schedule
**Events Produced:** technician.status.changed (availability toggle)
**Events Consumed:** appointment.assigned, appointment.rescheduled, appointment.cancelled, dispatch.initiated, task.created

#### Page: AppointmentDetailPage (`/appointments/:id`)

**Data Required:** appointments_v2 (single), customers_v2, work_orders_v2, work_order_stages_v2, dispatch_records_v2
**Data Produced:** Status transition, notes, photo uploads
**API Calls:** GET /api/v2/appointments/:id, PUT /api/v2/appointments/:id/status, POST /api/v2/appointments/:id/photos, POST /api/v2/appointments/:id/notes
**Future Function Calls:** create-work-order, update-work-order-stage, complete-work-order, record-inventory-transaction
**Future Workflow Triggers:** work-order-fulfillment_v2, appointment-completion_v2
**Future Agent Requests:** None
**Notifications:** Job reassigned (push)
**Permissions:** update_status
**Events Produced:** appointment.started, appointment.completed, work_order.stage.changed
**Events Consumed:** appointment.status.changed

---

## 6. resolution-center_v2

### Application Contract

#### Frontend Responsibilities
- Display dispute queue with filtering and sorting
- Show dispute detail with evidence viewer
- Present AI analysis results with confidence indicator
- Provide approval/rejection workflow for recommendations
- Display resolution history and trends

#### Backend Responsibilities
- Serve dispute records with evidence attachments
- Execute dispute state machine (new → analyzing → resolved)
- Manage AI analysis lifecycle
- Store resolution outcomes and associated compensation
- Emit lifecycle events

#### Shared Responsibilities
- AI analysis confidence threshold coordination
- Evidence integrity and chain of custody
- Approval workflow timeout enforcement

---

### Page Contracts

#### Page: DisputeQueuePage (`/disputes`)

**Data Required:** disputes_v2 (all active), appointments_v2 (related), customers_v2
**Data Produced:** Dispute selection, filter criteria
**API Calls:** GET /api/v2/disputes (paginated, filtered)
**Future Function Calls:** None
**Future Workflow Triggers:** dispute-resolution_v2
**Future Agent Requests:** resolution-advisor_v2
**Notifications:** New dispute filed (in-app, email)
**Permissions:** view_disputes
**Events Produced:** None
**Events Consumed:** dispute.created, dispute.status.changed

#### Page: DisputeDetailPage (`/disputes/:id`)

**Data Required:** disputes_v2 (single), dispute_evidence_v2, appointments_v2, customers_v2, tickets_v2
**Data Produced:** Resolution action (approve, reject, escalate, close)
**API Calls:** GET /api/v2/disputes/:id, GET /api/v2/disputes/:id/evidence, POST /api/v2/disputes/:id/analyze, PUT /api/v2/disputes/:id/resolve
**Future Function Calls:** resolve-dispute
**Future Workflow Triggers:** dispute-resolution_v2, dispute-escalation_v2
**Future Agent Requests:** resolution-advisor_v2
**Notifications:** Resolution ready (in-app), dispute escalated (in-app, email)
**Permissions:** analyze, approve, escalate
**Events Produced:** dispute.analyzed, dispute.resolved, dispute.escalated
**Events Consumed:** dispute.status.changed

---

## 7. crm-center_v2

### Application Contract

#### Frontend Responsibilities
- Display account dashboard with health gauge
- Show account list with filtering, searching, sorting
- Render account detail with full health history
- Present followup center with slipping alerts
- Display health scan results and risk signals

#### Backend Responsibilities
- Serve account records with health scores
- Execute account health scans across multiple signals
- Manage followup lifecycle (create, complete, detect slippage)
- Calculate account health scores and trends
- Emit health and followup events

#### Shared Responsibilities
- Health score calculation consistency across scans
- Followup slippage detection thresholds
- Account health category transitions and notifications

---

### Page Contracts

#### Page: AccountDashboardPage (`/`)

**Data Required:** accounts_v2 (health distribution), followups_v2 (overdue), tickets_v2 (open by account), disputes_v2 (open by account)
**Data Produced:** Dashboard date range
**API Calls:** GET /api/v2/crm/dashboard
**Future Function Calls:** account-health-scan, flag-slipping-followups, generate-account-score
**Future Workflow Triggers:** account-health-scan_v2, followup-slippage-detector_v2
**Future Agent Requests:** account-health-monitor_v2
**Notifications:** Health downgrade (in-app, email), slippage detected (in-app)
**Permissions:** view_dashboard
**Events Produced:** None
**Events Consumed:** account.health.changed, followup.slippage.detected, ticket.status.changed

#### Page: AccountDetailPage (`/accounts/:id`)

**Data Required:** accounts_v2 (single), account_health_scans_v2 (history), followups_v2 (by account), tickets_v2 (by account), appointments_v2 (by account), disputes_v2 (by account)
**Data Produced:** Health scan trigger, followup creation
**API Calls:** GET /api/v2/accounts/:id, GET /api/v2/accounts/:id/health-history, POST /api/v2/accounts/:id/scan
**Future Function Calls:** account-health-scan, generate-account-score, create-followup-tasks
**Future Workflow Triggers:** account-health-scan_v2, followup-management_v2
**Future Agent Requests:** account-health-monitor_v2
**Notifications:** Health scan complete (in-app)
**Permissions:** view_accounts, manage_accounts, run_scans
**Events Produced:** account.health.scan.completed
**Events Consumed:** account.health.changed

---

## 8. analytics-center_v2

### Application Contract

#### Frontend Responsibilities
- Render executive dashboard with KPI grid
- Display domain-specific analytics pages with charts
- Provide custom report builder with drag-and-drop canvas
- Manage scheduled reports and distributions
- Support data export (CSV, PDF)

#### Backend Responsibilities
- Execute metric aggregations across all domains
- Serve time-series data for chart rendering
- Generate report data with configurable parameters
- Manage report schedules and subscriber lists
- Sync events into analytics materialized views

#### Shared Responsibilities
- Data freshness indicator accuracy
- Report generation completion notification
- Export format fidelity

---

### Page Contracts

#### Page: ExecutiveDashboardPage (`/`)

**Data Required:** events_v2 (aggregated), analytics_reports_v2 (cached metrics)
**Data Produced:** Date range, metric selection
**API Calls:** GET /api/v2/analytics/executive-dashboard
**Future Function Calls:** batch-metric-aggregation, calculate-metric-trend
**Future Workflow Triggers:** trend-analysis_v2
**Future Agent Requests:** None
**Notifications:** Report ready (in-app, email)
**Permissions:** view_executive
**Events Produced:** None
**Events Consumed:** ALL domain events (via event stream)

#### Page: ReportBuilderPage (`/reports/builder`)

**Data Required:** analytics_reports_v2 (definitions), domain table schemas
**Data Produced:** Custom report definition
**API Calls:** POST /api/v2/analytics/reports, PUT /api/v2/analytics/reports/:id
**Future Function Calls:** generate-report-data
**Future Workflow Triggers:** report-generation_v2
**Future Agent Requests:** None
**Notifications:** None
**Permissions:** manage_reports
**Events Produced:** None
**Events Consumed:** None

---

## 9. customer-portal_v2

### Application Contract

#### Frontend Responsibilities
- Display account summary with health status
- Show ticket list and detail with status timeline
- Provide self-service ticket creation form
- Display appointment calendar with booking wizard
- Present dispute status cards
- Enable profile and notification preference management

#### Backend Responsibilities
- Serve customer-scoped data from all domain tables
- Enforce customer data isolation (RLS by customer_id)
- Process ticket creation requests from portal
- Process appointment booking requests
- Process customer profile updates
- Manage notification preferences

#### Shared Responsibilities
- Customer identity verification across sessions
- Booking slot availability consistency
- Ticket and appointment status reflected accurately

---

### Page Contracts

#### Page: HomeDashboardPage (`/`)

**Data Required:** customers_v2 (single), accounts_v2 (health), tickets_v2 (open, by customer_id), appointments_v2 (upcoming), notifications_v2 (unread), disputes_v2 (open)
**Data Produced:** None
**API Calls:** GET /api/v2/customers/:id/dashboard
**Future Function Calls:** check-ticket-urgency
**Future Workflow Triggers:** None
**Future Agent Requests:** None
**Notifications:** None
**Permissions:** view_dashboard
**Events Produced:** None
**Events Consumed:** ticket.status.changed, appointment.status.changed, dispute.status.changed, notification.new

#### Page: NewTicketPage (`/tickets/new`)

**Data Required:** customers_v2 (own), system_settings_v2 (request types)
**Data Produced:** New ticket_v2 record
**API Calls:** POST /api/v2/customers/:id/tickets
**Future Function Calls:** validate-ticket-input, check-ticket-urgency
**Future Workflow Triggers:** ticket-intake_v2
**Future Agent Requests:** request-classifier_v2
**Notifications:** Ticket created confirmation (in-app, email)
**Permissions:** create_ticket
**Events Produced:** ticket.created.customer
**Events Consumed:** None

#### Page: BookAppointmentPage (`/appointments/book`)

**Data Required:** service_types_v2, technicians_v2 (available slots), customers_v2
**Data Produced:** Appointment booking request
**API Calls:** POST /api/v2/customers/:id/appointments, GET /api/v2/appointments/available-slots
**Future Function Calls:** None
**Future Workflow Triggers:** appointment-booking_v2, appointment-assignment_v2
**Future Agent Requests:** tech-suggester_v2
**Notifications:** Appointment confirmed (in-app, email)
**Permissions:** book_appointment
**Events Produced:** appointment.requested
**Events Consumed:** None

---

## 10. admin-center_v2

### Application Contract

#### Frontend Responsibilities
- Display admin dashboard with system health metrics
- Manage users (CRUD) with role assignment
- Manage roles with permission tree editor
- Display audit log with search and export
- Manage system settings and feature flags
- Configure connectors
- Monitor event bus activity

#### Backend Responsibilities
- Serve user records with role assignments
- Execute user provisioning and deactivation workflows
- Manage role definitions and permission mappings
- Store and serve audit log entries
- Manage system settings with config versioning
- Manage connector configurations
- Track system health metrics

#### Shared Responsibilities
- User-role cache invalidation on role/assignment changes
- Config change propagation to all applications
- Audit log completeness and immutability

---

### Page Contracts

#### Page: UserManagementPage (`/users`)

**Data Required:** users_v2 (paginated), user_roles_v2, roles_v2
**Data Produced:** User selection, filter criteria
**API Calls:** GET /api/v2/admin/users, PUT /api/v2/admin/users/:id/status
**Future Function Calls:** provision-user, deactivate-user
**Future Workflow Triggers:** user-provisioning_v2
**Future Agent Requests:** admin-manager_v2
**Notifications:** User created (in-app, email to user)
**Permissions:** manage_users
**Events Produced:** user.created, user.disabled
**Events Consumed:** None

#### Page: AuditLogPage (`/audit`)

**Data Required:** audit_log_v2 (paginated, filtered)
**Data Produced:** Audit filter criteria, export request
**API Calls:** GET /api/v2/admin/audit-log, GET /api/v2/admin/audit-log/export
**Future Function Calls:** log-audit-event
**Future Workflow Triggers:** None
**Future Agent Requests:** None
**Notifications:** None
**Permissions:** view_audit, export_audit
**Events Produced:** None
**Events Consumed:** None

#### Page: SystemSettingsPage (`/settings`)

**Data Required:** system_settings_v2, feature_flags_v2
**Data Produced:** Setting updates, feature flag toggles
**API Calls:** GET /api/v2/admin/settings, PUT /api/v2/admin/settings/:key, PUT /api/v2/admin/feature-flags/:key
**Future Function Calls:** validate-config-change, apply-config-change
**Future Workflow Triggers:** system-config-management_v2
**Future Agent Requests:** admin-system-config_v2
**Notifications:** Config changed (in-app)
**Permissions:** manage_settings
**Events Produced:** system.config.changed
**Events Consumed:** None

---

### Form Contracts

##### Form: CreateUser

**Validation Contract:** email (required, valid email format, unique), full_name (required, 2-200 chars), role_id (required, valid uuid), department (optional), notify_user (optional boolean)
**Submission Contract:** POST /api/v2/admin/users with CreateUserRequest DTO
**Response Contract:** 201 — UserResponse (id, email, full_name, role_id, status, created_at)
**Failure Contract:** 400 — ValidationErrorResponse, 409 — EmailExistsResponse
**Permission Contract:** manage_users

---

### Action Contracts

##### Action: CreateUser

**Required Permission:** manage_users
**Backend Function:** provision-user
**Workflow Trigger:** user-provisioning_v2
**Agent Trigger:** admin-manager_v2
**Database Update:** INSERT into users_v2, INSERT into user_roles_v2
**Notification:** Welcome email (email) to new user
**Audit Log:** user.created — actor, email, role_id, department

##### Action: ApplyConfigChange

**Required Permission:** manage_settings
**Backend Function:** validate-config-change, apply-config-change
**Workflow Trigger:** system-config-management_v2
**Agent Trigger:** admin-system-config_v2
**Database Update:** UPDATE system_settings_v2 or feature_flags_v2
**Notification:** Config changed (in-app) to admin
**Audit Log:** system.config.changed — actor, setting_key, previous_value, new_value
