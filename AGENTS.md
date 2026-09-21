# AGENTS.md — Titan Zero Agent Mesh V3 Execution Contract

This repository is the live Titan Zero Agent Mesh code and work system.

## Authority order

1. GitHub `main` is canonical code.
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
