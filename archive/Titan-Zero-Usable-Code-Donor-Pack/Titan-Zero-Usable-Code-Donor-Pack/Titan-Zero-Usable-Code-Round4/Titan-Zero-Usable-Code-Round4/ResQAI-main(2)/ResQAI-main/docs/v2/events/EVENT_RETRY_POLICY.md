# RESQAI V2 — Event Retry Policy

> Phase B.3 — Enterprise Event Architecture  
> Chief Enterprise Event Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Retry Strategy Overview](#1-retry-strategy-overview)
2. [Retry by Event Category](#2-retry-by-event-category)
3. [Retry by Consumer Type](#3-retry-by-consumer-type)
4. [Backoff Strategies](#4-backoff-strategies)
5. [Dead Letter Queue](#5-dead-letter-queue)
6. [Circuit Breaker](#6-circuit-breaker)
7. [Error Classification](#7-error-classification)
8. [Retry Metrics](#8-retry-metrics)

---

## 1. Retry Strategy Overview

### 1.1 Retry Decision Tree

```
Event delivery/processing fails
    │
    ▼
┌─────────────────────────────┐
│ Classify error              │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌──────────┐
│Retryable│  │ Non-      │
│error   │  │ retryable │
└────┬───┘  │ error    │
     │      └────┬─────┘
     ▼           ▼
┌────────┐  ┌──────────┐
│Apply   │  │ Dead     │
│retry   │  │ Letter   │
│policy  │  │ Queue    │
└───┬────┘  └──────────┘
    │
┌───┴──────────┐
│ Retry count  │
│ < max_retries│
└───┬──────────┘
    │
    ▼
┌─────────────────────────────┐
│ Apply backoff + re-queue    │
└─────────────────────────────┘
```

### 1.2 Retry Outcome Categories

| Outcome | Description | Handling |
|---------|-------------|----------|
| **Success** | Event processed successfully | Mark as CONSUMED |
| **Retryable Failure** | Temporary error (timeout, unavailable, throttle) | Retry with backoff |
| **Non-Retryable Failure** | Permanent error (validation, schema, logic) | Dead Letter Queue |
| **Poison Event** | Event that always fails processing | Dead Letter Queue after max retries |

---

## 2. Retry by Event Category

### 2.1 Application Events

| Event Domain | Max Retries | Retry On | Non-Retryable On |
|-------------|:-----------:|----------|------------------|
| ticket.* | 3 | Timeout, consumer unavailable | Schema validation fail, invalid state transition |
| appointment.* | 3 | Timeout, consumer unavailable | Invalid date/time, conflicting appointment |
| operation.* | 3 | Timeout, consumer unavailable | Invalid operation state |
| job.* | 3 | Timeout, offline sync | Invalid job state |
| resolution.* | 3 | Timeout, AI agent busy | Invalid dispute state |
| account.* | 3 | Timeout, DB contention | Invalid health transition |
| followup.* | 3 | Timeout | Missing account reference |
| feedback.* | 3 | Timeout | Invalid rating values |
| analytics:* | 2 | Resource contention | Invalid metric calculation |

### 2.2 Database Events

| Event Type | Max Retries | Retry On | Non-Retryable On |
|-----------|:-----------:|----------|------------------|
| Entity Created | 2 | DB timeout | Constraint violation |
| Entity Updated | 2 | DB timeout | Optimistic lock failure |
| Entity Deleted | 2 | DB timeout | Referential integrity error |
| Status Changed | 3 | DB timeout | Invalid status transition |
| Entity Assigned | 3 | DB timeout | Missing assignee reference |

### 2.3 System Events

| Event Type | Max Retries | Retry On | Non-Retryable On |
|-----------|:-----------:|----------|------------------|
| workflow.* | 5 | Orchestrator busy | Corrupted workflow instance |
| function.* | 3 | Runtime timeout | Non-existent function |
| agent.* | 3 | LLM timeout | Invalid agent configuration |
| system.config.* | 2 | DB contention | Invalid config value |
| system.health.* | 1 | — | (No retry — health alerts are time-sensitive) |

### 2.4 Business Events

| Event Type | Max Retries | Retry On | Non-Retryable On |
|-----------|:-----------:|----------|------------------|
| sla.* | 3 | Clock skew, timing | Invalid SLA tier |
| dispatch.* | 3 | Notification failure | Invalid dispatch target |
| work_order.* | 3 | Tech unavailable | Invalid work order state |
| dispute.* | 3 | AI timeout | Invalid dispute evidence |
| campaign.* | 2 | Notification failure | Invalid campaign target |
| cx.* | 2 | Scoring timeout | Invalid sentiment data |
| knowledge.* | 2 | DB timeout | Invalid article state |
| inventory.* | 2 | DB contention | Invalid quantity |
| standup.* | 1 | — | (Time-sensitive, no retry) |
| blocker.* | 2 | Notification failure | Invalid blocker definition |

### 2.5 Notification Events

| Event Type | Max Retries | Retry On | Non-Retryable On |
|-----------|:-----------:|----------|------------------|
| notification.send | 3 | Provider unavailable, rate limited | Invalid recipient, invalid template |
| notification.sent | 1 | — | (Informational, no retry) |
| notification.delivered | 1 | — | (Informational, no retry) |
| notification.failed | 2 | Provider recovery | Invalid error classification |

### 2.6 Integration Events

| Event Type | Max Retries | Retry On | Non-Retryable On |
|-----------|:-----------:|----------|------------------|
| integration.* | 3 | Network timeout, provider 5xx | Auth failure, invalid request |
| integration.webhook.* | 3 | Processing timeout | Invalid payload format |

### 2.7 Security Events

| Event Type | Max Retries | Retry On | Non-Retryable On |
|-----------|:-----------:|----------|------------------|
| security.* | 1 | — | (Security events are time-sensitive, no retry) |

### 2.8 Lifecycle Events

| Event Type | Max Retries | Retry On | Non-Retryable On |
|-----------|:-----------:|----------|------------------|
| lifecycle.* | 2 | DB contention | Invalid lifecycle transition |

---

## 3. Retry by Consumer Type

### 3.1 Workflow Consumers

| Consumer | Max Retries | Retry On | Notes |
|----------|:-----------:|----------|-------|
| ticket-auto-response_v2 | 2 | FAQ lookup timeout | Fast response expected |
| ticket-intake_v2 | 3 | AI classification timeout | Complex classification |
| ticket-escalation_v2 | 3 | Assignment service down | Critical path |
| sla-enforcement_v2 | 3 | Timer service busy | Time-sensitive |
| appointment-booking_v2 | 3 | Scheduling engine busy | Customer-facing |
| appointment-reminders_v2 | 3 | Notification service down | Time-sensitive delivery |
| appointment-completion_v2 | 2 | Work order creation timeout | Post-service flow |
| standard-dispatch_v2 | 3 | Technician lookup timeout | Operational |
| urgent-dispatch_v2 | 5 | Any failure | **Critical path — aggressive retry** |
| dispute-resolution_v2 | 3 | AI analysis timeout | Customer-facing |
| notification-delivery_v2 | 3 | Provider unavailable | Outbound communication |
| workflow-health-monitor_v2 | 1 | — | (Time-sensitive) |

### 3.2 Application Consumers

| Consumer | Max Retries | Retry On | Notes |
|----------|:-----------:|----------|-------|
| All apps (direct) | 2 | DB timeout, network | Default for app-internal events |
| Event Bus subscribers | 3 | Consumer unavailable | Default for async events |

---

## 4. Backoff Strategies

### 4.1 Backoff Types

| Strategy | Formula | Usage | Example |
|----------|---------|-------|---------|
| **Immediate** | Delay = 0s | Low-latency events | Notification events |
| **Fixed** | Delay = N seconds | Simple retry | Database events, audit |
| **Exponential** | Delay = base * 2^n | Full backoff with log | Application, business events |
| **Exponential + Jitter** | Delay = random(base * 2^n, base * 2^(n+1)) | Thundering herd prevention | System events, critical path |
| **Linear** | Delay = N * attempt | Predictable spacing | Integration events |
| **Custom** | Pre-defined array | Fine-grained control | Workflow events |

### 4.2 Retry Schedule Table

| Attempt | Immediate | Fixed (5s) | Expo (1s) | Expo+Jitter (2s) | Linear (10s) | Custom |
|:-------:|:---------:|:----------:|:---------:|:-----------------:|:------------:|:------:|
| 1 | 0s | 5s | 1s | 2-4s | 10s | 5s |
| 2 | 0s | 5s | 2s | 4-8s | 20s | 15s |
| 3 | 0s | 5s | 4s | 8-16s | 30s | 30s |
| 4 | — | — | 8s | 16-32s | — | 60s |
| 5 | — | — | 16s | 32-64s | — | 120s |

### 4.3 Retry Schedule by Category

| Category | Strategy | Base | Max Backoff | Total Max Retry Time |
|----------|----------|:----:|:----------:|:-------------------:|
| Application Events | Exponential | 1s | 30s | ~60s (3 retries) |
| Database Events | Fixed | 2s | 2s | ~6s (3 retries) |
| System Events | Exponential+Jitter | 2s | 60s | ~2min (5 retries) |
| Business Events | Exponential | 1s | 15s | ~30s (3 retries) |
| Notification Events | Immediate | 0s | 0s | ~0s (3 retries) |
| Integration Events | Linear | 10s | 30s | ~60s (3 retries) |
| Security Events | No retry | — | — | 0s |
| Lifecycle Events | Fixed | 5s | 5s | ~10s (2 retries) |
| Critical Path (urgent) | Exponential+Jitter | 2s | 120s | ~4min (5 retries) |

---

## 5. Dead Letter Queue

### 5.1 Dead Letter Queue Rules

| Rule | Description |
|------|-------------|
| **Trigger** | Event fails after max retries OR non-retryable error |
| **Storage** | Dedicated dead_letter_events table |
| **Retention** | 30 days for inspection, then auto-archive |
| **Notification** | Alert sent to admin/automation when DLQ size > 100 |
| **Replay** | Events can be manually replayed from DLQ |
| **Inspection** | Web UI for browsing, filtering, and replaying DLQ events |

### 5.2 Dead Letter Categories

| Category | Description | Resolution |
|----------|-------------|------------|
| **Schema Violation** | Payload failed validation | Fix producer or schema; replay |
| **Resource Not Found** | Referenced entity missing | Create missing resource; replay |
| **Transient Exhausted** | Max retries on temporary failure | Check infrastructure; replay |
| **Poison Message** | Event always fails processing | Investigate and fix or discard |
| **Consumer Unavailable** | Consumer permanently offline | Restore consumer; replay |
| **Logic Error** | Consumer has bug processing event | Fix consumer; replay |

### 5.3 Dead Letter Event Schema

```json
{
  "dead_letter_id": "uuid",
  "original_event_id": "uuid",
  "event_name": "string",
  "original_payload": {},
  "failure_reason": "string",
  "failure_category": "string",
  "retry_count": "integer",
  "last_error": "string",
  "last_error_at": "datetime",
  "consumer_name": "string",
  "producer_app": "string",
  "entered_dlq_at": "datetime",
  "status": "pending_review | replayed | discarded | archived"
}
```

---

## 6. Circuit Breaker

### 6.1 Circuit Breaker States

```
CLOSED (normal operation)
    │
    │  consecutive_failures > threshold
    ▼
OPEN (rejecting requests)
    │
    │  timeout elapsed
    ▼
HALF_OPEN (probing)
    │
    ├── success → CLOSED
    └── failure → OPEN (reset timeout)
```

### 6.2 Circuit Breaker Configuration

| Parameter | Default | Description |
|-----------|:-------:|-------------|
| failure_threshold | 10 | Consecutive failures before OPEN |
| timeout_ms | 30,000 | Time before HALF_OPEN |
| half_open_max_requests | 3 | Successful probes to reset |
| success_threshold | 5 | Consecutive successes before CLOSED |

### 6.3 Circuit Breaker by Consumer

| Consumer | Threshold | Timeout | Notes |
|----------|:---------:|:------:|-------|
| ticket-intake_v2 | 10 | 30s | AI service flapping protection |
| dispute-resolution_v2 | 5 | 60s | AI analysis flapping protection |
| notification-delivery_v2 | 20 | 60s | Provider cascade failure |
| urgent-dispatch_v2 | 3 | 15s | Critical path — fast circuit |
| Integration consumers | 5 | 120s | External dependency failure |

---

## 7. Error Classification

### 7.1 Retryable Errors

| Error Code | Description | Retry Strategy |
|-----------|-------------|----------------|
| `TIMEOUT` | Operation exceeded time limit | Exponential backoff |
| `UNAVAILABLE` | Service temporarily unavailable | Exponential backoff |
| `RATE_LIMITED` | Producer/consumer rate limit hit | Linear backoff with jitter |
| `DEADLOCK` | Database deadlock detected | Immediate retry |
| `NETWORK_ERROR` | Transient network failure | Exponential backoff |
| `THROTTLED` | Throttled by downstream system | Exponential backoff |
| `CONFLICT` | Optimistic locking conflict | Fixed backoff |
| `RETRYABLE_ERROR` | Generic retryable error | Exponential backoff |

### 7.2 Non-Retryable Errors

| Error Code | Description | Action |
|-----------|-------------|--------|
| `VALIDATION_ERROR` | Payload failed schema validation | Dead Letter Queue |
| `NOT_FOUND` | Referenced entity does not exist | Dead Letter Queue |
| `FORBIDDEN` | Security/permission violation | Dead Letter Queue + alert |
| `INVALID_STATE` | Entity in wrong state for action | Dead Letter Queue |
| `BAD_REQUEST` | Malformed request | Dead Letter Queue |
| `SCHEMA_VIOLATION` | Event structure incorrect | Dead Letter Queue |
| `UNKNOWN_ACTION` | Event action not recognized | Dead Letter Queue |
| `POISON_MESSAGE` | Event always fails processing | Dead Letter Queue |

---

## 8. Retry Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Retry Rate | (RETRIED / TOTAL) * 100 | > 5% |
| Retry Success Rate | (SUCCESS_AFTER_RETRY / RETRIED) * 100 | < 80% |
| DLQ Rate | (DEAD_LETTER / TOTAL) * 100 | > 0.5% |
| DLQ Queue Depth | Events in dead letter queue | > 100 |
| Circuit Breaker Events | Count of OPEN events | > 1 active |
| Max Retry Duration | Longest retry cycle | > 5 minutes |
| Poison Messages | Events DLQ'd 2+ times | > 5 |

---

> **End of EVENT_RETRY_POLICY.md**
