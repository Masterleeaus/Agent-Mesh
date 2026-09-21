# ResQAI System Integration Report

> **Audit Date:** 2026-06-28  
> **Phase:** Integration & Business Logic  
> **Scope:** Full architecture audit across all apps, workflows, tables, agents, functions, triggers, schedules, forms, connectors

---

## Table of Contents

1. [Resource Inventory](#1-resource-inventory)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Business Process Diagram](#3-business-process-diagram)
4. [Data Flow Diagram](#4-data-flow-diagram)
5. [App Dependency Graph](#5-app-dependency-graph)
6. [Workflow Dependency Graph](#6-workflow-dependency-graph)
7. [Agent Dependency Graph](#7-agent-dependency-graph)
8. [Function Dependency Graph](#8-function-dependency-graph)
9. [Table Dependency Graph](#9-table-dependency-graph)
10. [Connector Inventory & Usage](#10-connector-inventory--usage)
11. [Missing Integrations](#11-missing-integrations)
12. [Broken Integrations](#12-broken-integrations)
13. [Recommended Fixes (Priority Ordered)](#13-recommended-fixes-priority-ordered)

---

## 1. Resource Inventory

### 1.1 Applications (5)

| # | App | Directory | Stack |
|---|-----|-----------|-------|
| A1 | **support-queue** | `apps/support-queue/` | Vite + React + TS + Recoil |
| A2 | **appointment-board** | `apps/appointment-board/` | Vite + React + TS + Recoil |
| A3 | **crm-tracker** | `apps/crm-tracker/` | Vite + React + TS + Recoil |
| A4 | **resolution-center** | `apps/resolution-center/` | Vite + React + TS + Recoil |
| A5 | **ops-dashboard** | `apps/ops-dashboard/` | Vite + React + TS + Recoil |

### 1.2 Workflows (12)

| # | Name | Status | Version | Trigger | Format |
|---|------|--------|---------|---------|--------|
| W1 | **ticket-intake** | active | 2.0.0 | `ticket.created` event | JSON (old) |
| W2 | **support-escalation-manager** | active | 1.0.0 | tickets UPDATE | JSON (v2+edges) |
| W3 | **dispute-resolution** | active | 2.0.0 | disputes INSERT/UPDATE | JSON (v2+edges) |
| W4 | **urgent-dispatch** | active | 2.0.0 | tickets INSERT/UPDATE | JSON (v2+edges) |
| W5 | **account-health** | draft | 1.0.0 | Cron `0 2 * * *` (DISABLED) | JSON (old) |
| W6 | **account-health-monitoring** | active | 1.0.0 | Cron `0 2 * * *` | JSON (v2+edges) |
| W7 | **appointment-assignment** | active | 1.0.0 | appointments INSERT | JSON (v2+edges) |
| W8 | **appointment-reminders** | draft | 1.0.0 | Cron `0 7 * * *` (DISABLED) | JSON (old) |
| W9 | **customer-satisfaction-monitor** | active | 1.0.0 | Cron `0 8 * * *` | JSON (v2+edges) |
| W10 | **daily-standup** | draft | 1.0.0 | Cron `0 8 * * 1-5` (DISABLED) | JSON (old) |
| W11 | **followup-slippage** (v1) | draft | 1.0.0 | Cron `0 6 * * 1-5` (DISABLED) | JSON (old) |
| W12 | **followup-slippage-detector** (v2) | active | 1.0.0 | Cron `*/30 * * * *` | JSON (v2+edges) |

### 1.3 Tables (9)

| # | Table | Seed Rows | Key Columns |
|---|-------|-----------|-------------|
| T1 | **tickets** | 14 | id, customer_name, channel, subject, message, request_type, urgency, suggested_owner, owner, draft_reply, human_notes, approved_to_send, status |
| T2 | **appointments** | 15 | id, customer_id, service_type, date, status, technician_id, notes |
| T3 | **disputes** | 2 | id, appointment_id, customer_claim, provider_claim, evidence_summary, recommended_resolution, resolution_reason, confidence, status |
| T4 | **customers** | — | id, name, phone, email, address, status, notes |
| T5 | **technicians** | — | id, name, skill, availability, rating, status |
| T6 | **accounts** | 14 | id, customer_id, name, relationship_status, health, health_score, owner, lifetime_jobs, open_followups, overdue_followups, open_disputes |
| T7 | **followups** | — | id, account_id, customer_id, subject, type, status, priority, due_date, owner, related_appointment_id, related_ticket_id, related_dispute_id |
| T8 | **tasks** | — | id, title, owner, priority, status, due_date |
| T9 | **operations_log** | — | id, action, result, timestamp, actor |

### 1.4 Agents (6)

| # | Agent | Input | Output | Permissions |
|---|-------|-------|--------|-------------|
| AG1 | **request-classifier** | ticket_id/message | request_type, urgency, classification_status, suggested_owner | tickets(RW), technicians(R), facebook(C), instagram(C) |
| AG2 | **operations-coordinator** | scope, today | summary, recommendations, coordination_status | tickets(R), appointments(RW), customers(R), technicians(R), tasks(RW), operations_log(RW), discord(C) |
| AG3 | **resolution-advisor** | dispute_id | analysis_status, recommended_resolution, confidence, reasoning | disputes(RW), tickets(R), appointments(R), customers(R), operations_log(RW), reddit(C) |
| AG4 | **account-health-monitor** | today, lookback_days | scan, summary, recommendations, coordination_status | accounts(RW), customers(R), followups(RW), tasks(RW), appointments(R), disputes(R), operations_log(W), flag_slipping_followups(FN), account_health_scan(FN), discord(C) |
| AG5 | **support-reply-drafter** | ticket_id | draft_reply, suggested_owner, draft_status | tickets(RW), technicians(R), customers(R), gmail(C), reddit(C) |
| AG6 | **tech-suggester** | ticket_id | No agent.json found. Input/output only in files. Referenced by urgent-dispatch W4 and appointment-board A2. | No permissions.json found |

### 1.5 Functions (14)

| # | Function | Input | Output | Tables Modified | Connectors Used | Workflows Calling |
|---|----------|-------|--------|----------------|-----------------|-------------------|
| F1 | **check_ticket_urgency** | ticket_id, urgency | routing, is_urgent | None (pure) | — | W1, W4 |
| F2 | **update_ticket_record** | ticket_id, status | status | tickets, operations_log | Gmail | W1, W2, W9, A1 |
| F3 | **account_health_scan** | today, lookback_days | AccountHealthScanResult | accounts, operations_log | — | W5, AG4, A3 |
| F4 | **flag_slipping_followups** | today, days_ahead | FlagSlippingFollowupsResult | None (read-only) | — | W5, W11, W12, AG4, A3 |
| F5 | **create_followup_tasks** | recommendations | tasks_created | tasks, operations_log | — | W5, W11 |
| F6 | **create_operations_tasks** | recommendations | tasks_created | tasks, operations_log | — | W10 |
| F7 | **dispatch_notifications** | reminders | dispatched, failures | operations_log | Gmail, Twilio | W8 |
| F8 | **finalize_dispatch** | ticket_id, technician | status | tickets, operations_log | Discord | W4 |
| F9 | **finalize_slippage_review** | slippage_counts | status | operations_log | Discord | W12 |
| F10 | **resolve_dispute** | dispute_id, action | status | disputes, tickets, operations_log | Discord, Gmail | W3 |
| F11 | **assign_appointment_technician** | appointment_id, technician_name | status | appointments, operations_log | — | W7 |
| F12 | **collect_resolved_tickets** | lookback_days | Resolved tickets list | None (read-only) | Discord | W9 |
| F13 | **fetch_upcoming_appointments** | today, days_ahead | Appointments list | None (read-only) | — | W8 |
| F14 | **update_account_health_status** | health_category | status | operations_log | Discord | W6 |

### 1.6 Connectors (5+)

| # | Connector | Resource Name | Used By |
|---|-----------|---------------|---------|
| C1 | **Gmail** | `resqai-gmail` | F2 (update_ticket_record), F7 (dispatch_notifications), F10 (resolve_dispute), AG5 (support-reply-drafter) |
| C2 | **Discord** | `resqai-discord` | F8 (finalize_dispatch), F9 (finalize_slippage_review), F10 (resolve_dispute), F12 (collect_resolved_tickets), F14 (update_account_health_status), AG2 (operations-coordinator), AG4 (account-health-monitor), A3 (crm-tracker) |
| C3 | **Twilio** | `resqai-twilio` | F7 (dispatch_notifications) |
| C4 | **Reddit** | `resqai-reddit` | AG3 (resolution-advisor), AG5 (support-reply-drafter), A4 (resolution-center) |
| C5 | **Facebook** | `facebook` | AG1 (request-classifier) — instruction.md only |
| C6 | **Instagram** | `instagram` | AG1 (request-classifier) — instruction.md only |

### 1.7 Forms (Human-in-the-Loop nodes)

Found across workflows: W1 (human-approval, human-escalation), W2 (human_approval), W3 (human_approval, notify_ops_manager, notify_legal, human_escalation), W4 (manager_assignment, human_escalation), W6 (warning_path, human_approval, escalate_critical), W7 (manager_approval), W9 (manager_review), W12 (human_review)

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND APPS                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐  ┌────┐ │
│  │ Support  │  │ Appointment  │  │   CRM   │  │  Resolution    │  │Ops │ │
│  │ Queue    │  │ Board        │  │ Tracker  │  │  Center        │  │Dash│ │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └───────┬────────┘  └─┬──┘ │
│       │               │               │                │             │     │
└───────┼───────────────┼───────────────┼────────────────┼─────────────┘     │
        │               │               │                │                   │
┌───────┼───────────────┼───────────────┼────────────────┼──────────────┐    │
│       ▼               ▼               ▼                ▼              ▼    │
│                     LEMMA SDK (packages/sdk/lemma-sdk.ts)                │
│         ┌────────────────────────────────────────────────────┐          │
│         │  Packages: types, config, utils, ui, sdk           │          │
│         └────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
        │               │               │                │
┌───────┼───────────────┼───────────────┼────────────────┼─────────────┐
│       ▼               ▼               ▼                ▼             │
│                        WORKFLOW ENGINE                                │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Ticket   │  │ Support      │  │ Dispute  │  │ Urgent         │   │
│  │ Intake   │  │ Escalation   │  │ Resolution│  │ Dispatch       │   │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └───────┬────────┘   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Account  │  │ Account      │  │ Appointment│  │ Appointment   │   │
│  │ Health   │  │ Health Monitor│  │ Assignment│  │ Reminders     │   │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────────┘   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Customer │  │ Daily        │  │ Followup │  │ Followup       │   │
│  │ Satisfact│  │ Standup      │  │ Slippage │  │ Slippage Det.  │   │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
        │               │               │                │
┌───────┼───────────────┼───────────────┼────────────────┼─────────────┐
│       ▼               ▼               ▼                ▼             │
│                    AGENTS + FUNCTIONS                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Request  │  │ Operations   │  │ Resolution│  │ Account Health │   │
│  │ Classifier│  │ Coordinator  │  │ Advisor  │  │ Monitor        │   │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────────┘   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐                           │
│  │ Support  │  │ Tech         │  │ 14 Python│                           │
│  │ Drafter  │  │ Suggester    │  │ Functions│                           │
│  └──────────┘  └──────────────┘  └──────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
        │               │               │                │
┌───────┼───────────────┼───────────────┼────────────────┼─────────────┐
│       ▼               ▼               ▼                ▼             │
│                     DATA LAYER (9 Tables)                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ tickets  │  │ appointments │  │ disputes │  │  customers     │   │
│  ├──────────┤  ├──────────────┤  ├──────────┤  ├────────────────┤   │
│  │accounts  │  │  followups   │  │  tasks   │  │  technicians   │   │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                   operations_log                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
        │               │               │                │
┌───────┼───────────────┼───────────────┼────────────────┼─────────────┐
│       ▼               ▼               ▼                ▼             │
│                     CONNECTORS                                        │
│     Gmail         Discord         Twilio         Reddit              │
│     Facebook      Instagram                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Business Process Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER REQUEST LIFECYCLE                            │
│                                                                              │
│  [Ticket Created]                                                            │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌──────────────┐      │
│  │ Classify  │───▶│ Check Urgency│───▶│ Coordinate│───▶│ Human        │      │
│  │ (Agent)   │    │ (Function)   │    │ (Agent)   │    │ Approval     │      │
│  └──────────┘    └──────┬───────┘    └───────────┘    └──────┬───────┘      │
│         │                │                                    │             │
│         │                ├── urgent ───▶ [Urgent Dispatch]    │             │
│         │                │                    │               │             │
│         │                │                    ▼               │             │
│         │                │             ┌───────────┐          │             │
│         │                │             │ Suggest   │          │             │
│         │                │             │ Technician│          │             │
│         │                │             │ (Agent)   │          │             │
│         │                │             └─────┬─────┘          │             │
│         │                │                   │                │             │
│         ▼                │                   ▼                ▼             │
│    [Not Classifiable]    │          ┌──────────────┐    ┌──────────┐       │
│         │                │          │ Finalize     │    │ Resolve  │       │
│         ▼                │          │ Dispatch     │    │ (Agent)  │       │
│  ┌──────────┐            │          └──────────────┘    └────┬─────┘       │
│  │ Human    │            │                                   │             │
│  │Escalation│            │                                   ▼             │
│  └──────────┘            │                            ┌──────────┐        │
│                          │                            │ Update   │        │
│                          │                            │ Ticket   │        │
│                          │                            │ Record   │        │
│                          │                            └──────────┘        │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                        ACCOUNT HEALTH LIFECYCLE                              │
│                                                                              │
│  [Nightly 2AM]                                                               │
│       │                                                                      │
│       ▼                                                                      │
│  ┌────────────────┐    ┌──────────────┐    ┌──────────────┐                 │
│  │ Flag Slipping  │───▶│ Account      │───▶│ Account      │                 │
│  │ Followups (Fn) │    │ Health Scan  │    │ Health       │                 │
│  └────────────────┘    │ (Fn)         │    │ Monitor      │                 │
│                        └──────────────┘    │ (Agent)      │                 │
│                                            └──────┬───────┘                 │
│                                                   │                         │
│                              ┌────────────────────┼──────────────────┐      │
│                              ▼                    ▼                  ▼      │
│                         [Healthy]           [Warning]           [Critical]  │
│                              │                    │                  │      │
│                              ▼                    ▼                  ▼      │
│                         ┌──────────┐        ┌──────────┐      ┌──────────┐ │
│                         │ Update   │        │ Notify   │      │ Human    │ │
│                         │ Status   │        │ Ops      │      │ Approve  │ │
│                         └──────────┘        └──────────┘      │ Escalate │ │
│                                                                └──────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                        DISPUTE RESOLUTION LIFECYCLE                          │
│                                                                              │
│  [Dispute Created/Updated]                                                   │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Analyze      │───▶│ Route by     │───▶│ Check        │                  │
│  │ Dispute      │    │ Analysis     │    │ Confidence   │                  │
│  │ (Agent)      │    │              │    │              │                  │
│  └──────────────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                    │                          │
│         │    ┌──────────────┼────────────┐       │                          │
│         │    ▼              ▼            ▼       ├── ≥0.7 ──▶ [Apply]      │
│         │  [Safety]      [Legal]     [Insufficient]    │                   │
│         │    │              │            │            │                    │
│         │    ▼              ▼            ▼            ▼                    │
│         │  [Form]         [Form]      [Form]      [Human Approval]         │
│         │                                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow Diagram

```
                    ┌────────────────────────────────────────────┐
                    │              SUPPORT QUEUE (A1)            │
                    │  Reads: tickets                            │
                    │  Writes: tickets, operations_log           │
                    │  Calls: request-classifier (AG1),          │
                    │         support-reply-drafter (AG5),       │
                    │         update_ticket_record (F2)          │
                    └──────────────┬─────────────────────────────┘
                                   │
                    ┌──────────────▼─────────────────────────────┐
                    │            APPOINTMENT BOARD (A2)           │
                    │  Reads: appointments, customers,           │
                    │         technicians                        │
                    │  Writes: appointments, operations_log      │
                    │  Calls: tech-suggester (AG6) — RAW PROMPT  │
                    └──────────────┬─────────────────────────────┘
                                   │
                    ┌──────────────▼─────────────────────────────┐
                    │              CRM TRACKER (A3)              │
                    │  Reads: accounts, followups, customers     │
                    │  Writes: (via functions) accounts,         │
                    │          followups (indirect)              │
                    │  Calls: account_health_scan (F3),          │
                    │         flag_slipping_followups (F4),      │
                    │         Discord connector directly         │
                    └──────────────┬─────────────────────────────┘
                                   │
                    ┌──────────────▼─────────────────────────────┐
                    │           RESOLUTION CENTER (A4)           │
                    │  Reads: disputes, appointments, customers  │
                    │  Writes: disputes, customers,              │
                    │          operations_log                    │
                    │  Calls: resolution-advisor (AG3)           │
                    └──────────────┬─────────────────────────────┘
                                   │
                    ┌──────────────▼─────────────────────────────┐
                    │             OPS DASHBOARD (A5)             │
                    │  Reads: tickets, appointments, disputes,   │
                    │         tasks, operations_log              │
                    │  Writes: operations_log                    │
                    │  Calls: operations-coordinator (AG2)       │
                    └────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
                        WORKFLOW DATA FLOWS
═══════════════════════════════════════════════════════════════════════

W1 ticket-intake:
  [trigger: ticket.created]
  → AG1 (request-classifier) → reads: tickets, technicians → writes: tickets
  → F1 (check_ticket_urgency) → pure
  → AG2 (operations-coordinator) → reads: tickets, appointments, customers, technicians, tasks → writes: tasks, operations_log
  → [human approval FORM]
  → AG3 (resolution-advisor) → reads: disputes, appointments → writes: disputes, operations_log
  → F2 (update_ticket_record) → writes: tickets, operations_log → sends: Gmail

W2 support-escalation-manager:
  [trigger: tickets UPDATE]
  → AG1 (request-classifier) → reads/writes tickets
  → [DECISION]
  → AG2 (operations-coordinator) → reads/writes tasks
  → [FORM: human_approval]
  → [DECISION]
  → AG3 (resolution-advisor)
  → F2 (update_ticket_record) → writes tickets, operations_log

W3 dispute-resolution:
  [trigger: disputes INSERT/UPDATE]
  → AG3 (resolution-advisor) → reads/writes disputes
  → [DECISION: route_analysis]
     ├─ [safety_escalation] → FORM (notify_ops_manager)
     ├─ [legal_escalation] → FORM (notify_legal)
     ├─ [insufficient_evidence/blocked] → FORM (human_escalation)
     └─ [ready_for_review] → [DECISION: check_confidence]
          ├─ confidence ≥ 0.7 → F10 (resolve_dispute)
          └─ confidence < 0.7 → [FORM: human_approval] → [DECISION]
               ├─ approved → F10 (resolve_dispute)
               └─ rejected → F10 (resolve_dispute with action=reject)

W4 urgent-dispatch:
  [trigger: tickets INSERT/UPDATE]
  → AG1 (request-classifier)
  → [DECISION: classification OK?]
  → F1 (check_ticket_urgency)
  → [DECISION: actually urgent?]
  → AG6 (tech-suggester) → reads: tickets, technicians
  → [DECISION: technician found?]
     ├─ yes → AG2 (operations-coordinator)
     │       → [DECISION: dispatch source]
     │          ├─ auto → F8 (finalize_dispatch)
     │          └─ manual → F8 (finalize_dispatch)
     └─ no → [FORM: manager_assignment] → AG2 → F8
  → [FORM: human_escalation] → F8 (finalize_dispatch with status=escalation)

W5 account-health (DRAFT/DISABLED):
  [trigger: cron 2AM]
  → F4 (flag_slipping_followups)
  → F3 (account_health_scan)
  → AG4 (account-health-monitor)
  → F5 (create_followup_tasks)
  → [FORM: notify-manager]

W6 account-health-monitoring:
  [trigger: cron 2AM]
  → AG4 (account-health-monitor)
  → [DECISION: route_by_health]
     ├─ healthy → F14 (update_account_health_status)
     ├─ warning → [FORM: notify_operations]
     └─ critical → [FORM: human_approval] → [DECISION]
                    ├─ approved → [FORM: escalate_critical] → F14
                    └─ rejected → [FORM] (loop back)

W7 appointment-assignment:
  [trigger: appointments INSERT]
  → AG6 (tech-suggester)
  → [DECISION: technician suggested?]
     ├─ yes → [FORM: manager_approval] → [DECISION: approved?]
     │         ├─ yes → F11 (assign_appointment_technician)
     │         └─ no → END
     └─ no → END

W8 appointment-reminders (DRAFT/DISABLED):
  [trigger: cron 7AM + appointment.created/rescheduled events]
  → F13 (fetch_upcoming_appointments)
  → AG5 (support-reply-drafter)
  → F7 (dispatch_notifications) → sends: Gmail, Twilio

W9 customer-satisfaction-monitor:
  [trigger: cron 8AM]
  → F12 (collect_resolved_tickets)
  → [DECISION: any tickets?]
     ├─ yes → AG2 (operations-coordinator)
     │       → [DECISION: satisfied?]
     │          ├─ OK → END
     │          └─ not OK → [FORM: manager_review] → [DECISION: approve?]
     │                      ├─ yes → AG3 (resolution-advisor)
     │                      │       → F2 (update_ticket_record)
     │                      └─ no → END
     └─ no → END

W10 daily-standup (DRAFT/DISABLED):
  [trigger: cron 8AM weekdays]
  → AG2 (operations-coordinator)
  → [DECISION: crisis/attention_needed/ok]
     ├─ crisis → [FORM: notify_manager]
     ├─ attention_needed/ok → F6 (create_operations_tasks)
     └─ unavailable_data → [FORM: notify_manager]

W11 followup-slippage (DRAFT/DISABLED):
  [trigger: cron 6AM weekdays]
  → F4 (flag_slipping_followups)
  → AG4 (account-health-monitor)
  → F5 (create_followup_tasks)
  → [FORM: notify-manager]

W12 followup-slippage-detector:
  [trigger: cron */30 * * * *]
  → F4 (flag_slipping_followups)
  → [DECISION: any slipped?]
     ├─ yes → AG2 (operations-coordinator)
     │       → [FORM: human_review] → [DECISION: approved?]
     │          ├─ yes → F9 (finalize_slippage_review) → sends: Discord
     │          └─ no → END
     └─ no → END
```

---

## 5. App Dependency Graph

```
support-queue (A1)
├── Reads: tickets
├── Writes: tickets, operations_log
├── Calls Agents: request-classifier (AG1), support-reply-drafter (AG5)
├── Calls Functions: update_ticket_record (F2)
└── SHOULD trigger: ticket-intake workflow (W1) but DOES NOT

appointment-board (A2)
├── Reads: appointments, customers, technicians
├── Writes: appointments, operations_log
├── Calls Agents: tech-suggester (AG6) — via raw prompt, NOT proper schema
├── Calls Functions: NONE (bypasses assign_appointment_technician F11)
└── SHOULD use: appointment-assignment workflow (W7) but DOES NOT

crm-tracker (A3)
├── Reads: accounts, followups, customers
├── Writes: (none directly — via functions)
├── Calls Functions: account_health_scan (F3), flag_slipping_followups (F4)
├── Calls Connectors: Discord directly (resqai-discord)
└── SHOULD trigger: account-health-monitoring workflow (W6) but DOES NOT

resolution-center (A4)
├── Reads: disputes, appointments, customers
├── Writes: disputes, customers, operations_log
├── Calls Agents: resolution-advisor (AG3)
├── Calls Functions: NONE (bypasses resolve_dispute F10)
├── Calls Connectors: Reddit directly (resqai-reddit)
└── SHOULD use: dispute-resolution workflow (W3) but partially overlaps

ops-dashboard (A5)
├── Reads: tickets, appointments, disputes, tasks, operations_log
├── Writes: operations_log
├── Calls Agents: operations-coordinator (AG2)
├── Calls Functions: NONE
└── SHOULD trigger: daily-standup workflow (W10) but DOES NOT
```

---

## 6. Workflow Dependency Graph

```
                    ┌───────────────────┐
                    │  ticket.created   │
                    │     (event)       │
                    └────────┬──────────┘
                             ▼
                    ┌───────────────────┐
                    │  ticket-intake    │
                    │  (W1 - ACTIVE)    │
                    └────┬──────────┬───┘
                         │          │
               ┌─────────▼─┐    ┌───▼──────────┐
               │  tickets   │    │ appointments │
               │  UPDATE    │    │   INSERT     │
               └─────────┬──┘    └───┬──────────┘
                         │           ▼
               ┌─────────▼─┐  ┌──────────────┐
               │   W2      │  │  W7          │
               │  Support  │  │  Appointment │
               │Escalation │  │  Assignment  │
               │ (ACTIVE)  │  │  (ACTIVE)    │
               └───────────┘  └──────────────┘
                         
    ┌───────────────────┐    ┌───────────────────┐
    │  disputes         │    │  tickets          │
    │  INSERT/UPDATE    │    │  INSERT/UPDATE    │
    └────────┬──────────┘    └────────┬──────────┘
             ▼                        ▼
    ┌───────────────────┐    ┌───────────────────┐
    │  W3               │    │  W4               │
    │  Dispute          │    │  Urgent Dispatch  │
    │  Resolution       │    │  (ACTIVE)         │
    │  (ACTIVE)         │    │                   │
    └───────────────────┘    └───────────────────┘

    ┌───────────────────┐    ┌───────────────────┐
    │  Cron 2AM         │    │  Cron 8AM         │
    └────────┬──────────┘    └────────┬──────────┘
             ▼                        ▼
    ┌───────────────────┐    ┌───────────────────┐
    │  W5   ACCOUNT-    │    │  W9               │
    │  HEALTH (DRAFT)   │    │  Customer Satis.  │
    ├───────────────────┤    │  Monitor (ACTIVE)  │
    │  W6   ACCOUNT-    │    └───────────────────┘
    │  HEALTH-MONITOR   │
    │  (ACTIVE)         │    ┌───────────────────┐
    └───────────────────┘    │  Cron 8AM WEEKDAYS│
                             └────────┬──────────┘
    ┌───────────────────┐            ▼
    │  Cron 7AM         │    ┌───────────────────┐
    └────────┬──────────┘    │  W10              │
             ▼               │  Daily Standup    │
    ┌───────────────────┐    │  (DRAFT/DISABLED) │
    │  W8               │    └───────────────────┘
    │  Appointment      │
    │  Reminders        │    ┌───────────────────┐
    │  (DRAFT/DISABLED) │    │  */30 * * * *     │
    └───────────────────┘    └────────┬──────────┘
                                      ▼
    ┌───────────────────┐    ┌───────────────────┐
    │  W11              │    │  W12              │
    │  Followup         │    │  Followup         │
    │  Slippage (v1)    │    │  Slippage Det.    │
    │  (DRAFT/DISABLED) │    │  (v2, ACTIVE)     │
    └───────────────────┘    └───────────────────┘

DUPLICATE PAIRS:
  W5 (draft) + W6 (active) — same domain, different format
  W11 (draft) + W12 (active) — same domain, different format
```

---

## 7. Agent Dependency Graph

```
request-classifier (AG1)
├── Called by: W1 (ticket-intake), W2 (support-escalation), W4 (urgent-dispatch), A1 (support-queue)
├── Reads: tickets (RW), technicians (R)
├── Writes: tickets
├── Connectors: Facebook, Instagram
└── Tables NOT used but instructed: N/A

operations-coordinator (AG2)
├── Called by: W1 (ticket-intake), W2 (support-escalation), W4 (urgent-dispatch), W9 (satisfaction-monitor), W10 (daily-standup), W12 (slippage-detector), A5 (ops-dashboard)
├── Reads: tickets, appointments, customers, technicians, tasks, operations_log
├── Writes: tasks, operations_log
├── Connectors: Discord
└── Tables NOT used but instructed: accounts, followups (mentioned in some instructions)

resolution-advisor (AG3)
├── Called by: W1 (ticket-intake), W2 (support-escalation), W3 (dispute-resolution), W9 (satisfaction-monitor), A4 (resolution-center)
├── Reads: disputes (RW), tickets, appointments, customers, operations_log
├── Writes: disputes, operations_log
├── Connectors: Reddit
└── Tables NOT used but instructed: N/A

account-health-monitor (AG4)
├── Called by: W5 (account-health — draft), W6 (account-health-monitoring), W11 (followup-slippage — draft)
├── Reads: accounts (RW), customers, followups (RW), tasks, appointments, disputes, operations_log
├── Writes: accounts, followups, tasks, operations_log
├── Sub-functions: flag_slipping_followups, account_health_scan
├── Connectors: Discord
└── Tables NOT used but instructed: N/A

support-reply-drafter (AG5)
├── Called by: W8 (appointment-reminders — draft), A1 (support-queue)
├── Reads: tickets (RW), technicians, customers
├── Writes: tickets
├── Connectors: Gmail, Reddit
└── Tables NOT used but instructed: N/A

tech-suggester (AG6)
├── Called by: W4 (urgent-dispatch), W7 (appointment-assignment), A2 (appointment-board — raw prompt)
├── Reads: tickets, technicians
├── Writes: (recommendations only)
├── Connectors: NONE
└── NOTES: No agent.json or permissions.json found; incomplete specification
```

---

## 8. Function Dependency Graph

```
Pure/Read-only Functions:
  F1  check_ticket_urgency       ← W1, W4 (no table I/O)
  F12 collect_resolved_tickets   ← W9 (reads tickets, sends Discord)
  F13 fetch_upcoming_appointments ← W8 (reads appointments)

Write Functions:
  F2  update_ticket_record       ← W1, W2, W9, A1
       ├── Writes: tickets, operations_log
       └── Sends: Gmail
  F3  account_health_scan        ← W5, AG4, A3
       ├── Reads: accounts, customers, appointments, disputes, followups
       └── Writes: accounts, operations_log
  F4  flag_slipping_followups    ← W5, W11, W12, AG4, A3
       └── Reads: followups, accounts, customers
  F5  create_followup_tasks      ← W5, W11
       ├── Writes: tasks, operations_log
       └── FROM: recommendations
  F6  create_operations_tasks    ← W10 (draft)
       ├── Writes: tasks, operations_log
       └── FROM: recommendations
  F7  dispatch_notifications     ← W8 (draft)
       ├── Writes: operations_log
       └── Sends: Gmail, Twilio
  F8  finalize_dispatch          ← W4
       ├── Writes: tickets, operations_log
       └── Sends: Discord
  F9  finalize_slippage_review   ← W12
       ├── Writes: operations_log
       └── Sends: Discord
  F10 resolve_dispute            ← W3
       ├── Writes: disputes, tickets, operations_log
       └── Sends: Discord, Gmail
  F11 assign_appointment_technician ← W7
       ├── Writes: appointments, operations_log
       └── Sends: NONE
  F14 update_account_health_status ← W6
       ├── Writes: operations_log
       └── Sends: Discord

Unused Functions (never called anywhere):
  (none — all functions are referenced)
```

---

## 9. Table Dependency Graph

```
tickets (T1)
├── Created by: Seed, Facebook/Instagram via AG1
├── Read by: A1, A5, W1, W2, W4, W9, AG1, AG2, AG3, AG5, AG6, F2, F8, F10, F12
├── Written by: A1, W1, W2, W4, AG1, AG5, F2, F8, F10
├── Status transitions: new → classified → drafted → approved_to_send → sent → closed
└── Trigger: ticket.created (W1), tickets UPDATE (W2), tickets INSERT/UPDATE (W4)

appointments (T2)
├── Created by: Seed
├── Read by: A2, A4, A5, AG2, AG3, AG4, F3, F13
├── Written by: A2, W7, AG2, F11
├── Status transitions: scheduled → in_progress → completed / needs_followup / cancelled
└── Trigger: appointments INSERT (W7)

disputes (T3)
├── Created by: Seed
├── Read by: A4, A5, AG3, AG4, F3, F10
├── Written by: W3, AG3, F10
├── Status transitions: open → analyzing → recommendation_ready → approved / rejected → closed
└── Trigger: disputes INSERT/UPDATE (W3)

customers (T4)
├── Created by: Seed
├── Read by: A2, A3, A4, AG2, AG3, AG4, AG5, F3, F4
├── Written by: A4 (when approving resolution)
└── Trigger: (none)

technicians (T5)
├── Created by: Seed
├── Read by: A2, AG1, AG2, AG5, AG6
├── Written by: (none)
└── Trigger: (none)

accounts (T6)
├── Created by: Seed
├── Read by: A3, AG4, F3, F4
├── Written by: AG4, F3
├── Key fields: health (healthy/watch/slipping/critical), relationship_status, health_score
└── Trigger: (none)

followups (T7)
├── Created by: Seed
├── Read by: A3, F3, F4
├── Written by: AG4
└── Trigger: (none)

tasks (T8)
├── Created by: Seed, AG2, F5, F6
├── Read by: A5, AG2, AG4
├── Written by: AG2, F5, F6
└── Trigger: (none)

operations_log (T9)
├── Created by: Nearly everything
├── Read by: A5, AG2
├── Written by: A1, A2, A4, A5, W1, W2, W3, W4, W6, W7, W9, W12, AG2, AG3, AG4, F2-F14
└── Trigger: (none — append-only audit log)
```

---

## 10. Connector Inventory & Usage

| Connector | Defined In | Actually Used | Automated Trigger? |
|-----------|-----------|---------------|-------------------|
| **Gmail** | F2, F7, F10, AG5 | F2 (update_ticket_record), F7 (dispatch_notifications), F10 (resolve_dispute) | Yes — via workflows |
| **Discord** | F8, F9, F10, F12, F14, AG2, AG4, A3 | F8 (dispatch), F9 (slippage), F10 (dispute), F12 (collect), F14 (health status), AG2 (coordinator), AG4 (health monitor) | Yes — via workflows + apps |
| **Twilio** | F7 | F7 (dispatch_notifications) | Via W8 (draft/disabled) |
| **Reddit** | AG3, AG5, A4 | A4 (resolution-center — manual searchResditCommunity) | No — manual only |
| **Facebook** | AG1 instruction.md | **Never** — no trigger or workflow invokes it | No |
| **Instagram** | AG1 instruction.md | **Never** — no trigger or workflow invokes it | No |

---

## 11. Missing Integrations

### 11.1 App → Workflow Integration Gaps

| Gap ID | Description | Severity |
|--------|-------------|----------|
| **MI-01** | support-queue (A1) calls agents directly (`classifyTicket`, `draftReply`) instead of triggering the ticket-intake workflow (W1). The workflow exists for exactly this purpose but is bypassed. | HIGH |
| **MI-02** | appointment-board (A2) calls tech-suggester via raw prompt (bypasses proper agent schema) instead of relying on the appointment-assignment workflow (W7). Also implements its own `assignTechnician` instead of calling `assign_appointment_technician` (F11). | HIGH |
| **MI-03** | resolution-center (A4) implements its own dispute resolution logic (`approveResolution`, `rejectDispute`, `closeDispute`) by directly updating tables instead of calling `resolve_dispute` (F10) which also handles Discord notifications and audit logging. | HIGH |
| **MI-04** | crm-tracker (A3) calls `account_health_scan` (F3) and `flag_slipping_followups` (F4) directly instead of triggering the account-health-monitoring workflow (W6). The Discord alert is also sent directly from the app rather than through the workflow. | MEDIUM |
| **MI-05** | ops-dashboard (A5) calls `operations-coordinator` (AG2) directly instead of triggering the daily-standup workflow (W10) which wraps the same agent with task creation. | MEDIUM |

### 11.2 Workflow Gaps

| Gap ID | Description | Severity |
|--------|-------------|----------|
| **MI-06** | **account-health (W5) vs account-health-monitoring (W6)**: Two workflows for the same domain. W5 (draft, old format) calls F4→F3→AG4→F5. W6 (active, new format) calls AG4→F14. Neither is complete — W5 has extra function calls but is disabled; W6 is active but doesn't call F4, F3, or F5. | HIGH |
| **MI-07** | **followup-slippage (W11) vs followup-slippage-detector (W12)**: Two workflows for the same purpose. W11 (draft, disabled, old format) is more complete (calls F5). W12 (active, new format) runs every 30 minutes and only audits via F9 — it never creates remediation tasks. | HIGH |
| **MI-08** | **appointment-reminders (W8)**: Draft and disabled. No automated appointment reminders are running, despite the draft workflow being fully defined. | HIGH |
| **MI-09** | **daily-standup (W10)**: Draft and disabled. No morning operational coordination runs. The ops-dashboard calls the coordinator directly. | MEDIUM |
| **MI-10** | **account-health (W5)**: No final write-back function after creating tasks. The workflow ends without updating any status. | MEDIUM |
| **MI-11** | **appointment-reminders (W8)**: The human_review node has no way to re-trigger dispatch after resolution. Once a failure is reviewed, the reminders cannot be re-dispatched. | LOW |

### 11.3 Agent Gaps

| Gap ID | Description | Severity |
|--------|-------------|----------|
| **MI-12** | **tech-suggester (AG6)** has no `agent.json` or `permissions.json`. It lacks formal definition and proper access grants. It is called by appointment-board (A2) via raw string prompt, not respecting its defined input/output schema. | HIGH |
| **MI-13** | **Facebook/Instagram connectors** are documented in request-classifier (AG1) instructions but no trigger or workflow invokes them. Social media ticket ingestion is unimplemented. | MEDIUM |
| **MI-14** | **Reddit connector** is only used manually in resolution-center (A4) via `searchRedditCommunity()`. Never used by resolution-advisor (AG3) or support-reply-drafter (AG5) in any automated workflow. | LOW |

### 11.4 Function Gaps

| Gap ID | Description | Severity |
|--------|-------------|----------|
| **MI-15** | **resolve_dispute (F10)** is never called by resolution-center (A4). The app has duplicate logic that bypasses the function's Discord notification, Gmail dispatch, and structured audit logging. | HIGH |
| **MI-16** | **assign_appointment_technician (F11)** is never called by appointment-board (A2). The app has its own `assignTechnician` which writes to appointments directly without the function's structured audit logging. | HIGH |
| **MI-17** | **create_followup_tasks (F5)** is never called by account-health-monitoring (W6) or followup-slippage-detector (W12). These active workflows end without creating remediation tasks. | MEDIUM |
| **MI-18** | **create_operations_tasks (F6)** can never run because daily-standup (W10) is draft/disabled. | MEDIUM |
| **MI-19** | **dispatch_notifications (F7)** can never run because appointment-reminders (W8) is draft/disabled. | MEDIUM |
| **MI-20** | **fetch_upcoming_appointments (F13)** can never run because appointment-reminders (W8) is draft/disabled. | LOW |

### 11.5 Table Gaps

| Gap ID | Description | Severity |
|--------|-------------|----------|
| **MI-21** | **technicians (T5)** table is read-only — never written by any app, workflow, agent, or function. No automated mechanism to update technician availability. | MEDIUM |
| **MI-22** | **customers (T4)** table is only written by resolution-center (A4) during dispute approval. No workflow updates customer status based on ticket/dispute outcomes systematically. | MEDIUM |
| **MI-23** | **followups (T7)** never have their status updated by any workflow or function. Followup slippage detection only reads them. No function closes/completes a followup. | MEDIUM |
| **MI-24** | **tasks (T8)** has no workflow that marks tasks as done/closed. Tasks are created but never completed through the workflow engine. | LOW |
| **MI-25** | **accounts (T6)** have `open_followups` and `overdue_followups` fields that are written by `account_health_scan` (F3) but never decremented when followups are completed. | LOW |

### 11.6 Schedule Gaps

| Gap ID | Description | Severity |
|--------|-------------|----------|
| **MI-26** | No morning operational standup runs (W10 is disabled). The ops-dashboard requires manual coordinator invocation. | MEDIUM |
| **MI-27** | No appointment reminder dispatch runs (W8 is disabled). Customers and technicians receive no automated appointment reminders. | HIGH |
| **MI-28** | followup-slippage-detector (W12) runs every 30 minutes — may be too aggressive for the value it provides (audit logging only). | LOW |

---

## 12. Broken Integrations

| Broken ID | Description | Severity |
|-----------|-------------|----------|
| **BI-01** | **Circular trigger risk in W3**: Dispute-resolution (W3) triggers on `disputes INSERT/UPDATE`. The `resolve_dispute` function (F10) updates the dispute record, potentially re-triggering the workflow. While F10 sets status to "closed", there's no status-based guard in the trigger config. | MEDIUM |
| **BI-02** | **Circular trigger risk in W4**: Urgent-dispatch (W4) triggers on `tickets INSERT/UPDATE`. The `finalize_dispatch` function (F8) updates the ticket record, potentially re-triggering the workflow. | MEDIUM |
| **BI-03** | **Broken customer lookup in F2**: `update_ticket_record` handler does `pod.records.get("customers", ticket.get("customer_name"))` — using a customer name as an ID lookup, which will always fail. The Gmail send path is broken as a result. | HIGH |
| **BI-04** | **Duplicate ticket processing**: support-queue's `markSent()` calls `update_ticket_record` function, AND the ticket-intake workflow (W1) also calls the same function. Both paths could execute on the same ticket, causing duplicate operations_log entries and potentially double Gmail sends. | MEDIUM |
| **BI-05** | **Stale data views**: Apps that call agents/functions directly (A1, A2, A3, A4, A5) don't invalidate their cached data after mutations. If a workflow runs in the background, the UI won't reflect the changes until manual refresh. | MEDIUM |
| **BI-06** | **Default route = silent dead-end**: In W1 (ticket-intake), the `human-approval` node's default next is `null`. If no condition matches (e.g., `approved` is not exactly "approved"/"rejected"/"needs_revision"), the workflow halts with no error handling. | HIGH |
| **BI-07** | **W2 auto-rejects on null**: The support-escalation-manager's `route_approval` only routes on `approved == true`. Any other value (false, null, undefined) falls to default → `end_rejected`. | MEDIUM |
| **BI-08** | **W3 approval gap**: After `human_approval` in W3 approves, `route_approval` sends to `apply_resolution` which calls `resolve_dispute` with action "approve". This closes the dispute. But if approved is false, the default route goes to `return_to_advisor` which also calls `resolve_dispute` with action "reject". There's no "hold" or "request more info" path. | LOW |
| **BI-09** | **Disabled W5 + active W6 = incomplete coverage**: W5 (disabled) calls F4+F3+AG4+F5 (full pipeline). W6 (active) only calls AG4+F14 (partial pipeline). The active workflow is missing slippage detection, health scan, and task creation. | HIGH |
| **BI-10** | **Missing status transitions in appointment-assignment (W7)**: The workflow ends with `assign_appointment_technician` (F11) setting `status="in_progress"`. There's no path for "completed", "cancelled", or "needs_followup" transitions. | LOW |

---

## 13. Recommended Fixes (Priority Ordered)

### P0 — Critical (blocks core functionality or causes data corruption)

| # | Fix | Gaps Addressed | Effort |
|---|-----|----------------|--------|
| **F1** | **Fix broken customer lookup in `update_ticket_record` (F2)**: Change `pod.records.get("customers", ticket.get("customer_name"))` to use the actual customer_id from the ticket, or look up by name/email properly. | BI-03 | 1h |
| **F2** | **Remove the default `null` path in ticket-intake (W1) human-approval node**: Ensure every possible decision routes to a valid next node. Add fallback to human-escalation. | BI-06 | 30m |
| **F3** | **Add status-based guard on W3 and W4 triggers**: Ensure workflows only trigger on status transitions that warrant processing (e.g., only when `status=open` for disputes, only when `status=new` for tickets). | BI-01, BI-02 | 1h |

### P1 — High (significant business process gaps or duplicate logic)

| # | Fix | Gaps Addressed | Effort |
|---|-----|----------------|--------|
| **F4** | **Complete the tech-suggester (AG6) definition**: Create `agent.json`, `permissions.json` with proper grants (tickets R, technicians R). | MI-12 | 1h |
| **F5** | **Enable and complete account-health-monitoring (W6)**: Add `flag_slipping_followups` (F4) and `account_health_scan` (F3) as upstream nodes before the agent call. Add `create_followup_tasks` (F5) after the agent. Remove the duplicate disabled W5. | MI-06, MI-17 | 3h |
| **F6** | **Enable appointment-reminders (W8)**: Activate the draft workflow. Add event triggers for appointment.created and appointment.rescheduled (already defined). Ensure Twilio and Gmail connector configs are valid. | MI-08, MI-19, MI-20, MI-27 | 2h |
| **F7** | **Integrate resolve_dispute (F10) into resolution-center (A4)**: Replace the app's direct table writes with calls to the function. The app should call F10 instead of manually updating disputes + customers + operations_log. | MI-03, MI-15 | 2h |
| **F8** | **Integrate assign_appointment_technician (F11) into appointment-board (A2)**: Replace the app's direct `assignTechnician` with a call to F11. Remove the raw prompt tech-suggester call in favor of triggering W7. | MI-02, MI-16 | 2h |
| **F9** | **Fix support-queue (A1) to delegate to ticket-intake workflow (W1)**: Instead of calling agents directly for classify and draft, trigger the workflow or at minimum use the same functions the workflow uses. | MI-01 | 3h |

### P2 — Medium (important process improvements)

| # | Fix | Gaps Addressed | Effort |
|---|-----|----------------|--------|
| **F10** | **Implement social media ticket ingestion**: Create a scheduled workflow or webhook that uses Facebook and Instagram connectors via request-classifier (AG1) to create tickets from social media messages. | MI-13 | 4h |
| **F11** | **Create technician availability update mechanism**: Either a function or agent that updates the technicians table based on appointment assignments. | MI-21 | 2h |
| **F12** | **Enable daily-standup (W10)**: Activate the draft workflow so morning ops coordination + task creation runs automatically. | MI-09, MI-18, MI-26 | 1h |
| **F13** | **Add followup completion workflow**: Create a function or agent call that marks followups as completed when related tickets are closed or appointments completed. | MI-23 | 2h |
| **F14** | **Unify the two slippage workflows**: Remove followup-slippage (W11, draft). In followup-slippage-detector (W12), add `create_followup_tasks` (F5) after human approval so remediation tasks are created. Add overdue task creation. | MI-07, MI-17 | 3h |
| **F15** | **Add duplicate-idempotency checks in support-queue (A1) `markSent`**: Check if the function was already called for this ticket before calling `update_ticket_record`. | BI-04 | 1h |

### P3 — Low (nice-to-have improvements)

| # | Fix | Gaps Addressed | Effort |
|---|-----|----------------|--------|
| **F16** | **Add task completion workflow**: Create a simple function that marks tasks as "done" when their related entity (ticket, appointment) reaches a terminal status. | MI-24 | 2h |
| **F17** | **Re-evaluate followup-slippage-detector (W12) cron interval**: Change from `*/30 * * * *` to `0 */2 * * *` (every 2 hours) to reduce noise. | MI-28 | 30m |
| **F18** | **Add stale data refresh mechanism**: Implement a polling or webhook pattern so apps refresh their data after workflow mutations. | BI-05 | 3h |
| **F19** | **Simulate account_health_scan writes**: The function's `write_back` flag is always true but no actual write-back is visible in the handler code. Verify that accounts are actually updated. | MI-25 | 1h |
| **F20** | **Add progressive disclosure for W2 approval**: Route `approved==false` to a "request revision" path instead of auto-rejecting. | BI-07 | 1h |

---

## Summary

| Category | Count |
|----------|-------|
| Total Resources | 5 apps, 12 workflows, 9 tables, 6 agents, 14 functions, 6 connectors |
| Active Workflows | 6 of 12 (50%) |
| Missing Integrations (MI) | 28 identified |
| Broken Integrations (BI) | 10 identified |
| P0-P1 Fixes Required | 9 |
| P2-P3 Fixes Recommended | 11 |

### Key Findings

1. **Apps bypass workflows**: Every frontend app calls agents/functions directly instead of triggering the workflow engine. This creates duplicate logic paths and inconsistent state management.

2. **Two pairs of duplicate workflows**: account-health (W5/W6) and followup-slippage (W11/W12) compete for the same domains with different completeness levels.

3. **4 of 12 workflows are draft/disabled**: appointment-reminders (W8), daily-standup (W10), and the older versions (W5, W11) — representing critical automation gaps.

4. **3 functions are never called by apps** but only by disabled workflows: F5, F6, F7, F13 — representing sunk implementation effort until the workflows are enabled.

5. **Connector utilization is low**: Facebook and Instagram connectors are defined but never used. Reddit is only used manually. Twilio is only called by a disabled workflow.

6. **Broken customer email lookup** in `update_ticket_record` (F2) means Gmail sends fail silently when triggered by the ticket-intake workflow.
