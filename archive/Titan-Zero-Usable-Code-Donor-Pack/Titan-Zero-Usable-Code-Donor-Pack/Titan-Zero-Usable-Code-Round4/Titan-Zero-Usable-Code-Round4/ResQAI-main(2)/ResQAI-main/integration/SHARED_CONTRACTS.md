# ResQAI V2 — Shared Contracts

## Overview

Complete cross-application contract registry. Defines every **event**, **notification**, **search contract**, **filter contract**, **breadcrumb contract**, and **activity timeline contract** that flows between applications.

---

## 1. Cross-Application Event Contracts

### Event Namespace Registry

All cross-app events use dot-notation namespacing to avoid collisions:

```
<domain>:<entity>:<action>
```

| Namespace | Owner | Events |
|---|---|---|
| `ticket.*` | support-center_v2 | 6 events |
| `appointment.*` | appointment-center_v2 | 10 events |
| `operation.*` | operations-center_v2 | 8 events |
| `job.*` | technician-portal_v2 | 11 events |
| `resolution.case.*` | resolution-center_v2 | 12 events |
| `account.health.*` | crm-center_v2 | 2 events |
| `customer.*` | crm-center_v2 | 3 events |
| `feedback.*` | customer-portal_v2 | 1 event |
| `user.*` | admin-center_v2 | 4 events |
| `system.*` | admin-center_v2 | 2 events |
| `analytics:*` | analytics-center_v2 | 7 events |

### Cross-App Event Subscription Contract

Every app MUST subscribe to events from other apps that it depends on (see Dependency Graph). The subscription contract:

```typescript
import { globalEventBus } from '@shared/events';

// Each app in its App initialization:
function registerCrossAppSubscriptions(currentAppId: string) {
  // Subscriptions are keyed by app identity
  // Each handler must check sourceApp to prevent infinite loops

  globalEventBus.on('ticket.created', (payload) => {
    if (payload.sourceApp === currentAppId) return; // skip own events
    handleIncomingTicket(payload.entity);
  });

  globalEventBus.on('appointment.created', (payload) => {
    if (payload.sourceApp === currentAppId) return;
    handleIncomingAppointment(payload.entity);
  });

  // ... one handler per subscribed event
}
```

### Complete Cross-App Event Table

| Event | Emitter | Subscribers | Payload Shape |
|---|---|---|---|
| `ticket.created` | support | ops, crm, customer, analytics, appointment | `{ ticket: TicketDTO }` |
| `ticket.status.changed` | support | ops, crm, customer, analytics | `{ ticketId, previousStatus, newStatus }` |
| `ticket.escalated` | support | ops, resolution, analytics | `{ ticketId, reason, escalatedTo? }` |
| `ticket.reply.drafted` | support | analytics | `{ ticketId, replyBody }` |
| `ticket.reply.approved` | support | analytics | `{ ticketId, replyBody }` |
| `ticket.classified` | support | analytics | `{ ticketId, classifiedType, confidence }` |
| `appointment.created` | appointment | ops, tech, crm, customer, analytics, support | `{ appointmentId, customerId, serviceType, date }` |
| `appointment.assigned` | appointment | ops, tech, analytics | `{ appointmentId, technicianId }` |
| `appointment.status.changed` | appointment | ops, tech, crm, customer, analytics | `{ appointmentId, oldStatus, newStatus }` |
| `appointment.cancelled` | appointment | ops, tech, crm, customer, analytics | `{ appointmentId, reason }` |
| `appointment.completed` | appointment | tech, resolution, crm, analytics | `{ appointmentId, technicianId, notes }` |
| `appointment.rescheduled` | appointment | tech, customer, analytics | `{ appointmentId, oldDate, newDate }` |
| `appointment.no_show` | appointment | crm, analytics | `{ appointmentId, customerId }` |
| `appointment.conflict_detected` | appointment | ops | `{ appointmentId, conflictType }` |
| `appointment.updated` | appointment | all subscribers | `{ appointmentId, updatedFields }` |
| `operation.created` | operations | tech, support, analytics | `{ operation: OperationDTO }` |
| `operation.dispatched` | operations | tech, appointment, analytics | `{ operationId, technicianId }` |
| `operation.assigned` | operations | tech, analytics | `{ operationId, technicianId }` |
| `operation.reassigned` | operations | tech, analytics | `{ operationId, previousTech, newTech }` |
| `operation.status.changed` | operations | tech, customer, analytics | `{ operationId, previousStatus, newStatus }` |
| `operation.escalated` | operations | resolution, analytics | `{ operationId, reason }` |
| `operation.closed` | operations | support, crm, analytics | `{ operationId, resolution }` |
| `operation.conflict.detected` | operations | appointment | `{ operationId, technicianId, conflictOpId }` |
| `job.accepted` | technician | ops, analytics | `{ jobId }` |
| `job.rejected` | technician | ops | `{ jobId, reason? }` |
| `job.status.changed` | technician | ops, appointment, analytics | `{ jobId, previousStatus, newStatus }` |
| `job.paused` | technician | ops, analytics | `{ jobId, reason }` |
| `job.resumed` | technician | ops | `{ jobId }` |
| `job.escalated` | technician | ops, resolution | `{ jobId, reason }` |
| `job.completed` | technician | ops, support, appointment, analytics | `{ jobId, completionNotes }` |
| `job.progress.updated` | technician | ops, customer | `{ jobId, progress }` |
| `notes.added` | technician | resolution, crm | `{ jobId, noteId, category }` |
| `evidence.uploaded` | technician | resolution, crm | `{ jobId, evidenceId, type }` |
| `signature.captured` | technician | resolution | `{ jobId, signatureId }` |
| `parts.used` | technician | ops, analytics | `{ jobId, partIds }` |
| `resolution.case.created` | resolution | support, crm, customer, analytics | `{ case: CaseDTO }` |
| `resolution.case.status.changed` | resolution | support, crm, customer | `{ caseId, previousStatus, newStatus }` |
| `resolution.case.closed` | resolution | support, crm, customer, analytics | `{ caseId, resolution }` |
| `resolution.dispute.created` | resolution | customer, analytics | `{ caseId, disputeId, reason }` |
| `resolution.resolution.created` | resolution | support, analytics | `{ resolution: ResolutionDTO }` |
| `resolution.resolution.approved` | resolution | support, analytics | `{ resolutionId, caseId }` |
| `resolution.resolution.rejected` | resolution | support | `{ resolutionId, caseId, reason }` |
| `resolution.escalation.created` | resolution | ops, support | `{ escalation: EscalationDTO }` |
| `resolution.evidence.uploaded` | resolution | crm | `{ caseId, evidenceId, type }` |
| `account.health.scan.completed` | crm | analytics, admin | `{ scanId, accountsScanned, criticalCount }` |
| `account.health.changed` | crm | support, appointment, ops, tech, resolution, customer, analytics | `{ accountId, oldHealth, newHealth, healthScore }` |
| `customer.updated` | crm | support, appointment, ops, tech, customer | `{ customerId, fields }` |
| `customer.merged` | crm | support, appointment | `{ primaryCustomerId, secondaryCustomerId }` |
| `followup.slippage.detected` | crm | support, analytics | `{ followupId, accountId, daysOverdue }` |
| `retention.alert` | crm | support, analytics | `{ accountId, risk }` |
| `feedback.submitted` | customer | crm, analytics | `{ feedbackId, rating, category }` |
| `user.created` | admin | ALL apps | `{ userId, email, name, role }` |
| `user.role.changed` | admin | ALL apps | `{ userId, previousRole, newRole }` |
| `user.disabled` | admin | ALL apps | `{ userId }` |
| `system.config.changed` | admin | ALL apps | `{ key, newValue }` |
| `feature.flag.changed` | admin | ALL apps | `{ flag, enabled }` |
| `analytics:report.generated` | analytics | ALL apps | `{ reportId, reportName, format }` |
| `analytics:sla.breach` | analytics | support, admin | `{ domain, metric, threshold, actual }` |
| `analytics:insight.ready` | analytics | ALL apps | `{ date, insights, domains }` |
| `analytics:anomaly.detected` | analytics | admin | `{ metric, value, expected, deviation }` |

---

## 2. Cross-Application Notification Contracts

### Notification Source Routing

Each app emits notifications via the shared NotificationState context. The source app field determines routing:

```typescript
interface CrossAppNotification {
  id: string;
  sourceApp: string;          // Which app generated this
  targetApps: string[];       // Which apps should display this ('*' = all)
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  action?: {
    app: string;              // Target app for action
    route: string;            // Target hash route
    label: string;            // Action button label
    context: Record<string, string>;  // Query params
  };
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}
```

### Notification Routing Rules

| Notification Event | Source App | Target Apps | Action Route |
|---|---|---|---|
| New ticket created | support | crm, analytics | `tickets/:id` |
| Ticket escalated | support | operations, resolution | `escalations` |
| Appointment booked | appointment | customer | `appointments/:id` |
| Appointment cancelled | appointment | customer, crm | `appointments/:id` |
| Technician assigned | appointment | technician | `today` |
| Operation dispatched | operations | technician | `jobs/:id` |
| Operation escalated | operations | resolution | `escalations` |
| Job completed | technician | support, appointment | `jobs/:id` |
| Evidence uploaded | technician | resolution | `jobs/:id/evidence` |
| Case created | resolution | support, crm | `cases/:id` |
| Case resolved | resolution | customer, support | `cases/:id` |
| Account health changed | crm | support, ops | `accounts/:id` |
| Followup slippage | crm | support | `followups` |
| SLA breach | analytics | support, admin | `sla` |
| Anomaly detected | analytics | admin | `system-health` |
| User created | admin | ALL | `users/:id` |
| User disabled | admin | ALL | — |

---

## 3. Cross-Application Search Contracts

### Federated Search Protocol

Each app exposes a search handler. The global search bar queries all subscribed apps:

```typescript
interface SearchRequest {
  query: string;
  scope: 'all' | 'tickets' | 'appointments' | 'operations' | 'jobs'
       | 'cases' | 'accounts' | 'customers' | 'users';
  filters?: Record<string, string>;
  requestingApp: string;
  page?: number;
  limit?: number;
}

interface SearchResult {
  appId: string;
  appLabel: string;
  entityType: string;
  entityId: string;
  entityNumber: string;
  title: string;
  subtitle: string;
  status?: string;
  url: string;            // Deep link URL
  matchFields: string[];  // Which fields matched
  score: number;          // Relevance score
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  took: number;           // ms
}
```

### Search Scope Mapping

| Scope | Apps Queried | Entity Types |
|---|---|---|
| `all` | ALL 9 apps | ALL entity types |
| `tickets` | support-center_v2 | TicketDTO |
| `appointments` | appointment-center_v2 | AppointmentDTO |
| `operations` | operations-center_v2 | OperationDTO |
| `jobs` | technician-portal_v2 | JobDTO |
| `cases` | resolution-center_v2 | CaseDTO |
| `accounts` | crm-center_v2 | AccountDTO |
| `customers` | crm-center_v2 | CustomerDTO |
| `users` | admin-center_v2 | UserDTO |

---

## 4. Cross-Application Filter Contracts

### Shared Filter Synchronization

Filters applied in one app can be passed to another app:

```typescript
interface SharedFilterState {
  appId: string;
  filterSet: {
    status?: string[];
    priority?: string[];
    dateRange?: [string, string];
    assignee?: string[];
    region?: string[];
    customerId?: string;
    accountId?: string;
    tags?: string[];
    searchQuery?: string;
  };
  timestamp: number;
}
```

### Filter Inheritance Rules

| Source App → Target App | Inherited Filters | Override Behavior |
|---|---|---|
| support → crm | `customerId`, `accountId` | Filter accounts to matching customer |
| crm → support | `accountId`, `customerId` | Filter tickets to matching customer |
| appointment → support | `customerId`, `ticketId` | Show linked ticket |
| ops → technician | `operationId`, `technicianId` | Filter jobs to operation |
| resolution → support | `ticketId`, `caseId` | Show linked ticket |
| customer → support | `customerId` | Show customer tickets |
| ALL → analytics | ALL | Set dashboard initial filters |

---

## 5. Cross-Application Breadcrumb Contracts

### Breadcrumb Stack Protocol

When navigating across apps, breadcrumbs from the source app are passed to the target app:

```typescript
interface BreadcrumbStack {
  trail: Array<{
    appLabel: string;
    route: string;
    label: string;
    url?: string;           // Deep link back to source
  }>;
  currentApp: string;
}

// Passed via query parameters:
// ?breadcrumbs=[{"appLabel":"Support Center","label":"Ticket #123","url":"../support-center_v2/index.html#/tickets/123"}]
```

### Standard Cross-App Breadcrumb Trails

| Navigation Path | Breadcrumb Trail |
|---|---|
| support → crm | Support Center › Ticket #123 › Customer: Acme Corp |
| support → appointment | Support Center › Ticket #123 › Schedule Appointment |
| appointment → tech portal | Appointment Center › Appointment #456 › Tech John |
| ops → resolution | Operations Center › Operation #789 › Create Case |
| crm → support | CRM Center › Acme Corp › Tickets |
| resolution → support | Resolution Center › Case #101 › Source Ticket |
| customer → support | Customer Portal › My Tickets › Ticket #123 |
| admin → any app | Admin Center › Applications › Support Center |

---

## 6. Cross-Application Activity Timeline Contracts

### Unified Timeline Event

Each app emits timeline events for entities it owns. Other apps consume these to build a unified customer/account timeline:

```typescript
interface TimelineEvent {
  id: string;
  sourceApp: string;
  entityType: 'ticket' | 'appointment' | 'operation' | 'job' | 'case'
              | 'interaction' | 'note' | 'task' | 'feedback' | 'followup';
  entityId: string;
  entityNumber?: string;
  eventType: string;         // e.g. 'created', 'status.changed', 'completed'
  title: string;
  description?: string;
  timestamp: string;
  actorId?: string;
  actorName?: string;
  linkedEntities?: Array<{
    app: string;
    type: string;
    id: string;
    label: string;
  }>;
  actionUrl?: string;        // Deep link
}
```

### Timeline Event Sources

| Source App | Emitted Events | Consumer Apps |
|---|---|---|
| support-center_v2 | ticket.created, ticket.status.changed, ticket.escalated, ticket.reply.* | crm (customer timeline), customer (my activity) |
| appointment-center_v2 | appointment.created, appointment.* | crm (customer timeline), customer (my activity) |
| operations-center_v2 | operation.* | crm (account timeline) |
| technician-portal_v2 | job.*, notes.added, evidence.uploaded | crm (customer timeline), resolution (case timeline) |
| resolution-center_v2 | resolution.case.* | crm (customer timeline), customer (my activity) |
| crm-center_v2 | interaction.created, followup.*, task.*, feedback.* | crm (self, account timeline) |
| customer-portal_v2 | feedback.submitted | crm (customer timeline) |

---

## 7. Cross-Application Permission Contracts

### Permission Namespace Convention

```typescript
// <app_abbreviation>:<action>
// Abbreviations:
//   support, appointment, ops, technician, resolution, crm, analytics, portal, admin

// Each app defines its permissions locally (see SHARED_PERMISSIONS.md)
// Cross-app permission checks use the shared PermissionGuard:
import { PermissionGuard } from '@shared/permissions';

// In any app, checking a permission from another app:
<PermissionGuard permission="support:view_tickets" fallback={<RedirectToApp />}>
  <LinkedTicketPanel />
</PermissionGuard>
```

---

## 8. Contract Versioning

```typescript
interface ContractVersion {
  major: number;
  minor: number;
  patch: number;
}

// Current contract versions:
const CONTRACT_VERSIONS = {
  events:       { major: 2, minor: 0, patch: 0 },
  notifications:{ major: 2, minor: 0, patch: 0 },
  search:       { major: 1, minor: 0, patch: 0 },
  filters:      { major: 1, minor: 0, patch: 0 },
  breadcrumbs:  { major: 1, minor: 0, patch: 0 },
  timeline:     { major: 1, minor: 0, patch: 0 },
  permissions:  { major: 2, minor: 0, patch: 0 },
  navigation:   { major: 1, minor: 0, patch: 0 },
};
```
