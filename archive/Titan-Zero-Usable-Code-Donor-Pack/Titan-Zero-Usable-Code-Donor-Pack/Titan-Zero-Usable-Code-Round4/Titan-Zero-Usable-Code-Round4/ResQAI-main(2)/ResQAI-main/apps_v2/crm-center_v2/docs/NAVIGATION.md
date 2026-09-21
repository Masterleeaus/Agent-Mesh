# CRM Center v2 — Navigation

## Route Map

All routes are hash-based (`window.location.hash`).

| Hash Path | Page Component | Description |
|---|---|---|
| `#/` | AccountDashboardPage | CRM health dashboard |
| `#/accounts` | AccountListPage | Customer directory |
| `#/accounts/:id` | AccountDetailPage | 360° customer profile |
| `#/followups` | FollowupCenterPage | Follow-up queue |
| `#/followups/new` | NewFollowupPage | Create follow-up |
| `#/followups/:id` | FollowupDetailPage | Follow-up detail |
| `#/timeline` | CustomerTimelinePage | Customer activity timeline |
| `#/interactions` | InteractionHistoryPage | Interaction history log |
| `#/satisfaction` | CustomerSatisfactionPage | Satisfaction scores |
| `#/feedback` | CustomerFeedbackPage | Customer feedback records |
| `#/feedback/new` | RecordFeedbackPage | Record feedback form |
| `#/renewals` | RenewalOpportunitiesPage | Renewal pipeline |
| `#/upsells` | UpsellOpportunitiesPage | Upsell/cross-sell pipeline |
| `#/retention` | RetentionDashboardPage | Retention metrics |
| `#/communications` | CommunicationCenterPage | Communication center |
| `#/notes` | NotesPage | Account notes |
| `#/notes/new` | AddNotePage | Add note form |
| `#/tasks` | TasksPage | Task management |
| `#/tasks/new` | CreateTaskPage | Create task form |
| `#/scans` | HealthScansPage | Health scan history |
| `#/risks` | RiskSignalsPage | Risk signal tracking |
| `#/reports` | ReportsPage | CRM reports |
| `#/search` | SearchPage | Global search |
| `#/calls/new` | ScheduleCallPage | Schedule call form |

## Sidebar Navigation

The AppLayout renders a Sidebar with 17 navigation items covering all CRM domains.

## Programmatic Navigation

Use the `navigate()` function from `state/AppContext.tsx`:

```typescript
import { navigate } from '../../state/AppContext';
navigate('/accounts');   // navigates to #/accounts
```

## Active Route Detection

The Routes component parses `window.location.hash` and maps to the matching page component. Unknown routes default to the dashboard.
