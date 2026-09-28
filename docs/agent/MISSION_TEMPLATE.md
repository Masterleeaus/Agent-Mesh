# Titan Zero Codex Mission Template

Use this as the body or starting prompt for an implementation mission. Keep the GitHub issue as the durable source of work state.

## Mission
**Issue:** #<number>  
**Subgoal:** <TZ-...>  
**Outcome:** <one verifiable end state>

## Current truth to inspect first
- Current `main`
- Root and applicable subtree `AGENTS.md`
- Issue, dependencies, active claim refs, related PRs
- Relevant canonical docs/contracts
- Existing implementation and tests for the canonical owner

## Canonical owners to preserve
- <existing package/service/runtime/contract>
- <existing authority/persistence/evidence path>

## Allowed scope
- <paths/boundaries expected to change>

Cross-boundary edits are allowed only when required to achieve the outcome; state why in the PR.

## Do not
- Create a parallel engine/runtime/store/authority system/task ledger/capability registry.
- Create a second branch for the same subgoal.
- Bypass governed execution, tenant isolation, evidence, privacy, idempotency, or verification.
- Declare completion from prose, mocks, provider acknowledgements, or unexecuted tests.

## Required implementation
1. <behavior/change>
2. <behavior/change>
3. <tests/migration/docs as required>

## Acceptance evidence
- <observable behavior>
- <negative/failure behavior>
- <compatibility/recovery/isolation behavior where relevant>

## Verification tier
**Tier:** <0 | 1 | 2 | 3>

Run the root `AGENTS.md` requirements for that tier plus targeted tests for the changed owner. Record exact commands and results.

## Branch discipline
Use exactly `agent/<subgoal-id>` from the required current `main` SHA. If it exists, do not create an alternate branch. Keep the same branch through fixes and PR.

## Completion report
Return:
1. Objective achieved
2. Files changed
3. Boundaries/contracts changed
4. Commands executed
5. Test/gate results
6. Risks/rollback
7. Remaining work (only if genuinely out of scope or separately tracked)
