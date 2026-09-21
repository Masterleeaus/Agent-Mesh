# RESQAI V2 — Workflow Trigger Matrix

> Phase 1.4 — Architecture Only  
> Chief Workflow Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Trigger Type Definitions](#1-trigger-type-definitions)
2. [Table Event Triggers](#2-table-event-triggers)
3. [Schedule Triggers](#3-schedule-triggers)
4. [Workflow-to-Workflow Triggers](#4-workflow-to-workflow-triggers)
5. [Notification Triggers](#5-notification-triggers)
6. [Report Triggers](#6-report-triggers)
7. [AI Agent Triggers](#7-ai-agent-triggers)
8. [Complete Trigger Map](#8-complete-trigger-map)

---

## 1. Trigger Type Definitions

| Type | Code | Description | Timing |
|------|------|-------------|--------|
| **Table INSERT** | I | New record created in a V2 table | Real-time |
| **Table UPDATE** | U | Existing record updated in a V2 table | Real-time |
| **Table DELETE** | D | Record deleted from a V2 table | Real-time |
| **Cron Schedule** | C | Time-based trigger via cron expression | Scheduled |
| **Manual UI** | M | Human-initiated via application UI | On demand |
| **Workflow Output** | W | Event emitted by another workflow instance | Event-driven |
| **System Event** | S | System-level event (health, timeout) | Real-time |
| **API Webhook** | A | External webhook received | Real-time |

---

## 2. Table Event Triggers

### 2.1 INSERT Triggers

| Table | Trigger Event | Workflow(s) Triggered | Condition |
|-------|---------------|----------------------|-----------|
| `tickets_v2` | `ticket.created` | `ticket-auto-response_v2`, `ticket-intake_v2`, `sla-enforcement_v2` | status = 'new' |
| `appointments_v2` | `appointment.created` | `appointment-booking_v2` | status = 'scheduled' |
| `disputes_v2` | `dispute.created` | `dispute-resolution_v2` | status = 'open' |
| `dispatches_v2` | `dispatch.created` | `standard-dispatch_v2` | dispatch_type = 'standard' |
| `work_orders_v2` | `work_order.created` | `work-order-fulfillment_v2` | status = 'created' |
| `feedback_v2` | `feedback.submitted` | `feedback-analysis_v2` | content not null |
| `followups_v2` | `followup.created` | `followup-management_v2` | status = 'pending' |
| `users_v2` | `user.created` | `user-provisioning_v2` | status = 'pending' |
| `inventory_transactions_v2` | `inventory.transaction.recorded` | `inventory-reorder_v2` | quantity < threshold |

### 2.2 UPDATE Triggers

| Table | Field Change | Trigger Event | Workflow(s) Triggered | Condition |
|-------|-------------|---------------|----------------------|-----------|
| `tickets_v2` | urgency → 'critical' | `ticket.escalated` | `urgent-dispatch_v2`, `ticket-escalation_v2` | urgency changed to critical |
| `tickets_v2` | status → 'escalated' | `ticket.escalated` | `ticket-escalation_v2` | status changed |
| `tickets_v2` | status → 'closed' | `ticket.closed` | `customer-satisfaction-monitor_v2` | - |
| `appointments_v2` | status → 'completed' | `appointment.completed` | `appointment-completion_v2` | - |
| `appointments_v2` | status → 'confirmed' | `appointment.confirmed` | `appointment-reminders_v2` | - |
| `appointments_v2` | status → 'no_show' | `appointment.no_show` | `no-show-handling` (part of appointment-completion) | - |
| `disputes_v2` | status → 'escalated' | `dispute.escalated` | `dispute-escalation_v2` | - |
| `accounts_v2` | health_score drop > 0.2 | `account.health.changed` | `retention-campaign_v2`, `followup-management_v2` | - |
| `followups_v2` | due_date passed | `followup.slippage.detected` | `followup-slippage-detector_v2` | (checked by scheduler) |
| `system_settings_v2` | any change | `system.config.changed` | `system-config-management_v2` | - |

### 2.3 Multi-Table Event Chains

| Triggering Table(s) | Event Chain | Final Workflow(s) |
|--------------------|-------------|-------------------|
| `tickets_v2` → `appointments_v2` | ticket.created → appointment.created → appointment.completed | `work-order-fulfillment_v2` |
| `appointments_v2` → `feedback_v2` | appointment.completed → feedback.submitted | `feedback-analysis_v2` |
| `disputes_v2` → `accounts_v2` | dispute.resolved → account.health.changed | `account-health-scan_v2` |
| `work_orders_v2` → `feedback_v2` | work_order.completed → feedback.submitted | `customer-satisfaction-monitor_v2` |

---

## 3. Schedule Triggers

### 3.1 Cron Schedule Inventory

| Workflow | Cron Expression | Frequency | Purpose |
|----------|----------------|-----------|---------|
| `account-health-scan_v2` | `0 2 * * *` | Daily at 2:00 AM | Full account health scan |
| `followup-slippage-detector_v2` | `0 6 * * 1-5` | Weekdays at 6:00 AM | Check for overdue followups |
| `daily-standup_v2` | `0 8 * * 1-5` | Weekdays at 8:00 AM | Generate morning briefing |
| `report-generation_v2` | Per schedule config | Configurable | Scheduled report generation |
| `trend-analysis_v2` | `0 4 * * *` | Daily at 4:00 AM | Cross-domain trend analysis |
| `anomaly-detection_v2` | `0 * * * *` | Every hour | Periodic batch anomaly check |
| `knowledge-article-lifecycle_v2` | `0 0 */7 * *` | Weekly | Content freshness review |
| `inventory-reorder_v2` | `0 6 * * *` | Daily at 6:00 AM | Stock level check |
| `workflow-health-monitor_v2` | `*/5 * * * *` | Every 5 minutes | Workflow execution health |
| `sla-enforcement_v2` | `* * * * *` | Every minute | Active SLA deadline check |
| `appointment-reminders_v2` | `*/30 * * * *` | Every 30 minutes | Upcoming reminder dispatch |

### 3.2 Schedule Dependencies

No scheduled workflow depends on another workflow's completion. Schedules are autonomous and read the current database state directly. This ensures:

- **No schedule chain failures** — a missed schedule does not block other schedules
- **Deterministic timing** — each schedule runs independently at its configured time
- **Self-healing** — missed runs catch up on next execution

---

## 4. Workflow-to-Workflow Triggers

### 4.1 Workflow Output Event Triggers

| Emitting Workflow | Output Event | Triggered Workflow(s) | Condition |
|-------------------|-------------|----------------------|-----------|
| `ticket-auto-response_v2` | `ticket.classified` (no FAQ match) | `ticket-intake_v2` | confidence < 0.90 |
| `ticket-intake_v2` | `ticket.escalated` (urgent/critical) | `urgent-dispatch_v2` | urgency = urgent or critical |
| `ticket-intake_v2` | `ticket.escalated` (escalation needed) | `ticket-escalation_v2` | escalation_reason != null |
| `ticket-intake_v2` | `appointment.created` (service-needed) | `appointment-booking_v2` | request_type = 'service' |
| `sla-enforcement_v2` | `ticket.sla_breached` | `ticket-escalation_v2` | SLA deadline passed |
| `appointment-booking_v2` | `appointment.confirmed` | `appointment-reminders_v2` | status = 'confirmed' |
| `appointment-booking_v2` | `dispatch.created` | `standard-dispatch_v2` | dispatch_type = 'standard' |
| `appointment-completion_v2` | `work_order.created` | `work-order-fulfillment_v2` | - |
| `appointment-completion_v2` | `appointment.completed` | `customer-satisfaction-monitor_v2` | - |
| `appointment-completion_v2` | `appointment.completed` | `followup-management_v2` | followup_needed = true |
| `work-order-fulfillment_v2` | `work_order.completed` | `work-order-verification_v2` | - |
| `dispute-resolution_v2` | `dispute.escalated` | `dispute-escalation_v2` | confidence < 0.50 |
| `dispute-resolution_v2` | `dispute.resolved` | `followup-management_v2` | followup_needed = true |
| `dispute-resolution_v2` | `dispute.resolved` | `customer-satisfaction-monitor_v2` | - |
| `dispute-escalation_v2` | `dispute.resolved` | `account-health-scan_v2` | - |
| `account-health-scan_v2` | `account.risk.signal.detected` | `followup-management_v2` | - |
| `account-health-scan_v2` | `account.health.changed` (critical) | `retention-campaign_v2` | health = critical/churned |
| `followup-management_v2` | `followup.missed` (7+ days) | `followup-slippage-detector_v2` | - |
| `followup-slippage-detector_v2` | `followup.slippage.detected` (chronic) | `retention-campaign_v2` | chronic pattern |
| `retention-campaign_v2` | `campaign.completed` (no response) | `followup-management_v2` | - |
| `customer-satisfaction-monitor_v2` | `feedback.submitted` | `feedback-analysis_v2` | - |
| `feedback-analysis_v2` | `cx.risk.identified` (negative) | `retention-campaign_v2` | sentiment = negative |
| `feedback-analysis_v2` | `knowledge.gap.detected` | `knowledge-gap-detection_v2` | new issue pattern |
| `knowledge-gap-detection_v2` | `knowledge.article.requested` | `knowledge-article-lifecycle_v2` | - |
| `report-generation_v2` | `report.generated` | `report-distribution_v2` | - |
| `trend-analysis_v2` | `analytics.trend.identified` | `report-generation_v2` | trend significance > threshold |
| `anomaly-detection_v2` | `analytics.anomaly.detected` | `operations-coordination_v2` | severity = critical |
| `quality-review_v2` | `qa.violation.found` | `ticket-escalation_v2` | violation on open ticket |
| `workflow-health-monitor_v2` | `system.workflow.failed` (persistent) | `notification-delivery_v2` | auto-recovery failed |

---

## 5. Notification Triggers

### 5.1 Notifications Generated by Workflows

| Workflow | Notification Type | Recipient | Channel | Trigger Condition |
|----------|-------------------|-----------|---------|-------------------|
| ticket-auto-response | Auto-response sent | Customer | Email | FAQ match >= 0.90 |
| ticket-intake | Ticket confirmation | Customer | Email | ticket.created |
| ticket-intake | Draft ready for review | Support Agent | In-app | draft.created |
| ticket-intake | Reply sent confirmation | Customer | Email/SMS | ticket.reply.approved |
| ticket-escalation | Escalation notification | Support Manager | In-app + Email | ticket.escalated |
| ticket-escalation | Escalation level up | Platform Orchestrator | Email + Discord | L3 escalation |
| sla-enforcement | SLA warning | Assignee | In-app | 75% of deadline |
| sla-enforcement | SLA breach | Support Manager + Customer | Email + SMS | deadline passed |
| appointment-booking | Booking confirmation | Customer | Email/SMS | appointment.confirmed |
| appointment-booking | Technician assigned | Technician | SMS/Push | appointment.assigned |
| appointment-reminders | 24h reminder | Customer | Email/SMS | 24h before |
| appointment-reminders | 2h reminder | Customer + Technician | SMS | 2h before |
| appointment-reminders | 30min reminder | Technician | SMS/Push | 30min before |
| urgent-dispatch | Dispatch alert | Technician | SMS/Push | dispatch.sent |
| urgent-dispatch | Escalation alert | Dispatch Manager | SMS/Discord | no acknowledgment |
| urgent-dispatch | Emergency alert | All Managers | SMS/Phone | emergency flag |
| dispute-resolution | Resolution proposed | Resolution Manager | In-app | dispute.analyzed |
| dispute-resolution | Resolution applied | Customer | Email | dispute.resolved |
| retention-campaign | Win-back offer | Customer | Email/SMS | campaign.started |
| customer-satisfaction-monitor | Survey invitation | Customer | Email | appointment.completed |
| customer-satisfaction-monitor | Low score alert | CX Manager | In-app + Email | score < 3 |
| notification-delivery | (Delivery to external) | End recipient | Selected channel | notification.send |

---

## 6. Report Triggers

| Report | Triggering Workflow(s) | Frequency | Stakeholders |
|--------|----------------------|-----------|--------------|
| Daily Operations KPI | `daily-standup_v2` | Daily | Ops Manager, Support Manager |
| Ticket Volume Report | `report-generation_v2` | Daily/Weekly | Support Manager |
| SLA Compliance Report | `report-generation_v2` | Weekly | Support Manager, Platform Orch. |
| Account Health Summary | `report-generation_v2` | Weekly | CRM Manager |
| Technician Utilization | `report-generation_v2` | Weekly | Ops Manager, Dispatch Manager |
| Dispatch Response Time | `report-generation_v2` | Weekly | Dispatch Manager |
| Customer Satisfaction | `report-generation_v2` | Weekly | CX Manager, CRM Manager |
| Dispute Resolution Analysis | `report-generation_v2` | Monthly | Resolution Manager |
| Knowledge Base Health | `report-generation_v2` | Monthly | Knowledge Manager |
| Workflow Performance | `workflow-health-monitor_v2` | Weekly | Automation Manager |
| Anomaly Summary | `anomaly-detection_v2` | On detection | Analytics Manager |
| Trend Report | `trend-analysis_v2` | Daily | Analytics Manager |

---

## 7. AI Agent Triggers

### 7.1 Agents Triggered by Workflows

| Workflow Node | Agent | Trigger Source | When |
|---------------|-------|---------------|------|
| Classify ticket | `support-request-classifier_v2` | `ticket-intake_v2` | After ticket.created |
| Draft reply | `support-reply-drafter_v2` | `ticket-intake_v2` | After classification |
| Suggest articles | `knowledge-article-suggester_v2` | `ticket-intake_v2` | Parallel with classification |
| Escalate ticket | `support-escalation-manager_v2` | `ticket-escalation_v2` | On escalation event |
| Monitor SLA | `support-sla-monitor_v2` | `sla-enforcement_v2` | Continuous monitoring |
| Coordinate ops | `operations-coordinator_v2` | `daily-standup_v2`, `operations-coordination_v2` | On demand / daily |
| Manage work order | `operations-work-order-manager_v2` | `work-order-fulfillment_v2` | On work order events |
| Scan health | `crm-account-health-monitor_v2` | `account-health-scan_v2` | Daily / on demand |
| Manage followups | `crm-followup-manager_v2` | `followup-management_v2` | On followup events |
| Detect slippage | `crm-followup-manager_v2` | `followup-slippage-detector_v2` | On schedule |
| Design campaign | `crm-retention-specialist_v2` | `retention-campaign_v2` | On health change |
| Coordinate dispatch | `dispatch-coordinator_v2` | `urgent-dispatch_v2` | On urgent event |
| Dispatch technician | `dispatch-technician-dispatcher_v2` | `urgent-dispatch_v2`, `standard-dispatch_v2` | On dispatch created |
| Handle emergency | `dispatch-emergency-response_v2` | `urgent-dispatch_v2` | On emergency flag |
| Suggest technician | `scheduling-technician-suggester_v2` | `appointment-booking_v2` | On appointment.created |
| Schedule appointment | `scheduling-appointment-scheduler_v2` | `appointment-booking_v2` | After tech suggestion |
| Analyze dispute | `resolution-advisor_v2` | `dispute-resolution_v2` | On dispute.created |
| Analyze feedback | `cx-feedback-analyzer_v2` | `feedback-analysis_v2` | On feedback.submitted |
| Detect trends | `trend-analyzer_v2` | `trend-analysis_v2` | Daily / on demand |
| Predict anomalies | `predictive-modeler_v2` | `anomaly-detection_v2` | Hourly / event-driven |
| Route notification | `notification-channel-optimizer_v2` | `notification-delivery_v2` | On notification.send |
| Generate report | `reporting-generator_v2` | `report-generation_v2` | On schedule / demand |
| Distribute report | `reporting-distributor_v2` | `report-distribution_v2` | On report.generated |
| Orchestrate workflow | `workflow-orchestrator_v2` | ALL workflow triggers | On every trigger event |
| Route event | `event-router_v2` | ALL domain events | On every event |

---

## 8. Complete Trigger Map

```
TABLE EVENTS (INSERT/UPDATE)
══════════════════════════════
tickets_v2 INSERT:
  ├── ticket.created ───► ticket-auto-response_v2 (check FAQ first)
  │                       └── (no match) ──► ticket-intake_v2
  │
  └── ticket.created ───► sla-enforcement_v2 (start SLA timer)

tickets_v2 UPDATE (status → escalated):
  └── ticket.escalated ──► ticket-escalation_v2
                           └── (if urgency = critical) ──► urgent-dispatch_v2

tickets_v2 UPDATE (status → closed):
  └── ticket.closed ────► customer-satisfaction-monitor_v2

appointments_v2 INSERT:
  └── appointment.created ──► appointment-booking_v2

appointments_v2 UPDATE (status → confirmed):
  └── appointment.confirmed ──► appointment-reminders_v2

appointments_v2 UPDATE (status → completed):
  └── appointment.completed ──► appointment-completion_v2
                                ├──► work-order-fulfillment_v2
                                ├──► customer-satisfaction-monitor_v2
                                └──► followup-management_v2

appointments_v2 UPDATE (status → no_show):
  └── appointment.no_show ──► (part of appointment-completion)

dispatches_v2 INSERT:
  └── dispatch.created ──► standard-dispatch_v2

disputes_v2 INSERT:
  └── dispute.created ──► dispute-resolution_v2

disputes_v2 UPDATE (status → escalated):
  └── dispute.escalated ──► dispute-escalation_v2

work_orders_v2 INSERT:
  └── work_order.created ──► work-order-fulfillment_v2

work_orders_v2 UPDATE (status → completed):
  └── work_order.completed ──► work-order-verification_v2

feedback_v2 INSERT:
  └── feedback.submitted ──► feedback-analysis_v2

accounts_v2 UPDATE (health_score drop > 0.2):
  └── account.health.changed ──► retention-campaign_v2
                                 └──► followup-management_v2

followups_v2 INSERT:
  └── followup.created ──► followup-management_v2

users_v2 INSERT:
  └── user.created ──► user-provisioning_v2

system_settings_v2 UPDATE:
  └── system.config.changed ──► system-config-management_v2

inventory_transactions_v2 INSERT (qty < threshold):
  └── inventory.transaction.recorded ──► inventory-reorder_v2


SCHEDULED EVENTS (CRON)
══════════════════════════
Every 5 minutes:
  └── workflow-health-monitor_v2

Every minute:
  └── sla-enforcement_v2

Every 30 minutes:
  └── appointment-reminders_v2 (check + dispatch)

Every hour:
  └── anomaly-detection_v2

Daily at 2:00 AM:
  └── account-health-scan_v2

Daily at 4:00 AM:
  └── trend-analysis_v2

Daily at 6:00 AM:
  └── inventory-reorder_v2

Weekdays at 6:00 AM:
  └── followup-slippage-detector_v2

Weekdays at 8:00 AM:
  └── daily-standup_v2

Weekly:
  └── knowledge-article-lifecycle_v2 (content review)

Per schedule config:
  └── report-generation_v2


WORKFLOW OUTPUT EVENTS
══════════════════════════
ticket-auto-response_v2 (no match) ──► ticket-intake_v2
sla-enforcement_v2 (breach) ──► ticket-escalation_v2
feedback-analysis_v2 (gap) ──► knowledge-gap-detection_v2 ──► knowledge-article-lifecycle_v2
trend-analysis_v2 (trend) ──► report-generation_v2 ──► report-distribution_v2
anomaly-detection_v2 (critical) ──► operations-coordination_v2
quality-review_v2 (violation) ──► ticket-escalation_v2 (if open ticket)


MANUAL TRIGGERS (UI)
══════════════════════════
operations-coordination_v2 ──► "Run Coordinator" button
user-provisioning_v2 ──► Admin UI user creation
system-config-management_v2 ──► Admin UI config change
report-generation_v2 ──► "Generate Report" button
knowledge-article-lifecycle_v2 ──► New article / review article
daily-standup_v2 ──► "Run Standup" button
account-health-scan_v2 ──► "Run Health Scan" button


ALL WORKFLOWS → notification-delivery_v2 (for outbound communication)
ALL WORKFLOWS → trend-analysis_v2 + anomaly-detection_v2 (events consumed for analysis)
ALL WORKFLOWS → workflow-health-monitor_v2 (monitored for execution health)
```

---

> **End of WORKFLOW_TRIGGER_MATRIX.md**  
> Next document: WORKFLOW_EVENT_CATALOG.md
