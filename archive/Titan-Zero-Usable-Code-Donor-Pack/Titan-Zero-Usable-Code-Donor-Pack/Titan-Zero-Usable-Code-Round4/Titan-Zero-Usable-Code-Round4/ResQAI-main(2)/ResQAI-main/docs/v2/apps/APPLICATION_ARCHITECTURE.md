# RESQAI V2 — Application Architecture

> Phase 1.1 — Design Only  
> Lead: Software Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Architecture Philosophy](#1-architecture-philosophy)
2. [Application Inventory](#2-application-inventory)
3. [Cross-Cutting Concerns](#3-cross-cutting-concerns)
4. [Shared Component Architecture](#4-shared-component-architecture)
5. [Application Details (25-Point Design)](#5-application-details)
   - [customer-portal_v2](#51-customer-portal_v2)
   - [support-center_v2](#52-support-center_v2)
   - [operations-center_v2](#53-operations-center_v2)
   - [appointment-center_v2](#54-appointment-center_v2)
   - [technician-portal_v2](#55-technician-portal_v2)
   - [resolution-center_v2](#56-resolution-center_v2)
   - [crm-center_v2](#57-crm-center_v2)
   - [notification-center_v2](#58-notification-center_v2)
   - [analytics-center_v2](#59-analytics-center_v2)
   - [admin-center_v2](#510-admin-center_v2)
6. [Event Catalog](#6-event-catalog)
7. [Permissions Reference](#7-permissions-reference)

---

## 1. Architecture Philosophy

### Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Data-Owner Pattern** | Each table has exactly one "owning" app that creates/updates it; all others read via events |
| 2 | **Event-Driven Decoupling** | Apps communicate exclusively through events — no direct API calls between apps |
| 3 | **Portal Transparency** | Customer and Technician portals are read-heavy views that consume events; they never write directly to operational tables |
| 4 | **Shared Core** | One UI library, one SDK, one config package, one type system; no duplication |
| 5 | **Progressive Enhancement** | Apps can function at reduced capacity if event bus is unavailable (offline-capable read models) |
| 6 | **Auth at the Edge** | Every app validates identity; authorization decisions happen in the app layer, not in the database |
| 7 | **Audit Everywhere** | Every state mutation emits an audit event to the operations_log |

### Application Hierarchy

```
                    ┌──────────────────────┐
                    │    admin-center_v2    │  (Cross-cutting: users, roles, system config)
                    └──────┬───────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │ customer-  │  │  support-  │  │  crm-      │
   │ portal_v2  │  │ center_v2  │  │ center_v2  │
   └────────────┘  └────────────┘  └────────────┘
                           │               │
                           ▼               ▼
                   ┌────────────┐  ┌────────────┐
                   │operations- │  │appointment-│
                   │ center_v2  │  │ center_v2  │
                   └────────────┘  └────────────┘
                           │               │
                           ▼               ▼
                   ┌────────────┐  ┌────────────┐
                   │technician- │  │ resolution-│
                   │ portal_v2  │  │ center_v2  │
                   └────────────┘  └────────────┘
                           │               │
                           ▼               ▼
                   ┌──────────────────────────┐
                   │   notification-center_v2 │  (Cross-cutting: all outbound messaging)
                   └──────────────────────────┘
                           │
                           ▼
                   ┌──────────────────────────┐
                   │     analytics-center_v2  │  (Cross-cutting: all reporting)
                   └──────────────────────────┘
```

### App Ownership

| Layer | App | Domain |
|-------|-----|--------|
| External | customer-portal_v2 | Self-service for end customers |
| External | technician-portal_v2 | Field technician operations |
| Operational | support-center_v2 | Ticket intake, triage, and response |
| Operational | crm-center_v2 | Account health, followups, retention |
| Operational | operations-center_v2 | Daily coordination, task management |
| Scheduling | appointment-center_v2 | Appointment booking, scheduling, dispatch |
| Adjudication | resolution-center_v2 | Dispute analysis and resolution |
| Cross-cutting | notification-center_v2 | All outbound communication channels |
| Cross-cutting | analytics-center_v2 | Reporting, dashboards, data exports |
| Cross-cutting | admin-center_v2 | User management, roles, audit, system config |

---

## 2. Application Inventory

| # | App | Page Count | Component Count | Table Access | Events Emitted | Events Consumed |
|---|-----|-----------|----------------|--------------|----------------|-----------------|
| 1 | customer-portal_v2 | 6 | 22 | 3 read, 2 write | 3 | 4 |
| 2 | support-center_v2 | 8 | 28 | 5 read, 3 write | 5 | 3 |
| 3 | crm-center_v2 | 6 | 24 | 5 read, 3 write | 4 | 4 |
| 4 | operations-center_v2 | 6 | 26 | 4 read, 2 write | 5 | 6 |
| 5 | appointment-center_v2 | 7 | 24 | 3 read, 3 write | 5 | 4 |
| 6 | technician-portal_v2 | 5 | 20 | 4 read, 2 write | 3 | 5 |
| 7 | resolution-center_v2 | 5 | 22 | 4 read, 3 write | 4 | 3 |
| 8 | notification-center_v2 | 3 | 18 | 3 read, 3 write | 2 | 10 |
| 9 | analytics-center_v2 | 4 | 20 | 9 read, 0 write | 1 | 9 |
| 10 | admin-center_v2 | 6 | 22 | 9 read, 5 write | 4 | 2 |

---

## 3. Cross-Cutting Concerns

### 3.1 Shared Navigation

Every V2 app uses a common shell layout (`packages/ui_v2/Shell`) that provides:

- Top bar: App selector (switcher), user avatar, notification bell, search bar
- Left sidebar: Contextual navigation for the current app
- Breadcrumb trail beneath the top bar
- Global command palette (Ctrl+K) for cross-app search

### 3.2 Shared Layout

```
┌─────────────────────────────────────────────────────┐
│  Top Bar: [App Switcher] [Search] [Bell] [Avatar]   │
├──────────┬──────────────────────────────────────────┤
│          │  Breadcrumbs: Home > Support > Ticket #42 │
│  Sidebar ├──────────────────────────────────────────┤
│  (nav)   │                                          │
│          │         Main Content Area                 │
│          │         (Outlet / Page Component)         │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│  Footer: Status, version, support link               │
└─────────────────────────────────────────────────────┘
```

### 3.3 Shared Components (packages/ui_v2)

| Component | Purpose | Used By |
|-----------|---------|---------|
| Shell | Application chrome (header, sidebar, breadcrumbs) | All apps |
| DataTable | Sortable, filterable, paginated table | All apps |
| DataCard | Read-only record detail card | All apps |
| SmartForm | Configurable form with validation | All apps |
| KanbanBoard | Drag-and-drop column view | ops, support, resolution |
| Timeline | Vertical event timeline | support, crm, resolution |
| ActivityFeed | Real-time activity stream | All apps |
| NotificationBell | Dropdown of unread notifications | All apps |
| SearchBar | Global + scoped search | All apps |
| StatusBadge | Color-coded status indicator | All apps |
| MetricCard | KPI card with trend arrow | ops, analytics, admin |
| ChartWidget | Chart.js wrapper component | analytics, ops, crm |
| ConfirmDialog | Confirmation modal | All apps |
| FileUploader | Drag-and-drop file upload | support, resolution |
| MapView | Leaflet-based service territory map | appointment, technician |
| DateRangePicker | Date range filter | All apps |
| FilterBar | Horizontal filter chip row | All apps |
| EmptyState | Illustration + message for empty data | All apps |
| ErrorBoundary | Graceful error capture | All apps |
| SkeletonPage | Loading placeholder | All apps |

### 3.4 Shared Widgets (packages/widgets_v2)

| Widget | Description | Consumed By |
|--------|-------------|-------------|
| MyOpenTickets | Customer's open support tickets | customer-portal_v2 |
| TodayAppointments | Today's appointment list | technician-portal_v2, operations-center_v2 |
| UrgentDispatches | Urgent dispatch queue | operations-center_v2 |
| AccountHealthCard | Account health snapshot | crm-center_v2, customer-portal_v2 |
| SlippingFollowups | Overdue followup alerts | crm-center_v2, operations-center_v2 |
| OpenDisputes | Active dispute count | resolution-center_v2, customer-portal_v2 |
| PendingApprovals | Tasks requiring human approval | admin-center_v2 |
| SystemStatus | Platform health indicators | admin-center_v2 |
| TopKPIs | Key performance metrics | analytics-center_v2, operations-center_v2 |
| AgentPerformance | Per-agent metrics card | analytics-center_v2 |
| NotificationDigest | Recent notifications summary | notification-center_v2, all portals |

### 3.5 Shared Filters

| Filter | Type | Used By |
|--------|------|---------|
| StatusFilter | Multi-select enum | All list views |
| DateRangeFilter | Date range picker | All list views |
| UrgencyFilter | Priority/urgency quick filter | support, ops |
| TechnicianFilter | Technician select | appointment, ops |
| CustomerFilter | Customer search/select | crm, support, appointment |
| ChannelFilter | Communication channel | support |
| SkillFilter | Technician skill | appointment |
| HealthFilter | Account health status | crm |
| TypeFilter | Record type/category | All list views |

### 3.6 Shared Search

A global search bar in the Shell header performs unified search across:

- All tickets (tickets table — subject, customer name, message)
- All customers (customers table — name, email, phone)
- All technicians (technicians table — name, skill)
- All accounts (accounts table — name)
- All appointments (appointments table — date, customer name)
- All disputes (disputes table — customer claim)

Search results are grouped by entity type with preview snippets.

### 3.7 Shared Activity Feed

Each app has an embedded activity feed component that streams operations_log entries filtered by:

- Entity ID (e.g., all events for ticket #42)
- Entity type (e.g., all ticket events)
- Actor (e.g., all events by a specific user/agent)
- Action type (create, update, delete, agent_action)

The feed renders an infinitely-scrolling timeline with color-coded event types.

### 3.8 Shared Permissions Model

| Role | Level | Apps Accessible |
|------|-------|-----------------|
| super_admin | System-wide | All apps, all operations |
| admin | App-wide | All apps except customer-portal_v2 CRUD |
| manager | Domain | ops, support, crm, appointment, resolution |
| agent | Operational | support, crm, appointment, technician-portal_v2 |
| technician | Field | technician-portal_v2, appointment (read) |
| customer | External | customer-portal_v2 only |

Permissions are stored in a new `user_roles` table and managed via admin-center_v2.

---

## 4. Shared Component Architecture

### 4.1 Shared Package Structure

```
packages/
├── ui_v2/                      # Shared UI component library (React)
├── types_v2/                   # TypeScript interfaces for V2
├── config_v2/                  # V2 constants, environment, theme
├── sdk_v2/                     # Lemma SDK wrapper (extended for V2 events)
├── utils_v2/                   # Shared utility functions
├── widgets_v2/                 # Composable dashboard widgets
├── hooks_v2/                   # Shared React hooks
│   ├── useNotifications.ts     # Real-time notification subscription
│   ├── useActivityFeed.ts      # Activity stream subscription
│   ├── useSearch.ts            # Cross-app search hook
│   ├── useFilters.ts           # Shared filter state hook
│   ├── usePagination.ts        # Pagination state hook
│   ├── useRealTime.ts          # WebSocket/subscription hook
│   └── usePermissions.ts       # Permission checking hook
├── forms_v2/                   # Shared form schemas and validators
└── layouts_v2/                 # Shared page layouts
    ├── Shell.tsx               # App chrome shell
    ├── ListLayout.tsx          # Standard list page layout
    ├── DetailLayout.tsx        # Standard detail page layout
    ├── DashboardLayout.tsx     # Dashboard grid layout
    └── FormLayout.tsx          # Full-page form layout
```

### 4.2 Shared Table Access

All V2 apps access tables through the extended `packages/sdk_v2` which provides:

- `listRecords(table, filters, sort)` — paginated read with server-side filtering
- `getRecord(table, id)` — single record read
- `createRecord(table, data)` — create with auto-timestamp
- `updateRecord(table, id, data)` — update with audit trail
- `bulkUpdateRecords(table, ids, data)` — batch update
- `subscribeToTable(table, filters)` — real-time subscription for live updates
- `emitEvent(eventName, payload)` — emit domain event to the event bus
- `runAgent(agentName, input)` — invoke agent with timeout
- `runFunction(functionName, input)` — invoke serverless function
- `runConnectorOperation(connector, operation, input)` — connector call

---

## 5. Application Details

---

### 5.1 customer-portal_v2

#### 1. Purpose
Self-service portal for end customers to manage their service relationship, view tickets, schedule appointments, and track disputes without contacting support.

#### 2. Primary Users
- Service customers (homeowners, property managers, business clients)

#### 3. Responsibilities
- Authenticate customer identity
- Display account and service history
- Enable ticket creation and tracking
- Enable appointment self-scheduling and rescheduling
- Display dispute status
- Show account health and followup status
- Receive and display notifications

#### 4. Business Capabilities
- Customer self-registration / SSO login
- Create support ticket from portal
- View ticket history and status
- Schedule, reschedule, cancel appointments
- View technician details for upcoming appointments
- Track dispute resolution progress
- View account health summary
- Update profile and contact preferences
- View billing/invoice summary (link to external billing)
- Receive real-time push notifications

#### 5. Pages

| Page | Route | Description |
|------|-------|-------------|
| Home Dashboard | `/` | Account summary, open tickets, upcoming appointments, notifications |
| My Tickets | `/tickets` | List of all tickets with status, search, filter |
| Ticket Detail | `/tickets/:id` | Full ticket view with message thread, timeline |
| New Ticket | `/tickets/new` | Create ticket form |
| Appointments | `/appointments` | Upcoming and past appointments |
| Appointment Detail | `/appointments/:id` | Appointment details, technician info, reschedule |
| Book Appointment | `/appointments/book` | Self-service booking flow |
| Disputes | `/disputes` | Open and past disputes |
| Dispute Detail | `/disputes/:id` | Dispute status, evidence, resolution |
| Account | `/account` | Profile, preferences, notification settings |
| Account Health | `/account/health` | Health score, followups, activity |

#### 6. Navigation Structure

```
Top Bar: [Logo] [Search] [Bell] [Avatar dropdown: Account, Sign out]
Sidebar:
  ├── Dashboard (home)
  ├── My Tickets
  ├── Appointments
  ├── Disputes
  └── Account & Health
```

#### 7. Components

| Component | Description |
|-----------|-------------|
| AccountSummaryCard | Health score, open tickets count, next appointment |
| TicketStatusTimeline | Visual timeline of ticket lifecycle |
| AppointmentCalendar | Monthly calendar view with appointment markers |
| AppointmentCard | Compact appointment display card |
| SelfServiceBooking | Multi-step booking wizard (service type → date → time → confirm) |
| DisputeStatusCard | Dispute state with progress indicator |
| NotificationPreferences | Channel toggle (email, SMS, in-app) |
| ProfileEditor | Edit name, phone, email, address |
| QuickTicketForm | Minimal ticket creation form |
| ServiceHistoryList | Chronological list of past services |

#### 8. Dashboards

- **Home Dashboard**: Welcome banner, account health gauge, upcoming appointment reminder, open tickets summary, recent activity feed

#### 9. Forms

| Form | Fields | Validations |
|------|--------|-------------|
| New Ticket | subject, message, request_type, channel, customer_id, phone, email | Required: subject, message; phone or email required |
| Book Appointment | service_type, preferred_date, preferred_time_slot, notes | Required: service_type, date; future date only |
| Reschedule Appointment | new_date, new_time_slot, reason | Required: date; future date only |
| Cancel Appointment | reason | Required: reason |
| Update Profile | name, phone, email, address | Required: name; email format; phone format |

#### 10. Tables Viewed

| Table | Read Pattern | Scope |
|-------|-------------|-------|
| customers | `getRecord(customers, customerId)` | Own record only |
| tickets | `listRecords(tickets, { customer_id })` | Own tickets only |
| appointments | `listRecords(appointments, { customer_id })` | Own appointments only |
| disputes | `listRecords(disputes, { appointment_id → customer_id })` | Own disputes only |
| accounts | `listRecords(accounts, { customer_id })` | Own account only |
| followups | `listRecords(followups, { account_id → customer_id })` | Own followups only |

#### 11. Tables Updated

| Table | Update Pattern | Constraint |
|-------|---------------|------------|
| customers | `updateRecord(customers, id, { name, phone, email, address })` | Own record only |

#### 12. Tables Created

| Table | Create Pattern |
|-------|---------------|
| tickets | `createRecord(tickets, { customer_name, customer_id, subject, message, request_type, channel, urgency: 'normal', status: 'new' })` |

#### 13. Events Generated

| Event | Payload | Trigger |
|-------|---------|---------|
| `ticket.created.customer` | `{ ticket_id, customer_id, request_type, urgency }` | Customer creates ticket via portal |
| `appointment.requested` | `{ customer_id, service_type, preferred_date, preferred_time }` | Customer requests new appointment |
| `appointment.cancelled.customer` | `{ appointment_id, customer_id, reason }` | Customer cancels appointment |

#### 14. Events Consumed

| Event | Handler | Effect |
|-------|---------|--------|
| `ticket.status.changed` | Refresh ticket detail view | Real-time status badge update |
| `appointment.status.changed` | Refresh appointment view | Real-time schedule change |
| `dispute.status.changed` | Update dispute card | Real-time progress update |
| `notification.new` | Show notification bell badge | Bell badge count increment |

#### 15. Workflows That Will Connect Later

- **ticket-intake_v2** — consumes `ticket.created.customer`
- **appointment-assignment_v2** — consumes `appointment.requested`
- **appointment-reminders_v2** — generates reminders for customer
- **customer-satisfaction-monitor_v2** — tracks satisfaction from resolved customer tickets

#### 16. Agents That Will Connect Later

- **request-classifier_v2** — classifies portal-created tickets
- **support-reply-drafter_v2** — drafts replies to portal tickets

#### 17. Functions That Will Connect Later

- `check-ticket-urgency` — evaluate urgency of portal-created ticket
- `dispatch-notifications` — send confirmation to customer

#### 18. Real-Time Requirements

- Ticket status updates (push via WebSocket subscription)
- Appointment changes (push via WebSocket subscription)
- Notification bell badge updates
- Dispute status changes

#### 19. Notifications

| Type | Channel | Trigger |
|------|---------|---------|
| Ticket created confirmation | In-app, Email | `ticket.created.customer` |
| Ticket status change | In-app, Email, SMS | `ticket.status.changed` |
| Appointment confirmed | In-app, Email | `appointment.confirmed` |
| Appointment reminder | Email, SMS | 24h before appointment |
| Appointment cancelled | In-app, Email | `appointment.cancelled` |
| Dispute update | In-app, Email | `dispute.status.changed` |
| New followup required | In-app | `followup.created` |
| Account health change | In-app, Email | `account.health.changed` |

#### 20. Permissions

| Action | Check |
|--------|-------|
| View own tickets | `customer_id` matches authenticated user |
| View own appointments | `customer_id` matches authenticated user |
| View own disputes | Resolved via appointment → customer_id |
| Create ticket | Authenticated, customer status != dormant |
| Update profile | Own record only |
| Cancel appointment | Own appointment, status == scheduled |
| Book appointment | Authenticated, no existing appointment at same time |

#### 21. Entry Points

- Browser: `https://{domain}/customer-portal_v2/`
- Deep links: `/tickets/:id`, `/appointments/:id`, `/disputes/:id`
- Email links: token-based deep auth for passwordless login

#### 22. Exit Points

- Navigation to external billing/payment portal
- "Contact Support" → launches support ticket flow
- Email links for ticket/appointment confirmation
- Sign out → redirect to landing page

#### 23. Dependencies on Other Applications

| App | Dependency | Type |
|-----|-----------|------|
| support-center_v2 | Processes tickets created via portal | Event |
| appointment-center_v2 | Manages appointment scheduling flow | Event |
| resolution-center_v2 | Handles dispute resolution | Event |
| notification-center_v2 | Delivers all outbound notifications | Event |
| crm-center_v2 | Provides account health data | Event |
| admin-center_v2 | Manages customer user accounts | Direct (shared auth) |

#### 24. Cross-App Communication

| App | Communication | Method |
|-----|--------------|--------|
| notification-center_v2 | Sends confirmations | Event: `notification.send` |
| support-center_v2 | Pushes ticket updates | Event: `ticket.status.changed` |
| appointment-center_v2 | Pushes appointment updates | Event: `appointment.status.changed` |

#### 25. Future Extensibility

- Live chat with support agents
- IoT device status monitoring
- Multi-property account management
- Payment processing (credit card on file)
- Service subscription management
- Knowledge base / FAQ section
- Customer community forum

---

### 5.2 support-center_v2

#### 1. Purpose
Central ticket management system for support agents to triage, classify, respond to, and resolve customer requests across all channels.

#### 2. Primary Users
- Support agents (triage, reply)
- Support managers (oversight, approvals)
- Operations coordinators (escalation handling)

#### 3. Responsibilities
- Ingest tickets from all channels (portal, email, chat, SMS, phone, web)
- Classify tickets by type and urgency via AI agent
- Route tickets to appropriate owners
- Draft and approve customer replies
- Manage ticket lifecycle from new → closed
- Track SLAs and response times

#### 4. Business Capabilities
- Multi-channel ticket intake
- AI-powered ticket classification (type, urgency, suggested owner)
- Reply drafting with AI assistance
- Manager approval workflow for outbound replies
- Escalation management
- SLA tracking with breach warnings
- Ticket search and filtering
- Bulk operations (assign, close, tag)
- Customer communication history view
- Support agent performance metrics

#### 5. Pages

| Page | Route | Description |
|------|-------|-------------|
| Ticket Queue | `/tickets` | Main queue with filters, sorting, kanban view |
| Ticket Detail | `/tickets/:id` | Full ticket thread, timeline, actions |
| New Ticket (Manual) | `/tickets/new` | Manual ticket creation for phone/call-in tickets |
| My Tickets | `/my-tickets` | Assigned tickets for current user |
| Queue Management | `/queues` | Configure queue rules, routing |
| Escalations | `/escalations` | Escalated tickets requiring attention |
| Templates | `/templates` | Reply templates management |
| SLA Dashboard | `/sla` | SLA compliance metrics and breaches |

#### 6. Navigation Structure

```
Top Bar: [App Switcher] [Search] [Bell] [Avatar]
Sidebar:
  ├── Ticket Queue
  ├── My Tickets
  ├── Escalations
  ├── SLA Dashboard
  ├── Templates
  └── Queue Settings (manager+)
```

#### 7. Components

| Component | Description |
|-----------|-------------|
| TicketList | Virtualized sortable ticket table/kanban |
| TicketDetailPanel | Full ticket view with thread and metadata |
| MessageThread | Chronological customer/agent messages |
| ReplyEditor | Rich text input for draft reply |
| AIReplySuggestion | AI-drafted reply with accept/edit/reject |
| ClassificationBadges | Type + urgency badges on ticket cards |
| UrgencyIndicator | Color-coded urgency meter |
| SLAStopwatch | Real-time SLA countdown timer |
| OwnerAssigner | Searchable agent assignee dropdown |
| EscalationBanner | Alert banner for escalated tickets |
| TemplateSelector | Reply template picker |
| ChannelIcon | Visual channel indicator (email, chat, SMS, etc.) |
| TicketHistoryTimeline | Full event timeline for a ticket |
| BulkActionBar | Toolbar for multi-select operations |

#### 8. Dashboards

- **SLA Dashboard**: Compliance %, breached tickets, avg response time by channel, by agent
- **Agent Performance**: Tickets resolved, avg handle time, customer satisfaction score

#### 9. Forms

| Form | Fields | Validations |
|------|--------|-------------|
| Manual Ticket | customer_search, subject, message, request_type, channel, urgency, phone, email | Required: customer, subject, message |
| Reply Draft | message_content (rich text), use_ai_draft (toggle) | Required: message_content |
| Approve Reply | approval (approve/reject), manager_notes | Required: approval |
| Ticket Transfer | new_owner, transfer_note | Required: new_owner |
| New Template | name, body, request_type, category | Required: name, body |
| Escalation | escalation_reason, priority, notify_manager | Required: reason |

#### 10. Tables Viewed

| Table | Read Pattern |
|-------|-------------|
| tickets | Full access (all tickets) |
| customers | `getRecord` / `listRecords` for context |
| technicians | Read for suggested_owner resolution |
| appointments | Read for ticket context |
| disputes | Read for ticket context |
| operations_log | Filtered by ticket_id for activity feed |

#### 11. Tables Updated

| Table | Update Pattern |
|-------|---------------|
| tickets | `updateRecord(tickets, id, { status, owner, draft_reply, classified_type, urgency })` |

#### 12. Tables Created

| Table | Create Pattern |
|-------|---------------|
| tickets | `createRecord(tickets, { ... })` for manual entry tickets |

#### 13. Events Generated

| Event | Payload | Trigger |
|-------|---------|---------|
| `ticket.created` | `{ ticket_id, customer_id, request_type, urgency, channel }` | New ticket created |
| `ticket.classified` | `{ ticket_id, classified_type, urgency, suggested_owner, confidence }` | AI classification complete |
| `ticket.reply.drafted` | `{ ticket_id, draft_reply_content, agent_id }` | Reply drafted |
| `ticket.reply.approved` | `{ ticket_id, approved_by }` | Manager approves reply |
| `ticket.status.changed` | `{ ticket_id, old_status, new_status, actor }` | Any status transition |
| `ticket.escalated` | `{ ticket_id, escalation_reason, escalated_to }` | Ticket escalated |

#### 14. Events Consumed

| Event | Handler | Effect |
|-------|---------|--------|
| `ticket.intake.completed` | Add ticket to queue | New ticket visible in queue |
| `agent.classification.completed` | Update ticket card | Classification badges render |
| `ticket.reply.sent` | Mark ticket as sent | Status updates |
| `notification.new` | Bell badge update | Agent notified of ticket update |

#### 15. Workflows That Will Connect Later

- **ticket-intake_v2** — classifies, routes, manages ticket lifecycle
- **urgent-dispatch_v2** — handles urgent/critical tickets
- **support-escalation-manager_v2** — manages escalation path
- **customer-satisfaction-monitor_v2** — tracks satisfaction post-resolution

#### 16. Agents That Will Connect Later

- **request-classifier_v2** — AI classification of new tickets
- **support-reply-drafter_v2** — AI drafting of customer replies

#### 17. Functions That Will Connect Later

- `check-ticket-urgency` — deterministic urgency evaluation
- `update-ticket-record` — state machine for ticket transitions

#### 18. Real-Time Requirements

- New ticket appears in queue without page refresh
- Ticket status changes reflect immediately
- Urgency/SLA countdown timers tick in real time
- Collaboration: multiple agents viewing same ticket see updates

#### 19. Notifications

| Type | Channel | Trigger |
|------|---------|---------|
| New ticket assigned | In-app | `ticket.created` with owner match |
| Ticket escalated | In-app, Email | `ticket.escalated` |
| SLA breach warning | In-app | Configurable threshold before breach |
| Reply approval requested | In-app | `ticket.reply.drafted` |
| @mention in ticket | In-app | Mention detected in message |

#### 20. Permissions

| Role | Queues Visible | Actions |
|------|---------------|---------|
| Agent | Assigned queue | View, draft replies, update status |
| Senior Agent | All queues | Transfer, escalate, approve replies |
| Manager | All queues | Approve, reassign, manage templates, SLA settings |
| Admin | All queues | All actions + queue config |

#### 21. Entry Points

- Browser: `https://{domain}/support-center_v2/`
- Deep links: `/tickets/:id`, `/tickets/new`
- In-app navigation from other apps (e.g., view ticket from customer portal)

#### 22. Exit Points

- Approve reply → notification-center_v2 sends to customer
- Escalate → operations-center_v2 receives escalation
- Close ticket → event triggers satisfaction monitor

#### 23. Dependencies on Other Applications

| App | Dependency | Type |
|-----|-----------|------|
| customer-portal_v2 | Creates tickets to be processed | Event |
| operations-center_v2 | Receives escalations | Event |
| notification-center_v2 | Sends replies to customers | Event |
| crm-center_v2 | Provides customer context | Data |
| technician-portal_v2 | Provides technician availability | Data |
| analytics-center_v2 | Consumes ticket metrics | Event |
| admin-center_v2 | User/role management | Shared |

#### 24. Cross-App Communication

| App | Communication | Method |
|-----|--------------|--------|
| notification-center_v2 | Sends customer replies | Event: `notification.send` |
| operations-center_v2 | Sends escalation | Event: `ticket.escalated` |
| analytics-center_v2 | Feeds ticket metrics | Event: `ticket.status.changed` |

#### 25. Future Extensibility

- Omnichannel inbox (unified messaging across all channels)
- Chatbot integration for pre-triage
- Knowledge base integration for suggested solutions
- Sentiment analysis on customer messages
- Automated responses for common queries
- Voice call recording and transcription
- Multi-language support

---

### 5.3 operations-center_v2

#### 1. Purpose
Daily operations command center for coordinating field service operations, managing tasks, dispatching urgent jobs, and overseeing the operational health of the service organization.

#### 2. Primary Users
- Operations coordinators
- Dispatch managers
- Service managers
- Operations directors

#### 3. Responsibilities
- Aggregate operational status across all domains
- Coordinate technician dispatch for urgent jobs
- Create and assign operational tasks
- Monitor daily standup KPIs
- Manage cross-team collaboration
- Track and resolve operational blockers
- Oversee urgent dispatch lifecycle

#### 4. Business Capabilities
- Centralized operations dashboard
- Urgent dispatch coordination and tracking
- Task management (create, assign, track, complete)
- Daily standup KPI generation
- Cross-app operational view
- Technician workload overview
- Customer appointment status monitoring
- Incident management for service outages
- Operational log review and audit

#### 5. Pages

| Page | Route | Description |
|------|-------|-------------|
| Operations Dashboard | `/` | Daily KPIs, urgent dispatches, active tasks |
| Task Board | `/tasks` | Kanban board for operational tasks |
| Task Detail | `/tasks/:id` | Task details, activity, assignment |
| Dispatch Center | `/dispatch` | Urgent dispatch queue and coordination |
| Dispatch Detail | `/dispatch/:id` | Full dispatch lifecycle view |
| Daily Standup | `/standup` | Auto-generated daily ops summary |
| Technician Workload | `/technicians` | Technician availability and load |

#### 6. Navigation Structure

```
Top Bar: [App Switcher] [Search] [Bell] [Avatar]
Sidebar:
  ├── Dashboard
  ├── Task Board
  ├── Dispatch Center
  ├── Daily Standup
  └── Technician Workload
```

#### 7. Components

| Component | Description |
|-----------|-------------|
| KpiCardRow | Horizontal row of KPI metric cards |
| UrgentDispatchPanel | Real-time urgent dispatch list with actions |
| TaskKanban | Drag-and-drop kanban board for tasks |
| TaskCard | Compact task card for kanban |
| DispatchTimeline | Full lifecycle timeline for a dispatch |
| StandupReportCard | Auto-generated daily report preview |
| TechnicianLoadBar | Horizontal bar chart of technician utilization |
| OperationalBlockerBanner | Warning banner for active blockers |
| QuickActionButton | One-click common ops actions |
| CrossAppSummary | Widgets from other apps aggregated |

#### 8. Dashboards

- **Operations Dashboard**: KPIs row (open tickets, pending dispatches, scheduled appointments, overdue followups), urgent dispatch panel, top 5 active tasks, today's appointments summary, recent operations log

#### 9. Forms

| Form | Fields | Validations |
|------|--------|-------------|
| New Task | title, description, owner, priority, due_date, category | Required: title, owner |
| Edit Task | status, owner, priority, due_date | Required: status |
| Dispatch Coordination | ticket_id, technician_id, notes, priority | Required: ticket, technician |
| Daily Standup Notes | notes, blockers, priorities | Optional |
| Incident Report | title, severity, description, affected_systems | Required: title, severity |

#### 10. Tables Viewed

| Table | Read Pattern |
|-------|-------------|
| tickets | Filtered: urgent, unassigned, escalated |
| tasks | All tasks with filters |
| appointments | Today + scheduled |
| technicians | Availability and load |
| operations_log | Recent operations |
| customers | Context for dispatch |
| followups | Overdue followups alert |

#### 11. Tables Updated

| Table | Update Pattern |
|-------|---------------|
| tasks | `updateRecord(tasks, id, { status, owner, ... })` |
| operations_log | `createRecord(operations_log, { action, result, actor })` |

#### 12. Tables Created

| Table | Create Pattern |
|-------|---------------|
| tasks | `createRecord(tasks, { title, owner, priority, ... })` |

#### 13. Events Generated

| Event | Payload | Trigger |
|-------|---------|---------|
| `task.created` | `{ task_id, title, owner, priority, due_date }` | New task created |
| `task.status.changed` | `{ task_id, old_status, new_status, actor }` | Task status transition |
| `dispatch.initiated` | `{ dispatch_id, ticket_id, technician_id }` | Urgent dispatch started |
| `dispatch.completed` | `{ dispatch_id, ticket_id, result }` | Dispatch resolved |
| `daily.standup.generated` | `{ standup_id, date, summary }` | Daily standup report generated |

#### 14. Events Consumed

| Event | Handler | Effect |
|-------|---------|--------|
| `ticket.escalated` | Add to dispatch queue | New dispatch entry |
| `ticket.classified` | Alert if urgent | Urgent badge in queue |
| `task.assigned` | Update task owner | Owner sees new task |
| `appointment.status.changed` | Update dashboard | KPI recalculation |
| `followup.slippage.detected` | Alert on dashboard | Blocker banner |
| `account.health.changed` | Update dashboard | Alert if critical |

#### 15. Workflows That Will Connect Later

- **urgent-dispatch_v2** — full dispatch lifecycle
- **daily-standup_v2** — automated standup generation
- **followup-slippage-detector_v2** — alert on slippage
- **appointment-assignment_v2** — monitor assignments

#### 16. Agents That Will Connect Later

- **operations-coordinator_v2** — generates recommendations, creates tasks
- **account-health-monitor_v2** — provides account health data

#### 17. Functions That Will Connect Later

- `create-operations-tasks` — automated task creation from agent output
- `dispatch-notifications` — notify stakeholders of dispatch

#### 18. Real-Time Requirements

- Dispatch panel updates in real time
- Active task board shows live status changes
- Technician workload updates dynamically
- KPI counters refresh on data change

#### 19. Notifications

| Type | Channel | Trigger |
|------|---------|---------|
| Urgent dispatch | In-app, Discord | `ticket.escalated` |
| Task assigned | In-app | `task.created` with owner |
| Blocker detected | In-app | Operations agent detects |
| Standup ready | In-app, Email | `daily.standup.generated` |
| SLA warning | In-app | Configurable threshold |

#### 20. Permissions

| Role | Access |
|------|--------|
| Coordinator | Full ops center access |
| Manager | All ops + task assignment override |
| Director | All ops + dispatch override + daily standup config |
| Admin | All ops + system config |

#### 21. Entry Points

- Browser: `https://{domain}/operations-center_v2/`
- Deep links: `/tasks/:id`, `/dispatch/:id`
- In-app alerts → deep link to dispatch/task

#### 22. Exit Points

- Dispatch initiated → notification-center_v2 sends to technician
- Task created → notification-center_v2 notifies assignee
- Daily standup → exported/emailed to stakeholders

#### 23. Dependencies on Other Applications

| App | Dependency | Type |
|-----|-----------|------|
| support-center_v2 | Provides escalated tickets | Event |
| appointment-center_v2 | Appointment status for dashboard | Event |
| technician-portal_v2 | Technician workload data | Data |
| notification-center_v2 | Sends dispatch/task alerts | Event |
| crm-center_v2 | Followup slippage alerts | Event |
| analytics-center_v2 | Consumes operational metrics | Event |
| admin-center_v2 | User/role management | Shared |

#### 24. Cross-App Communication

| App | Communication | Method |
|-----|--------------|--------|
| support-center_v2 | Reads escalations | Event subscription |
| notification-center_v2 | Sends alerts | Event: `dispatch.notification` |
| technician-portal_v2 | Reads technician state | Data query |

#### 25. Future Extensibility

- Real-time GPS tracking of technician vehicles
- Weather integration for dispatch planning
- Inventory management for parts/equipment
- Shift scheduling and time-off management
- Emergency response coordination mode
- Third-party logistics provider integration
- AI-driven dispatch optimization

---

### 5.4 appointment-center_v2

#### 1. Purpose
Comprehensive appointment scheduling engine that manages the full lifecycle from booking through completion, including technician assignment and schedule optimization.

#### 2. Primary Users
- Scheduling coordinators
- Operations coordinators
- Service managers
- Customers (indirectly via portal)

#### 3. Responsibilities
- Manage appointment booking, rescheduling, cancellation
- Assign technicians to appointments
- Optimize technician schedules
- Track appointment status lifecycle
- Handle appointment reminders
- Coordinate with resolution for disputed appointments

#### 4. Business Capabilities
- Appointment scheduling (manual and self-service)
- AI-powered technician suggestion based on skill, location, availability, rating
- Manager approval workflow for technician assignments
- Schedule conflict detection
- Calendar view of all appointments
- Technician schedule management
- Service type configuration
- Appointment status tracking (scheduled → in_progress → completed → followup)
- Appointment reminders and notifications

#### 5. Pages

| Page | Route | Description |
|------|-------|-------------|
| Schedule Board | `/` | Calendar/schedule overview of all appointments |
| Appointment Detail | `/appointments/:id` | Full appointment info, technician, customer |
| New Appointment | `/appointments/new` | Manual booking form |
| Reschedule | `/appointments/:id/reschedule` | Reschedule workflow |
| Technician Schedule | `/technicians/:id/schedule` | Single technician schedule view |
| Service Types | `/services` | Manage service type catalog |
| Schedule Settings | `/settings` | Scheduling rules, buffers, constraints |

#### 6. Navigation Structure

```
Top Bar: [App Switcher] [Search] [Bell] [Avatar]
Sidebar:
  ├── Schedule Board
  ├── New Appointment
  ├── Technician Schedules
  ├── Service Types
  └── Settings
```

#### 7. Components

| Component | Description |
|-----------|-------------|
| ScheduleCalendar | Monthly/weekly/daily calendar grid view |
| AppointmentCard | Compact appointment display on calendar |
| TechnicianPicker | Searchable dropdown with skill, availability, rating |
| TechSuggestionCard | AI-recommended technicians with confidence |
| ConflictWarning | Visual indicator for scheduling conflicts |
| BookingWizard | Multi-step booking flow |
| TimeSlotPicker | Available time slot grid |
| ServiceTypeSelector | Service type dropdown with descriptions |
| TechnicianDayView | Daily schedule for a single technician |
| AppointmentTimeline | Status lifecycle timeline |

#### 8. Dashboards

- **Schedule Board Dashboard**: Calendar view, today's appointments count, unassigned appointments, technician availability summary

#### 9. Forms

| Form | Fields | Validations |
|------|--------|-------------|
| New Appointment | customer_search, service_type, date, time_slot, technician_id, notes | Required: customer, service_type, date |
| Reschedule | appointment_id, new_date, new_time_slot, reason | Required: date, time; future date |
| Assign Technician | appointment_id, technician_id, notes | Required: technician |
| Service Type Config | name, description, duration_minutes, required_skills, buffer_minutes | Required: name, duration |
| Time Off Block | technician_id, start_date, end_date, reason | Required: dates, no overlap |

#### 10. Tables Viewed

| Table | Read Pattern |
|-------|-------------|
| appointments | All appointments with filters |
| technicians | All technicians for assignment |
| customers | Customer details for appointments |
| tickets | Related tickets for context |
| operations_log | Appointment audit trail |

#### 11. Tables Updated

| Table | Update Pattern |
|-------|---------------|
| appointments | `updateRecord(appointments, id, { status, technician_id, date, ... })` |

#### 12. Tables Created

| Table | Create Pattern |
|-------|---------------|
| appointments | `createRecord(appointments, { customer_id, service_type, date, status: 'scheduled', ... })` |

#### 13. Events Generated

| Event | Payload | Trigger |
|-------|---------|---------|
| `appointment.created` | `{ appointment_id, customer_id, service_type, date }` | New appointment booked |
| `appointment.assigned` | `{ appointment_id, technician_id }` | Technician assigned |
| `appointment.status.changed` | `{ appointment_id, old_status, new_status }` | Status transition |
| `appointment.cancelled` | `{ appointment_id, reason, cancelled_by }` | Appointment cancelled |
| `appointment.completed` | `{ appointment_id, technician_id, notes }` | Appointment marked complete |

#### 14. Events Consumed

| Event | Handler | Effect |
|-------|---------|--------|
| `ticket.classified` | Create appointment if service required | Auto-schedule via workflow |
| `customer.appointment.requested` | Create appointment from portal booking | New appointment in queue |
| `technician.status.changed` | Update availability | Schedule recalculation |
| `dispute.created` | Flag appointment as disputed | Appointment status change |

#### 15. Workflows That Will Connect Later

- **appointment-assignment_v2** — AI tech suggestion → manager approval → assignment
- **appointment-reminders_v2** — 24h/2h reminder scheduling
- **urgent-dispatch_v2** — coordinates urgent appointments

#### 16. Agents That Will Connect Later

- **tech-suggester_v2** — AI technician recommendation

#### 17. Functions That Will Connect Later

- `assign-appointment-technician` — deterministic assignment override
- `fetch-upcoming-appointments` — for reminder generation

#### 18. Real-Time Requirements

- Calendar view updates when appointments change
- Technician availability reflects real-time status
- Conflict detection on overlapping appointments
- New appointment requests appear without refresh

#### 19. Notifications

| Type | Channel | Trigger |
|------|---------|---------|
| Appointment confirmed | In-app, Email | `appointment.created` |
| Appointment assigned | In-app | `appointment.assigned` |
| Appointment reminder | Email, SMS | 24h + 2h before |
| Technician reassigned | In-app | `appointment.assigned` (update) |
| Appointment cancelled | In-app, Email | `appointment.cancelled` |
| Schedule conflict | In-app | Conflict detection |

#### 20. Permissions

| Role | Access |
|------|--------|
| Scheduler | Full CRUD on appointments |
| Manager | All + approval override + service config |
| Technician | Read own schedule only |
| Coordinator | Read all + create/reschedule |
| Admin | All + system config |

#### 21. Entry Points

- Browser: `https://{domain}/appointment-center_v2/`
- Deep links: `/appointments/:id`, `/technicians/:id/schedule`
- From customer-portal_v2: book/reschedule link

#### 22. Exit Points

- Appointment confirmed → notification-center_v2 notifies customer
- Technician assigned → notification-center_v2 notifies technician
- Appointment completed → may trigger satisfaction survey

#### 23. Dependencies on Other Applications

| App | Dependency | Type |
|-----|-----------|------|
| customer-portal_v2 | Receives booking requests | Event |
| technician-portal_v2 | Technician reads schedule | Data |
| notification-center_v2 | Sends all appointment notifications | Event |
| resolution-center_v2 | Handles disputed appointments | Event |
| operations-center_v2 | Dashboard visibility | Event |
| analytics-center_v2 | Appointment metrics | Event |
| admin-center_v2 | User/role management | Shared |

#### 24. Cross-App Communication

| App | Communication | Method |
|-----|--------------|--------|
| customer-portal_v2 | Receives booking/reschedule requests | Event subscription |
| technician-portal_v2 | Exposes schedule to technician | Shared table read |
| notification-center_v2 | Triggers reminders | Event: `notification.send` |

#### 25. Future Extensibility

- Automated scheduling optimization (route optimization, skill matching, travel time)
- Recurring appointment patterns (weekly/monthly service plans)
- Geofencing for technician arrival detection
- Customer wait-time estimates
- Multi-location/multi-territory scheduling
- Real-time schedule trading between technicians
- Emergency same-day appointment slots

---

### 5.5 technician-portal_v2

#### 1. Purpose
Field technician mobile-first portal for viewing assignments, managing appointments, updating job status, and communicating with operations.

#### 2. Primary Users
- Field service technicians
- Senior/lead technicians

#### 3. Responsibilities
- View daily schedule and upcoming appointments
- Access customer and job details
- Update appointment status (arrived, in progress, completed)
- View and complete assigned tasks
- Submit job notes and photos
- View notifications and dispatches
- Communicate with operations center

#### 4. Business Capabilities
- Daily schedule view (list and calendar)
- Turn-by-turn job navigation
- In-progress status updates (en route → on-site → in progress → completed)
- Job detail view (customer info, service type, notes)
- Photo/document upload for job completion
- Task list with status updates
- Notification feed (dispatches, schedule changes)
- Availability toggle (available, busy, off shift)
- Skill profile management

#### 5. Pages

| Page | Route | Description |
|------|-------|-------------|
| My Day | `/` | Today's schedule, next job, notifications |
| Appointments | `/appointments` | All assigned appointments |
| Appointment Detail | `/appointments/:id` | Job details, customer info, actions |
| Task List | `/tasks` | Assigned operational tasks |
| Task Detail | `/tasks/:id` | Task details and completion |
| Notifications | `/notifications` | Notification history |
| Profile | `/profile` | Availability, skills, contact info |

#### 6. Navigation Structure

```
Top Bar: [Logo] [Bell] [Avatar]
Bottom Nav (mobile-first):
  ├── My Day
  ├── Jobs
  ├── Tasks
  ├── Notifications
  └── Profile
```

#### 7. Components

| Component | Description |
|-----------|-------------|
| DaySchedule | Today's appointment timeline/list |
| JobCard | Compact job card with address, time, type |
| JobStatusStepper | En route → On site → In progress → Complete |
| CustomerInfoPanel | Customer name, phone, address, notes |
| PhotoUploader | Camera/gallery upload for job evidence |
| JobNotesEditor | Rich text notes field |
| TaskChecklist | Assignable task checklist for a job |
| NotificationFeed | Scrollable notification list |
| AvailabilityToggle | Status switch (available/busy/off_shift) |
| MapView | Map with job locations (Leaflet) |

#### 8. Dashboards

- **My Day Dashboard**: Next job countdown, today's job list, unread notifications badge, next appointment card with navigation button

#### 9. Forms

| Form | Fields | Validations |
|------|--------|-------------|
| Job Complete | completion_notes, photos (multi), followup_needed, parts_used | Required: notes |
| Status Update | new_status, notes, estimated_completion_time | Required: status |
| Task Complete | completion_notes | Optional |
| Availability | status (available/busy/off_shift), reason_if_off | Required: status |
| Report Issue | issue_type, description, job_id | Required: issue_type, description |
| Expense Report | amount, category, receipt_photo, job_id | Required: amount, category |

#### 10. Tables Viewed

| Table | Read Pattern |
|-------|-------------|
| appointments | `listRecords(appointments, { technician_id })` — own assignments |
| customers | `getRecord(customers, id)` — job-specific customer info |
| tasks | `listRecords(tasks, { owner: technician_id })` — own tasks |
| technicians | `getRecord(technicians, id)` — own profile |
| notifications | Custom notification table |

#### 11. Tables Updated

| Table | Update Pattern |
|-------|---------------|
| appointments | `updateRecord(appointments, id, { status, notes })` — own appointments |
| technicians | `updateRecord(technicians, id, { availability, status })` — own profile |
| tasks | `updateRecord(tasks, id, { status })` — own tasks |

#### 12. Tables Created

| Table | Create Pattern |
|-------|---------------|
| (job_evidence) | `createRecord(job_evidence, { appointment_id, photos, notes })` — new table for V2 |

#### 13. Events Generated

| Event | Payload | Trigger |
|-------|---------|---------|
| `technician.status.changed` | `{ technician_id, old_status, new_status }` | Availability toggle |
| `appointment.status.changed` | `{ appointment_id, technician_id, new_status, notes }` | Job status update |
| `task.completed` | `{ task_id, technician_id, notes }` | Task completion |

#### 14. Events Consumed

| Event | Handler | Effect |
|-------|---------|--------|
| `appointment.assigned` | Add job to schedule | New job appears |
| `appointment.rescheduled` | Update schedule | Job time/date updates |
| `appointment.cancelled` | Remove from schedule | Job removed |
| `dispatch.initiated` | Show urgent dispatch alert | Alert banner + job |
| `task.created` | Add to task list | New task appears |

#### 15. Workflows That Will Connect Later

- **urgent-dispatch_v2** — technician receives dispatch assignments
- **appointment-assignment_v2** — technician receives assignments
- **appointment-reminders_v2** — technician receives reminders

#### 16. Agents That Will Connect Later

- **operations-coordinator_v2** — assigns tasks to technician

#### 17. Functions That Will Connect Later

- `dispatch-notifications` — alerts technician of dispatch
- `fetch-upcoming-appointments` — for daily schedule sync

#### 18. Real-Time Requirements

- New job assignment pushes to technician immediately
- Schedule changes reflect in real time
- Dispatch alerts are instant
- Notification bell updates in real time

#### 19. Notifications

| Type | Channel | Trigger |
|------|---------|---------|
| New job assigned | In-app, SMS | `appointment.assigned` |
| Job rescheduled | In-app, SMS | `appointment.rescheduled` |
| Job cancelled | In-app | `appointment.cancelled` |
| Urgent dispatch | In-app, SMS, Push | `dispatch.initiated` |
| Task assigned | In-app | `task.created` |
| Daily reminder | In-app, SMS | Morning schedule push |

#### 20. Permissions

| Role | Access |
|------|--------|
| Technician | Own schedule, own tasks, own profile |
| Lead Technician | Own + team view, task assignment |
| Manager | Read all technician schedules, override |

#### 21. Entry Points

- Browser: `https://{domain}/technician-portal_v2/`
- Mobile: PWA installable from browser
- Deep links (push): `/appointments/:id`
- SMS deep links with token auth

#### 22. Exit Points

- Job completed → event triggers followup workflow
- Issue reported → event triggers escalation
- Navigation → deep link to maps app (external)

#### 23. Dependencies on Other Applications

| App | Dependency | Type |
|-----|-----------|------|
| appointment-center_v2 | Provides assignments | Event + Data |
| operations-center_v2 | Provides tasks, dispatches | Event + Data |
| notification-center_v2 | Sends all technician alerts | Event |
| support-center_v2 | Provides ticket context for job | Data |
| admin-center_v2 | Manages technician user accounts | Shared |

#### 24. Cross-App Communication

| App | Communication | Method |
|-----|--------------|--------|
| appointment-center_v2 | Reads own assignments | Shared table read |
| operations-center_v2 | Receives tasks, dispatch | Event subscription |
| notification-center_v2 | Receives push notifications | Event subscription |

#### 25. Future Extensibility

- Turn-by-turn navigation with Waze/Google Maps integration
- Barcode/QR scanning for parts inventory
- Digital signature capture on completion
- Customer-facing tablet mode (show job details to customer)
- Time tracking with clock-in/clock-out
- In-app chat with operations center
- Offline mode for remote areas
- Vehicle telemetry integration

---

### 5.6 resolution-center_v2

#### 1. Purpose
Dispute resolution hub that manages service disputes from filing through analysis, recommendation, approval, and closure, powered by AI-driven analysis.

#### 2. Primary Users
- Resolution managers
- Customer service managers
- Operations coordinators
- Customers (indirectly via portal)

#### 3. Responsibilities
- Manage dispute lifecycle (open → analyzing → recommendation → approved → closed)
- Invoke AI analysis of disputes
- Present resolution recommendations with confidence scoring
- Support human review and approval workflow
- Track resolution outcomes and trends
- Coordinate with appointments and tickets

#### 4. Business Capabilities
- Dispute intake from multiple sources
- AI-powered dispute analysis (claim summary, evidence evaluation)
- Resolution recommendation generation with confidence score
- Manager approval workflow for recommendations
- Dispute resolution tracking and reporting
- Escalation for low-confidence recommendations
- Customer communication on dispute status
- Dispute trend analysis

#### 5. Pages

| Page | Route | Description |
|------|-------|-------------|
| Dispute Queue | `/disputes` | All disputes with filters, status, priority |
| Dispute Detail | `/disputes/:id` | Full dispute view, analysis, actions |
| Resolution Approval | `/approvals` | Pending resolution approvals |
| Resolution History | `/history` | Closed disputes with resolution summaries |
| Trend Analysis | `/trends` | Dispute patterns, common issues, resolution rates |

#### 6. Navigation Structure

```
Top Bar: [App Switcher] [Search] [Bell] [Avatar]
Sidebar:
  ├── Dispute Queue
  ├── Pending Approvals
  ├── Resolution History
  └── Trend Analysis
```

#### 7. Components

| Component | Description |
|-----------|-------------|
| DisputeList | Sortable, filterable dispute table |
| DisputeDetailPanel | Full dispute info with claim/evidence |
| AIAnalysisCard | AI analysis summary with evidence breakdown |
| RecommendationCard | AI-proposed resolution with confidence meter |
| ConfidenceIndicator | Visual confidence bar (low/medium/high) |
| EvidenceViewer | Claim, provider claim, evidence display |
| ApprovalWorkflow | Approve/reject/escalate action bar |
| EscalationBanner | Alert for low-confidence recommendations |
| DisputeTimeline | Full timeline of dispute events |
| TrendChart | Dispute trends over time |

#### 8. Dashboards

- **Dispute Queue Dashboard**: Open disputes count, pending approvals, avg resolution time, resolution rate, trend chart

#### 9. Forms

| Form | Fields | Validations |
|------|--------|-------------|
| Manual Dispute | appointment_search, customer_claim, provider_claim, evidence_summary | Required: appointment, customer_claim |
| Approve Resolution | resolution_id, manager_notes, approval | Required: approval decision |
| Reject Resolution | resolution_id, rejection_reason, request_reanalysis | Required: reason |
| Escalate Dispute | dispute_id, escalation_reason, escalated_to | Required: reason |
| Close Dispute | dispute_id, final_outcome, customer_notes | Required: outcome |

#### 10. Tables Viewed

| Table | Read Pattern |
|-------|-------------|
| disputes | All disputes with filters |
| appointments | Related appointment details |
| customers | Customer details for context |
| tickets | Related service tickets |
| operations_log | Dispute event audit trail |

#### 11. Tables Updated

| Table | Update Pattern |
|-------|---------------|
| disputes | `updateRecord(disputes, id, { status, recommended_resolution, confidence, ... })` |

#### 12. Tables Created

| Table | Create Pattern |
|-------|---------------|
| disputes | `createRecord(disputes, { appointment_id, customer_claim, provider_claim, ... })` |

#### 13. Events Generated

| Event | Payload | Trigger |
|-------|---------|---------|
| `dispute.created` | `{ dispute_id, appointment_id, customer_id }` | New dispute filed |
| `dispute.analyzed` | `{ dispute_id, confidence, recommended_resolution }` | AI analysis complete |
| `dispute.status.changed` | `{ dispute_id, old_status, new_status, actor }` | Any status transition |
| `dispute.resolved` | `{ dispute_id, resolution, final_outcome }` | Dispute closed |

#### 14. Events Consumed

| Event | Handler | Effect |
|-------|---------|--------|
| `appointment.status.changed` | Flag for dispute if status=needs_followup | Potential dispute trigger |
| `customer.dispute.filed` | Create dispute record | New dispute in queue |
| `agent.analysis.completed` | Update dispute with recommendation | Recommendation ready for review |

#### 15. Workflows That Will Connect Later

- **dispute-resolution_v2** — full dispute analysis and resolution workflow

#### 16. Agents That Will Connect Later

- **resolution-advisor_v2** — AI dispute analysis and recommendation

#### 17. Functions That Will Connect Later

- `resolve-dispute` — deterministic dispute resolution actions

#### 18. Real-Time Requirements

- Dispute status changes reflect immediately
- AI analysis completion updates in real time
- Approval queue updates on new recommendations

#### 19. Notifications

| Type | Channel | Trigger |
|------|---------|---------|
| New dispute | In-app | `dispute.created` |
| Recommendation ready | In-app | `dispute.analyzed` |
| Approval required | In-app, Email | `dispute.analyzed` (low confidence) |
| Dispute resolved | In-app, Email | `dispute.resolved` |
| Escalation needed | In-app | Confidence < threshold |

#### 20. Permissions

| Role | Access |
|------|--------|
| Resolution Agent | View disputes, add evidence |
| Resolution Manager | All + approve/reject/escalate |
| Admin | All + system config |

#### 21. Entry Points

- Browser: `https://{domain}/resolution-center_v2/`
- Deep links: `/disputes/:id`, `/approvals`
- From appointment-center_v2: disputed appointment link

#### 22. Exit Points

- Dispute resolved → notification-center_v2 notifies customer
- Escalated → operations-center_v2 receives escalation
- Resolution → update account health in crm-center_v2

#### 23. Dependencies on Other Applications

| App | Dependency | Type |
|-----|-----------|------|
| appointment-center_v2 | Provides appointment context | Event + Data |
| customer-portal_v2 | Receives dispute status updates | Event |
| notification-center_v2 | Sends dispute notifications | Event |
| crm-center_v2 | Updates account health on outcome | Event |
| operations-center_v2 | Receives escalations | Event |
| analytics-center_v2 | Consumes dispute metrics | Event |
| admin-center_v2 | User/role management | Shared |

#### 24. Cross-App Communication

| App | Communication | Method |
|-----|--------------|--------|
| appointment-center_v2 | Gets appointment context | Shared table read |
| customer-portal_v2 | Pushes dispute updates | Event: `dispute.status.changed` |
| crm-center_v2 | Informs account health | Event: `dispute.resolved` |
| notification-center_v2 | Sends notifications | Event: `notification.send` |

#### 25. Future Extensibility

- Automated compensation calculation
- Legal case management integration
- Third-party mediation connector
- Customer satisfaction survey post-resolution
- Dispute pattern ML model
- Evidence upload portal for customers
- Arbitration workflow for unresolved disputes
- Insurance claim integration

---

### 5.7 crm-center_v2

#### 1. Purpose
Customer relationship management hub focused on account health monitoring, followup management, retention risk detection, and proactive customer engagement.

#### 2. Primary Users
- Account managers
- Customer success managers
- Operations managers
- Customers (indirectly via portal)

#### 3. Responsibilities
- Monitor account health across all metrics
- Detect at-risk accounts through health scoring
- Manage and track followup items
- Flag and handle slipping followups
- Run automated account health scans
- Coordinate retention efforts for critical accounts
- Provide account 360-degree view

#### 4. Business Capabilities
- Account health scoring and categorization (healthy, watch, slipping, critical)
- Automated health scan on schedule and on-demand
- Followup creation, assignment, tracking
- Slipping followup detection and alerting
- Account risk signal detection (open disputes, overdue followups, dormant status)
- Account 360 view (appointments, tickets, disputes, followups, revenue)
- Retention campaign triggers
- Account segmentation and filtering
- Batch operations on accounts

#### 5. Pages

| Page | Route | Description |
|------|-------|-------------|
| Account Dashboard | `/` | Health summary, risk alerts, key metrics |
| Account List | `/accounts` | All accounts with health filters, search |
| Account Detail | `/accounts/:id` | 360 view: health, tickets, appointments, disputes, followups |
| Followup Center | `/followups` | All followups with status, priority, overdue |
| Health Scans | `/scans` | Run history and results of health scans |
| Risk Signals | `/risks` | Aggregated risk signals across accounts |

#### 6. Navigation Structure

```
Top Bar: [App Switcher] [Search] [Bell] [Avatar]
Sidebar:
  ├── Dashboard
  ├── Accounts
  ├── Followup Center
  ├── Health Scans
  └── Risk Signals
```

#### 7. Components

| Component | Description |
|-----------|-------------|
| HealthGauge | Circular gauge showing health score (0-100) |
| AccountHealthCard | Account card with health badge and key metrics |
| HealthCategoryBar | Horizontal bar chart of health distribution |
| FollowupList | Sortable followup table with priority colors |
| SlippingAlertBanner | Alert for overdue/slipping followups |
| RiskSignalCard | Risk signal summary card |
| AccountTimeline | 360 timeline of all account activity |
| HealthScanResultCard | Recent scan summary |
| AccountSearchDropdown | Searchable customer account picker |
| AccountQuickActions | Actions bar (schedule scan, create followup) |

#### 8. Dashboards

- **Account Dashboard**: Health distribution (healthy/slipping/critical count), recent risk signals, overdue followups count, upcoming appointments for watched accounts, last scan timestamp

#### 9. Forms

| Form | Fields | Validations |
|------|--------|-------------|
| New Followup | account_id, customer_id, type, subject, priority, due_date, owner, notes | Required: account, type, subject |
| Update Followup | status, notes, completed_date | Required: status |
| Manual Health Scan | trigger_reason, accounts (multi-select or all) | Required: reason |
| Account Note | account_id, note_content, category | Required: note_content |
| Account Segment | name, filter_criteria, color | Required: name |
| Bulk Action | accounts (multi-select), action, parameters | Required: action |

#### 10. Tables Viewed

| Table | Read Pattern |
|-------|-------------|
| accounts | All accounts with filters |
| customers | Customer details for account context |
| followups | All followups, filtered by account_id or status |
| appointments | Related appointments for account |
| tickets | Related tickets for account |
| disputes | Related disputes for account |
| operations_log | Account-related activity |

#### 11. Tables Updated

| Table | Update Pattern |
|-------|---------------|
| accounts | `updateRecord(accounts, id, { health, health_score, last_scan_date, ... })` |
| followups | `updateRecord(followups, id, { status, priority, owner, ... })` |

#### 12. Tables Created

| Table | Create Pattern |
|-------|---------------|
| followups | `createRecord(followups, { account_id, customer_id, type, subject, ... })` |

#### 13. Events Generated

| Event | Payload | Trigger |
|-------|---------|---------|
| `account.health.scan.completed` | `{ scan_id, accounts_scanned, critical_count, slipping_count }` | Health scan completes |
| `account.health.changed` | `{ account_id, customer_id, old_health, new_health, health_score }` | Health category changes |
| `followup.created` | `{ followup_id, account_id, type, priority, due_date, owner }` | New followup created |
| `followup.slippage.detected` | `{ followup_id, account_id, days_overdue }` | Followup overdue threshold |

#### 14. Events Consumed

| Event | Handler | Effect |
|-------|---------|--------|
| `ticket.status.changed` | May affect account health | Health score recalculation |
| `dispute.resolved` | May improve account health | Positive health adjustment |
| `appointment.completed` | May improve account health | Positive health adjustment |
| `account.health.changed` | Trigger notification if critical | Alert generation |
| `notification.new` | Bell badge update | In-app alert |
| `appointment.created` | Add to account timeline | Activity feed update |

#### 15. Workflows That Will Connect Later

- **account-health-monitoring_v2** — scheduled health scans + escalation
- **followup-slippage-detector_v2** — automated slippage detection

#### 16. Agents That Will Connect Later

- **account-health-monitor_v2** — AI-driven health analysis and recommendations

#### 17. Functions That Will Connect Later

- `account-health-scan` — full health scan execution
- `flag-slipping-followups` — automated followup slippage check

#### 18. Real-Time Requirements

- Health category changes reflect immediately
- Followup status updates visible in real time
- New risk signals appear without refresh
- Slipping followup alerts appear instantly

#### 19. Notifications

| Type | Channel | Trigger |
|------|---------|---------|
| Account health downgrade | In-app, Email | `account.health.changed` (downgrade) |
| Followup assigned | In-app | `followup.created` |
| Followup overdue | In-app, Email | `followup.slippage.detected` |
| Scan completed | In-app | `account.health.scan.completed` |
| Account at risk (critical) | In-app, Email, Discord | `account.health.changed` (critical) |

#### 20. Permissions

| Role | Access |
|------|--------|
| Account Manager | Assigned accounts CRUD |
| Customer Success Manager | All accounts read + followup management |
| Manager | All accounts + health scan trigger |
| Admin | All + system configuration |

#### 21. Entry Points

- Browser: `https://{domain}/crm-center_v2/`
- Deep links: `/accounts/:id`, `/followups/:id`
- From customer-portal_v2: account health view link

#### 22. Exit Points

- Account health critical → notification-center_v2 sends escalation
- Followup created → notification-center_v2 notifies assignee
- Scan complete → data flows to analytics

#### 23. Dependencies on Other Applications

| App | Dependency | Type |
|-----|-----------|------|
| support-center_v2 | Provides ticket data for health context | Event |
| appointment-center_v2 | Provides appointment data for health | Event |
| resolution-center_v2 | Provides dispute data for health | Event |
| notification-center_v2 | Sends health/followup alerts | Event |
| customer-portal_v2 | Displays account health to customer | Event |
| analytics-center_v2 | Consumes health metrics | Event |
| admin-center_v2 | User/role management | Shared |

#### 24. Cross-App Communication

| App | Communication | Method |
|-----|--------------|--------|
| support-center_v2 | Reads ticket data | Event subscription |
| appointment-center_v2 | Reads appointment data | Event subscription |
| resolution-center_v2 | Reads dispute data | Event subscription |
| customer-portal_v2 | Pushes health updates | Event: `account.health.changed` |
| notification-center_v2 | Sends alerts | Event: `notification.send` |

#### 25. Future Extensibility

- Automated retention campaign management
- Predictive churn scoring with ML
- Customer health trend forecasting
- Integration with email marketing platforms
- Customer satisfaction (CSAT) survey management
- NPS tracking and analysis
- Automated outreach scheduling
- Customer lifecycle stage management (onboarding → growth → at-risk → win-back)

---

### 5.8 notification-center_v2

#### 1. Purpose
Centralized notification engine that manages all outbound communications across channels (in-app, email, SMS, push, Discord, etc.) with template management, delivery tracking, and preference management.

#### 2. Primary Users
- All applications (via event bus)
- System administrators
- Notification managers

#### 3. Responsibilities
- Receive notification requests from all apps
- Route notifications to appropriate channels based on type and user preferences
- Manage notification templates
- Track delivery status (sent, delivered, failed, opened)
- Respect user notification preferences (opt-in/out, channel selection)
- Rate-limit and throttle notifications per user
- Provide notification history and logs

#### 4. Business Capabilities
- Multi-channel delivery (in-app, email, SMS, push, Discord, webhook)
- Template management with variable substitution
- User notification preference management
- Delivery status tracking and retry
- Batch notification dispatch
- Scheduled notifications
- Notification grouping/digests
- Channel health monitoring
- Notification analytics (delivery rates, open rates)

#### 5. Pages

| Page | Route | Description |
|------|-------|-------------|
| Notification Dashboard | `/` | Delivery metrics, channel health, recent dispatches |
| Notification Log | `/log` | Searchable history of all sent notifications |
| Template Manager | `/templates` | CRUD for notification templates |
| Template Editor | `/templates/:id` | Template content editor with variable preview |
| Channel Settings | `/channels` | Channel configuration (SMTP, SMS gateway, webhook URLs) |

#### 6. Navigation Structure

```
Top Bar: [App Switcher] [Search] [Bell] [Avatar]
Sidebar:
  ├── Dashboard
  ├── Notification Log
  ├── Templates
  └── Channel Settings
```

#### 7. Components

| Component | Description |
|-----------|-------------|
| DeliveryMetricCards | KPIs: sent, delivered, failed, open rate |
| NotificationLogTable | Searchable, filterable log |
| TemplateCard | Template preview card |
| TemplateEditor | Content editor with variable insertion |
| ChannelStatusIndicator | Green/red channel health indicator |
| PreferenceEditor | Channel toggles per notification type |
| ChannelTestButton | Send test notification button |
| DeliveryTimeline | Per-notification delivery timeline |

#### 8. Dashboards

- **Notification Dashboard**: 24h volume, delivery rate %, failed count, channel health, recent failures, top notification types

#### 9. Forms

| Form | Fields | Validations |
|------|--------|-------------|
| New Template | name, type, channel, subject, body, variables, category | Required: name, type, body |
| Edit Template | subject, body, variables | Required: body |
| Channel Config | channel_type, provider, credentials (encrypted), rate_limit | Required: type, provider |
| Test Send | template_id, recipient, channel | Required: recipient |
| Preference Set | notification_type, channels (multi-select) | Required: at least one channel |

#### 10. Tables Viewed

| Table | Read Pattern |
|-------|-------------|
| notifications_v2 | All notification records |
| notification_templates_v2 | All templates |
| notification_channels_v2 | Channel configurations |
| customers | Contact info for delivery |
| technicians | Contact info for delivery |
| users_v2 | User profiles and preferences |

#### 11. Tables Updated

| Table | Update Pattern |
|-------|---------------|
| notifications_v2 | `updateRecord(notifications_v2, id, { status, delivered_at, error })` |
| notification_templates_v2 | `updateRecord(notification_templates_v2, id, { ... })` |
| notification_channels_v2 | `updateRecord(notification_channels_v2, id, { config, enabled })` |

#### 12. Tables Created

| Table | Create Pattern |
|-------|---------------|
| notifications_v2 | `createRecord(notifications_v2, { type, channel, recipient, template_id, status: 'pending' })` |
| notification_templates_v2 | `createRecord(notification_templates_v2, { name, type, channel, subject, body, variables })` |
| notification_channels_v2 | `createRecord(notification_channels_v2, { channel_type, provider, config, enabled })` |

#### 13. Events Generated

| Event | Payload | Trigger |
|-------|---------|---------|
| `notification.send` | `{ notification_id, type, channel, recipient, template_id }` | Notification requested |
| `notification.delivered` | `{ notification_id, channel, delivered_at }` | Successful delivery |
| `notification.failed` | `{ notification_id, channel, error, retry_count }` | Delivery failure |
| `notification.template.updated` | `{ template_id, name, updated_by }` | Template modified |

#### 14. Events Consumed

| Event | Handler | Effect |
|-------|---------|--------|
| `notification.send` (all 10 apps) | Process and deliver | Send via configured channel |
| `ticket.reply.approved` | Send reply to customer | Email/SMS delivery |
| `appointment.reminder.due` | Send reminder | Scheduled delivery |
| `dispatch.initiated` | Send dispatch alert | SMS/Push to technician |
| `account.health.changed` (critical) | Send escalation alert | Multi-channel alert |
| `dispute.resolved` | Send resolution to customer | Email notification |
| `followup.slippage.detected` | Send overdue alert | In-app + email |
| `appointment.assigned` | Send assignment alert | SMS/Push to technician |
| `task.created` | Send task notification | In-app notification |
| `customer.appointment.requested` | Send confirmation | Email notification |

#### 15. Workflows That Will Connect Later

- **appointment-reminders_v2** — uses notification-center for delivery
- **customer-satisfaction-monitor_v2** — sends satisfaction surveys

#### 16. Agents That Will Connect Later

- (None directly; notification-center is infrastructure, not AI-driven)

#### 17. Functions That Will Connect Later

- `dispatch-notifications` — programmatic notification dispatch
- `fetch-upcoming-appointments` — for reminder scheduling

#### 18. Real-Time Requirements

- Notification delivery status updates in real time
- In-app notifications appear instantly via WebSocket
- Dashboard metrics refresh in real time

#### 19. Notifications

| Type | Channel | Trigger |
|------|---------|---------|
| (Infrastructure — sends notifications, does not receive its own user-facing notifications except for system alerts) |

#### 20. Permissions

| Role | Access |
|------|--------|
| Admin | Full CRUD on templates, channels, log |
| Manager | View log, manage templates |
| Viewer | View log only |

#### 21. Entry Points

- Browser: `https://{domain}/notification-center_v2/`
- API: Event subscription (primary entry for all other apps)
- Internal function calls from workflows

#### 22. Exit Points

- Email → SMTP gateway
- SMS → SMS gateway (Twilio, etc.)
- Push → WebSocket push to browser/PWA
- Discord → Discord webhook
- Webhook → External URL

#### 23. Dependencies on Other Applications

| App | Dependency | Type |
|-----|-----------|------|
| All apps | Send notification requests | Event |
| admin-center_v2 | User/role management | Shared |
| crm-center_v2 | Customer contact info | Data |

#### 24. Cross-App Communication

| App | Communication | Method |
|-----|--------------|--------|
| ALL apps | Receives `notification.send` events | Event subscription |
| customer-portal_v2 | Pushes in-app notifications | WebSocket |
| technician-portal_v2 | Pushes in-app notifications + SMS | WebSocket + SMS gateway |

#### 25. Future Extensibility

- WhatsApp integration
- Telegram bot integration
- Slack integration
- Push notification via Firebase/APNs for mobile
- Multi-language notification templates
- A/B testing for notification content
- Intelligent send-time optimization
- Notification preference center for end users
- In-app notification center UI component for all apps

---

### 5.9 analytics-center_v2

#### 1. Purpose
Cross-domain analytics and reporting hub that aggregates data from all V2 applications to provide business intelligence, operational metrics, trend analysis, and export capabilities.

#### 2. Primary Users
- Operations directors
- Business analysts
- Executives / leadership
- Department managers

#### 3. Responsibilities
- Aggregate data from all application tables
- Provide real-time and historical metrics
- Generate scheduled and on-demand reports
- Visualize trends and patterns
- Support data export (CSV, PDF, JSON)
- Track KPIs across all domains
- Provide cross-app drill-down capability

#### 4. Business Capabilities
- Real-time KPI dashboard
- Custom report builder
- Scheduled report generation and distribution
- Data export to multiple formats
- Trend analysis with time-series charts
- Domain-specific metric pages (support, ops, appointments, disputes, accounts)
- Cross-domain correlation views
- Drill-down from metric to source records
- Data freshness indicators

#### 5. Pages

| Page | Route | Description |
|------|-------|-------------|
| Executive Dashboard | `/` | Top-level KPIs across all domains |
| Support Analytics | `/support` | Ticket volume, SLA compliance, agent metrics |
| Operations Analytics | `/operations` | Task completion, dispatch metrics, workload |
| Appointment Analytics | `/appointments` | Booking volume, completion rate, no-show rate |
| Account Analytics | `/accounts` | Health distribution, churn risk, followup metrics |
| Dispute Analytics | `/disputes` | Dispute volume, resolution rate, avg time |
| Custom Reports | `/reports` | Create and run custom reports |
| Report Builder | `/reports/builder` | Drag-and-drop report configuration |
| Scheduled Reports | `/reports/scheduled` | Manage scheduled report delivery |

#### 6. Navigation Structure

```
Top Bar: [App Switcher] [Search] [Bell] [Avatar]
Sidebar:
  ├── Executive Dashboard
  ├── Support Analytics
  ├── Operations Analytics
  ├── Appointment Analytics
  ├── Account Analytics
  ├── Dispute Analytics
  ├── Custom Reports
  └── Scheduled Reports
```

#### 7. Components

| Component | Description |
|-----------|-------------|
| KpiDashboardGrid | Grid of KPI metric cards |
| TimeSeriesChart | Line/area chart with date range (Chart.js) |
| BarChart | Vertical/horizontal bar chart |
| PieChart | Distribution chart |
| DataExportButton | Export to CSV/PDF/JSON |
| MetricCard | Single KPI with trend arrow and sparkline |
| DrillDownLink | Clickable metric → source record list |
| DateRangeNavigator | Quick date range selector |
| ReportBuilderCanvas | Drag-and-drop report configuration |
| ChartConfigPanel | Chart type, dimensions, filters configuration |
| ScheduledReportCard | Schedule card with next run time |
| DataFreshnessIndicator | Timestamp of last data refresh |
| FilterBar | Multi-dimension filter row |

#### 8. Dashboards

- **Executive Dashboard**: Row 1 — Tickets created (24h), Appointments scheduled, Active disputes, Accounts at risk. Row 2 — Ticket volume (7d trend), Appointment completion rate, Health distribution pie. Row 3 — Top 5 agents by resolution, Top 5 reasons for disputes

#### 9. Forms

| Form | Fields | Validations |
|------|--------|-------------|
| Custom Report | name, metrics (multi), dimensions, date_range, filters, chart_type, schedule | Required: name, metrics |
| Scheduled Report | report_id, frequency (daily/weekly/monthly), recipients, format, enabled | Required: frequency, recipients |
| Export | format, date_range, include_charts | Required: format |
| Dashboard Config | visible_widgets, layout, refresh_interval | Optional |

#### 10. Tables Viewed

| Table | Read Pattern |
|-------|-------------|
| tickets | Aggregate counts, grouping by status/type/urgency/channel |
| appointments | Aggregate counts, grouping by status/service_type |
| disputes | Aggregate counts, grouping by status |
| accounts | Health distribution, score averages |
| followups | Overdue counts, status distribution |
| tasks | Completion rates, priority distribution |
| customers | Counts, status distribution |
| technicians | Utilization, performance metrics |
| operations_log | Volume trends, action distribution |
| notifications_v2 | Delivery metrics, volume trends |

#### 11. Tables Updated

| Table | Update Pattern |
|-------|---------------|
| (none) | Analytics is read-only; does not mutate operational tables |

#### 12. Tables Created

| Table | Create Pattern |
|-------|---------------|
| analytics_reports_v2 | `createRecord(analytics_reports_v2, { name, config, created_by })` |
| analytics_schedules_v2 | `createRecord(analytics_schedules_v2, { report_id, frequency, recipients })` |

#### 13. Events Generated

| Event | Payload | Trigger |
|-------|---------|---------|
| `report.generated` | `{ report_id, format, generated_at }` | Report generation complete |

#### 14. Events Consumed

| Event | Handler | Effect |
|-------|---------|--------|
| `ticket.created` | Refresh ticket metrics | KPI update |
| `ticket.status.changed` | Refresh ticket metrics | KPI update |
| `appointment.created` | Refresh appointment metrics | KPI update |
| `appointment.status.changed` | Refresh appointment metrics | KPI update |
| `dispute.created` | Refresh dispute metrics | KPI update |
| `dispute.status.changed` | Refresh dispute metrics | KPI update |
| `account.health.changed` | Refresh health distribution | KPI update |
| `task.created` | Refresh ops metrics | KPI update |
| `notification.delivered` | Refresh delivery metrics | KPI update |

#### 15. Workflows That Will Connect Later

- (Analytics is a consumer, not a producer of operational workflows)

#### 16. Agents That Will Connect Later

- (None; analytics is aggregation-oriented, not agent-driven)

#### 17. Functions That Will Connect Later

- (Analytics queries are real-time reads; no serverless functions needed for primary operation)

#### 18. Real-Time Requirements

- Dashboard KPIs refresh on data change events
- Time-series charts update with new data points
- Scheduled reports generate on time

#### 19. Notifications

| Type | Channel | Trigger |
|------|---------|---------|
| Report ready | In-app, Email | `report.generated` |
| Scheduled report sent | Email | `report.generated` with schedule |
| KPI threshold breached | In-app | Configurable threshold alert |

#### 20. Permissions

| Role | Access |
|------|--------|
| Viewer | View dashboards, run reports |
| Analyst | All + create custom reports |
| Manager | All + manage scheduled reports |
| Admin | All + system config |

#### 21. Entry Points

- Browser: `https://{domain}/analytics-center_v2/`
- Deep links: `/support`, `/operations`, `/accounts`, `/reports/:id`
- Email links to scheduled reports

#### 22. Exit Points

- Report export (CSV, PDF, JSON)
- Email scheduled report delivery
- Embedded charts/widgets in other apps

#### 23. Dependencies on Other Applications

| App | Dependency | Type |
|-----|-----------|------|
| All apps | Reads from all operational tables | Data (read-only) |
| notification-center_v2 | Sends scheduled report emails | Event |
| admin-center_v2 | User/role management | Shared |

#### 24. Cross-App Communication

| App | Communication | Method |
|-----|--------------|--------|
| ALL apps | Consumes all domain events for metrics | Event subscription |
| notification-center_v2 | Sends report deliveries | Event: `notification.send` |

#### 25. Future Extensibility

- Machine learning predictive analytics (churn prediction, demand forecasting)
- Natural language query for reports (ask questions in plain English)
- Embedded analytics widgets for other apps (able to embed in any app)
- Real-time streaming dashboards
- Custom metric calculation engine
- Third-party BI tool integration (Power BI, Tableau, Metabase)
- Anomaly detection on metric trends
- Executive summary auto-generation

---

### 5.10 admin-center_v2

#### 1. Purpose
System administration hub for managing users, roles, permissions, application configuration, audit logs, and system health across the entire V2 ecosystem.

#### 2. Primary Users
- System administrators
- Platform managers
- Security officers

#### 3. Responsibilities
- User account management (create, disable, update)
- Role and permission assignment
- Application configuration and feature flags
- Audit log review and search
- System health monitoring
- Event bus monitoring
- Connector configuration (Discord, Gmail, etc.)
- System-wide settings

#### 4. Business Capabilities
- User CRUD with role assignment
- Role-based access control management
- Feature flag management per app
- Audit log viewer with search and export
- System health dashboard (app status, event bus health)
- Connector/service configuration
- System settings (global defaults, thresholds)
- Event bus monitoring (event volume, failures)
- Session management (view active sessions, force logout)
- System backup and restore status

#### 5. Pages

| Page | Route | Description |
|------|-------|-------------|
| Admin Dashboard | `/` | System health, active users, event volume, alerts |
| User Management | `/users` | All users with roles, status, search |
| User Detail | `/users/:id` | User profile, roles, activity, sessions |
| Role Manager | `/roles` | Define roles and permission sets |
| Audit Log | `/audit` | Searchable audit log with filters |
| System Settings | `/settings` | Global configuration, feature flags, defaults |
| Connector Config | `/connectors` | Third-party connector configuration |
| Event Bus Monitor | `/events` | Event volume, failures, retry queue |

#### 6. Navigation Structure

```
Top Bar: [App Switcher] [Search] [Bell] [Avatar]
Sidebar:
  ├── Dashboard
  ├── User Management
  ├── Role Manager
  ├── Audit Log
  ├── System Settings
  ├── Connector Config
  └── Event Bus Monitor
```

#### 7. Components

| Component | Description |
|-----------|-------------|
| SystemHealthCard | Health status per service/app |
| UserTable | Searchable, filterable user list |
| UserForm | User creation/editing with role select |
| RolePermissionTree | Hierarchical permission tree editor |
| FeatureFlagToggle | Toggle switch per app/feature |
| AuditLogTable | Searchable, filterable audit log |
| EventVolumeChart | Event volume over time chart |
| ConnectorCard | Connector status and config summary |
| ActiveSessionList | Currently active user sessions |
| ConfigEditor | Key-value pair editor for settings |

#### 8. Dashboards

- **Admin Dashboard**: System health summary (all apps green/red), active users count, events in last 24h, failed events count, recent audit log entries, connector health status

#### 9. Forms

| Form | Fields | Validations |
|------|--------|-------------|
| Create User | email, name, role, app_access (multi-select), send_invite | Required: email, role |
| Edit User | name, role, app_access, enabled | Required: name |
| Create Role | name, description, permissions (tree select), app_scope | Required: name, permissions |
| System Setting | key, value, type, description, app_scope | Required: key, value |
| Connector Config | connector_type, credentials (encrypted), base_url, enabled | Required: type, credentials |
| Feature Flag | app, feature_name, enabled, rollout_percentage | Required: app, feature |

#### 10. Tables Viewed

| Table | Read Pattern |
|-------|-------------|
| users_v2 | All users |
| user_roles_v2 | All roles |
| feature_flags_v2 | All flags |
| system_settings_v2 | All settings |
| connectors_v2 | All connectors |
| operations_log | Full audit log |
| All other tables | Read for health checks |

#### 11. Tables Updated

| Table | Update Pattern |
|-------|---------------|
| users_v2 | `updateRecord(users_v2, id, { ... })` |
| user_roles_v2 | `updateRecord(user_roles_v2, id, { ... })` |
| system_settings_v2 | `updateRecord(system_settings_v2, id, { value, ... })` |
| feature_flags_v2 | `updateRecord(feature_flags_v2, id, { enabled, rollout_percentage })` |
| connectors_v2 | `updateRecord(connectors_v2, id, { config, enabled })` |

#### 12. Tables Created

| Table | Create Pattern |
|-------|---------------|
| users_v2 | `createRecord(users_v2, { email, name, role, ... })` |
| user_roles_v2 | `createRecord(user_roles_v2, { name, permissions, app_scope })` |
| system_settings_v2 | `createRecord(system_settings_v2, { key, value, type, description })` |
| feature_flags_v2 | `createRecord(feature_flags_v2, { app, feature_name, enabled, ... })` |
| connectors_v2 | `createRecord(connectors_v2, { connector_type, config, enabled })` |

#### 13. Events Generated

| Event | Payload | Trigger |
|-------|---------|---------|
| `user.created` | `{ user_id, email, role }` | New user created |
| `user.role.changed` | `{ user_id, old_role, new_role }` | Role modified |
| `user.disabled` | `{ user_id, disabled_by }` | User disabled |
| `system.config.changed` | `{ setting_key, old_value, new_value }` | Setting updated |

#### 14. Events Consumed

| Event | Handler | Effect |
|-------|---------|--------|
| `user.created` | Update system user cache | Sync user data |
| `system.config.changed` | Refresh config in other apps | App config update |

#### 15. Workflows That Will Connect Later

- (None; admin-center is infrastructure management)

#### 16. Agents That Will Connect Later

- (None; admin-center is configuration-oriented, not AI-driven)

#### 17. Functions That Will Connect Later

- (None; all operations are CRUD on admin tables)

#### 18. Real-Time Requirements

- System health status updates in real time
- Audit log entries appear as they are created
- Active session list reflects live status

#### 19. Notifications

| Type | Channel | Trigger |
|------|---------|---------|
| System health alert | In-app, Email | App/event bus failure |
| New user created | In-app | `user.created` |
| Permission change | In-app | `user.role.changed` |
| Connector failure | In-app, Email | Connector health check fails |

#### 20. Permissions

| Role | Access |
|------|--------|
| Admin | Full access to all admin functions |
| Super Admin | All access + system settings, connector config |
| Auditor | Audit log read-only |

#### 21. Entry Points

- Browser: `https://{domain}/admin-center_v2/`
- Deep links: `/users/:id`, `/audit`, `/settings`

#### 22. Exit Points

- User created → notification-center_v2 sends welcome/invite
- Config change → event propagated to affected apps
- Audit log export → download CSV

#### 23. Dependencies on Other Applications

| App | Dependency | Type |
|-----|-----------|------|
| All apps | Manages their user/role/permission config | Shared |
| notification-center_v2 | Sends user invitations | Event |

#### 24. Cross-App Communication

| App | Communication | Method |
|-----|--------------|--------|
| ALL apps | Provides user/role data | Shared config package |
| ALL apps | Propagates config changes | Event: `system.config.changed` |
| notification-center_v2 | Sends user invitations | Event: `notification.send` |

#### 25. Future Extensibility

- SSO/SAML integration
- API key management for programmatic access
- Billing and subscription management
- Multi-tenant organization management
- IP whitelisting and network security rules
- Compliance reporting (SOC2, GDPR)
- Data retention policy management
- Integration with identity providers (Okta, Azure AD, Google Workspace)
- Two-factor authentication management
- Backup and restore management UI

---

## 6. Event Catalog

### 6.1 Domain Events (Full List)

| Event | Producer | Primary Consumers | Description |
|-------|----------|------------------|-------------|
| `ticket.created` | support-center_v2, customer-portal_v2 | operations-center_v2, notification-center_v2, analytics-center_v2 | New ticket created |
| `ticket.classified` | support-center_v2 | operations-center_v2, analytics-center_v2 | AI classification complete |
| `ticket.reply.drafted` | support-center_v2 | (internal) | Reply drafted by agent |
| `ticket.reply.approved` | support-center_v2 | notification-center_v2, analytics-center_v2 | Manager approved reply |
| `ticket.status.changed` | support-center_v2 | crm-center_v2, customer-portal_v2, notification-center_v2, analytics-center_v2 | Status transition |
| `ticket.escalated` | support-center_v2 | operations-center_v2, notification-center_v2, analytics-center_v2 | Ticket escalated |
| `appointment.created` | appointment-center_v2 | operations-center_v2, notification-center_v2, crm-center_v2, analytics-center_v2 | New appointment |
| `appointment.assigned` | appointment-center_v2 | technician-portal_v2, notification-center_v2 | Technician assigned |
| `appointment.status.changed` | appointment-center_v2, technician-portal_v2 | customer-portal_v2, operations-center_v2, resolution-center_v2, notification-center_v2, analytics-center_v2 | Status transition |
| `appointment.cancelled` | appointment-center_v2, customer-portal_v2 | notification-center_v2, operations-center_v2, analytics-center_v2 | Appointment cancelled |
| `appointment.completed` | technician-portal_v2 | crm-center_v2, analytics-center_v2 | Job completed |
| `dispute.created` | resolution-center_v2 | customer-portal_v2, notification-center_v2, crm-center_v2, analytics-center_v2 | New dispute |
| `dispute.analyzed` | resolution-center_v2 | (internal) | AI analysis complete |
| `dispute.status.changed` | resolution-center_v2 | customer-portal_v2, notification-center_v2, analytics-center_v2 | Status transition |
| `dispute.resolved` | resolution-center_v2 | crm-center_v2, customer-portal_v2, notification-center_v2, analytics-center_v2 | Dispute closed |
| `task.created` | operations-center_v2 | technician-portal_v2, notification-center_v2, analytics-center_v2 | New task |
| `task.status.changed` | operations-center_v2, technician-portal_v2 | notification-center_v2, analytics-center_v2 | Task status transition |
| `dispatch.initiated` | operations-center_v2 | technician-portal_v2, notification-center_v2, analytics-center_v2 | Urgent dispatch started |
| `dispatch.completed` | operations-center_v2 | notification-center_v2, analytics-center_v2 | Dispatch resolved |
| `account.health.scan.completed` | crm-center_v2 | analytics-center_v2 | Health scan done |
| `account.health.changed` | crm-center_v2 | customer-portal_v2, operations-center_v2, notification-center_v2, analytics-center_v2 | Health category changed |
| `followup.created` | crm-center_v2 | notification-center_v2, analytics-center_v2 | New followup |
| `followup.slippage.detected` | crm-center_v2 | operations-center_v2, notification-center_v2, analytics-center_v2 | Followup overdue |
| `technician.status.changed` | technician-portal_v2 | appointment-center_v2, operations-center_v2 | Availability changed |
| `notification.send` | all apps | notification-center_v2 (trigger) | Request notification delivery |
| `notification.delivered` | notification-center_v2 | analytics-center_v2 | Notification sent |
| `notification.failed` | notification-center_v2 | analytics-center_v2, admin-center_v2 | Delivery failure |
| `user.created` | admin-center_v2 | notification-center_v2 | New user |
| `user.role.changed` | admin-center_v2 | all apps (via config refresh) | Role modified |
| `user.disabled` | admin-center_v2 | all apps (via auth) | User disabled |
| `system.config.changed` | admin-center_v2 | all apps (via config refresh) | System setting changed |
| `report.generated` | analytics-center_v2 | notification-center_v2 | Report ready |
| `daily.standup.generated` | operations-center_v2 | notification-center_v2 | Standup report done |

### 6.2 Event Flow Map

```
CUSTOMER PORTAL          SUPPORT CENTER           OPERATIONS CENTER
═══════════════          ═══════════════          ══════════════════
ticket.created ──────►   ticket.created ──────►   ticket.escalated
                           │                       task.created
                           ├──► ticket.classified   dispatch.initiated
                           ├──► ticket.status.changed
                           ├──► ticket.escalated
                           └──► ticket.reply.approved


APPOINTMENT CENTER       TECHNICIAN PORTAL        RESOLUTION CENTER
══════════════════       ══════════════════       ═════════════════
appointment.created ──►  appointment.status      dispute.created
appointment.assigned ──►   .changed ──────────►   dispute.analyzed
appointment.status       technician.status        dispute.status.changed
  .changed ──────────►    .changed ──────────►   dispute.resolved
appointment.cancelled    task.completed
appointment.completed


CRM CENTER               NOTIFICATION CENTER      ANALYTICS CENTER
═══════════              ══════════════════       ════════════════
account.health.scan      notification.send ◄──   (consumes ALL events)
  .completed ─────────►  notification.delivered   (read-only consumer)
account.health.changed   notification.failed
followup.created
followup.slippage
  .detected


ADMIN CENTER
════════════
user.created
user.role.changed
user.disabled
system.config.changed
```

---

## 7. Permissions Reference

### 7.1 Role → App Matrix

| Role | customer-portal_v2 | support-center_v2 | crm-center_v2 | ops-center_v2 | appointment-center_v2 | tech-portal_v2 | resolution-center_v2 | notification-center_v2 | analytics-center_v2 | admin-center_v2 |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| super_admin | R | R/W | R/W | R/W | R/W | R | R/W | R/W | R/W | R/W |
| admin | - | R/W | R/W | R/W | R/W | R | R/W | R/W | R/W | R/W |
| manager | - | R/W | R/W | R/W | R/W | R | R/W | R | R/W | - |
| agent | - | R/W | R/W | - | R | - | R/W | - | R | - |
| coordinator | - | R | R | R/W | R/W | - | R | - | R | - |
| technician | - | - | - | - | R | R/W | - | - | - | - |
| customer | R/W* | - | - | - | - | - | - | - | - | - |
| auditor | - | R | R | R | R | - | R | R | R | R |

*R/W* = Own data only (scoped by authenticated identity)

### 7.2 Permission Granularity

Permissions are defined per (role, app, resource, action) tuple:

- Resources: table, page, component, function, agent, connector
- Actions: create, read, update, delete, execute, approve, export

Example: `{ role: "agent", app: "support-center_v2", resource: "tickets", action: "update" }`

### 7.3 Permission Enforcement Points

1. **UI Layer**: Conditionally render/hide actions based on user role
2. **API/SDK Layer**: `sdk_v2` checks user role before executing write operations
3. **Event Layer**: Only authorized apps can emit certain events
4. **Data Layer**: (Future) RLS on Lemma tables for row-level scoping

---

> **End of APPLICATION_ARCHITECTURE.md**  
> Next document: APPLICATION_INTERACTION_DIAGRAM.md
