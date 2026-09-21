# AGENTS.md - Execution Contract\n\n<!-- Titan Zero Agent Mesh V3 -->

This repository uses AI-assisted development, but product direction is defined only by the canonical documentation set.

## Documentation Hierarchy

Use documentation in this order:

1. Code and database migrations are the implemented truth.
2. `docs/canonical/` is the authoritative product, domain, and architecture truth.
3. `docs/contracts/` and `docs/working/` contain supporting implementation notes.
4. `ai/` is only a compact AI-agent quick-reference layer.
5. `docs/archive/` and `docs/generated/` are historical/evidence only, not active instruction sources.

## Read This First

**Operational invariants (before auditing status, building infra, or deploying):**
`ai/INVARIANTS.md` — the deploy-lag trap (check `origin/main` AND `/opt`, not the
local checkout), worker-no-egress, superuser/RLS, migration numbering, HA-driven
schedules, and how to run the test tiers (`scripts/dev-stack.sh`).

Product direction:

- `docs/canonical/PRODUCT_VISION.md`
- `docs/canonical/DOMAIN_MODEL.md`
- `docs/canonical/WORKFLOW.md`
- `docs/canonical/ARCHITECTURE.md`
- `docs/canonical/ROADMAP.md`
- `docs/canonical/PRODUCTION_INTELLIGENCE.md`
- `docs/canonical/OPERATIONS.md`

Archived, generated, and working documents may provide evidence, implementation notes, or historical context. They do not override canonical docs.

Active implementation backlog: docs/backlog/README.md

## Prime Directive

Complete requested tasks end-to-end while preserving reliability, traceability, and canonical product scope.

## Non-Negotiable Rules

1. Never skip relevant quality gates for code changes.
2. Any failed gate requires fix attempts before asking for help.
3. Never store secrets in code; use `.env`.
4. Migrations must be additive and reversible unless a migration plan is explicit.
5. Business logic changes must include tests or an explicit documented test gap.
6. Production runs on garonhome.local using `infra/compose.garonhome.yml`.
7. Do not use archived or generated planning documents as product instructions.
8. Do not start new work unless it maps to an existing `docs/backlog/` task, or a new task is added to `docs/backlog/` first.

## Decision Policy

If multiple options exist, choose the one with:

1. Lower operational complexity.
2. Lower total maintenance burden.
3. Better alignment with canonical product direction.
4. Better compatibility with garonhome.local.

## Required Deliverable Format Per Task

1. Objective
2. Files changed
3. Commands executed
4. Gate results
5. Risks and follow-up tasks


## Mandatory GitHub Issue Claim Protocol

All agents MUST establish a GitHub branch claim before implementation work. GitHub is the durable development truth; local/browser/AI state and issue comments are projections or evidence only.

### Canonical claim authority

1. Resolve the current required `main` SHA immediately before claiming.
2. Select an eligible open implementation issue/subgoal.
3. Atomically create the exact branch `agent/<subgoal-id>` from that required `main` SHA.
4. Successful exact branch creation establishes the claim.
5. If GitHub reports that the exact ref already exists, the issue is already claimed. Do not create a suffixed, worker-named, timestamped, or alternate-prefix branch; select another eligible issue.
6. Record the successful claim on the issue with agent/workspace identity, branch, and base `main` SHA. The comment is evidence of the claim, not the mutex.
7. Reconcile Titan Code/Agent Mesh local state from the live GitHub issue, branch, commit, check, and PR facts before acting.

### While working

- One agent may hold only one implementation claim at a time unless an explicit Manager issue says otherwise.
- Parent/meta issues must not be claimed while claimable child implementation issues exist.
- Commit work to the canonical claim branch and use the canonical PR handoff flow.
- A claim must not be inferred from JSON, browser storage, AI text, workspace ledgers, issue assignees, or comment ordering.
- Never let local state override a conflicting live GitHub ref, SHA, PR, check, or merge fact.

### Completion and release

- Normal completion follows `Issue → Branch → Commit → Checks → Pull Request → Review → Merge → Issue Closed`.
- Claim branches are released only by the governed safe-claim cleanup flow after GitHub evidence proves release is safe.
- Do not silently delete another agent's branch or manufacture a replacement claim.
- If work is blocked or abandoned, record the handoff/blocker durably on GitHub and preserve the branch until the governed release rules permit deletion.

### Archive donor issues

Archive donor work must use the dedicated donor issues (for example #720-#724) rather than claiming parent #66. Each donor issue is independently claimable through its own exact `agent/<subgoal-id>` branch.

