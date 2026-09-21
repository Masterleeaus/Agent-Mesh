# API Contracts

## Future Backend API Endpoints

The following endpoints define the future backend integration contracts. All data shapes are defined in `src/models/`.

---

### Tickets

#### `GET /api/v2/tickets`

List tickets with filtering, search, and pagination.

**Request Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | `TicketStatus[]` | Filter by status |
| `urgency` | `Urgency[]` | Filter by urgency |
| `requestType` | `RequestType[]` | Filter by type |
| `channel` | `Channel[]` | Filter by channel |
| `ownerId` | `string` | Filter by owner |
| `search` | `string` | Full-text search on subject/customer/message |
| `isEscalated` | `boolean` | Filter escalated only |
| `page` | `number` | Page number (1-indexed) |
| `pageSize` | `number` | Items per page (default 25) |

**Response:** `TicketListResponse`

```typescript
{
  data: TicketDTO[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

#### `GET /api/v2/tickets/:id`

Get full ticket detail with customer, messages, timeline, and related records.

**Response:** `TicketDetailResponse`

```typescript
{
  ticket: TicketDTO;
  customer: CustomerDTO;
  messages: MessageDTO[];
  timeline: TimelineEventDTO[];
  relatedAppointments: unknown[];
  relatedDisputes: unknown[];
}
```

---

#### `POST /api/v2/tickets`

Create a new support ticket.

**Request Body:** `CreateTicketRequest`

```typescript
{
  customerId: string;
  subject: string;
  message: string;
  requestType: RequestType;
  channel: Channel;
  urgency: Urgency;
  phone?: string;
  email?: string;
}
```

**Response:** `TicketDTO`

---

#### `PATCH /api/v2/tickets/:id`

Update ticket fields (status, urgency, owner, etc.).

**Request Body:** `UpdateTicketRequest`

```typescript
{
  subject?: string;
  requestType?: RequestType;
  urgency?: Urgency;
  status?: TicketStatus;
  ownerId?: string;
}
```

**Response:** `TicketDTO`

---

#### `POST /api/v2/tickets/:id/draft-reply`

Save or update a draft reply on a ticket.

**Request Body:** `DraftReplyRequest`

```typescript
{
  body: string;
}
```

**Response:** `void`

---

#### `POST /api/v2/tickets/:id/approve-reply`

Approve a draft reply for sending.

**Request Body:** `ApproveReplyRequest`

```typescript
{
  replyId: string;
  body: string;
}
```

**Response:** `void`

---

#### `POST /api/v2/tickets/:id/escalate`

Escalate a ticket with reason and optional target.

**Request Body:** `EscalateTicketRequest`

```typescript
{
  reason: string;
  escalateTo?: string;
}
```

**Response:** `void`

---

### Customers

#### `GET /api/v2/customers/search`

Search customers by name or email.

**Request Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | `string` | Search query |
| `limit` | `number` | Max results (default 10) |

**Response:** `CustomerSearchResponse`

```typescript
{
  data: CustomerDTO[];
  total: number;
}
```

---

### SLA Metrics

#### `GET /api/v2/sla/metrics`

Get SLA compliance metrics.

**Response:** `SLAMetricsResponse`

```typescript
{
  compliancePercent: number;
  breached: number;
  total: number;
  avgResponseTimeByChannel: Record<string, number>;
  byAgent: AgentSLAMetricVM[];
}
```

---

### Templates

#### `GET /api/v2/templates`

List all reply templates.

**Response:** `TemplateListResponse`

```typescript
{
  data: TemplateDTO[];
  total: number;
}
```

---

#### `POST /api/v2/templates`

Create a new reply template.

**Request Body:**

```typescript
{
  name: string;
  body: string;
  category: string;
}
```

**Response:** `void`

---

#### `PATCH /api/v2/templates/:id`

Update an existing template.

**Request Body:**

```typescript
{
  name?: string;
  body?: string;
  category?: string;
}
```

**Response:** `void`

---

#### `DELETE /api/v2/templates/:id`

Delete a template.

**Response:** `void`

---

### Agents

#### `GET /api/v2/agents`

List available support agents for assignment.

**Response:**

```typescript
{
  data: { id: string; name: string; isOnline: boolean }[];
}
```

---

## Data Models

### Core DTOs (`src/models/dto.ts`)

```typescript
interface TicketDTO {
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  message: string;
  requestType: RequestType;
  channel: Channel;
  urgency: Urgency;
  status: TicketStatus;
  ownerId?: string;
  ownerName?: string;
  draftReply?: string;
  classifiedType?: string;
  classificationConfidence?: number;
  escalationReason?: string;
  escalatedTo?: string;
  slaDeadline?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  accountId?: string;
  accountName?: string;
  createdAt: string;
}

interface AgentDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  isOnline: boolean;
}

interface TemplateDTO {
  id: string;
  name: string;
  body: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageDTO {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: 'customer' | 'agent' | 'system';
  body: string;
  createdAt: string;
}

interface TimelineEventDTO {
  id: string;
  ticketId: string;
  type: string;
  description: string;
  actorName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

### Enums

```typescript
type RequestType = 'question' | 'problem' | 'feature_request' | 'billing' | 'other';
type Channel = 'phone' | 'email' | 'chat' | 'portal' | 'social';
type Urgency = 'low' | 'normal' | 'high' | 'critical';
type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed' | 'escalated';
```

### Error Contract

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
```

## Future Workflow Trigger Points

| UI Action | Workflow / Function | Trigger |
|-----------|--------------------|---------|
| Create ticket | `ticket.created` event → auto-classification agent | `POST /api/v2/tickets` |
| Edit reply draft | `ticket.reply.drafted` event | `POST /api/v2/tickets/:id/draft-reply` |
| Approve reply | `ticket.reply.approved` event → send email via connector | `POST /api/v2/tickets/:id/approve-reply` |
| Escalate ticket | `ticket.escalated` event → notify team lead | `POST /api/v2/tickets/:id/escalate` |
| Status change | `ticket.status.changed` event → update related records | `PATCH /api/v2/tickets/:id` |
| SLA breach | `sla.breached` event → notify assignee | Background check |
