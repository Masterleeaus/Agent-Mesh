# RESQAI V2 — State Machines

> Phase 1.2 — Design Only  
> Principal Database Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [State Machine Overview](#1-state-machine-overview)
2. [Ticket State Machine](#2-ticket-state-machine)
3. [Appointment State Machine](#3-appointment-state-machine)
4. [Work Order State Machine](#4-work-order-state-machine)
5. [Dispatch State Machine](#5-dispatch-state-machine)
6. [Dispute State Machine](#6-dispute-state-machine)
7. [Account Health State Machine](#7-account-health-state-machine)
8. [Followup State Machine](#8-followup-state-machine)
9. [Task State Machine](#9-task-state-machine)
10. [Notification State Machine](#10-notification-state-machine)
11. [Technician Availability State Machine](#11-technician-availability-state-machine)
12. [Customer Status State Machine](#12-customer-status-state-machine)
13. [Account Relationship State Machine](#13-account-relationship-state-machine)
14. [Article State Machine](#14-article-state-machine)
15. [User Status State Machine](#15-user-status-state-machine)

---

## 1. State Machine Overview

### Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Explicit Transitions** | Every state change is a deliberate action — no implicit transitions |
| 2 | **Immutable History** | State transitions are recorded in audit_log_v2; previous states are never overwritten |
| 3 | **Atomic State + Event** | Every state change emits exactly one domain event |
| 4 | **Guard Conditions** | Some transitions require preconditions (e.g., approval needed) |
| 5 | **Timeout Transitions** | Some transitions are triggered by time (e.g., overdue, SLA breach) |
| 6 | **Cancellation is Terminal** | Once cancelled, an entity cannot transition to any other active state |
| 7 | **Closed is Terminal** | Once closed/resolved, an entity cannot be reopened — reopen as a new record |

### Notation

```
State ──(action/trigger)──► Next State

States: [LIST]
Transitions: TABLE with action, from, to, guard, event
```

---

## 2. Ticket State Machine

### Purpose
Manage the lifecycle of a customer support ticket from creation through resolution.

### States

```
    ┌──────────────────────────────────────────────────────┐
    │                   TICKET LIFECYCLE                   │
    │                                                      │
    │                  ┌─────────┐                         │
    │                  │   NEW   │                         │
    │                  └────┬────┘                         │
    │                       │                              │
    │              classify │                              │
    │                       ▼                              │
    │                  ┌─────────┐                         │
    │                  │CLASSIFIED│                         │
    │                  └────┬────┘                         │
    │                       │                              │
    │                draft │                              │
    │                       ▼                              │
    │                  ┌─────────┐                         │
    │                  │ DRAFTED │                         │
    │                  └────┬────┘                         │
    │                       │                              │
    │               approve│                              │
    │                       ▼                              │
    │              ┌───────────────┐                       │
    │              │ APPROVED_TO_  │                       │
    │              │    SEND       │                       │
    │              └───────┬───────┘                       │
    │                      │                               │
    │                   send│                               │
    │                      ▼                               │
    │                  ┌─────────┐                         │
    │                  │  SENT   │────────────┐            │
    │                  └────┬────┘            │            │
    │                       │                 │            │
    │                  close│                 │escalate    │
    │                       ▼                 ▼            │
    │                  ┌─────────┐     ┌───────────┐       │
    │                  │ CLOSED  │     │ESCALATED  │       │
    │                  └─────────┘     └─────┬─────┘       │
    │                                        │             │
    │                                   resolve│          │
    │                                        ▼             │
    │                                   ┌─────────┐        │
    │                                   │ CLOSED  │        │
    │                                   └─────────┘        │
    └──────────────────────────────────────────────────────┘
```

### Valid States

| State | Description | Is Terminal |
|-------|-------------|:-----------:|
| `new` | Ticket created, unprocessed | No |
| `classified` | AI/agent classified type and urgency | No |
| `drafted` | Reply drafted (AI or manual) | No |
| `approved_to_send` | Manager approved the reply | No |
| `sent` | Reply sent to customer | No |
| `escalated` | Ticket escalated to higher support level | No |
| `closed` | Ticket resolved and closed | **Yes** |

### Transitions

| From | To | Action | Guard | Event Emitted |
|------|----|--------|-------|---------------|
| `new` | `classified` | classify | AI or agent classification complete | `ticket.classified` |
| `new` | `closed` | close_direct | Manual immediate close (info request) | `ticket.closed` |
| `classified` | `drafted` | draft_reply | Reply written (AI or manually) | `ticket.reply.drafted` |
| `drafted` | `classified` | revise | Agent needs to re-classify | `ticket.reclassified` |
| `drafted` | `approved_to_send` | approve | Manager approval | `ticket.reply.approved` |
| `approved_to_send` | `drafted` | reject | Manager rejects reply | `ticket.reply.rejected` |
| `approved_to_send` | `sent` | send | Reply dispatched to customer | `ticket.sent` |
| `sent` | `closed` | close | Customer issue resolved | `ticket.closed` |
| `new` | `escalated` | escalate | Urgency or complexity threshold | `ticket.escalated` |
| `classified` | `escalated` | escalate | Cannot classify | `ticket.escalated` |
| `drafted` | `escalated` | escalate | Complex issue needs senior | `ticket.escalated` |
| `sent` | `escalated` | escalate | Customer not satisfied | `ticket.escalated` |
| `escalated` | `drafted` | resolve_escalation | Senior resolves | `ticket.reply.drafted` |
| `escalated` | `closed` | close_escalated | Resolved at escalation level | `ticket.closed` |

### Timeout Transitions

| From | To | Condition | Action | Event |
|------|----|-----------|--------|-------|
| `new` | `escalated` | SLA breached (time since created > sla_deadline) | auto_escalate | `ticket.sla_breached` |
| `classified` | `escalated` | No draft within SLA window | auto_escalate | `ticket.sla_breached` |
| `drafted` | `escalated` | No approval within 24h | auto_escalate | `ticket.approval_overdue` |

### SLA Deadlines

| Urgency | Response Deadline | Resolution Deadline |
|---------|:----------------:|:------------------:|
| `urgent` | 1 hour | 4 hours |
| `high` | 4 hours | 24 hours |
| `normal` | 24 hours | 72 hours |
| `low` | 48 hours | 7 days |

---

## 3. Appointment State Machine

### Purpose
Manage the lifecycle of a customer appointment from booking to completion.

### States

```
    ┌────────────────────────────────────────────────────────────┐
    │                   APPOINTMENT LIFECYCLE                    │
    │                                                            │
    │              ┌────────────┐                                │
    │              │ SCHEDULED  │                                │
    │              └──────┬─────┘                                │
    │                     │                                      │
    │           ┌─────────┼─────────┐                            │
    │           │         │         │                            │
    │           ▼         ▼         ▼                            │
    │    ┌──────────┐ ┌────────┐ ┌───────┐                      │
    │    │CONFIRMED │ │CANCELLED│ │ON_HOLD│                      │
    │    └─────┬────┘ └────────┘ └───────┘                      │
    │          │                                                │
    │          ▼                                                │
    │    ┌──────────┐                                           │
    │    │IN_       │                                           │
    │    │PROGRESS  │                                           │
    │    └─────┬────┘                                           │
    │          │                                                │
    │    ┌─────┴────────┐                                       │
    │    │              │                                       │
    │    ▼              ▼                                       │
    │ ┌─────────┐ ┌──────────────┐                              │
    │ │COMPLETED│ │NEEDS_        │                              │
    │ └─────────┘ │FOLLOWUP      │                              │
    │             └──────────────┘                              │
    └────────────────────────────────────────────────────────────┘
```

### Valid States

| State | Description | Is Terminal |
|-------|-------------|:-----------:|
| `scheduled` | Appointment booked but not confirmed | No |
| `confirmed` | Customer confirmed the appointment | No |
| `in_progress` | Technician is on site working | No |
| `completed` | Job finished successfully | **Yes** |
| `needs_followup` | Work completed but followup needed | **Yes** |
| `cancelled` | Appointment cancelled | **Yes** |
| `on_hold` | Appointment paused (waiting for parts/info) | No |

### Transitions

| From | To | Action | Guard | Event Emitted |
|------|----|--------|-------|---------------|
| `scheduled` | `confirmed` | confirm | Customer confirmed time slot | `appointment.confirmed` |
| `scheduled` | `cancelled` | cancel | Before confirmation window | `appointment.cancelled` |
| `confirmed` | `in_progress` | start_job | Technician arrived on site | `appointment.started` |
| `confirmed` | `cancelled` | cancel | Late cancellation allowed | `appointment.cancelled` |
| `confirmed` | `on_hold` | hold | Parts unavailable, reschedule needed | `appointment.on_hold` |
| `on_hold` | `confirmed` | resume | Issue resolved | `appointment.resumed` |
| `on_hold` | `cancelled` | cancel | Cannot resolve hold | `appointment.cancelled` |
| `in_progress` | `completed` | complete_job | All work finished | `appointment.completed` |
| `in_progress` | `needs_followup` | complete_with_followup | Work done but followup needed | `appointment.completed` |
| `scheduled` | `scheduled` | reschedule | Date/time changed (stays in scheduled) | `appointment.rescheduled` |
| `confirmed` | `confirmed` | reschedule | Date/time changed (stays in confirmed) | `appointment.rescheduled` |

### Timeout Transitions

| From | To | Condition | Action | Event |
|------|----|-----------|--------|-------|
| `scheduled` | `cancelled` | No confirmation 24h before start | auto_cancel | `appointment.auto_cancelled` |
| `confirmed` | `in_progress` | Technician arrived + 15min buffer | auto_start | `appointment.auto_started` |

---

## 4. Work Order State Machine

### Purpose
Track the real-time progress of field work from assignment through completion.

### States

```
    ┌──────────────────────────────────────────────────────────┐
    │                  WORK ORDER LIFECYCLE                    │
    │                                                          │
    │                  ┌─────────┐                             │
    │                  │ CREATED │                             │
    │                  └────┬────┘                             │
    │                       │                                  │
    │                 assign│                                  │
    │                       ▼                                  │
    │                  ┌─────────┐                             │
    │                  │ASSIGNED │                             │
    │                  └────┬────┘                             │
    │                       │                                  │
    │                  travel│                                  │
    │                       ▼                                  │
    │                  ┌─────────┐                             │
    │                  │TRAVELLING│                             │
    │                  └────┬────┘                             │
    │                       │                                  │
    │                  arrive│                                  │
    │                       ▼                                  │
    │                  ┌─────────┐                             │
    │                  │ ON_SITE │                             │
    │                  └────┬────┘                             │
    │                       │                                  │
    │                   work│                                  │
    │                       ▼                                  │
    │                  ┌─────────┐                             │
    │                  │ WORKING │                             │
    │                  └────┬────┘                             │
    │                       │                                  │
    │              complete/│                                  │
    │              need_fup │                                  │
    │              ┌────────┴────────┐                         │
    │              ▼                 ▼                         │
    │        ┌──────────┐    ┌──────────────┐                  │
    │        │COMPLETED │    │NEEDS_FOLLOWUP│                  │
    │        └──────────┘    └──────────────┘                  │
    └──────────────────────────────────────────────────────────┘
```

### Valid States

| State | Description | Is Terminal |
|-------|-------------|:-----------:|
| `created` | Work order generated from appointment | No |
| `assigned` | Technician assigned to work order | No |
| `travelling` | Technician en route to customer | No |
| `on_site` | Technician arrived at location | No |
| `working` | Technician performing the work | No |
| `completed` | Work finished successfully | **Yes** |
| `needs_followup` | Work done but followup required | **Yes** |

### Transitions

| From | To | Action | Guard | Event Emitted |
|------|----|--------|-------|---------------|
| `created` | `assigned` | assign_technician | Technician selected | `work_order.assigned` |
| `assigned` | `travelling` | start_travel | Tech confirmed en route | `work_order.travelling` |
| `travelling` | `on_site` | arrive | GPS location at customer site | `work_order.on_site` |
| `on_site` | `working` | start_work | Tech started work | `work_order.working` |
| `working` | `completed` | complete | All tasks done, signature, photos | `work_order.completed` |
| `working` | `needs_followup` | complete_with_fup | Work done, additional visit needed | `work_order.followup_needed` |

### Stage Timeline

Each stage transition is recorded in `work_order_stages_v2` with timestamps and geo-location.

---

## 5. Dispatch State Machine

### Purpose
Track urgent dispatch coordination from initiation to resolution.

### States

```
    ┌──────────────────────────────────────────────────────┐
    │                 DISPATCH LIFECYCLE                   │
    │                                                      │
    │                ┌─────────┐                           │
    │                │ PENDING │                           │
    │                └────┬────┘                           │
    │                     │                                │
    │               send│ │                                │
    │                     ▼                                │
    │                ┌─────────┐                           │
    │                │ SENT    │                           │
    │                └────┬────┘                           │
    │                     │                                │
    │             ┌───────┴────────┐                       │
    │             ▼                ▼                       │
    │        ┌──────────┐   ┌──────────┐                   │
    │        │ACKNOWLEDG│   │ DECLINED │                   │
    │        │  ED      │   └─────┬────┘                   │
    │        └─────┬────┘         │                        │
    │              │              │ (reassign)             │
    │              │              ▼                        │
    │              │         ┌─────────┐                   │
    │              │         │ PENDING │ (re-sent)         │
    │              │         └─────────┘                   │
    │              ▼                                       │
    │        ┌──────────┐                                  │
    │        │ EN_ROUTE │                                  │
    │        └─────┬────┘                                  │
    │              │                                       │
    │              ▼                                       │
    │        ┌──────────┐                                  │
    │        │ ON_SITE  │                                  │
    │        └─────┬────┘                                  │
    │              │                                       │
    │              ▼                                       │
    │        ┌──────────┐                                  │
    │        │COMPLETED │                                  │
    │        └──────────┘                                  │
    │                                                      │
    │ Cancellation possible from: PENDING, SENT,           │
    │ ACKNOWLEDGED, DECLINED                               │
    │ CANCEL ──► CANCELLED (terminal)                     │
    └──────────────────────────────────────────────────────┘
```

### Valid States

| State | Description | Is Terminal |
|-------|-------------|:-----------:|
| `pending` | Dispatch created, awaiting sending | No |
| `sent` | Notification sent to technician | No |
| `acknowledged` | Technician accepted the dispatch | No |
| `declined` | Technician declined | No |
| `en_route` | Technician travelling to site | No |
| `on_site` | Technician arrived | No |
| `completed` | Dispatch resolved | **Yes** |
| `cancelled` | Dispatch cancelled | **Yes** |

### Transitions

| From | To | Action | Guard | Event Emitted |
|------|----|--------|-------|---------------|
| `pending` | `sent` | send | Notification dispatched | `dispatch.sent` |
| `sent` | `acknowledged` | acknowledge | Technician accepted within timeout | `dispatch.acknowledged` |
| `sent` | `declined` | decline | Technician declined | `dispatch.declined` |
| `declined` | `pending` | reassign | New technician selected | `dispatch.reassigned` |
| `acknowledged` | `en_route` | start_travel | Tech confirmed departure | `dispatch.en_route` |
| `en_route` | `on_site` | arrive | GPS arrival detection | `dispatch.on_site` |
| `on_site` | `completed` | complete | Job done | `dispatch.completed` |
| `pending` | `cancelled` | cancel | Manual cancellation | `dispatch.cancelled` |
| `sent` | `cancelled` | cancel | Before acknowledgment | `dispatch.cancelled` |
| `acknowledged` | `cancelled` | cancel | Manager override | `dispatch.cancelled` |

### Timeout Transitions

| From | To | Condition | Action |
|------|----|-----------|--------|
| `sent` | `pending` | No acknowledgment within 5 minutes | auto_reassign |
| `sent` | `pending` | Technician declines | auto_reassign |
| `acknowledged` | `pending` | No movement within 15 minutes | auto_escalate |

---

## 6. Dispute State Machine

### Purpose
Manage service dispute lifecycle from filing through AI analysis, recommendation, and closure.

### States

```
    ┌──────────────────────────────────────────────────────────┐
    │                  DISPUTE LIFECYCLE                       │
    │                                                          │
    │                  ┌─────────┐                             │
    │                  │  OPEN   │                             │
    │                  └────┬────┘                             │
    │                       │                                  │
    │               analyze│                                  │
    │                       ▼                                  │
    │                  ┌─────────┐                             │
    │                  │ANALYZING│                             │
    │                  └────┬────┘                             │
    │                       │                                  │
    │            ┌──────────┴──────────┐                       │
    │            ▼                     ▼                       │
    │    ┌──────────────┐    ┌──────────────┐                  │
    │    │RECOMMENDATION│    │ (agent low    │                  │
    │    │   READY      │    │  confidence)  │                  │
    │    └──────┬───────┘    │   ESCALATED   │                  │
    │           │            └──────┬────────┘                  │
    │           │                   │                           │
    │           ├───────────────────┘                           │
    │           │                                               │
    │    ┌──────┴────────┐                                      │
    │    ▼               ▼                                      │
    │ ┌────────┐   ┌──────────┐                                 │
    │ │APPROVED│   │ REJECTED │                                 │
    │ └───┬────┘   └────┬─────┘                                 │
    │     │              │                                      │
    │     └──────┬───────┘                                      │
    │            ▼                                              │
    │       ┌─────────┐                                         │
    │       │ CLOSED  │                                         │
    │       └─────────┘                                         │
    └──────────────────────────────────────────────────────────┘
```

### Valid States

| State | Description | Is Terminal |
|-------|-------------|:-----------:|
| `open` | Dispute filed, pending analysis | No |
| `analyzing` | AI agent is analyzing the dispute | No |
| `recommendation_ready` | AI has produced a recommendation | No |
| `escalated` | Low confidence, sent for human review | No |
| `approved` | Manager approved the recommendation | No |
| `rejected` | Manager rejected the recommendation | No |
| `closed` | Dispute fully resolved | **Yes** |

### Transitions

| From | To | Action | Guard | Event Emitted |
|------|----|--------|-------|---------------|
| `open` | `analyzing` | start_analysis | AI agent invoked | `dispute.analyzing` |
| `analyzing` | `recommendation_ready` | analysis_complete | AI confidence >= 0.8 | `dispute.analyzed` |
| `analyzing` | `escalated` | analysis_low_confidence | AI confidence < 0.8 | `dispute.escalated` |
| `recommendation_ready` | `approved` | approve | Manager approval | `dispute.approved` |
| `recommendation_ready` | `rejected` | reject | Manager rejection | `dispute.rejected` |
| `escalated` | `recommendation_ready` | human_resolution | Human produced recommendation | `dispute.analyzed` |
| `approved` | `closed` | apply_resolution | Resolution applied | `dispute.resolved` |
| `rejected` | `closed` | close_rejected | No resolution applied | `dispute.resolved` |
| `open` | `closed` | close_direct | Withdrawn by customer | `dispute.resolved` |

### Confidence-Guard Logic

```
AI confidence >= 0.8 → recommendation_ready (auto route to approval)
AI confidence  0.5–0.79 → escalated (human review required)
AI confidence <  0.5 → escalated with urgent flag
```

---

## 7. Account Health State Machine

### Purpose
Track the health of customer accounts through risk detection and intervention.

### States

```
    ┌──────────────────────────────────────────────────────┐
    │               ACCOUNT HEALTH LIFECYCLE               │
    │                                                      │
    │                  ┌─────────┐                         │
    │          ┌──────►│ HEALTHY │◄─────────┐              │
    │          │       └────┬────┘          │              │
    │          │            │               │              │
    │     upgrade      degrade│          upgrade           │
    │          │            ▼               │              │
    │          │       ┌─────────┐          │              │
    │          │       │  WATCH  │          │              │
    │          │       └────┬────┘          │              │
    │          │            │               │              │
    │          │       degrade│             │              │
    │          │            ▼               │              │
    │          │       ┌─────────┐          │              │
    │          │       │SLIPPING │          │              │
    │          │       └────┬────┘          │              │
    │          │            │               │              │
    │          │       degrade│             │              │
    │          │            ▼               │              │
    │          │       ┌─────────┐          │              │
    │          └───────┤ CRITICAL│──────────┘              │
    │                  └─────────┘                         │
    └──────────────────────────────────────────────────────┘
```

### Valid States

| State | Description | Score Range |
|-------|-------------|:-----------:|
| `healthy` | Account is in good standing | 0.8–1.0 |
| `watch` | Minor risk signals detected | 0.6–0.79 |
| `slipping` | Significant risk signals | 0.3–0.59 |
| `critical` | Immediate action required | 0.0–0.29 |

### Transitions

| From | To | Trigger | Action |
|------|----|---------|--------|
| Any | Any | health_scan_complete | Score recalculated; state set based on score range |
| `healthy` | `watch` | downgrade | Risk signals detected (open dispute, overdue followup, etc.) |
| `watch` | `healthy` | upgrade | Risk signals resolved |
| `watch` | `slipping` | downgrade | Multiple risk signals or critical signal |
| `slipping` | `watch` | upgrade | Risk signals partially resolved |
| `slipping` | `critical` | downgrade | Critical threshold breached |
| `critical` | `slipping` | upgrade | Intervention in progress |
| `critical` | `healthy` | upgrade | Full recovery (unlikely in one step) |

### Score Factors

| Factor | Weight | Description |
|--------|:------:|-------------|
| Open disputes | -0.20 per dispute | Each open dispute reduces score |
| Overdue followups | -0.15 per followup | Missed outreach reduces score |
| Account status | -0.30 if dormant/churned | Status at_risk reduces score |
| Lifetime jobs | +0.05 per job | Engagement increases score (cap at +0.30) |
| Recent appointment | +0.10 if within 30 days | Recent positive engagement |
| Time since last contact | -0.02 per month | Recency of engagement |
| Feedback rating | +0.10 × avg_rating | Satisfaction increases score |

---

## 8. Followup State Machine

### Purpose
Track followup items through creation, execution, and completion.

### States

```
    ┌──────────────────────────────────────────────────────┐
    │               FOLLOWUP LIFECYCLE                     │
    │                                                      │
    │                  ┌─────────┐                         │
    │                  │ PENDING │─────────┐                │
    │                  └────┬────┘         │                │
    │                       │              │                │
    │                   start│              │               │
    │                       ▼              │                │
    │                  ┌─────────┐         │                │
    │                  │IN_      │         │                │
    │                  │PROGRESS │         │                │
    │                  └────┬────┘         │                │
    │                       │              │                │
    │               ┌───────┴───────┐      │                │
    │               ▼               ▼      ▼                │
    │          ┌─────────┐    ┌─────────┐ ┌─────────┐      │
    │          │COMPLETED│    │ MISSED  │ │CANCELLED│      │
    │          └─────────┘    └─────────┘ └─────────┘      │
    └──────────────────────────────────────────────────────┘
```

### Valid States

| State | Description | Is Terminal |
|-------|-------------|:-----------:|
| `pending` | Followup created, not yet started | No |
| `in_progress` | Work in progress on followup | No |
| `completed` | Followup successfully completed | **Yes** |
| `missed` | Due date passed without completion | **Yes** |
| `cancelled` | Followup cancelled | **Yes** |

### Transitions

| From | To | Action | Guard |
|------|----|--------|-------|
| `pending` | `in_progress` | start_work | Assigned owner begins |
| `pending` | `completed` | complete_direct | No work needed, mark done |
| `pending` | `cancelled` | cancel | Followup no longer needed |
| `in_progress` | `completed` | complete | All required actions done |
| `in_progress` | `missed` | overdue | Due date passed |
| `in_progress` | `cancelled` | cancel | No longer applicable |
| `pending` | `missed` | auto_miss | Due date passed (auto) |

---

## 9. Task State Machine

### Purpose
Manage operational tasks through their lifecycle.

### States

```
    ┌──────────────────────────────────────────────────────┐
    │                  TASK LIFECYCLE                      │
    │                                                      │
    │                  ┌─────────┐                         │
    │             ┌───►│  OPEN   │──┐                      │
    │             │    └────┬────┘  │                      │
    │             │         │       │                      │
    │         reopen    start│      │ cancel               │
    │             │         ▼       │                      │
    │             │    ┌─────────┐  │                      │
    │             │    │IN_      │  │                      │
    │             │    │PROGRESS │  │                      │
    │             │    └────┬────┘  │                      │
    │             │         │       │                      │
    │        unblock   complete│    │                      │
    │             │         ▼       │                      │
    │             │    ┌─────────┐  │                      │
    │             └────┤  DONE   │  │                      │
    │                  └─────────┘  │                      │
    │                               │                      │
    │                  ┌─────────┐  │                      │
    │                  │ BLOCKED │──┘                      │
    │                  └────┬────┘                         │
    │                       │                              │
    │                  overdue│                             │
    │                       ▼                              │
    │                  ┌─────────┐                         │
    │                  │ OVERDUE │                         │
    │                  └─────────┘                         │
    │                                                      │
    │                  ┌─────────┐                         │
    │                  │CANCELLED│                         │
    │                  └─────────┘                         │
    └──────────────────────────────────────────────────────┘
```

### Valid States

| State | Description | Is Terminal |
|-------|-------------|:-----------:|
| `open` | Task created, unassigned or assigned | No |
| `in_progress` | Work started on task | No |
| `blocked` | Task blocked by dependency | No |
| `done` | Task completed successfully | **Yes** |
| `overdue` | Due date passed without completion | No (can still complete) |
| `cancelled` | Task cancelled | **Yes** |

### Transitions

| From | To | Action | Event Emitted |
|------|----|--------|---------------|
| `open` | `in_progress` | start | `task.started` |
| `open` | `cancelled` | cancel | `task.cancelled` |
| `in_progress` | `done` | complete | `task.completed` |
| `in_progress` | `blocked` | block | `task.blocked` |
| `blocked` | `in_progress` | unblock | `task.unblocked` |
| `blocked` | `cancelled` | cancel | `task.cancelled` |
| `open` | `overdue` | auto_overdue | `task.overdue` |
| `in_progress` | `overdue` | auto_overdue | `task.overdue` |
| `overdue` | `done` | complete | `task.completed` |
| `done` | `in_progress` | reopen | `task.reopened` |

---

## 10. Notification State Machine

### Purpose
Track the delivery lifecycle of outbound notifications.

### States

```
    ┌──────────────────────────────────────────────────────┐
    │              NOTIFICATION LIFECYCLE                  │
    │                                                      │
    │                  ┌─────────┐                         │
    │                  │ PENDING │                         │
    │                  └────┬────┘                         │
    │                       │                              │
    │                   send│                              │
    │                       ▼                              │
    │                  ┌─────────┐                         │
    │                  │  SENT   │                         │
    │                  └────┬────┘                         │
    │                       │                              │
    │              ┌────────┴────────┐                     │
    │              ▼                 ▼                     │
    │        ┌──────────┐    ┌──────────┐                  │
    │        │ DELIVERED│    │  FAILED  │                  │
    │        └─────┬────┘    └──────────┘                  │
    │              │                     │                 │
    │          read│                retry│                  │
    │              ▼                     ▼                 │
    │        ┌──────────┐          ┌─────────┐             │
    │        │   READ   │          │ PENDING │ (retry)     │
    │        └──────────┘          └─────────┘             │
    │                                                      │
    └──────────────────────────────────────────────────────┘
```

### Valid States

| State | Description | Is Terminal |
|-------|-------------|:-----------:|
| `pending` | Queued for delivery | No |
| `sent` | Dispatched to provider | No |
| `delivered` | Delivery confirmed by provider | Yes |
| `failed` | Delivery failed | No (retry) |
| `read` | Recipient opened/read (in-app only) | Yes |

### Transitions

| From | To | Action | Condition |
|------|----|--------|-----------|
| `pending` | `sent` | dispatch | Provider accepted |
| `pending` | `failed` | fail | Provider rejected |
| `sent` | `delivered` | confirm | Provider delivery callback |
| `sent` | `failed` | fail | Provider error |
| `failed` | `pending` | retry | Retry count < max_retries |
| `delivered` | `read` | read | In-app read receipt |

---

## 11. Technician Availability State Machine

### Purpose
Track technician availability for assignment and dispatch.

### States

```
    ┌──────────────────────────────────────────────────────┐
    │           TECHNICIAN AVAILABILITY                    │
    │                                                      │
    │              ┌───────────┐                           │
    │              │ AVAILABLE │◄──────────┐                │
    │              └─────┬─────┘           │                │
    │                    │                 │                │
    │           assigned │                 │ free           │
    │                    ▼                 │                │
    │              ┌──────────┐            │                │
    │              │   BUSY   │────────────┘                │
    │              └──────────┘                             │
    │                    │                                  │
    │              break │                                  │
    │                    ▼                                  │
    │              ┌──────────┐                             │
    │              │ ON_BREAK │                             │
    │              └─────┬────┘                             │
    │                    │                                  │
    │           return  │                                  │
    │                    ▼                                  │
    │              ┌──────────┐                             │
    │              │ AVAILABLE│                             │
    │              └──────────┘                             │
    │                                                       │
    │ Clock-out from any state: ──► OFF_SHIFT              │
    │ Clock-in: OFF_SHIFT ──► AVAILABLE                    │
    │ Leave from any state: ──► ON_LEAVE                   │
    │ Return: ON_LEAVE ──► AVAILABLE                       │
    └───────────────────────────────────────────────────────┘
```

### Valid States

| State | Description |
|-------|-------------|
| `available` | Ready for assignment |
| `busy` | Currently on a job |
| `on_break` | On scheduled break |
| `off_shift` | Clocked out for the day |
| `on_leave` | On vacation or sick leave |

---

## 12. Customer Status State Machine

### Purpose
Track the overall relationship status of a customer.

### States

```
    ┌──────────────────────────────────────────────────────┐
    │              CUSTOMER RELATIONSHIP                   │
    │                                                      │
    │              ┌───────────┐                           │
    │              │   ACTIVE  │◄──────────┐                │
    │              └─────┬─────┘           │                │
    │                    │                 │                │
    │           enters   │           won   │                │
    │           dispute  │           back  │                │
    │                    ▼                 │                │
    │              ┌───────────┐           │                │
    │              │IN_DISPUTE │           │                │
    │              └───────────┘           │                │
    │                    │                 │                │
    │            resolved│                 │                │
    │                    ▼                 │                │
    │              ┌───────────┐           │                │
    │              │   ACTIVE  │           │                │
    │              └─────┬─────┘           │                │
    │                    │                 │                │
    │      ┌─────────────┼──────────┐      │                │
    │      ▼             ▼          ▼      │                │
    │ ┌────────┐  ┌──────────┐ ┌─────────┐ │                │
    │ │AT_RISK │  │SERVICE_  │ │ DORMANT │ │                │
    │ └────────┘  │DUE       │ └────┬────┘ │                │
    │             └──────────┘      │      │                │
    │                        churned│      │                │
    │                               ▼      │                │
    │                          ┌─────────┐ │                │
    │                          │ CHURNED │─┘                │
    │                          └─────────┘                   │
    │                          │                            │
    │                     won_back│                          │
    │                          ▼                            │
    │                     ┌─────────┐                       │
    │                     │ ACTIVE  │                       │
    │                     └─────────┘                       │
    └───────────────────────────────────────────────────────┘
```

---

## 13. Account Relationship State Machine

### Purpose
Track the lifecycle stage of a customer account relationship.

### States

```
    new ──► active ──► watch ──► at_risk ──► dormant ──► churned
      │        │          │          │           │            │
      │        │          │          │           │            │
      └────────┴────┬─────┴────┬─────┴───────────┴──────┬─────┘
                    │          │                        │
                    ▼          ▼                        ▼
               ┌────────┐ ┌────────┐              ┌─────────┐
               │WON_BACK│ │in_     │              │ ACTIVE  │
               └────────┘ │dispute │              └─────────┘
                           └────────┘
```

---

## 14. Article State Machine

### Purpose
Manage knowledge base article lifecycle.

```
    ┌──────────────────────────────────────────────────────┐
    │               ARTICLE LIFECYCLE                      │
    │                                                      │
    │                  ┌─────────┐                         │
    │                  │  DRAFT  │                         │
    │                  └────┬────┘                         │
    │                       │                              │
    │                  publish│                            │
    │                       ▼                              │
    │                  ┌─────────┐                         │
    │                  │PUBLISHED│──┐                       │
    │                  └────┬────┘  │                      │
    │                       │       │                      │
    │                   archive      │                     │
    │                       ▼       │                      │
    │                  ┌─────────┐  │                      │
    │                  │ ARCHIVED│◄─┘                      │
    │                  └─────────┘                         │
    │                       │                              │
    │                   republish│                          │
    │                       ▼                              │
    │                  ┌─────────┐                         │
    │                  │PUBLISHED│                         │
    │                  └─────────┘                         │
    └──────────────────────────────────────────────────────┘
```

---

## 15. User Status State Machine

### Purpose
Manage platform user account lifecycle.

```
    ┌──────────────────────────────────────────────────────┐
    │                USER ACCOUNT LIFECYCLE                │
    │                                                      │
    │              ┌───────────┐                           │
    │              │  INVITED  │                           │
    │              └─────┬─────┘                           │
    │                    │                                 │
    │              register│                               │
    │                    ▼                                 │
    │              ┌───────────┐                           │
    │              │   ACTIVE  │                           │
    │              └─────┬─────┘                           │
    │                    │                                 │
    │            ┌───────┼────────┐                        │
    │            ▼       ▼        ▼                        │
    │      ┌────────┐ ┌────────┐ ┌──────────┐              │
    │      │INACTIVE│ │SUSPEND │ │ (active) │              │
    │      └────────┘ │  ED    │ └──────────┘              │
    │                 └────────┘                            │
    │                    │                                 │
    │               unsuspend│                             │
    │                    ▼                                 │
    │              ┌───────────┐                           │
    │              │   ACTIVE  │                           │
    │              └───────────┘                           │
    └──────────────────────────────────────────────────────┘
```

---

> **End of STATE_MACHINE.md**  
> Next document: EVENT_CATALOG.md
