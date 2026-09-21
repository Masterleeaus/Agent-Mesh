# Folder Audit — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

---

## Current Repository Structure

```
ResQAI/
├── .github/workflows/          → EMPTY
├── agents/                     → 5 agent subdirs (8 files each)
├── apps/                       → 5 app subdirs
├── archive/                    → Historical files
│   ├── apps/shared/            → Contains duplicate SDK + types
│   └── reports/                → Old cleanup reports
├── database/
│   ├── docs/                   → Seed data (11 JSON files)
│   └── migrations/             → SQL migration (1 file)
├── docs/                       → 30+ doc files, 3 subdirs
│   ├── apps/                   → DUPLICATE of per-app ARCHITECTURE.md
│   ├── archive/                → Historical docs (15 files)
│   ├── testing/                → QA checklist
│   └── project-audit/          → THIS REPORT
├── functions/                  → 10 function dirs + 1 shared
├── infrastructure/             → EMPTY
├── node_modules/               → 6 copies (root + 5 apps)
├── scripts/                    → 7 script files
├── shared/                     → Config, SDK, types, UI, utils
└── workflows/                  → 9 top-level files + 6 subdirs
```

---

## Issues Found

### 1. Empty Directories
| Directory | Path |
|-----------|------|
| infrastructure/ | `/infrastructure/` |
| .github/workflows/ | `/.github/workflows/` |

### 2. Duplicate Directories
| Directory | Duplicate Location | Reason |
|-----------|-------------------|--------|
| shared/ | archive/apps/shared/ | Contains older version of SDK and types |

### 3. Inconsistent Folder Naming
| Location | Issue |
|----------|-------|
| workflows/ | Mixed naming: some workflows as top-level JSON files, some in subdirectories with same name |
| functions/ | Mixed naming: `check-ticket-urgency` (kebab), `assign_appointment_technician` (snake), `finalize-dispatch` (kebab) |
| agents/ | All use kebab-case consistent ✅ |
| apps/ | All use kebab-case consistent ✅ |

### 4. Misplaced Files
| File | Current Location | Recommended Location |
|------|-----------------|---------------------|
| workflow_graph.json | /root | /workflows/graph.json |
| test_*.json (6 files) | /root | /tests/fixtures/ |
| check_urgency_fn.json | /root | /functions/check-ticket-urgency/ (already exists there) |
| update_ticket_fn.json | /root | /functions/update-ticket-record/ (already exists there) |
| update_perms.json | /root | /database/migrations/ or /docs/ |
| agent_test_input.json | /root | /tests/fixtures/ |
| CONNECTOR_INTEGRATION_REPORT.md | /root | /docs/ |
| run_input.json | /root | /tests/fixtures/ |

### 5. Duplicate Workflow Definitions
| Top-level | Subdirectory | Issue |
|-----------|-------------|-------|
| account-health-monitoring.json | account-health-monitoring/account-health-monitoring.json | Duplicate naming convention |
| account-health.json | — | Different workflow, correctly placed |
| followup-slippage.json | followup-slippage-detector/followup-slippage-detector.json | Different names, different scope |
| urgent-dispatch.json | urgent-dispatch/urgent-dispatch.json | Duplicate naming convention |

### 6. Unnecessary Nesting
- **docs/apps/**: 5 files that duplicate information each app's own ARCHITECTURE.md
- **workflows/subdirs/**: Some workflows in subdirectories with subdir having same name as the JSON file

### 7. support-queue Extra `src/` Directory
- `apps/support-queue/src/` exists while other apps don't have it → inconsistency

---

## Recommended Target Folder Structure

```
ResQAI/
├── .github/workflows/            → CI pipeline definitions
├── agents/                       → Agent definitions (unchanged)
├── apps/                         → Apps (unchanged)
├── archive/                      → Historical files (unchanged)
├── database/
│   ├── docs/                     → Seed data (unchanged)
│   └── migrations/               → SQL migrations (unchanged)
├── docs/
│   ├── archive/                  → Historical docs (unchanged)
│   ├── project-audit/            → Audit reports
│   ├── testing/                  → QA checklists
│   ├── README.md                 → Docs index
│   ├── architecture.md           → SINGLE canonical arch doc
│   ├── agents.md                 → SINGLE agent doc
│   ├── database.md               → SINGLE database doc
│   ├── functions.md              → SINGLE function doc
│   ├── deployment.md             → SINGLE deployment doc
│   ├── setup.md
│   ├── roadmap.md
│   ├── troubleshooting.md
│   └── ... (no duplicates)
├── functions/                    → Functions (unchanged)
├── infrastructure/               → Remove if empty
├── scripts/                      → Scripts (unchanged)
├── shared/                       → Shared code (unchanged)
├── tests/
│   └── fixtures/                 → All test JSON fixtures
├── workflows/
│   ├── graph.json                → Workflow graph definition
│   ├── ticket-intake-REPORT.md   → Workflow documentation
│   ├── active/                   → All active workflows
│   │   ├── account-health-monitoring.json
│   │   ├── dispute-resolution.json
│   │   └── ticket-intake.json
│   └── draft/                    → All draft workflows
│       ├── account-health.json
│       ├── appointment-reminders.json
│       ├── daily-standup.json
│       └── ...
```

---

## Recommendation Priority

| Issue | Priority | Risk |
|-------|----------|------|
| Remove empty infrastructure/ | Low | None |
| Create CI workflows in .github/workflows/ | Medium | None (empty currently) |
| Consolidate workflow flat/duplicate structure | Medium | Low (if only moving drafts) |
| Remove docs/apps/ | Low | None |
| Move test JSON fixtures to tests/fixtures/ | Low | Low |
| Standardize function naming (kebab vs snake) | Low | Medium (pod references) |
| Remove duplicate archive/apps/shared/ | Low | Low |
| Consolidate docs duplicate pairs | Medium | Low |
