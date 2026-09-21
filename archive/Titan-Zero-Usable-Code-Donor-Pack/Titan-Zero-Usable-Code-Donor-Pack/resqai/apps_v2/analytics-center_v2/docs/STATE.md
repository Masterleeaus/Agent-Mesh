# State Management

## Architecture

State management uses React Context with a single `AppProvider` wrapping the entire application. Individual data-fetching hooks manage their own loading/error/data state independently.

## App State (React Context)

Defined in `src/state/AppContext.tsx`.

### State Shape

```typescript
interface AppState {
  currentUser: {
    id: string;
    name: string;
    role: string;
  } | null;
  dateRange: {
    preset: DateRangePreset;
    startDate?: string;
    endDate?: string;
  };
  activeDomain: string | null;
  reportEditing: {
    reportId: string | null;
    isDirty: boolean;
  };
  sidebarCollapsed: boolean;
  globalFilters: {
    dateRange: { preset: DateRangePreset; startDate?: string; endDate?: string };
    domains: string[];
    regions: string[];
    teams: string[];
  };
  exportProgress: {
    active: boolean;
    format: string | null;
    progress: number;
    error: string | null;
  };
}
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setCurrentUser` | `(user) => void` | Sets the authenticated user |
| `setDateRange` | `(range) => void` | Updates the global date range filter |
| `setActiveDomain` | `(domain) => void` | Sets the active analytics domain |
| `setReportEditing` | `(editing) => void` | Tracks report builder dirty state |
| `setSidebarCollapsed` | `(collapsed) => void` | Toggles sidebar visibility |
| `setGlobalFilters` | `(filters) => void` | Updates all global filter dimensions |
| `setExportProgress` | `(progress) => void` | Tracks export operation status |
| `resetState` | `() => void` | Resets all state to defaults |

### Provider Pattern

```tsx
<AppProvider>
  <Routes />
</AppProvider>
```

### Consumer Pattern

```tsx
const { state, setDateRange } = useAppContext();
// Access state values
const { preset } = state.dateRange;
// Dispatch actions
setDateRange({ preset: 'last7Days' as DateRangePreset });
```

## Data Fetching (Custom Hooks)

Each domain has a dedicated hook following a consistent pattern:

### Hook Return Shape

```typescript
interface UseDomainResult {
  data: DomainDTO | DomainDTO[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
```

### Hook Pattern

```typescript
function useDomain(): UseDomainResult {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getDomain();
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
```

### Hooks Overview

| Hook | Returns |
|------|---------|
| `useExecutiveDashboard` | `ExecutiveDashboardDTO` |
| `useMetrics` | Generic typed metric fetcher |
| `useSupportMetrics` | `SupportMetricsDTO` |
| `useOperationsMetrics` | `OperationsMetricsDTO` |
| `useAppointmentMetrics` | `AppointmentMetricsDTO` |
| `useTechnicianPerformance` | `TechnicianPerformanceDTO[]` |
| `useCustomerAnalytics` | `CustomerMetricsDTO` |
| `useCRMAnalytics` | `CRMMetricsDTO` |
| `useResolutionAnalytics` | `ResolutionMetricsDTO` |
| `useSLAMetrics` | `SLAMetricsDTO` |
| `useProductivityMetrics` | `ProductivityMetricsDTO` |
| `useTrendAnalysis` | `TrendAnalysisDTO` |
| `useForecasting` | `ForecastDTO[]` |
| `useCustomReports` | `CustomReportDTO[]` |
| `useScheduledReports` | `ScheduledReportDTO[]` |
| `useExportHistory` | `ExportHistoryDTO[]` |
| `useAuditAnalytics` | `AuditMetricsDTO` |
| `useSystemHealth` | `SystemHealthDTO` |
| `useSearch` | Search result set |

## Data Flow

```
User Action → Page Component → Hook → Service → Mock/Real API → State Update → Re-render
```

## Cross-Component State

For state shared across sibling components within a page:
- Props drilling (preferred for simple cases)
- Lifting state to the page component

For app-wide state:
- React Context via `useAppContext`

For independent data:
- Local component state via `useState`
- Custom hooks with self-contained loading/error/data

## UI States

Every data-driven component handles:

| State | Implementation |
|-------|---------------|
| Loading | Skeleton placeholders or spinner |
| Empty | EmptyState component with contextual message |
| Error | ErrorState component with retry button |
| Permission Denied | PermissionGuard wrapper |
| No Data | Empty state with guidance to adjust filters |
| Export Progress | Progress bar overlay with cancel option |
| Report Generation | Loading spinner with estimated time |
