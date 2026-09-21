# RESQAI V2 — Integration Contracts

> Phase 3.3 — Integration Contracts  
> Principal Enterprise Solution Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Integration Architecture](#1-integration-architecture)
2. [Cross-Application Event Flows](#2-cross-application-event-flows)
3. [Customer Portal → Backend Integration](#3-customer-portal--backend-integration)
4. [Support Center → Backend Integration](#4-support-center--backend-integration)
5. [Operations Center → Backend Integration](#5-operations-center--backend-integration)
6. [Appointment Center → Backend Integration](#6-appointment-center--backend-integration)
7. [Technician Portal → Backend Integration](#7-technician-portal--backend-integration)
8. [Resolution Center → Backend Integration](#8-resolution-center--backend-integration)
9. [CRM Center → Backend Integration](#9-crm-center--backend-integration)
10. [Analytics Center → Backend Integration](#10-analytics-center--backend-integration)
11. [Admin Center → Backend Integration](#11-admin-center--backend-integration)
12. [Notification Center Integration](#12-notification-center-integration)
13. [Data Synchronization Contracts](#13-data-synchronization-contracts)
14. [Error Handling Contracts](#14-error-handling-contracts)
15. [Security Integration Contracts](#15-security-integration-contracts)

---

## 1. Integration Architecture

### Integration Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
│  9 V2 Applications (React + TypeScript)                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│  │ CUS│ │ SUP│ │ OPS│ │ APT│ │ TEC│ │ RES│ │ CRM│ │ ANL│ │ ADM│ │
│  └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ │
│     │      │      │      │      │      │      │      │      │     │
├─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼─────┤
│     │      │      │      │      │      │      │      │      │     │
│     ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼     │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │              API GATEWAY / LEMMA SDK                      │    │
│   │  REST API  │  Event Bus  │  WebSocket  │  Auth Middleware │    │
│   └──────────────────────────────────────────────────────────┘    │
│                     BACKEND LAYER                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐   │
│  │ FUNCTIONS│ │ WORKFLOWS│ │  AGENTS  │ │  Connectors        │   │
│  │ (53)     │ │ (33)     │ │ (49)     │ │  (SMTP, SMS, etc)  │   │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              DATA LAYER (41 Tables)                       │    │
│  │  events_v2  │  audit_log_v2  │  Domain Tables  │  Cache  │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Integration Patterns

| Pattern | Description | Used For |
|---------|-------------|----------|
| Synchronous REST API | Request-response over HTTP | CRUD operations, search, queries |
| Asynchronous Events | Fire-and-forget via event bus | Cross-app state changes, notifications |
| Real-time WebSocket | Bidirectional persistent connection | Live updates, notifications, collaboration |
| Scheduled Jobs | Cron-triggered backend execution | Health scans, SLA checks, report generation |
| Agent Invocation | Synchronous with timeout | AI classification, drafting, analysis |
| Workflow Trigger | Event-initiated state machine | Multi-step business processes |

---

## 2. Cross-Application Event Flows

### Lifecycle Integration Map

```
TICKET LIFECYCLE:
  Customer Portal (created) ──► Support Center (classify) ──► Agent (classify)
       │                                                            │
       │                                                            ▼
       │                                               Notification Center (send)
       │                                                            │
       └─────────────────── Ticket Status Changed ◄─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              CRM Center     Operations Center  Analytics Center
           (health signal)  (dispatch if urgent)  (metric)
                  
APPOINTMENT LIFECYCLE:
  Customer Portal (request) ──► Appointment Center (create)
       │                              │
       │                              ▼
       │                    Agent (tech-suggester)
       │                              │
       │                              ▼
       │                    Appointment Center (assign)
       │                              │
       └─────────────────── Technician Portal (notify)
                                      │
                                      ▼ (job progress)
                              Appointment Center (status updates)
                                      │
                                      ▼ (completed)
                              CRM Center (health signal)
                                      │
                                      ▼
                              Analytics Center (metric)

DISPUTE LIFECYCLE:
  Customer Portal (file) ──► Resolution Center (create)
                                    │
                                    ▼
                            Agent (resolution-advisor)
                                    │
                                    ▼
                            Resolution Center (analyze)
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                   Approval (manager)    Escalation
                         │                     │
                         ▼                     ▼
                   Resolution Center     Resolution Center
                   (resolve)             (escalate)
                         │
                         ▼
                   CRM Center (health signal)
                         │
                         ▼
                   Analytics Center (metric)
```

### Event Routing Matrix

```
Producer → Consumer         CUS SUP OPS APT TEC RES CRM ANL ADM NOTIF
─────────────────────────────────────────────────────────────────────
customer-portal_v2          -   ○   -   ○   -   ○   ○   ○   -   ○
support-center_v2           ○   -   ○   -   -   -   ○   ○   -   ○
operations-center_v2        -   -   -   -   ○   -   -   ○   -   ○
appointment-center_v2       ○   -   ○   -   ○   ○   ○   ○   -   ○
technician-portal_v2        -   -   ○   -   -   -   -   ○   -   ○
resolution-center_v2        ○   -   -   -   -   -   ○   ○   -   ○
crm-center_v2               ○   -   ○   -   -   -   -   ○   -   ○
analytics-center_v2         -   -   -   -   -   -   -   -   -   ○
admin-center_v2             -   -   -   -   -   -   -   -   -   ○
notification-center_v2      -   -   -   -   -   -   -   ○   ○   -

○ = Event consumer    - = No direct event relationship
```

---

## 3. Customer Portal → Backend Integration

### REST API Endpoints

| Method | Endpoint | Frontend Action | Backend Handler |
|--------|----------|----------------|-----------------|
| GET | /api/v2/customers/{id}/dashboard | Home page load | Aggregate customer dashboard data |
| GET | /api/v2/customers/{id}/tickets | My Tickets page | List own tickets (RLS) |
| POST | /api/v2/customers/{id}/tickets | Create ticket | validate-ticket-input → create → emit |
| GET | /api/v2/customers/{id}/tickets/{tid} | Ticket detail | Get ticket + messages |
| GET | /api/v2/customers/{id}/appointments | My Appointments | List own appointments |
| POST | /api/v2/customers/{id}/appointments | Book appointment | Create booking request → emit |
| PUT | /api/v2/customers/{id}/appointments/{aid}/cancel | Cancel appointment | Validate ownership → cancel → emit |
| GET | /api/v2/customers/{id}/disputes | My Disputes | List own disputes |
| GET | /api/v2/customers/{id}/account/health | Account health | Fetch health data |
| PUT | /api/v2/customers/{id}/profile | Update profile | Validate → update → emit |
| GET | /api/v2/search | Global search | Cross-entity search (RLS-scoped) |

### Event Integration

| Event Direction | Event | Producer | Consumer |
|-----------------|-------|----------|----------|
| Outbound | ticket.created.customer | Customer Portal | Support Center, Notification Center |
| Outbound | appointment.requested | Customer Portal | Appointment Center |
| Outbound | appointment.cancelled.customer | Customer Portal | Appointment Center |
| Inbound | ticket.status.changed | Support Center | Update UI |
| Inbound | appointment.status.changed | Appointment Center | Update UI |
| Inbound | dispute.status.changed | Resolution Center | Update UI |
| Inbound | account.health.changed | CRM Center | Update health gauge |
| Inbound | notification.new | Notification Center | Bell badge |

### Real-Time Integration

| Channel | Purpose | Protocol |
|---------|---------|----------|
| WebSocket | Ticket/appointment/dispute live updates | Lemma SDK subscribeToTable |
| Server-Sent Events | Notification bell badge | Lemma SDK event subscription |

---

## 4. Support Center → Backend Integration

### REST API Endpoints

| Method | Endpoint | Frontend Action | Backend Handler |
|--------|----------|----------------|-----------------|
| GET | /api/v2/support/tickets | Ticket queue | List with filters, sort, pagination |
| GET | /api/v2/support/tickets/{id} | Ticket detail | Full ticket with messages, timeline |
| POST | /api/v2/support/tickets | Create ticket (manual) | Validate → create → emit |
| PUT | /api/v2/support/tickets/{id}/status | Update status | update-ticket-record → emit |
| PUT | /api/v2/support/tickets/{id}/draft | Draft reply | Save draft → emit |
| PUT | /api/v2/support/tickets/{id}/draft/approve | Approve reply | update-ticket-record → emit → notify |
| PUT | /api/v2/support/tickets/{id}/assign | Assign owner | update-ticket-record → emit |
| POST | /api/v2/support/tickets/{id}/escalate | Escalate | update-ticket-record → emit |
| GET | /api/v2/support/tickets/{id}/messages | Message thread | List messages |
| GET | /api/v2/support/sla/summary | SLA dashboard | Aggregate SLA metrics |
| GET | /api/v2/support/sla/breaches | SLA breaches | List breached tickets |
| GET | /api/v2/support/templates | Template list | List reply templates |
| POST | /api/v2/support/templates | Create template | Save template |
| GET | /api/v2/support/settings/queue | Queue settings | List queue config |
| PUT | /api/v2/support/settings/queue | Update queue | validate-config-change → apply |

### Function Integration

| Function | Invocation | Data Flow |
|----------|-----------|-----------|
| check-ticket-urgency | Called before ticket.created during synchronous | Input: ticket fields → Output: urgency enum |
| classify-ticket-sla-tier | Called after classification | Input: request_type, urgency → Output: SLA tier + deadlines |
| update-ticket-record | Every status/owner/escalation change | Input: ticket_id + delta → Output: before/after state |
| check-sla-deadline | On ticket detail view | Input: ticket_id → Output: SLA status |
| batch-sla-check | Scheduled (cron, every 5 min) | Scans all active tickets → emits breach events |

### AI Agent Integration

| Agent | Trigger | Input | Output | Timeout |
|-------|---------|-------|--------|---------|
| request-classifier_v2 | ticket.created | {customer_id, subject, message, channel} | {type, urgency, suggested_owner, confidence} | 30s |
| support-reply-drafter_v2 | Manual (button) or auto | {ticket_id, message_history} | {draft_content, confidence} | 60s |

---

## 5. Operations Center → Backend Integration

### REST API Endpoints

| Method | Endpoint | Frontend Action | Backend Handler |
|--------|----------|----------------|-----------------|
| GET | /api/v2/operations/dashboard | Dashboard load | Aggregate KPI data |
| GET | /api/v2/operations/tasks | Task board | List with kanban grouping |
| POST | /api/v2/operations/tasks | Create task | create-operations-tasks → emit |
| PUT | /api/v2/operations/tasks/{id}/status | Update task status | Update → emit |
| PUT | /api/v2/operations/tasks/{id}/assign | Assign task | Update → emit |
| GET | /api/v2/operations/dispatches | Dispatch center | List active dispatches |
| POST | /api/v2/operations/dispatches | Initiate dispatch | finalize-dispatch → emit |
| PUT | /api/v2/operations/dispatches/{id}/reassign | Reassign dispatch | Update → emit |
| GET | /api/v2/operations/standup/today | Today's standup | Fetch or generate |
| POST | /api/v2/operations/standup/generate | Generate standup | generate-standup-report |
| GET | /api/v2/operations/technicians/workload | Workload view | Aggregate load data |

### Event Integration

| Inbound Event | Effect on Frontend |
|--------------|-------------------|
| ticket.escalated | Add to dispatch queue, flash alert |
| ticket.classified (urgent) | Urgent badge in queue |
| task.assigned | Update task owner, notification |
| appointment.status.changed | KPI recalculation |
| followup.slippage.detected | Blocker banner on dashboard |
| account.health.changed (critical) | Critical alert banner |
| dispatch.acknowledged | Update dispatch status |
| dispatch.declined | Flag for reassignment |
| technician.availability.changed | Workload distribution update |

---

## 6. Appointment Center → Backend Integration

### REST API Endpoints

| Method | Endpoint | Frontend Action | Backend Handler |
|--------|----------|----------------|-----------------|
| GET | /api/v2/appointments | Schedule board | List with calendar-compatible query |
| POST | /api/v2/appointments | Create appointment | Create → emit |
| GET | /api/v2/appointments/{id} | Appointment detail | Full detail with timeline |
| PUT | /api/v2/appointments/{id}/assign | Assign technician | assign-appointment-technician → emit |
| PUT | /api/v2/appointments/{id}/reschedule | Reschedule | Validate → update → emit |
| PUT | /api/v2/appointments/{id}/cancel | Cancel | Validate → update → emit |
| GET | /api/v2/technicians/available-slots | Available slots | Query availability |
| GET | /api/v2/technicians/availability | All tech availability | Query all techs |
| GET | /api/v2/services | Service types | List catalog |
| POST | /api/v2/services | Create service type | Create |
| GET | /api/v2/appointments/settings | Scheduling rules | List config |
| PUT | /api/v2/appointments/settings | Update rules | validate-config-change → apply |

### AI Agent Integration

| Agent | Trigger | Input | Output | Timeout |
|-------|---------|-------|--------|---------|
| tech-suggester_v2 | appointment.created | {appointment_id, service_type, location, date} | [{technician_id, skill_score, availability}] | 30s |

---

## 7. Technician Portal → Backend Integration

### REST API Endpoints

| Method | Endpoint | Frontend Action | Backend Handler |
|--------|----------|----------------|-----------------|
| GET | /api/v2/technicians/{id}/day | My Day page | Aggregate today's jobs + tasks |
| GET | /api/v2/technicians/{id}/appointments | All appointments | List (own scope) |
| GET | /api/v2/technicians/{id}/appointments/{aid} | Job detail | Full job info |
| PUT | /api/v2/technicians/{id}/appointments/{aid}/status | Update job status | Validate state machine → update → emit |
| POST | /api/v2/technicians/{id}/appointments/{aid}/photos | Upload photo | Store file → attach to job |
| POST | /api/v2/technicians/{id}/appointments/{aid}/notes | Save notes | Save → emit |
| GET | /api/v2/technicians/{id}/tasks | Task list | List (own scope) |
| PUT | /api/v2/technicians/{id}/tasks/{tid}/status | Complete task | Update → emit |
| PUT | /api/v2/technicians/{id}/availability | Toggle availability | Update → emit |
| GET | /api/v2/technicians/{id}/notifications | Notification feed | List |
| GET | /api/v2/technicians/{id}/profile | Profile | Get |
| PUT | /api/v2/technicians/{id}/profile | Update profile | Update |

### Real-Time Integration

| Channel | Purpose | Protocol |
|---------|---------|----------|
| WebSocket | Live dispatch alerts, schedule changes | Lemma SDK subscribeToTable |
| Push | New dispatch, schedule change | Notification API |

---

## 8. Resolution Center → Backend Integration

### REST API Endpoints

| Method | Endpoint | Frontend Action | Backend Handler |
|--------|----------|----------------|-----------------|
| GET | /api/v2/resolution/disputes | Dispute queue | List with filters |
| GET | /api/v2/resolution/disputes/{id} | Dispute detail | Full detail with evidence |
| GET | /api/v2/resolution/disputes/{id}/evidence | Evidence items | List evidence |
| POST | /api/v2/resolution/disputes/{id}/analyze | Run AI analysis | Invoke agent → analyze → emit |
| PUT | /api/v2/resolution/disputes/{id}/approve | Approve resolution | resolve-dispute → emit |
| PUT | /api/v2/resolution/disputes/{id}/reject | Reject recommendation | Update → emit |
| POST | /api/v2/resolution/disputes/{id}/escalate | Escalate dispute | Update → emit |
| PUT | /api/v2/resolution/disputes/{id}/resolve | Resolve dispute | resolve-dispute → emit |
| GET | /api/v2/resolution/approvals | Pending approvals | List |
| GET | /api/v2/resolution/history | Resolution history | List resolved |
| GET | /api/v2/resolution/trends | Trend analysis | Aggregate trend data |

### AI Agent Integration

| Agent | Trigger | Input | Output | Timeout |
|-------|---------|-------|--------|---------|
| resolution-advisor_v2 | dispute.created or manual | {dispute_id, appointment, customer, evidence} | {resolution, confidence, reasoning} | 60s |

---

## 9. CRM Center → Backend Integration

### REST API Endpoints

| Method | Endpoint | Frontend Action | Backend Handler |
|--------|----------|----------------|-----------------|
| GET | /api/v2/crm/dashboard | Dashboard load | Aggregate account health, followups |
| GET | /api/v2/crm/accounts | Account list | List with filters |
| GET | /api/v2/crm/accounts/{id} | Account detail | Full detail with health history |
| POST | /api/v2/crm/accounts/{id}/scan | Run health scan | account-health-scan → emit |
| GET | /api/v2/crm/accounts/{id}/health-history | Health history | List scan results |
| GET | /api/v2/crm/followups | Followup center | List with filters |
| POST | /api/v2/crm/followups | Create followup | create-followup-tasks → emit |
| GET | /api/v2/crm/followups/{id} | Followup detail | Detail |
| PUT | /api/v2/crm/followups/{id}/complete | Complete followup | Update → emit |
| PUT | /api/v2/crm/followups/{id}/review-slippage | Review slippage | finalize-slippage-review |
| GET | /api/v2/crm/risks | Risk signals | List |
| GET | /api/v2/crm/scans | Scan history | List |

### Function Integration

| Function | Invocation | Data Flow |
|----------|-----------|-----------|
| account-health-scan | On-demand or scheduled | Scans 6 tables → computes score → emits |
| update-account-health-status | Post-scan | Persists health category → emits change |
| flag-slipping-followups | Scheduled + on-demand | Checks followups_v2 → returns overdue list |
| create-followup-tasks | Event-driven | Creates followup from triggers |
| generate-account-score | Within scan | Deterministic score from signal weights |

---

## 10. Analytics Center → Backend Integration

### REST API Endpoints

| Method | Endpoint | Frontend Action | Backend Handler |
|--------|----------|----------------|-----------------|
| GET | /api/v2/analytics/executive-dashboard | Executive dashboard | Aggregate cross-domain metrics |
| GET | /api/v2/analytics/support | Support analytics | Ticket-specific metrics |
| GET | /api/v2/analytics/operations | Operations analytics | Ops-specific metrics |
| GET | /api/v2/analytics/appointments | Appointment analytics | Appointment metrics |
| GET | /api/v2/analytics/accounts | Account analytics | Account metrics |
| GET | /api/v2/analytics/disputes | Dispute analytics | Dispute metrics |
| GET | /api/v2/analytics/reports | Report list | List saved reports |
| POST | /api/v2/analytics/reports | Create report | Save report definition |
| POST | /api/v2/analytics/reports/generate | Generate report | generate-report-data → emit |
| GET | /api/v2/analytics/reports/scheduled | Scheduled reports | List |
| POST | /api/v2/analytics/reports/scheduled | Schedule report | Save schedule |

### Event Consumption

| Event | Metric Updated |
|-------|----------------|
| ticket.created | Ticket volume (24h) |
| ticket.status.changed | Active tickets by status |
| ticket.closed | Average resolution time |
| ticket.sla_breached | SLA compliance % |
| appointment.created | Appointment volume |
| appointment.completed | Completion rate |
| appointment.cancelled | Cancellation rate |
| dispatch.acknowledged | Dispatch response time |
| dispute.resolved | Dispute resolution rate |
| account.health.changed | Health distribution |
| followup.slippage.detected | Followup slippage rate |
| feedback.submitted | Customer satisfaction |
| notification.sent | Notification delivery rate |
| user.login | User activity |

---

## 11. Admin Center → Backend Integration

### REST API Endpoints

| Method | Endpoint | Frontend Action | Backend Handler |
|--------|----------|----------------|-----------------|
| GET | /api/v2/admin/users | User management | List with filters |
| POST | /api/v2/admin/users | Create user | provision-user → emit |
| GET | /api/v2/admin/users/{id} | User detail | Detail |
| PUT | /api/v2/admin/users/{id}/status | Deactivate user | deactivate-user → emit |
| GET | /api/v2/admin/roles | Role management | List |
| POST | /api/v2/admin/roles | Create role | Create → emit |
| GET | /api/v2/admin/roles/{id}/permissions | Permission tree | List permissions |
| PUT | /api/v2/admin/roles/{id} | Update role | Update → emit |
| GET | /api/v2/admin/audit-log | Audit log | List with filters |
| GET | /api/v2/admin/audit-log/export | Export audit | Generate export |
| GET | /api/v2/admin/settings | System settings | List |
| PUT | /api/v2/admin/settings/{key} | Update setting | validate-config-change → apply → emit |
| GET | /api/v2/admin/feature-flags | Feature flags | List |
| PUT | /api/v2/admin/feature-flags/{key} | Toggle flag | validate-config-change → apply → emit |
| GET | /api/v2/admin/connectors | Connectors | List |
| POST | /api/v2/admin/connectors | Create connector | Create → test → emit |
| GET | /api/v2/admin/events | Event bus monitor | List recent events |
| GET | /api/v2/admin/health | System health | Aggregate health data |

### Config Change Propagation

```
Admin Center (change) ──► apply-config-change
       │
       ▼
system.config.changed (event)
       │
       ├──► ALL Vue/React applications → refresh config cache
       ├──► Workflow engine → update workflow config
       ├──► Agent runtime → refresh agent config
       ├──► Notification center → update channel config
       └──► Connector runtime → refresh connector config
```

---

## 12. Notification Center Integration

### Contract: notification.send

**This is the single integration point for all outbound communications.**

#### Integration Pattern

```
ANY APPLICATION ──► emit notification.send ──► notification-center_v2
                                                      │
                                                      ├──► render-notification-template
                                                      ├──► select channel (preferences)
                                                      ├──► dispatch-notifications
                                                      ├──► provider call (SMTP/SMS/Push)
                                                      │
                                                      ▼
                                              emit notification.sent
                                              emit notification.delivered
                                              emit notification.failed
```

#### Supported Notification Types

| Type | Source Apps | Channels | Template Variables |
|------|-------------|----------|-------------------|
| ticket.created.confirmation | customer-portal_v2, support-center_v2 | Email, SMS, In-app | customer_name, ticket_subject, ticket_id |
| ticket.status.changed | support-center_v2 | In-app, Email | customer_name, ticket_subject, new_status |
| ticket.reply.sent | support-center_v2 (via approval) | Email, SMS | customer_name, reply_preview, ticket_link |
| appointment.confirmed | appointment-center_v2 | Email, SMS | customer_name, service_type, date, time |
| appointment.reminder | appointment-center_v2 (scheduled) | Email, SMS | customer_name, appointment_date, technician_name |
| appointment.cancelled | appointment-center_v2, customer-portal_v2 | Email, SMS | customer_name, service_type, cancellation_reason |
| appointment.assigned | appointment-center_v2 | Push, SMS (technician) | technician_name, customer_address, service_type |
| dispatch.alert | operations-center_v2 | Push, SMS | technician_name, dispatch_type, priority, address |
| dispatch.escalated | operations-center_v2 (timeout) | Push, SMS, Discord | manager_name, dispatch_id, technician_name |
| dispute.created | resolution-center_v2 | In-app, Email | manager_name, customer_name, dispute_type |
| dispute.resolved | resolution-center_v2 | In-app, Email | customer_name, resolution, compensation |
| task.assigned | operations-center_v2 | In-app | assignee_name, task_title, due_date |
| followup.created | crm-center_v2 | In-app | assignee_name, followup_type, due_date |
| followup.overdue | crm-center_v2, system | In-app, Email | assignee_name, followup_subject, days_overdue |
| account.health.changed | crm-center_v2 | In-app, Email | account_manager_name, customer_name, new_health |
| sla.breach | system (scheduler) | In-app, Email, Discord | manager_name, ticket_subject, sla_tier |
| report.ready | analytics-center_v2 | Email | subscriber_name, report_name |
| user.welcome | admin-center_v2 | Email | user_name, login_link |
| system.health.alert | system (monitor) | Email, Discord, SMS | admin_name, component, severity |

---

## 13. Data Synchronization Contracts

### Real-Time Data Sync

| Data Domain | Sync Mechanism | Max Lag | Conflict Resolution |
|-------------|---------------|---------|-------------------|
| Ticket state | WebSocket (subscribeToTable) | <1s | Last-writer-wins (LWW) with audit |
| Appointment state | WebSocket (subscribeToTable) | <1s | LWW with conflict detection |
| Technician availability | WebSocket (subscribeToTable) | <1s | LWW |
| Task status | WebSocket (subscribeToTable) | <1s | LWW |
| Notification count | Event + poll (60s) | <60s | LWW |
| Account health | Event-driven refresh | <5s | LWW |
| KPI metrics | Poll (60s) + event invalidate | <60s | LWW |

### Offline Data Strategy

| App | Offline Mode | Sync on Reconnect |
|-----|-------------|-------------------|
| technician-portal_v2 | Cached schedule + job details | Queue status changes, flush photo uploads |
| customer-portal_v2 | Cached dashboard + recent data | Queue ticket/appointment mutations |
| support-center_v2 | Reduced: no real-time updates | Poll full refresh |
| operations-center_v2 | Cached dashboard KPIs | Full refresh |
| All others | Full offline: display maintenance page | Full page reload |

### Cache Invalidation

| Trigger | Cache Action |
|---------|-------------|
| Domain event received | Invalidate related app state cache |
| Application focus regained | Refresh stale caches |
| WebSocket reconnection | Full data sync from last known cursor |
| User-initiated refresh | Force invalidate specific cache |
| Configuration change (system.config.changed) | Clear all config caches |
| Idle timeout (30 min) | Clear non-essential caches |

---

## 14. Error Handling Contracts

### Error Classification

| Category | HTTP Status | Retryable | Frontend Action |
|----------|-------------|-----------|-----------------|
| Validation | 400 | No | Show field-level errors |
| Authentication | 401 | No | Redirect to login |
| Authorization | 403 | No | Show permission denied |
| Not Found | 404 | No | Show 404 state |
| Conflict | 409 | No | Show conflict message |
| Rate Limited | 429 | Yes (after delay) | Show rate limit notice, auto-retry |
| Server Error | 500 | Yes (3 attempts) | Show error state with retry |
| Service Unavailable | 503 | Yes (3 attempts) | Show maintenance page |
| Timeout | — | Yes (3 attempts) | Show error state with retry |
| Network Offline | — | Yes (on reconnect) | Show offline indicator |

### Retry Strategy

| Operation Type | Max Retries | Backoff | Timeout |
|---------------|-------------|---------|---------|
| Read (GET) | 2 | Linear: 1s, 3s | 10s |
| Write (POST, PUT) | 3 | Exponential: 1s, 5s, 15s | 30s |
| File Upload | 2 | Linear: 5s, 15s | 120s |
| Agent Invocation | 1 | Linear: 5s | 60s |
| WebSocket Reconnect | Infinite | Exponential: 1s, 2s, 4s, 8s, max 30s | — |

### Error Response Contract

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable summary",
    "details": [
      { "field": "field_name", "message": "Field-specific message", "code": "FIELD_ERROR_CODE" }
    ],
    "correlationId": "uuid",
    "timestamp": "ISO8601",
    "retryAfter": "integer|null"
  }
}
```

---

## 15. Security Integration Contracts

### Authentication Flow

```
User → Application → Lemma SDK Auth → Lemma Auth Service
                                           │
                                    ┌──────┴──────┐
                                    │             │
                                    ▼             ▼
                              Success          Failure
                                 │                │
                                 ▼                ▼
                          Return JWT        Return 401
                              │
                              ▼
                      Application stores
                      access_token + refresh_token
```

### Authorization Enforcement Points

| Enforcement Point | Mechanism | Check |
|------------------|-----------|-------|
| API Gateway | Lemma Auth middleware | Valid JWT, not expired |
| Backend Function | validate-permissions | Actor has required permissions for operation |
| Data Access | Lemma RLS | Row-level security (customer-scoped) |
| Frontend Route | RoleGuard component | User role has access to app/route |
| Frontend Action | PermissionGuard component | User permission allows action |
| Event Emission | Event filter | Origin app check (prevent self-consumption) |

### Permission Checking Contract

```json
// Frontend → Backend permission check request
{
  "actorId": "uuid",
  "requiredPermissions": ["view_tickets", "draft_reply"],
  "resourceType": "ticket",
  "resourceId": "uuid"
}

// Backend → Frontend response
{
  "authorized": true,
  "matchedPermissions": ["view_tickets", "draft_reply"],
  "missingPermissions": []
}
```

### Data Isolation Boundaries

| User Type | Data Scope | Enforcement |
|-----------|-----------|-------------|
| Customer | Own records only (by customer_id) | RLS: customer_id = auth.customer_id |
| Technician | Own assignments + tasks | RLS: technician_id = auth.technician_id |
| Agent | Team/queue scope | RLS: team_id IN user.teams |
| Manager | Department scope | RLS: department = user.department |
| Admin | All records | RLS: bypass for admin role |
| Super Admin | All records + system config | RLS: full bypass |
