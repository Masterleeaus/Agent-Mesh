# RESQAI V2 — Project Roadmap

> Phase 2.0 — Implementation Planning Only  
> Chief Technical Program Manager  
> Date: 2026-06-29

---

## Table of Contents

1. [Timeline Gantt](#1-timeline-gantt)
2. [Phase Overview](#2-phase-overview)
3. [Resource Loading](#3-resource-loading)
4. [Budget Estimate](#4-budget-estimate)
5. [Risk Register](#5-risk-register)
6. [Dependency Checklist for Go-Live](#6-dependency-checklist-for-go-live)
7. [Decision Log](#7-decision-log)

---

## 1. Timeline Gantt

### Legend
```
████ = Active work    ░░░░ = Buffer/Idle    ━━━ = Critical path
[G#] = Quality Gate    [M#] = Milestone Checkpoint
```

```
Phase 0: Foundation (W1-W4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Repo + Packages          ██████████████████
Migration 0               ████████
Migration 1               ████████
Migration 2-4                       ██████████████████
Migration 5-6                                 ████████
Event Bus                          ████████
Auth                               ████████
CI/CD                       ████████
                           [G0]  [M0]
                           W4

Phase 1: Functions — DET + READER (W4-W6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DET Functions (7)              ████████████████
READER Functions (8)                     ████████████████

Phase 1: Functions — WRI Core (W5-W7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WRI Core Functions (8)              ██████████████████

Phase 1: Functions — WRI Extended (W6-W8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WRI Extended Functions (14)              ████████████████████████

Phase 1: Functions — AGG + ORC + TRA (W7-W11)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGG Functions (10)                         ████████████████████████████
ORC Functions (5)                                         ████████████████
TRA Function (1)                                           ████

Phase 1: Connectors (W10-W12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Connectors (6)                               ████████████████████
                                               [G1]  [M1]
                                               W12

Phase 2: Core Apps (W9-W14)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
support-center_v2                    ████████████████████████████
operations-center_v2                 ████████████████████████████
appointment-center_v2                ████████████████████████████
technician-portal_v2                            ████████████████████

Phase 3: Specialized Apps (W13-W16)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
customer-portal_v2                               ██████████████████████████████
resolution-center_v2                             ██████████████████████████████
crm-center_v2                                    ██████████████████████████████

Phase 4: Cross-Cutting Apps (W15-W18)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
notification-center_v2                            ████████████████████████████
analytics-center_v2                                             ████████████████
admin-center_v2                                                  ████████████████
                                                               [G2]  [M2]
                                                                W18

Phase 5: Agent Infrastructure + Core Agents (W18-W22)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent Infrastructure                            ████████████████████
Executive Agents (2)                                        ████████████
Core Domain Agents (12)                                     ████████████████████

Phase 5: Extended Agents (W22-W24)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Extended Domain Agents (35)                                    ████████████████████
                                                                  [G3]  [M3]
                                                                   W22

Phase 6: Workflows (W24-W28)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tier 0-1 Workflows (14)                                                       ██████████████████████████████
Tier 2-7 Workflows (19)                                                                        ████████████████████
                                                                                                  [G4]  [M4]
                                                                                                  W28

Phase 7: Integration + Production (W28-W30)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Integration Testing                                                                         ██████████████████
Security Audit                                                                              ██████████████████
Performance Optimization                                                                    ██████████████████
Documentation + Runbooks                                                                    ██████████████████
                                                                                               [G5]  [M5]
                                                                                               W30

Production Canary (W30-W32)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Canary Deploy (10%)                                                                             ████████
Ramp (50%)                                                                                              ████████████████
Full Production (100%)                                                                                          ████████
                                                                                                                 [G6]
                                                                                                                  W32

V1 Decommission (W32-W36)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
V1 Read-Only Coexistence                                                                                    ████████████████████████████
Data Migration from V1 Tables                                                                               ████████████████████████████
V1 Archive                                                                                                  ████████████████████████████
Final V1 Shutdown                                                                                                                       ████
```

---

## 2. Phase Overview

| Phase | Name | Duration | Sprints | Weeks | Parallel Tracks | Cumulative |
|-------|------|:--------:|:-------:|:-----:|:---------------:|:----------:|
| 0 | Foundation | 4 weeks | 1-2 | 1-4 | 1 (Platform only) | 4 weeks |
| 1 | Core Functions | 8 weeks | 3-6 | 4-12 | 2 (Platform + BE Alpha) | 12 weeks |
| 2 | Core Apps | 6 weeks | 5-7 | 9-14 | 4 (All FE tracks) | 14 weeks |
| 3 | Specialized Apps | 4 weeks | 7-8 | 13-16 | 3 (FE Alpha + Beta + Gamma) | 16 weeks |
| 4 | Cross-Cutting Apps | 4 weeks | 8-9 | 15-18 | 3 (FE Gamma + BE Beta) | 18 weeks |
| 5 | Agents | 6 weeks | 10-12 | 18-24 | 2 (Agent + BE Beta) | 24 weeks |
| 6 | Workflows | 4 weeks | 13-14 | 24-28 | 2 (Workflow + BE Beta) | 28 weeks |
| 7 | Integration | 2 weeks | 15 | 28-30 | 4 (All remaining) | 30 weeks |
| 8 | Production | 2 weeks | Post-S15 | 30-32 | 1 (Platform + CTO) | 32 weeks |
| 9 | V1 Decommission | 4 weeks | Post-Prod | 32-36 | 1 (Platform + BE) | 36 weeks |

### Milestone Timeline

```
Week 0:  Project Kickoff
Week 4:  🟢 Milestone Alpha — Foundation Complete
          ✓ All 41 tables
          ✓ Event bus + auth
          ✓ CI/CD + packages
          Gate: G0 (Foundation)

Week 12: 🟢 Milestone Beta — Functions + Connectors Complete
          ✓ All 53 functions
          ✓ All 6 connectors
          ✓ V1/V2 gap analysis
          Gate: G1 (Functions)

Week 18: 🟢 Milestone Gamma — All Apps Complete
          ✓ All 10 V2 apps
          ✓ Cross-app journeys
          ✓ Responsive + accessible
          Gate: G2 (Apps)

Week 22: 🟢 Checkpoint: Agents — Core Agents Complete
          ✓ 26 agents deployed (executive + core domain)
          ✓ Agent cascade working
          ✓ Hallucination rate < 5%
          Gate: G3 (Agents)

Week 24: 🟢 Checkpoint: Extended Domain Agents Complete
          ✓ All 49 agents deployed
          ✓ Agent metrics verified

Week 28: 🟢 Milestone Delta — Agents + Workflows Complete
          ✓ All 33 workflows
          ✓ Full journey E2E passes
          Gate: G4 (Workflows)

Week 30: 🟢 Milestone: Integration Complete
          ✓ All 150 components integrated
          ✓ Security + DR + load tested
          Gate: G5 (Integration)

Week 32: 🟢 Milestone Production — Go-Live
          ✓ Canary: 10% → 50% → 100%
          ✓ SLA: 99.9% uptime 72h
          ✓ Zero P0/P1 bugs
          Gate: G6 (Production)

Week 36: 🏁 V1 Decommission Complete
          ✓ V1 data migrated to V2
          ✓ V1 tables archived
          ✓ Final V1 shutdown
```

---

## 3. Resource Loading

### Team Structure

| Team | Role | Size | Weeks Active | Hours (total) |
|------|------|:----:|:------------:|:-------------:|
| Platform | Infra + Shared | 2 | W1-32 | 1,280 |
| BE Alpha | Core functions | 2 | W4-12 | 320 |
| BE Beta | Extended functions, connectors, agent infra, workflows | 2 | W6-32 | 1,040 |
| FE Alpha | support, resolution, crm | 2 | W9-18 | 400 |
| FE Beta | ops, appt, technician, customer | 2 | W9-18 | 400 |
| FE Gamma | notification, analytics, admin | 2 | W15-18 | 160 |
| Agent | All 49 agents | 2 | W18-24 | 280 |
| Workflow | All 33 workflows | 2 | W24-32 | 320 |
| Security | Security audit | 1 | W28-30 | 40 (part-time) |
| QA | End-to-end testing | 1 | W28-32 | 80 (part-time) |

### Resource Loading Chart

```
Team:       W1  W4  W8  W12 W16 W20 W24 W28 W32 W36
─────────────────────────────────────────────────────
Platform    ██  ██  ██  ██  ██  ██  ██  ██  ██  ██
BE Alpha          ██  ██
BE Beta               ██  ██  ██  ██  ██  ██
FE Alpha                     ██  ██
FE Beta                      ██  ██
FE Gamma                              ██
Agent                                     ██  ██
Workflow                                         ██  ██
Security (PT)                                             ██
QA (PT)                                                    ██  ██

Capacity:   2   5   7   5   5   5   5   5   5   2
            eng eng eng eng eng eng eng eng eng eng
```

### Peak Resource: Week 28-30

```
┌─────────────────────────────────────────────────────┐
│ Peak Resource: Integration Sprint (W28-30)           │
├─────────────────────────────────────────────────────┤
│ Platform (2)   ─── Production deploy + monitoring   │
│ BE Beta (2)    ─── Workflow + connector E2E         │
│ Workflow (2)   ─── Workflow finalization             │
│ Security (1)   ─── Production security audit         │
│ QA (1)         ─── Full regression suite             │
├─────────────────────────────────────────────────────┤
│ Total: 8 engineers for 2 weeks = 16 eng-weeks       │
└─────────────────────────────────────────────────────┘
```

---

## 4. Budget Estimate

### Engineering Weeks by Phase

| Phase | Platform | BE | FE | Agent | WF | QA | Security | Total EW |
|-------|:--------:|:--:|:--:|:-----:|:--:|:--:|:--------:|:--------:|
| 0 — Foundation | 8 | — | — | — | — | — | — | 8 |
| 1 — Functions | 6 | 16 | — | — | — | — | — | 22 |
| 2 — Core Apps | — | — | 16 | — | — | — | — | 16 |
| 3 — Specialized | — | — | 12 | — | — | — | — | 12 |
| 4 — Cross-Cutting | — | — | 12 | — | — | — | — | 12 |
| 5 — Agents | 4 | 6 | — | 12 | — | — | — | 22 |
| 6 — Workflows | — | 6 | — | — | 12 | — | — | 18 |
| 7 — Integration | 4 | 4 | 4 | 4 | 4 | 4 | 2 | 26 |
| 8 — Production | 4 | — | — | — | — | 2 | 2 | 8 |
| 9 — V1 Decom | 4 | 4 | — | — | — | — | — | 8 |
| **Total** | **30** | **36** | **44** | **16** | **16** | **6** | **4** | **152** |

### Cost Estimate

| Category | Calculation | Amount |
|----------|------------|-------:|
| Engineering (152 eng-weeks × $2,500/ew) | Direct labor | $380,000 |
| Infrastructure (Vercel/Netlify + DB + LLM API + connectors) | 8 months | $40,000 |
| Tools (Cypress, Sentry, DataDog) | 8 months | $16,000 |
| LLM API costs (agent inference, 49 agents, estimated 500k calls/month) | 8 months × $500 | $4,000 |
| Security audit (external) | Fixed | $15,000 |
| Contingency (15%) | | $68,250 |
| **Total Estimated Budget** | | **$523,250** |

### Cost Breakdown Per Phase

```
Phase 0: Foundation    $ 20,000  (3.8%)
Phase 1: Functions     $ 55,000  (10.5%)
Phase 2: Core Apps     $ 40,000  (7.6%)
Phase 3: Specialized   $ 30,000  (5.7%)
Phase 4: Cross-Cutting $ 30,000  (5.7%)
Phase 5: Agents        $ 55,000  (10.5%)
Phase 6: Workflows     $ 45,000  (8.6%)
Phase 7: Integration   $ 65,000  (12.4%)
Phase 8: Production    $ 20,000  (3.8%)
Phase 9: V1 Decom      $ 20,000  (3.8%)
Contingency            $ 68,250  (13.0%)
Infra + Tools + Audit  $ 75,000  (14.4%)
─────────────────────────────────────────
Total                  $523,250  (100%)
```

---

## 5. Risk Register

| ID | Risk | Likelihood | Impact | Score | Mitigation | Owner |
|----|------|:----------:|:------:|:-----:|------------|-------|
| R1 | LLM API cost overrun (agent inference higher than expected) | Medium | High | 12 | Token budgets per session; caching layer; fallback to rule-based; negotiate volume pricing | Agent Lead |
| R2 | Key engineer departure during critical phase | Low | High | 9 | Cross-training every sprint; documentation mandates; 2-week knowledge transfer notice | CTO |
| R3 | V2 data migration from V1 produces inconsistent state | Medium | High | 9 | Dual-write during cutover; reconciliation job pre-flight; rollback procedure tested | BE Lead |
| R4 | Third-party connector API changes breaking integration | Medium | Medium | 8 | Circuit breaker; connector version pinning; webhook fallback; monthly connector health check | BE Beta Lead |
| R5 | Agent hallucination rate exceeds acceptable threshold | Medium | Medium | 8 | Manual audit every sprint; prompt versioning; confidence scoring; human-in-the-loop for critical decisions | Agent Lead |
| R6 | Frontend apps not completing in parallel timeline | Medium | Medium | 8 | FE tracks have dedicated scope; shared component library reduces duplication; buffer 1 week in each FE track | FE Lead |
| R7 | Workflow execution timeout under load | Low | High | 6 | Workflow step timeout limits; async non-blocking design; load test before production | Workflow Lead |
| R8 | Security vulnerability discovered during production audit | Low | High | 6 | Security review per gate; dependency scanning automated; pre-production pen test | Security Lead |
| R9 | Event bus message loss or duplication at scale | Low | High | 6 | At-least-once delivery; event persistence; dead letter queue; monitoring + alerting | Platform Lead |
| R10 | V1/V2 coexistence causes data race conditions | Low | Medium | 4 | Dual-write with conflict resolution; reconciliation job; no V1 writes after 30-day window | BE Lead |
| R11 | Regulatory compliance gap (GDPR, data retention) | Low | Medium | 4 | Compliance review in Phase 0; audit logging; data retention policies; right-to-delete workflow | Legal + BE |
| R12 | Scope creep from new feature requests during implementation | Medium | Low | 4 | Strict Phase 2.0 scope freeze; change request process; all new features deferred to V2.1 | CTO |

### Risk Score Matrix

```
Impact →
     │ Low(1)  Med(2)  High(3)
L    ├────────────────────────
i    │ 1       2        3      Low Likelihood (1)
k    │ 2       4        6      Med Likelihood (2)
e    │ 3       6🔴      9🔴   High Likelihood (3)
l    │
i    │ Scores: 1-3 = Watch  4-6 = Monitor  8-9 = Mitigate  12+ = Critical
h    │
o    │
o
d

Current risk profile:
  9+ (Critical):  R1*, R2*, R3*, R5*, R6*
  4-8 (Monitor):  R4, R7, R8, R9
  1-3 (Watch):    R10, R11, R12
```

---

## 6. Dependency Checklist for Go-Live

This checklist must be complete before Gate 6 is passed.

### Pre-Production (Week 28-30)

```
┌────────────────────────────────────────────────────────────────┐
│ PRODUCTION GO-LIVE CHECKLIST                                   │
├────────────────────────────────────────────────────────────────┤
│ [ ] All 41 tables created in production `_v2` schema           │
│ [ ] All 53 functions deployed to production                    │
│ [ ] All 6 connectors configured with production credentials    │
│ [ ] All 10 V2 apps deployed to production at /v2/* paths       │
│ [ ] All 49 agents deployed + health-checked in production      │
│ [ ] All 33 workflows deployed + health-checked in production   │
│ [ ] Event bus operational in production                        │
│ [ ] Auth system operational in production                      │
│ [ ] V1 coexistence strategy active (dual-write or read-only)   │
├────────────────────────────────────────────────────────────────┤
│ [ ] Load test: 200 concurrent users, 30 min, no SLA violation  │
│ [ ] Security scan: zero critical, zero high findings           │
│ [ ] DR drill: recovery under 1h RTO validated                  │
│ [ ] Full regression suite: all 6 prior gates criteria re-check │
├────────────────────────────────────────────────────────────────┤
│ [ ] Runbooks: all operational tasks documented                 │
│ [ ] Monitoring dashboards: all components visible              │
│ [ ] Alerts configured for P0/P1 conditions                    │
│ [ ] On-call rotation schedule published                        │
│ [ ] Escalation matrix documented                               │
├────────────────────────────────────────────────────────────────┤
│ [ ] Rollback procedures documented (Tier 1-5)                 │
│ [ ] Rollback procedures tested in staging                     │
│ [ ] V1 full service restored in < 5 min (Tier 1) confirmed    │
├────────────────────────────────────────────────────────────────┤
│ [ ] Canary plan approved by CTO                                │
│ [ ] Ramp plan approved by CTO                                  │
│ [ ] V1 decommission plan approved by CTO + CEO                │
│ [ ] Production go/no-go meeting scheduled                     │
│ [ ] Final sign-off: CTO, VP Eng, CEO                          │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Decision Log

| # | Date | Decision | Rationale | Author |
|---|------|----------|-----------|--------|
| D1 | 2026-06-29 | Phase 2.0 planning: 7 documents, no implementation | Separate planning from execution; validate complete blueprint before writing code | CTO |
| D2 | 2026-06-29 | 15 two-week sprints = 30 weeks (reduced from 36 via parallelization) | 4 parallel tracks: Platform, FE Alpha, FE Beta, Agent; earlier docs estimated 36 weeks serial | CTO |
| D3 | 2026-06-29 | V2 uses `_v2` suffix on tables, `/v2/` subpath on apps, separate event bus | Zero cross-talk with V1; full coexistence until Phase 7 cutover | CTO |
| D4 | 2026-06-29 | Agent build split: Sprint 11 (core) + Sprint 12 (extended) | Core agents must demonstrate quality before extended build; allows feedback loop | CTO |
| D5 | 2026-06-29 | Workflows built after agents (Sprint 13-14) | Workflows depend on agent tools; building agents first ensures workflows have complete tool support | CTO |
| D6 | 2026-06-29 | 5 quality gates (Alpha→Production) + 7 detailed gates | Alpha/Beta/Gamma/Delta/Production are milestone checkpoints; G0-G6 are technical quality gates | CTO |
| D7 | 2026-06-29 | Peak 8 engineers at integration sprint | Phase 0-6 use 5-7 engineers; Phase 7 adds Security + QA (part-time) for full validation | CTO |
| D8 | 2026-06-29 | 15% contingency on budget ($68K) | Accounts for LLM cost variance, connector API changes, and scope refinements | CTO |
| D9 | 2026-06-29 | V1 decommission at W36 (4 weeks after production) | 30-day coexistence ensures no data loss; V1 stabilized in read-only after cutover | CTO |
| D10 | 2026-06-29 | Strict scope freeze: all V2.1 features deferred | Prevents scope creep; V2.1 roadmap to be planned after V2 production stabilize | CTO |

---

## 8. Summary — One-Page View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ RESQAI V2 — PROJECT AT A GLANCE (30-Week Plan)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Timeline:  Jun 2026 → Feb 2027                                        │
│  Sprints:   15 two-week sprints                                         │
│  Phases:    10 (Foundation → V1 Decommission)                          │
│  Teams:     8 max (Platform, BE×2, FE×3, Agent, Workflow)             │
│  Budget:    ~$523,250 total                                             │
│  Eng-Weeks: 152                                                         │
│                                                                         │
│  Output:    41 tables  53 functions  6 connectors  10 apps             │
│             49 agents  33 workflows  30+ notifications                 │
│                                                                         │
│  Quality:   7 gates (G0-G6), 5 milestones (Alpha→Production)           │
│  Risk:      12 risks identified, 5 critical (R1-R6), all mitigated     │
│  Rollback:  5 tiers, V1 preserved for 30 days post-cutover             │
│                                                                         │
│  Key Dates:                                                             │
│    W4  — Foundation Complete      │  W28 — Workflows Complete          │
│    W12 — Functions Complete       │  W30 — Integration Complete        │
│    W18 — All Apps Complete        │  W32 — Production Go-Live          │
│    W22 — Agents—Core Done         │  W36 — V1 Decommission             │
│    W24 — All Agents Complete      │                                     │
│                                                                         │
│  Risks to Watch:                                                        │
│    🔴 LLM costs, engineer retention, data migration                    │
│    🟡 Agent hallucination, FE timing, connector API changes            │
│    🟢 Event bus scale, security, scope creep                           │
│                                                                         │
│  Success Criteria:                                                      │
│    1. 150/150 components operational                                     │
│    2. SLA: 99.9% uptime, API <2s p95, Agent <5s p95                    │
│    3. Zero critical security findings                                    │
│    4. Full cutover from V1 within 30 days                                │
│    5. V1 decommissioned with no data loss                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

> **End of PROJECT_ROADMAP.md**  
> This completes all 7 Phase 2.0 implementation planning documents.
