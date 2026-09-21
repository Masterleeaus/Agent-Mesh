# Navigation

## Route Map
| Route | Page Component | Description |
|---|---|---|
| `/` | DashboardPage | Main dashboard |
| `/today` | TodayJobsPage | Today's full job list |
| `/assigned` | AssignedJobsPage | Pending assigned jobs |
| `/upcoming` | UpcomingJobsPage | Future scheduled jobs |
| `/completed` | CompletedJobsPage | Completed jobs list |
| `/history` | JobHistoryPage | Job history with stats |
| `/jobs/:id` | JobDetailPage | Full job detail |
| `/jobs/:id/customer` | CustomerDetailsPage | Customer info and contact |
| `/jobs/:id/navigation` | NavigationPage | Turn-by-turn directions |
| `/jobs/:id/checklist` | JobChecklistPage | Task checklist |
| `/jobs/:id/notes` | ServiceNotesPage | Service notes |
| `/jobs/:id/photos` | PhotoUploadPage | Photo evidence |
| `/jobs/:id/videos` | VideoUploadPage | Video evidence |
| `/jobs/:id/signature` | SignatureCapturePage | Customer signature |
| `/jobs/:id/parts` | PartsUsedPage | Parts used |
| `/jobs/:id/inventory` | InventoryRequestPage | Request parts |
| `/jobs/:id/pause` | PauseJobPage | Pause a job |
| `/jobs/:id/resume` | ResumeJobPage | Resume a paused job |
| `/jobs/:id/escalate` | EscalateJobPage | Escalate a job |
| `/jobs/:id/complete` | CompleteJobPage | Complete a job |
| `/messages` | MessagesPage | Message threads |
| `/notifications` | NotificationsPage | Notification list |
| `/profile` | TechnicianProfilePage | Technician profile |
| `/settings` | SettingsPage | App preferences |

## Sidebar Structure
```
Technician Portal (brand)
+-- Dashboard            (/)           - KPIs and today's overview
+-- Today's Jobs         (/today)      - Full today schedule
+-- Assigned Jobs        (/assigned)   - Pending assignments
+-- Upcoming Jobs        (/upcoming)   - Future schedule
+-- Completed Jobs       (/completed)  - Completed work
+-- Job History          (/history)    - Historical data
+-- Messages             (/messages)   - Operations chat
+-- Notifications        (/notifications) - Alerts
+-- Profile              (/profile)    - Technician profile
+-- Settings             (/settings)   - App preferences
```

## Breadcrumb Patterns
- `Home > Today's Jobs > Job #ID`
- `Home > Job #ID > Checklist`
- `Home > Job #ID > Complete`
- `Home > Messages`

## Hash-based Routing
All routes use the `#` prefix for hash-based navigation (e.g., `#/today`, `#/jobs/job-001`). The `Routes` component listens for `hashchange` events and renders the matching page component.
