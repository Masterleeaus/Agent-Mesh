# ResQAI V2 — Shared Models (DTOs & ViewModels)

## Overview

Complete catalog of models that flow across application boundaries. Defines every DTO, ViewModel, and shared type that participates in cross-application communication.

---

## 1. Core Domain Models (Cross-App Entities)

### TicketDTO (support-center_v2 → ALL consumers)

```typescript
// Originates in support-center_v2
// Consumed by: operations, resolution, crm, customer-portal, analytics, technician
interface TicketDTO {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  category: string;
  customerId: string;
  customerName: string;
  assignedTo?: string;
  assignedToName?: string;
  source: 'phone' | 'email' | 'portal' | 'chat' | 'internal';
  createdAt: string;
  updatedAt: string;
  slaBreachAt?: string;
  escalatedAt?: string;
  linkedAppointmentId?: string;
  linkedOperationId?: string;
  linkedCaseId?: string;
  tags: string[];
}
```

### AppointmentDTO (appointment-center_v2 → ALL consumers)

```typescript
// Originates in appointment-center_v2
// Consumed by: support, operations, technician, customer-portal, crm, resolution, analytics
interface AppointmentDTO {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceType: string;
  serviceDescription: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  date: string;
  timeSlot: string;
  duration: number;
  technicianId?: string;
  technicianName?: string;
  linkedTicketId?: string;
  linkedOperationId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### OperationDTO (operations-center_v2 → ALL consumers)

```typescript
// Originates in operations-center_v2
// Consumed by: support, appointment, technician, resolution, customer-portal, analytics
interface OperationDTO {
  id: string;
  type: 'dispatch' | 'assignment' | 'escalation' | 'scheduled';
  status: 'pending' | 'dispatched' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  region?: string;
  technicianId?: string;
  technicianName?: string;
  linkedTicketId?: string;
  linkedAppointmentId?: string;
  linkedCaseId?: string;
  customerId?: string;
  customerName?: string;
  scheduledDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### JobDTO (technician-portal_v2 → ALL consumers)

```typescript
// Originates in technician-portal_v2 (mirrors OperationDTO from tech perspective)
// Consumed by: operations, appointment, resolution, crm, analytics
interface JobDTO {
  id: string;
  operationId: string;
  appointmentId?: string;
  ticketId?: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  serviceType: string;
  status: 'assigned' | 'en_route' | 'on_site' | 'in_progress' | 'paused' | 'completed' | 'cancelled' | 'escalated';
  progress: number;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: number;
  checkedInAt?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  checklistCompleted: boolean;
}
```

### CaseDTO (resolution-center_v2 → ALL consumers)

```typescript
// Originates in resolution-center_v2
// Consumed by: support, crm, customer-portal, analytics, operations
interface CaseDTO {
  id: string;
  caseNumber: string;
  type: 'dispute' | 'complaint' | 'escalation' | 'investigation';
  status: 'open' | 'investigating' | 'pending_approval' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  subject: string;
  description: string;
  customerId: string;
  customerName: string;
  linkedTicketId?: string;
  linkedAppointmentId?: string;
  linkedOperationId?: string;
  assignedTo?: string;
  assignedToName?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}
```

### AccountDTO (crm-center_v2 → ALL consumers)

```typescript
// Originates in crm-center_v2
// Consumed by: support, appointment, operations, technician, resolution, customer-portal, analytics
interface AccountDTO {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  health: 'healthy' | 'at_risk' | 'slipping' | 'critical';
  healthScore: number;
  customerId: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  address: string;
  openTickets: number;
  upcomingAppointments: number;
  lastInteractionDate?: string;
  lifetimeValue: number;
  contractEndDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

### CustomerDTO (crm-center_v2 → ALL consumers)

```typescript
// Originates in crm-center_v2
// Consumed by: support, appointment, operations, technician, resolution, customer-portal
interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  accountId: string;
  accountName: string;
  type: 'primary' | 'secondary' | 'contact';
  preferredContact: 'email' | 'phone' | 'sms';
  language: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Cross-App Reference Models (Lightweight)

### CrossAppEntityRef

```typescript
// Used when one app needs to reference an entity in another app without full hydration
interface CrossAppEntityRef {
  sourceApp: string;            // e.g. 'support-center_v2'
  entityType: string;           // e.g. 'ticket'
  entityId: string;
  entityNumber?: string;        // e.g. 'TKT-12345'
  label?: string;               // e.g. 'Printer not working'
  status?: string;              // e.g. 'open'
  url?: string;                 // Deep link URL
}
```

### CrossAppLink

```typescript
// Used in activity timeline, notifications, and breadcrumbs
interface CrossAppLink {
  appId: string;                // target app
  route: string;                // target hash route
  label: string;                // display label
  context: Record<string, string>;  // query params
}
```

---

## 3. Shared Notification Model

```typescript
// Originates in shared/src/state/NotificationState.tsx
// Consumed by: ALL apps for cross-app notification display
interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  sourceApp: string;            // Which app generated this
  actionUrl?: string;           // Deep link URL for the action
  read: boolean;
  createdAt: string;
}
```

---

## 4. Event Payload Models

See `shared/src/events/` for full type definitions. Cross-app event payloads:

```typescript
// Cross-app event payload (generic wrapper)
interface CrossAppEventPayload<T = unknown> {
  sourceApp: string;
  sourceRoute?: string;
  timestamp: string;
  userContext: {
    userId: string;
    userName: string;
    role: string;
  };
  entity: T;
}

// Wrapper for any event emitted across app boundaries
function wrapCrossAppEvent<T>(
  sourceApp: string,
  entity: T,
  userContext: { userId: string; userName: string; role: string }
): CrossAppEventPayload<T> {
  return {
    sourceApp,
    timestamp: new Date().toISOString(),
    userContext,
    entity,
  };
}
```

---

## 5. Shared Filter Model

```typescript
// Used when filters are synchronized across apps
interface CrossAppFilter {
  appId: string;
  filterId: string;
  params: Record<string, string | string[] | [string, string]>;
  timestamp: number;
}

interface CrossAppSearchQuery {
  query: string;
  scope: 'all' | 'tickets' | 'appointments' | 'operations' | 'accounts' | 'cases' | 'users';
  filters?: Record<string, string>;
  requestingApp: string;
  resultLimit?: number;
}
```

---

## 6. Shared Breadcrumb Model

```typescript
interface CrossAppBreadcrumb {
  appId: string;
  appLabel: string;
  route: string;
  label: string;
  entityId?: string;
}
```

---

## 7. Model Ownership Matrix

| Model | Owner | Consumers | Wire Format |
|---|---|---|---|
| TicketDTO | support-center_v2 | 7 apps | EventBus payload + Deep Link ref |
| AppointmentDTO | appointment-center_v2 | 7 apps | EventBus payload + Deep Link ref |
| OperationDTO | operations-center_v2 | 6 apps | EventBus payload + Deep Link ref |
| JobDTO | technician-portal_v2 | 4 apps | EventBus payload |
| CaseDTO | resolution-center_v2 | 5 apps | EventBus payload + Deep Link ref |
| AccountDTO | crm-center_v2 | 6 apps | EventBus payload + Deep Link ref |
| CustomerDTO | crm-center_v2 | 7 apps | EventBus payload + Deep Link ref |
| NotificationItem | shared/state | ALL apps | Shared React Context |
| CrossAppEntityRef | shared/integration | ALL apps | URL query params |
| CrossAppEventPayload | shared/events | ALL apps | EventBus |
