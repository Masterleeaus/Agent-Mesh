# Appointment Center V2

Production-ready Appointment Management application for ResQAI V2 platform. Single source of truth for all appointments.

## Features
- **Dashboard** — Overview of today's operations with key metrics and widgets
- **Appointment Queue** — Searchable, filterable, sortable table with bulk actions
- **Calendar View** — Day/week/month calendar with appointment cards
- **Timeline View** — Hourly timeline of appointments
- **Create Appointment** — Multi-step booking wizard
- **Appointment Detail** — Full detail view with tabs (Details, Customer, Technician, Activity, History)
- **Reschedule** — Change date/time with reason tracking
- **Assign Technician** — Technician assignment with confirmation
- **Appointment History** — Full activity log with filters
- **Cancelled / Completed** — Filtered views for status-specific monitoring
- **Search** — Global search across appointments, customers, and technicians
- **Reports** — Analytics with date range filtering, status breakdown, technician performance
- **Service Types** — CRUD catalog for service definitions
- **Technician Schedules** — Per-technician daily schedule view
- **Settings** — Scheduling rules and constraints configuration

## Pages
| Route | Page | 
|-------|------|
| `#/` | Dashboard |
| `#/queue` | Appointment Queue |
| `#/calendar` | Calendar View |
| `#/timeline` | Timeline View |
| `#/appointments/new` | Create Appointment |
| `#/appointments/:id` | Appointment Details |
| `#/appointments/:id/reschedule` | Reschedule |
| `#/appointments/:id/assign` | Assign Technician |
| `#/history` | Appointment History |
| `#/cancelled` | Cancelled Appointments |
| `#/completed` | Completed Appointments |
| `#/search` | Search |
| `#/reports` | Reports |
| `#/technicians` | Technician Schedules |
| `#/technicians/:id/schedule` | Technician Detail Schedule |
| `#/services` | Service Types |
| `#/settings` | Settings |

## Widgets
- Today's Appointments
- Upcoming Appointments
- Overdue Appointments
- Pending Assignment
- Completed Today
- Technician Availability

## Setup
```bash
npm install
npm run dev
```

## Architecture
- **React 18** with TypeScript
- **Vite** build tooling
- **Hash-based routing** (no react-router)
- **React Context** for global state
- **Custom hooks** for data fetching
- **Mock service layer** for independent frontend development
- **Dark theme** with inline styles via CSS custom properties
- **Shared component library** at `../../../shared/src`
