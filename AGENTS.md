# AGENTS.md — Titan Zero Agent Mesh V3 Execution Contract

This repository is the live Titan Zero Agent Mesh code and work system.

## Authority order

1. GitHub `main` is canonical code. The legacy `titan-zero/main` branch is retired historical material and must not be used as a parallel authority.
2. Git commit SHA identifies the exact canonical code version.
3. `roadmap/INDEX.json` + `roadmap/goals/*.json` define roadmap intent and remaining work.
4. GitHub Issues are the claimable execution surface for subgoals.
5. Pull Requests are the integration boundary.
6. GitHub Actions provide automated verification.
7. Architecture/workforce documents are referenced authorities; do not duplicate their full bodies into roadmap/issues.

Do not determine current state from chat memory, ZIP filenames, timestamps, old CANONICAL labels, archived control-plane files, or an agent's statement about what is latest.

## Current roadmap migration state

- The current roadmap index contains **55 goals**.
- Canonical goal JSON files are present for **all 55 goals**: `TZ-G00` and `TZ-ROADMAP-01` through `TZ-ROADMAP-54`.
- `roadmap/SUBGOAL-ISSUE-MANIFEST.json` is the issue-sync manifest and currently covers **568 subgoals**.

If a future goal is referenced without a matching goal JSON, treat that as a migration gap. Do not invent missing goal bodies from issue titles.

## Automated next-work selection

Agents should use the repository helper rather than manually guessing the next issue:

```bash
AGENT_MESH_ACTOR=builder-1 python3 .github/scripts/claim-next-subgoal.py --order asc
```

For a worker intentionally starting from the highest roadmap end:

```bash
AGENT_MESH_ACTOR=builder-5 python3 .github/scripts/claim-next-subgoal.py --order desc
```

To inspect without claiming:

```bash
python3 .github/scripts/claim-next-subgoal.py --actor audit --order asc --dry-run
```

The helper only considers `TODO` subgoals whose GitHub issue is open. It skips existing canonical claim branches and open PR ownership. Concurrent workers may race on the same first candidate; exact Git ref creation is atomic, so only one wins and the others continue to the next eligible subgoal.

## Builder loop

1. Pull/read current `main`.
2. Read this file, `work/README.md`, the relevant roadmap goal JSON, linked GitHub issue, and applicable architecture contracts.
3. Confirm the issue is still remaining work against current code/evidence.
4. Claim **one** eligible subgoal by atomically creating the exact branch `agent/<subgoal-id>` from current `main`. Branch creation is the claim lock.
5. If that exact branch already exists, the subgoal is already claimed: do not compete for it; select another eligible issue.
6. Complete one full development pass: implementation + verification + evidence.
7. Commit/push the branch.
8. Open/update a PR linked to the issue.
9. If blocked, document the blocker and select another eligible issue rather than waiting idle.
10. Never redo work already proven on current `main`.

Do not wait for Manager approval merely to begin another eligible unclaimed subgoal. Manager review is required for integration, not for staying productive.

## Manager review queue

Use the live `Manager Review Queue` GitHub Actions summary rather than manually searching PRs. It ranks READY agent PRs first, surfaces BLOCKED work next, keeps WAITING work visible, and also shows active claims that have not produced a PR yet.

The queue is advisory/read-only. Manager still decides whether to merge.

## Manager loop

1. Review against current `main`, roadmap intent, architecture contracts, and verified evidence.
2. Reject duplicate implementation, stale-base work, authority drift, or unproven replacement of existing capabilities.
3. Require relevant CI/tests/evidence.
4. Merge accepted work to `main`.
5. Update/close the linked issue and compact roadmap state so later agents see only remaining work.

## Collision rule

One claimable subgoal = one canonical claim branch: `agent/<subgoal-id>` = one active implementation PR.

The branch ref is the collision lock. Do not add suffixes, worker names, timestamps or alternate spellings to bypass an existing claim. After creating the branch, add a claim comment to the issue containing the actor identity, branch, and base `main` SHA. If the exact branch already exists, choose another eligible issue. Never create competing implementations for the same work item.

Every agent PR is checked by `.github/workflows/agent-claim-gate.yml`. The PR must target `main`, use the exact claim branch, name the subgoal ID, and include `Closes #<issue-number>` for the matching open roadmap issue.

## Titan Zero non-negotiables

- `company_id` is the only canonical company boundary.
- Canonical product surfaces are `zero`, `go`, and `hub`; legacy aliases normalize before authorization/data access/execution.
- Shared business logic belongs in Titan Core/shared runtimes, not duplicated across surfaces/adapters.
- Command Bus and governed execution remain mutation/authority boundaries where applicable.
- Preserve device-first, privacy-first and Cost Sovereignty behavior: on-device → local/customer-hosted → BYO → customer service → Titan-managed entitled → explicit metered add-on.
- AI/model/provider/device identity does not grant authority.
- Reuse/converge verified existing implementations before rebuilding.
- Workforce architecture is referenced by IDs/contracts; do not embed duplicate workforce specifications into roadmap/issues.
- Titan Code is private development tooling only and must never become a Titan Zero production runtime dependency.

## Automated PR handoff

After the builder has committed and pushed verified work to the canonical claim branch, use:

```bash
python3 .github/scripts/open-agent-pr.py \
  --verification "pnpm --filter <package> test — pass" \
  --completion "Describe the verified completion basis" \
  --risk "Describe rollback / compatibility / security implications"
```

The helper resolves the matching roadmap issue, refuses empty claim branches, derives the changed-file list and commit summary, and creates or updates the **single canonical PR** for that claim branch.

It automatically includes:

- `Closes #<issue-number>`;
- subgoal ID and goal ID;
- exact claim branch;
- claim/base SHA information when available;
- changed files;
- verification evidence;
- completion/remaining-work text;
- architecture/risk/rollback sections.

Do not create a second PR for the same claim branch. Re-run the helper to update the existing PR instead.

## Required PR evidence

Every implementation PR must state:

1. Linked issue/subgoal ID.
2. Objective.
3. Files changed.
4. Commands/tests/checks executed and results.
5. Architecture/authority impact.
6. Remaining work or explicit completion basis.
7. Any migration, compatibility, rollback, privacy, cost or security implications.

## Historical material

Files under archive/history paths are evidence and recovery material only unless explicitly promoted by current roadmap/architecture authority.


## Automatic claim-to-PR handoff

After a builder pushes real implementation commits to its canonical claim branch, GitHub automatically creates or refreshes the single PR for that subgoal through:

`.github/workflows/agent-pr-handoff.yml`

The workflow uses:

`.github/scripts/open-agent-pr.py`

It:

- accepts only exact `agent/<subgoal-id>` branches;
- skips empty claim branches with zero commits ahead of `main`;
- resolves the matching open roadmap issue;
- derives changed files, claim base and current merge base;
- creates or updates one PR targeting canonical `main`;
- inserts `Closes #<issue>`, subgoal/goal IDs and the required evidence structure;
- comments the PR handoff back onto the roadmap issue;
- never auto-merges.

Builders may run the helper manually to enrich targeted evidence:

```bash
python3 .github/scripts/open-agent-pr.py \
  --verification "pnpm <targeted-check> — pass" \
  --completion "State verified completion or only remaining work." \
  --risk "State rollback / compatibility / privacy / cost impact."
```

Do not hand-author a second competing PR for the same claim branch. The Agent Claim Gate rejects malformed agent PR structure, missing issue linkage, invalid claim branches, duplicate ownership and completed/superseded work.


## Manager review readiness

Agent implementation PRs are evaluated by:

- `.github/scripts/manager-review-readiness.py`
- `.github/workflows/manager-review-readiness.yml`

The evaluator never merges automatically. It publishes one commit status:

`Agent Mesh / Manager Review Readiness`

States:

- **READY** — claim/issue linkage is valid, required evidence sections are populated, there are no merge conflicts, and both Titan Zero CI and Agent Claim Gate succeeded for the exact PR head SHA.
- **WAITING** — required workflows are still pending/missing or the PR remains draft.
- **BLOCKED** — claim/issue mismatch, missing evidence, merge conflicts, or a required workflow failed.

Manager remains the integration authority even when status is READY.


## PR handoff helper

After a builder has committed and pushed at least one subgoal-specific change on its canonical claim branch, hand off with:

```bash
python3 .github/scripts/open-agent-pr.py \
  --verification "targeted test/check — pass" \
  --completion "Describe what this pass completed"
```

New PRs are **draft by default**. This keeps an incomplete multi-pass subgoal out of the Manager-ready queue while still running CI and preserving evidence.

When the subgoal is genuinely ready for Manager review:

```bash
python3 .github/scripts/open-agent-pr.py --ready
```

The helper refuses:

- non-canonical claim branch names;
- closed/missing roadmap issues;
- empty branches with no commits ahead of `main`.

It resolves the matching issue, fills the canonical PR metadata/evidence structure, links `Closes #<issue>`, records changed files and current merge-base, and reuses the one existing PR for the claim branch rather than opening duplicates.


## Post-merge roadmap finalization

Manager merge is the completion decision for a canonical agent subgoal PR. Automation must not decide completion before that merge.

After a Manager merges an `agent/<subgoal-id>` PR into `main`, the repository automatically runs:

- `.github/workflows/finalize-merged-agent-subgoal.yml`
- `.github/scripts/finalize-merged-subgoal.py`

The finalizer reconciles the already-established merge fact into roadmap state:

- matching subgoal status → `COMPLETE`;
- `claimable` → `false`;
- execution state → `COMPLETE`;
- completion receipt records PR number, issue number, merge SHA, claim branch and merged timestamp;
- `roadmap/SUBGOAL-ISSUE-MANIFEST.json` entry → `COMPLETE`;
- goal progress is recomputed;
- fully terminal goals may become `COMPLETE`.

This workflow is serialized to prevent two simultaneous Manager merges from racing on the roadmap manifest. It retries from fresh `main` if another canonical update lands first.

Do not manually mark a builder subgoal complete before Manager merge merely because a builder says the work is finished.


## Canonical main protection

Product/runtime changes must reach `main` through a pull request. Builders must never push product code directly to `main`.

The repository currently has no writable GitHub ruleset/branch-protection administration through this integration, so `.github/workflows/canonical-main-integrity.yml` provides a CI enforcement fallback:

- direct changes under product/runtime/release paths fail the integrity check unless the commit is associated with a merged PR;
- Manager/control-plane metadata under `.github/`, `work/`, `roadmap/`, `docs/`, plus root Agent Mesh docs may be updated directly while the GitHub-native control plane is being maintained;
- this workflow is not equivalent to server-side branch protection and must not be described as such.

If repository-admin access becomes available, replace the fallback with a GitHub ruleset requiring PR integration and the canonical status checks.


## Guarded Manager merge

Manager merge is explicit and manual. A READY status never authorizes automatic integration.

Before merging an agent PR:

1. read the PR, linked roadmap issue, changed files and verification evidence;
2. confirm `Agent Mesh / Manager Review Readiness` is READY for the **current head SHA**;
3. confirm Titan Zero CI and Agent Claim Gate succeeded for that same SHA;
4. copy/pin the reviewed head SHA;
5. merge only through the guarded helper/workflow.

Dry-run from a Manager shell:

```bash
python3 .github/scripts/manager-merge.py --pr <number>
```

After review, pin the exact SHA:

```bash
python3 .github/scripts/manager-merge.py \
  --pr <number> \
  --expected-head-sha <reviewed-sha> \
  --merge-method squash \
  --apply
```

GitHub UI automation is available only as the manually dispatched workflow:

`.github/workflows/manager-merge.yml`

It requires both PR number and the exact reviewed head SHA. If the builder pushes another commit after review, the merge is refused and Manager must review the new head.

The helper also refuses draft PRs, non-`main` bases, non-canonical agent branches, closed/mismatched issues, merge conflicts, missing/failed readiness, or missing/failed canonical workflows. It never selects a PR automatically and never enables auto-merge.
