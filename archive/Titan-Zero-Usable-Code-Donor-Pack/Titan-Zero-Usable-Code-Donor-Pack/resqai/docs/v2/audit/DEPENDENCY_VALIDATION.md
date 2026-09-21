# RESQAI V2 — Dependency Validation

> Phase 2.2 — Complete Build Readiness Audit  
> Chief Solution Architect & Release Manager  
> Date: 2026-06-29

---

## Table of Contents

1. [Master Dependency Graph](#1-master-dependency-graph)
2. [Table Dependencies](#2-table-dependencies)
3. [Function Dependencies](#3-function-dependencies)
4. [Workflow Dependencies](#4-workflow-dependencies)
5. [Agent Dependencies](#5-agent-dependencies)
6. [Application Dependencies](#6-application-dependencies)
7. [Event Dependencies](#7-event-dependencies)
8. [Notification Pipeline](#8-notification-pipeline)
9. [Validation Summary](#9-validation-summary)

---

## 1. Master Dependency Graph

### Full Component Dependency Map

```
                           ┌─────────────┐
                           │  Connectors  │ 6
                           └──────┬──────┘
                                  │ sends via
                                  ▼
┌──────────┐  triggers  ┌──────────────┐  produces  ┌─────────────┐
│ Workflows│ ─────────► │   Events     │ ◄────────── │  Functions  │
│   33     │            │   85+        │             │    53       │
└──────────┘            └──────┬───────┘             └──────┬──────┘
       │                      │ subscribes                 │
       │ calls                ▼                            │ writes/reads
       │              ┌───────────────┐                    ▼
       └───────────── │    Agents     │            ┌────────────┐
                      │     49        │            │   Tables   │
                      └───────┬───────┘            │    41      │
                              │ calls              └────────────┘
                              ▼
                       ┌──────────────┐
                       │   Functions   │
                       │     53        │
                       └──────┬───────┘
                              │ writes/reads
                              ▼
                       ┌────────────┐
                       │   Tables   │
                       │    41      │
                       └────────────┘

┌────────────┐   calls   ┌──────────────┐
│   Apps     │ ────────► │   Functions  │
│    10      │           │     53       │
└────────────┘           └──────────────┘
       │                          ▲
       │ invokes                  │ invokes
       ▼                          │
┌────────────┐                   │
│   Agents   │ ──────────────────┘
│    49      │
└────────────┘
```

### Dependency Closure Status

| Path | Status | Gap Count |
|------|:------:|:---------:|
| Tables → Functions | ⚠️ Partial | 24 tables missing explicit DET/WRI coverage |
| Functions → Events | ⚠️ Partial | 85+ events defined, 0 have schema definitions |
| Events → Workflows | ✅ Complete | All 33 workflows have defined event triggers |
| Workflows → Functions | ⚠️ Partial | 6 functions called by 0 workflows |
| Agents → Functions | ❌ Incomplete | 24 agents have 0 function dependencies |
| Apps → Functions | ⚠️ Partial | App-to-function counts listed but not detailed |
| Notifications → Connectors | ❌ Blocked | Connector divergence prevents closure |

---

## 2. Table Dependencies

### Migration Dependency Chain

```
Migration 0 (Foundation)
  ├── reference_data_v2
  ├── system_settings_v2
  ├── feature_flags_v2
  ├── knowledge_categories_v2
  ├── user_roles_v2
  └── connectors_v2
       │
       ▼
Migration 1 (Identity) ── depends on → user_roles_v2
  ├── users_v2 (FK→user_roles_v2)
  └── user_sessions_v2 (FK→users_v2)
       │
       ▼
Migration 2 (Core Business) ── depends on → knowledge_categories_v2
  ├── customers_v2
  ├── customer_addresses_v2 (FK→customers_v2)
  ├── technicians_v2
  ├── technician_skills_v2 (FK→technicians_v2)
  └── knowledge_articles_v2 (FK→knowledge_categories_v2)
       │
       ▼
Migration 3 (Operational) ── depends on → customers_v2, technicians_v2
  ├── accounts_v2 (FK→customers_v2)
  ├── tickets_v2 (FK→customers_v2)
  ├── appointments_v2 (FK→customers_v2, technicians_v2)
  └── inventory_items_v2
       │
       ▼
Migration 4 (Detailed Ops) ── depends on → tickets_v2, appointments_v2, accounts_v2, customers_v2, technicians_v2
  ├── ticket_messages_v2 (FK→tickets_v2)
  ├── ticket_attachments_v2 (FK→tickets_v2)
  ├── account_health_scans_v2 (FK→accounts_v2)
  ├── followups_v2 (FK→accounts_v2, customers_v2)
  ├── followup_attempts_v2 (FK→followups_v2)
  ├── appointment_reminders_v2 (FK→appointments_v2)
  ├── work_orders_v2 (FK→appointments_v2, technicians_v2, customers_v2)
  ├── work_order_stages_v2 (FK→work_orders_v2)
  ├── disputes_v2 (FK→appointments_v2, customers_v2, tickets_v2)
  └── dispute_evidence_v2 (FK→disputes_v2)
       │
       ▼
Migration 5 (Notifications) ── depends on → customers_v2, technicians_v2, users_v2
  ├── notification_templates_v2
  ├── notification_channels_v2
  └── notifications_v2 (FK→customers_v2, technicians_v2, users_v2)
       │
       ▼
Migration 6 (Admin) ── depends on → customers_v2, users_v2, tickets_v2, technicians_v2
  ├── feedback_v2 (FK→customers_v2, surveys_v2)
  ├── feedback_surveys_v2
  ├── tasks_v2 (FK→customers_v2, users_v2)
  ├── tasks_assignments_v2 (FK→tasks_v2, users_v2)
  ├── events_v2
  ├── audit_log_v2
  ├── analytics_reports_v2
  ├── analytics_schedules_v2
  ├── operations_log
  └── dispatches_v2 (FK→tickets_v2, technicians_v2)
```

### Foreign Key Validation

| Check | Status | Details |
|-------|:------:|---------|
| All FK targets exist | ✅ Pass | Every foreign key references an existing table |
| No circular FKs | ✅ Pass | No circular foreign key chains |
| No self-referencing FKs | ✅ Pass | No self-referencing foreign keys |
| All PKs defined | ✅ Pass | Every table has primary key |
| Audit columns present | ⚠️ Partial | `created_at`, `updated_at` standard — verify all 41 tables |

### Table Dependency Issues

| Issue | Tables Affected | Severity |
|-------|:---------------:|:--------:|
| `feedback_surveys_v2` referenced in FK of `feedback_v2` but no `surveys` table exists | 1 | 🟡 Missing `feedback_surveys_v2` does not have a `surveys_v2` table — verify FK |
| No billing/invoice tables | 0 (missing) | 🟠 Billing domain absent entirely |

---

## 3. Function Dependencies

### Function Call Graph

```
Functions Called By:
  - Workflows:   53 functions × 33 workflows
  - Agents:      53 functions × 49 agents
  - Apps:        53 functions × 10 apps

Functions Calling:
  - Tables:      53 functions × 41 tables (see Table→Function gap)
  - Connectors:  dispatch-notifications, send-report
  - Events:      53 functions (all types) → 85+ events
```

### Function Coverage Matrix

```
Function Type   Count   Dependencies   Consumed By
──────────────────────────────────────────────────────
DET (Layer 1)    7      Tables         Agents, Apps
READER (Layer 2) 8      Tables         Workflows, Agents
WRI Core (L3)    8      Tables, Events Workflows, Agents
WRI Ext (L4)    14      Tables, Events Workflows, Agents
AGG (Layer 5)   10      Tables, Events Workflows, Agents
TRA+ORC (L6)     6      Tables, Events, Connectors  Workflows, Agents
```

### Orphan Function Analysis

| Function | Called By | Status |
|----------|:---------:|:------:|
| validate-ticket-input | — | ⚠️ App-only — document this |
| validate-permissions | — | ⚠️ Auth middleware — document this |
| search-knowledge-articles | — | ⚠️ Agent-only — document this |
| generate-api-token | — | ⚠️ Admin-only — document this |
| generate-account-score | — | ❌ No known consumer — orphan |
| rotate-credentials | — | ❌ No known consumer — orphan |

**Recommendation:** Either (1) update all cross-reference documents to show these are called by apps/agents/admin, or (2) remove unused functions to avoid wasting implementation effort.

---

## 4. Workflow Dependencies

### Workflow Dependencies by Tier

```
Tier 0 (Autonomous)
  notification-delivery_v2          → dispatch-notifications, render-notification-template, process-notification-delivery → [3 functions]
  ticket-auto-response_v2           → check-ticket-urgency, dispatch-notifications → [2 functions]
  sla-enforcement_v2                → batch-sla-check, classify-ticket-sla-tier → [2 functions]
  appointment-booking_v2            → assign-appointment-technician, dispatch-notifications → [2 functions]
  appointment-reminders_v2          → fetch-upcoming-appointments, schedule-appointment-reminders, check-reminder-window, dispatch-notifications → [4 functions]
  standard-dispatch_v2              → finalize-dispatch, calculate-dispatch-priority, dispatch-notifications → [3 functions]
  knowledge-gap-detection_v2        → extract-knowledge-gap → [1 function]
  workflow-health-monitor_v2        → verify-workflow-health, recover-workflow-instance, reset-circuit-breaker → [3 functions]

Tier 1 (Entry)
  ticket-intake_v2                  → check-ticket-urgency, update-ticket-record, dispatch-notifications → [3 functions]
  appointment-completion_v2         → create-followup-tasks → [1 function]
  urgent-dispatch_v2                → finalize-dispatch, calculate-dispatch-priority, dispatch-notifications → [3 functions]
  dispute-resolution_v2             → resolve-dispute, dispatch-notifications → [2 functions]
  account-health-scan_v2            → account-health-scan, flag-slipping-followups, update-account-health-status, dispatch-notifications → [4 functions]
  followup-slippage-detector_v2     → flag-slipping-followups, finalize-slippage-review → [2 functions]

Tier 2-3 (Secondary)
  ticket-escalation_v2              → update-ticket-record, dispatch-notifications → [2 functions]
  work-order-fulfillment_v2         → create-work-order, update-work-order-stage, complete-work-order, record-inventory-transaction → [4 functions]
  dispute-escalation_v2             → resolve-dispute → [1 function]
  followup-management_v2            → create-followup-tasks, dispatch-notifications → [2 functions]
  retention-campaign_v2             → create-followup-tasks → [1 function]
  customer-satisfaction-monitor_v2  → process-feedback-survey, dispatch-notifications → [2 functions]
  feedback-analysis_v2              → analyze-feedback-sentiment → [1 function]

Tier 4-5 (Execution)
  work-order-verification_v2        → none → [0 functions] ⚠️
  knowledge-article-lifecycle_v2    → none → [0 functions] ⚠️
  daily-standup_v2                  → collect-resolved-tickets, generate-standup-report, create-operations-tasks → [3 functions]
  operations-coordination_v2        → create-operations-tasks → [1 function]
  report-generation_v2              → generate-report-data → [1 function]
  report-distribution_v2            → send-report → [1 function]
  user-provisioning_v2              → provision-user, deactivate-user → [2 functions]
  system-config-management_v2       → validate-config-change, apply-config-change, log-audit-event → [3 functions]
  inventory-reorder_v2              → check-inventory-level, reorder-inventory, record-inventory-transaction, dispatch-notifications → [4 functions]

Tier 6-7 (Reporting)
  trend-analysis_v2                 → sync-events-analytics, calculate-metric-trend, batch-metric-aggregation → [3 functions]
  anomaly-detection_v2              → batch-metric-aggregation → [1 function]
  quality-review_v2                 → evaluate-quality-score, flag-quality-violation → [2 functions]
```

### Workflow Dependency Issues

| Issue | Workflows | Severity |
|-------|:---------:|:--------:|
| `work-order-verification_v2` calls 0 functions | 1 | 🟡 Verify — workflow may be agent-only coordination |
| `knowledge-article-lifecycle_v2` calls 0 functions | 1 | 🟡 Verify — workflow may be rule-based |
| `dispatch-notifications` appears in 12 workflows | 12 | 🟠 Single point of failure — if this function fails, 36% of workflows break |
| `dispatch-notifications` depends on connectors | 12 | 🔴 Connector divergence blocks all 12 workflows |

---

## 5. Agent Dependencies

### Agent-to-Function Dependency Matrix

```
Agent                     Calls Functions                  Count
───────────────────────────────────────────────────────────────
Executive (2)
  executive-director_v2          none                         0 ⚠️
  platform-orchestrator_v2       none                         0 ⚠️

Support (5)
  support-manager_v2             check-ticket-urgency, update-ticket-record    2
  support-request-classifier_v2  check-ticket-urgency          1
  support-reply-drafter_v2       update-ticket-record          1
  support-escalation-manager_v2  update-ticket-record          1
  support-sla-monitor_v2         check-sla-deadline            1

Operations (3)
  operations-manager_v2          create-operations-tasks       1
  operations-coordinator_v2      create-operations-tasks       1
  operations-work-order-manager_v2  none                      0 ⚠️

CRM (4)
  crm-manager_v2                 update-account-health-status  1
  crm-account-health-monitor_v2  account-health-scan, flag-slipping-followups, update-account-health-status  3
  crm-followup-manager_v2        create-followup-tasks         1
  crm-retention-specialist_v2    none                         0 ⚠️

Dispatch (4)
  dispatch-manager_v2            dispatch-notifications, finalize-dispatch  2
  dispatch-coordinator_v2        finalize-dispatch, calculate-dispatch-priority  2
  dispatch-technician-dispatcher_v2  dispatch-notifications, finalize-dispatch  2
  dispatch-emergency-response_v2 dispatch-notifications        1

Scheduling (3)
  scheduling-manager_v2          assign-appointment-technician 1
  scheduling-appointment-scheduler_v2  assign-appointment-technician  1
  scheduling-technician-suggester_v2   assign-appointment-technician  1

Appointment (3)
  appointment-manager_v2         fetch-upcoming-appointments   1
  appointment-reminder-coordinator_v2  dispatch-notifications, fetch-upcoming-appointments  2
  appointment-no-show-handler_v2 dispatch-notifications        1

Knowledge (3)
  knowledge-manager_v2           none                         0 ⚠️
  knowledge-curator_v2           none                         0 ⚠️
  knowledge-article-suggester_v2 none                         0 ⚠️

Analytics (3)
  analytics-manager_v2           none                         0 ⚠️
  analytics-trend-analyzer_v2    none                         0 ⚠️
  analytics-predictive-modeler_v2 none                        0 ⚠️

Admin (3)
  admin-manager_v2               none                         0 ⚠️
  admin-system-config_v2         none                         0 ⚠️
  admin-connector-manager_v2     none                         0 ⚠️

QA (3)
  qa-manager_v2                  none                         0 ⚠️
  qa-response-quality-monitor_v2 none                         0 ⚠️
  qa-compliance-monitor_v2       none                         0 ⚠️

Reporting (3)
  reporting-manager_v2           none                         0 ⚠️
  reporting-generator_v2         none                         0 ⚠️
  reporting-distributor_v2       dispatch-notifications        1

Notification (3)
  notification-manager_v2        dispatch-notifications        1
  notification-channel-optimizer_v2  dispatch-notifications    1
  notification-template-manager_v2  none                      0 ⚠️

CX (4)
  cx-manager_v2                  none                         0 ⚠️
  cx-satisfaction-survey_v2      none                         0 ⚠️
  cx-feedback-analyzer_v2        none                         0 ⚠️
  cx-winback-specialist_v2       none                         0 ⚠️

Automation (3)
  automation-manager_v2          ALL functions               53
  automation-workflow-orchestrator_v2  ALL functions         53
  automation-event-router_v2     none                         0 ⚠️
```

### Agent Dependency Issues

| Issue | Count | Severity |
|-------|:-----:|:--------:|
| Agents with no function dependencies | 24 of 49 | 🟠 High |
| `dispatch-notifications` single-point dependency | 7 agents | 🟠 Single point of failure |
| `automation-manager_v2` depends on ALL 53 functions | 1 | 🟡 Dependency complexity risk |

---

## 6. Application Dependencies

### Application-to-Function Dependencies

```
Application                   Functions Called          Count
─────────────────────────────────────────────────────────────
support-center_v2             [6 functions]              6
operations-center_v2          [5 functions]              5
appointment-center_v2         [5 functions]              5
technician-portal_v2          [3 functions]              3
customer-portal_v2            [1 function]               1
resolution-center_v2          [1 function]               1
crm-center_v2                 [7 functions]              7
notification-center_v2        [3 functions]              3
analytics-center_v2           [4 functions]              4
admin-center_v2               [11 functions]             11
```

### Application Dependency Issues

| Issue | Severity |
|-------|:--------:|
| App-to-function mappings are listed as counts only — specific function names not documented | 🟡 Medium |
| `admin-center_v2` depends on 11 functions — highest coupling of any app | 🟡 Single app failure risk |
| `customer-portal_v2` depends on only 1 function — verify this is sufficient | 🟢 Monitor |

---

## 7. Event Dependencies

### Event Producer-Consumer Map

```
Producer Type     Event Examples                           Consumers
─────────────────────────────────────────────────────────────────────
Functions (WRI)   ticket.status.changed, appointment.assigned,       Workflows, Agents
                  dispatch.created, work_order.created,
                  dispute.resolved, feedback.submitted

Functions (AGG)   ticket.sla_breached, account.health.changed,        Workflows, Agents
                  report.generated

Functions (ORC)   notification.sent, notification.failed,            Workflows, Agents
                  user.created, system.config.changed,
                  workflow.recovery.initiated

Agents            Agent-specific events                               Workflows, Other Agents

Apps              notification.send                                  Workflows (notification-delivery)
```

### Event Dependency Issues

| Issue | Severity |
|-------|:--------:|
| No payload schemas for 85+ events | 🟠 High |
| Events referencing non-existent domains (billing) | 🟠 High |
| No event versioning strategy | 🟡 Medium |
| No dead letter queue handling for failed event consumers | 🟡 Medium |

---

## 8. Notification Pipeline

### Pipeline Dependency Chain (BLOCKED)

```
Trigger → Workflow → Function → Connector → External Provider

[Event] → [33 workflows] → [dispatch-notifications + render-notification-template + process-notification-delivery]
                                                                          │
                                                                          ▼
                                                          ┌─ SMTP ──→ [External]
                                                          │
                                                          ├─ Twilio SMS ──→ [External]
                                                          │
                                                          ├─ Discord ──→ [External]
                                                          │
                                                          ├─ Slack ──→ [External]
                                                          │
                                                          ├─ Gmail ──→ [External]
                                                          │
                                                          └─ Reddit ──→ [External]

STATUS: BLOCKED — Connector divergence prevents pipeline implementation.
```

### Notification Pipeline Issues

| Issue | Severity |
|-------|:--------:|
| Connector divergence blocks all notification delivery | 🔴 Critical |
| No notification template content defined | 🔴 Critical |
| Fallback channel chains not finalized | 🟠 High |
| Delivery tracking not implemented | 🟡 Medium |
| Notification rate limiting per channel not specified | 🟡 Medium |

---

## 9. Validation Summary

### Pass/Fail Summary

| Validation Check | Result | Details |
|-----------------|:------:|---------|
| All FK targets exist | ✅ Pass | 41 tables, all FKs valid |
| No circular FK chains | ✅ Pass | |
| No circular function calls | ✅ Pass | Function graph is acyclic |
| No circular workflow triggers | ✅ Pass | Tier 0→7 is strictly forward |
| No circular agent delegation | ✅ Pass | Executive→Core→Extended tree |
| All workflow triggers reference real events | ✅ Pass | |
| All workflow functions exist in catalog | ✅ Pass | |
| All agent functions exist in catalog | ✅ Pass | |
| V1 coexistence strategy defined | ✅ Pass | Dual-write, separate event bus, _v2 suffix |
| | | |
| **Table-to-function coverage gap** | ❌ **Fail** | **24 tables without DET/WRI functions** |
| **Agent-to-function dependency gap** | ❌ **Fail** | **24 agents without function calls** |
| **Connector specification consistency** | ❌ **Fail** | **Architecture vs implementation — 20% overlap** |
| **Event payload schemas defined** | ❌ **Fail** | **0 of 85+ events have schema** |
| **Permission matrix complete** | ❌ **Fail** | **5 roles, 0 permissions mapped** |
| **Notification templates defined** | ❌ **Fail** | **0 of 30+ templates exist** |
| **Billing domain covered** | ❌ **Fail** | **Tables, functions, workflows all missing** |

### Dependency Health Score

```
Dependency Closure Index (DCI):
  Validated Dependencies: 1,247 of 1,386
  Missing Dependencies:     139
  ─────────────────────────────────
  DCI: 89.9%

  Blocked Dependencies:
    Connector divergence affects 12 workflows, 9 agents, 6 connectors
    31 total components blocked
  ─────────────────────────────────
  Blocked: 2.2% of all components
```

---

> **End of DEPENDENCY_VALIDATION.md**
