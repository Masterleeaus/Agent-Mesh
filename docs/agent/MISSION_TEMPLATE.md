# Titan Zero Codex Mission Template

Use this as the body or starting prompt for an implementation mission. Keep the GitHub issue as the durable source of work state. Repository-wide branch, verification and completion rules come from the root `AGENTS.md`; do not copy divergent versions into issues.

## Mission metadata
**Priority:** <P0 | P1 | P2>  
**Type:** <Mission | Integration certification | Certification gate | Release certification | Convergence mission | Convergence audit | Contract convergence | Reliability certification | Observability & performance certification>  
**Parallel safe:** <No — shared owner/contract reason | Yes — exact isolated scope and stabilization condition>  
**Canonical owner:** #<issue number>  
**Parent issue:** #<number or none>  
**Issue role:** <parent subproduct | mergeable child slice>  
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
- Create child issues for implementation steps that belong inside this mission. Create another issue only for a genuinely independent outcome with no valid existing canonical owner.

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
Run the slice merge checks in root `AGENTS.md`. State which broad integration, recovery, live-host or release checks belong to the parent/subproduct completion gate.

## Branch discipline
Inherit the root `AGENTS.md` claim protocol. Use exactly `agent/issue-<issue-number>` from the required current `main` SHA. If it exists, do not create an alternate/suffix branch. Keep the same branch through implementation, conflicts, verification, PR and fixes. After merge, do not open a successor branch for the completed mission.

## Mission closure evidence

A child-slice PR may use `Closes #<child>` when every criterion in the child issue is complete. Set `Parent issue: #<parent>` and reference the parent separately; closing the child does not close the parent. A parent/subproduct PR may close the parent only after every parent criterion and its declared completion gate pass. Set `Subproduct gate: run` to trigger broad Titan CI.

Use the standard `mission-evidence` JSON record from the PR template. Map the linked issue's requirements to implementation paths and checks that actually ran. Bind evidence to the current issue body digest. Record deferred parent-level checks, live-host status, remaining work and residual risk. A slice can close only its child scope; the parent remains open for subproduct completion.

## Completion report
Return:
1. Objective achieved
2. Files changed
3. Boundaries/contracts changed
4. Commands executed
5. Test/gate results
6. Risks/rollback
7. Remaining work (only if genuinely out of scope or separately tracked)
