# Test Coverage Audit — ResQAI

Generated: 2026-06-28
Audit Mode: Read-Only — No Tests Created

---

## 1. Function Test Coverage

| Function | Tests Exist? | Test File | Coverage Notes |
|----------|:-----------:|-----------|----------------|
| `account-health-scan` | ✅ | `tests/test_logic.py` | Tests scoring logic |
| `check-ticket-urgency` | ✅ | `tests/test_logic.py` | Tests urgency classification |
| `flag-slipping-followups` | ✅ | `tests/test_logic.py` | Tests followup flagging |
| `update-ticket-record` | ✅ | `tests/test_logic.py` | Tests ticket updates |
| `assign_appointment_technician` | ❌ | — | No test file |
| `collect_resolved_tickets` | ❌ | — | No test file |
| `finalize_slippage_review` | ❌ | — | No test file |
| `finalize-dispatch` | ❌ | — | No test file |
| `resolve_dispute` | ❌ | — | No test file |
| `update_account_health_status` | ❌ | — | No test file |

**Function test coverage: 4/10 (40%)**

---

## 2. Application Test Coverage

| App | Test Runner | Tests Exist? | Files |
|-----|:----------:|:-----------:|-------|
| Support Queue | Vitest | Partial | `src/setupTests.ts` exists but no test files found |
| Appointment Board | Vitest | ❌ | No test files found |
| CRM Tracker | Vitest | ❌ | No test files found |
| Ops Dashboard | Vitest | ❌ | No test files found |
| Resolution Center | Vitest | ❌ | No test files found |

**Application test coverage: ~0%**

---

## 3. Workflow Validation Coverage

| Workflow | Tests Exist? | Notes |
|----------|:-----------:|-------|
| `ticket-intake` | ❌ | Active — no validation tests |
| `urgent-dispatch` | ❌ | Active — no validation tests |
| `followup-slippage` | ❌ | DRAFT — no validation tests |
| `account-health` | ❌ | DRAFT — no validation tests |
| `daily-standup` | ❌ | DRAFT — no validation tests |
| `appointment-reminders` | ❌ | DRAFT — no validation tests |
| `dispute-resolution` | ❌ | DRAFT — no validation tests |
| `account-health-monitoring` | ❌ | DRAFT — no validation tests |
| `customer-satisfaction-monitor` | ❌ | DRAFT — no validation tests |
| `support-escalation-manager` | ❌ | DRAFT — no validation tests |
| `appointment-assignment` | ❌ | DRAFT — no validation tests |
| `followup-slippage-detector` | ❌ | DRAFT — no validation tests |

**Workflow validation coverage: 0/12 (0%)**

---

## 4. Shared Code Test Coverage

| Module | Tests Exist? | Notes |
|--------|:-----------:|-------|
| `shared/utils/*` | ❌ | Date, number, string, filtering, sorting, service-helpers — no tests |
| `shared/config/*` | ❌ | Environment, paths, constants — no tests |
| `shared/sdk/lemma-sdk.ts` | ❌ | SDK wrapper — no tests |
| `shared/types/*` | ❌ | Type definitions (not testable) |
| `shared/ui/*` | ❌ | React components — no tests |

**Shared code test coverage: 0%**

---

## 5. Critical Paths Without Tests

| Priority | Path | Risk Without Tests |
|----------|------|--------------------|
| HIGH | `account-health-scan` scoring | Business-critical scoring logic |
| HIGH | `flag-slipping-followups` | SLA compliance feature |
| HIGH | `ticket-intake` workflow | Primary intake pipeline |
| HIGH | `urgent-dispatch` workflow | Urgency response |
| MEDIUM | `check-ticket-urgency` | Ticket triage (has tests) |
| MEDIUM | `lemma-sdk` wrapper | All apps depend on this |
| MEDIUM | Shared UI components | Rendered in all apps |
| LOW | Utility functions (date, number, string) | Simple pure functions |

---

## 6. Test Infrastructure Readiness

| Component | Status |
|-----------|--------|
| Python test framework (pytest) | Configured for 4 functions |
| JS/TS test framework (Vitest) | In all app package.json |
| JS test setup file | `apps/support-queue/src/setupTests.ts` |
| CI test runner | Not configured (no CI workflow) |
| Coverage reporting | Not configured |
| Test fixtures | Scattered at root (11 JSON files) |

---

## 7. Recommendations

| Priority | Recommendation |
|----------|---------------|
| HIGH | Write tests for 6 untested functions (Python) |
| HIGH | Write integration tests for ticket-intake and urgent-dispatch workflows |
| MEDIUM | Add shared UI component tests (React Testing Library) |
| MEDIUM | Add utility function tests |
| MEDIUM | Consolidate test fixtures into `tests/fixtures/` |
| LOW | Add coverage reporting (pytest-cov, vitest --coverage) |
| LOW | Configure CI to run tests on push/PR |

---

## Summary

| Category | Coverage |
|----------|:-------:|
| Python functions | **40%** (4/10) |
| React apps | **~0%** (0/5) |
| Workflows | **0%** (0/12) |
| Shared code | **0%** |
| Overall | **~10%** |
