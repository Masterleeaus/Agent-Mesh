# RESQAI V2 — Dependency Graph

> Phase 3.5 — Execution Plan
> Chief Technical Program Manager
> Date: 2026-06-29

---

## Table of Contents

1. [Complete Batch Dependency Graph](#1-complete-batch-dependency-graph)
2. [Per-Batch Dependency Details](#2-per-batch-dependency-details)
3. [Application Dependency Graph](#3-application-dependency-graph)
4. [Parallelization Matrix](#4-parallelization-matrix)
5. [Critical Path Analysis](#5-critical-path-analysis)
6. [Slack Analysis](#6-slack-analysis)
7. [Blocking Chain Analysis](#7-blocking-chain-analysis)

---

## 1. Complete Batch Dependency Graph

```
Legend:
  [B#] = Batch
   -->  = Blocks (hard dependency)
   - - > = Parallelizable (soft dependency)
   <-->  = Bidirectional (mutual awareness)
   [G#]  = Quality Gate

                    ┌──────────────────────────────────────────────────────────────┐
                    │                                                              │
                    ▼                                                              │
[B1] Shared Foundation ──► [B2] Database Core ──► [G0] ◄──────────────────────────┘
  │                           │
  │                           ▼
  │                     ┌───────────┐
  │                     │           │
  ▼                     ▼           │
[B3] Functions L0-1 ──► [B4] Functions L2-3 ──► [B5] Functions L4-5 + Connectors
  │                      │                                  │
  │                      │                                  ├──► [G1]
  │                      │                                  │
  │                      ▼                                  │
  │               ┌──────────────┐                          │
  │               │              │                          │
  ▼               ▼              ▼                          ▼
[B6] Core Apps ──► [B7] Specialized Apps ──► [B8] Cross-Cutting Apps ──► [G2]
  │                                                                        │
  │                                                                        │
  ▼                                                                        ▼
[B9] Agent Infra + Core Agents ──► [B10] Extended Agents ──► [G3] ──────► [B11] Auto Workflows
  │                                                                          │
  │                                                                          ▼
  │                                                                  [B12] Entry + Secondary WF
  │                                                                          │
  │                                                                          ▼
  └──────────────────────────────────────────────────────────────────► [B13] Execution + Reporting WF
                                                                                │
                                                                                ├──► [G4]
                                                                                │
                                                                                ▼
                                                                          [B14] E2E Integration
                                                                                │
                                                                          ┌─────┴─────┐
                                                                          │           │
                                                                          ▼           ▼
                                                                    [B15] System  [B16] Performance
                                                                     Testing      Optimization
                                                                          │           │
                                                                          └─────┬─────┘
                                                                                │
                                                                                ▼
                                                                          [B17] Security
                                                                           Hardening
                                                                                │
                                                                                ▼
                                                                          [B18] Production
                                                                           Release
                                                                                │
                                                                                ├──► [G5]
                                                                                │
                                                                                ▼
                                                                          [G6] Production Go-Live
```

---

## 2. Per-Batch Dependency Details

### Batch 1: Shared Foundation

| Property | Value |
|----------|-------|
| **Blocks** | B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17, B18 |
| **Blocked By** | Nothing (root batch) |
| **Parallel Tasks** | None (single team) |
| **Sequential Tasks** | Packages scaffold → types → config → utils → sdk → ui → hooks → forms → layouts → CI/CD |
| **Estimated** | 2 weeks |

### Batch 2: Database Core

| Property | Value |
|----------|-------|
| **Blocks** | B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13 |
| **Blocked By** | B1 |
| **Parallel Tasks** | Migration 0+1, Event Bus, Auth system (can overlap) |
| **Sequential Tasks** | Migration 0 → Migration 1 → Migration 2 → Migration 3 → Migration 4 → Migration 5-6 → Indexes → Views → RLS |
| **Estimated** | 3 weeks |

### Batch 3: Functions Layer 0-1

| Property | Value |
|----------|-------|
| **Blocks** | B4, B5, B9, B10, B11, B12, B13 |
| **Blocked By** | B2 |
| **Parallel Tasks** | DET functions (can build in parallel once Tables 0-1 exist) |
| **Sequential Tasks** | DET (order 1-7) → REA (order 8-15) |
| **Estimated** | 2 weeks |

### Batch 4: Functions Layer 2-3

| Property | Value |
|----------|-------|
| **Blocks** | B5, B6, B7, B8, B9, B10, B11, B12, B13 |
| **Blocked By** | B3 |
| **Parallel Tasks** | Core WRI (16), Extended WRI (24-37), AGG (38-47) — up to 3 parallel teams |
| **Sequential Tasks** | Core WRI (16-23) → Extended WRI (24-37) → AGG (38-47) |
| **Estimated** | 3 weeks |

### Batch 5: Functions L4-5 + Connectors

| Property | Value |
|----------|-------|
| **Blocks** | B6, B7, B8, B9, B10, B11, B12, B13 |
| **Blocked By** | B4 |
| **Parallel Tasks** | TRA (48), ORC (49-53), Connectors [SMTP, Twilio, Discord, Slack, Gmail, Reddit] — up to 4 parallel teams |
| **Sequential Tasks** | None within this batch (all parallel) |
| **Estimated** | 3 weeks |

### Batch 6: Core Applications

| Property | Value |
|----------|-------|
| **Blocks** | B7, B8 |
| **Blocked By** | B1, B2, B3, B4, B5 |
| **Parallel Tasks** | support-center_v2, operations-center_v2, appointment-center_v2 — 3 parallel teams |
| **Sequential Tasks** | Pages → Components → Forms → Data Integration → Event Integration → Polish (within each app) |
| **Estimated** | 5 weeks |

### Batch 7: Specialized Applications

| Property | Value |
|----------|-------|
| **Blocks** | B8 |
| **Blocked By** | B6 |
| **Parallel Tasks** | crm-center_v2, resolution-center_v2, customer-portal_v2 — 3 parallel teams |
| **Sequential Tasks** | Pages → Components → Forms → Data Integration → Event Integration → Polish (within each app) |
| **Estimated** | 4 weeks |

### Batch 8: Cross-Cutting Applications

| Property | Value |
|----------|-------|
| **Blocks** | B14, B15, B16, B17, B18 |
| **Blocked By** | B7 |
| **Parallel Tasks** | notification-center_v2, analytics-center_v2, admin-center_v2 — 3 parallel teams |
| **Sequential Tasks** | Infrastructure → Pages → Event Integration → Polish (within each app) |
| **Estimated** | 4 weeks |

### Batch 9: Agent Infrastructure + Core Agents

| Property | Value |
|----------|-------|
| **Blocks** | B10, B11, B12, B13 |
| **Blocked By** | B5 |
| **Parallel Tasks** | Agent Infrastructure (registry, LLM gateway, permissions), Core Agents by department (26 agents split across 2-3 teams) |
| **Sequential Tasks** | Agent infrastructure → Agent scaffolding → Core agents (deps: infra first, agents parallel) |
| **Estimated** | 4 weeks |

### Batch 10: Extended Agents

| Property | Value |
|----------|-------|
| **Blocks** | B11, B12, B13 |
| **Blocked By** | B9 |
| **Parallel Tasks** | Extended agents by department (23 agents split across 2-3 teams) |
| **Sequential Tasks** | None within this batch (all parallel) |
| **Estimated** | 2 weeks |

### Batch 11: Autonomous Workflows

| Property | Value |
|----------|-------|
| **Blocks** | B12 |
| **Blocked By** | B10, B5 |
| **Parallel Tasks** | notification-delivery_v2 parallel with ticket-auto-response_v2, etc. (up to 3 teams) |
| **Sequential Tasks** | None within this batch (all parallel) |
| **Estimated** | 2 weeks |

### Batch 12: Entry + Secondary Workflows

| Property | Value |
|----------|-------|
| **Blocks** | B13 |
| **Blocked By** | B11 |
| **Parallel Tasks** | Entry workflows (6) parallel with Secondary workflows (7) — 2 teams |
| **Sequential Tasks** | Entry first (lower tier), Secondary second (depends on Entry patterns and components) |
| **Estimated** | 2 weeks |

### Batch 13: Execution + Reporting Workflows

| Property | Value |
|----------|-------|
| **Blocks** | B14 |
| **Blocked By** | B12 |
| **Parallel Tasks** | Execution (9) parallel with Reporting (3) — 2 teams |
| **Sequential Tasks** | Execution first (Tier 4-5), Reporting second (Tier 6-7) |
| **Estimated** | 2 weeks |

### Batch 14-18: Integration + Production

| Batch | Blocks | Blocked By | Parallel Tasks | Estimated |
|:-----:|:------:|:----------:|:--------------:|:---------:|
| B14 | B15, B16, B17, B18 | B13 | E2E journeys (3) — 3 teams | 2 weeks |
| B15 | B16, B17 | B14 | Unit, Integration, E2E, Load, Security tests — all teams | 2 weeks |
| B16 | B17 | B15 | Per-app optimization — 4 parallel teams | 2 weeks |
| B17 | B18 | B15, B16 | Penetration test, RLS audit, secret scan — 2 parallel teams | 2 weeks |
| B18 | — | B14, B15, B16, B17 | Canary (3 stages sequential) | 2 weeks |

---

## 3. Application Dependency Graph

### 3.1 App-to-App Hard Dependencies

```
Legend:  A ──► B   = A depends on B (B must exist before A)

                ┌──────────────────┐
                │  Shared Packages │  (All apps depend on this)
                └────────┬─────────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
     ┌────────────┐┌────────────┐┌──────────────┐
     │ support-   ││operations- ││ appointment- │
     │ center_v2  ││ center_v2  ││ center_v2    │
     └──────┬─────┘└─────┬──────┘└──────┬───────┘
            │            │              │
            │            └──────┬───────┘
            ▼                   ▼
     ┌────────────┐    ┌──────────────┐
     │ customer-  │    │ technician-  │
     │ portal_v2  │    │ portal_v2    │
     └──────┬─────┘    └──────┬───────┘
            │                 │
            └──────┬──────────┘
                   ▼
            ┌──────────────┐
            │   crm-       │
            │  center_v2   │
            └──────┬───────┘
                   │
            ┌──────┴───────┐
            ▼              ▼
     ┌──────────────┐┌──────────────┐
     │notification-││ analytics-   │
     │ center_v2   ││ center_v2    │
     └──────┬──────┘└──────────────┘
            │
            ▼
     ┌──────────────┐
     │  admin-      │
     │  center_v2   │
     └──────────────┘
```

### 3.2 App-to-Function Dependencies

| Application | Functions Called |
|-------------|:----------------:|
| support-center_v2 | validate-ticket-input, check-ticket-urgency, update-ticket-record, classify-ticket-sla-tier, check-sla-deadline, dispatch-notifications, batch-sla-check |
| operations-center_v2 | finalize-dispatch, calculate-dispatch-priority, create-operations-tasks, generate-standup-report, dispatch-notifications, collect-resolved-tickets |
| appointment-center_v2 | assign-appointment-technician, fetch-upcoming-appointments, schedule-appointment-reminders, check-reminder-window, dispatch-notifications |
| technician-portal_v2 | complete-work-order, update-work-order-stage, record-inventory-transaction, check-inventory-level |
| customer-portal_v2 | validate-ticket-input, check-ticket-urgency |
| resolution-center_v2 | resolve-dispute |
| crm-center_v2 | account-health-scan, update-account-health-status, flag-slipping-followups, create-followup-tasks, finalize-slippage-review, generate-account-score, dispatch-notifications |
| notification-center_v2 | render-notification-template, dispatch-notifications, process-notification-delivery |
| analytics-center_v2 | sync-events-analytics, calculate-metric-trend, batch-metric-aggregation, generate-report-data |
| admin-center_v2 | provision-user, deactivate-user, validate-config-change, apply-config-change, log-audit-event, rotate-credentials, validate-permissions, generate-api-token, verify-workflow-health, recover-workflow-instance, reset-circuit-breaker |

### 3.3 App-to-Agent Dependencies

| Application | Agents Invoked |
|-------------|:--------------:|
| support-center_v2 | request-classifier, reply-drafter, escalation-manager, sla-monitor, support-manager |
| operations-center_v2 | operations-manager, operations-coordinator |
| appointment-center_v2 | scheduling-manager, appointment-scheduler, technician-suggester, appointment-manager |
| resolution-center_v2 | resolution-advisor |
| crm-center_v2 | crm-manager, account-health-monitor, crm-followup-manager, crm-retention-specialist |
| customer-portal_v2 | knowledge-article-suggester |
| notification-center_v2 | notification-manager, channel-optimizer, template-manager |
| analytics-center_v2 | analytics-manager, trend-analyzer, predictive-modeler |
| admin-center_v2 | admin-manager, admin-system-config, admin-connector-manager |

### 3.4 App-to-Table Access Matrix

```
App \ Table                  tickets appts cust tech disp tasks accnt f/ups disputes users notif
────────────────────────────────────────────────────────────────────────────────────────────
support-center_v2            R/W    R     R    R    -    -     -     -      -       -    -
operations-center_v2          R     R     R    R   R/W  R/W   -     -      -       -    -
appointment-center_v2         R    R/W    R    R    -    -     -     -      -       -    -
technician-portal_v2          -    R/W    R   R/W   -   R/W   -     -      -       -    -
customer-portal_v2            R     R    R/W   -    -    -    R     R      R       -    -
resolution-center_v2          R     R     R    -    -    -     -     -     R/W     -    -
crm-center_v2                 R     R     R    -    -    -    R/W   R/W    R       -    -
notification-center_v2        -     -     R    R    -    -     -     -      -       -   R/W
analytics-center_v2           R     R     R    R    R    R     R     R      R       R    R
admin-center_v2               R     R     R    R    R    R     R     R      R      R/W   R
```

---

## 4. Parallelization Matrix

### 4.1 Cross-Track Parallelization

| Week Range | Track A (Plat/BE) | Track B (FE Alpha) | Track C (FE Beta) | Track D (FE Gamma) | Track E (FE Delta) | Track F (Agents) | Track G (Workflows) |
|:----------:|:------------------:|:------------------:|:-----------------:|:------------------:|:------------------:|:----------------:|:-------------------:|
| 1-2 | B1: Foundation | Idle | Idle | Idle | Idle | Idle | Idle |
| 3-4 | B2: Database | Idle | Idle | Idle | Idle | Idle | Idle |
| 5-6 | B3: Functions L0-1 | Idle | Idle | Idle | Idle | Idle | Idle |
| 7-8 | B4: Functions L2-3 | Idle | Idle | Idle | Idle | Idle | Idle |
| 9-10 | B5: Functions L4-5 + Connectors | B6: support-center start | B6: ops + appt start | Idle | Idle | Idle | Idle |
| 11-12 | B5: Finish + G1 | B6: support-center finish | B6: ops + appt finish | Idle | B6: tech-portal start | Idle | Idle |
| 13-14 | — | B7: resol + crm start | B7: customer-portal start | Idle | B7: tech-portal finish | Idle | Idle |
| 15-16 | — | B7: finish | B7: finish | B8: notif start | B8: admin start | B9: Agent infra start | Idle |
| 17-18 | — | — | — | B8: analytics start + finish | B8: finish + G2 | B9: Core agents start | Idle |
| 19-20 | — | — | — | — | — | B9: Core agents finish | Idle |
| 21-22 | — | — | — | — | — | B10: Extended agents start + G3 | Idle |
| 23-24 | — | — | — | — | — | B10: finish | B11: Auto WF start |
| 25-26 | — | — | — | — | — | — | B11: finish + B12: Entry + Secondary WF |
| 27-28 | — | — | — | — | — | — | B12: finish + B13: Exec + Report WF + G4 |
| 29-30 | B14: E2E Integration + B15: System Testing + B16: Performance + B17: Security + B18: Production (ALL TRACKS) |

### 4.2 Maximum Parallelism by Week

```
Week:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
       ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●
Tracks: 1  1  1  1  2  2  2  2  5  5  5  5  5  5  5  5  5  5  4  4  4  4  4  4  4  4  4  4  8  8
        (Platform)                      (FE+BE+Plat)                    (All combined)   (E2E surge)
Engineers:
Week 1-2:   10  B1 only
Week 3-4:   10  B2 only
Week 5-8:   24  B3+B4
Week 9-12:  40  B5+B6
Week 13-16: 70  B5+B6+B7+B8+B9
Week 17-20: 70  B8+B9
Week 21-24: 54  B9+B10+B11
Week 25-28: 54  B11+B12+B13
Week 29-30: 62  B14+B15+B16+B17 (ALL teams, E2E surge)
```

---

## 5. Critical Path Analysis

### 5.1 Critical Path

The longest dependency chain. Any delay on this path delays the project.

```
B1 (2w) → B2 (3w) → B3 (2w) → B4 (3w) → B5 (3w) → B9 (4w) → B10 (2w) → B11 (2w) → B12 (2w) → B13 (2w) → B14 (2w) → B18 (2w)
 2w       5w       7w       10w      13w      17w       19w       21w       23w       25w       27w       29w
  ↑        ↑         ↑         ↑         ↑         ↑          ↑         ↑          ↑         ↑          ↑         ↑
 Start    End       End       End       B9        B10       B11        B12        B13       B14        B18       End
  B1       B2        B3        B4       start      start    start      start      start     start      start     B18
```

**Critical Path Duration: 29 weeks** (B1 through B18, minus B15/B16/B17 which are parallel with B14/B18)

### 5.2 Items on Critical Path

| Item | Duration | Cumulative | Slack |
|------|:--------:|:----------:|:-----:|
| B1: Shared Foundation | 2 weeks | 2 weeks | 0 |
| B2: Database Core | 3 weeks | 5 weeks | 0 |
| B3: Functions L0-1 | 2 weeks | 7 weeks | 0 |
| B4: Functions L2-3 | 3 weeks | 10 weeks | 0 |
| B5: Functions L4-5 + Connectors | 3 weeks | 13 weeks | 0 |
| B9: Agent Infra + Core Agents | 4 weeks | 17 weeks | 0 |
| B10: Extended Agents | 2 weeks | 19 weeks | 0 |
| B11: Autonomous Workflows | 2 weeks | 21 weeks | 0 |
| B12: Entry + Secondary Workflows | 2 weeks | 23 weeks | 0 |
| B13: Execution + Reporting Workflows | 2 weeks | 25 weeks | 0 |
| B14: E2E Integration | 2 weeks | 27 weeks | 0 |
| B18: Production Release | 2 weeks | 29 weeks | 0 |

### 5.3 Items NOT on Critical Path (With Slack)

| Item | Duration | Weeks | Slack |
|------|:--------:|:-----:|:-----:|
| B6: Core Applications | 5 weeks | 9-13 | +2 weeks (finish before B14 starts) |
| B7: Specialized Applications | 4 weeks | 13-16 | +2 weeks (finish before B14 starts) |
| B8: Cross-Cutting Applications | 4 weeks | 15-18 | +4 weeks (finish before B14 starts) |
| B15: System Testing | 2 weeks | 28-30 | +0 weeks (parallel with B14/B18) |
| B16: Performance Optimization | 2 weeks | 28-30 | +0 weeks (parallel with B14/B18) |
| B17: Security Hardening | 2 weeks | 28-30 | +0 weeks (parallel with B14/B18) |

---

## 6. Slack Analysis

### 6.1 Slack by Batch

```
Batch                              Duration    Earliest Start    Latest Finish    Slack
─────────────────────────────────────────────────────────────────────────────────────
B1: Shared Foundation              2 weeks        Week 1           Week 2          0w  ★Critical
B2: Database Core                  3 weeks        Week 3           Week 5          0w  ★Critical
B3: Functions L0-1                 2 weeks        Week 6           Week 7          0w  ★Critical
B4: Functions L2-3                 3 weeks        Week 8           Week 10         0w  ★Critical
B5: Functions L4-5 + Connectors    3 weeks        Week 11          Week 13         0w  ★Critical
B6: Core Applications              5 weeks        Week 9           Week 16        +2w
B7: Specialized Applications       4 weeks        Week 13          Week 18        +1w
B8: Cross-Cutting Applications     4 weeks        Week 15          Week 20        +1w
B9: Agent Infra + Core Agents      4 weeks        Week 14          Week 17         0w  ★Critical
B10: Extended Agents               2 weeks        Week 18          Week 19         0w  ★Critical
B11: Autonomous Workflows          2 weeks        Week 20          Week 21         0w  ★Critical
B12: Entry + Secondary Workflows   2 weeks        Week 22          Week 23         0w  ★Critical
B13: Execution + Reporting WF      2 weeks        Week 24          Week 25         0w  ★Critical
B14: E2E Integration               2 weeks        Week 26          Week 27         0w  ★Critical
B15: System Testing                2 weeks        Week 26          Week 30        +2w
B16: Performance Optimization      2 weeks        Week 26          Week 30        +2w
B17: Security Hardening            2 weeks        Week 26          Week 30        +2w
B18: Production Release            2 weeks        Week 28          Week 30         0w  ★Critical
```

### 6.2 High-Slack Batches (Can Absorb Delay)

| Batch | Slack | Can slip by | Without delaying |
|-------|:-----:|:-----------:|------------------|
| B6: Core Apps | +2w | 2 weeks | B14 start |
| B7: Specialized Apps | +1w | 1 week | B14 start |
| B8: Cross-Cutting Apps | +1w | 1 week | B14 start |
| B15: System Testing | +2w | 2 weeks | B18 start |
| B16: Performance Optimization | +2w | 2 weeks | B18 start |
| B17: Security Hardening | +2w | 2 weeks | B18 start |

---

## 7. Blocking Chain Analysis

### 7.1 Most Blocking Batches

These batches block the most downstream work:

| Batch | Blocks # of Batches | Downstream Work |
|-------|:-------------------:|-----------------|
| B1: Shared Foundation | 17 | ALL subsequent batches |
| B2: Database Core | 15 | ALL function and app batches |
| B5: Functions L4-5 + Connectors | 9 | All app + agent + workflow batches |
| B4: Functions L2-3 | 8 | All app + workflow batches |
| B9: Agent Infra + Core Agents | 6 | Workflow batches |
| B3: Functions L0-1 | 5 | Higher function layers + agents |

### 7.2 Most Blocked Batches

These batches are blocked by the most upstream work:

| Batch | Blocked By # | Wait Time |
|-------|:-----------:|:---------:|
| B18: Production Release | 10 | 28 weeks |
| B14: E2E Integration | 9 | 26 weeks |
| B13: Execution + Reporting WF | 8 | 24 weeks |
| B17: Security Hardening | 7 | 26 weeks |
| B15: System Testing | 7 | 26 weeks |

### 7.3 Critical Merge Points

Where multiple tracks converge:

| Week | Merge Event | Tracks | Description |
|:----:|:-----------:|:------:|-------------|
| 9 | Platform → Frontend | Track A → Tracks B, C | FE teams start building on shared packages |
| 14 | Functions → Apps | Track A → Track D | ORC functions ready for notification/analytics apps |
| 18 | Apps → Agents | Tracks B, C, D → Track F | Agent teams reference app behaviors and user flows |
| 24 | Agents → Workflows | Track F → Track G | Workflows consume agents as nodes |
| 29 | ALL → Production | Tracks A-G → G6 | All teams converge for system testing + production |

---

> **End of DEPENDENCY_GRAPH.md**
