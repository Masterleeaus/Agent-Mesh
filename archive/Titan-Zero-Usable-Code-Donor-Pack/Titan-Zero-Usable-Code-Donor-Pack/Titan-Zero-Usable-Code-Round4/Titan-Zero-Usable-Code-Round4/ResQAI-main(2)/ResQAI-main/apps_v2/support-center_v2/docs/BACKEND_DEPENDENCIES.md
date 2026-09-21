# Backend Dependencies

## Required Backend Services

### 1. Tickets API Service

**Purpose:** CRUD operations for support tickets, filtering, search, pagination

**Endpoints Required:**
- `GET /api/v2/tickets` — List with filters, search, pagination
- `GET /api/v2/tickets/:id` — Detail with customer, messages, timeline, related records
- `POST /api/v2/tickets` — Create
- `PATCH /api/v2/tickets/:id` — Update fields
- `POST /api/v2/tickets/:id/draft-reply` — Save draft reply
- `POST /api/v2/tickets/:id/approve-reply` — Approve reply
- `POST /api/v2/tickets/:id/escalate` — Escalate

**Database Table:** `tickets`

**Fields Required (TicketDTO):**
- id, customerId, customerName, subject, message
- requestType, channel, urgency, status
- ownerId, ownerName, draftReply
- classifiedType, classificationConfidence
- escalationReason, escalatedTo
- slaDeadline, createdAt, updatedAt, closedAt

---

### 2. Customers API Service

**Purpose:** Customer lookup and autocomplete for ticket creation

**Endpoints Required:**
- `GET /api/v2/customers/search?query=&limit=` — Search customers

**Database Table:** `customers`

**Fields Required (CustomerDTO):**
- id, name, email, phone, accountId, accountName, createdAt

---

### 3. SLA Metrics API Service

**Purpose:** SLA compliance calculations and agent performance metrics

**Endpoints Required:**
- `GET /api/v2/sla/metrics` — Aggregate SLA metrics

**Database Tables:** `tickets`, `operations_log` (or dedicated SLA tracking table)

**Required Computations:**
- Overall compliance percentage
- Breach count and total ticket count
- Average response time by channel (seconds)
- Per-agent compliance metrics

---

### 4. Templates API Service

**Purpose:** CRUD for reusable reply templates

**Endpoints Required:**
- `GET /api/v2/templates` — List all
- `POST /api/v2/templates` — Create
- `PATCH /api/v2/templates/:id` — Update
- `DELETE /api/v2/templates/:id` — Delete

**Database Table:** `templates`

**Fields Required (TemplateDTO):**
- id, name, body, category, createdAt, updatedAt

---

### 5. Agents API Service

**Purpose:** Agent list for assignment dropdowns

**Endpoints Required:**
- `GET /api/v2/agents` — List support agents

**Database Table:** `agents` or user directory

**Fields Required:**
- id, name, isOnline, role

---

## Future AI Agent Integration Points

| Agent Name | Trigger | Input | Output |
|-----------|---------|-------|--------|
| `request-classifier` | On ticket creation | `{ ticketId, subject, message }` | `{ requestType, urgency, suggestedOwner, confidence }` |
| `support-reply-drafter` | Manual trigger or auto-suggest | `{ ticketId, conversationHistory }` | `{ draftReply, confidence }` |
| `sentiment-analyzer` | On message received | `{ message, customerId }` | `{ sentiment, urgency, needsEscalation }` |
| `auto-tagger` | On status change | `{ ticketId, status }` | `{ tags: string[] }` |

## Future Function Call Points

| Function | Purpose |
|----------|---------|
| `escalate_ticket` | Escalate ticket and notify team lead/manager |
| `send_reply_via_connector` | Send approved reply via email/social/chat connector |
| `notify_sla_breach` | Trigger notification workflow when SLA is breached |
| `generate_ticket_report` | Generate PDF/CSV report for a ticket or queue |

## Future Event Points

| Event Name | Emitted When | Payload |
|-----------|-------------|---------|
| `ticket.created` | New ticket created | `{ ticket: TicketDTO }` |
| `ticket.classified` | AI classification complete | `{ ticketId, classifiedType, confidence }` |
| `ticket.reply.drafted` | Draft reply saved | `{ ticketId, replyBody }` |
| `ticket.reply.approved` | Reply approved for sending | `{ ticketId, replyBody }` |
| `ticket.status.changed` | Ticket status updated | `{ ticketId, previousStatus, newStatus }` |
| `ticket.escalated` | Ticket escalated | `{ ticketId, reason, escalatedTo }` |
| `ticket.assigned` | Owner assigned/changed | `{ ticketId, previousOwnerId, newOwnerId }` |
| `sla.breached` | SLA deadline passed | `{ ticketId, deadline, ownerId }` |

## Infrastructure Dependencies

| Service | Purpose |
|---------|---------|
| Lemma SDK (Auth) | User authentication and session management |
| Lemma SDK (DataStore) | CRUD operations on all database tables |
| Lemma SDK (Functions) | Execute platform functions |
| Lemma SDK (Agents) | Invoke AI agents |
| Lemma SDK (Connectors) | Send replies via email/social channels |
| EventBus (shared) | Cross-application event publishing/subscription |

## Current Mock Implementation

All backend dependencies are currently mocked in `src/services/ticket-service.ts` using in-memory data from `src/services/mock-data.ts`. The mocking strategy:

| Method | Mock Behavior |
|--------|--------------|
| `list()` | Filters in-memory `mockTickets`, paginates |
| `getById()` | Looks up in `mockTickets`, returns with customer/messages/timeline |
| `create()` | Prepends to `mockTickets` array |
| `update()` | Mutates ticket in-place |
| `draftReply()` | Sets `draftReply` field |
| `approveReply()` | Sets `draftReply` field |
| `escalate()` | Sets status, reason, escalatedTo |
| `searchCustomers()` | Filters `mockCustomers` by name/email |
| `getSLAMetrics()` | Returns `mockSLAMetrics` |
| CRUD templates | Mutates `mockTemplates` array |

## Integration Checklist

- [ ] Replace `ticketService` implementation with HTTP client calls
- [ ] Wire Lemma SDK auth for protected endpoints
- [ ] Implement real pagination from backend
- [ ] Add real-time updates via WebSocket or polling
- [ ] Connect AI agents for classification and drafting
- [ ] Wire event bus for cross-app communication
- [ ] Add proper error handling with `ApiError` contract
- [ ] Implement request retry and offline support
- [ ] Add request caching for frequently accessed data
