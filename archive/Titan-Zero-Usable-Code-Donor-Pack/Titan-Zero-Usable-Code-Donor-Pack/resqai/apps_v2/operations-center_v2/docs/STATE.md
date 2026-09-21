# State Management

## Architecture

Operations Center v2 uses **React Context** for global state and **custom hooks** for data fetching. No external state management library (Redux, Zustand, etc.).

```
┌──────────────────────────────────────────┐
│              AppProvider                   │
│  (React Context — wraps entire app)       │
│                                           │
│  State:                                   │
│  ├─ currentUserId / currentUserName       │
│  ├─ currentUserRoles / Permissions        │
│  ├─ activeFilters (OperationsListFilters) │
│  ├─ selectedOperationIds (bulk selection) │
│  └─ notifications (NotificationToast[])  │
│                                           │
│  Actions:                                 │
│  ├─ setCurrentUser()                      │
│  ├─ setActiveFilters()                    │
│  ├─ toggleOperationSelection()            │
│  ├─ clearSelection()                      │
│  ├─ addNotification()                     │
│  └─ dismissNotification()                 │
└──────────────────┬───────────────────────┘
                   │ useContext(useAppContext)
     ┌─────────────┼─────────────┐
     │             │             │
  Dashboard    Dispatch       Escalation
    Page        Page            Page
```

## Data Fetching Pattern

Each domain has a dedicated custom hook that follows the same pattern:

```
┌──────────────────────┐
│   Custom Hook         │
│                       │
│  useState: data[]     │
│  useState: loading    │
│  useState: error      │
│                       │
│  useEffect → fetch()  │
│  return { data,       │
│          loading,     │
│          error,       │
│          refetch }    │
└──────────────────────┘
```

| Hook | File | Data Source |
|------|------|-------------|
| `useOperations(filters?)` | `src/hooks/useOperations.ts` | `operationsService.list()` |
| `useTechnicians()` | `src/hooks/useTechnicians.ts` | `operationsService.getTechnicians()` |
| `useDispatchQueue()` | `src/hooks/useDispatchQueue.ts` | `operationsService.list({ status: [...] })` |
| `useEscalations()` | `src/hooks/useEscalations.ts` | `operationsService.getEscalations()` |
| `useOperationsTimeline()` | `src/hooks/useOperationsTimeline.ts` | `operationsService.getTimeline()` |
| `useLiveMetrics()` | `src/hooks/useLiveMetrics.ts` | `operationsService.getDashboardMetrics()` |

## State Shapes

### AppState (React Context)

```typescript
interface AppState {
  currentUserId: string;          // Current operator's user ID
  currentUserName: string;        // Display name
  currentUserRoles: string[];     // e.g. ['operations_manager', 'dispatcher']
  currentUserPermissions: string[];
  activeFilters: OperationsListFilters;
  selectedOperationIds: string[]; // For bulk actions
  notifications: NotificationToast[];
}
```

### Data Hook Return Types

```typescript
// useOperations
{
  operations: OperationDTO[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useTechnicians
{
  technicians: TechnicianDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useDispatchQueue
{
  pendingOperations: OperationDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useEscalations
{
  escalations: EscalationDTO[];
  total: number;
  openCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useOperationsTimeline
{
  events: TimelineEventDTO[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useLiveMetrics
{
  metrics: DashboardMetricsVM | null;
  liveMetrics: LiveMetricVM[];
  regionalStatus: RegionalStatusVM[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
```

## Notification System

Notifications are managed in AppContext:
- `addNotification({ type, title, message })` — adds toast, auto-dismisses after 6s
- `dismissNotification(id)` — manual dismiss
- `clearNotifications()` — dismiss all

Types: `success | error | info | warning`

## State Persistence

Currently all state is in-memory (React state). Future:

| State | Persistence Strategy |
|-------|---------------------|
| Auth/User | Lemma SDK session |
| Filters | URL query params (hash) |
| Notifications | In-memory only |

## Loading/Local State

Individual page components also use local `useState` for:
- Form input values (ManualDispatchForm, ReassignTechnicianForm, etc.)
- Search text (DispatchQueuePage, SearchPage, AssignmentBoardPage)
- Pagination page number (DispatchQueuePage, AssignmentBoardPage)
- Filter values (LiveOperationsBoardPage, RegionalOperationsPage)
- Dialog open/close state (DispatchQueuePage, EscalationQueuePage, AssignmentBoardPage)
- Date picker value (DailyOperationsPage)
- Region selector (RegionalOperationsPage)
