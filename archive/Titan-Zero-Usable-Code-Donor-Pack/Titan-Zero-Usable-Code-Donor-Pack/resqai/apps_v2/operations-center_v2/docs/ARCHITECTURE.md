# Architecture

## Purpose
Operations Center v2 is a field operations management SPA for ResQAI. It provides a unified interface for dispatching technicians, monitoring live operations, managing assignments, tracking escalations, and reviewing operational history.

## Tech Stack
- **Framework**: React 18 with TypeScript
- **Build**: Vite
- **Styling**: Inline styles with CSS custom properties (no Tailwind)
- **Routing**: Hash-based function routing (no React Router)
- **Shared UI**: `@resqai/foundation` (resolved via `../../../shared/src`)

## Folder Structure
```
src/
  components/   - App-specific components (widgets, tables, forms, dialogs)
  contracts/    - Event names, permission constants
  hooks/        - Data-fetching hooks (useOperations, useTechnicians, etc.)
  layouts/      - App-level layout (AppLayout)
  models/       - DTOs, view models, API request/response types
  pages/        - Route-level page components (13 pages)
  routes/       - Hash-based route switch
  services/     - Mock API service layer (swappable)
  state/        - React Context for app-wide state
  types/        - Re-exported shared types
```

## Key Decisions
- **No router library**: Simple hash-based routing to avoid dependency overhead
- **Mock services**: All API calls go through `src/services/operations-service.ts` which can be swapped for real implementations
- **Shared foundation**: UI primitives come from `../../../shared/src/components` for consistency across ResQAI apps
- **State management**: React Context for app state (selected operations, filters); data fetching via custom hooks
- **Loading/Empty/Error states**: Every page and component handles all three states
- **Permission-aware UI**: PermissionGuard component + conditional rendering across all pages

## Event Flow
```
User Action → Page Component → Hook (useOperations) → Service (operationsService) → Mock API → State Update → Re-render
      ↓
  EventBus (shared) emits app-level events (operation.created, operation.dispatched, etc.)
```

## Dependencies
- `@resqai/foundation` (shared component library)
- `lemma-sdk` (provided via main.tsx)
