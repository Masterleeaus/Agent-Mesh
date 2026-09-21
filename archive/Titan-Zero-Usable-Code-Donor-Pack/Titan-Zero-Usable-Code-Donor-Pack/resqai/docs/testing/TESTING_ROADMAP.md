# ResQAI Testing Roadmap

Generated: 2026-06-28
Scope: All `.ts`, `.tsx`, `.py` source files, test files, CI config, fixtures
Mode: **Read-Only Audit — No Test Generation, Planning Only**

---

## Table of Contents

1. [Testing Coverage Report](#1-testing-coverage-report)
2. [Priority Matrix](#2-priority-matrix)
3. [Testing Roadmap](#3-testing-roadmap)

---

## 1. Testing Coverage Report

### 1.1 Overall Coverage Metrics

| Layer | Source Files | Source Lines | Test Files | Test Lines | Coverage Est. | Status |
|-------|-------------|-------------|------------|------------|---------------|--------|
| **Apps (TypeScript)** | 67 | 2,981 | 2 | 143 | **~5%** | Critical gap |
| **Packages (TS/TSX)** | 28 | 1,237 | 0 | 0 | **0%** | Critical gap |
| **Functions (Python)** | 21 | 674 | 10 | 437 | **~65%** | Partial |
| **Scripts (TypeScript)** | 6 | ~120 | 0 | 0 | **0%** | Low priority |
| **Total** | **122** | **~5,012** | **12** | **580** | **~12%** | **Needs investment** |

---

### 1.2 Application Test Coverage (TypeScript)

#### By App

| App | Source Files | Source Lines | Test Files | Test Lines | Coverage |
|-----|-------------|-------------|------------|------------|----------|
| `support-queue` | 11 | 775 | 2 (test + setup) | 143 | **~12%** — service layer only |
| `crm-tracker` | 12 | 1,048 | 0 | 0 | **0%** |
| `ops-dashboard` | 12 | 840 | 0 | 0 | **0%** |
| `appointment-board` | 13 | 1,144 | 0 | 0 | **0%** |
| `resolution-center` | 12 | 912 | 0 | 0 | **0%** |
| **Total** | **60** | **4,719** | **2** | **143** | **~3% of app code** |

#### By Test Type

| Test Type | support-queue | crm-tracker | ops-dashboard | appointment-board | resolution-center |
|-----------|:------------:|:-----------:|:-------------:|:-----------------:|:-----------------:|
| **Unit tests** | ✅ Service layer (7 fns) | ❌ | ❌ | ❌ | ❌ |
| **Component tests** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Hook tests** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Page/Integration tests** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **E2E tests** | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Coverage Detail — support-queue (only tested app)

| Source Module | Lines | Tested? | Coverage |
|-------------|-------|---------|----------|
| `services/ticket-service.ts` | 65 | ✅ 7 functions tested | ~100% of service layer |
| `hooks/useTickets.ts` | 62 | ❌ | 0% |
| `components/TicketList.tsx` | 100 | ❌ | 0% |
| `components/TicketDetail.tsx` | 249 | ❌ | 0% |
| `components/FilterBar.tsx` | 48 | ❌ | 0% |
| `pages/SupportQueuePage.tsx` | 98 | ❌ | 0% |
| `state/atoms.ts` | 30 | ❌ | 0% |
| `App.tsx` | 75 | ❌ | 0% |
| `types/index.ts` | 1 | N/A | Type-only |

---

### 1.3 Package Test Coverage (TypeScript)

| Package | Files | Source Lines | Test Files | Coverage | Risk |
|---------|-------|-------------|------------|----------|------|
| `sdk/lemma-sdk.ts` | 1 | 94 | 0 | **0%** | **High** — all apps depend on this |
| `config/` | 6 | 287 | 0 | **0%** | Medium — constants/config |
| `ui/` | 13 | 436 | 0 | **0%** | Medium — shared components |
| `utils/` | 7 | 173 | 0 | **0%** | **High** — used across all apps |
| `types/` | 1 | 167 | 0 | N/A | Type-only (compiler-checked) |

---

### 1.4 Function Test Coverage (Python)

#### By Function — Lines of Source vs. Test

| Function | Src Lines | Test Lines | Has Real Tests? | Test Coverage Est. |
|----------|----------|------------|-----------------|-------------------|
| `account-health-scan` | 256 | 219 | ✅ **Yes** — 7 classes, ~30 tests | ~80% (logic tested) |
| `flag-slipping-followups` | 180 | 197 | ✅ **Yes** — 4 classes, ~25 tests | ~85% (logic tested) |
| `check-ticket-urgency` | 22 | 16 | ✅ **Basic** — 3 smoke tests | ~60% (edge cases missed) |
| `update-ticket-record` | 70 | 10 | ✅ **Basic** — 2 smoke tests | ~30% (no error cases) |
| `assign-appointment-technician` | 53 | 1 | ❌ **Placeholder** (`pass`) | **0%** |
| `collect-resolved-tickets` | 73 | 1 | ❌ **Placeholder** (`pass`) | **0%** |
| `finalize-dispatch` | 68 | 1 | ❌ **Placeholder** (`pass`) | **0%** |
| `finalize-slippage-review` | 69 | 1 | ❌ **Placeholder** (`pass`) | **0%** |
| `resolve-dispute` | 112 | 1 | ❌ **Placeholder** (`pass`) | **0%** |
| `update-account-health-status` | 63 | 1 | ❌ **Placeholder** (`pass`) | **0%** |
| `shared/` | 30 | 0 | ❌ **No tests** | **0%** |
| **Total** | **996** | **449** | **4 of 11 have real tests** | **~45%** |

#### By Test Quality

| Function | Assertions | Edge Cases | Mocks | Error Handling |
|----------|-----------|------------|-------|---------------|
| `account-health-scan` | 50+ | ✅ Date, null, empty, boundary | None needed (pure logic) | ✅ Invalid input tested |
| `flag-slipping-followups` | 40+ | ✅ Overdue, urgent, mixed | None needed (pure logic) | Partial |
| `check-ticket-urgency` | 6 | ❌ Missing — only happy path | None needed | ❌ |
| `update-ticket-record` | 4 | ❌ Missing — only basics | None needed | ❌ |

---

### 1.5 Workflow Test Coverage

| Workflow | Defined In | Automated Tests | Coverage |
|----------|-----------|----------------|----------|
| `ticket-intake` | `workflows/ticket-intake/` | ❌ | 0% |
| `dispute-resolution` | `workflows/dispute-resolution/` | ❌ | 0% |
| `account-health` | `workflows/account-health/` | ❌ | 0% |
| `account-health-monitoring` | `workflows/account-health-monitoring/` | ❌ | 0% |
| `appointment-assignment` | `workflows/appointment-assignment/` | ❌ | 0% |
| `appointment-reminders` | `workflows/appointment-reminders/` | ❌ | 0% |
| `customer-satisfaction-monitor` | `workflows/customer-satisfaction-monitor/` | ❌ | 0% |
| `daily-standup` | `workflows/daily-standup/` | ❌ | 0% |
| `followup-slippage-detector` | `workflows/followup-slippage-detector/` | ❌ | 0% |
| `support-escalation-manager` | `workflows/support-escalation-manager/` | ❌ | 0% |
| `urgent-dispatch` | `workflows/urgent-dispatch/` | ❌ | 0% |

**Total workflow test coverage: 0%** — 11 workflows defined, 0 automated tests.

---

### 1.6 CI/CD Analysis

| CI Feature | Status | Details |
|-----------|--------|---------|
| **Platform** | ✅ GitHub Actions | `.github/workflows/ci.yml` |
| **Trigger** | Push/PR to `main` | ✅ |
| **Node setup** | ✅ v22 with npm cache | |
| **Python setup** | ✅ 3.13 | |
| **TS type-check** | ✅ Root + all 5 apps | |
| **App tests** | ✅ Runs `npx tsx scripts/test.ts` | Only tests support-queue + 2 functions |
| **Function tests** | ⚠️ Partial | Only account-health-scan + flag-slipping-followups in CI |
| **Missing function tests** | ❌ | 6 placeholder functions never execute |
| **Package tests** | ❌ | 0 package tests in CI |
| **Coverage reporting** | ❌ | No coverage tool configured |
| **Coverage thresholds** | ❌ | No minimum coverage enforcement |
| **Linting** | ❌ | No ESLint or Ruff in CI |
| **Build** | ✅ Builds all apps | |
| **Dependency audit** | ❌ | No `npm audit` or safety check |
| **Artifacts** | ❌ | No build artifact upload |

---

### 1.7 Mock & Fixture Audit

| Fixture | Location | Used By | Status |
|---------|---------|---------|--------|
| `test_ticket.json` | `tests/fixtures/` | Unknown | ⚠️ Orphaned (no active consumer) |
| `test_ticket2.json` | `tests/fixtures/` | Unknown | ⚠️ Orphaned |
| `test_ticket3.json` | `tests/fixtures/` | Unknown | ⚠️ Orphaned |
| `test_fn_urgency.json` | `tests/fixtures/` | Unknown | ⚠️ Orphaned |
| `test_fn_update.json` | `tests/fixtures/` | Unknown | ⚠️ Orphaned |
| `agent_test_input.json` | `tests/fixtures/` | Unknown | ⚠️ Orphaned |
| `run_input.json` | `tests/fixtures/` | Unknown | ⚠️ Orphaned |
| `check_urgency_fn.json` | `tests/fixtures/` | Unknown | ⚠️ Orphaned |
| `update_ticket_fn.json` | `tests/fixtures/` | Unknown | ⚠️ Orphaned |
| `update_perms.json` | `tests/fixtures/` | Unknown | ⚠️ Orphaned |
| `workflow_graph.json` | `tests/fixtures/` | Unknown | ⚠️ Orphaned |
| `setup.ts` mock | `apps/support-queue/tests/setup.ts` | ticket-service.test.ts | ✅ Active |

**All 11 fixtures in `tests/fixtures/` appear orphaned** — no active test file references them. They are either leftover from a previous test framework or intended for future use.

---

## 2. Priority Matrix

### 2.1 Severity × Urgency Matrix

| Priority | Area | Justification |
|----------|------|---------------|
| **P0 — Critical** | SDK (`packages/sdk/lemma-sdk.ts`) | **0% coverage.** Every app imports this. A break here breaks everything. |
| **P0 — Critical** | Utils (`packages/utils/`) | **0% coverage.** Pure functions (date, sort, filter, format) — trivial to test, high ROI. |
| **P0 — Critical** | 6 placeholder functions | **Placeholder tests** (`pass` statements) are worse than no test — they create false CI confidence. |
| **P1 — High** | 4 untested apps (crm-tracker, ops-dashboard, appointment-board, resolution-center) | **0% coverage.** Service layers are pure logic — easy to add tests. |
| **P1 — High** | Workflow tests (11 workflows) | **0% coverage.** Workflows orchestrate the entire platform. No validation they work. |
| **P1 — High** | Integration tests (cross-app) | **0% coverage.** No tests verify agents talk to functions, functions update tables correctly. |
| **P2 — Medium** | UI package (`packages/ui/`) | **0% coverage.** 13 shared components used across all apps. |
| **P2 — Medium** | Orphaned fixtures | 11 stale JSON files with no test consumer. Either clean up or adopt. |
| **P2 — Medium** | CI coverage reporting | No `vitest --coverage` or `pytest --cov` in CI. No quality gates. |
| **P3 — Low** | Config package (`packages/config/`) | Static constants — low risk of logic bugs. |
| **P3 — Low** | Types package (`packages/types/`) | Compiler-checked interfaces. |
| **P3 — Low** | Scripts (`scripts/`) | Thin wrappers around shell commands. |

### 2.2 Risk-Adjusted Priority

```
HIGHEST IMPACT ──────────────────────────────────────────► LOWEST IMPACT
                                                       
  P0: SDK        P1: 4 untested    P1: Workflow     P2: UI        P3: Config
       +              apps          integration      Components     + Types
  Utils             service layer                                  
       +                                                         
  6 placeholder                                                   
  functions                                                       
```

```
LOWEST EFFORT ──────────────────────────────────────────► HIGHEST EFFORT

  P0: Utils     P0: Placeholder   P1: App service    P2: UI       P1: Workflow
  (pure fns)    (replace pass)    layer tests        Components   integration
       +                                                   
  P0: SDK fix                                                
```

---

## 3. Testing Roadmap

### Phase 1: Patch Placeholder Functions (Estimated: 2 days)

**Goal:** Replace 6 `pass`-statement test files with real smoke tests.

| Task | Files | Effort | Details |
|------|-------|--------|---------|
| 1.1 | `assign-appointment-technician` | 2 hr | Test `handle()` with valid input, missing fields, idempotent re-runs |
| 1.2 | `collect-resolved-tickets` | 2 hr | Test date filtering, empty results, pagination |
| 1.3 | `finalize-dispatch` | 2 hr | Test ticket status update, audit log write, idempotency |
| 1.4 | `finalize-slippage-review` | 2 hr | Test audit log entry creation, no side effects |
| 1.5 | `resolve-dispute` | 3 hr | Test dispute status transition, ticket update, connector calls |
| 1.6 | `update-account-health-status` | 2 hr | Test health status transitions, task creation, audit log |
| 1.7 | Update CI to run all 10 function tests | 1 hr | Modify `scripts/test.ts` to iterate all functions |
| 1.8 | Add `pytest-cov` to CI | 1 hr | `pip install pytest-cov`, `--cov=src --cov-report=term` |

**Deliverable:** 10/10 functions with real tests. CI runs all function tests.

---

### Phase 2: SDK + Utils Unit Tests (Estimated: 3 days)

**Goal:** Achieve 80%+ coverage on shared library code.

| Task | Files | Effort | Details |
|------|-------|--------|---------|
| 2.1 | `packages/utils/date.ts` | 4 hr | Test `formatDate`, `daysUntil`, `daysOverdue`, `isOverdue`, `formatRelativeDate`, `daysSince`, `isToday`, `age` — pure functions, 100% coverage target |
| 2.2 | `packages/utils/sorting.ts` | 3 hr | Test `sortByDate`, `sortByPriority`, `sortByStatus` — edge cases: empty, single, mixed |
| 2.3 | `packages/utils/filtering.ts` | 2 hr | Test `filterByStatus`, `filterBySearch` — case sensitivity, partial matches |
| 2.4 | `packages/utils/number.ts` | 1 hr | Test `formatCurrency`, `formatPercent` — locale, edge values |
| 2.5 | `packages/utils/string.ts` | 1 hr | Test `capitalize`, `snakeToTitle`, `truncate` |
| 2.6 | `packages/utils/service-helpers.ts` | 2 hr | Test `parseAgentResponse`, `errorMessage` |
| 2.7 | `packages/sdk/lemma-sdk.ts` | 8 hr | Mock Lemma HTTP client. Test `listRecords`, `getRecord`, `createRecord`, `updateRecord`, `runAgent`, `waitForAgentResponse`, `runFunction`, `logOperation`, `runConnectorOperation` — auth errors, network retries, edge cases |

**Deliverable:** SDK + Utils test suite with ~80%+ line coverage.

---

### Phase 3: App Service Layer Tests (Estimated: 5 days)

**Goal:** All 5 apps have service layer tests like `support-queue`.

| Task | App | Effort | Details |
|------|-----|--------|---------|
| 3.1 | `crm-tracker` | 8 hr | Test `crm-service.ts`: `fetchAccounts`, `fetchFollowups`, `fetchCustomers`, `runAccountHealthScan`, `runFlagSlippingFollowups`, `sendDiscordAlert`, `runFullHealthScan`, `refreshAll` |
| 3.2 | `ops-dashboard` | 4 hr | Test `dashboard-service.ts`: `fetchDashboardData`, `runCoordinator`, `fetchOperationsLog` |
| 3.3 | `appointment-board` | 6 hr | Test `appointment-service.ts`: `fetchAppointments`, `fetchCustomers`, `fetchTechnicians`, `updateAppointmentStatus`, `assignTechnician`, `suggestTechnician` |
| 3.4 | `resolution-center` | 8 hr | Test `dispute-service.ts`: `fetchDisputes`, `fetchAppointments`, `fetchCustomers`, `analyzeDispute`, `approveResolution`, `rejectDispute`, `closeDispute`, `overrideResolution` |
| 3.5 | `support-queue` | 4 hr | Expand existing tests: add error case tests for `classifyTicket`, `draftReply` |

**Deliverable:** All 5 apps have service-layer tests. 80%+ coverage of service modules.

---

### Phase 4: Component + Hook Tests (Estimated: 5 days)

**Goal:** Shared UI components and app hooks have basic rendering and interaction tests.

| Task | Package/App | Effort | Details |
|------|------------|--------|---------|
| 4.1 | `packages/ui/` — 13 components | 16 hr | Test each component: renders, accepts props, handles edge cases (empty, loading, error states). Use `@testing-library/react`. |
| 4.2 | All 5 app hooks | 12 hr | Test `useTickets`, `useCrm`, `useDashboard`, `useAppointments`, `useDisputes` — state transitions, data fetching, refresh, error handling |
| 4.3 | `state/atoms.ts` (5 apps) | 4 hr | Test context providers render children, context consumers throw without provider |

**Deliverable:** UI component library + all hooks have basic rendering tests.

---

### Phase 5: Integration + Workflow Tests (Estimated: 8 days)

**Goal:** End-to-end validation of critical workflows.

| Task | Tests | Effort | Details |
|------|-------|--------|---------|
| 5.1 | **Ticket Intake flow** | 3 days | Test: create ticket → classify → draft reply → approve → mark sent → close. Mock SDK calls, verify state transitions. |
| 5.2 | **Dispute Resolution flow** | 2 days | Test: create dispute → analyze → recommend → approve/reject → close. |
| 5.3 | **Health Monitoring flow** | 2 days | Test: run health scan → flag slipping followups → create tasks → update account status. |
| 5.4 | **Urgent Dispatch flow** | 1 day | Test: classify urgent → skip ops coordination → dispatch → notify. |

**Deliverable:** 4 end-to-end workflow integration tests covering the main platform flows.

---

### Phase 6: CI Hardening (Estimated: 2 days)

**Goal:** CI enforces quality gates.

| Task | Effort | Details |
|------|--------|---------|
| 6.1 | Add coverage reporting | 4 hr | Configure `vitest --coverage` with `@vitest/coverage-v8` and `pytest --cov`. Add `--cov-fail-under=70`. |
| 6.2 | Add linting | 4 hr | Add ESLint for TypeScript + Ruff for Python. Block on lint errors. |
| 6.3 | Add dependency audit | 2 hr | Add `npm audit` step (non-blocking initially, then enforce after fixes). |
| 6.4 | Clean up orphaned fixtures | 2 hr | Audit `tests/fixtures/` — move active fixtures to per-test dirs, archive the rest. |
| 6.5 | Parallelize CI | 4 hr | Split type-check + lint + app tests + function tests into parallel jobs. |

**Deliverable:** CI with coverage gates, lint enforcement, and parallel execution.

---

### Phase 7: Ongoing (Estimated: 1 day per sprint)

| Task | Frequency | Details |
|------|-----------|---------|
| Test new functions | Per function | Add smoke tests when creating new Python functions |
| Test new services | Per service | Add service tests when creating new app service modules |
| Update coverage baseline | Per sprint | Review coverage reports, address regressions |
| Add page-level tests | Per page | Prioritize high-traffic pages (support-queue, ops-dashboard) |

---

## Appendix A: Current Test Inventory

| Test File | Lines | Type | Quality | CI? |
|-----------|-------|------|---------|-----|
| `apps/support-queue/tests/ticket-service.test.ts` | 115 | **Unit** — service | 7 describe blocks, 9 assertions, good mocks | ✅ |
| `apps/support-queue/tests/setup.ts` | 28 | **Setup** — mock client | Comprehensive LemmaClient mock | ✅ |
| `functions/account-health-scan/tests/test_logic.py` | 219 | **Unit** — pure logic | 7 test classes, 50+ assertions, edge cases | ✅ |
| `functions/flag-slipping-followups/tests/test_logic.py` | 174 | **Unit** — pure logic | 4 test classes, 40+ assertions, edge cases | ✅ |
| `functions/check-ticket-urgency/tests/test_logic.py` | 16 | **Smoke** — 3 basic tests | Minimal assertions, happy path only | ❌ (not in CI script) |
| `functions/update-ticket-record/tests/test_logic.py` | 10 | **Smoke** — 2 basic tests | Minimal assertions, happy path only | ❌ |
| `functions/assign-appointment-technician/tests/test_handler.py` | 1 | **Placeholder** — `pass` | No real tests | ❌ |
| `functions/collect-resolved-tickets/tests/test_handler.py` | 1 | **Placeholder** — `pass` | No real tests | ❌ |
| `functions/finalize-dispatch/tests/test_handler.py` | 1 | **Placeholder** — `pass` | No real tests | ❌ |
| `functions/finalize-slippage-review/tests/test_handler.py` | 1 | **Placeholder** — `pass` | No real tests | ❌ |
| `functions/resolve-dispute/tests/test_handler.py` | 1 | **Placeholder** — `pass` | No real tests | ❌ |
| `functions/update-account-health-status/tests/test_handler.py` | 1 | **Placeholder** — `pass` | No real tests | ❌ |

## Appendix B: Coverage Targets by Phase

| Phase | Layer | Target Coverage | Measurement |
|-------|-------|----------------|------------|
| P1 | Python functions | 70%+ line coverage | `pytest --cov=src --cov-fail-under=70` |
| P2 | SDK + Utils | 80%+ line coverage | `vitest --coverage` |
| P3 | App services | 80%+ line coverage | `vitest --coverage` |
| P4 | UI components | 60%+ line coverage | `vitest --coverage` (branch coverage) |
| P5 | Integration flows | 4 E2E workflows | Manual trigger + assertion count |
| P6 | Overall (all TS) | 50%+ line coverage | Aggregate coverage report |

---

*End of Testing Roadmap. No test files were generated or modified during this audit.*
