# SYNC POLICY — ResQAI V2

## 1. Synchronization Model

ResQAI V2 uses a **hybrid sync model**: real-time push for live updates + periodic reconciliation for consistency.

## 2. Sync Modes

| Mode | Latency | Direction | Use Case |
|---|---|---|---|
| **Live Push** | <200ms | Server → Client | Live list/detail updates, KPI refreshes |
| **Optimistic** | Instant | Client → Server → Client (confirm) | Status changes, approvals, dispatches |
| **Polling Fallback** | 10s | Client → Server | When WebSocket disconnected |
| **Periodic Reconcile** | 60s | Bidirectional | Full state consistency check |
| **On-Reconnect** | Immediate | Server → Client | Catch up after connection loss |
| **Bulk Sync** | On demand | Client → Server | Offline queue flush |

## 3. Conflict Resolution Strategy

### 3.1 Last-Writer-Wins (LWW) — Default

For most scalar fields, the last mutation (by `updated_at` timestamp) wins.

**Implementation:**
- Every record has `version` (integer) and `updated_at` (timestamp)
- Server rejects writes with stale `version` (optimistic lock)
- Real-time push delivers the winning version to all clients

### 3.2 Merge Strategies by Field Type

| Field Type | Strategy | Description |
|---|---|---|
| Scalar (string, number, boolean) | LWW | Last write wins by `updated_at` |
| JSONB metadata | Deep merge | `Object.assign({}, old, new)` — per-key merge |
| Array (tags, assignees) | Set union | Append new, deduplicate by ID |
| Status (state machine) | Guarded transition | Only valid transitions accepted; invalid ones rejected with reason |
| Counter (version, retry_count) | Incremental | `SET counter = counter + 1` — server-computed |
| Timestamp | Server-authoritative | Client suggests, server finalizes |
| Owner/assignee | LWW with notification | Last assignment wins; previous owner notified |

### 3.3 State Machine Guarding

Status transitions must follow the defined state machines (see `STATE_MACHINE.md`). Invalid transitions are rejected at the server level:

```typescript
// Server-side guard
function validateTransition(entity: string, currentStatus: string, newStatus: string): boolean {
  const allowedTransitions = STATE_MACHINES[entity].transitions;
  return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
}
```

## 4. Optimistic Update Protocol

### 4.1 Flow

```
CLIENT                              SERVER
  │                                   │
  ├── Apply patch locally ────────────┤
  ├── Show updated UI ────────────────┤
  ├── Send mutation ─────────────────►│
  │                                   ├── Validate (state machine, permissions)
  │                                   ├── Apply (with version check)
  │                                   ├── Emit confirm event ───────────► All clients
  │                                   ├── Emit reject event (if failed) ─► Client
  │◄─ Receive confirm ───────────────┤
  ├── Confirm local state ───────────┤
  │                                   │
  │◄─ OR receive reject ─────────────┤
  ├── Revert local state ────────────┤
  ├── Show error notification ───────┤
```

### 4.2 Revert Strategy

On reject or timeout:
1. Restore pre-mutation state from snapshot taken before optimistic update
2. If snapshot unavailable, re-fetch record from server
3. Show dismissible error notification with retry action
4. Queue failed mutation for retry (max 3 attempts)

## 5. Periodic Reconciliation

### 5.1 Schedule

| Entity | Interval | Method |
|---|---|---|
| Ticket lists | 60s | `listRecords('tickets_v2', 500)` + diff reconciliation |
| Dispute lists | 60s | `listRecords('disputes_v2', 200)` + diff reconciliation |
| Dashboard KPI | 30s | Re-query KPI computation |
| Account lists | 120s | `listRecords('accounts_v2', 200)` + diff reconciliation |
| Followup lists | 120s | `listRecords('followups_v2', 200)` + diff reconciliation |

### 5.2 Diff Reconciliation Algorithm

```typescript
function reconcile<T extends { id: string; version: number }>(
  local: Map<string, T>,
  server: T[]
): T[] {
  const serverMap = new Map(server.map(item => [item.id, item]));
  const merged = new Map(local);

  for (const [id, serverItem] of serverMap) {
    const localItem = merged.get(id);
    if (!localItem || localItem.version < serverItem.version) {
      merged.set(id, serverItem); // server is newer
    }
  }

  // Remove items deleted on server
  for (const id of merged.keys()) {
    if (!serverMap.has(id)) {
      merged.delete(id);
    }
  }

  return Array.from(merged.values());
}
```

## 6. On-Reconnect Sync

When a client reconnects after WebSocket disconnect:

```
1. Detect reconnection (pusher:connection_established event)
2. Pause all optimistic pending mutations
3. Request missed events since last_known_event_id
4. Apply missed events to local state
5. Re-run periodic reconcile for all active lists
6. Resubscribe all channels
7. Retry any failed optimistic mutations
8. Resume UI (show "Back online" indicator)
```

### Missed Event Recovery

```typescript
interface MissedEventsRequest {
  userId: string;
  lastEventId: string;       // last event processed by client
  subscribedChannels: string[];
}

interface MissedEventsResponse {
  events: EventEnvelope[];   // events since lastEventId
  currentEventId: string;    // new cursor
}
```

## 7. Sync Health Metrics

| Metric | Target | Alert Threshold |
|---|---|---|
| Optimistic confirm ratio | > 99% | < 95% |
| Optimistic confirm P95 latency | < 2s | > 5s |
| Reconcile diff count | < 5 per cycle | > 50 per cycle |
| Reconnect sync time | < 3s | > 10s |
| Missed events per reconnect | < 10 | > 100 |
| Polling fallback usage | < 1% of requests | > 5% |
| Offline queue flush success | 100% | < 95% |
