# ResQAI — Repository Restructure Plan

**Date:** 2026-06-28  
**Author:** Principal Software Architect  
**Status:** Plan — No files have been moved yet  

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Target Repository Structure](#2-target-repository-structure)
3. [Issues Identified](#3-issues-identified)
4. [Folder Move Plan](#4-folder-move-plan)
5. [File Move Plan](#5-file-move-plan)
6. [Migration Order](#6-migration-order)
7. [Risks & Mitigations](#7-risks--mitigations)

---

## 1. Current State Assessment

### 1.1 Top-Level Inventory

| Entry | Type | Files | Health |
|-------|------|-------|--------|
| `agents/` | Directory | 40 | ✅ Well-structured — consistent 8-file pattern per agent |
| `apps/` | Directory | 121 | ⚠️ Mostly consistent — 1 outlier app (support-queue) |
| `archive/` | Directory | 9 | ⚠️ Contains outdated SDK copies, stale reports |
| `database/` | Directory | 12 | ⚠️ `docs/` misnamed — contains seed data, not documentation |
| `docs/` | Directory | 76 | 🔴 Heavy duplication, overlapping content, misplaced reports |
| `functions/` | Directory | 67 | 🔴 Two inconsistent structural patterns |
| `infrastructure/` | Directory | 0 | ℹ️ Reserved — empty, no deployment configs |
| `scripts/` | Directory | 7 | ✅ Clean, well-organized |
| `packages/` | Directory | 28 | ⚠️ Barrel export gap in `utils/` |
| `workflows/` | Directory | 15 | 🔴 Two structural patterns, duplicate entries |
| Root files | Files | 21 | 🔴 Orphaned test JSONs, misplaced reports, overlapping docs |

### 1.2 Structural Pattern Inconsistencies

**Functions — Two patterns across 11 functions:**

| Pattern | Count | Functions |
|---------|-------|-----------|
| Full (`src/` + `schemas/` + `tests/`) | 4 | `account-health-scan`, `check-ticket-urgency`, `flag-slipping-followups`, `update-ticket-record` |
| Flat (`code.py` + `.json`) | 6 | `assign_appointment_technician`, `collect_resolved_tickets`, `finalize_slippage_review`, `finalize-dispatch`, `resolve_dispute`, `update_account_health_status` |

**Workflows — Two patterns across 15 entries (9 unique workflows):**

| Pattern | Count | Examples |
|---------|-------|----------|
| Subdirectory with JSON | 6 | `account-health-monitoring/`, `appointment-assignment/`, `customer-satisfaction-monitor/`, `followup-slippage-detector/`, `support-escalation-manager/`, `urgent-dispatch/` |
| Flat JSON at root | 8 | `account-health.json`, `appointment-reminders.json`, `daily-standup.json`, `dispute-resolution.json`, `followup-slippage.json`, `ticket-intake.json`, `account-health-monitoring.json`, `urgent-dispatch.json` |

**Duplicate workflow entries:** `account-health-monitoring.json` and `urgent-dispatch.json` exist as BOTH a flat root file AND inside a subdirectory — migration artifacts.

**Apps — structural difference:**

| Feature | Other 4 apps | support-queue |
|---------|-------------|---------------|
| Source directory | Root level | `src/` subdirectory |
| Unit tests | None | `src/__tests__/` |
| Test framework | None | Vitest + jsdom |
| Dev server port | 5173 | 5176 |
| vite.config import | `vite` | `vitest/config` |
| CSS file | None (except appointment-board has `App.css`) | None |

---

## 2. Target Repository Structure

The target is a single NPM workspace monorepo with standardized component layouts, consolidated documentation, and uniform function/workflow packaging.

```
ResQAI/
│
├── apps/                              # 5 React micro-apps (npm workspaces)
│   ├── appointment-board/
│   │   ├── src/                       # [NEW] Source directory
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── state/
│   │   │   ├── types/
│   │   │   ├── App.tsx
│   │   │   ├── App.css                # [MOVE] from app root
│   │   │   └── main.tsx
│   │   ├── public/
│   │   │   └── index.html
│   │   ├── tests/                     # [NEW] Test directory
│   │   │   └── setup.ts               # [NEW] Test setup
│   │   ├── .env.example
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   └── README.md
│   ├── crm-tracker/                   # Same structure
│   ├── ops-dashboard/                 # Same structure
│   ├── resolution-center/             # Same structure
│   └── support-queue/
│       ├── src/                       # Already has src/ — keep
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── state/
│       │   ├── types/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── public/
│       │   └── index.html
│       ├── tests/                     # [MOVE] from src/__tests__/
│       │   ├── ticket-service.test.ts
│       │   └── setup.ts               # [MOVE] from src/setupTests.ts
│       ├── .env.example
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── package.json
│
├── agents/                            # 5 AI agent definitions (already consistent)
│   ├── account-health-monitor/        # Keep as-is
│   ├── operations-coordinator/        # Keep as-is
│   ├── request-classifier/            # Keep as-is
│   ├── resolution-advisor/            # Keep as-is
│   └── support-reply-drafter/         # Keep as-is
│
├── database/                          # Schema, seeds, migrations
│   ├── migrations/
│   │   └── 001_tickets_add_status_values_and_column.sql
│   └── seeds/                         # [RENAME] from database/docs/
│       ├── accounts-records.json
│       ├── appointments-records.json
│       ├── customers-records.json
│       ├── disputes-records.json
│       ├── followups-records.json
│       ├── operations_log-records.json
│       ├── tasks-records.json
│       ├── technicians-records.json
│       ├── tickets-records.json
│       ├── account-health-scan.json   # [KEEP] function output fixture
│       └── flag-slipping-followups.json # [KEEP] function output fixture
│
├── docs/                              # Consolidated documentation
│   ├── archive/                       # Historical reference only
│   │   ├── architecture/              # [MOVE] from docs/archive/OLD_architecture/
│   │   ├── implementation/            # [MOVE] from docs/archive/OLD_implementation/
│   │   ├── recovery/                  # [MOVE] from docs/archive/OLD_recovery/
│   │   └── validation/               # [MOVE] from docs/archive/OLD_validation/
│   ├── apps/                          # App-specific docs (keep)
│   │   ├── appointment-board.md
│   │   ├── crm-tracker.md
│   │   ├── ops-dashboard.md
│   │   ├── resolution-center.md
│   │   └── support-queue.md
│   ├── project-audit/                 # Latest audit artifacts
│   ├── repository/                    # [NEW] Repository structure docs
│   │   └── REPOSITORY_RESTRUCTURE_PLAN.md
│   ├── security/                      # Security audit docs
│   │   └── SECURITY_AUDIT.md
│   ├── testing/                       # QA and testing docs (keep)
│   │   └── qa-checklist.md
│   ├── AGENTS.md
│   ├── ARCHITECTURE_V2.md            # Current architecture (keep)
│   ├── applications.md
│   ├── architecture.md               # Keep as high-level overview
│   ├── build-pipeline-report.md
│   ├── database.md
│   ├── deployment-summary.md
│   ├── deployment.md
│   ├── naming-standard.md
│   ├── production-readiness.md
│   ├── resource-map.md
│   ├── SECURITY_REPORT.md
│   ├── setup.md
│   ├── SERVICE_LAYER_REPORT.md
│   ├── testing-report.md
│   ├── troubleshooting.md
│   └── WORKFLOW_DESIGN.md
│
├── functions/                         # Python serverless functions (standardized)
│   ├── packages/                        # Shared Python utilities (keep)
│   │   ├── __init__.py
│   │   ├── cli.py
│   │   └── fixture_loader.py
│   ├── account-health-scan/           # Already has full structure — keep
│   ├── assign-appointment-technician/ #[RENAME] from assign_appointment_technician
│   │   ├── src/                       # [MOVE] from flat code.py
│   │   │   ├── __init__.py
│   │   │   └── handler.py
│   │   ├── schemas/                   # [NEW] Add input/output schemas
│   │   │   ├── input.json
│   │   │   └── output.json
│   │   ├── tests/                     # [NEW] Add test suite
│   │   │   ├── __init__.py
│   │   │   └── test_handler.py
│   │   └── function.json
│   ├── check-ticket-urgency/          # Already has full structure — keep
│   ├── collect-resolved-tickets/      #[RENAME] from collect_resolved_tickets
│   │   ├── src/handler.py             # [MOVE] from code.py
│   │   ├── schemas/
│   │   ├── tests/
│   │   └── function.json
│   ├── finalize-slippage-review/      #[RENAME] from finalize_slippage_review
│   ├── finalize-dispatch/             # Keep name (already kebab-case)
│   ├── flag-slipping-followups/       # Already has full structure — keep
│   ├── resolve-dispute/               #[RENAME] from resolve_dispute
│   ├── update-account-health-status/  #[RENAME] from update_account_health_status
│   └── update-ticket-record/          # Already has full structure — keep
│
├── infrastructure/                    # [KEEP] Placeholder for deployment configs
│   └── .gitkeep                       # [ADD] To preserve directory
│
├── packages/                          # [RENAME] from packages/ (workspace semantics)
│   ├── config/
│   ├── sdk/
│   ├── types/
│   ├── ui/
│   └── utils/
│
├── scripts/                           # Build/dev/test tooling (keep)
│   ├── build.ts
│   ├── clean.ts
│   ├── dev.cmd
│   ├── dev.ts
│   ├── seed.ts
│   ├── test.ts
│   └── validate.ts
│
├── tests/                             # [NEW] Root-level test infrastructure
│   └── fixtures/                      # [MOVE] from root test JSONs
│       ├── agent_test_input.json
│       ├── check_urgency_fn.json
│       ├── run_input.json
│       ├── test_fn_update.json
│       ├── test_fn_urgency.json
│       ├── test_ticket.json
│       ├── test_ticket2.json
│       ├── test_ticket3.json
│       ├── update_perms.json
│       └── update_ticket_fn.json
│
├── workflows/                         # Workflow definitions (standardized)
│   ├── account-health-monitoring/     # [KEEP] Already in subdirectory
│   │   └── account-health-monitoring.json
│   ├── account-health.json            # [MOVE] from root flat file
│   ├── appointment-assignment/        # [KEEP]
│   │   └── appointment-assignment.json
│   ├── appointment-reminders/         # [MOVE] from root flat file
│   │   └── appointment-reminders.json
│   ├── customer-satisfaction-monitor/ #[KEEP]
│   │   └── customer-satisfaction-monitor.json
│   ├── daily-standup/                 # [MOVE] from root flat file
│   │   └── daily-standup.json
│   ├── dispute-resolution/            # [MOVE] from root flat file
│   │   └── dispute-resolution.json
│   ├── followup-slippage-detector/    # [KEEP]
│   │   └── followup-slippage-detector.json
│   ├── support-escalation-manager/    # [KEEP]
│   │   └── support-escalation-manager.json
│   ├── ticket-intake/                 # [MOVE] from root flat file
│   │   └── ticket-intake.json
│   ├── urgent-dispatch/               # [KEEP]
│   │   └── urgent-dispatch.json
│   └── ticket-intake-REPORT.md        # [MOVE] to docs/workflows/
│
├── .env.example
├── .gitignore
├── .github/
│   └── workflows/ci.yml
├── .npmrc
├── README.md
├── ResQAI.code-workspace
├── package.json
├── package-lock.json
├── tsconfig.json
└── CONNECTOR_INTEGRATION_REPORT.md    # [MOVE] to docs/
```

---

## 3. Issues Identified

### 3.1 Structural Inconsistencies

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| I1 | Function structural split (full vs flat) | High | `functions/` — 2 patterns across 11 functions |
| I2 | Workflow structural split (subdir vs flat + duplicates) | High | `workflows/` — 2 patterns; 2 duplicated entries |
| I3 | Empty `infrastructure/` directory | Low | `infrastructure/` — placeholder with no `.gitkeep` |
| I4 | Empty fixture directories | Low | `functions/*/tests/fixtures/` — 2 empty dirs |
| I5 | App structural outlier (`support-queue`) | Medium | `apps/support-queue/` — only app with `src/` and tests |

### 3.2 Misplaced Files

| # | Issue | Severity | Current → Target |
|---|-------|----------|-------------------|
| M1 | Test fixtures at root | Medium | `test_*.json` → `tests/fixtures/` |
| M2 | Function definitions at root | Medium | `check_urgency_fn.json`, `update_ticket_fn.json` → duplicate of `functions/*/function.json` |
| M3 | `database/docs/` is misnamed | Medium | `database/docs/` → `database/seeds/` (contains seed data, not documentation) |
| M4 | App-level `.env` files | Low | `apps/*/.env` — duplicated; root `.env` is authoritative |
| M5 | App-level ARCHITECTURE.md | Low | `apps/*/ARCHITECTURE.md` — overlaps with `docs/apps/*.md` |
| M6 | `App.css` at app root | Low | `apps/appointment-board/App.css` — only CSS file; should be in source |
| M7 | `routes/index.tsx` in apps | Low | `apps/*/routes/` — all 5 unused or trivial; no router config found |

### 3.3 Documentation Redundancy

| # | Issue | Severity | Files |
|---|-------|----------|-------|
| D1 | Duplicate dependency audits (casing) | Medium | `docs/DEPENDENCY_AUDIT.md` + `docs/dependency-audit.md` |
| D2 | Duplicate cleanup plans | Medium | `docs/cleanup-plan.md` + `docs/project-audit/cleanup-plan.md` |
| D3 | Overlapping architecture docs | Medium | `docs/archive/OLD_architecture/` (5 files) overlaps with `docs/architecture.md` + `docs/ARCHITECTURE_V2.md` |
| D4 | Overlapping security docs | Low | `docs/SECURITY_REPORT.md` + `docs/security/SECURITY_AUDIT.md` |
| D5 | Overlapping testing docs | Low | `docs/testing/qa-checklist.md` + `docs/testing-report.md` + `docs/INTEGRATION_TEST_PLAN.md` |
| D6 | Overlapping database docs | Low | `docs/database.md` + `docs/DATABASE_REVIEW.md` |
| D7 | Outdated archived validation reports | Low | `docs/archive/OLD_validation/` (7 files) — superseded |
| D8 | App-level ARCHITECTURE.md duplicates | Low | 5 app ARCHITECTURE.md files + 5 docs/apps/*.md files |
| D9 | Root-level report files | Medium | `CONNECTOR_INTEGRATION_REPORT.md`, `DEPENDENCY_AUDIT.md`, `INTEGRATION_TEST_PLAN.md`, `PERFORMANCE_REPORT.md`, `PHASE6_PREPARATION.md`, `PROJECT_HEALTH_V2.md`, `PROJECT_STATUS.md`, `SECURITY_REPORT.md`, `SUMMARY.md` — all at root instead of `docs/` |

### 3.4 Configuration Drift

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| C1 | `packages/utils/index.ts` missing exports | Low | `filtering.ts`, `sorting.ts`, `string.ts` not re-exported |
| C2 | App `.env.example` inconsistency | Low | Root (30 lines) vs apps (7 lines); apps missing feature flags and token vars |
| C3 | `support-queue` port divergence | Low | Port 5176 vs 5173; different vite import source |
| C4 | `archive/apps/packages/` outdated copies | Low | Old `lemma-sdk.ts` (browser-based) and `types.ts` superseded by current versions |

### 3.5 Dead/Cleanup Candidates

| # | Item | Reason |
|---|------|--------|
| X1 | `workflows/account-health-monitoring.json` (root flat) | Duplicate — already in `workflows/account-health-monitoring/` subdirectory |
| X2 | `workflows/urgent-dispatch.json` (root flat) | Duplicate — already in `workflows/urgent-dispatch/` subdirectory |
| X3 | `workflows/ticket-intake-REPORT.md` | Misplaced — should be in `docs/workflows/` |
| X4 | `apps/*/routes/index.tsx` | All 5 files are trivial stubs with no router imports — unused |
| X5 | `CONNECTOR_INTEGRATION_REPORT.md` (root) | Should be in `docs/` |
| X6 | `check_urgency_fn.json` (root) | Duplicate of `functions/check-ticket-urgency/function.json` |
| X7 | `update_ticket_fn.json` (root) | Duplicate of `functions/update-ticket-record/function.json` |
| X8 | `archive/apps/packages/lemma-sdk.ts` | Outdated — superseded by `packages/sdk/lemma-sdk.ts` |
| X9 | `archive/apps/packages/types.ts` | Outdated — superseded by `packages/types/index.ts` |

---

## 4. Folder Move Plan

| # | Action | Source | Target | Rationale |
|---|--------|--------|--------|-----------|
| F1 | RENAME | `database/docs/` | `database/seeds/` | Contains seed data JSON, not documentation |
| F2 | RENAME | `packages/` | `packages/` | Standard monorepo naming; clearer workspace semantics |
| F3 | CREATE | `apps/*/src/` | — | Source directory for each app (4 currently lack it) |
| F4 | CREATE | `tests/fixtures/` | — | Centralized test fixture storage |
| F5 | CREATE | `docs/workflows/` | — | Workflow documentation destination |
| F6 | KEEP | `docs/archive/` | `docs/history/` | Rename for clarity; keep content |
| F7 | KEEP | `infrastructure/` | `infrastructure/` | Add `.gitkeep` to preserve in version control |
| F8 | DELETE | `apps/*/routes/` | — | All 5 contain trivial unused stubs |

---

## 5. File Move Plan

### Phase 1 — Safe Reorganizations (no import changes needed)

| # | Action | Source | Target |
|---|--------|--------|--------|
| 1 | MOVE | `root/test_ticket.json` | `tests/fixtures/test_ticket.json` |
| 2 | MOVE | `root/test_ticket2.json` | `tests/fixtures/test_ticket2.json` |
| 3 | MOVE | `root/test_ticket3.json` | `tests/fixtures/test_ticket3.json` |
| 4 | MOVE | `root/test_fn_update.json` | `tests/fixtures/test_fn_update.json` |
| 5 | MOVE | `root/test_fn_urgency.json` | `tests/fixtures/test_fn_urgency.json` |
| 6 | MOVE | `root/agent_test_input.json` | `tests/fixtures/agent_test_input.json` |
| 7 | MOVE | `root/run_input.json` | `tests/fixtures/run_input.json` |
| 8 | MOVE | `root/update_perms.json` | `tests/fixtures/update_perms.json` |
| 9 | MOVE | `root/workflow_graph.json` | `tests/fixtures/workflow_graph.json` |
| 10 | MOVE | `root/check_urgency_fn.json` | `tests/fixtures/check_urgency_fn.json` |
| 11 | MOVE | `root/update_ticket_fn.json` | `tests/fixtures/update_ticket_fn.json` |
| 12 | MOVE | `root/CONNECTOR_INTEGRATION_REPORT.md` | `docs/connectors/CONNECTOR_INTEGRATION_REPORT.md` |
| 13 | MOVE | `workflows/ticket-intake-REPORT.md` | `docs/workflows/ticket-intake-REPORT.md` |

### Phase 2 — Flat Function Migration (requires import updates)

| # | Action | Source | Target |
|---|--------|--------|--------|
| 14 | MOVE+RENAME | `functions/assign_appointment_technician/code.py` | `functions/assign-appointment-technician/src/handler.py` |
| 15 | MOVE+RENAME | `functions/assign_appointment_technician/assign_appointment_technician.json` | `functions/assign-appointment-technician/function.json` |
| 16 | DELETE | `functions/assign_appointment_technician/` | (old flat directory) |
| 17 | MOVE+RENAME | `functions/collect_resolved_tickets/code.py` | `functions/collect-resolved-tickets/src/handler.py` |
| 18 | MOVE+RENAME | `functions/collect_resolved_tickets/collect_resolved_tickets.json` | `functions/collect-resolved-tickets/function.json` |
| 19 | DELETE | `functions/collect_resolved_tickets/` | (old flat directory) |
| 20 | MOVE+RENAME | `functions/finalize_slippage_review/code.py` | `functions/finalize-slippage-review/src/handler.py` |
| 21 | MOVE+RENAME | `functions/finalize_slippage_review/finalize_slippage_review.json` | `functions/finalize-slippage-review/function.json` |
| 22 | DELETE | `functions/finalize_slippage_review/` | (old flat directory) |
| 23 | MOVE | `functions/finalize-dispatch/code.py` | `functions/finalize-dispatch/src/handler.py` |
| 24 | MOVE | `functions/finalize-dispatch/finalize-dispatch.json` | `functions/finalize-dispatch/function.json` |
| 25 | DELETE | `functions/finalize-dispatch/` (old flat files) | (same directory, restructured) |
| 26 | MOVE+RENAME | `functions/resolve_dispute/code.py` | `functions/resolve-dispute/src/handler.py` |
| 27 | MOVE+RENAME | `functions/resolve_dispute/resolve_dispute.json` | `functions/resolve-dispute/function.json` |
| 28 | DELETE | `functions/resolve_dispute/` | (old flat directory) |
| 29 | MOVE+RENAME | `functions/update_account_health_status/code.py` | `functions/update-account-health-status/src/handler.py` |
| 30 | MOVE+RENAME | `functions/update_account_health_status/update_account_health_status.json` | `functions/update-account-health-status/function.json` |
| 31 | DELETE | `functions/update_account_health_status/` | (old flat directory) |

### Phase 3 — Flat Workflow Migration

| # | Action | Source | Target |
|---|--------|--------|--------|
| 32 | MOVE | `workflows/account-health-monitoring.json` | `workflows/account-health-monitoring/account-health-monitoring.json` |
| 33 | MOVE | `workflows/urgent-dispatch.json` | `workflows/urgent-dispatch/urgent-dispatch.json` |
| 34 | CREATE | `workflows/account-health/` | (new subdirectory) |
| 35 | MOVE | `workflows/account-health.json` | `workflows/account-health/account-health.json` |
| 36 | CREATE | `workflows/appointment-reminders/` | (new subdirectory) |
| 37 | MOVE | `workflows/appointment-reminders.json` | `workflows/appointment-reminders/appointment-reminders.json` |
| 38 | CREATE | `workflows/daily-standup/` | (new subdirectory) |
| 39 | MOVE | `workflows/daily-standup.json` | `workflows/daily-standup/daily-standup.json` |
| 40 | CREATE | `workflows/dispute-resolution/` | (new subdirectory) |
| 41 | MOVE | `workflows/dispute-resolution.json` | `workflows/dispute-resolution/dispute-resolution.json` |
| 42 | MOVE | `workflows/followup-slippage.json` | `workflows/followup-slippage-detector/followup-slippage.json` |
| 43 | CREATE | `workflows/ticket-intake/` | (new subdirectory) |
| 44 | MOVE | `workflows/ticket-intake.json` | `workflows/ticket-intake/ticket-intake.json` |

### Phase 4 — App Standardization

| # | Action | Source | Target |
|---|--------|--------|--------|
| 45 | MOVE | `apps/appointment-board/App.tsx` | `apps/appointment-board/src/App.tsx` |
| 46 | MOVE | `apps/appointment-board/App.css` | `apps/appointment-board/src/App.css` |
| 47 | MOVE | `apps/appointment-board/main.tsx` | `apps/appointment-board/src/main.tsx` |
| 48 | MOVE | `apps/appointment-board/index.html` | `apps/appointment-board/public/index.html` |
| 49 | MOVE | `apps/appointment-board/vite-env.d.ts` | `apps/appointment-board/src/vite-env.d.ts` |
| 50 | MOVE | `apps/appointment-board/components/` | `apps/appointment-board/src/components/` |
| 51 | MOVE | `apps/appointment-board/hooks/` | `apps/appointment-board/src/hooks/` |
| 52 | MOVE | `apps/appointment-board/pages/` | `apps/appointment-board/src/pages/` |
| 53 | MOVE | `apps/appointment-board/services/` | `apps/appointment-board/src/services/` |
| 54 | MOVE | `apps/appointment-board/state/` | `apps/appointment-board/src/state/` |
| 55 | MOVE | `apps/appointment-board/types/` | `apps/appointment-board/src/types/` |
| 56 | MOVE | `apps/appointment-board/routes/` | `apps/appointment-board/src/routes/` |
| 57-67 | MOVE | Repeat 45-56 for `crm-tracker`, `ops-dashboard`, `resolution-center` | (same pattern) |
| 68 | MOVE | `apps/support-queue/src/__tests__/` | `apps/support-queue/tests/` |
| 69 | MOVE | `apps/support-queue/src/setupTests.ts` | `apps/support-queue/tests/setup.ts` |

### Phase 5 — Documentation Consolidation

| # | Action | Source | Target |
|---|--------|--------|--------|
| 70 | RENAME | `docs/archive/OLD_architecture/` | `docs/history/architecture/` |
| 71 | RENAME | `docs/archive/OLD_implementation/` | `docs/history/implementation/` |
| 72 | RENAME | `docs/archive/OLD_recovery/` | `docs/history/recovery/` |
| 73 | RENAME | `docs/archive/OLD_validation/` | `docs/history/validation/` |
| 74 | MERGE | `docs/DEPENDENCY_AUDIT.md` into `docs/dependency-audit.md` | Keep the lowercase version, remove the uppercase duplicate |
| 75 | MERGE | `docs/project-audit/cleanup-plan.md` into `docs/cleanup-plan.md` | Keep the root version, remove the audit version |
| 76 | MOVE | `docs/archive/README.md` | `docs/history/README.md` |
| 77 | REMOVE | `apps/*/ARCHITECTURE.md` | Already covered by `docs/apps/*.md` and `docs/architecture.md` |

### Phase 6 — Shared Module Fixes

| # | Action | File | Change |
|---|--------|------|--------|
| 78 | EDIT | `packages/utils/index.ts` | Add exports for `filtering`, `sorting`, `string` |
| 79 | EDIT | Root `.env.example` | Comment that app-level `.env` files are optional |
| 80 | EDIT | `apps/support-queue/vite.config.ts` | Change port from 5176 to 5173 for consistency (if no conflict) |

### Phase 7 — Cleanup Actions

| # | Action | Target | Rationale |
|---|--------|--------|-----------|
| 81 | ADD | `infrastructure/.gitkeep` | Preserve directory in version control |
| 82 | REMOVE | `apps/*/routes/index.tsx` | All 5 are unused trivial stubs |
| 83 | KEEP | `archive/apps/packages/lemma-sdk.ts` | Historical reference only — do not remove |
| 84 | KEEP | `archive/apps/packages/types.ts` | Historical reference only — do not remove |
| 85 | REMOVE | `functions/*/tests/fixtures/` (empty dirs) | Empty directories, no content |

---

## 6. Migration Order

The migration is divided into **7 phases** to be executed sequentially. Each phase is self-contained and can be verified independently.

### Phase 0 — Preparation
**Risk:** None  
**Verification:** `git status` shows only planned changes

1. Create `tests/fixtures/` directory
2. Add `.gitkeep` to `infrastructure/`
3. Create `docs/workflows/` directory
4. Create `docs/history/` directory structure

### Phase 1 — Root File Cleanup (Safe)
**Risk:** None — no code imports  
**Verification:** `npx tsx scripts/test.ts` still passes

1. Move all root `test_*.json` files → `tests/fixtures/`
2. Move `agent_test_input.json` → `tests/fixtures/`
3. Move `run_input.json` → `tests/fixtures/`
4. Move `update_perms.json` → `tests/fixtures/`
5. Move `workflow_graph.json` → `tests/fixtures/`
6. Move `check_urgency_fn.json` → `tests/fixtures/`
7. Move `update_ticket_fn.json` → `tests/fixtures/`
8. Move `CONNECTOR_INTEGRATION_REPORT.md` → `docs/connectors/`
9. Move `workflows/ticket-intake-REPORT.md` → `docs/workflows/`

### Phase 2 — Database Rename (Safe)
**Risk:** None — no code imports to `database/docs/`  
**Verification:** `git diff --stat` shows rename

1. Rename `database/docs/` → `database/seeds/`

### Phase 3 — Function Restructure (Medium Risk)
**Risk:** Requires updating `function.json` `"entrypoint"` paths  
**Verification:** Run `pytest` on each affected function

For each flat-structure function:
1. Create `src/`, `schemas/`, `tests/` directories
2. Move `code.py` → `src/handler.py`
3. Create `schemas/input.json` and `schemas/output.json` from existing logic
4. Create `tests/__init__.py` and basic test stub
5. Update `function.json` `"entrypoint"` to `src/handler.py`
6. Delete old flat files

**Migration order within Phase 3:**
1. `finalize-dispatch` (already kebab-cased — simplest)
2. `assign_appointment_technician` → `assign-appointment-technician`
3. `collect_resolved_tickets` → `collect-resolved-tickets`
4. `finalize_slippage_review` → `finalize-slippage-review`
5. `resolve_dispute` → `resolve-dispute`
6. `update_account_health_status` → `update-account-health-status`

### Phase 4 — Workflow Standardization (Low Risk)
**Risk:** Low — JSON files are data, not code; no import paths  
**Verification:** Verify no references to old flat paths in docs

1. Remove duplicate `workflows/account-health-monitoring.json` (keep subdirectory version)
2. Remove duplicate `workflows/urgent-dispatch.json` (keep subdirectory version)
3. Create subdirectories for flat workflows; move JSONs in
4. Move `workflows/followup-slippage.json` into `followup-slippage-detector/` subdirectory

### Phase 5 — App Standardization (Medium Risk)
**Risk:** Requires updating `tsconfig.json` `"include"` paths, `vite.config.ts` root, `index.html` `<script>` src  
**Verification:** `npm run build` for each app; `npm run dev` smoke test

1. Create `apps/*/src/` directories for 4 apps (not `support-queue`)
2. Move source files from app root → `src/`
3. Create `apps/*/public/` directories
4. Move `index.html` → `public/`
5. Update `tsconfig.json` `"include"` to `["src"]`
6. Update `vite.config.ts` root if needed
7. Move `support-queue` tests from `src/__tests__/` → `tests/`

### Phase 6 — Documentation Consolidation (Low Risk)
**Risk:** Low — no code changes  
**Verification:** Verify cross-reference links still work

1. Rename `docs/archive/` → `docs/history/`
2. Merge duplicate/overlapping docs (keep the more current version)
3. Move misplaced root report files into `docs/`

### Phase 7 — Final Polish (Low Risk)
**Risk:** Low  
**Verification:** Full `npm run build` + `npm run test` pass

1. Rename `packages/` → `packages/` (update all import paths across apps)
2. Add missing exports to `packages/utils/index.ts`
3. Normalize port 5176 → 5173 in `support-queue`
4. Remove empty `apps/*/routes/` directories
5. Remove empty `functions/*/tests/fixtures/` directories

---

## 7. Risks & Mitigations

| Risk | Phase | Impact | Mitigation |
|------|-------|--------|------------|
| Import paths break after `packages/` → `packages/` rename | 7 | High — all apps import from `packages/` | Use `sed` or codemod for bulk replacement; verify with `tsc --noEmit` |
| Import paths break after app files move to `src/` | 5 | Medium — relative imports within each app | Update tsconfig `include` and verify with build |
| `function.json` entrypoint paths change | 3 | Medium — functions fail to deploy | Update entrypoint in each `function.json` and run `pytest` |
| Documentation cross-reference links break | 6 | Low | Update relative links; use absolute paths where possible |
| Git history bloat from renames | All | Low | Use `git mv` for renames; `git log --follow` preserves history |
| `.env.example` consolidation confuses developers | 2 | Low | Add clear comments directing to root `.env.example` |
| Empty `infrastructure/` removed by `git clean` | 0 | Low | `.gitkeep` prevents this |

### Rollback Strategy

Each phase produces a single commit. To roll back:
- **Phase 1-2:** `git revert <commit>` — no code impact
- **Phase 3-5:** `git revert <commit>` — then re-verify imports and paths
- **Phase 6-7:** `git revert <commit>` — then update any changed references

---

## Appendix A: File Count Impact

| Phase | Files Moved | Files Deleted | Files Created | Files Edited |
|-------|-------------|---------------|---------------|--------------|
| 0 (Prep) | 0 | 0 | 4 | 0 |
| 1 (Root cleanup) | 12 | 0 | 0 | 0 |
| 2 (Database rename) | ~11 (git mv) | 0 | 0 | 0 |
| 3 (Function restructure) | 12 | 6 (old dirs) | 18 (new dirs + stub files) | 6 (function.json) |
| 4 (Workflow std) | 9 | 2 (duplicates) | 6 (subdirs) | 0 |
| 5 (App std) | ~60 | 0 | 5 (src dirs) | 10 (tsconfig + vite) |
| 6 (Docs consolidate) | ~20 | 0 | 0 | 0 |
| 7 (Final polish) | ~28 (git mv) | 6 (empty dirs + routes) | 0 | ~30 (import paths) |

**Total net change:** ~140 file moves, ~14 deletions, ~33 creations, ~46 edits

## Appendix B: Target File Count by Directory

| Directory | Files After Restructure |
|-----------|------------------------|
| `apps/` | ~100 (source files in `src/` subdirs) |
| `agents/` | 40 (unchanged) |
| `database/` | 12 (unchanged content, renamed dir) |
| `docs/` | ~45 (consolidated from 76) |
| `functions/` | ~80 (expanded with schemas + test stubs) |
| `infrastructure/` | 1 (`.gitkeep`) |
| `packages/` | 28 (renamed from `packages/`) |
| `scripts/` | 7 (unchanged) |
| `tests/` | 12 (consolidated fixtures) |
| `workflows/` | 13 (standardized subdirectories) |
| Root files | ~10 (cleaned from 21) |
| **Total** | **~348** (reduction from ~375 due to deduplication) |
