# RESQAI V2 — Master Build Blueprint

> Phase 2.0 — Implementation Planning Only  
> Chief Technical Program Manager  
> Date: 2026-06-29

---

## Table of Contents

1. [Strategic Overview](#1-strategic-overview)
2. [Component Inventory](#2-component-inventory)
3. [Build Philosophy](#3-build-philosophy)
4. [High-Level Phase Map](#4-high-level-phase-map)
5. [Resource Plan](#5-resource-plan)
6. [Dependency Architecture](#6-dependency-architecture)
7. [Parallelization Strategy](#7-parallelization-strategy)
8. [Risk Management](#8-risk-management)
9. [Rollback Strategy](#9-rollback-strategy)

---

## 1. Strategic Overview

### 1.1 Purpose

This document is the single source of truth for implementing ResQAI V2. Every architectural decision has been frozen in Phase 1.x. This plan defines the exact order, team structure, quality gates, and timeline to ship V2 with zero duplicated work, zero dependency conflicts, and zero unnecessary rewrites.

### 1.2 Scope

| Dimension | Count | Detail |
|-----------|:-----:|--------|
| Database tables | 41 | 15 business domains, 6 migration tiers |
| Functions | 53 | 6 types across 17 domains |
| Agents | 49 | 16 departments, 3 tiers (Executive/Manager/Worker) |
| Workflows | 33 | 8 dependency tiers (0-7) |
| Applications | 10 | 8 internal + 2 customer-facing |
| Events | 85+ | 14 event topics |
| Connectors | 6 | SMTP, Twilio SMS, Discord, Slack, Gmail, Reddit |
| Notifications | 30+ | 5 channels, 3-tier fallback chains |

### 1.3 Total Estimated Effort

| Metric | Estimate |
|--------|:--------:|
| Total build time | 30 weeks (~7.5 months) |
| Peak team size | 8 engineers (4 frontend, 3 backend, 1 platform) |
| Total engineering-weeks | 840 |
| Total sprints | 15 (2 weeks each) |
| Checkpoints | 5 (Alpha, Beta, Gamma, Delta, Production) |

---

## 2. Component Inventory

### 2.1 Build Units by Category

```
DATABASE (41 tables)         FUNCTIONS (53)              AGENTS (49)
───────────────────────      ────────────────────        ───────────────────────
audit_log_v2                 validate-ticket-input       executive-director
events_v2                    check-ticket-urgency        platform-orchestrator
customers_v2                 update-ticket-record        support-manager
technicians_v2               classify-ticket-sla-tier    request-classifier
tickets_v2                   check-sla-deadline          reply-drafter
appointments_v2              batch-sla-check             escalation-manager
dispatches_v2                collect-resolved-tickets    sla-monitor
work_orders_v2               assign-appt-technician      operations-manager
disputes_v2                  fetch-upcoming-appts        operations-coordinator
accounts_v2                  schedule-appt-reminders     work-order-manager
followups_v2                 check-reminder-window       crm-manager
feedback_v2                  finalize-dispatch           account-health-monitor
notifications_v2             calculate-dispatch-priority followup-manager
users_v2                     create-work-order           retention-specialist
... 27 more                  update-work-order-stage     dispatch-manager
                             complete-work-order         dispatch-coordinator
                             resolve-dispute             technician-dispatcher
                             account-health-scan         emergency-response
                             update-account-health       scheduling-manager
                             flag-slipping-followups     appointment-scheduler
                             create-followup-tasks       technician-suggester
                             finalize-slippage-review    appointment-manager
                             generate-account-score      reminder-coordinator
                             process-feedback-survey     no-show-handler
                             analyze-feedback-sentiment  knowledge-manager
                             extract-knowledge-gap       knowledge-curator
                             search-knowledge-articles   article-suggester
                             suggest-knowledge-article   analytics-manager
                             render-notification-template trend-analyzer
                             dispatch-notifications      predictive-modeler
                             process-notification-delivery admin-manager
                             create-operations-tasks     system-config
                             generate-standup-report     connector-manager
                             generate-report-data        qa-manager
                             send-report                 response-quality-monitor
                             sync-events-analytics       compliance-monitor
                             calculate-metric-trend      reporting-manager
                             batch-metric-aggregation    report-generator
                             provision-user              report-distributor
                             deactivate-user             notification-manager
                             validate-config-change      channel-optimizer
                             apply-config-change         template-manager
                             log-audit-event             cx-manager
                             check-inventory-level       satisfaction-survey
                             reorder-inventory           feedback-analyzer
                             record-inventory-transaction winback-specialist
                             validate-permissions        automation-manager
                             generate-api-token          workflow-orchestrator
                             rotate-credentials          event-router
                             verify-workflow-health
                             recover-workflow-instance
                             reset-circuit-breaker
                             evaluate-quality-score
                             flag-quality-violation

APPLICATIONS (10)            WORKFLOWS (33)              CONNECTORS (6)
───────────────────────      ────────────────────        ───────────────────────
customer-portal_v2           ticket-auto-response        SMTP
support-center_v2            ticket-intake               Twilio SMS
operations-center_v2         ticket-escalation           Discord Webhook
appointment-center_v2        sla-enforcement             Slack
technician-portal_v2         appointment-booking         Gmail
resolution-center_v2         appointment-reminders       Reddit
crm-center_v2                appointment-completion
notification-center_v2       standard-dispatch
analytics-center_v2          urgent-dispatch
admin-center_v2              work-order-fulfillment
                             work-order-verification
                             dispute-resolution
                             dispute-escalation
                             account-health-scan
                             followup-management
                             followup-slippage-detector
                             retention-campaign
                             customer-satisfaction-monitor
                             feedback-analysis
                             knowledge-article-lifecycle
                             knowledge-gap-detection
                             notification-delivery
                             daily-standup
                             operations-coordination
                             report-generation
                             report-distribution
                             trend-analysis
                             anomaly-detection
                             quality-review
                             user-provisioning
                             system-config-management
                             inventory-reorder
                             workflow-health-monitor
```

---

## 3. Build Philosophy

| # | Principle | Rationale |
|---|-----------|-----------|
| 1 | **Foundation first** | Database, shared packages, CI/CD, and event bus must exist before any component |
| 2 | **Tables before functions** | Every function reads/writes tables; tables are the foundation |
| 3 | **Functions before apps** | Apps call functions; functions must exist before app integration |
| 4 | **Deterministic before orchestrator** | Simple pure functions first, then WRITER/AGGREGATOR, then ORCHESTRATOR |
| 5 | **Read-only agents before writing agents** | Agents that only read can ship earlier |
| 6 | **Autonomous workflows before human-gated** | Fully automated workflows validate the platform before human approval flows |
| 7 | **Core operations before portals** | Internal tools (support, ops, appointment) before external-facing portals |
| 8 | **Notification delivery last** | Every workflow depends on dispatch-notifications; it ships when at least one producing workflow is ready |
| 9 | **Analytics reads events** | Analytics consumes events from all domains; it is built last |
| 10 | **Admin is the final app** | Admin configures everything; it must be last |

---

## 4. High-Level Phase Map

```
PHASE 0: Foundation ───────────────────────────────────────────── 4 weeks
  Repository, CI/CD, shared packages, all V2 tables, event bus,
  auth, monitoring

PHASE 1: Core Functions ───────────────────────────────────────── 6 weeks
  All 53 functions grouped by domain tier; connectors;
  permission system

PHASE 2: Core Applications ────────────────────────────────────── 6 weeks
  support-center_v2, operations-center_v2, appointment-center_v2,
  technician-portal_v2

PHASE 3: Specialized Applications ─────────────────────────────── 4 weeks
  resolution-center_v2, crm-center_v2, customer-portal_v2

PHASE 4: Cross-Cutting Infrastructure ─────────────────────────── 4 weeks
  notification-center_v2, analytics-center_v2, admin-center_v2

PHASE 5: AI Agents ────────────────────────────────────────────── 4 weeks
  All 49 agents grouped by department tier

PHASE 6: Workflows ────────────────────────────────────────────── 6 weeks
  All 33 workflows by dependency tier 0→7

PHASE 7: Integration & Production ─────────────────────────────── 2 weeks
  E2E integration, performance testing, production deployment

TOTAL: 36 weeks (9 months) — parallel tracks reduce wall-clock to 30 weeks
```

### Phase Dependency Flow

```
Phase 0: Foundation
  │
  ▼
Phase 1: Core Functions ────────────────────────────────────────
  │                                                              │
  ▼                                                              ▼
Phase 2: Core Apps                                          Phase 5: Agents (start)
  │                                                              │
  ▼                                                              │
Phase 3: Specialized Apps                                        │
  │                                                              │
  ▼                                                              │
Phase 4: Cross-Cutting Apps  ◄───────────────────────────────────┤
  │                                                              │
  ▼                                                              ▼
Phase 5: Agents (complete) ──────────────────► Phase 6: Workflows
                                                      │
                                                      ▼
                                              Phase 7: Integration
```

---

## 5. Resource Plan

### 5.1 Team Structure

| Team | Size | Focus | Phase Start |
|------|:----:|-------|:-----------:|
| **Platform** (1 BE, 1 Infra) | 2 | Database, CI/CD, shared packages, monitoring | Phase 0 |
| **Backend Alpha** (2 BE) | 2 | Functions (Ticket, Appointment, Dispatch, Work Order, Dispute) | Phase 1 |
| **Backend Beta** (2 BE) | 2 | Functions (CRM, CX, Knowledge, Notification, Operations, Reporting, Analytics, Admin, Inventory, Security, Automation, Quality) | Phase 1 |
| **Frontend Alpha** (2 FE) | 2 | support-center_v2, resolution-center_v2, crm-center_v2 | Phase 2 |
| **Frontend Beta** (2 FE) | 2 | operations-center_v2, appointment-center_v2, technician-portal_v2, customer-portal_v2 | Phase 2 |
| **Frontend Gamma** (2 FE) | 2 | notification-center_v2, analytics-center_v2, admin-center_v2 | Phase 4 |
| **Agent Team** (2 BE) | 2 | All 49 agents | Phase 5 |
| **Workflow Team** (2 BE) | 2 | All 33 workflows | Phase 6 |

### 5.2 Resource Loading by Phase

| Phase | Platform | BE Alpha | BE Beta | FE Alpha | FE Beta | FE Gamma | Agent | Workflow | Total |
|:-----:|:--------:|:--------:|:-------:|:--------:|:-------:|:--------:|:-----:|:--------:|:-----:|
| 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| 1 | 1 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 5 |
| 2 | 0 | 1 | 0 | 2 | 2 | 0 | 0 | 0 | 5 |
| 3 | 0 | 0 | 1 | 2 | 0 | 0 | 1 | 0 | 4 |
| 4 | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 3 |
| 5 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 2 |
| 6 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 2 | 3 |
| 7 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 8 |

### 5.3 Skills Required

| Role | Skills |
|------|--------|
| **Platform Engineer** | TypeScript, Python, PostgreSQL, Docker, CI/CD (GitHub Actions), Lemma SDK |
| **Backend Engineer** | Python, TypeScript, SQL, event-driven architecture, REST APIs |
| **Frontend Engineer** | React, TypeScript, Vite, Tailwind CSS, Chart.js, real-time subscriptions |
| **Agent Engineer** | LLM prompting, agent frameworks, Python, event routing |
| **Workflow Engineer** | Workflow engines (Lemma), state machines, event-driven orchestration |

---

## 6. Dependency Architecture

### 6.1 Component Build Dependency Network

```
BUILD ORDER (top-to-bottom)
══════════════════════════════════════════════════════════════════════

FOUNDATION (Phase 0)
├── Repository scaffold & CI/CD
├── Shared packages (types, utils, ui, sdk, hooks)
├── Migration 0: Foundation tables (6)
├── Migration 1: Identity tables (2)
├── Migration 2: Core business tables (5)
├── Event bus infrastructure
├── Auth system
└── Monitoring & logging

TABLES (Phase 0, cont.)
├── Migration 3: Operational tables (6)
├── Migration 4: Detail tables (6)
├── Migration 5: Notification tables (3)
├── Migration 6: Admin & analytics tables (13)
└── Total: 41 tables across 6 migration tiers

FUNCTIONS (Phase 1)
├── Tier 0: Deterministic/Reader (12)
│   ├── validate-ticket-input
│   ├── check-ticket-urgency
│   ├── classify-ticket-sla-tier
│   ├── check-sla-deadline
│   ├── collect-resolved-tickets
│   ├── fetch-upcoming-appointments
│   ├── check-reminder-window
│   ├── calculate-dispatch-priority
│   ├── calculate-metric-trend
│   ├── search-knowledge-articles
│   ├── validate-config-change
│   └── validate-permissions
│
├── Tier 1: Writers (22)
│   ├── update-ticket-record
│   ├── assign-appointment-technician
│   ├── schedule-appointment-reminders
│   ├── finalize-dispatch
│   ├── create-work-order
│   ├── update-work-order-stage
│   ├── complete-work-order
│   ├── resolve-dispute
│   ├── update-account-health-status
│   ├── create-followup-tasks
│   ├── finalize-slippage-review
│   ├── process-feedback-survey
│   ├── process-notification-delivery
│   ├── create-operations-tasks
│   ├── deactivate-user
│   ├── apply-config-change
│   ├── log-audit-event
│   ├── reorder-inventory
│   ├── record-inventory-transaction
│   ├── generate-api-token
│   ├── reset-circuit-breaker
│   └── flag-quality-violation
│
├── Tier 2: Aggregators (10)
│   ├── batch-sla-check
│   ├── account-health-scan
│   ├── generate-account-score
│   ├── analyze-feedback-sentiment
│   ├── generate-standup-report
│   ├── generate-report-data
│   ├── sync-events-analytics
│   ├── batch-metric-aggregation
│   ├── evaluate-quality-score
│   └── suggest-knowledge-article
│
├── Tier 3: Orchestrators + Transformer (9)
│   ├── render-notification-template (TRANSFORMER)
│   ├── dispatch-notifications (ORCHESTRATOR)
│   ├── send-report (ORCHESTRATOR)
│   ├── provision-user (ORCHESTRATOR)
│   ├── rotate-credentials (ORCHESTRATOR)
│   ├── recover-workflow-instance (ORCHESTRATOR)
│   ├── verify-workflow-health (READER)
│   ├── extract-knowledge-gap (READER)
│   └── flag-slipping-followups (READER)

CONNECTORS (Phase 1, with Orchestrator functions)
├── SMTP
├── Twilio SMS
├── Discord Webhook
├── Slack
├── Gmail
└── Reddit

APPLICATIONS (Phases 2-4)
├── Core: support-center_v2, operations-center_v2, appointment-center_v2
├── Portals: technician-portal_v2, customer-portal_v2
├── Specialized: resolution-center_v2, crm-center_v2
├── Cross-cutting: notification-center_v2, analytics-center_v2
└── Admin: admin-center_v2

AGENTS (Phase 5)
├── Executive (2): executive-director, platform-orchestrator
├── Support (5): manager, classifier, drafter, escalation-manager, sla-monitor
├── Operations (3): manager, coordinator, work-order-manager
├── CRM (4): manager, account-health-monitor, followup-manager, retention-specialist
├── Dispatch (4): manager, coordinator, technician-dispatcher, emergency-response
├── Scheduling (3): manager, appointment-scheduler, technician-suggester
├── Appointment (3): manager, reminder-coordinator, no-show-handler
├── Knowledge (3): manager, curator, article-suggester
├── Analytics (3): manager, trend-analyzer, predictive-modeler
├── Admin (3): manager, system-config, connector-manager
├── QA (3): manager, response-quality-monitor, compliance-monitor
├── Reporting (3): manager, generator, distributor
├── Notification (3): manager, channel-optimizer, template-manager
├── CX (4): manager, satisfaction-survey, feedback-analyzer, winback-specialist
├── Automation (3): manager, workflow-orchestrator, event-router
└── Total: 49 agents

WORKFLOWS (Phase 6)
├── Tier 0 (Autonomous): 8 workflows
├── Tier 1 (Entry): 6 workflows
├── Tier 2-3 (Secondary): 7 workflows
├── Tier 4-5 (Execution): 9 workflows
└── Tier 6-7 (Reporting): 3 workflows
```

### 6.2 Critical Path

The longest dependency chain determining minimum build time:

```
Foundation (4w)
  → Tables all tiers (2w, parallel with foundation)
  → Tier 0-2 Functions (4w)
  → Core Apps (4w)
  → Specialized Apps (3w)
  → Cross-Cutting Apps (3w)
  → Agents (4w)
  → Workflows (5w)
  → Integration (2w)
  = 31 weeks total via critical path
```

Parallelizable work (not on critical path):
- Connectors (parallel with Tier 3 functions)
- Connector health infrastructure (parallel with apps)
- Agent infrastructure (parallel with Phase 2-4 apps)
- Analytics pipeline (parallel with Phase 6 workflows)

---

## 7. Parallelization Strategy

### 7.1 Parallel Work Streams

```
Week:  1 2 3 4  5 6 7 8  9 10 11 12  13 14 15 16  17 18 19 20  21 22 23 24  25 26 27 28  29 30
      ┌───────┐ └──────┐ └───────┐   └────────┐   └────────┐   └────────┐   └────────┐   ┌──────┐
      │PHASE 0│ │PHASE 1│ │PHASE 2│   │PHASE 3 │   │PHASE 4 │   │PHASE 5 │   │PHASE 6 │   │PHASE7│
      │Foundn │ │Functns│ │Core   │   │Spec    │   │X-Cutting│   │Agents  │   │Workflows│   │Integ │
      └───────┘ │  Apps │ │Apps   │   │Apps    │   │Apps    │   │        │   │        │   └──────┘
                 └───────┘ └───────┘   └────────┘   └────────┘   └────────┘   └────────┘

TRACK A (Platform/BE): Foundation → Functions → Agent infra → Agents → Workflows → Integration
TRACK B (FE Alpha):    ──────    ────────    Core Apps      Spec Apps    ──────    ──────     Integration
TRACK C (FE Beta):     ──────    ────────    Portals        ──────       X-Cutting  ──────     Integration
TRACK D (Agent/BE):    ──────    ────────    ──────         Agent Infra  Agents    Workflows   Integration
```

### 7.2 Parallelizable Component Groups

| Group | Components | Can Build In Parallel With | Earliest Start |
|-------|-----------|---------------------------|:--------------:|
| A | Support center + Resolution center | Operations center + Appointment center | Week 5 |
| B | CRM center + Customer portal | Notification center + Analytics center | Week 11 |
| C | Executive agents + Support agents | Scheduling agents + Appointment agents | Week 17 |
| D | CRM agents + Dispatch agents | Knowledge agents + CX agents | Week 19 |
| E | Tier 0-1 workflows | Tier 2-3 workflows | Week 21 |
| F | Tier 4-5 workflows | Tier 6-7 workflows | Week 24 |

---

## 8. Risk Management

### 8.1 Risk Register

| # | Risk | Probability | Impact | Mitigation | Contingency |
|---|------|:-----------:|:------:|------------|-------------|
| R1 | V1 migration incompatible with V2 schema | Medium | High | Verify migration scripts against existing V1 data before V2 functions run | Rollback V2 migrations; fix mapping |
| R2 | Agent hallucination in production | Medium | Medium | All agent outputs require human approval in Phase 2-3; graduated autonomy in Phase 6 | Add confidence thresholds; fallback to human-only |
| R3 | Event bus throughput insufficient for 85+ events | Low | High | Load test event bus in Phase 0; horizontal scaling built-in | Increase partition count; batch non-critical events |
| R4 | Connector provider API changes (Twilio, Discord, etc.) | Low | Medium | Connector abstraction layer; circuit breaker; fallback channels | Update connector config; switch to fallback provider |
| R5 | Workflow execution timeout for complex cross-domain flows | Medium | Medium | Hard 5s timeout per function node; workflow state checkpointing | Increase timeout; refactor long-running workflows |
| R6 | Idempotency store becomes bottleneck | Low | High | TTL-based expiry; in-memory cache with DB persistence | Increase TTL; scale idempotency store horizontally |
| R7 | Frontend app shell inconsistent across 10 apps | Medium | Medium | Shared ui_v2 package; design system; component library | Audit with chromatic/visual regression testing |
| R8 | Agent memory requirements exceed context window | Medium | High | Tiered memory (short/medium/long-term); summarization strategies | Reduce context; implement RAG for long-term memory |

### 8.2 Risk Response Matrix

| Phase | High Priority Risks | Response |
|:-----:|---------------------|----------|
| 0 | R1 (Migration compat) | Validate migration against V1 data dump in Sprint 1 |
| 1 | R3 (Event throughput) | Load test with simulated 85+ event types in Sprint 4 |
| 2 | R7 (UI consistency) | Establish design system in Phase 0; enforce in code review |
| 3 | R5 (Workflow timeout) | Test function node timing in Phase 1; adjust budget if needed |
| 4 | R6 (Idempotency) | Benchmark idempotency store in Phase 0; scale as needed |
| 5 | R2 (Agent hallucination) | V2 agents start with high human oversight; reduce gradually |
| 6 | R4 (Connector API) | Connector abstraction tested in Phase 1; fallbacks verified |
| 7 | R8 (Agent memory) | Verify in Phase 5 agent testing; implement RAG if needed |

---

## 9. Rollback Strategy

### 9.1 Rollback Tiers

| Tier | Scope | Trigger | Action | RTO | RPO |
|:----:|-------|--------|--------|:---:|:---:|
| **Code** | Single function/component | Failed CI/CD gate | Revert commit; redeploy | 15min | N/A |
| **Migration** | V2 table | Data integrity violation | Run DOWN migration | 30min | <5min |
| **App** | Single application | Critical production bug | Rollback to previous app version | 15min | N/A |
| **Feature** | New feature (workflow/agent) | Business logic error | Disable workflow; fallback to V1 process | 5min | N/A |
| **Platform** | Full V2 platform | Catastrophic failure | DNS switch to V1; disable V2 event bus | 5min | <1min |

### 9.2 Rollback Procedures

| Procedure | Steps | Testing |
|-----------|-------|---------|
| **Code rollback** | `git revert <sha>` → push → CI/CD redeploy | Automated test suite re-runs |
| **Migration rollback** | `lemma db rolldown --version=N-1` → verify data integrity | Compare row counts before/after |
| **App rollback** | `lemma app deploy --version=<previous-tag>` | Smoke test app health endpoint |
| **Feature rollback** | Disable workflow in workflow registry; disable agent subscription | Verify events no longer routed to disabled component |
| **Platform rollback** | DNS update → V1 API gateway → V2 event bus drain → V2 apps off | Monitor error rates drop |

### 9.3 V1 ↔ V2 Coexistence

| Strategy | Implementation | Duration |
|----------|---------------|:--------:|
| **Database coexistence** | V2 uses `_v2` suffix on table names; no V1 table modifications | Entire Phase 0-5 |
| **Event routing coexistence** | V2 event bus separate from V1; no cross-talk | Entire Phase 0-6 |
| **Application coexistence** | V2 apps served at `/v2/` subpath; V1 apps unchanged | Entire Phase 2-6 |
| **Full V2 cutover** | DNS switch; V1 apps read-only; migration completion verified | Phase 7 |
| **V1 decommission** | V1 tables dropped after 30-day verification period | Post-Phase 7 |

---

> **End of MASTER_BUILD_BLUEPRINT.md**  
> Next document: SPRINT_PLAN.md
