# State Management

## Architecture

Support Center v2 uses **React Context** for global state and **custom hooks** for data fetching. No external state management library (Redux, Zustand, etc.).

```
┌──────────────────────────────────────────┐
│              AppProvider                   │
│  (React Context — wraps entire app)       │
│                                           │
│  State:                                   │
│  ├─ currentUserId / currentUserName       │
│  ├─ currentUserRoles / Permissions        │
│  ├─ activeFilters (TicketListFilters)     │
│  ├─ selectedTicketIds (bulk selection)    │
│  ├─ viewMode (table | kanban)            │
│  └─ notifications (NotificationToast[])  │
│                                           │
│  Actions:                                 │
│  ├─ setCurrentUser()                      │
│  ├─ setActiveFilters()                    │
│  ├─ toggleTicketSelection()               │
│  ├─ clearSelection()                      │
│  ├─ setViewMode()                         │
│  ├─ addNotification()                     │
│  └─ dismissNotification()                 │
└──────────────────┬───────────────────────┘
                   │ useContext(useAppContext)
    ┌──────────────┼──────────────┐
    │              │              │
 TicketQueue    TicketDetail   MyTickets
   Page            Page          Page
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
| `useTickets(filters?)` | `src/hooks/useTickets.ts` | `ticketService.list()` |
| `useTicketDetail(id)` | `src/hooks/useTicketDetail.ts` | `ticketService.getById()` |
| `useTemplates()` | `src/hooks/useTemplates.ts` | `ticketService.getTemplates()` |
| `useSLAMetrics()` | `src/hooks/useSLAMetrics.ts` | `ticketService.getSLAMetrics()` |

## State Shapes

### AppState (React Context)

```typescript
interface AppState {
  currentUserId: string;          // Current agent's user ID
  currentUserName: string;        // Display name
  currentUserRoles: string[];     // e.g. ['agent', 'team_lead']
  currentUserPermissions: string[];
  activeFilters: TicketListFilters;
  selectedTicketIds: string[];    // For bulk actions
  viewMode: 'table' | 'kanban';
  notifications: NotificationToast[];
}
```

### Data Hook Return Types

```typescript
// useTickets
{
  tickets: TicketListItem[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useTicketDetail
{
  detail: TicketDetailVM | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useTemplates
{
  templates: TemplateDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useSLAMetrics
{
  metrics: SLAMetricsVM | null;
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
| View Mode | localStorage |
| Notifications | In-memory only |

## Loading/Local State

Individual page components also use local `useState` for:
- Form input values (NewTicketPage, TemplatesPage, QueueSettingsPage)
- Search text (TicketQueuePage, MyTicketsPage)
- Pagination page number (TicketQueuePage, MyTicketsPage, EscalationsPage)
- Filter values (TicketQueuePage, MyTicketsPage)
- Dialog open/close state (TemplatesPage)
- Reply editor content (TicketDetailPage)
