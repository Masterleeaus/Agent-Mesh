# RESQAI V2 — Execution Pipeline

> Phase 1.5 — Architecture Only  
> Principal Integration Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Pipeline Stages](#1-pipeline-stages)
2. [Request Lifecycle](#2-request-lifecycle)
3. [Event Flow Paths](#3-event-flow-paths)
4. [Function Execution Pipeline](#4-function-execution-pipeline)
5. [Notification Pipeline](#5-notification-pipeline)
6. [Cross-Domain Orchestration](#6-cross-domain-orchestration)
7. [Failure Handling Patterns](#7-failure-handling-patterns)

---

## 1. Pipeline Stages

Every request (function call, workflow step, event delivery, notification send) flows through these stages:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         EXECUTION PIPELINE                               │
│                                                                          │
│  STAGE 1     STAGE 2      STAGE 3       STAGE 4       STAGE 5           │
│  ┌──────┐   ┌────────┐   ┌─────────┐   ┌─────────┐   ┌──────────┐      │
│  │INPUT │   │PERM   │   │EXECUTE  │   │EMIT     │   │OUTPUT    │      │
│  │VALID │→  │CHECK  │→  │BUSINESS │→  │EVENT    │→  │RETURN    │      │
│  │      │   │       │   │LOGIC    │   │+AUDIT   │   │          │      │
│  └──────┘   └────────┘   └─────────┘   └─────────┘   └──────────┘      │
│                                                                          │
│  ──────────────── IDEMPOTENCY CHECK at Stage 2 ─────────────────        │
│  ──────────────── IDEMPOTENCY STORE WRITE at Stage 5 ─────────────────  │
│  ──────────────── AUDIT LOG WRITE at Stage 4 ──────────────────────     │
│  ──────────────── CONNECTOR CALL at Stage 3 (ORCHESTRATOR only) ────    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Stage Details

| Stage | Input | Output | Error Handling | Timing |
|:-----:|-------|--------|:--------------:|:------:|
| **1. Input Validation** | Raw request | Validated + sanitized params | VALIDATION_ERROR → return immediately | <5ms |
| **2. Permission & Idempotency** | Validated params + actor | Authorized + idempotency-checked | NOT_FOUND (actor), CONFLICT (idempotency) | <15ms |
| **3. Business Logic** | Authorized params | Computed result, DB writes | TIMEOUT, CONFLICT, CONNECTOR_ERROR → retry | <4s |
| **4. Event + Audit** | Result + before/after state | Event emitted, audit logged | DB write failure → fail pipeline | <30ms |
| **5. Output Return** | Event ID + audit ID + result | Structured response | N/A (post-commit) | <5ms |

---

## 2. Request Lifecycle

### 2.1 Workflow-Initiated Request

```
User Action (e.g., Submit Ticket)
    │
    ▼
Application (support-center_v2)
    │
    ▼
┌─────────────────────────────────────┐
│  WORKFLOW ORCHESTRATOR               │
│                                      │
│  1. workflow-health-monitor checks   │
│  2. Load workflow graph definition   │
│  3. Execute Node 1: agent           │
│     → support-request-classifier    │
│  4. Execute Node 2: agent           │
│     → support-reply-drafter          │
│  5. Execute Node 3: function        │
│     → check-ticket-urgency          │
│  6. Execute Node 4: function        │
│     → update-ticket-record           │
│     └── emits ticket.status.changed  │
│  7. Execute Node 5: human           │
│     → Approval (4h timeout)         │
│  8. Execute Node 6: function        │
│     → dispatch-notifications        │
│     └── emits notification.sent      │
│  9. Complete workflow               │
└─────────────────────────────────────┘
```

### 2.2 Agent-Initiated Request

```
Agent Decision (e.g., crm-account-health-monitor)
    │
    ▼
┌──────────────────────────────────────┐
│  AGENT EXECUTION                      │
│                                       │
│  1. Agent receives event (or schedule)│
│  2. Agent reads context from tables   │
│  3. Agent calls function(s):         │
│     → account-health-scan            │
│       → function executes pipeline   │
│       → emits account.health.changed │
│     → update-account-health-status   │
│       → function executes pipeline   │
│  4. Agent writes results to tables   │
│  5. Agent completes                  │
└──────────────────────────────────────┘
```

### 2.3 Event-Initiated Request

```
Event (e.g., ticket.created)
    │
    ▼
┌──────────────────────────────────────┐
│  EVENT ROUTER                         │
│                                       │
│  1. Validate event against schema    │
│  2. Lookup subscribers in registry   │
│  3. Fan-out to all subscribers:      │
│     a. workflow:ticket-intake_v2     │
│        → instantiate workflow        │
│     b. agent:classifier              │
│        → queue for async processing  │
│     c. analytics:event-ingest        │
│        → batch for periodic sync     │
│  4. Track delivery per subscriber    │
└──────────────────────────────────────┘
```

---

## 3. Event Flow Paths

### 3.1 Full Ticket Lifecycle Flow

```
customer-portal:
  ticket.created
    │
    ▼
Event Router → workflow:ticket-intake_v2
    │
    ├── Node: support-request-classifier
    │     → ticket.classified
    │
    ├── Node: support-reply-drafter
    │     → ticket.reply.drafted
    │
    ├── Human Approval
    │
    ├── Node: update-ticket-record
    │     → ticket.status.changed
    │
    ├── Node: dispatch-notifications
    │     → notification.sent → ticket.sent
    │
    └── Complete
```

### 3.2 Full Dispatch Lifecycle Flow

```
ticket.created (urgent)
    │
    ▼
Event Router → workflow:urgent-dispatch_v2
    │
    ├── Node: dispatch-coordinator
    │     → calculate-dispatch-priority
    │     → finalize-dispatch
    │       → dispatch.created
    │
    ├── Node: dispatch-technician-dispatcher
    │     → dispatch-notifications
    │       → dispatch.sent
    │
    ├── Await technician response
    │     → dispatch.acknowledged | dispatch.declined
    │         │                       │
    │     If declined → reassign      │
    │         │                       │
    ├── Node: dispatch.en_route       │
    ├── Node: dispatch.on_site        │
    ├── Node: dispatch.completed      │
    │
    ├── Node: create-work-order
    │     → work_order.created
    │
    └── Complete
```

### 3.3 Full CRM Account Health Flow

```
Schedule: nightly account-health-scan_v2
    │
    ▼
workflow:account-health-scan_v2
    │
    ├── Node: account-health-scan
    │     → reads disputes, followups, feedback, tickets, appointments
    │     → generates health score
    │     → if changed: account.health.changed
    │
    ├── Node: flag-slipping-followups
    │     → if found: followup.slippage.detected
    │
    ├── Node: update-account-health-status
    │     → writes new health score/category
    │
    ├── Node: dispatch-notifications (if risk detected)
    │     → notification to CRM Manager
    │
    └── Complete
```

---

## 4. Function Execution Pipeline

### 4.1 Detailed Pipeline Per Function Type

```
DETERMINISTIC / READER:
  Valid → Permission → Execute → Output
  (No event, no audit log)

WRITER:
  Valid → Permission → Idempotency → Execute → DB Write → Audit → Event → Output
  (Exactly one event emitted)

AGGREGATOR:
  Valid → Permission → Idempotency → Read ALL → Compute → (Write) → Audit → (Event) → Output
  (Event conditional on change)

TRANSFORMER:
  Valid → Permission → Execute → Output
  (No mutation, no event)

ORCHESTRATOR:
  Valid → Permission → Idempotency → Execute
    ├── Sub-function(s)
    ├── Connector call(s)
    └── (Event if mutation)
  Audit → Output
```

### 4.2 Pipeline Timing Budget

| Stage | Budget | Cumulative |
|-------|:------:|:----------:|
| Input validation | 5ms | 5ms |
| Permission check | 10ms | 15ms |
| Idempotency check | 5ms | 20ms |
| Business logic | 4.5s | 4.52s |
| DB writes | 200ms | 4.72s |
| Audit write | 50ms | 4.77s |
| Event emission | 50ms | 4.82s |
| Output marshalling | 5ms | 4.825s |
| **Total budget** | **5s** | **5s** |

---

## 5. Notification Pipeline

### 5.1 End-to-End Notification Flow

```
Notification Request (from any workflow/agent/app)
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  1. dispatch-notifications function                   │
│     a. Validate input                                 │
│     b. Check idempotency key                          │
│     c. Read notification template                     │
│     d. render-notification-template (sub-function)    │
│     e. notification-channel-optimizer (channel select) │
│     f. Check circuit breaker state                    │
│     g. Rate limiter check                             │
│     h. Call connector (SMTP/Twilio/Discord/Slack)     │
│     i. Write notification record                      │
│     j. Emit notification.sent | notification.failed   │
│     k. Return result                                  │
└─────────────────────────────────────────────────────┘
    │
    ▼
Provider Callback (async)
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  2. process-notification-delivery function            │
│     a. Validate webhook payload                       │
│     b. Update notification status                     │
│     c. Emit notification.delivered | notification.failed│
│     d. If failed: check fallback chain                │
│     e. If all failed: DLQ                             │
└─────────────────────────────────────────────────────┘
```

### 5.2 Notification Pipeline Timing

| Stage | Budget | Cumulative |
|-------|:------:|:----------:|
| Template render | 30ms | 30ms |
| Channel selection | 10ms | 40ms |
| Circuit breaker check | 5ms | 45ms |
| Rate limiter | 5ms | 50ms |
| Provider API call | 500ms | 550ms |
| DB writes | 50ms | 600ms |
| Event emission | 50ms | 650ms |
| **Total** | **<1s** | **650ms** |

---

## 6. Cross-Domain Orchestration

### 6.1 Complex Multi-Domain Example: Urgent Dispatch with Work Order

```
1. CUSTOMER submits ticket (ticket.created)
   Domain: Ticket

2. WORKFLOW: ticket-intake_v2
   Domain: Ticket → Support → Operations
   → classifier, drafter, approval

3. WORKFLOW: urgent-dispatch_v2
   Domain: Dispatch → Notification
   → dispatch coordinator, technician dispatcher

4. WORKFLOW: appointment-completion_v2
   Domain: Appointment → Work Order → CRM
   → complete appointment, create work order

5. WORKFLOW: work-order-fulfillment_v2
   Domain: Work Order → Inventory
   → stage progression, parts used

6. WORKFLOW: customer-satisfaction-monitor_v2
   Domain: Customer Experience → Notification
   → send survey, analyze feedback

   ─── 6 workflows, 5 domains, 15+ agents, 10+ functions ───
```

### 6.2 Cross-Domain Event Chain

```
Domain Crossing via Events:

  [Ticket] ticket.created → [Support] classify
  [Support] ticket.escalated → [Dispatch] urgent-dispatch
  [Dispatch] dispatch.completed → [Appointment] complete
  [Appointment] appointment.completed → [Work Order] create
  [Work Order] work_order.completed → [CX] send survey
  [CX] feedback.submitted → [CRM] update account health
  [CRM] account.health.changed → [Operations] alert manager
```

---

## 7. Failure Handling Patterns

### 7.1 Failure Type → Recovery Pattern Matrix

| Failure | Stage | Recovery | Fallout |
|---------|:-----:|----------|---------|
| Invalid input | 1 | Return VALIDATION_ERROR | None |
| Missing permissions | 2 | Return PERMISSION_DENIED + audit | None |
| Idempotency hit | 2 | Return cached previous result | Duplicate prevented |
| DB timeout | 3 | Retry × 3 (exp backoff) | Eventual success or fail |
| DB deadlock | 3 | Retry × 3 (exp backoff) | Victim rollback |
| Connector timeout | 3 | Retry × 2 (linear backoff) | Fallback channel |
| Connector permanent fail | 3 | Circuit breaker OPEN | Fallback channel |
| Audit write fail | 4 | Log error → still return success | Audit gap (alert) |
| Event emission fail | 4 | Retry × 3 | Eventual consistency |
| Workflow node failure | (WF) | Node retry × 3 | Skip node or fail workflow |
| Human approval timeout | (WF) | Escalate or auto-approve | Per workflow policy |

### 7.2 Recovery Escalation Path

```
Function Failure (retries exhausted)
    │
    ▼
Return error to caller (workflow/agent)
    │
    ├── Workflow: retry node → skip node → fail instance
    │     └── workflow-health-monitor detects → recovery action
    │
    ├── Agent: log error → continue with degraded output
    │     └── agent notifies manager agent
    │
    └── Application: show error to user → suggest retry
          └── error logged to audit
```

---

> **End of EXECUTION_PIPELINE.md**  
> Next document: DEPENDENCY_GRAPH.md
