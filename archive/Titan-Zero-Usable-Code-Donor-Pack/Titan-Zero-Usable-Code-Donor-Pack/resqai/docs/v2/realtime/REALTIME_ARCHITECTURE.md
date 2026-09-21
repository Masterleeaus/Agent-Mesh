# REALTIME ARCHITECTURE — ResQAI V2

## 1. Overview

ResQAI V2 real-time architecture connects every application with live enterprise data through a unified **Pub/Sub + WebSocket + Change Data Capture (CDC)** layer. The architecture enables sub-second propagation of state changes across 5 apps, 41 tables, 88 event types, and 15 state machines.

```
┌──────────────────────────────────────────────────────────────────┐
│                    REAL-TIME LAYER (Pusher/WS)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Events  │  │ Subscriptions  │  Channels │  │  Presence       │  │
│  │  Engine  │  │  Manager  │  │  Registry│  │  Manager        │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │              │                  │           │
└───────┼──────────────┼──────────────┼──────────────────┼───────────┘
        │              │              │                  │
┌───────▼──────────────▼──────────────▼──────────────────▼───────────┐
│                      SUBSCRIPTION ORCHESTRATOR                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  DB CDC     │  │  Event Bus  │  │  Agent Bus  │  │  Function │ │
│  │  Listener   │  │  Consumer   │  │  Consumer   │  │  Watcher  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
└─────────┼─────────────────┼─────────────────┼───────────────┼───────┘
          │                 │                 │               │
┌─────────▼─────────────────▼─────────────────▼───────────────▼───────┐
│                         DATA SOURCES                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │PostgreSQL│  │  Redis   │  │  Lemma   │  │  External APIs       │ │
│  │ (CDC)    │  │ (Cache)  │  │ Agents   │  │  (Connectors)        │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. Core Components

### 2.1 WebSocket Gateway
- **Provider**: Pusher (primary) / Socket.IO fallback
- **Transport**: WSS (WebSocket Secure) with HTTP long-polling fallback
- **Authentication**: JWT token in connection handshake, validated against `user_sessions_v2`
- **Connection Pool**: App-level multiplexing — single connection per app instance

### 2.2 Channel Taxonomy

| Channel Pattern | Purpose | Auth Scope | Example |
|---|---|---|---|
| `private-user-{userId}` | User-scoped events | User JWT | `private-user-user_abc` |
| `private-org-{orgId}` | Organization broadcast | Org membership | `private-org-org_123` |
| `private-app-{appId}-{entity}` | Per-app entity streams | App + role | `private-app-support-queue-ticket` |
| `presence-{entity}-{entityId}` | Live cursors/typing | Active session | `presence-ticket-ticket_456` |

### 2.3 Event Bus Integration

Bridge between the existing event system (88 event types, 14 topics) and real-time channels:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Event Bus  │────►│  Channel     │────►│  WebSocket  │
│  (events_v2)│     │  Router      │     │  Gateway    │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐
                    │  Subscription│
                    │  Registry    │
                    └──────────────┘
```

### 2.4 Change Data Capture

PostgreSQL logical replication (`pgoutput` plugin) captures row-level changes:

| Table Pattern | Replication | Purpose |
|---|---|---|
| `*_v2` tables | PUBLISH ALL | All production tables |
| `events_v2` | PUBLISH INSERT only | Outbox-triggered events |
| `audit_log_v2` | PUBLISH INSERT only | Audit trail |
| `notifications_v2` | PUBLISH INSERT + UPDATE | Notification delivery |

### 2.5 Cache Layer (Redis)

| Cache | Key Pattern | TTL | Invalidation |
|---|---|---|---|
| Record cache | `record:{table}:{id}` | 60s | On UPDATE/DELETE CDC |
| List cache | `list:{table}:{query_hash}` | 30s | On INSERT/UPDATE/DELETE CDC |
| Session cache | `session:{userId}` | 15min | On logout/token expiry |
| Subscription map | `sub:{userId}:{channel}` | Session lifetime | On disconnect |
| Optimistic lock | `lock:{table}:{id}` | 5s | On commit/rollback |

## 3. Data Flow Patterns

### 3.1 Mutation → Event → Broadcast

```
User Action → App Service → Lemma SDK → Database
                                            │
                                      CDC Capture (logical replication)
                                            │
                                     Subscription Orchestrator
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                  ▼
                    Event Bus         Cache              WebSocket
                    (events_v2)    Invalidation        Gateway
                          │                                │
                     Event Consumers                  Subscribed Clients
                   (workflows, agents)              (dashboards, lists)
```

### 3.2 Subscription Lifecycle

```
Client connects → Auth JWT → Channel auth → Subscribe
     │                                                │
     ▼                                                ▼
Pusher connection       Subscription Registry
     │                   stores {userId, channel,
     │                    filters, callback}
     ▼
Channel binding (bind to event names)
     │
     ▼
Messages delivered → Client callback → State update → Re-render
```

### 3.3 Optimistic Update Flow

```
User Action → Immediate state update → Render optimistic UI
     │                                            │
     ▼                                            │
Send mutation to server                           │
     │                                            │
     ├── Success → Server confirms → Broadcast update event
     │              Client receives → Confirm state → Render confirmed
     │
     └── Failure → Server sends error event
                    Client reverts → Render original state
                    Show error notification
```

## 4. State Synchronization per App

### 4.1 Support Queue

| View | Channels | Events | Sync Mode |
|---|---|---|---|
| Ticket List | `private-app-support-queue-ticket` | `ticket.created`, `ticket.status.changed`, `ticket.*` | Live subscription + optimistic |
| Ticket Detail | `private-entity-ticket-{id}` | `ticket.*`, `ticket_message.*` | Live subscription + optimistic |
| Filter Bar | `private-app-support-queue-ticket` | `ticket.created`, `ticket.status.changed` | Live subscription |

### 4.2 Ops Dashboard

| View | Channels | Events | Sync Mode |
|---|---|---|---|
| KPI Cards | `private-org-{orgId}` | `ticket.*`, `dispute.*`, `appointment.*`, `work_order.*`, `task.*` | Live subscription with debounce |
| Urgent Tickets | `private-org-{orgId}` | `ticket.*` | Live subscription |
| Operations Log | `private-org-{orgId}` | `audit_log.*` | Throttled (5s) |

### 4.3 Resolution Center

| View | Channels | Events | Sync Mode |
|---|---|---|---|
| Dispute List | `private-app-resolution-center-dispute` | `dispute.*` | Live subscription + optimistic |
| Dispute Detail | `private-entity-dispute-{id}` | `dispute.*`, `evidence.*` | Live subscription |
| KPI Cards | `private-app-resolution-center-dispute` | `dispute.*`, `appointment.*` | Live subscription with debounce |

### 4.4 CRM Tracker

| View | Channels | Events | Sync Mode |
|---|---|---|---|
| Account List | `private-app-crm-tracker-account` | `account.*`, `account_health.*` | Live subscription |
| Account Detail | `private-entity-account-{id}` | `account.*`, `followup.*`, `task.*` | Live subscription + optimistic |
| Health Alerts | `private-user-{userId}` | `account.health.changed`, `followup.slippage.*` | Push notification + subscription |

## 5. Channel-to-Event Routing Matrix

| Event Pattern | Routed To |
|---|---|
| `ticket.*` | `private-app-support-queue-ticket`, `private-org-{orgId}` |
| `ticket.created` | `private-app-support-queue-ticket` + `private-user-{assigneeId}` |
| `ticket.status.changed` | `private-entity-ticket-{id}`, `private-org-{orgId}` |
| `dispute.*` | `private-app-resolution-center-dispute`, `private-org-{orgId}` |
| `appointment.*` | `private-app-ops-dashboard-appointment`, `private-org-{orgId}` |
| `work_order.*` | `private-app-ops-dashboard-work-order`, `private-org-{orgId}` |
| `account.*` | `private-app-crm-tracker-account`, `private-org-{orgId}` |
| `account.health.changed` | `private-org-{orgId}` + `private-user-{accountManagerId}` |
| `notification.*` | `private-user-{recipientId}` |
| `followup.*` | `private-app-crm-tracker-followup`, `private-user-{assigneeId}` |
| `system.*` | All `private-org-{orgId}` channels |

## 6. Performance Targets

| Metric | Target | Measurement |
|---|---|---|
| Event → Broadcast latency | < 200ms p99 | End-to-end tracing |
| Connection establishment | < 500ms p95 | Client-side measurement |
| Concurrent connections | 10,000 per gateway node | Pusher dashboard |
| Messages per second | 5,000 per gateway node | Event bus throughput |
| Cache hit ratio | > 85% | Redis INFO stats |
| Subscription re-registration | < 100ms | Post-reconnect timing |
| Optimistic update confirm | < 1s | Client-side measurement |

## 7. Failure Modes & Resilience

| Failure | Detection | Mitigation |
|---|---|---|
| WebSocket disconnect | `pusher:connection_established` timeout | Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s) |
| Cache miss | `nil` response from Redis | Fallback to direct DB query + async cache warm |
| Event bus backlog | Consumer lag > 1000 messages | Scale consumer workers; DLQ overflow events |
| CDC replication lag | Lag > 5s on pg_stat_replication | Alert ops; switch to polling fallback |
| Optimistic conflict | Version mismatch on update | Automatic retry with fresh data (max 3 attempts) |
| Stale subscription | Heartbeat timeout (30s no ping) | Re-verify auth; re-register subscription |
