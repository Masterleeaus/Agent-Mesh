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

All agents MUST claim an issue before implementation work. The canonical claim lock is the GitHub branch ref `agent/<subgoal-id>`.

### Authority

- **GitHub branch creation is the claim mutex.** Atomically creating the exact canonical ref `agent/<subgoal-id>` from the required current base SHA establishes the claim.
- If that exact ref already exists, the issue is already claimed. Do not create a suffixed, worker-named, timestamped, or alternate-prefix branch; select another eligible issue.
- `work/claims.json`, issue comments, browser state, local JSON, Manager ledgers, AI output, and GitHub assignees are projections/evidence only. They MUST NOT override the live GitHub ref.
- Claim comments remain required coordination evidence, but they are **not** the lock authority.
- Multiple agents sharing one GitHub identity does not change the mutex: the exact branch ref remains unique and atomic.

### Before starting any issue

1. Fetch the issue, current `main` SHA, live `agent/*` refs, relevant open PRs, and dependencies immediately before claiming.
2. Confirm the issue is open, eligible, not completed/superseded, and has no canonical `agent/<subgoal-id>` ref or active PR.
3. Atomically create `refs/heads/agent/<subgoal-id>` from the required current `main` SHA.
4. If GitHub reports that the ref already exists, another agent won the claim. Select another eligible issue.
5. After successful ref creation, post a claim comment recording the agent/workspace identity, issue/subgoal, canonical branch, and base `main` SHA.
6. Re-read the branch and issue before mutation. GitHub remains authoritative if local/projected state disagrees.

### While working

- One agent may hold only one implementation claim at a time unless an explicit Manager issue says otherwise.
- Work only on the canonical claim branch. Never bypass a collision with a suffix, timestamp, worker name, or alternate prefix.
- Commits, checks, and the canonical PR are evidence of progress; AI/Manager text cannot declare authoritative lifecycle state.
- The canonical PR must target `main` and link its issue with `Closes #<issue-number>`.
- Parent/meta issues must not be claimed when claimable child implementation issues exist.
- A branch that falls behind `main` is evaluated from Git ancestry/check evidence; local generation counters are metadata only.

### Handoff / completion

- Push work to the same canonical claim branch and use the canonical PR rather than creating a competing handoff branch.
- If PR creation is temporarily unavailable, record durable handoff evidence on the issue while retaining the same claim branch.
- Merge authority is GitHub plus the repository's Manager/merge gates and required checks. A model, local ledger, or comment cannot declare a merge.
- After a verified merge, roadmap/issue reconciliation and safe claim-ref cleanup may run. Claim refs are deleted only when repository automation proves cleanup safe.
- If work is abandoned before merge, record the reason and use the governed safe-release path; do not silently delete or steal a live claim ref.

### Lifecycle projection

Titan Code and Agent Mesh may project the lifecycle as:

`AVAILABLE → CLAIMED → ACTIVE → VERIFYING → READY → PR_OPEN → MERGED → COMPLETED`

Exceptional projections are `BLOCKED`, `FAILED`, `SUPERSEDED`, and `REBASE_REQUIRED`.

These states MUST be derived from GitHub facts (issue, canonical claim branch, commits, checks, PR, merge and issue status). They are not an independent state machine.

### Archive donor issues

Archive donor work must use the dedicated donor issues (for example #720-#724) rather than claiming parent #66. Each donor issue is independently claimable.

