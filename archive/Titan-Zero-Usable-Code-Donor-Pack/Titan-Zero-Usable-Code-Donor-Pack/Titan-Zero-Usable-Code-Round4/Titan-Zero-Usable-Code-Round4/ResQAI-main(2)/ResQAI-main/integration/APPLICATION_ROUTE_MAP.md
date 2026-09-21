# ResQAI V2 — Application Route Map

## Overview

Complete canonical route registry for all 9 V2 applications. Defines every route with its **canonical hash path**, **page component**, **parameter contract**, **required permissions**, and **cross-application reachable status**.

---

## Route Registry

### support-center_v2

| Route Pattern | Page Component | Required Permission | Cross-App Reachable | Accepts Inbound Query Params |
|---|---|---|---|---|
| `/` | TicketQueuePage | support:view_tickets | Yes | `?source`, `?customerId` |
| `/tickets` | TicketQueuePage | support:view_tickets | Yes | `?source`, `?customerId`, `?accountId` |
| `/tickets/new` | NewTicketPage | support:create_ticket | Yes | `?source`, `?customerId`, `?accountId` |
| `/tickets/:id` | TicketDetailPage | support:view_tickets | Yes | `?source`, `?customerId`, `?fromApp`, `?caseId` |
| `/my-tickets` | MyTicketsPage | support:view_tickets | No | — |
| `/escalations` | EscalationsPage | support:escalate | Yes | `?source` |
| `/sla` | SLADashboardPage | support:view_sla | Yes | `?source`, `?fromAnalytics` |
| `/templates` | TemplatesPage | support:manage_templates | No | — |
| `/settings` | QueueSettingsPage | support:manage_queues | Yes | `?source=admin` |

### appointment-center_v2

| Route Pattern | Page Component | Required Permission | Cross-App Reachable | Accepts Inbound Query Params |
|---|---|---|---|---|
| `/` | DashboardPage | appointment:view_schedule | Yes | `?source`, `?customerId` |
| `/queue` | AppointmentQueuePage | appointment:view_queue | Yes | `?source`, `?technicianId` |
| `/calendar` | CalendarViewPage | appointment:view_schedule | No | — |
| `/timeline` | TimelineViewPage | appointment:view_queue | No | — |
| `/appointments/new` | NewAppointmentPage | appointment:create | Yes | `?source`, `?customerId`, `?ticketId`, `?accountId` |
| `/appointments/:id` | AppointmentDetailPage | appointment:view_detail | Yes | `?source`, `?ticketId`, `?customerId`, `?operationId` |
| `/appointments/:id/reschedule` | ReschedulePage | appointment:reschedule | No | — |
| `/appointments/:id/assign` | AssignTechnicianPage | appointment:assign_technician | Yes | `?source`, `?ticketId` |
| `/history` | AppointmentHistoryPage | appointment:view_history | No | — |
| `/cancelled` | CancelledAppointmentsPage | appointment:view_cancelled | No | — |
| `/completed` | CompletedAppointmentsPage | appointment:view_completed | No | — |
| `/search` | SearchPage | appointment:view_queue | Yes | `?source`, `?query` |
| `/reports` | ReportsPage | appointment:view_reports | Yes | `?source` |
| `/technicians/:id/schedule` | TechnicianSchedulePage | appointment:view_schedule | Yes | `?source`, `?technicianId` |
| `/technicians` | TechnicianSchedulePage | appointment:view_schedule | No | — |
| `/services` | ServiceTypesPage | appointment:manage_services | No | — |
| `/settings` | ScheduleSettingsPage | appointment:manage_settings | Yes | `?source=admin` |

### operations-center_v2

| Route Pattern | Page Component | Required Permission | Cross-App Reachable | Accepts Inbound Query Params |
|---|---|---|---|---|
| `/` | OperationsDashboardPage | ops:view_dashboard | Yes | `?source`, `?region` |
| `/dispatch-queue` | DispatchQueuePage | ops:create_dispatch | Yes | `?source`, `?ticketId`, `?appointmentId` |
| `/live-board` | LiveOperationsBoardPage | ops:view_live_board | Yes | `?source` |
| `/assignments` | AssignmentBoardPage | ops:view_assignments | Yes | `?source`, `?technicianId` |
| `/technicians` | TechnicianMonitoringPage | ops:monitor_technicians | Yes | `?source`, `?technicianId` |
| `/pending-assignments` | PendingAssignmentsPage | ops:view_assignments | No | — |
| `/escalations` | EscalationQueuePage | ops:view_escalations | Yes | `?source`, `?operationId`, `?jobId` |
| `/timeline` | OperationsTimelinePage | ops:view_timeline | No | — |
| `/daily` | DailyOperationsPage | ops:view_daily_ops | No | — |
| `/regional` | RegionalOperationsPage | ops:view_regional_ops | Yes | `?source`, `?region` |
| `/completed` | CompletedOperationsPage | ops:view_completed_ops | No | — |
| `/operations/:id` | (placeholder) | ops:view_dispatch_queue | Yes | `?source`, `?ticketId`, `?escalationId` |
| `/reports` | OperationsReportsPage | ops:view_reports | Yes | `?source` |
| `/search` | SearchPage | ops:search_operations | Yes | `?source`, `?query` |

### technician-portal_v2

| Route Pattern | Page Component | Required Permission | Cross-App Reachable | Accepts Inbound Query Params |
|---|---|---|---|---|
| `/` | DashboardPage | technician:view_dashboard | Yes | `?source` |
| `/dashboard` | DashboardPage | technician:view_dashboard | No | — |
| `/today` | TodayJobsPage | technician:view_jobs | Yes | `?source`, `?technicianId` |
| `/assigned` | AssignedJobsPage | technician:view_jobs | Yes | `?source`, `?operationId` |
| `/upcoming` | UpcomingJobsPage | technician:view_jobs | No | — |
| `/completed` | CompletedJobsPage | technician:view_jobs | No | — |
| `/history` | JobHistoryPage | technician:view_history | No | — |
| `/jobs/:id` | JobDetailPage | technician:view_job_detail | Yes | `?source`, `?appointmentId`, `?operationId` |
| `/jobs/:id/checklist` | JobChecklistPage | technician:update_progress | No | — |
| `/jobs/:id/notes` | ServiceNotesPage | technician:add_notes | Yes | `?source`, `?caseId`, `?resolutionId` |
| `/jobs/:id/photos` | PhotoUploadPage | technician:upload_photos | Yes | `?source`, `?caseId` |
| `/jobs/:id/videos` | VideoUploadPage | technician:upload_videos | No | — |
| `/jobs/:id/signature` | SignatureCapturePage | technician:capture_signature | No | — |
| `/jobs/:id/parts` | PartsUsedPage | technician:use_parts | No | — |
| `/jobs/:id/inventory` | InventoryRequestPage | technician:request_inventory | Yes | `?source` |
| `/jobs/:id/pause` | PauseJobPage | technician:pause_job | No | — |
| `/jobs/:id/resume` | ResumeJobPage | technician:resume_job | No | — |
| `/jobs/:id/escalate` | EscalateJobPage | technician:escalate_job | Yes | `?source` |
| `/jobs/:id/complete` | CompleteJobPage | technician:complete_job | No | — |
| `/jobs/:id/navigation` | NavigationPage | technician:view_job_detail | Yes | `?source`, `?customerId` |
| `/jobs/:id/customer` | CustomerDetailsPage | technician:view_job_detail | Yes | `?source`, `?customerId` |
| `/messages` | MessagesPage | technician:view_messages | Yes | `?source` |
| `/notifications` | NotificationsPage | technician:view_notifications | No | — |
| `/profile` | TechnicianProfilePage | technician:view_profile | Yes | `?source`, `?technicianId`, `?userId` |
| `/settings` | SettingsPage | technician:edit_settings | Yes | `?source` |

### resolution-center_v2

| Route Pattern | Page Component | Required Permission | Cross-App Reachable | Accepts Inbound Query Params |
|---|---|---|---|---|
| `/` | ResolutionDashboardPage | resolution:view_dashboard | Yes | `?source` |
| `/pending` | PendingResolutionsPage | resolution:view_pending | No | — |
| `/disputes` | DisputeQueuePage | resolution:view_disputes | Yes | `?source` |
| `/cases` | CaseDetailsPage | resolution:view_cases | Yes | `?source`, `?ticketId` |
| `/cases/new` | CaseDetailsPage | resolution:view_cases | Yes | `?source`, `?ticketId`, `?operationId`, `?jobId` |
| `/cases/:id` | CaseDetailsPage | resolution:view_cases | Yes | `?source`, `?ticketId`, `?disputeId` |
| `/evidence` | EvidenceReviewPage | resolution:view_evidence | Yes | `?source`, `?caseId` |
| `/technician-reports` | TechnicianReportReviewPage | resolution:view_technician_reports | Yes | `?source`, `?caseId` |
| `/complaints` | CustomerComplaintReviewPage | resolution:view_complaints | No | — |
| `/approvals` | ApprovalQueuePage | resolution:view_approvals | Yes | `?source` |
| `/escalations` | EscalationReviewPage | resolution:view_escalations | Yes | `?source` |
| `/history` | ResolutionHistoryPage | resolution:view_history | No | — |
| `/closed` | ClosedCasesPage | resolution:view_closed | No | — |
| `/knowledge-base` | KnowledgeBasePage | resolution:view_knowledge_base | Yes | `?source`, `?query` |
| `/reports` | ReportsPage | resolution:view_reports | Yes | `?source` |
| `/search` | SearchPage | resolution:view_search | Yes | `?source`, `?query` |

### crm-center_v2

| Route Pattern | Page Component | Required Permission | Cross-App Reachable | Accepts Inbound Query Params |
|---|---|---|---|---|
| `/` | AccountDashboardPage | crm:view_dashboard | Yes | `?source`, `?customerId` |
| `/accounts` | AccountListPage | crm:view_accounts | Yes | `?source`, `?query` |
| `/accounts/:id` | AccountDetailPage | crm:view_accounts | Yes | `?source`, `?customerId`, `?ticketId` |
| `/followups` | FollowupCenterPage | crm:view_followups | Yes | `?source` |
| `/followups/new` | NewFollowupPage | crm:manage_followups | Yes | `?source`, `?accountId` |
| `/followups/:id` | FollowupDetailPage | crm:view_followups | No | — |
| `/health-scans` | HealthScansPage | crm:run_scans | No | — |
| `/risks` | RiskSignalsPage | crm:view_risks | No | — |
| `/timeline` | CustomerTimelinePage | crm:view_interactions | Yes | `?source`, `?accountId` |
| `/interactions` | InteractionHistoryPage | crm:view_interactions | No | — |
| `/satisfaction` | CustomerSatisfactionPage | crm:view_satisfaction | No | — |
| `/feedback` | CustomerFeedbackPage | crm:view_feedback | No | — |
| `/renewals` | RenewalOpportunitiesPage | crm:view_opportunities | No | — |
| `/upsell` | UpsellOpportunitiesPage | crm:view_opportunities | No | — |
| `/retention` | RetentionDashboardPage | crm:view_dashboard | No | — |
| `/communications` | CommunicationCenterPage | crm:view_communications | No | — |
| `/notes` | NotesPage | crm:view_notes | No | — |
| `/tasks` | TasksPage | crm:view_tasks | No | — |
| `/reports` | ReportsPage | crm:view_reports | Yes | `?source` |
| `/search` | SearchPage | crm:search | Yes | `?source`, `?query` |

### analytics-center_v2

| Route Pattern | Page Component | Required Permission | Cross-App Reachable | Accepts Inbound Query Params |
|---|---|---|---|---|
| `/` | ExecutiveDashboardPage | analytics:view_executive | Yes | `?source` |
| `/support` | SupportAnalyticsPage | analytics:view_support | Yes | `?source` |
| `/operations` | OperationsAnalyticsPage | analytics:view_operations | Yes | `?source` |
| `/appointments` | AppointmentAnalyticsPage | analytics:view_appointments | Yes | `?source` |
| `/accounts` | AccountAnalyticsPage | analytics:view_accounts | Yes | `?source` |
| `/disputes` | DisputeAnalyticsPage | analytics:view_disputes | Yes | `?source` |
| `/technicians` | TechnicianPerformancePage | analytics:view_technicians | Yes | `?source`, `?technicianId` |
| `/customers` | CustomerAnalyticsPage | analytics:view_customers | Yes | `?source`, `?customerId` |
| `/crm` | CRMAnalyticsPage | analytics:view_crm | Yes | `?source` |
| `/resolution` | ResolutionAnalyticsPage | analytics:view_resolution | Yes | `?source` |
| `/sla` | SLADashboardPage | analytics:view_sla | Yes | `?source` |
| `/productivity` | ProductivityDashboardPage | analytics:view_productivity | No | — |
| `/trends` | TrendAnalysisPage | analytics:view_trends | No | — |
| `/forecasting` | ForecastingPage | analytics:view_forecasting | No | — |
| `/reports` | ReportsPage | analytics:manage_reports | Yes | `?source` |
| `/reports/builder` | ReportBuilderPage | analytics:manage_reports | No | — |
| `/reports/custom` | CustomReportsPage | analytics:manage_reports | No | — |
| `/reports/scheduled` | ScheduledReportsPage | analytics:manage_schedules | No | — |
| `/export` | ExportCenterPage | analytics:export_data | Yes | `?source` |
| `/audit` | AuditAnalyticsPage | analytics:view_audit | Yes | `?source` |
| `/system-health` | SystemHealthPage | analytics:view_health | Yes | `?source` |
| `/search` | SearchPage | analytics:view_all | Yes | `?source`, `?query` |

### customer-portal_v2

| Route Pattern | Page Component | Required Permission | Cross-App Reachable | Accepts Inbound Query Params |
|---|---|---|---|---|
| `/` | CustomerDashboardPage | portal:view_dashboard | Yes | `?source` |
| `/dashboard` | HomeDashboardPage | portal:view_dashboard | No | — |
| `/tickets` | MyTicketsPage | portal:view_tickets | Yes | `?source`, `?customerId` |
| `/tickets/new` | CreateSupportRequestPage | portal:create_ticket | Yes | `?source` |
| `/tickets/:id` | TicketDetailPage | portal:view_ticket_detail | Yes | `?source`, `?ticketId` |
| `/appointments` | AppointmentsPage | portal:view_appointments | Yes | `?source`, `?customerId` |
| `/appointments/new` | BookAppointmentPage | portal:book_appointment | No | — |
| `/appointments/:id` | AppointmentDetailPage | portal:view_appointments | Yes | `?source`, `?appointmentId` |
| `/appointments/calendar` | AppointmentCalendarPage | portal:view_appointments | No | — |
| `/track-technician` | TrackTechnicianPage | portal:track_technician | Yes | `?source`, `?appointmentId` |
| `/live-status` | LiveStatusPage | portal:view_live_status | Yes | `?source`, `?operationId` |
| `/messages` | MessagesPage | portal:view_messages | No | — |
| `/notifications` | NotificationsPage | portal:view_notifications | No | — |
| `/history` | ServiceHistoryPage | portal:view_service_history | No | — |
| `/invoices` | InvoicesPage | portal:view_invoices | No | — |
| `/invoices/:id` | InvoiceDetailPage | portal:view_invoices | No | — |
| `/payments` | PaymentsPage | portal:view_payments | No | — |
| `/feedback` | FeedbackPage | portal:submit_feedback | No | — |
| `/knowledge-base` | KnowledgeBasePage | portal:view_knowledge_base | Yes | `?source`, `?query` |
| `/knowledge-base/:id` | KnowledgeBaseArticlePage | portal:view_knowledge_base | No | — |
| `/downloads` | DownloadsPage | portal:view_downloads | No | — |
| `/profile` | ProfilePage | portal:manage_profile | No | — |
| `/settings` | SettingsPage | portal:view_settings | No | — |
| `/security` | SecurityPage | portal:manage_security | No | — |
| `/help` | HelpCenterPage | portal:view_help_center | No | — |
| `/disputes` | DisputesPage | portal:view_disputes | Yes | `?source`, `?customerId` |
| `/disputes/:id` | DisputeDetailPage | portal:view_disputes | Yes | `?source`, `?caseId` |
| `/account-health` | AccountHealthPage | portal:view_dashboard | Yes | `?source`, `?customerId`, `?accountId` |

### admin-center_v2

| Route Pattern | Page Component | Required Permission | Cross-App Reachable | Accepts Inbound Query Params |
|---|---|---|---|---|
| `/` | AdminDashboardPage | admin:view_dashboard | Yes | `?source` |
| `/users` | UserManagementPage | admin:manage_users | Yes | `?source` |
| `/users/new` | CreateUserPage | admin:manage_users | Yes | `?source` |
| `/users/:id` | UserDetailPage | admin:manage_users | Yes | `?source`, `?userId`, `?fromApp` |
| `/roles` | RoleManagerPage | admin:manage_roles | No | — |
| `/roles/new` | CreateRolePage | admin:manage_roles | No | — |
| `/roles/:id` | RoleDetailPage | admin:manage_roles | No | — |
| `/permissions` | PermissionsPage | admin:manage_roles | No | — |
| `/applications` | ApplicationsPage | admin:manage_applications | No | — |
| `/applications/:id` | ApplicationDetailPage | admin:manage_applications | Yes | `?source`, `?appId` |
| `/workflows` | WorkflowManagerPage | admin:manage_workflows | No | — |
| `/workflows/runs` | WorkflowRunsPage | admin:manage_workflows | No | — |
| `/functions` | FunctionManagerPage | admin:manage_functions | No | — |
| `/functions/runs` | FunctionRunsPage | admin:manage_functions | No | — |
| `/agents` | AgentManagerPage | admin:manage_agents | No | — |
| `/agents/:id/activity` | AgentActivityPage | admin:manage_agents | No | — |
| `/database` | DatabaseExplorerPage | admin:manage_database | No | — |
| `/events` | EventBusMonitorPage | admin:view_events | No | — |
| `/integrations` | IntegrationsPage | admin:manage_integrations | Yes | `?source` |
| `/integrations/:id` | ConnectorConfigPage | admin:manage_connectors | No | — |
| `/notifications` | NotificationCenterPage | admin:manage_notifications | No | — |
| `/feature-flags` | FeatureFlagsPage | admin:manage_feature_flags | No | — |
| `/settings` | SystemSettingsPage | admin:manage_settings | No | — |
| `/security` | SecurityCenterPage | admin:manage_security | No | — |
| `/audit` | AuditLogPage | admin:view_audit | Yes | `?source` |
| `/health` | PlatformHealthPage | admin:view_monitoring | Yes | `?source` |
| `/errors` | ErrorCenterPage | admin:view_errors | No | — |
| `/monitoring` | MonitoringDashboardPage | admin:view_monitoring | No | — |
| `/api-keys` | APIKeysPage | admin:manage_api_keys | No | — |
| `/organizations` | OrganizationsPage | admin:manage_organizations | No | — |
| `/teams` | TeamsPage | admin:manage_teams | No | — |
| `/settings/general` | SettingsPage | admin:manage_settings | No | — |

---

## Cross-Application Route Reachability Index

| App | Total Routes | Cross-App Reachable | % Reachable | Inbound-Ready |
|---|---|---|---|---|
| support-center_v2 | 9 | 6 | 67% | 9 |
| appointment-center_v2 | 17 | 10 | 59% | 17 |
| operations-center_v2 | 14 | 11 | 79% | 14 |
| technician-portal_v2 | 27 | 12 | 44% | 27 |
| resolution-center_v2 | 15 | 11 | 73% | 15 |
| crm-center_v2 | 20 | 7 | 35% | 20 |
| analytics-center_v2 | 22 | 18 | 82% | 22 |
| customer-portal_v2 | 28 | 11 | 39% | 28 |
| admin-center_v2 | 31 | 8 | 26% | 31 |
| **Total** | **183** | **94** | **51%** | **183** |

---

## Canonical URL Schema

```typescript
// Cross-app URL builder
function buildCrossAppUrl(targetApp: string, route: string, context: {
  sourceApp?: string;
  entityType?: string;
  entityId?: string;
  parentEntityType?: string;
  parentEntityId?: string;
  returnRoute?: string;
}): string {
  const params = new URLSearchParams();
  if (context.sourceApp) params.set('source', context.sourceApp);
  if (context.entityType && context.entityId) {
    params.set(context.entityType, context.entityId);
  }
  if (context.parentEntityType && context.parentEntityId) {
    params.set(context.parentEntityType, context.parentEntityId);
  }
  if (context.returnRoute) params.set('return', context.returnRoute);
  const qs = params.toString();
  return `../${targetApp}/index.html#${route}${qs ? '?' + qs : ''}`;
}
```
