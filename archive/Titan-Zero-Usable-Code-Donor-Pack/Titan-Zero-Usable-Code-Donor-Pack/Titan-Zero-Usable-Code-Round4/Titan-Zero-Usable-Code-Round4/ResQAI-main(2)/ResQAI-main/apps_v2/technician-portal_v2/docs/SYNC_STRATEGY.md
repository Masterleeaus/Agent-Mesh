# Sync Strategy

## Overview

Synchronization ensures that data created or modified while offline is properly sent to the backend when connectivity is restored. The sync system is built on the foundations laid in `AppContext` (`isSyncing`, `pendingSyncCount`, `networkStatus`).

## Sync Queue Architecture

```
+---------------------------+
|    Offline Sync Queue      |
|  (localStorage/IndexedDB)  |
+---------------------------+
|                           |
|  {                        |
|    id: string,            |
|    type: string,          |
|    endpoint: string,      |
|    method: string,        |
|    payload: unknown,      |
|    createdAt: number,      |
|    retryCount: number,    |
|    status: 'pending' |    |
|            'syncing' |   |
|            'failed'       |
|  }[]                      |
+---------------------------+
```

## Sync Flow

```
1. User performs action while offline
2. Optimistic UI update (state updated immediately)
3. Action queued in Sync Queue
4. pendingSyncCount incremented
5. Network restored (online event)
6. Sync process triggered:
   a. Set isSyncing = true
   b. Process queue FIFO
   c. For each item: retry API call
      - Success: remove from queue
      - Failure: retry with backoff, max 3 attempts
   d. Update local cache with server responses
   e. Set isSyncing = false
   f. Emit offline.sync.completed event
```

## Priority Queue

| Priority | Action Type | Max Retries | Notes |
|---|---|---|---|
| High | `complete_job` | 3 | Must be synced first |
| High | `capture_signature` | 3 | Required for invoicing |
| High | `escalate_job` | 3 | Time-sensitive |
| Medium | `add_note` | 3 | Important for records |
| Medium | `update_status` | 3 | Affects scheduling |
| Medium | `upload_photo` | 3 | Useful but can wait |
| Low | `upload_video` | 2 | Large files, can wait |
| Low | `send_message` | 2 | Important but not critical |
| Low | `request_parts` | 3 | Affects supply chain |

## Conflict Resolution

| Scenario | Strategy |
|---|---|
| Job updated by dispatcher while offline | Server wins, notify technician |
| Checklist item updated while offline | Last-write-wins (timestamps) |
| Evidence uploaded with same caption | Both preserved, dedup by file hash |
| Status conflict (e.g., dispatcher completed while technician paused) | Server status wins, notify |
| Parts usage conflict | Merge quantities, alert on discrepancy |

## Sync Status Display

- **Topbar indicator**: Shows syncing state
- **Sync settings page**: Shows last sync time and pending count
- **Upload pages**: Shows "Will sync when online" when offline
- **Notification**: Toast on sync complete/failed

## Events

| Event | When | Payload |
|---|---|---|
| `offline.sync.started` | Sync begins | `{ timestamp }` |
| `offline.sync.completed` | All items synced | `{ timestamp, uploaded, downloaded }` |
| `offline.sync.failed` | Sync error | `{ error }` |
| `network.status.changed` | Online/offline transition | `{ isOnline }` |

## Future Implementation

- [ ] IndexedDB queue storage (persistent across sessions)
- [ ] Background sync via Service Worker
- [ ] Periodic sync checks (every 30s when online)
- [ ] Progress indicator for sync operations
- [ ] Detailed sync log page
- [ ] Manual "Sync Now" button on settings page
