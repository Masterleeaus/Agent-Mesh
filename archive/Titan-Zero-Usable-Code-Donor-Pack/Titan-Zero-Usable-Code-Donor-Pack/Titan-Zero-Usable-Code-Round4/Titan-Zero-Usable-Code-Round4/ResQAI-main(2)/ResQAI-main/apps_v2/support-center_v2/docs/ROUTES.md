# Routes

## Route Map

| Route | Page Component | Purpose | Business Objective |
|-------|---------------|---------|-------------------|
| `/` | TicketQueuePage | Main ticket queue with table/kanban views | Primary interface for agents to triage and manage all incoming tickets |
| `/tickets` | TicketQueuePage | Alias for main queue | Same as `/` |
| `/tickets/new` | NewTicketPage | Create a new support ticket manually | Phone/call-in ticket intake with customer search |
| `/tickets/:id` | TicketDetailPage | Full ticket detail with message thread, reply editor, activity timeline, customer info | Single-ticket workspace for investigation and resolution |
| `/my-tickets` | MyTicketsPage | Filtered queue of tickets assigned to current agent | Personal workload management for each support agent |
| `/escalations` | EscalationsPage | Queue of escalated tickets requiring priority attention | Escalation management for team leads and managers |
| `/sla` | SLADashboardPage | SLA compliance metrics, breach tracking, agent performance | Visibility into service level agreement adherence |
| `/templates` | TemplatesPage | CRUD management of reusable reply templates | Efficiency tool — standardized responses for common scenarios |
| `/settings` | QueueSettingsPage | Queue configuration (name, defaults, thresholds) | Administrative configuration of the support queue |

## Routing Implementation

Hash-based routing via `window.location.hash` listener in `src/routes/index.tsx`:

```
window.addEventListener('hashchange', handler) → parseHash() → switch render
```

No external routing library. The `Routes` component:
1. Parses `window.location.hash` on mount and on `hashchange`
2. Maps hash segments to route patterns
3. Renders the matching page component
4. Defaults to `TicketQueuePage` for unmatched routes

## Navigation Flow

```
Sidebar (AppLayout)
├── Ticket Queue   → #/       → TicketQueuePage
├── My Tickets     → #/my-tickets → MyTicketsPage
├── Escalations    → #/escalations → EscalationsPage
├── SLA Dashboard  → #/sla    → SLADashboardPage
├── Templates      → #/templates  → TemplatesPage
└── Queue Settings → #/settings   → QueueSettingsPage

Internal Links:
  TicketQueuePage → #/tickets/:id → TicketDetailPage
  TicketQueuePage → #/tickets/new → NewTicketPage
  TicketDetailPage → #/          → TicketQueuePage
  NewTicketPage    → #/          → TicketQueuePage (after submit or cancel)
```

## Future Route Contracts

| Route | Component | Backend Trigger |
|-------|-----------|----------------|
| `/tickets/:id/export` | Not implemented | Export ticket as PDF/email |
| `/reports` | Not implemented | Advanced reporting dashboard |
| `/customers/:id` | Not implemented | Customer 360 view |

## Page Metadata

Each page is intended to be wrapped with metadata for SEO/title:
- Ticket Queue — `Support Center — Ticket Queue | ResQAI`
- Ticket Detail — `Ticket #ID — Support Center | ResQAI`
- New Ticket — `New Ticket — Support Center | ResQAI`
- etc.
