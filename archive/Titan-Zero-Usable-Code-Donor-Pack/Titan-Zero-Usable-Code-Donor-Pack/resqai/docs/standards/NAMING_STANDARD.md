# ResQAI Naming Standard

Generated: 2026-06-28
Scope: Entire repository — directories, files, code identifiers, database schema, configuration
Mode: **Read-Only Audit — No Renaming Yet, Planning Only**

---

## Table of Contents

1. [Naming Standard](#1-naming-standard)
2. [Rename Plan](#2-rename-plan)
3. [Impact Report](#3-impact-report)
4. [Migration Order](#4-migration-order)

---

## 1. Naming Standard

### 1.1 Universal Rules

| Rule | Applies To | Example |
|------|-----------|---------|
| All identifiers are **English** | Everything | `customer_name`, not `kunden_name` |
| No transliteration | Everything | `health_score`, not `helth_scor` |
| No abbreviations unless universally known | Everything | `id`, `url`, `api`, `sdk`, `ui`, `kpi` — allowed; `cust`, `txn` — not allowed |
| Spell-check all names | Everything | `FOLLOWUP`, not `FOLLOwUP`; `WEIGHT`, not `wEIGHT` |

---

### 1.2 Directory Naming

| Context | Convention | Example |
|---------|-----------|---------|
| **Root-level domains** | `lowercase` | `agents/`, `apps/`, `docs/`, `database/`, `functions/`, `packages/` |
| **App directories** | `kebab-case` | `support-queue/`, `crm-tracker/`, `appointment-board/` |
| **Agent directories** | `kebab-case` | `request-classifier/`, `account-health-monitor/` |
| **Function directories** | `kebab-case` | `account-health-scan/`, `flag-slipping-followups/` |
| **Workflow directories** | `kebab-case` | `ticket-intake/`, `dispute-resolution/` |
| **Packages** | `lowercase` | `sdk/`, `ui/`, `config/`, `types/`, `utils/` |
| **src/ subdirectories** | `lowercase` (plural prefered) | `components/`, `hooks/`, `services/`, `pages/`, `routes/`, `types/`, `state/`, `tests/` |
| **docs/ subdirectories** | `lowercase` | `apps/`, `testing/`, `security/`, `project-audit/` |

**Current compliance:** ~100% — no violations found at directory level.

---

### 1.3 File Naming

| Category | Convention | Example |
|----------|-----------|---------|
| **React components** | `PascalCase.tsx` | `TicketList.tsx`, `FilterBar.tsx` |
| **UI package components** | `PascalCase.tsx` | `StatusBadge.tsx`, `LoadingSpinner.tsx` |
| **Pages** | `PascalCase.tsx` | `SupportQueuePage.tsx`, `CrmTrackerPage.tsx` |
| **App entry** | `PascalCase.tsx` | `App.tsx` |
| **Hooks** | `camelCase.ts` (`useXxx`) | `useTickets.ts`, `useCrm.ts` |
| **Services** | `kebab-case.ts` (`*-service`) | `ticket-service.ts`, `crm-service.ts` |
| **Utils / helpers** | `kebab-case.ts` | `date.ts`, `service-helpers.ts`, `sorting.ts` |
| **SDK / library** | `kebab-case.ts` | `lemma-sdk.ts` |
| **Config / constants** | `kebab-case.ts` | `environment.ts`, `constants.ts`, `paths.ts` |
| **Types / interfaces** | `kebab-case.ts` | `index.ts` (barrel) |
| **State (atoms)** | `kebab-case.ts` | `atoms.ts` |
| **Routes** | `kebab-case.tsx` | `index.tsx` (barrel) |
| **Entry point** | `kebab-case.tsx` | `main.tsx` |
| **Test files** | `kebab-case.test.ts` | `ticket-service.test.ts` |
| **Test setup** | `kebab-case.ts` | `setup.ts` |
| **Python source** | `snake_case.py` | `handler.py`, `logic.py`, `models.py` |
| **Python tests** | `snake_case.py` | `test_logic.py`, `test_handler.py` |
| **Python __init__** | `__init__.py` | `__init__.py` (standard) |
| **Agent definitions** | `lowercase.md` | `instruction.md`, `README.md` (PascalCase acronym) |
| **Agent tool/workflow docs** | `kebab-case.md` | `tool-access.md`, `workflow-role.md` |
| **JSON config** | `lowercase.json` | `agent.json`, `permissions.json` |
| **JSON schemas** | `kebab-case.json` | `input-schema.json`, `output-schema.json` |
| **Function config** | `lowercase.json` | `function.json` |
| **Database seeds** | `kebab-case.json` (`{table}-records`) | `tickets-records.json`, `operations_log-records.json` |
| **Database migrations** | `snake_case.sql` (`NNN_table_action`) | `001_tickets_add_status_values_and_column.sql` |
| **Documentation (general)** | `kebab-case.md` | `deployment.md`, `architecture-overview.md` |
| **Documentation (reports)** | `kebab-case.md` | `testing-report.md`, `build-pipeline-report.md` |
| **Config files (root)** | `lowercase` with extension | `tsconfig.json`, `package.json`, `.npmrc` |

#### Exceptions
| Filename | Reason |
|----------|--------|
| `README.md` | Industry standard — all-caps acronym |
| `__init__.py` | Python standard — dunder filename |
| `vite.config.ts` | Vite convention — dot-separated config |
| `vite-env.d.ts` | Vite convention — ambient declaration |
| `.env`, `.env.example` | Industry standard — hidden dotfiles |

---

### 1.4 TypeScript/React Identifier Naming

| Category | Convention | Example |
|----------|-----------|---------|
| **Component functions** | `PascalCase` (named function or const) | `function TicketList()` or `const TicketList = memo(...)` |
| **Component props interface** | `PascalCase + Props` | `TicketListProps` |
| **Custom hooks** | `camelCase` (`useXxx`) | `useTickets`, `useCrmContext` |
| **Service functions** | `camelCase` (verb prefix) | `fetchTickets`, `updateTicket`, `runCoordinator` |
| **Utility functions** | `camelCase` | `formatCurrency`, `filterByStatus`, `daysSince` |
| **SDK functions** | `camelCase` | `initLemmaClient`, `waitForAgentResponse`, `listRecords` |
| **TypeScript interfaces** | `PascalCase` | `Customer`, `AccountHealthScanResult` |
| **Type aliases** | `PascalCase` | `ResolutionType`, `AgentConversation` |
| **Variables** | `camelCase` | `const [editedReply, setEditedReply] = useState(...)` |
| **Constants (module-level)** | `SCREAMING_SNAKE` | `NAV_ITEMS`, `SEVERITY_COLORS`, `TICKET_STATUS_VARIANTS` |
| **CSS style objects** | `camelCase` | `fontWeight`, `maxWidth`, `flexWrap` |
| **Context objects** | `PascalCase` with `Ctx`/`Context` suffix | `SupportQueueCtx`, `DashboardContext` |
| **State interfaces** | `PascalCase` with `State`/`ContextValue` | `SupportQueueState`, `CrmContextValue` |

---

### 1.5 Python Identifier Naming

| Category | Convention | Example |
|----------|-----------|---------|
| **Functions** | `snake_case` | `compute_account_health`, `run_scan`, `sort_rows_riskiest_first` |
| **Classes / Models** | `PascalCase` | `AccountHealthScanInput`, `AssignAppointmentTechnicianInput` |
| **Variables** | `snake_case` | `days_overdue`, `health_score`, `slipping_followup` |
| **Constants** | `SCREAMING_SNAKE` | (in function.json as `python_packages`) |
| **Test classes** | `PascalCase` | `TestClassifyScore`, `TestComputeAccountHealth` |
| **Test functions** | `snake_case` | `test_urgent_routes_to_skip_coordination` |
| **Private helpers** | `snake_case` with `_` prefix | `_parse_date`, `_days_since` |
| **Module `__init__`** | `__init__.py` | Standard Python |

---

### 1.6 Database/Schema Naming

| Category | Convention | Example |
|----------|-----------|---------|
| **Table names** | `snake_case`, plural nouns | `customers`, `operations_log`, `followups` |
| **Column names** | `snake_case`, no prefixes | `customer_name`, `approved_to_send`, `related_appointment_id` |
| **Primary keys** | `id` | `id` (always `uuid` type) |
| **Foreign keys** | `{referenced_table_singular}_id` | `customer_id`, `technician_id` |
| **Related FKs** | `related_{table_singular}_id` | `related_appointment_id`, `related_ticket_id` |
| **Timestamps** | `created_at`, `updated_at` | System-managed on all tables |
| **Boolean columns** | `snake_case` adjective/past-participle | `approved_to_send` |
| **Enum column names** | `snake_case`, singular nouns | `status`, `priority`, `service_type`, `health` |
| **Enum values (single-word)** | `lowercase` | `active`, `urgent`, `email`, `open`, `completed` |
| **Enum values (multi-word)** | `snake_case` | `approved_to_send`, `general_inquiry`, `ac_repair` |

---

### 1.7 Backend/API Identifier Naming

| Category | Convention | Example |
|----------|-----------|---------|
| **Agent names** (JSON `name` field) | `kebab-case` | `"request-classifier"`, `"operations-coordinator"` |
| **Function names** (JSON `name` field) | `snake_case` | `"account_health_scan"`, `"flag_slipping_followups"` |
| **Workflow graph names** | `snake_case` | `workflow_intake`, `workflow_dispute` |
| **SQL migration files** | `snake_case` (`NNN_table_action`) | `001_tickets_add_status_values_and_column.sql` |
| **Seed filenames** | `kebab-case` + `-records` | `tickets-records.json`, `operations_log-records.json` |
| **Permission IDs** | `dot.notation` | `datastore.record.read`, `function.execute` |
| **Resource types** | `snake_case` | `datastore_table`, `function`, `connector` |
| **Connector names** (JSON) | `lowercase` | `discord`, `gmail`, `reddit`, `facebook` |
| **JSON schema property keys** | `camelCase` | `maxRecommendations`, `forceReanalysis`, `draftStatus` |
| **Backend action identifiers** | `snake_case` | `classify_ticket`, `draft_reply`, `approve_draft` |

---

### 1.8 Documentation Naming

| Category | Convention | Example |
|----------|-----------|---------|
| **Index/overview files** | `kebab-case.md` | `architecture-overview.md`, `deployment-guide.md` |
| **Report files** | `kebab-case.md` | `testing-report.md`, `build-pipeline-report.md` |
| **Audit files** | `kebab-case.md` | `documentation-audit.md`, `dependency-audit.md` |
| **Plan files** | `kebab-case.md` | `cleanup-plan.md`, `migration-plan.md` |
| **Review files** | `kebab-case.md` | `agent-review.md`, `function-review.md` |
| **Documentation subdirs** | `lowercase` | `apps/`, `testing/`, `security/` |
| **README** | `README.md` | Industry standard |

> **Note:** The current `docs/` directory has a mix of `kebab-case.md`, `SCREAMING_SNAKE.md`, and `PascalCase.md`. The standard recommends all documentation files migrate to `kebab-case.md` for consistency. `README.md` is exempt as an industry standard.

---

## 2. Rename Plan

### 2.1 Typo Corrections (High Priority — Fix Now)

These are clearly unintended errors that affect readability and searchability.

| # | Current Name | Correct Name | Location | Category |
|---|-------------|-------------|----------|----------|
| 1 | `STATUS_wEIGHT` | `STATUS_WEIGHT` | `packages/config/constants.ts` | Constant typo |
| 2 | `FOLLOwUP_STATUS_VARIANTS` | `FOLLOWUP_STATUS_VARIANTS` | `packages/config/constants.ts` | Constant typo |
| 3 | `COMMON_ALLOwED_ACTIONS` | `COMMON_ALLOWED_ACTIONS` | `packages/config/agents.ts` | Constant typo |
| 4 | `AppointmentwithDetails` | `AppointmentWithDetails` | `apps/appointment-board/src/types/index.ts` | Interface name typo |

**Impact:** 4 files. All are identifier renames (refactor in IDE). No external API changes.

---

### 2.2 Consistency Fixes (Medium Priority — Per Category)

These violate the established standard and should align with sibling patterns.

| # | Current | Standard | Location | Reason |
|---|---------|----------|----------|--------|
| 5 | `account_health_monitor` (snake_case) | `account-health-monitor` (kebab-case) | `agents/account-health-monitor/agent.json` `name` field | 4 other agents use kebab-case in this field |
| 6 | `account_health_monitor` (snake_case) | `account-health-monitor` (kebab-case) | `agents/account-health-monitor/permissions.json` `agent_name` field | Same inconsistency |
| 7 | `needs_followup` (closed compound) | `needs_follow_up` (open compound) | Database `appointments.status` enum | Inconsistent with `follow_up` in `tickets.request_type` |
| 8 | `followups` (closed compound) | `follow_ups` (open compound) | Database table name | `operations_log` uses underscore; `followups` should too for consistency |
| 9 | `cancelled` (British spelling) | `canceled` (American spelling) | Database `appointments.status` enum | Rest of codebase uses American English |

> **Note on #8 (`followups`):** Renaming a table is a high-impact migration. Consider deferring or accepting the inconsistency. All other compound table names use underscores.

---

### 2.3 Documentation File Renames (Low Priority — Batch Migration)

The `docs/` directory has 37 files using 3 different casing conventions. Proposed migration to `kebab-case`:

#### Files to Rename: SCREAMING_SNAKE → kebab-case (22 files)

| # | Current Name | Proposed Name |
|---|-------------|---------------|
| 10 | `AGENT_REVIEW.md` | `agent-review.md` |
| 11 | `ARCHITECTURE_V2.md` | `architecture-v2.md` |
| 12 | `DATABASE_REVIEW.md` | `database-review.md` |
| 13 | `DUPLICATE_CODE_REPORT.md` | `duplicate-code-report.md` |
| 14 | `FUNCTION_REVIEW.md` | `function-review.md` |
| 15 | `INTEGRATION_TEST_PLAN.md` | `integration-test-plan.md` |
| 16 | `PERFORMANCE_REPORT.md` | `performance-report.md` |
| 17 | `PHASE6_PREPARATION.md` | `phase6-preparation.md` |
| 18 | `PROJECT_HEALTH_V2.md` | `project-health-v2.md` |
| 19 | `PROJECT_STATUS.md` | `project-status.md` |
| 20 | `REACT_OPTIMIZATION_REPORT.md` | `react-optimization-report.md` |
| 21 | `SECURITY_REPORT.md` | `security-report.md` |
| 22 | `SERVICE_LAYER_REPORT.md` | `service-layer-report.md` |
| 23 | `SUMMARY.md` | `summary.md` |
| 24 | `WORKFLOW_DESIGN.md` | `workflow-design.md` |
| 25 | `CONNECTOR_INTEGRATION_REPORT.md` | `connector-integration-report.md` |
| 26 | `SECURITY_AUDIT.md` | `security-audit.md` |
| 27 | `REPOSITORY_RESTRUCTURE_PLAN.md` | `repository-restructure-plan.md` |

#### Files to Rename: PascalCase → kebab-case (8 files)

| # | Current Name | Proposed Name |
|---|-------------|---------------|
| 28 | `CLEANUP_REPORT.md` (archive) | `cleanup-report.md` |
| 29 | `DEPENDENCY_REPORT.md` (archive) | `dependency-report.md` |
| 30 | `PROJECT_HEALTH.md` (archive) | `project-health.md` |
| 31 | `REMAINING_WORK.md` (archive) | `remaining-work.md` |
| 32 | `TREE_AFTER_REFACTOR.md` (archive) | `tree-after-refactor.md` |
| 33 | `UNUSED_FILES.md` (archive) | `unused-files.md` |
| 34 | `WORKSPACE_MIGRATION_REPORT.md` (archive) | `workspace-migration-report.md` |
| 35 | `AGENT_RECOVERY_REPORT.md`, `FUNCTIONS_RECOVERY_REPORT.md`, `APP_VALIDATION_REPORT.md` (history) | `agent-recovery-report.md`, `functions-recovery-report.md`, `app-validation-report.md` |
| 36 | `APPOINTMENT_BOARD_LIVE_INTEGRATION.md` | `appointment-board-live-integration.md` |
| 37 | `CRM_TRACKER_LIVE_INTEGRATION.md` | `crm-tracker-live-integration.md` |
| 38 | `LOCAL_GAP_REPORT.md` | `local-gap-report.md` |
| 39 | `OPS_DASHBOARD_LIVE_INTEGRATION.md` | `ops-dashboard-live-integration.md` |
| 40 | `RESOLUTION_CENTER_LIVE_INTEGRATION.md` | `resolution-center-live-integration.md` |
| 41 | `SUPPORT_QUEUE_VALIDATION_REPORT.md` | `support-queue-validation-report.md` |
| 42 | `AGENT_ARCHITECTURE.md` | `agent-architecture.md` |
| 43 | `DATABASE_SCHEMA.md` | `database-schema.md` |
| 44 | `IMPLEMENTATION_ROADMAP.md` | `implementation-roadmap.md` |
| 45 | `PROJECT_STRUCTURE.md` | `project-structure.md` |
| 46 | `SYSTEM_INVENTORY.md` | `system-inventory.md` |
| 47 | `EXTRACTION_PLAN.md` | `extraction-plan.md` |

> **Total doc renames:** ~37 files. All internal cross-references (links between docs) must be updated. This is a pure rename — no content changes.

---

### 2.4 Component Style Inconsistency (Optional)

`appointment-board` uses `FC` type + `default export` pattern while other 4 apps use `named function` exports. This is a style choice, not a bug.

| # | Current Pattern | Location | Recommended |
|---|----------------|----------|-------------|
| 48 | `const Component: FC = () => {}` + `export default memo(Component)` | `apps/appointment-board/src/components/*.tsx` | Align with other apps: `export const Component = memo(function Component(...))` |

**Impact:** 6 files in appointment-board. Pure refactor, no behavior change. Low priority.

---

## 3. Impact Report

### 3.1 Rename Severity Matrix

| Severity | Count | Risk | Notes |
|----------|-------|------|-------|
| **High** (typos) | 4 identifiers | Low | IDE refactor covers all references |
| **Medium** (standard violations) | 4 identifiers + 1 DB enum | Medium | DB enum rename requires migration |
| **Low** (docs rename) | ~37 files | Medium | All internal links must be updated |
| **Optional** (style) | 6 files | Low | No behavior change |

### 3.2 Impact by Layer

| Layer | Files Affected | Renames Needed | Risk Level |
|-------|---------------|----------------|------------|
| **TypeScript source** | 6 | 4 identifier renames + optional 6 style refactors | Low |
| **Python source** | 0 | 0 | None |
| **Database schema** | 1 table, 1 enum | `followups` → `follow_ups` (table), `needs_followup` → `needs_follow_up` (enum) | **High** (migration required) |
| **Agent config** | 2 files | 2 JSON `name` field changes | Low |
| **Documentation** | ~37 files | Filename renames + internal link updates | Medium |
| **Config/constants** | 2 files | 3 constant typo fixes | Low |
| **Build/CI** | 0 | 0 | None |

### 3.3 Database Rename Impact

> Renaming `followups` table to `follow_ups` is the highest-impact change:
> - Affects 9 SQL references (schema, FKs, migrations)
> - Affects 5 agents that reference the table
> - Affects 2 Python functions that query the table
> - Affects all seed data filenames
> - Requires a database migration with `ALTER TABLE ... RENAME TO`
> - All FK references, permission grants, and agent configs must update
>
> **Recommendation:** Defer table rename. Accept the inconsistency or batch with a schema migration cycle.

---

## 4. Migration Order

### Phase 1: Typo Fixes (Estimated: 10 min, Zero Risk)

| Step | Files | Action |
|------|-------|--------|
| 1.1 | `packages/config/constants.ts` | `STATUS_wEIGHT` → `STATUS_WEIGHT` |
| 1.2 | `packages/config/constants.ts` | `FOLLOwUP_STATUS_VARIANTS` → `FOLLOWUP_STATUS_VARIANTS` |
| 1.3 | `packages/config/agents.ts` | `COMMON_ALLOwED_ACTIONS` → `COMMON_ALLOWED_ACTIONS` |
| 1.4 | `apps/appointment-board/src/types/index.ts` | `AppointmentwithDetails` → `AppointmentWithDetails` |

### Phase 2: Agent Config Consistency (Estimated: 5 min, Low Risk)

| Step | Files | Action |
|------|-------|--------|
| 2.1 | `agents/account-health-monitor/agent.json` | `"name": "account_health_monitor"` → `"account-health-monitor"` |
| 2.2 | `agents/account-health-monitor/permissions.json` | `"agent_name": "account_health_monitor"` → `"account-health-monitor"` |

### Phase 3: Documentation Rename (Estimated: 30 min, Medium Risk)

| Step | Area | Files | Strategy |
|------|------|-------|----------|
| 3.1 | Root `docs/` | ~22 SCREAMING_SNAKE files | Batch rename + update `docs/README.md` index + internal cross-refs |
| 3.2 | `docs/history/` | ~15 PascalCase files | Batch rename + update `docs/history/README.md` |
| 3.3 | `archive/reports/` | ~7 PascalCase files | Batch rename |
| 3.4 | Update cross-refs | All `.md` files | Search for old filenames in links, update to new |

### Phase 4: Database Schema (Deferred / Low Priority)

| Step | Object | Action | Scheduled |
|------|--------|--------|-----------|
| 4.1 | `appointments.status` enum | `needs_followup` → `needs_follow_up` | Next schema migration cycle |
| 4.2 | `followups` table | `followups` → `follow_ups` | Batch with major schema version |

### Phase 5: Component Style Alignment (Optional, Deferred)

| Step | Files | Action | Scheduled |
|------|-------|--------|-----------|
| 5.1 | `apps/appointment-board/src/components/*.tsx` (6 files) | Convert to named function exports | When refactoring appointment-board |

---

## Appendix A: Current vs. Standard Casing Summary

| Element | Current Dominant Convention | Standard | Compliance |
|---------|---------------------------|----------|------------|
| **Directories** | `kebab-case` | `kebab-case` | **100%** |
| **Component files** | `PascalCase.tsx` | `PascalCase.tsx` | **100%** |
| **Hook files** | `camelCase.ts` | `camelCase.ts` | **100%** |
| **Service files** | `kebab-case.ts` | `kebab-case.ts` | **100%** |
| **Config files** | `kebab-case.ts` | `kebab-case.ts` | **100%** |
| **Python files** | `snake_case.py` | `snake_case.py` | **100%** |
| **Test files (TS)** | `kebab-case.test.ts` | `kebab-case.test.ts` | **100%** |
| **Test files (Python)** | `snake_case.py` | `snake_case.py` | **100%** |
| **Database tables** | `snake_case` plural | `snake_case` plural | **~89%** (1 outlier: `followups`) |
| **Database columns** | `snake_case` | `snake_case` | **100%** |
| **Enum values** | `snake_case` | `snake_case` | **~95%** (1 outlier: `needs_followup`) |
| **Component exports** | `PascalCase` | `PascalCase` | **100%** |
| **Hook names** | `camelCase` (`useXxx`) | `camelCase` (`useXxx`) | **100%** |
| **Service functions** | `camelCase` | `camelCase` | **100%** |
| **Utility functions** | `camelCase` | `camelCase` | **100%** |
| **Type/interface names** | `PascalCase` | `PascalCase` | **~95%** (1 outlier: `AppointmentwithDetails`) |
| **Constants** | `SCREAMING_SNAKE` | `SCREAMING_SNAKE` | **~90%** (3 typo outliers) |
| **Python classes** | `PascalCase` | `PascalCase` | **100%** |
| **Python functions** | `snake_case` | `snake_case` | **100%** |
| **Agent names in JSON** | `kebab-case` | `kebab-case` | **80%** (1 outlier: `account_health_monitor`) |
| **Documentation files** | **Mixed** (3 conventions) | `kebab-case` | **~0%** (37 files need rename) |
| **JSON property keys (schemas)** | `camelCase` | `camelCase` | **100%** |
| **JSON keys (seed data)** | `snake_case` | `snake_case` | **100%** |
| **Permission IDs** | `dot.notation` | `dot.notation` | **100%** |

## Appendix B: Files Excluded from Rename Plan

| File | Reason for Exemption |
|------|---------------------|
| `README.md` | Industry standard all-caps |
| `.env`, `.env.example` | Standard dotfile convention |
| `.gitignore` | Standard dotfile convention |
| `.npmrc` | Standard dotfile convention |
| `package.json` | npm standard |
| `package-lock.json` | npm standard |
| `tsconfig.json` | TypeScript standard |
| `vite.config.ts` | Vite convention |
| `vite-env.d.ts` | Vite convention |
| `__init__.py` | Python standard |
| `ResQAI.code-workspace` | VS Code convention |

---

*End of Naming Standard. No files were renamed during this audit. All changes described are planning recommendations.*
