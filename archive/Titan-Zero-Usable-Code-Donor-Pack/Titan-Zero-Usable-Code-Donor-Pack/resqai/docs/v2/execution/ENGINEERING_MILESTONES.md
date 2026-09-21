# RESQAI V2 — Engineering Milestones

> Phase 3.5 — Execution Plan
> Chief Technical Program Manager
> Date: 2026-06-29

---

## Table of Contents

1. [Milestone Overview](#1-milestone-overview)
2. [Milestone 1: Foundation Complete](#2-milestone-1-foundation-complete)
3. [Milestone 2: Functions + Connectors Complete](#3-milestone-2-functions--connectors-complete)
4. [Milestone 3: All Applications Complete](#4-milestone-3-all-applications-complete)
5. [Milestone 4: Agents Complete](#5-milestone-4-agents-complete)
6. [Milestone 5: Workflows Complete](#6-milestone-5-workflows-complete)
7. [Milestone 6: Integration Complete](#7-milestone-6-integration-complete)
8. [Milestone 7: Production Ready](#8-milestone-7-production-ready)
9. [Milestone Dashboard](#9-milestone-dashboard)

---

## 1. Milestone Overview

```
Milestone                Week    Gate    Go/No-Go Authority
─────────────            ─────   ────    ────────────────────
M1: Foundation           4       G0      CTO + Architecture Board
M2: Functions + Conn.    12      G1      VP Engineering + CTO
M3: All Apps Complete    18      G2      VP Product + CTO
M4: Agents Complete      22      G3      VP Engineering + CTO
M5: Workflows Complete   28      G4      VP Engineering + CTO
M6: Integration          30      G5      CTO
M7: Production Go-Live   32      G6      CEO + CTO + VP Eng
```

### Decision Rules

- **Go:** All entry criteria met, all tests pass, no known P0/P1 bugs, risk register reviewed
- **No-Go:** Any entry criteria unmet, any P0/P1 bug open, dependencies incomplete, gate review not held
- **Conditional Go:** Minor criteria unmet with approved mitigation plan, tracked to next gate
- Every No-Go triggers a 1-week remediation sprint and re-review
- Max 2 consecutive No-Go per gate

---

## 2. Milestone 1: Foundation Complete

**Target Week:** 4 | **Quality Gate:** G0 | **Owner:** Platform Lead

### Entry Criteria
- [ ] All Phase 3.5 execution planning documents approved by CTO
- [ ] Engineering team staffed (min 10 engineers)
- [ ] Dev environment provisioned (CI/CD, staging, development databases)
- [ ] All Phase 1.x and Phase 2.0 architecture/planning documents frozen
- [ ] V1 coexistence strategy approved
- [ ] Repository initialized with monorepo structure

### Exit Criteria

| # | Criterion | Verification | Owner |
|---|-----------|-------------|-------|
| 1 | Share packages published (types, config, utils, sdk, ui, hooks, forms, layouts) | `npm install` resolves; all packages pass `tsc --noEmit` | Platform Lead |
| 2 | All 6 migration scripts written and tested | `lemma db migrate plan` shows 0 pending | Platform Lead |
| 3 | All 41 tables created in dev database | Migration scripts complete without error; FK constraints verified | Platform Lead |
| 4 | Event bus infra deployed (14 pub/sub channels created) | Integration test: publish → consume → replay for 3 test events | Platform Lead |
| 5 | Auth system deployed (RLS policies per table) | Auth test: all role-based access patterns pass for each table | Platform Lead |
| 6 | CI/CD pipeline green on dev branch | Build, lint, typecheck, test, deploy all pass | Platform Lead |
| 7 | Monitoring pipeline established | Health endpoint returns table status, event bus status, connection pool | Platform Lead |

### Deliverables
- [ ] `packages/types_v2` — TypeScript interfaces
- [ ] `packages/config_v2` — Constants, table names, event names, theme tokens
- [ ] `packages/utils_v2` — Shared utilities (date, validation, SLA calc)
- [ ] `packages/sdk_v2` — Lemma client wrapper
- [ ] `packages/ui_v2` — Design system components (Shell, DataTable, DataCard, SmartForm, StatusBadge)
- [ ] `packages/hooks_v2` — React hooks (useEvents, useTable, useFunction, useAuth)
- [ ] `packages/forms_v2` — Form schemas and validation
- [ ] `packages/layouts_v2` — App shell and page layouts
- [ ] Migration 0-6: All 41 V2 tables with FK, indexes, views, RLS
- [ ] Event bus: 14 pub/sub channel creation
- [ ] Auth: RBAC matrix for 6 roles × 41 tables
- [ ] CI/CD: GitHub Actions workflow

### Testing Requirements
- All packages: unit tests with 90%+ coverage
- All migrations: rollback tested in isolation
- Auth: every table access pattern tested for each role (min 41 tests)
- Event bus: 3 test events published and consumed

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| FK constraint violation during migration | Delay | DEFERRABLE constraints; validate data before migration |
| Lemma SDK version incompatibility | Delay | Lock SDK version; test SDK integration from Sprint 1 |

### Estimated Effort: 4 weeks, 8 platform engineers (320 eng-hours)

---

## 3. Milestone 2: Functions + Connectors Complete

**Target Week:** 12 | **Quality Gate:** G1 | **Owner:** BE Lead

### Entry Criteria
- [ ] Milestone 1: Foundation Complete — PASSED
- [ ] All 41 tables available in staging
- [ ] Event bus operational
- [ ] Auth system operational
- [ ] CI/CD pipeline green

### Exit Criteria

| # | Criterion | Verification | Owner |
|---|-----------|-------------|-------|
| 1 | All 53 functions deployed to staging | `lemma function list` shows all 53 | BE Lead |
| 2 | All DET functions return correct data | Integration test suite passes | BE Alpha Lead |
| 3 | All WRI functions write and verify | Insert → verify by DET reads same data | BE Alpha Lead |
| 4 | All AGG functions produce correct aggregates | Integration test suite passes | BE Beta Lead |
| 5 | All ORC functions trigger expected events | Event log audit passes | BE Beta Lead |
| 6 | TRA function tested with template rendering | Integration test passes | BE Beta Lead |
| 7 | All 6 connectors operational | Connector smoke tests pass | BE Connector Lead |
| 8 | Circuit breaker + rate limit behavior verified | Chaos tests pass (intentional failures) | BE Connector Lead |
| 9 | 90%+ code coverage on functions | Coverage report | BE Lead |
| 10 | All functions have OpenAPI specs | API docs review | BE Lead |
| 11 | V1 ↔ V2 function mapping verified (no gaps) | Comparison matrix review | CTO |

### Deliverables
- [ ] 7 DET functions (validate-ticket-input, check-ticket-urgency, classify-ticket-sla-tier, check-reminder-window, calculate-dispatch-priority, validate-config-change, validate-permissions)
- [ ] 8 READER functions (check-inventory-level, check-sla-deadline, collect-resolved-tickets, fetch-upcoming-appointments, search-knowledge-articles, flag-slipping-followups, extract-knowledge-gap, verify-workflow-health)
- [ ] 22 WRI functions (update-ticket-record, assign-appointment-technician, schedule-appointment-reminders, finalize-dispatch, create-work-order, update-work-order-stage, complete-work-order, resolve-dispute, process-feedback-survey, create-followup-tasks, update-account-health-status, finalize-slippage-review, process-notification-delivery, create-operations-tasks, deactivate-user, apply-config-change, log-audit-event, reorder-inventory, record-inventory-transaction, generate-api-token, reset-circuit-breaker, flag-quality-violation)
- [ ] 10 AGG functions (batch-sla-check, account-health-scan, generate-account-score, analyze-feedback-sentiment, generate-standup-report, generate-report-data, sync-events-analytics, calculate-metric-trend, batch-metric-aggregation, evaluate-quality-score)
- [ ] 1 TRA function (render-notification-template)
- [ ] 5 ORC functions (dispatch-notifications, send-report, provision-user, rotate-credentials, recover-workflow-instance)
- [ ] 6 connectors (SMTP, Twilio SMS, Discord Webhook, Slack, Gmail, Reddit)
- [ ] Function test suite (unit + integration)
- [ ] OpenAPI specs per function
- [ ] V1 ↔ V2 function gap analysis

### Testing Requirements
- Every function: unit test + integration test (3 tests per function = 159 tests)
- WRI functions: insert → verify by DET/REA readback
- ORC functions: event emitted matches expected schema
- Connectors: rate limit hit → circuit breaker opens → resets correctly
- Negative tests: invalid input, unauthorized access, missing dependencies
- Performance: p95 < 500ms (simple), < 2s (complex AGG)

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| AGG function performance with large datasets | Medium | Test with 10K+ rows; add query timeouts; add composite indexes |
| Connector provider API changes | Medium | Connector abstraction layer; circuit breaker; fallback channels |

### Estimated Effort: 8 weeks, 24 backend engineers (1,920 eng-hours)

---

## 4. Milestone 3: All Applications Complete

**Target Week:** 18 | **Quality Gate:** G2 | **Owner:** FE Lead

### Entry Criteria
- [ ] Milestone 2: Functions + Connectors Complete — PASSED
- [ ] All 53 functions deployed and tested
- [ ] All 6 connectors deployed and tested
- [ ] Event bus operational at scale
- [ ] Auth system includes all V2 role definitions
- [ ] Staging environment available for E2E testing

### Exit Criteria

| # | Criterion | Verification | Owner |
|---|-----------|-------------|-------|
| 1 | All 10 V2 apps deployed to staging | App smoke tests pass | FE Lead |
| 2 | Each app renders all major views | Visual regression tests pass | FE Lead |
| 3 | Each app connects to its dependent functions | E2E test: app loads real data | FE Lead |
| 4 | App routing works (auth, navigation, error pages) | Navigation test suite passes | FE Lead |
| 5 | All app forms submit and receive response | Form E2E tests pass | FE Lead |
| 6 | App-to-app navigation works (e.g., support → resolution) | Cross-app navigation tests pass | FE Lead |
| 7 | Responsive design verified (desktop + tablet + mobile) | Responsive test suite passes | FE Lead |
| 8 | Load time < 3s per route (p95) | Performance audit | FE Lead |
| 9 | 80%+ code coverage on frontend | Coverage report | FE Lead |
| 10 | Accessibility audit passes (WCAG 2.1 AA) | a11y audit tool | FE Lead |

### Deliverables
| App | Team | Pages | Features |
|-----|:----:|:-----:|----------|
| support-center_v2 | FE Alpha | 8 | Ticket Queue, Ticket Detail, Message Thread, SLA Dashboard, Classification Panel, Agent Integration |
| operations-center_v2 | FE Beta | 6 | Operations Dashboard, Task Kanban, Dispatch Queue, Standup Report, Technician Workload |
| appointment-center_v2 | FE Beta | 7 | Schedule Board, Appointment Detail, Booking Wizard, Technician Assignment, Reminder Config |
| technician-portal_v2 | FE Beta | 5 | My Day Dashboard, Job Cards, Work Order Management, Inventory Lookup, Check-In |
| customer-portal_v2 | FE Alpha | 6 | Home Dashboard, My Tickets, Appointment Booking, Knowledge Base, Dispute Filing, Profile |
| resolution-center_v2 | FE Alpha | 5 | Dispute Queue, Dispute Detail, AI Analysis Panel, Approval Workflow, Trend Analysis |
| crm-center_v2 | FE Alpha | 6 | Account Dashboard, Account Detail, Health Management, Followup Center, Retention Campaigns |
| notification-center_v2 | FE Gamma | 3 | Notification Log, Template Manager, Channel Settings, Delivery Analytics |
| analytics-center_v2 | FE Gamma | 4 | Executive Dashboard, Department Analytics, Report Builder, Scheduled Reports, Trend Analysis |
| admin-center_v2 | FE Delta | 6 | User Management, Role Manager, System Settings, Feature Flags, Connector Config, Audit Log, WF Health |

### Testing Requirements
- Each app: unit + integration + E2E (min 5 critical journey scenarios per app)
- Cross-app: 3 critical journeys (customer → support → dispatch → notify, appointment → WO → inventory, health scan → followup → campaign)
- Load test: 50 concurrent users, all apps running
- Visual regression: golden snapshots vs. current build
- Performance: Lighthouse ≥ 85 on all apps
- Accessibility: WCAG 2.1 AA on all apps

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| App shell inconsistency across 10 apps | Medium | Shared ui_v2 package; design system enforced in code review; visual regression testing |
| Cross-app navigation complexity | Medium | Consistent navigation configuration in single package; cross-app tests from Sprint 1 |
| Responsive design efforts underestimated | Medium | Mobile-first approach from Sprint 1 on all apps |

### Estimated Effort: 10 weeks, 34 frontend engineers (3,400 eng-hours)

---

## 5. Milestone 4: Agents Complete

**Target Week:** 24 | **Quality Gate:** G3 + G3.5 | **Owner:** Agent Lead

### Entry Criteria (Gate G3 — Core Agents)
- [ ] Milestone 3: All Applications Complete — PASSED
- [ ] All 53 functions deployed and operations verified
- [ ] All 6 connectors deployed and operations verified
- [ ] Agent infrastructure deployed (LLM gateway, context management, agent registry, permissions)
- [ ] Event bus operational with all event types registered

### Exit Criteria — Core Agents (Week 22)

| # | Criterion | Verification | Owner |
|---|-----------|-------------|-------|
| 1 | 26 core agents deployed | `lemma agent list` shows 26 entries | Agent Lead |
| 2 | Agent infrastructure operational | Registry, LLM gateway, context builder, memory manager all healthy | Agent Lead |
| 3 | Each core agent responds correctly | 10 Q/A test cases per agent pass | Agent Lead |
| 4 | Agent cascade: executive → manager → worker | Cascade E2E test passes | Agent Lead |
| 5 | Agent permission enforcement | No data accessible beyond user role | Security Lead |
| 6 | Agent latency: p95 < 5s | Load test (50 concurrent) | Agent Lead |
| 7 | Agent safety: refuses harmful requests | Safety test suite passes | Security Lead |

### Exit Criteria — Extended Agents (Week 24)

| # | Criterion | Verification | Owner |
|---|-----------|-------------|-------|
| 8 | All 49 agents deployed | `lemma agent list` shows 49 agents | Agent Lead |
| 9 | Agent-to-agent handoff correct | Cross-department handoff E2E passes | Agent Lead |
| 10 | Hallucination rate < 5% | Manual audit of 100 responses | QA Lead |
| 11 | Token budgets enforced per agent per session | Token consumption audit | Agent Lead |
| 12 | Agent event emissions correct | Event log audit | Agent Lead |

### Deliverables — Core Agents (26)
| Department | Agents |
|------------|--------|
| Executive | executive-director, platform-orchestrator |
| Support | support-manager, request-classifier, reply-drafter, escalation-manager, sla-monitor |
| Operations | operations-manager, operations-coordinator, work-order-manager |
| Dispatch | dispatch-manager, dispatch-coordinator, technician-dispatcher, emergency-response |
| Scheduling | scheduling-manager, appointment-scheduler, technician-suggester |
| Appointment | appointment-manager, reminder-coordinator, no-show-handler |
| CRM | crm-manager, account-health-monitor, followup-manager, retention-specialist |
| Automation | automation-manager, automation-event-router |

### Deliverables — Extended Agents (23)
| Department | Agents |
|------------|--------|
| Knowledge | knowledge-manager, knowledge-curator, article-suggester |
| Analytics | analytics-manager, trend-analyzer, predictive-modeler |
| Admin | admin-manager, admin-system-config, admin-connector-manager |
| QA | qa-manager, response-quality-monitor, compliance-monitor |
| Reporting | reporting-manager, reporting-generator, reporting-distributor |
| Notification | notification-manager, channel-optimizer, template-manager |
| CX | cx-manager, satisfaction-survey, feedback-analyzer, winback-specialist |
| Automation | automation-workflow-orchestrator |

### Testing Requirements
- Each agent: 10 Q/A test cases (functional, boundary, error) = 490 tests total
- Agent cascade: 3 scenarios (system→support→dispatch, system→crm→retention, system→analytics→report)
- Agent memory: short/medium/long-term context tiered correctly
- Hallucination audit: manual review of 100 agent responses across all departments
- Latency benchmark: P50 < 2s, P95 < 5s, P99 < 10s
- Load test: 100 concurrent agent sessions

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Agent hallucination > 5% | High | Confidence thresholds; human-in-the-loop; prompt versioning |
| LLM API costs higher than budgeted | Medium | Caching layer; token budgets per session; fallback to rule-based |
| Agent permission escalation | High | Every table access validated at runtime; agents cannot bypass RLS |

### Estimated Effort: 6 weeks, 16 agent engineers (960 eng-hours)

---

## 6. Milestone 5: Workflows Complete

**Target Week:** 28 | **Quality Gate:** G4 | **Owner:** Workflow Lead

### Entry Criteria
- [ ] Milestone 4: Agents Complete — PASSED
- [ ] All 49 agents deployed and operations verified
- [ ] All 53 functions deployed and operations verified
- [ ] All 6 connectors deployed and operations verified
- [ ] Event bus operational with all event types registered
- [ ] All 10 V2 apps deployed in staging

### Exit Criteria

| # | Criterion | Verification | Owner |
|---|-----------|-------------|-------|
| 1 | All 33 workflows deployed to staging | `lemma workflow list` shows 33 | Workflow Lead |
| 2 | Each workflow triggers on correct event | Event mapping audit passes | Workflow Lead |
| 3 | Each workflow passes 5-scenario smoke test | 165 tests pass | Workflow Lead |
| 4 | Full journey E2E: support → dispatch → notify → feedback | Full journey passes | Workflow Lead |
| 5 | Workflow latency: non-human steps < 30s p95 | Performance test | Workflow Lead |
| 6 | Rollback procedure tested for all 33 workflows | Rollback suite passes | Workflow Lead |
| 7 | Notification delivery < 30s from trigger | Notification audit | Workflow Lead |
| 8 | Error notification: failed workflows alert admin | Error injection test | Workflow Lead |
| 9 | Workflow state survives process restart | Resilience test | Workflow Lead |
| 10 | Workflow idempotency: replay same event, no dupes | Idempotency test | Workflow Lead |

### Deliverables

| Tier | Count | Workflows | Type |
|:----:|:-----:|-----------|:----:|
| 0 | 8 | notification-delivery, ticket-auto-response, sla-enforcement, appointment-booking, appointment-reminders, standard-dispatch, knowledge-gap-detection, workflow-health-monitor | Autonomous (no human approval) |
| 1 | 6 | ticket-intake, appointment-completion, urgent-dispatch, dispute-resolution, account-health-scan, followup-slippage-detector | Entry (some human approval) |
| 2-3 | 7 | ticket-escalation, work-order-fulfillment, dispute-escalation, followup-management, retention-campaign, customer-satisfaction-monitor, feedback-analysis | Secondary (complex approvals) |
| 4-5 | 9 | work-order-verification, knowledge-article-lifecycle, daily-standup, operations-coordination, report-generation, report-distribution, user-provisioning, system-config-management, inventory-reorder | Execution (admin + cron) |
| 6-7 | 3 | trend-analysis, anomaly-detection, quality-review | Reporting (analytics) |

### Testing Requirements
- Each workflow: 5 scenarios (happy path, error path, edge case, rollback, timeout)
- Full journey: ticket → dispatch → resolve → notify → bill → feedback (end-to-end)
- Cross-workflow triggers: appointment-completion → work-order-fulfillment
- Load test: 50 concurrent workflow executions
- Rollback: all 33 workflows have tested rollback procedures
- Idempotency: replay same event 3×, verify no duplicate side effects

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Workflow execution timeout under load | Medium | Hard 5s timeout per function node; workflow state checkpointing |
| Idempotency store becomes bottleneck | High | TTL-based expiry; in-memory cache with DB persistence |
| Cross-workflow trigger loops | Medium | Event filter prevents infinite loops; max execution depth enforced |

### Estimated Effort: 4 weeks, 10 workflow engineers (400 eng-hours)

---

## 7. Milestone 6: Integration Complete

**Target Week:** 30 | **Quality Gate:** G5 | **Owner:** CTO

### Entry Criteria
- [ ] Milestone 5: Workflows Complete — PASSED
- [ ] All components deployed to staging
- [ ] All performance tests passed
- [ ] All security tests passed
- [ ] All E2E journeys verified
- [ ] V1 ↔ V2 cutover plan approved
- [ ] Production environment provisioned and configured
- [ ] Load testing completed with target 200 concurrent users
- [ ] Disaster recovery plan documented and rehearsed

### Exit Criteria

| # | Criterion | Verification | Owner |
|---|-----------|-------------|-------|
| 1 | All 10 apps + 53 functions + 49 agents + 33 workflows operational | Full stack smoke test | CTO |
| 2 | 3 full business journeys pass | E2E integration suite | QA Lead |
| 3 | Data consistency: data written by one readable by all | Cross-component data audit | BE Lead |
| 4 | Event flow integrity: all events produce expected outcomes | Event tracing audit | Platform Lead |
| 5 | Notification pipeline: all channels deliver < 30s | Notification audit | BE Connector Lead |
| 6 | V1/V2 data consistent within 5s (if dual-write) | Dual-write comparison | BE Lead |
| 7 | 200 concurrent users, 30 min, no SLA violation | Load test | Platform Lead |
| 8 | Zero critical, zero high security findings | DAST + SAST + dependency scan | Security Lead |
| 9 | Full recovery within 1h RTO | DR drill | Platform Lead |
| 10 | All components have alerts, dashboards, logs | Monitoring inventory | Platform Lead |
| 11 | All 5 rollback tiers documented and tested in staging | Rollback test | CTO |

### Deliverables
- [ ] Full regression suite results (all 7 gates combined)
- [ ] Load test report (200 users, 30 min)
- [ ] Security scan report (DAST + SAST + dependency)
- [ ] DR drill results (recovery time < 1h)
- [ ] Monitoring dashboards (all 5 component types)
- [ ] Runbooks (all operational procedures)
- [ ] Rollback procedures (Tier 1-5 documented + tested)

### Testing Requirements
- Full regression suite: all prior gate criteria re-verified
- 3 full business journeys end-to-end
- Load test: 200 concurrent users, 30 min sustained
- DR drill: simulate full failure, measure recovery time
- Security: DAST + SAST + dependency scan

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Integration reveals regression in earlier component | Medium | Component isolation test before integration; rollback individual component |
| Load test reveals bottleneck | High | Profile during test; optimize hot path; add read replicas |
| DR drill fails | High | Practice run 1 week before; document failure modes |

### Estimated Effort: 2 weeks, 62 engineers (all teams)

---

## 8. Milestone 7: Production Ready

**Target Week:** 32 | **Quality Gate:** G6 | **Owner:** CTO + VP Engineering

### Entry Criteria
- [ ] Milestone 6: Integration Complete — PASSED
- [ ] All components deployed to staging and verified
- [ ] All performance tests passed
- [ ] All security tests passed
- [ ] All E2E journeys verified
- [ ] V1 ↔ V2 cutover plan approved by CTO + CEO
- [ ] Production environment provisioned and configured

### Exit Criteria

| # | Criterion | Verification | Owner |
|---|-----------|-------------|-------|
| 1 | Canary deployment (10% → 50% → 100%) | Each stage passes health checks for 30+ min | Platform Lead |
| 2 | Production smoke test: all 150+ components healthy | Health check endpoint | CTO |
| 3 | SLA: 99.9% uptime (72h measurement window) | Uptime monitoring | Platform Lead |
| 4 | SLA: API p95 < 2s (72h window) | API monitoring | Platform Lead |
| 5 | SLA: Agent p95 < 5s (72h window) | Agent monitoring | Agent Lead |
| 6 | Zero P0/P1 production bugs | Bug tracker audit | QA Lead |
| 7 | Security: zero critical, zero high findings | Production security scan | Security Lead |
| 8 | V1 cutover at 100% | Traffic metrics | CTO |
| 9 | Rollback plan verified (Tier 1-5) | Rollback drill | CTO |
| 10 | V1 decommission plan approved | Plan includes timeline, migration, archive | CTO |

### Deliverables
- [ ] Production deployment runbook
- [ ] V1 ↔ V2 cutover execution report
- [ ] V1 decommission plan
- [ ] Production monitoring dashboard (all components)
- [ ] Security audit report (production)
- [ ] Disaster recovery drill results (production)
- [ ] SLA compliance report (72h measurement)
- [ ] Rollback procedures document (Tier 1-5)
- [ ] Runbooks for all operational tasks
- [ ] On-call rotation schedule

### Testing Requirements
- Canary: deploy to 10% → verify 30 min → 50% → verify 1h → 100% → verify 72h
- Full regression suite on production before cutover
- Load test at full production scale
- DR drill: simulate full failure, measure recovery time
- Security scan: DAST + SAST + dependency scan

### Production Cutover Stages

**Stage 1: Canary (Day 1-3, 10% traffic)**
- Route 10% of real traffic to V2
- Monitor all SLAs, error rates, latency
- If ANY P0 issue: rollback immediately (Tier 1)
- Go criteria: 72h without P0/P1, SLA metrics green

**Stage 2: Ramp (Day 4-10, 50% traffic)**
- Route 50% of real traffic to V2
- Monitor data consistency between V1 and V2
- Run load tests with production traffic
- Go criteria: 1 week without incident, data consistent, load OK

**Stage 3: Full Production (Day 11+, 100% traffic)**
- Route all traffic to V2
- V1 in read-only fallback mode
- Monitor for 30 days before V1 decommission

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Canary reveals performance issue | High | Rollback to V1; optimize; re-canary |
| Production migration data inconsistency | Critical | Dual-write during cutover; reconciliation job runs hourly; rollback ready |
| V1 decommission data loss | Critical | 30-day preservation before drop; verification script checks row counts |

### Estimated Effort: 2 weeks, 8 engineers + all leads on standby

---

## 9. Milestone Dashboard

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ RESQAI V2 — MILESTONE DASHBOARD                                                           │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│  M1: Foundation Complete (W4)                        [Status: ░░░░░░░░░░]  Gate G0: [  ] │
│    ✓ 8 shared packages published                                                          │
│    ✓ 41 tables created with FK + indexes + RLS                                            │
│    ✓ Event bus + auth + CI/CD operational                                                 │
│                                                                                           │
│  M2: Functions + Connectors Complete (W12)           [Status: ░░░░░░░░░░]  Gate G1: [  ] │
│    ✓ 53 functions (all 6 layers) deployed + tested                                        │
│    ✓ 6 connectors (all channels) operational                                              │
│    ✓ 90%+ code coverage, V1/V2 gap closed                                                 │
│                                                                                           │
│  M3: All Applications Complete (W18)                 [Status: ░░░░░░░░░░]  Gate G2: [  ] │
│    ✓ 10 V2 apps deployed, all views render                                                │
│    ✓ Cross-app journeys verified                                                          │
│    ✓ Responsive + accessible (<3s, WCAG 2.1 AA)                                           │
│                                                                                           │
│  M4: Agents Complete (W24)                           [Status: ░░░░░░░░░░]  Gate G3: [  ] │
│    ✓ 49 agents deployed, agent cascade working                                            │
│    ✓ Hallucination rate < 5%, p95 < 5s latency                                            │
│    ✓ Agent permissions enforced, safety tests pass                                        │
│                                                                                           │
│  M5: Workflows Complete (W28)                        [Status: ░░░░░░░░░░]  Gate G4: [  ] │
│    ✓ 33 workflows deployed, all tiers 0-7                                                  │
│    ✓ 165 smoke tests pass, rollback tested for all                                        │
│    ✓ Full business journey end-to-end verified                                            │
│                                                                                           │
│  M6: Integration Complete (W30)                      [Status: ░░░░░░░░░░]  Gate G5: [  ] │
│    ✓ All 150+ components integrated                                                       │
│    ✓ Load test: 200 users, 30 min, no SLA violation                                       │
│    ✓ Security scan: zero critical/high, DR < 1h RTO                                       │
│                                                                                           │
│  M7: Production Go-Live (W32)                        [Status: ░░░░░░░░░░]  Gate G6: [  ] │
│    ✓ Canary: 10% → 50% → 100% passed                                                      │
│    ✓ SLA: 99.9% uptime, API <2s, Agent <5s (72h)                                         │
│    ✓ V1 cutover at 100%, rollback ready, V1 decommission planned                          │
│                                                                                           │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

> **End of ENGINEERING_MILESTONES.md**
