# Technical Debt Register — ResQAI V2

**Phase:** B.10 Enterprise Production Readiness Validation
**Date:** 2026-06-30

---

## Debt Classification

| Severity | Definition | Target Resolution |
|----------|------------|-----------------:|
| 🔴 Critical | Blocks production deployment | Before go-live |
| 🟠 High | Significantly impacts production operation | Phase C |
| 🟡 Medium | Impacts developer productivity or code quality | Phase C-D |
| ⚪ Low | Nice-to-have improvements | Phase D+ |

---

## 🔴 Critical Debt Items

### CRIT-01: `legacy-peer-deps=true` in `.npmrc`
| Field | Value |
|-------|-------|
| **File** | `.npmrc` |
| **Impact** | Masks peer dependency conflicts; may cause runtime errors |
| **Root Cause** | Vite 8 + `@vitejs/plugin-react@4.x` peer dep incompatibility |
| **Fix** | Resolve underlying peer dependency conflict or downgrade Vite |
| **Effort** | 2-4 hours |
| **Risk of not fixing** | Runtime failures in production builds |

### CRIT-02: Auth Redirect Broken
| Field | Value |
|-------|-------|
| **File** | `packages/sdk/lemma-sdk.ts` (marked "Frozen") |
| **Impact** | No app can authenticate in production |
| **Root Cause** | Lemma platform bug; cannot redirect after OAuth |
| **Fix** | Upstream Lemma fix OR implement alternative auth flow |
| **Effort** | Unknown (depends on Lemma team) |
| **Risk of not fixing** | **Go-live blocker** — apps are non-functional |

### CRIT-03: No Agent Runtime Harness
| Field | Value |
|-------|-------|
| **File** | All `agents/*/` |
| **Impact** | All 6 AI agents cannot execute; core workflows blocked |
| **Root Cause** | Agent harness (`agents/harness/run.ts`) is a dev-only harness |
| **Fix** | Build production agent execution service |
| **Effort** | 3-5 days |
| **Risk of not fixing** | All agent-dependent workflows are non-functional |

### CRIT-04: No Secrets Management
| Field | Value |
|-------|-------|
| **File** | `.env.example` |
| **Impact** | All credentials (API keys, OAuth tokens) in plaintext .env |
| **Root Cause** | No secrets manager integrated |
| **Fix** | Integrate Doppler, HashiCorp Vault, or GitHub Secrets |
| **Effort** | 1-2 days |
| **Risk of not fixing** | Credential exposure in any environment |

---

## 🟠 High Debt Items

### HIGH-01: No CI/CD Pipeline
| Field | Value |
|-------|-------|
| **File** | `.github/workflows/ci.yml` (minimal — type-check only) |
| **Impact** | All deployment is manual; no automated testing in PRs |
| **Root Cause** | Never configured beyond basic type-check |
| **Fix** | Add lint, test, build, deploy stages to CI |
| **Effort** | 1-2 days |

### HIGH-02: No Docker Containerization
| Field | Value |
|-------|-------|
| **File** | `infrastructure/.gitkeep` (empty) |
| **Impact** | Cannot deploy to any containerized environment |
| **Root Cause** | Infrastructure directory is a stub |
| **Fix** | Create Dockerfiles for all apps |
| **Effort** | 2-3 days |

### HIGH-03: No Monitoring / Observability
| Field | Value |
|-------|-------|
| **Impact** | Zero visibility into production system health |
| **Root Cause** | Never implemented |
| **Fix** | Add Sentry + structured logging + metrics |
| **Effort** | 3-5 days |

### HIGH-04: No Health Check Endpoints
| Field | Value |
|-------|-------|
| **Impact** | No readiness/liveness probes for orchestration |
| **Root Cause** | Never implemented |
| **Fix** | Add `GET /health` and `GET /ready` to all apps |
| **Effort** | 1 day |

### HIGH-05: No V1→V2 Migration Plan
| Field | Value |
|-------|-------|
| **Impact** | Two parallel schema/application versions with no cutover strategy |
| **Root Cause** | V2 started before V1 migration was planned |
| **Fix** | Document migration strategy, data migration scripts, rollback plan |
| **Effort** | 3-5 days |

### HIGH-06: 66 Functions With Sparse Test Coverage
| Field | Value |
|-------|-------|
| **Impact** | Only ~10 of 66 function directories have test suites |
| **Root Cause** | Functions were bulk-generated; tests not prioritized |
| **Fix** | Add test suites for remaining 56 functions |
| **Effort** | 5-10 days |

### HIGH-07: 11 Orphaned Test Fixtures
| Field | Value |
|-------|-------|
| **File** | `tests/fixtures/*.json` (11 files) |
| **Impact** | Confusion for developers; dead weight in repo |
| **Root Cause** | Remnants from previous test setup |
| **Fix** | Archive or delete |
| **Effort** | 30 minutes |

---

## 🟡 Medium Debt Items

### MED-01: No Client-Side State Management Library
| **Impact** | Apps use raw `useState`/`useCallback` — no caching, no optimistic updates |
| **Fix** | Add React Query or Zustand |
| **Effort** | 2-3 days |

### MED-02: No CSS Framework / Design System
| **Impact** | Inconsistent styling via inline styles; design drift across apps |
| **Root Cause** | V2 design system exists in `shared/` but V1 apps use inline styles |
| **Fix** | Migrate V1 apps to V2 design system |
| **Effort** | 3-5 days |

### MED-03: No Routing Library
| **Impact** | Apps lack client-side routing; no deep linking |
| **Fix** | Add React Router to all apps |
| **Effort** | 1-2 days |

### MED-04: No Pre-Commit Hooks
| **Impact** | Linting/formatting not enforced before commits |
| **Fix** | Add husky + lint-staged |
| **Effort** | 2 hours |

### MED-05: Windows-Only Scripts
| **Impact** | macOS/Linux developers cannot use dev scripts |
| **Files** | `scripts/dev.cmd`, `scripts/*.ts` (Node scripts, but docs reference cmd) |
| **Fix** | Make scripts cross-platform |
| **Effort** | 2 hours |

### MED-06: No Load Testing
| **Impact** | Unknown system capacity; no performance baselines |
| **Fix** | Add k6 or artillery tests |
| **Effort** | 2-3 days |

### MED-07: No Bundle Optimization
| **Impact** | Large initial bundle sizes; no code splitting |
| **Fix** | Add lazy loading, bundle analysis |
| **Effort** | 1-2 days |

---

## ⚪ Low Debt Items

### LOW-01: No Architecture Decision Records
| **Impact** | Key technology decisions undocumented |
| **Fix** | Create ADR directory and backfill major decisions |
| **Effort** | 1 day |

### LOW-02: Sparse Inline Code Comments
| **Impact** | Reduced code maintainability |
| **Fix** | Add JSDoc comments to public APIs |
| **Effort** | 2-3 days |

### LOW-03: No Accessibility Audit
| **Impact** | Unknown WCAG compliance |
| **Fix** | Run a11y audit and fix violations |
| **Effort** | 2-3 days |

### LOW-04: Duplicate Instruction Content
| **Impact** | Drift risk between instruction.md and schemas |
| **Files** | All agent directories |
| **Fix** | Implement single-source-of-truth for agent schemas |
| **Effort** | 1 day |

### LOW-05: Python Test Module Name Collisions
| **Impact** | Cannot run all test suites in single pytest invocation |
| **Fix** | Use unique test package names or pytest --rootdir |
| **Effort** | 2 hours |

---

## Debt Summary

| Severity | Count | Estimated Effort |
|----------|:-----:|:----------------:|
| 🔴 Critical | 4 | 6-11 days + external dependency |
| 🟠 High | 7 | 16-26 days |
| 🟡 Medium | 7 | 10-17 days |
| ⚪ Low | 5 | 6-9 days |
| **Total** | **23** | **38-63 days** |

## Debt Trend

| Metric | Previous | Current | Delta |
|--------|:--------:|:-------:|:-----:|
| Critical items | 6 | 4 | -2 |
| High items | 9 | 7 | -2 |
| Medium items | 5 | 7 | +2 |
| Low items | 3 | 5 | +2 |
| **Total** | **23** | **23** | **0** |

*Note: Some items were resolved (191 TS errors, .env commit, missing functions, CRON triggers) but new items were discovered during this audit.*
