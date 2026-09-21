# Routes

## Route Map

| Route | Page Component | Purpose | Business Objective |
|---|---|---|---|
| `/` | DashboardPage | Main dashboard with KPIs, today's schedule, urgent jobs | Primary overview for technicians to plan their day |
| `/today` | TodayJobsPage | Full list of today's jobs with filters and search | Day-at-a-glance job management |
| `/assigned` | AssignedJobsPage | Jobs in assigned or en_route status | Pending work that needs attention |
| `/upcoming` | UpcomingJobsPage | Future scheduled jobs | Forward planning and preparation |
| `/completed` | CompletedJobsPage | Completed jobs list | Review of finished work |
| `/history` | JobHistoryPage | Job history with weekly/monthly stats | Performance tracking and reference |
| `/jobs/:id` | JobDetailPage | Full job detail with all actions and info | Central workspace for job execution |
| `/jobs/:id/customer` | CustomerDetailsPage | Customer contact and address | Quick customer lookup and contact |
| `/jobs/:id/navigation` | NavigationPage | Maps and travel info | Turn-by-turn directions to job site |
| `/jobs/:id/checklist` | JobChecklistPage | Task checklist with progress | Step-by-step job completion tracking |
| `/jobs/:id/notes` | ServiceNotesPage | Service notes by category | Documentation of work performed |
| `/jobs/:id/photos` | PhotoUploadPage | Photo evidence upload | Visual documentation of job conditions |
| `/jobs/:id/videos` | VideoUploadPage | Video evidence upload | Video documentation of job conditions |
| `/jobs/:id/signature` | SignatureCapturePage | Customer signature capture | Proof of service acceptance |
| `/jobs/:id/parts` | PartsUsedPage | Parts used with cost details | Parts tracking and billing |
| `/jobs/:id/inventory` | InventoryRequestPage | Request parts from stock | Supply chain integration |
| `/jobs/:id/pause` | PauseJobPage | Pause job with reason | Job interruption management |
| `/jobs/:id/resume` | ResumeJobPage | Resume paused job | Job continuation flow |
| `/jobs/:id/escalate` | EscalateJobPage | Escalate with reason | Issue escalation to management |
| `/jobs/:id/complete` | CompleteJobPage | Complete with notes and checkpoint links | Job closure workflow |
| `/messages` | MessagesPage | Per-job message threads | Communication with operations |
| `/notifications` | NotificationsPage | All notifications list | Alert review and management |
| `/profile` | TechnicianProfilePage | Profile, skills, performance metrics | Self-service profile management |
| `/settings` | SettingsPage | App preferences and sync status | User customization |

## Routing Implementation

Hash-based routing via `window.location.hash` listener in `src/routes/index.tsx`:

```
window.addEventListener('hashchange', handler) -> parseHash() -> switch render
```

No external routing library. The `Routes` component:
1. Parses `window.location.hash` on mount and on `hashchange`
2. Maps hash segments to route patterns
3. Supports nested `/jobs/:id/:action` routes
4. Renders the matching page component
5. Defaults to `DashboardPage` for unmatched routes

## Navigation Flow

```
Sidebar (AppLayout)
+-- Dashboard       -> #/          -> DashboardPage
+-- Today's Jobs    -> #/today     -> TodayJobsPage
+-- Assigned Jobs   -> #/assigned  -> AssignedJobsPage
+-- Upcoming Jobs   -> #/upcoming  -> UpcomingJobsPage
+-- Completed Jobs  -> #/completed -> CompletedJobsPage
+-- Job History     -> #/history   -> JobHistoryPage
+-- Messages        -> #/messages  -> MessagesPage
+-- Notifications   -> #/notifications -> NotificationsPage
+-- Profile         -> #/profile   -> TechnicianProfilePage
+-- Settings        -> #/settings  -> SettingsPage

Internal Links:
  DashboardPage      -> #/jobs/:id    -> JobDetailPage
  TodayJobsPage      -> #/jobs/:id    -> JobDetailPage
  JobDetailPage      -> #/jobs/:id/*  -> Sub-pages
  NotificationsPage  -> #/jobs/:id    -> JobDetailPage (via notification tap)
  CompleteJobPage    -> #/jobs/:id/signature -> SignatureCapturePage
  CompleteJobPage    -> #/jobs/:id/photos    -> PhotoUploadPage
```

## Future Route Contracts

| Route | Component | Backend Trigger |
|---|---|---|
| `/jobs/:id/accept` | AcceptForm | Accept assignment confirmation |
| `/jobs/:id/reject` | RejectForm | Reject with reason |
| `/jobs/:id/status` | UpdateProgressForm | Milestone-based progress update |
| `/reports` | ReportsPage | Performance and completion reports |
