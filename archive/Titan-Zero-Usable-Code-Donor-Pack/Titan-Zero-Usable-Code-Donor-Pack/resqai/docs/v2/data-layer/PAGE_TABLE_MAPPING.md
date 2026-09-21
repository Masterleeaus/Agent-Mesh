# ResQAI V2 — Page Table Mapping

> **Phase:** B.2 — Enterprise Data Layer Integration  
> **Date:** 2026-06-30  
> **Total Pages Mapped:** 192  
> **Legend:** PT=Primary Table, ST=Secondary Tables

---

## 1. support-center_v2 (9 Pages)

| Page | PT | ST | Read Ops | Insert Ops | Update Ops | Search Ops | Filter Ops | Pagination | Sorting | Caching |
|------|:--:|:--:|:--------:|:----------:|:----------:|:----------:|:----------:|:----------:|:-------:|:-------:|
| TicketQueuePage | tickets_v2 | customers_v2, users_v2 | ticket list with customer+agent | — | status change | by ticket# | status, priority, channel, date | Yes (20) | priority desc, created asc | TTL 30s |
| NewTicketPage | tickets_v2 | customers_v2, reference_data_v2 | customer lookup, ref data | create ticket | — | customer search | — | — | — | TTL 5min (ref) |
| TicketDetailPage | tickets_v2 | ticket_messages_v2, ticket_attachments_v2, customers_v2 | ticket detail, messages, attachments | add message, upload attachment | status, classify, draft, approve | — | — | — | created asc | TTL 15s |
| MyTicketsPage | tickets_v2 | — | assigned tickets | — | — | by ticket# | status, date | Yes (20) | updated desc | TTL 30s |
| EscalationsPage | tickets_v2 | customers_v2 | escalated tickets | — | — | — | status='escalated' | Yes (20) | priority desc | TTL 15s |
| SLADashboardPage | tickets_v2 | — | SLA metrics aggregate | — | — | — | — | — | — | TTL 60s |
| TemplatesPage | — | — | template list | create template | update, delete | by name | — | Yes (50) | name asc | TTL 5min |
| QueueSettingsPage | system_settings_v2 | — | settings list | — | update settings | — | — | — | — | TTL 5min |
| ReportsPage | tickets_v2 | — | aggregated ticket stats | — | — | — | date range | — | — | TTL 60s |

## 2. appointment-center_v2 (17 Pages)

| Page | PT | ST | Read Ops | Insert Ops | Update Ops | Search Ops | Filter Ops | Pagination | Sorting | Caching |
|------|:--:|:--:|:--------:|:----------:|:----------:|:----------:|:----------:|:----------:|:-------:|:-------:|
| DashboardPage | appointments_v2 | technicians_v2, customers_v2 | dashboard stats, today's appointments | — | — | — | date=today | — | — | TTL 30s |
| AppointmentQueuePage | appointments_v2 | technicians_v2, customers_v2 | appointment list | — | — | by customer/tech | status, date, tech | Yes (20) | scheduled_start asc | TTL 30s |
| AppointmentDetailPage | appointments_v2 | appointment_reminders_v2, dispatches_v2, customers_v2 | appointment detail, reminders | — | update, reschedule, cancel | — | — | — | — | TTL 15s |
| NewAppointmentPage | appointments_v2 | customers_v2, technicians_v2, tickets_v2, customer_addresses_v2 | customer lookup, tech list, slots | create appointment | — | customer search | — | — | — | TTL 5min (ref) |
| CalendarViewPage | appointments_v2 | technicians_v2 | appointment calendar | — | — | — | date range, tech | — | time asc | TTL 30s |
| TimelineViewPage | appointments_v2 | — | appointment timeline | — | — | — | date range | — | created asc | TTL 30s |
| TechnicianSchedulePage | appointments_v2 | technicians_v2 | tech schedule | — | — | — | date, tech | — | time asc | TTL 15s |
| AssignTechnicianPage | appointments_v2 | technicians_v2 | available techs | — | assign tech | — | skill, availability | — | rating desc | TTL 15s |
| ReschedulePage | appointments_v2 | technicians_v2, appointments_v2 | current + available slots | — | reschedule | — | — | — | — | TTL 15s |
| CompletedAppointmentsPage | appointments_v2 | technicians_v2 | completed list | — | — | — | date range | Yes (20) | completed_at desc | TTL 60s |
| CancelledAppointmentsPage | appointments_v2 | — | cancelled list | — | — | — | date range | Yes (20) | updated_at desc | TTL 60s |
| AppointmentHistoryPage | appointments_v2 | appointment_reminders_v2 | history | — | — | by ticket# | date range | Yes (50) | created_at desc | TTL 60s |
| SearchPage | appointments_v2 | customers_v2, technicians_v2 | global search | — | — | full text | status, date | Yes (20) | relevance | TTL 15s |
| ServiceTypesPage | reference_data_v2 | — | service type list | create type | update type | — | — | — | sort_order asc | TTL 5min |
| ReportsPage | appointments_v2 | — | aggregated stats | generate report | — | — | date range, type | — | — | TTL 5min |
| ScheduleSettingsPage | system_settings_v2 | — | schedule config | — | update | — | — | — | — | TTL 5min |
| TechnicianPickerPage | technicians_v2 | technician_skills_v2 | tech list with skills | — | — | by name | skill, availability | — | rating desc | TTL 15s |

## 3. operations-center_v2 (14 Pages)

| Page | PT | ST | Read Ops | Insert Ops | Update Ops | Search Ops | Filter Ops | Pagination | Sorting | Caching |
|------|:--:|:--:|:--------:|:----------:|:----------:|:----------:|:----------:|:----------:|:-------:|:-------:|
| OperationsDashboardPage | dispatches_v2 | technicians_v2, tasks_v2 | dashboard metrics, live stats | — | — | — | — | — | — | TTL 15s |
| DispatchQueuePage | dispatches_v2 | technicians_v2, work_orders_v2 | pending dispatches | create dispatch | send, acknowledge | — | status, type, priority | Yes (20) | created asc | TTL 10s |
| LiveOperationsBoardPage | dispatches_v2 | technicians_v2, work_orders_v2 | live operations | — | update status | — | status | — | updated_at desc | TTL 5s |
| AssignmentBoardPage | work_orders_v2 | technicians_v2, appointments_v2 | pending assignments | create assignment | assign technician | — | region, time | Yes (20) | priority desc | TTL 15s |
| DailyOperationsPage | work_orders_v2 | work_order_stages_v2 | daily operations list | — | — | — | date=today | Yes (50) | scheduled_start | TTL 15s |
| RegionalOperationsPage | work_orders_v2 | technicians_v2, dispatches_v2 | regional view | — | — | — | region | — | — | TTL 30s |
| CompletedOperationsPage | work_orders_v2 | — | completed operations | — | — | — | date range | Yes (20) | completed_at desc | TTL 60s |
| PendingAssignmentsPage | work_orders_v2 | technicians_v2 | unassigned work orders | — | assign | — | urgency | Yes (20) | created asc | TTL 15s |
| EscalationQueuePage | work_orders_v2 | tickets_v2 | escalated items | — | — | — | escalation level | Yes (20) | escalated_at desc | TTL 15s |
| OperationsTimelinePage | dispatches_v2 | work_order_stages_v2 | timeline of events | — | — | — | date range, type | — | created_at desc | TTL 30s |
| TechnicianMonitoringPage | technicians_v2 | dispatches_v2 | tech status, location | — | — | — | status, region | — | name asc | TTL 10s |
| OperationsReportsPage | work_orders_v2 | tasks_v2 | aggregated stats | generate report | — | — | date range | — | — | TTL 5min |
| SearchPage | work_orders_v2 | dispatches_v2, technicians_v2 | global search | — | — | full text | status, date | Yes (20) | relevance | TTL 15s |
| ReportsPage | tasks_v2 | work_orders_v2 | operational metrics | — | — | — | date range | — | — | TTL 5min |

## 4. technician-portal_v2 (25 Pages)

| Page | PT | ST | Read Ops | Insert Ops | Update Ops | Search Ops | Filter Ops | Pagination | Sorting | Caching |
|------|:--:|:--:|:--------:|:----------:|:----------:|:----------:|:----------:|:----------:|:-------:|:-------:|
| DashboardPage | work_orders_v2 | dispatches_v2, notifications_v2 | today's jobs, notifications | — | — | — | date=today | — | time asc | TTL 15s |
| TodayJobsPage | work_orders_v2 | appointments_v2, dispatches_v2 | today's job list | — | — | — | date=today | — | scheduled_start asc | TTL 15s |
| AssignedJobsPage | work_orders_v2 | dispatches_v2 | active assignments | — | — | — | status | Yes (20) | priority desc | TTL 30s |
| UpcomingJobsPage | work_orders_v2 | appointments_v2 | future jobs | — | — | — | date range | Yes (20) | scheduled_start asc | TTL 60s |
| JobDetailPage | work_orders_v2 | work_order_stages_v2, customers_v2, customer_addresses_v2 | full job detail | — | update status | — | — | — | — | TTL 15s |
| CompleteJobPage | work_orders_v2 | work_order_stages_v2 | job data for completion | add stages, materials | complete job | — | — | — | — | TTL 10s |
| JobChecklistPage | work_orders_v2 | — | checklist items | — | update items | — | — | — | sort_order asc | TTL 15s |
| ServiceNotesPage | work_orders_v2 | — | existing notes | add note | — | — | — | — | created_at desc | TTL 15s |
| PhotoUploadPage | work_orders_v2 | — | existing photos | upload photo | — | — | — | — | created_at desc | TTL 15s |
| VideoUploadPage | work_orders_v2 | — | existing videos | upload video | — | — | — | — | created_at desc | TTL 15s |
| SignatureCapturePage | work_orders_v2 | — | signature status | capture signature | update sign-off | — | — | — | — | TTL 10s |
| PartsUsedPage | work_orders_v2 | inventory_items_v2, inventory_transactions_v2 | parts list with stock | log parts usage | — | by part name | inventory_category | Yes (50) | name asc | TTL 30s |
| InventoryRequestPage | inventory_items_v2 | inventory_transactions_v2 | stock levels | request part | — | by SKU/name | category | Yes (50) | stock_level asc | TTL 30s |
| CustomerDetailsPage | customers_v2 | customer_addresses_v2, accounts_v2 | customer info, address | — | — | — | — | — | — | TTL 5min |
| NavigationPage | customer_addresses_v2 | technicians_v2 | address + tech location | — | update location | — | — | — | — | TTL 30s |
| MessagesPage | notifications_v2 | — | message list | send message | mark read | — | — | Yes (50) | created_at desc | TTL 15s |
| NotificationsPage | notifications_v2 | — | notification list | — | mark read | — | read/unread | Yes (50) | created_at desc | TTL 10s |
| EscalateJobPage | work_orders_v2 | tickets_v2 | job data for escalation | create escalation | — | — | — | — | — | TTL 15s |
| PauseJobPage | work_orders_v2 | — | job status | — | pause | — | — | — | — | TTL 10s |
| ResumeJobPage | work_orders_v2 | — | job status | — | resume | — | — | — | — | TTL 10s |
| CompletedJobsPage | work_orders_v2 | — | completed job list | — | — | — | date range | Yes (20) | completed_at desc | TTL 60s |
| JobHistoryPage | work_orders_v2 | work_order_stages_v2 | historical job list | — | — | — | date range | Yes (20) | created_at desc | TTL 5min |
| TechnicianProfilePage | technicians_v2 | technician_skills_v2 | profile data | — | update profile | — | — | — | — | TTL 5min |
| SettingsPage | users_v2 | — | user settings | — | update settings | — | — | — | — | TTL 5min |
| TimesheetPage | work_orders_v2 | work_order_stages_v2 | logged hours | — | — | — | date range | — | date desc | TTL 60s |

## 5. resolution-center_v2 (15 Pages)

| Page | PT | ST | Read Ops | Insert Ops | Update Ops | Search Ops | Filter Ops | Pagination | Sorting | Caching |
|------|:--:|:--:|:--------:|:----------:|:----------:|:----------:|:----------:|:----------:|:-------:|:-------:|
| ResolutionDashboardPage | disputes_v2 | — | dashboard stats | — | — | — | — | — | — | TTL 30s |
| DisputeQueuePage | disputes_v2 | customers_v2, tickets_v2 | dispute list | — | — | by dispute#, customer | status, date | Yes (20) | priority desc | TTL 15s |
| CaseDetailsPage | disputes_v2 | dispute_evidence_v2, tickets_v2, work_orders_v2 | full case detail | add evidence | update resolution | — | — | — | — | TTL 15s |
| EvidenceReviewPage | dispute_evidence_v2 | disputes_v2 | evidence list | add evidence | — | — | evidence_type | Yes (50) | created_at desc | TTL 15s |
| ApprovalQueuePage | disputes_v2 | — | pending approvals | — | approve, reject | — | status | Yes (20) | created_at asc | TTL 10s |
| EscalationReviewPage | disputes_v2 | — | escalated cases | create escalation | resolve escalation | — | level | Yes (20) | escalated_at desc | TTL 15s |
| PendingResolutionsPage | disputes_v2 | customers_v2 | pending cases | — | — | — | status | Yes (20) | created_at asc | TTL 15s |
| ClosedCasesPage | disputes_v2 | — | closed case list | — | — | — | date range | Yes (20) | closed_at desc | TTL 60s |
| ResolutionHistoryPage | disputes_v2 | dispute_evidence_v2 | historical resolutions | — | — | — | date range | Yes (50) | resolved_at desc | TTL 5min |
| CustomerComplaintReviewPage | disputes_v2 | customers_v2, tickets_v2 | complaint detail | — | — | — | — | — | — | TTL 15s |
| TechnicianReportReviewPage | work_orders_v2 | technicians_v2 | tech report | — | — | — | — | — | — | TTL 15s |
| KnowledgeBasePage | knowledge_articles_v2 | knowledge_categories_v2 | article list, categories | — | — | full text search | category | Yes (20) | view_count desc | TTL 5min |
| SearchPage | disputes_v2 | knowledge_articles_v2 | global search | — | — | full text | type | Yes (20) | relevance | TTL 30s |
| ReportsPage | disputes_v2 | — | aggregated stats | — | — | — | date range | — | — | TTL 5min |
| CaseListPage | disputes_v2 | customers_v2 | all cases | — | — | — | status, date | Yes (20) | created_at desc | TTL 30s |

## 6. crm-center_v2 (25 Pages)

| Page | PT | ST | Read Ops | Insert Ops | Update Ops | Search Ops | Filter Ops | Pagination | Sorting | Caching |
|------|:--:|:--:|:--------:|:----------:|:----------:|:----------:|:----------:|:----------:|:-------:|:-------:|
| AccountDashboardPage | accounts_v2 | customers_v2 | account dashboard | — | — | — | health, tier | — | — | TTL 30s |
| AccountListPage | accounts_v2 | — | account list | — | — | by name, # | health, tier, industry | Yes (20) | name asc | TTL 30s |
| AccountDetailPage | accounts_v2 | customers_v2, account_health_scans_v2, followups_v2 | full account detail | — | update account | — | — | — | — | TTL 15s |
| AccountDetailPage (Health) | account_health_scans_v2 | accounts_v2 | health scan history | — | — | — | — | Yes (10) | created_at desc | TTL 30s |
| FollowupCenterPage | followups_v2 | accounts_v2, customers_v2 | followup list | create followup | update, complete | — | status, type, assignee | Yes (20) | scheduled_at asc | TTL 15s |
| FollowupDetailPage | followups_v2 | followup_attempts_v2 | full detail + attempts | add attempt | update, close | — | — | — | — | TTL 15s |
| NewFollowupPage | followups_v2 | accounts_v2, customers_v2, tickets_v2 | reference lookup | create followup | — | — | — | — | — | TTL 5min |
| HealthScansPage | account_health_scans_v2 | accounts_v2 | scan history | run scan | — | — | date range | Yes (20) | created_at desc | TTL 30s |
| RiskSignalsPage | account_health_scans_v2 | accounts_v2 | risk signals | — | — | — | level, account | Yes (50) | score asc | TTL 30s |
| InteractionHistoryPage | customers_v2 | tickets_v2, appointments_v2, followups_v2 | interaction timeline | — | — | — | type, date | Yes (50) | created_at desc | TTL 60s |
| NotesPage | customers_v2 | — | customer notes | add note | update note | — | — | — | created_at desc | TTL 15s |
| AddNotePage | customers_v2 | — | — | add note | — | — | — | — | — | TTL 5min |
| TasksPage | tasks_v2 | task_assignments_v2 | task list | create task | update, complete | — | status, priority | Yes (20) | due_at asc | TTL 15s |
| CreateTaskPage | tasks_v2 | accounts_v2, customers_v2 | reference lookup | create task | — | — | — | — | — | TTL 5min |
| CommunicationCenterPage | followups_v2 | — | communication list | — | — | — | type, date | Yes (20) | created_at desc | TTL 30s |
| ScheduleCallPage | followups_v2 | customers_v2 | customer info | schedule call | — | — | — | — | — | TTL 5min |
| CustomerSatisfactionPage | feedback_v2 | customers_v2 | satisfaction metrics | record feedback | — | — | date range | — | created_at desc | TTL 60s |
| CustomerFeedbackPage | feedback_v2 | customers_v2 | feedback list | — | — | — | sentiment, source | Yes (20) | created_at desc | TTL 60s |
| RecordFeedbackPage | feedback_v2 | tickets_v2, customers_v2 | reference data | record feedback | — | — | — | — | — | TTL 5min |
| RenewalOpportunitiesPage | accounts_v2 | — | renewal list | — | — | — | contract_end | Yes (20) | contract_end asc | TTL 60s |
| UpsellOpportunitiesPage | accounts_v2 | customers_v2 | upsell targets | — | — | — | tier, mrr | Yes (20) | mrr_cents desc | TTL 60s |
| RetentionDashboardPage | accounts_v2 | followups_v2, feedback_v2 | retention metrics | — | — | — | period | — | — | TTL 60s |
| ReportsPage | accounts_v2 | feedback_v2, followups_v2 | aggregated CRM data | — | — | — | date range | — | — | TTL 5min |
| SearchPage | accounts_v2 | customers_v2, followups_v2 | global search | — | — | full text | type | Yes (20) | relevance | TTL 30s |
| CustomerTimelinePage | customers_v2 | accounts_v2, tickets_v2, appointments_v2 | customer timeline | — | — | — | — | — | created_at desc | TTL 30s |

## 7. customer-portal_v2 (31 Pages)

| Page | PT | ST | Read Ops | Insert Ops | Update Ops | Search Ops | Filter Ops | Pagination | Sorting | Caching |
|------|:--:|:--:|:--------:|:----------:|:----------:|:----------:|:----------:|:----------:|:-------:|:-------:|
| HomeDashboardPage | customers_v2 | accounts_v2, tickets_v2, appointments_v2 | customer dashboard | — | — | — | — | — | — | TTL 30s |
| CustomerDashboardPage | customers_v2 | accounts_v2, notifications_v2 | overview + notifications | — | — | — | — | — | — | TTL 30s |
| AccountPage | customers_v2 | accounts_v2 | profile + account data | — | update profile | — | — | — | — | TTL 5min |
| ProfilePage | customers_v2 | users_v2 | profile data | — | update profile, password | — | — | — | — | TTL 5min |
| SettingsPage | customers_v2 | users_v2 | notification prefs | — | update prefs | — | — | — | — | TTL 5min |
| SecurityPage | users_v2 | user_sessions_v2 | security settings | — | 2FA, revoke sessions | — | — | — | — | TTL 5min |
| MyTicketsPage | tickets_v2 | — | customer's tickets | — | — | — | status, date | Yes (20) | created_at desc | TTL 30s |
| NewTicketPage | tickets_v2 | customers_v2 | customer data | create ticket | — | — | — | — | — | TTL 5min |
| TicketDetailPage | tickets_v2 | ticket_messages_v2, ticket_attachments_v2 | ticket detail + messages | send message | — | — | — | — | — | TTL 15s |
| AppointmentsPage | appointments_v2 | — | appointment list | — | — | — | status, date | Yes (20) | scheduled_start asc | TTL 30s |
| AppointmentDetailPage | appointments_v2 | dispatches_v2, work_orders_v2 | appointment detail | — | reschedule, cancel | — | — | — | — | TTL 15s |
| BookAppointmentPage | appointments_v2 | customer_addresses_v2, technicians_v2 | available slots, techs | book appointment | — | — | service type | — | — | TTL 30s |
| AppointmentCalendarPage | appointments_v2 | — | monthly calendar view | — | — | — | month | — | date asc | TTL 60s |
| LiveStatusPage | work_orders_v2 | dispatches_v2, work_order_stages_v2 | technician live status | — | — | — | — | — | — | TTL 10s |
| TrackTechnicianPage | dispatches_v2 | technicians_v2 | technician location | — | — | — | — | — | — | TTL 10s |
| MessagesPage | ticket_messages_v2 | tickets_v2 | message threads | send message | — | — | — | — | created_at desc | TTL 15s |
| NotificationsPage | notifications_v2 | — | notification list | — | mark read | — | read/unread | Yes (50) | created_at desc | TTL 10s |
| ServiceHistoryPage | work_orders_v2 | appointments_v2, work_order_stages_v2 | completed services | — | — | — | date range | Yes (20) | completed_at desc | TTL 60s |
| InvoicesPage | accounts_v2 | — | invoice list | — | — | — | status, date | Yes (20) | issue_date desc | TTL 60s |
| InvoiceDetailPage | accounts_v2 | work_orders_v2 | invoice detail | — | — | — | — | — | — | TTL 60s |
| PaymentsPage | accounts_v2 | — | payment methods | make payment | — | — | — | — | — | TTL 60s |
| DisputesPage | disputes_v2 | — | dispute list | file dispute | — | — | status | Yes (20) | created_at desc | TTL 30s |
| DisputeDetailPage | disputes_v2 | dispute_evidence_v2 | dispute detail | add evidence | — | — | — | — | — | TTL 15s |
| FeedbackPage | feedback_v2 | — | feedback history | submit feedback | — | — | — | — | created_at desc | TTL 30s |
| KnowledgeBasePage | knowledge_articles_v2 | knowledge_categories_v2 | article list | — | — | full text search | category | Yes (20) | helpful_count desc | TTL 5min |
| KnowledgeBaseArticlePage | knowledge_articles_v2 | knowledge_categories_v2 | article detail | — | — | — | — | — | — | TTL 5min |
| HelpCenterPage | knowledge_categories_v2 | knowledge_articles_v2 | FAQ categories | — | — | — | category | — | sort_order asc | TTL 5min |
| DownloadsPage | — | — | file list | — | — | — | — | — | name asc | TTL 5min |
| AccountHealthPage | accounts_v2 | account_health_scans_v2, followups_v2 | health score, scans | — | — | — | — | — | — | TTL 30s |
| CreateSupportRequestPage | tickets_v2 | customers_v2 | customer data | create ticket | — | — | — | — | — | TTL 5min |
| ServiceHistoryDetailPage | work_orders_v2 | work_order_stages_v2, feedback_v2 | full service detail | add feedback | — | — | — | — | — | TTL 30s |

## 8. analytics-center_v2 (23 Pages)

| Page | PT | ST | Read Ops | Insert Ops | Update Ops | Search Ops | Filter Ops | Pagination | Sorting | Caching |
|------|:--:|:--:|:--------:|:----------:|:----------:|:----------:|:----------:|:----------:|:-------:|:-------:|
| ExecutiveDashboardPage | tickets_v2 | appointments_v2, accounts_v2, disputes_v2 | aggregate KPIs | — | — | — | date range | — | — | TTL 60s |
| SupportAnalyticsPage | tickets_v2 | customers_v2 | ticket metrics, trends | — | — | — | date range, channel | — | — | TTL 60s |
| OperationsAnalyticsPage | tasks_v2 | work_orders_v2 | ops metrics | — | — | — | date range, type | — | — | TTL 60s |
| AppointmentAnalyticsPage | appointments_v2 | technicians_v2 | booking metrics | — | — | — | date range, type | — | — | TTL 60s |
| AccountAnalyticsPage | accounts_v2 | followups_v2, account_health_scans_v2 | account health metrics | — | — | — | date range | — | — | TTL 60s |
| DisputeAnalyticsPage | disputes_v2 | — | dispute metrics | — | — | — | date range | — | — | TTL 60s |
| TechnicianPerformancePage | technicians_v2 | work_orders_v2, feedback_v2 | tech performance | — | — | — | date range | — | — | TTL 60s |
| CustomerAnalyticsPage | customers_v2 | feedback_v2, accounts_v2 | customer metrics, NPS | — | — | — | date range | — | — | TTL 60s |
| CRMAnalyticsPage | accounts_v2 | customers_v2 | CRM pipeline metrics | — | — | — | date range | — | — | TTL 60s |
| ResolutionAnalyticsPage | disputes_v2 | knowledge_articles_v2 | resolution metrics | — | — | — | date range, type | — | — | TTL 60s |
| SLADashboardPage | tickets_v2 | — | SLA compliance data | — | — | — | date range, team | — | — | TTL 60s |
| ProductivityDashboardPage | tasks_v2 | task_assignments_v2 | productivity metrics | — | — | — | date range | — | — | TTL 60s |
| TrendAnalysisPage | tickets_v2 | appointments_v2, disputes_v2, feedback_v2 | multi-metric trends | — | — | — | date range | — | — | TTL 5min |
| ForecastingPage | tickets_v2 | appointments_v2, accounts_v2 | predictive forecast | — | — | — | period | — | — | TTL 5min |
| ReportsPage | analytics_reports_v2 | — | saved reports | — | — | — | type | Yes (20) | name asc | TTL 60s |
| ReportBuilderPage | analytics_reports_v2 | — | report builder data | create report | update report | — | — | — | — | TTL 30s |
| CustomReportsPage | analytics_reports_v2 | — | custom report list | create report | — | — | type, date | Yes (20) | name asc | TTL 5min |
| ScheduledReportsPage | analytics_reports_v2 | analytics_schedules_v2 | scheduled reports | create schedule | update, delete | — | frequency | Yes (20) | next_run asc | TTL 5min |
| ExportCenterPage | analytics_reports_v2 | — | export options | export report | — | — | format | — | — | TTL 5min |
| AuditAnalyticsPage | audit_log_v2 | — | user activity metrics | — | — | — | date range, action | — | — | TTL 5min |
| SystemHealthPage | system_settings_v2 | — | system health data | — | — | — | — | — | — | TTL 30s |
| SearchPage | analytics_reports_v2 | — | saved report search | — | — | by name, type | type | Yes (20) | relevance | TTL 5min |
| ReportsHomePage | analytics_reports_v2 | — | report overview | — | — | — | type, date | — | — | TTL 60s |

## 9. admin-center_v2 (33 Pages)

| Page | PT | ST | Read Ops | Insert Ops | Update Ops | Search Ops | Filter Ops | Pagination | Sorting | Caching |
|------|:--:|:--:|:--------:|:----------:|:----------:|:----------:|:----------:|:----------:|:-------:|:-------:|
| AdminDashboardPage | users_v2 | system_settings_v2, feature_flags_v2, audit_log_v2 | platform overview | — | — | — | — | — | — | TTL 30s |
| UserManagementPage | users_v2 | user_roles_v2 | user list | create user | update, delete | by name, email | role, status | Yes (50) | name asc | TTL 30s |
| CreateUserPage | user_roles_v2 | — | role list for dropdown | create user | — | — | — | — | — | TTL 5min |
| UserDetailPage | users_v2 | user_sessions_v2, user_roles_v2 | user detail + sessions | — | update user | — | — | — | — | TTL 15s |
| RoleManagerPage | user_roles_v2 | role_permissions_v2 | role list | create role | update, delete | by name | — | Yes (50) | priority desc | TTL 30s |
| CreateRolePage | role_permissions_v2 | — | permission list | create role | — | — | — | — | — | TTL 5min |
| RoleDetailPage | user_roles_v2 | role_permissions_v2, users_v2 | role detail + permissions | — | update role, permissions | — | — | — | — | TTL 15s |
| PermissionsPage | role_permissions_v2 | user_roles_v2 | permission matrix | — | update permissions | by resource | role | — | resource asc | TTL 30s |
| ApplicationsPage | connectors_v2 | — | application list | — | — | by name | status | Yes (20) | name asc | TTL 60s |
| ApplicationDetailPage | connectors_v2 | — | app detail | — | update config | — | — | — | — | TTL 30s |
| IntegrationsPage | connectors_v2 | — | integration list | create connector | update, delete | by name | type, status | Yes (20) | name asc | TTL 30s |
| ConnectorConfigPage | connectors_v2 | — | connector config | create connector | update config | — | type | — | — | TTL 30s |
| WorkflowManagerPage | — | — | workflow list | — | — | by name | status, app | Yes (20) | name asc | TTL 60s |
| WorkflowRunsPage | — | — | workflow run history | — | restart | — | status, date | Yes (50) | created_at desc | TTL 30s |
| FunctionManagerPage | — | — | function list | — | — | by name | status, app | Yes (20) | name asc | TTL 60s |
| FunctionRunsPage | — | — | function run history | — | restart | — | status, date | Yes (50) | created_at desc | TTL 30s |
| AgentManagerPage | — | — | agent list | — | — | by name | status | Yes (20) | name asc | TTL 60s |
| AgentActivityPage | — | — | agent activity log | — | — | — | date range | Yes (50) | created_at desc | TTL 30s |
| APIKeysPage | connectors_v2 | — | API key list | create key | revoke | — | status | Yes (20) | created_at desc | TTL 60s |
| EventBusMonitorPage | events_v2 | — | event bus metrics | — | — | — | type, date | Yes (50) | created_at desc | TTL 15s |
| AuditLogPage | audit_log_v2 | users_v2 | audit log | — | — | entity, action | table, action, date | Yes (50) | created_at desc | TTL 30s |
| SettingsPage | system_settings_v2 | — | settings list | add setting | update setting | by key | category | — | key asc | TTL 60s |
| SystemSettingsPage | system_settings_v2 | — | system config | — | update | — | — | — | — | TTL 60s |
| FeatureFlagsPage | feature_flags_v2 | — | flag list | create flag | update, delete | by name | group, enabled | Yes (50) | name asc | TTL 30s |
| SecurityCenterPage | user_sessions_v2 | users_v2, audit_log_v2 | security overview | — | force logout | — | — | — | — | TTL 30s |
| OrganizationsPage | — | — | org list | — | — | — | — | — | — | TTL 60s |
| TeamsPage | — | — | team list | create team | update | — | — | — | name asc | TTL 60s |
| NotificationCenterPage | notifications_v2 | notification_templates_v2, notification_channels_v2 | notification config | — | send notification | — | type, channel | Yes (50) | created_at desc | TTL 30s |
| MonitoringDashboardPage | system_settings_v2 | events_v2, audit_log_v2 | system monitoring | — | — | — | — | — | — | TTL 15s |
| PlatformHealthPage | system_settings_v2 | connectors_v2 | platform health | — | — | — | — | — | — | TTL 15s |
| DatabaseExplorerPage | audit_log_v2 | — | database explorer | — | — | by table | table | Yes (50) | — | TTL 30s |
| ErrorCenterPage | — | — | error list | — | resolve error | — | severity, date | Yes (50) | created_at desc | TTL 30s |
| SettingsPage (Admin) | system_settings_v2 | feature_flags_v2 | combined settings | — | update | — | — | — | — | TTL 60s |

---

> **End of PAGE_TABLE_MAPPING.md**
