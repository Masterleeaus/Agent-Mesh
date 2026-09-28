# AGENTS.md — Titan Zero Execution Contract

<!-- Titan Zero Codex Execution Contract -->

Titan Zero is developed by humans and coding agents concurrently. This file is the repository-wide execution contract. A deeper `AGENTS.md` may narrow rules for its subtree, but it may not weaken this contract or canonical architecture.

## 1. Authority and truth

Use sources in this order:

1. Current code, migrations, tests, and live GitHub state are implemented truth.
2. `docs/canonical/` defines authoritative product, domain, and architecture direction.
3. `docs/contracts/` defines active cross-component contracts.
4. `docs/working/` and `ai/` are implementation aids.
5. `docs/archive/` and `docs/generated/` are evidence/history only.

Before architecture, infrastructure, persistence, runtime, or deployment work, read `ai/INVARIANTS.md`.

Do not create a parallel engine, authority system, task ledger, database abstraction, workforce, runtime, memory system, capability registry, or UI architecture when Titan already has a canonical owner.

## 2. Codex operating mode

Codex and other implementation agents should execute, not merely propose, when the issue is implementation-ready.

Before editing:
- Read the issue and acceptance criteria.
- Re-read current `main`, the claim branch, relevant `AGENTS.md` files, canonical docs, nearby tests, and current implementations.
- Search for an existing owner/contract before adding a new abstraction.
- Establish the smallest coherent change set that completes the issue.
- Assume concurrent agents may have changed adjacent files; re-read immediately before mutation.

During work:
- Stay inside the claimed mission. Fix directly caused breakage, but do not opportunistically redesign unrelated systems.
- Prefer modifying canonical owners over adding adapters that duplicate business logic.
- Preserve backward compatibility unless the issue explicitly authorizes a breaking migration.
- Add or update tests with behavior changes.
- Never weaken security, tenant isolation, authority, evidence, privacy, idempotency, or verification to make a test pass.
- Never report a task complete from inspection alone when the task requires implementation.

## 3. Repository boundaries

The top-level boundaries are ownership signals:

- `apps/`: user-facing/runtime surfaces and channel adapters. Surface code projects canonical state; it does not become a second business source of truth.
- `services/`: long-running worker/workforce execution. Keep transport/orchestration here; reuse domain, storage, authority, and evidence contracts.
- `packages/`: reusable canonical domain/runtime capabilities. Shared business rules belong here rather than being copied into apps.
- `infra/`: deployment and host configuration. Do not encode product/domain policy here.
- `scripts/`: operational/build/migration tooling. Scripts must fail loudly and avoid hidden production mutations.
- `docs/`: canonical direction, contracts, working notes, and evidence according to the hierarchy above.

Cross-boundary edits are allowed only when the mission requires them. In the PR, name every boundary changed and why. If a change spans more than one of `apps/`, `services/`, `packages/`, persistence, or authority/evidence contracts, run integration-level verification appropriate to the interaction.

Subtree `AGENTS.md` files may add constraints for `apps/`, `services/`, and `packages/`.

## 4. Titan invariants

Unless a canonical document explicitly changes them:

- `company_id` is the canonical company/tenant boundary. Legacy tenant identifiers are compatibility ingress only.
- Canonical product surfaces are `zero`, `go`, and `hub`; other apps/channels are adapters or specialized surfaces.
- Consequential actions pass through Titan's governed decision/authority/execution path.
- Provider acknowledgement is not a verified business outcome.
- Evidence/provenance must survive consequential execution.
- SQLite is the canonical local/runtime persistence target where defined by current architecture.
- Reuse existing capability, workforce, identity, context, memory, authority, execution, and evidence contracts before adding new ones.
- Titan Code/agent tooling is development infrastructure, not a production dependency of Titan Zero.

## 5. GitHub claim and branch discipline

All implementation work maps to an open GitHub issue/subgoal.

The only implementation claim lock is the exact GitHub branch ref:

`agent/<subgoal-id>`

Rules:
1. Immediately before claiming, fetch the issue, current `main` SHA, live `agent/*` refs, dependencies, and relevant PRs.
2. Atomically create the exact claim branch from the required current `main`.
3. If it already exists, another agent owns the claim. Do not create a suffix, timestamp, worker-name branch, or alternate prefix.
4. Post a claim comment with workspace/agent identity, issue, subgoal, branch, and base SHA.
5. One implementation claim per agent/workspace unless a Manager issue explicitly authorizes otherwise.
6. Use the same branch through implementation, verification, PR, fixes, and handoff.
7. Never open a second branch because the first branch conflicts. Rebase/merge/fix the existing claim branch.
8. The canonical PR targets `main` and contains `Closes #<issue>`.
9. After merge, rely on governed cleanup/delete-on-merge. Do not leave replacement branches behind.
10. Do not claim parent/meta issues while claimable child implementation issues exist.

GitHub refs, commits, checks, PRs, merges, and issue state are the coordination and lifecycle record. Do not maintain a second Agent Mesh ledger.

## 6. Verification contract

Verification is risk-based and cumulative.

### Tier 0 — docs/templates only
- Inspect rendered/parsed content.
- Check links/paths/commands referenced actually exist where practical.
- Confirm no contradictory instruction was introduced.

### Tier 1 — localized code
- Run targeted tests for changed behavior.
- Run relevant lint/typecheck/build for the touched package/app.

### Tier 2 — cross-boundary behavior
- Tier 1 plus integration tests for the changed interaction.
- Run `pnpm gate:fast` when the workspace can support it.
- Verify compatibility at both sides of changed contracts.

### Tier 3 — authority, persistence, migrations, execution, security, evidence, tenancy, production bootstrap
- Tier 2 plus the relevant full integration/recovery/migration/security tests.
- Run `pnpm gate` when supported.
- Prove failure modes fail closed.
- For persistence/recovery work, prove restart/replay/recovery as applicable.
- For company-scoped changes, include negative cross-company isolation coverage.
- For consequential execution, distinguish provider acknowledgement from verified outcome.

A failing relevant gate is work, not a footnote. Attempt fixes before escalation. Never mark a check as passed unless it was actually executed and passed.

If an environment prevents a required gate, record:
- exact command not run,
- exact blocker,
- what narrower checks did run,
- residual risk.

## 7. Definition of done

A mission is complete only when all are true:
- Acceptance criteria are implemented, not merely described.
- Changed behavior has proportionate verification.
- No known relevant regression is left unexplained.
- Canonical docs/contracts are updated if behavior or architecture changed.
- PR contains concrete evidence: commands, results, changed boundaries, risks, and rollback/compatibility notes.
- Branch is the canonical claim branch and the PR closes the issue.
- Remaining work is explicitly out of scope or represented by a separate issue; do not hide TODOs in prose.

Required task report:
1. Objective
2. Files changed
3. Boundaries/contracts changed
4. Commands executed
5. Gate/test results
6. Risks, rollback, and follow-ups

## 8. Handoff and concurrency

Before final push or PR update:
- Fetch/re-read current `main` and changed files.
- Resolve conflicts on the existing claim branch.
- Re-run verification invalidated by conflict resolution.
- Keep commits reviewable and avoid unrelated formatting churn.

If blocked, leave durable evidence on the issue/PR and keep the canonical branch. Do not create a replacement branch.

Lifecycle may be projected as:
`AVAILABLE → CLAIMED → ACTIVE → VERIFYING → READY → PR_OPEN → MERGED → COMPLETED`

Exceptional projections: `BLOCKED`, `FAILED`, `SUPERSEDED`, `REBASE_REQUIRED`.

These states are derived from GitHub facts; they are not a second state machine.

## 9. Mission prompt contract

Reusable Codex missions should use `docs/agent/MISSION_TEMPLATE.md`. A mission must state outcome, canonical owners to preserve, allowed scope, forbidden duplication, acceptance evidence, and verification tier. The issue remains the durable work record.
