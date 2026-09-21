# CRM Center v2 — State Management

## Architecture

State is managed via React Context (`state/AppContext.tsx`). The `AppProvider` wraps the entire application and provides shared state to all components via the `useAppContext()` hook.

## State Shape

```typescript
interface AppState {
  currentUser: { id: string; name: string; role: string } | null;
  activeFilters: Record<string, string[]>;
  healthCategoryFilter: string | null;
  selectedAccountId: string | null;
}
```

## Actions

| Action | Description |
|---|---|
| `setCurrentUser(user)` | Set the current authenticated user |
| `setActiveFilters(filters)` | Update global filter state |
| `setHealthCategoryFilter(filter)` | Set health category filter for dashboard |
| `setSelectedAccountId(id)` | Set selected account for detail view |

## Per-Page State

Each page manages its own local state via React hooks:

| Hook | State Managed |
|---|---|
| `useAccountDashboard` | Dashboard data, loading, error |
| `useAccounts` | Account list, total, loading, error |
| `useAccountDetail` | Single account detail, loading, error |
| `useFollowups` | Follow-up list, total, loading, error |
| `useFollowupDetail` | Single follow-up, loading, error |
| `useHealthScans` | Scans list, loading, error |
| `useRiskSignals` | Risk signals list, loading, error |
| `useCRMDashboard` | CRM dashboard data, loading, error |
| `useCustomers` | Customer list, total, loading, error |
| `useCustomerDetail` | Single customer, loading, error |
| `useInteractions` | Interaction list, total, loading, error |
| `useNotes` | Notes list, loading, error |
| `useTasks` | Task list, total, loading, error |
| `useFeedback` | Feedback list, total, loading, error |
| `useSatisfaction` | Satisfaction list, loading, error |
| `useOpportunities` | Opportunity list, total, loading, error |
| `useRetention` | Retention dashboard data, loading, error |
| `useCommunication` | Communication center data, loading, error |
| `useReports` | Reports list, loading, error |
| `useSearch` | Search query and results, loading |

## Navigation

```typescript
function navigate(path: string): void {
  window.location.hash = path;
}
```

All pages use `navigate()` for programmatic navigation.
