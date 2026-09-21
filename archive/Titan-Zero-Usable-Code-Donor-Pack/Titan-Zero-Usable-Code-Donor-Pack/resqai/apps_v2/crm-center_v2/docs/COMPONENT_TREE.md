# CRM Center v2 — Component Tree

```
App
└── AppProvider (state/AppContext)
    └── AppLayout
        ├── Topbar ("CRM Center")
        ├── Sidebar (17 nav items)
        └── Routes
            ├── AccountDashboardPage
            │   ├── SlippingAlertBanner
            │   ├── HealthGauge
            │   ├── HealthCategoryBar
            │   └── RiskSignalCard (×N)
            │
            ├── AccountListPage
            │   ├── SearchBar, Filter, Table, Pagination
            │   └── StatusBadge (per row)
            │
            ├── AccountDetailPage
            │   ├── DetailLayout, Tabs
            │   ├── HealthGauge, AccountQuickActions
            │   └── AccountTimeline
            │
            ├── FollowupCenterPage
            │   ├── Filter (status, priority)
            │   ├── FollowupList
            │   └── Pagination
            │
            ├── NewFollowupPage (Form)
            ├── FollowupDetailPage (Card + StatusBadge + Buttons)
            │
            ├── CustomerTimelinePage
            │   ├── Filter (channel)
            │   └── AccountTimeline
            │
            ├── InteractionHistoryPage
            │   ├── SearchBar, Filter, Table
            │   └── Pagination
            │
            ├── CustomerSatisfactionPage
            │   └── Card grid with star ratings
            │
            ├── CustomerFeedbackPage
            │   ├── Filter (category, sentiment)
            │   ├── Table
            │   └── Pagination
            │
            ├── RecordFeedbackPage (Form)
            │
            ├── RenewalOpportunitiesPage
            │   ├── Filter (stage), Table
            │   └── Pagination
            │
            ├── UpsellOpportunitiesPage
            │   ├── Filter (stage), Table
            │   └── Pagination
            │
            ├── RetentionDashboardPage
            │   ├── KPI Cards (5)
            │   ├── At-Risk by Reason list
            │   └── Health Trend bars
            │
            ├── CommunicationCenterPage
            │   ├── KPI Cards (channels breakdown)
            │   └── Recent Communications list
            │
            ├── NotesPage
            │   ├── Filter (category)
            │   └── Note cards
            │
            ├── AddNotePage (Form)
            │
            ├── TasksPage
            │   ├── Filter (status, priority)
            │   ├── Table
            │   └── Pagination
            │
            ├── CreateTaskPage (Form)
            │
            ├── HealthScansPage
            │   └── HealthScanResultCard (×N)
            │
            ├── RiskSignalsPage
            │   ├── Filter (level)
            │   └── RiskSignalCard (×N)
            │
            ├── ReportsPage
            │   ├── Filter (type)
            │   └── Report card grid
            │
            ├── SearchPage
            │   ├── SearchBar (Input)
            │   └── Search result cards
            │
            └── ScheduleCallPage (Form)
```

## Custom Components (under `components/`)

| Component | Description |
|---|---|
| HealthGauge | SVG circular health score gauge (0–100) |
| AccountHealthCard | Account card with gauge + health badge |
| HealthCategoryBar | Horizontal stacked bar of health distribution |
| FollowupList | Sortable followup table with priority color coding |
| SlippingAlertBanner | Alert banner for overdue followups |
| RiskSignalCard | Risk signal summary card with level indicator |
| AccountTimeline | Vertical timeline of account activity |
| HealthScanResultCard | Recent scan summary card |
| AccountSearchDropdown | Searchable account picker with dropdown |
| AccountQuickActions | Actions bar (schedule scan, create followup, note) |
| PermissionGuard | Permission-based rendering guard |
| Dialogs | ConfirmDialog, FollowupConfirmation, TaskCompletion, FeedbackConfirmation, CustomerMergeWarning |

## Widgets Built Into Pages

| Widget | Location |
|---|---|
| Customer Health Score | Dashboard, Account Detail |
| Today's Follow-ups | Dashboard (via SlippingAlertBanner) |
| Pending Follow-ups | Follow-up Queue |
| High Value Customers | Accounts page (sortable table) |
| Customer Satisfaction | Satisfaction page |
| Renewal Alerts | Renewals page |
| Recent Activities | Timeline page, Account Detail |
| Open Tasks | Tasks page |
