# Documentation Map — ResQAI

Generated: 2026-06-28
Status: Proposed canonical hierarchy

---

## Proposed Structure

```
docs/
├── README.md                          ← Documentation index (canonical)
├── architecture.md                    ← System architecture overview
├── setup.md                           ← Getting started guide
├── deployment.md                      ← Deployment instructions
├── troubleshooting.md                 ← Common issues & fixes
│
├── Architecture/
│   └── data-flow.md                   ← Data flow diagrams
│
├── Database/
│   ├── schema.md                      ← Table schemas, columns, ENUMs, FKs
│   └── migrations.md                  ← Migration history and patterns
│
├── Agents/
│   ├── overview.md                    ← Agent architecture & interaction
│   ├── request-classifier.md          ← Per-agent details
│   ├── support-reply-drafter.md
│   ├── operations-coordinator.md
│   ├── resolution-advisor.md
│   └── account-health-monitor.md
│
├── Functions/
│   ├── overview.md                    ← Function reference
│   ├── account-health-scan.md
│   ├── check-ticket-urgency.md
│   └── ... (per function)
│
├── Workflows/
│   ├── ticket-intake.md               ← Workflow definitions & flow
│   ├── urgent-dispatch.md
│   └── ... (per workflow)
│
├── Applications/
│   ├── overview.md                    ← Cross-app reference
│   ├── support-queue.md
│   ├── crm-tracker.md
│   ├── ops-dashboard.md
│   ├── appointment-board.md
│   └── resolution-center.md
│
├── Deployment/
│   ├── ci-cd.md                       ← CI/CD pipeline config
│   ├── docker.md                      ← Containerization
│   └── environments.md                ← Dev/Staging/Prod
│
├── Development/
│   ├── contributing.md                ← Contribution guide
│   ├── coding-standards.md            ← Code style & conventions
│   └── testing.md                     ← Testing strategy
│
├── API/
│   ├── functions.md                   ← Function API reference
│   └── sdk.md                         ← SDK reference
│
├── Archive/                           ← Superseded documents
│   ├── README.md
│   ├── OLD_architecture/
│   ├── OLD_implementation/
│   ├── OLD_recovery/
│   └── OLD_validation/
│
├── reports/                           ← One-time audit reports
│   ├── repository-audit.md
│   ├── dependency-audit.md
│   ├── testing-report.md
│   ├── build-pipeline-report.md
│   ├── production-readiness.md
│   └── naming-standard.md
```

---

## Current Documents vs Target

| Current File | Target Location | Action |
|-------------|----------------|--------|
| `docs/README.md` | `docs/README.md` | Keep (index) |
| `docs/SUMMARY.md` | `docs/Archive/` | Merge with README, then archive |
| `docs/architecture.md` | `docs/architecture.md` | Keep (canonical) |
| `docs/ARCHITECTURE_V2.md` | `docs/Archive/` | Merge with architecture.md |
| `docs/setup.md` | `docs/setup.md` | Keep |
| `docs/deployment.md` | `docs/deployment.md` | Keep |
| `docs/deployment-summary.md` | `docs/Archive/` | Merge with deployment.md |
| `docs/applications.md` | `docs/Applications/overview.md` | Move |
| `docs/apps/` (5 files) | `docs/Applications/` | Move |
| `docs/agents.md` | `docs/Agents/overview.md` | Move |
| `docs/AGENT_REVIEW.md` | `docs/Archive/` | Merge with agents doc |
| `docs/database.md` | `docs/Database/schema.md` | Move |
| `docs/DATABASE_REVIEW.md` | `docs/Archive/` | Merge with database doc |
| `docs/functions.md` | `docs/Functions/overview.md` | Move |
| `docs/FUNCTION_REVIEW.md` | `docs/Archive/` | Merge with functions doc |
| `docs/WORKFLOW_DESIGN.md` | `docs/Workflows/overview.md` | Move |
| `docs/troubleshooting.md` | `docs/troubleshooting.md` | Keep |
| `docs/roadmap.md` | `docs/roadmap.md` | Keep |
| `docs/integration-status.md` | `docs/Archive/` | One-time report |
| `docs/platform-validation-report.md` | `docs/reports/` | One-time report |
| All UPPER_SNAKE docs | Rename to kebab-case | Rename |

---

## Duplicate Content Map

| Topic | Primary Doc | Duplicate(s) | Action |
|-------|------------|--------------|--------|
| Architecture | `architecture.md` | `ARCHITECTURE_V2.md` | Merge into primary, archive duplicate |
| Agents | `agents.md` | `AGENT_REVIEW.md` | Merge review notes into agents.md |
| Database | `database.md` | `DATABASE_REVIEW.md` | Merge review notes into database.md |
| Functions | `functions.md` | `FUNCTION_REVIEW.md` | Merge review notes into functions.md |
| Deployment | `deployment.md` | `deployment-summary.md` | Merge summary into deployment.md |
| App docs | `applications.md` | `apps/*.md` (5 files) | Merge into Applications/overview.md |
| Index | `README.md` | `SUMMARY.md` | Merge SUMMARY content into README.md |
