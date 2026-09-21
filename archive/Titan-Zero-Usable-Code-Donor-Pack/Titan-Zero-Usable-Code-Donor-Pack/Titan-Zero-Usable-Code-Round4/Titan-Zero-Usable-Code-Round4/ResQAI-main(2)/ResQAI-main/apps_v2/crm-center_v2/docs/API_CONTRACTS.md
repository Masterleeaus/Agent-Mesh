# CRM Center v2 — API Contracts

## Service Layer

All API calls are defined in `services/crm-service.ts`. Currently all methods throw "not implemented" — wire to real backend endpoints when available.

### Account Endpoints

| Method | Params | Returns |
|---|---|---|
| `getDashboard()` | none | `AccountDashboardResponse` |
| `getCRMDashboard()` | none | `CRMDashboardResponse` |
| `listAccounts(filter)` | `AccountFilterRequest` | `AccountListResponse` |
| `getAccount(id)` | `string` | `AccountDetailResponse` |
| `updateAccount(id, data)` | `string, Partial<AccountDTO>` | `void` |

### Customer Endpoints

| Method | Params | Returns |
|---|---|---|
| `listCustomers(filter)` | `CustomerFilterRequest` | `CustomerListResponse` |
| `getCustomer(id)` | `string` | `CustomerProfileResponse` |
| `updateCustomer(id, data)` | `string, Partial<CustomerDTO>` | `void` |
| `mergeCustomers(request)` | `CustomerMergeRequest` | `void` |

### Follow-up Endpoints

| Method | Params | Returns |
|---|---|---|
| `listFollowups(filter)` | `FollowupFilterRequest` | `FollowupListResponse` |
| `getFollowup(id)` | `string` | `{ data: FollowupDTO }` |
| `createFollowup(request)` | `CreateFollowupRequest` | `{ data: FollowupDTO }` |
| `updateFollowup(id, request)` | `string, UpdateFollowupRequest` | `void` |
| `closeFollowup(id, request)` | `string, CloseFollowupRequest` | `void` |

### Interaction Endpoints

| Method | Params | Returns |
|---|---|---|
| `listInteractions(filter)` | filter object | `InteractionListResponse` |
| `createInteraction(request)` | `CreateInteractionRequest` | `{ data: InteractionDTO }` |

### Note Endpoints

| Method | Params | Returns |
|---|---|---|
| `listNotes(accountId?)` | `string?` | `NoteListResponse` |
| `createNote(request)` | `CreateNoteRequest` | `CreateNoteResponse` |
| `updateNote(id, request)` | `string, UpdateNoteRequest` | `void` |

### Task Endpoints

| Method | Params | Returns |
|---|---|---|
| `listTasks(filter)` | filter object | `TaskListResponse` |
| `createTask(request)` | `CreateTaskRequest` | `CreateTaskResponse` |
| `updateTask(id, request)` | `string, UpdateTaskRequest` | `void` |

### Feedback Endpoints

| Method | Params | Returns |
|---|---|---|
| `listFeedback(filter)` | filter object | `FeedbackListResponse` |
| `recordFeedback(request)` | `RecordFeedbackRequest` | `CreateFeedbackResponse` |

### Satisfaction Endpoints

| Method | Params | Returns |
|---|---|---|
| `listSatisfaction(accountId?)` | `string?` | `SatisfactionListResponse` |
| `recordSatisfaction(request)` | `RecordSatisfactionRequest` | `{ data: SatisfactionDTO }` |

### Opportunity Endpoints

| Method | Params | Returns |
|---|---|---|
| `listOpportunities(filter)` | filter object | `OpportunityListResponse` |
| `createOpportunity(request)` | `CreateOpportunityRequest` | `CreateOpportunityResponse` |
| `updateOpportunity(id, request)` | `string, UpdateOpportunityRequest` | `void` |

### Other Endpoints

| Method | Params | Returns |
|---|---|---|
| `listHealthScans(accountId?)` | `string?` | `HealthScanListResponse` |
| `runHealthScan(accountId)` | `string` | `{ data: HealthScanDTO }` |
| `listRiskSignals(params)` | filter object | `RiskSignalListResponse` |
| `getRetentionDashboard()` | none | `RetentionDashboardResponse` |
| `getCommunicationCenter()` | none | `CommunicationCenterResponse` |
| `scheduleCall(request)` | `ScheduleCallRequest` | `{ data: FollowupDTO }` |
| `globalSearch(request)` | `SearchRequest` | `SearchResponse` |

Total: 30 service methods across 11 domains.
