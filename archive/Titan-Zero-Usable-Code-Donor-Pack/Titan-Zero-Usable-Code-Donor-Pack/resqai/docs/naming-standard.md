# Naming Standard — ResQAI

Generated: 2026-06-28
Status: Recommendation

---

## Recommended Convention

| Category | Convention | Example |
|----------|-----------|---------|
| **Directories** | `kebab-case` | `account-health-scan/`, `support-reply-drafter/` |
| **Files (general)** | `kebab-case` | `check-ticket-urgency.json`, `ticket-service.ts` |
| **Files (documentation)** | `kebab-case` | `architecture.md`, `deployment.md` |
| **Functions** | `kebab-case` | `check-ticket-urgency`, `update-ticket-record` |
| **Workflows** | `kebab-case` | `ticket-intake.json`, `urgent-dispatch.json` |
| **TypeScript files** | `kebab-case` | `service-helpers.ts`, `loading-spinner.tsx` |
| **React components** | `PascalCase` | `TicketList.tsx`, `StatusBadge.tsx` |
| **TypeScript types** | `PascalCase` | `Ticket`, `AgentConfig` |
| **Config files** | `kebab-case` | `vite.config.ts`, `tsconfig.json` |
| **Script files** | `kebab-case` | `build.ts`, `dev.ts` |
| **Environment files** | lowercase | `.env`, `.env.example` |

---

## Current State

### Functions (Mixed — needs normalization)

```
Current:
  assign_appointment_technician/     ← snake_case  → SHOULD BECOME: assign-appointment-technician
  collect_resolved_tickets/          ← snake_case  → SHOULD BECOME: collect-resolved-tickets
  finalize_slippage_review/          ← snake_case  → SHOULD BECOME: finalize-slippage-review
  resolve_dispute/                   ← snake_case  → SHOULD BECOME: resolve-dispute
  update_account_health_status/      ← snake_case  → SHOULD BECOME: update-account-health-status
  
  check-ticket-urgency/              ← kebab-case  ✓ CORRECT
  update-ticket-record/              ← kebab-case  ✓ CORRECT
  account-health-scan/               ← kebab-case  ✓ CORRECT
  flag-slipping-followups/           ← kebab-case  ✓ CORRECT
  finalize-dispatch/                 ← kebab-case  ✓ CORRECT
```

### Documentation (Mixed — needs normalization)

```
Current:
  AGENT_REVIEW.md                    ← UPPER_SNAKE → SHOULD BECOME: agent-review.md
  ARCHITECTURE_V2.md                 ← UPPER_SNAKE → SHOULD BECOME: architecture-v2.md
  DATABASE_REVIEW.md                 ← UPPER_SNAKE → SHOULD BECOME: database-review.md
  FUNCTION_REVIEW.md                 ← UPPER_SNAKE → SHOULD BECOME: function-review.md
  DEPENDENCY_AUDIT.md               ← UPPER_SNAKE → SHOULD BECOME: dependency-audit.md
  DUPLICATE_CODE_REPORT.md           ← UPPER_SNAKE → SHOULD BECOME: duplicate-code-report.md
  INTEGRATION_TEST_PLAN.md           ← UPPER_SNAKE → SHOULD BECOME: integration-test-plan.md
  PERFORMANCE_REPORT.md              ← UPPER_SNAKE → SHOULD BECOME: performance-report.md
  PHASE6_PREPARATION.md              ← UPPER_SNAKE → SHOULD BECOME: phase6-preparation.md
  PROJECT_HEALTH_V2.md               ← UPPER_SNAKE → SHOULD BECOME: project-health-v2.md
  PROJECT_STATUS.md                  ← UPPER_SNAKE → SHOULD BECOME: project-status.md
  REACT_OPTIMIZATION_REPORT.md       ← UPPER_SNAKE → SHOULD BECOME: react-optimization-report.md
  SECURITY_REPORT.md                 ← UPPER_SNAKE → SHOULD BECOME: security-report.md
  SERVICE_LAYER_REPORT.md            ← UPPER_SNAKE → SHOULD BECOME: service-layer-report.md
  WORKFLOW_DESIGN.md                 ← UPPER_SNAKE → SHOULD BECOME: workflow-design.md
  
  agents.md                          ← lowercase  ✓ CORRECT
  applications.md                    ← lowercase  ✓ CORRECT
  architecture.md                    ← lowercase  ✓ CORRECT
  database.md                        ← lowercase  ✓ CORRECT
  deployment.md                      ← lowercase  ✓ CORRECT
  functions.md                       ← lowercase  ✓ CORRECT
  troubleshooting.md                 ← lowercase  ✓ CORRECT
  roadmap.md                         ← lowercase  ✓ CORRECT
```

---

## Rules

1. **kebab-case** for all file and directory names
2. **PascalCase** for React components and TypeScript types/interfaces
3. **camelCase** for variables, functions, and methods (TypeScript/JavaScript)
4. **snake_case** for Python functions and database columns
5. **UPPER_SNAKE_CASE** for environment variables and constants
6. No spaces in filenames or paths
7. No mixed case in directory/file names

---

## Enforcement

| Tool | Purpose |
|------|---------|
| Manual review | During cleanup phases |
| ESLint rule | `filenames/match-regex` (future) |
| Directory listing check | Verify before commit |
