# customer-portal_v2 — Navigation

## Route Map

| Route                    | Page                     | Description                  |
|--------------------------|--------------------------|------------------------------|
| `#/`                     | CustomerDashboardPage    | Dashboard with widgets       |
| `#/tickets`              | MyTicketsPage            | Support ticket list          |
| `#/tickets/new`          | CreateSupportRequestPage | Create new support request   |
| `#/tickets/:id`          | TicketDetailPage         | Ticket detail + messages     |
| `#/appointments`         | AppointmentsPage         | Appointment list             |
| `#/appointments/book`    | BookAppointmentPage      | Book new appointment         |
| `#/appointments/calendar`| AppointmentCalendarPage  | Calendar view                |
| `#/appointments/:id`     | AppointmentDetailPage   | Appointment detail           |
| `#/track-technician`     | TrackTechnicianPage      | Live technician tracking     |
| `#/live-status`          | LiveStatusPage           | Real-time status dashboard   |
| `#/messages`             | MessagesPage             | Message inbox                |
| `#/notifications`        | NotificationsPage        | Notification center          |
| `#/service-history`      | ServiceHistoryPage       | Past service records         |
| `#/invoices`             | InvoicesPage             | Invoice list                 |
| `#/invoices/:id`         | InvoiceDetailPage        | Invoice detail + payment     |
| `#/payments`             | PaymentsPage             | Payment history              |
| `#/feedback`             | FeedbackPage             | Submit and view feedback     |
| `#/knowledge-base`       | KnowledgeBasePage        | Search articles              |
| `#/knowledge-base/:id`   | KnowledgeBaseArticlePage | Article detail               |
| `#/downloads`            | DownloadsPage            | Downloadable files           |
| `#/profile`              | ProfilePage              | Profile + notification prefs |
| `#/settings`             | SettingsPage             | Settings dashboard           |
| `#/security`             | SecurityPage             | Password, 2FA, sessions     |
| `#/help`                 | HelpCenterPage           | FAQ and support              |
| `#/disputes`             | DisputesPage             | Dispute list                 |
| `#/disputes/:id`         | DisputeDetailPage        | Dispute detail               |

## Sidebar Structure

The sidebar is organized into four sections with clear visual separation:

### Main
- Dashboard (`#/`)
- My Tickets (`#/tickets`)
- Appointments (`#/appointments`)
- Calendar (`#/appointments/calendar`)
- Track Technician (`#/track-technician`)
- Messages (`#/messages`)
- Notifications (`#/notifications`)

### Services
- Invoices (`#/invoices`)
- Payments (`#/payments`)
- Service History (`#/service-history`)
- Feedback (`#/feedback`)

### Resources
- Knowledge Base (`#/knowledge-base`)
- Downloads (`#/downloads`)
- Help Center (`#/help`)

### Account
- Profile (`#/profile`)
- Settings (`#/settings`)
- Security (`#/security`)

## Active State Detection

The active sidebar item is determined by comparing `window.location.hash` against each item's `id`. For the dashboard (`/`), an exact match is required. For all other routes, a prefix match is used (e.g., hash `/tickets/T-1001` activates the `/tickets` sidebar item).

## Mobile Navigation

On screens ≤768px:
- Desktop sidebar is hidden
- A hamburger menu button appears in the top-left corner
- Tapping it opens a slide-over panel with the full sidebar content
- Tapping outside closes it
- Selecting a nav item navigates and closes the panel

## Breadcrumb Pattern

Pages with parent-child relationships show a "Back" button at the top (e.g., Ticket Detail has "← Back to Tickets"). This is implemented per-page rather than as a global breadcrumb component.
