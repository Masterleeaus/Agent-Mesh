# Repository Audit — ResQAI

Generated: 2026-06-28
Audit Type: Full Repository Scan (read-only)

---

## 1. Duplicate Files

| File 1 | File 2 | Status |
|--------|--------|--------|
| `docs/agents.md` | `docs/AGENT_REVIEW.md` | Content overlap — AGENT_REVIEW.md is a superset review |
| `docs/architecture.md` | `docs/ARCHITECTURE_V2.md` | Architecture V2 appears to be updated version |
| `docs/database.md` | `docs/DATABASE_REVIEW.md` | DATABASE_REVIEW.md is a review with additional notes |
| `docs/deployment.md` | `docs/deployment-summary.md` | deployment-summary is a condensed version |
| `docs/functions.md` | `docs/FUNCTION_REVIEW.md` | FUNCTION_REVIEW.md is a review with additional notes |
| `docs/README.md` | `docs/SUMMARY.md` | Both contain documentation index |
| `shared/sdk/lemma-sdk.ts` | `archive/apps/shared/lemma-sdk.ts` | Exact copy — archive residue |
| `shared/types/index.ts` | `archive/apps/shared/types.ts` | Near-copy — archive residue |
| `workflows/account-health-monitoring.json` | `workflows/account-health-monitoring/account-health-monitoring.json` | Related but may differ on refs |

---

## 2. Obsolete / Superseded Files

| File | Reason |
|------|--------|
| `docs/archive/OLD_architecture/*` | Superseded by docs/architecture.md and ARCHITECTURE_V2.md |
| `docs/archive/OLD_implementation/EXTRACTION_PLAN.md` | Extraction completed |
| `docs/archive/OLD_recovery/*` | Recovery completed |
| `docs/archive/OLD_validation/*` | Validation reports — superseded by integration status |
| `docs/PHASE6_PREPARATION.md` | Phase 6 preparation — likely superseded |
| `docs/INTEGRATION_TEST_PLAN.md` | Test plan — may be outdated |
| `docs/platform-validation-report.md` | Validation report — likely one-time |
| `docs/SECURITY_REPORT.md` | Security report — one-time |
| `docs/PERFORMANCE_REPORT.md` | Performance report — one-time |
| `docs/REACT_OPTIMIZATION_REPORT.md` | Optimization report — one-time |
| `docs/DUPLICATE_CODE_REPORT.md` | Code duplication report — one-time |
| `docs/SERVICE_LAYER_REPORT.md` | Service layer report — one-time |
| `docs/PROJECT_HEALTH_V2.md` | Project health — superseded by project-audit/ |
| `docs/PROJECT_STATUS.md` | Project status — likely outdated |

---

## 3. Generated / Build Artifacts

| Path | Type | Action |
|------|------|--------|
| `apps/*/dist/index.html` | Build output | Should be in .gitignore (dist/ pattern may not match subdirs) |
| `apps/*/dist/assets/*` | Build output | Same as above |
| `functions/*/.pytest_cache/` | Cache | Already in .gitignore |
| `functions/*/__pycache__/` | Cache | Already in .gitignore |
| `node_modules/` | Dependencies | Already in .gitignore |
| `package-lock.json` | Lock file | Required |
| `apps/*/package-lock.json` | Lock files | Duplicate — npm workspace hoists to root |

---

## 4. Temporary / Backup Files

| File | Likely Purpose |
|------|----------------|
| `agent_test_input.json` | Test fixture |
| `run_input.json` | Test fixture |
| `test_fn_update.json` | Test fixture |
| `test_fn_urgency.json` | Test fixture |
| `test_ticket.json` | Test fixture |
| `test_ticket2.json` | Test fixture |
| `test_ticket3.json` | Test fixture |
| `check_urgency_fn.json` | Test fixture / scratch |
| `update_perms.json` | Permission update payload |
| `update_ticket_fn.json` | Test fixture / scratch |
| `workflow_graph.json` | Generated graph representation |

---

## 5. Unused Markdown Files

| File | Notes |
|------|-------|
| `CONNECTOR_INTEGRATION_REPORT.md` (root) | Report — should be in docs/ |
| `workflows/ticket-intake-REPORT.md` | Workflow-specific report in wrong location |
| `docs/apps/appointment-board.md` | Duplicates info in docs/applications.md |
| `docs/apps/crm-tracker.md` | Same |
| `docs/apps/ops-dashboard.md` | Same |
| `docs/apps/resolution-center.md` | Same |
| `docs/apps/support-queue.md` | Same |

---

## 6. Duplicate Configuration

| Config | Locations | Notes |
|--------|-----------|-------|
| `tsconfig.json` | Root + 5 apps | Root excludes apps; each app has its own |
| `package.json` | Root + 5 apps | Dependencies duplicated across apps |
| `.env` | Root + 5 apps | Each app has its own .env/.env.example |
| `vite.config.ts` | Root none + 5 apps | No centralized vite config |
| `package-lock.json` | Root + 5 apps | Workspaces should produce single lock |

---

## 7. Duplicate Scripts

No duplicate scripts found. All scripts in `scripts/` are unique.

---

## 8. Unused Assets

| Asset | Path | Notes |
|-------|------|-------|
| No image/font assets found | — | No public/assets directories |
| `.npmrc` | Root | Contains only `legacy-peer-deps=true` — review if still needed |

---

## 9. Empty Folders

| Folder | Notes |
|--------|-------|
| `infrastructure/` | Completely empty — reserved for future use |

---

## 10. Inconsistent Naming

### Functions (kebab-case vs snake_case)

| Kebab-case | snake_case |
|------------|------------|
| `check-ticket-urgency/` | `assign_appointment_technician/` |
| `update-ticket-record/` | `collect_resolved_tickets/` |
| `account-health-scan/` | `finalize_slippage_review/` |
| `flag-slipping-followups/` | `resolve_dispute/` |
| `finalize-dispatch/` | `update_account_health_status/` |

### Documentation (UPPER_SNAKE vs lowercase)

| UPPER_SNAKE_CASE | lowercase |
|------------------|-----------|
| `AGENT_REVIEW.md` | `agents.md` |
| `ARCHITECTURE_V2.md` | `architecture.md` |
| `DATABASE_REVIEW.md` | `database.md` |
| `FUNCTION_REVIEW.md` | `functions.md` |
| `DEPENDENCY_AUDIT.md` | `applications.md` |
| `DUPLICATE_CODE_REPORT.md` | `deployment.md` |
| `INTEGRATION_TEST_PLAN.md` | `troubleshooting.md` |
| ... (15 more) | `roadmap.md` |

### App Structure Inconsistency

- `apps/support-queue/` has `src/setupTests.ts` with a `src/` subdirectory; other apps have test configs at root
- `apps/support-queue/` has `App.css`; other apps use inline styles or no CSS file

---

## Summary of Issues

| Category | Count | Severity |
|----------|-------|----------|
| Duplicate files | 10+ pairs | Medium |
| Obsolete docs | 15+ files | Low |
| Build artifacts committed | ~10 files | Medium |
| Root-level test fixtures | 11 JSON files | Low |
| Unused/misplaced markdown | 8 files | Low |
| Empty directories | 1 | Low |
| Naming inconsistencies | 20+ items | Medium |
| Config duplication | 5 categories | Medium |
