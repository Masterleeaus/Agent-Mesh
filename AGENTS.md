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

All agents MUST claim an issue before implementation. The **GitHub branch ref is the canonical claim lock**.

### Canonical claim authority

- Claim branch: `agent/<subgoal-id>`
- Resolve the current required `main` SHA immediately before claiming.
- Atomically create `refs/heads/agent/<subgoal-id>` from that SHA.
- Successful branch creation establishes the claim.
- If GitHub reports that the ref already exists, the issue is already claimed. Do not create a suffixed, worker-named, timestamped, or alternate-prefix branch; select another eligible issue.
- `work/claims.json`, browser state, Manager ledgers, issue comments, assignees, AI output, and local state are **projections/evidence only** and MUST NOT act as a competing claim mutex.

### Before starting any issue

1. Resolve the open GitHub issue and its subgoal identity.
2. Re-read current `main`, existing `agent/*` refs, and open PRs.
3. Confirm the issue is eligible and has no canonical claim branch/open canonical PR.
4. Atomically create `agent/<subgoal-id>` from the required current base SHA.
5. After successful creation, record an issue comment containing agent/workspace identity, claim branch, and base SHA for human-visible audit evidence.
6. Only then begin implementation.

### While working

- One agent should hold one implementation claim at a time unless an explicit Manager task requires otherwise.
- The canonical claim branch must remain `agent/<subgoal-id>`.
- Issue comments and GitHub assignees are supplemental audit/coordination evidence, not the lock.
- Parent/meta issues must not be claimed while claimable child implementation issues exist.
- GitHub remains durable development truth: issue → claim branch → commits/checks → pull request → review → merge → issue closure.

### Completion and release

- Normal completion occurs through the canonical PR linked with `Closes #<issue-number>`, followed by verified merge.
- Claim branches are released/deleted only when the repository's safe-claim-release logic proves deletion is safe.
- A comment saying work is completed/released does not by itself release the GitHub claim.
- Never silently steal, overwrite, or bypass an existing canonical claim branch.

### Archive donor issues

Archive donor work must use its dedicated donor issues (for example #720-#724) rather than parent #66. Each donor issue is independently claimable through its own canonical `agent/<subgoal-id>` branch.
