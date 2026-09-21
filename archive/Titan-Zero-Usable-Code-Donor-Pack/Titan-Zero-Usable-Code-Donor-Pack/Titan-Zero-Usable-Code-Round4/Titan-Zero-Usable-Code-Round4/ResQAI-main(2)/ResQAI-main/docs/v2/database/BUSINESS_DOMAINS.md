# RESQAI V2 — Business Domains

> Phase 1.2 — Design Only  
> Principal Database Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Domain Inventory](#1-domain-inventory)
2. [Domain 1: Customer Management](#2-domain-1-customer-management)
3. [Domain 2: Support Operations](#3-domain-2-support-operations)
4. [Domain 3: Appointments & Scheduling](#4-domain-3-appointments--scheduling)
5. [Domain 4: Technicians & Skills](#5-domain-4-technicians--skills)
6. [Domain 5: Dispatch & Field Operations](#6-domain-5-dispatch--field-operations)
7. [Domain 6: Work Orders](#7-domain-6-work-orders)
8. [Domain 7: CRM & Account Health](#8-domain-7-crm--account-health)
9. [Domain 8: Dispute Resolution](#9-domain-8-dispute-resolution)
10. [Domain 9: Knowledge Base](#10-domain-9-knowledge-base)
11. [Domain 10: Inventory](#11-domain-10-inventory)
12. [Domain 11: Notifications](#12-domain-11-notifications)
13. [Domain 12: Analytics & Reporting](#13-domain-12-analytics--reporting)
14. [Domain 13: Administration & Security](#14-domain-13-administration--security)
15. [Domain 14: Audit & Events](#15-domain-14-audit--events)
16. [Domain 15: AI & Agents](#16-domain-15-ai--agents)

---

## 1. Domain Inventory

| # | Domain | Owner | Tables | Primary App |
|---|--------|-------|--------|-------------|
| 1 | Customer Management | Account Managers | `customers_v2`, `customer_addresses_v2` | crm-center_v2 |
| 2 | Support Operations | Support Manager | `tickets_v2`, `ticket_messages_v2`, `ticket_attachments_v2` | support-center_v2 |
| 3 | Appointments & Scheduling | Scheduling Manager | `appointments_v2`, `appointment_reminders_v2` | appointment-center_v2 |
| 4 | Technicians & Skills | Operations Manager | `technicians_v2`, `technician_skills_v2` | technician-portal_v2 |
| 5 | Dispatch & Field Ops | Dispatch Manager | `dispatches_v2` | operations-center_v2 |
| 6 | Work Orders | Field Operations | `work_orders_v2`, `work_order_stages_v2` | technician-portal_v2 |
| 7 | CRM & Account Health | CRM Manager | `accounts_v2`, `account_health_scans_v2`, `followups_v2`, `followup_attempts_v2` | crm-center_v2 |
| 8 | Dispute Resolution | Resolution Manager | `disputes_v2`, `dispute_evidence_v2` | resolution-center_v2 |
| 9 | Knowledge Base | Content Manager | `knowledge_articles_v2`, `knowledge_categories_v2` | support-center_v2 |
| 10 | Inventory | Warehouse Manager | `inventory_items_v2`, `inventory_transactions_v2` | operations-center_v2 |
| 11 | Notifications | System Admin | `notifications_v2`, `notification_templates_v2`, `notification_channels_v2` | notification-center_v2 |
| 12 | Analytics & Reporting | Business Analyst | `analytics_reports_v2`, `analytics_schedules_v2` | analytics-center_v2 |
| 13 | Administration & Security | System Admin | `users_v2`, `user_roles_v2`, `user_sessions_v2`, `role_permissions_v2`, `system_settings_v2`, `feature_flags_v2`, `connectors_v2` | admin-center_v2 |
| 14 | Audit & Events | System Admin | `audit_log_v2`, `events_v2` | admin-center_v2 |
| 15 | AI & Agents | Platform Team | (Lives in agent config, not DB tables) | ALL apps |

---

## 2. Domain 1: Customer Management

### Purpose
Manage customer identities, contact information, addresses, and communication preferences across the entire platform.

### Business Owner
Account Managers / Customer Success Team

### Related Applications
- crm-center_v2 (primary owner)
- customer-portal_v2 (self-service update)
- support-center_v2 (ticket context)
- appointment-center_v2 (booking context)
- technician-portal_v2 (job context)
- notification-center_v2 (contact info)
- analytics-center_v2 (demographic analysis)
- admin-center_v2 (user account management)

### Related Workflows
- account-health-monitoring_v2 (customer health tracking)
- customer-satisfaction-monitor_v2 (satisfaction surveys)
- followup-slippage-detector_v2 (outreach triggers)

### Related Agents
- account-health-monitor_v2 (analyzes customer health)
- support-reply-drafter_v2 (personalizes replies with customer context)

### Related Functions
- `account-health-scan` (aggregates customer metrics)
- `dispatch-notifications` (customer contact)

### Related Reports
- Customer acquisition trends
- Customer churn analysis
- Customer demographics report
- Customer lifetime value analysis

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `customers_v2` | Core customer identity, status, contact info | crm-center_v2 |
| `customer_addresses_v2` | Multiple addresses per customer (service, billing) | crm-center_v2 |

---

## 3. Domain 2: Support Operations

### Purpose
Manage support tickets from creation through resolution, including multi-channel intake, AI classification, agent reply drafting, and customer communication.

### Business Owner
Support Manager / Customer Service Director

### Related Applications
- support-center_v2 (primary owner)
- customer-portal_v2 (ticket creation)
- operations-center_v2 (escalation handling)
- notification-center_v2 (customer communications)
- crm-center_v2 (health impact)
- analytics-center_v2 (ticket metrics)

### Related Workflows
- ticket-intake_v2 (full ticket lifecycle)
- urgent-dispatch_v2 (urgent ticket handling)
- support-escalation-manager_v2 (escalation path)
- customer-satisfaction-monitor_v2 (post-resolution)

### Related Agents
- request-classifier_v2 (AI ticket classification)
- support-reply-drafter_v2 (AI reply drafting)

### Related Functions
- `check-ticket-urgency` (deterministic urgency scoring)
- `update-ticket-record` (state machine transitions)
- `dispatch-notifications` (customer contact)

### Related Reports
- Ticket volume by channel/type
- Average response and resolution times
- SLA compliance report
- Agent performance metrics
- Customer satisfaction by category

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `tickets_v2` | Core ticket record with full lifecycle | support-center_v2 |
| `ticket_messages_v2` | Message thread for each ticket | support-center_v2 |
| `ticket_attachments_v2` | File attachments per ticket message | support-center_v2 |

---

## 4. Domain 3: Appointments & Scheduling

### Purpose
Schedule and manage field service appointments, including technician assignment, time slot management, and appointment lifecycle tracking.

### Business Owner
Scheduling Manager / Operations Manager

### Related Applications
- appointment-center_v2 (primary owner)
- customer-portal_v2 (self-service booking)
- technician-portal_v2 (technician schedule view)
- operations-center_v2 (dashboard)
- notification-center_v2 (reminders)
- resolution-center_v2 (dispute appointment context)
- crm-center_v2 (health context)
- analytics-center_v2 (scheduling metrics)

### Related Workflows
- appointment-assignment_v2 (tech suggestion + assignment)
- appointment-reminders_v2 (24h/2h reminders)
- urgent-dispatch_v2 (same-day appointment dispatch)

### Related Agents
- tech-suggester_v2 (AI technician recommendation)

### Related Functions
- `assign-appointment-technician` (deterministic assignment)
- `fetch-upcoming-appointments` (reminder generation)
- `dispatch-notifications` (technician alerts)

### Related Reports
- Appointment volume by service type
- Technician utilization report
- On-time arrival rate
- Cancellation/no-show analysis
- Scheduling lead time analysis

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `appointments_v2` | Appointment records with status lifecycle | appointment-center_v2 |
| `appointment_reminders_v2` | Generated reminder events and delivery status | appointment-center_v2 |

---

## 5. Domain 4: Technicians & Skills

### Purpose
Manage technician profiles, skills, certifications, availability, and performance tracking across the service organization.

### Business Owner
Operations Manager / Field Service Director

### Related Applications
- technician-portal_v2 (primary owner — self-management)
- appointment-center_v2 (assignment suggestions)
- operations-center_v2 (workload management)
- analytics-center_v2 (performance metrics)
- admin-center_v2 (user accounts)

### Related Workflows
- appointment-assignment_v2 (skill matching)
- urgent-dispatch_v2 (available tech lookup)

### Related Agents
- tech-suggester_v2 (skill-based recommendations)
- operations-coordinator_v2 (workload balancing)

### Related Functions
- `assign-appointment-technician` (skill-based assignment)

### Related Reports
- Technician utilization rates
- Skills gap analysis
- Technician performance rankings
- Certification expiry tracking

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `technicians_v2` | Core technician profile | technician-portal_v2 |
| `technician_skills_v2` | Many-to-many skills/certifications per technician | technician-portal_v2 |

---

## 6. Domain 5: Dispatch & Field Operations

### Purpose
Manage urgent dispatch coordination, real-time technician tracking, and field service operations from alert through completion.

### Business Owner
Dispatch Manager / Operations Coordinator

### Related Applications
- operations-center_v2 (primary owner)
- technician-portal_v2 (dispatch receipt)
- notification-center_v2 (alerts)
- appointment-center_v2 (appointment context)
- support-center_v2 (escalation source)
- analytics-center_v2 (dispatch metrics)

### Related Workflows
- urgent-dispatch_v2 (full dispatch lifecycle)
- daily-standup_v2 (dispatch summary)

### Related Agents
- operations-coordinator_v2 (dispatch coordination)

### Related Functions
- `dispatch-notifications` (SMS/push to technician)
- `create-operations-tasks` (post-dispatch followup tasks)

### Related Reports
- Dispatch response time
- Dispatch completion rate
- Average dispatch duration
- Technician dispatch load
- Urgent dispatch trend analysis

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `dispatches_v2` | Dispatch records with full lifecycle | operations-center_v2 |

---

## 7. Domain 6: Work Orders

### Purpose
Detailed work order management for field service jobs, including staged progress tracking, technician notes, parts used, and digital evidence collection.

### Business Owner
Field Operations Manager

### Related Applications
- technician-portal_v2 (primary owner — field execution)
- operations-center_v2 (oversight)
- appointment-center_v2 (work order source)
- crm-center_v2 (completion impact on health)
- analytics-center_v2 (work order metrics)

### Related Workflows
- appointment-assignment_v2 (work order generation)
- urgent-dispatch_v2 (emergency work orders)

### Related Agents
- (None — work orders are deterministic)

### Related Functions
- (None — created via appointment completion flow)

### Related Reports
- Work order completion rate
- Average job duration by type
- Parts usage analysis
- Technician efficiency metrics
- Work order backlog report

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `work_orders_v2` | Detailed work order for field jobs | technician-portal_v2 |
| `work_order_stages_v2` | Stage-by-stage progress tracking | technician-portal_v2 |

---

## 8. Domain 7: CRM & Account Health

### Purpose
Monitor customer account health, manage followup activities, detect churn risk signals, and coordinate retention efforts.

### Business Owner
CRM Manager / Customer Success Director

### Related Applications
- crm-center_v2 (primary owner)
- customer-portal_v2 (health display)
- operations-center_v2 (risk alert handling)
- notification-center_v2 (alerts)
- support-center_v2 (ticket context)
- analytics-center_v2 (health metrics)

### Related Workflows
- account-health-monitoring_v2 (scheduled health scans)
- followup-slippage-detector_v2 (slippage alerts)
- customer-satisfaction-monitor_v2 (post-service surveys)

### Related Agents
- account-health-monitor_v2 (AI health analysis)

### Related Functions
- `account-health-scan` (health score calculation)
- `flag-slipping-followups` (overdue detection)

### Related Reports
- Account health distribution
- At-risk account report
- Followup completion rate
- Health score trends
- Customer retention analysis
- Churn prediction report

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `accounts_v2` | Customer account health record | crm-center_v2 |
| `account_health_scans_v2` | Health scan run history | crm-center_v2 |
| `followups_v2` | Followup item management | crm-center_v2 |
| `followup_attempts_v2` | Individual followup contact attempts | crm-center_v2 |

---

## 9. Domain 8: Dispute Resolution

### Purpose
Manage service dispute intake, AI-powered analysis, resolution recommendation, approval workflow, and dispute closure.

### Business Owner
Resolution Manager / Customer Service Manager

### Related Applications
- resolution-center_v2 (primary owner)
- customer-portal_v2 (dispute status view)
- appointment-center_v2 (dispute appointment context)
- crm-center_v2 (health impact)
- notification-center_v2 (status notifications)
- analytics-center_v2 (dispute metrics)

### Related Workflows
- dispute-resolution_v2 (full dispute analysis + resolution workflow)

### Related Agents
- resolution-advisor_v2 (AI dispute analysis)

### Related Functions
- `resolve-dispute` (deterministic resolution actions)

### Related Reports
- Dispute volume trends
- Resolution time analysis
- Resolution type distribution
- AI confidence vs. human override analysis
- Common dispute causes report

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `disputes_v2` | Dispute records with full lifecycle | resolution-center_v2 |
| `dispute_evidence_v2` | Evidence items per dispute | resolution-center_v2 |

---

## 10. Domain 9: Knowledge Base

### Purpose
Centralized knowledge repository for support articles, service guides, troubleshooting procedures, and customer-facing documentation.

### Business Owner
Content Manager / Support Manager

### Related Applications
- support-center_v2 (primary owner)
- customer-portal_v2 (customer self-service)
- technician-portal_v2 (field reference)
- crm-center_v2 (followup content)

### Related Workflows
- (None directly — knowledge base is content-managed)

### Related Agents
- request-classifier_v2 (suggested articles for ticket)
- support-reply-drafter_v2 (article citations in replies)

### Related Functions
- (None — read-only for most operations)

### Related Reports
- Article view counts
- Search query analysis
- Most helpful articles
- Knowledge gap analysis

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `knowledge_articles_v2` | Knowledge base articles | support-center_v2 |
| `knowledge_categories_v2` | Article categorization taxonomy | support-center_v2 |

---

## 11. Domain 10: Inventory

### Purpose
Track service parts, equipment, and supplies inventory, including stock levels, transactions, and reorder management.

### Business Owner
Warehouse Manager / Operations Manager

### Related Applications
- operations-center_v2 (primary owner)
- technician-portal_v2 (parts lookup/usage)
- appointment-center_v2 (parts needed for jobs)

### Related Workflows
- (Future: automated reorder, low stock alerts)

### Related Agents
- (Future: inventory optimization agent)

### Related Functions
- (Future: stock level check, reorder trigger)

### Related Reports
- Inventory levels report
- Parts usage by service type
- Low stock alerts
- Inventory turnover analysis
- Parts cost analysis

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `inventory_items_v2` | Inventory parts/equipment catalog | operations-center_v2 |
| `inventory_transactions_v2` | Stock movement log | operations-center_v2 |

---

## 12. Domain 11: Notifications

### Purpose
Centralized notification engine managing all outbound communications with templating, multi-channel delivery, and delivery tracking.

### Business Owner
System Administrator

### Related Applications
- notification-center_v2 (primary owner)
- ALL other apps (producers and consumers)

### Related Workflows
- appointment-reminders_v2 (uses notification delivery)
- ALL workflows use notification-center for outbound comms

### Related Agents
- (None — notification center is infrastructure)

### Related Functions
- `dispatch-notifications` (programmatic send)

### Related Reports
- Notification delivery rates
- Channel health report
- Template usage analytics
- Failed delivery analysis

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `notifications_v2` | Individual notification records | notification-center_v2 |
| `notification_templates_v2` | Message template definitions | notification-center_v2 |
| `notification_channels_v2` | Outbound channel configuration | notification-center_v2 |

---

## 13. Domain 12: Analytics & Reporting

### Purpose
Cross-domain business intelligence aggregating data from all operational tables for reporting, visualization, and data export.

### Business Owner
Business Analyst / Operations Director

### Related Applications
- analytics-center_v2 (primary owner)
- ALL other apps (data sources)
- notification-center_v2 (report distribution)

### Related Workflows
- (None — analytics is read-only consumer)

### Related Agents
- (None — query-based, not agent-driven)

### Related Functions
- (None — queries execute directly against tables)

### Related Reports
- ALL reports across all domains (defined in each domain section)

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `analytics_reports_v2` | Saved report configurations | analytics-center_v2 |
| `analytics_schedules_v2` | Report scheduling definitions | analytics-center_v2 |

---

## 14. Domain 13: Administration & Security

### Purpose
System administration including user accounts, role-based access control, system configuration, feature flags, and third-party connector management.

### Business Owner
System Administrator / Security Officer

### Related Applications
- admin-center_v2 (primary owner)
- ALL other apps (consume user/role/config data)

### Related Workflows
- (None — admin is configuration management)

### Related Agents
- (None — admin is not AI-driven)

### Related Functions
- (None — all CRUD on admin tables)

### Related Reports
- User account audit
- Role/permission matrix
- System configuration report
- Connector health report
- Feature flag audit

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `users_v2` | User accounts for the platform | admin-center_v2 |
| `user_roles_v2` | Role definitions | admin-center_v2 |
| `role_permissions_v2` | Granular permission assignments | admin-center_v2 |
| `user_sessions_v2` | Active user session tracking | admin-center_v2 |
| `system_settings_v2` | Key-value configuration store | admin-center_v2 |
| `feature_flags_v2` | Feature toggle management | admin-center_v2 |
| `connectors_v2` | Third-party connector configuration | admin-center_v2 |

---

## 15. Domain 14: Audit & Events

### Purpose
Structured audit logging and event bus recording for compliance, debugging, and system monitoring.

### Business Owner
System Administrator / Security Officer

### Related Applications
- admin-center_v2 (primary consumer)
- ALL other apps (producers of audit events)

### Related Workflows
- ALL workflows produce audit log entries

### Related Agents
- ALL agents produce audit log entries

### Related Functions
- ALL functions produce audit log entries

### Related Reports
- Audit trail by entity
- User action history
- System event timeline
- Compliance reports

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `audit_log_v2` | Structured audit records for all mutations | admin-center_v2 |
| `events_v2` | Event bus message log | admin-center_v2 |

---

## 16. Domain 15: AI & Agents

### Purpose
AI agent configuration, conversation history, model definitions, and agent performance tracking.

### Business Owner
Platform Team / AI Engineer

### Related Applications
- ALL apps (consume agent outputs)
- admin-center_v2 (agent configuration)

### Related Workflows
- ALL workflows (orchestrate agent calls)

### Related Agents
- request-classifier_v2
- support-reply-drafter_v2
- operations-coordinator_v2
- resolution-advisor_v2
- account-health-monitor_v2
- tech-suggester_v2

### Related Functions
- ALL functions (support agent operations)

### Related Reports
- Agent invocation volume
- Agent response time
- Agent accuracy metrics
- Cost per agent invocation

### Tables

| Table | Description | Owner |
|-------|-------------|-------|
| `agent_conversations_v2` | Agent invocation/response records | admin-center_v2 |
| `agent_messages_v2` | Individual message in agent conversation | admin-center_v2 |

(Agent configuration lives in agent definition JSON files, not database tables.)

---

> **End of BUSINESS_DOMAINS.md**  
> Next document: ENTITY_RELATIONSHIP_DIAGRAM.md
