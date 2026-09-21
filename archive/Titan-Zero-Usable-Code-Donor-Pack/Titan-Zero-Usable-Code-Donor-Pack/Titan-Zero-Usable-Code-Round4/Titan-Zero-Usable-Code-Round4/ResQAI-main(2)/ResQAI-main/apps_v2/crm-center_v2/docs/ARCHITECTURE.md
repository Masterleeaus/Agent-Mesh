# CRM Center v2 — Architecture

## Overview

CRM Center v2 is a single-page application (SPA) built with React 18, TypeScript, and Vite. It provides a unified interface for managing the complete customer lifecycle: account health monitoring, follow-ups, interactions, feedback, satisfaction tracking, retention management, and growth opportunities.

## Tech Stack

- **React 18** — Component-based UI
- **TypeScript** — Strict typing throughout
- **Vite** — Build tool and dev server (port 5185)
- **Shared Foundation** (`@resqai/foundation` via `../../../shared/src`) — Reusable components, layouts, navigation, permissions, state providers, event bus, and utilities

## Directory Layout

```
apps_v2/crm-center_v2/
  src/                  # Application entry and page routing
    App.tsx             # Root component with AppProvider + AppLayout + Routes
    main.tsx            # Vite entry point
    pages/              # 27 page components
    routes/             # Hash-based router (24 routes)
    vite-env.d.ts       # Vite type declarations
    types/              # Shared app-wide types
  components/           # 10 custom CRM components + PermissionGuard + Dialogs
  contracts/            # 22 permissions + 18 event types
  hooks/                # 17 data-fetching hooks per domain entity
  layouts/              # AppLayout shell (Topbar + Sidebar)
  models/               # 9 entity DTOs, view models, API request/response types
  services/             # 30 mock service stubs
  state/                # AppContext (user, filters, selection)
  docs/                 # Architecture, navigation, component tree docs
```

## Architecture Decisions

1. **No external state library** — React Context + useState hooks suffice for this shell.
2. **Hash-based routing** — No React Router dependency; simple `window.location.hash` parsing in Routes.
3. **Inline styles** — All CSS via React style objects and CSS custom properties; no Tailwind.
4. **Mock services** — `services/crm-service.ts` exports 30 typed async functions that throw "not implemented"; consumers handle loading/empty/error states throughout.
5. **No backend, database, workflow, or AI logic** — Pure frontend shell.

## Data Flow

```
Page Component
  → Hook (useCRMDashboard, useAccounts, useInteractions, etc.)
    → Service (crm-service.ts)
      → API (not implemented — mock data layer)
```

Each hook manages `{ data, loading, error, refetch }` and renders the corresponding state in the page.

## Entity Model

```
Account ──┬── Followup (N)
          ├── Interaction (N)
          ├── Note (N)
          ├── Task (N)
          ├── Feedback (N)
          ├── Satisfaction (N)
          ├── Opportunity (N)
          ├── RiskSignal (N)
          └── HealthScan (N)

Customer ──┬── Account (1)
           ├── Followup (N)
           ├── Interaction (N)
           ├── Note (N)
           ├── Feedback (N)
           ├── Satisfaction (N)
           └── Opportunity (N)
```

## UI States

Every data-driven component handles: Loading (Skeleton), Empty (EmptyState), Error (ErrorState with retry), Permission Denied (PermissionGuard), Validation Errors (form validation), and No History (contextual empty state).

## Future Integration Points

- Real-time updates via EventBus events (18 CRM events defined)
- AI-driven health scanning via `account-health-monitor` agent
- Automated follow-up creation from workflow triggers
- Satisfaction survey automation
- Opportunity pipeline scoring
