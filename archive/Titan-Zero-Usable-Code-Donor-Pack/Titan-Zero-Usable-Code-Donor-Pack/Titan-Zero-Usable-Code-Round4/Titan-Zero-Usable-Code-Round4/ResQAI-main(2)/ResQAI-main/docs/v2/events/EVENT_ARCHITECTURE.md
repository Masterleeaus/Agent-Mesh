# RESQAI V2 — Event Architecture

> Phase 1.5 — Architecture Only  
> Principal Integration Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Architecture Principles](#1-architecture-principles)
2. [Event Bus Topology](#2-event-bus-topology)
3. [Delivery Guarantees](#3-delivery-guarantees)
4. [Schema Registry](#4-schema-registry)
5. [Event Routing](#5-event-routing)
6. [Event Bus Infrastructure](#6-event-bus-infrastructure)
7. [Dead Letter Queue & Retry](#7-dead-letter-queue--retry)
8. [Event Ordering](#8-event-ordering)
9. [Security & Compliance](#9-security--compliance)

---

## 1. Architecture Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Event-Carried State Transfer** | Events carry enough context for consumers to act without querying the producer |
| 2 | **At-Least-Once Delivery** | Every event is delivered at least once; consumers handle deduplication via idempotency keys |
| 3 | **Exactly-Once Emission** | Producers emit each state transition exactly once (idempotency at the source) |
| 4 | **Immutable Events** | Once emitted, events are never modified or deleted |
| 5 | **Ordered Per Entity** | Events for the same entity ID are delivered in publication order |
| 6 | **Asynchronous by Default** | Producers do not wait for consumer processing (fire-and-forget with delivery guarantee) |
| 7 | **Schema-First** | Every event type has a registered schema in the Schema Registry; schema changes are backwards-compatible |
| 8 | **Correlated by Design** | Every event carries a `correlation_id` that links it to the originating workflow or request |

---

## 2. Event Bus Topology

### 2.1 Topology Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      EVENT BUS (Lemma Events)                       │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │  Domain       │    │  Domain       │    │  Domain       │           │
│  │  Event Topic  │    │  Event Topic  │    │  Event Topic  │           │
│  │  (ticket.*)   │    │  (appt.*)     │    │  (dispatch.*) │           │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘           │
│         │                   │                   │                    │
│         ▼                   ▼                   ▼                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Event Router (fan-out)                     │   │
│  │  Matches event to subscribers, routes with correlation ID    │   │
│  └──────────┬──────────┬──────────┬──────────┬─────────────────┘   │
│             │          │          │          │                      │
│             ▼          ▼          ▼          ▼                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐                 │
│  │WF    │ │Agent │ │Func  │ │Notif │ │Analytics │                 │
│  │Queue │ │Queue │ │Queue │ │Queue │ │Queue     │                 │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Topic Structure

| Topic | Event Types | Partition Key | Retention |
|-------|-------------|---------------|-----------|
| `ticket` | ticket.* | ticket_id | 7 days |
| `appointment` | appointment.* | appointment_id | 7 days |
| `dispatch` | dispatch.* | dispatch_id | 7 days |
| `work_order` | work_order.* | work_order_id | 7 days |
| `dispute` | dispute.* | dispute_id | 7 days |
| `account` | account.* | account_id | 7 days |
| `followup` | followup.* | followup_id | 7 days |
| `task` | task.* | task_id | 7 days |
| `customer` | customer.* | customer_id | 30 days |
| `technician` | technician.* | technician_id | 7 days |
| `feedback` | feedback.* | feedback_id | 7 days |
| `notification` | notification.* | notification_id | 3 days |
| `user` | user.* | user_id | 30 days |
| `system` | system.* | N/A (broadcast) | 7 days |

### 2.3 Global Event Log

All events from all topics are also written to `events_v2` table for:
- Audit trail
- Debugging and replay
- Analytics ingestion
- Workflow recovery

---

## 3. Delivery Guarantees

### 3.1 Producer Guarantee: Exactly-Once Emission

| Mechanism | Implementation |
|-----------|----------------|
| **Idempotency Key** | Producer includes `idempotency_key` in event metadata |
| **Deduplication** | Event bus rejects duplicate idempotency keys within TTL window |
| **Outbox Pattern** | WRITER functions write event to `events_v2` table in same transaction as mutation |
| **Async Emitter** | Separate process reads `events_v2` table and publishes to event bus topics |

### 3.2 Consumer Guarantee: At-Least-Once Delivery

| Mechanism | Implementation |
|-----------|----------------|
| **Consumer Offset** | Each consumer tracks its last processed event offset per topic |
| **Auto-Retry** | Transient failures trigger automatic retry (3 attempts, exponential backoff) |
| **Manual Acknowledgment** | Consumer must explicitly acknowledge after successful processing |
| **Redelivery** | Unacknowledged events are redelivered after timeout |

### 3.3 Consumer-Side Idempotency

Every event-consuming component (workflow, agent, function) MUST handle duplicate events:

| Consumer Type | Idempotency Strategy |
|---------------|----------------------|
| **Workflow** | `correlation_id` prevents duplicate workflow instantiation |
| **Agent** | Event `id` stored in agent memory; skip if already processed |
| **Function** | `workflow_instance_id + node_id` key prevents duplicate execution |
| **Notification** | `correlation_id + notification_type` prevents duplicate sends |

---

## 4. Schema Registry

### 4.1 Registry Structure

Each event type has a registered schema stored in `system_settings_v2` as JSON Schema:

```json
{
  "event": "ticket.status.changed",
  "version": 1,
  "schema": {
    "type": "object",
    "required": ["entity", "data"],
    "properties": {
      "entity": {
        "type": "object",
        "required": ["type", "id"],
        "properties": {
          "type": { "type": "string", "enum": ["ticket"] },
          "id": { "type": "string", "format": "uuid" }
        }
      },
      "data": {
        "type": "object",
        "required": ["previous_status", "new_status", "changed_by"],
        "properties": {
          "previous_status": { "type": "string" },
          "new_status": { "type": "string" },
          "changed_by": { "type": "string" },
          "reason": { "type": "string" }
        }
      }
    }
  },
  "compatibility": "BACKWARD",
  "created_at": "2026-06-28T00:00:00Z",
  "deprecated": false
}
```

### 4.2 Compatibility Rules

| Rule | Description |
|------|-------------|
| **BACKWARD** (default) | New schema can read data written with old schema (only adds optional fields) |
| **FORWARD** | Old schema can read data written with new schema (only removes fields) |
| **FULL** | Both backward and forward compatible |

### 4.3 Schema Evolution Process

```
1. Developer proposes schema change
2. Change validated against compatibility rule
3. New schema version registered (incremented)
4. Old schema marked as deprecated (not rejected)
5. Consumers migrate within deprecation window (7 days)
6. Old schema retired after migration window
```

---

## 5. Event Routing

### 5.1 Subscription Registry

The Event Router maintains a subscription registry that maps event types to consumers:

```json
{
  "event_type": "ticket.created",
  "subscriptions": [
    { "consumer": "workflow:ticket-intake_v2", "mode": "synchronous" },
    { "consumer": "agent:support-request-classifier_v2", "mode": "asynchronous" },
    { "consumer": "analytics:event-ingest", "mode": "batch" }
  ]
}
```

### 5.2 Routing Modes

| Mode | Description | Latency | Use Case |
|------|-------------|:-------:|----------|
| **synchronous** | Event delivered immediately; consumer processes inline | <100ms | Workflow triggers |
| **asynchronous** | Event queued; consumer processes when ready | <500ms | Agent invocations |
| **batch** | Events collected and delivered in batches | <5min | Analytics ingestion |

### 5.3 Routing Rules

| Rule | Description |
|------|-------------|
| **1:N Fan-out** | One event type can trigger multiple consumers |
| **Content-based** | Events routed differently based on payload content (e.g., ticket.created[urgent] → urgent-dispatch) |
| **Priority lanes** | Critical events (escalation, breach, emergency) get priority queue |
| **Dead Letter** | Events that fail all retry attempts go to DLQ for manual inspection |

---

## 6. Event Bus Infrastructure

### 6.1 Component Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Event Bus** | Lemma Events (built-in) | Topic-based publish/subscribe |
| **Event Store** | events_v2 table | Persistent event log for replay and audit |
| **Schema Registry** | system_settings_v2 | JSON Schema storage per event type |
| **Event Router** | automation-event-router_v2 (agent) | Match events to subscribers with routing rules |
| **Subscription Registry** | system_settings_v2 | Map event types to consumer subscriptions |
| **DLQ** | events_v2 (dlq_flag) | Store permanently failed events |
| **Metrics** | analytics_reports_v2 | Event throughput, latency, error rate |

### 6.2 Event Envelope

Every event published to the bus follows this structure:

```json
{
  "event_name": "ticket.status.changed",
  "version": 1,
  "emitted_at": "2026-06-28T12:00:00Z",
  "correlation_id": "corr_abc123",
  "idempotency_key": "wf_xyz_node_3_attempt_1",
  "producer": {
    "app": "support-center_v2",
    "actor_type": "user",
    "actor_id": "user_xyz456",
    "function": "update-ticket-record"
  },
  "entity": {
    "type": "ticket",
    "id": "ticket_uuid_here"
  },
  "data": { ... },
  "metadata": {
    "schema_version": 1,
    "size_bytes": 512,
    "produced_ms": 42
  }
}
```

---

## 7. Dead Letter Queue & Retry

### 7.1 Retry Chain

```
Event Published
    │
    ▼
Route to subscriber
    │
    ▼
┌─────────────────┐
│  Retry Loop      │  Max 3 attempts
│  Backoff: 1,5,15s│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Success    Fail × 3
              │
              ▼
         ┌─────────┐
         │   DLQ    │
         │ (flagged)│
         └────┬────┘
              │
              ▼
      automation-manager_v2
      reviews DLQ daily
```

### 7.2 DLQ Handling

| Event Type | DLQ Action | Recovery |
|------------|------------|----------|
| **ticket.*** | Notify support-manager_v2 | Manual replay or skip |
| **appointment.*** | Notify appointment-manager_v2 | Manual intervention |
| **dispatch.*** | Notify dispatch-manager_v2 | Re-dispatch via alternative channel |
| **notification.*** | Notify notification-manager_v2 | Fallback channel |
| **system.*** | Notify admin-manager_v2 | Immediate investigation |

---

## 8. Event Ordering

### 8.1 Ordering Guarantees

| Scope | Guarantee | Implementation |
|-------|-----------|----------------|
| **Per entity** | Strict ordering | Partition key = entity_id within topic |
| **Cross-entity** | No ordering guarantee | Events for different entities can arrive in any order |
| **Cross-topic** | No ordering guarantee | Events across topics are independent |
| **Global** | No ordering guarantee | Consumers must handle out-of-order events |

### 8.2 Handling Out-of-Order Events

| Pattern | Description |
|---------|-------------|
| **Optimistic concurrency** | Events carry `entity_version`; outdated events are rejected |
| **State machine validation** | Consumers validate state transition is valid before processing |
| **Eventual consistency** | Cross-domain data is eventually consistent by design |
| **Compensating events** | If A then B arrives before B, B is processed and A is ignored |

---

## 9. Security & Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Event integrity** | Events are immutable once written to events_v2 |
| **Access control** | Events carry producer identity; consumers must have read permission on entity type |
| **Audit trail** | Every event is recorded in events_v2 with full provenance |
| **PII handling** | Events from `customer.*` and `user.*` topics carry PII classification; consumers must comply with data retention policies |
| **Data retention** | Topic retention as defined in [Section 2.2](#22-topic-structure); events_v2 records are retained per compliance policy |
| **Schema validation** | Every event is validated against its registered schema before publication |

---

> **End of EVENT_ARCHITECTURE.md**  
> Next document: EVENT_CATALOG.md
