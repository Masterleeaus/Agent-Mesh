# Navigation

## Route Map
| Route | Page Component | Description |
|---|---|---|
| `/` | TicketQueuePage | Main ticket queue |
| `/tickets` | TicketQueuePage | Alias for main queue |
| `/tickets/new` | NewTicketPage | Create manual ticket |
| `/tickets/:id` | TicketDetailPage | Ticket detail view |
| `/my-tickets` | MyTicketsPage | Current user's assigned tickets |
| `/escalations` | EscalationsPage | Escalated tickets queue |
| `/sla` | SLADashboardPage | SLA compliance dashboard |
| `/templates` | TemplatesPage | Reply template management |
| `/settings` | QueueSettingsPage | Queue configuration |

## Sidebar Structure
```
Support Center (brand)
├── Ticket Queue        (/)           - Main queue with filters
├── My Tickets          (/my-tickets) - My assigned tickets
├── Escalations         (/escalations) - Escalated tickets
├── SLA Dashboard       (/sla)        - SLA metrics
├── Templates           (/templates)  - Reply templates
└── Queue Settings      (/settings)   - Queue config
```

## Breadcrumb Patterns
- `Home > Ticket Queue > Ticket #123`
- `Home > Templates`
- `Home > Queue Settings`

## Hash-based Routing
All routes use the `#` prefix for hash-based navigation (e.g., `#/tickets/new`). The `Routes` component listens for `hashchange` events and renders the matching page component.
