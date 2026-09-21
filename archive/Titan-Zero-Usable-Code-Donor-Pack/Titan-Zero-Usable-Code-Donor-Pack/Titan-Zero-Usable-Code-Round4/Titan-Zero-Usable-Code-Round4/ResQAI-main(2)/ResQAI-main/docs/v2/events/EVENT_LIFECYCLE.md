# RESQAI V2 — Event Lifecycle Management

> Phase B.3 — Enterprise Event Architecture  
> Chief Enterprise Event Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Event Lifecycle States](#1-event-lifecycle-states)
2. [Event State Machine](#2-event-state-machine)
3. [Event Storage & Retention](#3-event-storage--retention)
4. [Event Archival & Purging](#4-event-archival--purging)
5. [Event TTL Policies](#5-event-ttl-policies)
6. [Event Monitoring](#6-event-monitoring)
7. [Event Governance](#7-event-governance)

---

## 1. Event Lifecycle States

Every event produced in the system progresses through a defined lifecycle:

```
CREATED ──► QUEUED ──► ROUTED ──► DELIVERED ──► CONSUMED ──► ARCHIVED
                              │
                              ├──► FAILED ──► DEAD_LETTER
                              │
                              └──► EXPIRED
```

### State Definitions

| State | Description | Valid Transitions |
|-------|-------------|-------------------|
| **CREATED** | Event produced by source, validation passed | → QUEUED, → FAILED |
| **QUEUED** | Event accepted by bus, waiting for routing | → ROUTED, → EXPIRED |
| **ROUTED** | Event matched to consumers, in transit | → DELIVERED, → FAILED |
| **DELIVERED** | Event accepted by consumer | → CONSUMED, → FAILED |
| **CONSUMED** | Event successfully processed by all consumers | → ARCHIVED |
| **FAILED** | Event delivery or processing failed | → DEAD_LETTER, → QUEUED (retry) |
| **DEAD_LETTER** | Max retries exhausted | → ARCHIVED (after inspection) |
| **EXPIRED** | TTL exceeded before delivery | → ARCHIVED |
| **ARCHIVED** | Event stored for compliance, removed from active bus | — (terminal) |

---

## 2. Event State Machine

```
                            ┌──────────┐
                            │ CREATED  │
                            └────┬─────┘
                                 │ validation
                          ┌──────┴──────┐
                          ▼             ▼
                    ┌──────────┐   ┌──────────┐
                    │  QUEUED  │   │  FAILED  │
                    └────┬─────┘   └────┬─────┘
                  ┌──────┤             │
                  ▼      │         ┌───┴──────────┐
            ┌────────┐   │ TTL    │  Retry?       │
            │ ROUTED │   │ exceeded│  ──► yes ──► QUEUED
            └───┬────┘   │        │  ──► no  ──► DEAD_LETTER
                │        ▼        └──────────────┘
                ▼   ┌──────────┐
          ┌────────┐│ EXPIRED  │
          │DELIVERED│└──────────┘
          └────┬───┘       │
               │           │
          ┌────┴────┐      │
          ▼         ▼      │
    ┌────────┐  ┌──────┐   │
    │CONSUMED│  │FAILED│   │
    └────┬───┘  └──┬───┘   │
         │         │       │
         ▼         ▼       ▼
    ┌──────────────────────────┐
    │        ARCHIVED          │
    └──────────────────────────┘
```

### State Machine Rules

| Transition | Condition | Action |
|------------|-----------|--------|
| CREATED → QUEUED | Schema validation passes | Assign event_id, store in events_v2 |
| CREATED → FAILED | Schema validation fails | Log validation error, emit alert |
| QUEUED → ROUTED | Consumer routing resolved | Route to matched consumer queues |
| QUEUED → EXPIRED | TTL exceeded (7 days) | Move to EXPIRED, emit warning |
| ROUTED → DELIVERED | Consumer acknowledges receipt | Mark as delivered |
| ROUTED → FAILED | Consumer rejects or times out | Increment retry count |
| DELIVERED → CONSUMED | Consumer completes processing | Mark as consumed |
| DELIVERED → FAILED | Consumer reports processing error | Increment retry count |
| FAILED → QUEUED | Retry count < max_retries | Re-queue with backoff |
| FAILED → DEAD_LETTER | Retry count = max_retries | Move to dead letter queue |
| EXPIRED → ARCHIVED | — | Move to archive storage |
| DEAD_LETTER → ARCHIVED | Manual inspection complete | Move to archive |
| CONSUMED → ARCHIVED | Retention period met | Move to archive |

---

## 3. Event Storage & Retention

### 3.1 Active Storage (events_v2 table)

| Attribute | Value |
|-----------|-------|
| Storage Engine | PostgreSQL (events_v2 table) |
| Active Retention | 7 days |
| Max Rows | Unlimited (partitioned by month) |
| Partition Strategy | `created_at` monthly ranges |
| Indexes | event_name, (entity_type, entity_id), correlation_id, created_at DESC |

### 3.2 Event Partitions

```sql
-- Partition by month for query performance
CREATE TABLE events_v2_2026_06 PARTITION OF events_v2
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE events_v2_2026_07 PARTITION OF events_v2
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
```

### 3.3 Data Sizing Estimates

| Metric | Value |
|--------|-------|
| Events per day (avg) | ~376,500 |
| Events per day (peak) | ~500,000 |
| Avg event size (envelope + payload) | 2KB |
| Daily storage required | ~750 MB |
| Monthly storage required | ~22 GB |
| 7-day active storage | ~5 GB |
| 90-day warm archive | ~66 GB |
| 1-year cold archive | ~270 GB |

---

## 4. Event Archival & Purging

### 4.1 Archive Policy

| State | Active Storage | Warm Archive (S3/GCS) | Cold Archive (Glacier) | Permanent Deletion |
|-------|:-------------:|:---------------------:|:---------------------:|:------------------:|
| CONSUMED | 7 days | 90 days | 1 year | 7 years |
| FAILED | 7 days | 30 days | None | 7 years (if unrecoverable) |
| DEAD_LETTER | 30 days (for inspection) | 90 days | 1 year | 7 years |
| EXPIRED | None (immediate archive) | 30 days | None | 90 days |
| AUDIT events | 90 days | 1 year | 7 years | Never (compliance) |

### 4.2 Archive Process

```
Daily Archive Job (cron: 0 3 * * *)
    │
    ▼
┌─────────────────────────────────────┐
│ 1. Identify events past active TTL  │
│    WHERE created_at < NOW() - 7 days│
│    AND status IN ('consumed','expired','dead_letter') │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. Batch export to warm archive     │
│    Format: JSON Lines (.jsonl)      │
│    Compression: gzip                │
│    Partition: YYYY/MM/DD            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 3. Verify archive integrity         │
│    - Row count matches              │
│    - Checksum verification          │
│    - Sample validation              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 4. Delete from active storage       │
│    (soft delete: status = 'archived')│
└─────────────────────────────────────┘
```

### 4.3 Archive Schema (Warm Storage)

```json
{
  "archive_version": "2.0",
  "exported_at": "2026-07-01T03:00:00Z",
  "source_table": "events_v2",
  "partition": "2026/06/24",
  "row_count": 376500,
  "checksum": "sha256:abc123...",
  "events": ["..."],
  "compression": "gzip",
  "format": "jsonl"
}
```

---

## 5. Event TTL Policies

| Event Category | Active TTL | Routing TTL | Dead Letter TTL | Rationale |
|---------------|:----------:|:-----------:|:---------------:|-----------|
| Application Events | 7 days | 1 hour | 30 days | Standard business events |
| Database Events | 7 days | 1 hour | 7 days | Fast-moving DB state |
| System Events | 30 days | 5 minutes | 7 days | Monitoring needs longer |
| Business Events | 7 days | 30 minutes | 14 days | Business context needs |
| Audit Events | 365 days | N/A (direct) | N/A | Compliance requirement |
| Notification Events | 7 days | 10 minutes | 7 days | Fast delivery expected |
| Integration Events | 7 days | 1 hour | 14 days | External dependencies |
| Security Events | 90 days | 5 minutes | 7 days | Security audit needs |
| Lifecycle Events | 30 days | 5 minutes | 7 days | Infrequent events |
| User Events | 90 days | 1 hour | 7 days | User audit trail |

---

## 6. Event Monitoring

### 6.1 Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Event Production Rate | Events/second | > 1,000/sec sustained |
| Event Delivery Latency | Time from QUEUED to DELIVERED | Median > 500ms |
| Event Failure Rate | (FAILED / TOTAL) * 100 | > 1% |
| Dead Letter Rate | (DEAD_LETTER / TOTAL) * 100 | > 0.1% |
| Consumer Lag | Events queued but not delivered | > 10,000 per consumer |
| Expired Events | Events that expired before delivery | > 100/day |
| Event Bus Error Rate | Bus-level errors / second | > 1/sec |

### 6.2 Monitoring Dashboards

| Dashboard | Metrics | Audience |
|-----------|---------|----------|
| **Event Bus Health** | Production rate, latency, error rate, consumer lag | Ops, Automation |
| **Consumer Health** | Per-consumer: throughput, latency, failure rate | Automation, Workflow dev |
| **Dead Letter Queue** | Events in DLQ, age, source patterns | Automation, Admin |
| **Event Trends** | Event volume by type, peak patterns | Analytics |
| **Audit Compliance** | Audit event volume, archive status | Admin, Compliance |

---

## 7. Event Governance

### 7.1 Producer Governance

| Rule | Description |
|------|-------------|
| **Schema Registration** | All events must register a JSON Schema before production |
| **Version Declaration** | Every event must declare its schema version |
| **Idempotency Keys** | Every event must include a unique idempotency_key |
| **Correlation Chains** | Events in a business transaction must share correlation_id |
| **Max Payload Size** | 256KB per event payload |
| **Rate Limiting** | Max 10,000 events/minute per producer (configurable) |

### 7.2 Consumer Governance

| Rule | Description |
|------|-------------|
| **Subscription Required** | Consumers must register for events they consume |
| **ACK/NAK Protocol** | Consumers must ACK or NAK within 30 seconds |
| **Processing Deadline** | Consumers must process within 5 minutes of receipt |
| **Poison Events** | Events that fail 3 times are auto-dead-lettered |
| **Consumer Circuit Breaker** | 10+ consecutive failures pauses consumer automatically |

### 7.3 Event Bus Governance

| Rule | Description |
|------|-------------|
| **At-Least-Once Delivery** | Minimum delivery guarantee |
| **Ordered Per Entity** | Events for same entity_id delivered in order |
| **TTL Enforcement** | Events expired at TTL boundary |
| **Schema Validation** | All events validated at ingress |
| **Dead Letter Management** | DLQ inspected minimum every 24h |
| **Audit Trail** | All event bus state transitions audited |

### 7.4 Event Registry

```json
{
  "event_name": "ticket.created",
  "version": "1.0.0",
  "status": "active",
  "category": "application",
  "producer_app": "support-center_v2",
  "schema": "$ref: /schemas/events/ticket.created.v1.json",
  "consumers": ["ticket-auto-response_v2", "ticket-intake_v2", "sla-enforcement_v2"],
  "created_at": "2026-06-01T00:00:00Z",
  "deprecated_at": null,
  "retired_at": null,
  "owner_team": "support"
}
```

### 7.5 Deprecation Policy

| Phase | Duration | Description |
|-------|----------|-------------|
| **Active** | Indefinite | Normal operation |
| **Deprecated** | 90 days | New consumers must not subscribe; existing continue |
| **Sunset Warning** | 30 days before removal | Emit warnings on use |
| **Retired** | — | Event no longer produced; consumers must migrate |

---

> **End of EVENT_LIFECYCLE.md**
