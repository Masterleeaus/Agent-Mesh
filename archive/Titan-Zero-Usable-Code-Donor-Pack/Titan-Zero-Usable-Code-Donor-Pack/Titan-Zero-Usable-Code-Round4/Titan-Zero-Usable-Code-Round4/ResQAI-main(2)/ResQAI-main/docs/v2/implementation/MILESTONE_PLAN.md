# RESQAI V2 — Milestone Plan

> Phase 2.0 — Implementation Planning Only  
> Chief Technical Program Manager  
> Date: 2026-06-29

---

## Table of Contents

1. [Milestone Overview](#1-milestone-overview)
2. [Checkpoint Alpha — Foundation Complete](#2-checkpoint-alpha--foundation-complete)
3. [Checkpoint Beta — Functions + Connectors Complete](#3-checkpoint-beta--functions--connectors-complete)
4. [Checkpoint Gamma — All Apps Complete](#4-checkpoint-gamma--all-apps-complete)
5. [Checkpoint Delta — Agents + Workflows Complete](#5-checkpoint-delta--agents--workflows-complete)
6. [Checkpoint Production — Integration Complete](#6-checkpoint-production--integration-complete)

---

## 1. Milestone Overview

```
Milestone         Week     Phase           Gate   Go/No-Go Authority
─────────────     ─────    ──────────      ────   ─────────────────────
Foundation Done   W4      Phase 0         Gate 0 CTO + Architecture Board
Functions Done    W12     Phase 1-2       Gate 1 VP Engineering + CTO
Apps Complete     W18     Phase 3-4-5     Gate 2 VP Product + CTO
Agents + WF Done  W28     Phase 6         Gate 3 VP Engineering + CTO
Production        W30     Phase 7         Gate 4 CEO + CTO + VP Eng
```

### Decision Rules

- **Go:** All entry criteria met, all tests pass, no known P0/P1 bugs, risk register reviewed.
- **No-Go:** Any entry criteria unmet, any P0/P1 bug open, dependencies incomplete, gate review not held.
- **Conditional Go:** Minor criteria unmet with approved mitigation plan, tracked to next gate.

Every No-Go triggers a 1-week remediation sprint and re-review. Max 2 consecutive No-Go per gate.

---

## 2. Checkpoint Alpha — Foundation Complete

**Week:** 4 | **Gate:** 0 | **Status:** Pending

### Entry Criteria (must ALL pass before starting milestone)
- [x] All Phase 2.0 planning documents approved
- [x] Engineering team staffed (min 5 engineers)
- [x] Dev environment provisioned (CI/CD, staging, development databases)
- [x] All Phase 1.x architecture documents frozen (no further changes)
- [x] V1 coexistence strategy approved
- [x] Repository initialized with monorepo structure
- [x] Branch strategy defined (main/staging/dev/feature branches)

### Exit Criteria (must ALL pass to declare milestone complete)

| # | Criterion | Verification Method | Owner |
|---|-----------|-------------------|-------|
| 1 | Shared packages published (types, constants, utils, errors) | npm/poetry publish dry-run passes | Platform Lead |
| 2 | All 6 migration scripts written and tested | `lemma db migrate plan` shows no pending | BE Lead |
| 3 | All 41 tables created in dev database | Migration scripts complete without error | BE Lead |
| 4 | Event bus infra deployed (pub/sub channels created) | Integration test: event publish → consume | Platform Lead |
| 5 | Auth system deployed (RLS policies per table) | Auth test: all role-based access patterns pass | Platform Lead |
| 6 | Logging + monitoring pipeline established | Sample event logged and retrievable | Platform Lead |
| 7 | CI/CD pipeline green on dev branch | Build, lint, test all pass | Platform Lead |
| 8 | Repository README, CONTRIBUTING, AGENTS.md updated | Docs review | Platform Lead |

### Deliverables Checklist
- [ ] `packages/resqai-types` — TypeScript interface definitions
- [ ] `packages/resqai-utils` — Shared utility functions
- [ ] `packages/resqai-errors` — Error classes
- [ ] `packages/resqai-config` — Environment configuration module
- [ ] Migration 0: `_v2_foundation` schema
- [ ] Migration 1: `_v2_identity` schema (users, orgs, roles)
- [ ] Migration 2-6: Remaining 5 schemas (core, operations, billing, settings, metrics)
- [ ] Event bus: channel creation + base publisher/subscriber
- [ ] Auth: role-permission matrix + RLS per table
- [ ] CI/CD: GitHub Actions workflow file, lint config, test runner config

### Testing Requirements
- All migrations rollback successfully (tested in isolation)
- Auth: every table access pattern tested for each role (min 1 test per table)
- Event bus: 3 test events published and consumed
- Packages: types, utils, errors unit tested

### Go/No-Go Decision
- **Go if:** All exit criteria met, no blocker during week 4 review
- **No-Go if:** Any table migration fails, auth hole found, event bus not operational

### Risk Level: Low

### Rollback Strategy
- V1 remains live; V2 has no production traffic yet
- Drop entire `_v2` schema, delete packages, disable event bus

---

## 3. Checkpoint Beta — Functions + Connectors Complete

**Week:** 12 | **Gate:** 1 | **Status:** Pending

### Entry Criteria
- [ ] Checkpoint Alpha passed
- [ ] All 41 tables available in staging
- [ ] Event bus operational
- [ ] Auth system operational
- [ ] CI/CD pipeline green

### Exit Criteria

| # | Criterion | Verification Method | Owner |
|---|-----------|-------------------|-------|
| 1 | All 53 functions deployed to staging | `lemma function list` shows all | BE Lead |
| 2 | All DET functions return correct data | Integration test suite passes | BE Lead |
| 3 | All WRI functions write and verify | Integration test suite passes | BE Lead |
| 4 | All AGG functions produce correct aggregates | Integration test suite passes | BE Lead |
| 5 | All ORC functions trigger expected events | Event log audit passes | BE Lead |
| 6 | TRA function tested with mock SMS | Integration test passes | BE Lead |
| 7 | All 6 connectors operational | Connector smoke tests pass | BE Beta Lead |
| 8 | Circuit breaker + rate limit behavior verified | Chaos tests pass (intentional failures) | BE Beta Lead |
| 9 | 90%+ code coverage on functions | Coverage report | BE Lead |
| 10 | All functions have OpenAPI specs generated | API docs review | Platform Lead |
| 11 | V1 ↔ V2 function mapping verified (no gaps) | Comparison matrix review | CTO |

### Deliverables Checklist
- [ ] 7 DET functions
- [ ] 8 READER functions
- [ ] 22 WRI functions (8 core + 14 extended)
- [ ] 10 AGG functions
- [ ] 5 ORC functions
- [ ] 1 TRA function
- [ ] 6 connectors (twilio, sendgrid, slack, mongodb, mapbox, openai)
- [ ] Function test suite (unit + integration)
- [ ] OpenAPI docs per function
- [ ] V1↔V2 function gap analysis doc

### Testing Requirements
- Every function: unit test + integration test
- WRI functions: insert → verify by DET
- ORC functions: event emitted matches expected schema
- Connectors: rate limit hit → circuit breaker opens → resets correctly
- Negative tests: invalid input, unauthorized access, missing dependencies

### Go/No-Go Decision
- **Go if:** All 53 functions pass integration, 90%+ coverage, 6 connectors pass smoke tests, no P0/P1 bugs
- **No-Go if:** Any critical function fails, connector integration breaks, coverage <80%

### Risk Level: Medium

### Rollback Strategy
- Roll back individual failing functions (each has its own version)
- If connector breaks, fall back to V1 connector service
- V2 functions are called only by V2 apps; V1 unaffected

---

## 4. Checkpoint Gamma — All Apps Complete

**Week:** 18 | **Gate:** 2 | **Status:** Pending

### Entry Criteria
- [ ] Checkpoint Beta passed
- [ ] All 53 functions deployed and tested
- [ ] All 6 connectors deployed and tested
- [ ] Event bus operational at scale
- [ ] Auth system includes all V2 role definitions
- [ ] Staging environment available for E2E testing

### Exit Criteria

| # | Criterion | Verification Method | Owner |
|---|-----------|-------------------|-------|
| 1 | All 10 V2 apps deployed to staging | App smoke tests pass | FE Leads |
| 2 | Each app renders all major views | Visual regression tests pass | FE Leads |
| 3 | Each app connects to its dependent functions | E2E test: app loads real data | FE Leads |
| 4 | App routing works (auth, navigation, error pages) | Navigation test suite passes | FE Leads |
| 5 | All app forms submit and receive response | Form E2E tests pass | FE Leads |
| 6 | App-to-app navigation works (e.g., support→resolution) | Cross-app navigation tests pass | FE Leads |
| 7 | Responsive design verified (desktop + tablet) | Responsive test suite passes | FE Leads |
| 8 | Load time < 3s per route (p95) | Performance audit | FE Leads |
| 9 | 80%+ code coverage on frontend | Coverage report | FE Leads |
| 10 | Accessibility audit passes (WCAG 2.1 AA) | a11y audit tool | FE Leads |

### Deliverables Checklist
- [ ] support-center_v2 (Sprint 5-6)
- [ ] operations-center_v2 (Sprint 5-6)
- [ ] appointment-center_v2 (Sprint 5-6)
- [ ] technician-portal_v2 (Sprint 6)
- [ ] customer-portal_v2 (Sprint 7)
- [ ] resolution-center_v2 (Sprint 7)
- [ ] crm-center_v2 (Sprint 7)
- [ ] notification-center_v2 (Sprint 8)
- [ ] analytics-center_v2 (Sprint 9)
- [ ] admin-center_v2 (Sprint 9)
- [ ] E2E test suite per app
- [ ] Visual regression snapshots
- [ ] Performance reports
- [ ] a11y compliance reports

### Testing Requirements
- Each app: unit + integration + E2E (min 5 E2E scenarios per app)
- Cross-app: 3 critical journeys (e.g., ticket creation → technician dispatch → customer notification)
- Load test: 50 concurrent users, all apps running
- Visual regression: golden snapshots vs. current build

### Go/No-Go Decision
- **Go if:** 10/10 apps deploy, 80%+ FE coverage, load <3s p95, a11y passes, no P0/P1 bugs
- **No-Go if:** Any app fails to render, critical cross-app journey broken, load >5s, a11y blockers

### Risk Level: Medium-High (bus factor with FE teams)

### Rollback Strategy
- Individual app rollback per Vite build version
- If critical breakage, revert to previous build; hotfix within 24h
- Cross-app integrations can be disabled independently (feature flags)

---

## 5. Checkpoint Delta — Agents + Workflows Complete

**Week:** 28 | **Gate:** 3 | **Status:** Pending

### Entry Criteria
- [ ] Checkpoint Gamma passed
- [ ] All 10 V2 apps deployed in staging
- [ ] All 53 functions deployed and operations verified
- [ ] All 6 connectors deployed and operations verified
- [ ] Event bus operational with all event types registered
- [ ] Agent infrastructure deployed (LLM gateway, context management, agent registry)

### Exit Criteria

| # | Criterion | Verification Method | Owner |
|---|-----------|-------------------|-------|
| 1 | All 49 agents deployed to staging | `lemma agent list` shows all | Agent Lead |
| 2 | Each agent responds with correct context | Agent Q/A test suite passes | Agent Lead |
| 3 | Agent cascading works (system → domain → sub-domain) | Cascade E2E test passes | Agent Lead |
| 4 | All 33 workflows deployed to staging | `lemma workflow list` shows all | Workflow Lead |
| 5 | Each workflow triggers on correct event | Workflow smoke tests pass | Workflow Lead |
| 6 | Workflow execution path verified end-to-end | Full journey E2E tests pass | Workflow Lead |
| 7 | Notification dispatch verified (SMS, email, push) | Notification audit tests pass | Workflow Lead |
| 8 | Agent + workflow integration verified (agent triggers workflow) | Integration E2E tests pass | Agent + WF Lead |
| 9 | All workflows have rollback procedures tested | Rollback test suite passes | Workflow Lead |
| 10 | 85%+ coverage on agent code | Coverage report | Agent Lead |
| 11 | 85%+ coverage on workflow code | Coverage report | Workflow Lead |
| 12 | Agent response < 5s p95 latency | Performance audit | Agent Lead |
| 13 | Workflow execution < 30s p95 (non-human steps) | Performance audit | Workflow Lead |

### Deliverables Checklist
- [ ] 2 executive agents (system-orchestrator, knowledge-gateway)
- [ ] 12 core domain agents (ticket, customer, technician, appointment, inventory, billing, notification, escalation, report, compliance, feedback, dispatch)
- [ ] 35 extended domain agents (3-4 per core domain)
- [ ] Agent registry + discovery service
- [ ] LLM gateway with caching
- [ ] Context management service
- [ ] 14 Tier 0-1 workflows (autonomous + entry)
- [ ] 19 Tier 2-7 workflows (secondary through notification)
- [ ] Workflow scheduler + event triggers
- [ ] Workflow state store + error handler
- [ ] Agent E2E test suite
- [ ] Workflow E2E test suite

### Testing Requirements
- Each agent: 10 Q/A test cases (functional, boundary, error)
- Agent cascade: 3 scenarios (system→ticket→dispatch, system→customer→billing, system→report→analytics)
- Each workflow: 5 scenarios (happy path, error path, edge case, rollback, timeout)
- Full journey: ticket → dispatch → resolve → notify → bill → feedback (end-to-end)
- Load test: 100 concurrent agent sessions, 50 concurrent workflow executions

### Go/No-Go Decision
- **Go if:** 49/49 agents deployed, 33/33 workflows deployed, 85%+ coverage, latency within threshold, no P0/P1 bugs
- **No-Go if:** Any critical agent fails, workflow orchestration broken, notification dispatch failures, latency beyond threshold

### Risk Level: High (agent quality, LLM costs, workflow complexity)

### Rollback Strategy
- Individual agent version rollback (each agent independently versioned)
- Workflow rollback via version switch in workflow registry
- If LLM gateway fails, fall back to rule-based agent (degraded mode)
- Workflows can be paused per tier; Tier 0 paused, Tier 2+ continue

---

## 6. Checkpoint Production — Integration Complete

**Week:** 30 | **Gate:** 4 | **Status:** Pending

### Entry Criteria
- [ ] Checkpoint Delta passed
- [ ] All components deployed to staging
- [ ] All performance tests passed
- [ ] All security tests passed
- [ ] All E2E journeys verified
- [ ] V1 ↔ V2 cutover plan approved
- [ ] Production environment provisioned and configured
- [ ] Load testing completed with target 200 concurrent users
- [ ] Disaster recovery plan documented and rehearsed
- [ ] Monitoring + alerting configured for all production resources

### Exit Criteria

| # | Criterion | Verification Method | Owner |
|---|-----------|-------------------|-------|
| 1 | All V2 resources deployed to production | Canary deployment success | Platform Lead |
| 2 | V1 traffic cutover complete (gradual: 10% → 50% → 100%) | Traffic metrics verified | CTO |
| 3 | All 10 V2 apps accessible at /v2/* paths | Production smoke test | FE Leads |
| 4 | All 53 functions operational | Function invocation test suite | BE Lead |
| 5 | All 6 connectors sending real messages | Connector audit log verified | BE Beta Lead |
| 6 | All 49 agents responding in production | Agent health check | Agent Lead |
| 7 | All 33 workflows executing in production | Workflow execution log | Workflow Lead |
| 8 | Notification delivery < 30s from trigger | Production latency audit | Platform Lead |
| 9 | Zero P0/P1 bugs in production | Bug tracker audit | QA Lead |
| 10 | Security scan passes (no critical/high findings) | Security audit report | Security Lead |
| 11 | SLA metrics meet target: 99.9% uptime, <2s p95 API, <5s p95 agent | Production monitoring | Platform Lead |
| 12 | Disaster recovery validated within 1h RTO | DR drill | Platform Lead |
| 13 | Rollback plan documented | Plan review | CTO |
| 14 | V1 decommission plan approved (timeline, migration, archive) | Plan review | CTO |

### Deliverables Checklist
- [ ] Production deployment runbook
- [ ] V1 ↔ V2 cutover plan
- [ ] V1 decommission plan
- [ ] Production monitoring dashboard
- [ ] Security audit report
- [ ] Disaster recovery drill results
- [ ] SLA compliance report
- [ ] Rollback procedures document
- [ ] Runbooks for all operational tasks
- [ ] On-call rotation established

### Testing Requirements
- Canary: deploy to 10% → verify → 50% → verify → 100%
- Full regression suite on production before cutover
- Load test at production scale (200 concurrent users)
- DR drill: simulate full failure, measure recovery time
- Security scan: DAST + SAST + dependency scan

### Go/No-Go Decision
- **Go (Full Production):** All exit criteria met, no P0/P1 bugs, SLA metrics sustained 72h+, security clean, DR validated
- **Conditional Go (Limited Rollout):** All critical criteria met, minor non-blockers with mitigation plans, rollback ready, limited to 25% of orgs
- **No-Go:** Any P0/P1 bug, SLA metrics failing, security critical, DR drill failed, rollback not validated

### Risk Level: High (production cutover, data integrity, downtime risk)

### Rollback Strategy
- **Tier 1 — Instant Rollback (< 5 min):** Revert DNS/CDN to V1 URLs
- **Tier 2 — App Rollback (< 15 min):** Revert Vite build version per app
- **Tier 3 — Function Rollback (< 30 min):** Revert function version per domain
- **Tier 4 — Data Rollback (< 2h):** Restore from V1 tables (V1 data preserved during Phase 0-6)
- **Tier 5 — Full Rollback (< 1 day):** All V2 down, V1 full service restored
- V1 remains fully operational and receiving writes during cutover for 30-day rollback window

---

> **End of MILESTONE_PLAN.md**  
> Next document: QUALITY_GATES.md
