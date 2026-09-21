# Repository Health Score — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

---

## Scoring Methodology

Each category is scored 0-100 based on:
- Structural completeness
- Known bugs/issues density
- Documentation coverage
- Consistency

---

## Architecture Score: **72/100**

| Criteria | Score | Notes |
|----------|-------|-------|
| Clear separation of concerns | 80 | Apps→shared→SDK→Pod pattern is clean |
| Dependency hierarchy | 75 | Some circular/redundant agent references |
| Technology consistency | 70 | Mixed naming conventions, no build tool standardization |
| Scalability of structure | 65 | No CI/CD, missing centralized config |
| **Weighted** | **72** | |

---

## Documentation Score: **58/100**

| Criteria | Score | Notes |
|----------|-------|-------|
| Completeness | 70 | Most aspects documented |
| Duplication | 30 | 5+ duplicate document pairs |
| Freshness/Accuracy | 60 | Some docs outdated (archived docs vs current) |
| README quality | 70 | Good project README |
| **Weighted** | **58** | |

---

## Code Quality Score: **65/100**

| Criteria | Score | Notes |
|----------|-------|-------|
| TypeScript strictness | 50 | noUnusedLocals/Parameters disabled |
| Linting/formatting | 0 | No ESLint or Prettier config |
| Test coverage | 40 | Only 4/10 functions have tests |
| Error handling | 80 | Good error boundaries in apps/functions |
| Dead code | 60 | Some unused deps, 1 unused import pattern |
| **Weighted** | **65** | |

---

## Folder Organization Score: **70/100**

| Criteria | Score | Notes |
|----------|-------|-------|
| Logical structure | 75 | Good top-level layout |
| Consistency | 60 | Mixed naming, extra src/ in one app |
| Nesting depth | 80 | Reasonable depth |
| Empty directories | 50 | 2 empty dirs |
| **Weighted** | **70** | |

---

## Dependency Score: **55/100**

| Criteria | Score | Notes |
|----------|-------|-------|
| Hoisting/workspace usage | 70 | Workspaces configured but deps not fully hoisted |
| Dev vs prod separation | 80 | Clear separation |
| Unused dependencies | 40 | @tanstack/react-query unused in 2 apps |
| Missing dependencies | 30 | tsx, vitest, lemma-sdk missing from root |
| Lock file duplication | 30 | Root + 5 app lock files |
| **Weighted** | **55** | |

---

## Workflow Integrity Score: **45/100**

| Criteria | Score | Notes |
|----------|-------|-------|
| Active workflows verified | 60 | 3 ACTIVE workflows exist |
| Broken references found | 0 | 4+ missing function references |
| Dangling/unknown workflows | 30 | 6 workflows with unknown status |
| Idempotency coverage | 70 | Most workflows have idempotency |
| Error handling | 65 | Retry policies defined |
| **Weighted** | **45** | |

---

## Function Integrity Score: **65/100**

| Criteria | Score | Notes |
|----------|-------|-------|
| All functions exist | 100 | 10 functions, 0 missing |
| Test coverage | 40 | 4/10 have tests |
| Permission correctness | 90 | Appropriate grants |
| Schema completeness | 70 | 4/10 have formal schemas |
| Naming consistency | 30 | 50% kebab, 50% snake |
| **Weighted** | **65** | |

---

## Application Integrity Score: **78/100**

| Criteria | Score | Notes |
|----------|-------|-------|
| All apps structurally complete | 100 | All have required files |
| Known runtime errors | 50 | tech-suggester bug in appointment-board |
| Cross-app consistency | 60 | One app has extra src/, only 1 has App.css |
| Shared code utilization | 80 | Good use of shared SDK/config/types |
| **Weighted** | **78** | |

---

## Connector Integration Score: **50/100**

| Criteria | Score | Notes |
|----------|-------|-------|
| Connectors documented | 80 | Good CONNECTOR_INTEGRATION_REPORT |
| Actually integrated | 40 | Only Discord confirmed working |
| Permission grants correct | 70 | All agents have appropriate grants |
| Runtime verification | 10 | Multiple connectors documented but unverified |
| **Weighted** | **50** | |

---

## Overall Repository Health

| Category | Score |
|----------|-------|
| Architecture | 72 |
| Documentation | 58 |
| Code Quality | 65 |
| Folder Organization | 70 |
| Dependency Management | 55 |
| Workflow Integrity | 45 |
| Function Integrity | 65 |
| Application Integrity | 78 |
| Connector Integration | 50 |
| **OVERALL** | **62/100** |

---

## Score Interpretation

| Range | Status |
|-------|--------|
| 90-100 | Excellent |
| 75-89 | Good |
| 60-74 | **Fair** ← CURRENT |
| 40-59 | Poor |
| 0-39 | Critical |

---

## Improvement Potential

After executing the cleanup plan, estimated target scores:

| Category | Current | Target | Gain |
|----------|---------|--------|------|
| Architecture | 72 | 80 | +8 |
| Documentation | 58 | 75 | +17 |
| Code Quality | 65 | 78 | +13 |
| Folder Organization | 70 | 88 | +18 |
| Dependency Management | 55 | 80 | +25 |
| Workflow Integrity | 45 | 80 | +35 |
| Function Integrity | 65 | 78 | +13 |
| Application Integrity | 78 | 85 | +7 |
| Connector Integration | 50 | 65 | +15 |
| **OVERALL** | **62** | **79** | **+17** |
