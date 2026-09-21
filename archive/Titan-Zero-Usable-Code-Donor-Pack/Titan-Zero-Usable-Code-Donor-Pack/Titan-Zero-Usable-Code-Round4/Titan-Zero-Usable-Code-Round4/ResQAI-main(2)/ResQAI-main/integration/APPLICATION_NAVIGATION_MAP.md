# ResQAI V2 — Application Navigation Map

## Overview

Complete cross-application navigation graph. Defines every navigation path that exits one application and enters another. Each entry includes the **source page**, **target route**, **trigger action**, and the **context data** passed.

---

## Navigation Abstraction Layer

The `shared/src/navigation/ApplicationSwitcher/ApplicationSwitcher.tsx` component provides a dropdown nav across all apps. Each app also deep-links via hash-based URL parameters.

**Cross-app navigation pattern:**
```
// Source app opens target app with context:
window.open(`../${targetApp}/index.html#${targetRoute}?${queryParams}`);
```

---

## 1. support-center_v2 → Outgoing Navigation

| Source Page | Trigger | Target App | Target Route | Context Data |
|---|---|---|---|---|
| TicketDetailPage | "View Customer" button | crm-center_v2 | `#/accounts/:id` | `?source=support&ticketId={ticketId}&customerId={id}` |
| TicketDetailPage | "Schedule Appointment" button | appointment-center_v2 | `#/appointments/new` | `?source=support&ticketId={ticketId}&customerId={id}` |
| TicketDetailPage | "View Dispatch" button | operations-center_v2 | `#/operations/:id` | `?source=support&ticketId={ticketId}&operationId={id}` |
| TicketDetailPage | "View Resolution Case" link | resolution-center_v2 | `#/cases/:id` | `?source=support&ticketId={ticketId}&caseId={id}` |
| SLADashboardPage | "View Analytics" link | analytics-center_v2 | `#/support-analytics` | `?source=support&domain=sla` |
| EscalationsPage | "Dispatch Now" button | operations-center_v2 | `#/dispatch-queue` | `?source=support&ticketId={ticketId}` |
| TicketQueuePage | "Customer Portal" link (agent preview) | customer-portal_v2 | `#/tickets/:id` | `?source=support&customerId={id}` |
| QueueSettingsPage | "Admin Settings" link | admin-center_v2 | `#/applications/support` | `?source=support&app=support-center_v2` |

## 2. appointment-center_v2 → Outgoing Navigation

| Source Page | Trigger | Target App | Target Route | Context Data |
|---|---|---|---|---|
| AppointmentDetailPage | "View Customer" link | crm-center_v2 | `#/accounts/:id` | `?source=appointment&appointmentId={id}&customerId={id}` |
| AppointmentDetailPage | "View Related Ticket" link | support-center_v2 | `#/tickets/:id` | `?source=appointment&appointmentId={id}&ticketId={id}` |
| AppointmentDetailPage | "View Dispatch" link | operations-center_v2 | `#/operations/:id` | `?source=appointment&appointmentId={id}&operationId={id}` |
| AppointmentDetailPage | "View Technician" link | technician-portal_v2 | `#/jobs/:id` | `?source=appointment&appointmentId={id}&technicianId={id}` |
| AssignTechnicianPage | "Technician Schedule" link | technician-portal_v2 | `#/today` | `?source=appointment&technicianId={id}` |
| ReportsPage | "View Analytics" link | analytics-center_v2 | `#/appointment-analytics` | `?source=appointment` |
| TechnicianSchedulePage | "Tech Portal Profile" link | technician-portal_v2 | `#/profile` | `?source=appointment&technicianId={id}` |
| ScheduleSettingsPage | "Admin Settings" link | admin-center_v2 | `#/applications/appointment` | `?source=appointment&app=appointment-center_v2` |
| AppointmentDetailPage | "Customer Portal View" link | customer-portal_v2 | `#/appointments/:id` | `?source=appointment&appointmentId={id}` |

## 3. operations-center_v2 → Outgoing Navigation

| Source Page | Trigger | Target App | Target Route | Context Data |
|---|---|---|---|---|
| DispatchQueuePage | "View Ticket" link | support-center_v2 | `#/tickets/:id` | `?source=operations&operationId={id}&ticketId={id}` |
| DispatchQueuePage | "View Appointment" link | appointment-center_v2 | `#/appointments/:id` | `?source=operations&operationId={id}&appointmentId={id}` |
| AssignmentBoardPage | "Assign Technician" link | technician-portal_v2 | `#/assigned` | `?source=operations&operationId={id}` |
| TechnicianMonitoringPage | "View Tech Details" link | technician-portal_v2 | `#/jobs/:id` | `?source=operations&operationId={id}&technicianId={id}` |
| TechnicianMonitoringPage | "Tech Schedule" link | appointment-center_v2 | `#/technicians/:id/schedule` | `?source=operations&technicianId={id}` |
| EscalationQueuePage | "Create Resolution Case" link | resolution-center_v2 | `#/cases/new` | `?source=operations&operationId={id}&escalationId={id}` |
| EscalationQueuePage | "View Resolution Case" link | resolution-center_v2 | `#/cases/:id` | `?source=operations&operationId={id}&caseId={id}` |
| OperationsReportsPage | "View Analytics" link | analytics-center_v2 | `#/operations-analytics` | `?source=operations` |
| DailyOperationsPage | "Customer Portal View" link | customer-portal_v2 | `#/live-status` | `?source=operations&operationId={id}` |
| RegionalOperationsPage | "CRM Account View" link | crm-center_v2 | `#/accounts/:id` | `?source=operations&region={region}` |

## 4. technician-portal_v2 → Outgoing Navigation

| Source Page | Trigger | Target App | Target Route | Context Data |
|---|---|---|---|---|
| JobDetailPage | "View Ticket" link | support-center_v2 | `#/tickets/:id` | `?source=technician&jobId={id}&ticketId={id}` |
| JobDetailPage | "View Appointment" link | appointment-center_v2 | `#/appointments/:id` | `?source=technician&jobId={id}&appointmentId={id}` |
| JobDetailPage | "View Customer" link | crm-center_v2 | `#/accounts/:id` | `?source=technician&jobId={id}&customerId={id}` |
| CustomerDetailsPage | "CRM Account" link | crm-center_v2 | `#/accounts/:id` | `?source=technician&jobId={id}&customerId={id}` |
| EscalateJobPage | "View Operation" link | operations-center_v2 | `#/escalations` | `?source=technician&jobId={id}&operationId={id}` |
| EscalateJobPage | "Create Resolution Case" link | resolution-center_v2 | `#/cases/new` | `?source=technician&jobId={id}` |
| ServiceNotesPage | "Send to Resolution" link | resolution-center_v2 | `#/evidence-review` | `?source=technician&jobId={id}&noteId={id}` |
| InventoryRequestPage | "Parts Request" link | operations-center_v2 | `#/dispatch-queue` | `?source=technician&jobId={id}&requestId={id}` |
| SettingsPage | "Admin Profile" link | admin-center_v2 | `#/users/:id` | `?source=technician&userId={id}` |

## 5. resolution-center_v2 → Outgoing Navigation

| Source Page | Trigger | Target App | Target Route | Context Data |
|---|---|---|---|---|
| CaseDetailsPage | "View Source Ticket" link | support-center_v2 | `#/tickets/:id` | `?source=resolution&caseId={id}&ticketId={id}` |
| CaseDetailsPage | "View Customer" link | crm-center_v2 | `#/accounts/:id` | `?source=resolution&caseId={id}&customerId={id}` |
| CaseDetailsPage | "View Technician Report" link | technician-portal_v2 | `#/jobs/:id/notes` | `?source=resolution&caseId={id}&jobId={id}` |
| CaseDetailsPage | "View Related Operation" link | operations-center_v2 | `#/operations/:id` | `?source=resolution&caseId={id}&operationId={id}` |
| CaseDetailsPage | "View Appointment Evidence" link | appointment-center_v2 | `#/appointments/:id` | `?source=resolution&caseId={id}&appointmentId={id}` |
| EvidenceReviewPage | "View Full Evidence" link | technician-portal_v2 | `#/jobs/:id/photos` | `?source=resolution&caseId={id}&evidenceId={id}` |
| TechnicianReportReviewPage | "Tech Portal Report" link | technician-portal_v2 | `#/jobs/:id/notes` | `?source=resolution&caseId={id}&reportId={id}` |
| KnowledgeBasePage | "Search Tickets" link | support-center_v2 | `#/tickets` | `?source=resolution&query={kbQuery}` |
| ReportsPage | "View Analytics" link | analytics-center_v2 | `#/dispute-analytics` | `?source=resolution` |
| CaseDetailsPage | "Customer Portal View" link | customer-portal_v2 | `#/disputes/:id` | `?source=resolution&caseId={id}&disputeId={id}` |

## 6. crm-center_v2 → Outgoing Navigation

| Source Page | Trigger | Target App | Target Route | Context Data |
|---|---|---|---|---|
| AccountDetailPage | "View Tickets" link | support-center_v2 | `#/tickets` | `?source=crm&accountId={id}&customerId={id}` |
| AccountDetailPage | "View Appointments" link | appointment-center_v2 | `#/appointments` | `?source=crm&accountId={id}&customerId={id}` |
| AccountDetailPage | "View Operations" link | operations-center_v2 | `#/operations` | `?source=crm&accountId={id}` |
| AccountDetailPage | "View Disputes" link | resolution-center_v2 | `#/cases` | `?source=crm&accountId={id}&customerId={id}` |
| AccountDetailPage | "Schedule Appointment" button | appointment-center_v2 | `#/appointments/new` | `?source=crm&accountId={id}&customerId={id}` |
| AccountDetailPage | "Create Ticket" button | support-center_v2 | `#/tickets/new` | `?source=crm&accountId={id}&customerId={id}` |
| FollowupCenterPage | "Create Support Ticket" button | support-center_v2 | `#/tickets/new` | `?source=crm&followupId={id}&accountId={id}` |
| RiskSignalsPage | "Create Resolution Case" link | resolution-center_v2 | `#/cases/new` | `?source=crm&accountId={id}` |
| RenewalOpportunitiesPage | "Schedule Appointment" link | appointment-center_v2 | `#/appointments/new` | `?source=crm&opportunityId={id}&accountId={id}` |
| ReportsPage | "View Analytics" link | analytics-center_v2 | `#/crm-analytics` | `?source=crm` |
| AccountDetailPage | "Customer Portal View" link | customer-portal_v2 | `#/account-health` | `?source=crm&accountId={id}` |

## 7. analytics-center_v2 → Outgoing Navigation

| Source Page | Trigger | Target App | Target Route | Context Data |
|---|---|---|---|---|
| SupportAnalyticsPage | "View Ticket" drill-down | support-center_v2 | `#/tickets/:id` | `?source=analytics&metric={metric}&ticketId={id}` |
| OperationsAnalyticsPage | "View Operation" drill-down | operations-center_v2 | `#/operations/:id` | `?source=analytics&metric={metric}&operationId={id}` |
| AppointmentAnalyticsPage | "View Appointment" drill-down | appointment-center_v2 | `#/appointments/:id` | `?source=analytics&metric={metric}&appointmentId={id}` |
| TechnicianPerformancePage | "View Technician" drill-down | technician-portal_v2 | `#/profile` | `?source=analytics&metric={metric}&technicianId={id}` |
| CRMAnalyticsPage | "View Account" drill-down | crm-center_v2 | `#/accounts/:id` | `?source=analytics&metric={metric}&accountId={id}` |
| ResolutionAnalyticsPage | "View Case" drill-down | resolution-center_v2 | `#/cases/:id` | `?source=analytics&metric={metric}&caseId={id}` |
| CustomerAnalyticsPage | "Customer Portal View" link | customer-portal_v2 | `#/dashboard` | `?source=analytics&customerId={id}` |
| ExportCenterPage | All export data | ALL apps | (file download) | — |
| SLADashboardPage | "View SLA Dashboard" link | support-center_v2 | `#/sla` | `?source=analytics&domain=sla` |

## 8. customer-portal_v2 → Outgoing Navigation

| Source Page | Trigger | Target App | Target Route | Context Data |
|---|---|---|---|---|
| MyTicketsPage | "Track Progress" link | support-center_v2 | `#/tickets/:id` | `?source=portal&customerId={id}&ticketId={id}` |
| AppointmentDetailPage | "Track Technician" link | operations-center_v2 | `#/operations/:id` | `?source=portal&appointmentId={id}` |
| LiveStatusPage | "View Dispatch" link | operations-center_v2 | `#/live-board` | `?source=portal&appointmentId={id}` |
| TrackTechnicianPage | "Tech Location" link | technician-portal_v2 | `#/jobs/:id/navigation` | `?source=portal&appointmentId={id}&technicianId={id}` |
| DisputeDetailPage | "View Resolution Case" link | resolution-center_v2 | `#/cases/:id` | `?source=portal&disputeId={id}&caseId={id}` |
| AccountHealthPage | "CRM Details" link | crm-center_v2 | `#/accounts/:id` | `?source=portal&customerId={id}` |
| KnowledgeBasePage | "Search Tickets" link | support-center_v2 | `#/tickets` | `?source=portal&query={kbQuery}` |

## 9. admin-center_v2 → Outgoing Navigation

| Source Page | Trigger | Target App | Target Route | Context Data |
|---|---|---|---|---|
| UsersPage | "View Tickets for User" link | support-center_v2 | `#/tickets` | `?source=admin&userId={id}` |
| ApplicationDetailPage | "Open Application" link | any V2 app | `#/` | `?source=admin&appId={appId}` |
| WorkflowManagerPage | "View Workflow Runs" link | operations-center_v2 | `#/operations` | `?source=admin&workflowId={id}` |
| FunctionManagerPage | "View Function Logs" link | analytics-center_v2 | `#/system-health` | `?source=admin&functionId={id}` |
| AgentActivityPage | "View Agent Results" link | analytics-center_v2 | `#/system-health` | `?source=admin&agentId={id}` |
| DatabaseExplorerPage | "View Related Data" link | ALL apps | context-dependent | `?source=admin` |
| APIKeysPage | "View App Usage" link | analytics-center_v2 | `#/audit-analytics` | `?source=admin` |
| AuditLogPage | "View User Activity" link | analytics-center_v2 | `#/audit-analytics` | `?source=admin` |
| PlatformHealthPage | "View System Health" link | analytics-center_v2 | `#/system-health` | `?source=admin` |

---

## Navigation Graph (Text Diagram)

```
                                  ┌──────────────────┐
                                  │  admin-center_v2  │◄────────────────────┐
                                  │                   │──► ALL apps (admin) │
                                  └────────┬──────────┘                    │
                                           │                                │
                   ┌───────────────────────┼────────────────────┐          │
                   │                       │                    │          │
                   ▼                       ▼                    ▼          │
           ┌──────────────┐      ┌──────────────────┐   ┌──────────────┐   │
           │  crm-center   │◄─────│ support-center   │──►│ appointment  │   │
           │              │──────►│                  │◄──│              │   │
           └──────┬───────┘      └───────┬──────────┘   └──────┬───────┘   │
                  │                      │                    │          │
                  │                      │                    │          │
                  ▼                      ▼                    ▼          │
           ┌────────────────────────────────────────────────────────┐   │
           │                  operations-center_v2                   │   │
           └────────────┬───────────────────────────┬───────────────┘   │
                        │                           │                   │
                        ▼                           ▼                   │
                ┌──────────────┐          ┌──────────────────┐          │
                │ technician-   │          │ resolution-center │          │
                │ portal_v2    │─────────►│                  │          │
                └──────┬───────┘          └────────┬─────────┘          │
                       │                           │                    │
                       │                           │                    │
                       ▼                           ▼                    │
                ┌────────────────────────────────────────┐             │
                │             customer-portal_v2         │             │
                └────────────────────────────────────────┘             │
                                                                       │
                ┌──────────────────────────────────────────────────────┘
                │
                ▼
        ┌──────────────┐
        │ analytics-center │◄──── ALL apps (drill-down)
        └────────────────┘────► ALL apps (reports, insights)
```

---

## Application Switcher Configuration

```typescript
// shared/src/navigation/ApplicationSwitcher/applications.config.ts
export const APPLICATIONS: AppLink[] = [
  { id: 'support-center_v2',    label: 'Support Center',    icon: '🎫', description: 'Ticket management & queue',      badge: 12 },
  { id: 'appointment-center_v2',label: 'Appointment Center',icon: '📅', description: 'Scheduling & calendar',           badge: 5  },
  { id: 'operations-center_v2', label: 'Operations Center', icon: '⚙️', description: 'Dispatch & live board',          badge: 3  },
  { id: 'technician-portal_v2', label: 'Technician Portal', icon: '🔧', description: 'Field technician mobile app',    badge: 0  },
  { id: 'resolution-center_v2', label: 'Resolution Center', icon: '⚖️', description: 'Dispute & case management',      badge: 8  },
  { id: 'crm-center_v2',        label: 'CRM Center',        icon: '👥', description: 'Customer relationship management', badge: 0  },
  { id: 'analytics-center_v2',  label: 'Analytics Center',  icon: '📊', description: 'Reports & dashboards',           badge: 0  },
  { id: 'customer-portal_v2',   label: 'Customer Portal',   icon: '🏠', description: 'Customer self-service',          badge: 0  },
  { id: 'admin-center_v2',      label: 'Admin Center',      icon: '🔐', description: 'Platform administration',        badge: 0  },
];
```
