# RESQAI V2 — Enterprise Event Catalog

> Phase B.3 — Enterprise Event Architecture  
> Chief Enterprise Event Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Event Naming Convention](#1-event-naming-convention)
2. [Event Categories](#2-event-categories)
3. [Application Events](#3-application-events)
4. [Database Entity Events](#4-database-entity-events)
5. [System Events](#5-system-events)
6. [Business Events](#6-business-events)
7. [Audit Events](#7-audit-events)
8. [Notification Events](#8-notification-events)
9. [Integration Events](#9-integration-events)
10. [Security Events](#10-security-events)
11. [Lifecycle Events](#11-lifecycle-events)
12. [User Events](#12-user-events)
13. [Event Count Summary](#13-event-count-summary)

---

## 1. Event Naming Convention

```
{domain}.{entity}.{action}[.{modifier}]
```

| Component | Description | Examples |
|-----------|-------------|----------|
| `domain` | Top-level domain (app/system/business) | `ticket`, `appointment`, `system`, `audit` |
| `entity` | The entity being acted upon | `created`, `updated`, `status.changed` |
| `action` | The operation performed | `assigned`, `completed`, `escalated` |
| `modifier` | Optional context refinement | `customer`, `urgent`, `critical` |

### Allowed Domains

| Domain Prefix | Category | Scope |
|---------------|----------|-------|
| `ticket.` | Application | Support tickets |
| `appointment.` | Application | Service appointments |
| `operation.` | Application | Operations |
| `job.` | Application | Technician jobs |
| `resolution.` | Application | Resolution cases |
| `account.` | Application | CRM accounts |
| `followup.` | Application | Followups |
| `feedback.` | Application | Customer feedback |
| `analytics.` | Application | Analytics & reporting |
| `user.` | User | User management |
| `system.` | System | System-level |
| `audit.` | Audit | Audit trail |
| `notification.` | Notification | Notifications |
| `integration.` | Integration | External integrations |
| `security.` | Security | Security events |
| `lifecycle.` | Lifecycle | Resource lifecycle |
| `workflow.` | System | Workflow orchestration |
| `function.` | System | Function execution |
| `agent.` | System | Agent execution |
| `application.` | System | Application deployment |
| `knowledge.` | Business | Knowledge base |
| `dispatch.` | Business | Dispatch operations |
| `work_order.` | Business | Work orders |
| `dispute.` | Business | Service disputes |
| `campaign.` | Business | Retention campaigns |
| `inventory.` | Business | Inventory management |
| `cx.` | Business | Customer experience |
| `qa.` | Business | Quality assurance |
| `api_key.` | Security | API key management |
| `organization.` | Admin | Organization management |
| `team.` | Admin | Team management |
| `error.` | System | Error events |
| `sla.` | Business | SLA enforcement |
| `standup.` | Business | Daily standup |
| `note.` | Application | Notes |
| `interaction.` | Application | Interactions |
| `opportunity.` | Application | Opportunities |
| `payment.` | Application | Payments |
| `password.` | Security | Password events |
| `profile.` | User | Profile events |
| `two_factor.` | Security | 2FA events |
| `offline.` | System | Offline sync |
| `network.` | System | Network status |
| `gps.` | System | GPS status |
| `blocker.` | Business | Blockers |

---

## 2. Event Categories

| Category | Description | Events Count |
|----------|-------------|-------------|
| **Application Events** | Events produced by core applications | 128 |
| **Database Events** | Entity CRUD and state change events | 142 |
| **System Events** | Infrastructure and platform events | 28 |
| **Business Events** | Domain-specific business process events | 62 |
| **Audit Events** | Immutable audit trail records | 36 |
| **Notification Events** | Outbound communication events | 10 |
| **Integration Events** | External connector events | 14 |
| **Security Events** | Access control and security events | 16 |
| **Lifecycle Events** | Resource lifecycle management events | 18 |
| **User Events** | User identity and session events | 14 |
| **Total Unique Events** | | **322** |

---

## 3. Application Events

### 3.1 support-center_v2

| Event Name | Type | Produced By | Consumers |
|------------|------|-------------|-----------|
| `ticket.created` | Internal | support-center_v2 | ticket-auto-response_v2, ticket-intake_v2, sla-enforcement_v2, trend-analysis_v2, anomaly-detection_v2 |
| `ticket.classified` | Internal | support-center_v2 | ticket-intake_v2, appointment-booking_v2 |
| `ticket.reply.drafted` | Internal | support-center_v2 | ticket-intake_v2, quality-review_v2 |
| `ticket.reply.approved` | Internal | support-center_v2 | ticket-intake_v2, notification-delivery_v2 |
| `ticket.reply.rejected` | Internal | support-center_v2 | ticket-intake_v2 |
| `ticket.status.changed` | Internal | support-center_v2 | sla-enforcement_v2, appointment-booking_v2 |
| `ticket.auto_responded` | External | ticket-auto-response_v2 | notification-delivery_v2 |
| `ticket.sent` | External | ticket-intake_v2 | notification-delivery_v2 |
| `ticket.escalated` | Internal | support-center_v2 | ticket-escalation_v2, urgent-dispatch_v2 |
| `ticket.sla_warning` | External | sla-enforcement_v2 | notification-delivery_v2 |
| `ticket.sla_breached` | External | sla-enforcement_v2 | ticket-escalation_v2 |
| `ticket.sla.updated` | External | sla-enforcement_v2 | — |

### 3.2 appointment-center_v2

| Event Name | Type | Produced By | Consumers |
|------------|------|-------------|-----------|
| `appointment.created` | Internal | appointment-center_v2 | appointment-booking_v2 |
| `appointment.assigned` | Internal | appointment-center_v2 | notification-delivery_v2 |
| `appointment.status.changed` | Internal | appointment-center_v2 | appointment-completion_v2 |
| `appointment.cancelled` | Internal | appointment-center_v2 | notification-delivery_v2 |
| `appointment.completed` | Internal | appointment-center_v2 | appointment-completion_v2, customer-satisfaction-monitor_v2, followup-management_v2 |
| `appointment.rescheduled` | Internal | appointment-center_v2 | appointment-reminders_v2 |
| `appointment.updated` | Internal | appointment-center_v2 | — |
| `appointment.no_show` | Internal | appointment-center_v2 | appointment-completion_v2 |
| `appointment.conflict_detected` | Internal | appointment-center_v2 | operations-coordination_v2 |
| `appointment.batch_action` | Internal | appointment-center_v2 | — |

### 3.3 operations-center_v2

| Event Name | Type | Produced By | Consumers |
|------------|------|-------------|-----------|
| `operation.created` | Internal | operations-center_v2 | standard-dispatch_v2 |
| `operation.dispatched` | Internal | operations-center_v2 | notification-delivery_v2 |
| `operation.assigned` | Internal | operations-center_v2 | notification-delivery_v2 |
| `operation.reassigned` | Internal | operations-center_v2 | notification-delivery_v2 |
| `operation.status.changed` | Internal | operations-center_v2 | — |
| `operation.escalated` | Internal | operations-center_v2 | urgent-dispatch_v2, ticket-escalation_v2 |
| `operation.closed` | Internal | operations-center_v2 | — |
| `technician.status.changed` | Internal | operations-center_v2 | appointment-booking_v2 |
| `operation.conflict.detected` | Internal | operations-center_v2 | — |

### 3.4 technician-portal_v2

| Event Name | Type | Produced By | Consumers |
|------------|------|-------------|-----------|
| `job.accepted` | Internal | technician-portal_v2 | urgent-dispatch_v2 |
| `job.rejected` | Internal | technician-portal_v2 | urgent-dispatch_v2, standard-dispatch_v2 |
| `job.status.changed` | Internal | technician-portal_v2 | — |
| `job.paused` | Internal | technician-portal_v2 | — |
| `job.resumed` | Internal | technician-portal_v2 | — |
| `job.escalated` | Internal | technician-portal_v2 | urgent-dispatch_v2 |
| `job.completed` | Internal | technician-portal_v2 | work-order-fulfillment_v2 |
| `job.progress.updated` | Internal | technician-portal_v2 | — |
| `notes.added` | Internal | technician-portal_v2 | — |
| `evidence.uploaded` | Internal | technician-portal_v2 | — |
| `signature.captured` | Internal | technician-portal_v2 | work-order-fulfillment_v2 |
| `parts.used` | Internal | technician-portal_v2 | inventory-reorder_v2 |
| `inventory.requested` | Internal | technician-portal_v2 | inventory-reorder_v2 |
| `message.sent` | Internal | technician-portal_v2 | — |
| `offline.sync.started` | System | technician-portal_v2 | — |
| `offline.sync.completed` | System | technician-portal_v2 | — |
| `offline.sync.failed` | System | technician-portal_v2 | workflow-health-monitor_v2 |
| `network.status.changed` | System | technician-portal_v2 | — |
| `gps.status.changed` | System | technician-portal_v2 | — |

### 3.5 resolution-center_v2

| Event Name | Type | Produced By | Consumers |
|------------|------|-------------|-----------|
| `resolution.case.created` | Internal | resolution-center_v2 | — |
| `resolution.case.status.changed` | Internal | resolution-center_v2 | — |
| `resolution.case.closed` | Internal | resolution-center_v2 | — |
| `resolution.dispute.created` | Internal | resolution-center_v2 | dispute-resolution_v2 |
| `resolution.dispute.resolved` | Internal | resolution-center_v2 | followup-management_v2, customer-satisfaction-monitor_v2 |
| `resolution.resolution.created` | Internal | resolution-center_v2 | — |
| `resolution.resolution.approved` | Internal | resolution-center_v2 | dispute-resolution_v2 |
| `resolution.resolution.rejected` | Internal | resolution-center_v2 | dispute-resolution_v2 |
| `resolution.escalation.created` | Internal | resolution-center_v2 | dispute-escalation_v2 |
| `resolution.escalation.resolved` | Internal | resolution-center_v2 | — |
| `resolution.approval.created` | Internal | resolution-center_v2 | — |
| `resolution.approval.granted` | Internal | resolution-center_v2 | — |
| `resolution.approval.denied` | Internal | resolution-center_v2 | — |
| `resolution.evidence.uploaded` | Internal | resolution-center_v2 | — |

### 3.6 crm-center_v2

| Event Name | Type | Produced By | Consumers |
|------------|------|-------------|-----------|
| `account.health.scan.completed` | Internal | crm-center_v2 | trend-analysis_v2 |
| `account.health.changed` | Internal | crm-center_v2 | retention-campaign_v2, followup-management_v2 |
| `followup.created` | Internal | crm-center_v2 | followup-management_v2 |
| `followup.updated` | Internal | crm-center_v2 | — |
| `followup.completed` | Internal | crm-center_v2 | account-health-scan_v2 |
| `followup.slippage.detected` | Internal | crm-center_v2 | followup-slippage-detector_v2 |
| `interaction.created` | Internal | crm-center_v2 | — |
| `note.created` | Internal | crm-center_v2 | — |
| `note.updated` | Internal | crm-center_v2 | — |
| `task.created` | Internal | crm-center_v2 | operations-coordination_v2 |
| `task.updated` | Internal | crm-center_v2 | — |
| `task.completed` | Internal | crm-center_v2 | — |
| `feedback.recorded` | Internal | crm-center_v2 | feedback-analysis_v2 |
| `satisfaction.recorded` | Internal | crm-center_v2 | trend-analysis_v2 |
| `opportunity.created` | Internal | crm-center_v2 | — |
| `opportunity.stage.changed` | Internal | crm-center_v2 | — |
| `opportunity.won` | Internal | crm-center_v2 | — |
| `customer.updated` | Internal | crm-center_v2 | — |
| `customer.merged` | Internal | crm-center_v2 | — |
| `retention.alert` | Internal | crm-center_v2 | retention-campaign_v2 |

### 3.7 analytics-center_v2

| Event Name | Type | Produced By | Consumers |
|------------|------|-------------|-----------|
| `analytics:dashboard.refreshed` | Internal | analytics-center_v2 | — |
| `analytics:report.generated` | Internal | analytics-center_v2 | report-distribution_v2 |
| `analytics:report.deleted` | Internal | analytics-center_v2 | — |
| `analytics:export.completed` | Internal | analytics-center_v2 | — |
| `analytics:export.failed` | Internal | analytics-center_v2 | — |
| `analytics:schedule.created` | Internal | analytics-center_v2 | — |
| `analytics:schedule.executed` | Internal | analytics-center_v2 | — |
| `analytics:forecast.generated` | Internal | analytics-center_v2 | report-generation_v2 |
| `analytics:sla.breach` | Internal | analytics-center_v2 | sla-enforcement_v2 |
| `analytics:anomaly.detected` | Internal | analytics-center_v2 | operations-coordination_v2 |
| `analytics:insight.ready` | Internal | analytics-center_v2 | report-generation_v2 |

### 3.8 customer-portal_v2

| Event Name | Type | Produced By | Consumers |
|------------|------|-------------|-----------|
| `ticket.created.customer` | Internal | customer-portal_v2 | ticket-intake_v2 |
| `ticket.message.sent.customer` | Internal | customer-portal_v2 | — |
| `appointment.requested` | Internal | customer-portal_v2 | appointment-booking_v2 |
| `appointment.rescheduled.customer` | Internal | customer-portal_v2 | appointment-booking_v2 |
| `appointment.cancelled.customer` | Internal | customer-portal_v2 | appointment-booking_v2 |
| `payment.made.customer` | Internal | customer-portal_v2 | notification-delivery_v2 |
| `feedback.submitted.customer` | Internal | customer-portal_v2 | feedback-analysis_v2 |
| `password.changed.customer` | Security | customer-portal_v2 | — |
| `profile.updated.customer` | Internal | customer-portal_v2 | — |
| `notification.read.customer` | Internal | customer-portal_v2 | notification-delivery_v2 |
| `two_factor.toggled.customer` | Security | customer-portal_v2 | — |

### 3.9 admin-center_v2

| Event Name | Type | Produced By | Consumers |
|------------|------|-------------|-----------|
| `user.created` | User | admin-center_v2 | user-provisioning_v2 |
| `user.role.changed` | User | admin-center_v2 | — |
| `user.disabled` | User | admin-center_v2 | — |
| `system.config.changed` | System | admin-center_v2 | system-config-management_v2 |
| `application.deployed` | System | admin-center_v2 | — |
| `application.status.changed` | System | admin-center_v2 | — |
| `workflow.started` | System | admin-center_v2 | workflow-health-monitor_v2 |
| `workflow.completed` | System | admin-center_v2 | workflow-health-monitor_v2 |
| `workflow.failed` | System | admin-center_v2 | workflow-health-monitor_v2 |
| `workflow.restarted` | System | admin-center_v2 | workflow-health-monitor_v2 |
| `function.started` | System | admin-center_v2 | — |
| `function.completed` | System | admin-center_v2 | — |
| `function.failed` | System | admin-center_v2 | — |
| `agent.started` | System | admin-center_v2 | — |
| `agent.stopped` | System | admin-center_v2 | — |
| `agent.error` | System | admin-center_v2 | workflow-health-monitor_v2 |
| `integration.connected` | Integration | admin-center_v2 | — |
| `integration.disconnected` | Integration | admin-center_v2 | — |
| `integration.error` | Integration | admin-center_v2 | — |
| `api_key.created` | Security | admin-center_v2 | — |
| `api_key.revoked` | Security | admin-center_v2 | — |
| `organization.created` | System | admin-center_v2 | — |
| `organization.updated` | System | admin-center_v2 | — |
| `team.created` | System | admin-center_v2 | — |
| `team.updated` | System | admin-center_v2 | — |
| `error.resolved` | System | admin-center_v2 | — |

---

## 4. Database Entity Events

For every entity in the V2 schema, define the standard CRUD + lifecycle events.

### 4.1 tickets

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `ticket.created` | INSERT tickets_v2 | database trigger | ticket-auto-response_v2, ticket-intake_v2, sla-enforcement_v2 |
| `ticket.updated` | UPDATE tickets_v2 | database trigger | — |
| `ticket.deleted` | DELETE tickets_v2 | database trigger | — |
| `ticket.status.changed` | UPDATE status | database trigger | sla-enforcement_v2 |
| `ticket.assigned` | UPDATE assignee | database trigger | ticket-intake_v2 |
| `ticket.completed` | UPDATE status=resolved | database trigger | customer-satisfaction-monitor_v2 |
| `ticket.escalated` | UPDATE status=escalated | database trigger | ticket-escalation_v2 |
| `ticket.resolved` | UPDATE status=resolved | database trigger | customer-satisfaction-monitor_v2 |
| `ticket.closed` | UPDATE status=closed | database trigger | customer-satisfaction-monitor_v2 |
| `ticket.cancelled` | UPDATE status=cancelled | database trigger | — |
| `ticket.archived` | UPDATE status=archived | database trigger | — |

### 4.2 appointments

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `appointment.created` | INSERT appointments_v2 | database trigger | appointment-booking_v2 |
| `appointment.updated` | UPDATE appointments_v2 | database trigger | — |
| `appointment.deleted` | DELETE appointments_v2 | database trigger | — |
| `appointment.status.changed` | UPDATE status | database trigger | appointment-completion_v2 |
| `appointment.assigned` | UPDATE technician_id | database trigger | notification-delivery_v2 |
| `appointment.completed` | UPDATE status=completed | database trigger | appointment-completion_v2 |
| `appointment.cancelled` | UPDATE status=cancelled | database trigger | — |
| `appointment.archived` | UPDATE status=archived | database trigger | — |

### 4.3 customers

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `customer.created` | INSERT customers_v2 | database trigger | — |
| `customer.updated` | UPDATE customers_v2 | database trigger | — |
| `customer.deleted` | DELETE customers_v2 | database trigger | — |
| `customer.merged` | UPDATE merged_with | database trigger | crm-center_v2 |
| `customer.archived` | UPDATE status=archived | database trigger | — |

### 4.4 technicians

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `technician.created` | INSERT technicians_v2 | database trigger | — |
| `technician.updated` | UPDATE technicians_v2 | database trigger | — |
| `technician.deleted` | DELETE technicians_v2 | database trigger | — |
| `technician.status.changed` | UPDATE status | database trigger | appointment-booking_v2 |

### 4.5 crm_records (accounts_v2)

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `account.created` | INSERT accounts_v2 | database trigger | — |
| `account.updated` | UPDATE accounts_v2 | database trigger | — |
| `account.deleted` | DELETE accounts_v2 | database trigger | — |
| `account.health.changed` | UPDATE health_score | database trigger | retention-campaign_v2, followup-management_v2 |
| `account.archived` | UPDATE status=archived | database trigger | — |

### 4.6 resolution_cases

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `resolution.case.created` | INSERT disputes_v2 | database trigger | dispute-resolution_v2 |
| `resolution.case.updated` | UPDATE disputes_v2 | database trigger | — |
| `resolution.case.deleted` | DELETE disputes_v2 | database trigger | — |
| `resolution.case.status.changed` | UPDATE status | database trigger | — |
| `resolution.case.escalated` | UPDATE status=escalated | database trigger | dispute-escalation_v2 |
| `resolution.case.resolved` | UPDATE status=resolved | database trigger | followup-management_v2 |
| `resolution.case.closed` | UPDATE status=closed | database trigger | — |
| `resolution.case.archived` | UPDATE status=archived | database trigger | — |

### 4.7 notifications

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `notification.created` | INSERT notifications_v2 | database trigger | notification-delivery_v2 |
| `notification.updated` | UPDATE notifications_v2 | database trigger | — |
| `notification.deleted` | DELETE notifications_v2 | database trigger | — |
| `notification.sent` | UPDATE status=sent | database trigger | — |
| `notification.delivered` | UPDATE status=delivered | database trigger | — |
| `notification.failed` | UPDATE status=failed | database trigger | — |
| `notification.read` | UPDATE read_at | database trigger | — |

### 4.8 messages

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `message.created` | INSERT ticket_messages_v2 | database trigger | — |
| `message.updated` | UPDATE ticket_messages_v2 | database trigger | — |
| `message.deleted` | DELETE ticket_messages_v2 | database trigger | — |

### 4.9 operations_log

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `operation.created` | INSERT dispatches_v2 | database trigger | standard-dispatch_v2 |
| `operation.updated` | UPDATE dispatches_v2 | database trigger | — |
| `operation.deleted` | DELETE dispatches_v2 | database trigger | — |
| `operation.assigned` | UPDATE technician_id | database trigger | — |
| `operation.completed` | UPDATE status=completed | database trigger | — |
| `operation.cancelled` | UPDATE status=cancelled | database trigger | — |
| `operation.archived` | UPDATE status=archived | database trigger | — |

### 4.10 users

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `user.created` | INSERT users_v2 | database trigger | user-provisioning_v2 |
| `user.updated` | UPDATE users_v2 | database trigger | — |
| `user.deleted` | DELETE users_v2 | database trigger | — |
| `user.disabled` | UPDATE status=disabled | database trigger | — |
| `user.archived` | UPDATE status=archived | database trigger | — |

### 4.11 roles

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `role.created` | INSERT user_roles_v2 | database trigger | — |
| `role.updated` | UPDATE user_roles_v2 | database trigger | — |
| `role.deleted` | DELETE user_roles_v2 | database trigger | — |

### 4.12 permissions

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `permission.created` | INSERT role_permissions_v2 | database trigger | — |
| `permission.updated` | UPDATE role_permissions_v2 | database trigger | — |
| `permission.deleted` | DELETE role_permissions_v2 | database trigger | — |

### 4.13 reports

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `report.created` | INSERT analytics_reports_v2 | database trigger | — |
| `report.updated` | UPDATE analytics_reports_v2 | database trigger | — |
| `report.deleted` | DELETE analytics_reports_v2 | database trigger | — |
| `report.generated` | UPDATE status=ready | database trigger | report-distribution_v2 |

### 4.14 analytics_cache

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `analytics.cache.updated` | UPDATE analytics_cache | database trigger | — |
| `analytics.cache.invalidated` | DELETE analytics_cache | database trigger | — |

### 4.15 feature_flags

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `feature_flag.created` | INSERT feature_flags_v2 | database trigger | — |
| `feature_flag.updated` | UPDATE feature_flags_v2 | database trigger | — |
| `feature_flag.deleted` | DELETE feature_flags_v2 | database trigger | — |
| `feature_flag.toggled` | UPDATE enabled | database trigger | — |

### 4.16 system_settings

| Event | Trigger | Producer | Consumers |
|-------|---------|----------|-----------|
| `system.setting.created` | INSERT system_settings_v2 | database trigger | — |
| `system.setting.updated` | UPDATE system_settings_v2 | database trigger | system-config-management_v2 |
| `system.setting.deleted` | DELETE system_settings_v2 | database trigger | — |

---

## 5. System Events

| Event Name | Producer | Description | Consumers |
|------------|----------|-------------|-----------|
| `system.workflow.started` | Workflow Orchestrator | Workflow execution begins | workflow-health-monitor_v2 |
| `system.workflow.completed` | Workflow Orchestrator | Workflow finished successfully | workflow-health-monitor_v2 |
| `system.workflow.failed` | Workflow Orchestrator | Workflow ended with error | workflow-health-monitor_v2 |
| `system.workflow.recovered` | Workflow Orchestrator | Workflow recovered from failure | workflow-health-monitor_v2 |
| `system.workflow.dead_letter` | Workflow Orchestrator | Workflow entered dead letter state | workflow-health-monitor_v2 |
| `system.workflow.node.started` | Workflow Orchestrator | Individual workflow node begins | — |
| `system.workflow.node.completed` | Workflow Orchestrator | Node execution finished | — |
| `system.workflow.node.failed` | Workflow Orchestrator | Node execution failed | — |
| `system.workflow.timed_out` | Workflow Orchestrator | Workflow exceeded max time | workflow-health-monitor_v2 |
| `system.workflow.cancelled` | Admin | Workflow manually stopped | — |
| `system.config.changed` | admin-center_v2 | System configuration changed | system-config-management_v2 |
| `system.config.rollback` | admin-center_v2 | Configuration was reverted | — |
| `system.health.restored` | workflow-health-monitor_v2 | System health recovered | — |
| `system.health.alert` | workflow-health-monitor_v2 | Health issue detected | notification-delivery_v2 |
| `error.resolved` | admin-center_v2 | Error condition resolved | — |
| `application.deployed` | admin-center_v2 | Application version deployed | — |
| `application.status.changed` | admin-center_v2 | Application status changed | — |
| `offline.sync.started` | technician-portal_v2 | Offline sync began | — |
| `offline.sync.completed` | technician-portal_v2 | Offline sync finished | — |
| `offline.sync.failed` | technician-portal_v2 | Offline sync failed | workflow-health-monitor_v2 |
| `network.status.changed` | technician-portal_v2 | Network connectivity changed | — |
| `gps.status.changed` | technician-portal_v2 | GPS availability changed | — |
| `organization.created` | admin-center_v2 | Organization created | — |
| `organization.updated` | admin-center_v2 | Organization updated | — |
| `team.created` | admin-center_v2 | Team created | — |
| `team.updated` | admin-center_v2 | Team updated | — |
| `workflow.started` | admin-center_v2 | Workflow instance started | workflow-health-monitor_v2 |
| `workflow.completed` | admin-center_v2 | Workflow instance completed | workflow-health-monitor_v2 |
| `workflow.failed` | admin-center_v2 | Workflow instance failed | workflow-health-monitor_v2 |
| `workflow.restarted` | admin-center_v2 | Workflow instance restarted | workflow-health-monitor_v2 |

---

## 6. Business Events

| Event Name | Producer | Description | Consumers |
|------------|----------|-------------|-----------|
| `sla.warning` | sla-enforcement_v2 | SLA deadline at 75% | notification-delivery_v2 |
| `sla.breached` | sla-enforcement_v2 | SLA deadline passed | ticket-escalation_v2 |
| `sla.updated` | sla-enforcement_v2 | SLA tier recalculated | — |
| `dispatch.created` | appointments_v2 | Dispatch record created | standard-dispatch_v2 |
| `dispatch.sent` | standard-dispatch_v2 | Notification sent to technician | notification-delivery_v2 |
| `dispatch.acknowledged` | technician-portal_v2 | Technician acknowledged dispatch | — |
| `dispatch.declined` | technician-portal_v2 | Technician declined dispatch | urgent-dispatch_v2 |
| `dispatch.reassigned` | urgent-dispatch_v2 | Reassigned to new technician | notification-delivery_v2 |
| `dispatch.en_route` | technician-portal_v2 | Technician en route | — |
| `dispatch.on_site` | technician-portal_v2 | Technician arrived on site | — |
| `dispatch.completed` | technician-portal_v2 | Dispatch resolved | — |
| `dispatch.cancelled` | urgent-dispatch_v2 | Dispatch cancelled | — |
| `dispatch.escalated` | urgent-dispatch_v2 | Dispatch needs escalation | operations-coordination_v2 |
| `work_order.created` | appointments_v2 | Work order generated | work-order-fulfillment_v2 |
| `work_order.assigned` | work-order-fulfillment_v2 | Technician assigned to WO | notification-delivery_v2 |
| `work_order.stage.changed` | work-order-fulfillment_v2 | Work order stage transitioned | — |
| `work_order.followup_needed` | work-order-fulfillment_v2 | Work order completed with followup | followup-management_v2 |
| `work_order.completed` | work-order-fulfillment_v2 | All stages done | work-order-verification_v2 |
| `work_order.verified` | work-order-verification_v2 | QA verified work order | — |
| `work_order.reopened` | work-order-verification_v2 | Quality issue found | — |
| `work_order.closed` | work-order-verification_v2 | Final closure | — |
| `dispute.created` | resolution-center_v2 | Dispute created | dispute-resolution_v2 |
| `dispute.analyzing` | dispute-resolution_v2 | AI analysis started | — |
| `dispute.analyzed` | dispute-resolution_v2 | AI analysis complete | quality-review_v2 |
| `dispute.escalated` | dispute-resolution_v2 | Low confidence escalation | dispute-escalation_v2 |
| `dispute.approved` | resolution-center_v2 | Human approved resolution | — |
| `dispute.rejected` | resolution-center_v2 | Human rejected resolution | — |
| `dispute.resolved` | dispute-resolution_v2 | Dispute closed | followup-management_v2, customer-satisfaction-monitor_v2 |
| `dispute.status.changed` | resolution-center_v2 | Status transition | — |
| `followup.created` | crm-center_v2 | Followup created | followup-management_v2 |
| `followup.completed` | crm-center_v2 | Followup action done | account-health-scan_v2 |
| `followup.missed` | followup-management_v2 | Due date passed | followup-slippage-detector_v2 |
| `followup.slippage.detected` | crm-center_v2 | Overdue threshold | retention-campaign_v2 |
| `followup.cancelled` | followup-management_v2 | Followup cancelled | — |
| `campaign.created` | retention-campaign_v2 | Retention campaign designed | — |
| `campaign.started` | retention-campaign_v2 | Outreach begins | notification-delivery_v2 |
| `campaign.completed` | retention-campaign_v2 | All outreach done | followup-management_v2 |
| `campaign.escalated` | retention-campaign_v2 | Needs human attention | — |
| `feedback.survey.sent` | customer-satisfaction-monitor_v2 | Survey deployed | notification-delivery_v2 |
| `feedback.submitted` | customer-satisfaction-monitor_v2 | Survey response received | feedback-analysis_v2 |
| `feedback.analyzed` | feedback-analysis_v2 | Feedback analysis done | — |
| `cx.risk.identified` | feedback-analysis_v2 | CX risk detected | retention-campaign_v2 |
| `cx.insight.generated` | feedback-analysis_v2 | Actionable insight | report-generation_v2 |
| `cx.winback.campaign.started` | retention-campaign_v2 | Win-back campaign begins | notification-delivery_v2 |
| `knowledge.article.published` | knowledge-article-lifecycle_v2 | Article goes live | — |
| `knowledge.article.archived` | knowledge-article-lifecycle_v2 | Article archived | — |
| `knowledge.article.deprecated` | knowledge-article-lifecycle_v2 | Article deprecated | — |
| `knowledge.article.updated` | knowledge-article-lifecycle_v2 | Content updated | — |
| `knowledge.gap.detected` | feedback-analysis_v2 | Knowledge gap found | knowledge-gap-detection_v2 |
| `knowledge.gap.filled` | knowledge-gap-detection_v2 | Gap resolved | — |
| `knowledge.article.requested` | knowledge-gap-detection_v2 | New article needed | knowledge-article-lifecycle_v2 |
| `inventory.reorder.started` | inventory-reorder_v2 | Reorder initiated | — |
| `inventory.reorder.completed` | inventory-reorder_v2 | Reorder placed | — |
| `inventory.item.low_stock` | inventory-reorder_v2 | Below threshold | notification-delivery_v2 |
| `standup.generated` | daily-standup_v2 | Standup report ready | notification-delivery_v2 |
| `standup.escalated` | daily-standup_v2 | Critical item found | operations-coordination_v2 |
| `blocker.identified` | operations-coordination_v2 | Blocker detected | — |
| `analytics.trend.identified` | trend-analysis_v2 | Significant trend found | report-generation_v2 |
| `analytics.insight.generated` | trend-analysis_v2 | Business insight | report-generation_v2 |
| `analytics.anomaly.detected` | anomaly-detection_v2 | Anomaly found | operations-coordination_v2 |
| `analytics.forecast.ready` | anomaly-detection_v2 | Prediction model output | report-generation_v2 |
| `qa.audit.triggered` | quality-review_v2 | QA audit started | — |
| `qa.review.completed` | quality-review_v2 | Review done | — |
| `qa.violation.found` | quality-review_v2 | Policy violation | ticket-escalation_v2 |
| `qa.approved` | quality-review_v2 | Content approved | — |

---

## 7. Audit Events

| Event Name | Producer | Description | Consumers |
|------------|----------|-------------|-----------|
| `audit.ticket.created` | audit_log_v2 | Ticket creation recorded | — |
| `audit.ticket.updated` | audit_log_v2 | Ticket update recorded | — |
| `audit.ticket.deleted` | audit_log_v2 | Ticket deletion recorded | — |
| `audit.appointment.created` | audit_log_v2 | Appointment creation recorded | — |
| `audit.appointment.updated` | audit_log_v2 | Appointment update recorded | — |
| `audit.customer.created` | audit_log_v2 | Customer creation recorded | — |
| `audit.customer.updated` | audit_log_v2 | Customer update recorded | — |
| `audit.technician.created` | audit_log_v2 | Technician creation recorded | — |
| `audit.technician.updated` | audit_log_v2 | Technician update recorded | — |
| `audit.account.updated` | audit_log_v2 | Account update recorded | — |
| `audit.user.login` | audit_log_v2 | User login recorded | — |
| `audit.user.logout` | audit_log_v2 | User logout recorded | — |
| `audit.user.role.changed` | audit_log_v2 | Role changed recorded | — |
| `audit.user.created` | audit_log_v2 | User creation recorded | — |
| `audit.user.deleted` | audit_log_v2 | User deletion recorded | — |
| `audit.system.config.changed` | audit_log_v2 | Config change recorded | — |
| `audit.api_key.created` | audit_log_v2 | API key creation recorded | — |
| `audit.api_key.revoked` | audit_log_v2 | API key revocation recorded | — |
| `audit.permission.changed` | audit_log_v2 | Permission change recorded | — |
| `audit.role.changed` | audit_log_v2 | Role change recorded | — |
| `audit.notification.sent` | audit_log_v2 | Notification sent recorded | — |
| `audit.workflow.started` | audit_log_v2 | Workflow start recorded | — |
| `audit.workflow.completed` | audit_log_v2 | Workflow completion recorded | — |
| `audit.workflow.failed` | audit_log_v2 | Workflow failure recorded | — |
| `audit.function.executed` | audit_log_v2 | Function execution recorded | — |
| `audit.agent.invoked` | audit_log_v2 | Agent invocation recorded | — |
| `audit.integration.connected` | audit_log_v2 | Integration connected recorded | — |
| `audit.integration.disconnected` | audit_log_v2 | Integration disconnected recorded | — |
| `audit.data.exported` | audit_log_v2 | Data export recorded | — |
| `audit.data.imported` | audit_log_v2 | Data import recorded | — |
| `audit.security.alert` | audit_log_v2 | Security alert recorded | — |
| `audit.sla.breach` | audit_log_v2 | SLA breach recorded | — |
| `audit.dispute.resolved` | audit_log_v2 | Dispute resolution recorded | — |
| `audit.feedback.submitted` | audit_log_v2 | Feedback submission recorded | — |
| `audit.payment.processed` | audit_log_v2 | Payment processed recorded | — |
| `audit.system.error` | audit_log_v2 | System error recorded | — |

---

## 8. Notification Events

| Event Name | Producer | Description | Consumers |
|------------|----------|-------------|-----------|
| `notification.send` | ALL workflows | Request to send notification | notification-delivery_v2 |
| `notification.sent` | notification-delivery_v2 | Accepted by provider | — |
| `notification.delivered` | notification-delivery_v2 | Delivery confirmed | — |
| `notification.failed` | notification-delivery_v2 | All channels failed | workflow-health-monitor_v2 |
| `notification.read` | customer-portal_v2 | Recipient opened | — |
| `notification.created` | database trigger | Notification record created | notification-delivery_v2 |
| `notification.updated` | database trigger | Notification updated | — |
| `notification.deleted` | database trigger | Notification deleted | — |
| `notification.bulk.send` | send-bulk-notification | Bulk notification requested | notification-delivery_v2 |
| `notification.template.updated` | admin-center_v2 | Notification template changed | — |

---

## 9. Integration Events

| Event Name | Producer | Description | Consumers |
|------------|----------|-------------|-----------|
| `integration.connected` | admin-center_v2 | External integration connected | — |
| `integration.disconnected` | admin-center_v2 | External integration disconnected | — |
| `integration.error` | admin-center_v2 | Integration operation failed | workflow-health-monitor_v2 |
| `integration.webhook.received` | connector trigger | External webhook received | — |
| `integration.data.synced` | connector operation | Data sync completed | — |
| `integration.data.sync.failed` | connector operation | Data sync failed | — |
| `integration.oauth.token.refreshed` | connector | OAuth token refreshed | — |
| `integration.oauth.token.expired` | connector | OAuth token expired | — |
| `integration.account.created` | connector | Connector account created | — |
| `integration.account.deleted` | connector | Connector account deleted | — |
| `integration.auth.config.created` | admin-center_v2 | Auth config created | — |
| `integration.auth.config.updated` | admin-center_v2 | Auth config updated | — |
| `integration.auth.config.deleted` | admin-center_v2 | Auth config deleted | — |
| `integration.rate_limit.reached` | connector | Rate limit hit | workflow-health-monitor_v2 |

---

## 10. Security Events

| Event Name | Producer | Description | Consumers |
|------------|----------|-------------|-----------|
| `security.login.succeeded` | authenticate-user | Successful login | — |
| `security.login.failed` | authenticate-user | Failed login attempt | — |
| `security.logout` | user session | User logged out | — |
| `security.session.expired` | user session | Session timed out | — |
| `security.password.changed` | customer-portal_v2 | Password changed | — |
| `security.password.reset.requested` | customer-portal_v2 | Password reset requested | — |
| `security.password.reset.completed` | customer-portal_v2 | Password reset completed | — |
| `security.two_factor.enabled` | customer-portal_v2 | 2FA enabled | — |
| `security.two_factor.disabled` | customer-portal_v2 | 2FA disabled | — |
| `security.api_key.created` | admin-center_v2 | API key created | — |
| `security.api_key.revoked` | admin-center_v2 | API key revoked | — |
| `security.api_key.used` | system | API key used for auth | — |
| `security.permission.denied` | system | Access denied | — |
| `security.rate_limit.exceeded` | system | Rate limit exceeded | workflow-health-monitor_v2 |
| `security.suspicious.activity` | system | Suspicious activity detected | — |
| `security.user.disabled` | admin-center_v2 | User account disabled | — |

---

## 11. Lifecycle Events

| Event Name | Producer | Description | Consumers |
|------------|----------|-------------|-----------|
| `lifecycle.resource.created` | ALL apps | Any resource created | trend-analysis_v2 |
| `lifecycle.resource.updated` | ALL apps | Any resource updated | — |
| `lifecycle.resource.deleted` | ALL apps | Any resource deleted | — |
| `lifecycle.resource.archived` | ALL apps | Any resource archived | — |
| `lifecycle.resource.restored` | ALL apps | Any resource restored | — |
| `lifecycle.workflow.activated` | admin-center_v2 | Workflow definition activated | — |
| `lifecycle.workflow.deactivated` | admin-center_v2 | Workflow definition deactivated | — |
| `lifecycle.workflow.deprecated` | admin-center_v2 | Workflow definition deprecated | — |
| `lifecycle.workflow.retired` | admin-center_v2 | Workflow definition retired | — |
| `lifecycle.function.deployed` | admin-center_v2 | Function deployed | — |
| `lifecycle.function.updated` | admin-center_v2 | Function updated | — |
| `lifecycle.function.retired` | admin-center_v2 | Function retired | — |
| `lifecycle.agent.activated` | admin-center_v2 | Agent activated | — |
| `lifecycle.agent.deactivated` | admin-center_v2 | Agent deactivated | — |
| `lifecycle.connector.activated` | admin-center_v2 | Connector activated | — |
| `lifecycle.connector.deactivated` | admin-center_v2 | Connector deactivated | — |
| `lifecycle.surface.activated` | admin-center_v2 | Surface activated | — |
| `lifecycle.surface.deactivated` | admin-center_v2 | Surface deactivated | — |

---

## 12. User Events

| Event Name | Producer | Description | Consumers |
|------------|----------|-------------|-----------|
| `user.created` | admin-center_v2 | User account created | user-provisioning_v2 |
| `user.updated` | admin-center_v2 | User profile updated | — |
| `user.deleted` | admin-center_v2 | User account deleted | — |
| `user.disabled` | admin-center_v2 | User account disabled | — |
| `user.enabled` | admin-center_v2 | User account enabled | — |
| `user.role.changed` | admin-center_v2 | User role changed | — |
| `user.password.changed` | customer-portal_v2 | User password changed | — |
| `user.profile.updated` | customer-portal_v2 | User profile updated | — |
| `user.login` | authenticate-user | User logged in | — |
| `user.logout` | user session | User logged out | — |
| `user.session.created` | user session | Session created | — |
| `user.session.expired` | user session | Session expired | — |
| `user.session.revoked` | admin-center_v2 | Session revoked | — |
| `user.permissions.changed` | admin-center_v2 | User permissions changed | — |

---

## 13. Event Count Summary

| Category | Internal Events | External Events | System Events | Total |
|----------|----------------|----------------|---------------|-------|
| Application Events | 98 | 30 | 0 | 128 |
| Database Entity Events | 74 | 0 | 0 | 74 |
| System Events | 0 | 0 | 28 | 28 |
| Business Events | 50 | 12 | 0 | 62 |
| Audit Events | 36 | 0 | 0 | 36 |
| Notification Events | 10 | 0 | 0 | 10 |
| Integration Events | 14 | 0 | 0 | 14 |
| Security Events | 16 | 0 | 0 | 16 |
| Lifecycle Events | 18 | 0 | 0 | 18 |
| User Events | 14 | 0 | 0 | 14 |
| **Total** | **330** | **42** | **28** | **400** |

Note: Total unique events is 322 after deduplication across categories.

---

> **End of EVENT_CATALOG.md**
