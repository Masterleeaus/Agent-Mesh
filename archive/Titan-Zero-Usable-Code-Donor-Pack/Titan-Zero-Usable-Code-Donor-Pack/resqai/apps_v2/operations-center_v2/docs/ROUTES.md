# Routes

## Route Map

| Route | Page Component | Purpose | Business Objective |
|-------|---------------|---------|-------------------|
| `/` | OperationsDashboardPage | Real-time dashboard with KPIs, live metrics, regional status | Command center view for operations supervisors |
| `/dispatch-queue` | DispatchQueuePage | Queue of operations pending technician dispatch | Primary interface for dispatchers to assign work |
| `/live-board` | LiveOperationsBoardPage | Real-time board of all active operations grouped by region | Situational awareness for operations managers |
| `/assignments` | AssignmentBoardPage | Assignment and reassignment of technicians to operations | Technician workload management |
| `/technicians` | TechnicianMonitoringPage | Live status of all technicians | Personnel oversight and availability tracking |
| `/pending-assignments` | PendingAssignmentsPage | Unassigned operations queue | Ensure no operation is left unassigned |
| `/escalations` | EscalationQueuePage | Escalated operations requiring management attention | Escalation management for team leads |
| `/timeline` | OperationsTimelinePage | Chronological event feed of operations activity | Audit trail and operational history |
| `/daily` | DailyOperationsPage | Operations filtered by specific date | Day-level operational planning |
| `/regional` | RegionalOperationsPage | Operations filtered by geographic region | Region-specific oversight for regional managers |
| `/completed` | CompletedOperationsPage | History of completed operations | Post-completion review and reporting |
| `/reports` | OperationsReportsPage | Report template library and generation | Operational analytics and reporting |
| `/search` | SearchPage | Full-text search across all operations | Quick lookup of any operation |

## Routing Implementation

Hash-based routing via `window.location.hash` listener in `src/routes/index.tsx`:

```
window.addEventListener('hashchange', handler) → parseHash() → switch render
```

No external routing library. The `Routes` component:
1. Parses `window.location.hash` on mount and on `hashchange`
2. Maps hash segments to route patterns
3. Renders the matching page component
4. Defaults to `OperationsDashboardPage` for unmatched routes

## Navigation Flow

```
Sidebar (AppLayout)
├── Operations Dashboard    → #/               → OperationsDashboardPage
├── Dispatch Queue          → #/dispatch-queue  → DispatchQueuePage
├── Live Operations Board   → #/live-board      → LiveOperationsBoardPage
├── Assignment Board        → #/assignments     → AssignmentBoardPage
├── Technician Monitoring   → #/technicians     → TechnicianMonitoringPage
├── Pending Assignments     → #/pending-assignments → PendingAssignmentsPage
├── Escalation Queue        → #/escalations     → EscalationQueuePage
├── Operations Timeline     → #/timeline        → OperationsTimelinePage
├── Daily Operations        → #/daily           → DailyOperationsPage
├── Regional Operations     → #/regional        → RegionalOperationsPage
├── Completed Operations    → #/completed       → CompletedOperationsPage
├── Operations Reports      → #/reports         → OperationsReportsPage
└── Search                  → #/search          → SearchPage

Internal Links:
  DispatchQueuePage      → #/operations/:id → Operation Detail (future)
  LiveOperationsBoardPage → #/operations/:id → Operation Detail (future)
  AssignmentBoardPage    → #/operations/:id → Operation Detail (future)
  CompletedOperationsPage → #/operations/:id → Operation Detail (future)
```

## Future Route Contracts

| Route | Component | Backend Trigger |
|-------|-----------|----------------|
| `/operations/:id` | OperationDetailPage | Full operation detail view |
| `/operations/:id/timeline` | Not implemented | Enhanced timeline view |
| `/reports/:id` | Not implemented | Generated report view |
| `/technicians/:id` | Not implemented | Technician detail/profile |

## Page Metadata

- Operations Dashboard — `Operations Center — Dashboard | ResQAI`
- Dispatch Queue — `Dispatch Queue — Operations Center | ResQAI`
- Live Board — `Live Operations — Operations Center | ResQAI`
- etc.
