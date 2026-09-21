# CACHE STRATEGY — ResQAI V2

## 1. Cache Architecture

Three-tier cache with explicit invalidation driven by the real-time event system.

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT-SIDE CACHE (Browser)                  │
│  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│  │ React State     │  │ IndexedDB      │  │ Service Worker   │ │
│  │ (Context/State)  │  │ (Offline store)│  │ (Cache API)      │ │
│  └────────┬────────┘  └───────┬────────┘  └────────┬─────────┘ │
└───────────┼───────────────────┼─────────────────────┼────────────┘
            │                   │                     │
            ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NETWORK LAYER                                │
│              Cache-Control / ETag / Last-Modified                │
└─────────────────────────────────────────────────────────────────┘
            │                   │                     │
            ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER-SIDE CACHE (Redis)                    │
│  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│  │ Data Cache      │  │ Session Cache  │  │ Query Cache      │ │
│  │ (records, lists)│  │ (auth tokens)  │  │ (aggregated KPI) │ │
│  └────────┬────────┘  └───────┬────────┘  └────────┬─────────┘ │
└───────────┼───────────────────┼─────────────────────┼────────────┘
            │                   │                     │
            ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER (PostgreSQL)                  │
│              Primary source of truth + CDC events                │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Cache Layers Detail

### 2.1 Client-Side Cache

| Store | Technology | Scope | Capacity | Persistence |
|---|---|---|---|---|
| React State | Context + useState | Active view data | Component lifecycle | None |
| IndexedDB | `idb` library | Offline queue + entity cache | 50MB per origin | Persistent |
| Service Worker | Cache Storage API | Static assets + API response cache | 100MB | Persistent |

### 2.2 Server-Side Cache (Redis)

| Cache Name | Key Pattern | TTL | Eviction | Purpose |
|---|---|---|---|---|
| Record Cache | `record:{table}:{id}` | 60s | LRU | Reduce DB reads for individual record fetches |
| List Cache | `list:{table}:{query_hash}` | 30s | LRU | Reduce DB reads for filtered list queries |
| KPI Cache | `kpi:{orgId}:{computation_hash}` | 10s | TTL-only | Computed KPI aggregates |
| Session Cache | `session:{userId}` | 15min | TTL-only | Auth sessions and subscription metadata |
| Rate Limit | `ratelimit:{actor}:{action}` | variable | TTL-only | API rate limiting counters |
| Lock Cache | `lock:{table}:{id}` | 5s | TTL-only | Optimistic concurrency locks |

## 3. Cache Invalidation Matrix

Invalidation is event-driven: when a mutation occurs, CDC captures the change and broadcasts an event that triggers cache invalidation.

| Mutation Event | Invalidates |
|---|---|
| `ticket.created` | `list:tickets_v2:*`, `kpi:{orgId}:*` |
| `ticket.status.changed` | `record:tickets_v2:{id}`, `list:tickets_v2:*`, `kpi:{orgId}:*` |
| `ticket.deleted` | `record:tickets_v2:{id}`, `list:tickets_v2:*`, `kpi:{orgId}:*` |
| `ticket.sla_breached` | `record:tickets_v2:{id}`, `kpi:{orgId}:*` |
| `dispute.*` | `record:disputes_v2:{id}`, `list:disputes_v2:*`, `kpi:{orgId}:*` |
| `appointment.*` | `record:appointments_v2:{id}`, `list:appointments_v2:*`, `kpi:{orgId}:*` |
| `work_order.*` | `record:work_orders_v2:{id}`, `list:work_orders_v2:*`, `kpi:{orgId}:*` |
| `account.*` | `record:accounts_v2:{id}`, `list:accounts_v2:*`, `kpi:{orgId}:*` |
| `account.health.changed` | `record:accounts_v2:{id}`, `kpi:{orgId}:*` |
| `followup.*` | `record:followups_v2:{id}`, `list:followups_v2:*` |
| `audit_log.*` | `list:audit_log_v2:*` |
| `system.settings.changed` | All caches (global flush) |

### Invalidation Patterns

```
Event received → CacheInvalidator:
  1. Extract entity type and ID from event envelope
  2. Compute cache keys to invalidate (from invalidation matrix)
  3. Issue DEL commands to Redis (bulk pipeline)
  4. If batch mode: accumulate keys for 100ms then flush
```

## 4. Cache-Aside Strategy (Server)

```
GET request:
  → Check Redis (cache_key)
    → HIT: return cached data
    → MISS:
      → Query PostgreSQL
      → Store in Redis with TTL
      → Return data
      → Emit cache-warm event for prefetch subscribers
```

## 5. Stale-While-Revalidate (Client)

```
Component renders:
  → Show cached data from IndexedDB (instant)
  → Fetch fresh data from server (async)
    → On success: update IndexedDB + React state
    → On failure: keep showing stale data + warning
  → Real-time subscription updates arrive
    → Merge into React state + update IndexedDB
```

## 6. Write-Through with Optimistic Confirm

```
User mutation:
  → Optimistically update React state (instant UI)
  → Write to IndexedDB mutation queue
  → Send mutation to server
    → Server processes → CDC event → broadcast
      → Client receives confirm event
        → Confirm in React state + clear from IndexedDB queue
        → Update Redis cache (write-through)
    → Server error → reject event
      → Revert React state
      → Remove from IndexedDB queue (or retry)
      → Show error notification
```

## 7. Cache Warming

| Trigger | Strategy |
|---|---|
| App initial load | Fetch critical entities (user, org, settings) and warm Redis + IndexedDB |
| Post-deployment | Seed cache with frequently accessed records (hot set) |
| Connection re-establish | Re-fetch active list views that lost subscriptions |
| SLA breach detected | Pre-warm related records (escalation path) |

## 8. Cache Key Naming Convention

```
{cache_type}:{context}:{identifier}:{qualifier}

Examples:
  record:tickets_v2:ticket_abc123
  list:tickets_v2:status=open_sort=created_at_desc_page=1
  kpi:org_456:default
  session:user_789
  lock:tickets_v2:ticket_abc123
```

## 9. Cache Metrics & Monitoring

| Metric | Target | Source |
|---|---|---|
| Redis hit ratio | > 85% | `INFO stats` |
| Average TTL utilization | > 60% | Custom monitor |
| Invalidation latency | < 10ms | Tracing spans |
| IndexedDB size | < 30MB | `navigator.storage.estimate()` |
| Client cache staleness | < 5s | Time since last update |
| Service Worker cache hits | > 80% | Cache Storage API stats |
