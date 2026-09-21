# RESQAI V2 — Application Interaction Diagram

> Phase 1.1 — Design Only  
> Lead: Software Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Primary Interaction Flow](#2-primary-interaction-flow)
3. [Request-Response Diagrams](#3-request-response-diagrams)
4. [Event Flow Diagrams](#4-event-flow-diagrams)
5. [User Journey Diagrams](#5-user-journey-diagrams)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Communication Matrix](#7-communication-matrix)

---

## 1. System Overview

```
                          ┌─────────────────────────────────────┐
                          │          ADMIN CENTER               │
                          │   Users · Roles · Config · Audit    │
                          └────────┬───────────┬───────────────┘
                                   │           │
                  ┌────────────────┘           └──────────────┐
                  ▼                                              ▼
     ┌──────────────────────┐                     ┌──────────────────────┐
     │   CUSTOMER PORTAL    │                     │   NOTIFICATION CTR   │
     │  Self-Service View   │                     │   All Outbound Comms │
     └──────────┬───────────┘                     └──────────┬───────────┘
                │                                            │
                ▼                                            ▼
     ┌──────────────────────┐                     ┌──────────────────────┐
     │    SUPPORT CENTER    │                     │  TECHNICIAN PORTAL   │
     │  Ticket Management   │                     │  Field Worker View   │
     └──────────┬───────────┘                     └──────────┬───────────┘
                │                                            │
                ├────────────────────────────────────────────┘
                ▼
     ┌──────────────────────┐
     │  OPERATIONS CENTER   │
     │   Dispatch & Tasks   │
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │ APPOINTMENT CENTER   │
     │   Scheduling Engine   │
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │  RESOLUTION CENTER   │
     │  Dispute Management  │
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │     CRM CENTER       │
     │  Account Health Mgmt │
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │   ANALYTICS CENTER   │
     │  BI & Reporting Hub  │
     └──────────────────────┘


     LEGEND:
     ──► Primary event flow
     - - ► Data query / read-only access
     ~~► Admin / configuration flow
```

---

## 2. Primary Interaction Flow

### 2.1 Top-Level Interaction Hierarchy

```
                           ┌──────────────────┐
                           │  Admin Center     │  (System-wide control)
                           │  admin-center_v2  │
                           └────────┬─────────┘
                                    │ Manages users, roles, config for all apps
                                    │
         ┌──────────────────────────┼──────────────────────────────┐
         │                          │                              │
         ▼                          ▼                              ▼
   ┌───────────┐            ┌──────────────┐             ┌──────────────┐
   │ Customer  │  ────►     │   Support     │  ────►      │ Notification │
   │ Portal    │  tickets   │   Center      │  replies    │   Center     │
   │ portal_v2 │  ◄────     │   support_v2  │  ◄────      │   notif_v2   │
   └───────────┘  status    └──────┬───────┘  delivery   └──────────────┘
                                   │
                                   │ escalations
                                   ▼
                             ┌──────────────┐
                             │ Operations   │
                             │ Center       │
                             │ ops_v2       │
                             └──────┬───────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
                   ▼                ▼                ▼
             ┌──────────┐   ┌──────────────┐   ┌───────────┐
             │Technician │   │ Appointment │   │  CRM      │
             │Portal     │   │ Center      │   │  Center   │
             │tech_v2    │   │ appt_v2      │   │  crm_v2   │
             └──────────┘   └──────┬───────┘   └─────┬─────┘
                                   │                 │
                                   │ disputes        │ health events
                                   ▼                 ▼
                             ┌──────────────┐   ┌───────────┐
                             │ Resolution   │   │ Analytics │
                             │ Center       │   │ Center    │
                             │ res_v2       │   │ anal_v2   │
                             └──────────────┘   └───────────┘
```

### 2.2 Data Dependency Flow (Read-Only)

```
analytics_v2 ──reads──► all tables (read-only)

admin_v2 ──reads/writes──► users_v2, user_roles_v2, system_settings_v2, feature_flags_v2, connectors_v2

technician_v2 ──reads──► appointments (own), tasks (own), customers (job context), technicians (own)

customer_v2 ──reads──► customers (own), tickets (own), appointments (own), disputes (own), accounts (own), followups (own)

notification_v2 ──reads──► customers, technicians (for contact details)

support_v2 ──reads──► tickets, customers, technicians, appointments, disputes, operations_log

crm_v2 ──reads──► accounts, customers, followups, appointments, tickets, disputes, operations_log

ops_v2 ──reads──► tickets, tasks, appointments, technicians, operations_log, customers, followups

appointment_v2 ──reads──► appointments, technicians, customers, tickets, operations_log

resolution_v2 ──reads──► disputes, appointments, customers, tickets, operations_log
```

---

## 3. Request-Response Diagrams

### 3.1 Customer Creates Ticket (Full Chain)

```
CUSTOMER PORTAL          SUPPORT CENTER         NOTIFICATION CTR       OPERATIONS CTR
═══════════════          ═══════════════        ═════════════════      ═══════════════
User fills form
       │
Create ticket record
(tickets table)
       │
Emit:
ticket.created.customer ──► (event bus)
       │
Show confirmation ──────► Support queue
                          receives ticket
                                  │
                         Agent reviews
                                  │
                         AI classifies
                                  │
                         Emit: ticket.classified
                                  │
                         Agent drafts reply
                                  │
                         Manager approves
                                  │
                         Emit: ticket.reply.approved ──► Send reply to
                                                         customer via
                                                         email/SMS
                                                                  │
                                                         Delivery receipt
                                  ◄────────────────────────────────
                         Ticket status → closed
                                  │
                         Emit: ticket.status.changed ──────────────► Update
                                                                     ops
                                                                     dashboard
                          (also consumed by crm, analytics)
```

### 3.2 Technician Dispatch (Full Chain)

```
SUPPORT CTR          OPS CENTER           NOTIFICATION CTR      TECHNICIAN PORTAL
═════════════        ════════════         ═════════════════     ══════════════════
Urgent ticket
       │
Emit:
ticket.escalated ──► Receives escalation
                          │
                     Coordinator reviews
                          │
                     Finds available tech
                          │
                     Emit:
                     dispatch.initiated ──► Send SMS/push ──► Receives alert
                                     │       to technician        │
                                     │                     Views job details
                                     │                          │
                                     │                     Starts job (en route)
                                     │                          │
                                     │                     Emit:
                                     ◄──────────────────── appointment.status
                                                               .changed
                                                               (in_progress)
                          │
                     Dashboard updates
                          │
                                          ◄────────────────── Job complete
                                                               │
                                                               Emit:
                                                               appointment.
                                                               completed
                          │
                     Emit:
                     dispatch.completed
                          │
                                          Sends summary ──► Receives summary
```

### 3.3 Appointment Booking (Full Chain)

```
CUSTOMER PORTAL     APPOINTMENT CTR      TECHNICIAN PORTAL    NOTIFICATION CTR
═══════════════     ═══════════════      ══════════════════   ═════════════════
User requests
appointment
       │
Emit:
appointment.requested ──► Receives request
                          │
                     AI suggests tech
                          │
                     Manager approves
                          │
                     Create appointment
                          │
                     Emit:
                     appointment.created ─────────────────────► Send confirmation
                                                                    │
                     Emit:                                         │
                     appointment.assigned ─────► Receives ────► Send assignment
                                                  new job        alert
                                                       │
                                                  Accepts job
                                                       │
                                                  Emit: tech.
                                                  status.changed
```

### 3.4 Account Health Escalation (Full Chain)

```
CRM CENTER          OPS CENTER         NOTIFICATION CTR      CUSTOMER PORTAL     ANALYTICS CTR
═══════════         ════════════       ═════════════════     ══════════════      ═════════════
Scheduled health
scan runs
       │
AI analyzes accounts
       │
Emit:
account.health.scan
  .completed
       │
Detects critical ──► Receives alert
downgrade                │
       │            Coordinator reviews
       ▼                  │
Emit:                Creates retention
account.health        task
  .changed ─────────────► Sends alert ──► Shows health ──► Refreshes metrics
  (critical)             to manager      decline
                                │
                          Manager action
                                │
                          Task assigned
```

---

## 4. Event Flow Diagrams

### 4.1 Ticket Lifecycle Events

```
                    ticket.created
                         │
                         ▼
              ┌──────────────────┐
              │ AI Classification │
              └────────┬─────────┘
                       │
              ticket.classified
                       │
              ┌────────┴────────┐
              │                 │
         (urgent)          (normal)
              │                 │
              ▼                 ▼
     ┌──────────────┐   ┌──────────────┐
     │ Dispatch Flow │   │ Reply Draft  │
     └──────────────┘   └──────┬───────┘
              │                 │
              │        ticket.reply.drafted
              │                 │
              │                 ▼
              │        ┌──────────────┐
              │        │  Approval    │
              │        └──────┬───────┘
              │               │
              │      ticket.reply.approved
              │               │
              │               ▼
              │        ┌──────────────┐
              │        │ Send Reply   │
              │        └──────┬───────┘
              │               │
              └───────┬───────┘
                      │
              ticket.status.changed
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
       CRM CTR   NOTIF CTR   ANALYTICS
     (health)   (customer)   (metrics)
```

### 4.2 Dispute Lifecycle Events

```
                    dispute.created
                         │
                         ▼
              ┌──────────────────┐
              │  AI Analysis     │
              └────────┬─────────┘
                       │
              dispute.analyzed
                       │
              ┌────────┴────────┐
              │                 │
        (conf >= 0.8)     (conf < 0.8)
              │                 │
              ▼                 ▼
     ┌──────────────┐   ┌──────────────┐
     │ Auto-approve │   │ Human Review │
     └──────┬───────┘   └──────┬───────┘
            │                  │
            └────────┬─────────┘
                     │
            dispute.resolved
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
       CRM CTR   NOTIF CTR   ANALYTICS
     (health+)  (customer)   (metrics)
```

### 4.3 Cross-App Event Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EVENT DEPENDENCIES                             │
│                                                                             │
│  Producer App          Event                  Consumer App(s)              │
│  ════════════          ═════                  ═════════════════             │
│                                                                             │
│  customer-portal_v2 ── ticket.created ───────► support-center_v2            │
│                                                 notification-center_v2      │
│                                                 analytics-center_v2         │
│                                                                             │
│  support-center_v2 ── ticket.status.changed ──► customer-portal_v2          │
│                                                 crm-center_v2               │
│                                                 notification-center_v2      │
│                                                 analytics-center_v2         │
│                                                                             │
│  support-center_v2 ── ticket.escalated ───────► operations-center_v2        │
│                                                 notification-center_v2      │
│                                                                             │
│  appointment_ctr_v2 ── appointment.created ───► operations-center_v2        │
│                                                 notification-center_v2      │
│                                                 crm-center_v2               │
│                                                 analytics-center_v2         │
│                                                                             │
│  appointment_ctr_v2 ── appointment.assigned ──► technician-portal_v2        │
│                                                 notification-center_v2      │
│                                                                             │
│  technician_portal ── appointment.completed ──► crm-center_v2               │
│                                                 analytics-center_v2         │
│                                                                             │
│  resolution_ctr_v2 ── dispute.created ────────► customer-portal_v2          │
│                                                 notification-center_v2      │
│                                                 crm-center_v2               │
│                                                 analytics-center_v2         │
│                                                                             │
│  resolution_ctr_v2 ── dispute.resolved ────────► crm-center_v2              │
│                                                 customer-portal_v2          │
│                                                 notification-center_v2      │
│                                                                             │
│  crm-center_v2 ──── account.health.changed ──► operations-center_v2        │
│                                                 customer-portal_v2          │
│                                                 notification-center_v2      │
│                                                 analytics-center_v2         │
│                                                                             │
│  crm-center_v2 ──── followup.slippage.detected► operations-center_v2        │
│                                                 notification-center_v2      │
│                                                                             │
│  operations_ctr_v2 ── task.created ───────────► technician-portal_v2        │
│                                                 notification-center_v2      │
│                                                                             │
│  operations_ctr_v2 ── dispatch.initiated ─────► technician-portal_v2        │
│                                                 notification-center_v2      │
│                                                                             │
│  technician_portal ── technician.status.changed► appointment-center_v2      │
│                       (via availability toggle)  operations-center_v2       │
│                                                                             │
│  admin-center_v2 ──── user.created ───────────► notification-center_v2      │
│                                                                             │
│  ALL apps ────────── notification.send ───────► notification-center_v2     │
│                                                                             │
│  notification_ctr ── notification.delivered ──► analytics-center_v2         │
│                       notification.failed       admin-center_v2             │
│                                                                             │
│  ANY ─────────────── * ───────────────────────► analytics-center_v2         │
│                   (all state-changing events)   (read-only consumer)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. User Journey Diagrams

### 5.1 Customer Journey: Report Issue → Resolution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CUSTOMER DISCOVERS ISSUE                                                 │
│    ├── Logs into customer-portal_v2                                         │
│    └── Clicks "New Ticket"                                                  │
│                                                                             │
│ 2. FILLS TICKET FORM                                                        │
│    ├── Selects request type (plumbing, HVAC, electrical, etc.)              │
│    ├── Writes description                                                   │
│    └── Submits                                                              │
│                                                                             │
│ 3. CONFIRMATION                                                             │
│    ├── Sees ticket created confirmation in portal                           │
│    └── Receives email confirmation from notification-center_v2             │
│                                                                             │
│ 4. SUPPORT PROCESSING (background)                                          │
│    ├── support-center_v2 agent receives ticket                              │
│    ├── AI classifies ticket (request-classifier_v2)                        │
│    ├── Agent drafts reply                                                   │
│    ├── Manager approves reply                                               │
│    └── Reply sent to customer via notification-center_v2                   │
│                                                                             │
│ 5. CUSTOMER TRACKS                                                          │
│    ├── Logs back into portal                                                │
│    ├── Sees updated ticket status in real time                              │
│    └── Receives notification when status changes                            │
│                                                                             │
│ 6. OUTCOME                                                                  │
│    ├── If issue needs site visit → appointment scheduled                    │
│    ├── If issue resolved remotely → ticket closed                           │
│    └── If billing dispute → escalated to resolution-center_v2              │
│                                                                             │
│ 7. SATISFACTION                                                             │
│    ├── Customer satisfaction survey sent via notification-center_v2        │
│    └── crm-center_v2 updates account health based on outcome               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Technician Journey: Dispatch → Job Complete

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. TECHNICIAN STARTS SHIFT                                                  │
│    ├── Logs into technician-portal_v2                                       │
│    ├── Views "My Day" dashboard                                             │
│    ├── Sees today's scheduled appointments                                  │
│    └── Sets availability to "available"                                     │
│                                                                             │
│ 2. URGENT DISPATCH ARRIVES                                                  │
│    ├── Push notification received from notification-center_v2              │
│    ├── Opens dispatch details                                               │
│    ├── Views customer info, address, issue description                     │
│    └── Accepts dispatch                                                     │
│                                                                             │
│ 3. EN ROUTE                                                                 │
│    ├── Taps "En Route" in app                                               │
│    ├── appointment.status.changed event emitted                             │
│    ├── Map navigation opens to customer address                             │
│    └── Operations center sees status update                                 │
│                                                                             │
│ 4. ON SITE                                                                  │
│    ├── Taps "On Site"                                                       │
│    ├── appointment.status.changed: in_progress                              │
│    └── Views job details, customer contact info                             │
│                                                                             │
│ 5. WORK IN PROGRESS                                                         │
│    ├── Performs service work                                                │
│    ├── Takes photos of work (evidence)                                      │
│    └── Adds job notes                                                       │
│                                                                             │
│ 6. JOB COMPLETE                                                             │
│    ├── Taps "Complete"                                                      │
│    ├── Fills completion form (notes, followup needed, parts used)          │
│    ├── Uploads photos                                                       │
│    └── Submits                                                              │
│                                                                             │
│ 7. NEXT JOB                                                                 │
│    ├── appointment.completed event triggers                                 │
│    ├── CRM gets positive health update                                      │
│    ├── If followup needed → followup created in crm-center_v2              │
│    └── Technician proceeds to next job                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Operations Coordinator Journey: Morning → EOD

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. MORNING CHECK                                                            │
│    ├── Logs into operations-center_v2                                       │
│    ├── Views Operations Dashboard                                           │
│    ├── Checks KPIs: open tickets, pending dispatches, today's appointments  │
│    ├── Reviews daily standup report (auto-generated)                       │
│    └── Identifies blockers                                                  │
│                                                                             │
│ 2. PRIORITIZE                                                                │
│    ├── Checks urgent dispatch queue (from escalated tickets)                │
│    ├── Checks technician workload from technician-portal_v2 data            │
│    └── Reviews slipping followups from crm-center_v2                        │
│                                                                             │
│ 3. DISPATCH COORDINATION                                                    │
│    ├── Views escalated ticket in dispatch panel                             │
│    ├── Selects available technician based on skill/location                │
│    ├── Initiates dispatch                                                   │
│    └── dispatch.initiated event → technician notified                       │
│                                                                             │
│ 4. TASK MANAGEMENT                                                          │
│    ├── Creates operational tasks from standup blockers                      │
│    ├── Assigns tasks to team members                                        │
│    └── task.created event → assignee notified                               │
│                                                                             │
│ 5. MONITORING                                                                │
│    ├── Watches real-time status board                                       │
│    ├── Sees technician status updates                                       │
│    ├── Handles any new escalations                                          │
│    └── Reviews operations log                                               │
│                                                                             │
│ 6. END OF DAY                                                                │
│    ├── Reviews unresolved dispatches                                        │
│    ├── Updates task statuses                                                │
│    ├── Notes blockers for tomorrow's standup                                │
│    └── Logs out                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Flow Diagrams

### 6.1 Ticket Data Flow

```
                    ┌──────────────────────────────────────────┐
                    │            TICKETS TABLE                  │
                    │  id, customer_id, subject, message,       │
                    │  request_type, urgency, owner, status,    │
                    │  draft_reply, channel, suggested_owner    │
                    └──────────┬──────────┬──────────┬─────────┘
                               │          │          │
              ┌────────────────┤          │          ├──────────────┐
              ▼                ▼          ▼          ▼              ▼
     ┌─────────────┐  ┌─────────────┐  ┌──────┐  ┌──────┐  ┌──────────┐
     │ customer-   │  │ support-    │  │ ops- │  │ crm- │  │analytics-│
     │ portal_v2   │  │ center_v2   │  │center│  │center│  │ center_v2│
     │ (own only)  │  │ (all)       │  │ _v2  │  │ _v2  │  │ (agg)    │
     └─────────────┘  └─────────────┘  └──────┘  └──────┘  └──────────┘
           │                │              │         │            │
           │ CREATE         │ UPDATE       │ READ    │ READ       │ READ
           │ (own)          │ (any)        │ (urgent)│ (context)  │ (metrics)
           │                │ CREATE       │         │            │
           │                │ (manual)     │         │            │
           ▼                ▼              ▼         ▼            ▼
     ┌─────────────────────────────────────────────────────────────────┐
     │                      EVENT BUS                                  │
     │  ticket.created · ticket.classified · ticket.reply.drafted     │
     │  ticket.reply.approved · ticket.status.changed · ticket.escalated│
     └─────────────────────────────────────────────────────────────────┘
```

### 6.2 Appointment Data Flow

```
                    ┌──────────────────────────────────────────┐
                    │        APPOINTMENTS TABLE                │
                    │  id, customer_id, service_type, date,    │
                    │  status, technician_id, notes            │
                    └──────────┬──────────┬──────────┬─────────┘
                               │          │          │
              ┌────────────────┤          │          ├──────────┐
              ▼                ▼          ▼          ▼          ▼
     ┌─────────────┐  ┌─────────────┐  ┌──────┐  ┌──────┐  ┌──────┐
     │ customer-   │  │ appointment │  │ tech-│  │ ops- │  │ crm- │
     │ portal_v2   │  │ -center_v2  │  │portal│  │center│  │center│
     │ (own only)  │  │ (all)       │  │ _v2  │  │ _v2  │  │ _v2  │
     └─────────────┘  └─────────────┘  └──────┘  └──────┘  └──────┘
           │                │              │         │         │
           │ READ           │ CREATE       │ UPDATE  │ READ    │ READ
           │ (own)          │ (any)        │ (own)   │ (today) │ (context)
           │                │ UPDATE       │         │         │
           │                │ (any)        │         │         │
           ▼                ▼              ▼         ▼         ▼
     ┌─────────────────────────────────────────────────────────────────┐
     │                      EVENT BUS                                  │
     │  appointment.created · appointment.assigned                    │
     │  appointment.status.changed · appointment.cancelled            │
     │  appointment.completed                                          │
     └─────────────────────────────────────────────────────────────────┘
```

### 6.3 Account Health Data Flow

```
                    ┌──────────────────────────────────────────┐
                    │         ACCOUNTS TABLE                   │
                    │  id, customer_id, name, health,          │
                    │  health_score, lifetime_jobs,            │
                    │  lifetime_revenue, open_disputes,        │
                    │  open_followups, overdue_followups       │
                    └──────────┬──────────┬──────────┬─────────┘
                               │          │          │
              ┌────────────────┤          │          ├──────────────┐
              ▼                ▼          ▼          ▼              ▼
     ┌─────────────┐  ┌─────────────┐  ┌──────┐  ┌─────────┐  ┌──────────┐
     │ customer-   │  │ crm-        │  │ ops- │  │ support-│  │analytics-│
     │ portal_v2   │  │ center_v2   │  │center│  │ center  │  │ center_v2│
     │ (own only)  │  │ (all)       │  │ _v2  │  │ _v2     │  │ (agg)    │
     └─────────────┘  └─────────────┘  └──────┘  └─────────┘  └──────────┘
           │                │              │         │             │
           │ READ           │ CRUD         │ READ    │ READ        │ READ
           │ (own)          │ (all)        │ (risk)  │ (context)   │ (distrib)
           ▼                ▼              ▼         ▼             ▼
     ┌─────────────────────────────────────────────────────────────────┐
     │                      EVENT BUS                                  │
     │  account.health.scan.completed · account.health.changed        │
     │  followup.created · followup.slippage.detected                │
     └─────────────────────────────────────────────────────────────────┘
```

---

## 7. Communication Matrix

### 7.1 Direct Communication vs Event-Driven

| Communication Type | Path | Mechanism |
|-------------------|------|-----------|
| **Event-driven** | App → Event Bus → App(s) | Domain events via Lemma event system |
| **Table read** | App → Lemma Datastore → Read Table | Direct SDK read call |
| **Table write** | App → Lemma Datastore → Write Table + Emit Event | SDK write + event emission |
| **Admin config** | admin-center_v2 → Config Tables → All Apps | Config package + event broadcast |
| **Notification** | Any App → notification-center_v2 → External Channel | Event: `notification.send` |
| **Agent invocation** | Any App → Lemma Agent Runtime → Agent | SDK `runAgent()` call |
| **Function call** | Any App → Lemma Function Runtime → Function | SDK `runFunction()` call |
| **Connector call** | Any App → Lemma Connector → External Service | SDK `runConnectorOperation()` |

### 7.2 Communication Channel Matrix

```
                    ┌─────────────────────────────────────────────────────────────────────────────┐
                    │  RECIPIENT APP                                                              │
                    ├──────────┬──────────┬────────┬────────┬────────┬────────┬────────┬──────────┤
                    │customer  │ support  │ ops    │ appt   │ tech   │ res    │ crm    │ notif   │
┌─────────PRODUCER  │portal_v2 │center_v2 │center  │center  │portal  │center  │center  │center   │
├───────────────────┼──────────┼──────────┼────────┼────────┼────────┼────────┼────────┼──────────┤
│customer-portal_v2 │    -     │  EVENT   │ EVENT  │ EVENT  │ EVENT  │ EVENT  │ EVENT  │  EVENT   │
│support-center_v2  │  EVENT   │    -     │ EVENT  │   -    │   -    │   -    │ EVENT  │  EVENT   │
│operations-center  │    -     │  EVENT   │   -    │   -    │ EVENT  │   -    │ EVENT  │  EVENT   │
│appointment-center │  EVENT   │    -     │ EVENT  │   -    │ EVENT  │ EVENT  │ EVENT  │  EVENT   │
│technician-portal  │    -     │    -     │ EVENT  │ EVENT  │   -    │   -    │ EVENT  │   -      │
│resolution-center  │  EVENT   │    -     │ EVENT  │   -    │   -    │   -    │ EVENT  │  EVENT   │
│crm-center_v2      │  EVENT   │    -     │ EVENT  │   -    │   -    │   -    │   -    │  EVENT   │
│notification-center│  PS      │   PS     │   PS   │   PS   │   PS   │   PS   │   PS   │   -      │
│admin-center_v2    │  CONFIG  │  CONFIG  │ CONFIG │ CONFIG │ CONFIG │ CONFIG │ CONFIG │  CONFIG  │
│analytics-center_v2│   -      │   -      │   -    │   -    │   -    │   -    │   -    │  EVENT   │
└───────────────────┴──────────┴──────────┴────────┴────────┴────────┴────────┴────────┴──────────┘

LEGEND:
EVENT  = Domain event via event bus
   PS  = Push notification / in-app notification / email / SMS
CONFIG = Configuration data (user roles, settings)
   -   = No direct communication
```

### 7.3 Event Subscription Table

```
Events (rows) vs Consumer Applications (columns)

                             cust support ops  appt tech  res  crm  notif admin anal
                             por  center  center  center por  cent center cent   center
Event                        _v2   _v2     _v2    _v2   _v2  _v2   _v2   _v2   _v2   _v2
───────────────────────────────────────────────────────────────────────────────────────
ticket.created                -     X      X      -     -    -     -     X     -     X
ticket.classified             -     X      X      -     -    -     -     -     -     X
ticket.reply.approved         -     X      -      -     -    -     -     X     -     X
ticket.status.changed         X     X      X      -     -    -     X     X     -     X
ticket.escalated              -     X      X      -     -    -     -     X     -     X
appointment.created           -     -      X      X     -    -     X     X     -     X
appointment.assigned          -     -      -      X     X    -     -     X     -     -
appointment.status.changed    X     -      X      X     X    X     X     X     -     X
appointment.cancelled         X     -      X      X     X    -     -     X     -     X
appointment.completed         -     -      X      -     X    -     X     -     -     X
dispute.created               X     -      -      -     -    X     X     X     -     X
dispute.analyzed              -     -      -      -     -    X     -     -     -     -
dispute.status.changed        X     -      -      -     -    X     -     X     -     X
dispute.resolved              X     -      X      -     -    X     X     X     -     X
task.created                  -     -      X      -     X    -     -     X     -     X
task.status.changed           -     -      X      -     X    -     -     -     -     X
dispatch.initiated            -     -      X      -     X    -     -     X     -     X
dispatch.completed            -     -      X      -     -    -     -     -     -     X
account.health.scan.completed -     -      -      -     -    -     X     -     -     X
account.health.changed        X     -      X      -     -    -     X     X     -     X
followup.created              -     -      -      -     -    -     X     X     -     X
followup.slippage.detected    -     -      X      -     -    -     X     X     -     X
technician.status.changed     -     -      X      X     X    -     -     -     -     -
notification.send             -     -      -      -     -    -     -     X     -     -
notification.delivered        -     -      -      -     -    -     -     -     -     X
notification.failed           -     -      -      -     -    -     -     -     X     X
user.created                  -     -      -      -     -    -     -     X     -     -
user.role.changed             -     -      -      -     -    -     -     -     -     -
user.disabled                 -     -      -      -     -    -     -     -     -     -
system.config.changed         -     -      -      -     -    -     -     -     -     -
report.generated              -     -      -      -     -    -     -     X     -     X

X = Subscribes
- = Does not subscribe
```

---

> **End of APPLICATION_INTERACTION_DIAGRAM.md**  
> Next document: APPLICATION_BUILD_ORDER.md
