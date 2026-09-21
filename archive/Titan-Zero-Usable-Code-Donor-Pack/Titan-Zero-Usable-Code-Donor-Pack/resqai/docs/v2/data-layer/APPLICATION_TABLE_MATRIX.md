# ResQAI V2 — Application Table Matrix

> **Phase:** B.2 — Enterprise Data Layer Integration  
> **Date:** 2026-06-30  
> **Purpose:** Per-application table access definitions with read/write/update/delete classifications

---

## 1. admin-center_v2

| Table | Read | Write | Update | Delete | Purpose |
|-------|:----:|:-----:|:------:|:------:|---------|
| reference_data_v2 | ✓ | — | — | — | Reference data for dropdowns |
| system_settings_v2 | ✓ | ✓ | ✓ | — | System configuration management |
| feature_flags_v2 | ✓ | ✓ | ✓ | — | Feature toggle management |
| connectors_v2 | ✓ | ✓ | ✓ | ✓ | Third-party connector management |
| knowledge_categories_v2 | ✓ | — | — | — | Knowledge category listing |
| user_roles_v2 | ✓ | ✓ | ✓ | ✓ | RBAC role management |
| users_v2 | ✓ | ✓ | ✓ | ✓ | User account management |
| user_sessions_v2 | ✓ | — | — | ✓ | Active session monitoring and force-logout |
| role_permissions_v2 | ✓ | ✓ | ✓ | ✓ | Permission assignment per role |
| notifications_v2 | ✓ | — | — | — | System notification viewing |
| notification_templates_v2 | ✓ | — | — | — | Template listing |
| notification_channels_v2 | ✓ | — | — | — | Channel configuration viewing |
| audit_log_v2 | ✓ | — | — | — | Audit trail viewing and export |
| events_v2 | ✓ | — | — | — | Event bus monitoring |

**Write Operations:** Create/Update users, roles, permissions, settings, flags, connectors, audit log entries  
**Read Operations:** Dashboard metrics, user list, role list, audit log, settings, connectors, events, notifications  
**Update Operations:** User profiles, role config, permissions, settings, flags, connectors  
**Delete Operations:** Users (soft), roles (soft), permissions (soft), connectors (soft), sessions (terminate), API keys (revoke)

---

## 2. analytics-center_v2

| Table | Read | Write | Update | Delete | Purpose |
|-------|:----:|:-----:|:------:|:------:|---------|
| reference_data_v2 | ✓ | — | — | — | Reference dimensions |
| customers_v2 | ✓ | — | — | — | Customer metrics and segmentation |
| technicians_v2 | ✓ | — | — | — | Technician performance analytics |
| accounts_v2 | ✓ | — | — | — | Account health and revenue analysis |
| tickets_v2 | ✓ | — | — | — | Support ticket analytics and SLA metrics |
| appointments_v2 | ✓ | — | — | — | Appointment metrics and trends |
| disputes_v2 | ✓ | — | — | — | Dispute resolution analytics |
| tasks_v2 | ✓ | — | — | — | Productivity and task metrics |
| followups_v2 | ✓ | — | — | — | Follow-up compliance analytics |
| feedback_v2 | ✓ | — | — | — | Customer satisfaction and NPS |
| audit_log_v2 | ✓ | — | — | — | Audit analytics and user activity |
| analytics_reports_v2 | ✓ | ✓ | ✓ | ✓ | Saved report management |
| analytics_schedules_v2 | ✓ | ✓ | ✓ | ✓ | Report schedule management |

**Write Operations:** Create/Update/Delete custom reports, create/update/delete report schedules  
**Read Operations:** Executive dashboard, support/operations/appointment/crm/resolution metrics, SLAs, productivity, trends, forecasts, system health, customer metrics  
**Update Operations:** Report configurations, schedule settings  
**Delete Operations:** Reports, schedules

---

## 3. appointment-center_v2

| Table | Read | Write | Update | Delete | Purpose |
|-------|:----:|:-----:|:------:|:------:|---------|
| reference_data_v2 | ✓ | — | — | — | Service type reference, skill reference |
| customers_v2 | ✓ | — | — | — | Customer lookup for appointments |
| customer_addresses_v2 | ✓ | — | — | — | Service address for appointments |
| technicians_v2 | ✓ | — | — | — | Technician availability and assignment |
| technician_skills_v2 | ✓ | — | — | — | Skill matching for tech assignment |
| tickets_v2 | ✓ | — | — | — | Ticket reference for appointment creation |
| appointments_v2 | ✓ | ✓ | ✓ | — | Core appointment CRUD |
| appointment_reminders_v2 | ✓ | ✓ | — | — | Reminder creation and status tracking |
| dispatches_v2 | ✓ | — | — | — | Dispatch status for appointments |

**Write Operations:** Create appointments, create reminders  
**Update Operations:** Reschedule, cancel, complete, assign technician  
**Read Operations:** Dashboard stats, queue, calendar, timeline, technician schedule, availability slots, history, reports  
**Delete Operations:** None (soft delete only via update)

---

## 4. crm-center_v2

| Table | Read | Write | Update | Delete | Purpose |
|-------|:----:|:-----:|:------:|:------:|---------|
| reference_data_v2 | ✓ | — | — | — | Lookup values |
| customers_v2 | ✓ | ✓ | ✓ | — | Customer profile management |
| accounts_v2 | ✓ | ✓ | ✓ | — | Account health and lifecycle management |
| tasks_v2 | ✓ | ✓ | ✓ | — | CRM task management |
| task_assignments_v2 | ✓ | — | — | — | Task assignment tracking |
| followups_v2 | ✓ | ✓ | ✓ | — | Follow-up scheduling |
| followup_attempts_v2 | ✓ | — | — | — | Follow-up attempt logging |
| account_health_scans_v2 | ✓ | ✓ | — | — | Health scan records |
| feedback_v2 | ✓ | ✓ | — | — | Customer feedback recording |

**Write Operations:** Create customers, accounts, tasks, followups, health scans, feedback  
**Update Operations:** Update customers, accounts, tasks, followups  
**Read Operations:** Account dashboard, customer list, followup queue, health scans, risk signals, interactions, notes, satisfaction, opportunities, retention dashboard  
**Delete Operations:** None (soft delete; CRM does not expose delete)

---

## 5. customer-portal_v2

| Table | Read | Write | Update | Delete | Purpose |
|-------|:----:|:-----:|:------:|:------:|---------|
| customers_v2 | ✓ | — | ✓ | — | Profile viewing and editing |
| customer_addresses_v2 | ✓ | — | — | — | Service address display |
| accounts_v2 | ✓ | — | — | — | Account health and billing info |
| users_v2 | ✓ | — | ✓ | — | Portal user profile, password change |
| role_permissions_v2 | ✓ | — | — | — | Permission check for portal features |
| tickets_v2 | ✓ | ✓ | — | — | Ticket creation and viewing |
| ticket_messages_v2 | ✓ | — | — | — | Message thread viewing |
| ticket_attachments_v2 | ✓ | — | — | — | File attachment viewing |
| appointments_v2 | ✓ | ✓ | ✓ | — | Appointment booking, reschedule, cancel |
| work_orders_v2 | ✓ | — | — | — | Work order status viewing |
| dispatches_v2 | ✓ | — | — | — | Technician tracking |
| disputes_v2 | ✓ | ✓ | — | — | Dispute filing and viewing |
| followups_v2 | ✓ | — | — | — | Follow-up status viewing |
| account_health_scans_v2 | ✓ | — | — | — | Account health display |
| knowledge_articles_v2 | ✓ | — | — | — | Knowledge base browsing |
| knowledge_categories_v2 | ✓ | — | — | — | Category navigation |
| feedback_v2 | ✓ | ✓ | — | — | Feedback submission |
| notifications_v2 | ✓ | — | ✓ | — | Notification viewing and marking read |

**Write Operations:** Create tickets, appointments, disputes, feedback, notifications  
**Update Operations:** Update profile, password, appointments (reschedule/cancel), notifications (read)  
**Read Operations:** Dashboard, tickets, appointments, invoices, payments, disputes, messages, notifications, knowledge base, service history, account health, profile  
**Delete Operations:** None (customer-facing; no delete capability)

---

## 6. operations-center_v2

| Table | Read | Write | Update | Delete | Purpose |
|-------|:----:|:-----:|:------:|:------:|---------|
| technicians_v2 | ✓ | — | — | — | Technician status and location |
| tickets_v2 | ✓ | — | — | — | Ticket information for dispatch |
| appointments_v2 | ✓ | — | — | — | Appointment schedule reference |
| work_orders_v2 | ✓ | ✓ | ✓ | — | Work order lifecycle management |
| work_order_stages_v2 | ✓ | — | — | — | Stage progression tracking |
| dispatches_v2 | ✓ | ✓ | ✓ | — | Dispatch queue management |
| tasks_v2 | ✓ | ✓ | — | — | Task creation from operations |
| task_assignments_v2 | ✓ | — | — | — | Task assignment tracking |

**Write Operations:** Create dispatches, work orders, tasks  
**Update Operations:** Update dispatch status (send, acknowledge, complete), work order status, reassign technicians, escalate, close operations  
**Read Operations:** Dashboard metrics, dispatch queue, live board, daily operations, regional operations, technician status, timeline, completed operations, reports  
**Delete Operations:** None

---

## 7. resolution-center_v2

| Table | Read | Write | Update | Delete | Purpose |
|-------|:----:|:-----:|:------:|:------:|---------|
| customers_v2 | ✓ | — | — | — | Customer information for disputes |
| tickets_v2 | ✓ | — | — | — | Ticket reference for disputes |
| work_orders_v2 | ✓ | — | — | — | Work order reference |
| disputes_v2 | ✓ | ✓ | ✓ | — | Dispute lifecycle management |
| dispute_evidence_v2 | ✓ | ✓ | — | — | Evidence management |
| knowledge_articles_v2 | ✓ | — | — | — | Resolution knowledge base |
| knowledge_categories_v2 | ✓ | — | — | — | Knowledge category navigation |

**Write Operations:** Create resolutions, add evidence, create escalations  
**Update Operations:** Update dispute status (approve, reject, resolve, escalate)  
**Read Operations:** Dashboard, dispute queue, case details, evidence, approvals, escalations, history, closed cases, knowledge base, technician reports, customer complaints  
**Delete Operations:** None

---

## 8. support-center_v2

| Table | Read | Write | Update | Delete | Purpose |
|-------|:----:|:-----:|:------:|:------:|---------|
| reference_data_v2 | ✓ | — | — | — | Request type, urgency, channel references |
| customers_v2 | ✓ | — | — | — | Customer lookup for ticket creation |
| users_v2 | ✓ | — | — | — | Agent assignment reference |
| tickets_v2 | ✓ | ✓ | ✓ | — | Core ticket lifecycle |
| ticket_messages_v2 | ✓ | ✓ | — | — | Message thread on tickets |
| ticket_attachments_v2 | ✓ | ✓ | — | — | File attachments on tickets |

**Write Operations:** Create tickets, add messages, upload attachments, create templates  
**Update Operations:** Update ticket status, classify, draft reply, approve reply, escalate  
**Read Operations:** Ticket queue, ticket detail, SLA metrics, templates, agent list, customer search, my tickets, escalations  
**Delete Operations:** None (may soft-delete via update)

---

## 9. technician-portal_v2

| Table | Read | Write | Update | Delete | Purpose |
|-------|:----:|:-----:|:------:|:------:|---------|
| reference_data_v2 | ✓ | — | — | — | Skill and category references |
| user_roles_v2 | ✓ | — | — | — | Role permission checks |
| role_permissions_v2 | ✓ | — | — | — | Permission verification |
| users_v2 | ✓ | — | ✓ | — | Profile viewing and editing |
| customers_v2 | ✓ | — | — | — | Customer information during jobs |
| customer_addresses_v2 | ✓ | — | — | — | Service address navigation |
| technicians_v2 | ✓ | — | ✓ | — | Profile management, availability |
| technician_skills_v2 | ✓ | — | — | — | Skill profile reference |
| appointments_v2 | ✓ | — | — | — | Appointment reference for jobs |
| work_orders_v2 | ✓ | ✓ | ✓ | — | Work order lifecycle |
| work_order_stages_v2 | ✓ | ✓ | — | — | Stage progression updates |
| dispatches_v2 | ✓ | — | ✓ | — | Dispatch acknowledge and status |
| inventory_items_v2 | ✓ | — | — | — | Parts lookup for requests |
| inventory_transactions_v2 | — | ✓ | — | — | Parts usage logging |
| notifications_v2 | ✓ | — | ✓ | — | Notification viewing and acknowledging |

**Write Operations:** Update work order stages, add service notes, upload evidence, capture signatures, request parts, log inventory transactions, send messages, create notifications  
**Update Operations:** Update job status, technician profile/location, notification read status, dispatch acknowledge  
**Read Operations:** Dashboard, assigned jobs, job detail, customer info, navigation, checklists, parts inventory, messages, notifications, job history, profile  
**Delete Operations:** None

---

> **End of APPLICATION_TABLE_MATRIX.md**
