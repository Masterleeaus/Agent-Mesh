# Admin Center V2 — API Contracts

## Service Layer

All API calls go through `src/services/admin-service.ts`. Currently uses mock data with simulated delays. Designed to swap to real `lemma-sdk` calls.

## Service Functions

| Function | Returns | Parameters |
|----------|---------|------------|
| `getDashboard()` | `AdminDashboardResponse` | — |
| `listUsers(page, pageSize)` | `UserListResponse` | `page: number, pageSize: number` |
| `getUser(id)` | `UserDetailResponse \| null` | `id: string` |
| `createUser(req)` | `UserDTO` | `req: CreateUserRequest` |
| `updateUser(id, req)` | `UserDTO` | `id: string, req: UpdateUserRequest` |
| `deleteUser(id)` | `void` | `id: string` |
| `listRoles()` | `RoleListResponse` | — |
| `getRole(id)` | `RoleDetailResponse \| null` | `id: string` |
| `createRole(req)` | `RoleDTO` | `req: CreateRoleRequest` |
| `updateRole(id, req)` | `RoleDTO` | `id: string, req: UpdateRoleRequest` |
| `deleteRole(id)` | `void` | `id: string` |
| `listAuditLog(filter, page, pageSize)` | `AuditLogResponse` | `filter?: AuditLogFilterRequest` |
| `exportAuditLog(filter)` | `Blob` | `filter?: AuditLogFilterRequest` |
| `listSettings()` | `SettingsListResponse` | — |
| `updateSetting(key, req)` | `SystemSettingDTO` | `key: string, req: UpdateSettingRequest` |
| `listConnectors()` | `ConnectorListResponse` | — |
| `getConnector(id)` | `ConnectorDTO \| null` | `id: string` |
| `createConnector(req)` | `ConnectorDTO` | `req: CreateConnectorRequest` |
| `updateConnector(id, req)` | `ConnectorDTO` | `id: string, req: UpdateConnectorRequest` |
| `deleteConnector(id)` | `void` | `id: string` |
| `getEventBusMetrics()` | `EventBusMetricsResponse` | — |
| `listSessions()` | `SessionListResponse` | — |
| `forceLogout(sessionId)` | `void` | `sessionId: string` |
| `listApplications()` | `ApplicationListResponse` | — |
| `getApplication(id)` | `ApplicationDetailResponse \| null` | `id: string` |
| `listWorkflows()` | `WorkflowListResponse` | — |
| `listWorkflowRuns(workflowId?)` | `WorkflowRunListResponse` | `workflowId?: string` |
| `restartWorkflow(id)` | `void` | `id: string` |
| `listFunctions()` | `FunctionListResponse` | — |
| `listFunctionRuns(functionId?)` | `FunctionRunListResponse` | `functionId?: string` |
| `restartFunction(id)` | `void` | `id: string` |
| `listAgents()` | `AgentListResponse` | — |
| `getAgent(id)` | `AgentDetailResponse \| null` | `id: string` |
| `restartAgent(id)` | `void` | `id: string` |
| `listIntegrations()` | `IntegrationListResponse` | — |
| `listNotifications(filter?)` | `NotificationListResponse` | `filter?: NotificationFilterRequest` |
| `markNotificationRead(id)` | `void` | `id: string` |
| `dismissNotification(id)` | `void` | `id: string` |
| `listAPIKeys()` | `APIKeyListResponse` | — |
| `revokeAPIKey(id)` | `void` | `id: string` |
| `listOrganizations()` | `OrganizationListResponse` | — |
| `listTeams()` | `TeamListResponse` | — |
| `createTeam(req)` | `TeamDTO` | `req: CreateTeamRequest` |
| `getPlatformMetrics()` | `PlatformMetricsResponse` | — |
| `listErrors()` | `ErrorListResponse` | — |
| `resolveError(id)` | `void` | `id: string` |

## Response Envelopes

All list responses follow the pattern `{ data: T[], total: number, page?: number, pageSize?: number }`.
Single-item responses follow `{ data: T }`.
