# REALTIME READINESS REPORT — ResQAI V2

## 1. Assessment Overview

| Dimension | Current State | Target State | Gap | Effort |
|---|---|---|---|---|
| Event Architecture | Complete (88 events, 14 topics, 15 state machines) | Real-time event streaming via WebSocket | Need channel routing layer | Low |
| Subscriptions | None | Per-app subscription model (SUBSCRIPTION_MAP.md) | Need to implement subscription hooks | Medium |
| Live Bindings | Manual fetch + useEffect patterns | Live hooks (useLiveList, useLiveRecord, useLiveKpi, useLiveMutation) | Need to build hook library | High |
| Cache Strategy | None (direct DB queries) | 3-tier cache (Redis + IndexedDB + React state) | Need Redis setup + invalidation pipeline | High |
| Sync Policy | No sync mechanism | Hybrid live push + periodic reconcile | Need sync manager | High |
| Offline Support | None | IndexedDB + mutation queue | Need offline layer | High |
| WebSocket Infrastructure | None | Pusher/Socket.IO | Need gateway setup & auth | Medium |
| Change Data Capture | None | PostgreSQL logical replication | Need CDC setup + replication slot | Medium |
| Optimistic Updates | Manual optimistic state in hooks | Formalized optimistic protocol with revert | Need useLiveMutation hook | Medium |

## 2. Readiness Score by Component

### 2.1 Event System

```
Score: ██████████ 10/10
- Event architecture documented and reviewed
- 88 event types defined with schemas
- 14 topics with retention policies
- Outbox pattern (events_v2 table)
- Correlation and idempotency keys
- Producer/consumer matrices complete
- State machine transitions mapped to events
```

### 2.2 Database Readiness

```
Score: ██████████ 10/10
- All tables use UUID PKs and version columns (optimistic locking ready)
- created_at / updated_at on all tables
- Soft-delete via deleted_at
- RLS policies defined
- Partial + GIN indexes in place
- Audit trail via audit_log_v2
- Table schemas finalized
```

### 2.3 Frontend State Management

```
Score: ████████░░ 8/10
- Shared state (Auth, User, Org, Theme, Notification) in Context
- App-specific state (atoms.ts) with typed interfaces
- Custom hooks (useTickets, useDashboard, useDisputes) exist
- NO live subscription integration yet
- Hook patterns are pure useState/useEffect — need refactor
- Optimistic updates manually implemented — need formalization
```

### 2.4 SDK & Data Access

```
Score: ███████░░░ 7/10
- Lemma SDK provides listRecords, getRecord, updateRecord, etc.
- Service layer wraps SDK for each app
- NO streaming/subscription support in SDK yet
- NO cache layer in SDK
- NO offline queue in SDK
- SDK is singleton pattern — needs extension
```

### 2.5 Infrastructure

```
Score: ██░░░░░░░░ 2/10
- NO WebSocket gateway configured
- NO Redis instance provisioned
- NO CDC replication slots active
- NO Pusher/Socket.IO project created
- NO message broker for event → channel routing
- NO cache invalidation service
- NO sync manager service
```

### 2.6 Testing & QA

```
Score: █░░░░░░░░░ 1/10
- NO real-time integration tests
- NO WebSocket connection/disconnection tests
- NO offline/online transition tests
- NO conflict resolution tests
- NO cache invalidation tests
- NO subscription lifecycle tests
- Existing unit tests for services exist (ticket-service, dispute-service)
```

## 3. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

| Task | Dependencies | Deliverables |
|---|---|---|
| Provision Redis | Infrastructure | Redis cluster ready |
| Setup Pusher/Socket.IO | Infrastructure | WebSocket gateway ready |
| Configure PostgreSQL CDC | Database | Logical replication slots active |
| Extend Lemma SDK with subscription methods | SDK v2 | `subscribe`, `unsubscribe`, `onEvent` methods |

### Phase 2: Core Hooks (Weeks 4-6)

| Task | Dependencies | Deliverables |
|---|---|---|
| Build `useLiveList` | SDK + WebSocket | Live list hook |
| Build `useLiveRecord` | SDK + WebSocket | Live record hook |
| Build `useLiveKpi` | SDK + WebSocket | Live KPI hook with debounce |
| Build `useLiveMutation` | SDK + WebSocket | Optimistic mutation hook |
| Build subscription registry | SDK | Global subscription tracking |

### Phase 3: Cache Layer (Weeks 7-8)

| Task | Dependencies | Deliverables |
|---|---|---|
| Implement Redis cache-aside | Redis | Record + list caching |
| Implement cache invalidation | CDC + Event bus | Event-driven invalidation |
| Build IndexedDB offline store | IndexedDB | Client-side entity cache |
| Implement stale-while-revalidate | Cache + WebSocket | Client-side freshness |

### Phase 4: Sync Layer (Weeks 9-11)

| Task | Dependencies | Deliverables |
|---|---|---|
| Build mutation queue | IndexedDB | Offline queue |
| Implement flush pipeline | Sync manager | Queue processing on reconnect |
| Build conflict resolver | Sync manager | Auto-merge + conflict UI |
| Implement periodic reconcile | Sync manager | Background consistency check |
| Build reconnection handler | Sync manager | Missed-event recovery |

### Phase 5: App Integration (Weeks 12-14)

| Task | Dependencies | Deliverables |
|---|---|---|
| Refactor `useTickets` to use live hooks | Phase 2 | Support Queue live |
| Refactor `useDashboard` to use live hooks | Phase 2 | Ops Dashboard live |
| Refactor `useDisputes` to use live hooks | Phase 2 | Resolution Center live |
| Build `useAccounts` (CRM) with live hooks | Phase 2 | CRM Tracker live |
| Implement notification bell live | Phase 2 | Global notifications live |

### Phase 6: Testing & Hardening (Weeks 15-16)

| Task | Dependencies | Deliverables |
|---|---|---|
| Real-time integration tests | All phases | Test suite |
| WebSocket disconnect/reconnect tests | All phases | Resilience verified |
| Offline/online transition tests | All phases | Offline verified |
| Conflict resolution tests | All phases | Merge verified |
| Cache invalidation tests | All phases | Cache verified |
| Load test (10K concurrent connections) | Infrastructure | Performance verified |

## 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CDC replication lag >5s during peak | Medium | High | Monitor lag; switch to polling fallback; async warming |
| WebSocket message ordering mismatch | Low | Medium | Sequence numbers per entity; client-side reorder buffer |
| IndexedDB quota exceeded on low-end devices | Medium | Low | LRU eviction; warn user; limit cache size |
| Conflict resolution ambiguity for offline edits | Medium | Medium | Always present user choice for unresolvable conflicts |
| Pusher rate limits during burst events | Low | High | Client-side debounce; batch events; queue overflow |
| Optimistic revert causes UI flicker | Medium | Low | Smooth transitions; ref counting for rapid mutations |
| State machine transition rejected due to race | Low | Medium | Server-side atomic check; retry with fresh state |

## 5. Dependency Graph

```
Phase 1 (Foundation)
  ├── Redis provisioning ───────────────────────────┐
  ├── WebSocket gateway ─────────────────────────┐  │
  ├── PostgreSQL CDC ──────────────────────────┐  │  │
  └── SDK extension ───────────────────────┐   │  │  │
                                           │   │  │  │
Phase 2 (Core Hooks) ◄─────────────────────┘   │  │  │
  ├── useLiveList ──────────────────────────────┘  │  │
  ├── useLiveRecord ───────────────────────────────┘  │
  ├── useLiveKpi ─────────────────────────────────────┘
  ├── useLiveMutation ─────────────────────────────────┘
  └── Subscription registry ───────────────────────────┐
                                                       │
Phase 3 (Cache Layer) ◄────────────────────────────────┘
  ├── Redis cache-aside ───────────────────────────────┐
  ├── Cache invalidation ──────────────────────────────┤
  ├── IndexedDB store ─────────────────────────────────┤
  └── Stale-while-revalidate ──────────────────────────┤
                                                       │
Phase 4 (Sync Layer) ◄─────────────────────────────────┘
  ├── Mutation queue ──────────────────────────────────┐
  ├── Flush pipeline ──────────────────────────────────┤
  ├── Conflict resolver ───────────────────────────────┤
  ├── Periodic reconcile ──────────────────────────────┤
  └── Reconnection handler ────────────────────────────┤
                                                       │
Phase 5 (App Integration) ◄────────────────────────────┘
  ├── Support Queue ───────────────────────────────────┐
  ├── Ops Dashboard ───────────────────────────────────┤
  ├── Resolution Center ───────────────────────────────┤
  ├── CRM Tracker ─────────────────────────────────────┤
  └── Notifications ───────────────────────────────────┘
                                                       │
Phase 6 (Testing) ◄────────────────────────────────────┘
```

## 6. Resource Estimates

| Phase | Frontend (weeks) | Backend (weeks) | Infrastructure (weeks) | Testing (weeks) |
|---|---|---|---|---|
| Phase 1 | 0 | 1 | 2 | 0 |
| Phase 2 | 3 | 1 | 0 | 0 |
| Phase 3 | 1 | 1 | 1 | 0 |
| Phase 4 | 1 | 2 | 0 | 0 |
| Phase 5 | 3 | 0 | 0 | 0 |
| Phase 6 | 0 | 1 | 0 | 2 |
| **Total** | **8** | **6** | **3** | **2** |

## 7. Key Milestones

| Milestone | Date (from start) | Criteria |
|---|---|---|
| WebSocket connection established | Week 2 | Client connects, authenticates, receives test event |
| First live list renders | Week 5 | Ticket list updates via WebSocket |
| First optimistic mutation | Week 6 | Status change confirms with revert on failure |
| Cache invalidation pipeline live | Week 8 | Redis evicts on CDC event |
| First offline mutation synced | Week 10 | Queue flush succeeds on reconnect |
| All apps live | Week 14 | 4 apps + shell using live hooks |
| Production ready | Week 16 | All tests pass, load test satisfied |
