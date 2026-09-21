# Admin Center v2

ResQAI V2 enterprise administration console. Manages the entire platform including users, roles, permissions, applications, workflows, functions, agents, monitoring, security, and configuration.

## Tech Stack

- React 18 + TypeScript
- Vite (dev server on port 5188)
- Hash-based routing (no external router)
- Inline styles (React.CSSProperties)
- Shared component library (`@resqai/foundation`)

## Getting Started

```bash
npm run dev
```

## Pages: 32

| Group | Pages |
|-------|-------|
| Overview | Executive Dashboard |
| Administration | Users, Roles, Permissions, Organizations, Teams |
| Platform | Applications, Workflows, Functions, Agents, Database |
| Monitoring | Event Bus, Monitoring Dashboard, Platform Health, Errors |
| Security | Audit Log, Security Center, API Keys |
| Configuration | Integrations, Connectors, Notifications, Feature Flags, Settings |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for complete architecture overview.
See [docs/NAVIGATION.md](docs/NAVIGATION.md) for full route map.
See [ADMIN_CENTER_V2_IMPLEMENTATION_REPORT.md](ADMIN_CENTER_V2_IMPLEMENTATION_REPORT.md) for implementation status.

## Key Directories

| Directory | Description |
|-----------|-------------|
| `src/pages/` | 32 route-level page components |
| `src/components/` | 19 reusable admin UI components |
| `src/hooks/` | 25 data-fetching hooks |
| `src/services/` | Mock service layer (45+ API functions) |
| `src/models/` | TypeScript types, DTOs, VMs, request/response types |
| `src/contracts/` | 23 permission constants, 28 event types |
| `src/state/` | App-level React context |
| `src/layouts/` | App shell with sidebar (26 nav items) |
| `docs/` | Architecture, navigation, security, API docs |
