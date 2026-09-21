# Appointment Board

Upcoming visits, technician assignments, and scheduling for ResQAI operations.

## Features

- **3 KPI cards** — Today count, Unassigned count (scheduled/in_progress without technician), Needs follow-up count
- **Grouped appointment tables** — Today, Upcoming, Needs follow-up, Past (last 10)
- **Clickable rows** — Opens a sticky detail panel on the right
- **Detail panel** — Service type, date/time, customer info, status badge, current technician, notes
- **Technician picker** — Chip-style grid showing active techs with skill + availability
- **AI tech suggestion** — Calls `operations-coordinator` agent to recommend the best tech
- **Status actions** — Start visit, Mark complete, Needs follow-up, Cancel (all logged to `operations_log`)

## Tables used

`appointments`, `customers`, `technicians`, `operations_log`

## Agents used

`operations-coordinator`

## Getting started

```bash
cd apps/appointment-board
npm install
npm run dev
```

The app boots on `http://localhost:5173`. The Lemma SDK must be loaded by the parent shell (window.LemmaClient) and the user must be authenticated before data loads.

## Project structure

```
appointment-board/
├── components/         # KpiCards, AppointmentGroup, AppointmentDetail, TechnicianPicker
├── hooks/              # useAppointments — data fetching, grouping, mutations
├── pages/              # AppointmentBoardPage — main layout
├── routes/             # Route exports
├── services/           # appointment-service — SDK wrappers (fetch/update/assign/suggest)
├── state/              # atoms — React Context definition + useAppState hook
├── types/              # Local types + shared type re-exports
├── App.tsx             # Root component with navigation header
├── App.css             # Dark theme CSS variables
├── main.tsx            # Entry point
├── ARCHITECTURE.md     # Detailed architecture document
└── package.json        # Vite + React deps
```
