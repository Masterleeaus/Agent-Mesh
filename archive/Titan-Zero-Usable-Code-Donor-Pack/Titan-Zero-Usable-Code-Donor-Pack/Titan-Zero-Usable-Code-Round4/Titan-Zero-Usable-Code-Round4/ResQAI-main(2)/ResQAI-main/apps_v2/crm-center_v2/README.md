# CRM Center v2

Enterprise Customer Relationship Management application for the ResQAI platform. Manages the complete customer lifecycle after support and service completion — account health, follow-ups, interactions, feedback, satisfaction, retention, and growth opportunities.

## Pages

| Route | Page | Description |
|---|---|---|
| `#/` | Dashboard | Account health overview, KPIs, risk signals |
| `#/accounts` | Customer Directory | Searchable/filterable account list |
| `#/accounts/:id` | Customer Profile | 360° account view with tabs |
| `#/followups` | Follow-up Queue | Filterable follow-up list |
| `#/followups/new` | New Follow-up | Create follow-up form |
| `#/followups/:id` | Follow-up Detail | Follow-up detail + status update |
| `#/timeline` | Customer Timeline | Chronological activity timeline |
| `#/interactions` | Interaction History | Searchable interaction log |
| `#/satisfaction` | Customer Satisfaction | Satisfaction scores and trends |
| `#/feedback` | Customer Feedback | Feedback records with sentiment |
| `#/feedback/new` | Record Feedback | Record customer feedback form |
| `#/renewals` | Renewal Opportunities | Renewal pipeline management |
| `#/upsells` | Upsell Opportunities | Upsell/cross-sell pipeline |
| `#/retention` | Retention Dashboard | Churn risk and retention metrics |
| `#/communications` | Communication Center | Channel breakdown and history |
| `#/notes` | Notes | Categorized account notes |
| `#/notes/new` | Add Note | Create account note form |
| `#/tasks` | Tasks | Task management and tracking |
| `#/tasks/new` | Create Task | Create task form |
| `#/scans` | Health Scans | Health scan history |
| `#/risks` | Risk Signals | Risk signal tracking |
| `#/reports` | Reports | CRM reports library |
| `#/search` | Search | Global search |
| `#/calls/new` | Schedule Call | Schedule outbound call form |

## Tech Stack

- React 18 + TypeScript
- Vite (port 5185)
- Shared foundation (`@resqai/foundation`)
- Hash-based routing (no React Router)
- Inline styles (no Tailwind)

## Quick Start

```bash
npm run dev       # Start dev server
npm run build     # TypeScript check + Vite build
npm run preview   # Preview production build
```

## Project Structure

```
src/              — App entry, routes, pages
components/       — Custom CRM components (10 widgets + dialogs + guard)
contracts/        — Permissions (22) + events (18)
hooks/            — Data hooks (17)
layouts/          — App shell (Topbar + Sidebar)
models/           — DTOs (9 entities), VMs, API types
services/         — Service stubs (30 methods)
state/            — App context
docs/             — Architecture, navigation, component tree docs
```

## Status

Frontend shell — 27 pages, 17 routes, 16 hooks, 30 service stubs, 22 permissions.
All service methods throw "not implemented" — wire to real API to activate data.

## License

ResQAI V2 — Proprietary
