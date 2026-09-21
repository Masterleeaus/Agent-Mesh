# RESQAI V2 — Event Sequence Diagrams

> Phase B.3 — Enterprise Event Architecture  
> Chief Enterprise Event Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Diagram Notation](#1-diagram-notation)
2. [Ticket Intake & Resolution Flow](#2-ticket-intake--resolution-flow)
3. [Appointment Booking & Completion Flow](#3-appointment-booking--completion-flow)
4. [Urgent Dispatch Flow](#4-urgent-dispatch-flow)
5. [Dispute Resolution Flow](#5-dispute-resolution-flow)
6. [Account Health Monitoring Flow](#6-account-health-monitoring-flow)
7. [Customer Feedback & CX Flow](#7-customer-feedback--cx-flow)
8. [Knowledge Gap Detection Flow](#8-knowledge-gap-detection-flow)
9. [Retention Campaign Flow](#9-retention-campaign-flow)
10. [Workflow Health Monitoring Flow](#10-workflow-health-monitoring-flow)
11. [Cross-Application Event Flow](#11-cross-application-event-flow)

---

## 1. Diagram Notation

```
┌─────────┐      Application/Source
│  Event   │     Domain event
───→        │     Event flow direction
═══→        │     Request/response (synchronous)
┌─────────┐     ┌────────┐     ┌──────────┐
│  Action  │     │  AI     │     │  Workflow  │
└─────────┘     └────────┘     └──────────┘
```

---

## 2. Ticket Intake & Resolution Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TICKET INTAKE & RESOLUTION                                              │
└─────────────────────────────────────────────────────────────────────────┘

Customer Portal / Support App / Email
    │
    │  creates ticket
    ▼
┌────────────────────┐
│  ticket.created     │ ──────────────────────────────────┐
└────────────────────┘                                    │
    │                                                     │
    │  routed by event bus                                │
    ├──────────────────────────────────────────────────────┤
    ▼               ▼                ▼                     ▼
┌──────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐
│ticket-auto│  │sla-enforce │  │ ticket-intake │  │ trend/anomaly    │
│-response  │  │-ment       │  │ (_v2)         │  │ detection        │
└─────┬────┘  └─────┬──────┘  └──────┬───────┘  └──────────────────┘
      │             │                │
      ▼             ▼                │
  ┌────────┐  ┌──────────┐           │
  │ FAQ    │  │ SLA timer │          │
  │ match? │  │ started   │          │
  └───┬────┘  └──────────┘          │
      │                             │
      ├── (match >= 0.90) ─────►    │
      │   ticket.auto_responded     │
      ▼                             ▼
  ┌─────────────────┐      ┌──────────────────┐
  │ notification    │      │ ticket.classified │
  │  sent to cust   │      └────────┬─────────┘
  └─────────────────┘               │
                                    │  (if service needed)
      (no match / reply drafted)    │
      ┌─────────────────────────────┤
      ▼                             ▼
  ┌──────────────────┐      ┌──────────────────┐
  │ ticket.reply     │      │ appointment      │
  │ .drafted         │      │ .created (by     │
  └────────┬─────────┘      │  booking_v2)     │
           │                └──────────────────┘
           ▼
  ┌────────────────┐
  │ Human approval │
  │   gate         │
  └───┬───────┬────┘
      │       │
      ▼       ▼
  ┌────────┐  ┌──────────┐
  │approved│  │ rejected │
  └────┬───┘  └────┬─────┘
       │           │
       ▼           └──► back to drafting
  ┌────────────────┐
  │ ticket.sent    │
  │ → notification │
  └────────────────┘

EScalation Path:
  ┌──────────────┐
  │ ticket       │
  │ .escalated   │
  └──────┬───────┘
         │
         ▼
  ┌──────────────────┐
  │ ticket-escalation│
  │  _v2             │
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────┐
  │ notification to  │
  │ support manager  │
  └──────────────────┘
```

---

## 3. Appointment Booking & Completion Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ APPOINTMENT BOOKING & COMPLETION                                       │
└─────────────────────────────────────────────────────────────────────────┘

Customer Portal / Appointment Center
    │
    │  request appointment
    ▼
┌────────────────────┐
│ appointment.created │
└─────────┬──────────┘
          │
          ▼
┌─────────────────────┐
│ appointment-booking │
│  _v2                │
└─────────┬───────────┘
          │
    ┌─────┴──────┐
    ▼            ▼
┌────────┐  ┌──────────┐
│assign  │  │ confirm  │
│tech    │  │ by cust  │
└────┬───┘  └────┬─────┘
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────┐
│appt.    │  │ appt.        │
│assigned │  │ confirmed    │
└────┬────┘  └──────┬───────┘
     │              │
     ▼              ▼
  notification   ┌─────────────────────┐
  to tech        │ appointment-reminder│
                 │  _v2                │
                 └──────────┬──────────┘
                            │
                      ┌─────┴─────┐
                      ▼           ▼
                ┌─────────┐  ┌──────────┐
                │24h rem  │  │ 2h rem   │
                │(email)  │  │ (sms)    │
                └─────────┘  └──────────┘
                            │
                            │  service occurs
                            ▼
                    ┌──────────────┐
                    │ appt.        │
                    │ completed    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │ appointment-     │
                    │ completion _v2   │
                    └────────┬─────────┘
                             │
               ┌─────────────┼─────────────┐
               ▼             ▼             ▼
        ┌────────────┐ ┌───────────┐ ┌────────────┐
        │work_order  │ │customer-  │ │followup-   │
        │.created    │ │satisfact  │ │management  │
        │→ WO flow   │ │-ion mon   │ │_v2         │
        └────────────┘ └───────────┘ └────────────┘
```

---

## 4. Urgent Dispatch Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ URGENT DISPATCH                                                         │
└─────────────────────────────────────────────────────────────────────────┘

ticket.created (with urgency=high/critical)
    │
    ▼
ticket-intake_v2
    │
    │  classifies as urgent
    ▼
┌────────────────┐
│ ticket         │
│ .escalated     │
└───────┬────────┘
        │
        ▼
┌───────────────────┐
│ urgent-dispatch   │
│ _v2               │
└────────┬──────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌───────────────┐
│create  │  │ notify tech   │
│dispatch│  │ (notification │
│record  │  │  delivery_v2) │
└────┬───┘  └───────┬───────┘
     │              │
     ▼              ▼
┌────────┐   ┌──────────────┐
│dispatch│   │ dispatch.sent│
│.created│   └──────┬───────┘
└────────┘          │
                    │  technician responds
                    ▼
            ┌─────────────────┐
            │ dispatch        │
            │ .acknowledged   │
            │ OR .declined    │
            └────────┬────────┘
                     │
                 ┌───┴───┐
                 ▼       ▼
          ┌─────────┐  ┌──────────────┐
          │ en route│  │ reassign to  │
          │         │  │ next tech    │
          └────┬────┘  └──────────────┘
               │
               ▼
          ┌─────────┐
          │ on_site │
          └────┬────┘
               │
               │  job performed
               ▼
           ┌─────────┐
           │ dispatch │
           │ completed│
           └──────────┘
```

---

## 5. Dispute Resolution Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ DISPUTE RESOLUTION                                                      │
└─────────────────────────────────────────────────────────────────────────┘

Resolution Center App
    │
    │  create dispute
    ▼
┌────────────────────┐
│ dispute.created     │
└─────────┬──────────┘
          │
          ▼
┌───────────────────────┐
│ dispute-resolution_v2 │
└──────────┬────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌──────────┐  ┌──────────────┐
│AI analysis│  │dispute       │
│started   │  │.analyzing    │
└────┬─────┘  └──────────────┘
     │
     ▼
┌───────────┐
│AI analysis│
│complete   │
└─────┬─────┘
      │
      ▼
┌──────────────┐
│dispute       │
│.analyzed     │
└──────┬───────┘
       │
  ┌────┴────┐
  ▼         ▼
┌────┐  ┌────────┐
│high│  │low     │
│conf│  │confidence
└─┬──┘  └───┬────┘
  │         │
  │         ▼
  │    ┌─────────────┐
  │    │dispute      │
  │    │.escalated   │
  │    └──────┬──────┘
  │           │
  │           ▼
  │    ┌────────────────┐
  │    │ dispute-       │
  │    │ escalation_v2  │
  │    └──────┬─────────┘
  │           │
  │           ▼
  │    ┌──────────────┐
  │    │ resolution by│
  │    │ human manager│
  │    └──────────────┘
  │
  └────► Human approval gate
           │
        ┌──┴──┐
        ▼     ▼
   ┌────────┐  ┌──────────┐
   │approved│  │ rejected │
   └────┬───┘  └────┬─────┘
        │           │
        ▼           └──► reopen analysis
   ┌──────────────┐
   │dispute       │
   │.resolved     │
   └──────┬───────┘
          │
    ┌─────┴──────────┐
    ▼                ▼
┌──────────┐  ┌────────────────┐
│followup- │  │customer-satisf │
│management│  │action-monitor  │
│_v2       │  │_v2             │
└──────────┘  └────────────────┘
```

---

## 6. Account Health Monitoring Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ACCOUNT HEALTH MONITORING                                              │
└─────────────────────────────────────────────────────────────────────────┘

[Scheduled: Daily at 2:00 AM]
    │
    ▼
┌──────────────────────┐
│ account-health-scan  │
│  _v2                 │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────┐
│ accounts scanned,        │
│ health scores calculated │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ account.health.scan      │
│ .completed               │
└──────────┬───────────────┘
           │
           │  for accounts with changed health
           ▼
┌──────────────────────────┐
│ account.health.changed   │
│ (per affected account)   │
└──────────┬───────────────┘
           │
       ┌───┴───────┐
       ▼           ▼
┌────────────┐  ┌────────────────┐
│retention-  │  │followup-       │
│campaign_v2 │  │management_v2   │
│(if critical)│  │(always)        │
└────────────┘  └────────┬───────┘
                         │
                         ▼
                 ┌───────────────────┐
                 │ followup created  │
                 │ → followup.created│
                 └───────────────────┘
```

---

## 7. Customer Feedback & CX Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CUSTOMER FEEDBACK & CX FLOW                                            │
└─────────────────────────────────────────────────────────────────────────┘

Service Event completes (appointment, ticket close, dispute resolve)
    │
    ▼
┌─────────────────────────────┐
│ customer-satisfaction-monitor│
│  _v2                         │
└────────────┬────────────────┘
             │
             ▼
┌──────────────────────┐
│ feedback.survey.sent  │
│ (to notification)     │
└──────────────────────┘
             │
             │  customer responds
             ▼
┌──────────────────────┐
│ feedback.submitted    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ feedback-analysis_v2 │
└──────────┬───────────┘
           │
       ┌───┴───────────────┐
       ▼                   ▼
┌────────────────┐  ┌──────────────────┐
│ negative       │  │ positive/neutral  │
│ sentiment      │  │                   │
└───────┬────────┘  └──────────────────┘
        │
        ▼
┌──────────────────┐
│ cx.risk          │
│ .identified      │
└───────┬──────────┘
        │
        ▼
┌──────────────────────┐
│ retention-campaign   │
│  _v2 (if needed)     │
└──────────────────────┘
        │
        ▼
┌──────────────────┐
│ cx.insight       │
│ .generated       │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ report-generation│
│  _v2             │
└──────────────────┘
```

---

## 8. Knowledge Gap Detection Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ KNOWLEDGE GAP DETECTION                                                 │
└─────────────────────────────────────────────────────────────────────────┘

feedback-analysis_v2 detects pattern of unanswered questions
    │
    ▼
┌──────────────────────┐
│ knowledge.gap        │
│ .detected            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────┐
│ knowledge-gap-detection  │
│  _v2                     │
└──────────┬───────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌──────────┐  ┌────────────────┐
│ gap      │  │ knowledge      │
│ analyzed │  │ .article       │
│         │  │ .requested     │
└──────────┘  └──────┬─────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ knowledge-article- │
            │ lifecycle _v2      │
            └────────┬───────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ knowledge.article  │
            │ .published         │
            └────────────────────┘
```

---

## 9. Retention Campaign Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ RETENTION CAMPAIGN FLOW                                                 │
└─────────────────────────────────────────────────────────────────────────┘

Triggers from:
  - account.health.changed (critical)
  - followup.slippage.detected (chronic)
  - cx.risk.identified (negative sentiment)
    │
    ▼
┌──────────────────────┐
│ retention-campaign   │
│  _v2                 │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌──────────┐  ┌──────────────┐
│ campaign │  │ campaign     │
│ .created │  │ .started     │
└──────────┘  └──────┬───────┘
                     │
                     ▼
            ┌──────────────────┐
            │ outreach via     │
            │ notification     │
            │ delivery _v2     │
            └────────┬─────────┘
                     │
                     │  response / no response
                     ▼
            ┌──────────────────┐
            │ campaign         │
            │ .completed       │
            └────────┬─────────┘
                     │
                     ▼
            ┌───────────────────┐
            │ if no response:   │
            │ followup-         │
            │ management_v2     │
            └───────────────────┘
```

---

## 10. Workflow Health Monitoring Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ WORKFLOW HEALTH MONITORING                                             │
└─────────────────────────────────────────────────────────────────────────┘

[Every 5 minute check]    [Real-time event consumption]
    │                              │
    ▼                              │
┌────────────────────┐             ▼
│ workflow-health    │     ┌──────────────────┐
│ monitor _v2       │◄────│ system.workflow  │
│ (scheduled scan)  │     │ .failed          │
└──────────┬────────┘     │ system.workflow  │
           │              │ .dead_letter     │
           │              │ system.health    │
           │              │ .alert           │
           │              │ agent.error      │
           │              │ notification     │
           │              │ .failed          │
           │              │ integration      │
           │              │ .error           │
           │              │ offline.sync     │
           │              │ .failed          │
           │              └──────────────────┘
           │
           ▼
    ┌──────────────┐
    │ evaluate     │
    │ health       │
    └──────┬───────┘
           │
       ┌───┴───────┐
       ▼           ▼
    ┌────────┐  ┌──────────────┐
    │healthy │  │ issue found  │
    │(no-op) │  │              │
    └────────┘  └──────┬───────┘
                       │
                       ▼
            ┌──────────────────┐
            │ system.health    │
            │ .alert           │
            └────────┬─────────┘
                     │
                     ▼
            ┌──────────────────┐
            │ notification     │
            │ delivery to      │
            │ admin/automation │
            └──────────────────┘
                       │
                       ▼
            ┌────────────────────────┐
            │ auto-recovery attempt  │
            │ OR human escalation    │
            │ → system.health        │
            │   .restored            │
            └────────────────────────┘
```

---

## 11. Cross-Application Event Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CROSS-APPLICATION EVENT FLOW — FULL PLATFORM                            │
└─────────────────────────────────────────────────────────────────────────┘

Customer Portal       Support Center       Appointment Ctr    Ops Center
    │                      │                     │                 │
    │ create ticket        │                     │                 │
    ├─── ticket.created ───┤                     │                 │
    │                      │ classify            │                 │
    │                      ├─── ticket.classified│                 │
    │                      │                     │                 │
    │                      │ (if service needed) │                 │
    │                      ├──── appointment.created ──► appointment│
    │                      │                     │    booking_v2  │
    │                      │                     │                 │
    │                      │                     ├─── appt.assigned──┤
    │                      │                     ├─── appt.confirmed│
    │                      │                     │                 │
    │                      │                     │ (service done)  │
    │                      │                     ├─── appt.completed│
    │                      │                     │                 │
    │                      │                     │          appointment-completion
    │                      │                     │                 │
    │                      │                     ├──── work_order.created ► WO
    │                      │                     ├──── feedback.survey.sent
    │                      │                     │                 │
    │  feedback ───────────┼─────────────────────┼──── feedback.submitted.customer
    └──────────────────────┴─────────────────────┴─────────────────┘

                  CRM Center           Resolution Ctr      Admin Center
                      │                     │                  │
                      │                     │                  │
    account.health.changed                  │                  │
          │                                 │                  │
          ├─── followup.created              │                  │
          │                                 │                  │
          │                     dispute.created                │
          │                          │                        │
          │                     dispute.resolved               │
          │                          │                        │
          ├─── followup.completed     │                        │
          │                          │                        │
          │ feedback.analyzed ─────────┤                        │
          │                          │                        │
          │                          ├─── cx.risk.identified  │
          │                          │                        │
          ├─── retention.alert ──────┘                        │
          │                                                  │
          │                         workflow.failed ─────────┤
          │                                                  │
          │                         system.health.alert ─────┤
          ▼                         ▼                        ▼
```

---

> **End of EVENT_SEQUENCE_DIAGRAMS.md**
