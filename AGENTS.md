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

Large missions may be decomposed into **small implementation issues** when each child has one observable outcome, a narrow file/contract scope, and its own acceptance and slice checks. Link every child to its parent with `Parent: #<number>`; keep the parent as the subproduct completion owner. Check for duplicate issues and respect existing canonical owners. Do not create issues for trivial edits that belong together in one reviewable slice.

Each implementation issue uses the exact branch `agent/issue-<issue-number>`, targets `main`, and has one PR. Inspect existing commits, PRs, checks, and conflicts before continuing. Preserve the branch's work and coordinate non-overlapping changes when another contributor is active. Never create a suffixed replacement branch or overwrite unique commits. Work on independent issues may proceed sequentially when the user has authorized it.

For a completed child slice, use `Closes #<child>` and `Refs #<parent>`. This closes only the child's scoped outcome; the parent stays open until the whole subproduct and its completion gate are done. A direct PR against a parent without a child uses `Refs #<parent>` and leaves it open. Parent closure requires the complete parent acceptance and final subproduct evidence.

Before merging, fetch current `main`, re-read changed files, resolve conflicts on the existing branch, and rerun checks invalidated by conflict resolution. Do not bypass repository-required reviews or checks. Do not use a broad parent-level certification gate to block a slice whose own safe merge criteria are met.

## 6. Verification contract

Verification is proportional to the deliverable.

### Slice merge gate
- Run the smallest relevant compile, build, lint, or behavior smoke check available for the changed slice.
- Keep unrelated known repository debt visible, but do not make a slice wait for the entire parent's future acceptance suite.
- For changes to authentication, company isolation, authority, money, migrations, evidence, privacy, idempotency, or consequential production execution, run the focused negative-path or migration check that protects the changed boundary before merge.
- Record exact commands and results. Never report an unrun check as passed.

### Subproduct completion gate
When the parent issue's product or integration scope is complete, run the required full integration, full-suite, recovery, live-host and release checks declared by that parent. Mark `**Subproduct gate:** run` in the completion PR to trigger the broad Titan CI jobs. The parent remains open until its declared completion gate passes or a concrete blocker is recorded.

### Environment limits
If a slice-level required check cannot run, record the command, blocker, narrower checks completed, and residual risk. Defer only checks owned by the parent/subproduct gate, not focused safety checks required by the changed boundary.

## 7. Definition of done

A **slice issue** is complete when its own observable outcome and acceptance criteria are implemented, its proportionate pre-merge checks pass, and its PR is merged. Closing a child issue does not close or certify its parent.

A **parent/subproduct issue** is complete only when its full outcome and acceptance are implemented, all child slices are merged or explicitly out of scope, its declared full integration/recovery/live-host/release gate has run and passed, and risks/follow-ups are recorded. Do not hide remaining work in prose.

Every PR records:
1. Objective and outcome
2. Files and boundaries changed
3. Canonical owners/contracts reused
4. Exact checks run and results
5. Deferred parent-level checks, when applicable
6. Risks, rollback, and follow-ups

### Merge blocker triage
- **Conflict or stale base:** update/rebase the same claim branch and rerun affected checks.
- **Draft PR:** mark ready when the slice is reviewable.
- **Required check failed:** inspect the failing job; fix a relevant failure or document a confirmed unrelated baseline issue and retain required repository protections.
- **Missing review/protection:** request the configured reviewer or satisfy the required policy; never bypass branch protection.
- **Issue/evidence mismatch:** make the child scope and PR evidence agree; do not close the parent from a slice PR.

The machine-readable evidence format is defined in `docs/agent/MISSION_CLOSURE_EVIDENCE.md`. A passing format check does not prove that implementation or test evidence is semantically sufficient.

## 8. Handoff and concurrency

Before final push or PR update:
- Fetch/re-read current `main` and changed files.
- Resolve conflicts on the existing claim branch.
- Re-run verification invalidated by conflict resolution.
- Keep commits reviewable and avoid unrelated formatting churn.

If blocked, leave durable evidence on the issue/PR and keep the canonical branch. Use the bounded blocked-work handoff above to record ownership and preserve unmet scope only; keep the original issue open until fully complete. Do not create a replacement branch.

Lifecycle may be projected as:
`AVAILABLE → CLAIMED → ACTIVE → VERIFYING → READY → PR_OPEN → MERGED → COMPLETED`

Exceptional projections: `BLOCKED`, `FAILED`, `SUPERSEDED`, `REBASE_REQUIRED`.

These states are derived from GitHub facts; they are not a second state machine.

## 9. Mission prompt contract

Reusable Codex missions should use `docs/agent/MISSION_TEMPLATE.md`. A mission must state outcome, canonical owners to preserve, allowed scope, forbidden duplication, acceptance evidence, and verification tier. The issue remains the durable work record.
