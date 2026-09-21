# customer-portal_v2

Enterprise customer self-service portal for ResQAI V2. The only customer-facing interface of the ResQAI ecosystem.

## Features

- **Dashboard**: Real-time account overview with health score, open tickets, upcoming appointments, recent activity, and quick actions
- **Support Tickets**: Create, view, and manage support requests with threaded messaging
- **Appointments**: Book, reschedule, cancel, and view appointments in list or calendar view
- **Technician Tracking**: Live GPS tracking with ETA and status updates
- **Billing**: View invoices, make payments, and review payment history
- **Messages**: Centralized inbox for all support communications
- **Notifications**: In-app notification center with read/unread management
- **Service History**: Complete record of past service visits
- **Feedback**: Submit ratings and comments on services received
- **Knowledge Base**: Searchable help articles with helpfulness voting
- **Account Management**: Profile editing, notification preferences, password changes, security settings
- **Help Center**: FAQ with categorized questions and answers

## Pages

| Route                          | Page                     | Description                      |
|--------------------------------|--------------------------|----------------------------------|
| `#/`                           | Customer Dashboard       | Widget-based account overview    |
| `#/tickets`                    | My Tickets               | Support ticket list with filters |
| `#/tickets/new`                | Create Support Request   | Multi-field ticket creation form |
| `#/tickets/:id`                | Ticket Detail            | Ticket info + message thread     |
| `#/appointments`               | Appointments             | Appointment list with filters    |
| `#/appointments/book`          | Book Appointment         | Multi-step booking wizard        |
| `#/appointments/calendar`      | Appointment Calendar     | Month calendar with events       |
| `#/appointments/:id`           | Appointment Detail       | Appointment info + actions       |
| `#/track-technician`           | Track Technician         | Live technician location/ETA     |
| `#/live-status`                | Live Status              | Real-time status dashboard       |
| `#/messages`                   | Messages                 | Message inbox                    |
| `#/notifications`              | Notifications            | Notification center              |
| `#/service-history`            | Service History          | Past service records table       |
| `#/invoices`                   | Invoices                 | Invoice list with status         |
| `#/invoices/:id`               | Invoice Detail           | Line items + payment             |
| `#/payments`                   | Payment History          | Past payments table              |
| `#/feedback`                   | Feedback                 | Submit and review feedback       |
| `#/knowledge-base`             | Knowledge Base           | Searchable help articles         |
| `#/knowledge-base/:id`         | Article Detail           | Full article content             |
| `#/downloads`                  | Downloads                | File downloads (guides, docs)    |
| `#/profile`                    | Profile                  | Personal info + notification prefs|
| `#/settings`                   | Settings                 | Settings overview                |
| `#/security`                   | Security                 | Password, 2FA, sessions          |
| `#/help`                       | Help Center              | FAQ with categorized questions   |

## Widgets

- Open Tickets — Priority-coded list with count
- Upcoming Appointments — Next scheduled services
- Recent Activity — Chronological activity feed
- Technician ETA — Live tracking card for active appointments
- Notifications — Recent unread notifications
- Customer Satisfaction — Average rating display
- Quick Actions — Grid of common tasks

## Forms

- Create Ticket (subject, message, type, channel, contact info)
- Update Ticket (add message to thread)
- Reschedule Appointment (date picker + time slots)
- Cancel Appointment (reason required)
- Submit Feedback (category, rating, comment)
- Update Profile (name, email, phone, address)
- Change Password (current, new, confirm)

## Dialogs

- Appointment Confirmation — Summary before booking
- Cancellation Confirmation — Warning before cancel
- Payment Confirmation — Amount + method review
- Feedback Confirmation — Thank you after submission

## Tables

- Tickets (ID, subject, status, type, priority, created)
- Appointments (service, date, time, technician, status)
- Messages (subject, from, date, read/unread)
- Invoices (number, amount, status, issued, due)
- Payments (invoice, amount, method, status, date)
- Service History (service, date, technician, status, completed)

## UI States

- Loading — Skeleton placeholders for every data-driven component
- Empty — Contextual empty states with CTA buttons
- Error — Error states with retry functionality
- Offline — Offline notification banner
- Permission Denied — Access restriction messaging
- Validation Errors — Inline form validation with error list
- No Service History — Empty state with booking CTA

## Tech Stack

- React 18
- TypeScript (strict)
- Vite 5+
- Inline CSS styles + CSS custom properties
- Hash-based routing (zero-dependency)
- React Context for state management
- Custom hooks for data fetching (27 hooks)
- Shared component library (`../../../shared/src`)
- lemma-sdk for authentication

## Setup

```bash
npm install
npm run dev    # Starts on port 5187
npm run build  # TypeScript check + production build
npm run preview
```

## Environment Variables

| Variable          | Description                 |
|-------------------|-----------------------------|
| `VITE_LEMMA_TOKEN`| Lemma SDK testing token     |

## Project Structure

```
src/
  App.tsx              — Root shell with theme
  main.tsx             — Entry point with Lemma SDK
  routes/              — Hash routing (30+ routes)
  layouts/             — Responsive app layout
  pages/               — 30 page components
  components/          — 11 core + 7 widgets + 7 forms + 4 dialogs + 4 state components
  hooks/               — 27 custom data hooks
  services/            — Mock API service (50+ methods)
  state/               — React Context for app state
  models/              — DTOs, VMs, request/response types
  contracts/           — Events (12) & permissions (26)
  types/               — Shared type re-exports
```

## State Management

Three layers:
1. **React Context** — customerId, notification count, active filters
2. **Custom hooks** — Each domain has a dedicated hook returning `{ data, loading, error, refetch }`
3. **Local state** — Form inputs, dialog visibility, pagination

## Mock Services

All API calls are currently backed by `customer-service.ts` with realistic mock data. Every method implements the full API contract with simulated network delays.

## Future Integration

- Real API backend
- WebSocket for live technician tracking
- Push notification support
- Document upload for tickets
- Multi-language support
- Offline-first with service workers
