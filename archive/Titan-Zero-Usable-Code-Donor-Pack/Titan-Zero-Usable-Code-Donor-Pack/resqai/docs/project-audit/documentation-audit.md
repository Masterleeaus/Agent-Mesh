# Documentation Audit — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

---

## Classification Legend

| Status | Meaning |
|--------|---------|
| **Active** | Currently relevant, up-to-date documentation |
| **Duplicate** | Overlaps substantively with another document |
| **Historical** | Outdated but may contain useful context |
| **Generated** | Produced by automation or export |
| **Obsolete** | Superseded, no longer accurate |

---

## Root docs/ Files (30 files)

| File | Lines | Classification | Notes |
|------|-------|---------------|-------|
| AGENT_REVIEW.md | 174 | **Duplicate** | Overlaps with agents.md |
| agents.md | 101 | **Duplicate** | Overlaps with AGENT_REVIEW.md |
| applications.md | 44 | **Active** | High-level app summary |
| ARCHITECTURE_V2.md | 260 | **Active** | Appears to be the canonical architecture doc |
| architecture.md | 157 | **Duplicate** | Overlaps with ARCHITECTURE_V2.md |
| DATABASE_REVIEW.md | 177 | **Duplicate** | Overlaps with database.md |
| database.md | 189 | **Duplicate** | Overlaps with DATABASE_REVIEW.md |
| DEPENDENCY_AUDIT.md | 123 | **Generated** | Auto-generated dependency report |
| deployment-summary.md | 119 | **Active** | Deployment configuration notes |
| deployment.md | 41 | **Duplicate** | Overlaps with deployment-summary.md |
| DUPLICATE_CODE_REPORT.md | 180 | **Generated** | Auto-generated duplicate code report |
| FUNCTION_REVIEW.md | 185 | **Duplicate** | Overlaps with functions.md |
| functions.md | 73 | **Duplicate** | Overlaps with FUNCTION_REVIEW.md |
| INTEGRATION_TEST_PLAN.md | 145 | **Active** | Integration test plan |
| integration-status.md | 118 | **Active** | Integration status tracking |
| PERFORMANCE_REPORT.md | 201 | **Generated** | Performance analysis report |
| PHASE6_PREPARATION.md | 141 | **Historical** | Phase 6 prep notes |
| platform-validation-report.md | 403 | **Generated** | Platform validation report |
| PROJECT_HEALTH_V2.md | 172 | **Generated** | Project health score (v2) |
| PROJECT_STATUS.md | 77 | **Generated** | Project status summary |
| REACT_OPTIMIZATION_REPORT.md | 132 | **Generated** | React optimization report |
| README.md | 18 | **Active** | Docs directory index |
| resource-map.md | 196 | **Active** | Resource map |
| roadmap.md | 66 | **Active** | Project roadmap |
| SECURITY_REPORT.md | 134 | **Generated** | Security audit report |
| SERVICE_LAYER_REPORT.md | 179 | **Generated** | Service layer audit |
| setup.md | 73 | **Active** | Setup instructions |
| SUMMARY.md | 88 | **Active** | Project summary |
| troubleshooting.md | 109 | **Active** | Troubleshooting guide |
| WORKFLOW_DESIGN.md | 156 | **Active** | Workflow design doc |

### Duplicate Pairs

| Documents | Recommended Action |
|-----------|------------------|
| AGENT_REVIEW.md ↔ agents.md | Merge into single agents.md, archive AGENT_REVIEW.md |
| ARCHITECTURE_V2.md ↔ architecture.md | Keep ARCHITECTURE_V2.md (V2 implies latest), archive architecture.md |
| DATABASE_REVIEW.md ↔ database.md | Merge into single database.md, archive DATABASE_REVIEW.md |
| FUNCTION_REVIEW.md ↔ functions.md | Merge into single functions.md, archive FUNCTION_REVIEW.md |
| deployment-summary.md ↔ deployment.md | Merge into deployment.md, archive deployment-summary.md |

---

## docs/apps/ Files (5 files)

| File | Lines | Classification | Notes |
|------|-------|---------------|-------|
| appointment-board.md | 74 | **Duplicate** | Overlaps with apps/appointment-board/ARCHITECTURE.md |
| crm-tracker.md | 67 | **Duplicate** | Overlaps with apps/crm-tracker/ARCHITECTURE.md |
| ops-dashboard.md | 65 | **Duplicate** | Overlaps with apps/ops-dashboard/ARCHITECTURE.md |
| resolution-center.md | 87 | **Duplicate** | Overlaps with apps/resolution-center/ARCHITECTURE.md |
| support-queue.md | 64 | **Duplicate** | Overlaps with apps/support-queue/ARCHITECTURE.md |

**Recommendation:** Remove docs/apps/ entirely. Each app's ARCHITECTURE.md and README.md already contain this information.

---

## docs/testing/ Files (1 file)

| File | Lines | Classification | Notes |
|------|-------|---------------|-------|
| qa-checklist.md | 330 | **Active** | Comprehensive QA checklist |

---

## docs/archive/ Files (15 files + 1 README)

| File | Lines | Classification | Notes |
|------|-------|---------------|-------|
| README.md | 14 | **Active** | Directory index |
| OLD_architecture/AGENT_ARCHITECTURE.md | 199 | **Historical** | Old agent architecture |
| OLD_architecture/DATABASE_SCHEMA.md | 324 | **Historical** | Old database schema |
| OLD_architecture/IMPLEMENTATION_ROADMAP.md | 151 | **Historical** | Old roadmap |
| OLD_architecture/PROJECT_STRUCTURE.md | 63 | **Historical** | Old structure |
| OLD_architecture/SYSTEM_INVENTORY.md | 73 | **Historical** | Old inventory |
| OLD_implementation/EXTRACTION_PLAN.md | 126 | **Historical** | Old extraction plan |
| OLD_recovery/AGENT_RECOVERY_REPORT.md | 173 | **Historical** | Old agent recovery |
| OLD_recovery/FUNCTIONS_RECOVERY_REPORT.md | 70 | **Historical** | Old function recovery |
| OLD_validation/APP_VALIDATION_REPORT.md | 323 | **Historical** | Old validation |
| OLD_validation/APPOINTMENT_BOARD_LIVE_INTEGRATION.md | 297 | **Historical** | Old integration |
| OLD_validation/CRM_TRACKER_LIVE_INTEGRATION.md | 348 | **Historical** | Old integration |
| OLD_validation/LOCAL_GAP_REPORT.md | 109 | **Historical** | Old gap report |
| OLD_validation/OPS_DASHBOARD_LIVE_INTEGRATION.md | 216 | **Historical** | Old integration |
| OLD_validation/RESOLUTION_CENTER_LIVE_INTEGRATION.md | 320 | **Historical** | Old integration |
| OLD_validation/SUPPORT_QUEUE_VALIDATION_REPORT.md | 160 | **Historical** | Old integration |

---

## App-level Documentation

| File | Classification | Notes |
|------|---------------|-------|
| apps/*/ARCHITECTURE.md (5 files) | **Active** | Per-app architecture docs |
| apps/*/README.md (5 files) | **Active** | Per-app READMEs |

---

## Workflow Documentation

| File | Classification | Notes |
|------|---------------|-------|
| workflows/ticket-intake-REPORT.md | **Active** | Detailed workflow design report |
| workflow_graph.json | **Generated** | Auto-generated graph definition |

---

## Documentation Size Summary

| Category | Files | Total Lines |
|----------|-------|-------------|
| docs/ root | 30 | ~3,800 |
| docs/apps/ | 5 | ~350 |
| docs/testing/ | 1 | ~330 |
| docs/archive/ | 16 | ~3,000 |
| apps/*/ARCHITECTURE.md | 5 | ~500 |
| apps/*/README.md | 5 | ~200 |
| workflows/ doc | 1 | ~220 |
| **Total** | **~63** | **~8,400** |

---

## Recommendations

1. **Merge pairs**: AGENT_REVIEW.md→agents.md, ARCHITECTURE_V2.md→architecture.md, DATABASE_REVIEW.md→database.md, FUNCTION_REVIEW.md→functions.md, deployment-summary.md→deployment.md
2. **Remove** docs/apps/ directory entirely (duplicate of per-app ARCHITECTURE.md files)
3. **Keep** docs/archive/ as-is (historical reference)
4. **Consolidate** generated reports into a single reports/ directory
