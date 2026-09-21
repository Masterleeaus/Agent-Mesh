# Implementation Roadmap

Generated: 2026-06-26

---

## 1. Fully Implemented

### Apps (5/5 — Build-Ready)
All apps pass `tsc --noEmit` and `vite build` with zero errors.

| App | Purpose | Lines | Agents/Functions Called |
|-----|---------|-------|------------------------|
| `apps/support-queue` | Urgency-first ticket triage queue | ~17 files | `request-classifier`, `support-reply-drafter` |
| `apps/ops-dashboard` | Morning standup / KPI dashboard | ~18 files | `operations-coordinator` |
| `apps/appointment-board` | Technician scheduling board | ~19 files | `operations-coordinator` |
| `apps/crm-tracker` | Account health & follow-up alerts | ~20 files | `account_health_scan` (fn), `flag_slipping_followups` (fn) |
| `apps/resolution-center` | Dispute resolution with AI analysis | ~18 files | `resolution-advisor` |

### Shared Library
- **`apps/shared/types.ts`** — 16 TypeScript interfaces (Customer, Technician, Ticket, Dispute, Appointment, Task, Account, Followup, + health/agent types)
- **`apps/shared/lemma-sdk.ts`** — 11 SDK functions (init, CRUD for records, runAgent, waitForAgentResponse, runFunction, logOperation)

### Functions (2/2 — Fully Coded)
- **`functions/account-health-scan/`** — Python. Scoring formula: 0..1 health score per account. 3 source files + 13 tests.
- **`functions/flag-slipping-followups/`** — Python. Classifies followups by overdue severity. 3 source files + 9 tests.
- Both have: `handler.py`, `logic.py`, `models.py`, `test_logic.py`, `function.json`, `schemas/*.json`, `README.md`

### Agents (5/5 — Specification Complete)
All 5 agents have `agent.json`, `instruction.md`, `input-schema.json`, `output-schema.json`, `permissions.json`, `workflow-role.md`, `tool-access.md`, `README.md`:
- `request-classifier` — Classifies tickets (type, urgency, owner)
- `support-reply-drafter` — Drafts customer replies
- `operations-coordinator` — Board-level recommendations & task creation
- `resolution-advisor` — Dispute evidence analysis & resolution recommendation
- `account-health-monitor` — CRM health lead (calls both Python functions)

### Database Documentation
- **`database/docs/SCHEMA.md`** — Complete schema for all 9 tables (columns, types, enums, FKs)
- **`database/docs/*-records.json`** — Record dumps for all 9 tables + 2 function exports

### Documentation
- `AGENT_ARCHITECTURE.md`, `AGENT_RECOVERY_REPORT.md`
- `docs/EXTRACTION_PLAN.md`, `docs/SYSTEM_INVENTORY.md`, `docs/PROJECT_STRUCTURE.md`, `docs/APP_VALIDATION_REPORT.md`, `docs/LOCAL_GAP_REPORT.md`, `docs/functions-report.md`

---

## 2. Partially Implemented

| Item | what Exists | what's Missing |
|------|------------|----------------|
| **Functions (test fixtures)** | Full Python source + test classes | `tests/fixtures/*.json` test data files (code falls back to empty lists if missing) |
| **Function tests** | `test_logic.py` for both functions | Tests cannot run end-to-end without fixture data |
| **App .env configuration** | `.env.example` files in all 5 apps | No `.env` file generated — requires Lemma platform URL + API key |

---

## 3. Missing

### Database — SQL DDL
- `database/tables/` — No SQL CREATE TABLE files for any of the 9 tables
- `database/seeds/` — No SQL seed/INSERT scripts
- `database/policies/` — No RLS policies (not needed — `enable_rls: false`)

### Infrastructure
- `infrastructure/` — Empty directory. No deployment configs, Dockerfiles, CI/CD pipelines, or hosting manifests.

### workflows
- `workflows/` — Empty directory. No Lemma workflow definitions. Two workflows are referenced in agent prompts (`workflow_intake`, `workflow_dispute`) but never materialized.

### Scripts
- `scripts/` — Empty directory. No automation scripts (seed, deploy, test-runner, etc.).

### Run-Time Configuration
- `.env` files — None of the 5 apps have a populated `.env` file
- `root .env` — Missing Lemma platform connection config (base URL, API key, pod ID)

---

## 4. Recommended Build Order

### Phase 1 — Foundation (Core Data Layer)
```
Priority: HIGH   |   Effort: Small   |   Dependencies: None
```
1. **`database/tables/`** — write SQL DDL (CREATE TABLE) for all 9 tables matching `SCHEMA.md`
2. **`database/seeds/`** — Convert JSON record dumps to SQL INSERT scripts
3. **`root .env`** — Add Lemma platform connection variables (base URL, API key, pod ID)
4. **Generate `.env` files** — Copy `.env.example` → `.env` in all 5 apps

### Phase 2 — Functions (Backend Logic)
```
Priority: HIGH   |   Effort: Small   |   Dependencies: Phase 1
```
5. **`functions/*/tests/fixtures/`** — Create JSON fixture files for both functions so tests run offline
6. **Verify function tests** — Run `pytest` for both functions with fixtures

### Phase 3 — Agents (AI Layer)
```
Priority: MEDIUM |   Effort: Medium   |   Dependencies: Phase 1
```
7. **`workflows/`** — Define `workflow_intake` (ticket intake → classify → draft → approve → send → close) and `workflow_dispute` (dispute filed → analyze → recommend → approve/reject → close)
8. **Agent integration tests** — Verify each agent can be invoked from its respective app via Lemma SDK

### Phase 4 — Apps (UI Integration)
```
Priority: MEDIUM |   Effort: Medium   |   Dependencies: Phase 2 + 3
```
9. **End-to-end validation per app** — Connect each app to a running Lemma pod, verify all CRUD + agent flows
10. **Fix any integration issues** — Adjust SDK calls, type mappings, or state management as needed

### Phase 5 — Infrastructure & Automation
```
Priority: LOw    |   Effort: Large    |   Dependencies: Phase 4
```
11. **`infrastructure/`** — Dockerfiles for functions, hosting configs for apps
12. **`scripts/`** — Automation scripts: `seed-db.sh`, `deploy-all.sh`, `run-integration-tests.sh`
13. **CI/CD pipeline** — GitHub Actions or equivalent for build → test → deploy

### Phase 6 — Polish & Hardening
```
Priority: LOw    |   Effort: Varies   |   Dependencies: Phase 5
```
14. **Loading states & error handling** — Add skeleton loaders, retry logic, toast notifications across all apps
15. **Mobile responsiveness** — Audit and adjust layouts for tablet/mobile
16. **Performance** — Memoization, lazy loading, pagination for large datasets

---

## Dependency Graph

```
Phase 1 (Database DDL + Seeds)
    ├──> Phase 2 (Function Fixtures + Tests)
    │       └──> Phase 3 (workflows + Agent Integration)
    │               └──> Phase 4 (App E2E Validation)
    │                       └──> Phase 5 (Infrastructure + Scripts)
    │                               └──> Phase 6 (Polish)
    └──> Phase 4 (app .env files are created in Phase 1)
```

## Effort Summary

| Phase | Estimated Effort | Value |
|-------|-----------------|-------|
| Phase 1 — Foundation | 1–2 days | Unblocks everything |
| Phase 2 — Functions | 0.5–1 day | Enables offline testing |
| Phase 3 — Agents | 2–3 days | Core AI workflows |
| Phase 4 — Apps | 2–3 days | Full integration validation |
| Phase 5 — Infrastructure | 3–5 days | Production readiness |
| Phase 6 — Polish | 2–4 days | UX quality |
| **Total** | **10–18 days** | |
