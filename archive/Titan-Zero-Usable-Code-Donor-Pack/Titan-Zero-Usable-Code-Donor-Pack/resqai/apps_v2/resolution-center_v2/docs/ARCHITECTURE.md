# Architecture

## Purpose
Resolution Center V2 is the enterprise dispute and resolution management SPA for ResQAI. It provides a unified interface for reviewing completed work, resolving customer issues, handling disputes, approving technician reports, managing escalations, and officially closing service requests.

## Tech Stack
- **Framework**: React 18 with TypeScript
- **Build**: Vite
- **Styling**: Inline styles with CSS custom properties (no Tailwind)
- **Routing**: Hash-based function routing (no React Router)
- **Shared UI**: `@resqai/foundation` (resolved via `../../../shared/src`)

## Folder Structure
```
src/
  components/   - App-specific components (CaseListTable, DisputeListTable, etc.)
  contracts/    - Event names, permission constants
  hooks/        - Data-fetching hooks (useCases, useDisputes, etc.)
  layouts/      - App-level layout (AppLayout)
  models/       - DTOs, view models, API request/response types
  pages/        - Route-level page components (14 pages)
  routes/       - Hash-based route switch
  services/     - Mock API service layer (swappable)
  state/        - React Context for app-wide state
  types/        - Re-exported shared types
widgets/        - Standalone widget components (7 widgets)
assets/         - Static assets
docs/           - Architecture, navigation, component tree, and implementation docs
```

## Key Decisions
- **No router library**: Simple hash-based routing to avoid dependency overhead
- **Mock services**: All API calls go through `src/services/resolution-service.ts` which can be swapped for real implementations
- **Shared foundation**: UI primitives come from `../../../shared/src/components` for consistency across ResQAI apps
- **State management**: React Context for app state (selected cases, filters, view mode); data fetching via custom hooks
- **Loading/Empty/Error states**: Every page and component handles all three states plus permission-denied and evidence-missing states
- **14 pages**: Covering the full resolution lifecycle from dashboard to closed cases

## Event Flow
```
User Action → Page Component → Hook (useCases) → Service (resolutionService) → Mock API → State Update → Re-render
      ↓
  EventBus (shared) emits app-level events (resolution.case.created, resolution.resolution.approved, etc.)
```

## Dependencies
- `@resqai/foundation` (shared component library)
- `lemma-sdk` (provided via main.tsx)
