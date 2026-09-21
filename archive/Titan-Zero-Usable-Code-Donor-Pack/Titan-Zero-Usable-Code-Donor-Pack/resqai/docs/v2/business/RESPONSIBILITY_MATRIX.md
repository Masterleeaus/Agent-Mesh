# RESQAI V2 — Responsibility Matrix

> Phase 3.4 — Enterprise Business Flow Specification
> Chief Enterprise Business Architect
> Date: 2026-06-29

---

## Table of Contents

1. [RACI Legend](#1-raci-legend)
2. [Application-to-Process Responsibility Matrix](#2-application-to-process-responsibility-matrix)
3. [Domain-to-Application Ownership Matrix](#3-domain-to-application-ownership-matrix)
4. [Process-to-Actor Responsibility Matrix](#4-process-to-actor-responsibility-matrix)
5. [Event-to-Application Responsibility Matrix](#5-event-to-application-responsibility-matrix)
6. [Decision Point Ownership Matrix](#6-decision-point-ownership-matrix)
7. [Approval Authority Matrix](#7-approval-authority-matrix)
8. [Escalation Authority Matrix](#8-escalation-authority-matrix)
9. [Data Stewardship Matrix](#9-data-stewardship-matrix)

---

## 1. RACI Legend

| Code | Meaning | Description |
|:----:|---------|-------------|
| **R** | Responsible | Does the work — the person/system who performs the activity |
| **A** | Accountable | The "buck stops here" — approves or signs off |
| **C** | Consulted | Provides input before decision/action |
| **I** | Informed | Receives notification after decision/action |

---

## 2. Application-to-Process Responsibility Matrix

| Business Process | support-center_v2 | operations-center_v2 | appointment-center_v2 | technician-portal_v2 | resolution-center_v2 | crm-center_v2 | analytics-center_v2 | customer-portal_v2 | admin-center_v2 |
|------------------|:-----------------:|:--------------------:|:---------------------:|:--------------------:|:--------------------:|:-------------:|:-------------------:|:------------------:|:---------------:|
| **Ticket Lifecycle** | R/A | C | I | — | — | I | I | R | — |
| **Appointment Lifecycle** | I | I | R/A | R | — | I | I | R | — |
| **Technician Lifecycle** | — | R | C | R/A | — | I | I | — | C |
| **Customer Lifecycle** | C | — | C | — | — | R/A | I | R | — |
| **CRM Lifecycle** | I | C | — | — | — | R/A | I | I | — |
| **Resolution Lifecycle** | — | — | I | — | R/A | C | I | R | I |
| **Escalation Lifecycle** | R | R | — | — | R | C | — | I | A |
| **Notification Lifecycle** | I | I | I | I | I | I | I | I | R/A |
| **Reporting Lifecycle** | I | I | I | I | I | I | R/A | — | C |
| **Administration Lifecycle** | — | — | — | — | — | — | — | — | R/A |
| **SLA Enforcement** | R | C | — | — | — | — | I | — | — |
| **Inventory Management** | — | R/A | — | C | — | — | I | — | — |
| **Quality Assurance** | C | — | — | — | C | — | I | — | R/A |
| **Audit & Compliance** | I | I | I | I | I | I | I | I | R/A |

---

## 3. Domain-to-Application Ownership Matrix

| Business Domain | Primary Owner (A) | Secondary (R) | Consumers (C/I) |
|-----------------|:-----------------:|:-------------:|:----------------:|
| Customer Management | crm-center_v2 | customer-portal_v2 | ALL |
| Support Operations | support-center_v2 | — | operations-center_v2, crm-center_v2 |
| Appointments & Scheduling | appointment-center_v2 | customer-portal_v2 | technician-portal_v2, operations-center_v2 |
| Technicians & Skills | technician-portal_v2 | — | appointment-center_v2, operations-center_v2 |
| Dispatch & Field Ops | operations-center_v2 | technician-portal_v2 | appointment-center_v2 |
| Work Orders | technician-portal_v2 | — | operations-center_v2, crm-center_v2 |
| CRM & Account Health | crm-center_v2 | — | operations-center_v2, customer-portal_v2 |
| Dispute Resolution | resolution-center_v2 | — | crm-center_v2, customer-portal_v2 |
| Knowledge Base | support-center_v2 | — | customer-portal_v2, technician-portal_v2 |
| Inventory | operations-center_v2 | — | technician-portal_v2 |
| Notifications | notification-center_v2 | — | ALL |
| Analytics & Reporting | analytics-center_v2 | — | ALL |
| Administration & Security | admin-center_v2 | — | ALL |
| Audit & Events | admin-center_v2 | — | ALL |
| AI & Agents | ALL apps | admin-center_v2 | — |

---

## 4. Process-to-Actor Responsibility Matrix

| Business Process | Primary Actor (R) | Approver (A) | Support Actors (C) | Observers (I) |
|------------------|:-----------------:|:------------:|:------------------:|:-------------:|
| Ticket Creation | Customer | — | Classifier AI | Support Agent |
| Ticket Classification | Classifier AI | — | — | Support Agent |
| Reply Drafting | Reply Drafter AI | — | — | Support Agent |
| Reply Approval | Support Manager | Support Manager | — | Customer |
| Ticket Closing | Support Agent | — | — | Customer, CRM |
| Appointment Booking | Customer | — | Tech Suggester AI | Scheduling Manager |
| Technician Assignment | Scheduling System | — | Tech Suggester AI | Technician |
| Appointment Completion | Technician | — | — | Operations, CRM |
| Health Scan | CRM System | — | Account Health Monitor AI | CRM Manager |
| Followup Creation | CRM System | — | CRM Followup Manager AI | Assigned Owner |
| Retention Campaign | Retention Specialist AI | CRM Manager (over $500) | — | CRM Manager |
| Dispute Filing | Customer | — | — | Resolution Manager |
| Dispute Analysis | Resolution Advisor AI | — | Compliance Monitor AI | Resolution Manager |
| Dispute Approval | Resolution Manager | Resolution Manager | Resolution Advisor AI | Customer |
| Escalation (L1) | Support Manager AI | — | — | Operations Manager |
| Escalation (L2) | Operations Manager AI | — | — | Platform Orchestrator |
| Escalation (L3) | Platform Orchestrator AI | — | — | Executive Director |
| Escalation (L4) | Human Executive | Human Executive | — | Legal |
| User Provisioning | Admin User | Admin User | Admin Manager AI | New User |
| Config Change | Admin User | Admin User | Admin System Config AI | ALL apps |

---

## 5. Event-to-Application Responsibility Matrix

| Domain Event | Produced By | Consumed By | Response Action |
|--------------|:-----------:|:-----------:|-----------------|
| ticket.created | support-center_v2, customer-portal_v2 | support-center_v2, notification-center_v2, analytics-center_v2 | Classify, notify, ingest |
| ticket.classified | support-center_v2 | operations-center_v2, appointment-center_v2 | Urgent dispatch, booking request |
| ticket.reply.drafted | support-center_v2 | notification-center_v2 | Approval notification |
| ticket.reply.approved | support-center_v2 | notification-center_v2 | Send notification |
| ticket.sent | support-center_v2 | notification-center_v2 | Customer delivery |
| ticket.closed | support-center_v2 | crm-center_v2, notification-center_v2 | Survey, health update |
| ticket.escalated | support-center_v2 | operations-center_v2, notification-center_v2 | Escalation workflow |
| appointment.created | appointment-center_v2 | notification-center_v2, analytics-center_v2 | Confirmation, metric |
| appointment.assigned | appointment-center_v2 | technician-portal_v2, operations-center_v2 | Job notification, dispatch |
| appointment.confirmed | appointment-center_v2 | notification-center_v2, crm-center_v2 | Reminder schedule, health |
| appointment.completed | technician-portal_v2 | operations-center_v2, crm-center_v2, notification-center_v2 | Work order, survey, health |
| appointment.cancelled | appointment-center_v2 | notification-center_v2, crm-center_v2 | Cancel notification, health |
| work_order.created | technician-portal_v2 | operations-center_v2, analytics-center_v2 | KPI, tracking |
| work_order.completed | technician-portal_v2 | crm-center_v2, notification-center_v2 | Survey, inventory |
| dispatch.acknowledged | technician-portal_v2 | operations-center_v2, notification-center_v2 | Status update |
| dispatch.completed | technician-portal_v2 | operations-center_v2 | KPI, close |
| dispute.created | resolution-center_v2, customer-portal_v2 | resolution-center_v2, notification-center_v2 | AI analysis, notification |
| dispute.analyzed | resolution-center_v2 | resolution-center_v2 | Approval routing |
| dispute.resolved | resolution-center_v2 | crm-center_v2, notification-center_v2 | Health update, outcome |
| account.health.changed | crm-center_v2 | operations-center_v2, notification-center_v2 | Alert, campaign |
| account.risk.signal.detected | crm-center_v2 | notification-center_v2 | Alert |
| followup.created | crm-center_v2 | notification-center_v2 | Assignment notification |
| followup.slippage.detected | crm-center_v2 | notification-center_v2, operations-center_v2 | Alert, task |
| notification.delivered | notification-center_v2 | Source app | Delivery confirmation |
| notification.failed | notification-center_v2 | Source app | Escalation |
| user.created | admin-center_v2 | notification-center_v2 | Welcome email |
| user.role.changed | admin-center_v2 | ALL apps | Permission reload |
| system.config.changed | admin-center_v2 | ALL apps | Config reload |
| feedback.submitted | customer-portal_v2 | crm-center_v2, analytics-center_v2 | Health, analysis |

---

## 6. Decision Point Ownership Matrix

| Decision Point | Primary App | Decision Maker | Input Required | Authority Level |
|----------------|:-----------:|:--------------:|:--------------:|:---------------:|
| Urgency Classification | support-center_v2 | Classifier AI | Ticket content, customer tier | Automated |
| Reply Confidence Threshold | support-center_v2 | System config | Draft confidence | Config-driven |
| Approval of Reply | support-center_v2 | Support Manager | Draft content, context | Human |
| Technician Selection | appointment-center_v2 | Tech Suggester AI | Skills, availability, location | Recommend only |
| Appointment Confirmation | appointment-center_v2 | Customer | Time slot, service type | Customer |
| Job Completion Type | technician-portal_v2 | Technician | Work result | Technician |
| Dispatch Acknowledgment | technician-portal_v2 | Technician | Job details | Technician |
| Dispute Confidence Routing | resolution-center_v2 | System | AI confidence score | Config-driven |
| Dispute Resolution Approval | resolution-center_v2 | Resolution Manager | AI recommendation | Human (all) |
| Escalation Level | support-center_v2 | Escalation Manager AI | Severity, SLA, history | Automated |
| Account Health Category | crm-center_v2 | System | Score from scan | Automated |
| Retention Campaign Trigger | crm-center_v2 | System | Health category | Automated |
| Campaign Offer Amount | crm-center_v2 | Retention Specialist AI | Customer value, history | Recommend (Human > $500) |
| Followup Completion | crm-center_v2 | Assigned Owner | Task result | Human |
| User Role Assignment | admin-center_v2 | Admin User | Business need | Human |
| Config Change | admin-center_v2 | Admin User | Validation result | Human |
| Feature Flag Toggle | admin-center_v2 | Admin User | Impact assessment | Human |
| Emergency Dispatch Mode | operations-center_v2 | System | Urgency flag | Automated (approval for override) |

---

## 7. Approval Authority Matrix

| Approval Point | Required For | Approver | SLA | Escalation If Missed |
|----------------|:------------:|:--------:|:---:|:--------------------:|
| Reply Draft | AI-drafted replies | Support Manager | 4h | Support Manager AI |
| Dispute Resolution | ALL dispute resolutions | Resolution Manager | 24h | Platform Orchestrator AI |
| Dispute > $1,000 | Disputes over $1,000 compensation | Senior Manager | 48h | Platform Orchestrator AI |
| Dispute > $10,000 | Disputes over $10,000 compensation | Executive Director | 72h | Legal Counsel |
| Financial Offer > $500 | Retention campaign offers | CRM Manager | 24h | CRM Manager AI |
| User Deactivation | User account disable | Admin User (2nd approval) | 4h | Admin Manager AI |
| Role Elevation | agent → admin | Admin User (2nd approval) | 4h | Admin Manager AI |
| Configuration Change | ALL system config changes | Admin User | 4h | Admin Manager AI |
| L3 Escalation | Platform Orchestrator invocation | Department Head | 2h | Executive Director |
| L4/Legal Escalation | Executive/legal escalation | Human Executive | 24h | Board of Directors |
| Emergency Dispatch Override | Manual emergency mode | Operations Manager | 5min | Platform Orchestrator AI |
| Inventory Purchase Order | Reorder approval | Operations Manager | 24h | Admin Manager AI |
| Quality Violation Resolution | Compliance violation fix | QA Manager | 48h | Admin Manager AI |
| Account Dormant → Churned | Auto-churn execution | CRM Manager | 7 days | CRM Manager AI |

---

## 8. Escalation Authority Matrix

| Escalation Tier | Authority | Response Time | Can Override | Can Approve |
|:---------------:|:---------:|:-------------:|:------------:|:-----------:|
| L0 - Auto | Support Manager AI | Instant | SLA timer, queue priority | — |
| L1 - Supervisor | Support Manager AI | 10min | Reassignment, reprioritization | Reply approval |
| L2 - Operations | Operations Manager AI | 30min | Tech reassignment, schedule override | Dispatch override |
| L3 - Platform | Platform Orchestrator AI | 2h | Cross-domain coordination, config rollback | Escalation resolution |
| L4 - Executive | Human Executive Director | 24h | Financial approval, legal action | Financial > $10K |
| Legal | Legal Counsel | 48h | Legal settlement, regulatory response | Legal action |

**Escalation Override Rules:**
- Any higher tier can override the tier below
- Emergency mode triggers parallel broadcast to ALL tiers
- Only L4 can authorize legal escalation
- Escalation chain is sequential unless emergency flagged

---

## 9. Data Stewardship Matrix

| Table | Steward (A) | Primary App (R) | Read/Write Access |
|-------|:-----------:|:---------------:|:-----------------:|
| customers_v2 | CRM Manager | crm-center_v2 | customer-portal_v2 (R/W own), ALL (R) |
| customer_addresses_v2 | CRM Manager | crm-center_v2 | customer-portal_v2 (R/W own) |
| tickets_v2 | Support Manager | support-center_v2 | customer-portal_v2 (R/W own), ops-center_v2 (R), crm-center_v2 (R) |
| ticket_messages_v2 | Support Manager | support-center_v2 | customer-portal_v2 (R own) |
| appointments_v2 | Scheduling Manager | appointment-center_v2 | customer-portal_v2 (R/W own), technician-portal_v2 (R/W assigned), ops-center_v2 (R) |
| technicians_v2 | Ops Manager | technician-portal_v2 | appointment-center_v2 (R), ops-center_v2 (R) |
| technician_skills_v2 | Ops Manager | technician-portal_v2 | appointment-center_v2 (R) |
| dispatches_v2 | Dispatch Manager | operations-center_v2 | technician-portal_v2 (R/W assigned) |
| work_orders_v2 | Field Ops Manager | technician-portal_v2 | operations-center_v2 (R), crm-center_v2 (R) |
| work_order_stages_v2 | Field Ops Manager | technician-portal_v2 | operations-center_v2 (R) |
| accounts_v2 | CRM Manager | crm-center_v2 | customer-portal_v2 (R own), ops-center_v2 (R) |
| account_health_scans_v2 | CRM Manager | crm-center_v2 | — |
| followups_v2 | CRM Manager | crm-center_v2 | assigned user (R/W own) |
| followup_attempts_v2 | CRM Manager | crm-center_v2 | assigned user (R/W own) |
| disputes_v2 | Resolution Manager | resolution-center_v2 | customer-portal_v2 (R own) |
| dispute_evidence_v2 | Resolution Manager | resolution-center_v2 | customer-portal_v2 (R/W own) |
| knowledge_articles_v2 | Content Manager | support-center_v2 | customer-portal_v2 (R), technician-portal_v2 (R) |
| inventory_items_v2 | Warehouse Manager | operations-center_v2 | technician-portal_v2 (R) |
| inventory_transactions_v2 | Warehouse Manager | operations-center_v2 | technician-portal_v2 (R/W) |
| notifications_v2 | System Admin | notification-center_v2 | ALL apps (W), owner app (R) |
| notification_templates_v2 | System Admin | support-center_v2 | admin-center_v2 (R/W) |
| users_v2 | System Admin | admin-center_v2 | ALL apps (R own) |
| user_roles_v2 | System Admin | admin-center_v2 | ALL apps (R) |
| role_permissions_v2 | System Admin | admin-center_v2 | ALL apps (R) |
| system_settings_v2 | System Admin | admin-center_v2 | ALL apps (R) |
| feature_flags_v2 | System Admin | admin-center_v2 | ALL apps (R) |
| connectors_v2 | System Admin | admin-center_v2 | — |
| audit_log_v2 | System Admin | admin-center_v2 | ALL apps (W) |
| events_v2 | System Admin | admin-center_v2 | ALL apps (W), analytics-center_v2 (R) |
| analytics_reports_v2 | Business Analyst | analytics-center_v2 | authorized users (R/W) |
| feedback_v2 | CRM Manager | crm-center_v2 | customer-portal_v2 (W own), analytics-center_v2 (R) |
| feedback_surveys_v2 | CRM Manager | crm-center_v2 | customer-portal_v2 (R own) |

---

> **End of RESPONSIBILITY_MATRIX.md**
