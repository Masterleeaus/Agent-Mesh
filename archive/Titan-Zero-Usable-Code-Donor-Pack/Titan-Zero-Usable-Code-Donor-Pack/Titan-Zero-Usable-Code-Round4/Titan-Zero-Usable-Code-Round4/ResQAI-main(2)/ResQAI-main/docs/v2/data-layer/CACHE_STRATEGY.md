# ResQAI V2 — Cache Strategy

> **Phase:** B.2 — Enterprise Data Layer Integration  
> **Date:** 2026-06-30  
> **Purpose:** Define caching policies for all data access patterns across applications

---

## 1. Cache Layers

| Layer | Technology | Scope | TTL Range | Invalidation |
|:-----:|:-----------|:------|:---------:|:-------------|
| **L1** | In-memory (React state/context) | Per-component, per-page | Session | Manual refresh, route change |
| **L2** | In-memory (CacheManager in shared/api) | Per-application | 10s-5min | TTL expiry, event invalidation |
| **L3** | HTTP Cache (CDN/Browser) | Static reference data | 5min-1hr | Cache-control headers |
| **L4** | Database Query Cache (PostgreSQL) | Repeated query patterns | Statement-level | Table modification |

---

## 2. Cache Strategy by Data Type

### 2.1 Reference Data (Low Volatility)

| Data | Cache Layer | TTL | Stale-While-Revalidate | Strategy |
|:-----|:-----------:|:---:|:----------------------:|:---------|
| reference_data_v2 | L2, L3 | 5 min | 1 hour | Cache-all on app load |
| knowledge_categories_v2 | L2, L3 | 5 min | 1 hour | Cache-all on app load |
| user_roles_v2 | L2 | 5 min | 30 min | Cache per role lookup |
| service_types_v2 | L2, L3 | 5 min | 1 hour | Cache-all on app load |

### 2.2 Configuration (Very Low Volatility)

| Data | Cache Layer | TTL | Stale-While-Revalidate | Strategy |
|:-----|:-----------:|:---:|:----------------------:|:---------|
| system_settings_v2 | L2 | 5 min | 30 min | Cache on admin load |
| feature_flags_v2 | L2 | 2 min | 10 min | Cache on app bootstrap |
| notification_templates_v2 | L2 | 5 min | 30 min | Cache on notification load |
| notification_channels_v2 | L2 | 5 min | 30 min | Cache on notification load |

### 2.3 Entity Data (Medium Volatility)

| Data | Cache Layer | TTL | Stale-While-Revalidate | Strategy |
|:-----|:-----------:|:---:|:----------------------:|:---------|
| customers_v2 | L2 | 30 s | 5 min | Cache per customer ID |
| accounts_v2 | L2 | 30 s | 5 min | Cache per account ID |
| technicians_v2 | L2 | 15 s | 2 min | Cache per tech ID |

### 2.4 Operational Data (High Volatility)

| Data | Cache Layer | TTL | Stale-While-Revalidate | Strategy |
|:-----|:-----------:|:---:|:----------------------:|:---------|
| tickets_v2 | L2 | 15 s | 2 min | Cache per ticket ID, list TTL 30s |
| ticket_messages_v2 | L2 | 15 s | 2 min | Cache per ticket ID |
| appointments_v2 | L2 | 15 s | 2 min | Cache per appointment ID |
| dispatches_v2 | L2 | 10 s | 1 min | Cache per dispatch ID |
| work_orders_v2 | L2 | 15 s | 2 min | Cache per work order ID |
| work_order_stages_v2 | L2 | 15 s | 1 min | Cache per work order ID |

### 2.5 Dashboard/Aggregate Data (Semi-Static)

| Data | Cache Layer | TTL | Stale-While-Revalidate | Strategy |
|:-----|:-----------:|:---:|:----------------------:|:---------|
| Dashboard metrics | L2 | 30 s | 5 min | Cache per dashboard type |
| SLA metrics | L2 | 60 s | 5 min | Cache per team/scope |
| Analytics reports | L2 | 5 min | 30 min | Cache per report ID |
| Trend data | L2 | 5 min | 30 min | Cache per metric + period |
| Forecast data | L2 | 5 min | 30 min | Cache per forecast scope |

### 2.6 Notification Data

| Data | Cache Layer | TTL | Stale-While-Revalidate | Strategy |
|:-----|:-----------:|:---:|:----------------------:|:---------|
| notifications_v2 | L2 | 10 s | 1 min | Cache per user ID |
| unread_count | L1 | 10 s | — | Polled from server |

### 2.7 Audit/Log Data

| Data | Cache Layer | TTL | Stale-While-Revalidate | Strategy |
|:-----|:-----------:|:---:|:----------------------:|:---------|
| audit_log_v2 | L2 | 30 s | 5 min | Cache per query |
| events_v2 | L2 | 15 s | 2 min | Cache per event type |

---

## 3. Cache Invalidation Strategy

### 3.1 Event-Driven Invalidation

| Event | Invalidates | Publisher | Consumers |
|:------|:------------|:---------:|:----------|
| ticket.created | tickets_v2 cache | support-center_v2 | All apps with tickets |
| ticket.updated | tickets_v2 cache | support-center_v2 | All apps with tickets |
| ticket.status_changed | tickets_v2 cache | support-center_v2 | All apps with tickets |
| appointment.created | appointments_v2 cache | appointment-center_v2 | All apps with appointments |
| appointment.updated | appointments_v2 cache | appointment-center_v2 | All apps with appointments |
| appointment.assigned | appointments_v2, technicians_v2 | appointment-center_v2 | Ops center, tech portal |
| dispatch.created | dispatches_v2 cache | operations-center_v2 | Appt center, tech portal |
| dispatch.status_changed | dispatches_v2 cache | operations-center_v2 | Appt center, tech portal |
| work_order.created | work_orders_v2 cache | operations-center_v2 | Tech portal |
| work_order.status_changed | work_orders_v2 cache | operations-center_v2 | Tech portal |
| dispute.created | disputes_v2 cache | resolution-center_v2 | Customer portal, analytics |
| dispute.status_changed | disputes_v2 cache | resolution-center_v2 | Customer portal, analytics |
| customer.updated | customers_v2 cache | crm-center_v2 | All apps with customers |
| account.health_changed | accounts_v2, account_health_scans_v2 | crm-center_v2 | Analytics, customer portal |

### 3.2 TTL-Based Invalidation

- **Short TTL (10-15s):** Live data (dispatches, notifications, live metrics)
- **Medium TTL (30-60s):** Operational data (tickets, appointments, work orders)
- **Long TTL (5min+):** Reference data, configuration, analytics reports
- **Session:** User context (preferences, permissions)

### 3.3 Manual Refresh

| Trigger | Action |
|:--------|:-------|
| Pull-to-refresh | Invalidate and refetch current page data |
| Navigation | Invalidate previous page cache (optional) |
| Save/Submit | Invalidate affected entity cache, refetch |
| Reconnect (offline) | Invalidate all stale caches, refetch |

---

## 4. Cache Key Strategy

```
{entity}:{id}:{scope}
{entity}:list:{filters_hash}:{page}:{sort}
{dashboard}:{type}:{date_range}
{analytics}:{report_id}:{period}
```

Examples:
- `ticket:tkt-001234:detail`
- `ticket:list:status_open_priority_high:1:created_desc`
- `dashboard:executive:2026-06`
- `analytics:report_001:monthly`

---

## 5. Offline Strategy

| Data Type | Offline Behavior | Storage | Sync on Reconnect |
|:----------|:-----------------|:--------|:-----------------:|
| Reference data | Available offline (long TTL) | LocalStorage | Check version, update if changed |
| User profile | Available offline | LocalStorage | Full sync |
| Active tickets | Last-fetched available | IndexedDB | Full refresh |
| Active appointments | Last-fetched available | IndexedDB | Full refresh |
| Pending dispatches | Last-fetched available | IndexedDB | Full refresh |
| Dashboard metrics | Not available offline | — | — |
| Notifications | Last-fetched available | LocalStorage | Full refresh |
| Form drafts | Saved locally | LocalStorage | Submit on reconnect |

---

## 6. Cache Size Limits

| Cache Store | Max Size | Eviction Policy |
|:------------|:--------:|:----------------|
| L1 (Component state) | 10MB | LRU per component unmount |
| L2 (App CacheManager) | 50MB | LRU + TTL |
| LocalStorage | 5MB | Manual cleanup, TTL |
| IndexedDB | 100MB | LRU + versioned schemas |

---

> **End of CACHE_STRATEGY.md**
