# RESQAI V2 — Event Catalog

> Phase 1.2 — Design Only  
> Principal Database Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Event Design Principles](#1-event-design-principles)
2. [Event Naming Convention](#2-event-naming-convention)
3. [Complete Event Catalog](#3-complete-event-catalog)
4. [Event Flow Map](#4-event-flow-map)
5. [Event Payload Schemas](#5-event-payload-schemas)
6. [Event Consumer Mapping](#6-event-consumer-mapping)
7. [Future Workflow Triggers](#7-future-workflow-triggers)
8. [Future Notification Triggers](#8-future-notification-triggers)
9. [Future Analytics Triggers](#9-future-analytics-triggers)

---

## 1. Event Design Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Every state change emits exactly one event** | When a record transitions from state A to state B, one domain event is emitted |
| 2 | **Events are immutable facts** | Once emitted, events are never modified or deleted |
| 3 | **Events carry context** | Each event includes producer identity, entity ID, previous state, new state, and correlation ID |
| 4 | **Event name implies past tense** | `ticket.created` — the ticket has already been created |
| 5 | **Events are versioned** | Major changes get a new event name (e.g., `ticket.created.v2`) |
| 6 | **Events are discoverable** | The `events_v2` table records every event for replay and debugging |
| 7 | **Events enable eventual consistency** | Cross-domain data is synchronized through events, not distributed transactions |

---

## 2. Event Naming Convention

### Format

```
{entity}.{action}[.{modifier}]
```

### Rules

| Component | Convention | Examples |
|-----------|------------|----------|
| Entity | Lowercase, singular | `ticket`, `appointment`, `customer`, `dispatch` |
| Action | Past tense verb | `created`, `updated`, `status.changed`, `assigned` |
| Modifier | Optional context | `customer` (from customer portal), `escalated` (reason) |

### Examples

- `ticket.created` — A ticket was created
- `ticket.status.changed` — A ticket status transitioned
- `appointment.assigned` — A technician was assigned to an appointment
- `appointment.completed` — An appointment was marked complete
- `customer.dispute.filed` — A customer filed a dispute via portal

### Entity Prefixes

| Prefix | Entity |
|--------|--------|
| `ticket.` | tickets_v2 |
| `appointment.` | appointments_v2 |
| `work_order.` | work_orders_v2 |
| `dispatch.` | dispatches_v2 |
| `dispute.` | disputes_v2 |
| `task.` | tasks_v2 |
| `customer.` | customers_v2 |
| `technician.` | technicians_v2 |
| `account.` | accounts_v2 |
| `followup.` | followups_v2 |
| `feedback.` | feedback_v2 |
| `notification.` | notifications_v2 |
| `user.` | users_v2 |
| `system.` | system_settings_v2 |

---

## 3. Complete Event Catalog

### 3.1 Ticket Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `ticket.created` | A support ticket was created | support-center_v2, customer-portal_v2 | After INSERT into tickets_v2 |
| `ticket.classified` | AI classified ticket type and urgency | support-center_v2 (via agent) | After AI classification completes |
| `ticket.reply.drafted` | A reply was drafted (AI or agent) | support-center_v2 | After reply saved |
| `ticket.reply.approved` | Manager approved the draft reply | support-center_v2 | After approve action |
| `ticket.reply.rejected` | Manager rejected the draft reply | support-center_v2 | After reject action |
| `ticket.status.changed` | Ticket status transitioned | support-center_v2 | After any status change |
| `ticket.escalated` | Ticket was escalated | support-center_v2 | After escalate action |
| `ticket.sent` | Reply was sent to customer | notification-center_v2 | After successful delivery |
| `ticket.closed` | Ticket was closed | support-center_v2 | After close action |
| `ticket.sla_breached` | SLA deadline was missed | system (scheduler) | When SLA deadline passes |
| `ticket.assigned` | Ticket owner was changed | support-center_v2 | After assign action |

### 3.2 Appointment Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `appointment.created` | New appointment was booked | appointment-center_v2, customer-portal_v2 | After INSERT into appointments_v2 |
| `appointment.confirmed` | Customer confirmed the appointment | appointment-center_v2 | After confirm action |
| `appointment.assigned` | Technician was assigned | appointment-center_v2 | After assign action |
| `appointment.rescheduled` | Appointment date/time changed | appointment-center_v2, customer-portal_v2 | After reschedule action |
| `appointment.started` | Technician started the job | technician-portal_v2 | After start_job action |
| `appointment.completed` | Appointment completed successfully | technician-portal_v2 | After complete_job action |
| `appointment.cancelled` | Appointment was cancelled | appointment-center_v2, customer-portal_v2 | After cancel action |
| `appointment.on_hold` | Appointment was paused | appointment-center_v2 | After hold action |
| `appointment.reminder.sent` | Appointment reminder was sent | notification-center_v2 | After reminder delivery |
| `appointment.no_show` | Technician arrived but customer not present | technician-portal_v2 | After 15-min wait |

### 3.3 Work Order Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `work_order.created` | Work order generated | appointment-center_v2 | After appointment scheduled |
| `work_order.assigned` | Technician assigned to work order | operations-center_v2 | After assign action |
| `work_order.travelling` | Technician en route | technician-portal_v2 | After GPS departure |
| `work_order.on_site` | Technician arrived at site | technician-portal_v2 | After GPS arrival |
| `work_order.working` | Technician started work | technician-portal_v2 | After start_work action |
| `work_order.completed` | Work finished successfully | technician-portal_v2 | After complete action |
| `work_order.followup_needed` | Work done but followup required | technician-portal_v2 | After complete_with_fup action |
| `work_order.stage.changed` | Any stage transition | technician-portal_v2 | After every stage change |

### 3.4 Dispatch Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `dispatch.created` | Dispatch record created | operations-center_v2 | After INSERT into dispatches_v2 |
| `dispatch.sent` | Notification sent to technician | notification-center_v2 | After send action |
| `dispatch.acknowledged` | Technician accepted dispatch | technician-portal_v2 | After acknowledge action |
| `dispatch.declined` | Technician declined dispatch | technician-portal_v2 | After decline action |
| `dispatch.reassigned` | Different technician selected | operations-center_v2 | After reassign action |
| `dispatch.en_route` | Technician en route to dispatch | technician-portal_v2 | After start_travel |
| `dispatch.on_site` | Technician arrived on site | technician-portal_v2 | After arrive action |
| `dispatch.completed` | Dispatch resolved | technician-portal_v2 | After complete action |
| `dispatch.cancelled` | Dispatch cancelled | operations-center_v2 | After cancel action |
| `dispatch.escalated` | Dispatch required escalation | system (timeout) | After no-acknowledgment timeout |

### 3.5 Dispute Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `dispute.created` | New dispute was filed | resolution-center_v2, customer-portal_v2 | After INSERT into disputes_v2 |
| `dispute.analyzing` | AI analysis started | resolution-center_v2 | After agent invocation |
| `dispute.analyzed` | AI analysis complete (high confidence) | resolution-center_v2 (via agent) | After analysis >= 0.8 |
| `dispute.escalated` | Low confidence, human review needed | resolution-center_v2 | After analysis < 0.8 |
| `dispute.approved` | Manager approved recommendation | resolution-center_v2 | After approve action |
| `dispute.rejected` | Manager rejected recommendation | resolution-center_v2 | After reject action |
| `dispute.resolved` | Dispute closed with outcome | resolution-center_v2 | After close action |
| `dispute.status.changed` | Any dispute status transition | resolution-center_v2 | After any status change |

### 3.6 Account Health Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `account.health.scan.completed` | Health scan finished | crm-center_v2 | After scan function completes |
| `account.health.changed` | Health category changed | crm-center_v2 | After health calculation |
| `account.risk.signal.detected` | New risk signal identified | crm-center_v2 | After scan identifies risk |
| `account.relationship.changed` | Relationship status changed | crm-center_v2 | After status change |

### 3.7 Followup Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `followup.created` | New followup created | crm-center_v2 | After INSERT into followups_v2 |
| `followup.completed` | Followup action completed | crm-center_v2, technician-portal_v2 | After complete action |
| `followup.missed` | Followup due date passed | system (scheduler) | After due date passes |
| `followup.slippage.detected` | Followup is overdue (threshold) | crm-center_v2 | After slippage check |
| `followup.cancelled` | Followup cancelled | crm-center_v2 | After cancel action |

### 3.8 Task Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `task.created` | New task created | operations-center_v2 | After INSERT into tasks_v2 |
| `task.assigned` | Task assigned to user | operations-center_v2 | After assign action |
| `task.started` | Work started on task | operations-center_v2, technician-portal_v2 | After start action |
| `task.completed` | Task finished | operations-center_v2, technician-portal_v2 | After complete action |
| `task.blocked` | Task blocked by dependency | operations-center_v2 | After block action |
| `task.unblocked` | Task dependency resolved | operations-center_v2 | After unblock action |
| `task.overdue` | Task due date passed | system (scheduler) | After due date passes |
| `task.cancelled` | Task cancelled | operations-center_v2 | After cancel action |
| `task.status.changed` | Any task status transition | operations-center_v2 | After any status change |

### 3.9 Customer Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `customer.created` | New customer record | crm-center_v2, customer-portal_v2 | After INSERT into customers_v2 |
| `customer.updated` | Customer info changed | customer-portal_v2 | After UPDATE |
| `customer.status.changed` | Customer status changed | crm-center_v2 | After status change |

### 3.10 Technician Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `technician.availability.changed` | Tech availability toggled | technician-portal_v2 | After availability change |
| `technician.status.changed` | Tech active/inactive status | admin-center_v2 | After status change |
| `technician.assigned` | Tech assigned to appointment | appointment-center_v2 | After assign action |

### 3.11 Feedback Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `feedback.submitted` | Customer submitted feedback | customer-portal_v2, notification-center_v2 | After INSERT into feedback_v2 |
| `feedback.response_needed` | Customer requested followup | crm-center_v2 | After feedback with response_requested=true |

### 3.12 Notification Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `notification.send` | Request to send a notification | ALL apps | When any app requests notification |
| `notification.sent` | Notification dispatched to channel | notification-center_v2 | After provider accepts |
| `notification.delivered` | Delivery confirmed | notification-center_v2 | After provider callback |
| `notification.failed` | Delivery permanently failed | notification-center_v2 | After max retries |
| `notification.read` | Recipient opened notification | notification-center_v2, customer-portal_v2 | After read receipt |

### 3.13 User & System Events

| Event | Description | Producer | When Emitted |
|-------|-------------|----------|--------------|
| `user.created` | New user account created | admin-center_v2 | After INSERT into users_v2 |
| `user.role.changed` | User role modified | admin-center_v2 | After role update |
| `user.disabled` | User account disabled | admin-center_v2 | After disable action |
| `user.login` | User logged in | admin-center_v2 | After successful auth |
| `system.config.changed` | System setting modified | admin-center_v2 | After setting update |
| `system.health.alert` | System health issue detected | system (monitor) | After health check failure |
| `report.generated` | Analytics report generated | analytics-center_v2 | After report rendering |

### 3.14 Full Event Summary Table

```
Event Name                                  Producer App(s)           Primary Consumers
──────────────────────────────────────────  ───────────────────────   ─────────────────────────────────
ticket.created                              support_v2, customer_v2   notification_v2, analytics_v2, crm_v2
ticket.classified                           support_v2                notification_v2, analytics_v2, ops_v2
ticket.reply.drafted                        support_v2                (internal)
ticket.reply.approved                       support_v2                notification_v2, analytics_v2
ticket.reply.rejected                       support_v2                (internal)
ticket.status.changed                       support_v2                customer_v2, crm_v2, notification_v2, analytics_v2
ticket.escalated                            support_v2                ops_v2, notification_v2, analytics_v2
ticket.sent                                 notification_v2            analytics_v2
ticket.closed                               support_v2                crm_v2, analytics_v2
ticket.sla_breached                         system (scheduler)        ops_v2, notification_v2
ticket.assigned                             support_v2                notification_v2, analytics_v2

appointment.created                         appt_v2, customer_v2      ops_v2, notification_v2, crm_v2, analytics_v2
appointment.confirmed                       appt_v2                   notification_v2, analytics_v2
appointment.assigned                        appt_v2                   tech_v2, notification_v2, analytics_v2
appointment.rescheduled                     appt_v2, customer_v2      tech_v2, notification_v2, ops_v2, analytics_v2
appointment.started                         tech_v2                   ops_v2, analytics_v2
appointment.completed                       tech_v2                   crm_v2, analytics_v2, notification_v2
appointment.cancelled                       appt_v2, customer_v2      tech_v2, notification_v2, ops_v2, analytics_v2
appointment.on_hold                         appt_v2                   ops_v2, analytics_v2
appointment.reminder.sent                   notification_v2           analytics_v2
appointment.no_show                         tech_v2                   ops_v2, notification_v2

work_order.created                          appt_v2                   tech_v2, ops_v2, analytics_v2
work_order.assigned                         ops_v2                    tech_v2, notification_v2, analytics_v2
work_order.travelling                       tech_v2                   ops_v2, analytics_v2, crm_v2
work_order.on_site                          tech_v2                   ops_v2, analytics_v2
work_order.working                          tech_v2                   ops_v2, analytics_v2
work_order.completed                        tech_v2                   crm_v2, analytics_v2
work_order.followup_needed                  tech_v2                   crm_v2, analytics_v2
work_order.stage.changed                    tech_v2                   ops_v2, analytics_v2

dispatch.created                            ops_v2                    analytics_v2
dispatch.sent                               notification_v2           tech_v2, analytics_v2
dispatch.acknowledged                       tech_v2                   ops_v2, notification_v2, analytics_v2
dispatch.declined                           tech_v2                   ops_v2, analytics_v2
dispatch.reassigned                         ops_v2                    tech_v2, notification_v2, analytics_v2
dispatch.en_route                           tech_v2                   ops_v2, analytics_v2
dispatch.on_site                            tech_v2                   ops_v2, analytics_v2
dispatch.completed                          tech_v2                   ops_v2, notification_v2, analytics_v2
dispatch.cancelled                          ops_v2                    tech_v2, notification_v2, analytics_v2
dispatch.escalated                          system                    ops_v2, notification_v2, analytics_v2

dispute.created                             res_v2, customer_v2       customer_v2, notification_v2, crm_v2, analytics_v2
dispute.analyzing                           res_v2                    (internal)
dispute.analyzed                            res_v2 (agent)            notification_v2, analytics_v2
dispute.escalated                           res_v2                    notification_v2, analytics_v2
dispute.approved                            res_v2                    notification_v2, analytics_v2
dispute.rejected                            res_v2                    notification_v2, analytics_v2
dispute.resolved                            res_v2                    crm_v2, customer_v2, notification_v2, analytics_v2
dispute.status.changed                      res_v2                    customer_v2, notification_v2, analytics_v2

account.health.scan.completed               crm_v2                    analytics_v2
account.health.changed                      crm_v2                    customer_v2, ops_v2, notification_v2, analytics_v2
account.risk.signal.detected                crm_v2                    ops_v2, notification_v2, analytics_v2
account.relationship.changed                crm_v2                    analytics_v2

followup.created                            crm_v2                    notification_v2, analytics_v2, ops_v2
followup.completed                          crm_v2, tech_v2           analytics_v2
followup.missed                             system                    notification_v2, analytics_v2
followup.slippage.detected                  crm_v2                    ops_v2, notification_v2, analytics_v2
followup.cancelled                          crm_v2                    analytics_v2

task.created                                ops_v2                    tech_v2, notification_v2, analytics_v2
task.assigned                               ops_v2                    notification_v2, analytics_v2
task.started                                ops_v2, tech_v2           analytics_v2
task.completed                              ops_v2, tech_v2           analytics_v2
task.blocked                                ops_v2                    analytics_v2
task.unblocked                              ops_v2                    analytics_v2
task.overdue                                system                    notification_v2, analytics_v2
task.cancelled                              ops_v2                    analytics_v2
task.status.changed                         ops_v2                    analytics_v2, notification_v2 (if assigned)

customer.created                            crm_v2, customer_v2       analytics_v2
customer.updated                            customer_v2               analytics_v2
customer.status.changed                     crm_v2                    accounts_v2, analytics_v2

technician.availability.changed             tech_v2                   appt_v2, ops_v2, analytics_v2
technician.status.changed                   admin_v2                  analytics_v2
technician.assigned                         appt_v2                   tech_v2, notification_v2, analytics_v2

feedback.submitted                          customer_v2, notif_v2     crm_v2, analytics_v2
feedback.response_needed                    crm_v2                    notification_v2, analytics_v2

notification.send                           ALL apps                  notification_v2
notification.sent                           notification_v2           analytics_v2
notification.delivered                      notification_v2           analytics_v2
notification.failed                         notification_v2           admin_v2, analytics_v2
notification.read                           notification_v2           analytics_v2

user.created                                admin_v2                  notification_v2
user.role.changed                           admin_v2                  (config refresh)
user.disabled                               admin_v2                  (auth refresh)
user.login                                  admin_v2                  analytics_v2
system.config.changed                       admin_v2                  ALL apps (config refresh)
system.health.alert                         system                    admin_v2, notification_v2
report.generated                            analytics_v2              notification_v2
```

---

## 4. Event Flow Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EVENT FLOW MAP                                     │
│                                                                              │
│  CUSTOMER                      SUPPORT                       OPERATIONS     │
│  PORTAL                        CENTER                         CENTER        │
│  ─────────                     ──────                         ───────       │
│  ticket.created                ticket.created                 dispatch.*    │
│  │                             │                             task.*         │
│  ├──► ticket.created ─────────┤                             │              │
│  │                             ├──► ticket.classified        │              │
│  appointment.requested         ├──► ticket.status.changed    ├──► followup  │
│  │                             ├──► ticket.escalated ────────┤  .slippage   │
│  └──► appointment.created      │                             │              │
│                                ├──► ticket.reply.approved    ▼              │
│  dispute.filed                 │                        ┌────────┐          │
│  │                             ├──► ticket.closed       │ NOTIF  │          │
│  └──► dispute.created          │                        │ CENTER │          │
│                                │                        └────┬───┘          │
│  APPOINTMENT                   ▼                             │              │
│  CENTER                    ┌────────┐                        │              │
│  ─────────                  │  CRM   │                        │              │
│  appointment.*              │ CENTER │                        ▼              │
│  │                          └────┬───┘                  ┌──────────┐        │
│  ├──► appointment.created ──────┤                       │ ANALYTICS│        │
│  ├──► appointment.assigned ────►├──► account.health     │  CENTER  │        │
│  ├──► appointment.completed ────┤   .changed ───────────► (ALL      │        │
│  └──► appointment.cancelled     │                         events)  │        │
│                                  ├──► followup.*         └──────────┘        │
│  TECHNICIAN                     │                                            │
│  PORTAL                         ▼                                            │
│  ─────────                  ┌────────┐                                       │
│  appointment.*              │DISPUTE │                                       │
│  work_order.*               │CENTER  │                                       │
│  dispatch.*                 └───┬────┘                                       │
│  technician.availability        │                                             │
│                                 ├──► dispute.*                               │
│                                 └──► dispute.resolved ───► crm               │
│                                                                              │
│  ADMIN CENTER                                                                 │
│  ───────────                                                                 │
│  user.*                      ┌─────────────────────────┐                    │
│  system.config.changed ─────►│ ALL APPS (config refresh)│                    │
│                              └─────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Event Payload Schemas

### 5.1 Common Payload Fields

Every event payload includes:

```json
{
  "event_name": "ticket.status.changed",
  "version": 1,
  "emitted_at": "2026-06-28T12:00:00Z",
  "correlation_id": "corr_abc123",
  "producer": {
    "app": "support-center_v2",
    "actor_type": "user",
    "actor_id": "user_xyz456"
  },
  "entity": {
    "type": "ticket",
    "id": "ticket_uuid_here"
  }
}
```

### 5.2 Specific Event Payloads

**ticket.created**
```json
{
  "entity": { "type": "ticket", "id": "uuid" },
  "data": {
    "customer_id": "uuid",
    "customer_name": "Jane Doe",
    "channel": "email",
    "subject": "AC not cooling",
    "request_type": "complaint",
    "urgency": "high",
    "status": "new"
  }
}
```

**ticket.status.changed**
```json
{
  "entity": { "type": "ticket", "id": "uuid" },
  "data": {
    "previous_status": "drafted",
    "new_status": "approved_to_send",
    "changed_by": "user_xyz",
    "reason": "Manager approved reply"
  }
}
```

**appointment.created**
```json
{
  "entity": { "type": "appointment", "id": "uuid" },
  "data": {
    "customer_id": "uuid",
    "service_type": "ac_repair",
    "scheduled_date": "2026-07-01T14:00:00Z",
    "technician_id": null,
    "status": "scheduled"
  }
}
```

**appointment.assigned**
```json
{
  "entity": { "type": "appointment", "id": "uuid" },
  "data": {
    "technician_id": "uuid",
    "technician_name": "Priya Patel",
    "assigned_by": "system",
    "skill_match_score": 0.92
  }
}
```

**dispatch.completed**
```json
{
  "entity": { "type": "dispatch", "id": "uuid" },
  "data": {
    "ticket_id": "uuid",
    "technician_id": "uuid",
    "dispatch_type": "urgent",
    "started_at": "2026-06-28T09:00:00Z",
    "completed_at": "2026-06-28T11:30:00Z",
    "duration_minutes": 150
  }
}
```

**dispute.analyzed**
```json
{
  "entity": { "type": "dispute", "id": "uuid" },
  "data": {
    "appointment_id": "uuid",
    "confidence": 0.87,
    "recommended_resolution": "partial_refund",
    "resolution_reason": "Evidence supports partial refund of service charge",
    "analysis_summary": "Customer claim partially valid..."
  }
}
```

**account.health.changed**
```json
{
  "entity": { "type": "account", "id": "uuid" },
  "data": {
    "customer_id": "uuid",
    "customer_name": "Jane Doe",
    "previous_health": "watch",
    "new_health": "slipping",
    "previous_score": 0.72,
    "new_score": 0.55,
    "risk_factors": [
      { "factor": "open_dispute", "severity": "high" },
      { "factor": "overdue_followup", "severity": "medium" }
    ]
  }
}
```

**followup.slippage.detected**
```json
{
  "entity": { "type": "followup", "id": "uuid" },
  "data": {
    "account_id": "uuid",
    "customer_name": "Jane Doe",
    "followup_type": "post_service",
    "subject": "Post-service check-in",
    "due_date": "2026-06-20",
    "days_overdue": 8,
    "assigned_to": "csr"
  }
}
```

**notification.send**
```json
{
  "entity": { "type": "notification", "id": null },
  "data": {
    "recipient_type": "customer",
    "recipient_id": "uuid",
    "notification_type": "ticket_status_changed",
    "channel": "email",
    "template_id": "uuid",
    "variables": {
      "customer_name": "Jane Doe",
      "ticket_subject": "AC not cooling",
      "new_status": "sent"
    },
    "correlation_source_event": "ticket.reply.approved",
    "correlation_source_id": "uuid"
  }
}
```

---

## 6. Event Consumer Mapping

### 6.1 By Application

| Application | Events Consumed |
|-------------|-----------------|
| **customer-portal_v2** | ticket.status.changed, appointment.status.changed, dispute.status.changed, account.health.changed, feedback.response_needed |
| **support-center_v2** | ticket.status.changed (own), ticket.intake.completed |
| **operations-center_v2** | ticket.escalated, ticket.classified (urgent), appointment.status.changed, appointment.cancelled, dispatch.* (own), followup.slippage.detected, account.health.changed (critical), task.* (own) |
| **appointment-center_v2** | ticket.classified (service-required), technician.availability.changed, dispute.created, appointment.* (own) |
| **technician-portal_v2** | appointment.assigned, appointment.rescheduled, appointment.cancelled, dispatch.*, task.created, work_order.* (own) |
| **resolution-center_v2** | appointment.* (needs_followup), dispute.* (own) |
| **crm-center_v2** | ticket.status.changed, appointment.completed, dispute.resolved, appointment.created, feedback.submitted, account.* (own) |
| **notification-center_v2** | notification.send (FROM ALL APPS) |
| **analytics-center_v2** | ALL domain events (50+) |
| **admin-center_v2** | notification.failed, system.health.alert |

### 6.2 By Workflow

| Workflow | Trigger Event(s) |
|----------|-----------------|
| **ticket-intake_v2** | ticket.created |
| **urgent-dispatch_v2** | ticket.created (urgent), ticket.escalated |
| **support-escalation-manager_v2** | ticket.escalated, ticket.sla_breached |
| **appointment-assignment_v2** | appointment.created |
| **appointment-reminders_v2** | appointment.confirmed (schedules reminders) |
| **dispute-resolution_v2** | dispute.created |
| **account-health-monitoring_v2** | account.health.changed (scheduled scan also) |
| **followup-slippage-detector_v2** | (scheduled, not event-triggered) |
| **customer-satisfaction-monitor_v2** | ticket.closed, appointment.completed |
| **daily-standup_v2** | (scheduled, not event-triggered) |

---

## 7. Future Workflow Triggers

| Future Workflow | Trigger Event | Description |
|----------------|---------------|-------------|
| **auto-reorder_inventory_v2** | inventory_items_v2 (low stock event) | Auto-generate purchase orders |
| **customer-win-back_v2** | account.health.changed (churned) | Automated win-back campaign |
| **technician-certification-expiry_v2** | technician_skills_v2 (cert expiry) | Notify about expiring certs |
| **smart-scheduling-optimization_v2** | appointment.created | AI optimization of schedule |
| **feedback-followup_v2** | feedback.submitted (low rating) | Escalate negative feedback |
| **sla-monitoring_v2** | ticket.created, ticket.classified | Real-time SLA tracking |

---

## 8. Future Notification Triggers

| Notification | Trigger Event | Channel | Audience |
|-------------|---------------|---------|----------|
| Ticket created confirmation | ticket.created | Email, SMS | Customer |
| Ticket status changed | ticket.status.changed | In-app, Email | Customer |
| Reply sent | ticket.reply.approved | Email, SMS | Customer |
| Appointment reminder | appointment.confirmed | Email, SMS | Customer |
| Assignment alert | appointment.assigned | SMS, Push | Technician |
| Dispatch alert | dispatch.sent | SMS, Push | Technician |
| Urgent dispatch escalation | dispatch.escalated | SMS, Push, Discord | Manager |
| Health downgrade alert | account.health.changed | In-app, Email | Account Manager |
| Followup overdue | followup.slippage.detected | In-app, Email | Assigned user |
| New dispute filed | dispute.created | In-app, Email | Resolution Manager |
| Dispute resolved | dispute.resolved | In-app, Email | Customer |
| Task assigned | task.assigned | In-app | Assignee |
| SLA breach warning | ticket.sla_breached | In-app, Email, Discord | Support Manager |
| Feedback received | feedback.submitted | In-app | CRM Manager |
| Report ready | report.generated | Email | Report subscriber |
| System health alert | system.health.alert | Email, Discord, SMS | Admin |

---

## 9. Future Analytics Triggers

| Analytics Metric | Trigger Event(s) | Aggregation |
|-----------------|------------------|-------------|
| Ticket volume (24h) | ticket.created | Count events in window |
| Active tickets by status | ticket.status.changed | Snapshot at query time |
| Average resolution time | ticket.created → ticket.closed | Duration between events |
| SLA compliance % | ticket.created, ticket.sla_breached, ticket.closed | Ratio of breached to total |
| Appointment volume | appointment.created | Count in window |
| Completion rate | appointment.completed, appointment.cancelled | Ratio |
| Technician utilization | work_order.* | Time in stages |
| Dispatch response time | dispatch.sent → dispatch.acknowledged | Duration |
| Dispute resolution rate | dispute.resolved, dispute.created | Ratio |
| Health distribution | account.health.changed | Snapshot of current health |
| Followup completion rate | followup.created, followup.completed | Ratio |
| Followup slippage rate | followup.slippage.detected | Count in window |
| Customer satisfaction | feedback.submitted | Average rating |
| NPS score | feedback_surveys_v2.response_value | Average of NPS questions |
| Notification delivery rate | notification.sent, notification.failed | Ratio |
| Agent invocation volume | events_v2 (agent-related) | Count per agent |
| User activity | user.login | Count per user |

---

> **End of EVENT_CATALOG.md**  
> Next document: TABLE_DEPENDENCY_GRAPH.md
