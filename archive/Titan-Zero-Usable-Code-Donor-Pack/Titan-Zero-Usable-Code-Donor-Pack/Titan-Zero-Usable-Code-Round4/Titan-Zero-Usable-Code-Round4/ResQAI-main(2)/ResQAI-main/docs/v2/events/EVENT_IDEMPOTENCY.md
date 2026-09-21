# RESQAI V2 — Event Idempotency Strategy

> Phase B.3 — Enterprise Event Architecture  
> Chief Enterprise Event Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Idempotency Principles](#1-idempotency-principles)
2. [Idempotency Key Strategy](#2-idempotency-key-strategy)
3. [Idempotency by Event Category](#3-idempotency-by-event-category)
4. [Idempotency by Consumer](#4-idempotency-by-consumer)
5. [Deduplication Strategy](#5-deduplication-strategy)
6. [Conflict Resolution](#6-conflict-resolution)
7. [Idempotency Verification](#7-idempotency-verification)

---

## 1. Idempotency Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Every event has an idempotency key** | All events carry `idempotency_key` in their envelope |
| 2 | **At-least-once delivery requires idempotency** | Since events may be delivered multiple times, consumers must handle duplicates |
| 3 | **Idempotency is the consumer's responsibility** | Producers provide the key; consumers enforce idempotent processing |
| 4 | **Idempotency keys are unique per producer scope** | Producer + idempotency_key = globally unique |
| 5 | **Idempotency window matches event TTL** | Keys remain valid for the event's active TTL |
| 6 | **Replaying the same event produces the same result** | Idempotent processing guarantees identical outcome |

---

## 2. Idempotency Key Strategy

### 2.1 Idempotency Key Generation

Each producer generates idempotency keys following this format:

```
{producer_app}:{entity_type}:{entity_action}:{entity_id}:{timestamp_nonce}
```

### Key Component Examples

| Component | Description | Example |
|-----------|-------------|---------|
| `producer_app` | Producing application | `support-center_v2` |
| `entity_type` | Entity type | `ticket` |
| `entity_action` | Action performed | `status.changed` |
| `entity_id` | Entity identifier | `a1b2c3d4-...` |
| `timestamp_nonce` | Nanosecond precision OR UUID | `20260630T103000.123456789` |

### Complete Example

```
support-center_v2:ticket:status.changed:a1b2c3d4-1234-5678-9abc-def012345678:20260630T103000.123456789
```

### 2.2 Idempotency Key Enforcement

```
Event received at bus
    │
    ▼
┌─────────────────────────────────┐
│ Extract idempotency_key          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Check key in idempotency store  │
│ (Redis: SET NX with TTL)        │
└────────────┬────────────────────┘
             │
        ┌────┴────┐
        ▼         ▼
    ┌────────┐ ┌──────────┐
    │ New    │ │ Duplicate│
    │ key    │ │ key      │
    └────┬───┘ └────┬─────┘
         │          │
         ▼          ▼
    ┌────────┐  ┌───────────────────┐
    │Process │  │ Return cached     │
    │event   │  │ previous response │
    └────┬───┘  └───────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ Store result in      │
    │ idempotency cache    │
    └──────────────────────┘
```

### 2.3 Idempotency Cache

| Attribute | Value |
|-----------|-------|
| Cache Engine | Redis (or in-memory for consumers) |
| Key Format | `idempotency:{idempotency_key}` |
| Value | Processed result/status |
| TTL | Matches event TTL (7 days default) |
| Atomicity | `SET NX` (set if not exists) |
| Eviction | LRU when cache full |

---

## 3. Idempotency by Event Category

### 3.1 Idempotency Key Source

| Event Category | Idempotency Key Source | Key Uniqueness Guarantee |
|---------------|------------------------|-------------------------|
| Application Events | Producer app + entity_id + action + timestamp | High (timestamp nonce) |
| Database Events | Table + entity_id + operation + LSN | Absolute (DB log sequence) |
| System Events | Producer + instance_id + event_type | High (instance UUID) |
| Business Events | Workflow instance_id + node_id + output_event | Absolute (workflow instance) |
| Audit Events | audit_log_v2 row UUID | Absolute (DB primary key) |
| Notification Events | notification_id + channel | High (UUID) |
| Integration Events | Integration_id + external_event_id | Medium (dedup by external ID) |
| Security Events | session_id + event_type + timestamp | High (session scoping) |
| User Events | user_id + event_type + timestamp | High (user scoping) |

### 3.2 Event Categories — Deduplication Window

| Category | Dedup Window | Storage | Notes |
|----------|:-----------:|---------|-------|
| Application Events | 7 days | Redis | Matches event TTL |
| Database Events | 7 days | Redis | Matches partition retention |
| System Events | 30 days | Redis | Longer for monitoring |
| Business Events | 7 days | Redis | Standard business window |
| Audit Events | 1 year | DB unique constraint | Compliance requirement |
| Notification Events | 24 hours | Redis | Fast delivery window |
| Integration Events | 7 days | Redis | External dedup support |
| Security Events | 90 days | DB unique constraint | Security audit requirement |
| User Events | 90 days | DB unique constraint | User activity audit |

---

## 4. Idempotency by Consumer

### 4.1 Consumer Idempotency Strategy

| Consumer Type | Strategy | Mechanism |
|--------------|----------|-----------|
| **Workflow** | Event-level dedup + node-level idempotency | workflow_instance_id + unique_key per node |
| **Application (direct)** | Database unique constraint | event_id as unique key in processing log |
| **Analytics (read-only)** | Idempotent by nature (read-only) | No special handling needed |
| **Notification** | notification_id dedup | notification_id is unique delivery key |
| **Function** | Input-based idempotency | workflow_instance_id + node_id + input_hash |

### 4.2 Workflow Node Idempotency

| Node Type | Idempotency Key | Scope |
|-----------|----------------|-------|
| AGENT | workflow_instance_id + node_id + agent_invocation_id | Instance |
| FUNCTION | workflow_instance_id + node_id + input_hash | 24h |
| HUMAN | approval_request_id | Instance |
| EVENT | event_id (enforced by bus) | 7 days |
| SUBWORKFLOW | child_workflow_id | 7 days |
| DECISION | workflow_instance_id + node_id + variables_hash | Instance |
| TRANSFORM | workflow_instance_id + node_id + input_hash | Instance |

### 4.3 Consumer Idempotency Matrix

| Category | Dedup at Bus | Dedup at Consumer | DB-Level Guard |
|----------|:-----------:|:-----------------:|:--------------:|
| ticket.* | ● | ○ | ● (event_id unique) |
| appointment.* | ● | ○ | ● (event_id unique) |
| operation.* | ● | ○ | ● (event_id unique) |
| job.* | ● | ○ | ○ (idempotency_key) |
| resolution.* | ● | ○ | ● (event_id unique) |
| account.* | ● | ○ | ● (event_id unique) |
| analytics:* | ● | — | — (read-only) |
| user.* | ● | ○ | ● (event_id unique) |
| system.* | ● | ● | ○ instance_id |
| notification.* | ● | ● | ● notification_id |
| integration.* | ● | ○ | ○ external_id |
| security.* | ● | ● | ● event_id unique |

---

## 5. Deduplication Strategy

### 5.1 Two-Layer Dedup

```
Layer 1: Event Bus (Network-level)
═══════════════════════════════════
  Mechanism: Redis SET NX with idempotency_key
  Scope: Global across all consumers
  TTL: Event TTL (7 days default)
  Purpose: Prevent duplicate delivery to bus subscribers

Layer 2: Consumer (Application-level)
═══════════════════════════════════════
  Mechanism: DB unique constraint on (event_id, consumer_id)
  Scope: Per consumer instance
  TTL: Permanent (for audit)
  Purpose: Prevent duplicate processing after delivery
```

### 5.2 Dedup at Event Bus Level

```
1. Producer sends event with idempotency_key
2. Bus checks: SET idempotency:{key} = event_id NX EX {TTL}
   ├── OK (key is new) → Route to consumers
   └── Fail (key exists) → Return cached status to producer
```

### 5.3 Dedup at Consumer Level

```
1. Consumer receives event
2. Consumer checks: INSERT INTO processing_log (event_id, consumer_id, status)
   ├── OK (unique) → Process event
   └── Duplicate key → Skip processing, return cached result
3. After processing: UPDATE processing_log SET status = 'completed', result = {...}
```

---

## 6. Conflict Resolution

### 6.1 Event Ordering Guarantees

| Ordering Level | Guarantee | Scope |
|---------------|-----------|-------|
| **Strict Ordering** | Events for same entity_id delivered in create order | Per entity_id |
| **Partial Ordering** | Events within same correlation_id delivered in order | Per correlation_id |
| **No Ordering** | Events for different entities have no ordering guarantee | Global |

### 6.2 Last-Write-Wins (LWW) Strategy

For events where ordering may be lost (e.g., `technician.status.changed`):

| Event | Strategy | Resolution |
|-------|----------|------------|
| status.changed (any) | Last-write-wins | Use `changed_at` timestamp; latest wins |
| Entity Updated | Last-write-wins | Use `updated_at` timestamp; latest wins |
| Entity Deleted | Delete wins | Delete takes precedence over update |
| Entity Created | Create wins (idempotent) | Ignore duplicate create if entity exists |

### 6.3 Optimistic Concurrency

For events that modify the same entity concurrently:

```
1. Event arrives with entity_version = 5
2. Consumer checks: current version == 5?
   ├── YES → Apply change, increment to version 6
   └── NO  → Reject event (stale version), return error
3. Producer retries with updated version
```

---

## 7. Idempotency Verification

### 7.1 Producer Verification

Producers should verify idempotency before resending:

```json
{
  "check": "idempotency:{key} exists?",
  "if_exists": "Return cached result (do not resend)",
  "if_not_exists": "Send new event (first attempt)"
}
```

### 7.2 Consumer Verification

Consumers should verify that processing is idempotent:

```json
{
  "check": "processing_log: event_id + consumer_id exists?",
  "if_exists": "Return cached processing result",
  "if_not_exists": "Process event, store result"
}
```

### 7.3 Idempotency Testing

| Test | Description | Expected Result |
|------|-------------|-----------------|
| **Send event twice** | Same event sent with same idempotency_key | Second send idempotently ignored |
| **Send with same key, different payload** | Same key, different body | Rejected (key already mapped to different payload) |
| **Send with different key, same payload** | Different key, same body | Processed as second event (allowed) |
| **Consumer crash and replay** | Event delivered, consumer crashes, event redelivered | Processed idempotently |
| **Late delivery** | Event delivered after idempotency window expires | Processed as new event |
| **Cross-consumer dedup** | Same event delivered to two different consumers | Each consumer processes independently |

---

> **End of EVENT_IDEMPOTENCY.md**
