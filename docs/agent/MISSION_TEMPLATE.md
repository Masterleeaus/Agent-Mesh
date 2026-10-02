# Titan Zero Codex Mission Template

Use this as the body or starting prompt for an implementation mission. Keep the GitHub issue as the durable source of work state. Repository-wide branch, verification and completion rules come from the root `AGENTS.md`; do not copy divergent versions into issues.

## Mission metadata
**Priority:** <P0 | P1 | P2>  
**Type:** <Mission | Integration certification | Certification gate | Release certification | Convergence mission | Convergence audit | Contract convergence | Reliability certification | Observability & performance certification>  
**Parallel safe:** <No — shared owner/contract reason | Yes — exact isolated scope and stabilization condition>  
**Canonical owner:** #<issue number>  
**Verification tier:** <0 | 1 | 2 | 3>

## Mission
**Issue:** #<number>  
**Outcome:** <one verifiable end state>

## Current truth to inspect first
- Current `main`
- Root and applicable subtree `AGENTS.md`
- Issue, current prerequisites/coordination owners, active exact claim ref, and related PRs
- Relevant canonical docs/contracts
- Existing implementation and tests for the canonical owner

## Prerequisites
List only contracts/capabilities that genuinely must be usable before this mission can complete. Do not use mutual issue-level dependencies.

- <owner/contract and what must be stable>

## Coordinates with
List adjacent owners that integrate with this mission but must not block it.

- <issue/owner and boundary>

## Canonical owners to preserve
- <existing package/service/runtime/contract>
- <existing authority/persistence/evidence path>

## Allowed scope
- <paths/boundaries expected to change>

Cross-boundary edits are allowed only when required to achieve the outcome; state why in the PR.

## Do not
- Create a parallel engine/runtime/store/authority system/task ledger/capability registry.
- Create a second branch for the same mission.
- Turn a coordination owner into a blocking dependency.
- Bypass governed execution, company isolation, evidence, privacy, idempotency, or verification.
- Declare completion from prose, mocks, provider acknowledgements, or unexecuted tests.
- Do not split work merely to evade a check or hide a defect. Split this mission into linked issues whenever independently reviewable outcomes can ship separately; keep this issue as the parent tracker until integration/certification is complete.

## Required implementation
1. <behavior/change>
2. <behavior/change>
3. <tests/migration/docs as required>

## Behavioral acceptance
- <observable successful behavior>
- <negative/fail-closed behavior>
- <retry/replay/recovery behavior where relevant>
- <company isolation / authority / provenance behavior where relevant>

## Done condition
<one objective stopping condition; no open-ended “improve/continue/audit more” wording>

## Verification
Run focused checks for each slice. Schedule broad cross-system, live-host and release verification after the sub-product is assembled, in a separate integration/certification milestone. Record exact commands and results.

## Branch discipline

Use a short-lived branch from current `main`; `agent/issue-<number>` is a suggested name, not a lock. A bounded child issue or recovery may use its own branch. Preserve reachable commits and coordinate only actual file or contract conflicts. Keep the same branch through review when practical. Branch naming and claim comments do not block a merge.


## Mission closure evidence

Merge independently reviewable slices with focused verification and keep the parent
issue open. Use `Refs #<parent>` for partial work. Do not wait for full parent
acceptance or live-host certification to merge unrelated slices.

Use `Closes #<issue>` only when the complete linked issue is implemented and
verified. A closing PR must include a `mission-evidence` JSON record mapping every
acceptance/Done requirement to implementation paths and executed checks. The
closure gate enforces the record's structure; human review confirms semantic
sufficiency. See [Mission closure evidence](MISSION_CLOSURE_EVIDENCE.md).

## Completion report
Return:
1. Objective achieved
2. Files changed
3. Boundaries/contracts changed
4. Commands executed
5. Test/gate results
6. Risks/rollback
7. Remaining work (only if genuinely out of scope or separately tracked)
