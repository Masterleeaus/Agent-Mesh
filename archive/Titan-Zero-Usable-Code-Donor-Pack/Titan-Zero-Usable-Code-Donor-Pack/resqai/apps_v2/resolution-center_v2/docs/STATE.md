# State Management

## Architecture
Resolution Center V2 uses React Context for app-wide state and custom hooks for data fetching. There is no Redux, Zustand, or other external state management library.

## AppContext (`src/state/AppContext.tsx`)

### State Shape
```typescript
interface AppState {
  currentUserId: string;
  currentUserName: string;
  currentUserRoles: string[];
  currentUserPermissions: string[];
  activeFilters: CaseListFilters;
  activeDisputeFilters: DisputeListFilters;
  selectedCaseIds: string[];
  viewMode: ViewMode;              // 'table' | 'card'
  notifications: NotificationToast[];
}
```

### Default User
- **ID**: `res-001`
- **Name**: Alex Morgan
- **Roles**: `['resolution_specialist']`
- **Permissions**: All 19 resolution center permissions

### Available Actions
| Action | Description |
|---|---|
| setCurrentUser | Update user identity, roles, and permissions |
| setActiveFilters | Update case list filters |
| setActiveDisputeFilters | Update dispute list filters |
| setSelectedCaseIds | Replace selected case IDs |
| toggleCaseSelection | Toggle a single case ID in selection |
| clearSelection | Clear all selected case IDs |
| setViewMode | Toggle between table and card view |
| addNotification | Add a notification toast (auto-dismisses after 6s) |
| dismissNotification | Remove a specific notification |
| clearNotifications | Remove all notifications |

## Custom Data Hooks

| Hook | Data Source | Returns |
|---|---|---|
| useCases | resolutionService.listCases | `{ cases, total, loading, error, refetch }` |
| useCaseDetail | resolutionService.getCaseById | `{ detail, loading, error, refetch }` |
| useDisputes | resolutionService.listDisputes | `{ disputes, total, loading, error, refetch }` |
| useDashboard | resolutionService.getDashboard | `{ dashboard, loading, error, refetch }` |
| useResolutions | resolutionService.listResolutions | `{ resolutions, total, loading, error, refetch }` |
| useApprovals | resolutionService.listApprovals | `{ approvals, total, loading, error, refetch }` |
| useEscalations | resolutionService.listEscalations | `{ escalations, total, loading, error, refetch }` |
| useEvidence | resolutionService.listEvidence | `{ evidence, total, loading, error, refetch }` |
| useSearch | resolutionService.search | `{ results, loading, error, search }` |
| useKnowledgeBase | resolutionService.listKnowledgeBase | `{ articles, total, loading, error, refetch }` |

## Shared State Providers (from @resqai/foundation)
- GlobalState: Loading, error, initialized
- AuthState: Authentication status, token, user
- UserState: User-specific profile data
- OrganizationState: Organization-level data
- ThemeState: Theme mode (dark by default)
- NotificationState: Global notification list

## Data Flow
```
Page Component
  → Custom Hook (useCases, etc.)
    → resolutionService.method()
      → Mock data (setTimeout delay)
    → Returns typed response
  → Maps DTOs to View Models
  → Returns { data, loading, error, refetch }
→ Renders based on state (loading → empty → error → data)
```
