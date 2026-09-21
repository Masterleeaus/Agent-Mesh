# RESQAI V2 — Workflow Architecture

> Phase 1.4 — Architecture Only  
> Chief Workflow Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Architecture Principles](#1-architecture-principles)
2. [Workflow Execution Model](#2-workflow-execution-model)
3. [Workflow Categories](#3-workflow-categories)
4. [Node Types](#4-node-types)
5. [Event-Driven Model](#5-event-driven-model)
6. [Cross-Workflow Communication](#6-cross-workflow-communication)
7. [Workflow Governance](#7-workflow-governance)
8. [Error Handling Model](#8-error-handling-model)
9. [Idempotency and Retry](#9-idempotency-and-retry)
10. [Workflow Lifecycle](#10-workflow-lifecycle)

---

## 1. Architecture Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Event-First Execution** | Every workflow is triggered by a domain event. Scheduled workflows are implemented as cron events. |
| 2 | **Single Business Process per Workflow** | Each workflow represents exactly one complete business process with a clear start and end state. |
| 3 | **Deterministic Routing** | Decision nodes use explicit conditions and business rules. No AI makes routing decisions — AI makes content decisions. |
| 4 | **Fail Closed** | On any unhandled error, workflows transition to a "failed" terminal state with an escalation event. |
| 5 | **Correlation ID Flow** | Every workflow instance carries a correlation ID that chains across all downstream workflows. |
| 6 | **Human Gate at Boundaries** | All actions with financial, legal, or customer-impact consequences pause at a human decision gate. |
| 7 | **Idempotent by Design** | Replaying the same event produces the same result. Side effects are guarded by idempotency keys. |
| 8 | **Observable by Default** | Every node execution, decision, and state transition emits a domain event and audit log entry. |
| 9 | **Workflow Orchestrator Executes** | The Workflow Orchestrator AI agent executes workflow graphs. All workflows are graph definitions, not code. |
| 10 | **No Circular Dependencies** | Workflow dependency graph is strictly acyclic. Dependency cycles are prevented at design time. |

---

## 2. Workflow Execution Model

### 2.1 High-Level Execution Flow

```
TRIGGER EVENT
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Workflow Orchestrator AI                                        │
│                                                                  │
│  1. Load workflow graph definition (from workflow store)        │
│  2. Create workflow instance with correlation ID                │
│  3. Execute START node                                           │
│  4. For each node:                                               │
│     ├── AGENT node: invoke agent via event, wait for response   │
│     ├── FUNCTION node: invoke function via event, wait for result│
│     ├── DECISION node: evaluate conditions, route to next       │
│     ├── HUMAN node: emit approval request, wait for response    │
│     ├── PARALLEL node: fan out to multiple paths simultaneously │
│     ├── JOIN node: wait for all parallel paths to complete      │
│     ├── SUBWORKFLOW node: start child workflow, wait for result │
│     └── EVENT node: emit event to event bus                     │
│  5. Execute END node                                             │
│  6. Emit workflow.completed or workflow.failed event            │
│  7. Archive workflow instance                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Workflow Instance State

Each workflow instance maintains a state object that persists across nodes:

```json
{
  "workflow_instance_id": "uuid",
  "workflow_name": "ticket-intake_v2",
  "correlation_id": "corr_abc123",
  "version": 2,
  "status": "running",
  "current_node": "classify-ticket",
  "execution_path": ["start", "classify-ticket"],
  "variables": {
    "ticket_id": "ticket_uuid",
    "customer_id": "customer_uuid",
    "classification": null,
    "draft_reply": null,
    "approval_status": null
  },
  "started_at": "2026-06-28T12:00:00Z",
  "timeout_at": "2026-06-28T12:10:00Z",
  "retry_count": 0,
  "error_history": [],
  "human_approvals_pending": [],
  "child_workflow_ids": []
}
```

---

## 3. Workflow Categories

| Category | Workflows | Owner Department | Business Domain |
|----------|-----------|-----------------|-----------------|
| **Ticket Lifecycle** | ticket-intake, ticket-escalation, ticket-auto-response | Support | Support Operations |
| **Appointment Lifecycle** | appointment-booking, appointment-reminders, appointment-completion | Appointment / Scheduling | Appointments |
| **Dispatch Lifecycle** | urgent-dispatch, standard-dispatch | Dispatch | Dispatch & Field Ops |
| **Work Order Lifecycle** | work-order-fulfillment, work-order-verification | Operations | Work Orders |
| **Resolution Lifecycle** | dispute-resolution, dispute-escalation | CX / QA | Dispute Resolution |
| **CRM Lifecycle** | account-health-scan, followup-management, followup-slippage-detector, retention-campaign | CRM | CRM & Account Health |
| **Customer Experience** | customer-satisfaction-monitor, feedback-analysis | CX | Customer Experience |
| **Knowledge Lifecycle** | knowledge-article-lifecycle, knowledge-gap-detection | Knowledge | Knowledge Base |
| **Notification Lifecycle** | notification-delivery | Notification | Notifications |
| **Operations Monitoring** | daily-standup, operations-coordination | Operations | Operations |
| **SLA Lifecycle** | sla-enforcement | Support | Support Operations |
| **Reporting Lifecycle** | report-generation, report-distribution | Reporting | Analytics & Reporting |
| **Analytics Lifecycle** | trend-analysis, anomaly-detection | Analytics | Analytics |
| **Administration** | user-provisioning, system-config-management | Administration | Administration |
| **Inventory Lifecycle** | inventory-reorder | Operations | Inventory |
| **Quality Lifecycle** | quality-review | QA | Quality Assurance |
| **Automation Lifecycle** | workflow-health-monitor | Automation | Automation |

---

## 4. Node Types

### 4.1 Node Type Catalog

| Node Type | Icon | Purpose | Duration | Output |
|-----------|------|---------|----------|--------|
| **START** | ● | Entry point, receives trigger event | Instant | Initializes workflow instance |
| **END** | ■ | Terminal state, emits completion event | Instant | workflow.completed / workflow.failed |
| **AGENT** | 🤖 | Invokes an AI agent via event | 1-30s | Agent response + confidence |
| **FUNCTION** | ⚙️ | Executes deterministic Python function | <5s | Function result |
| **DECISION** | ◆ | Conditional branch based on data | Instant | Routing to one path |
| **HUMAN** | 👤 | Human approval/review gate | Variable | Approved / Rejected / Revised |
| **PARALLEL** | ↕ | Fan-out to multiple paths | Configurable | Multi-branch execution |
| **JOIN** | ⬇ | Sync point for parallel paths | Waits for all | Merged state |
| **EVENT** | 📨 | Emits event to event bus | Instant | Domain event |
| **SUBWORKFLOW** | 🔄 | Starts child workflow and waits | Variable | Child result |
| **TIMER** | ⏱ | Waits for specified duration | Configurable | Timer expiry |
| **CONDITION** | ? | Evaluates expression for routing | Instant | True / False |
| **TRANSFORM** | ⇄ | Transforms/maps data between nodes | Instant | Transformed data |
| **RETRY** | 🔁 | Retry node with backoff | Configurable | Retry or fail |

### 4.2 Standard Node Pattern

```json
{
  "node_id": "classify-ticket",
  "type": "AGENT",
  "label": "Classify Incoming Ticket",
  "agent_id": "support-request-classifier_v2",
  "input_mapping": {
    "ticket_id": "$.variables.ticket_id",
    "customer_id": "$.variables.customer_id"
  },
  "output_mapping": {
    "classification": "$.response.classification",
    "urgency": "$.response.urgency",
    "confidence": "$.response.confidence"
  },
  "timeout_seconds": 30,
  "retry_policy": {
    "max_retries": 3,
    "backoff_seconds": [5, 15, 30],
    "condition": "on_timeout"
  },
  "next": {
    "default": "check-urgency",
    "on_escalation": "escalate-classification"
  }
}
```

---

## 5. Event-Driven Model

### 5.1 Trigger Types

| Trigger Type | Description | Example |
|-------------|-------------|---------|
| **Table Event** | INSERT, UPDATE, DELETE on a V2 table | `ticket.created` on INSERT to `tickets_v2` |
| **Scheduled** | Cron-based time trigger | Daily at 2AM for health scan |
| **Manual** | Human-initiated via UI | "Run health check" button |
| **Workflow Event** | Completion/failure of another workflow | `workflow.booking.completed` |
| **External Webhook** | Inbound webhook from connector | Facebook message received |
| **System Event** | System-level condition | SLA deadline reached |

### 5.2 Event-to-Workflow Mapping

```
EVENT BUS
    │
    ├── ticket.created ──────────────────────────► ticket-intake_v2
    ├── ticket.escalated ─────────────────────────► ticket-escalation_v2
    ├── ticket.sla_breached ──────────────────────► sla-enforcement_v2
    ├── appointment.created ──────────────────────► appointment-booking_v2
    ├── appointment.confirmed ────────────────────► appointment-reminders_v2
    ├── appointment.completed ────────────────────► appointment-completion_v2
    ├── dispatch.created ─────────────────────────► standard-dispatch_v2
    ├── dispatch.escalated ───────────────────────► urgent-dispatch_v2
    ├── dispute.created ──────────────────────────► dispute-resolution_v2
    ├── work_order.created ───────────────────────► work-order-fulfillment_v2
    ├── account.health.changed ───────────────────► account-health-scan_v2 (follow-up)
    ├── followup.slippage.detected ───────────────► followup-slippage-detector_v2
    ├── feedback.submitted ───────────────────────► feedback-analysis_v2
    ├── knowledge.gap.detected ───────────────────► knowledge-gap-detection_v2
    └── system.health.alert ──────────────────────► workflow-health-monitor_v2
```

### 5.3 Event Bus Rules

| Rule | Description |
|------|-------------|
| At-Least-Once Delivery | Events are delivered at least once. Idempotency keys prevent duplicate processing. |
| Ordered per Entity | Events for the same entity are delivered in order (event causality is preserved). |
| TTL-Based Expiry | Events expire after 7 days in the event store. Consumed events are archived. |
| Dead-Letter Queue | Events that fail delivery after 3 retries go to a dead-letter queue for manual inspection. |
| Event Schema Validation | All events are validated against a registered schema before acceptance. |

---

## 6. Cross-Workflow Communication

### 6.1 Communication Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| **Chain** | Workflow A completes → triggers Workflow B | `ticket-intake_v2` → `appointment-booking_v2` |
| **Fan-Out** | One workflow triggers multiple downstream | `appointment-completion_v2` → `work-order-fulfillment_v2` + `customer-satisfaction-monitor_v2` |
| **Join** | Multiple workflows must complete before next | `dispute-resolution_v2` + `feedback-analysis_v2` → `account-health-scan_v2` |
| **Nested** | Workflow spawns a sub-workflow and waits | `retention-campaign_v2` → `notification-delivery_v2` (sub) |
| **Broadcast** | Completion event consumed by many workflows | Any workflow completion → `trend-analysis_v2` + `anomaly-detection_v2` |

### 6.2 Cross-Workflow Data Flow

```
Workflow A (ticket-intake_v2)                      Workflow B (appointment-booking_v2)
    │                                                     │
    │  Output Events:                                     │  Input Events:
    │  ├── ticket.classified  ──────────────────────────► │  ├── appointment.created
    │  ├── ticket.reply.drafted                           │  ├── ticket.classified (service-needed)
    │  └── ticket.status.changed                          │  └── ticket.sla_breached
    │                                                     │
    │  Shared Data (via correlation_id):                  │  Shared Data:
    │  ├── customer_id                                    │  ├── customer_id (same correlation)
    │  ├── ticket_id                                      │  ├── ticket_id
    │  └── classification                                 │  └── urgency
    │                                                     │
    └─────────────────────────────────────────────────────┘
```

### 6.3 Workflow-to-Workflow Event Flow Summary

```
Ticket Lifecycle ──► Appointment Lifecycle ──► Work Order Lifecycle
      │                      │                        │
      ├──► SLA Lifecycle     ├──► Dispatch Lifecycle   ├──► CRM Lifecycle
      │                      │                        │
      ├──► Knowledge         ├──► Customer Exp.        ├──► Analytics
      │                      │                        │
      └──► Notification ────┴─────────────────────────┘
                               │
                               ├──► Reporting
                               ├──► Administration
                               └──► Automation (monitor)
```

---

## 7. Workflow Governance

### 7.1 Workflow Definition Requirements

| Requirement | Specification |
|-------------|---------------|
| Name | snake_case with `_v2` suffix |
| Version | Semver (major.minor.patch) |
| Max Nodes | 50 nodes per workflow |
| Max Depth | 5 levels of sub-workflows |
| Max Parallel Branches | 10 concurrent branches |
| Max Execution Time | 24h per workflow instance |
| State Size Limit | 100KB per instance |
| Correlation ID Required | Every workflow must use a correlation_id |

### 7.2 Workflow Registry

All workflow definitions are registered in a central workflow registry:

```
Workflow Registry (system_settings_v2 or dedicated store)
───────────────────────────────────────────────────────────
  name             TEXT        PRIMARY KEY
  version          TEXT        NOT NULL
  status           TEXT        NOT NULL  -- draft / active / deprecated / retired
  category         TEXT        NOT NULL
  owner_dept       TEXT        NOT NULL
  trigger_type     TEXT        NOT NULL
  trigger_event    TEXT
  cron_schedule    TEXT
  max_execution_s  INTEGER     NOT NULL  -- max seconds before timeout
  retry_max        INTEGER     DEFAULT 3
  dependencies     TEXT[]      -- names of workflows that must exist first
  created_at       TIMESTAMPTZ
  updated_at       TIMESTAMPTZ
  approved_by      UUID        REFERENCES users_v2(id)
```

### 7.3 Change Management

| Change Type | Approval | Migration Strategy |
|-------------|----------|-------------------|
| New workflow | Automation Manager AI + Human Admin | Safe to deploy, no existing instances |
| Node addition | Automation Manager AI | New instances use new graph |
| Node modification | Automation Manager AI + Human QA | Dual-run old and new, compare outcomes |
| Node removal | Human Admin (breaking change) | Complete running instances first, then deploy |
| Dependency change | Automation Manager AI | Update workflow registry |

---

## 8. Error Handling Model

### 8.1 Node-Level Errors

```
NODE EXECUTION
    │
    ├── SUCCESS → Continue to next node
    │
    ├── TIMEOUT → Retry (per retry policy)
    │   ├── Retries exhausted → Escalate to node-level failure
    │   └── Success → Continue
    │
    ├── AGENT_ERROR → Log error, emit workflow.node.failed
    │   ├── Agent confidence < threshold → Route to escalation path
    │   └── Agent unavailable → Retry with backoff
    │
    └── FATAL → Emit workflow.failed, trigger escalation workflow
        ├── Platform Orchestrator AI notified
        └── Human admin alerted if critical
```

### 8.2 Workflow-Level Errors

| Error Condition | Behavior | Escalation |
|----------------|----------|------------|
| Node timeout exhausted | Mark instance as failed | `system.workflow.failed` event → Automation Manager AI |
| Data validation error | Route to error path if defined | Log error, continue on alternative path |
| Missing required variable | Fail immediately | Platform Orchestrator AI |
| Sub-workflow failure | Propagate failure to parent | Parent workflow fails |
| Event bus unavailable | Retry with backoff (3x) | If all fail, dead-letter |

---

## 9. Idempotency and Retry

### 9.1 Idempotency Strategy

| Node Type | Idempotency Key Source | TTL |
|-----------|----------------------|-----|
| AGENT | workflow_instance_id + node_id | Instance lifetime |
| FUNCTION | workflow_instance_id + node_id + input_hash | 24h |
| EVENT | event_id (dedup on event bus) | 7 days |
| HUMAN | approval_request_id | Instance lifetime |
| SUBWORKFLOW | child_workflow_id | 7 days |

### 9.2 Retry Strategy

| Node Type | Max Retries | Backoff | Retry On |
|-----------|-------------|---------|----------|
| AGENT | 3 | Exponential: 5s, 15s, 30s | Timeout, service unavailable |
| FUNCTION | 3 | Exponential: 1s, 5s, 15s | Timeout, runtime error |
| EVENT | 3 | Immediate: 0s, 1s, 2s | Event bus rejected |
| HUMAN | 0 | N/A | N/A (human must respond) |
| SUBWORKFLOW | 2 | Linear: 60s, 120s | Sub-workflow failed |

---

## 10. Workflow Lifecycle

### 10.1 Definition Lifecycle

```
draft ──→ active ──→ deprecated ──→ retired
  │          │
  └──→ archived (abandoned)
```

| Phase | Description | Allowed Operations |
|-------|-------------|-------------------|
| **draft** | Under development, not in production | Execute in test mode |
| **active** | Running in production | Normal execution |
| **deprecated** | Replaced by newer version | Existing instances complete, no new instances |
| **retired** | Permanently removed | No instances allowed |

### 10.2 Instance Lifecycle

```
pending ──→ running ──→ completed
                │
                ├──→ failed
                ├──→ timed_out
                └──→ cancelled (human intervention)
```

### 10.3 Archival

| Condition | Action |
|-----------|--------|
| Completed instances > 90 days | Archive to cold storage |
| Failed instances > 30 days | Archive to cold storage |
| Pending instances > 7 days | Auto-cancel and archive |

---

> **End of WORKFLOW_ARCHITECTURE.md**  
> Next document: BUSINESS_PROCESS_MAP.md
