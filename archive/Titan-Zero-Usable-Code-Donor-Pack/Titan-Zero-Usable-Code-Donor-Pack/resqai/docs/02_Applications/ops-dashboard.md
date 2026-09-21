# Ops Dashboard

## Purpose

Morning standup and KPI dashboard for operations managers. Aggregates data from four core tables, surfaces KPIs, highlights urgent issues, and runs an AI coordinator agent for prioritized recommendations.

## Current Status

✅ Build-ready — passes `tsc --noEmit` and `vite build`
✅ Validated against Lemma pod data
❌ No unit tests
⚠️ Requires Lemma SDK authentication (blocked on auth redirect fix)

## Tables Used

| Table | Usage |
|-------|-------|
| `tickets` | Count open/urgent tickets for KPI + urgent dispatch |
| `appointments` | Count active/in-progress appointments for KPI |
| `disputes` | Count open/awaiting-approval disputes for KPI |
| `tasks` | Count overdue tasks for KPI |
| `operations_log` | Display recent coordination actions |

## Agents Used

| Agent | Trigger | Purpose |
|-------|---------|---------|
| `operations-coordinator` | "Run Coordinator" button | Reads board summary, produces prioritized recommendations |

## Functions Used

None.

## Data Flow

1. `useDashboard` calls `fetchDashboardData()` (parallel list queries for tickets, appointments, disputes, tasks)
2. KPI summary is computed from raw data
3. Urgent tickets are filtered for the dispatch section
4. "Run Coordinator" builds a text summary and calls `operations-coordinator` agent
5. Agent response is parsed as JSON and rendered as recommendation cards
6. `fetchOperationsLog()` returns the 8 most recent log entries

## Key Components

| Component | Responsibility |
|-----------|---------------|
| `KpiCards` | 5 KPI metric cards (open tickets, urgent, active appointments, open disputes, overdue tasks) |
| `UrgentDispatch` | Urgent ticket list with links to support-queue |
| `CoordinatorSection` | AI coordinator panel with run button and recommendations |
| `OperationsLog` | Recent operations log entries table |

## Known Limitations

- No real-time updates — requires manual refresh
- Coordinator recommendations are text-based, not structured data
- No historical KPI tracking or trends
- No role-based view customization

## Future Improvements

- Auto-refresh at configurable intervals
- Historical KPI tracking with charts
- Customizable dashboard layouts per role
- Export KPI reports (PDF/CSV)
- Slack/email integration for daily standup summaries
