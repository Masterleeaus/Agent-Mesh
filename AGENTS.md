# AGENTS.md — Titan Zero Execution Contract

<!-- Titan Zero Codex Execution Contract -->

Titan Zero is developed by humans and coding agents concurrently. This file is the repository-wide execution contract. A deeper `AGENTS.md` may narrow rules for its subtree, but it may not weaken this contract or canonical architecture.

## 1. Authority and truth

Use sources in this order:

1. Current code, migrations, tests, and live GitHub state are implemented truth.
2. `docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md` and `docs/architecture/CANONICAL-RULES.md` define the current cross-repository architecture and invariants; `roadmap/PHASE-MAP-V3.md` defines convergence order.
3. `docs/canonical/` defines authoritative product/domain detail where it does not conflict with Blueprint v3.
4. `docs/contracts/` defines active cross-component contracts.
5. `docs/working/` and `ai/` are implementation aids.
6. `docs/archive/`, `docs/generated/`, and top-level `archive/` are evidence/history/donor material only unless current production reachability is proven.

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

If a required source or tool is temporarily unavailable, do not abandon the mission. Use the recovery paths in “Execution recovery paths” below and continue with work that can be done safely.

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

- `company_id` is the canonical logical company identity and authorization/routing/evidence boundary. Legacy tenant identifiers are compatibility ingress only. Company-owned native operational persistence defaults to one physical database per Titan company behind a fail-closed company storage resolver/mapping. Optional providers may add stricter physical boundaries (notably per-company Frappe sites/databases) without replacing `company_id`; storage placement never grants authority.
- Canonical PWA/mobile modes are `zero`, `go`, and `hub`: one PWA and one native mobile app each expose these three governed modes. `apps/web` is the separate full base web application. Other apps/channels are adapters or specialized surfaces.
- Consequential actions pass through Titan's governed decision/authority/execution path.
- Provider acknowledgement is not a verified business outcome.
- Evidence/provenance must survive consequential execution.
- SQLite is the canonical local/runtime persistence target where defined by current architecture.
- Reuse existing capability, workforce, identity, context, memory, authority, execution, and evidence contracts before adding new ones.
- Titan Code/agent tooling is development infrastructure, not a production dependency of Titan Zero.

## 5. GitHub claim and branch discipline

All implementation work maps to an open GitHub **mission issue**. Roadmap subgoals remain planning/traceability and should not be mirrored as separate implementation issues.

The only implementation claim lock is the exact GitHub branch ref:

`agent/issue-<issue-number>`

Rules:
1. Immediately before implementation, fetch the issue, current `main` SHA, live `agent/*` refs, dependencies, and relevant PRs.
2. Use the exact mission branch `agent/issue-<issue-number>` from the required current `main` when it is available.
3. An existing mission branch is not by itself a reason to stop. Inspect its commits, diff, issue comments, and linked PRs; preserve all existing work and continue on that branch when no active conflicting owner is evident. If another active implementation is evident, coordinate around the shared branch, partition work by files/criteria, and continue on non-overlapping work while preserving their changes. Pause only the conflicting edits until they can be integrated safely.
4. Do not create suffix, timestamp, worker-name, or alternate-prefix branches for the same mission.
5. Record branch/base/subgoal context in the issue or PR when starting new implementation work; do not post duplicate claim comments when a valid claim is already recorded. Keep one active implementation claim per agent/workspace by default; when a claim is externally blocked, keep it open and continue only with an independent issue that does not modify the same files or depend on the blocked work.
6. Use the same mission branch through implementation, verification, PR, fixes, and handoff.
7. The canonical PR targets `main`. Use `Closes #<issue>` only when the full mission closure gate below is satisfied; partial or unverified work must use `Refs #<issue>`.
8. After merge, rely on governed cleanup/delete-on-merge. Do not leave replacement branches behind.
9. Do not create child issues for implementation steps that fit inside the claimed mission. Create a new issue only for a genuinely independent substantial outcome with no existing canonical owner.

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

### Execution recovery paths

These fallbacks keep work moving while preserving the gates above:

- **Git CLI, proxy, or local clone unavailable:** use the connected GitHub read/write tools to inspect the exact base commit, branch, issue, and PR, and to update the existing canonical branch without force-pushing. If remote writes are unavailable, finish safe local changes and verification, keep the issue open, and provide the patch and exact sync steps.
- **Local checkout behind current `main`:** compare the checkout SHA with the live `main` SHA. Continue analysis and edits that do not conflict; before publishing, apply them to the current base and re-run checks affected by intervening changes. If the full current source cannot be obtained, do not claim the remote branch is updated or close the issue.
- **An active branch owner or overlapping edits:** coordinate through existing issue/PR records, preserve their commits, and take non-overlapping files or acceptance criteria on the same canonical branch. Integrate and re-verify before publishing. Do not overwrite or force-update concurrent work.
- **Missing runtime, database, Docker, credentials, or dependency access:** run the strongest available static and disposable checks, document exact failed/unavailable gates and residual risk, and continue implementation that does not require the missing resource. Leave completion status open until every required criterion is verified.
- **External dependency or live-host access unavailable:** complete the independent acceptance criteria, record the precise dependency and evidence needed to resume, and keep the issue open. Do not replace a required live verification with a mock or documentation claim.

Recovery paths do not lower security, tenant isolation, data-safety, or acceptance requirements. They allow independent work to continue and make blocked evidence explicit; they never authorize a false pass or premature issue closure.

## 7. Definition of done

A mission is complete only when all are true:
- Acceptance criteria are implemented, not merely described.
- Changed behavior has proportionate verification.
- No known relevant regression is left unexplained.
- Canonical docs/contracts are updated if behavior or architecture changed.
- PR contains concrete evidence: commands, results, changed boundaries, risks, and rollback/compatibility notes.
- Branch is the canonical claim branch and the PR closes the issue only after the mission closure gate is satisfied. A non-closing slice is not a completed mission.
- Remaining work is explicitly out of scope or represented by a separate issue; do not hide TODOs in prose.

Required task report:
1. Objective
2. Files changed
3. Boundaries/contracts changed
4. Commands executed
5. Gate/test results
6. Risks, rollback, and follow-ups

### Mission closure gate

### Bounded blocked-work handoff

When a small, independently executable remainder blocks finishing the current issue, use this sequence:

1. Confirm the current branch has completed and verified all work it can safely deliver. Do not use this for unfinished work that still belongs in the current branch or for a broad, unbounded scope split.
2. Create the successor issue **before** closing the original. It must name the blocker, preserve every unmet acceptance/verification/Done requirement, identify the canonical owner and dependencies, and link the original issue and the delivered PR. Check for an existing owner/issue first.
3. Keep the PR non-closing: use `Refs #<original>`, `mode: partial`, and state that the mission is not fully delivered. Link the successor prominently and retain exact test/live-host gaps.
4. Merge the completed slice on the existing canonical claim branch after its normal required reviews/checks pass. Do not create a replacement branch.
5. After merge, add a durable handoff note to the original issue linking the merged PR and successor, enumerating what landed and what remains; then close the original as a handoff/administrative completion. Keep the successor open and authoritative for the remainder. Never describe or count this as full mission completion.
6. If GitHub policy or a required gate prevents this sequence, leave the original open and report the precise gate; do not bypass protection.

Do not create a successor merely to evade tests, review, implementation, or a dependency that can be resolved within the claimed work. The handoff is for a genuinely separate blocker or bounded remainder and preserves, rather than removes, the original unmet scope.

A mission issue normally closes only after its full acceptance criteria and Done condition are satisfied. A related commit, green CI, contract, schema, projection, documentation slice, or partial implementation is not full completion. Use the bounded blocked-work handoff exception below only when a small, independent remainder cannot be completed in the current mission.

- PRs that deliver only a slice normally say `Refs #<mission>`, not `Closes #<mission>`. Keep the mission open unless the bounded blocked-work handoff exception below applies. Do not split ordinary implementation steps into child issues.
- A PR using `Closes #N` for full completion must map every acceptance criterion to implementation paths and executed verification evidence. Record failed or unrun checks, live-host verification, risks, and follow-ups. If required evidence is missing or the semantic outcome is incomplete, do not claim full completion.
- Use the standard versioned PR evidence record defined in `docs/agent/MISSION_CLOSURE_EVIDENCE.md` and both PR templates. The existing claim gate verifies live issue linkage, the issue-body digest, per-criterion mappings and explicit verification/live-host status. Unknown, failed, blocked or unrun required evidence remains non-closing.
- Distinguish planning/specification, implementation, integration and certification outcomes. Finishing one kind does not automatically finish a broader mission of another kind.
- A mechanical checklist or CI check can validate evidence presence and structure; it cannot determine whether the evidence actually proves the criterion. The human reviewer must compare the PR evidence with the full issue and its current Done condition.
- If a mission was closed through the handoff exception, retain the original issue and its full scope; the successor issue must link back and carry every unmet criterion. Do not mark the original as fully delivered. Reopen a mistakenly closed issue when possible; use `SUPERSEDED` only for genuinely replaced work with its successor link.

## 8. Handoff and concurrency

Before final push or PR update:
- Fetch/re-read current `main` and changed files.
- Resolve conflicts on the existing claim branch.
- Re-run verification invalidated by conflict resolution.
- Keep commits reviewable and avoid unrelated formatting churn.

If blocked, leave durable evidence on the issue/PR and keep the canonical branch. Use the bounded blocked-work handoff above only after the successor issue exists; otherwise keep the original issue open. Do not create a replacement branch.

Lifecycle may be projected as:
`AVAILABLE → CLAIMED → ACTIVE → VERIFYING → READY → PR_OPEN → MERGED → COMPLETED`

Exceptional projections: `BLOCKED`, `FAILED`, `SUPERSEDED`, `REBASE_REQUIRED`.

These states are derived from GitHub facts; they are not a second state machine.

## 9. Mission prompt contract

Reusable Codex missions should use `docs/agent/MISSION_TEMPLATE.md`. A mission must state outcome, canonical owners to preserve, allowed scope, forbidden duplication, acceptance evidence, and verification tier. The issue remains the durable work record.
