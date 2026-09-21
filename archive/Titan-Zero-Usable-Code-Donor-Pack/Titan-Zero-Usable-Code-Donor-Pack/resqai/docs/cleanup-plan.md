# Cleanup Plan — ResQAI

Generated: 2026-06-28
Mode: Prioritized Roadmap — Do Not Execute Automatically

---

## Guiding Principles

1. Never delete anything without confirmation
2. Never modify business logic, workflows, agents, tables, or APIs
3. Never break imports or change functionality
4. Only reorganize, rename, deduplicate, and document
5. Every non-trivial change must have a rollback plan

---

## Priority Categories

| Priority | Definition | Must Do Before |
|----------|------------|----------------|
| CRITICAL | Security or blocking issue | Phase 1 |
| HIGH | Blocks dev experience or causes confusion | Phase 2 |
| MEDIUM | Improves quality, reduces duplication | Phase 3 |
| LOW | Nice-to-have polish | Phase 4 |

---

## Phase 1: Security & Critical Fixes

Estimated effort: **2 hours**

| # | Task | Priority | Effort | Risk | Details |
|---|------|----------|--------|------|---------|
| 1.1 | Move `.env` to `.gitignore` | CRITICAL | 5 min | Low | Add `.env` to `.gitignore`, ensure example exists |
| 1.2 | Rename committed `.env` to `.env.example` if placeholder | CRITICAL | 2 min | Low | Only if .env contains example values, not real secrets |
| 1.3 | Add `dist/` pattern fix in `.gitignore` | HIGH | 5 min | Low | Current `dist/` may not match `apps/*/dist/` — use `**/dist/` |

---

## Phase 2: Root Directory Cleanup

Estimated effort: **1 hour**

| # | Task | Priority | Effort | Risk | Details |
|---|------|----------|--------|------|---------|
| 2.1 | Move root JSON test fixtures to `tests/fixtures/` | HIGH | 15 min | Low | Move: `agent_test_input.json`, `run_input.json`, `test_fn_*.json`, `test_ticket*.json`, `check_urgency_fn.json`, `update_perms.json`, `update_ticket_fn.json` |
| 2.2 | Move `workflow_graph.json` to `docs/` or `workflows/` | MEDIUM | 5 min | Low | Generated artifact, belongs with documentation |
| 2.3 | Move `CONNECTOR_INTEGRATION_REPORT.md` to `docs/` | MEDIUM | 2 min | Low | Report belongs in docs |
| 2.4 | Move `update_perms.json` to `scripts/` or archive | MEDIUM | 2 min | Low | Operational payload |

---

## Phase 3: Documentation Consolidation

Estimated effort: **4 hours**

| # | Task | Priority | Effort | Risk | Details |
|---|------|----------|--------|------|---------|
| 3.1 | Merge `docs/AGENT_REVIEW.md` → `docs/agents.md` | MEDIUM | 30 min | Low | Consolidate unique content from review |
| 3.2 | Merge `docs/ARCHITECTURE_V2.md` → `docs/architecture.md` | MEDIUM | 30 min | Low | Consolidate v2 changes |
| 3.3 | Merge `docs/DATABASE_REVIEW.md` → `docs/database.md` | MEDIUM | 20 min | Low | Consolidate review notes |
| 3.4 | Merge `docs/FUNCTION_REVIEW.md` → `docs/functions.md` | MEDIUM | 20 min | Low | Consolidate review notes |
| 3.5 | Merge `docs/deployment-summary.md` → `docs/deployment.md` | LOW | 10 min | Low | Consolidate deployment docs |
| 3.6 | Merge `docs/SUMMARY.md` → `docs/README.md` | LOW | 10 min | Low | One index to rule them all |
| 3.7 | Move `docs/apps/*.md` → consolidated into `docs/applications.md` | MEDIUM | 20 min | Low | Eliminate per-app doc files |
| 3.8 | Rename all UPPER_SNAKE docs to kebab-case | MEDIUM | 15 min | Medium | 15+ files — update internal cross-references |
| 3.9 | Move `workflows/ticket-intake-REPORT.md` to `docs/Archive/` | LOW | 2 min | Low | Misplaced report |
| 3.10 | Archive obsolete one-time reports to `docs/Archive/` | LOW | 15 min | Low | Move: PERFORMANCE_REPORT.md, SECURITY_REPORT.md, etc. |

---

## Phase 4: Folder Structure Standardization

Estimated effort: **3 hours**

| # | Task | Priority | Effort | Risk | Details |
|---|------|----------|--------|------|---------|
| 4.1 | Standardize function directory naming (all kebab-case) | HIGH | 30 min | Medium | Rename 5 dirs — verify no pod/function references break |
| 4.2 | Remove empty `infrastructure/` directory | LOW | 2 min | Low | Add `.gitkeep` if intent is to keep placeholder |
| 4.3 | Normalize app structure — remove `src/` from support-queue | MEDIUM | 15 min | Low | Move files up one level to match other apps |
| 4.4 | Remove `archive/apps/shared/` duplicate files | MEDIUM | 5 min | Low | Duplicates of `shared/sdk/lemma-sdk.ts` and `shared/types/index.ts` |
| 4.5 | Consolidate workflow files (standalone `.json` vs subdir `.json`) | MEDIUM | 30 min | Medium | Audit 6 subdir workflows + 6 standalone — deduplicate |
| 4.6 | Create `docs/Archive/` directory for obsolete docs | MEDIUM | 10 min | Low | Move superseded documents |

---

## Phase 5: Configuration & Build

Estimated effort: **3 hours**

| # | Task | Priority | Effort | Risk | Details |
|---|------|----------|--------|------|---------|
| 5.1 | Hoist shared dependencies to root `package.json` | HIGH | 30 min | Medium | Move vite, typescript, react, etc. to root — verify workspaces |
| 5.2 | Add `tsx`, `vitest`, `jsdom` to root `devDependencies` | HIGH | 10 min | Low | Declare what's used |
| 5.3 | Remove per-app `package-lock.json` files | MEDIUM | 5 min | Low | Root lock file is authoritative |
| 5.4 | Remove per-app `.env` / `.env.example` duplicates | MEDIUM | 10 min | Medium | Single root `.env` — verify app loading |
| 5.5 | Add ESLint config | MEDIUM | 30 min | Low | Standard config for TypeScript + React |
| 5.6 | Add Prettier config | MEDIUM | 10 min | Low | `.prettierrc` with consistent rules |
| 5.7 | Add `.nvmrc` for Node version pinning | LOW | 2 min | Low | Pin to Node 18+ |
| 5.8 | Add Python `requirements.txt` | LOW | 10 min | Low | Document Python dependencies |
| 5.9 | Remove unused `@tanstack/react-query` from support-queue | MEDIUM | 5 min | Low | If confirmed unused |

---

## Phase 6: CI/CD & Build Pipeline

Estimated effort: **2 hours**

| # | Task | Priority | Effort | Risk | Details |
|---|------|----------|--------|------|---------|
| 6.1 | Fix `scripts/dev.cmd` to be cross-platform | HIGH | 30 min | Medium | Create cross-platform dev script |
| 6.2 | Enhance `.github/workflows/ci.yml` with full pipeline | HIGH | 45 min | Medium | Add: install → validate → test → build |
| 6.3 | Add dependency caching to CI | MEDIUM | 15 min | Low | Cache node_modules and pip |
| 6.4 | Add Python test integration to npm test script | MEDIUM | 20 min | Low | `npm test` should run both Vitest and pytest |

---

## Phase 7: Naming Standardization

Estimated effort: **2 hours**

| # | Task | Priority | Effort | Risk | Details |
|---|------|----------|--------|------|---------|
| 7.1 | Rename 5 snake_case function dirs to kebab-case | MEDIUM | 30 min | Medium | Update any pod/function JSON references |
| 7.2 | Rename 15+ UPPER_SNAKE docs to kebab-case | MEDIUM | 15 min | Medium | Update cross-reference links |
| 7.3 | Verify no broken imports after renames | HIGH | 30 min | Medium | Post-rename validation |

---

## Phase 8: Repository Hygiene

Estimated effort: **1 hour**

| # | Task | Priority | Effort | Risk | Details |
|---|------|----------|--------|------|---------|
| 8.1 | Add `LICENSE` file | MEDIUM | 5 min | Low | MIT or appropriate license |
| 8.2 | Add `CONTRIBUTING.md` | MEDIUM | 30 min | Low | Basic contribution guidelines |
| 8.3 | Add `CODE_OF_CONDUCT.md` | LOW | 10 min | Low | Standard code of conduct |
| 8.4 | Add `CHANGELOG.md` | LOW | 15 min | Low | Initial changelog entry |
| 8.5 | Add `.editorconfig` | LOW | 5 min | Low | Editor-agnostic formatting rules |

---

## Phase 9: Verification

Estimated effort: **1 hour**

| # | Task | Priority | Effort | Risk |
|---|------|----------|--------|------|
| 9.1 | Run `npm run validate` (tsc --noEmit) | CRITICAL | 5 min | Low |
| 9.2 | Run `npm test` | HIGH | 10 min | Low |
| 9.3 | Run `npm run build` for all apps | HIGH | 15 min | Low |
| 9.4 | Verify all Python tests pass | MEDIUM | 10 min | Low |
| 9.5 | Verify app dev servers start | MEDIUM | 15 min | Low |

---

## Execution Order

```
Week 1
├── Day 1:  Phase 1 (Security fixes)           [CRITICAL]
│   ├── 1.1 Move .env → .gitignore             [5 min]
│   ├── 1.2 Rename committed .env               [2 min]
│   └── 1.3 Fix dist/ gitignore pattern         [5 min]
│
├── Day 2:  Phase 2 (Root cleanup)              [HIGH]
│   ├── 2.1 Move test fixtures                  [15 min]
│   ├── 2.2 Move workflow_graph.json            [5 min]
│   ├── 2.3 Move CONNECTOR_INTEGRATION_REPORT.md [2 min]
│   └── 2.4 Move update_perms.json             [2 min]
│
├── Day 3-4: Phase 3 (Documentation)            [MEDIUM]
│   ├── 3.1-3.6 Merge duplicate docs            [2 hours]
│   ├── 3.7 Consolidate app docs                [20 min]
│   ├── 3.8 Rename UPPER_SNAKE docs             [15 min]
│   └── 3.9-3.10 Archive obsolete docs          [17 min]

Week 2
├── Day 1:  Phase 4 (Folder structure)          [MEDIUM]
│   ├── 4.1 Standardize function dir names      [30 min]
│   ├── 4.2 Handle empty infrastructure/        [2 min]
│   ├── 4.3 Normalize support-queue structure   [15 min]
│   ├── 4.4 Remove archive dupes                [5 min]
│   ├── 4.5 Consolidate workflow files          [30 min]
│   └── 4.6 Create Archive/ in docs/            [10 min]
│
├── Day 2:  Phase 5 (Config & build)            [MEDIUM]
│   ├── 5.1 Hoist dependencies                  [30 min]
│   ├── 5.2 Add missing root deps               [10 min]
│   ├── 5.3 Remove per-app lock files           [5 min]
│   ├── 5.4 Consolidate .env files              [10 min]
│   ├── 5.5-5.6 Add ESLint + Prettier config     [40 min]
│   ├── 5.7 Add .nvmrc                          [2 min]
│   ├── 5.8 Add requirements.txt               [10 min]
│   └── 5.9 Remove unused dep                   [5 min]
│
├── Day 3:  Phase 6 (CI/CD pipeline)            [HIGH]
│   ├── 6.1 Fix dev script (cross-platform)     [30 min]
│   ├── 6.2 Enhance CI workflow                 [45 min]
│   ├── 6.3 Add caching to CI                   [15 min]
│   └── 6.4 Integrate Python tests              [20 min]
│
├── Day 4:  Phase 7 (Naming standardization)    [MEDIUM]
│   ├── 7.1 Rename function dirs                [30 min]
│   ├── 7.2 Rename docs                         [15 min]
│   └── 7.3 Verify imports                      [30 min]
│
├── Day 5:  Phase 8 (Repo hygiene)              [LOW]
│   ├── 8.1 Add LICENSE                         [5 min]
│   ├── 8.2 Add CONTRIBUTING.md                 [30 min]
│   ├── 8.3 Add CODE_OF_CONDUCT.md              [10 min]
│   ├── 8.4 Add CHANGELOG.md                    [15 min]
│   └── 8.5 Add .editorconfig                   [5 min]

Week 3
├── Day 1:  Phase 9 (Verification)              [CRITICAL]
│   ├── 9.1 npm run validate                    [5 min]
│   ├── 9.2 npm test                            [10 min]
│   ├── 9.3 npm run build                       [15 min]
│   ├── 9.4 Python tests                        [10 min]
│   └── 9.5 Dev server smoke test               [15 min]
```

---

## Effort Summary

| Phase | Tasks | Total Effort | Priority |
|-------|-------|:-----------:|----------|
| 1 — Security | 3 | 12 min | CRITICAL |
| 2 — Root cleanup | 4 | 24 min | HIGH |
| 3 — Documentation | 10 | 2h 22m | MEDIUM |
| 4 — Folder structure | 6 | 1h 32m | MEDIUM |
| 5 — Config & build | 9 | 1h 57m | MEDIUM |
| 6 — CI/CD | 4 | 1h 50m | HIGH |
| 7 — Naming | 3 | 1h 15m | MEDIUM |
| 8 — Repo hygiene | 5 | 1h 5m | LOW |
| 9 — Verification | 5 | 55 min | CRITICAL |
| **Total** | **49** | **~12 hours** | |

---

## Rollback Strategy

| Change Type | Rollback Method |
|-------------|-----------------|
| File rename | `git mv` — revert with `git mv` back |
| File deletion | `git checkout -- <file>` |
| Config change | `git checkout -- <file>` or revert specific lines |
| Gitignore change | Revert commit |
| Dependency change | `npm install` previous version, revert package.json |

---

## Zero-Regression Checklist

Before committing any change:

- [ ] Change is revertable with a single git command
- [ ] No business logic files modified (agents, workflows, tables, apps, functions)
- [ ] No import paths broken
- [ ] No test fixtures removed (only moved)
- [ ] Documentation cross-references updated
- [ ] `npm run validate` passes
- [ ] `npm run build` succeeds
