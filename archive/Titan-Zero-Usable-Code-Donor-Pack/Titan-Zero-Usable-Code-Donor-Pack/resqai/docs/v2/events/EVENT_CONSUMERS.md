# RESQAI V2 — Event Consumer Matrix

> Phase B.3 — Enterprise Event Architecture  
> Chief Enterprise Event Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Consumer App Profiles](#1-consumer-app-profiles)
2. [Event-to-Consumer Matrix](#2-event-to-consumer-matrix)
3. [Consumer-to-Event Matrix](#3-consumer-to-event-matrix)
4. [Consumer Coverage Analysis](#4-consumer-coverage-analysis)

---

## 1. Consumer App Profiles

| App | Consumer Type | Events Consumed | Consumption Pattern |
|-----|--------------|----------------|---------------------|
| support-center_v2 | Application | 6 | Direct + Event Bus |
| appointment-center_v2 | Application | 8 | Direct + Event Bus |
| operations-center_v2 | Application | 10 | Direct + Event Bus |
| technician-portal_v2 | Application | 3 | Direct |
| resolution-center_v2 | Application | 8 | Direct + Event Bus |
| crm-center_v2 | Application | 10 | Direct + Event Bus |
| analytics-center_v2 | Application | 8 | Event Bus (read-only) |
| customer-portal_v2 | Application | 0 | None (UI only) |
| admin-center_v2 | Application | 8 | Direct |
| All Apps | Broadcast | All events | Event Bus (analytics) |

### Workflow Consumers

| Workflow | Events Consumed | Pattern |
|----------|----------------|---------|
| ticket-auto-response_v2 | 1 | Event Bus |
| ticket-intake_v2 | 3 | Event Bus |
| ticket-escalation_v2 | 2 | Event Bus |
| sla-enforcement_v2 | 2 | Event Bus |
| appointment-booking_v2 | 3 | Event Bus |
| appointment-reminders_v2 | 2 | Event Bus |
| appointment-completion_v2 | 2 | Event Bus |
| standard-dispatch_v2 | 1 | Event Bus |
| urgent-dispatch_v2 | 2 | Event Bus |
| work-order-fulfillment_v2 | 2 | Event Bus |
| work-order-verification_v2 | 1 | Event Bus |
| dispute-resolution_v2 | 1 | Event Bus |
| dispute-escalation_v2 | 1 | Event Bus |
| account-health-scan_v2 | 2 | Event Bus + Cron |
| followup-management_v2 | 5 | Event Bus |
| followup-slippage-detector_v2 | 1 | Cron + Event |
| retention-campaign_v2 | 4 | Event Bus |
| customer-satisfaction-monitor_v2 | 3 | Event Bus |
| feedback-analysis_v2 | 2 | Event Bus |
| knowledge-article-lifecycle_v2 | 1 | Event Bus |
| knowledge-gap-detection_v2 | 1 | Event Bus |
| notification-delivery_v2 | 2 | Event Bus |
| daily-standup_v2 | 0 | Cron only |
| operations-coordination_v2 | 3 | Event Bus + UI |
| report-generation_v2 | 3 | Event Bus + Cron |
| report-distribution_v2 | 1 | Event Bus |
| trend-analysis_v2 | All | Event Bus (read) |
| anomaly-detection_v2 | All | Event Bus (read) |
| quality-review_v2 | 3 | Event Bus |
| user-provisioning_v2 | 1 | Event Bus |
| system-config-management_v2 | 1 | Event Bus |
| inventory-reorder_v2 | 2 | Event Bus |
| workflow-health-monitor_v2 | 8 | Event Bus |

---

## 2. Event-to-Consumer Matrix

### Legend

| Symbol | Meaning |
|--------|---------|
| ● | Primary consumer |
| ○ | Secondary/background consumer |
| ◐ | Conditional consumer |
| — | Does not consume |

### 2.1 Ticket Events

| Event | ticket-auto-resp | ticket-intake | ticket-escalation | sla-enforcement | urgent-dispatch | notification-delivery | trend-analysis | anomaly-detection | quality-review |
|-------|:----------------:|:-------------:|:-----------------:|:---------------:|:---------------:|:--------------------:|:--------------:|:-----------------:|:-------------:|
| ticket.created | ● | ● | — | ● | — | — | ○ | ○ | — |
| ticket.classified | — | ● | — | — | ◐ | — | ○ | ○ | — |
| ticket.status.changed | — | — | — | ● | — | — | ○ | ○ | — |
| ticket.escalated | — | — | ● | — | ◐ | — | ○ | ○ | — |
| ticket.reply.drafted | — | — | — | — | — | — | ○ | ○ | ● |
| ticket.auto_responded | — | — | — | — | — | ● | ○ | ○ | — |
| ticket.sent | — | — | — | — | — | ● | ○ | ○ | — |
| ticket.sla_warning | — | — | — | — | — | ● | ○ | ○ | — |
| ticket.sla_breached | — | — | ● | — | — | — | ○ | ○ | — |
| ticket.closed | — | — | — | — | — | — | ○ | ○ | ● |

### 2.2 Appointment Events

| Event | appointment-booking | appointment-reminders | appointment-completion | customer-satisfaction-monitor | followup-management | notification-delivery |
|-------|:------------------:|:--------------------:|:---------------------:|:----------------------------:|:------------------:|:--------------------:|
| appointment.created | ● | — | — | — | — | — |
| appointment.confirmed | — | ● | — | — | — | — |
| appointment.completed | — | — | ● | ● | ◐ | — |
| appointment.rescheduled | — | ● | — | — | — | — |
| appointment.cancelled | — | — | — | — | — | ● |
| appointment.no_show | — | — | ● | — | — | — |
| appointment.assigned | — | — | — | — | — | ● |
| appointment.conflict_detected | — | — | — | — | — | — |

### 2.3 Dispatch & Work Order Events

| Event | standard-dispatch | urgent-dispatch | work-order-fulfillment | work-order-verification | operations-coordination |
|-------|:----------------:|:---------------:|:---------------------:|:----------------------:|:----------------------:|
| dispatch.created | ● | — | — | — | — |
| dispatch.declined | — | ● | — | — | — |
| dispatch.escalated | — | ● | — | — | ● |
| work_order.created | — | — | ● | — | — |
| work_order.completed | — | — | — | ● | — |
| work_order.followup_needed | — | — | — | — | — |

### 2.4 Dispute & Resolution Events

| Event | dispute-resolution | dispute-escalation | followup-management | customer-satisfaction-monitor | quality-review |
|-------|:-----------------:|:------------------:|:------------------:|:----------------------------:|:-------------:|
| dispute.created | ● | — | — | — | — |
| dispute.analyzed | — | — | — | — | ● |
| dispute.escalated | — | ● | — | — | — |
| dispute.resolved | — | — | ● | ● | — |

### 2.5 CRM & Account Events

| Event | followup-management | followup-slippage-detector | retention-campaign | account-health-scan | feedback-analysis |
|-------|:------------------:|:-------------------------:|:------------------:|:------------------:|:----------------:|
| account.health.changed | ● | — | ● | — | — |
| account.risk.signal.detected | ● | — | — | — | — |
| followup.created | ● | — | — | — | — |
| followup.missed | — | ● | — | — | — |
| followup.completed | — | — | — | ● | — |
| followup.slippage.detected | — | — | ● | — | — |
| feedback.submitted | — | — | — | — | ● |
| retention.alert | — | — | ● | — | — |

### 2.6 Customer Experience Events

| Event | feedback-analysis | retention-campaign | knowledge-gap-detection | report-generation |
|-------|:----------------:|:-----------------:|:----------------------:|:-----------------:|
| feedback.submitted | ● | — | — | — |
| feedback.analyzed | — | — | — | — |
| cx.risk.identified | — | ● | — | — |
| cx.insight.generated | — | — | — | ● |
| knowledge.gap.detected | — | — | ● | — |
| knowledge.article.requested | — | — | — | — |

### 2.7 System & Admin Events

| Event | workflow-health-monitor | system-config-management | user-provisioning | notification-delivery |
|-------|:----------------------:|:-----------------------:|:-----------------:|:--------------------:|
| system.workflow.started | ● | — | — | — |
| system.workflow.completed | ● | — | — | — |
| system.workflow.failed | ● | — | — | — |
| system.workflow.recovered | ● | — | — | — |
| system.workflow.dead_letter | ● | — | — | — |
| system.config.changed | — | ● | — | — |
| system.health.alert | — | — | — | ● |
| user.created | — | — | ● | — |
| notification.send | — | — | — | ● |

### 2.8 Notification Events

| Event | notification-delivery | workflow-health-monitor |
|-------|:--------------------:|:----------------------:|
| notification.send | ● | — |
| notification.failed | — | ● |
| notification.created | ● | — |

### 2.9 Integration Events

| Event | workflow-health-monitor |
|-------|:----------------------:|
| integration.error | ● |
| integration.rate_limit.reached | ● |

### 2.10 Security Events

| Event | notification-delivery | workflow-health-monitor |
|-------|:--------------------:|:----------------------:|
| security.rate_limit.exceeded | — | ● |

---

## 3. Consumer-to-Event Matrix

### 3.1 Workflow Consumers

| Workflow | Consumed Events |
|----------|----------------|
| ticket-auto-response_v2 | ticket.created |
| ticket-intake_v2 | ticket.created, ticket.classified, ticket.created.customer |
| ticket-escalation_v2 | ticket.escalated, ticket.sla_breached |
| sla-enforcement_v2 | ticket.created, ticket.status.changed |
| appointment-booking_v2 | appointment.created, ticket.classified, appointment.requested |
| appointment-reminders_v2 | appointment.confirmed, appointment.rescheduled |
| appointment-completion_v2 | appointment.completed, appointment.no_show |
| standard-dispatch_v2 | dispatch.created |
| urgent-dispatch_v2 | ticket.escalated, dispatch.declined, dispatch.escalated |
| work-order-fulfillment_v2 | work_order.created, job.completed |
| work-order-verification_v2 | work_order.completed |
| dispute-resolution_v2 | dispute.created |
| dispute-escalation_v2 | dispute.escalated |
| account-health-scan_v2 | followup.completed, dispute.resolved |
| followup-management_v2 | followup.created, appointment.completed, dispute.resolved, account.health.changed, account.risk.signal.detected |
| followup-slippage-detector_v2 | followup.missed |
| retention-campaign_v2 | account.health.changed, followup.slippage.detected, cx.risk.identified, retention.alert |
| customer-satisfaction-monitor_v2 | appointment.completed, ticket.closed, dispute.resolved |
| feedback-analysis_v2 | feedback.submitted, feedback.recorded |
| knowledge-article-lifecycle_v2 | knowledge.article.requested |
| knowledge-gap-detection_v2 | knowledge.gap.detected |
| notification-delivery_v2 | notification.send, notification.created |
| operations-coordination_v2 | task.created, dispatch.escalated, standup.escalated, analytics:anomaly.detected |
| report-generation_v2 | analytics:forecast.generated, analytics:insight.ready, analytics.trend.identified, cx.insight.generated |
| report-distribution_v2 | analytics:report.generated, report.generated |
| trend-analysis_v2 | ALL domain events (read-only) |
| anomaly-detection_v2 | ALL domain events (read-only) |
| quality-review_v2 | ticket.reply.drafted, dispute.analyzed, qa.audit.triggered |
| user-provisioning_v2 | user.created |
| system-config-management_v2 | system.config.changed |
| inventory-reorder_v2 | parts.used, inventory.requested, inventory.transaction.recorded |
| workflow-health-monitor_v2 | system.workflow.started, system.workflow.completed, system.workflow.failed, system.workflow.recovered, system.workflow.dead_letter, workflow.started, workflow.completed, workflow.failed, agent.error, offline.sync.failed, notification.failed, integration.error, security.rate_limit.exceeded |

### 3.2 Application Consumers

| Application | Consumed Events |
|-------------|----------------|
| support-center_v2 | ticket.created (via DB trigger), ticket.status.changed, ticket.assigned, ticket.classified, ticket.reply.approved, ticket.reply.rejected |
| appointment-center_v2 | appointment.created, appointment.assigned, appointment.status.changed, appointment.cancelled, appointment.completed, appointment.rescheduled, appointment.no_show, appointment.conflict_detected |
| operations-center_v2 | operation.created, operation.dispatched, operation.assigned, operation.reassigned, operation.status.changed, operation.escalated, operation.closed, technician.status.changed, operation.conflict.detected |
| technician-portal_v2 | job.accepted, job.rejected, job.completed |
| resolution-center_v2 | resolution.case.created, resolution.case.status.changed, resolution.case.closed, resolution.dispute.created, resolution.dispute.resolved, resolution.escalation.created, resolution.approval.granted, resolution.approval.denied |
| crm-center_v2 | account.health.changed, followup.created, followup.completed, followup.slippage.detected, task.created, feedback.recorded, customer.updated, customer.merged, opportunity.stage.changed, retention.alert |
| analytics-center_v2 | analytics:dashboard.refreshed, analytics:report.generated, analytics:export.completed, analytics:schedule.executed, analytics:anomaly.detected, analytics:forecast.generated, analytics:insight.ready |
| admin-center_v2 | user.created, system.config.changed, application.deployed, workflow.failed, function.failed, agent.error, integration.error, error.resolved |

---

## 4. Consumer Coverage Analysis

### 4.1 Consumer Depth

| Depth Level | Definition | Consumers |
|-------------|-----------|-----------|
| Direct | Instant synchronous consumption | Support, Appointment, Operations, Admin apps |
| Event Bus | Asynchronous consumption via event bus | All workflows |
| Broadcast | Read-only consumption of all events | trend-analysis_v2, anomaly-detection_v2 |
| Cron | Time-based, no event consumption | daily-standup_v2 |

### 4.2 Consumer Redundancy

| Event | Redundant Consumers | Risk |
|-------|--------------------|------|
| ticket.created | ticket-auto-response_v2 + ticket-intake_v2 | Duplicate processing if both respond |
| appointment.completed | customer-satisfaction-monitor_v2 + followup-management_v2 | Both consume same event — intentional fan-out |
| account.health.changed | retention-campaign_v2 + followup-management_v2 | Both consume same event — intentional fan-out |
| system.workflow.failed | workflow-health-monitor_v2 + admin-center_v2 | Admin-center logs; monitor escalates |

### 4.3 Missing Consumers

Events with no consumers (produced but never consumed):

| Event | Producer | Category | Recommendation |
|-------|----------|----------|---------------|
| `appointment.updated` | appointment-center_v2 | Application | Consider removing or add consumer |
| `appointment.batch_action` | appointment-center_v2 | Application | Confirm usage |
| `operation.status.changed` | operations-center_v2 | Application | No downstream dependency — informational |
| `operation.closed` | operations-center_v2 | Application | No downstream dependency |
| `resolution.case.created` | resolution-center_v2 | Application | Should be consumed by dispute-resolution_v2 |
| `resolution.case.status.changed` | resolution-center_v2 | Application | Informational |
| `resolution.approval.created` | resolution-center_v2 | Application | Informational |
| `evidence.uploaded` | resolution-center_v2 | Application | No downstream dependency |
| `knowledge.article.archived` | knowledge-article-lifecycle_v2 | Business | Informational |
| `knowledge.article.published` | knowledge-article-lifecycle_v2 | Business | Consider adding notification |
| `campaign.created` | retention-campaign_v2 | Business | Informational — monitor only |
| `campaign.escalated` | retention-campaign_v2 | Business | Should alert admin |
| `analytics:dashboard.refreshed` | analytics-center_v2 | Application | Informational |
| `analytics:export.completed` | analytics-center_v2 | Application | Informational — consider notification to user |
| `analytics:export.failed` | analytics-center_v2 | Application | Informational — should alert user |
| `sla.updated` | sla-enforcement_v2 | Business | Informational |
| `customer.created` | database trigger | Database | Informational |
| `customer.deleted` | database trigger | Database | Should notify admin |
| `technician.created` | database trigger | Database | Informational |
| `role.created` | database trigger | Database | Informational |
| `permission.created` | database trigger | Database | Informational |
| `feature_flag.toggled` | database trigger | Database | Should notify impacted apps |
| Audit events (all) | audit_log_v2 | Audit | Audit events are archival — consumers not expected |
| Security events (most) | Various | Security | Most are informational/archival |

---

> **End of EVENT_CONSUMERS.md**
