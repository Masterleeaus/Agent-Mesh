# RESQAI V2 — Dependency Timeline

> Phase 2.0 — Implementation Planning Only  
> Chief Technical Program Manager  
> Date: 2026-06-29

---

## Table of Contents

1. [PERT Chart](#1-pert-chart)
2. [Critical Path](#2-critical-path)
3. [Parallel Tracks](#3-parallel-tracks)
4. [Resource Loading Timeline](#4-resource-loading-timeline)
5. [Earliest Start Times](#5-earliest-start-times)

---

## 1. PERT Chart

```
Legend:
  [C] = Component    → = depends on    ⇢ = triggers    || = parallel track
  (W#) = Week number

W1  W2  W3  W4  W5  W6  W7  W8  W9  W10 W11 W12 W13 W14 W15 W16 W17 W18 W19 W20 W21 W22 W23 W24 W25 W26 W27 W28 W29 W30
════╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╗
┃                                                                                                                       ┃
┃  PHASE 0  ┃  PHASE 1    ┃  PHASE 2     ┃  PHASE 3     ┃  PHASE4┃  PHASE5     ┃  PHASE6        ┃  PHASE7              ┃
┃           ┃             ┃              ┃              ┃        ┃             ┃                ┃                      ┃
┃═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══┃
┃                                                                                                                       ┃
┃  TRACK A: Platform/Backend (Critical Path)                                                                             ┃
┃  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  ┃
┃  [Repo]                                                              ┃                                                  ┃
┃  [Packages]                                                          ┃                                                  ┃
┃       [Migrations 0-6]                 ┃                             ┃                                                  ┃
┃            [Event Bus]                 ┃                             ┃                                                  ┃
┃                 [Auth]                 ┃                             ┃                                                  ┃
┃                      [DET Funcs]       ┃                            ┃                                                   ┃
┃                           [WRI Funcs]  ┃                           ┃                                                    ┃
┃                                [AGG Funcs]  ┃                      ┃                                                    ┃
┃                                     [ORC Funcs] ┃                 ┃                                                     ┃
┃                                          [Connectors] ┃            ┃                                                    ┃
┃                                                   [Agent Infra]   ┃                                                    ┃
┃                                                        [Agents]   ┃                                                    ┃
┃                                                             [Workflows]                                                ┃
┃                                                                  [Int]                                                 ┃
┃                                                                                                                       ┃
┃  TRACK B: Frontend Alpha (support, resolution, crm)                                                                     ┃
┃  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  ┃
┃       [wait for packages]                                                                                               ┃
┃            [support-center_v2]                               ┃                                                          ┃
┃                      [resolution-center_v2]                   ┃                                                         ┃
┃                           [crm-center_v2]                    ┃                                                          ┃
┃                                     [cross-app polish]                                                                  ┃
┃                                                                  [Int]                                                 ┃
┃                                                                                                                       ┃
┃  TRACK C: Frontend Beta (ops, appt, technician, customer)                                                                ┃
┃  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  ┃
┃       [wait for packages]                                                                                               ┃
┃            [ops-center_v2, appt-center_v2] ┃                                                                             ┃
┃                      [technician-portal_v2] ┃                                                                           ┃
┃                           [customer-portal_v2] ┃                                                                        ┃
┃                                     [cross-app polish]                                                                  ┃
┃                                                                  [Int]                                                 ┃
┃                                                                                                                       ┃
┃  TRACK D: Frontend Gamma (notification, analytics, admin)                                                                ┃
┃  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  ┃
┃                                                                                                                       ┃
┃                          [wait]                                 ┃                                                      ┃
┃                               [notification-center_v2] ┃         ┃                                                     ┃
┃                                     [analytics-center_v2]        ┃                                                     ┃
┃                                          [admin-center_v2] ┃                                                           ┃
┃                                                   [Int]                                                                 ┃
┃                                                                                                                       ┃
┃  TRACK E: Agent + Workflow                                                                                              ┃
┃  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  ┃
┃                                                                                                                       ┃
┃                          [wait for functions]                       ┃                                                  ┃
┃                                     [Agent infra]                    ┃                                                 ┃
┃                                          [Core agents]               ┃                                                ┃
┃                                               [Ext agents] ┃                                                           ┃
┃                                                    [WF Tier 0-1] ┃                                                     ┃
┃                                                         [WF Tier 2-7]                                                 ┃
┃                                                              [Int]                                                     ┃
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Critical Path

The critical path is the longest sequence of dependent work items. Any delay on the critical path directly extends the project.

### Critical Path Sequence

```
Week 1-2:     Repository + Shared Packages
Week 1-2:     Migration 0-1 (Foundation + Identity tables)
Week 2-4:     Migration 2-4 (Core + Operational + Detail tables)
Week 3-4:     Event bus + Auth
Week 4-6:     DET + READER functions (15)
Week 5-8:     WRI functions (22)
Week 7-10:    AGG functions (10)
Week 9-11:    ORC + TRA functions (6)
Week 10-12:   Connectors (6)
Week 12-14:   Core Apps (support, ops, appt, tech)
Week 14-16:   Specialized Apps (resolution, CRM, customer)
Week 16-18:   Cross-Cutting Apps (notification, analytics, admin)
Week 18-20:   Agent infrastructure
Week 20-24:   All 49 agents
Week 24-28:   All 33 workflows
Week 28-30:   Integration + Production

Total critical path: 29.5 weeks (with 0.5 week buffer = 30 weeks)
```

### Critical Path Items (Non-Negotiable)

| Item | Duration | Depends On | Blocks |
|------|:--------:|------------|--------|
| Shared packages | 2 weeks | Nothing | Everything |
| Migration 0-1 | 2 weeks | Shared packages | Migration 2-6 |
| Migration 2-4 | 2 weeks | Migration 0-1 | All functions |
| Event bus | 1 week | Migration 1 | Functions that emit events |
| Auth | 1 week | Migration 1 | All apps |
| DET functions | 1 week | Migration 0 | WRI functions |
| WRI functions | 3 weeks | DET functions, Migration 2-4 | AGG functions |
| AGG functions | 3 weeks | WRI functions | ORC functions |
| ORC functions | 2 weeks | AGG functions, Connectors | Agent infra |
| Agent infra | 2 weeks | ORC functions | Agents |
| Core Agents | 2 weeks | Agent infra | Extended Agents, Workflows |
| Extended Agents | 2 weeks | Core Agents | Workflows |
| Tier 0-1 workflows | 2 weeks | Extended Agents, All functions | Tier 2-7 workflows |
| Tier 2-7 workflows | 2 weeks | Tier 0-1 workflows | Production |
| E2E Integration | 2 weeks | All workflows | Production deploy |

---

## 3. Parallel Tracks

### Track A: Platform / Backend (Critical Path)
**Team:** Platform (2) → BE Alpha (2) → BE Beta (2)

| Activity | Weeks | Dependencies |
|----------|:-----:|--------------|
| Repository scaffold | 1-2 | None |
| Shared packages | 1-2 | Repository |
| Migrations 0-6 | 1-4 | Shared packages |
| Event bus | 3-4 | Migrations 0-1 |
| Auth | 3-4 | Migrations 0-1 |
| DET functions (7) | 4-5 | Migrations 0-1 |
| READER functions (8) | 5-6 | Migrations 2-4 |
| WRI functions — Core (8) | 5-7 | DET functions, Migrations 2-4 |
| WRI functions — Extended (14) | 6-8 | DET functions, Migrations 2-6 |
| AGG functions (10) | 7-10 | WRI functions |
| TRA + ORC functions (6) | 9-11 | AGG functions |
| Connectors (6) | 10-12 | ORC functions |
| Agent infrastructure | 18-20 | ORC functions |
| Agent support (Sprint 11) | 20-22 | Agent infra |
| Agent extended (Sprint 12) | 22-24 | Agent support |
| Workflows Tier 0-1 | 24-26 | Agents, Functions |
| Workflows Tier 2-7 | 26-28 | Workflows Tier 0-1 |
| Integration | 28-30 | All workflows |

### Track B: Frontend Alpha
**Team:** FE Alpha (2)

| Activity | Weeks | Dependencies |
|----------|:-----:|--------------|
| Idle (shared packages building) | 1-4 | Track A |
| support-center_v2 | 9-12 | Shared packages, DET+WRI functions |
| resolution-center_v2 | 13-14 | support-center_v2 |
| crm-center_v2 | 13-14 | support-center_v2 |
| Cross-app polish | 15-16 | All frontend apps |
| E2E testing | 28-30 | All tracks |

### Track C: Frontend Beta
**Team:** FE Beta (2)

| Activity | Weeks | Dependencies |
|----------|:-----:|--------------|
| Idle | 1-4 | Track A |
| operations-center_v2 | 9-12 | Shared packages |
| appointment-center_v2 | 9-12 | Shared packages |
| technician-portal_v2 | 11-12 | ops-center, appt-center |
| customer-portal_v2 | 13-14 | technician-portal_v2 |
| Cross-app polish | 15-16 | All frontend apps |
| E2E testing | 28-30 | All tracks |

### Track D: Frontend Gamma
**Team:** FE Gamma (2)

| Activity | Weeks | Dependencies |
|----------|:-----:|--------------|
| Idle | 1-8 | Track A |
| notification-center_v2 | 15-18 | ORC functions (dispatch-notifications) |
| analytics-center_v2 | 17-18 | notification-center_v2 |
| admin-center_v2 | 17-18 | notification-center_v2 |
| E2E testing | 28-30 | All tracks |

### Track E: Agents + Workflows
**Team:** Agent (2) → Workflow (2)

| Activity | Weeks | Dependencies |
|----------|:-----:|--------------|
| Idle | 1-10 | Track A |
| Agent infrastructure | 18-20 | ORC functions |
| Core agents | 20-22 | Agent infrastructure |
| Extended agents | 22-24 | Core agents |
| Workflows Tier 0-1 | 24-26 | All agents, all functions |
| Workflows Tier 2-7 | 26-28 | Workflows Tier 0-1 |

---

## 4. Resource Loading Timeline

```
Week:  1 2 3 4  5 6 7 8  9 10 11 12  13 14 15 16  17 18 19 20  21 22 23 24  25 26 27 28  29 30

Platform  ████████████  ████████        ████████                                     ████████
(2 eng)   scaffold packages migrations   event bus auth                               e2e deploy

BE Alpha  ████████████████████████████████
(2 eng)   functions functions functions

BE Beta   ████████████████████████████████████████████████████████
(2 eng)   functions functions functions   connectors     agent infra   wf support   [e2e]

FE Alpha  ████████████████████████████████████████████████████████
(2 eng)               support  resol crm   polish                              [e2e]

FE Beta   ████████████████████████████████████████████████████████
(2 eng)               ops/appt tech cust   polish                              [e2e]

FE Gamma  ████████████████████████████████████████████████████████
(2 eng)                           notif  analytics admin                      [e2e]

Agent     ████████████████████████████████████████████████████████
(2 eng)                     infra   core-agents    ext-agents   [wf support]   [e2e]

Workflow  ████████████████████████████████████████████████████████
(2 eng)                                               tier0-1    tier2-7       [e2e]

Total:   2  2 2 2  5 5 5 5  5 5 5 5  4 4 4 4  3 5 5 5  5 5 5 5  5 5 5 5  8 8 8 8
```

---

## 5. Earliest Start Times

| Component | Earliest Start | Depends On |
|-----------|:--------------:|------------|
| Shared packages | Week 1 | Nothing |
| Migration 0 | Week 1 | Nothing |
| Migration 1 | Week 1 | Nothing |
| Migration 2-6 | Week 3 | Migration 0-1 |
| Event bus | Week 3 | Migration 0-1 |
| Auth system | Week 3 | Migration 0-1 |
| DET functions | Week 4 | Migration 0 |
| READER functions | Week 5 | Migration 2-4 |
| WRI functions | Week 5 | Migration 2-4, DET functions |
| AGG functions | Week 7 | WRI functions |
| TRA function | Week 9 | Nothing (pure) |
| ORC functions | Week 9 | AGG functions |
| Connectors | Week 10 | ORC functions |
| support-center_v2 | Week 9 | Shared packages + WRI functions |
| operations-center_v2 | Week 9 | Shared packages + WRI functions |
| appointment-center_v2 | Week 9 | Shared packages + WRI functions |
| technician-portal_v2 | Week 11 | WRI functions (WO) |
| customer-portal_v2 | Week 13 | Shared packages |
| resolution-center_v2 | Week 13 | Shared packages + WRI (dispute) |
| crm-center_v2 | Week 13 | Shared packages + AGG (health) |
| notification-center_v2 | Week 15 | ORC functions (dispatch-notifications) |
| analytics-center_v2 | Week 17 | notification-center_v2 |
| admin-center_v2 | Week 17 | notification-center_v2 |
| Agent infrastructure | Week 18 | ORC functions |
| Executive agents | Week 20 | Agent infrastructure |
| Core domain agents | Week 20 | Agent infrastructure |
| Extended domain agents | Week 22 | Core domain agents |
| Tier 0-1 workflows | Week 24 | Core + Extended agents, All functions |
| Tier 2-7 workflows | Week 26 | Tier 0-1 workflows |
| E2E Integration | Week 28 | All components |
| Production deploy | Week 30 | E2E Integration |

---

> **End of DEPENDENCY_TIMELINE.md**  
> Next document: MILESTONE_PLAN.md
