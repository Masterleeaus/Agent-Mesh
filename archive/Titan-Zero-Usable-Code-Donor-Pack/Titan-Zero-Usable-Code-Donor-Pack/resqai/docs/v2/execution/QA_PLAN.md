# RESQAI V2 — Quality Assurance Plan

> Phase 3.5 — Execution Plan
> Chief Technical Program Manager
> Date: 2026-06-29

---

## Table of Contents

1. [QA Strategy Overview](#1-qa-strategy-overview)
2. [Unit Testing](#2-unit-testing)
3. [Integration Testing](#3-integration-testing)
4. [Workflow Testing](#4-workflow-testing)
5. [AI/Agent Testing](#5-aiagent-testing)
6. [Performance Testing](#6-performance-testing)
7. [Security Testing](#7-security-testing)
8. [Accessibility Testing](#8-accessibility-testing)
9. [Production Validation](#9-production-validation)
10. [QA Milestones](#10-qa-milestones)
11. [Test Automation Architecture](#11-test-automation-architecture)
12. [Defect Management](#12-defect-management)

---

## 1. QA Strategy Overview

### 1.1 Quality Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| Zero P0/P1 bugs at production | 0 | Bug tracker audit |
| 90%+ unit test coverage | ≥90% | Coverage report |
| 100% function integration pass rate | 100% | Integration suite |
| 100% workflow smoke test pass rate | 100% | Workflow smoke suite |
| Agent hallucination rate < 5% | <5% | Manual audit |
| API p95 latency < 500ms (simple) | <500ms | Load test |
| API p95 latency < 2s (complex) | <2s | Load test |
| Agent p95 latency < 5s | <5s | Load test |
| App load time p95 < 3s | <3s | Lighthouse |
| Lighthouse Performance ≥ 85 | ≥85 | Lighthouse CI |
| WCAG 2.1 AA compliance | Pass | axe + manual |
| Uptime SLA: 99.9% | 99.9% | Production monitoring |

### 1.2 Testing Pyramid

```
                    ┌───────┐
                    │  E2E  │  ← 50+ E2E journeys, 3 cross-app journeys
                   /│ Tests │\
                  / └───────┘ \
                 /      │       \
                /       │        \
               /  ┌───────────┐   \
              /   │Integration│    \
             /    │  Tests    │     \   ← 159 function tests, 10 app suites,
            /     └───────────┘      \     33 workflow suites, 490 agent Q/A
           /           │              \
          /            │               \
         /     ┌──────────────┐         \
        /      │   Unit Tests │          \  ← ALL components, 80-90% coverage
       /       └──────────────┘           \
      ──────────────────────────────────────
```

### 1.3 QA Team Structure

| Role | Count | Responsibility |
|------|:-----:|----------------|
| QA Lead | 1 | Overall QA strategy, gate reviews, defect triage |
| Test Automation Engineer | 3 | CI/CD test pipelines, automation framework, flaky test management |
| E2E Tester | 2 | E2E business journey testing, cross-app integration |
| Performance Engineer | 1 | Load testing, profiling, optimization validation |
| Security Tester | 1 | DAST/SAST, penetration testing, RLS audit |
| Accessibility Tester | 1 | WCAG compliance, screen reader testing |

---

## 2. Unit Testing

### 2.1 Scope

| Component Type | Coverage Target | Framework | Location |
|----------------|:--------------:|-----------|----------|
| Shared Packages | ≥90% | vitest | `packages/*_v2/__tests__/` |
| Functions (all 53) | ≥90% | pytest + vitest | `functions/*/tests/` |
| Applications (all 10) | ≥80% | vitest + React Testing Library | `apps/*_v2/src/**/*.test.ts` |
| Agents (all 49) | ≥85% | pytest | `agents/*/tests/` |
| Workflows (all 33) | ≥85% | lemma workflow test | `workflows/*/tests/` |

### 2.2 Unit Test Requirements

| Criterion | Rule |
|-----------|------|
| Edge cases | Test null/empty inputs, boundary values, invalid types |
| Error handling | Test each error code path, exception, timeout |
| State transitions | Test every valid and invalid state transition |
| Idempotency | Test that repeated calls produce same result |
| Pure functions | Mock all external dependencies (DB, events, LLM) |
| Coverage enforcement | CI pipeline fails if coverage drops below threshold |

### 2.3 Unit Test Execution

```
Frequency:   Every PR (CI pipeline)
Trigger:     git push to feature/* or dev branch
Tool:        vitest for TypeScript, pytest for Python
Report:      Coverage report published to PR comment
Gate:        Coverage threshold enforced in CI
```

---

## 3. Integration Testing

### 3.1 Function Integration Tests

| Test Type | Count | Description |
|-----------|:-----:|-------------|
| DET tests | 21 | 3 tests each × 7 functions |
| REA tests | 24 | 3 tests each × 8 functions |
| WRI tests | 66 | 3 tests each × 22 functions |
| AGG tests | 30 | 3 tests each × 10 functions |
| TRA tests | 3 | 3 tests × 1 function |
| ORC tests | 15 | 3 tests each × 5 functions |
| **Total** | **159** | **3 tests per function** |

**Test Scenarios (per function):**
1. **Happy path:** Valid input, expected output
2. **Error path:** Invalid input or state, verify error returned
3. **Edge case:** Boundary value, empty result, duplicate, concurrency

**WRI Verification Test:**
- Execute function → read back via DET/REA → verify data matches
- For event-emitting WRI: verify event schema matches EVENT_CATALOG.md

### 3.2 Connector Integration Tests

| Connector | Smoke Test | Rate Limit Test | Circuit Breaker Test | Fallback Test |
|-----------|:----------:|:---------------:|:--------------------:|:-------------:|
| SMTP | ✓ | ✓ | ✓ | ✓ |
| Twilio SMS | ✓ | ✓ | ✓ | ✓ |
| Discord Webhook | ✓ | ✓ | ✓ | ✓ |
| Slack | ✓ | ✓ | ✓ | ✓ |
| Gmail | ✓ | ✓ | ✓ | ✓ |
| Reddit | ✓ | ✓ | ✓ | ✓ |

### 3.3 Event Integration Tests

| Pattern | Test | Description |
|---------|------|-------------|
| Publish → Consume | ✓ | Emitter publishes event → subscriber receives within 1s |
| Schema validation | ✓ | Emitted event matches schema in EVENT_CATALOG.md |
| At-least-once | ✓ | Event delivered even if subscriber temporarily offline |
| Dead letter | ✓ | Failed events routed to DLQ after max retries |

---

## 4. Workflow Testing

### 4.1 Smoke Test Suite (165 tests: 33 workflows × 5 scenarios)

| Scenario | Description | Pass Criteria |
|----------|-------------|---------------|
| 1. Happy path | All steps succeed, expected final state | Workflow completes successfully |
| 2. Error path | A step fails, verify error handling | Workflow enters error state with alert |
| 3. Edge case | Boundary condition (empty data, max data, duplicate) | Workflow handles gracefully |
| 4. Rollback | Simulate failure mid-workflow | State restored to pre-workflow state |
| 5. Timeout | Step exceeds max duration | Workflow kills step, alerts, continues |

### 4.2 Cross-Workflow Tests

| Test | Description |
|------|-------------|
| Tier 0 → Tier 1 handoff | Auto-workflow completion triggers entry workflow |
| Parallel execution | Two workflows triggered by same event run concurrently |
| Workflow chain (3+) | Appointment → WO → Inventory → Notification |
| Cron collision | Two cron-triggered workflows at same time |

### 4.3 Idempotency Tests

| Test | Description |
|------|-------------|
| Replay event 2x | Same event published twice; verify no duplicate side effects |
| Recovery after crash | Workflow killed mid-execution; verify state recovery on restart |
| Duplicate prevention | Idempotency key prevents duplicate processing within TTL |

---

## 5. AI/Agent Testing

### 5.1 Agent Q/A Test Suite (490 tests: 49 agents × 10 each)

| Test Type | Count | Description |
|-----------|:-----:|-------------|
| Functional | 4 | Standard inputs, verify correct output structure and content |
| Boundary | 2 | Empty input, very long input, missing context |
| Error | 2 | Invalid input, out-of-scope request, missing permissions |
| Safety | 1 | Request harmful action; verify refusal |
| Latency | 1 | Measure end-to-end response time |

### 5.2 Hallucination Audit

| Metric | Target | Method |
|--------|:------:|--------|
| Hallucination rate | < 5% | Manual audit of 100 random responses per milestone |
| Factual accuracy | ≥ 95% | Cross-reference with known data (tickets, customers, technicians) |
| Schema compliance | 100% | Automated output schema validation |
| Refusal rate when out-of-scope | 100% | Automated out-of-scope request testing |

### 5.3 Agent Cascade Tests

| Cascade | Agents | Description |
|---------|--------|-------------|
| Executive → Support → Dispatch | 5 agents | Customer escalation chain |
| CRM → Retention → Followup | 4 agents | Account health → retention action |
| Analytics → Report → Distribution | 3 agents | Report generation → delivery |
| Knowledge → QA → Archive | 3 agents | Article lifecycle management |

### 5.4 Agent Permission Tests

| Test | Description |
|------|-------------|
| Role-based data access | Agent returns only data permitted by user role |
| Cross-role data isolation | Agent from role A cannot see role B's data |
| No privilege escalation | Agent cannot access data beyond caller's permissions |

---

## 6. Performance Testing

### 6.1 Load Test Specifications

| Parameter | Value |
|-----------|-------|
| Tool | k6 (or artillery.io) |
| Concurrent users | 200 |
| Duration | 30 minutes sustained |
| Ramp-up | 10 users/second |
| Think time | 1-3s random between actions |
| Data volume | 50K tickets, 30K appointments, 500K events |

### 6.2 Load Test Scenarios

| Scenario | Description | SLA |
|----------|-------------|:---:|
| Ticket creation + dispatch | 50 concurrent ticket creates with dispatch | All tickets dispatched in < 30s |
| Appointment booking | 50 concurrent appointment bookings | All booked in < 10s |
| Analytics queries | 50 concurrent report queries | All reports generate in < 10s |
| Notification burst | 100 concurrent notification sends | All delivered in < 30s |
| Agent session | 50 concurrent agent conversations | P95 < 5s response |
| Mixed workload | All scenarios combined (200 users) | No single SLA violation |

### 6.3 Performance Targets

| Metric | Target | Measurement |
|--------|:------:|-------------|
| API Response (simple) | p95 < 200ms | Function execution time |
| API Response (complex) | p95 < 2s | AGG/ORC function execution |
| App Load Time | p95 < 3s | Lighthouse Time to Interactive |
| JS Bundle Size | < 500KB gzipped | Build output size |
| Event Bus Throughput | 100 events/s | Events per second |
| Agent Response | p95 < 5s | End-to-end from request to response |
| Workflow Execution | p95 < 30s | Non-human step duration |
| Database Query | p95 < 100ms | EXPLAIN ANALYZE |
| Notification Delivery | < 30s from trigger | End-to-end delivery time |

---

## 7. Security Testing

### 7.1 Security Test Types

| Test Type | Tool | Frequency | Scope |
|-----------|------|-----------|-------|
| SAST (Static Analysis) | SonarQube, ESLint security plugin | Every PR | All source code |
| DAST (Dynamic Analysis) | OWASP ZAP | Every sprint | All apps + APIs |
| Dependency Scan | Snyk / npm audit | Every PR | All dependencies |
| Secret Scan | trufflehog / git-secrets | Every PR | No secrets in code |
| Penetration Test | Manual (external firm) | Phase 7 | Full system |

### 7.2 Security Test Areas

| Area | Tests | Target |
|------|-------|--------|
| Authentication | Session management, token validation, password policies | No unauthenticated access |
| Authorization | RLS enforcement, role-based access, API permissions | No privilege escalation |
| Input Validation | SQL injection, XSS, command injection, path traversal | No injection vectors |
| API Security | Rate limiting, CORS, CSRF, content-type validation | All endpoints secured |
| Data Protection | Encryption at rest, TLS in transit, PII handling | No data leaks |
| Audit Logging | All state-changing operations logged | Full audit trail |
| Connector Security | API key storage, OAuth token handling, credential rotation | No credential exposure |

### 7.3 RLS Validation Matrix

```
Role \ Table              admin  manager agent  tech   cust   read-only
────────────────────────────────────────────────────────────────────────
users_v2                  R/W    R       R      R      R      R
tickets_v2                R/W    R/W     R/W    -      own    R
appointments_v2           R/W    R/W     R/W    own    own    R
customers_v2              R/W    R/W     R      -      own    R
disputes_v2               R/W    R/W     -      -      own    R
technicians_v2            R/W    R/W     R/W    own    -      R
accounts_v2               R/W    R/W     R/W    -      own    R
notifications_v2          R/W    R/W     R/W    -      own    R
  
R = Read, W = Write, own = Own records only, - = No access
```

---

## 8. Accessibility Testing

### 8.1 Standards & Tools

| Standard | Version | Tool |
|----------|:-------:|------|
| WCAG | 2.1 AA | axe-core (automated) |
| Screen Reader | — | NVDA, VoiceOver (manual) |
| Color Contrast | AA (4.5:1 normal, 3:1 large) | axe + manual |
| Keyboard Navigation | Full operability | Manual testing |

### 8.2 Accessibility Test Scope

| Criterion | Test | Tool |
|-----------|------|------|
| Perceivable | Alt text, captions, adaptable content | axe |
| Operable | Keyboard-only, focus management, no flashing | Manual |
| Understandable | Readable text, predictable navigation, input assistance | axe + manual |
| Robust | Semantic HTML, ARIA roles, responsive zoom | axe + manual |

---

## 9. Production Validation

### 9.1 Canary Validation

| Stage | Duration | Validation |
|-------|:--------:|------------|
| 10% traffic | 72h | Monitor SLAs, error rates, latency. Rollback if ANY P0/P1 |
| 50% traffic | 1 week | Data consistency between V1/V2. Load test at 50% scale |
| 100% traffic | 30 days | V1 read-only fallback. Full monitoring. 30-day verification |

### 9.2 Production Monitoring Checks

| Check | Frequency | Alert |
|-------|:---------:|-------|
| Uptime health endpoint | 30s | PagerDuty if down > 1 min |
| API error rate | 1 min | PagerDuty if > 1% error rate |
| API latency p95 | 1 min | Email if > 2s for 5 min |
| Agent latency p95 | 1 min | Email if > 5s for 5 min |
| Database connection pool | 1 min | PagerDuty if > 80% used |
| Event bus throughput | 1 min | Email if events/s drops by 50% |
| Notification delivery rate | 5 min | Email if < 95% delivery rate |
| LLM API costs | 1 hour | Email if daily cost > budget |

### 9.3 Rollback Triggers

| Trigger | Action | Tier |
|---------|--------|:----:|
| Any P0 production bug | Rollback to previous version | 1 (instant) |
| P1 bug affecting > 5% of users | Rollback affected component | 2 (< 15 min) |
| Data integrity violation | Stop writes, restore from V1 | 3 (< 30 min) |
| Security vulnerability (critical) | Full rollback to V1 | 1 (instant) |
| SLA below 99.9% for 1h | Degrade non-critical features | 4 (< 2h) |
| Complete system failure | DNS switch to V1 | 1 (instant) |

---

## 10. QA Milestones

### Milestone QA-1: Foundation Quality (Week 4)

| Criterion | Target | Verification |
|-----------|:------:|-------------|
| Package coverage | ≥90% | Coverage report |
| Migration integrity | 41/41 tables | Schema verification |
| Event bus reliability | 3 test events | Pub/sub test |
| Auth completeness | All roles × all tables | Auth matrix test |

### Milestone QA-2: Function Quality (Week 12)

| Criterion | Target | Verification |
|-----------|:------:|-------------|
| Function coverage | ≥90% | Coverage report |
| Function integration | 159/159 pass | Integration suite |
| Connector smoke tests | 6/6 pass | Connector suite |
| Event integrity | All events match catalog | Schema validator |
| V1/V2 gap | 0 gaps | Comparison matrix |

### Milestone QA-3: App Quality (Week 18)

| Criterion | Target | Verification |
|-----------|:------:|-------------|
| FE coverage | ≥80% | Coverage report |
| E2E journeys | 50/50 pass | Playwright suite |
| Cross-app journeys | 3/3 pass | E2E suite |
| Lighthouse perf | ≥85 | Lighthouse CI |
| WCAG 2.1 AA | Pass | axe + manual |

### Milestone QA-4: Agent Quality (Week 24)

| Criterion | Target | Verification |
|-----------|:------:|-------------|
| Agent coverage | ≥85% | Coverage report |
| Agent Q/A tests | 490/490 pass | Agent harness |
| Hallucination rate | < 5% | Manual audit |
| Agent latency p95 | < 5s | Load test |
| Agent safety | 100% refusal | Safety suite |

### Milestone QA-5: Workflow Quality (Week 28)

| Criterion | Target | Verification |
|-----------|:------:|-------------|
| Workflow coverage | ≥85% | Coverage report |
| Workflow smoke tests | 165/165 pass | Smoke suite |
| Full journey E2E | 3/3 pass | E2E suite |
| Workflow latency | < 30s p95 | Performance test |
| Rollback coverage | 33/33 tested | Rollback suite |

### Milestone QA-6: Integration Quality (Week 30)

| Criterion | Target | Verification |
|-----------|:------:|-------------|
| All components operational | 150/150 | Smoke test |
| Load test (200 users) | No SLA violation | k6 test |
| Security scan | 0 critical, 0 high | DAST + SAST |
| DR drill | < 1h RTO | DR exercise |
| Monitoring complete | All components | Dashboard audit |

### Milestone QA-7: Production Quality (Week 32)

| Criterion | Target | Verification |
|-----------|:------:|-------------|
| Canary (10/50/100%) | All stages pass | Production health |
| SLA 99.9% uptime | 72h sustained | Monitoring |
| API p95 < 2s | 72h sustained | Monitoring |
| Agent p95 < 5s | 72h sustained | Monitoring |
| Zero P0/P1 bugs | 0 | Bug tracker |

---

## 11. Test Automation Architecture

### 11.1 CI/CD Integration

```
PR Created
  │
  ▼
[1] Lint + Typecheck ── Fail → Block PR
  │
  ▼
[2] Unit Tests + Coverage ── Fail → Block PR
  │
  ▼
[3] Build Check ── Fail → Block PR
  │
  ▼
[4] Secret Scan ── Fail → Block PR
  │
  ▼
[5] Dependency Scan ── Fail → Block PR (critical)
  │
  ▼
Merge to dev
  │
  ▼
[6] Integration Tests (parallel) ── Fail → Alert
  │
  ▼
[7] E2E Tests (parallel) ── Fail → Alert
  │
  ▼
Deploy to staging
  │
  ▼
[8] Full Regression Suite ── Fail → Rollback
```

### 11.2 Test Data Management

| Data Type | Source | Management |
|-----------|--------|------------|
| Unit test data | Inline/Factory | Generated per test; cleaned up after |
| Integration data | Seeded DB | Migration + seed scripts; reset per test run |
| E2E data | Dedicated test env | Isolated test environment; reset daily |
| Load test data | Synthetic generator | Scripted data generation for 50K+ records |
| Agent test data | Curated scenarios | Manual curation for 490 test cases |

### 11.3 Test Environment Strategy

| Environment | Purpose | Refresh | Data |
|-------------|---------|:-------:|------|
| Dev | Developer testing | Per-deploy | Minimal seed data |
| Staging | Integration + E2E | Daily | Anonymized prod-like data |
| Load Test | Performance | Per-run | Synthetic large dataset (50K+) |
| Production | Canary + Live | N/A | Real production data |

---

## 12. Defect Management

### 12.1 Severity Classification

| Severity | Definition | Response SLA | Fix SLA |
|:--------:|------------|:------------:|:-------:|
| P0 | System down, data loss, security breach | 15 min | 4 hours |
| P1 | Major feature broken, > 10% of users affected | 30 min | 24 hours |
| P2 | Feature broken but workaround exists | 2 hours | 1 week |
| P3 | Minor issue, cosmetic, non-blocking | 1 day | 2 weeks |
| P4 | Enhancement, nice-to-have | 1 week | Deferred |

### 12.2 Defect Escalation

```
P0/P1 Detected
  │
  ▼
PagerDuty Alert (auto)
  │
  ▼
On-Call Engineer Acknowledges (15 min)
  │
  ▼
Hotfix Branch (off main)
  │
  ▼
Fix → CI → Deploy to Staging → Verify
  │
  ▼
Deploy to Production (expedited)
  │
  ▼
Post-mortem within 24h
```

### 12.3 Defect Tracking

| Field | Required | Description |
|-------|:--------:|-------------|
| Title | ✓ | Clear description of the issue |
| Severity | ✓ | P0-P4 |
| Component | ✓ | App, Function, Agent, Workflow, Connector |
| Environment | ✓ | Dev, Staging, Production |
| Steps to reproduce | ✓ | Detailed reproduction steps |
| Expected vs Actual | ✓ | What should happen vs what happens |
| Screenshot/Log | | Supporting evidence |
| Stack trace | ✓ (for errors) | Full error stack |

---

> **End of QA_PLAN.md**
