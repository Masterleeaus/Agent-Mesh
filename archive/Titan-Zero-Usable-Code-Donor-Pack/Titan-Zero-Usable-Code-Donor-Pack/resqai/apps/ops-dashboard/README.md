# ops-dashboard

Operations Dashboard — Morning standup view for ResQAI.

## Features

- **KPI Cards** — Open tickets (+ urgent count), Active appointments (+ in-progress), Open disputes (+ awaiting approval), Overdue tasks (+ all-clear/action-required)
- **Urgent Dispatch** — Visible only when urgent tickets exist; links to `support-queue?focus={id}`
- **Operations Coordinator** — "Run Coordinator" button sends board summary to the `operations-coordinator` agent, waits for JSON response with summary + 8 prioritized recommendations, renders them as cards with type/priority badges
- **Operations Log** — Table of the last 8 `operations_log` entries (timestamp, actor, action, result)

## Usage

```tsx
import DashboardPage from './routes';
```

The page can be mounted at any route (e.g. `/ops-dashboard`). It fetches data on mount and exposes a refresh button.

## Data Flow

1. `useDashboard` calls `fetchDashboardData()` (parallel list queries for tickets, appointments, disputes, tasks)
2. KPI summary is computed from raw data
3. Urgent tickets are filtered for the dispatch section
4. "Run Coordinator" builds a text summary and calls `runCoordinator()` which invokes the `operations-coordinator` agent
5. Agent response is parsed as JSON and rendered as recommendation cards
6. `fetchOperationsLog()` returns the 8 most recent log entries

## Dependencies

- `../../shared/types` — Shared TypeScript interfaces
- `../../shared/lemma-sdk` — Lemma SDK wrapper for data access and agent invocation
