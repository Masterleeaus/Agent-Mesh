# ResQAI V2 — Application Communication Matrix

## Overview

Defines the complete inter-application communication contracts. Every cell specifies the **communication channel**, **protocol**, **data shape**, and **direction** for each application pair.

---

## Communication Channels

| Channel | Mechanism | Scope |
|---|---|---|
| **EventBus** | `globalEventBus.emit()` / `.on()` via `shared/src/events/EventBus.ts` | Cross-app pub/sub |
| **Shared State** | React Context via `shared/src/state/` | Shared auth, global, notification state |
| **URL Query String** | `window.location.search` parameters | Cross-app deep-link navigation |
| **Hash-based Deep Link** | `window.location.hash` convention | Explicit app-to-app navigation |
| **LocalStorage** | `window.localStorage` key-value bridge | Cross-app offline data sharing |
| **Window.postMessage** | `window.postMessage()` / `message` event | Cross-origin iframe communication |

---

## Communication Matrix

### support-center_v2 ↔ All

| Partner | Outbound | Inbound | Channel |
|---|---|---|---|
| **appointment-center_v2** | `ticket.created` → subscribe to `appointment.*` | `appointment.created` → navigate to appointment detail | EventBus + Deep Link |
| **operations-center_v2** | `ticket.escalated` → trigger dispatch | `operation.dispatched` → update ticket status | EventBus |
| **technician-portal_v2** | `ticket.assigned` → assign technician | `job.completed` → mark ticket resolved | EventBus |
| **resolution-center_v2** | `ticket.escalated` → create case | `resolution.case.created` → link case to ticket | EventBus |
| **crm-center_v2** | `ticket.created` → log interaction | `account.health.changed` → flag ticket | EventBus |
| **analytics-center_v2** | All `ticket.*` events → stream | SLA metrics ← query | EventBus + Shared State |
| **customer-portal_v2** | `ticket.*` → customer feed | `ticket.created.customer` → new ticket from portal | EventBus |
| **admin-center_v2** | User assignments → confirm | `user.created` → refresh assignment list | EventBus + Shared State |

### appointment-center_v2 ↔ All

| Partner | Outbound | Inbound | Channel |
|---|---|---|---|
| **support-center_v2** | `appointment.*` → subscription | `ticket.created` → suggest appointment booking | EventBus |
| **operations-center_v2** | `appointment.assigned` → dispatch queue | `operation.created` → coordinate schedule | EventBus |
| **technician-portal_v2** | `appointment.created` → tech schedule | `job.status.changed` → update appointment | EventBus + Deep Link |
| **resolution-center_v2** | `appointment.completed` → evidence | `resolution.case.created` → flag appointment | EventBus |
| **crm-center_v2** | `appointment.*` → timeline | `account.health.changed` → priority scheduling | EventBus |
| **analytics-center_v2** | All `appointment.*` events → stream | Metrics ← query | EventBus + Shared State |
| **customer-portal_v2** | `appointment.*` → customer view | `appointment.requested` → new booking request | EventBus |
| **admin-center_v2** | Schedule settings → config | `system.config.changed` → refresh settings | EventBus |

### operations-center_v2 ↔ All

| Partner | Outbound | Inbound | Channel |
|---|---|---|---|
| **support-center_v2** | `operation.dispatched` → ticket update | `ticket.escalated` → create dispatch | EventBus |
| **appointment-center_v2** | `operation.created` → schedule sync | `appointment.assigned` → dispatch queue | EventBus |
| **technician-portal_v2** | `operation.assigned` → job push | `job.accepted` → update dispatch status | EventBus |
| **resolution-center_v2** | `operation.escalated` → create case | `resolution.case.created` → flag operation | EventBus |
| **crm-center_v2** | `operation.closed` → interaction log | `account.health.changed` → priority dispatch | EventBus |
| **analytics-center_v2** | All `operation.*` events → stream | Metrics ← query | EventBus + Shared State |
| **customer-portal_v2** | `operation.status.*` → live tracking | `appointment.*` → coordination | EventBus |
| **admin-center_v2** | Dispatch config → settings | `user.*` → operator roster | EventBus |

### technician-portal_v2 ↔ All

| Partner | Outbound | Inbound | Channel |
|---|---|---|---|
| **support-center_v2** | `job.completed` → ticket resolution | `ticket.assigned` → job creation | EventBus |
| **appointment-center_v2** | `job.accepted` → confirm appointment | `appointment.assigned` → daily schedule | EventBus |
| **operations-center_v2** | `job.status.*` → live ops board | `operation.assigned` → job inbox | EventBus |
| **resolution-center_v2** | `evidence.uploaded` → case evidence | `resolution.case.created` → report request | EventBus |
| **crm-center_v2** | `notes.added` → interaction history | `account.health.changed` → flag job | EventBus |
| **analytics-center_v2** | `job.completed` → performance data | Metrics ← query | EventBus |
| **customer-portal_v2** | `gps.status.changed` → live tracking | `customer.updated` → refresh contact | EventBus + Deep Link |
| **admin-center_v2** | Profile updates → confirmation | `user.role.changed` → permission refresh | EventBus + Shared State |

### resolution-center_v2 ↔ All

| Partner | Outbound | Inbound | Channel |
|---|---|---|---|
| **support-center_v2** | `resolution.case.*` → ticket case link | `ticket.escalated` → case trigger | EventBus |
| **appointment-center_v2** | `resolution.case.created` → appointment hold | `appointment.completed` → case evidence | EventBus |
| **operations-center_v2** | `resolution.escalation.created` → op context | `operation.escalated` → case trigger | EventBus |
| **technician-portal_v2** | `resolution.case.created` → report request | `evidence.uploaded` → case evidence | EventBus |
| **crm-center_v2** | `resolution.case.closed` → customer history | `account.health.changed` → case priority | EventBus |
| **analytics-center_v2** | All `resolution.*` events → stream | Metrics ← query | EventBus + Shared State |
| **customer-portal_v2** | `resolution.case.*` → dispute view | `feedback.submitted` → case sentiment | EventBus |
| **admin-center_v2** | Case approvals → confirm | `user.*` → approver roster | EventBus |

### crm-center_v2 ↔ All

| Partner | Outbound | Inbound | Channel |
|---|---|---|---|
| **support-center_v2** | `account.health.changed` → ticket flag | `ticket.*` → timeline | EventBus |
| **appointment-center_v2** | `account.health.changed` → priority | `appointment.*` → timeline | EventBus |
| **operations-center_v2** | `customer.updated` → dispatch update | `operation.*` → timeline | EventBus |
| **technician-portal_v2** | `customer.updated` → tech refresh | `notes.*`, `evidence.*` → timeline | EventBus |
| **resolution-center_v2** | `account.health.*` → case context | `resolution.case.*` → timeline | EventBus |
| **analytics-center_v2** | `account.health.*` → CRM metrics | Metrics ← query | EventBus + Shared State |
| **customer-portal_v2** | `account.health.*` → health dashboard | `feedback.submitted` → satisfaction data | EventBus |
| **admin-center_v2** | Account config → settings | `user.*` → account team roster | EventBus |

### analytics-center_v2 ↔ All

| Partner | Outbound | Inbound | Channel |
|---|---|---|---|
| **support-center_v2** | Metrics → SLA dashboard | All `ticket.*` events | Shared State + EventBus |
| **appointment-center_v2** | Metrics → schedule optimization | All `appointment.*` events | Shared State + EventBus |
| **operations-center_v2** | Metrics → ops dashboard | All `operation.*` events | Shared State + EventBus |
| **technician-portal_v2** | Performance metrics → tech scorecard | All `job.*` events | Shared State + EventBus |
| **resolution-center_v2** | Metrics → resolution dashboard | All `resolution.*` events | Shared State + EventBus |
| **crm-center_v2** | Metrics → health trends | All `account.health.*` events | Shared State + EventBus |
| **customer-portal_v2** | Insights → customer dashboard | `feedback.*`, satisfaction data | Shared State + EventBus |
| **admin-center_v2** | Platform metrics → admin monitoring | `system.config.*`, `user.*` events | Shared State + EventBus |

### customer-portal_v2 ↔ All

| Partner | Outbound | Inbound | Channel |
|---|---|---|---|
| **support-center_v2** | `ticket.created.customer` → intake | `ticket.*` → my tickets | EventBus |
| **appointment-center_v2** | `appointment.requested` → booking | `appointment.*` → my appointments | EventBus |
| **operations-center_v2** | `appointment.*` → live tracking | `operation.status.*` → tech tracking | EventBus |
| **technician-portal_v2** | - (read-only) | TechnicianDTO, GPS → live tracking | Shared State |
| **resolution-center_v2** | - (dispute initiation) | `resolution.case.*` → my disputes | EventBus |
| **crm-center_v2** | `feedback.submitted` → satisfaction | `account.health.*` → health dashboard | EventBus + Deep Link |
| **analytics-center_v2** | `feedback.submitted` → insights | Metrics → dashboard | EventBus |
| **admin-center_v2** | Notification preferences | Notifications → customer inbox | Shared State + EventBus |

### admin-center_v2 ↔ All

| Partner | Outbound | Inbound | Channel |
|---|---|---|---|
| **ALL apps** | `user.*` → auth/roster refresh | App status → admin dashboard | EventBus + Shared State |
| **ALL apps** | `system.config.changed` → settings refresh | Config requests → settings | EventBus |
| **ALL apps** | `feature.flag.*` → feature gating | Feature status → admin controls | Shared State |
| **ALL apps** | Permission updates → access control | Permission checks → RBAC | Shared State |

---

## Event Subscription Map

```
                          ┌─────────────────────────────────────────────────────────────┐
                          │                    globalEventBus                           │
                          └──┬──────────┬──────────┬──────────┬──────────┬──────────────┘
                             │          │          │          │          │
         ┌───────────────────┼──────────┼──────────┼──────────┼──────────┼──────────────┐
         │  support-center   │  appointment  │  operations  │  resolution   │  crm-center  │
         │                   │               │               │               │              │
SUBSCRIBES TO:              │               │               │               │
 ticket.* events (self)    │               │               │               │
 appointment.* events      │               │               │               │
 operation.* events        │               │               │               │
 resolution.case.*         │               │               │               │
 account.health.*          │               │               │               │
 user.*                    │               │               │               │
 system.config.changed     │               │               │               │
         └───────────────────┴───────────────┴───────────────┴───────────────┴──────────────┘

EMITTER APPS:
  support-center  ──▶ ticket.*
  appointment     ──▶ appointment.*
  operations      ──▶ operation.*
  technician      ──▶ job.*, evidence.*, notes.*
  resolution      ──▶ resolution.case.*, resolution.dispute.*
  crm             ──▶ account.health.*, customer.*, feedback.*
  customer        ──▶ feedback.submitted, appointment.requested, ticket.created.customer
  admin           ──▶ user.*, system.config.*, feature.flag.*
  analytics       ──▶ analytics:report.generated, analytics:sla.breach, analytics:insight.ready
```

---

## Deep Link Navigation Contracts

When navigating from one app to another, the following query-string contracts are used:

| Source App | Target App | Route Pattern | Query Parameters |
|---|---|---|---|
| support-center | customer-portal | `#/tickets/:id` | `?source=support&ticketId={id}` |
| support-center | appointment-center | `#/appointments/:id` | `?source=support&ticketId={id}` |
| support-center | crm-center | `#/accounts/:id` | `?source=support&ticketId={id}` |
| appointment-center | technician-portal | `#/jobs/:id` | `?source=appointment&appointmentId={id}` |
| appointment-center | customer-portal | `#/appointments/:id` | `?source=appointment&appointmentId={id}` |
| operations-center | technician-portal | `#/jobs/:id` | `?source=operations&operationId={id}` |
| operations-center | support-center | `#/tickets/:id` | `?source=operations&operationId={id}` |
| operations-center | appointment-center | `#/appointments/:id` | `?source=operations&operationId={id}` |
| resolution-center | support-center | `#/tickets/:id` | `?source=resolution&caseId={id}` |
| resolution-center | technician-portal | `#/jobs/:id/notes` | `?source=resolution&caseId={id}` |
| resolution-center | crm-center | `#/accounts/:id` | `?source=resolution&caseId={id}` |
| crm-center | support-center | `#/tickets/:id` | `?source=crm&accountId={id}` |
| crm-center | appointment-center | `#/appointments/:id` | `?source=crm&accountId={id}` |
| customer-portal | support-center | `#/tickets/:id` | `?source=portal&customerId={id}` |
| admin-center | any app | `#/users/:id` | `?source=admin&context={app}` |
| ALL apps | analytics-center | `#/reports/:id` | `?source={app}&contextId={id}` |
