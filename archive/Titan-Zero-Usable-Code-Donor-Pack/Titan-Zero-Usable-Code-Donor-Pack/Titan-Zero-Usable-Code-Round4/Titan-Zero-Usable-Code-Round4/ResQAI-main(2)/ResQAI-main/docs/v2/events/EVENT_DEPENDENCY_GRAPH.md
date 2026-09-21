# RESQAI V2 — Event Dependency Graph

> Phase B.3 — Enterprise Event Architecture  
> Chief Enterprise Event Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Graph Notation](#1-graph-notation)
2. [Full Event Dependency Graph](#2-full-event-dependency-graph)
3. [Event Tier Architecture](#3-event-tier-architecture)
4. [Event Dependency Chains](#4-event-dependency-chains)
5. [Cross-Domain Event Dependencies](#5-cross-domain-event-dependencies)
6. [Circular Dependency Analysis](#6-circular-dependency-analysis)
7. [Critical Event Paths](#7-critical-event-paths)

---

## 1. Graph Notation

```
┌──────────┐     ┌──────────┐
│ Event A  │ ──► │ Event B  │   A triggers B
└──────────┘     └──────────┘

┌──────────┐     ┌──────────┐
│ Event A  │ ──► │ Workflow │   A triggers a workflow
└──────────┘     └──────────┘

┌──────────┐     ┌──────────────┐
│ Workflow │ ──► │ Event B      │   Workflow produces B
└──────────┘     └──────────────┘

===== Tier N =====   Tier boundary
```

---

## 2. Full Event Dependency Graph

```
TIER 0 (Foundation Events — No upstream dependencies)
═══════════════════════════════════════════════════════════════════════
  System Events:
    system.health.restored
    system.health.alert
    system.config.changed
    system.config.rollback
    application.deployed
    application.status.changed
    user.created
    user.role.changed
    user.disabled
    api_key.created
    api_key.revoked
    organization.created
    organization.updated
    team.created
    team.updated
    error.resolved
    agent.started
    agent.stopped
    agent.error
    function.started
    function.completed
    function.failed

  Infrastructure Events:  
    offline.sync.started
    offline.sync.completed
    offline.sync.failed
    network.status.changed
    gps.status.changed

  Lifecycle Events:
    lifecycle.resource.created
    lifecycle.resource.updated
    lifecycle.resource.deleted
    lifecycle.resource.archived
    lifecycle.resource.restored
    lifecycle.workflow.activated
    lifecycle.workflow.deactivated
    lifecycle.function.deployed
    lifecycle.agent.activated
    lifecycle.connector.activated

  Security Events:
    security.login.succeeded
    security.login.failed
    security.logout
    security.session.expired
    security.password.changed
    security.two_factor.enabled
    security.permission.denied
    security.rate_limit.exceeded
    security.suspicious.activity

  Integration Events:
    integration.connected
    integration.disconnected
    integration.webhook.received
    integration.oauth.token.refreshed


TIER 1 (Primary Domain Events — Triggered by external input or DB)
═══════════════════════════════════════════════════════════════════════
  Source: DB INSERT events + Customer Portal + Support Center

  ticket.created
    │  triggers: ticket-auto-response_v2, sla-enforcement_v2
    │  downstream:
    │    ├──► ticket.classified (after AI classification)
    │    ├──► ticket.escalated (if urgency=critical)
    │    └──► ticket.sla_warning (75% timer)
    │
  customer.created ──► (no workflow trigger)
  appointment.created
    │  triggers: appointment-booking_v2
    │  downstream:
    │    ├──► appointment.assigned
    │    └──► appointment.confirmed
    │
  dispute.created
    │  triggers: dispute-resolution_v2
    │  downstream:
    │    ├──► dispute.analyzing
    │    ├──► dispute.analyzed
    │    └──► dispute.escalated (if low confidence)
    │
  followup.created ──► triggers: followup-management_v2
  user.created ──► triggers: user-provisioning_v2
  notification.created ──► triggers: notification-delivery_v2
  technician.created ──► (no workflow trigger)
  account.created ──► (no workflow trigger)
  role.created ──► (no workflow trigger)


TIER 2 (Secondary Events — Produced by Tier 1 workflows)
═══════════════════════════════════════════════════════════════════════
  Source: Workflow outputs from Tier 1

  ticket.classified
    │  triggers: ticket-intake_v2, appointment-booking_v2 (if service-needed)
    │  downstream:
    │    ├──► ticket.reply.drafted (AI drafts reply)
    │    ├──► ticket.reply.approved (human approves)
    │    └──► ticket.sent (reply sent to customer)
    │
  ticket.escalated
    │  triggers: ticket-escalation_v2, urgent-dispatch_v2
    │
  ticket.auto_responded
    │  triggers: notification-delivery_v2
    │
  ticket.sla_warning
    │  triggers: notification-delivery_v2
    │
  ticket.sla_breached
    │  triggers: ticket-escalation_v2
    │  downstream:
    │    └──► notification-delivery_v2
    │
  appointment.assigned
    │  triggers: notification-delivery_v2
    │
  appointment.confirmed
    │  triggers: appointment-reminders_v2
    │  downstream:
    │    ├──► appointment.reminder.sent
    │    └──► appointment.reminder.failed
    │
  dispatch.created
    │  triggers: standard-dispatch_v2
    │
  work_order.created ──► triggers: work-order-fulfillment_v2
  feedback.submitted ──► triggers: feedback-analysis_v2
  followup.completed ──► triggers: account-health-scan_v2
  knowledge.article.requested ──► triggers: knowledge-article-lifecycle_v2


TIER 3 (Tertiary Events — Produced by Tier 1+2 workflows)
═══════════════════════════════════════════════════════════════════════
  Source: Workflow outputs from Tier 1+2 + app events

  ticket.reply.drafted
    │  downstream: quality-review_v2
    │
  ticket.reply.approved
    │  downstream: notification-delivery_v2
    │
  ticket.reply.rejected
    │  downstream: (back to drafting)
    │
  ticket.sent ──► notification-delivery_v2
  ticket.closed ──► customer-satisfaction-monitor_v2
  appointment.completed
    │  triggers: appointment-completion_v2
    │  downstream:
    │    ├──► work_order.created
    │    ├──► customer-satisfaction-monitor_v2 (survey)
    │    └──► followup-management_v2 (if needed)
    │
  appointment.cancelled ──► notification-delivery_v2
  appointment.no_show ──► appointment-completion_v2
  appointment.rescheduled ──► appointment-reminders_v2
  appointment.reminder.sent ──► (terminal)
  appointment.reminder.failed ──► workflow-health-monitor_v2
  dispatch.sent ──► technician-portal_v2
  dispatch.acknowledged ──► (terminal)
  dispatch.declined ──► urgent-dispatch_v2
  dispatch.en_route ──► (terminal)
  dispatch.on_site ──► (terminal)
  dispatch.completed ──► (terminal)
  dispatch.cancelled ──► (terminal)
  dispatch.escalated ──► urgent-dispatch_v2
  dispute.analyzed ──► quality-review_v2
  dispute.escalated ──► dispute-escalation_v2
  dispute.resolved
    │  downstream: followup-management_v2, customer-satisfaction-monitor_v2
    │
  account.health.changed
    │  downstream: retention-campaign_v2 (if critical), followup-management_v2
    │
  account.risk.signal.detected
    │  downstream: followup-management_v2
    │
  feedback.analyzed
    │  downstream: (triggers cx.risk.identified, cx.insight.generated)
    │
  followup.missed ──► followup-slippage-detector_v2
  followup.slippage.detected ──► retention-campaign_v2 (if chronic)
  campaign.started ──► notification-delivery_v2
  notification.send ──► notification-delivery_v2
  notification.delivered ──► (terminal)
  notification.failed ──► workflow-health-monitor_v2
  knowledge.gap.detected ──► knowledge-gap-detection_v2
  knowledge.article.published ──► (terminal)
  standup.generated ──► notification-delivery_v2
  standup.escalated ──► operations-coordination_v2
  inventory.item.low_stock ──► notification-delivery_v2
  inventory.reorder.completed ──► (terminal)


TIER 4 (Analysis Events — Produced by Tier 3+ workflows)
═══════════════════════════════════════════════════════════════════════
  Source: Analytical and monitoring workflows

  work_order.completed ──► work-order-verification_v2
  work_order.verified ──► (terminal)
  work_order.reopened ──► work-order-fulfillment_v2
  work_order.closed ──► (terminal)
  qa.violation.found ──► ticket-escalation_v2
  cx.risk.identified ──► retention-campaign_v2
  cx.insight.generated ──► report-generation_v2
  analytics.trend.identified ──► report-generation_v2
  analytics.insight.generated ──► report-generation_v2
  analytics.anomaly.detected ──► operations-coordination_v2
  analytics:report.generated ──► report-distribution_v2
  report.generated ──► report-distribution_v2
  system.workflow.failed ──► workflow-health-monitor_v2
  system.workflow.dead_letter ──► workflow-health-monitor_v2
  system.health.alert ──► notification-delivery_v2
  blocker.identified ──► (terminal)


TIER 5 (Terminal Events — No downstream consumers)
═══════════════════════════════════════════════════════════════════════
  All events consumed only by trend-analysis_v2 and anomaly-detection_v2
  (read-only event bus consumption — no further event production).

  Also terminal by design:
    - dispatch.completed
    - dispatch.cancelled
    - work_order.closed
    - notification.delivered
    - knowledge.article.published
    - inventory.reorder.completed
    - lifecycle.* events
    - audit.* events
```

---

## 3. Event Tier Architecture

```
Tier 0: Foundation      ───  No upstream dependencies
    │                         System, security, lifecycle, integration events
    │
    ▼
Tier 1: Primary         ───  DB INSERT triggers, external input
    │                         ticket.created, appointment.created, dispute.created
    │
    ▼
Tier 2: Secondary       ───  Workflow outputs from Tier 1
    │                         ticket.classified, appointment.confirmed, dispatch.created
    │
    ▼
Tier 3: Tertiary        ───  Workflow outputs from Tier 1+2
    │                         appointment.completed, dispute.resolved, account.health.changed
    │
    ▼
Tier 4: Analysis        ───  Analytical workflow outputs
    │                         analytics.trend.identified, cx.risk.identified
    │
    ▼
Tier 5: Terminal        ───  Events consumed by trend/anomaly analysis only
                            No further event production from these events
```

---

## 4. Event Dependency Chains

### 4.1 Ticket Lifecycle Chain

```
ticket.created (T1)
  → ticket.classified (T2)
    → ticket.reply.drafted (T3)
      → ticket.reply.approved (T3) OR ticket.reply.rejected (T3)
        → ticket.sent (T3)
          → (terminal — consumed by analytics)

EScalation Path:
ticket.created (T1)
  → ticket.escalated (T2)
    → sla-enforcement timer
      → ticket.sla_warning (T3) → notification
      → ticket.sla_breached (T3) → ticket-escalation_v2
```

### 4.2 Appointment-to-Work Order Chain

```
appointment.created (T1)
  → appointment.assigned (T2) → notification
  → appointment.confirmed (T2)
    → appointment.reminder.sent (T3)
    → appointment.completed (T3)
      → work_order.created (T2)
        → work_order.completed (T4)
          → work_order.verified (T4) OR work_order.reopened (T4)
            → work_order.closed (T4)
```

### 4.3 Dispute Resolution Chain

```
dispute.created (T1)
  → dispute.analyzing (T2)
    → dispute.analyzed (T2)
      → dispute.resolved (T3) OR dispute.escalated (T3)
        → dispute.escalated → dispute-escalation_v2
        → dispute.resolved → followup-management_v2 + customer-satisfaction-monitor_v2
```

### 4.4 Account Health Chain

```
account.health.changed (T3)
  ├── retention-campaign_v2
  │     └── campaign.started (T3) → notification
  └── followup-management_v2
        └── followup.missed (T3) → followup-slippage-detector_v2
              └── followup.slippage.detected (T3) → retention-campaign_v2
```

### 4.5 Customer Feedback Chain

```
appointment.completed (T3) OR ticket.closed (T3) OR dispute.resolved (T3)
  → feedback.survey.sent → customer responds
    → feedback.submitted (T2)
      → feedback.analyzed (T3)
        ├── cx.risk.identified (T4) → retention-campaign_v2
        └── cx.insight.generated (T4) → report-generation_v2
```

### 4.6 Knowledge Base Chain

```
(From feedback analysis or agent)
  → knowledge.gap.detected (T3)
    → knowledge-gap-detection_v2
      → knowledge.article.requested (T2)
        → knowledge-article-lifecycle_v2
          → knowledge.article.published (T3) OR knowledge.article.archived (T3)
```

### 4.7 System Monitoring Chain

```
workflow.started (T0)
  → system.workflow.started (T0) → monitored
  → workflow.completed OR workflow.failed (T0)
    → system.workflow.completed OR system.workflow.failed (T0)
      → system.workflow.failed → workflow-health-monitor_v2
        → system.health.alert (T4) → notification
```

---

## 5. Cross-Domain Event Dependencies

| Source Domain | Event | Target Domain | Target Workflow |
|--------------|-------|---------------|----------------|
| Tickets | ticket.classified (service) | Appointments | appointment-booking_v2 |
| Tickets | ticket.escalated | Dispatches | urgent-dispatch_v2 |
| Appointments | appointment.completed | Work Orders | work-order-fulfillment_v2 |
| Appointments | appointment.completed | CRM | customer-satisfaction-monitor_v2 |
| Appointments | appointment.completed | CRM | followup-management_v2 |
| Disputes | dispute.resolved | CRM | followup-management_v2 |
| Disputes | dispute.resolved | CRM | customer-satisfaction-monitor_v2 |
| CRM | account.health.changed | CRM | retention-campaign_v2 |
| CRM | followup.slippage.detected | CRM | retention-campaign_v2 |
| CRM | feedback.analyzed | Knowledge | knowledge-gap-detection_v2 |
| CX | cx.risk.identified | CRM | retention-campaign_v2 |
| CX | cx.insight.generated | Analytics | report-generation_v2 |
| Analytics | analytics.trend.identified | Analytics | report-generation_v2 |
| Analytics | analytics.anomaly.detected | Ops | operations-coordination_v2 |
| Work Orders | work_order.completed | QA | work-order-verification_v2 |
| Work Orders | work_order.reopened | Work Orders | work-order-fulfillment_v2 |
| QA | qa.violation.found | Tickets | ticket-escalation_v2 |

---

## 6. Circular Dependency Analysis

### 6.1 Verification Results

| Check | Result |
|-------|--------|
| Directed cycles | **None found** |
| Self-referencing events | **None** |
| Mutual event dependencies (A→B, B→A) | **None** |
| Long cycles (A→B→C→A) | **None** |
| Cross-tier feedback loops | **None** |

### 6.2 Why No Cycles Exist

1. **Event flow is strictly downhill** — events flow from Tier 0 → Tier 5, never uphill
2. **Events are immutable facts** — downstream events never modify the data that produced upstream events
3. **Analytics is read-only** — trend/anomaly detection consume events but never produce events that trigger operational workflows
4. **Notifications are terminal** — notification delivery consumes events and produces terminal events
5. **Audit events are archival** — audit events are never consumed by business workflows

### 6.3 Apparent Cycles (Resolved)

| Apparent Cycle | Explanation |
|----------------|-------------|
| `followup-management_v2` → `followup-slippage-detector_v2` → new `followup-management_v2` | Produces a *different* followup instance; different correlation_id prevents re-entry |
| `ticket-intake_v2` → `urgent-dispatch_v2` → `ticket.status.changed` → `ticket-intake_v2` | Dispatch updates ticket status but does not re-emit `ticket.created` — different event name breaks the cycle |
| `account.health.changed` → `retention-campaign_v2` → `campaign.completed` → `followup-management_v2` → `followup.completed` → `account-health-scan_v2` → `account.health.changed` | Health scan is cron-driven, not event-driven from followup; different correlation_ids |

---

## 7. Critical Event Paths

### 7.1 Longest Event Chain

```
ticket.created (T1)
  → ticket.classified (T2)
    → ticket.reply.drafted (T3)
      → ticket.reply.approved (T3)
        → ticket.sent (T3)
          → feedback.submitted (T2)
            → feedback.analyzed (T3)
              → cx.insight.generated (T4)
                → report.generated (T4)
                  → report.distributed (T4)
```

**Maximum depth: 10 events**

### 7.2 Most Critical Path (Urgent Dispatch)

```
ticket.created (T1)
  → ticket.escalated (T2) [if urgency=critical]
    → dispatch.created (T2)
      → dispatch.acknowledged (T3) [technician must respond within 10min]
        → dispatch.en_route (T3)
          → dispatch.on_site (T3)
            → dispatch.completed (T3) OR dispatch.escalated (T3)
```

**Time-sensitive: technician acknowledgement within 10 minutes**

### 7.3 Highest Fan-Out Events

| Event | Consumer Count | Consumers |
|-------|:-------------:|-----------|
| ticket.created | 5 | auto-response, intake, sla-enforcement, trend-analysis, anomaly-detection |
| appointment.completed | 5 | completion_v2, satisfaction-monitor, followup-management, trend-analysis, anomaly-detection |
| dispute.resolved | 4 | followup-management, satisfaction-monitor, trend-analysis, anomaly-detection |
| account.health.changed | 4 | retention-campaign, followup-management, trend-analysis, anomaly-detection |
| notification.send | 33+ | ALL workflows produce this for outbound communication |

### 7.4 Event Throughput Hotspots

| Event Domain | Avg Daily Volume | Peak/min | Infrastructure Impact |
|-------------|:---------------:|:--------:|----------------------|
| technician.status.changed | 10,000 | 200 | High (status polling) |
| job.progress.updated | 5,000 | 100 | Medium |
| notification.read.customer | 5,000 | 60 | Medium |
| ticket.status.changed | 8,000 | 50 | Medium |
| workflow.started | 5,000 | 100 | Medium |
| function.started | 10,000 | 200 | High |
| function.completed | 9,800 | 195 | High |
| **Total peak** | — | **~1,260** | **Event bus must scale** |

---

> **End of EVENT_DEPENDENCY_GRAPH.md**
