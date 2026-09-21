# ResQAI V2 — Application Dependency Graph

## Overview

Complete application-to-application dependency graph for all 9 V2 micro-frontend applications. Each entry defines:

- **Outgoing Dependencies** — data/services this app consumes from other apps
- **Incoming Dependencies** — data/services other apps consume from this app
- **Dependency Type** — `hard` (required for operation), `soft` (enhancement), `event` (pub/sub)
- **Consumed Entities** — specific models/shapes consumed

---

## Dependency Legend

```
┌────────────────────────────────────────────────────────────┐
│  Hard ─── App cannot function without this dependency      │
│  Soft ─── App degrades gracefully without this dependency  │
│  Event ── App reacts to events but does not require them   │
│  arrow direction: consumer ──▶ provider                     │
└────────────────────────────────────────────────────────────┘
```

---

## 1. support-center_v2

### Outgoing Dependencies

| Depends On | Type | Consumed Entities | Purpose |
|---|---|---|---|
| crm-center_v2 | Soft | CustomerDTO, AccountDTO | Customer context on ticket detail |
| crm-center_v2 | Event | account.health.changed | Flag tickets for accounts in distress |
| appointment-center_v2 | Soft | AppointmentDTO | Link ticket to appointment context |
| technician-portal_v2 | Soft | TechnicianDTO | Show assigned tech on ticket |
| resolution-center_v2 | Event | resolution.case.created, resolution.case.closed | Track resolution status on linked tickets |
| analytics-center_v2 | Soft | Metrics | SLA dashboard shared metrics |
| admin-center_v2 | Soft | UserDTO, RoleDTO | Agent assignment resolution |

### Incoming Dependencies

| Provides To | Type | Provided Entities | Purpose |
|---|---|---|---|
| operations-center_v2 | Hard | TicketDTO, ticket.* events | Dispatch from ticket escalation |
| resolution-center_v2 | Hard | TicketDTO, ticket.* events | Case creation from ticket disputes |
| crm-center_v2 | Event | ticket.created, ticket.status.changed | Customer activity timeline |
| customer-portal_v2 | Hard | TicketDTO (read), ticket.* events | Customer ticket self-service view |
| analytics-center_v2 | Event | ticket.created, ticket.escalated | Support analytics metrics |
| technician-portal_v2 | Soft | TicketDTO | Job detail references ticket info |
| appointment-center_v2 | Event | ticket.created, ticket.status.changed | Appointment scheduling context |

---

## 2. appointment-center_v2

### Outgoing Dependencies

| Depends On | Type | Consumed Entities | Purpose |
|---|---|---|---|
| crm-center_v2 | Soft | CustomerDTO, AccountDTO | Customer details on appointment |
| technician-portal_v2 | Soft | TechnicianDTO, availability | Technician scheduling & assignment |
| support-center_v2 | Event | ticket.created | Trigger appointment scheduling from ticket |
| operations-center_v2 | Event | operation.dispatched | Coordinate appointment with dispatch |
| admin-center_v2 | Soft | UserDTO | Assignment tracking |
| customer-portal_v2 | Hard | CustomerPortalEvents | Customer booking, reschedule, cancel events |

### Incoming Dependencies

| Provides To | Type | Provided Entities | Purpose |
|---|---|---|---|
| operations-center_v2 | Hard | AppointmentDTO | Dispatch scheduling from appointments |
| customer-portal_v2 | Hard | AppointmentDTO | Customer appointment self-service |
| technician-portal_v2 | Hard | AppointmentDTO | Tech job schedule & details |
| analytics-center_v2 | Event | appointment.created, appointment.completed | Appointment analytics |
| support-center_v2 | Soft | AppointmentDTO | Link ticket with appointment |
| crm-center_v2 | Event | appointment.created, appointment.status.changed | Customer timeline |
| resolution-center_v2 | Soft | AppointmentDTO | Case evidence context |

---

## 3. operations-center_v2

### Outgoing Dependencies

| Depends On | Type | Consumed Entities | Purpose |
|---|---|---|---|
| support-center_v2 | Hard | TicketDTO | Dispatch creation from tickets |
| appointment-center_v2 | Hard | AppointmentDTO | Operations scheduling |
| technician-portal_v2 | Hard | TechnicianDTO | Technician assignment & monitoring |
| resolution-center_v2 | Event | resolution.case.created | Escalation case context |
| crm-center_v2 | Soft | CustomerDTO | Customer context in dispatch |
| admin-center_v2 | Soft | UserDTO | Operator assignment |
| customer-portal_v2 | Event | appointment.* | Real-time status for customer tracking |

### Incoming Dependencies

| Provides To | Type | Provided Entities | Purpose |
|---|---|---|---|
| technician-portal_v2 | Hard | OperationDTO, job.* events | Tech job queue & execution |
| resolution-center_v2 | Hard | OperationDTO, technician reports | Case investigation |
| analytics-center_v2 | Event | operation.dispatched, operation.closed | Operations analytics |
| support-center_v2 | Soft | OperationDTO | Ticket dispatch linkage |
| customer-portal_v2 | Soft | OperationDTO (status) | Live technician tracking |
| appointment-center_v2 | Event | operation.dispatched | Coordination with appointments |

---

## 4. technician-portal_v2

### Outgoing Dependencies

| Depends On | Type | Consumed Entities | Purpose |
|---|---|---|---|
| operations-center_v2 | Hard | OperationDTO, job.* events | Job queue & assignment |
| appointment-center_v2 | Hard | AppointmentDTO, technician schedule | Daily schedule |
| support-center_v2 | Soft | TicketDTO | Job ticket information |
| crm-center_v2 | Soft | CustomerDTO, ContactDTO | Customer details on job |
| resolution-center_v2 | Event | resolution.case.created | Input to case investigation |
| admin-center_v2 | Soft | UserDTO | Profile & permissions |
| customer-portal_v2 | Event | appointment.* | Customer-requested changes |

### Incoming Dependencies

| Provides To | Type | Provided Entities | Purpose |
|---|---|---|---|
| operations-center_v2 | Hard | TechnicianDTO, technician.status.changed | Live tech monitoring & dispatch |
| appointment-center_v2 | Hard | TechnicianDTO, availability | Technician scheduling |
| support-center_v2 | Soft | TechnicianDTO | Ticket assignment |
| resolution-center_v2 | Hard | TechnicianReportDTO, evidence | Case evidence & reports |
| analytics-center_v2 | Event | job.completed, evidence.uploaded | Technician performance analytics |
| crm-center_v2 | Event | evidence.uploaded, notes.added | Customer interaction records |
| customer-portal_v2 | Soft | TechnicianDTO (read), gps.status.changed | Live tech tracking |

---

## 5. resolution-center_v2

### Outgoing Dependencies

| Depends On | Type | Consumed Entities | Purpose |
|---|---|---|---|
| support-center_v2 | Hard | TicketDTO, ticket.* events | Case creation from tickets |
| operations-center_v2 | Hard | OperationDTO, technician reports | Evidence & investigation |
| technician-portal_v2 | Hard | TechnicianReportDTO, EvidenceDTO | Evidence review |
| crm-center_v2 | Hard | CustomerDTO, AccountDTO, InteractionDTO | Customer context & history |
| appointment-center_v2 | Soft | AppointmentDTO | Appointment evidence |
| customer-portal_v2 | Soft | FeedbackDTO | Customer feedback in cases |
| admin-center_v2 | Soft | UserDTO | Approver assignment |

### Incoming Dependencies

| Provides To | Type | Provided Entities | Purpose |
|---|---|---|---|
| support-center_v2 | Event | resolution.case.* | Ticket resolution tracking |
| crm-center_v2 | Event | resolution.case.closed | Customer case history |
| analytics-center_v2 | Event | resolution.case.* | Dispute resolution analytics |
| customer-portal_v2 | Hard | CaseDTO, DisputeDTO | Customer dispute self-service |
| admin-center_v2 | Soft | CaseDTO, EscalationDTO | Admin oversight |
| operations-center_v2 | Event | resolution.escalation.created | Operation context |

---

## 6. crm-center_v2

### Outgoing Dependencies

| Depends On | Type | Consumed Entities | Purpose |
|---|---|---|---|
| support-center_v2 | Event | ticket.* | Customer activity timeline |
| appointment-center_v2 | Event | appointment.* | Customer appointment history |
| technician-portal_v2 | Event | evidence.uploaded, notes.added | Field activity records |
| resolution-center_v2 | Event | resolution.case.* | Customer dispute history |
| customer-portal_v2 | Event | feedback.* | Customer satisfaction data |
| analytics-center_v2 | Soft | Metrics | Health score calculations |
| admin-center_v2 | Soft | OrganizationDTO | Multi-org CRM view |

### Incoming Dependencies

| Provides To | Type | Provided Entities | Purpose |
|---|---|---|---|
| support-center_v2 | Soft | CustomerDTO, AccountDTO | Ticket customer context |
| appointment-center_v2 | Soft | CustomerDTO | Appointment customer details |
| operations-center_v2 | Soft | CustomerDTO | Dispatch customer context |
| technician-portal_v2 | Soft | CustomerDTO | Tech job customer info |
| resolution-center_v2 | Hard | CustomerDTO, InteractionDTO | Case customer history |
| customer-portal_v2 | Hard | AccountDTO, HealthScanDTO | Customer account health |
| analytics-center_v2 | Event | account.health.changed | CRM analytics |
| admin-center_v2 | Soft | AccountDTO, CustomerDTO | Admin customer management |

---

## 7. analytics-center_v2

### Outgoing Dependencies

| Depends On | Type | Consumed Entities | Purpose |
|---|---|---|---|
| support-center_v2 | Event | ticket.* | Support metrics |
| appointment-center_v2 | Event | appointment.* | Appointment metrics |
| operations-center_v2 | Event | operation.* | Operations metrics |
| technician-portal_v2 | Event | job.* | Technician performance metrics |
| resolution-center_v2 | Event | resolution.case.* | Resolution metrics |
| crm-center_v2 | Event | account.health.* | CRM metrics |
| customer-portal_v2 | Event | feedback.* | Customer satisfaction metrics |
| admin-center_v2 | Soft | SystemConfigDTO | System health metrics |

### Incoming Dependencies

| Provides To | Type | Provided Entities | Purpose |
|---|---|---|---|
| support-center_v2 | Soft | Metrics | SLA dashboard |
| crm-center_v2 | Soft | Metrics | Health score context |
| admin-center_v2 | Soft | PlatformMetricDTO | Admin monitoring |
| ALL apps | Soft | Insights, Reports | Dashboard widgets |

---

## 8. customer-portal_v2

### Outgoing Dependencies

| Depends On | Type | Consumed Entities | Purpose |
|---|---|---|---|
| support-center_v2 | Hard | TicketDTO (read) | My tickets view |
| appointment-center_v2 | Hard | AppointmentDTO | My appointments view |
| resolution-center_v2 | Hard | CaseDTO, DisputeDTO | Dispute self-service |
| crm-center_v2 | Hard | AccountDTO, HealthScanDTO | Account health dashboard |
| operations-center_v2 | Soft | OperationDTO (status) | Live technician tracking |
| technician-portal_v2 | Soft | TechnicianDTO, gps.status.changed | Tech location tracking |
| analytics-center_v2 | Soft | Metrics | Personalized insights |

### Incoming Dependencies

| Provides To | Type | Provided Entities | Purpose |
|---|---|---|---|
| crm-center_v2 | Event | feedback.submitted | Customer satisfaction data |
| analytics-center_v2 | Event | feedback.submitted | Customer satisfaction metrics |
| support-center_v2 | Event | ticket.created.customer | Ticket intake from portal |
| appointment-center_v2 | Event | appointment.requested | Self-service booking |
| resolution-center_v2 | Soft | DisputeDTO (from customer) | Dispute initiation |
| admin-center_v2 | Soft | NotificationDTO | Customer notification delivery |

---

## 9. admin-center_v2

### Outgoing Dependencies

| Depends On | Type | Consumed Entities | Purpose |
|---|---|---|---|
| ALL apps | Hard | ApplicationDTO, UserDTO, RoleDTO | Full platform management |
| ALL apps | Soft | UserDTO, PermissionDTO | RBAC management |
| analytics-center_v2 | Soft | PlatformMetricDTO | System health monitoring |
| ALL apps | Soft | AuditLogEntryDTO | Audit log aggregation |

### Incoming Dependencies

| Provides To | Type | Provided Entities | Purpose |
|---|---|---|---|
| ALL apps | Hard | UserDTO, RoleDTO, PermissionDTO | Authentication & authorization |
| ALL apps | Hard | FeatureFlagDTO | Feature gating |
| ALL apps | Soft | SystemSettingDTO | Global configuration |
| ALL apps | Event | user.*, system.config.changed | User management events |
| analytics-center_v2 | Soft | SystemHealthDTO | Platform health metrics |

---

## Dependency Graph (Text Diagram)

```
                          ┌──────────────────┐
                          │  admin-center_v2  │◄──── admin mgmt ──── ALL APPS
                          └────────┬─────────┘
                                   │ auth, roles, features
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
   │ support-      │◄───────│ crm-center_v2 │        │ appointment- │
   │ center_v2     │───────►│              │◄───────│ center_v2    │
   └────┬────┬─────┘        └──────┬───────┘        └──────┬───────┘
        │    │                     │                       │
        │    │  ticket data        │  customer data        │  appointment data
        │    ▼                     ▼                       ▼
        │  ┌─────────────────────────────────────────────────────┐
        │  │                  operations-center_v2                │
        │  └────────┬──────────────┬──────────────┬───────────────┘
        │           │              │              │
        │           │              │              │ job dispatch
        │           │              │              ▼
        │           │              │   ┌──────────────────────┐
        │           │              └──►│  technician-portal_v2 │
        │           │                  └───────┬──────────────┘
        │           │                          │ evidence, reports
        │           │                          ▼
        │           │              ┌──────────────────────┐
        │           └─────────────│  resolution-center_v2  │
        │                        └───────────┬────────────┘
        │                                    │ cases
        │                                    ▼
        │                         ┌──────────────────────┐
        │                         │   customer-portal_v2  │
        │                         └──────────────────────┘
        │
        └────────────────────────────────────────────────────────┐
                                                                 ▼
                                                    ┌──────────────────────┐
                                                    │ analytics-center_v2  │
                                                    └──────────────────────┘
                                                        ▲        ▲
                                                        │        │
                                              ──── ALL EVENT STREAMS ────
```

---

## Dependency Matrix

| App → | sup | appt | ops | tech | resol | crm | anl | cus | adm |
|---|---|---|---|---|---|---|---|---|---|
| **support** | — | E | E | E | E | E | E | H | S |
| **appointment** | E | — | H | H | S | E | E | H | S |
| **operations** | H | H | — | H | E | S | E | E | S |
| **technician** | S | H | H | — | E | S | E | E | S |
| **resolution** | H | S | H | H | — | H | E | H | S |
| **crm** | E | E | E | E | E | — | S | H | S |
| **analytics** | E | E | E | E | E | E | — | E | S |
| **customer** | H | H | S | S | H | H | S | — | S |
| **admin** | H | H | H | H | H | H | S | H | — |

**Key:** H = Hard, S = Soft, E = Event
