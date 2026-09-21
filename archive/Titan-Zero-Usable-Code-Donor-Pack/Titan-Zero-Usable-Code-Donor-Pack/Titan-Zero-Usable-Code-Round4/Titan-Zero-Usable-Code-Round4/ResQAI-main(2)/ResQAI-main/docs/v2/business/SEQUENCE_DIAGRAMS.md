# RESQAI V2 — Sequence Diagrams

> Phase 3.4 — Enterprise Business Flow Specification
> Chief Enterprise Business Architect
> Date: 2026-06-29

---

## Table of Contents

1. [Notation](#1-notation)
2. [Ticket Intake & Classification](#2-ticket-intake--classification)
3. [Appointment Booking & Confirmation](#3-appointment-booking--confirmation)
4. [Technician Dispatch & Field Execution](#4-technician-dispatch--field-execution)
5. [Account Health Scan & Risk Detection](#5-account-health-scan--risk-detection)
6. [Dispute Resolution & Approval](#6-dispute-resolution--approval)
7. [Escalation Chain](#7-escalation-chain)
8. [Cross-App Event Propagation](#8-cross-app-event-propagation)

---

## 1. Notation

```
Actor A          Actor B          Actor C
  |                 |                 |
  |--- Message ---->|                 |     Synchronous call
  |                 |--- Message ---->|     Synchronous call
  |<--- Return -----|                 |     Response
  |                 |                 |
  |                 |<-- Event --------|     Event (async)
  |                 |                 |
  |                 |                 |
  |<-- Callback -----|                 |     Async callback
```

---

## 2. Ticket Intake & Classification

```
CUSTOMER       CUSTOMER       SUPPORT       CLASSIFIER    REPLY         SUPPORT       NOTIFICATION
PORTAL v2      PORTAL v2      CENTER v2     AI AGENT      DRAFTER AI    MANAGER       CENTER v2
  |               |               |             |              |             |              |
  |--Create------>|               |             |              |             |              |
  |  Ticket       |--POST /api--->|             |              |             |              |
  |               |  /v2/tickets  |             |              |             |              |
  |               |               |--validate-->|              |             |              |
  |               |               |  input      |              |             |              |
  |               |               |<--ok--------|              |             |              |
  |               |               |             |              |             |              |
  |               |               |--check------>|              |             |              |
  |               |               |  urgency     |              |             |              |
  |               |               |<--urgency----|              |             |              |
  |               |               |             |              |             |              |
  |               |               |--classify--->|              |             |              |
  |               |               |  (async)     |--analyze--->|             |              |
  |               |               |             |  type/       |             |              |
  |               |               |             |  tech_match  |             |              |
  |               |               |             |              |             |              |
  |               |               |<--class------             |             |              |
  |               |               |  +confidence>---          |             |              |
  |               |               |             |              |             |              |
  |               |               |--draft------>|              |             |              |
  |               |               |  (async)     |              |             |              |
  |               |               |             |              |--generate->|              |
  |               |               |             |              |  reply     |              |
  |               |               |<--draft------              |             |              |
  |               |               |  reply>------              |             |              |
  |               |               |             |              |             |              |
  |               |               |--require-----              |            |              |
  |               |               |  approval>-----------------             |              |
  |               |               |             |              |             |--Approve---->|
  |               |               |             |              |             |  Reply      |
  |               |               |<--approved---              |            |              |
  |               |               |  to_send>------------------             |              |
  |               |               |             |              |             |              |
  |               |               |--send------->              |            |              |
  |               |               |  reply       |              |             |              |
  |               |               |             |              |             |--dispatch-->|
  |               |               |             |              |             |  notification|
  |               |<--201 Created--             |              |             |              |
  |<--Confirmed---|               |             |              |             |              |
  |               |<--Reply Sent--|             |              |             |              |
  |               |  (event)      |             |              |             |              |
```

---

## 3. Appointment Booking & Confirmation

```
CUSTOMER       CUSTOMER       APPOINTMENT    TECH           SCHEDULING    NOTIFICATION
PORTAL v2      PORTAL v2      CENTER v2      SUGGESTER AI   SYSTEM        CENTER v2
  |               |               |               |              |              |
  |--Book--------->|               |               |              |              |
  |  Appointment   |--POST /api--->|               |              |              |
  |  (type, dt,    |  /v2/appts    |               |              |              |
  |   address)     |               |--validate---->|              |              |
  |               |               |  slot/addr    |              |              |
  |               |               |               |              |              |
  |               |               |--suggest----->|              |              |
  |               |               |  technician   |              |              |
  |               |               |<--tech_id-----|              |              |
  |               |               |  +confidence  |              |              |
  |               |               |               |              |              |
  |               |               |--assign------->              |              |
  |               |               |  technician   |              |              |
  |               |               |               |              |              |
  |               |               |<--INSERT-------              |              |
  |               |               |  appointment  |              |              |
  |               |               |               |              |--Schedule-->|
  |               |               |               |              |  Reminders  |
  |               |<--201 Created--               |              |  (24,2,30m) |
  |<--Confirmed---|               |               |              |              |
  |               |               |               |              |              |
  |<--Reminder----|               |               |              |--24h-------->|
  |<--Reminder----|               |               |              |--2h--------->|
  |               |               |               |              |--30min------>|
```

---

## 4. Technician Dispatch & Field Execution

```
TECHNICIAN     TECHNICIAN     APPOINTMENT    OPERATIONS     NOTIFICATION    CRM
PORTAL v2      PORTAL v2      CENTER v2      CENTER v2      CENTER v2      CENTER v2
  |               |               |               |              |              |
  |               |<--Job----------|               |              |              |
  |               |  Assigned      |               |              |              |
  |--Accept------->|               |               |              |              |
  |  Dispatch      |--ACK---------->|               |              |              |
  |               |  dispatch      |               |              |              |
  |               |               |--dispatch----->              |              |
  |               |               |  acknowledged  |              |              |
  |               |               |               |              |              |
  |--En Route----->|               |               |              |              |
  |  (GPS)        |--UPDATE------->|               |              |              |
  |               |  travelling    |               |              |              |
  |               |               |               |              |              |
  |--On Site------>|               |               |              |              |
  |  (GPS)        |--UPDATE------->|               |              |              |
  |               |  on_site       |               |              |              |
  |               |               |               |              |              |
  |--Start Work--->|               |               |              |              |
  |               |--UPDATE------->|               |              |              |
  |               |  working       |               |              |              |
  |               |               |               |              |              |
  |--Complete----->|               |               |              |              |
  |  (notes,      |--UPDATE------->|               |              |              |
  |   photos,     |  completed     |               |              |              |
  |   sig)        |               |               |              |              |
  |               |               |--appointment-->|              |              |
  |               |               |  completed     |              |              |
  |               |               |               |--create----->|              |
  |               |               |               |  work order  |              |
  |               |               |               |--update----->               |
  |               |               |               |  metrics     |              |
  |               |               |               |               |--survey---->|
  |               |               |               |               |             |--update-+
  |               |               |               |               |             |  health |
```

---

## 5. Account Health Scan & Risk Detection

```
CRM CENTER v2   ACCOUNTS DB    FOLLOWUPS DB   NOTIFICATION    ANALYTICS
                                             CENTER v2       CENTER v2
  |               |               |               |               |
  |--(cron 2AM)   |               |               |               |
  |--read-------->|               |               |               |
  |  accounts_v2  |               |               |               |
  |--read-------->|               |               |               |
  |  appointments |               |               |               |
  |--read-------->|               |               |               |
  |  disputes_v2  |               |               |               |
  |--read-------->|               |               |               |
  |  feedback_v2  |               |               |               |
  |--read-------->|               |               |               |
  |  followups_v2 |               |               |               |
  |               |               |               |               |
  |--scan-------->|               |               |               |
  |  (function)   |               |               |               |
  |<--score--------               |               |               |
  |  + category   |               |               |               |
  |               |               |               |               |
  |--assess--------               |               |               |
  |  risk level   |               |               |               |
  |               |               |               |               |
  |--create--------               |               |               |
  |  followup     |               |               |               |
  |               |--dispatch---->|               |               |
  |               |  notification |               |               |
  |               |               |--alert------->               |
  |               |               |  CRM Manager  |               |
  |               |               |               |--aggregate-->|
```

---

## 6. Dispute Resolution & Approval

```
CUSTOMER     RESOLUTION     RESOLUTION     COMPLIANCE     RESOLUTION     NOTIFICATION
PORTAL v2    CENTER v2      ADVISOR AI     MONITOR AI     MANAGER        CENTER v2
  |              |               |               |             |              |
  |--File-------->               |               |             |              |
  |  Dispute     |--validate-----               |             |              |
  |  (reason,    |  dispute>----               |             |              |
  |   evidence)  |               |               |             |              |
  |              |               |               |             |              |
  |              |--analyze------>               |             |              |
  |              |  (async)       |               |             |              |
  |              |               |--read-------->|             |              |
  |              |               |  appointments |             |              |
  |              |               |  tickets      |             |              |
  |              |               |  evidence     |             |              |
  |              |               |               |             |              |
  |              |               |--suggest----->|             |              |
  |              |               |  resolution   |             |              |
  |              |               |               |             |              |
  |              |--compliance---|               |             |              |
  |              |  check (async)|               |             |              |
  |              |               |               |--validate-->             |
  |              |               |               |  policy     |             |
  |              |               |               |             |              |
  |              |<--analysis-----               |             |              |
  |              |  +confidence   |               |             |              |
  |              |<--compliance---               |             |              |
  |              |  result        |               |             |              |
  |              |               |               |             |              |
  |              |--DECIDE------------------------>             |              |
  |              |  confidence >= 0.80: fast track              |              |
  |              |  confidence < 0.50: urgent escalate          |              |
  |              |               |               |             |              |
  |              |               |               |             |--Approve---->|
  |              |               |               |             |  /Reject    |
  |              |               |               |             |             |
  |              |--resolve------               |             |              |
  |              |  dispute      |               |             |              |
  |              |               |               |             |              |
  |              |<--closed-------               |             |              |
  |<--Status-----               |               |             |              |
  |  Updated     |               |               |             |              |
```

---

## 7. Escalation Chain

```
SUPPORT      OPERATIONS     RESOLUTION     ADMIN          NOTIFICATION   PLATFORM
CENTER v2    CENTER v2      CENTER v2      CENTER v2      CENTER v2      ORCHESTRATOR
  |              |               |              |              |              |
  |--(trigger)   |               |              |              |              |
  |              |               |              |              |              |
  |--determine---               |              |              |              |
  |  level       |               |              |              |              |
  |              |               |              |              |              |
  |== L1 ========>               |              |              |              |
  |  (10min)     |--attempt------               |              |              |
  |              |  resolution   |              |              |              |
  |              |               |              |              |              |
  |== TIMEOUT ===>               |              |              |              |
  |              |== L2 =========>               |              |              |
  |              |  (30min)      |--attempt-----               |              |
  |              |               |  resolution  |              |              |
  |              |               |              |              |              |
  |              |== TIMEOUT ====>              |              |              |
  |              |               |== L3 ========>              |              |
  |              |               |  (2h)         |--attempt----               |
  |              |               |               |  resolution |              |
  |              |               |               |              |              |
  |              |               |== TIMEOUT ====>              |              |
  |              |               |               |== L4 =======>|              |
  |              |               |               |  (24h)       |              |
  |              |               |               |               |--executive->|
  |              |               |               |               |  decision   |
  |              |               |               |               |              |
  |              |               |               |               |<--resolution|
  |              |               |<--delegate-----               |              |
  |              |<--delegate----                |              |              |
  |<--delegate---                |               |              |              |
  |              |               |               |              |              |
  |--(resolved)  |               |               |              |              |
```

---

## 8. Cross-App Event Propagation

```
SUPPORT      APPOINTMENT    TECHNICIAN     CRM           NOTIFICATION   ANALYTICS
CENTER v2    CENTER v2      PORTAL v2      CENTER v2     CENTER v2      CENTER v2
  |              |               |              |              |              |
  |--{ticket     |               |              |              |              |
  |  .created}---|               |              |              |              |
  |              |               |              |              |              |
  |--{ticket     |               |              |              |              |
  |  .classified}|               |              |              |              |
  |  (service    |               |              |              |              |
  |   -needed)   |               |              |              |              |
  |              |--booking------               |              |              |
  |              |  initiated    |               |              |              |
  |              |               |               |              |              |
  |--{ticket     |               |               |              |              |
  |  .closed}----               |               |              |              |
  |              |               |               |--survey----->              |
  |              |               |               |  trigger     |              |
  |              |               |               |               |              |
  |              |--{appointment-               |               |              |
  |              |   .completed} |               |              |              |
  |              |               |--workorder--->               |              |
  |              |               |  created      |              |              |
  |              |               |               |--scan------->              |
  |              |               |               |  account     |              |
  |              |               |               |               |              |
  |              |               |               |--{account     |              |
  |              |               |               |  .health      |              |
  |              |               |               |  .changed}---|              |
  |              |               |               |  (critical)  |              |
  |              |               |               |               |              |
  |              |               |               |--campaign---->|              |
  |              |               |               |  start       |              |
  |              |               |               |               |              |
  |              |               |               |               |--aggregate->|
  |              |               |               |               |  metrics    |
```

---

## Event Propagation Summary

| Source App | Event | Consumer Apps | Action Triggered |
|------------|-------|---------------|------------------|
| support-center_v2 | ticket.created | appointment-center_v2, notification-center_v2, analytics-center_v2 | Booking, notification, metric |
| support-center_v2 | ticket.classified | operations-center_v2, notification-center_v2 | Urgent dispatch, SLA tracking |
| support-center_v2 | ticket.closed | crm-center_v2, notification-center_v2, analytics-center_v2 | Survey, health update, metric |
| appointment-center_v2 | appointment.completed | technician-portal_v2, operations-center_v2, crm-center_v2, notification-center_v2 | Work order, metric, survey, health |
| technician-portal_v2 | work_order.completed | operations-center_v2, crm-center_v2, notification-center_v2 | KPI, survey, inventory |
| resolution-center_v2 | dispute.resolved | crm-center_v2, notification-center_v2, analytics-center_v2 | Health update, notification, metric |
| crm-center_v2 | account.health.changed | operations-center_v2, notification-center_v2, analytics-center_v2 | Alert, campaign, metric |
| crm-center_v2 | followup.slippage.detected | notification-center_v2, operations-center_v2 | Alert, task creation |
| notification-center_v2 | notification.delivered | ALL source apps | Delivery confirmation callback |
| admin-center_v2 | system.config.changed | ALL apps | Config reload |

---

> **End of SEQUENCE_DIAGRAMS.md**
