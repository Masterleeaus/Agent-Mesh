# CRM Center v2 — Routes

## Route Configuration

All routes are hash-based and resolved in `src/routes/index.tsx`.

| Hash | Page Component | File |
|---|---|---|
| `#/` | AccountDashboardPage | `src/pages/AccountDashboardPage.tsx` |
| `#/accounts` | AccountListPage | `src/pages/AccountListPage.tsx` |
| `#/accounts/:id` | AccountDetailPage | `src/pages/AccountDetailPage.tsx` |
| `#/followups` | FollowupCenterPage | `src/pages/FollowupCenterPage.tsx` |
| `#/followups/new` | NewFollowupPage | `src/pages/NewFollowupPage.tsx` |
| `#/followups/:id` | FollowupDetailPage | `src/pages/FollowupDetailPage.tsx` |
| `#/timeline` | CustomerTimelinePage | `src/pages/CustomerTimelinePage.tsx` |
| `#/interactions` | InteractionHistoryPage | `src/pages/InteractionHistoryPage.tsx` |
| `#/satisfaction` | CustomerSatisfactionPage | `src/pages/CustomerSatisfactionPage.tsx` |
| `#/feedback` | CustomerFeedbackPage | `src/pages/CustomerFeedbackPage.tsx` |
| `#/feedback/new` | RecordFeedbackPage | `src/pages/RecordFeedbackPage.tsx` |
| `#/renewals` | RenewalOpportunitiesPage | `src/pages/RenewalOpportunitiesPage.tsx` |
| `#/upsells` | UpsellOpportunitiesPage | `src/pages/UpsellOpportunitiesPage.tsx` |
| `#/retention` | RetentionDashboardPage | `src/pages/RetentionDashboardPage.tsx` |
| `#/communications` | CommunicationCenterPage | `src/pages/CommunicationCenterPage.tsx` |
| `#/notes` | NotesPage | `src/pages/NotesPage.tsx` |
| `#/notes/new` | AddNotePage | `src/pages/AddNotePage.tsx` |
| `#/tasks` | TasksPage | `src/pages/TasksPage.tsx` |
| `#/tasks/new` | CreateTaskPage | `src/pages/CreateTaskPage.tsx` |
| `#/scans` | HealthScansPage | `src/pages/HealthScansPage.tsx` |
| `#/risks` | RiskSignalsPage | `src/pages/RiskSignalsPage.tsx` |
| `#/reports` | ReportsPage | `src/pages/ReportsPage.tsx` |
| `#/search` | SearchPage | `src/pages/SearchPage.tsx` |
| `#/calls/new` | ScheduleCallPage | `src/pages/ScheduleCallPage.tsx` |

Total: 24 routes, 27 pages (including param-based detail routes).

## Route Resolution

The Routes component uses `useMemo` to parse the hash on each render and `window.addEventListener('hashchange', ...)` to react to navigation.
