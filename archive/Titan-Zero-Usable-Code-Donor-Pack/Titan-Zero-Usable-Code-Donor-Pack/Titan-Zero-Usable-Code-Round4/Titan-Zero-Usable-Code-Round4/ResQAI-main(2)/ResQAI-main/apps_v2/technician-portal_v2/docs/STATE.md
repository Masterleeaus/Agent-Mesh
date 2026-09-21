# State Management

## Architecture

Technician Portal v2 uses **React Context** for global state and **custom hooks** for data fetching. No external state management library (Redux, Zustand, etc.).

```
+--------------------------------------------+
|              AppProvider                     |
|  (React Context - wraps entire app)         |
|                                              |
|  State:                                      |
|  +- currentUserId / currentUserName          |
|  +- currentUserRoles / Permissions           |
|  +- activeFilters (JobListFilters)           |
|  +- selectedJobIds (bulk selection)          |
|  +- viewMode (list | calendar)              |
|  +- networkStatus (online | offline)        |
|  +- gpsStatus (enabled | disabled)          |
|  +- isSyncing (boolean)                     |
|  +- pendingSyncCount (number)               |
|  +- notifications (NotificationToast[])     |
|                                              |
|  Actions:                                    |
|  +- setCurrentUser()                         |
|  +- setActiveFilters()                       |
|  +- toggleJobSelection()                     |
|  +- clearSelection()                         |
|  +- setViewMode()                            |
|  +- setNetworkStatus()                       |
|  +- setGpsStatus()                           |
|  +- setIsSyncing()                           |
|  +- setPendingSyncCount()                    |
|  +- addNotification()                        |
|  +- dismissNotification()                    |
+------------------+--------------------------+
                   | useContext(useAppContext)
       +-----------+-----------+------+
       |           |           |      |
  Dashboard    TodayJobs   JobDetail  Messages
    Page         Page        Page     Page
```

## Data Fetching Pattern

Each domain has a dedicated custom hook that follows the same pattern:

```
+----------------------+
|   Custom Hook         |
|                       |
|  useState: data[]     |
|  useState: loading    |
|  useState: error      |
|                       |
|  useEffect -> fetch() |
|  return { data,       |
|          loading,     |
|          error,       |
|          refetch }    |
+----------------------+
```

| Hook | File | Data Source |
|---|---|---|
| `useDashboard()` | `src/hooks/useDashboard.ts` | `technicianService.getDashboard()` |
| `useJobs(filters?)` | `src/hooks/useJobs.ts` | `technicianService.listJobs()` |
| `useJobDetail(id)` | `src/hooks/useJobDetail.ts` | `technicianService.getJobById()` |
| `useNotifications()` | `src/hooks/useNotifications.ts` | `technicianService.getNotifications()` |
| `useMessages(jobId)` | `src/hooks/useMessages.ts` | `technicianService.getMessages()` |

## State Shapes

### AppState (React Context)

```typescript
interface AppState {
  currentUserId: string;          // Current technician's user ID
  currentUserName: string;        // Display name
  currentUserRoles: string[];     // e.g. ['technician', 'senior_technician']
  currentUserPermissions: string[];
  activeFilters: JobListFilters;
  selectedJobIds: string[];       // For bulk actions
  viewMode: 'list' | 'calendar';
  networkStatus: 'online' | 'offline';
  gpsStatus: 'enabled' | 'disabled';
  isSyncing: boolean;
  pendingSyncCount: number;
  notifications: NotificationToast[];
}
```

### Data Hook Return Types

```typescript
// useDashboard
{
  dashboard: DashboardVM | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useJobs
{
  jobs: JobListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useJobDetail
{
  detail: JobDetailVM | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useNotifications
{
  notifications: NotificationVM[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

// useMessages
{
  messages: MessageVM[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  sendMessage: (body: string) => Promise<void>;
}
```

## Notification System

Notifications are managed in AppContext:
- `addNotification({ type, title, message })` - adds toast, auto-dismisses after 6s
- `dismissNotification(id)` - manual dismiss
- `clearNotifications()` - dismiss all

Types: `success | error | info | warning`

## State Persistence

Currently all state is in-memory (React state). Future:

| State | Persistence Strategy |
|---|---|
| Auth/User | Lemma SDK session |
| Network Status | navigator.onLine + events |
| GPS Status | navigator.geolocation |
| Filters | URL query params (hash) |
| View Mode | localStorage |
| Offline Queue | localStorage / IndexedDB |
| Notifications | In-memory only |
