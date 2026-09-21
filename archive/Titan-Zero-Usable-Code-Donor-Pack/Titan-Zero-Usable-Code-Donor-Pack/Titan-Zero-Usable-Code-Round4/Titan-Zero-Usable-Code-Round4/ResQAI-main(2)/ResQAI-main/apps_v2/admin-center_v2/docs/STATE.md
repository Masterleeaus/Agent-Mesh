# Admin Center V2 — State Management

## Architecture

State management uses two layers:

1. **Shared Foundation State** (`@resqai/foundation`):
   - `GlobalStateProvider` — Loading/error/initialized
   - `AuthStateProvider` — Authentication
   - `UserStateProvider` — User profile
   - `OrganizationStateProvider` — Org info
   - `ThemeStateProvider` — Theme mode
   - `NotificationStateProvider` — Toast notifications

2. **App-Specific State** (`src/state/AppContext.tsx`):
   - `AppProvider` — React Context provider
   - `useAppContext()` — Hook to access state

## AppContext State Shape

```typescript
interface AppContextValue {
  currentAdmin: AdminUser | null;
  setCurrentAdmin: (user: AdminUser | null) => void;
  filters: AppFilters;
  setFilters: (filters: AppFilters) => void;
  auditPagination: AuditPagination;
  setAuditPagination: (pagination: AuditPagination) => void;
}
```

## Data Fetching Pattern

Each data domain has a dedicated hook following this pattern:

```typescript
function useX(): { data: X[]; total: number; loading: boolean; error: string | null; refetch: () => void; }
```

Hooks manage their own loading, error, and data states internally via `useState` + `useEffect`. They call the mock service layer and handle cancellation on unmount.

## Hooks (25 total)

| Hook | Data | Service Function |
|------|------|-----------------|
| `useAdminDashboard` | `AdminDashboardVM` | `getDashboard` |
| `useUsers` | `UserDTO[]` | `listUsers` |
| `useUserDetail` | `UserDetailVM` | `getUser` |
| `useRoles` | `RoleDTO[]` | `listRoles` |
| `useRoleDetail` | `RoleDetailVM` | `getRole` |
| `useAuditLog` | `AuditLogEntryDTO[]` | `listAuditLog` |
| `useSettings` | `SystemSettingDTO[]` | `listSettings` |
| `useConnectors` | `ConnectorDTO[]` | `listConnectors` |
| `useEventBusMetrics` | `EventBusHealthVM` | `getEventBusMetrics` |
| `useSessions` | `SessionDTO[]` | `listSessions` |
| `useApplications` | `ApplicationDTO[]` | `listApplications` |
| `useApplicationDetail` | `ApplicationDetailVM` | `getApplication` |
| `useWorkflows` | `WorkflowDTO[]` | `listWorkflows` |
| `useWorkflowRuns` | `WorkflowRunDTO[]` | `listWorkflowRuns` |
| `useFunctions` | `FunctionDTO[]` | `listFunctions` |
| `useFunctionRuns` | `FunctionRunDTO[]` | `listFunctionRuns` |
| `useAgents` | `AgentDTO[]` | `listAgents` |
| `useAgentDetail` | `AgentDetailVM` | `getAgent` |
| `useIntegrations` | `IntegrationDTO[]` | `listIntegrations` |
| `useNotifications` | `NotificationDTO[]` | `listNotifications` |
| `useAPIKeys` | `APIKeyDTO[]` | `listAPIKeys` |
| `useOrganizations` | `OrganizationDTO[]` | `listOrganizations` |
| `useTeams` | `TeamDTO[]` | `listTeams` |
| `usePlatformMetrics` | `PlatformMetricDTO[]` | `getPlatformMetrics` |
| `useErrors` | `ErrorEntryDTO[]` | `listErrors` |
