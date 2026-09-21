# customer-portal_v2 — Routes

## Route Map

| Route                    | Page Component           | Parameters     | Auth Required |
|--------------------------|--------------------------|----------------|---------------|
| `#/`                     | CustomerDashboardPage    | none           | Yes           |
| `#/tickets`              | MyTicketsPage            | none           | Yes           |
| `#/tickets/new`          | CreateSupportRequestPage | none           | Yes           |
| `#/tickets/:id`          | TicketDetailPage         | id (ticket ID) | Yes           |
| `#/appointments`         | AppointmentsPage         | none           | Yes           |
| `#/appointments/book`    | BookAppointmentPage      | none           | Yes           |
| `#/appointments/calendar`| AppointmentCalendarPage | none           | Yes           |
| `#/appointments/:id`     | AppointmentDetailPage   | id (appt ID)   | Yes           |
| `#/track-technician`     | TrackTechnicianPage      | none           | Yes           |
| `#/live-status`          | LiveStatusPage           | none           | Yes           |
| `#/messages`             | MessagesPage             | none           | Yes           |
| `#/notifications`        | NotificationsPage        | none           | Yes           |
| `#/service-history`      | ServiceHistoryPage       | none           | Yes           |
| `#/invoices`             | InvoicesPage             | none           | Yes           |
| `#/invoices/:id`         | InvoiceDetailPage        | id (invoice ID)| Yes           |
| `#/payments`             | PaymentsPage             | none           | Yes           |
| `#/feedback`             | FeedbackPage             | none           | Yes           |
| `#/knowledge-base`       | KnowledgeBasePage        | none           | No            |
| `#/knowledge-base/:id`   | KnowledgeBaseArticlePage | id (article ID)| No            |
| `#/downloads`            | DownloadsPage            | none           | No            |
| `#/profile`              | ProfilePage              | none           | Yes           |
| `#/settings`             | SettingsPage             | none           | Yes           |
| `#/security`             | SecurityPage             | none           | Yes           |
| `#/help`                 | HelpCenterPage           | none           | No            |
| `#/disputes`             | DisputesPage             | none           | Yes           |
| `#/disputes/:id`         | DisputeDetailPage        | id (dispute ID)| Yes           |
| `#/account`              | ProfilePage (alias)      | none           | Yes           |
| `#/account/health`       | AccountHealthPage        | none           | Yes           |

## Routing Implementation

The router uses a custom hash-based implementation in `src/routes/index.tsx`:

1. `parseHash()` extracts the current hash value, defaulting to `/`
2. `matchRoute()` breaks the hash into segments and matches against known patterns using prefix matching with `:param` placeholders
3. `Routes()` component listens for `hashchange` events and re-renders the matching page component
4. Parameter extraction supports single `:id` segments (e.g., `/tickets/T-1001` → `{ id: 'T-1001' }`)

## Navigation Flow

- **Sidebar navigation**: Items have `id` matching route paths. Clicking an item sets `window.location.hash = item.id`.
- **Programmatic navigation**: `useNavigate()` hook provides a `navigate(path)` function.
- **Back navigation**: Detail pages render a "Back" `<Button variant="ghost">` that navigates to the parent list route.
- **Deep linking**: Any route can be accessed directly via URL hash (e.g., `https://portal.resqai.com/#/tickets/T-1001`).

## Future Route Contracts

| Route                          | Page                     | Backend Dependency              |
|--------------------------------|--------------------------|---------------------------------|
| `#/chat`                       | LiveChatPage             | WebSocket message service       |
| `#/appointments/:id/checkin`   | CheckInPage              | Appointment check-in function   |
| `#/invoices/:id/download`     | InvoiceDownload          | PDF generation function          |
| `#/referrals`                  | ReferralsPage            | Referral tracking table          |
| `#/warranty`                   | WarrantyPage             | Warranty registration table     |

## Page Metadata

Each page in the route map defines:
- **Page Component**: React component rendered for the route
- **Parameters**: Route parameters extracted from hash
- **Auth Required**: Whether the page requires authentication
- **Data Source**: Primary hook(s) used for data fetching
- **Permission**: Required permission constant from CustomerPortalPermissions
