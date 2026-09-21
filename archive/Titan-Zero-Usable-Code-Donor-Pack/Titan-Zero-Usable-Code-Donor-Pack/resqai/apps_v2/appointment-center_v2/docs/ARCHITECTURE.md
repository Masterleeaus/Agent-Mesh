# Architecture

## Purpose
Appointment Center V2 — Production-ready Appointment Management application for ResQAI V2 platform. Single source of truth for all appointments.

## Tech Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Inline styles** via CSS custom properties (dark theme)
- **Hash-based routing** (no react-router dependency)
- **Shared component library** at `../../../shared/src`

## Folder Structure
```
src/
  components/   — App-specific UI components (24 total: ScheduleCalendar, AppointmentQueueTable,
                  TimelineView, BookingWizard, CancelAppointmentDialog, AssignTechnicianDialog,
                  PermissionGuard, widgets, etc.)
  contracts/    — Event constants (11 events), permission constants (17 permissions)
  hooks/        — Data-fetching hooks (11 hooks: useAppointments, useDashboard, useSearch, etc.)
  layouts/      — AppLayout with Topbar + Sidebar
  models/       — DTOs (7 entities), view-models (13), API request (11), API response (10)
  pages/        — Route-level page components (16 pages)
  routes/       — Hash-based route switcher (17 routes)
  services/     — Mock appointment service with 18 typed methods
  state/        — React context for app-wide state
  types/        — Barrel re-exports
docs/           — Documentation (8 files)
```

## Event Flow
1. User action triggers a service call (e.g., `appointmentService.create`)
2. Service returns mock data with simulated delay (300-500ms)
3. Hook updates state (loading → data/error)
4. Component renders based on state (loading → skeleton, error → error state, data → full UI)

## Dependencies
- `../../../shared/src/components` — All shared UI components
- `../../../shared/src/layouts` — DetailLayout
- `../../../shared/src/navigation` — Sidebar
- `../../../shared/src/permissions` — PermissionGuard, RoleGuard
- `../../../shared/src/state` — GlobalState, AuthState, etc.
- `../../../shared/src/events` — EventBus
- `../../../shared/src/utils` — validation, formatting, date, search, logging, config

## Key Decisions
- No external routing library — hash-based routing keeps it simple
- Mock service layer for independent frontend development
- All shared components imported from shared library for consistency
- Inline styles with CSS custom properties for theming
- Every data component handles loading, empty, error, and data states
- Widget pattern for dashboard components — composable, reusable
- Dialog pattern for confirmations — cancel, assign, conflict warning
- PermissionGuard pattern for access control readiness
- Dark theme optimized for operational dashboards

## Pages (16)
Dashboard, Appointment Queue, Calendar View, Timeline View, Create Appointment, Appointment Details, Reschedule, Assign Technician, Appointment History, Cancelled Appointments, Completed Appointments, Search, Reports, Technician Schedules, Service Types, Settings

## Widgets (6)
Today's Appointments, Upcoming, Overdue, Pending Assignment, Completed Today, Technician Availability
