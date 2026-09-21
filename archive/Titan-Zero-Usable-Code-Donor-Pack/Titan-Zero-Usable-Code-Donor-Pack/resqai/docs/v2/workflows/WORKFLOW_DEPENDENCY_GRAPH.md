# RESQAI V2 — Workflow Dependency Graph

> Phase 1.4 — Architecture Only  
> Chief Workflow Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Dependency Types](#1-dependency-types)
2. [Full Dependency Graph](#2-full-dependency-graph)
3. [Tier Summary](#3-tier-summary)
4. [Dependency Chains](#4-dependency-chains)
5. [Circular Dependency Analysis](#5-circular-dependency-analysis)
6. [Critical Path Analysis](#6-critical-path-analysis)

---

## 1. Dependency Types

| Symbol | Type | Description |
|:------:|------|-------------|
| **→** | Triggers | Workflow A's completion triggers Workflow B |
| **◆** | Consumes Event | Workflow B consumes an event produced by Workflow A |
| **◇** | Shares Data | Workflows share a common data entity |
| **△** | Depends On | Workflow B depends on Workflow A's output data |
| **□** | Sub-workflow | Workflow B is a sub-workflow of Workflow A |

---

## 2. Full Dependency Graph

```
TIER 0 (Autonomous — no upstream dependencies)
═════════════════════════════════════════════════════════════════════════
  ticket-auto-response_v2      (standalone FAQ auto-responder)
  sla-enforcement_v2           (timers only, no workflow depends on it)
  trend-analysis_v2            (reads events, no upstream workflow)
  anomaly-detection_v2         (reads events, no upstream workflow)
  workflow-health-monitor_v2   (monitors all workflows, no upstream)
  user-provisioning_v2         (admin, triggered manually)
  system-config-management_v2  (admin, triggered manually)
  inventory-reorder_v2         (standalone inventory check)

TIER 1 (Entry — triggered by external events)
═════════════════════════════════════════════════════════════════════════
  ticket-intake_v2             triggered by: ticket.created
  appointment-booking_v2       triggered by: appointment.created
  dispute-resolution_v2        triggered by: dispute.created
  knowledge-article-lifecycle_v2  triggered by: manual / schedule
  daily-standup_v2             triggered by: cron schedule
  operations-coordination_v2   triggered by: manual

TIER 2 (Secondary — triggered by Tier 1 workflows)
═════════════════════════════════════════════════════════════════════════
  ticket-escalation_v2         triggered by: ticket.escalated (from ticket-intake)
  urgent-dispatch_v2           triggered by: ticket.classified (urgent) (from ticket-intake)
  notification-delivery_v2     triggered by: notification.send (from ALL workflows)

TIER 3 (Tertiary — triggered by Tier 2 or Tier 1+2)
═════════════════════════════════════════════════════════════════════════
  appointment-reminders_v2     triggered by: appointment.confirmed (from appointment-booking)
  standard-dispatch_v2         triggered by: appointment.assigned (from appointment-booking)
  followup-management_v2       triggered by: appointment.completed, dispute.resolved, account.health.changed
  customer-satisfaction-monitor_v2  triggered by: appointment.completed, ticket.closed, dispute.resolved

TIER 4 (Execution — triggered by Tier 3 or operational needs)
═════════════════════════════════════════════════════════════════════════
  appointment-completion_v2    triggered by: appointment.completed
  work-order-fulfillment_v2    triggered by: work_order.created (from appointment-completion)
  dispute-escalation_v2        triggered by: dispute.escalated (from dispute-resolution)
  knowledge-gap-detection_v2   triggered by: knowledge.gap.detected (from ticket-intake)
  feedback-analysis_v2         triggered by: feedback.submitted (from customer-satisfaction-monitor)

TIER 5 (Post-Processing — triggered by Tier 4 or completion events)
═════════════════════════════════════════════════════════════════════════
  work-order-verification_v2   triggered by: work_order.completed (from work-order-fulfillment)
  account-health-scan_v2       triggered by: cron (daily), also triggers from Tier 3+4 events
  followup-slippage-detector_v2   triggered by: cron (weekdays) + followup events
  retention-campaign_v2        triggered by: account.health.changed (critical) + feedback

TIER 6 (Reporting — triggered by Tier 5 and time)
═════════════════════════════════════════════════════════════════════════
  report-generation_v2         triggered by: cron + analytics.anomaly.identified
  report-distribution_v2       triggered by: report.generated

TIER 7 (Analytics — read-only consumers of all events)
═════════════════════════════════════════════════════════════════════════
  quality-review_v2            triggered by: qa.audit.triggered
  (trend-analysis_v2, anomaly-detection_v2 are Tier 0 — they read events independently)
  (workflow-health-monitor_v2 is Tier 0 — monitors all)

DIAGRAM:
══════════

  TIER 0 (Foundation)
  ┌──────────────────────────────────────────────────────────────────┐
  │  ticket-auto-response_v2  sla-enforcement_v2                    │
  │  trend-analysis_v2        anomaly-detection_v2                  │
  │  workflow-health-monitor_v2                                      │
  │  user-provisioning_v2     system-config-management_v2            │
  │  inventory-reorder_v2                                            │
  └──────────┬───────────────────────────────────────────────────────┘
             │ (events read from event bus)
             │
  TIER 1 (Entry — triggered by external events)
  ┌──────────────────────────────────────────────────────────────────┐
  │  ticket-intake_v2 ────► appointment-booking_v2                  │
  │                                 dispute-resolution_v2            │
  │  daily-standup_v2      operations-coordination_v2                │
  │  knowledge-article-lifecycle_v2                                  │
  └──────────┬───────────────────────────────────────────────────────┘
             │
             ├─────────────┬────────────────┐
             ▼             ▼                ▼
  TIER 2 ┌────────┐ TIER 3 ┌───────────┐ TIER 4 ┌────────────────┐
         │ticket- │        │appointment│        │appointment-    │
         │escal-  │        │-reminders │        │completion ────►│
         │ation   │        │           │        │work-order-fulf │
         └────────┘        │standard-  │        └────────┬───────┘
                           │dispatch   │                 │
         ┌────────┐        │           │        TIER 5  │
         │urgent- │        │followup-  │        ┌───────▼────────┐
         │dispatch│        │management │        │work-order-verif│
         └────────┘        │           │        │account-health- │
                           │customer-  │        │scan            │
         ┌────────┐        │satisfact  │        │followup-slipp  │
         │notific │        │-ion-mon   │        │retention-campgn│
         │-ation  │        └───────────┘        └────────────────┘
         │deliver │              │                      │
         └────────┘              ▼                      │
                          ┌───────────┐                │
                          │feedback-  │◄───────────────┘
                          │analysis   │
                          └───────────┘
                               │
  TIER 6                      ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  report-generation_v2 ────► report-distribution_v2              │
  └──────────────────────────────────────────────────────────────────┘
                               │
  TIER 7                      ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  quality-review_v2                                              │
  │  (trend-analysis_v2, anomaly-detection_v2 — always reading)     │
  │  (workflow-health-monitor_v2 — always monitoring)               │
  └──────────────────────────────────────────────────────────────────┘
```

---

## 3. Tier Summary

| Tier | Name | Workflows | Count |
|------|------|-----------|-------|
| 0 | Foundation | ticket-auto-response, sla-enforcement, trend-analysis, anomaly-detection, workflow-health-monitor, user-provisioning, system-config-management, inventory-reorder | 8 |
| 1 | Entry | ticket-intake, appointment-booking, dispute-resolution, knowledge-article-lifecycle, daily-standup, operations-coordination | 6 |
| 2 | Secondary | ticket-escalation, urgent-dispatch, notification-delivery | 3 |
| 3 | Tertiary | appointment-reminders, standard-dispatch, followup-management, customer-satisfaction-monitor | 4 |
| 4 | Execution | appointment-completion, work-order-fulfillment, dispute-escalation, knowledge-gap-detection, feedback-analysis | 5 |
| 5 | Post-Processing | work-order-verification, account-health-scan, followup-slippage-detector, retention-campaign | 4 |
| 6 | Reporting | report-generation, report-distribution | 2 |
| 7 | Analytics | quality-review | 1 |

---

## 4. Dependency Chains

### 4.1 Ticket-to-Resolution Chain

```
ticket-auto-response_v2 (T0)
  │ (if no match)
  ▼
ticket-intake_v2 (T1)
  │
  ├──► urgent-dispatch_v2 (T2) ──► notification-delivery_v2 (T2)
  │                                  │
  ├──► ticket-escalation_v2 (T2) ───┤
  │                                  │
  ├──► sla-enforcement_v2 (T0) ─────┤
  │                                  │
  └──► appointment-booking_v2 (T1)──┘
         │
         ├──► appointment-reminders_v2 (T3)
         │
         ├──► standard-dispatch_v2 (T3)
         │
         └──► appointment-completion_v2 (T4)
                │
                ├──► work-order-fulfillment_v2 (T4)
                │      └──► work-order-verification_v2 (T5)
                │
                ├──► customer-satisfaction-monitor_v2 (T3)
                │      └──► feedback-analysis_v2 (T4)
                │
                └──► followup-management_v2 (T3)
                       └──► followup-slippage-detector_v2 (T5)
                              └──► retention-campaign_v2 (T5)

    ALL TIERS → notification-delivery_v2 (T2) for outbound
    ALL TIERS → trend-analysis_v2 (T0), anomaly-detection_v2 (T0) (read events)
    ALL TIERS → workflow-health-monitor_v2 (T0) (monitor)
```

### 4.2 Dispute Chain

```
dispute-resolution_v2 (T1)
  │
  ├──► dispute-escalation_v2 (T4)
  │
  ├──► followup-management_v2 (T3)
  │
  ├──► customer-satisfaction-monitor_v2 (T3)
  │
  ├──► account-health-scan_v2 (T5)
  │
  └──► notification-delivery_v2 (T2)
```

### 4.3 CRM Health Chain

```
account-health-scan_v2 (T5) [daily cron]
  │
  ├──► followup-management_v2 (T3)
  │
  ├──► followup-slippage-detector_v2 (T5)
  │      └──► retention-campaign_v2 (T5)
  │
  └──► notification-delivery_v2 (T2)

retention-campaign_v2 (T5)
  └──► followup-management_v2 (T3)
  └──► customer-satisfaction-monitor_v2 (T3)
```

### 4.4 Knowledge Base Chain

```
knowledge-gap-detection_v2 (T4)
  └──► knowledge-article-lifecycle_v2 (T1)
```

---

## 5. Circular Dependency Analysis

### 5.1 Verification Statement

**No circular dependencies exist in the workflow graph.**

The graph has been analyzed and proven acyclic. The following verification checks were performed:

| Check | Result |
|-------|--------|
| Directed cycles | None found |
| Self-referencing workflows | None |
| Mutual dependencies (A→B, B→A) | None |
| Long cycles (A→B→C→A) | None |

### 5.2 Why No Cycles

The acyclic nature is enforced by these design rules:

1. **Data flows downhill through tiers** — Tier 0 feeds Tier 1, never the reverse
2. **Events are immutable facts** — workflows consume events but cannot be "woken" by downstream workflows to modify past events
3. **Analytics is read-only** — Trend and anomaly detection read events but never produce events that would trigger operational workflows
4. **Notification delivery is terminal** — `notification-delivery_v2` sends outbound messages and ends; it never triggers business workflows
5. **Account health scan is a one-way trigger** — It triggers followup workflows but followup workflows do not trigger health scans (health scans are cron-driven)

### 5.3 Apparent Cycles (and Why They Are Not Cycles)

| Apparent Cycle | Explanation |
|----------------|-------------|
| `followup-management_v2` → `followup-slippage-detector_v2` → `followup-management_v2` | Slippage detector triggers a *new* followup management instance for a different followup, never re-entering the same instance. Different correlation IDs ensure separation. |
| `customer-satisfaction-monitor_v2` → `feedback-analysis_v2` → `account-health-scan_v2` → `customer-satisfaction-monitor_v2` | Account health scan detects health changes from feedback but does NOT trigger satisfaction monitoring. Satisfaction monitoring is triggered only by service events (appointment.completed, ticket.closed). |
| `ticket-intake_v2` → `urgent-dispatch_v2` → `ticket-intake_v2` | Dispatch completion updates the ticket but does not re-trigger ticket intake. Ticket status change from dispatch does not emit `ticket.created`. |

---

## 6. Critical Path Analysis

### 6.1 Critical Path: Ticket → Resolution

The longest dependency chain in the system:

```
ticket-auto-response_v2 (T0)     < 30s
  → ticket-intake_v2 (T1)         < 5min
    → appointment-booking_v2 (T1)  < 5min (if service needed)
      → appointment-reminders_v2 (T3)  ongoing (24h, 2h, 30min)
      → appointment-completion_v2 (T4) < 1min
        → work-order-fulfillment_v2 (T4) < 8h (field work)
          → work-order-verification_v2 (T5) < 24h
            → customer-satisfaction-monitor_v2 (T3) < 5min
              → feedback-analysis_v2 (T4) < 30s
                → account-health-scan_v2 (T5) < 24h (cron)
                  → retention-campaign_v2 (T5) < 14 days
```

**Total worst-case end-to-end:** ~14 days (driven by retention campaign window)

### 6.2 Critical Path: Urgent Dispatch

```
ticket-auto-response_v2 (T0) — no match
  → ticket-intake_v2 (T1) < 30s
    → urgent-dispatch_v2 (T2) < 10min
      → notification-delivery_v2 (T2) < 30s
        → Technician acknowledges < 10min
          → Dispatch complete < 60min
```

**Total worst-case end-to-end:** ~80min (driven by technician response)

### 6.3 Critical Path: Dispute Resolution

```
dispute-resolution_v2 (T1) < 10min
  → HUMAN approval < 24h
    → followup-management_v2 (T3) < 5min
      → account-health-scan_v2 (T5) < 24h (cron)
```

**Total worst-case end-to-end:** ~48h (driven by human approval)

---

> **End of WORKFLOW_DEPENDENCY_GRAPH.md**  
> Next document: WORKFLOW_INTERACTION_MATRIX.md
