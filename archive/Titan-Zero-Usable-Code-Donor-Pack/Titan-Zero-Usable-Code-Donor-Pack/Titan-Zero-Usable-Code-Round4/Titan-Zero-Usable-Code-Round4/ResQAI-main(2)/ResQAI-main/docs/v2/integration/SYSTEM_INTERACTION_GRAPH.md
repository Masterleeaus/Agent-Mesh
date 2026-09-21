# RESQAI V2 — System Interaction Graph

> Phase B.9 — Enterprise End-to-End Integration  
> Chief Enterprise Integration Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Application Interaction Graph](#1-application-interaction-graph)
2. [Table Dependency Graph](#2-table-dependency-graph)
3. [Event Flow Graph](#3-event-flow-graph)
4. [Function Call Graph](#4-function-call-graph)
5. [Workflow Orchestration Graph](#5-workflow-orchestration-graph)
6. [Agent Collaboration Graph](#6-agent-collaboration-graph)
7. [Notification Delivery Graph](#7-notification-delivery-graph)
8. [Connector Dependency Graph](#8-connector-dependency-graph)
9. [Permission Hierarchy Graph](#9-permission-hierarchy-graph)
10. [Search Index Graph](#10-search-index-graph)
11. [Audit Trail Graph](#11-audit-trail-graph)
12. [Analytics Pipeline Graph](#12-analytics-pipeline-graph)

---

## 1. Application Interaction Graph

```
                            ┌─────────────────────┐
                            │   customer-portal    │
                            │       (V2)           │
                            └──────┬──────┬───────┘
                                   │      │
                     ticket.created│      │appointment.requested
                           ┌───────┘      └───────┐
                           ▼                       ▼
                    ┌──────────────┐     ┌──────────────────┐
                    │ support-center│    │appointment-center │
                    │     (V2)     │     │      (V2)         │
                    └───┬───┬──────┘     └───┬──────────────┘
                        │   │                │
              ticket.    │   │ticket.        │appointment.
              classified │   │escalated       │completed
                        │   │                │
          ┌─────────────┘   └──┐         ┌──┘
          ▼                    ▼         ▼
   ┌──────────────┐    ┌────────────┐  ┌────────────────┐
   │  operations  │    │ resolution │  │  technician    │
   │  center (V2) │    │ center(V2) │  │  portal (V2)   │
   └───┬───┬──────┘    └─────┬──────┘  └──┬────┬────────┘
       │   │                 │            │    │
       │   │          dispute.created     │    │job.completed
       │   │                 │            │    │
       │   └──────────┐     │            │    │
       │              ▼     ▼            │    │
       │       ┌──────────────┐          │    │
       │       │  crm-center  │◄─────────┘    │
       │       │    (V2)      │               │
       │       └──┬───┬───────┘               │
       │          │   │                       │
       │   feedback.  │account.health.changed │
       │   submitted  │                       │
       │          │   │                       │
       ▼          ▼   ▼                       ▼
┌────────────┐ ┌──────────────┐     ┌───────────────────┐
│ analytics  │ │ notification │     │   admin-center    │
│ center (V2)│ │ center (V2)  │     │      (V2)         │
└────────────┘ └──────────────┘     └───────────────────┘
```

### 1.1 Read/Write Interactions

| Source App | Target App | Interaction Type | Data Flow |
|------------|-----------|:----------------:|-----------|
| customer-portal_v2 | support-center_v2 | Event (ticket.created) | Customer submits support ticket |
| customer-portal_v2 | appointment-center_v2 | Event (appointment.requested) | Customer books appointment |
| support-center_v2 | operations-center_v2 | Event (ticket.escalated) | Escalated tickets routed to ops |
| support-center_v2 | resolution-center_v2 | Event (ticket.closed) | Closed tickets trigger resolution |
| appointment-center_v2 | technician-portal_v2 | Event (appointment.assigned) | Technician assigned to appointment |
| technician-portal_v2 | crm-center_v2 | Event (job.completed) | Job completion updates CRM |
| resolution-center_v2 | crm-center_v2 | Event (dispute.resolved) | Resolution outcome synced to CRM |
| operations-center_v2 | notification-center_v2 | Event (dispatch.created) | Dispatch triggers notifications |
| crm-center_v2 | analytics-center_v2 | Event (feedback.submitted) | Feedback data for analytics |

---

## 2. Table Dependency Graph

```
tickets_v2
  ├── customer_id ──────────► customers_v2
  ├── assigned_to ──────────► users_v2
  ├── created_by ───────────► users_v2
  ├── ticket_messages_v2 ──── (child table)
  ├── ticket_attachments_v2 ─ (child table)
  ├── appointments_v2 ─────── (related via ticket_id/context)
  └── dispatches_v2 ───────── (related via ticket_id/context)

customers_v2
  ├── created_by ───────────► users_v2
  └── customer_addresses_v2 ─ (child table)

technicians_v2
  ├── created_by ───────────► users_v2
  └── technician_skills_v2 ── (child table)

appointments_v2
  ├── customer_id ──────────► customers_v2
  ├── technician_id ────────► technicians_v2
  ├── created_by ───────────► users_v2
  ├── appointment_reminders_v2 (child table)
  └── work_orders_v2 ──────── (child table)

work_orders_v2
  ├── work_order_stages_v2 ── (child table)
  └── dispatches_v2 ───────── (related)

dispatches_v2 ───────────────► tickets_v2 (via ticket_id)

disputes_v2
  ├── dispute_evidence_v2 ─── (child table)
  └── customers_v2 (related)

tasks_v2
  ├── task_assignments_v2 ─── (child table)
  └── tickets_v2 (related)

followups_v2
  ├── followup_attempts_v2 ── (child table)
  └── customers_v2 (related)

accounts_v2
  ├── account_health_scans_v2 (child table)
  └── customers_v2 (related)

notifications_v2
  ├── notification_templates_v2 (child table)
  └── notification_channels_v2 (child table)

users_v2 ◄── user_roles_v2 ──► role_permissions_v2

analytics_reports_v2 ────────► analytics_schedules_v2
```

### 2.1 Table Relationship Summary

| Parent Table | Child Table(s) | FK Column | Cardinality |
|-------------|---------------|-----------|:-----------:|
| customers_v2 | customer_addresses_v2 | customer_id | 1:N |
| users_v2 | customers_v2, technicians_v2 | created_by, updated_by | 1:N |
| customers_v2 | tickets_v2, appointments_v2, accounts_v2, followups_v2 | customer_id | 1:N |
| technicians_v2 | technician_skills_v2, appointments_v2 | technician_id | 1:N |
| tickets_v2 | ticket_messages_v2, ticket_attachments_v2 | ticket_id | 1:N |
| appointments_v2 | appointment_reminders_v2, work_orders_v2 | appointment_id | 1:N |
| work_orders_v2 | work_order_stages_v2 | work_order_id | 1:N |
| users_v2 | user_sessions_v2 | user_id | 1:N |
| user_roles_v2 | role_permissions_v2 | role_id | 1:N |
| disputes_v2 | dispute_evidence_v2 | dispute_id | 1:N |
| tasks_v2 | task_assignments_v2 | task_id | 1:N |
| followups_v2 | followup_attempts_v2 | followup_id | 1:N |
| accounts_v2 | account_health_scans_v2 | account_id | 1:N |
| notification_templates_v2 | notifications_v2 | template_id | 1:N |
| analytics_reports_v2 | analytics_schedules_v2 | report_id | 1:N |

---

## 3. Event Flow Graph

```
APPLICATION LAYER
┌─────────────────────────────────────────────────────────────┐
│ customer-portal_v2                                          │
│  ┌─ ticket.created.customer ───────────────────────────────┐│
│  │  ticket.message.sent.customer                           ││
│  │  appointment.requested                                  ││
│  │  appointment.rescheduled.customer                       ││
│  │  appointment.cancelled.customer                         ││
│  │  payment.made.customer                                  ││
│  │  feedback.submitted.customer                            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│ support-center_v2                                            │
│  ┌─ ticket.created ────────────────────────────────────────┐│
│  │  ticket.classified                                       ││
│  │  ticket.reply.drafted / .approved / .rejected            ││
│  │  ticket.status.changed                                   ││
│  │  ticket.escalated                                        ││
│  │  ticket.sla_warning / .sla_breached                      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│ appointment-center_v2                                        │
│  ┌─ appointment.created ───────────────────────────────────┐│
│  │  appointment.assigned                                    ││
│  │  appointment.status.changed / .cancelled / .completed    ││
│  │  appointment.rescheduled / .no_show                      ││
│  │  appointment.conflict_detected                           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│ technician-portal_v2                                         │
│  ┌─ job.accepted / .rejected ──────────────────────────────┐│
│  │  job.status.changed / .paused / .resumed / .escalated    ││
│  │  job.completed / .progress.updated                       ││
│  │  notes.added / evidence.uploaded / signature.captured    ││
│  │  parts.used / inventory.requested                        ││
│  │  offline.sync.started/.completed/.failed                 ││
│  │  network.status.changed / gps.status.changed             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│ operations-center_v2                                         │
│  ┌─ operation.created / .dispatched ───────────────────────┐│
│  │  operation.assigned / .reassigned / .escalated / .closed ││
│  │  technician.status.changed                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│ resolution-center_v2                                         │
│  ┌─ resolution.case.created ───────────────────────────────┐│
│  │  resolution.case.status.changed / .closed                ││
│  │  resolution.dispute.created / .resolved                  ││
│  │  resolution.resolution.created/.approved/.rejected       ││
│  │  resolution.escalation.created/.resolved                 ││
│  │  resolution.approval.created/.granted/.denied            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│ crm-center_v2                                                │
│  ┌─ account.health.scan.completed ─────────────────────────┐│
│  │  account.health.changed                                  ││
│  │  followup.created/.updated/.completed/.slippage.detected ││
│  │  interaction.created / note.created/.updated             ││
│  │  task.created/.updated/.completed                        ││
│  │  feedback.recorded / satisfaction.recorded               ││
│  │  opportunity.created/.stage.changed/.won                 ││
│  │  customer.updated/.merged / retention.alert              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

EVENT BUS (EventBus.ts — typed in-memory)
┌─────────────────────────────────────────────────────────────┐
│  applicationEvents  │  workflowEvents  │  agentEvents       │
│  ─────────────────  │  ──────────────  │  ───────────       │
│  app:initialized    │  workflow:started│  agent:started     │
│  app:routeChange    │  :stepCompleted  │  agent:message     │
│  app:error          │  :completed      │  agent:completed   │
│  app:themeChange    │  :failed         │  agent:failed      │
│  app:sidebarToggle  │  :paused         │  agent:requiresAct │
│  app:languageChange │  :resumed        │                    │
│                     │  :cancelled      │  notificationEvents│
│                     │                  │  ────────────────  │
│                     │                  │  notification:added│
│                     │                  │  :dismissed        │
│                     │                  │  :clearedAll       │
│                     │                  │  :unreadCount      │
└─────────────────────────────────────────────────────────────┘

DATABASE TRIGGER EVENTS (events_v2 table)
┌─────────────────────────────────────────────────────────────┐
│ Entity CRUD Events (produced by DB triggers)                 │
│                                                              │
│ tickets:     INSERT→ticket.created                           │
│              UPDATE(status)→ticket.status.changed            │
│              UPDATE(assignee)→ticket.assigned               │
│              UPDATE(status=resolved)→ticket.resolved        │
│                                                              │
│ appointments:INSERT→appointment.created                     │
│              UPDATE(technician_id)→appointment.assigned     │
│              UPDATE(status=completed)→appointment.completed │
│                                                              │
│ customers:  INSERT→customer.created                         │
│             UPDATE→customer.updated                          │
│                                                              │
│ accounts:   UPDATE(health_score)→account.health.changed     │
│                                                              │
│ disputes:   INSERT→resolution.case.created                  │
│             UPDATE(status=resolved)→resolution.case.resolved│
│                                                              │
│ notifications:INSERT→notification.created                   │
│              UPDATE(status=sent)→notification.sent           │
│              UPDATE(status=delivered)→notification.delivered│
│              UPDATE(status=failed)→notification.failed      │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Event Flow: Producer → Consumer Mapping

| Producer | Event | Consumer Type | Consumer |
|----------|-------|:-------------:|----------|
| customer-portal_v2 | ticket.created.customer | workflow | ticket-intake_v2 |
| support-center_v2 | ticket.created | workflow | ticket-auto-response_v2, ticket-intake_v2, sla-enforcement_v2 |
| support-center_v2 | ticket.classified | workflow | urgent-dispatch_v2 |
| support-center_v2 | ticket.escalated | workflow | ticket-escalation_v2, urgent-dispatch_v2 |
| appointment-center_v2 | appointment.created | workflow | appointment-booking_v2 |
| technician-portal_v2 | job.completed | workflow | work-order-fulfillment_v2 |
| operations-center_v2 | operation.dispatched | workflow | notification-delivery_v2 |
| resolution-center_v2 | dispute.created | workflow | dispute-resolution_v2 |
| crm-center_v2 | account.health.changed | workflow | account-health-scan_v2, retention-campaign_v2 |
| crm-center_v2 | feedback.recorded | workflow | feedback-analysis_v2 |
| sla-enforcement_v2 | ticket.sla_breached | workflow | ticket-escalation_v2 |
| notification-center_v2 | notification.send | workflow | notification-delivery_v2 |
| admin-center_v2 | user.created | workflow | user-provisioning_v2 |
| admin-center_v2 | system.config.changed | workflow | system-config-management_v2 |

---

## 4. Function Call Graph

```
                            ┌──────────────────────┐
                            │  dispatch-notifications│
                            │    (ORCHESTRATOR)     │
                            └──────┬───────────────┘
                                   │ calls
                                   ▼
                   ┌───────────────────────────────┐
                   │  render-notification-template  │
                   │       (TRANSFORMER)            │
                   └───────────────────────────────┘

┌──────────────────────┐
│   send-report        │──── calls ───► dispatch-notifications
│   (ORCHESTRATOR)     │
└──────────────────────┘

┌──────────────────────┐
│   provision-user     │──── calls ───► dispatch-notifications
│   (ORCHESTRATOR)     │
└──────────────────────┘

┌──────────────────────┐
│   batch-sla-check    │──── calls ───► check-sla-deadline (per ticket)
│   (AGGREGATOR)       │
└──────────────────────┘

┌──────────────────────┐
│   account-health-scan│──── calls ───► generate-account-score
│   (AGGREGATOR)       │
└──────────────────────┘

┌──────────────────────────┐
│   generate-standup-report│──── calls ───► collect-resolved-tickets
│   (AGGREGATOR)           │
└──────────────────────────┘

┌──────────────────────────┐
│   batch-metric-aggregation│──── calls ───► calculate-metric-trend
│   (AGGREGATOR)           │
└──────────────────────────┘

┌───────────────────────────────┐
│   recover-workflow-instance   │──── calls ───► verify-workflow-health
│   (ORCHESTRATOR)              │
└──────────────────────────────┘

### Sub-function Call Hierarchy

dispatch-notifications (MOST CRITICAL — called by 19 workflows)
  ├── render-notification-template (template rendering)
  ├── notifications_v2 (write)
  ├── notification_templates_v2 (read)
  ├── notification_channels_v2 (read)
  └── connectors: SMTP, Twilio SMS, Discord, Slack, Gmail

check-ticket-urgency (called by 2 workflows)
  └── Pure deterministic routing — no sub-calls

update-ticket-record (called by 3 workflows)
  └── tickets_v2 (read/write) + operations_log (write) + Gmail connector
```

### 4.1 Function Type Distribution

| Function Type | Count | Behavior |
|:-------------:|:-----:|----------|
| DET (Deterministic) | validate-ticket-input, check-ticket-urgency, classify-ticket-sla-tier, check-reminder-window, calculate-dispatch-priority, suggest-knowledge-article, validate-config-change, validate-permissions | Pure logic, no side effects |
| WRI (Writer) | update-ticket-record, assign-appointment-technician, schedule-appointment-reminders, finalize-dispatch, create-work-order, update-work-order-stage, complete-work-order, resolve-dispute, update-account-health-status, create-followup-tasks, finalize-slippage-review, process-feedback-survey, process-notification-delivery, create-operations-tasks, deactivate-user, apply-config-change, reorder-inventory, record-inventory-transaction, generate-api-token, flag-quality-violation | DB writes + event emission |
| REA (Reader) | check-sla-deadline, collect-resolved-tickets, fetch-upcoming-appointments, flag-slipping-followups, extract-knowledge-gap, search-knowledge-articles, check-inventory-level, verify-workflow-health | Read-only queries |
| AGG (Aggregator) | batch-sla-check, account-health-scan, generate-account-score, analyze-feedback-sentiment, generate-standup-report, generate-report-data, sync-events-analytics, calculate-metric-trend, batch-metric-aggregation, evaluate-quality-score | Read + compute + conditional write |
| ORC (Orchestrator) | dispatch-notifications, send-report, provision-user, recover-workflow-instance, rotate-credentials | Multi-step with sub-calls + connectors |
| TRA (Transformer) | render-notification-template | Format transformation |

---

## 5. Workflow Orchestration Graph

```
TIER 0 — FOUNDATION (always ready)
┌──────────────────────────────────────┐
│ notification-delivery_v2             │
│ workflow-health-monitor_v2           │
└──────────────────────────────────────┘

TIER 1 — CORE INTAKE (event-driven, real-time)
┌──────────────────────────────────────────────────────┐
│ ticket-auto-response_v2  ◄── ticket.created           │
│ ticket-intake_v2          ◄── ticket.created           │
│ appointment-booking_v2    ◄── appointment.created      │
│ urgent-dispatch_v2         ◄── ticket.classified[urgent]│
│ ticket-escalation_v2      ◄── ticket.escalated         │
│ sla-enforcement_v2        ◄── schedule (cron 5min)     │
└──────────────────────────────────────────────────────┘

TIER 2 — EXECUTION (operational workflows)
┌──────────────────────────────────────────────────────┐
│ standard-dispatch_v2       ◄── dispatch.created        │
│ appointment-reminders_v2   ◄── schedule (cron)         │
│ appointment-completion_v2  ◄── appointment.completed   │
│ dispute-resolution_v2      ◄── dispute.created         │
│ work-order-fulfillment_v2  ◄── work_order.created      │
└──────────────────────────────────────────────────────┘

TIER 3 — CRM & CUSTOMER EXPERIENCE
┌──────────────────────────────────────────────────────┐
│ account-health-scan_v2      ◄── schedule (nightly)    │
│ customer-satisfaction-monitor ◄── ticket.closed       │
│ feedback-analysis_v2        ◄── feedback.submitted    │
│ followup-management_v2      ◄── followup.created      │
│ retention-campaign_v2       ◄── account.health.changed│
└──────────────────────────────────────────────────────┘

TIER 4 — DETECTION & RESPONSE
┌──────────────────────────────────────────────────────┐
│ followup-slippage-detector ◄── schedule (daily)      │
│ anomaly-detection_v2       ◄── schedule (hourly)     │
│ quality-review_v2          ◄── ticket.reply.drafted  │
│ dispute-escalation_v2      ◄── dispute.escalated     │
└──────────────────────────────────────────────────────┘

TIER 5 — ANALYSIS & REPORTING
┌──────────────────────────────────────────────────────┐
│ trend-analysis_v2           ◄── schedule (daily)     │
│ report-generation_v2        ◄── schedule / on-demand │
│ report-distribution_v2      ◄── report.generated     │
│ knowledge-gap-detection_v2  ◄── schedule (weekly)    │
└──────────────────────────────────────────────────────┘

TIER 6 — ORCHESTRATION & GOVERNANCE
┌──────────────────────────────────────────────────────┐
│ daily-standup_v2             ◄── schedule (daily)    │
│ operations-coordination_v2   ◄── on-demand / event   │
│ knowledge-article-lifecycle  ◄── on-demand           │
│ system-config-management_v2  ◄── system.config.changed│
│ user-provisioning_v2         ◄── user.created        │
└──────────────────────────────────────────────────────┘

TIER 7 — INVENTORY & OPERATIONS
┌──────────────────────────────────────────────────────┐
│ inventory-reorder_v2         ◄── inventory.low_stock  │
│ work-order-verification_v2   ◄── work_order.completed │
└──────────────────────────────────────────────────────┘
```

### 5.1 Workflow Activation Patterns

| Activation Pattern | Workflows | Count |
|:-----------------:|-----------|:-----:|
| **Event-driven** (DATASTORE_EVENT / WEBHOOK) | ticket-auto-response, ticket-intake, urgent-dispatch, appointment-booking, dispute-resolution, work-order-fulfillment, customer-satisfaction-monitor, feedback-analysis, followup-management | 9 |
| **Scheduled** (TIME cron) | sla-enforcement, appointment-reminders, account-health-scan, followup-slippage-detector, anomaly-detection, trend-analysis, daily-standup, knowledge-gap-detection | 8 |
| **Chained** (workflow → workflow via event) | ticket-escalation, standard-dispatch, appointment-completion, dispute-escalation, retention-campaign, notification-delivery, report-distribution, system-config-management, user-provisioning, work-order-verification, operations-coordination | 11 |
| **On-demand** (manual trigger) | report-generation, quality-review, knowledge-article-lifecycle, inventory-reorder, operations-coordination | 5 |

---

## 6. Agent Collaboration Graph

```
EXECUTIVE LAYER
  executive-director_v2 (ALL domains — summary/oversight)
  platform-orchestrator_v2 (ALL domains — coordination)
        │
        ├──────────────────────────────────────────┐
        ▼                                          ▼
SUPPORT LAYER                           OPERATIONS LAYER
  support-manager_v2                     operations-manager_v2
  support-request-classifier_v2          operations-coordinator_v2
  support-reply-drafter_v2               operations-work-order-manager_v2
  support-escalation-manager_v2
  support-sla-monitor_v2                 DISPATCH LAYER
                                          dispatch-manager_v2
CRM LAYER                                 dispatch-coordinator_v2
  crm-manager_v2                          dispatch-technician-dispatcher_v2
  crm-account-health-monitor_v2           dispatch-emergency-response_v2
  crm-followup-manager_v2
  crm-retention-specialist_v2             SCHEDULING LAYER
                                          scheduling-manager_v2
APPOINTMENT LAYER                         scheduling-appointment-scheduler_v2
  appointment-manager_v2                  scheduling-technician-suggester_v2
  appointment-reminder-coordinator_v2
  appointment-no-show-handler_v2          CX LAYER
                                          cx-manager_v2
ANALYTICS LAYER                           cx-satisfaction-survey_v2
  analytics-manager_v2                    cx-feedback-analyzer_v2
  analytics-trend-analyzer_v2             cx-winback-specialist_v2
  analytics-predictive-modeler_v2
                                          QA LAYER
KNOWLEDGE LAYER                           qa-manager_v2
  knowledge-manager_v2                    qa-response-quality-monitor_v2
  knowledge-curator_v2                    qa-compliance-monitor_v2
  knowledge-article-suggester_v2
                                          REPORTING LAYER
ADMIN LAYER                               reporting-manager_v2
  admin-manager_v2                        reporting-generator_v2
  admin-system-config_v2                  reporting-distributor_v2
  admin-connector-manager_v2
                                          NOTIFICATION LAYER
AUTOMATION LAYER                          notification-manager_v2
  automation-manager_v2                   notification-channel-optimizer_v2
  automation-workflow-orchestrator_v2     notification-template-manager_v2
  automation-event-router_v2
```

### 6.1 Agent-to-Agent Collaboration Paths

| Initiator Agent | Collaborator Agent | Trigger | Purpose |
|----------------|-------------------|---------|---------|
| support-request-classifier_v2 | support-reply-drafter_v2 | ticket.classified | Draft reply after classification |
| support-reply-drafter_v2 | support-escalation-manager_v2 | escalation needed | Route to escalation if needed |
| crm-account-health-monitor_v2 | crm-followup-manager_v2 | account.risk.signal | Create followup tasks on risk |
| dispatch-technician-dispatcher_v2 | dispatch-coordinator_v2 | dispatch.declined | Reassign on decline |
| crm-retention-specialist_v2 | cx-winback-specialist_v2 | retention.alert | Joint winback campaign |
| analytics-trend-analyzer_v2 | reporting-generator_v2 | analytics.insight.ready | Generate report from trend |
| cx-feedback-analyzer_v2 | knowledge-curator_v2 | knowledge.gap.detected | Create knowledge article |

---

## 7. Notification Delivery Graph

```
TRIGGER SOURCES
┌─────────────────────────────────────────────────────────────┐
│ 19 Workflows     │  9 Agents     │  5 Apps (UI actions)     │
│ (all tiers)      │ (all layers)  │ (button clicks, events)  │
└────────┬─────────┴──────┬────────┴──────────┬──────────────┘
         │                │                   │
         └────────────────┼───────────────────┘
                          │
                          ▼
          ┌─────────────────────────────────────┐
          │        dispatch-notifications        │
          │           (orchestrator)             │
          │                                      │
          │  1. Validate input                   │
          │  2. Check idempotency key             │
          │  3. Read notification template        │
          │  4. render-notification-template      │
          │  5. notification-channel-optimizer    │
          │  6. Check circuit breaker state       │
          │  7. Rate limiter check                │
          │  8. Call connector                    │
          │  9. Write notification record          │
          │  10. Emit notification.sent|failed    │
          └──────────┬──────────────────────────┘
                     │
        ┌────────────┼────────────┬───────────┐
        ▼            ▼            ▼           ▼
  ┌────────┐  ┌──────────┐  ┌────────┐  ┌────────┐
  │  SMTP  │  │ Twilio   │  │ Discord│  │ Slack  │
  │ (Email)│  │ (SMS)    │  │(Webhook)│  │        │
  └───┬────┘  └────┬─────┘  └────┬───┘  └───┬────┘
      │            │             │           │
      ▼            ▼             ▼           ▼
  ┌─────────────────────────────────────────────┐
  │         Fallback Chain                       │
  │  SMTP → Gmail → Twilio SMS → In-app         │
  │  Discord → Slack → Email → In-app           │
  │  Twilio SMS → Email → In-app                │
  └─────────────────────────────────────────────┘
                     │
                     ▼
          ┌─────────────────────────────────────┐
          │    process-notification-delivery    │
          │         (callback handler)          │
          │                                     │
          │  1. Validate webhook payload         │
          │  2. Update notification status       │
          │  3. Emit notification.delivered|fail │
          │  4. If failed → check fallback chain │
          │  5. If all failed → DLQ              │
          └─────────────────────────────────────┘
```

### 7.1 Notification Type → Channel Mapping

| Notification Type | Primary Channel | Fallback Channel | Trigger |
|------------------|:---------------:|:----------------:|---------|
| Ticket confirmation | Email (SMTP) | In-app | ticket.created |
| Dispatch alert | SMS (Twilio) | Email | dispatch.created |
| Urgent escalation | Discord | Slack | ticket.escalated |
| SLA breach | Email | SMS | ticket.sla_breached |
| Appointment reminder | SMS (Twilio) | Email | schedule |
| Technician assignment | Email | In-app | appointment.assigned |
| Account health alert | Discord | Email | account.health.changed |
| Followup overdue | Email | In-app | followup.slippage.detected |
| Survey request | Email | SMS | appointment.completed |
| Reply sent to customer | Gmail | SMTP | ticket.reply.approved |
| Daily standup | Discord | Email | schedule (daily) |
| Report available | Email | In-app | report.generated |

---

## 8. Connector Dependency Graph

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          CONNECTOR ECOSYSTEM                               │
│                                                                            │
│  ┌───────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐ │
│  │  Gmail    │   │  Discord  │   │  Reddit  │   │ Facebook │   │Instagram│ │
│  │(LEMMA)    │   │ (LEMMA)   │   │ (LEMMA)  │   │ (LEMMA)  │   │(LEMMA)  │ │
│  │outbound   │   │outbound   │   │read-only │   │read-only │   │read-only│ │
│  └─────┬─────┘   └─────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬────┘ │
│        │               │              │              │              │      │
│        ▼               ▼              ▼              ▼              ▼      │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │                    Auth Configs                                   │     │
│  │  resqai-gmail  │  resqai-discord  │  resqai-reddit               │     │
│  │  resqai-facebook │ resqai-instagram                               │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                            │
│                           PROVIDER: LEMMA (default)                        │
└────────────────────────────────────────────────────────────────────────────┘

CONNECTOR → FUNCTION → WORKFLOW dependency:
  Gmail:    update_ticket_record function → ticket-intake workflow
            resolve_dispute function → dispute-resolution workflow

  Discord:  finalize_dispatch function → urgent-dispatch workflow
            resolve_dispute function → dispute-resolution workflow
            update_account_health_status function → account-health-monitoring
            finalize_slippage_review function → followup-slippage-detector
            collect_resolved_tickets function → customer-satisfaction-monitor

  Reddit:   support-reply-drafter agent (research)
            resolution-advisor agent (dispute research)

  Facebook: request-classifier agent (read customer messages → create tickets)

  Instagram: request-classifier agent (read business messages → create tickets)

PENDING INTEGRATIONS:
  WhatsApp Business — Not available (explicitly called out)
  Facebook inbound triggers — WEBHOOK schedule not configured
  Instagram inbound triggers — WEBHOOK schedule not configured
  Gmail inbound triggers — Not configured
```

---

## 9. Permission Hierarchy Graph

```
ROLE HIERARCHY (top-down, inheritance implied)
┌─────────────────────────────────────────────────────────────┐
│                        super_admin                          │
│                  (full system access)                       │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                          admin                              │
│              (broad management capabilities)                │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                         manager                             │
│              (team management and oversight)                │
└─────────────────────────────────────────────────────────────┘
         │
    ┌────┴────┬──────────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ agent  │ │techn.  │ │disp.   │ │customer│ │ viewer │
│(support)│ │(field) │ │(ops)   │ │(portal)│ │(read)  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘

GUARD COMPONENT HIERARCHY (React component tree)
┌─────────────────────────────────────────────────────────────┐
│                    ApplicationGuard                          │
│  (checks application-level access)                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                       RoleGuard                              │
│  (checks user roles: super_admin, admin, manager, ...)       │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌──────────┐  ┌──────────────┐
│FeatureGuard│  │PermissionGuard│
│ (feature  │  │(permission   │
│  toggle)  │  │  resource:   │
│           │  │  action)     │
└──────────┘  └──────────────┘

PERMISSION RESOURCE → ACTION MATRIX (defined in role_permissions_v2)
┌─────────────────────────────────────────────────────────────┐
│ Resource          │ Actions                                 │
│───────────────────┼─────────────────────────────────────────│
│ tickets           │ create, read, update, delete, manage    │
│ appointments      │ create, read, update, delete, manage    │
│ customers         │ create, read, update, delete, manage    │
│ technicians       │ create, read, update, delete, manage    │
│ accounts          │ read, update, manage                    │
│ work_orders       │ create, read, update, delete            │
│ disputes          │ create, read, update, resolve           │
│ notifications     │ read, send, manage                      │
│ reports           │ create, read, update, delete, schedule  │
│ users             │ create, read, update, disable           │
│ roles             │ read, assign                            │
│ permissions       │ read, manage                            │
│ connectors        │ read, use, configure                    │
│ system_settings   │ read, update, manage                    │
│ audit_log         │ read, export                            │
│ analytics         │ read, create, schedule                  │
│ inventory         │ create, read, update                    │
│ knowledge         │ create, read, update, publish           │
└─────────────────────────────────────────────────────────────┘

SCOPE LEVELS (stored in role_permissions_v2.scope)
  own   — Only the user's own records
  team  — Records belonging to the user's team/department
  org   — All records within the organization
  all   — System-wide access (super_admin only)
```

---

## 10. Search Index Graph

```
SEARCH CAPABILITIES
┌─────────────────────────────────────────────────────────────┐
│  Database Full-Text Search (GIN indexes)                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ customers_v2:  idx_customers_name_fts (to_tsvector)     ││
│  │              + primary_email, primary_phone indexes     ││
│  │                                                        ││
│  │ users_v2:     email, name indexes                       ││
│  │                                                        ││
│  │ tickets_v2:   status, assigned_to, sla_deadline indexes ││
│  │              + composite: (status, created_at DESC)     ││
│  │                                                        ││
│  │ customers_v2: status, created_at composite index        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Application Search (shared SearchBar component)             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ search-customers function (by name, email, phone)       ││
│  │ search-tickets function (by subject, status, urgency)   ││
│  │ search-knowledge-articles function (by keyword, tags)   ││
│  │                                                        ││
│  │ Filter component supports multi-criteria filtering      ││
│  │ Pagination component for result browsing                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Lemma Platform Search (built-in)                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ File store search (auto-indexed markdown)               ││
│  │ Semantic search across pod knowledge                    ││
│  │ Record search via lemma record query                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

SEARCH FLOW
  User Query
       │
       ▼
  ┌─────────────────────┐
  │ SearchBar component │
  └─────────┬───────────┘
            │
    ┌───────┴───────────┐
    ▼                   ▼
┌──────────┐     ┌──────────────┐
│ DB Search│     │ Lemma Search │
│(via fn)  │     │ (built-in)   │
└────┬─────┘     └──────┬───────┘
     │                  │
     ▼                  ▼
┌──────────┐     ┌──────────────┐
│Customers │     │ Knowledge    │
│Tickets   │     │ Files        │
│Inventory │     │ Records      │
└──────────┘     └──────────────┘
```

---

## 11. Audit Trail Graph

```
┌─────────────────────────────────────────────────────────────┐
│                     AUDIT LOG ARCHITECTURE                   │
│                                                              │
│  POPULATED BY:                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ log-audit-event function (called by ALL functions/agents)││
│  │ record-audit function (standalone audit entry)          ││
│  │ query-audit-log function (read/query)                   ││
│  │                                                         ││
│  │ Auto-logged via pipeline Stage 4 in every function exec ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  TABLE: audit_log_v2                                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ id            UUID (PK)   — unique identifier           ││
│  │ entity_type   TEXT        — e.g. "ticket", "user"       ││
│  │ entity_id     UUID        — the affected entity         ││
│  │ action        TEXT        — e.g. "created", "updated"   ││
│  │ actor_type    TEXT        — "user", "agent", "workflow" ││
│  │ actor_id      TEXT        — who performed the action    ││
│  │ previous_state JSONB     — snapshot before change       ││
│  │ new_state     JSONB      — snapshot after change        ││
│  │ changed_fields TEXT[]    — list of changed column names ││
│  │ ip_address    TEXT       — request origin               ││
│  │ user_agent    TEXT       — client identification        ││
│  │ correlation_id TEXT      — trace across events          ││
│  │ created_at    TIMESTAMPTZ — when the audit was logged   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  INDEXES:                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ idx_entity_type_entity (entity_type, entity_id)         ││
│  │ idx_entity_type_created (entity_type, created_at DESC)  ││
│  │ idx_actor (actor_type, actor_id)                        ││
│  │ idx_action (action)                                     ││
│  │ idx_created_at (created_at DESC)                        ││
│  │ idx_correlation_id (correlation_id)                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  AUDIT EVENT CATEGORIES:                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Entity Events:    ticket, appointment, customer, tech    ││
│  │ User Events:      login, logout, role_change, create     ││
│  │ Security Events:  api_key, permission, auth_failure      ││
│  │ System Events:    config_change, workflow lifecycle      ││
│  │ Business Events:  notification, dispute, feedback, sla   ││
│  │ Integration:      connector connect/disconnect, data_sync││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Analytics Pipeline Graph

```
DATA SOURCES (40+ tables)
┌─────────────────────────────────────────────────────────────┐
│ tickets_v2        │ appointments_v2   │ customers_v2        │
│ work_orders_v2    │ dispatches_v2     │ disputes_v2         │
│ followups_v2      │ accounts_v2       │ feedback_v2         │
│ inventory_v2      │ user_sessions_v2  │ notifications_v2    │
│ tasks_v2          │ events_v2         │ audit_log_v2        │
│ ... (40+ tables)                                             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   ANALYTICS PIPELINE                         │
│                                                              │
│  BATCH AGGREGATION                                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ batch-metric-aggregation (per metric)                   ││
│  │   → calculate-metric-trend (per metric)                 ││
│  │   → sync-events-analytics (event → analytics store)     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  FUNCTIONS                                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ analytics-aggregation (scheduled aggregation)           ││
│  │ dashboard-metrics (live dashboard metrics)              ││
│  │ generate-report-data (on-demand report generation)     ││
│  │ execute-report (run scheduled report)                   ││
│  │ schedule-report (configure recurring reports)           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  WORKFLOWS                                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ trend-analysis_v2         (daily trend detection)       ││
│  │ anomaly-detection_v2      (hourly anomaly detection)    ││
│  │ report-generation_v2      (on-demand/scheduled)         ││
│  │ report-distribution_v2    (when report.generated)       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
         │
         ▼
REPORT OUTPUTS
┌─────────────────────────────────────────────────────────────┐
│ analytics_reports_v2  │  analytics_cache  │  events_v2       │
│ (report definitions)  │  (precomputed)    │  (event stream)  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
CONSUMERS
┌─────────────────────────────────────────────────────────────┐
│ analytics-center_v2 (widgets: dashboards, charts)           │
│ analytics-manager_v2 (agent: oversight)                     │
│ analytics-trend-analyzer_v2 (agent: trend detection)        │
│ analytics-predictive-modeler_v2 (agent: forecasting)        │
│ reporting-distributor_v2 (agent: report distribution)       │
└─────────────────────────────────────────────────────────────┘
```

### 12.1 Metrics Tracked

| Category | Metrics | Source Tables |
|----------|---------|:-------------:|
| Ticket Volume | Created/day, resolved/day, avg resolution time, SLA compliance % | tickets_v2 |
| Appointment | Scheduled/day, completed/day, no-show rate, avg duration | appointments_v2 |
| Technician | Jobs/day, avg rating, on-time %, utilization rate | technicians_v2, work_orders_v2 |
| Customer | New customers, churn rate, repeat rate, avg CSAT | customers_v2, feedback_v2 |
| Dispatch | Avg response time, escalation rate, auto-dispatch % | dispatches_v2 |
| Dispute | Created/month, avg resolution time, auto-resolve % | disputes_v2 |
| Account Health | Healthy/at-risk/critical count, risk score trend | accounts_v2 |
| Followup | Missed rate, avg completion time, slippage rate | followups_v2 |
| Notification | Delivery rate, avg delivery time, channel reliability | notifications_v2 |
| System | Workflow success rate, function execution time, agent accuracy | audit_log_v2, events_v2 |

---

> **End of SYSTEM_INTERACTION_GRAPH.md**
