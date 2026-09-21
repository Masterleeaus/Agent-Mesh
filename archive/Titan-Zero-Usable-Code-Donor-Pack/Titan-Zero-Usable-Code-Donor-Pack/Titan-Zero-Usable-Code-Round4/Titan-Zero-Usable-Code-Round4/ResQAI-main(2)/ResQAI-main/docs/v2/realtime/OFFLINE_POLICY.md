# OFFLINE POLICY — ResQAI V2

## 1. Offline Mode Overview

ResQAI V2 supports **graceful degradation** during network outages. Applications remain functional with locally-cached data and queued mutations, synchronizing automatically when connectivity resumes.

```
┌─────────────────────────────────────────────┐
│                OFFLINE LAYER                │
│                                             │
│  ┌─────────────┐    ┌──────────────────┐   │
│  │ IndexedDB   │    │ Mutation Queue   │   │
│  │ (Entity     │    │ (Outbox)         │   │
│  │  Cache)     │    │                  │   │
│  └──────┬──────┘    └────────┬─────────┘   │
│         │                    │              │
│  ┌──────▼────────────────────▼──────────┐  │
│  │         Sync Manager                 │  │
│  │  (Online/Offline detection, Queue    │  │
│  │   management, Conflict resolution)   │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

## 2. Offline Capabilities by App

| App | Read (from IndexedDB) | Mutations Queued | Feature Degradation |
|---|---|---|---|
| Support Queue | Full ticket list + detail | Status changes, drafts | Agent classification, reply drafting disabled |
| Ops Dashboard | Last-synced KPI + log | None (read-only) | Real-time KPI stale; auto-refresh paused |
| Resolution Center | Full dispute list + detail | Approve/reject resolutions | AI analysis, Reddit search disabled |
| CRM Tracker | Account list + detail | Status changes, notes | Health scans, followup scheduling disabled |

## 3. Connectivity Detection

```typescript
enum ConnectionStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  RECONNECTING = 'reconnecting',
  DEGRADED = 'degraded',  // WebSocket lost, HTTP available
}

// Detection sources:
// 1. window.addEventListener('online' / 'offline')
// 2. Pusher connection state changes
// 3. Periodic heartbeat ping (every 15s)
// 4. Fetch API error detection (network error vs server error)
```

## 4. Offline Data Store (IndexedDB Schema)

### 4.1 Object Stores

| Store Name | Key Path | Indexes | Purpose |
|---|---|---|---|
| `entities` | `[table, id]` | `table`, `updated_at` | Cached records by table |
| `lists` | `[table, query_hash]` | `table` | Cached list query results |
| `mutation_queue` | `id` (auto) | `table`, `status`, `created_at` | Pending mutations |
| `subscriptions` | `channel` | `userId` | Active subscription metadata |
| `sync_metadata` | `key` | — | Last sync timestamps, cursor |

### 4.2 `mutation_queue` Items

```typescript
interface QueuedMutation {
  id: string;                   // auto-generated
  table: string;                // entity table name
  entityId: string;             // record id
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>; // mutation payload
  createdAt: string;            // ISO timestamp
  retryCount: number;           // 0-3
  lastError: string | null;     // last failure reason
  status: 'pending' | 'in_flight' | 'failed' | 'confirmed';
  idempotencyKey: string;       // deduplication key
}
```

## 5. Mutation Queue Processing

### 5.1 Enqueue

```
User action while offline:
  → Apply optimistic update to local state
  → Save snapshot for potential revert
  → Enqueue mutation to IndexedDB mutation_queue
  → Show "Queued" indicator in UI
```

### 5.2 Flush

```
On reconnect:
  → Sort queue by createdAt ASC
  → Process mutations sequentially (ordered by entity)
  → For each mutation:
    → Set status = 'in_flight'
    → Send to server with idempotencyKey
    → On success: set status = 'confirmed'; remove from queue
    → On conflict (stale version):
      → Re-fetch current record from server
      → Attempt auto-merge
      → If merge succeeds: create new mutation with merged data
      → If merge fails: set status = 'failed'; notify user
    → On server error: set status = 'failed'; retry up to 3 times
  → Show sync summary (X confirmed, Y failed)
```

## 6. Conflict Resolution for Offline Mutations

### 6.1 Auto-Merge Rules

| Situation | Resolution |
|---|---|
| Same scalar field changed offline + online | Server wins (LWW) |
| Different scalar fields changed | Per-field merge (offline + online combined) |
| JSONB metadata changed | Deep merge per key |
| Array field changed | Set union (deduplicated) |
| Entity deleted online while offline | Mutation rejected; notify user |
| Entity deleted offline | Sent as delete operation; server processes |
| Status conflict (state machine) | Server rejects; re-fetch current state; notify user |

### 6.2 Merge UI

When auto-merge is impossible:
1. Show conflict resolution dialog
2. Display local vs server version side-by-side
3. Allow user to choose: Keep Local / Accept Server / Edit Manually
4. On selection, create corrected mutation and enqueue

## 7. Quota & Limits

| Limit | Value | Behavior When Exceeded |
|---|---|---|
| Max offline mutations per entity | 50 | Newest replaces oldest pending |
| Max total offline mutations | 500 | New mutation rejected with "queue full" |
| Max offline duration | 24 hours | Force re-auth + full sync on reconnect |
| IndexedDB max size | 50MB | LRU eviction of oldest entity cache |
| Retry attempts per mutation | 3 | Moved to `failed`; user notified |
| Retry backoff | 5s, 15s, 60s | Exponential backoff |

## 8. Offline UI States

| State | Indicator | Behavior |
|---|---|---|
| Offline | Banner: "You're offline. Changes will sync when connection resumes." | Read from cache; mutations queued |
| Reconnecting | Banner: "Reconnecting..." + spinner | Hide stale data; show cached |
| Syncing | Banner: "Syncing N changes..." + progress | Process queue; lock UI for critical mutations |
| Sync Complete | Toast: "All changes saved" (auto-dismiss 3s) | Normal operation resumes |
| Sync Failed | Warning: "N changes couldn't be saved. Tap to review." | Show conflict resolution |
| Degraded (no WS) | Subtle indicator: "Live updates paused" | Polling fallback active |

## 9. Edge Cases

| Edge Case | Handling |
|---|---|
| Offline during optimistic mutation | Mutation stays in queue; processed on reconnect |
| Tab closed while offline | Mutation persisted in IndexedDB; processed on next open |
| Multiple tabs offline simultaneously | Each tab maintains own queue; server deduplicates by idempotency key |
| IndexedDB storage quota exceeded | Evict oldest entity cache; warn user; preserve mutation queue |
| Long offline (>24h) | Force full re-sync on reconnect; discard outdated cache |
| Concurrent offline mutations on same entity | Ordered by createdAt; latest wins on server |
| Metric/analytics events offline | Buffered separately from data mutations; flushed on reconnect |
| File uploads offline | Rejected (no offline support); user prompted to retry when online |

## 10. Offline Read Strategy

```typescript
function getDataOffline<T>(table: string, query: QueryParams): T[] {
  // 1. Check IndexedDB entity cache
  const cached = await idb.get('entities', [table, query.filter]);
  if (cached) return cached;

  // 2. Check list cache
  const listCache = await idb.get('lists', [table, hashQuery(query)]);
  if (listCache) return listCache.items;

  // 3. Fallback: return all entities for this table (filter client-side)
  const allEntities = await idb.getAll('entities', table);
  return filterClientSide(allEntities, query);
}
```
