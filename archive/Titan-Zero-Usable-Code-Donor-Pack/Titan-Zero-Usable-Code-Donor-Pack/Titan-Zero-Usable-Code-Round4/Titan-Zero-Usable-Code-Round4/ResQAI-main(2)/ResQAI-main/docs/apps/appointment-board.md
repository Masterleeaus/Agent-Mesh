# Appointment Board

## Purpose

Technician scheduling and appointment management. Provides a real-time operational view of upcoming visits, technician assignments, and scheduling actions for dispatchers and operations staff.

## Current Status

✅ Build-ready — passes `tsc --noEmit` and `vite build`
✅ Validated against Lemma pod data
❌ No unit tests
⚠️ Requires Lemma SDK authentication (blocked on auth redirect fix)

## Tables Used

| Table | Usage |
|-------|-------|
| `appointments` | Core record — service type, date, status, technician assignment |
| `customers` | Customer name, phone, contact info (joined for display) |
| `technicians` | Active tech roster with skill, availability, status |
| `operations_log` | Audit trail for status changes and technician assignments |

## Agents Used

| Agent | Trigger | Purpose |
|-------|---------|---------|
| `operations-coordinator` | "Suggest tech (AI)" button | Receives service details + available techs, returns JSON suggestion |

## Functions Used

None.

## Data Flow

1. Data fetching: `fetchAppointments` / `fetchCustomers` / `fetchTechnicians` via Lemma SDK
2. Client-side grouping: Today, Upcoming, Needs follow-up, Past (last 10)
3. React state (context) → KPI cards, board table, detail panel
4. Mutations: status update or technician assignment → Lemma Pod → optimistic local state update

## State Machine (Status Transitions)

```
scheduled ──> in_progress ──> completed
    │              │
    ├──> needs_followup
    └──> cancelled
```

Each transition writes an `operations_log` entry.

## Key Components

| Component | Responsibility |
|-----------|---------------|
| `KpiCards` | Today count, Unassigned count, Needs follow-up count |
| `AppointmentGroup` | Grouped appointment tables (Today, Upcoming, Needs follow-up, Past) |
| `AppointmentDetail` | Detail panel with status update, tech assignment, AI suggestion |
| `TechnicianPicker` | Chip-style grid of active techs with skill + availability |

## Known Limitations

- No drag-and-drop scheduling
- No calendar view (list/table only)
- No conflict detection for double-booking
- No route optimization for multi-appointment days

## Future Improvements

- Drag-and-drop appointment rescheduling
- Calendar view (day/week/month)
- Automated conflict detection
- Route optimization for technician schedules
- Customer-facing booking portal
- SMS/email appointment reminders
