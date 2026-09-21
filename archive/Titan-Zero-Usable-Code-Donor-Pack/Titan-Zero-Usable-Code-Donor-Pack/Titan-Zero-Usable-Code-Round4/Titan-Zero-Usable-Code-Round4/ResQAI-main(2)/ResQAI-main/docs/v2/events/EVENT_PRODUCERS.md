# RESQAI V2 — Event Producer Matrix

> Phase B.3 — Enterprise Event Architecture  
> Chief Enterprise Event Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Producer App Profiles](#1-producer-app-profiles)
2. [App-to-Event Production Matrix](#2-app-to-event-production-matrix)
3. [Entity-to-Event Production Matrix](#3-entity-to-event-production-matrix)
4. [Producer Coverage Analysis](#4-producer-coverage-analysis)

---

## 1. Producer App Profiles

| App | Producer Type | Events Produced | Production Pattern |
|-----|--------------|----------------|-------------------|
| support-center_v2 | Application | 6 | On user action + system |
| appointment-center_v2 | Application | 10 | On user action + system |
| operations-center_v2 | Application | 9 | On user action + system |
| technician-portal_v2 | Application+System | 18 | On user action + device events |
| resolution-center_v2 | Application | 14 | On case lifecycle |
| crm-center_v2 | Application | 19 | On CRM operations |
| analytics-center_v2 | Application | 11 | On schedule + computation |
| customer-portal_v2 | Application+System | 11 | On customer action |
| admin-center_v2 | Application+System | 28 | On admin action + lifecycle |
| ALL Workflows | Workflow | 104+ | On workflow execution |
| Database Triggers | Data Layer | 74 | On table INSERT/UPDATE/DELETE |
| System Infrastructure | Platform | 28 | On system events |

### Production Volume Estimates

| App | Events/Day (Est.) | Peak Events/Min |
|-----|------------------|-----------------|
| support-center_v2 | 15,000 | 50 |
| appointment-center_v2 | 10,000 | 30 |
| operations-center_v2 | 25,000 | 80 |
| technician-portal_v2 | 50,000 | 200 |
| resolution-center_v2 | 3,000 | 15 |
| crm-center_v2 | 8,000 | 25 |
| analytics-center_v2 | 1,500 | 10 |
| customer-portal_v2 | 12,000 | 40 |
| admin-center_v2 | 2,000 | 10 |
| Database Triggers | 150,000 | 500 |
| Workflows | 100,000 | 300 |
| **Total** | **~376,500** | **~1,260** |

---

## 2. App-to-Event Production Matrix

### 2.1 support-center_v2 Events

| Event | Producer | Trigger | Frequency |
|-------|----------|---------|-----------|
| ticket.created | support-center_v2 | New ticket created | 5,000/day |
| ticket.classified | support-center_v2 | AI classification done | 4,500/day |
| ticket.reply.drafted | support-center_v2 | AI draft generated | 3,000/day |
| ticket.reply.approved | support-center_v2 | Human approves draft | 2,500/day |
| ticket.reply.rejected | support-center_v2 | Human rejects draft | 500/day |
| ticket.status.changed | support-center_v2 | Status transition | 8,000/day |

### 2.2 appointment-center_v2 Events

| Event | Producer | Trigger | Frequency |
|-------|----------|---------|-----------|
| appointment.created | appointment-center_v2 | New appointment | 3,000/day |
| appointment.assigned | appointment-center_v2 | Technician assigned | 2,800/day |
| appointment.status.changed | appointment-center_v2 | Status transition | 6,000/day |
| appointment.cancelled | appointment-center_v2 | Appointment cancelled | 300/day |
| appointment.completed | appointment-center_v2 | Service completed | 2,500/day |
| appointment.rescheduled | appointment-center_v2 | Rescheduled | 500/day |
| appointment.updated | appointment-center_v2 | Fields updated | 1,000/day |
| appointment.no_show | appointment-center_v2 | Customer no-show | 100/day |
| appointment.conflict_detected | appointment-center_v2 | Scheduling conflict | 50/day |
| appointment.batch_action | appointment-center_v2 | Bulk operation | 10/day |

### 2.3 operations-center_v2 Events

| Event | Producer | Trigger | Frequency |
|-------|----------|---------|-----------|
| operation.created | operations-center_v2 | New operation | 2,000/day |
| operation.dispatched | operations-center_v2 | Dispatch sent | 1,800/day |
| operation.assigned | operations-center_v2 | Operator assigned | 1,800/day |
| operation.reassigned | operations-center_v2 | Reassignment | 200/day |
| operation.status.changed | operations-center_v2 | Status change | 5,000/day |
| operation.escalated | operations-center_v2 | Escalation triggered | 100/day |
| operation.closed | operations-center_v2 | Operation closed | 1,800/day |
| technician.status.changed | operations-center_v2 | Tech availability | 10,000/day |
| operation.conflict.detected | operations-center_v2 | Resource conflict | 30/day |

### 2.4 technician-portal_v2 Events

| Event | Producer | Trigger | Frequency |
|-------|----------|---------|-----------|
| job.accepted | technician-portal_v2 | Tech accepts job | 1,500/day |
| job.rejected | technician-portal_v2 | Tech declines | 300/day |
| job.status.changed | technician-portal_v2 | Job progress | 8,000/day |
| job.paused | technician-portal_v2 | Job paused | 200/day |
| job.resumed | technician-portal_v2 | Job resumed | 180/day |
| job.escalated | technician-portal_v2 | Job escalated | 50/day |
| job.completed | technician-portal_v2 | Job finished | 1,500/day |
| job.progress.updated | technician-portal_v2 | Progress % change | 5,000/day |
| notes.added | technician-portal_v2 | Work notes | 3,000/day |
| evidence.uploaded | technician-portal_v2 | Photo/evidence | 2,000/day |
| signature.captured | technician-portal_v2 | Digital signature | 1,200/day |
| parts.used | technician-portal_v2 | Parts consumed | 2,000/day |
| inventory.requested | technician-portal_v2 | Parts needed | 500/day |
| message.sent | technician-portal_v2 | Tech messages | 4,000/day |
| offline.sync.started | technician-portal_v2 | Offline sync begin | 500/day |
| offline.sync.completed | technician-portal_v2 | Offline sync end | 500/day |
| offline.sync.failed | technician-portal_v2 | Sync failure | 20/day |
| network.status.changed | technician-portal_v2 | Connectivity change | 1,000/day |
| gps.status.changed | technician-portal_v2 | GPS availability | 500/day |

### 2.5 resolution-center_v2 Events

| Event | Producer | Trigger | Frequency |
|-------|----------|---------|-----------|
| resolution.case.created | resolution-center_v2 | New resolution case | 200/day |
| resolution.case.status.changed | resolution-center_v2 | Case status change | 500/day |
| resolution.case.closed | resolution-center_v2 | Case closed | 180/day |
| resolution.dispute.created | resolution-center_v2 | New dispute | 100/day |
| resolution.dispute.resolved | resolution-center_v2 | Dispute resolved | 90/day |
| resolution.resolution.created | resolution-center_v2 | Resolution proposed | 150/day |
| resolution.resolution.approved | resolution-center_v2 | Resolution accepted | 120/day |
| resolution.resolution.rejected | resolution-center_v2 | Resolution rejected | 30/day |
| resolution.escalation.created | resolution-center_v2 | Escalation raised | 40/day |
| resolution.escalation.resolved | resolution-center_v2 | Escalation handled | 35/day |
| resolution.approval.created | resolution-center_v2 | Approval requested | 200/day |
| resolution.approval.granted | resolution-center_v2 | Approval given | 160/day |
| resolution.approval.denied | resolution-center_v2 | Approval denied | 40/day |
| resolution.evidence.uploaded | resolution-center_v2 | Evidence added | 300/day |

### 2.6 crm-center_v2 Events

| Event | Producer | Trigger | Frequency |
|-------|----------|---------|-----------|
| account.health.scan.completed | crm-center_v2 | Health scan done | 2/day |
| account.health.changed | crm-center_v2 | Health score change | 100/day |
| followup.created | crm-center_v2 | New followup | 300/day |
| followup.updated | crm-center_v2 | Followup updated | 200/day |
| followup.completed | crm-center_v2 | Followup done | 250/day |
| followup.slippage.detected | crm-center_v2 | Overdue detection | 50/day |
| interaction.created | crm-center_v2 | Customer interaction | 500/day |
| note.created | crm-center_v2 | Note added | 400/day |
| note.updated | crm-center_v2 | Note edited | 100/day |
| task.created | crm-center_v2 | Task created | 200/day |
| task.updated | crm-center_v2 | Task updated | 150/day |
| task.completed | crm-center_v2 | Task done | 180/day |
| feedback.recorded | crm-center_v2 | Feedback logged | 100/day |
| satisfaction.recorded | crm-center_v2 | CSAT recorded | 80/day |
| opportunity.created | crm-center_v2 | New opportunity | 50/day |
| opportunity.stage.changed | crm-center_v2 | Stage moved | 100/day |
| opportunity.won | crm-center_v2 | Deal closed | 30/day |
| customer.updated | crm-center_v2 | Customer data changed | 200/day |
| customer.merged | crm-center_v2 | Records merged | 10/day |
| retention.alert | crm-center_v2 | Risk detected | 20/day |

### 2.7 analytics-center_v2 Events

| Event | Producer | Trigger | Frequency |
|-------|----------|---------|-----------|
| analytics:dashboard.refreshed | analytics-center_v2 | Dashboard refresh | 100/day |
| analytics:report.generated | analytics-center_v2 | Report ready | 50/day |
| analytics:report.deleted | analytics-center_v2 | Report removed | 10/day |
| analytics:export.completed | analytics-center_v2 | Export done | 30/day |
| analytics:export.failed | analytics-center_v2 | Export error | 5/day |
| analytics:schedule.created | analytics-center_v2 | Schedule set | 10/day |
| analytics:schedule.executed | analytics-center_v2 | Schedule ran | 50/day |
| analytics:forecast.generated | analytics-center_v2 | Forecast ready | 2/day |
| analytics:sla.breach | analytics-center_v2 | SLA threshold hit | 10/day |
| analytics:anomaly.detected | analytics-center_v2 | Anomaly found | 20/day |
| analytics:insight.ready | analytics-center_v2 | Insight generated | 5/day |

### 2.8 customer-portal_v2 Events

| Event | Producer | Trigger | Frequency |
|-------|----------|---------|-----------|
| ticket.created.customer | customer-portal_v2 | Customer creates ticket | 2,000/day |
| ticket.message.sent.customer | customer-portal_v2 | Customer sends message | 3,000/day |
| appointment.requested | customer-portal_v2 | Customer requests appointment | 500/day |
| appointment.rescheduled.customer | customer-portal_v2 | Customer reschedules | 100/day |
| appointment.cancelled.customer | customer-portal_v2 | Customer cancels | 50/day |
| payment.made.customer | customer-portal_v2 | Payment made | 300/day |
| feedback.submitted.customer | customer-portal_v2 | Feedback given | 500/day |
| password.changed.customer | customer-portal_v2 | Password update | 50/day |
| profile.updated.customer | customer-portal_v2 | Profile edit | 100/day |
| notification.read.customer | customer-portal_v2 | Notification opened | 5,000/day |
| two_factor.toggled.customer | customer-portal_v2 | 2FA setting changed | 10/day |

### 2.9 admin-center_v2 Events

| Event | Producer | Trigger | Frequency |
|-------|----------|---------|-----------|
| user.created | admin-center_v2 | New user | 20/day |
| user.role.changed | admin-center_v2 | Role reassigned | 10/day |
| user.disabled | admin-center_v2 | User deactivated | 5/day |
| system.config.changed | admin-center_v2 | Config update | 5/day |
| application.deployed | admin-center_v2 | New deployment | 2/day |
| application.status.changed | admin-center_v2 | App status change | 5/day |
| workflow.started | admin-center_v2 | Workflow invoked | 5,000/day |
| workflow.completed | admin-center_v2 | Workflow finished | 4,500/day |
| workflow.failed | admin-center_v2 | Workflow error | 100/day |
| workflow.restarted | admin-center_v2 | Workflow retry | 20/day |
| function.started | admin-center_v2 | Function invoked | 10,000/day |
| function.completed | admin-center_v2 | Function finished | 9,800/day |
| function.failed | admin-center_v2 | Function error | 200/day |
| agent.started | admin-center_v2 | Agent invoked | 3,000/day |
| agent.stopped | admin-center_v2 | Agent ended | 3,000/day |
| agent.error | admin-center_v2 | Agent failure | 30/day |
| integration.connected | admin-center_v2 | Integration linked | 2/day |
| integration.disconnected | admin-center_v2 | Integration removed | 1/day |
| integration.error | admin-center_v2 | Integration failure | 10/day |
| api_key.created | admin-center_v2 | API key generated | 3/day |
| api_key.revoked | admin-center_v2 | API key revoked | 2/day |
| organization.created | admin-center_v2 | New org | 1/day |
| organization.updated | admin-center_v2 | Org updated | 5/day |
| team.created | admin-center_v2 | New team | 5/day |
| team.updated | admin-center_v2 | Team modified | 10/day |
| error.resolved | admin-center_v2 | Error cleared | 50/day |

---

## 3. Entity-to-Event Production Matrix

| Entity Table | Events Produced | Producer Mechanism |
|-------------|----------------|-------------------|
| tickets_v2 | ticket.created, ticket.updated, ticket.deleted, ticket.status.changed, ticket.assigned, ticket.completed, ticket.escalated, ticket.resolved, ticket.closed, ticket.cancelled, ticket.archived | DB trigger + app |
| appointments_v2 | appointment.created, appointment.updated, appointment.deleted, appointment.status.changed, appointment.assigned, appointment.completed, appointment.cancelled, appointment.archived | DB trigger + app |
| customers_v2 | customer.created, customer.updated, customer.deleted, customer.merged, customer.archived | DB trigger |
| technicians_v2 | technician.created, technician.updated, technician.deleted, technician.status.changed | DB trigger + app |
| accounts_v2 | account.created, account.updated, account.deleted, account.health.changed, account.archived | DB trigger + app |
| disputes_v2 | resolution.case.created, resolution.case.updated, resolution.case.deleted, resolution.case.status.changed, resolution.case.escalated, resolution.case.resolved, resolution.case.closed, resolution.case.archived | DB trigger + app |
| notifications_v2 | notification.created, notification.updated, notification.deleted, notification.sent, notification.delivered, notification.failed, notification.read | DB trigger + app |
| ticket_messages_v2 | message.created, message.updated, message.deleted | DB trigger |
| dispatches_v2 | operation.created, operation.updated, operation.deleted, operation.assigned, operation.completed, operation.cancelled, operation.archived | DB trigger + app |
| users_v2 | user.created, user.updated, user.deleted, user.disabled, user.archived | DB trigger + app |
| user_roles_v2 | role.created, role.updated, role.deleted | DB trigger |
| role_permissions_v2 | permission.created, permission.updated, permission.deleted | DB trigger |
| analytics_reports_v2 | report.created, report.updated, report.deleted, report.generated | DB trigger + app |
| feature_flags_v2 | feature_flag.created, feature_flag.updated, feature_flag.deleted, feature_flag.toggled | DB trigger |
| system_settings_v2 | system.setting.created, system.setting.updated, system.setting.deleted | DB trigger + app |
| followups_v2 | followup.created, followup.updated, followup.deleted, followup.completed, followup.missed | DB trigger + app |
| work_orders_v2 | work_order.created, work_order.updated, work_order.deleted, work_order.completed | DB trigger + app |
| feedback_v2 | feedback.submitted, feedback.analyzed | DB trigger + app |
| knowledge_articles_v2 | knowledge.article.published, knowledge.article.archived, knowledge.article.deprecated, knowledge.article.updated | DB trigger + app |
| inventory_items_v2 | inventory.item.low_stock, inventory.reorder.started, inventory.reorder.completed | DB trigger + app |
| audit_log_v2 | audit.* (all audit events) | DB trigger (internal) |

---

## 4. Producer Coverage Analysis

### 4.1 Producer Completeness

| Entity | Created | Updated | Deleted | Status Changed | Assigned | Completed | Escalated | Resolved | Closed | Cancelled | Archived |
|--------|:-------:|:-------:|:-------:|:-------------:|:--------:|:---------:|:---------:|:--------:|:------:|:---------:|:--------:|
| tickets | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| appointments | ● | ● | ● | ● | ● | ● | ◐ | — | — | ● | ● |
| customers | ● | ● | ● | — | — | — | — | — | — | — | ● |
| technicians | ● | ● | ● | ● | — | — | — | — | — | — | — |
| crm_records | ● | ● | ● | — | — | — | — | — | — | — | ● |
| resolution_cases | ● | ● | ● | ● | — | — | ● | ● | ● | — | ● |
| notifications | ● | ● | ● | — | — | — | — | — | — | — | — |
| messages | ● | ● | ● | — | — | — | — | — | — | — | — |
| operations_log | ● | ● | ● | — | ● | ● | — | — | — | ● | ● |
| users | ● | ● | ● | — | — | — | — | — | — | — | ● |
| roles | ● | ● | ● | — | — | — | — | — | — | — | — |
| permissions | ● | ● | ● | — | — | — | — | — | — | — | — |
| reports | ● | ● | ● | — | — | — | — | — | — | — | — |
| analytics_cache | — | ● | — | — | — | — | — | — | — | — | — |
| feature_flags | ● | ● | ● | — | — | — | — | — | — | — | — |
| system_settings | ● | ● | ● | — | — | — | — | — | — | — | — |

### 4.2 Producer Completeness Score

- **Full coverage (●):** 76 events
- **Partial coverage (◐):** 1 event
- **Missing (—):** 20 potential events

**Entity Event Coverage: 79.2%**

### 4.3 Gaps in Entity Event Coverage

| Entity | Missing Event | Impact |
|--------|--------------|--------|
| appointments | appointment.escalated — not applicable | Low (operations handle escalation) |
| customers | customer.status.changed | Medium (no customer status lifecycle tracking) |
| appointments | appointment.resolved, appointment.closed | Low (completed covers these) |
| technicians | technician.assigned | Low (assignment is per-appointment) |
| crm_records | account.status.changed | Low (health.changed covers this) |
| notifications | notification.status.changed, notification.archived | Low (individual status events exist) |
| operations_log | operation.status.changed (exists via app) | Low (covered by app events) |
| users | user.status.changed | Medium (disabled event exists; no granular status) |
| roles | role.archived | Low (deleted covers termination) |
| permissions | permission.archived | Low (deleted covers termination) |
| reports | report.archived | Low (deleted covers termination) |
| feature_flags | feature_flag.archived | Low (deleted covers termination) |
| system_settings | system.setting.changed (exists via app) | Low (covered by app events) |

---

> **End of EVENT_PRODUCERS.md**
