# AGENTS.md - Execution Contract

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

All agents MUST claim an issue before doing implementation work. This is a hard execution gate, not an optional coordination convention.

### Before starting any issue

1. Fetch the issue and its latest comments immediately before claiming it.
2. Look for an active claim marker in the issue comments using this exact machine-readable form:
   `<!-- TITAN_AGENT_CLAIM agent="<agent-id>" issue="<number>" status="active" -->`
3. If another agent has an active claim, STOP. Do not inspect/modify implementation files for that issue. Select another eligible unclaimed issue.
4. If no active claim exists, post a claim comment containing:
   - the exact marker above,
   - agent/workspace identifier,
   - intended scope,
   - `CLAIMED` in visible text.
5. Immediately re-fetch the issue comments after posting the claim.
6. The earliest still-active claim wins. If another active claim was posted before yours, post a release marker for your claim and select another issue.
7. Only after the post-claim re-check confirms ownership may implementation begin.

### While working

- One agent may hold only one implementation issue claim at a time unless an explicit manager issue says otherwise.
- Never work an issue merely because it is unassigned. GitHub assignees are supplemental; the claim marker is the Agent Mesh lock because multiple agents can share one GitHub identity.
- Agents must not edit, replace, or delete another agent's active claim.
- If work is intentionally handed off, the current claimant releases it before the next agent claims it.
- Parent/meta issues must not be claimed when claimable child implementation issues exist.

### Release / completion

Before moving to another issue, post one of:

`<!-- TITAN_AGENT_CLAIM agent="<agent-id>" issue="<number>" status="completed" -->`

or

`<!-- TITAN_AGENT_CLAIM agent="<agent-id>" issue="<number>" status="released" -->`

Include the PR/commit/evidence when completed. A completed or released marker by the same claimant ends that claimant's active lock.

### Stale claims

Do not silently steal a claim. If a claim appears abandoned, an agent must record why it is considered stale and explicitly release/take over the claim in the issue before changing implementation. Prefer manager/supervisor resolution when available.

### Archive donor issues

Archive donor work must use the dedicated donor issues (for example #720-#724) rather than claiming parent #66. Each donor issue is independently claimable.
