# RESQAI V2 — State Transition Diagrams

> Phase 3.4 — Enterprise Business Flow Specification
> Chief Enterprise Business Architect
> Date: 2026-06-29

---

## Table of Contents

1. [Notation](#1-notation)
2. [Master State Landscape](#2-master-state-landscape)
3. [Ticket State Diagram](#3-ticket-state-diagram)
4. [Appointment State Diagram](#4-appointment-state-diagram)
5. [Work Order State Diagram](#5-work-order-state-diagram)
6. [Dispatch State Diagram](#6-dispatch-state-diagram)
7. [Dispute State Diagram](#7-dispute-state-diagram)
8. [Account Health State Diagram](#8-account-health-state-diagram)
9. [Followup State Diagram](#9-followup-state-diagram)
10. [Task State Diagram](#10-task-state-diagram)
11. [Technician Availability State Diagram](#11-technician-availability-state-diagram)
12. [Customer Relationship State Diagram](#12-customer-relationship-state-diagram)
13. [Notification State Diagram](#13-notification-state-diagram)
14. [User Status State Diagram](#14-user-status-state-diagram)
15. [Cross-Entity State Dependencies](#15-cross-entity-state-dependencies)

---

## 1. Notation

```
[STATE]        Valid state of an entity
  ──action──►  Transition triggered by an action
  ==timeout==> Transition triggered by timeout
  ~~flag~~>    Conditional transition based on guard
  │            Branch point (OR)
  ├──          Branch point (AND)
  ▲            Re-entry point
  ●            Terminal state
  ○            Initial state
```

---

## 2. Master State Landscape

```
DOMAIN           ENTITY            STATES                                          TERMINAL STATES
──────           ──────            ──────                                          ───────────────
Support          Ticket            new → classified → drafted → approved_to_send   closed
                                   → sent → escalated
Scheduling       Appointment       scheduled → confirmed → in_progress             completed, cancelled
                                   → completed → needs_followup → cancelled
                                   → on_hold
Field Ops        Work Order        created → assigned → travelling → on_site      completed, needs_followup
                                   → working → completed → needs_followup
Dispatch         Dispatch          pending → sent → acknowledged → declined        completed, cancelled
                                   → en_route → on_site → completed
Resolution       Dispute           open → analyzing → recommendation_ready        closed
                                   → escalated → approved → rejected
CRM              Account Health    healthy → watch → slipping → critical          (none — cyclic)
CRM              Followup          pending → in_progress → completed              completed, missed, cancelled
                                   → missed → cancelled
Operations       Task              open → in_progress → blocked → done            done, cancelled
                                   → overdue
Admin            User              active → suspended → disabled                  disabled
Admin            Notification      pending → sent → delivered → read              delivered, read, failed
                                   → failed
Technician       Availability      available → busy → on_break → off_shift       (none — cyclic)
                                   → on_leave
Customer         Relationship      active → in_dispute → at_risk → dormant        churned
                                   → service_due → churned
```

---

## 3. Ticket State Diagram

```
                         TICKET LIFECYCLE
                     ─────────────────────

                           ○
                           │
                           ▼
                      ┌─────────┐
                      │  NEW    │
                      └────┬────┘
                           │
                    ┌──────┼──────────┐
                    │      │          │
                    │   classify     │ auto-escalate (SLA breach)
                    │      │          │
                    │      ▼          ▼
                    │ ┌─────────┐ ┌──────────┐
                    │ │CLASSIFIED│ │ESCALATED │
                    │ └────┬────┘ └────┬─────┘
                    │      │          │
                    │   draft        │ resolve
                    │      │          │
                    │      ▼          ▼
                    │ ┌─────────┐ ┌─────────┐
                    │ │ DRAFTED │ │ DRAFTED │ (return to flow)
                    │ └────┬────┘ └─────────┘
                    │      │
                    │   approve
                    │      │
                    │      ▼
                    │ ┌───────────────┐
                    │ │APPROVED_TO    │
                    │ │   _SEND       │
                    │ └───────┬───────┘
                    │         │
                    │      send
                    │         │
                    │         ▼
                    │    ┌─────────┐
                    │    │ SENT    │
                    │    └────┬────┘
                    │         │
                    │      close
                    │         │
                    │         ▼
                    │    ┌─────────┐
                    └────┤ CLOSED  ●
                         └─────────┘

TRANSITION TABLE:
┌──────────────────────┬─────────────────┬──────────────────────────────┐
│ From                 │ To              │ Action / Trigger             │
├──────────────────────┼─────────────────┼──────────────────────────────┤
│ new                  │ classified      │ classify (AI agent)          │
│ new                  │ escalated       │ SLA breach timeout            │
│ new                  │ closed          │ close_direct (manual)        │
│ classified           │ drafted         │ draft_reply (AI/manual)      │
│ classified           │ escalated       │ cannot classify              │
│ drafted              │ approved_to_send│ approve (human)              │
│ drafted              │ classified      │ revise (re-classify)         │
│ drafted              │ escalated       │ complex issue escalation     │
│ approved_to_send     │ drafted         │ reject (human)               │
│ approved_to_send     │ sent            │ send (system)                │
│ sent                 │ closed          │ close (resolved)             │
│ sent                 │ escalated       │ customer not satisfied       │
│ escalated            │ drafted         │ resolve_escalation           │
│ escalated            │ closed          │ close_escalated              │
│ ANY                  │ escalated       │ approval_timeout (24h)       │
└──────────────────────┴─────────────────┴──────────────────────────────┘
```

---

## 4. Appointment State Diagram

```
                      APPOINTMENT LIFECYCLE
                    ─────────────────────────

                           ○
                           │
                           ▼
                      ┌────────────┐
                      │ SCHEDULED  │
                      └──────┬─────┘
                           │
              ┌────────────┼─────────────┐
              │            │             │
           confirm    auto-cancel    reschedule
              │      (24h no reply)    │
              │            │           │ (stays in
              ▼            ▼           │  scheduled)
         ┌──────────┐ ┌─────────┐      │
         │CONFIRMED │ │CANCELLED│      │
         └─────┬────┘ └─────────┘      │
              │           ●            │
           start_job                  │
              │                       │
              ▼                       │
         ┌──────────┐                 │
         │IN_PROGRESS│                │
         └─────┬────┘                 │
              │                      │
        ┌─────┴─────────┐            │
        │               │           │
   complete_job    need_followup    │
        │               │           │
        ▼               ▼           │
   ┌─────────┐ ┌──────────────┐     │
   │COMPLETED│ │NEEDS_FOLLOWUP│     │
   └─────────┘ └──────────────┘     │
        ●            ●             │
                                    │
                              reschedule
                              (from confirmed
                               or scheduled)

HOLD PATH:
  confirmed ──hold──► on_hold ──resume──► confirmed
                      │
                      └──cancel──► cancelled ●
```

---

## 5. Work Order State Diagram

```
                      WORK ORDER LIFECYCLE
                    ─────────────────────────

                           ○
                           │
                           ▼
                      ┌─────────┐
                      │ CREATED │
                      └────┬────┘
                           │
                      assign_tech
                           │
                           ▼
                      ┌─────────┐
                      │ASSIGNED │
                      └────┬────┘
                           │
                      start_travel
                           │
                           ▼
                      ┌───────────┐
                      │TRAVELLING │
                      └─────┬─────┘
                           │
                       arrive (GPS)
                           │
                           ▼
                      ┌─────────┐
                      │ ON_SITE │
                      └────┬────┘
                           │
                      start_work
                           │
                           ▼
                      ┌─────────┐
                      │ WORKING │
                      └────┬────┘
                           │
                    ┌──────┴────────┐
                    │               │
                complete      need_followup
                    │               │
                    ▼               ▼
               ┌──────────┐ ┌──────────────┐
               │COMPLETED │ │NEEDS_FOLLOWUP│
               └──────────┘ └──────────────┘
                    ●              ●

STAGE PROGRESSION (recorded in work_order_stages_v2):
  Stage: created → assigned → travelling → on_site → working → completed
          C001       C002       C003         C004     C005      C006

TIMEOUT GUARDS:
  - Stage stalled > 4h → escalate to Work Order Manager AI
  - Total duration > 8h → auto-escalate
```

---

## 6. Dispatch State Diagram

```
                      DISPATCH LIFECYCLE
                    ──────────────────────

                           ○
                           │
                           ▼
                      ┌─────────┐
                      │ PENDING │
                      └────┬────┘
                           │
                        send
                           │
                           ▼
                      ┌─────────┐
                      │  SENT   │
                      └────┬────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
          acknowledge  decline    timeout (10min urgent
              │            │         / 30min standard)
              ▼            ▼            │
         ┌──────────┐ ┌─────────┐       │
         │ACKNOWLEDG│ │DECLINED │       │
         │   ED     │ └────┬────┘       │
         └─────┬────┘      │            │
              │        reassign         │
              │            │            │
              │            ▼            │
              │       ┌─────────┐       │
              │       │ PENDING │◄──────┘
              │       └─────────┘  (re-sent)
              ▼
         ┌──────────┐
         │ EN_ROUTE │
         └─────┬────┘
              │
          arrive (GPS)
              │
              ▼
         ┌──────────┐
         │ ON_SITE  │
         └─────┬────┘
              │
          complete
              │
              ▼
         ┌──────────┐
         │COMPLETED │ ●
         └──────────┘

CANCEL PATH (from any active state):
  pending/sent/acknowledged/declined ──cancel──► CANCELLED ●

EMERGENCY PATH:
  emergency flag → PARALLEL broadcast to ALL available
```

---

## 7. Dispute State Diagram

```
                       DISPUTE LIFECYCLE
                    ──────────────────────

                           ○
                           │
                           ▼
                      ┌─────────┐
                      │  OPEN   │
                      └────┬────┘
                           │
                     start_analysis
                           │
                           ▼
                      ┌───────────┐
                      │ ANALYZING │
                      └─────┬─────┘
                           │
                    ┌──────┴──────────┐
                    │                 │
               analysis_complete    low_confidence (< 0.50)
               (confidence >= 0.80)  │
                    │                 │
                    ▼                 ▼
            ┌──────────────┐  ┌──────────────┐
            │RECOMMENDATION│  │  ESCALATED   │
            │    READY     │  │ (urgent flag) │
            └──────┬───────┘  └──────┬────────┘
                   │                 │
              ┌────┴────┐       human_review
              │         │            │
           approve   reject          │
              │         │            │
              ▼         ▼            ▼
         ┌────────┐ ┌──────────┐  (may resolve to
         │APPROVED│ │ REJECTED │   recommendation_ready
         └───┬────┘ └────┬─────┘   or closed)
              │           │
          apply_resolution close_rejected
              │           │
              └─────┬─────┘
                    │
                    ▼
               ┌─────────┐
               │ CLOSED  │ ●
               └─────────┘

CONFIDENCE GUARD LOGIC:
  ┌──────────────────┬──────────────────────┬──────────────────────┐
  │ AI Confidence    │ Routing              │ Human Required       │
  ├──────────────────┼──────────────────────┼──────────────────────┤
  │ >= 0.80          │ recommendation_ready │ QA Manager (fast)    │
  │ 0.50 – 0.79      │ recommendation_ready │ Resolution Manager   │
  │ < 0.50           │ escalated (urgent)   │ Resolution Manager   │
  └──────────────────┴──────────────────────┴──────────────────────┘
```

---

## 8. Account Health State Diagram

```
                     ACCOUNT HEALTH LIFECYCLE
                    ───────────────────────────

                    ┌─────────────────────────────┐
                    │        HEALTHY (0.8-1.0)     │
                    │            │                 │
                    │      health declines         │
                    │            │                 │
                    │            ▼                 │
                    │        WATCH (0.6-0.79)      │
                    │            │        ▲        │
                    │            │        │        │
                    │      further decline  improvement │
                    │            │        │        │
                    │            ▼        │        │
                    │      SLIPPING (0.3-0.59)    │
                    │            │        ▲        │
                    │            │        │        │
                    │      critical decline│      │
                    │            │    improvement │
                    │            ▼        │        │
                    │      CRITICAL (0.0-0.29)    │
                    │            │                 │
                    │      full recovery           │
                    └──────┬──────────────────────┘
                           │
                     (direct transition from
                      critical to healthy possible)

TRANSITION RULES:
  ┌────────────────────┬─────────────────────────────────────────┐
  │ Transition         │ Trigger                                  │
  ├────────────────────┼─────────────────────────────────────────┤
  │ Any → Any          │ Health scan completes (daily/on-demand)  │
  │ healthy → watch    │ New dispute filed OR overdue followup    │
  │ watch → healthy    │ All risk signals resolved                │
  │ watch → slipping   │ Multiple risk signals OR feedback < 3    │
  │ slipping → watch   │ Risk signals partially resolved          │
  │ slipping → critical│ Critical threshold breached              │
  │ critical → slipping│ Intervention in progress                 │
  │ critical → healthy │ Full recovery (rare)                     │
  └────────────────────┴─────────────────────────────────────────┘

SCORE FORMULA:
  base_score = 1.0
  - (0.20 × open_disputes)
  - (0.15 × overdue_followups)
  - (0.30 if account = dormant/at_risk)
  + (0.05 × lifetime_jobs, cap +0.30)
  + (0.10 if recent_appointment < 30 days)
  - (0.02 × months_since_last_contact)
  + (0.10 × avg_feedback_rating)
```

---

## 9. Followup State Diagram

```
                      FOLLOWUP LIFECYCLE
                    ──────────────────────

                           ○
                           │
                           ▼
                      ┌─────────┐
                      │ PENDING │
                      └────┬────┘
                           │
              ┌────────────┼──────────┐
              │            │          │
           start       complete   auto_miss
              │         (direct)   (overdue)
              ▼            │          │
         ┌─────────┐      │          │
         │IN_      │      │          │
         │PROGRESS │      │          │
         └────┬────┘      │          │
              │           │          │
           complete      │          │
              │           │          │
              ▼           ▼          ▼
         ┌─────────┐ ┌─────────┐ ┌─────────┐
         │COMPLETED│ │COMPLETED│ │ MISSED  │
         └─────────┘ └─────────┘ └────┬────┘
              ●            ●           │
                                     close
                                       │
                                       ▼
                                  ┌─────────┐
                                  │CANCELLED│
                                  └─────────┘
                                       ●

CANCEL PATH:
  pending ──cancel──► CANCELLED ●
  in_progress ──cancel──► CANCELLED ●
  missed ──cancel──► CANCELLED ●
```

---

## 10. Task State Diagram

```
                       TASK LIFECYCLE
                    ────────────────────

                           ○
                           │
                           ▼
                      ┌─────────┐
                  ┌──►│  OPEN   │
                  │   └────┬────┘
                  │        │
               reopen   start
                  │        │
                  │        ▼
                  │   ┌─────────┐
                  │   │IN_      │
                  │   │PROGRESS │
                  │   └────┬────┘
                  │        │
               unblock complete
                  │        │
                  │        ▼
                  │   ┌─────────┐
                  └───┤  DONE   │ ●
                      └─────────┘

                  ┌─────────┐
                  │ BLOCKED │─── cancel ──► CANCELLED ●
                  └────┬────┘
                       │
                   overdue
                       │
                       ▼
                  ┌─────────┐
                  │ OVERDUE │─── complete ──► DONE ●
                  └─────────┘

                  ┌─────────┐
                  │CANCELLED│ ●
                  └─────────┘

BLOCKED PATH:
  in_progress ──block──► blocked
  blocked ──unblock──► in_progress
  blocked ──cancel──► cancelled
```

---

## 11. Technician Availability State Diagram

```
                  TECHNICIAN AVAILABILITY
                ───────────────────────────

                    ┌───────────┐
           ┌───────►│ AVAILABLE │◄──────────┐
           │        └─────┬─────┘           │
           │              │                 │
        return        assigned            free
           │              │                 │
           │              ▼                 │
           │        ┌──────────┐            │
           │        │   BUSY   │────────────┘
           │        └──────────┘
           │              │
           │          break
           │              │
           │              ▼
           │        ┌──────────┐
           │        │ ON_BREAK │
           │        └─────┬────┘
           │              │
           └──────────────┘
           (return when break ends)

CLOCK OUT (from any state):
  [any] ──clock_out──► OFF_SHIFT
  OFF_SHIFT ──clock_in──► AVAILABLE

LEAVE (from any state):
  [any] ──start_leave──► ON_LEAVE
  ON_LEAVE ──end_leave──► AVAILABLE
```

---

## 12. Customer Relationship State Diagram

```
                 CUSTOMER RELATIONSHIP LIFECYCLE
                ──────────────────────────────────

                        ○
                        │
                        ▼
                   ┌───────────┐
          ┌───────►│   ACTIVE  │◄───────────────┐
          │        └─────┬─────┘                 │
          │              │                       │
          │      ┌───────┼──────────┐        won_back
          │      │       │          │             │
          │  dispute  risk    service_due          │
          │      │       │          │             │
          │      ▼       ▼          ▼             │
          │ ┌────────┐ ┌────────┐ ┌─────────┐     │
          │ │IN_     │ │AT_RISK │ │SERVICE_ │     │
          │ │DISPUTE │ └────┬────┘ │DUE      │     │
          │ └────────┘      │      └─────────┘     │
          │      │          │           │          │
          │ resolved     dormant    completed      │
          │      │          │           │          │
          │      ▼          ▼           ▼          │
          │ ┌────────┐ ┌─────────┐  (returns to   │
          │ │ ACTIVE │ │ DORMANT │   active)       │
          │ └────────┘ └────┬────┘                 │
          │                 │                      │
          │             churned                    │
          │                 │                      │
          │                 ▼                      │
          │           ┌─────────┐                  │
          └───────────┤ CHURNED │──────────────────┘
                      └─────────┘
                           ●
```

---

## 13. Notification State Diagram

```
                    NOTIFICATION LIFECYCLE
                  ─────────────────────────

                        ○
                        │
                        ▼
                   ┌─────────┐
                   │ PENDING │
                   └────┬────┘
                        │
                     dispatch
                        │
                   ┌────┴────┐
                   │         │
                   ▼         ▼
              ┌─────────┐ ┌─────────┐
              │  SENT   │ │  FAILED │
              └────┬────┘ └────┬────┘
                   │           │
               confirm      retry (if < max)
                   │           │
                   ▼           ▼
              ┌─────────┐ ┌─────────┐
              │DELIVERED│ │ PENDING │ (retry)
              └────┬────┘ └─────────┘
                   │
                 read
                   │
                   ▼
              ┌─────────┐
              │  READ   │
              └─────────┘
                   ●

RETRY LOGIC:
  failed + retry_count < 3 → back to pending
  failed + retry_count >= 3 → permanent failure ●
```

---

## 14. User Status State Diagram

```
                     USER STATUS LIFECYCLE
                   ──────────────────────────

                        ○
                        │
                        ▼
                   ┌─────────┐
                   │ PENDING │
                   └────┬────┘
                        │
                    provision
                        │
                        ▼
                   ┌─────────┐
                   │ ACTIVE  │
                   └────┬────┘
                        │
              ┌─────────┼────────┐
              │         │        │
           suspend  deactivate  role_change
              │         │        │
              ▼         ▼        │
         ┌─────────┐ ┌─────────┐ │
         │SUSPENDED│ │DISABLED │ │
         └────┬────┘ └─────────┘ │
              │         ●        │
           reactivate           │
              │                 │
              ▼                 ▼
         ┌─────────┐     (stays in active)
         │ ACTIVE  │
         └─────────┘
```

---

## 15. Cross-Entity State Dependencies

```
                    DEPENDENCY MAP
                ─────────────────────

Ticket ──(urgency=urgent/critical)──► Dispatch (initiated)
Ticket ──(service-needed)────────────► Appointment (scheduled)
Appointment ──(assigned)────────────► Dispatch (standard)
Appointment ──(completed)───────────► Work Order (created)
Appointment ──(completed)───────────► Followup (created)
Work Order ──(completed)────────────► Feedback (survey sent)
Dispute ──(resolved)────────────────► Account Health (updated)
Account Health ──(critical)─────────► Retention Campaign (started)
Followup ──(slippage)───────────────► CRM Alert (triggered)
Notification ──(failed)─────────────► Escalation (L1)
Ticket ──(SLA breach)───────────────► Escalation (L1)
Any entity ──(escalated)────────────► Escalation Chain
All entities ──(any event)──────────► Analytics (event consumed)

STATE LOCKING RULES:
  1. A parent entity cannot be closed while child entities are active
  2. Ticket cannot close with active dispatches
  3. Appointment cannot close with active work orders
  4. Account cannot be deleted with active tickets/appointments
  5. Technician cannot be deactivated with assigned jobs
```

---

> **End of STATE_TRANSITIONS.md**
> Next document: SEQUENCE_DIAGRAMS.md
