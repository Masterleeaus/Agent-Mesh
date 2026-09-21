# RESQAI V2 — Master Implementation Plan

> Phase 3.5 — Implementation Execution Plan
> Chief Technical Program Manager
> Date: 2026-06-29

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope & Artifact Inventory](#2-scope--artifact-inventory)
3. [Implementation Philosophy](#3-implementation-philosophy)
4. [Phase Architecture](#4-phase-architecture)
5. [Team Structure & Resource Plan](#5-team-structure--resource-plan)
6. [Dependency Management Strategy](#6-dependency-management-strategy)
7. [Parallel Execution Strategy](#7-parallel-execution-strategy)
8. [Critical Path](#8-critical-path)
9. [Risk & Contingency](#9-risk--contingency)
10. [Governance Model](#10-governance-model)
11. [Appendix: Artifact Catalog](#11-appendix-artifact-catalog)

---

## 1. Executive Summary

### Mission
Deliver ResQAI V2 — a complete rebuild of the ResQAI platform with AI-native agents, deterministic functions, multi-channel notifications, real-time operations, and full V1 coexistence — across 100 engineers in 30 weeks.

### What We Are Building

| Category | Count | Description |
|----------|:-----:|-------------|
| Database Tables | 41 | 15 business domains across 6 migration tiers |
| Functions | 53 | Deterministic, Reader, Writer, Aggregator, Transformer, Orchestrator |
| Applications | 10 | 8 internal + 2 customer-facing portals |
| Agents | 49 | Executive, Domain, Sub-domain across 16 departments |
| Workflows | 33 | 8 dependency tiers (0-7), event-triggered and scheduled |
| Connectors | 6 | SMTP, Twilio SMS, Discord, Slack, Gmail, Reddit |
| Events | 85+ | 14 event topics, at-least-once delivery |
| Notifications | 30+ | 5 channels, 3-tier fallback chains |

### Key Metrics

| Metric | Value |
|--------|-------|
| Total Duration | 30 weeks |
| Sprints | 15 (2-week sprints) |
| Peak Team Size | 8 concurrent teams (~15 engineers) |
| Total Engineering Weeks | ~840 |
| Quality Gates | 7 (G0-G6) |
| Milestone Checkpoints | 5 (Alpha → Production) |
| Estimated Budget | ~$523,250 |

---

## 2. Scope & Artifact Inventory

### 2.1 Application Inventory

| Order | Application | Priority | Complexity | Est. Duration | Team |
|:-----:|-------------|:--------:|:----------:|:-------------:|------|
| 1 | support-center_v2 | P0 | 8/10 | 6 weeks | FE Alpha |
| 2 | operations-center_v2 | P0 | 7/10 | 6 weeks | FE Beta |
| 3 | appointment-center_v2 | P0 | 7/10 | 6 weeks | FE Beta |
| 4 | technician-portal_v2 | P1 | 7/10 | 4 weeks | FE Beta |
| 5 | customer-portal_v2 | P1 | 6/10 | 4 weeks | FE Alpha |
| 6 | resolution-center_v2 | P1 | 6/10 | 4 weeks | FE Alpha |
| 7 | crm-center_v2 | P1 | 6/10 | 4 weeks | FE Alpha |
| 8 | notification-center_v2 | P2 | 5/10 | 4 weeks | FE Gamma |
| 9 | analytics-center_v2 | P2 | 5/10 | 4 weeks | FE Gamma |
| 10 | admin-center_v2 | P2 | 6/10 | 3 weeks | FE Gamma |

### 2.2 Function Inventory by Layer

| Layer | Type | Count | Build Order | Dependencies |
|:-----:|------|:-----:|:-----------:|--------------|
| 0 | DET (Deterministic) | 7 | 1 | Foundation tables only |
| 1 | REA (Reader) | 8 | 2 | Migration 2+ tables |
| 2 | WRI (Writer) | 22 | 3 | DET + Migration 2+ |
| 3 | AGG (Aggregator) | 10 | 4 | WRI functions |
| 4 | TRA (Transformer) | 1 | 5 | Notification tables |
| 5 | ORC (Orchestrator) | 5 | 6 | AGG + Connectors |

### 2.3 Agent Inventory by Department

| Department | Executive | Manager | Worker | Total |
|------------|:---------:|:-------:|:------:|:-----:|
| Executive | 2 | — | — | 2 |
| Support | 1 | 1 | 3 | 5 |
| Operations | 1 | 1 | 1 | 3 |
| Dispatch | 1 | 1 | 2 | 4 |
| Scheduling | 1 | 1 | 1 | 3 |
| Appointment | 1 | — | 2 | 3 |
| CRM | 1 | 1 | 2 | 4 |
| Knowledge | 1 | 1 | 1 | 3 |
| Analytics | 1 | 1 | 1 | 3 |
| Admin | 1 | 1 | 1 | 3 |
| QA | 1 | 1 | 1 | 3 |
| Reporting | 1 | 1 | 1 | 3 |
| Notification | 1 | 1 | 1 | 3 |
| CX | 1 | 1 | 2 | 4 |
| Automation | 1 | 1 | 1 | 3 |
| **Total** | **16** | **13** | **20** | **49** |

### 2.4 Workflow Inventory by Tier

| Tier | Type | Count | Dependencies |
|:----:|------|:-----:|--------------|
| 0 | Autonomous | 8 | Functions + Connectors |
| 1 | Entry | 6 | Tier 0 + Core Agents |
| 2-3 | Secondary | 7 | Tier 1 + Domain Agents |
| 4-5 | Execution | 9 | Tier 2-3 + Extended Agents |
| 6-7 | Reporting | 3 | Tier 4-5 + All Functions |

---

## 3. Implementation Philosophy

### 3.1 Core Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| 1 | **Foundation first** | Database, shared packages, CI/CD, and event bus must exist before any component |
| 2 | **Tables before functions** | Every function reads/writes tables; tables are the foundation |
| 3 | **Functions before apps** | Apps call functions; functions must exist before app integration |
| 4 | **Deterministic before orchestrator** | Simple pure functions first, then WRI/AGG, then ORC |
| 5 | **Read-only agents before writing agents** | Agents that only read can ship earlier and more safely |
| 6 | **Autonomous workflows before human-gated** | Fully automated workflows validate the platform before human approval flows |
| 7 | **Core operations before portals** | Internal tools (support, ops, appointment) before external-facing portals |
| 8 | **Analytics reads events** | Analytics consumes events from all domains; it is built last |
| 9 | **Admin is the final app** | Admin configures everything; it must be last |
| 10 | **No V1 modifications** | All V2 work uses `_v2` suffix; V1 remains untouched and running in parallel |

### 3.2 Build Rules

1. **One component at a time per dependency chain** — No function is built before its tables exist; no workflow before its functions and agents
2. **Test immediately after build** — Each component has tests written in the same sprint it is built
3. **No orphan components** — Every function must be called by at least one workflow/agent/app; every table must be read/written by at least one function
4. **Integration test at the end of each sprint** — Before declaring a sprint done, all new components must pass integration tests with real neighbors
5. **Incremental validation** — Each phase produces a deployable increment that can be tested independently

---

## 4. Phase Architecture

### 4.1 Phase Overview

```
PHASE 0: Foundation ──────────────────────────────────── Weeks 1-4
  Repository scaffold, shared packages, all 41 tables,
  event bus, auth system, CI/CD, monitoring

PHASE 1: Core Functions ──────────────────────────────── Weeks 4-12
  All 53 functions (DET → REA → WRI → AGG → TRA → ORC),
  all 6 connectors, permission system

PHASE 2: Core Applications ───────────────────────────── Weeks 9-14
  support-center_v2, operations-center_v2,
  appointment-center_v2, technician-portal_v2

PHASE 3: Specialized Applications ────────────────────── Weeks 13-16
  resolution-center_v2, crm-center_v2, customer-portal_v2

PHASE 4: Cross-Cutting Infrastructure ────────────────── Weeks 15-18
  notification-center_v2, analytics-center_v2, admin-center_v2

PHASE 5: AI Agents ───────────────────────────────────── Weeks 18-24
  Agent infrastructure, all 49 agents by department tier

PHASE 6: Workflows ───────────────────────────────────── Weeks 24-28
  All 33 workflows by dependency tier (0→7)

PHASE 7: Integration & Production ────────────────────── Weeks 28-30
  E2E integration, performance, security, deployment
```

### 4.2 Phase Dependency Flow

```
Phase 0: Foundation
  │
  ├──────────────────────────────────────────────────┐
  ▼                                                    │
Phase 1: Core Functions                                │
  │                                                    │
  ├────────────────────┐                               │
  ▼                      ▼                              │
Phase 2: Core Apps    Phase 5: Agents (infra)          │
  │                      │                              │
  ▼                      │                              │
Phase 3: Specialized    │                              │
  │                      │                              │
  ▼                      ▼                              │
Phase 4: Cross-Cutting → Phase 5: Agents (complete)    │
  │                      │                              │
  │                      ▼                              │
  └──────────────────→ Phase 6: Workflows              │
                          │                              │
                          ▼                              │
                    Phase 7: Integration                │
                          │                              │
                          ▼                              │
                    Production ◄─────────────────────────┘
```

---

## 5. Team Structure & Resource Plan

### 5.1 Team Assignments (100-Engineer Scale)

| Team | Size | Focus | Phase |
|------|:----:|-------|:-----:|
| **Platform** | 8 | Database, CI/CD, shared packages, monitoring, event bus | 0-7 |
| **BE Alpha** | 12 | DET + WRI + AGG functions (Ticket, Appointment, Dispatch, WO, Dispute) | 1-4 |
| **BE Beta** | 12 | Extended WRI + ORC + TRA functions (CRM, CX, Knowledge, Notif, Admin, Inventory) | 1-5 |
| **BE Connector** | 6 | All 6 connectors, connector health framework | 1-5 |
| **FE Alpha** | 12 | support-center_v2, resolution-center_v2, crm-center_v2 | 2-7 |
| **FE Beta** | 12 | operations-center_v2, appointment-center_v2, technician-portal_v2 | 2-7 |
| **FE Gamma** | 10 | customer-portal_v2, notification-center_v2, analytics-center_v2 | 2-7 |
| **FE Delta** | 8 | admin-center_v2, cross-app shell, shared components | 2-7 |
| **Agent Core** | 8 | Executive + Support + Operations + Dispatch + Scheduling + Appointment + CRM | 5-7 |
| **Agent Extended** | 8 | Knowledge + Analytics + Admin + QA + Reporting + Notification + CX + Automation | 5-7 |
| **Workflows** | 10 | All 33 workflows by tier | 6-7 |
| **QA** | 6 | Test automation, E2E, performance, security | 0-7 |
| **Security** | 4 | Security audit, penetration testing, compliance | 3-7 |

### 5.2 Resource Loading by Phase

| Phase | Plat | BE-A | BE-B | BE-C | FE-A | FE-B | FE-G | FE-D | Ag-C | Ag-E | WF | QA | Sec | Total |
|:-----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:--:|:--:|:---:|:-----:|
| 0 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 10 |
| 1 | 6 | 12 | 12 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 40 |
| 2 | 4 | 8 | 4 | 6 | 12 | 12 | 10 | 8 | 0 | 0 | 0 | 6 | 0 | 70 |
| 3 | 4 | 4 | 4 | 2 | 12 | 8 | 10 | 8 | 0 | 0 | 0 | 6 | 4 | 62 |
| 4 | 6 | 0 | 4 | 0 | 4 | 4 | 10 | 8 | 8 | 8 | 0 | 6 | 4 | 62 |
| 5 | 6 | 0 | 4 | 0 | 4 | 4 | 4 | 4 | 8 | 8 | 10 | 6 | 4 | 62 |
| 6 | 8 | 0 | 4 | 0 | 4 | 4 | 4 | 4 | 4 | 4 | 10 | 6 | 4 | 56 |
| 7 | 8 | 4 | 4 | 2 | 4 | 4 | 4 | 4 | 4 | 4 | 10 | 6 | 4 | 62 |

### 5.3 Skill Requirements

| Role | Skills |
|------|--------|
| **Platform** | TypeScript, Python, PostgreSQL, Docker, CI/CD (GitHub Actions), Lemma SDK, event-driven architecture |
| **Backend Alpha** | Python, TypeScript, SQL, REST APIs, event-driven design, idempotency patterns |
| **Backend Beta** | Python, TypeScript, SQL, third-party API integration, circuit breaker patterns |
| **Backend Connector** | SMTP, Twilio SDK, Discord/Slack/Reddit APIs, OAuth, rate limiting |
| **Frontend All** | React 18, TypeScript, Vite 8, Tailwind CSS, Chart.js, Leaflet, react-beautiful-dnd |
| **Agent Core & Extended** | LLM prompting, agent frameworks, Python, context management, RAG patterns |
| **Workflow** | Workflow engines (Lemma), state machines, event-driven orchestration, idempotency |
| **QA** | Playwright/Cypress, vitest, Lighthouse, k6/artillery, DAST/SAST tools |
| **Security** | OWASP, penetration testing, auth/RBAC audit, compliance (GDPR, SOC2) |

---

## 6. Dependency Management Strategy

### 6.1 Dependency Types

| Type | Symbol | Description | Example |
|------|--------|-------------|---------|
| **Data** | D | App reads/writes the same table | appointment reads customers |
| **Event** | E | App emits/consumes events from another | support emits ticket.* → crm consumes |
| **Config** | C | App depends on configuration managed by another | All apps depend on admin for user roles |
| **Infrastructure** | I | App depends on shared infrastructure | All apps depend on shared packages |
| **UI** | U | App embeds UI from another | Dashboard embeds widget from crm |
| **Workflow** | W | App triggers or is triggered by a workflow | customer-portal triggers ticket-intake |
| **Agent** | A | App invokes or is invoked by an agent | support invokes request-classifier |
| **Function** | F | App calls or is called by a function | crm calls account-health-scan |

### 6.2 Global Dependency Map

```
ALL APPS ──► Shared Packages (I)
ALL APPS ──► Event Bus (I)
ALL APPS ──► Auth System (I)
ALL APPS ──► Admin Center (C)

support-center_v2 ──E──► customer-portal_v2
support-center_v2 ──E──► operations-center_v2
support-center_v2 ──E──► crm-center_v2

operations-center_v2 ──E──► technician-portal_v2

appointment-center_v2 ──E──► technician-portal_v2
appointment-center_v2 ──E──► resolution-center_v2
appointment-center_v2 ──E──► crm-center_v2
appointment-center_v2 ──E──► customer-portal_v2

resolution-center_v2 ──E──► crm-center_v2
resolution-center_v2 ──E──► customer-portal_v2

crm-center_v2 ──E──► operations-center_v2
crm-center_v2 ──E──► customer-portal_v2

ALL APPS ──E──► notification-center_v2
ALL APPS ──E──► analytics-center_v2
notification-center_v2 ──E──► admin-center_v2
```

### 6.3 Dependency Resolution Rules

| Situation | Rule |
|-----------|------|
| Build-time dependency | Component must be built first OR mocked via interface contract |
| Runtime data dependency | Table must be migrated first; if unavailable, read-optimistic fallback |
| Runtime event dependency | Event producer must exist; consumer degrades gracefully if unavailable |
| Soft dependency | App functions in degraded mode; feature-flag gated |
| Circular dependency (detected) | Break via event → separate event producer from consumer in different tiers |
| Missing provider | Component uses mock/stub in dev; integration test verifies with real provider |

---

## 7. Parallel Execution Strategy

### 7.1 Parallel Tracks

```
TRACK A (Platform/BE Critical Path):
  Foundation → Functions → Agent Infra → Agents → Workflows → Integration

TRACK B (FE Alpha — Support/Resolution/CRM):
  Idle → support-center_v2 → resolution-center_v2 → crm-center_v2

TRACK C (FE Beta — Operations/Appointment/Technician):
  Idle → operations-center_v2 + appointment-center_v2 → technician-portal_v2

TRACK D (FE Gamma — Customer Portal):
  Idle → customer-portal_v2

TRACK E (FE Delta — Notification/Analytics/Admin):
  Idle → notification-center_v2 → analytics-center_v2 → admin-center_v2

TRACK F (Agent Team):
  Idle → Agent Infrastructure → Core Agents → Extended Agents

TRACK G (Workflow Team):
  Idle → Tier 0-1 Workflows → Tier 2-7 Workflows
```

### 7.2 Parallelizable Component Groups

| Group | Components | Parallel With | Earliest Start |
|-------|-----------|---------------|:--------------:|
| A | support-center + resolution-center | operations-center + appointment-center | Week 5 |
| B | CRM center + Customer portal | Notification center + Analytics center | Week 11 |
| C | Executive agents + Support agents | Scheduling agents + Appointment agents | Week 17 |
| D | CRM agents + Dispatch agents | Knowledge agents + CX agents | Week 19 |
| E | Tier 0-1 workflows | Tier 2-3 workflows | Week 21 |
| F | Tier 4-5 workflows | Tier 6-7 workflows | Week 24 |

### 7.3 Maximum Parallelism

```
Week 1-4:    1 track active (Platform) — 10 engineers
Week 4-9:    2 tracks active (Platform + BE) — 40-50 engineers
Week 9-14:   6 tracks active (Platform + BE×2 + FE×3) — 70 engineers
Week 14-18:  8 tracks active (All BE + All FE + Agent infra) — 62-70 engineers
Week 18-24:  8 tracks active (All FE + Agents + Workflows) — 62 engineers
Week 24-30:  7 tracks active (Integration surge) — 56-62 engineers
```

---

## 8. Critical Path

### 8.1 Critical Path Sequence

The critical path is the longest chain of dependent work items. Any delay directly extends the project.

```
Week  1-2:  Repository scaffold + Shared packages
Week  1-2:  Migration 0-1 (Foundation + Identity tables)
Week  3-4:  Migration 2-4 (Core + Operational + Detail tables)
Week  3-4:  Event bus + Auth system
Week  4-6:  DET + READER functions (15 functions)
Week  5-8:  WRI functions — Core + Extended (22 functions)
Week  7-10: AGG functions (10 functions)
Week  9-11: ORC + TRA functions (6 functions)
Week 10-12: Connectors (6 connectors)
Week 12-14: Core Apps (support, ops, appointment, technician)
Week 14-16: Specialized Apps (resolution, CRM, customer)
Week 16-18: Cross-Cutting Apps (notification, analytics, admin)
Week 18-20: Agent infrastructure
Week 20-24: All 49 agents
Week 24-28: All 33 workflows
Week 28-30: E2E Integration + Production deployment

Total critical path: 30 weeks
```

### 8.2 Critical Path Items

| Item | Duration | Depends On | Blocks |
|------|:--------:|------------|--------|
| Shared packages | 2 weeks | Nothing | Everything |
| Migration 0-1 | 2 weeks | Shared packages | Migration 2-6 |
| Migration 2-4 | 2 weeks | Migration 0-1 | All functions |
| Event bus | 1 week | Migration 1 | Functions emitting events |
| Auth system | 1 week | Migration 1 | All apps |
| DET functions | 2 weeks | Migration 0 | WRI functions |
| WRI functions | 4 weeks | DET + Migration 2-4 | AGG functions |
| AGG functions | 3 weeks | WRI functions | ORC functions |
| ORC functions | 2 weeks | AGG + Connectors | Agent infrastructure |
| Agent infrastructure | 2 weeks | ORC functions | All agents |
| All 49 agents | 4 weeks | Agent infrastructure | Workflows |
| All 33 workflows | 4 weeks | All agents + All functions | Production |
| E2E integration | 2 weeks | All workflows | Production deploy |

### 8.3 Critical Path Slack Analysis

| Non-Critical Path | Slack | Teams |
|-------------------|:-----:|-------|
| support → customer → crm → notif → admin | **Critical** | FE Alpha → Delta |
| ops → tech → crm → notif → admin | +2 weeks | FE Beta |
| appt → tech → resolution → crm → notif → admin | +2 weeks | FE Beta → FE Gamma |
| analytics (parallel with notif) | +0 weeks | FE Gamma |
| Connectors | +2 weeks | BE Connector |

---

## 9. Risk & Contingency

### 9.1 Risk Register

| ID | Risk | Probability | Impact | Score | Mitigation | Owner |
|----|------|:-----------:|:------:|:-----:|------------|-------|
| R1 | V1 migration incompatible with V2 schema | Medium | High | 9 | Verify migration scripts against existing V1 data before V2 functions run; rollback V2 migrations; fix mapping | BE Lead |
| R2 | Agent hallucination in production | Medium | Medium | 8 | All agent outputs require human approval in Phase 2-3; graduated autonomy in Phase 6; add confidence thresholds | Agent Lead |
| R3 | Event bus throughput insufficient for 85+ events | Low | High | 6 | Load test event bus in Phase 0; horizontal scaling built-in; increase partition count | Platform Lead |
| R4 | Connector provider API changes | Low | Medium | 4 | Connector abstraction layer; circuit breaker; fallback channels; update connector config | BE Connector Lead |
| R5 | Workflow execution timeout for complex cross-domain flows | Medium | Medium | 8 | Hard 5s timeout per function node; workflow state checkpointing; increase timeout if needed | Workflow Lead |
| R6 | Idempotency store becomes bottleneck | Low | High | 6 | TTL-based expiry; in-memory cache with DB persistence; increase TTL; scale horizontally | Platform Lead |
| R7 | Frontend app shell inconsistent across 10 apps | Medium | Medium | 8 | Shared ui_v2 package; design system; component library; chromatic/visual regression testing | FE Lead |
| R8 | Agent memory requirements exceed context window | Medium | High | 9 | Tiered memory (short/medium/long-term); summarization strategies; RAG for long-term memory | Agent Lead |
| R9 | LLM API cost overrun | Medium | High | 9 | Token budgets per session; caching layer; fallback to rule-based; negotiate volume pricing | Agent Lead |
| R10 | Key engineer departure during critical phase | Low | High | 6 | Cross-training every sprint; documentation mandates; 2-week knowledge transfer | CTO |
| R11 | Data migration from V1 produces inconsistent state | Medium | High | 9 | Dual-write during cutover; reconciliation job pre-flight; rollback procedure tested | BE Lead |
| R12 | Scope creep from new feature requests | Medium | Low | 4 | Strict Phase 2.0 scope freeze; change request process; all new features deferred to V2.1 | CTO |

### 9.2 Contingency Plan

| Scenario | Response | Owner |
|----------|----------|-------|
| Any gate No-Go | 1-week remediation sprint; max 2 consecutive No-Go per gate | CTO |
| Agent hallucination >5% | Increase human review; reduce agent autonomy tier | Agent Lead |
| Event bus throughput failure | Scale partitions; batch non-critical events | Platform Lead |
| Function latency > SLA | Profile and optimize; parallelize AGG functions | BE Lead |
| Frontend timeline slip | Reduce scope per app; defer non-critical views to V2.1 | FE Lead |
| Security finding > critical | Halt deployment; remediate before next gate | Security Lead |

---

## 10. Governance Model

### 10.1 Daily Operations

| Ceremony | Frequency | Participants | Duration |
|----------|-----------|--------------|:--------:|
| Standup | Daily | Track teams | 15 min |
| Track Sync | Daily | Track leads | 15 min |
| Integration Sync | Daily (during Phase 7) | All leads | 30 min |
| Sprint Planning | Sprint start (biweekly) | All teams | 2 hours |
| Sprint Review | Sprint end (biweekly) | All teams + stakeholders | 1 hour |
| Sprint Retrospective | Sprint end (biweekly) | Per team | 1 hour |

### 10.2 Gate Reviews

| Gate | Timing | Authority | Participants |
|:----:|:------:|-----------|-------------|
| G0 — Foundation | End Sprint 2 (W4) | CTO + Architecture Board | All leads |
| G1 — Functions | End Sprint 6 (W12) | VP Engineering + CTO | BE leads, FE leads |
| G2 — Apps | End Sprint 9 (W18) | VP Product + CTO | FE leads, BE leads |
| G3 — Agents | End Sprint 11 (W22) | VP Engineering + CTO | Agent leads, Security |
| G4 — Workflows | End Sprint 14 (W28) | VP Engineering + CTO | Workflow lead, Agent lead |
| G5 — Integration | End Sprint 15 (W30) | CTO | All leads, QA |
| G6 — Production | Post-Sprint 15 (W32) | CEO + CTO + VP Eng | All leads, Security, QA |

### 10.3 Decision Authority Matrix

| Decision Type | Authority | Escalation |
|---------------|-----------|------------|
| Sprint scope changes | Track Lead | CTO if >3 day impact |
| Cross-track dependency changes | CTO | — |
| Gate go/no-go | CTO | CEO if conditional |
| Architecture changes (Phase 1.x frozen) | CTO + Architecture Board | CEO |
| Production release | CTO + VP Eng + CEO | — |
| Budget changes >10% | CEO | Board |
| V1 decommission | CTO + CEO | Board |

---

## 11. Appendix: Artifact Catalog

### 11.1 Table Ownership

| Table | Owned By | Migration | Rows Est. |
|-------|----------|:---------:|:---------:|
| reference_data_v2 | Platform | 0 | 500 |
| system_settings_v2 | admin-center_v2 | 0 | 200 |
| feature_flags_v2 | admin-center_v2 | 0 | 50 |
| knowledge_categories_v2 | Knowledge Agents | 0 | 50 |
| user_roles_v2 | admin-center_v2 | 0 | 15 |
| connectors_v2 | admin-center_v2 | 0 | 10 |
| users_v2 | admin-center_v2 | 1 | 500 |
| user_sessions_v2 | admin-center_v2 | 1 | 2,000 |
| customers_v2 | crm-center_v2 | 2 | 10,000 |
| customer_addresses_v2 | crm-center_v2 | 2 | 12,000 |
| technicians_v2 | operations-center_v2 | 2 | 200 |
| technician_skills_v2 | appointment-center_v2 | 2 | 600 |
| knowledge_articles_v2 | Knowledge Agents | 2 | 5,000 |
| accounts_v2 | crm-center_v2 | 3 | 8,000 |
| tickets_v2 | support-center_v2 | 3 | 50,000 |
| appointments_v2 | appointment-center_v2 | 3 | 30,000 |
| inventory_items_v2 | operations-center_v2 | 3 | 500 |
| ticket_messages_v2 | support-center_v2 | 4 | 200,000 |
| ticket_attachments_v2 | support-center_v2 | 4 | 50,000 |
| account_health_scans_v2 | crm-center_v2 | 4 | 80,000 |
| followups_v2 | crm-center_v2 | 4 | 15,000 |
| followup_attempts_v2 | crm-center_v2 | 4 | 30,000 |
| appointment_reminders_v2 | appointment-center_v2 | 4 | 90,000 |
| work_orders_v2 | operations-center_v2 | 4 | 30,000 |
| work_order_stages_v2 | operations-center_v2 | 4 | 120,000 |
| disputes_v2 | resolution-center_v2 | 4 | 3,000 |
| dispute_evidence_v2 | resolution-center_v2 | 4 | 6,000 |
| notification_templates_v2 | notification-center_v2 | 5 | 100 |
| notification_channels_v2 | notification-center_v2 | 5 | 10 |
| notifications_v2 | notification-center_v2 | 5 | 500,000 |
| feedback_v2 | crm-center_v2 | 6 | 20,000 |
| feedback_surveys_v2 | crm-center_v2 | 6 | 50 |
| tasks_v2 | operations-center_v2 | 6 | 10,000 |
| tasks_assignments_v2 | operations-center_v2 | 6 | 15,000 |
| events_v2 | Platform | 6 | 5,000,000 |
| audit_log_v2 | admin-center_v2 | 6 | 1,000,000 |
| analytics_reports_v2 | analytics-center_v2 | 6 | 500 |
| analytics_schedules_v2 | analytics-center_v2 | 6 | 100 |
| operations_log | operations-center_v2 | 6 | 500,000 |
| dispatches_v2 | operations-center_v2 | 6 | 30,000 |

### 11.2 Event Catalog Summary

| Event Topic | Producer | Consumers |
|-------------|----------|-----------|
| ticket.* | support-center_v2 | ops-center, crm-center, customer-portal, notif-center, analytics |
| appointment.* | appointment-center_v2 | tech-portal, resolution-center, crm-center, customer-portal, notif-center, analytics |
| dispute.* | resolution-center_v2 | crm-center, customer-portal, notif-center, analytics |
| dispatch.* | operations-center_v2 | tech-portal, notif-center, analytics |
| task.* | operations-center_v2 | tech-portal, notif-center, analytics |
| account.* | crm-center_v2 | ops-center, customer-portal, notif-center, analytics |
| followup.* | crm-center_v2 | ops-center, notif-center, analytics |
| user.* | admin-center_v2 | notif-center, analytics |
| system.* | admin-center_v2 | all apps |
| notification.* | notification-center_v2 | admin-center, analytics |
| report.* | analytics-center_v2 | notif-center |

### 11.3 Connector Catalog

| Connector | Type | Channels | Auth | Rate Limit |
|-----------|------|----------|------|:----------:|
| SMTP | Outbound | Email | API Key | 100/hr |
| Twilio SMS | Outbound | SMS | API Key | 50/hr |
| Discord Webhook | Outbound | Webhook | URL Token | 30/min |
| Slack | Bidirectional | Webhook/API | OAuth | 100/min |
| Gmail | Outbound | OAuth | OAuth 2.0 | 50/hr |
| Reddit | Outbound | API | OAuth | 60/min |

---

> **End of MASTER_IMPLEMENTATION_PLAN.md**
