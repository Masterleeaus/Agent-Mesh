# RESQAI V2 — Quality Gates

> Phase 2.0 — Implementation Planning Only  
> Chief Technical Program Manager  
> Date: 2026-06-29

---

## Table of Contents

1. [Gate Structure](#1-gate-structure)
2. [Gate 0: Foundation Quality](#2-gate-0-foundation-quality)
3. [Gate 1: Functions + Connectors Quality](#3-gate-1-functions--connectors-quality)
4. [Gate 2: Apps Quality](#4-gate-2-apps-quality)
5. [Gate 3: Agents Quality](#5-gate-3-agents-quality)
6. [Gate 4: Workflows Quality](#6-gate-4-workflows-quality)
7. [Gate 5: Integration Quality](#7-gate-5-integration-quality)
8. [Gate 6: Production Quality](#8-gate-6-production-quality)
9. [Global Quality Rules](#9-global-quality-rules)

---

## 1. Gate Structure

Every quality gate is a pass/fail checkpoint. Gates are ordered by implementation timeline.

```
Gate 0 ──→ Gate 1 ──→ Gate 2 ──→ Gate 3 ──→ Gate 4 ──→ Gate 5 ──→ Gate 6
(Foundation) (Functions) (Apps)   (Agents)    (Workflows) (Integration) (Production)
    │             │         │          │            │            │            │
    ▼             ▼         ▼          ▼            ▼            ▼            ▼
  Sprint 2      Sprint 6  Sprint 9  Sprint 11    Sprint 14    Sprint 15    Post-S15
   (W4)         (W12)     (W18)      (W22)        (W28)        (W30)        (W32)
```

### Gate Review Process

```
┌──────────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐     ┌───────────┐
│ Self-Eval │ →  │ Peer     │ →  │ Gate Review │ →  │ Go/No-Go │ →  │ Remediation│
│ (Build    │     │ Review   │     │ (All Leads) │     │ Decision │     │ Sprint if │
│  Owner)   │     │ (Cross-  │     │             │     │ (CTO)    │     │ No-Go     │
│           │     │  Team)   │     │             │     │          │     │           │
└──────────┘     └──────────┘     └────────────┘     └──────────┘     └───────────┘
```

- Self-eval: build owner runs all checks, reports results to gate review
- Peer review: at least one lead from a different track reviews all deliverables
- Gate review: all track leads + CTO, reviews evidence, votes go/no-go
- Decision: CTO makes final call
- Remediation: if no-go, max 1-week sprint, then re-review. Max 2 consecutive no-go per gate

---

## 2. Gate 0: Foundation Quality

**Timing:** End of Sprint 2 (Week 4)  
**Owner:** Platform Lead  
**Reviewers:** CTO, BE Lead, FE Lead

### Pass/Fail Criteria

| # | Criterion | Pass Condition | Fail Condition | How to Verify |
|---|-----------|---------------|----------------|---------------|
| 0.1 | Monorepo structure | All packages resolve, workspace config valid | Any package fails to resolve | `npm install` from root; `poetry install` from root |
| 0.2 | Table migrations | 0 pending migrations after `lemma db migrate plan` | Any migration fails or has incorrect schema | Dry-run plan; apply to fresh DB; verify schema |
| 0.3 | Migration rollback | All 6 migrations roll back cleanly to empty state | Rollback leaves orphan tables or constraints | Apply all → rollback all → verify empty schema |
| 0.4 | Foreign key integrity | No orphan FKs, all FK chains resolvable | Missing FK target table or circular dependency | Run FK validation script |
| 0.5 | Event bus | Publish + subscribe + replay works for 3 test events | Publish fails, subscribe misses, replay corrupts | Integration test (3 scenarios) |
| 0.6 | Auth/RLS | Every table has RLS for each role; no table accessible without auth | Table returns data without auth token | Auth test matrix (all roles × all tables) |
| 0.7 | CI/CD pipeline | Build, lint, test, typecheck all green on push | Any step fails | Push to dev branch, verify CI run |
| 0.8 | Package unit tests | 90%+ coverage on resqai-types, resqai-utils, resqai-errors, resqai-config | Coverage < 80% on any package | `vitest --coverage` on each package |

### Gate Check: Deployment

**Pass Conditions:**
- [ ] `lemma db migrate plan` shows 0 pending
- [ ] `lemma db migrate apply` completes without error
- [ ] All 41 tables visible via `lemma table list`
- [ ] Event bus health check: publish + subscribe works for test events
- [ ] Auth: 3 user sessions (admin, dispatch, read-only) can access correct tables
- [ ] CI pipeline green

### Cross-Cutting Concerns

- **No orphan resources:** Every migration script has both up and down paths
- **No duplicated logic:** Shared packages eliminated all copy-pasted types/utilities
- **No missing integrations:** Event bus has at-least-once delivery guarantee

### Quality Dashboard — Gate 0

```
┌────────────────────────────────────────────────────┐
│ Gate 0: Foundation Quality                         │
├────────────────────────────────────────────────────┤
│ Criterion               Status  Coverage    Owner  │
├────────────────────────────────────────────────────┤
│ Monorepo structure       [  ]    —           Plat  │
│ Table migrations         [  ]    41/41       BE    │
│ Migration rollback       [  ]    6/6         BE    │
│ Foreign key integrity    [  ]   41 tables    BE    │
│ Event bus               [  ]   3 tests      Plat  │
│ Auth/RLS                [  ]   All tables   Plat  │
│ CI/CD pipeline          [  ]   —            Plat  │
│ Package unit tests      [  ]   ≥90%         Plat  │
├────────────────────────────────────────────────────┤
│ ALL PASS: [YES/NO]       Decision: [GO/NO-GO]      │
└────────────────────────────────────────────────────┘
```

---

## 3. Gate 1: Functions + Connectors Quality

**Timing:** End of Sprint 6 (Week 12)  
**Owner:** BE Lead  
**Reviewers:** CTO, FE Leads, Platform Lead

### Pass/Fail Criteria

| # | Criterion | Pass Condition | Fail Condition | How to Verify |
|---|-----------|---------------|----------------|---------------|
| 1.1 | All 53 functions deployed | `lemma function list` returns 53 entries | < 50 entries, or any missing critical function | Automated inventory check |
| 1.2 | Function unit tests | 90%+ coverage aggregate; 80%+ per function | < 80% on any critical function | Coverage report per function |
| 1.3 | Function integration tests | All integration tests pass (3 tests per function) | Any integration test fails | Integration suite run | 
| 1.4 | WRI verification test | For every WRI, insert → verify by DET returns same data | Any WRI insert not verifiable | Automated readback test |
| 1.5 | ORC event emission | Every ORC emits correct event with valid schema | Missing fields, wrong event type | Event schema validator |
| 1.6 | Connector test | 6 connectors: all pass smoke + rate limit + circuit breaker | Any connector fails smoke test | Connector test suite |
| 1.7 | No circular calls | Function call graph is acyclic | Circular dependency detected | `ts-morph` static analysis |
| 1.8 | No duplicate logic | No two functions implement same business logic | Logic duplication detected | Code review + similarity scan |
| 1.9 | OpenAPI docs | All 53 functions have generated OpenAPI specs | > 3 functions missing | OpenAPI inventory check |
| 1.10 | V1/V2 gap analysis | All V1 business capabilities have V2 equivalent, documented exceptions | Undocumented gap > 1 capability | Comparison matrix review |
| 1.11 | Event catalog alignment | Function events match EVENT_CATALOG.md definitions | Mismatch > 1 event | Auto-validate events vs. catalog |
| 1.12 | No hardcoded secrets | Zero secrets in env/config files | Any secret detected | Secret scan (trufflehog) |

### Gate Check: Performance

**Pass Conditions:**
- [ ] Function p95 latency < 500ms (500ms for simple, 2s for complex AGG)
- [ ] Connector response < 1s (excluding provider latency)
- [ ] Event bus throughput: 100 events/s sustained
- [ ] Auth check function < 50ms

### Cross-Cutting Concerns

- **Security:** No function accepts unvalidated input; all use input validation wrapper
- **Observability:** Every function logs entry/exit/error with correlation ID
- **Resilience:** Every connector has circuit breaker; every external call has timeout; every event has retry policy
- **Testability:** Every function dependency is injectable (no hardcoded modules)

### Quality Dashboard — Gate 1

```
┌────────────────────────────────────────────────────────────┐
│ Gate 1: Functions + Connectors Quality                     │
├────────────────────────────────────────────────────────────┤
│ Criterion                  Status   Coverage     Owner     │
├────────────────────────────────────────────────────────────┤
│ 53 functions deployed      [  ]    53/53         BE        │
│ Function unit tests        [  ]    ≥90%          BE        │
│ Function integration       [  ]    159 tests     BE        │
│ WRI verification           [  ]    22/22         BE Alpha  │
│ ORC event emission         [  ]    5/5           BE Beta   │
│ Connector tests            [  ]    6/6           BE Beta   │
│ No circular calls          [  ]    Acyclic       BE        │
│ No duplicate logic         [  ]    —             BE        │
│ OpenAPI docs               [  ]    53/53         BE        │
│ V1/V2 gap analysis         [  ]    —             CTO       │
│ Event alignment            [  ]    Match         BE        │
│ Security scan              [  ]    Clean         Security  │
├────────────────────────────────────────────────────────────┤
│ ALL PASS: [YES/NO]          Decision: [GO/NO-GO]           │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Gate 2: Apps Quality

**Timing:** End of Sprint 9 (Week 18)  
**Owner:** FE Lead  
**Reviewers:** CTO, BE Lead, Product Lead

### Pass/Fail Criteria

| # | Criterion | Pass Condition | Fail Condition | How to Verify |
|---|-----------|---------------|----------------|---------------|
| 2.1 | 10 apps deployed | All 10 apps serve on `/_v2/app/` paths | Any app broken or 500 on home | Smoke test per app |
| 2.2 | FE unit tests | 80%+ coverage | < 70% any app | `vitest --coverage` |
| 2.3 | FE integration | All function connections produce correct data | Any app shows error or no data | Integration suite |
| 2.4 | E2E journeys | 5 critical journeys per app pass | Any journey fails | Playwright/Cypress |
| 2.5 | Cross-app journeys | 3 cross-app journeys pass (support→dispatch→notify) | Any journey fails | Playwright E2E |
| 2.6 | Responsive design | No layout breakage at 1024px, 768px, 375px | >2 visual defects | Responsive snapshots |
| 2.7 | Load time | p95 < 3s per route | > 5s on any route | Lighthouse CI |
| 2.8 | WCAG 2.1 AA | Automated + manual audit passes | Critical a11y failures > 0 | axe + manual audit |
| 2.9 | Error handling | 404, 500, offline pages render | Missing error states | E2E error scenarios |
| 2.10 | No V1 remnants | No V1 component, style, or API references in V2 apps | V1 import detected | Code review + grep |
| 2.11 | Loading states | All data-dependent views have skeleton/spinner | View shows blank or jank | Visual inspection |
| 2.12 | Auth integration | App routes respect role permissions | Unauthorized access possible | Auth E2E test |

### Gate Check: Performance

**Pass Conditions:**
- [ ] Lighthouse Performance score ≥ 85 on all apps
- [ ] Lighthouse Accessibility score ≥ 90 on all apps
- [ ] Lighthouse Best Practices score ≥ 90 on all apps
- [ ] Lighthouse SEO score ≥ 90 on all apps
- [ ] JS bundle per app < 500KB gzipped

### Cross-Cutting Concerns

- **Consistency:** All apps share design system (tailwind config, component library)
- **Testing:** Every data flow has integration test; every route has E2E journey
- **Accessibility:** Color contrast, keyboard navigation, screen reader tested
- **Security:** No XSS vectors, all user content sanitized, all API calls authenticated
- **State management:** Each app uses consistent store pattern (no conflicting patterns)

### Quality Dashboard — Gate 2

```
┌──────────────────────────────────────────────────────────────┐
│ Gate 2: Apps Quality                                        │
├──────────────────────────────────────────────────────────────┤
│ Criterion                   Status   Coverage      Owner     │
├──────────────────────────────────────────────────────────────┤
│ 10 apps deployed            [  ]    10/10          FE Lead   │
│ FE unit tests               [  ]    ≥80%           FE Alpha  │
│ FE integration tests        [  ]    10 suites      FE Beta   │
│ E2E journeys                [  ]    50 scenarios   FE Gamma  │
│ Cross-app journeys          [  ]    3 journeys     FE Lead   │
│ Responsive design           [  ]    All breakpoints FE Alpha  │
│ Load time (p95)             [  ]    <3s            FE Beta   │
│ WCAG 2.1 AA                 [  ]    Pass           FE Gamma  │
│ Error handling              [  ]    All states     FE Alpha  │
│ No V1 remnants              [  ]    Clean          FE Lead   │
│ Loading states              [  ]    All views      FE Beta   │
│ Auth integration            [  ]    All roles      FE Gamma  │
├──────────────────────────────────────────────────────────────┤
│ ALL PASS: [YES/NO]           Decision: [GO/NO-GO]            │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Gate 3: Agents Quality

**Timing:** End of Sprint 11 (Week 22)  
**Owner:** Agent Lead  
**Reviewers:** CTO, BE Lead, FE Lead, Security Lead

### Pass/Fail Criteria

| # | Criterion | Pass Condition | Fail Condition | How to Verify |
|---|-----------|---------------|----------------|---------------|
| 3.1 | All 49 agents deployed | `lemma agent list` returns 49 | < 46 or any critical agent missing | Automated inventory |
| 3.2 | Agent unit tests | 85%+ coverage | < 70% on any critical agent | Coverage per agent |
| 3.3 | Agent Q/A tests | 10 test cases per agent (functional, boundary, error) | > 1 failed per agent | Automated Q/A suite |
| 3.4 | Agent cascade | System→domain→sub-domain works end-to-end | Any cascade fails | Cascade E2E test |
| 3.5 | Context accuracy | Agent returns correct context for known scenarios | > 10% hallucination rate | Manual audit of 100 responses |
| 3.6 | Agent latency | p95 < 5s from request to response | > 10s | Load test (100 concurrent) |
| 3.7 | LLM gateway | Gateway handles caching, rate limiting, fallback | Gateway failure on 3+ scenarios | Gateway stress test |
| 3.8 | No duplicate agent logic | No two agents implement same business rule | Duplicate detected | Code review |
| 3.9 | Agent agent-safety | Agent refuses harmful/out-of-scope requests | Agent executes harmful action | Safety test suite |
| 3.10 | Agent event emissions | Every agent emits correct events for its domain actions | Missing/wrong event > 1 | Event log audit |
| 3.11 | Agent RLS integration | Agent respects user role for data access | Agent returns data beyond user role | Auth integration test |
| 3.12 | Agent rollback | Individual agent version can be rolled back independently | Rollback breaks cascade | Rollback test |

### Gate Check: Agent Reliability

**Pass Conditions:**
- [ ] System-orchestrator passes 20 scenario chain test
- [ ] Knowledge-gateway returns correct source documents for top 50 Q/A pairs
- [ ] All 12 core agents pass domain-specific proficiency test
- [ ] Hallucination rate < 5% measured by manual audit
- [ ] Agent conversation handoff: agent → human and back works in all scenarios
- [ ] Agent escalation: all 49 agents can escalate to human operator

### Cross-Cutting Concerns

- **Security:** Agents never expose system prompts or function internals; LLM gateway sanitizes all output
- **Observability:** Every agent decision is logged with reasoning trace for audit
- **Cost management:** LLM gateway enforces token budgets per agent per session; caching layer reduces duplicate LLM calls
- **Graceful degradation:** If LLM unavailable, agent falls back to rule-based response for critical paths
- **Versioning:** Every agent has version; prompts and tools are version-bound

### Quality Dashboard — Gate 3

```
┌──────────────────────────────────────────────────────────────┐
│ Gate 3: Agents Quality                                      │
├──────────────────────────────────────────────────────────────┤
│ Criterion                   Status   Coverage      Owner     │
├──────────────────────────────────────────────────────────────┤
│ 49 agents deployed          [  ]    49/49          Agent     │
│ Agent unit tests            [  ]    ≥85%           Agent     │
│ Agent Q/A tests             [  ]    490 tests      Agent     │
│ Agent cascade               [  ]    3 scenarios    Agent     │
│ Context accuracy            [  ]    ≥95%           Agent     │
│ Agent latency (p95)         [  ]    <5s            Agent     │
│ LLM gateway                 [  ]    All paths      Agent     │
│ No duplicate logic          [  ]    Clean          Agent     │
│ Agent safety                [  ]    Pass           Security  │
│ Event emissions             [  ]    49 agents      Agent     │
│ RLS integration             [  ]    All roles      BE        │
│ Agent rollback              [  ]    49 agents      Agent     │
├──────────────────────────────────────────────────────────────┤
│ ALL PASS: [YES/NO]           Decision: [GO/NO-GO]            │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Gate 4: Workflows Quality

**Timing:** End of Sprint 14 (Week 28)  
**Owner:** Workflow Lead  
**Reviewers:** CTO, Agent Lead, BE Lead, FE Lead

### Pass/Fail Criteria

| # | Criterion | Pass Condition | Fail Condition | How to Verify |
|---|-----------|---------------|----------------|---------------|
| 4.1 | All 33 workflows deployed | `lemma workflow list` returns 33 | < 30 or any critical workflow missing | Automated inventory |
| 4.2 | Workflow unit tests | 85%+ coverage | < 70% on any critical workflow | Coverage per workflow |
| 4.3 | Workflow smoke tests | 5 scenarios per workflow (happy, error, edge, rollback, timeout) | > 1 failed per workflow | Smoke test suite |
| 4.4 | Event-trigger verification | Every workflow triggers on correct event | Wrong event mapping > 1 | Event mapping audit |
| 4.5 | Full journey | ticket → dispatch → resolve → notify → bill → feedback | Any step fails | Journey E2E test |
| 4.6 | Workflow latency | Non-human steps < 30s p95 | > 60s | Performance test |
| 4.7 | Rollback procedure | Every workflow has tested rollback | Any workflow lacks rollback | Rollback test suite |
| 4.8 | No orphan workflows | Every workflow is referenced in at least one trigger path | Orphan workflow found | Dependency analysis |
| 4.9 | Workflow state persistence | State survives process restart | State lost on restart | Resilience test |
| 4.10 | Notification delivery | All notification-producing workflows deliver actual message | Delivery failure > 1% | Notification audit |
| 4.11 | Error notification | Failed workflows notify admin with full error context | No alert on failure | Error injection test |
| 4.12 | Workflow composition | Tier 0-1 → Tier 2-7 handoff works correctly | Handoff breaks any workflow chain | Composition E2E |

### Gate Check: Workflow Reliability

**Pass Conditions:**
- [ ] All 33 workflows pass 5-scenario smoke test suite (165 total tests)
- [ ] Full journey (ticket→dispatch→resolve→notify→bill→feedback) completes in < 5 min
- [ ] Workflow retry: transient failures auto-retry 3× with exponential backoff
- [ ] Workflow timeout: workflows that exceed max duration are killed and alerted
- [ ] Workflow idempotency: replaying same event does not duplicate side effects
- [ ] Workflow audit: every step logged with timestamp, actor, data delta

### Cross-Cutting Concerns

- **Resilience:** All workflows handle timeout, retry, and failure gracefully; no workflow blocks for > 30s on non-human steps
- **Observability:** Every workflow step emits an event for tracking; workflow traces available in monitoring dashboard
- **Testing:** Every workflow tested independently and as part of full journey chain
- **Safety:** Workflows verify state before destructive actions (e.g., cancel ticket: verify not already resolved)
- **Cost:** Workflow execution limits set per workflow type to prevent runaway executions

### Quality Dashboard — Gate 4

```
┌──────────────────────────────────────────────────────────────┐
│ Gate 4: Workflows Quality                                   │
├──────────────────────────────────────────────────────────────┤
│ Criterion                   Status   Coverage      Owner     │
├──────────────────────────────────────────────────────────────┤
│ 33 workflows deployed       [  ]    33/33          Workflow  │
│ Workflow unit tests         [  ]    ≥85%           Workflow  │
│ Smoke tests                 [  ]    165 tests      Workflow  │
│ Event-trigger verification  [  ]    33 triggers    Workflow  │
│ Full journey                [  ]    All steps      Workflow  │
│ Workflow latency            [  ]    <30s p95       Workflow  │
│ Rollback procedure          [  ]    33/33          Workflow  │
│ No orphan workflows         [  ]    Clean          Workflow  │
│ State persistence           [  ]    Pass           Platform  │
│ Notification delivery       [  ]    ≥99%           Workflow  │
│ Error notification          [  ]    All workflows  Workflow  │
│ Workflow composition        [  ]    All chains     Workflow  │
├──────────────────────────────────────────────────────────────┤
│ ALL PASS: [YES/NO]           Decision: [GO/NO-GO]            │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Gate 5: Integration Quality

**Timing:** End of Sprint 15 (Week 30)  
**Owner:** CTO  
**Reviewers:** All Leads, QA Lead

### Pass/Fail Criteria

| # | Criterion | Pass Condition | Fail Condition | How to Verify |
|---|-----------|---------------|----------------|---------------|
| 5.1 | All 10 apps + 53 functions + 49 agents + 33 workflows operational | End-to-end smoke test passes | Any component fails | Full stack smoke test |
| 5.2 | 3 full business journeys | support→dispatch→notify, customer→bill→feedback, admin→report→schedule | Any journey fails | E2E integration suite |
| 5.3 | Data consistency | Data written by one component readable by all others | Data inconsistency > 0 | Cross-component data audit |
| 5.4 | Event flow integrity | All events in chain produce expected outcomes | Event lost or misrouted | Event tracing audit |
| 5.5 | Notification pipeline | SMS, email, push all deliver with < 30s from trigger | > 1% delivery failure | Notification audit |
| 5.6 | V1/V2 data sync (if dual-write) | V1 and V2 tables consistent within 5s | > 10s lag or inconsistency | Dual-write comparison |
| 5.7 | Performance under load | 200 concurrent users, all components | SLA fails on any metric | Load test (200 users, 30 min) |
| 5.8 | Security scan | Zero critical, zero high findings | Any critical or high finding | DAST + SAST + dependency scan |
| 5.9 | Disaster recovery | Full recovery within 1h RTO | > 1h or data loss > 5 min | DR drill |
| 5.10 | Monitoring completeness | All components have alerts, dashboards, logs | Any component lacks monitoring | Monitoring inventory check |
| 5.11 | No orphan resources | Every table, function, app, agent, workflow has a known caller/consumer | Orphan found > 1 | Dependency graph analysis |
| 5.12 | No duplicated logic | No two components implement same business rule | Duplicate found > 1 | Cross-component review |

### Gate Check: Production Readiness

**Pass Conditions:**
- [ ] Full regression suite passes (all 7 gates combined)
- [ ] Load test: 200 concurrent users, 30 min sustained, no SLA violation
- [ ] Security: DAST + SAST + dependency scan: zero critical, zero high findings
- [ ] DR drill: full recovery in < 45 min (under 1h RTO)
- [ ] Monitoring dashboard: all 5 component types visible with health metrics
- [ ] Runbooks: all operational procedures documented and peer-reviewed
- [ ] Rollback: Tier 1-5 rollbacks tested in staging

### Cross-Cutting Concerns

- **Complete traceability:** Every request can be traced from app → function → agent → workflow → notification
- **Data integrity:** No data loss in any pipeline; all writes are verified
- **Operational readiness:** Runbooks documented, on-call rotation established, monitoring configured
- **V1 coexistence:** V1/V2 comparison matrix shows no regression; V1 remains available as fallback
- **Security posture:** Zero trust between components; every cross-component call authenticated

### Quality Dashboard — Gate 5

```
┌──────────────────────────────────────────────────────────────┐
│ Gate 5: Integration Quality                                 │
├──────────────────────────────────────────────────────────────┤
│ Criterion                   Status   Coverage      Owner     │
├──────────────────────────────────────────────────────────────┤
│ All components operational  [  ]    150/150        CTO       │
│ 3 business journeys         [  ]    3/3            CTO       │
│ Data consistency            [  ]    0 errors       BE Lead   │
│ Event flow integrity        [  ]    All chains     Platform  │
│ Notification pipeline       [  ]    ≥99%           BE Beta   │
│ V1/V2 data sync             [  ]    <5s lag        BE Lead   │
│ Performance (load test)     [  ]    200 users      Platform  │
│ Security scan               [  ]    Clean          Security  │
│ Disaster recovery           [  ]    <1h            Platform  │
│ Monitoring completeness     [  ]    All components Platform  │
│ No orphan resources         [  ]    Clean          CTO       │
│ No duplicated logic         [  ]    Clean          CTO       │
├──────────────────────────────────────────────────────────────┤
│ ALL PASS: [YES/NO]           Decision: [GO/NO-GO]            │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Gate 6: Production Quality

**Timing:** Post Sprint 15 (Week 30-32)  
**Owner:** CTO + VP Engineering  
**Reviewers:** CEO, All Leads, Security Lead, QA Lead

### Pass/Fail Criteria

| # | Criterion | Pass Condition | Fail Condition | How to Verify |
|---|-----------|---------------|----------------|---------------|
| 6.1 | Canary deploy (10% → 50% → 100%) | Each stage passes health checks for 30 min | Any stage fails | Automated canary |
| 6.2 | Production smoke test | All 150 components healthy | Any component unhealthy | Production health check |
| 6.3 | SLA: 99.9% uptime | Measured over 72h window | < 99.9% | Uptime monitoring |
| 6.4 | SLA: API p95 < 2s | Measured over 72h window | > 2s | API monitoring |
| 6.5 | SLA: Agent p95 < 5s | Measured over 72h window | > 5s | Agent monitoring |
| 6.6 | Zero P0/P1 production bugs | Bug tracker clean | Any P0/P1 open | Bug tracker audit |
| 6.7 | Security: zero critical/high | Scan report clean | Any finding > medium | Production security scan |
| 6.8 | V1 cutover at target % | Traffic at planned cutover % | < target | Traffic metrics |
| 6.9 | Rollback plan verified | Tier 1-5 documented and tested | Any tier untested | Rollback drill review |
| 6.10 | V1 decommission plan approved | Plan includes timeline, migration, archive | No plan or incomplete | Plan review |
| 6.11 | Runbooks complete | All ops tasks have runbooks | > 3 tasks without runbook | Runbook inventory |
| 6.12 | On-call established | Rotation schedule, escalation matrix, contact list | No schedule or gaps | HR review |

### Production Cutover Gate

The final go/no-go for production goes through 3 stages:

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

### Quality Dashboard — Gate 6

```
┌──────────────────────────────────────────────────────────────┐
│ Gate 6: Production Quality                                  │
├──────────────────────────────────────────────────────────────┤
│ Criterion                   Status   Coverage      Owner     │
├──────────────────────────────────────────────────────────────┤
│ Canary deploy               [  ]    10/50/100%     Platform  │
│ Production smoke test       [  ]    150/150        CTO       │
│ SLA: 99.9% uptime           [  ]    72h            Platform  │
│ SLA: API p95 < 2s           [  ]    72h            Platform  │
│ SLA: Agent p95 < 5s         [  ]    72h            Platform  │
│ Zero P0/P1 bugs             [  ]    Clean          QA        │
│ Security clean              [  ]    Clean          Security  │
│ V1 cutover at target %      [  ]    100%           CTO       │
│ Rollback plan verified      [  ]    Tier 1-5       CTO       │
│ V1 decommission plan        [  ]    Approved       CTO       │
│ Runbooks complete           [  ]    All tasks      Platform  │
│ On-call established         [  ]    Schedule set   HR        │
├──────────────────────────────────────────────────────────────┤
│ ALL PASS: [YES/NO]           Decision: [GO/CONDITIONAL/NO-GO]│
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Global Quality Rules

Rules that apply across ALL gates:

### 9.1 No Orphan Resources
Every resource must have at least one consumer. Before any gate closes, run the dependency graph analyzer to ensure no orphan:
- Table not queried by any function → fail
- Function not called by any app/agent/workflow → fail
- App not linked by any navigation → fail
- Agent not invoked by any workflow or interface → fail
- Workflow not triggered by any event → fail

### 9.2 No Duplicated Logic
Before any gate closes:
- All unique business logic implementations must be in functions (not apps, agents, or workflows)
- Apps only call functions and render UI
- Agents only orchestrate tools and manage conversation
- Workflows only orchestrate steps and manage state

### 9.3 No Missing Integrations
Before any gate closes:
- Every table has at least DET + WRI functions
- Every function is versioned and has OpenAPI spec
- Every app connects to its dependent functions
- Every agent connects to its domain functions
- Every workflow connects to its event triggers, functions, and agents

### 9.4 Security Baseline (All Gates)
- No secrets in source code
- No hardcoded credentials
- No unauthenticated API endpoints
- No SQL injection vectors (parameterized queries)
- No XSS vectors (output sanitization)
- No missing RLS on any table
- Rate limiting on all public endpoints

### 9.5 Observability Baseline (All Gates)
- Every function logs entry + exit + error with correlation ID
- Every app captures client-side errors with stack trace
- Every agent logs every decision with reasoning trace
- Every workflow logs every step with state delta
- Every notification logged with delivery status
- All logs shipped to centralized logging system

### 9.6 Testing Baseline (All Gates)
| Gate | Unit | Integration | E2E | Performance | Security |
|------|:----:|:-----------:|:---:|:-----------:|:--------:|
| 0    | 90%  | —           | —   | —           | —        |
| 1    | 90%  | 159 tests   | —   | ✓           | ✓        |
| 2    | 80%  | 10 suites   | 50  | Lighthouse  | ✓        |
| 3    | 85%  | 490 Q/A     | —   | 100 concur  | ✓        |
| 4    | 85%  | 33 suites   | 165 | 50 concur   | ✓        |
| 5    | —    | —           | 3   | 200 concur  | ✓        |
| 6    | —    | —           | all | 72h sustain | ✓        |

### 9.7 Gate Escalation
- If a gate review produces No-Go, the remediation sprint plan must be approved within 24h
- If 2 consecutive No-Go on the same gate, escalate to CEO for decision
- Skip-gate is not permitted under any circumstance
- Conditional Go requires written mitigation plan signed by affected leads

---

> **End of QUALITY_GATES.md**  
> Next document: PROJECT_ROADMAP.md
