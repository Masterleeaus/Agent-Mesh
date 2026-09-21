# RESQAI V2 — Dependency Graph

> Phase 1.5 — Architecture Only  
> Principal Integration Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Function Dependency Graph](#1-function-dependency-graph)
2. [Event Dependency Graph](#2-event-dependency-graph)
3. [Connector Dependency Graph](#3-connector-dependency-graph)
4. [Critical Path Analysis](#4-critical-path-analysis)

---

## 1. Function Dependency Graph

### 1.1 Direct Function Call Dependencies

Functions that call sub-functions or are called by other functions:

```
dispatch-notifications (ORCHESTRATOR)
  └── calls → render-notification-template (TRANSFORMER)

send-report (ORCHESTRATOR)
  └── calls → dispatch-notifications (for actual delivery)

provision-user (ORCHESTRATOR)
  └── calls → dispatch-notifications (for welcome email)

batch-sla-check (AGGREGATOR)
  └── calls → check-sla-deadline (for individual ticket check)

account-health-scan (AGGREGATOR)
  └── calls → generate-account-score (for composite score calculation)

generate-standup-report (AGGREGATOR)
  └── calls → collect-resolved-tickets (for resolved ticket data)

batch-metric-aggregation (AGGREGATOR)
  └── calls → calculate-metric-trend (per metric)

recover-workflow-instance (ORCHESTRATOR)
  └── calls → verify-workflow-health (to assess current state)
```

### 1.2 Workflow-to-Function Call Graph

```
Workflow                                 Functions Called
────────────────────────────────────────────────────────────────────────
ticket-auto-response_v2                  check-ticket-urgency, dispatch-notifications
ticket-intake_v2                         check-ticket-urgency, update-ticket-record, dispatch-notifications
ticket-escalation_v2                     update-ticket-record, dispatch-notifications
sla-enforcement_v2                       batch-sla-check, classify-ticket-sla-tier
appointment-booking_v2                   assign-appointment-technician, dispatch-notifications
appointment-reminders_v2                 fetch-upcoming-appointments, schedule-appointment-reminders, check-reminder-window, dispatch-notifications
appointment-completion_v2                create-followup-tasks
standard-dispatch_v2                     finalize-dispatch, calculate-dispatch-priority, dispatch-notifications
urgent-dispatch_v2                       finalize-dispatch, calculate-dispatch-priority, dispatch-notifications
work-order-fulfillment_v2                create-work-order, update-work-order-stage, complete-work-order, record-inventory-transaction
work-order-verification_v2               (no functions — agent-only node)
dispute-resolution_v2                    resolve-dispute, dispatch-notifications
dispute-escalation_v2                    resolve-dispute
account-health-scan_v2                   account-health-scan, flag-slipping-followups, update-account-health-status
followup-management_v2                   create-followup-tasks, dispatch-notifications
followup-slippage-detector_v2            flag-slipping-followups, finalize-slippage-review
retention-campaign_v2                    create-followup-tasks
customer-satisfaction-monitor_v2         process-feedback-survey, dispatch-notifications
feedback-analysis_v2                     analyze-feedback-sentiment
knowledge-article-lifecycle_v2           (no functions)
knowledge-gap-detection_v2               (no functions)
notification-delivery_v2                 render-notification-template, dispatch-notifications, process-notification-delivery
daily-standup_v2                         collect-resolved-tickets, generate-standup-report, create-operations-tasks
operations-coordination_v2               create-operations-tasks
report-generation_v2                     generate-report-data
report-distribution_v2                   send-report
trend-analysis_v2                        sync-events-analytics, calculate-metric-trend, batch-metric-aggregation
anomaly-detection_v2                     batch-metric-aggregation
quality-review_v2                        evaluate-quality-score, flag-quality-violation
user-provisioning_v2                     provision-user, deactivate-user
system-config-management_v2              validate-config-change, apply-config-change, log-audit-event
inventory-reorder_v2                     check-inventory-level, reorder-inventory, record-inventory-transaction, dispatch-notifications
workflow-health-monitor_v2               verify-workflow-health, recover-workflow-instance, reset-circuit-breaker
```

### 1.3 Most-Called Functions (by Workflow Count)

| Function | Called By (# Workflows) | Callers |
|----------|:----------------------:|---------|
| dispatch-notifications | 19 | ticket-auto-response, ticket-intake, ticket-escalation, appointment-booking, appointment-reminders, standard-dispatch, urgent-dispatch, dispute-resolution, customer-satisfaction-monitor, notification-delivery, report-distribution, account-health-scan, followup-management, retention-campaign, sla-enforcement, operations-coordination, inventory-reorder, user-provisioning, system-config-management |
| create-followup-tasks | 3 | appointment-completion, followup-management, retention-campaign |
| update-ticket-record | 3 | ticket-intake, ticket-escalation, ticket-auto-response |
| finalize-dispatch | 2 | standard-dispatch, urgent-dispatch |
| check-ticket-urgency | 2 | ticket-intake, ticket-auto-response |
| flag-slipping-followups | 2 | account-health-scan, followup-slippage-detector |
| resolve-dispute | 2 | dispute-resolution, dispute-escalation |
| create-operations-tasks | 2 | daily-standup, operations-coordination |
| batch-metric-aggregation | 2 | trend-analysis, anomaly-detection |

---

## 2. Event Dependency Graph

### 2.1 Event Producer-Consumer Chain

```
EVENT → [Consumer Type]: Handler(s)
══════════════════════════════════════════════════════════════════

ticket.created
  → [workflow]: ticket-auto-response_v2, ticket-intake_v2
  → [agent]: support-request-classifier_v2
  → [notification]: Customer confirmation

ticket.classified
  → [workflow]: urgent-dispatch_v2 (if urgent)
  → [agent]: support-reply-drafter_v2, knowledge-article-suggester_v2
  → [notification]: (none directly)

ticket.escalated
  → [workflow]: ticket-escalation_v2
  → [agent]: support-escalation-manager_v2
  → [notification]: Manager escalation alert

ticket.sla_breached
  → [workflow]: sla-enforcement_v2, ticket-escalation_v2
  → [agent]: support-sla-monitor_v2, support-escalation-manager_v2
  → [notification]: Manager SLA breach

ticket.closed
  → [workflow]: customer-satisfaction-monitor_v2
  → [agent]: cx-satisfaction-survey_v2
  → [notification]: (none directly)

appointment.created
  → [workflow]: appointment-booking_v2
  → [agent]: scheduling-appointment-scheduler_v2, scheduling-technician-suggester_v2
  → [notification]: Customer booking confirmation

appointment.completed
  → [workflow]: appointment-completion_v2, work-order-fulfillment_v2
  → [agent]: operations-work-order-manager_v2, crm-followup-manager_v2, cx-satisfaction-survey_v2
  → [notification]: (none directly)

appointment.no_show
  → [workflow]: (none)
  → [agent]: appointment-no-show-handler_v2
  → [notification]: Customer no-show followup

dispatch.created
  → [workflow]: standard-dispatch_v2, urgent-dispatch_v2
  → [agent]: dispatch-technician-dispatcher_v2
  → [notification]: Technician dispatch alert

dispatch.escalated
  → [workflow]: dispute-escalation_v2
  → [agent]: dispatch-emergency-response_v2, dispatch-manager_v2
  → [notification]: Manager urgent escalation

dispute.created
  → [workflow]: dispute-resolution_v2
  → [agent]: resolution-advisor_v2
  → [notification]: Resolution Manager new dispute

dispute.resolved
  → [workflow]: (none)
  → [agent]: crm-followup-manager_v2, cx-satisfaction-survey_v2
  → [notification]: Customer resolution notice

account.health.changed
  → [workflow]: account-health-scan_v2, retention-campaign_v2
  → [agent]: crm-account-health-monitor_v2, crm-retention-specialist_v2
  → [notification]: Account Manager health downgrade

followup.slippage.detected
  → [workflow]: followup-slippage-detector_v2
  → [agent]: crm-followup-manager_v2
  → [notification]: Assigned user overdue

feedback.submitted
  → [workflow]: feedback-analysis_v2
  → [agent]: cx-feedback-analyzer_v2, cx-manager_v2
  → [notification]: CRM Manager feedback received

notification.send (FROM ALL)
  → [workflow]: notification-delivery_v2
  → [function]: dispatch-notifications
  → [notification]: (N/A — this is the notification itself)

report.generated
  → [workflow]: report-distribution_v2
  → [agent]: reporting-distributor_v2
  → [notification]: Subscribers report ready

system.config.changed
  → [workflow]: system-config-management_v2
  → [agent]: admin-system-config_v2, admin-connector-manager_v2
  → [notification]: Admin config change

system.health.alert
  → [workflow]: (none)
  → [agent]: admin-manager_v2, executive-director_v2
  → [notification]: Admin system health
```

### 2.2 Event Fan-Out Leaders

Events with the most immediate downstream consumers:

| Event | Workflow Consumers | Agent Consumers | Notification Consumers | Total Consumers |
|-------|:-----------------:|:---------------:|:---------------------:|:---------------:|
| ticket.created | 2 | 1 | 1 | 4 |
| appointment.completed | 2 | 3 | 0 | 5 |
| dispatch.created | 2 | 1 | 1 | 4 |
| dispute.resolved | 0 | 2 | 1 | 3 |
| account.health.changed | 2 | 2 | 1 | 5 |
| feedback.submitted | 1 | 2 | 1 | 4 |

---

## 3. Connector Dependency Graph

### 3.1 Connector → Consumer Chain

```
SMTP (Email)
  └── Used by: dispatch-notifications function
      └── Called by: 19 workflows (all notification-sending)
      └── Fallback: Gmail → SMS

Twilio SMS
  └── Used by: dispatch-notifications function
      └── Called by: 19 workflows
      └── Fallback: Email → In-app

Discord Webhook
  └── Used by: dispatch-notifications function
      └── Called by: 6 workflows (escalations, alerts)
      └── Fallback: Slack → Email

Slack
  └── Used by: dispatch-notifications function
      └── Called by: 8 workflows (team alerts, standups)
      └── Fallback: Email → In-app

Gmail
  └── Used by: dispatch-notifications function
      └── Called by: 2 workflows (customer email replies)
      └── Fallback: SMTP → SMS
```

### 3.2 Connector Dependency Chain

```
dispatch-notifications function
    │
    ├── DEPENDS ON → render-notification-template function
    ├── DEPENDS ON → notification_templates_v2 (read)
    ├── DEPENDS ON → notification_channels_v2 (read)
    ├── DEPENDS ON → notifications_v2 (write)
    │
    ├── USES CONNECTOR → SMTP
    │     └── DEPENDS ON → connectors_v2 (config)
    │
    ├── USES CONNECTOR → Twilio SMS
    │     └── DEPENDS ON → connectors_v2 (config)
    │
    ├── USES CONNECTOR → Discord Webhook
    │     └── DEPENDS ON → connectors_v2 (config)
    │
    ├── USES CONNECTOR → Slack
    │     └── DEPENDS ON → connectors_v2 (config)
    │
    └── USES CONNECTOR → Gmail
          └── DEPENDS ON → connectors_v2 (config)
```

---

## 4. Critical Path Analysis

### 4.1 Most Dependent Functions

Functions with the most downstream dependencies (highest blast radius if they fail):

| Function | Failure Impact | Affected Components |
|----------|:--------------:|---------------------|
| **dispatch-notifications** | CRITICAL | 19 workflows, 9 agents, ALL notification delivery |
| **log-audit-event** | MEDIUM | ALL functions (audit gap, but non-blocking) |
| **create-followup-tasks** | MEDIUM | 3 workflows, followup lifecycle |
| **update-ticket-record** | MEDIUM | 3 workflows, ticket lifecycle |
| **validate-permissions** | CRITICAL | ALL functions (permission denied) |

### 4.2 Critical Path: Urgent Dispatch

The fastest path from ticket creation to technician dispatch (latency-critical):

```
ticket.created
  → Event Router (<50ms)
  → urgent-dispatch_v2 workflow start (<100ms)
  → dispatch-coordinator agent (<5s)
    → calculate-dispatch-priority (<10ms)
    → finalize-dispatch (<80ms)
  → dispatch-technician-dispatcher agent (<2s)
    → dispatch-notifications (<1s)
  → technician notified

Total: ~8s (P50), ~15s (P95)
```

### 4.3 Critical Path: SLA Breach Detection

```
Scheduled batch-sla-check (cron, every 5min)
  → batch-sla-check function (<2s for 1000 tickets)
    → check-sla-deadline (per ticket, <30ms)
    → emit ticket.sla_breached (per breach)
  → Event Router (<50ms)
  → sla-enforcement_v2 workflow (<100ms)
    → dispatch-notifications (<1s)
  → Manager notified

Total from cron trigger: ~3s
Max detection latency: 5min (cron interval) + 3s = 5min 3s
```

### 4.4 No Single Point of Failure

| Component | Redundancy | Mitigation |
|-----------|:----------:|------------|
| dispatch-notifications | Multi-channel fallback | SMTP → Gmail → SMS |
| connectors_v2 | Config stored in DB | Circuit breaker + auto-recovery |
| events_v2 | Global event log | Replay capability |
| idempotency store | Per-function TTL | Prevents duplicate execution |
| circuit breaker | Per-connector | Isolates failure to one channel |

---

> **End of DEPENDENCY_GRAPH.md**  
> **End of Phase 1.5 — Execution Layer Architecture**
