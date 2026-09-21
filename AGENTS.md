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

All implementation agents MUST establish ownership through GitHub before changing implementation files. GitHub is the durable development truth.

### Canonical claim authority

- The atomic claim lock is the exact Git branch `agent/<subgoal-id>`, created from the required current `main` SHA.
- Branch creation is the mutex: successful exact ref creation means the issue is claimed; an existing exact ref means another agent already owns it.
- Do not bypass a collision with suffixes, worker names, timestamps, or alternate prefixes.
- Issue comments, assignees, browser state, local JSON, Manager ledgers, and AI statements are projections/evidence only. They MUST NOT create or override claim authority.
- A claim comment should record the agent/workspace identity, branch, issue/subgoal, and base `main` SHA after successful branch creation.
- One agent should hold one implementation claim at a time unless an explicit Manager task requires otherwise.

### Before starting an issue

1. Resolve the current required `main` SHA and confirm the issue is open and eligible.
2. Check live GitHub refs and open PRs for the canonical `agent/<subgoal-id>` branch.
3. Atomically create `agent/<subgoal-id>` from that resolved `main` SHA.
4. If GitHub reports that the ref already exists, do not inspect or modify implementation files for that issue; select another eligible issue.
5. After successful creation, record the claim on the issue for human/audit visibility.
6. Reconcile Titan Code / Manager local projections from the resulting GitHub state before execution.

### While working

- Work only on the canonical claim branch.
- Durable lifecycle is derived from GitHub facts: issue, branch/base/head SHAs, commits, checks, pull request, merge, and issue closure.
- Local Manager revisions/generations may be retained only as subordinate cache or concurrency metadata.
- AI recommendations, local ledgers, and issue comments cannot declare a claim, merge, completion, or canonical repository state.
- Parent/meta issues must not be claimed when claimable child implementation issues exist.
- Archive donor work must use its dedicated donor issues (for example #720-#724), not parent #66.

### Pull request, merge, and completion

- Agent work flows through `Issue -> Branch -> Commit -> Checks -> Pull Request -> Review -> Merge -> Issue Closed`.
- The canonical PR must target `main` and link its issue with `Closes #<issue-number>`.
- Required checks and verification evidence determine readiness; model output does not.
- GitHub PR merge is the canonical integration event. Do not use a parallel "promotion" operation as repository authority.
- After merge/closure, claim branches may be released only through the repository's safe claim-release workflow after live GitHub state proves deletion is safe.

### Stale or interrupted work

Do not silently steal or locally overwrite a claim. Reconstruct state from GitHub first. If a claim branch is stale, preserve evidence and use the Manager/safe-release process before another agent attempts the exact canonical branch.

