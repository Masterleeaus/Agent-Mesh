# Architecture

## Purpose
Technician Portal v2 is a mobile-first field service SPA for ResQAI. It provides technicians with a unified interface for managing jobs, capturing evidence, communicating with operations, and tracking performance.

## Tech Stack
- **Framework**: React 18 with TypeScript
- **Build**: Vite
- **Styling**: Inline styles with CSS custom properties (no Tailwind)
- **Routing**: Hash-based function routing (no React Router)
- **Shared UI**: `@resqai/foundation` (resolved via `../../../shared/src`)

## Folder Structure
```
src/
  components/   - App-specific components (PermissionGuard)
  contracts/    - Event names, permission constants
  hooks/        - Data-fetching hooks (useDashboard, useJobs, useJobDetail, etc.)
  layouts/      - App-level layout (AppLayout)
  models/       - DTOs, view models, API request/response types
  pages/        - Route-level page components (24 pages)
  routes/       - Hash-based route switch (24 routes)
  services/     - Mock API service layer (swappable)
  state/        - React Context for app-wide state
  types/        - Re-exported shared types
```

## Key Decisions
- **No router library**: Simple hash-based routing to avoid dependency overhead
- **Mock services**: All API calls go through `src/services/technician-service.ts` which can be swapped for real implementations
- **Shared foundation**: UI primitives come from `../../../shared/src/components` for consistency across ResQAI apps
- **State management**: React Context for app state (user, network status, GPS, sync, notifications); data fetching via custom hooks
- **Mobile-first design**: All pages are responsive with tablet support, large touch targets, and accessible markup
- **Offline readiness**: Network status tracking, GPS monitoring, sync queue for pending changes
- **Loading/Empty/Error states**: Every page and component handles all three states

## Event Flow
```
User Action -> Page Component -> Hook (useJobs) -> Service (technicianService) -> Mock API -> State Update -> Re-render
      |
  EventBus (shared) emits app-level events (job.accepted, job.completed, job.escalated, etc.)
```

## Dependencies
- `@resqai/foundation` (shared component library)
- `lemma-sdk` (provided via main.tsx)
