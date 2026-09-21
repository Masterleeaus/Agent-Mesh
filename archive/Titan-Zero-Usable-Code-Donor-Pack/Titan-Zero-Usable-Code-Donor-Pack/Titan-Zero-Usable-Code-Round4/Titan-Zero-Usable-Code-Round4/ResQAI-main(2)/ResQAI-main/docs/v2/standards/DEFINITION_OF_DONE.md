# RESQAI V2 — Definition of Done

> Phase 2.1 — Engineering Standards  
> Chief Software Engineering Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Universal Done Criteria](#2-universal-done-criteria)
3. [Done by Component Type](#3-done-by-component-type)
4. [Done by Test Type](#4-done-by-test-type)
5. [Done by Gate](#5-done-by-gate)
6. [Documentation Requirements](#6-documentation-requirements)
7. [Security Requirements](#7-security-requirements)
8. [Performance Requirements](#8-performance-requirements)
9. [Accessibility Requirements](#9-accessibility-requirements)
10. [Integration Verification](#10-integration-verification)
11. [Definition of Ready](#11-definition-of-ready)
12. [Done Checklist Template](#12-done-checklist-template)

---

## 1. Purpose

Nothing is considered complete until the Definition of Done (DoD) is satisfied. The DoD is the contract between engineering and the project: a shared understanding of what "done" means.

The DoD applies to every task, story, feature, and release. No exceptions. Partial completion is not completion.

---

## 2. Universal Done Criteria

These criteria apply to **every single piece of work**, regardless of type or size.

### 2.1 Mandatory Checklist

```
□ 1. CODE — Code written, reviewed, and merged to develop
   □ All acceptance criteria met
   ├── Code follows ENGINEERING_GUIDE.md standards
   ├── Code reviewed by at least one peer
   └── All reviewer comments addressed

□ 2. TESTS — All tests pass and meet coverage targets
   ├── Unit tests pass (≥ 90% functions, ≥ 80% frontend)
   ├── Integration tests pass (where applicable)
   ├── E2E tests pass (where applicable)
   └── No flaky tests introduced

□ 3. DOCS — Documentation written and reviewed
   ├── README updated (if component has one)
   ├── API spec generated (functions)
   ├── Inline comments for non-obvious logic
   └── Architecture docs updated if interfaces changed

□ 4. SECURITY — Security review complete
   ├── No secrets in code
   ├── Dependency scan clean (no critical/high)
   ├── Input validation implemented
   ├── Auth/RLS verified (where applicable)
   └── SAST scan passes

□ 5. QUALITY — Quality checks pass
   ├── Lint passes (ESLint, ruff, Prettier)
   ├── Type check passes (TypeScript strict, mypy strict)
   ├── No console.log in production code
   └── No TODO without ticket reference

□ 6. CI/CD — CI pipeline green
   ├── All CI checks pass
   ├── Coverage meets or exceeds target
   ├── Build succeeds
   └── Deploy preview available (apps)

□ 7. OBSERVABILITY — Monitoring and logging complete
   ├── Structured logging implemented
   ├── Correlation ID propagated
   ├── Error states logged with context
   └── Metrics available (if applicable)
```

---

## 3. Done by Component Type

### 3.1 Table

```
□ Schema defined in up.sql and down.sql
□ Migration tested (apply + rollback)
□ Primary key, foreign keys, indexes defined
□ RLS policies written for all roles
□ Column comments documented in migration
□ Seed data provided (if lookup table)
□ Deployment verified in staging
```

### 3.2 Function

```
□ Function follows CODING_STANDARDS.md template
□ Input validation implemented
□ Auth check implemented (org_id from context)
□ Error handling covers all paths
□ Event emitted for create/update/delete actions
□ Idempotency supported (WRI functions)
□ Unit tests: ≥ 90% coverage, all scenarios
□ Integration test: create → read (WRI functions)
□ OpenAPI spec generated
□ Performance meets target (see BACKEND_GUIDELINES §7.1)
```

### 3.3 Application

```
□ All routes defined and navigable
□ All pages render loading, empty, error, success states
□ App connects to its dependent functions
□ Cross-app navigation works
□ Responsive at 375px, 768px, 1280px
□ WCAG 2.1 AA compliant
□ Lighthouse: Performance ≥ 85, A11y ≥ 90
□ Component tests: ≥ 80% coverage
□ E2E tests: 5 critical journeys
□ README documents app purpose, routes, dependencies
```

### 3.4 Agent

```
□ System prompt defined in prompts/system_prompt.txt
□ Context retrieval rules defined in prompts/context_rules.json
□ All domain tools registered
□ Intent classification tested (10 test queries)
□ Escalation triggers configured
□ Confidence thresholds configured
□ Fallback behavior implemented
□ Safety guardrails tested
□ Agent logged: correlation_id, confidence, tokens
□ Unit tests: ≥ 85% coverage
□ Q/A tests: 10 scenarios per agent
```

### 3.5 Workflow

```
□ Workflow defined with trigger, steps, error handling
□ Retry policy configured per tier
□ Approval policy configured (if required)
□ Compensating actions defined (Tier 2+)
□ Audit logging implemented
□ Dead letter queue configured
□ Unit tests: ≥ 85% coverage
□ Workflow tests: happy path + error + edge + rollback + timeout
□ README documents purpose, trigger, steps, dependencies
□ Integration test: full chain with real functions
```

### 3.6 Connector

```
□ Circuit breaker implemented (5 failures → open, 30s recovery)
□ Rate limiter implemented
□ Timeout configured per call type
□ Health check endpoint
□ All public methods emit events on success/failure
□ Configuration via environment variables
□ No hardcoded credentials
□ Unit tests: ≥ 90% coverage
```

### 3.7 Event

```
□ Event type follows naming convention
□ Event payload matches EVENT_CATALOG.md definition
□ Event schema validated
□ Event source documented
□ At-least-once delivery guaranteed
```

### 3.8 Notification

```
□ Template defined for each channel (email, SMS, in-app, push)
□ Template variables documented
□ Delivery tracking implemented
□ Failure logging with retry
□ Rate limiting per channel
□ Unsubscribe mechanism available
```

---

## 4. Done by Test Type

### 4.1 Unit Tests
- [ ] All unit tests pass (0 failures, 0 errors)
- [ ] Coverage meets target for the layer
- [ ] No tests skipped without documented reason
- [ ] Tests are deterministic (same result every run)

### 4.2 Integration Tests
- [ ] All integration tests pass
- [ ] Auth/RLS verified for all roles
- [ ] Cross-function chains verified
- [ ] Event emissions verified

### 4.3 E2E Tests
- [ ] Critical journeys pass (J1-J5)
- [ ] Non-critical journeys pass (J6-J8)
- [ ] Test data cleaned up after run
- [ ] Tests pass against staging deployment

### 4.4 Performance Tests
- [ ] API p95 latency within target
- [ ] Lighthouse scores meet thresholds
- [ ] Load test passes (200 users, 30 min)
- [ ] No performance regression > 10%

### 4.5 Security Tests
- [ ] SAST scan: zero critical, zero high
- [ ] Dependency scan: zero critical, zero high
- [ ] Secret scan: clean
- [ ] RLS verification: all roles tested

---

## 5. Done by Gate

See `QUALITY_GATES.md` for detailed gate-specific done criteria.

| Gate | Additional Done Criteria |
|:----:|-------------------------|
| G0 | All tables deployed, event bus operational, auth configured, CI/CD green |
| G1 | 53 functions deployed, 6 connectors integrated, 90%+ coverage, V1/V2 gap closed |
| G2 | 10 apps deployed, 3 cross-app journeys pass, a11y compliant, Lighthouse ≥ 85 |
| G3 | 49 agents deployed, hallucination < 5%, cascade works, latency < 5s p95 |
| G4 | 33 workflows deployed, full journey passes, rollback tested, audit logging verified |
| G5 | All 150 components integrated, DR tested < 1h RTO, security scan clean |
| G6 | Canary 10/50/100% passes, SLA 99.9% for 72h, zero P0/P1, production security clean |

---

## 6. Documentation Requirements

### 6.1 Required Documentation Per Component

| Component | Required Docs | Location |
|-----------|---------------|----------|
| Table | Migration SQL (up/down), RLS policy, seed data | `backend/tables/migrations/{id}/` |
| Function | Inline docstring, OpenAPI spec | `backend/functions/{domain}/{name}/` |
| App | README.md | `apps/{name}/README.md` |
| Agent | README.md, system_prompt.txt, context_rules.json | `backend/agents/{domain}/{name}/` |
| Workflow | README.md | `backend/workflows/{tier}/{name}/README.md` |
| Connector | README.md | `backend/functions/v2_connectors/{name}/README.md` |

### 6.2 Readme Template

Every README must cover:
1. **Purpose** — What this component does (one paragraph)
2. **Usage** — How to use this component (input/output)
3. **Dependencies** — Tables, functions, other components this depends on
4. **Events** — Events consumed and emitted
5. **Configuration** — Environment variables, feature flags
6. **Testing** — How to run tests, test data requirements
7. **Troubleshooting** — Common issues and solutions

### 6.3 Architecture Documentation Updates

If implementation changes any interface defined in Phase 1.x architecture docs, those docs must be updated as part of the PR.

---

## 7. Security Requirements

### 7.1 Mandatory Security Checks

```
□ All user inputs validated (type, length, format, range)
□ No SQL injection vectors (parameterized queries only)
□ No HTML injection vectors (output sanitized)
□ All API endpoints authenticated (JWT required)
└── Except: login, health check, webhook (documented exceptions)
□ All data access authorized (RLS enforced)
□ No secrets in source code (trufflehog verified)
□ No hardcoded credentials
□ Rate limiting implemented on all endpoints
□ CORS configured per origin whitelist
□ HTTP security headers set (CSP, HSTS, X-Frame-Options)
```

### 7.2 Data Protection
- PII is never logged in plain text
- PII is masked/minimized in agent responses
- Data in transit: TLS 1.3 minimum
- Data at rest: encrypted (RDS/Aurora default encryption)

---

## 8. Performance Requirements

### 8.1 Performance Budgets

| Metric | Budget | Measurement |
|--------|:------:|-------------|
| API (simple read) | < 100ms p95 | Function invocation |
| API (complex read) | < 300ms p95 | Function invocation |
| API (write) | < 200ms p95 | Function invocation |
| API (aggregate) | < 2s p95 | Function invocation |
| Page load (initial) | < 3s p95 | Lighthouse |
| Page load (subsequent) | < 1s p95 | Lighthouse |
| Agent response | < 5s p95 | Agent invocation |
| Workflow step | < 30s p95 (non-human) | Workflow execution |
| Bundle size (app) | < 500KB gzipped | Vite build |
| Bundle size (package) | < 200KB gzipped | Vite build |

### 8.2 Performance Regression Rule
Any change that degrades performance by > 10% on any metric is blocked. Optimizations to compensate must be part of the same PR.

---

## 9. Accessibility Requirements

### 9.1 WCAG 2.1 AA Compliance Checks

```
□ All images have alt text (meaningful or decorative="")
□ All form inputs have associated labels
□ Color contrast ≥ 4.5:1 (normal text), ≥ 3:1 (large text)
□ All functionality available via keyboard
□ Focus indicators visible (focus:ring)
□ Focus order matches visual order
□ ARIA landmarks used for page structure (header, nav, main, footer)
□ Dynamic content changes announced via aria-live
□ Error messages linked to inputs via aria-describedby
□ Touch targets ≥ 44×44px
□ No auto-play video/audio
□ Skip-to-content link available
□ Heading hierarchy: one h1, sequential h2-h6
□ PDF documents have text layer (accessible)
```

### 9.2 Accessibility Testing
- Automated: axe-core runs as part of CI
- Manual: Keyboard-only navigation test
- Screen reader: NVDA (Windows) or VoiceOver (Mac)

---

## 10. Integration Verification

### 10.1 Integration Verification Rules

Before marking any component as done, verify:
- It connects to all declared dependencies
- Depended-on components exist in the same environment
- Data flows correctly through all connected paths
- Error propagation works (failure in dependency → handled by consumer)
- Events reach all subscribed consumers

### 10.2 Integration Test Matrix

| Component | Connects To | Verification |
|-----------|-------------|-------------|
| Function A | Table X | Write → Read → Verify |
| App A | Function A, B | Call functions → display data |
| Agent A | Function C, D | Call functions → return result |
| Workflow A | Function E, Agent B | Trigger → execute steps → complete |
| Connector A | External API | Send request → receive response → parse |

---

## 11. Definition of Ready

### 11.1 When is Work "Ready to Start"?

Before work starts, it must satisfy the Definition of Ready:

```
□ Clear acceptance criteria written
□ Dependencies identified and available
□ Interface contracts defined (types, events, function signatures)
□ Mock data available (for frontend parallel work)
□ Effort estimated (story points or time)
□ Team capacity confirmed
□ No blockers identified
```

### 11.2 Ready vs Done

```
Ready                         →          Done
─────────────────────────────────────────────────────
Has acceptance criteria       →     Acceptance criteria met
Dependencies identified       →     Dependencies integrated
Interface contracts agreed    →     Interface contracts implemented
Effort estimated              →     Effort tracked and closed
Team capacity confirmed       →     Delivered within expected timeline
No blockers identified        →     All blockers resolved
```

---

## 12. Done Checklist Template

Copy this into every PR description:

```
## Definition of Done

### Code
- [ ] Code follows engineering standards
- [ ] Code reviewed and approved
- [ ] All acceptance criteria met

### Tests
- [ ] Unit tests: ___% coverage (target: ≥ 80/90)
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] No flaky tests introduced

### Documentation
- [ ] README updated
- [ ] API spec generated (functions)
- [ ] Architecture docs updated (if interfaces changed)

### Security
- [ ] No secrets in code
- [ ] Dependency scan clean
- [ ] Input validation implemented
- [ ] Auth/RLS verified

### Quality
- [ ] Lint passes
- [ ] Type check passes
- [ ] CI pipeline green

### Performance
- [ ] Performance within budget (see §8.1)
- [ ] No performance regression > 10%

### Accessibility (frontend only)
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation verified
- [ ] Screen reader tested

### Integration
- [ ] Connected to all declared dependencies
- [ ] Data flow verified end-to-end
- [ ] Events reach all subscribers

### Sign-off
- [ ] Author: {{ name }}
- [ ] Reviewer: {{ name }}
- [ ] Gate: {{ G0/G1/G2/G3/G4/G5/G6 }}
```

---

> **End of DEFINITION_OF_DONE.md**  
> This completes all 10 Phase 2.1 engineering standards documents.
