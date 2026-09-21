# LIVE BINDINGS — ResQAI V2

## 1. Binding Architecture

Live bindings connect frontend state (React Context/hooks) to backend real-time channels. Each binding consists of a **subscription specification** and a **state reconciliation handler**.

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │  React Components│◄──►│  Live Bindings Layer         │   │
│  │  (UI)            │    │  ┌─────────┐ ┌────────────┐  │   │
│  └──────────────────┘    │  │useLive  │ │useLive     │  │   │
│                          │  │List     │ │Record      │  │   │
│                          │  ├─────────┤ ├────────────┤  │   │
│                          │  │useLive  │ │useLive     │  │   │
│                          │  │Kpi      │ │Mutation    │  │   │
│                          │  └─────────┘ └────────────┘  │   │
│                          └──────────────┬────────────────┘   │
└─────────────────────────────────────────┼─────────────────────┘
                                          │
┌─────────────────────────────────────────▼─────────────────────┐
│                    SUBSCRIPTION LAYER                          │
│  ┌──────────────────┐    ┌──────────────────────────────┐     │
│  │  Channel Manager │    │  Subscription Registry       │     │
│  │  (Pusher/Socket) │    │  { channel, event, filter,  │     │
│  │                  │    │    callback, stateKey }      │     │
│  └──────────────────┘    └──────────────────────────────┘     │
└────────────────────────────────────────────────────────────────┘
```

## 2. Live Binding Hooks

### 2.1 `useLiveList<T>`

Binds a list view to real-time entity events.

```typescript
interface UseLiveListOptions<T> {
  table: string;
  channel: string;
  events: {
    created?: string;
    updated?: string;
    deleted?: string;
  };
  filter?: (item: T) => boolean;
  sort?: (a: T, b: T) => number;
  initialFetch: () => Promise<T[]>;
  optimistic?: boolean;
  debounceMs?: number;
}

type UseLiveListReturn<T> = {
  items: T[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
};
```

**Binding Map:**

| App | Hook Instance | Table | Channel | Events |
|---|---|---|---|---|
| Support Queue | `useLiveList<Ticket>` | `tickets_v2` | `private-app-support-queue-ticket` | created: `ticket.created`, updated: `ticket.status.changed`, deleted: `ticket.deleted` |
| Resolution Center | `useLiveList<Dispute>` | `disputes_v2` | `private-app-resolution-center-dispute` | created: `dispute.created`, updated: `dispute.*`, deleted: `dispute.deleted` |
| CRM Tracker | `useLiveList<Account>` | `accounts_v2` | `private-app-crm-tracker-account` | created: `account.created`, updated: `account.*`, deleted: `account.deleted` |
| CRM Tracker | `useLiveList<Followup>` | `followups_v2` | `private-app-crm-tracker-followup` | created: `followup.created`, updated: `followup.*`, deleted: `followup.deleted` |

### 2.2 `useLiveRecord<T>`

Binds a single record detail view.

```typescript
interface UseLiveRecordOptions<T> {
  table: string;
  id: string;
  channel: string;
  events: {
    updated: string;
    deleted?: string;
  };
  initialFetch: () => Promise<T>;
}

type UseLiveRecordReturn<T> = {
  record: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
};
```

**Binding Map:**

| App | Hook Instance | Table | Channel Pattern | Events |
|---|---|---|---|---|
| Support Queue | `useLiveRecord<Ticket>` | `tickets_v2` | `private-entity-ticket-{id}` | updated: `ticket.*`, deleted: `ticket.deleted` |
| Resolution Center | `useLiveRecord<Dispute>` | `disputes_v2` | `private-entity-dispute-{id}` | updated: `dispute.*`, deleted: `dispute.deleted` |
| CRM Tracker | `useLiveRecord<Account>` | `accounts_v2` | `private-entity-account-{id}` | updated: `account.*`, deleted: `account.deleted` |
| Ops Dashboard | `useLiveRecord<DashboardData>` | `N/A (composite)` | `private-org-{orgId}` | updated: `dashboard.*` |

### 2.3 `useLiveKpi`

Binds KPI computations to real-time event streams with debouncing to avoid excessive re-renders.

```typescript
interface UseLiveKpiOptions {
  channel: string;
  events: string[];
  computeKpi: () => Promise<KpiSummary>;
  debounceMs?: number; // default 2000ms
}

type UseLiveKpiReturn = {
  kpi: KpiSummary | null;
  loading: boolean;
};
```

**Binding Map:**

| App | Events Subscribed | computeKpi | Debounce |
|---|---|---|---|
| Ops Dashboard | `ticket.*`, `dispute.*`, `appointment.*`, `work_order.*`, `task.*` | `computeKpi(data)` | 2s |
| Resolution Center | `dispute.*`, `appointment.*` | Inline KPI aggregation | 1.5s |

### 2.4 `useLiveMutation`

Handles optimistic mutations with server confirmation.

```typescript
interface UseLiveMutationOptions<T> {
  table: string;
  channel: string;
  confirmEvent: string;
  rejectEvent?: string;
  timeout?: number; // default 10s
}

type UseLiveMutationReturn<T> = {
  mutate: (id: string, data: Partial<T>) => Promise<{ confirmed: boolean; error?: string }>;
  pending: Map<string, Partial<T>>;
  inFlight: boolean;
};
```

**Binding Map:**

| App | Table | confirmEvent | rejectEvent |
|---|---|---|---|
| Support Queue | `tickets_v2` | `ticket.status.changed` | `ticket.update.rejected` |
| Resolution Center | `disputes_v2` | `dispute.analyzed` | `dispute.update.rejected` |
| CRM Tracker | `accounts_v2` | `account.*` | `account.update.rejected` |

## 3. State Reconciliation Strategy

### 3.1 List Reconciliation (`useLiveList`)

| Event | Action |
|---|---|
| `created` | Insert item at sorted position; update `lastUpdated` |
| `updated` | Replace item in-place if exists; rel sort if sort key affected |
| `deleted` | Remove item from list; clear selection if selected item deleted |

### 3.2 Record Reconciliation (`useLiveRecord`)

| Event | Action |
|---|---|
| `updated` | Merge event payload with existing record; update `lastUpdated` |
| `deleted` | Set record to `null`; trigger navigation away |

### 3.3 Optimistic → Server Reconciliation (`useLiveMutation`)

| Outcome | Action |
|---|---|
| Server confirms (within timeout) | Update record from server payload; resolve success |
| Server rejects | Revert optimistic patch; show error notification |
| Timeout | Revert optimistic patch; show connection error; queue retry |

## 4. Cross-App Binding Matrix

| Source Entity | Emitted Event | Consumed By (App + Binding) |
|---|---|---|
| Ticket | `ticket.created` | Support Queue (useLiveList), Ops Dashboard (useLiveKpi) |
| Ticket | `ticket.status.changed` | Support Queue (useLiveList + useLiveRecord), Ops Dashboard (useLiveKpi + useLiveRecord) |
| Ticket | `ticket.sla_breached` | Support Queue (useLiveRecord), Ops Dashboard (useLiveKpi) |
| Dispute | `dispute.*` | Resolution Center (useLiveList + useLiveRecord + useLiveKpi) |
| Appointment | `appointment.*` | Ops Dashboard (useLiveKpi), Resolution Center (useLiveKpi) |
| Work Order | `work_order.*` | Ops Dashboard (useLiveKpi) |
| Account | `account.*` | CRM Tracker (useLiveList + useLiveRecord) |
| Account Health | `account.health.changed` | CRM Tracker (useLiveRecord + useLiveKpi) |
| Followup | `followup.*` | CRM Tracker (useLiveList) |
| Notification | `notification.*` | All apps (global notification listener) |

## 5. Binding Registration Example

```typescript
// apps/support-queue/src/hooks/useTickets.ts (extended with live binding)
function useTickets() {
  const liveList = useLiveList<Ticket>({
    table: 'tickets_v2',
    channel: 'private-app-support-queue-ticket',
    events: {
      created: 'ticket.created',
      updated: 'ticket.status.changed',
      deleted: 'ticket.deleted',
    },
    filter: (ticket) => matchesFilter(ticket, state.filter),
    sort: (a, b) => b.created_at.localeCompare(a.created_at),
    initialFetch: fetchTickets,
  });

  // ... existing state management wraps liveList
  return { tickets: liveList.items, loading: liveList.loading, /* ... */ };
}
```

## 6. Performance Considerations

| Binding Type | Memory Overhead | CPU Overhead | Network Overhead |
|---|---|---|---|
| `useLiveList` (100 items) | ~5KB | Event filter + sort per update | ~1KB per event |
| `useLiveRecord` | ~0.5KB | Merge per update | ~0.5KB per event |
| `useLiveKpi` | ~1KB | Aggregate recompute per batch | ~2KB per batch |
| `useLiveMutation` | ~0.1KB per pending | Revert/reapply logic | ~0.3KB per mutation |

All bindings should be torn down in `useEffect` cleanup when component unmounts.
