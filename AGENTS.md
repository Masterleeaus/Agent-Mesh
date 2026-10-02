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

All implementation work maps to an open GitHub issue. Roadmap subgoals may be converted into linked implementation issues when that makes delivery smaller and clearer.

Use short-lived branches from current `main`. The recommended name is `agent/issue-<issue-number>`; a bounded child issue or recovery slice may use its own branch.

Rules:
1. Before implementation, fetch the issue, current `main` SHA, relevant PRs and nearby code.
2. An existing or stale branch is not a stop condition. Inspect and preserve its commits; continue on it when practical, or create a recovery branch from current `main` and link the prior work.
3. Parallel work is allowed on independent issues and non-overlapping files. Do not serialize unrelated work behind one claim or workspace. Coordinate only actual file/contract conflicts.
4. Keep each PR bounded and target `main`. Use `Closes #<issue>` only when the linked issue's full acceptance criteria are met; use `Refs #<parent>` for partial slices and keep the parent open.
5. Split a broad mission whenever an independently reviewable outcome can ship separately. Create linked issues with one observable outcome, clear scope, concise acceptance criteria and focused verification. Check for an existing owner first; keep a parent tracker open for integration/product certification.
6. Keep work on the branch through review and fixes. After merge, delete obsolete branches when practical. Branch naming and claim comments are coordination aids, not merge prerequisites.

GitHub refs, commits, checks, PRs, merges, and issue state are the coordination and lifecycle record. Do not maintain a second Agent Mesh ledger.

### Slice-first delivery and merge policy

This policy controls merge readiness for implementation slices and takes precedence over any broader-mission wording below.

- Break large missions into small, independently deliverable issues and PRs. A parent issue tracks the whole sub-product; it does not require every slice to wait for the parent’s full acceptance run.
- A partial PR may merge with `Refs #<issue>` once its own change is reviewable and its directly relevant checks pass. Full-mission evidence, live-host certification, end-to-end workflows, and the full repository gate are not prerequisites for merging an isolated slice.
- For each slice, run focused tests, typecheck, lint, or build checks that cover the changed behavior. Record broader checks as deferred and run them when the sub-product is integrated, then before release.
- An unrelated baseline failure, unrelated workflow failure, or pending full-product certification does not block a slice merge. Create or link a small follow-up issue when the failure is real and independently actionable.
- Do not require a slice PR to prove criteria owned by other issues. Keep the parent issue open until its sub-product integration and acceptance checks are complete.
- Keep security, company isolation, authorization, data integrity, and irreversible financial safeguards intact. A check that directly protects behavior changed by the slice remains in scope; unrelated certification is deferred.
- Claim branches and evidence templates are coordination aids, not reasons to hold an otherwise ready slice. If a mechanical policy check rejects valid slice evidence, correct the template or validator promptly; do not expand the slice to satisfy full-mission closure requirements.

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

A failing check on the changed slice must be addressed or recorded with its concrete impact. Do not report a check as passed unless it ran and passed.

### Mergeable slices and product gates

Merge is a delivery decision for the code in the PR. Mission closure and product certification are separate decisions.

- Merge a bounded slice when it is reviewable, focused checks for the changed behavior pass, no known high-impact regression or boundary violation remains, and unavailable checks are stated with their exact blocker and risk.
- Run focused package, lint, typecheck, build or smoke checks for the paths and behavior changed. Do not require the full repository gate, live-host/device acceptance, or every parent-issue criterion for each partial PR.
- Run broad integration, end-to-end, security, recovery and live-environment checks at the named sub-product or release milestone after its components have landed. Track these as explicit integration/certification issues.
- To opt a pull request into the broad product gates, include the exact HTML comment `<!-- titan-subproduct-gate: run -->` in its body at the sub-product/release milestone. Ordinary prose and deferred-gate labels must not trigger those jobs; workflow dispatch remains available.
- A red check blocks merging when it covers the changed slice, is a required GitHub protection, or demonstrates a concrete safety, data-loss, security, tenant-isolation or product-breaking regression. Unrelated, flaky or unavailable checks must be recorded and followed up without holding unrelated code.
- Keep slice evidence proportional: identify changed paths, focused commands/results, known gaps, and linked parent/child issues. The full parent acceptance map is required only to close the parent issue.
- Do not disable organization/repository protection rules or falsify results. GitHub-enforced settings remain authoritative.

### Merge-state triage

When a PR is not mergeable, identify the state and take the matching next step:

- **Conflicting or stale head:** compare changed files with current `main`; bring current changes into the existing work or a linked recovery branch, resolve only overlapping files, then rerun focused checks.
- **Draft:** mark ready when the bounded slice and its focused evidence are reviewable.
- **Changed-scope check failed:** fix the failure and rerun that check. For unrelated/flaky/baseline failures, record the exact run and affected scope; do not hold unrelated slices.
- **Pending required check:** wait for that check to finish. If it is required by GitHub protection, satisfy it or report the exact protection rule; do not bypass it.
- **Review or unresolved thread required:** request the missing review or resolve the concrete thread. Keep working on independent slices while review is pending.
- **Evidence/linkage issue:** partial delivery uses `Refs` and concise slice evidence. Full closure uses `Closes` with the complete current mission-evidence record.

If an environment prevents a focused check, record:
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

A parent mission closes only when all of its acceptance criteria are implemented and verified. A bounded slice may merge earlier under “Mergeable slices and product gates”; merging code does not certify or close the parent product mission.

A mission is complete only when all are true:
- Acceptance criteria are implemented, not merely described.
- Changed behavior has proportionate verification.
- No known relevant regression is left unexplained.
- Canonical docs/contracts are updated if behavior or architecture changed.
- PR contains concrete evidence: commands, results, changed boundaries, risks, and rollback/compatibility notes.
- The PR links the issue and closes it only after its full acceptance criteria and closure evidence pass. A merged partial slice does not close its parent.
- Remaining work is explicitly out of scope or represented by a separate issue; do not hide TODOs in prose.

Required task report:
1. Objective
2. Files changed
3. Boundaries/contracts changed
4. Commands executed
5. Gate/test results
6. Risks, rollback, and follow-ups

### Mission closure gate

### Bounded issue decomposition

When a mission is too broad to finish as one reviewable change, split it into linked child issues with one observable outcome, a short acceptance list, a canonical owner and focused checks. Merge each completed slice with `Refs #parent` or close a fully completed child with `Closes #child`; keep the parent open for integration and product certification. Do not close a parent just to move its remaining work elsewhere.

A mission issue closes only after its full acceptance criteria and Done condition are satisfied. A related commit, green CI, contract, schema, projection, documentation slice, or partial implementation is not full completion. A bounded handoff may preserve work and ownership, but it never authorizes closing the original mission early.

- PRs that deliver only a slice say `Refs #<mission>`, not `Closes #<mission>`. Keep the mission open until full completion. Do not split ordinary implementation steps into child issues.
- A PR using `Closes #N` for full completion must map every acceptance criterion to implementation paths and executed verification evidence. Record failed or unrun checks, live-host verification, risks, and follow-ups. If required evidence is missing or the semantic outcome is incomplete, do not claim full completion.
- Use the standard versioned PR evidence record defined in `docs/agent/MISSION_CLOSURE_EVIDENCE.md` and both PR templates. The existing claim gate verifies live issue linkage, the issue-body digest, per-criterion mappings and explicit verification/live-host status. Unknown, failed, blocked or unrun required evidence remains non-closing.
- Distinguish planning/specification, implementation, integration and certification outcomes. Finishing one kind does not automatically finish a broader mission of another kind.
- A mechanical checklist or CI check can validate evidence presence and structure; it cannot determine whether the evidence actually proves the criterion. The human reviewer must compare the PR evidence with the full issue and its current Done condition.
- Never close a mission through an administrative handoff. Keep the original open and retain its full scope until completion; any successor must link back and carry every unmet criterion. Reopen a mistakenly closed issue when possible; use `SUPERSEDED` only for genuinely replaced work with its successor link.

## 8. Handoff and concurrency

Before final push or PR update:
- Fetch/re-read current `main` and changed files.
- Resolve conflicts by preserving reachable work on its current branch or a linked recovery branch.
- Re-run verification invalidated by conflict resolution.
- Keep commits reviewable and avoid unrelated formatting churn.

If blocked, leave durable evidence on the issue/PR and keep the issue open. Create a linked child issue for a bounded independent remainder; use a recovery branch when the current workspace or branch cannot be continued safely.

Lifecycle may be projected as:
`AVAILABLE → CLAIMED → ACTIVE → VERIFYING → READY → PR_OPEN → MERGED → COMPLETED`

Exceptional projections: `BLOCKED`, `FAILED`, `SUPERSEDED`, `REBASE_REQUIRED`.

These states are derived from GitHub facts; they are not a second state machine.

## 9. Mission prompt contract

Reusable Codex missions should use `docs/agent/MISSION_TEMPLATE.md`. A mission must state outcome, canonical owners to preserve, allowed scope, forbidden duplication, acceptance evidence, and verification tier. The issue remains the durable work record.
