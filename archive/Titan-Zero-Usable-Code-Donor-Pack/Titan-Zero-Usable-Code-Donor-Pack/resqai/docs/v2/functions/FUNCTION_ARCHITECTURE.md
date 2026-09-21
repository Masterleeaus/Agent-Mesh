# RESQAI V2 — Function Architecture

> Phase 1.5 — Architecture Only  
> Principal Integration Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Architecture Principles](#1-architecture-principles)
2. [Function Execution Model](#2-function-execution-model)
3. [Function Classification](#3-function-classification)
4. [Idempotency and Retry](#4-idempotency-and-retry)
5. [Permissions and Security](#5-permissions-and-security)
6. [Event Integration](#6-event-integration)
7. [Error Handling](#7-error-handling)
8. [Performance Targets](#8-performance-targets)
9. [Testing Strategy](#9-testing-strategy)
10. [Function Lifecycle](#10-function-lifecycle)

---

## 1. Architecture Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Deterministic by Default** | Functions produce the same output for the same input. Side effects are explicit and logged. |
| 2 | **Single Responsibility** | Each function performs exactly one business operation. Composite logic belongs in workflows. |
| 3 | **Event-Conscious** | Every function that mutates state emits exactly one domain event after successful execution. |
| 4 | **Idempotent** | Replaying the same input produces the same result. Side effects are guarded by idempotency keys. |
| 5 | **Stateless** | Functions hold no in-memory state between invocations. All state is in the database or event bus. |
| 6 | **Fail Fast** | Functions validate inputs upfront. Invalid inputs are rejected immediately with clear error messages. |
| 7 | **Audited by Default** | Every mutation is recorded in `audit_log_v2` with before/after state, actor, and correlation_id. |
| 8 | **Connector-Agnostic** | Functions never call external APIs directly. All external communication goes through connectors. |
| 9 | **Max 5s Runtime** | Functions must complete within 5 seconds. Longer operations are designed as workflows. |
| 10 | **V1 Backward Compatible** | V2 functions coexist with V1. The `_v2` naming convention prevents conflicts. |

---

## 2. Function Execution Model

### 2.1 Execution Flow

```
WORKFLOW / AGENT / APP / EVENT
    │
    ▼
┌───────────────────────────────────────────┐
│  Function Invocation                        │
│                                             │
│  1. Validate input against input schema     │
│  2. Check idempotency key (if provided)     │
│  3. Acquire database connection             │
│  4. Read required data from tables          │
│  5. Execute business logic                  │
│  6. Write mutations (if any)                │
│  7. Write audit log entry                   │
│  8. Emit domain event (if mutation)         │
│  9. Return structured output                │
└───────────────────────────────────────────┘
    │
    ▼
WORKFLOW (continues to next node)
```

### 2.2 Invocation Sources

| Source | How | Example |
|--------|-----|---------|
| **Workflow Node** | FUNCTION node type in workflow graph definition | `ticket-intake_v2` calls `check-ticket-urgency` |
| **Agent** | Agent function-calling capability | `crm-account-health-monitor_v2` calls `account-health-scan-v2` |
| **Application** | Direct API call from app backend | `support-center_v2` calls `validate-ticket-input` |
| **Event Handler** | Event subscription triggers function | `ticket.created` triggers `validate-ticket-input` |

### 2.3 Output Contract

Every function returns:

```json
{
  "status": "success" | "error" | "not_found",
  "data": { ... },
  "error": null | { "code": "ERROR_CODE", "message": "Human-readable message" },
  "event_emitted": null | { "name": "event.name", "id": "uuid" },
  "audit_id": null | "uuid",
  "duration_ms": 123
}
```

---

## 3. Function Classification

### 3.1 Types

| Type | Description | Side Effects | Emits Events | Examples |
|------|-------------|:------------:|:------------:|----------|
| **DETERMINISTIC** | Pure logic, no DB or external calls | None | No | `check-ticket-urgency`, `calculate-sla-tier` |
| **READER** | Read-only database queries | None | No | `fetch-upcoming-appointments`, `collect-resolved-tickets` |
| **WRITER** | Database mutations with validation | Writes to 1+ tables | Yes | `update-ticket-record`, `resolve-dispute` |
| **AGGREGATOR** | Computes derived data from multiple sources | Writes to derived tables | Yes | `account-health-scan`, `generate-standup-report` |
| **TRANSFORMER** | Transforms data formats | None | No | `render-notification-template` |
| **ORCHESTRATOR** | Calls sub-functions or connectors | Varies | Yes | `dispatch-notifications`, `provision-user` |

### 3.2 Domain Grouping

| Domain | Functions | Count |
|--------|-----------|:-----:|
| **Ticket** | validate-ticket-input, check-ticket-urgency, update-ticket-record, classify-ticket-sla-tier, check-sla-deadline, batch-sla-check, collect-resolved-tickets | 7 |
| **Appointment** | assign-appointment-technician, fetch-upcoming-appointments, schedule-appointment-reminders, check-reminder-window, calculate-dispatch-priority | 5 |
| **Dispatch** | finalize-dispatch, dispatch-notifications | 2 |
| **Work Order** | create-work-order, update-work-order-stage, complete-work-order | 3 |
| **Dispute** | resolve-dispute | 1 |
| **CRM** | account-health-scan, update-account-health-status, flag-slipping-followups, create-followup-tasks, finalize-slippage-review, generate-account-score | 6 |
| **Customer Experience** | process-feedback-survey, analyze-feedback-sentiment | 2 |
| **Knowledge** | extract-knowledge-gap, search-knowledge-articles, suggest-knowledge-article | 3 |
| **Notification** | render-notification-template, dispatch-notifications, process-notification-delivery | 3 |
| **Operations** | create-operations-tasks, generate-standup-report | 2 |
| **Reporting** | generate-report-data, send-report | 2 |
| **Analytics** | sync-events-analytics, calculate-metric-trend, batch-metric-aggregation | 3 |
| **Administration** | provision-user, deactivate-user, validate-config-change, apply-config-change, log-audit-event | 5 |
| **Inventory** | check-inventory-level, reorder-inventory, record-inventory-transaction | 3 |
| **Security** | validate-permissions, generate-api-token, rotate-credentials | 3 |
| **Automation** | verify-workflow-health, recover-workflow-instance, reset-circuit-breaker | 3 |
| **Quality** | evaluate-quality-score, flag-quality-violation | 2 |

**Total: ~53 functions across 17 domains**

---

## 4. Idempotency and Retry

### 4.1 Idempotency Strategy

| Function Type | Idempotency Key | TTL | Implementation |
|---------------|----------------|:---:|----------------|
| DETERMINISTIC | Input hash (implicit) | — | Same input always produces same output |
| READER | None needed | — | Reads are naturally idempotent |
| WRITER | `workflow_instance_id + node_id` | 24h | Check idempotency store before executing |
| AGGREGATOR | `scan_date + scan_type` | 7 days | Upsert pattern on scan records |
| ORCHESTRATOR | `correlation_id + function_name` | 1h | Check idempotency store before executing |

### 4.2 Retry Strategy

| Function Type | Max Retries | Backoff | Retry Condition |
|---------------|:-----------:|---------|-----------------|
| DETERMINISTIC | 0 | N/A | N/A (never fails deterministically) |
| READER | 2 | Linear: 1s, 3s | Connection timeout, transient DB error |
| WRITER | 3 | Exponential: 1s, 5s, 15s | Timeout, deadlock, serialization error |
| AGGREGATOR | 3 | Exponential: 1s, 5s, 15s | Timeout, connection error |
| ORCHESTRATOR | 2 | Linear: 5s, 15s | Connector timeout, transient error |

---

## 5. Permissions and Security

### 5.1 Access Control Model

Every function declares its required permissions in the function definition:

```json
{
  "permissions": {
    "tables": {
      "read": ["tickets_v2", "customers_v2"],
      "write": ["tickets_v2"]
    },
    "connectors": ["gmail", "twilio"],
    "functions": []
  }
}
```

### 5.2 Permission Levels

| Level | Scope | Examples |
|-------|-------|----------|
| **Read** | SELECT on specific tables | `fetch-upcoming-appointments` |
| **Write** | INSERT/UPDATE on specific tables | `update-ticket-record` |
| **Admin** | DDL, config, user management | `provision-user`, `apply-config-change` |
| **Connector** | Access to specific connector | `dispatch-notifications` (gmail, twilio) |

### 5.3 Runtime Enforcement

- Permissions are validated at deployment time (function.json)
- Runtime access checks by the Lemma platform
- Audit log records every table access (read + write)

---

## 6. Event Integration

### 6.1 Event Emission Contract

Every WRITER or AGGREGATOR function that completes successfully MUST emit a domain event.

| Function | Event Emitted | Payload |
|----------|---------------|---------|
| `update-ticket-record` | `ticket.status.changed` | `{ticket_id, old_status, new_status}` |
| `resolve-dispute` | `dispute.resolved` | `{dispute_id, resolution}` |
| `account-health-scan` | `account.health.changed` | `{account_id, old_health, new_health}` |
| `assign-appointment-technician` | `appointment.assigned` | `{appointment_id, technician_id}` |
| `finalize-dispatch` | `dispatch.completed` | `{dispatch_id, status}` |

### 6.2 Event Consumption

Functions that are triggered by events subscribe through the event bus:

| Event | Function(s) Triggered |
|-------|----------------------|
| `ticket.created` | `validate-ticket-input` |
| `notification.send` | `dispatch-notifications` |
| `inventory.transaction.recorded` | `check-inventory-level` |
| `system.config.change.requested` | `validate-config-change` |

---

## 7. Error Handling

### 7.1 Error Categories

| Category | Code | Example | Recovery |
|----------|:----:|---------|----------|
| **Validation** | `VALIDATION_ERROR` | Missing required field, invalid enum value | Return error immediately; no retry |
| **Not Found** | `NOT_FOUND` | Entity UUID does not exist | Return error; no retry |
| **Conflict** | `CONFLICT` | Optimistic lock failure, duplicate key | Retry with backoff |
| **Timeout** | `TIMEOUT` | Database query exceeds 5s | Retry with backoff |
| **Connector** | `CONNECTOR_ERROR` | External API unavailable | Retry; fallback channel |
| **Internal** | `INTERNAL_ERROR` | Unexpected exception | Log error; fail; escalate to workflow |

### 7.2 Error Response Format

```json
{
  "status": "error",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: customer_id",
    "details": { "field": "customer_id", "reason": "required" }
  },
  "event_emitted": null,
  "audit_id": null,
  "duration_ms": 4
}
```

### 7.3 Function-Level Escalation

| Condition | Escalation |
|-----------|------------|
| Retry count exhausted | Return error to caller (workflow/agent/app) |
| Connector permanently failed | Log failure, return degraded result |
| Data integrity violation | Log critical error, alert Platform Orchestrator AI |

---

## 8. Performance Targets

| Metric | Target | Measurement |
|--------|:------:|-------------|
| P50 latency | < 100ms | Per-function telemetry |
| P95 latency | < 500ms | Per-function telemetry |
| P99 latency | < 2s | Per-function telemetry |
| Max runtime | 5s | Hard timeout enforced by executor |
| Throughput per function | 100 req/s | Scaled horizontally |
| Error rate | < 1% | Rolling 1h window |
| Idempotency store hit rate | > 99% | Dedup before execution |

---

## 9. Testing Strategy

### 9.1 Test Levels

| Level | Scope | Tools |
|-------|-------|-------|
| **Unit** | Individual function, mocked dependencies | pytest + pytest-asyncio |
| **Integration** | Function + real database (V2 tables) | pytest + Lemma SDK test harness |
| **Event** | Function emits correct events | Event bus test consumer |
| **Idempotency** | Replay same input verifies same result | pytest parametrize with idempotency keys |
| **Performance** | Throughput and latency under load | k6 / Artillery |

### 9.2 Fixture Strategy

| Data Type | Source | Volume |
|-----------|--------|:------:|
| V2 schema | Migration scripts | Full schema |
| Test data | JSON fixtures in `tests/fixtures/` | 10-100 records per entity |
| Edge cases | Explicit edge case fixtures | Nulls, empty strings, extreme values |

---

## 10. Function Lifecycle

### 10.1 Definition Lifecycle

```
draft → active → deprecated → retired
```

| Phase | Description |
|-------|-------------|
| **draft** | Under development, not callable |
| **active** | Production, callable by workflows/agents/apps |
| **deprecated** | Replaced by newer version; existing callers warned |
| **retired** | Removed; callers will receive NOT_FOUND |

### 10.2 Versioning

- Functions use explicit version in their definition
- Callers specify required version range
- Breaking changes increment major version
- Additive changes increment minor version

---

> **End of FUNCTION_ARCHITECTURE.md**  
> Next document: FUNCTION_CATALOG.md
