# Technician Portal v2

Field service application for ResQAI technicians. Mobile-first, offline-capable portal for managing jobs, capturing evidence, communicating with operations, and completing service tasks.

## Features

- **Dashboard** — Today's schedule, current assignment, next appointment, urgent jobs
- **Job Management** — View, accept, update, pause, resume, escalate, and complete jobs
- **Job Details** — Full job information with service type, priority, scheduling, and description
- **Checklist** — Per-job task checklists with progress tracking
- **Service Notes** — Categorised notes (observation, diagnosis, resolution, etc.)
- **Evidence Capture** — Photo and video upload with captions and GPS data
- **Signature Capture** — Canvas-based signature with customer name
- **Parts Management** — Record parts used, request inventory
- **Navigation** — Turn-by-turn directions integration (Google Maps, Waze)
- **Customer Details** — Contact info, address, call/navigate actions
- **Messages** — Real-time chat with dispatchers and operations
- **Notifications** — Job alerts, schedule changes, escalations
- **Profile & Settings** — Technician profile, preferences, sync status

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | DashboardPage | Main dashboard with KPIs and schedule |
| `/today` | TodayJobsPage | Today's full job list with filters |
| `/assigned` | AssignedJobsPage | Pending assigned jobs |
| `/upcoming` | UpcomingJobsPage | Future scheduled jobs |
| `/completed` | CompletedJobsPage | Completed jobs list |
| `/history` | JobHistoryPage | Job history with stats |
| `/jobs/:id` | JobDetailPage | Full job detail with actions |
| `/jobs/:id/customer` | CustomerDetailsPage | Customer info and contact |
| `/jobs/:id/navigation` | NavigationPage | Directions and travel info |
| `/jobs/:id/checklist` | JobChecklistPage | Task checklist with progress |
| `/jobs/:id/notes` | ServiceNotesPage | Add/view service notes |
| `/jobs/:id/photos` | PhotoUploadPage | Upload photo evidence |
| `/jobs/:id/videos` | VideoUploadPage | Upload video evidence |
| `/jobs/:id/signature` | SignatureCapturePage | Capture customer signature |
| `/jobs/:id/parts` | PartsUsedPage | Parts used with cost totals |
| `/jobs/:id/inventory` | InventoryRequestPage | Request parts from inventory |
| `/jobs/:id/pause` | PauseJobPage | Pause a job with reason |
| `/jobs/:id/resume` | ResumeJobPage | Resume a paused job |
| `/jobs/:id/escalate` | EscalateJobPage | Escalate with reason |
| `/jobs/:id/complete` | CompleteJobPage | Complete with notes |
| `/messages` | MessagesPage | Per-job message threads |
| `/notifications` | NotificationsPage | Notification list |
| `/profile` | TechnicianProfilePage | Profile and performance |
| `/settings` | SettingsPage | App preferences |

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Inline styles (CSS custom properties)
- Hash-based function routing
- `@resqai/foundation` shared component library (`../../../shared/src`)

## Offline Capabilities

- Network status indicator (Online/Offline/Syncing)
- Offline-aware uploads with sync queue
- GPS status monitoring
- Pending sync count tracking
- All data operations designed for offline queue

## Setup

```bash
# Install dependencies (from workspace root)
cd ../../ && npm install

# Start dev server
cd apps_v2/technician-portal_v2 && npm run dev

# Build
npm run build
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_LEMMA_TOKEN` | Lemma API token (for testing) |

## State Management

- **React Context**: App-level state (current user, filters, selection, network/GPS status, sync)
- **Custom Hooks**: Data fetching with loading/error/data state pattern

## Mock Services

All API calls go through `src/services/technician-service.ts`. The service returns mock data by default. Replace with real API calls when backend is available.
