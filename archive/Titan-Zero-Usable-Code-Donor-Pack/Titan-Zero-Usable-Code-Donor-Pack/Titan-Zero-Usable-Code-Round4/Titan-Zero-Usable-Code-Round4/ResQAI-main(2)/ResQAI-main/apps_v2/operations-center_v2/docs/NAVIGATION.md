# Navigation

## Route Map
| Route | Page Component | Description |
|---|---|---|
| `/` | OperationsDashboardPage | Real-time operations dashboard |
| `/dispatch-queue` | DispatchQueuePage | Dispatch queue |
| `/live-board` | LiveOperationsBoardPage | Live board |
| `/assignments` | AssignmentBoardPage | Assignment board |
| `/technicians` | TechnicianMonitoringPage | Technician monitoring |
| `/pending-assignments` | PendingAssignmentsPage | Pending assignments |
| `/escalations` | EscalationQueuePage | Escalation queue |
| `/timeline` | OperationsTimelinePage | Operations timeline |
| `/daily` | DailyOperationsPage | Daily operations |
| `/regional` | RegionalOperationsPage | Regional operations |
| `/completed` | CompletedOperationsPage | Completed operations |
| `/reports` | OperationsReportsPage | Operations reports |
| `/search` | SearchPage | Search |

## Sidebar Structure
```
Operations Center (brand)
├── Operations Dashboard    (/)             - KPI dashboard
├── Dispatch Queue          (/dispatch-queue) - Dispatch operations
├── Live Operations Board   (/live-board)    - Real-time board
├── Assignment Board        (/assignments)   - Technician assignments
├── Technician Monitoring   (/technicians)   - Technician status
├── Pending Assignments     (/pending-assignments) - Unassigned ops
├── Escalation Queue        (/escalations)   - Escalated ops
├── Operations Timeline     (/timeline)      - Activity feed
├── Daily Operations        (/daily)         - Date filter
├── Regional Operations     (/regional)      - Region filter
├── Completed Operations    (/completed)     - History
├── Operations Reports      (/reports)       - Reports
└── Search                  (/search)        - Search
```

## Breadcrumb Patterns
- `Home > Dispatch Queue`
- `Home > Live Operations Board`
- `Home > Escalation Queue`
- `Home > Operations Timeline`

## Hash-based Routing
All routes use the `#` prefix for hash-based navigation (e.g., `#/dispatch-queue`). The `Routes` component listens for `hashchange` events and renders the matching page component.
