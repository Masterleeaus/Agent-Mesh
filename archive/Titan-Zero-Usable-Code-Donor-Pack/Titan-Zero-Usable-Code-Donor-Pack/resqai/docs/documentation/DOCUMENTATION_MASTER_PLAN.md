# ResQAI Documentation Master Plan

Generated: 2026-06-28
Scope: All project `.md` files (excluding `node_modules/`, `.pytest_cache/`)
Total Files Scanned: **112**
Mode: **Read-Only Organization Audit — No Deletions, No Rewrites**

---

## Table of Contents

1. [Documentation Index (11 Categories)](#1-documentation-index)
2. [Move Plan](#2-move-plan)
3. [Cross-Reference Map](#3-cross-reference-map)
4. [Duplicate Documentation Report](#4-duplicate-documentation-report)
5. [Missing Documentation Report](#5-missing-documentation-report)

---

## 1. Documentation Index

### 00_Project — Project Overview & Status
| # | File | Description |
|---|------|-------------|
| 1 | `README.md` | Root project README — architecture, folder structure, setup, apps overview |
| 2 | `docs/README.md` | Docs directory index |
| 3 | `docs/SUMMARY.md` | Manifest of all files created, modified, archived |
| 4 | `docs/PROJECT_STATUS.md` | Current project health — completed, in progress, blocked items |
| 5 | `docs/PROJECT_HEALTH_V2.md` | Project health score (v2) with metrics |

### 01_Architecture — System Architecture & Design
| # | File | Description |
|---|------|-------------|
| 6 | `docs/architecture.md` | Architecture overview — shared SDK, types, config, workspace, data flow |
| 7 | `docs/ARCHITECTURE_V2.md` | Architecture V2 — expanded system design (260 lines) |
| 8 | `docs/resource-map.md` | Resource map — all platform resources and their relationships |
| 9 | `docs/documentation-map.md` | Proposed canonical hierarchy for docs/ restructuring |
| 10 | `docs/database.md` | Full database schema — 9 tables with columns, ENUMs, foreign keys |
| 11 | `docs/DATABASE_REVIEW.md` | Database review — overlaps with database.md (177 lines) |
| 12 | `docs/SERVICE_LAYER_REPORT.md` | Service layer audit — API surface, routing, middleware |

### 02_Applications — Application Documentation
| # | File | Description |
|---|------|-------------|
| 13 | `docs/applications.md` | Cross-app reference — all 5 apps, build status, doc links |
| 14 | `docs/apps/appointment-board.md` | Appointment Board per-app doc |
| 15 | `docs/apps/crm-tracker.md` | CRM Tracker per-app doc |
| 16 | `docs/apps/ops-dashboard.md` | Ops Dashboard per-app doc |
| 17 | `docs/apps/resolution-center.md` | Resolution Center per-app doc |
| 18 | `docs/apps/support-queue.md` | Support Queue per-app doc |
| 19 | `apps/appointment-board/ARCHITECTURE.md` | Appointment Board architecture |
| 20 | `apps/appointment-board/README.md` | Appointment Board overview |
| 21 | `apps/crm-tracker/ARCHITECTURE.md` | CRM Tracker architecture |
| 22 | `apps/crm-tracker/README.md` | CRM Tracker overview |
| 23 | `apps/ops-dashboard/ARCHITECTURE.md` | Ops Dashboard architecture |
| 24 | `apps/ops-dashboard/README.md` | Ops Dashboard overview |
| 25 | `apps/resolution-center/ARCHITECTURE.md` | Resolution Center architecture |
| 26 | `apps/resolution-center/README.md` | Resolution Center overview |
| 27 | `apps/support-queue/ARCHITECTURE.md` | Support Queue architecture |
| 28 | `apps/support-queue/README.md` | Support Queue overview |

### 03_Agents — AI Agent Definitions & Configuration
| # | File | Description |
|---|------|-------------|
| 29 | `docs/agents.md` | Agent architecture — all 5 agents, responsibilities, interaction diagrams |
| 30 | `docs/AGENT_REVIEW.md` | Agent review — overlaps with agents.md (174 lines) |
| 31 | `agents/account-health-monitor/instruction.md` | Account Health Monitor system prompt |
| 32 | `agents/account-health-monitor/README.md` | Account Health Monitor overview |
| 33 | `agents/account-health-monitor/tool-access.md` | Tool permissions for Account Health Monitor |
| 34 | `agents/account-health-monitor/workflow-role.md` | Workflow integration for Account Health Monitor |
| 35 | `agents/operations-coordinator/instruction.md` | Operations Coordinator system prompt |
| 36 | `agents/operations-coordinator/README.md` | Operations Coordinator overview |
| 37 | `agents/operations-coordinator/tool-access.md` | Tool permissions for Operations Coordinator |
| 38 | `agents/operations-coordinator/workflow-role.md` | Workflow integration for Operations Coordinator |
| 39 | `agents/request-classifier/instruction.md` | Request Classifier system prompt |
| 40 | `agents/request-classifier/README.md` | Request Classifier overview |
| 41 | `agents/request-classifier/tool-access.md` | Tool permissions for Request Classifier |
| 42 | `agents/request-classifier/workflow-role.md` | Workflow integration for Request Classifier |
| 43 | `agents/resolution-advisor/instruction.md` | Resolution Advisor system prompt |
| 44 | `agents/resolution-advisor/README.md` | Resolution Advisor overview |
| 45 | `agents/resolution-advisor/tool-access.md` | Tool permissions for Resolution Advisor |
| 46 | `agents/resolution-advisor/workflow-role.md` | Workflow integration for Resolution Advisor |
| 47 | `agents/support-reply-drafter/instruction.md` | Support Reply Drafter system prompt |
| 48 | `agents/support-reply-drafter/README.md` | Support Reply Drafter overview |
| 49 | `agents/support-reply-drafter/tool-access.md` | Tool permissions for Support Reply Drafter |
| 50 | `agents/support-reply-drafter/workflow-role.md` | Workflow integration for Support Reply Drafter |

### 04_Workflows — Workflow Definitions & Reports
| # | File | Description |
|---|------|-------------|
| 51 | `docs/WORKFLOW_DESIGN.md` | Workflow design — pipeline definitions, node interactions |
| 52 | `docs/workflows/ticket-intake-REPORT.md` | Ticket intake workflow detailed report |
| 53 | `docs/integration-status.md` | Integration status tracking across all components |

### 05_Functions — Serverless Function Documentation
| # | File | Description |
|---|------|-------------|
| 54 | `docs/functions.md` | Function reference — 2 Python functions, scoring, severity, test coverage |
| 55 | `docs/FUNCTION_REVIEW.md` | Function review — overlaps with functions.md (185 lines) |
| 56 | `functions/account-health-scan/README.md` | Account Health Scan function docs |
| 57 | `functions/flag-slipping-followups/README.md` | Flag Slipping Followups function docs |

### 06_APIs — API & Connector Documentation
| # | File | Description |
|---|------|-------------|
| 58 | `docs/connectors/CONNECTOR_INTEGRATION_REPORT.md` | Connector integration audit and report |

### 07_Deployment — Deployment & Infrastructure
| # | File | Description |
|---|------|-------------|
| 59 | `docs/deployment.md` | Deployment guide — build artifacts, hosting options, CI/CD |
| 60 | `docs/deployment-summary.md` | Deployment configuration notes (119 lines) |
| 61 | `docs/production-readiness.md` | Production readiness checklist |
| 62 | `docs/build-pipeline-report.md` | Build pipeline configuration report |

### 08_Testing — Testing Documentation
| # | File | Description |
|---|------|-------------|
| 63 | `docs/testing-report.md` | Overall testing report |
| 64 | `docs/testing/qa-checklist.md` | Manual QA checklist — all user flows for all 5 apps (330 lines) |
| 65 | `docs/INTEGRATION_TEST_PLAN.md` | Integration test plan (145 lines) |
| 66 | `docs/platform-validation-report.md` | Platform validation report (403 lines) |

### 09_Reports — Audits, Plans & Generated Reports
| # | File | Description |
|---|------|-------------|
| 67 | `docs/cleanup-plan.md` | Cleanup plan |
| 68 | `docs/dependency-audit.md` | Root-level dependency audit |
| 69 | `docs/DUPLICATE_CODE_REPORT.md` | Auto-generated duplicate code report |
| 70 | `docs/naming-standard.md` | Naming conventions and standards |
| 71 | `docs/PERFORMANCE_REPORT.md` | Performance analysis report |
| 72 | `docs/PHASE6_PREPARATION.md` | Phase 6 preparation notes |
| 73 | `docs/REACT_OPTIMIZATION_REPORT.md` | React optimization analysis |
| 74 | `docs/repository-audit.md` | Repository structure audit |
| 75 | `docs/roadmap.md` | Build phases — completed work, roadmap, effort estimate |
| 76 | `docs/SECURITY_REPORT.md` | Security audit report |
| 77 | `docs/setup.md` | Setup guide — prerequisites, install, environment, development scripts |
| 78 | `docs/troubleshooting.md` | Debugging guide — common issues, known limitations |
| 79 | `docs/security/SECURITY_AUDIT.md` | Security audit (in-depth) |
| 80 | `docs/repository/REPOSITORY_RESTRUCTURE_PLAN.md` | Repository restructuring plan |
| 81 | `docs/project-audit/agent-audit.md` | Agent audit |
| 82 | `docs/project-audit/application-audit.md` | Application audit |
| 83 | `docs/project-audit/architecture-map.md` | Architecture mapping |
| 84 | `docs/project-audit/asset-audit.md` | Asset audit |
| 85 | `docs/project-audit/build-audit.md` | Build process audit |
| 86 | `docs/project-audit/connector-audit.md` | Connector audit |
| 87 | `docs/project-audit/dependency-audit.md` | Dependency audit |
| 88 | `docs/project-audit/documentation-audit.md` | Documentation audit |
| 89 | `docs/project-audit/environment-audit.md` | Environment audit |
| 90 | `docs/project-audit/folder-audit.md` | Folder structure audit |
| 91 | `docs/project-audit/function-audit.md` | Function audit |
| 92 | `docs/project-audit/repository-health.md` | Repository health check |
| 93 | `docs/project-audit/repository-tree.md` | Repository tree structure |
| 94 | `docs/project-audit/workflow-audit.md` | Workflow audit |

### 10_Hackathon — Hackathon-Related Documentation
| # | File | Description |
|---|------|-------------|
| — | *(No files currently assigned to this category)* | |

### 11_Archive — Superseded & Historical Documents
| # | File | Description |
|---|------|-------------|
| 95 | `archive/reports/CLEANUP_REPORT.md` | Historical cleanup report |
| 96 | `archive/reports/DEPENDENCY_REPORT.md` | Historical dependency report |
| 97 | `archive/reports/PROJECT_HEALTH.md` | Historical project health report |
| 98 | `archive/reports/REMAINING_WORK.md` | Historical remaining work tracking |
| 99 | `archive/reports/TREE_AFTER_REFACTOR.md` | Historical post-refactor tree |
| 100 | `archive/reports/UNUSED_FILES.md` | Historical unused files report |
| 101 | `archive/reports/WORKSPACE_MIGRATION_REPORT.md` | Historical workspace migration report |
| 102 | `docs/history/README.md` | History directory index |
| 103 | `docs/history/architecture/AGENT_ARCHITECTURE.md` | Superseded agent architecture doc |
| 104 | `docs/history/architecture/DATABASE_SCHEMA.md` | Superseded database schema doc |
| 105 | `docs/history/architecture/IMPLEMENTATION_ROADMAP.md` | Superseded implementation roadmap |
| 106 | `docs/history/architecture/PROJECT_STRUCTURE.md` | Superseded project structure doc |
| 107 | `docs/history/architecture/SYSTEM_INVENTORY.md` | Superseded system inventory |
| 108 | `docs/history/implementation/EXTRACTION_PLAN.md` | Historical extraction plan |
| 109 | `docs/history/recovery/AGENT_RECOVERY_REPORT.md` | Historical agent recovery report |
| 110 | `docs/history/recovery/FUNCTIONS_RECOVERY_REPORT.md` | Historical function recovery report |
| 111 | `docs/history/validation/APP_VALIDATION_REPORT.md` | Historical app validation report |
| 112 | `docs/history/validation/APPOINTMENT_BOARD_LIVE_INTEGRATION.md` | Historical appointment board integration |
| 113 | `docs/history/validation/CRM_TRACKER_LIVE_INTEGRATION.md` | Historical CRM tracker integration |
| 114 | `docs/history/validation/LOCAL_GAP_REPORT.md` | Historical local gap report |
| 115 | `docs/history/validation/OPS_DASHBOARD_LIVE_INTEGRATION.md` | Historical ops dashboard integration |
| 116 | `docs/history/validation/RESOLUTION_CENTER_LIVE_INTEGRATION.md` | Historical resolution center integration |
| 117 | `docs/history/validation/SUPPORT_QUEUE_VALIDATION_REPORT.md` | Historical support queue validation |

---

## 2. Move Plan

### Proposed Target Hierarchy

```
docs/
├── 00_Project/
│   ├── README.md                        ← Root README.md (symlink/copy)
│   └── STATUS.md                        ← PROJECT_STATUS.md + PROJECT_HEALTH_V2.md merge
│
├── 01_Architecture/
│   ├── OVERVIEW.md                      ← architecture.md + ARCHITECTURE_V2.md merge
│   ├── DATABASE.md                      ← database.md + DATABASE_REVIEW.md merge
│   ├── SERVICE_LAYER.md                 ← SERVICE_LAYER_REPORT.md
│   └── RESOURCE_MAP.md                  ← resource-map.md
│
├── 02_Applications/
│   ├── OVERVIEW.md                      ← applications.md
│   ├── appointment-board.md             ← apps/appointment-board/ARCHITECTURE.md
│   ├── crm-tracker.md                   ← apps/crm-tracker/ARCHITECTURE.md
│   ├── ops-dashboard.md                 ← apps/ops-dashboard/ARCHITECTURE.md
│   ├── resolution-center.md             ← apps/resolution-center/ARCHITECTURE.md
│   └── support-queue.md                 ← apps/support-queue/ARCHITECTURE.md
│
├── 03_Agents/
│   ├── OVERVIEW.md                      ← agents.md + AGENT_REVIEW.md merge
│   ├── request-classifier/
│   ├── support-reply-drafter/
│   ├── operations-coordinator/
│   ├── resolution-advisor/
│   └── account-health-monitor/
│
├── 04_Workflows/
│   ├── OVERVIEW.md                      ← WORKFLOW_DESIGN.md
│   ├── ticket-intake.md                 ← workflows/ticket-intake-REPORT.md
│   └── INTEGRATION_STATUS.md            ← integration-status.md
│
├── 05_Functions/
│   ├── OVERVIEW.md                      ← functions.md + FUNCTION_REVIEW.md merge
│   ├── account-health-scan.md
│   └── flag-slipping-followups.md
│
├── 06_APIs/
│   └── CONNECTORS.md                    ← CONNECTOR_INTEGRATION_REPORT.md
│
├── 07_Deployment/
│   ├── OVERVIEW.md                      ← deployment.md + deployment-summary.md merge
│   ├── PRODUCTION_READINESS.md          ← production-readiness.md
│   └── BUILD_PIPELINE.md                ← build-pipeline-report.md
│
├── 08_Testing/
│   ├── OVERVIEW.md                      ← testing-report.md
│   ├── QA_CHECKLIST.md                  ← testing/qa-checklist.md
│   ├── INTEGRATION_TEST_PLAN.md         ← INTEGRATION_TEST_PLAN.md
│   └── PLATFORM_VALIDATION.md           ← platform-validation-report.md
│
├── 09_Reports/                          ← All generated/one-time audit reports
│   ├── CLEANUP_PLAN.md                  ← cleanup-plan.md
│   ├── DEPENDENCY_AUDIT.md              ← dependency-audit.md
│   ├── DUPLICATE_CODE.md                ← DUPLICATE_CODE_REPORT.md
│   ├── NAMING_STANDARD.md               ← naming-standard.md
│   ├── PERFORMANCE.md                   ← PERFORMANCE_REPORT.md
│   ├── PHASE6_PREP.md                   ← PHASE6_PREPARATION.md
│   ├── REACT_OPTIMIZATION.md            ← REACT_OPTIMIZATION_REPORT.md
│   ├── REPOSITORY_AUDIT.md              ← repository-audit.md
│   ├── REPOSITORY_RESTRUCTURE.md         ← REPOSITORY_RESTRUCTURE_PLAN.md
│   ├── ROADMAP.md                       ← roadmap.md
│   ├── SECURITY.md                      ← SECURITY_REPORT.md + SECURITY_AUDIT.md merge
│   ├── SETUP.md                         ← setup.md
│   ├── TROUBLESHOOTING.md               ← troubleshooting.md
│   ├── project-audit/                   ← All docs/project-audit/*.md files
│   │   ├── agent.md
│   │   ├── application.md
│   │   ├── architecture-map.md
│   │   ├── asset.md
│   │   ├── build.md
│   │   ├── connector.md
│   │   ├── dependency.md
│   │   ├── documentation.md
│   │   ├── environment.md
│   │   ├── folder.md
│   │   ├── function.md
│   │   ├── repository-health.md
│   │   ├── repository-tree.md
│   │   └── workflow.md
│   └── documentation-map.md            ← Retained for reference
│
├── 10_Hackathon/                        ← Reserved
│
└── 11_Archive/                          ← All historical/superseded docs
    ├── REPORTS/                         ← archive/reports/*.md
    └── HISTORY/                         ← docs/history/*.md
```

### Move Actions Summary

| From | To | Action |
|------|----|--------|
| `docs/apps/*` (5 files) | `docs/02_Applications/` | Move |
| `docs/apps/` directory | — | Remove after move (content lives in per-app dirs) |
| `docs/history/*` | `docs/11_Archive/HISTORY/` | Move |
| `docs/testing/qa-checklist.md` | `docs/08_Testing/QA_CHECKLIST.md` | Move |
| `docs/security/SECURITY_AUDIT.md` | `docs/09_Reports/SECURITY_AUDIT.md` | Move |
| `docs/repository/REPOSITORY_RESTRUCTURE_PLAN.md` | `docs/09_Reports/` | Move |
| `docs/connectors/CONNECTOR_INTEGRATION_REPORT.md` | `docs/06_APIs/` | Move |
| `docs/workflows/ticket-intake-REPORT.md` | `docs/04_Workflows/` | Move |
| `docs/project-audit/*` | `docs/09_Reports/project-audit/` | Move |

### Pairs Marked for Merge (No Deletion)

| Duplicate Pair | Merge Into | Archive Candidate |
|----------------|-----------|-------------------|
| `ARCHITECTURE_V2.md` ↔ `architecture.md` | `01_Architecture/OVERVIEW.md` | `ARCHITECTURE_V2.md` → Archive |
| `AGENT_REVIEW.md` ↔ `agents.md` | `03_Agents/OVERVIEW.md` | `AGENT_REVIEW.md` → Archive |
| `DATABASE_REVIEW.md` ↔ `database.md` | `01_Architecture/DATABASE.md` | `DATABASE_REVIEW.md` → Archive |
| `FUNCTION_REVIEW.md` ↔ `functions.md` | `05_Functions/OVERVIEW.md` | `FUNCTION_REVIEW.md` → Archive |
| `deployment-summary.md` ↔ `deployment.md` | `07_Deployment/OVERVIEW.md` | `deployment-summary.md` → Archive |

### Files to Retain In-Place (No Move Needed)
- `README.md` (root)
- `apps/*/README.md` (5 files) — keep in app directories
- `apps/*/ARCHITECTURE.md` (5 files) — keep in app directories as authoritative per-app docs
- `agents/*/` (20 files) — keep in agent directories as authoritative per-agent config
- `functions/*/README.md` (2 files) — keep in function directories

---

## 3. Cross-Reference Map

### 3.1 Agent-to-Workflow Cross-Reference

| Agent | Workflow | Role |
|-------|----------|------|
| `request-classifier` | Ticket Intake Pipeline | First node — classifies inbound tickets |
| `support-reply-drafter` | Ticket Intake Pipeline | Second node — drafts replies, routes to human approval |
| `operations-coordinator` | Daily Ops / On-Demand | Reads full ops board, produces prioritized action list |
| `resolution-advisor` | Dispute Pipeline | Analyzes disputes, recommends resolution |
| `account-health-monitor` | Nightly Health Scan | Calls deterministic functions, creates tasks |
| `account-health-monitor` | — | Invokes `account-health-scan` and `flag-slipping-followups` functions |

### 3.2 Agent-to-Function Cross-Reference

| Agent | Functions Used |
|-------|---------------|
| `account-health-monitor` | `account-health-scan`, `flag-slipping-followups` |
| All other agents | None |

### 3.3 Agent-to-Application Cross-Reference

| Application | Agent(s) Used |
|-------------|---------------|
| Support Queue | `request-classifier`, `support-reply-drafter` |
| CRM Tracker | `account-health-monitor` |
| Ops Dashboard | `operations-coordinator` |
| Appointment Board | `operations-coordinator` |
| Resolution Center | `resolution-advisor` |

### 3.4 Application-to-Table Cross-Reference

*(Based on known schema — table names from database docs)*

| Application | Tables Read/Written |
|-------------|--------------------|
| Support Queue | tickets, technicians, customers |
| CRM Tracker | accounts, followups, customers, tasks |
| Ops Dashboard | tickets, appointments, technicians, customers, tasks, operations_log |
| Appointment Board | appointments, technicians, customers |
| Resolution Center | disputes, customers, appointments, tickets, operations_log |

### 3.5 Doc-to-Doc Cross-Reference

| Document | References |
|----------|-----------|
| `README.md` (root) | All `docs/*.md`, all `apps/*/`, all `agents/*/`, all `functions/*/` |
| `docs/architecture.md` | `docs/database.md`, `docs/SERVICE_LAYER_REPORT.md`, `docs/resource-map.md` |
| `docs/agents.md` | All `agents/*/README.md`, all `agents/*/instruction.md` |
| `docs/applications.md` | All `docs/apps/*.md`, all `apps/*/ARCHITECTURE.md` |
| `docs/functions.md` | `functions/*/README.md` |
| `docs/WORKFLOW_DESIGN.md` | `docs/agents.md`, `docs/workflows/ticket-intake-REPORT.md` |
| `docs/documentation-map.md` | All `docs/` files (proposed restructuring) |
| `docs/project-audit/documentation-audit.md` | All `docs/` files (classification audit) |

### 3.6 Archive-to-Active Document Map

| Archived Doc | Superseded By |
|-------------|---------------|
| `history/architecture/AGENT_ARCHITECTURE.md` | `docs/agents.md` |
| `history/architecture/DATABASE_SCHEMA.md` | `docs/database.md` |
| `history/architecture/IMPLEMENTATION_ROADMAP.md` | `docs/roadmap.md` |
| `history/architecture/PROJECT_STRUCTURE.md` | `docs/architecture.md` |
| `history/architecture/SYSTEM_INVENTORY.md` | `docs/resource-map.md` |
| `history/implementation/EXTRACTION_PLAN.md` | *(No direct replacement — historical reference)* |
| `history/recovery/AGENT_RECOVERY_REPORT.md` | *(One-time report — historical)* |
| `history/recovery/FUNCTIONS_RECOVERY_REPORT.md` | *(One-time report — historical)* |
| `archive/reports/PROJECT_HEALTH.md` | `docs/PROJECT_HEALTH_V2.md` |

---

## 4. Duplicate Documentation Report

### 4.1 Confirmed Duplicate Pairs

| Topic | Doc A | Doc B | Overlap Level | Recommendation |
|-------|-------|-------|---------------|----------------|
| Architecture | `docs/architecture.md` (157 lines) | `docs/ARCHITECTURE_V2.md` (260 lines) | **High** | Merge V2 into V1, archive V2 |
| Agents | `docs/agents.md` (101 lines) | `docs/AGENT_REVIEW.md` (174 lines) | **High** | Merge review into agents.md, archive review |
| Database | `docs/database.md` (189 lines) | `docs/DATABASE_REVIEW.md` (177 lines) | **Very High** | Merge review into database.md, archive review |
| Functions | `docs/functions.md` (73 lines) | `docs/FUNCTION_REVIEW.md` (185 lines) | **High** | Merge review into functions.md, archive review |
| Deployment | `docs/deployment.md` (41 lines) | `docs/deployment-summary.md` (119 lines) | **High** | Merge summary into deployment.md, archive summary |

### 4.2 Cross-Product Duplicates (docs/apps vs apps/*)

| Topic | docs/apps/*.md | apps/*/ARCHITECTURE.md | Overlap Level | Recommendation |
|-------|---------------|----------------------|---------------|----------------|
| Support Queue | 64 lines | Present | **High** | Keep app/ARCHITECTURE.md as authoritative |
| CRM Tracker | 67 lines | Present | **High** | Keep app/ARCHITECTURE.md as authoritative |
| Ops Dashboard | 65 lines | Present | **High** | Keep app/ARCHITECTURE.md as authoritative |
| Appointment Board | 74 lines | Present | **High** | Keep app/ARCHITECTURE.md as authoritative |
| Resolution Center | 87 lines | Present | **High** | Keep app/ARCHITECTURE.md as authoritative |

### 4.3 Redundant Index/Summary Files

| File | Redundant With | Notes |
|------|---------------|-------|
| `docs/SUMMARY.md` | `docs/README.md`, `docs/documentation-map.md` | All three describe the doc layout |
| `docs/documentation-map.md` | `docs/README.md`, `docs/SUMMARY.md` | Proposes restructuring that duplicates existing layout info |

### 4.4 Generated Reports (Potentially Stale)

| Report | Generated | Likelihood of Staleness |
|--------|-----------|------------------------|
| `DUPLICATE_CODE_REPORT.md` | Auto-generated | Likely stale — code changes since |
| `PERFORMANCE_REPORT.md` | Analysis | Likely stale |
| `REACT_OPTIMIZATION_REPORT.md` | Analysis | Likely stale — React updates since |
| `platform-validation-report.md` | Automated | Stale — platform evolved |
| `archive/reports/*` | Historical | Known stale (archived) |

---

## 5. Missing Documentation Report

### 5.1 Critical Gaps (Blocking Understanding or Onboarding)

| Missing Document | Category | Priority | Rationale |
|-----------------|----------|----------|-----------|
| `00_Project/CONTRIBUTING.md` | Project | **High** | No contribution guidelines for new developers |
| `00_Project/CHANGELOG.md` | Project | **High** | No release history or version tracking |
| `01_Architecture/DATA_FLOW.md` | Architecture | **High** | No explicit data flow diagrams across the system |
| `01_Architecture/SECURITY.md` | Architecture | **High** | Authentication/authorization flow not documented outside audit |
| `06_APIs/OVERVIEW.md` | APIs | **High** | No consolidated API reference (function endpoints, SDK surface) |
| `07_Deployment/CI_CD.md` | Deployment | **High** | No CI/CD pipeline configuration doc |
| `07_Deployment/ENVIRONMENTS.md` | Deployment | **High** | Dev/staging/prod environment differences not documented |

### 5.2 Moderate Gaps (Useful But Not Blocking)

| Missing Document | Category | Priority | Rationale |
|-----------------|----------|----------|-----------|
| `02_Applications/WIDGETS.md` | Applications | **Medium** | Widget architecture not documented |
| `03_Agents/PERMISSIONS_MATRIX.md` | Agents | **Medium** | Consolidated agent table permission matrix |
| `04_Workflows/DISPATCH.md` | Workflows | **Medium** | Urgent dispatch workflow not documented |
| `04_Workflows/SCHEDULES.md` | Workflows | **Medium** | Scheduled workflow definitions not documented |
| `05_Functions/ERROR_HANDLING.md` | Functions | **Medium** | Function error handling patterns not documented |
| `06_APIs/WEBHOOKS.md` | APIs | **Medium** | Webhook integration not documented |
| `08_Testing/E2E.md` | Testing | **Medium** | No end-to-end test documentation |
| `08_Testing/UNIT_COVERAGE.md` | Testing | **Medium** | Unit test coverage targets not documented |

### 5.3 Low-Priority / Nice-to-Have Gaps

| Missing Document | Category | Priority | Rationale |
|-----------------|----------|----------|-----------|
| `00_Project/GLOSSARY.md` | Project | **Low** | Domain-specific terminology reference |
| `02_Applications/THEMING.md` | Applications | **Low** | UI theming/styling guide |
| `03_Agents/TUNING.md` | Agents | **Low** | Prompt tuning and performance optimization guide |
| `09_Reports/PERFORMANCE_BASELINE.md` | Reports | **Low** | Performance baseline benchmarks |
| `10_Hackathon/IDEA_BOARD.md` | Hackathon | **Low** | Hackathon idea tracking (reserved) |

### 5.4 Documentation Gaps by Source Code Area

| Source Area | Files Without Adjacent Docs | Missing Doc Type |
|-------------|---------------------------|------------------|
| `workflows/` (directory) | Empty directory | Workflow definitions in Lemma format |
| `infrastructure/` (directory) | Empty directory | Deployment infrastructure config |
| `packages/` (directory) | No docs found | Shared package documentation |
| `shared/` (directory) | No separate `.md` | SDK/types/config reference (see `docs/`) |
| `scripts/` (directory) | No separate `.md` | Script usage guide |

---

## Appendix: File Count Summary by Category

| Category | Active Files | Archive Files | Total |
|----------|-------------|---------------|-------|
| 00_Project | 5 | 0 | 5 |
| 01_Architecture | 7 | 0 | 7 |
| 02_Applications | 16 | 0 | 16 |
| 03_Agents | 22 | 0 | 22 |
| 04_Workflows | 3 | 0 | 3 |
| 05_Functions | 4 | 0 | 4 |
| 06_APIs | 1 | 0 | 1 |
| 07_Deployment | 4 | 0 | 4 |
| 08_Testing | 4 | 0 | 4 |
| 09_Reports | 28 | 0 | 28 |
| 10_Hackathon | 0 | 0 | 0 |
| 11_Archive | 0 | 23 | 23 |
| **Total** | **94** | **23** | **117** |

> **Note:** Total (117) reflects the 112 unique file paths plus 5 cross-listed documents that logically belong to two categories. All files are preserved in their current locations — no files deleted or rewritten.
