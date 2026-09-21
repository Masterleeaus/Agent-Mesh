# Architecture

## Purpose
Support Center v2 is a ticket management SPA for ResQAI. It provides a unified interface for managing customer support tickets, tracking SLA compliance, managing reply templates, and handling escalations.

## Tech Stack
- **Framework**: React 18 with TypeScript
- **Build**: Vite
- **Styling**: Inline styles with CSS custom properties (no Tailwind)
- **Routing**: Hash-based function routing (no React Router)
- **Shared UI**: `@resqai/foundation` (resolved via `../../../shared/src`)

## Folder Structure
```
src/
  components/   - App-specific components (TicketList, MessageThread, etc.)
  contracts/    - Event names, permission constants
  hooks/        - Data-fetching hooks (useTickets, useTicketDetail, etc.)
  layouts/      - App-level layout (AppLayout)
  models/       - DTOs, view models, API request/response types
  pages/        - Route-level page components
  routes/       - Hash-based route switch
  services/     - Mock API service layer (swappable)
  state/        - React Context for app-wide state
  types/        - Re-exported shared types
```

## Key Decisions
- **No router library**: Simple hash-based routing to avoid dependency overhead
- **Mock services**: All API calls go through `src/services/ticket-service.ts` which can be swapped for real implementations
- **Shared foundation**: UI primitives come from `../../../shared/src/components` for consistency across ResQAI apps
- **State management**: React Context for app state (selected tickets, filters, view mode); data fetching via custom hooks
- **Loading/Empty/Error states**: Every page and component handles all three states

## Event Flow
```
User Action → Page Component → Hook (useTickets) → Service (ticketService) → Mock API → State Update → Re-render
      ↓
  EventBus (shared) emits app-level events (ticket.created, ticket.classified, etc.)
```

## Dependencies
- `@resqai/foundation` (shared component library)
- `lemma-sdk` (provided via main.tsx)
