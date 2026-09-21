# RESQAI V2 — Workflow Event Catalog

> Phase 1.4 — Architecture Only  
> Chief Workflow Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Event Naming Convention](#1-event-naming-convention)
2. [Workflow Domain Events Produced](#2-workflow-domain-events-produced)
3. [Workflow Domain Events Consumed](#3-workflow-domain-events-consumed)
4. [Workflow System Events](#4-workflow-system-events)
5. [Event-to-Workflow Routing](#5-event-to-workflow-routing)
6. [Complete Event Summary](#6-complete-event-summary)

---

## 1. Event Naming Convention

Workflow events follow the same convention as the V2 event catalog:

```
{entity}.{action}[.{modifier}]
```

Workflow-specific events use the prefix `workflow.`:

| Prefix | Entity |
|--------|--------|
| `workflow.` | Workflow instance |
| `ticket.` | tickets_v2 |
| `appointment.` | appointments_v2 |
| `dispatch.` | dispatches_v2 |
| `dispute.` | disputes_v2 |
| `account.` | accounts_v2 |
| `followup.` | followups_v2 |
| `feedback.` | feedback_v2 |
| `knowledge.` | knowledge_articles_v2 |
| `analytics.` | Analytics results |
| `report.` | Analytics reports |
| `qa.` | Quality assurance |
| `system.` | System-level events |
| `campaign.` | Retention campaigns |

---

## 2. Workflow Domain Events Produced

### 2.1 Ticket Lifecycle Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `ticket.auto_responded` | `ticket-auto-response_v2` | FAQ auto-response sent | ticket_id, article_id, confidence |
| `ticket.classified` | `ticket-intake_v2` (via agent) | Classification complete | ticket_id, request_type, urgency, confidence |
| `ticket.reply.drafted` | `ticket-intake_v2` (via agent) | AI draft created | ticket_id, draft_text, confidence |
| `ticket.reply.approved` | `ticket-intake_v2` | Human approved draft | ticket_id, approved_by, approved_at |
| `ticket.reply.rejected` | `ticket-intake_v2` | Human rejected draft | ticket_id, rejected_by, reason |
| `ticket.status.changed` | `ticket-intake_v2` | Any status transition | ticket_id, old_status, new_status |
| `ticket.sent` | `ticket-intake_v2` | Reply sent to customer | ticket_id, channel, sent_at |
| `ticket.escalated` | `ticket-escalation_v2` | Ticket escalated | ticket_id, escalation_level, reason, target |
| `ticket.escalation.resolved` | `ticket-escalation_v2` | Escalation resolved | ticket_id, resolution, resolved_by |
| `ticket.sla_warning` | `sla-enforcement_v2` | 75% of SLA deadline | ticket_id, sla_tier, deadline, time_remaining |
| `ticket.sla_breached` | `sla-enforcement_v2` | SLA deadline passed | ticket_id, sla_tier, deadline, breach_duration |
| `ticket.sla.updated` | `sla-enforcement_v2` | SLA recalculated | ticket_id, sla_tier, new_deadline |

### 2.2 Appointment Lifecycle Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `appointment.assigned` | `appointment-booking_v2` | Technician assigned | appointment_id, technician_id, skill_match_score |
| `appointment.confirmed` | `appointment-booking_v2` | Customer confirmed | appointment_id, confirmed_at |
| `appointment.rescheduled` | `appointment-booking_v2` | Appointment rescheduled | appointment_id, old_date, new_date, reason |
| `appointment.reminder.sent` | `appointment-reminders_v2` | Reminder delivered | appointment_id, reminder_type, channel, status |
| `appointment.reminder.failed` | `appointment-reminders_v2` | Reminder delivery failed | appointment_id, reminder_type, channel, error |
| `appointment.completed` | `appointment-completion_v2` | Appointment finished | appointment_id, completed_at, work_order_id |
| `appointment.no_show` | `appointment-completion_v2` | Customer no-show | appointment_id, technician_id, wait_duration |
| `appointment.status.changed` | `appointment-completion_v2` | Status transition | appointment_id, old_status, new_status |
| `appointment.feedback.triggered` | `appointment-completion_v2` | Survey sent | appointment_id, survey_id |

### 2.3 Dispatch Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `dispatch.created` | `urgent-dispatch_v2`, `standard-dispatch_v2` | Dispatch record created | dispatch_id, ticket_id, type |
| `dispatch.sent` | `urgent-dispatch_v2`, `standard-dispatch_v2` | Notification sent to tech | dispatch_id, technician_id, channel |
| `dispatch.acknowledged` | `urgent-dispatch_v2`, `standard-dispatch_v2` | Tech acknowledged | dispatch_id, technician_id, acknowledged_at |
| `dispatch.declined` | `urgent-dispatch_v2`, `standard-dispatch_v2` | Tech declined | dispatch_id, technician_id, reason |
| `dispatch.reassigned` | `urgent-dispatch_v2` | Reassigned to new tech | dispatch_id, old_tech, new_tech, reason |
| `dispatch.en_route` | `urgent-dispatch_v2` | Tech en route | dispatch_id, technician_id, eta_minutes |
| `dispatch.on_site` | `urgent-dispatch_v2` | Tech arrived on site | dispatch_id, technician_id, arrived_at |
| `dispatch.completed` | `urgent-dispatch_v2` | Dispatch resolved | dispatch_id, technician_id, completed_at |
| `dispatch.cancelled` | `urgent-dispatch_v2` | Dispatch cancelled | dispatch_id, reason, cancelled_by |
| `dispatch.escalated` | `urgent-dispatch_v2` | Dispatch needs escalation | dispatch_id, reason, escalation_level |

### 2.4 Work Order Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `work_order.created` | `appointment-completion_v2` | Work order generated | work_order_id, appointment_id, technician_id |
| `work_order.assigned` | `work-order-fulfillment_v2` | Tech assigned to WO | work_order_id, technician_id, stage |
| `work_order.stage.changed` | `work-order-fulfillment_v2` | Any stage transition | work_order_id, old_stage, new_stage, notes |
| `work_order.followup_needed` | `work-order-fulfillment_v2` | WO completed with f/up | work_order_id, followup_reason |
| `work_order.completed` | `work-order-fulfillment_v2` | All stages done | work_order_id, completed_at, parts_used |
| `work_order.verified` | `work-order-verification_v2` | QA verified | work_order_id, verified_by, score |
| `work_order.reopened` | `work-order-verification_v2` | Quality issue found | work_order_id, reason, reopened_by |
| `work_order.closed` | `work-order-verification_v2` | Final closure | work_order_id, closed_at |

### 2.5 Dispute Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `dispute.analyzing` | `dispute-resolution_v2` | AI analysis started | dispute_id, analysis_started_at |
| `dispute.analyzed` | `dispute-resolution_v2` (via agent) | AI analysis complete | dispute_id, confidence, recommendation |
| `dispute.escalated` | `dispute-resolution_v2` | Low confidence escalation | dispute_id, confidence, reason |
| `dispute.approved` | `dispute-resolution_v2` | Human approved resolution | dispute_id, resolution, approved_by |
| `dispute.rejected` | `dispute-resolution_v2` | Human rejected resolution | dispute_id, reason, rejected_by |
| `dispute.resolved` | `dispute-resolution_v2`, `dispute-escalation_v2` | Dispute closed | dispute_id, resolution, resolved_at |
| `dispute.status.changed` | `dispute-resolution_v2` | Any status transition | dispute_id, old_status, new_status |

### 2.6 Account Health Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `account.health.scan.completed` | `account-health-scan_v2` | Full scan done | scan_id, accounts_scanned, errors |
| `account.health.changed` | `account-health-scan_v2` | Health category changed | account_id, old_health, new_health, old_score, new_score |
| `account.risk.signal.detected` | `account-health-scan_v2` | New risk found | account_id, risk_factor, severity |
| `account.relationship.changed` | `account-health-scan_v2` | Relationship status | account_id, old_status, new_status |

### 2.7 Followup Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `followup.completed` | `followup-management_v2` | Followup action done | followup_id, completed_by, outcome |
| `followup.missed` | `followup-management_v2` | Due date passed | followup_id, due_date, days_overdue |
| `followup.slippage.detected` | `followup-slippage-detector_v2` | Overdue threshold | followup_id, severity, days_overdue |
| `followup.cancelled` | `followup-management_v2` | Followup cancelled | followup_id, reason |

### 2.8 Campaign Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `campaign.created` | `retention-campaign_v2` | Campaign designed | campaign_id, account_id, campaign_type |
| `campaign.started` | `retention-campaign_v2` | Outreach begins | campaign_id, channels, offer |
| `campaign.completed` | `retention-campaign_v2` | All outreach done | campaign_id, response_count, outcome |
| `campaign.escalated` | `retention-campaign_v2` | Needs human attention | campaign_id, reason |

### 2.9 Customer Experience Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `feedback.survey.sent` | `customer-satisfaction-monitor_v2` | Survey deployed | survey_id, customer_id, service_event_id |
| `feedback.submitted` | `customer-satisfaction-monitor_v2` | Survey response received | feedback_id, score, sentiment (set by feedback-analysis) |
| `feedback.analyzed` | `feedback-analysis_v2` | Feedback analysis done | feedback_id, sentiment, topics, risk_level |
| `cx.risk.identified` | `feedback-analysis_v2` | CX risk detected | feedback_id, risk_type, severity |
| `cx.insight.generated` | `feedback-analysis_v2` | Actionable insight | insight_id, topic, recommendation |
| `cx.winback.campaign.started` | `retention-campaign_v2` | Win-back begins | campaign_id, account_id, segment |

### 2.10 Knowledge Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `knowledge.article.published` | `knowledge-article-lifecycle_v2` | Article goes live | article_id, category, version |
| `knowledge.article.archived` | `knowledge-article-lifecycle_v2` | Article archived | article_id, reason |
| `knowledge.article.deprecated` | `knowledge-article-lifecycle_v2` | Article deprecated | article_id, replacement_id |
| `knowledge.article.updated` | `knowledge-article-lifecycle_v2` | Content updated | article_id, version, updated_by |
| `knowledge.gap.detected` | `knowledge-gap-detection_v2` | Knowledge gap found | gap_id, query_text, frequency |
| `knowledge.gap.filled` | `knowledge-gap-detection_v2` | Gap resolved | gap_id, article_id |
| `knowledge.article.requested` | `knowledge-gap-detection_v2` | New article needed | request_id, topic, priority |

### 2.11 Notification Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `notification.send` | ALL workflows | Request to send | notification_id, recipient, type, template, channel |
| `notification.sent` | `notification-delivery_v2` | Accepted by provider | notification_id, channel, provider_id |
| `notification.delivered` | `notification-delivery_v2` | Delivery confirmed | notification_id, channel, delivered_at |
| `notification.failed` | `notification-delivery_v2` | All channels failed | notification_id, error, last_attempt |
| `notification.read` | `notification-delivery_v2` | Recipient opened | notification_id, read_at |

### 2.12 Operations Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `standup.generated` | `daily-standup_v2` | Standup report ready | standup_id, generated_at, kpi_summary |
| `standup.escalated` | `daily-standup_v2` | Critical item found | standup_id, item_count, priorities |
| `task.created` | `operations-coordination_v2` | New task created | task_id, title, priority, owner |
| `task.assigned` | `operations-coordination_v2` | Task assigned | task_id, owner, assigned_by |
| `blocker.identified` | `operations-coordination_v2` | Blocker detected | blocker_id, entity_type, entity_id, description |

### 2.13 Analytics & Reporting Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `analytics.trend.identified` | `trend-analysis_v2` | Significant trend found | trend_id, metric, direction, magnitude, significance |
| `analytics.insight.generated` | `trend-analysis_v2` | Business insight | insight_id, domain, recommendation |
| `analytics.anomaly.detected` | `anomaly-detection_v2` | Anomaly found | anomaly_id, metric, severity, deviation |
| `analytics.anomaly.investigated` | `anomaly-detection_v2` | Root cause identified | anomaly_id, root_cause, confirmed |
| `analytics.forecast.ready` | `predictive-modeler_v2` | Prediction model output | forecast_id, metric, predictions, confidence_interval |
| `report.generated` | `report-generation_v2` | Report ready | report_id, type, format, generated_at |
| `report.distributed` | `report-distribution_v2` | Report delivered | report_id, recipient_count, channels |
| `report.distribution.failed` | `report-distribution_v2` | Delivery failed | report_id, recipient, channel, error |

### 2.14 Quality Assurance Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `qa.audit.triggered` | `quality-review_v2` | QA started | audit_id, entity_type, entity_id, reason |
| `qa.review.completed` | `quality-review_v2` | Review done | audit_id, score, findings, pass/fail |
| `qa.violation.found` | `quality-review_v2` | Policy violation | violation_id, policy, severity, entity_id |
| `qa.approved` | `quality-review_v2` | Content approved | entity_id, entity_type, approved_by |

### 2.15 Administration Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `user.provisioned` | `user-provisioning_v2` | User setup complete | user_id, role, permissions |
| `user.suspended` | `user-provisioning_v2` | User deactivated | user_id, reason |
| `user.deleted` | `user-provisioning_v2` | User removed | user_id, deleted_by |
| `system.config.changed` | `system-config-management_v2` | Config applied | setting_key, old_value, new_value, changed_by |
| `system.config.rollback` | `system-config-management_v2` | Config reverted | setting_key, reason, rolled_back_by |

### 2.16 Inventory Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `inventory.reorder.started` | `inventory-reorder_v2` | Reorder initiated | item_id, quantity, supplier, requested_at |
| `inventory.reorder.completed` | `inventory-reorder_v2` | Reorder placed | item_id, order_id, expected_delivery |
| `inventory.item.low_stock` | `inventory-reorder_v2` | Below threshold | item_id, current_qty, threshold, reorder_qty |

### 2.17 Workflow System Events

| Event | Produced By | When | Payload Highlights |
|-------|-------------|------|--------------------|
| `system.workflow.started` | `workflow-orchestrator_v2` | Workflow instance begins | workflow_name, instance_id, correlation_id |
| `system.workflow.completed` | `workflow-orchestrator_v2` | Workflow finishes | workflow_name, instance_id, duration, result |
| `system.workflow.failed` | `workflow-orchestrator_v2` | Workflow errors out | workflow_name, instance_id, error_node, error |
| `system.workflow.recovered` | `workflow-health-monitor_v2` | Recovery successful | workflow_name, instance_id, recovery_action |
| `system.workflow.dead_letter` | `workflow-health-monitor_v2` | Unrecoverable | workflow_name, instance_id, error, escalated_to |
| `system.health.restored` | `workflow-health-monitor_v2` | Health recovered | health_dimension, value |

---

## 3. Workflow Domain Events Consumed

### 3.1 Events Consumed by Each Workflow

| Workflow | Consumed Events | Source |
|----------|----------------|--------|
| `ticket-auto-response_v2` | `ticket.created` | DB INSERT trigger |
| `ticket-intake_v2` | `ticket.created` (from auto-response, if no FAQ match) | DB INSERT trigger + upstream workflow |
| `ticket-escalation_v2` | `ticket.escalated`, `ticket.sla_breached` | DB UPDATE trigger + upstream |
| `sla-enforcement_v2` | `ticket.created`, `ticket.status.changed` | DB triggers |
| `appointment-booking_v2` | `appointment.created`, `ticket.classified` (service-needed) | DB INSERT trigger + upstream |
| `appointment-reminders_v2` | `appointment.confirmed`, `appointment.rescheduled` | DB UPDATE trigger |
| `appointment-completion_v2` | `appointment.completed` | DB UPDATE trigger |
| `standard-dispatch_v2` | `dispatch.created` | DB INSERT trigger |
| `urgent-dispatch_v2` | `ticket.classified` (urgent), `dispatch.escalated` | Upstream + DB UPDATE |
| `work-order-fulfillment_v2` | `work_order.created` | DB INSERT trigger |
| `work-order-verification_v2` | `work_order.completed` | DB UPDATE trigger |
| `dispute-resolution_v2` | `dispute.created` | DB INSERT trigger |
| `dispute-escalation_v2` | `dispute.escalated` | DB UPDATE trigger |
| `account-health-scan_v2` | (Scheduled — reads directly) | Cron |
| `followup-management_v2` | `followup.created`, `appointment.completed`, `dispute.resolved`, `account.health.changed` | DB + upstream |
| `followup-slippage-detector_v2` | (Scheduled — reads directly) | Cron |
| `retention-campaign_v2` | `account.health.changed` (critical), `followup.slippage.detected` (chronic), `feedback.submitted` (negative) | Upstream events |
| `customer-satisfaction-monitor_v2` | `appointment.completed`, `ticket.closed`, `dispute.resolved` | DB UPDATE triggers |
| `feedback-analysis_v2` | `feedback.submitted` | DB INSERT trigger |
| `knowledge-article-lifecycle_v2` | (Manual + scheduled) | UI + Cron |
| `knowledge-gap-detection_v2` | `knowledge.gap.detected` | Upstream + agent |
| `notification-delivery_v2` | `notification.send` (ALL workflows) | All workflow output events |
| `daily-standup_v2` | (Scheduled — reads directly) | Cron |
| `operations-coordination_v2` | (Manual — reads directly) | UI |
| `report-generation_v2` | (Scheduled + manual) | Cron + UI |
| `report-distribution_v2` | `report.generated` | Upstream |
| `trend-analysis_v2` | ALL domain events (read via events_v2) | Event bus |
| `anomaly-detection_v2` | ALL domain events (read via events_v2) | Event bus |
| `quality-review_v2` | `qa.audit.triggered`, `ticket.reply.drafted`, `dispute.analyzed` | Upstream |
| `user-provisioning_v2` | `user.created` | DB INSERT |
| `system-config-management_v2` | `system.config.change.requested` | UI |
| `inventory-reorder_v2` | `inventory.transaction.recorded` | DB INSERT |
| `workflow-health-monitor_v2` | `system.workflow.failed`, `system.health.alert` | System events |

---

## 4. Workflow System Events

### 4.1 Workflow Instance Lifecycle Events

These events track every workflow instance from start to completion:

| Event | Producer | Description | Payload |
|-------|----------|-------------|---------|
| `system.workflow.started` | Workflow Orchestrator | Workflow execution begins | name, instance_id, correlation_id, trigger_event, started_at |
| `system.workflow.node.started` | Workflow Orchestrator | Individual node begins | instance_id, node_id, node_type, started_at |
| `system.workflow.node.completed` | Workflow Orchestrator | Node execution finished | instance_id, node_id, node_type, duration, output |
| `system.workflow.node.failed` | Workflow Orchestrator | Node execution failed | instance_id, node_id, error, retry_count |
| `system.workflow.completed` | Workflow Orchestrator | Workflow finished successfully | instance_id, name, duration, result_summary |
| `system.workflow.failed` | Workflow Orchestrator | Workflow ended with error | instance_id, name, error_node, error, duration |
| `system.workflow.timed_out` | Workflow Orchestrator | Workflow exceeded max time | instance_id, name, timeout_s, duration |
| `system.workflow.cancelled` | Human / Admin | Workflow manually stopped | instance_id, name, cancelled_by, reason |

### 4.2 Event Flow for a Single Workflow Instance

```
ticket.created (external event)
    │
    ▼
system.workflow.started (ticket-intake_v2)
    │
    ├── system.workflow.node.started (classify-ticket)
    │   └── system.workflow.node.completed (classify-ticket)
    │
    ├── system.workflow.node.started (check-urgency)
    │   └── system.workflow.node.completed (check-urgency)
    │
    ├── system.workflow.node.started (agent: support-reply-drafter)
    │   └── system.workflow.node.completed (agent: support-reply-drafter)
    │
    ├── system.workflow.node.started (human: approve-draft)
    │   └── (pending human response)
    │
    └── system.workflow.completed (when human approves + reply sent)
```

---

## 5. Event-to-Workflow Routing

### 5.1 Event Bus Routing Rules

| Event | Route To | Priority | Delivery Guarantee |
|-------|----------|----------|-------------------|
| `ticket.created` | `ticket-auto-response_v2` (primary), `sla-enforcement_v2` (parallel) | High | At-least-once |
| `ticket.escalated` | `ticket-escalation_v2` | High | Exactly-once |
| `ticket.sla_breached` | `ticket-escalation_v2` | Critical | Exactly-once |
| `appointment.created` | `appointment-booking_v2` | High | Exactly-once |
| `appointment.completed` | `appointment-completion_v2`, `customer-satisfaction-monitor_v2` | High | At-least-once |
| `dispatch.created` | `standard-dispatch_v2` | High | Exactly-once |
| `dispatch.escalated` | `urgent-dispatch_v2` | Critical | Exactly-once |
| `dispute.created` | `dispute-resolution_v2` | High | Exactly-once |
| `dispute.escalated` | `dispute-escalation_v2` | High | Exactly-once |
| `work_order.created` | `work-order-fulfillment_v2` | Medium | At-least-once |
| `work_order.completed` | `work-order-verification_v2` | Medium | At-least-once |
| `account.health.changed` | `retention-campaign_v2` (if critical), `followup-management_v2` | Medium | At-least-once |
| `followup.slippage.detected` | `retention-campaign_v2` (if chronic) | Low | At-least-once |
| `feedback.submitted` | `feedback-analysis_v2` | Medium | Exactly-once |
| `knowledge.gap.detected` | `knowledge-gap-detection_v2` | Low | At-least-once |
| `notification.send` | `notification-delivery_v2` | Variable | Exactly-once |
| `report.generated` | `report-distribution_v2` | Low | At-least-once |
| `system.workflow.failed` | `workflow-health-monitor_v2` | High | Exactly-once |
| `system.health.alert` | `workflow-health-monitor_v2` | Critical | Exactly-once |

### 5.2 Event Filtering Rules

| Rule | Description |
|------|-------------|
| **Stale Event Filter** | Events older than 7 days are not routed to workflows |
| **Duplicate Filter** | Events with duplicate `event_id` are dropped (idempotency) |
| **Condition Filter** | Events only trigger workflows if their conditions match (e.g., urgency = critical) |
| **Rate Limit Filter** | Maximum 100 workflow instances per event type per minute |
| **Circuit Breaker** | If a workflow fails 10+ consecutive times, auto-pause and alert |

---

## 6. Complete Event Summary

| Domain | Events Produced | Events Consumed | Workflows |
|--------|----------------|----------------|-----------|
| Ticket | 11 | 5 | 4 |
| Appointment | 7 | 4 | 3 |
| Dispatch | 10 | 2 | 2 |
| Work Order | 9 | 2 | 2 |
| Dispute | 7 | 2 | 2 |
| Account Health | 4 | 1 | 1 |
| Followup | 4 | 4 | 2 |
| Campaign | 4 | 0 | 1 |
| Customer Experience | 5 | 2 | 2 |
| Knowledge | 8 | 2 | 2 |
| Notification | 5 | 1 | 1 |
| Operations | 4 | 0 | 2 |
| Analytics & Reporting | 7 | 2 | 3 |
| Quality Assurance | 4 | 2 | 1 |
| Administration | 4 | 2 | 2 |
| Inventory | 3 | 0 | 1 |
| Workflow System | 8 | 2 | 1 |
| **Total** | **104** | **33** | **33** |

---

> **End of WORKFLOW_EVENT_CATALOG.md**  
> Next document: WORKFLOW_BUILD_ORDER.md
