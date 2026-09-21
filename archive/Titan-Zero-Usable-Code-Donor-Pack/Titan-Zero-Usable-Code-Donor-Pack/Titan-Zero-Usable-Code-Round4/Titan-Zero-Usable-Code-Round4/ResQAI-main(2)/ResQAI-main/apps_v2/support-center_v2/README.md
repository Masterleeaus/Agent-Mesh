# Support Center v2

Ticket management application for the ResQAI platform. Provides a unified interface for managing customer support tickets, monitoring SLA compliance, and handling escalations.

## Features

- **Ticket Queue** — Full-featured queue with filtering, sorting, and table/kanban views
- **Ticket Detail** — Message thread, activity timeline, customer info, and related records
- **Manual Ticket Creation** — Phone/call-in ticket intake with customer search
- **My Tickets** — Filtered view of tickets assigned to the current agent
- **Escalations** — Dedicated queue for escalated tickets with priority visibility
- **SLA Dashboard** — Compliance metrics, breach tracking, and agent performance
- **Reply Templates** — Create and manage reusable reply templates
- **Queue Settings** — Configure queue name, urgency defaults, SLA thresholds

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | TicketQueuePage | Main ticket queue |
| `/tickets/new` | NewTicketPage | Create manual ticket |
| `/tickets/:id` | TicketDetailPage | Ticket detail view |
| `/my-tickets` | MyTicketsPage | My assigned tickets |
| `/escalations` | EscalationsPage | Escalated tickets |
| `/sla` | SLADashboardPage | SLA metrics |
| `/templates` | TemplatesPage | Reply templates |
| `/settings` | QueueSettingsPage | Queue configuration |

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Inline styles (CSS custom properties)
- Hash-based function routing
- `@resqai/foundation` shared component library (`../../../shared/src`)

## Setup

```bash
# Install dependencies (from workspace root)
cd ../../ && npm install

# Start dev server
cd apps_v2/support-center_v2 && npm run dev

# Build
npm run build
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_LEMMA_TOKEN` | Lemma API token (for testing) |

## State Management

- **React Context**: App-level state (current user, filters, ticket selection, view mode)
- **Custom Hooks**: Data fetching with loading/error/data state pattern

## Mock Services

All API calls go through `src/services/ticket-service.ts`. The service returns mock data by default. Replace with real API calls when backend is available.

## Future Integration Points

- Real-time ticket updates via EventBus events (`ticket.created`, `ticket.classified`, etc.)
- AI reply suggestions from the AI agent
- Customer portal integration for ticket submission
- Real SLA monitoring with WebSocket updates
