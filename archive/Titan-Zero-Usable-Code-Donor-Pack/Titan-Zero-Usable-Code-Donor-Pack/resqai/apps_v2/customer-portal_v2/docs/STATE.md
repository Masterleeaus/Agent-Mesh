# customer-portal_v2 — State Management

## Architecture

State in Customer Portal V2 is managed across three layers:

```
Layer 1: React Context (AppContext)
  ├── customerId
  ├── notificationUnreadCount
  └── activeFilters

Layer 2: Custom Data Hooks (useXxx)
  ├── data (T | null)
  ├── loading (boolean)
  ├── error (string | null)
  └── refetch (function)

Layer 3: Local Component State
  ├── Form inputs (useState)
  ├── Dialog open state (useState)
  ├── Pagination page (useState)
  └── Search/filter values (useState)
```

## Data Fetching Pattern

Every data hook follows the identical pattern:

```typescript
export function useDomain(params?) {
  const [data, setData] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    CustomerService.method(params)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
```

All hooks implement cancellation via `cancelled` flag in useEffect cleanup to prevent state updates on unmounted components.

## Hook Return Types

| Hook                     | Returns                                         |
|--------------------------|-------------------------------------------------|
| useDashboard             | `{ data, loading, error }`                      |
| useCustomerTickets       | `{ data, total, loading, error, refetch }`      |
| useTicketDetail          | `{ data, loading, error }`                      |
| useCustomerAppointments  | `{ data, total, loading, error, refetch }`      |
| useAppointmentDetail     | `{ data, loading, error }`                      |
| useAvailableSlots        | `{ data, loading, error }`                      |
| useInvoices              | `{ data, total, loading, error, refetch }`      |
| useInvoiceDetail         | `{ data, loading, error }`                      |
| usePayments              | `{ data, total, loading, error, refetch }`      |
| useMessages              | `{ data, total, loading, error }`               |
| useTicketMessages        | `{ data, loading, error, sendMessage }`         |
| useNotifications         | `{ data, total, unreadCount, loading, error, markRead, markAllRead, refetch }` |
| useFeedback              | `{ data, total, loading, error, submitting, submitFeedback }` |
| useKnowledgeBaseSearch   | `{ data, total, loading, error, search }`       |
| useKnowledgeBaseArticle  | `{ data, loading, error }`                      |
| useDownloads             | `{ data, total, loading, error }`               |
| useServiceHistory        | `{ data, total, loading, error, refetch }`      |
| useTechnicianTracking    | `{ data, loading, error, refetch }`             |
| useLiveTechnicianStatus  | `{ data, loading, error, refetch }` (auto-polls)|
| useSecuritySettings      | `{ settings, loading, error, toggleTwoFactor, revokeSession }` |
| useHelpCenter            | `{ faqs, loading, error }`                      |
| useCustomerSatisfaction  | `{ data, loading, error }`                      |
| useAppointmentCalendar   | `{ days, loading, error, navigateMonth, year, month }` |
| useCustomerDisputes      | `{ data, total, loading, error }`               |
| useDisputeDetail         | `{ data, loading, error }`                      |
| useCustomerProfile       | `{ profile, preferences, loading, saving, error, updateProfile, updatePreferences }` |
| useAccountHealth         | `{ account, health, followups, loading, error }`|

## AppContext State Shape

```typescript
interface AppState {
  customerId: string | null;
  notificationUnreadCount: number;
  activeFilters: Record<string, string[]>;
}
```

## Notification System

Notifications are managed via the `useNotifications` hook which provides:

- **markRead(id)**: Optimistically marks a single notification as read (updates local state + API call)
- **markAllRead()**: Marks all notifications as read
- **unreadCount**: Derived from the notification list, used for badge display

## State Persistence

Currently, state is ephemeral (in-memory only). No localStorage, sessionStorage, or IndexedDB persistence is implemented. Future iterations may add:

- `activeFilters` → preserved in URL hash
- `customerId` → persisted in sessionStorage
- `unreadCount` → synced from server on app mount

## Local State Patterns

- **Forms**: Each form component manages its own state via `useState`. Form fields are controlled components.
- **Dialogs**: Dialog visibility controlled by boolean `useState` in the parent page component.
- **Pagination**: Page number stored in `useState` in the list component. Reset on filter/search change.
- **Search/Filter**: Text search and filter values stored in local state. Debounced search is not implemented.
