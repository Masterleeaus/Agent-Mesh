# Operations Center v2

Enterprise operations management application for the ResQAI platform. The command center for dispatching, monitoring, coordinating, and supervising all field operations.

## Features

- **Operations Dashboard** — Real-time metrics, KPIs, and regional status overview
- **Dispatch Queue** — Manual and automated dispatching of operations to technicians
- **Live Operations Board** — Real-time view of all in-progress operations by region
- **Assignment Board** — Technician assignment and reassignment management
- **Technician Monitoring** — Live status board for all field technicians
- **Pending Assignments** — Unassigned operations requiring dispatch
- **Escalation Queue** — Escalated operations requiring management attention
- **Operations Timeline** — Chronological event feed of all operations activity
- **Daily Operations** — View operations by specific date
- **Regional Operations** — Filter operations by geographic region
- **Completed Operations** — History of completed operations
- **Operations Reports** — Report templates and analytics (UI scaffold)
- **Search** — Full-text search across all operations

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | OperationsDashboardPage | Real-time ops dashboard |
| `/dispatch-queue` | DispatchQueuePage | Dispatch pending operations |
| `/live-board` | LiveOperationsBoardPage | Live board by region |
| `/assignments` | AssignmentBoardPage | Technician assignment board |
| `/technicians` | TechnicianMonitoringPage | Technician status monitoring |
| `/pending-assignments` | PendingAssignmentsPage | Unassigned operations |
| `/escalations` | EscalationQueuePage | Escalated operations |
| `/timeline` | OperationsTimelinePage | Activity timeline |
| `/daily` | DailyOperationsPage | Operations by date |
| `/regional` | RegionalOperationsPage | Operations by region |
| `/completed` | CompletedOperationsPage | Completed operations log |
| `/reports` | OperationsReportsPage | Report templates |
| `/search` | SearchPage | Full-text search |

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Inline styles (CSS custom properties)
- Hash-based function routing
- `@resqai/foundation` shared component library (`../../../shared/src`)

## Setup

```bash
# Install dependencies (from workspace root)
cd ../../ && npm install

# Start dev server
cd apps_v2/operations-center_v2 && npm run dev

# Build
npm run build
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_LEMMA_TOKEN` | Lemma API token (for testing) |

## State Management

- **React Context**: App-level state (current user, filters, operation selection)
- **Custom Hooks**: Data fetching with loading/error/data state pattern

## Mock Services

All API calls go through `src/services/operations-service.ts`. The service returns mock data by default. Replace with real API calls when backend is available.

## Future Integration Points

- Real-time operation updates via EventBus events
- AI-powered dispatch suggestions
- Predictive scheduling and route optimization
- Customer notification integration via connectors
- Mobile technician app integration
