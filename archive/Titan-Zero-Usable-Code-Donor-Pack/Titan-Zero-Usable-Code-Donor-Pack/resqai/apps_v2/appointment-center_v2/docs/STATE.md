# State Management

## Architecture

Appointment Center V2 uses **React Context** for global state and **custom hooks** for data fetching. No external state management library.

```
┌────────────────────────────────────────────┐
│              AppProvider                     │
│  (React Context — wraps entire app)         │
│                                             │
│  State:                                     │
│  ├─ currentUser                             │
│  ├─ activeFilters                           │
│  ├─ dateRange                               │
│  ├─ viewMode (day | week | month | timeline)│
│  ├─ selectedTechnician                      │
│  ├─ selectedAppointmentIds                  │
│  ├─ sidebarCollapsed                        │
│  ├─ offline                                 │
│  └─ notifications (NotificationToast[])    │
│                                             │
│  Actions:                                   │
│  ├─ setActiveFilters()                      │
│  ├─ setDateRange()                          │
│  ├─ setViewMode()                           │
│  ├─ setSelectedTechnician()                 │
│  ├─ toggleAppointmentSelection()            │
│  ├─ clearSelection()                        │
│  ├─ toggleSidebar()                         │
│  ├─ setOffline()                            │
│  ├─ addNotification()                       │
│  ├─ dismissNotification()                   │
│  └─ clearNotifications()                    │
└──────────────────┬─────────────────────────┘
                   │ useContext(useAppContext)
     ┌─────────────┼──────────────┐
     │             │              │
  Dashboard    Appointment     Appointment
    Page        Queue Page     Detail Page
```

## Data Fetching Pattern

Each domain has a dedicated custom hook following the same pattern:
- `useState` for data, loading, error
- `useEffect` triggers fetch on mount
- Returns `{ data, loading, error, refetch }`

| Hook | File | Data Source |
|------|------|-------------|
| `useAppointments(filters?)` | `src/hooks/useAppointments.ts` | `appointmentService.list()` |
| `useAppointmentDetail(id)` | `src/hooks/useAppointmentDetail.ts` | `appointmentService.getById()` |
| `useTechnicians()` | `src/hooks/useTechnicians.ts` | `appointmentService.listTechnicians()` |
| `useTechnicianSchedule(id, date)` | `src/hooks/useTechnicianSchedule.ts` | `appointmentService.getTechnicianSchedule()` |
| `useServiceTypes()` | `src/hooks/useServiceTypes.ts` | `appointmentService.listServiceTypes()` |
| `useAvailableSlots(date, svcId)` | `src/hooks/useAvailableSlots.ts` | `appointmentService.getAvailableSlots()` |
| `useScheduleSettings()` | `src/hooks/useScheduleSettings.ts` | Mock settings data |
| `useAppointmentStats()` | `src/hooks/useAppointmentStats.ts` | `appointmentService.getDashboardStats()` |
| `useAppointmentHistory(id)` | `src/hooks/useAppointmentHistory.ts` | `appointmentService.getHistory()` |
| `useAllHistory(filters?)` | `src/hooks/useAppointmentHistory.ts` | `appointmentService.getAllHistory()` |
| `useSearch(query)` | `src/hooks/useSearch.ts` | `appointmentService.search()` |
| `useDashboard()` | `src/hooks/useDashboard.ts` | Composes stats + appointments |

## State Shapes

### AppState (React Context)
```typescript
interface AppState {
  currentUser: { id: string; name: string; role: string } | null;
  activeFilters: Record<string, any>;
  dateRange: { start: string; end: string } | null;
  viewMode: 'day' | 'week' | 'month' | 'timeline';
  selectedTechnician: string | null;
  selectedAppointmentIds: string[];
  sidebarCollapsed: boolean;
  offline: boolean;
  notifications: NotificationToast[];
}
```

### Data Hook Return Types
All hooks return `{ data, loading, error, refetch }` where data varies per hook.

## Notification System
- `addNotification({ type, title, message })` — adds toast, auto-dismiss after 6s
- `dismissNotification(id)` — manual dismiss
- `clearNotifications()` — dismiss all
- Types: `success | error | info | warning`

## State Persistence

| State | Strategy |
|-------|----------|
| Auth/User | Lemma SDK session (future) |
| Filters | In-memory (future: URL params) |
| View Mode | In-memory (future: localStorage) |
| Notifications | In-memory only |

## Loading/Local State

Individual pages use local `useState` for:
- Form input values (NewAppointmentPage, ReschedulePage, ServiceTypesPage)
- Search text (AppointmentQueuePage, CalendarViewPage, etc.)
- Pagination page number
- Filter values
- Dialog open/close state
