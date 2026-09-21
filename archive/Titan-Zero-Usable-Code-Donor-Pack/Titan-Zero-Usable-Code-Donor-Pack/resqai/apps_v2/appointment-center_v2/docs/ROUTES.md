# Routes

## Route Map

| Route | Page Component | Purpose | Business Objective |
|-------|---------------|---------|-------------------|
| `/` | DashboardPage | Overview dashboard with metrics and widgets | At-a-glance daily operations monitoring |
| `/queue` | AppointmentQueuePage | Full appointment list with search, filters, sort, pagination | Triage and manage all appointments |
| `/calendar` | CalendarViewPage | Day/week/month calendar grid | Visual schedule navigation |
| `/timeline` | TimelineViewPage | Hourly timeline for a selected date | Time-based slot view |
| `/appointments/new` | NewAppointmentPage | Multi-step booking wizard | Schedule new service appointments |
| `/appointments/:id` | AppointmentDetailPage | Full detail with tabs (Details, Customer, Technician, Activity, History) | Single-appointment workspace |
| `/appointments/:id/reschedule` | ReschedulePage | Date/time change with reason | Reschedule existing appointments |
| `/appointments/:id/assign` | AssignTechnicianPage | Technician assignment with confirmation | Assign technician to appointment |
| `/history` | AppointmentHistoryPage | Activity log with date range/type filters | Audit trail for all appointment events |
| `/cancelled` | CancelledAppointmentsPage | Filtered list of cancelled appointments | Monitor cancellations |
| `/completed` | CompletedAppointmentsPage | Filtered list of completed appointments | Review completed work |
| `/search` | SearchPage | Global search across appointments, customers, technicians | Quick lookup |
| `/reports` | ReportsPage | Analytics dashboard with date range | Performance and operational reporting |
| `/technicians` | TechnicianSchedulePage | List/schedule of all technicians | Manage technician schedules |
| `/technicians/:id/schedule` | TechnicianSchedulePage | Single technician's daily schedule | View per-technician appointments |
| `/services` | ServiceTypesPage | CRUD management of service types | Configure service catalog |
| `/settings` | ScheduleSettingsPage | Schedule configuration (slots, buffers, hours) | System scheduling rules |

## Routing Implementation

Hash-based routing via `window.location.hash` listener in `src/routes/index.tsx`:

```
window.addEventListener('hashchange', handler) → matchRoute() → switch render
```

No external routing library. The `Routes` component:
1. Parses `window.location.hash` on mount and on `hashchange`
2. Maps hash segments to 17 route patterns
3. Supports route params (e.g., `:id`)
4. Renders the matching page component
5. Defaults to `DashboardPage` for unmatched routes

## Navigation Flow

```
Sidebar (AppLayout)
├── Dashboard       → #/        → DashboardPage
├── Queue           → #/queue   → AppointmentQueuePage
├── Calendar        → #/calendar → CalendarViewPage
├── Timeline        → #/timeline → TimelineViewPage
├── New Appointment → #/appointments/new → NewAppointmentPage
├── History         → #/history → AppointmentHistoryPage
├── Cancelled       → #/cancelled → CancelledAppointmentsPage
├── Completed       → #/completed → CompletedAppointmentsPage
├── Search          → #/search  → SearchPage
├── Reports         → #/reports → ReportsPage
├── Technicians     → #/technicians → TechnicianSchedulePage
├── Service Types   → #/services → ServiceTypesPage
└── Settings        → #/settings → ScheduleSettingsPage

Internal Links:
  All lists → #/appointments/:id → AppointmentDetailPage
  AppointmentDetail → #/appointments/:id/reschedule → ReschedulePage
  AppointmentDetail → #/appointments/:id/assign → AssignTechnicianPage
  Dashboard widgets → #/appointments/:id
  Search results → #/appointments/:id or #/technicians/:id/schedule
```

## Page Metadata

| Page | Title |
|------|-------|
| Dashboard | Appointment Center — Dashboard |
| Queue | Appointment Queue — Appointment Center |
| Calendar | Calendar View — Appointment Center |
| Timeline | Timeline View — Appointment Center |
| Appointment Detail | Appointment #ID — Appointment Center |
| New Appointment | New Appointment — Appointment Center |
| History | Appointment History — Appointment Center |
| Search | Search — Appointment Center |
| Reports | Reports — Appointment Center |
