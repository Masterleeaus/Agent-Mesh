# Agent Mesh V3 Work Coordination

GitHub is the live work/code coordination layer. The roadmap defines remaining work; Git refs provide collision-safe claims.

## Atomic claim protocol

A subgoal is claimed by creating exactly one branch:

```text
agent/<subgoal-id>
```

Example:

```text
agent/TZ-ROADMAP-31-SG-01
```

The branch name itself is the lock.

### Claim sequence

1. Read current `main`, `AGENTS.md`, the relevant `roadmap/goals/<goal-id>.json`, and the matching open issue.
2. Re-check current code/evidence so already-completed work is not repeated.
3. Confirm the roadmap status is still claimable.
4. Confirm there is no existing `agent/<subgoal-id>` branch and no active PR for that subgoal.
5. Atomically create `agent/<subgoal-id>` **from current `main`**.
6. If branch creation fails because the ref already exists, treat the subgoal as claimed and immediately choose another eligible issue.
7. Add a comment to the issue recording:
   - actor/worker identity,
   - claim branch,
   - base `main` SHA,
   - intended first pass.
8. Implement one complete development pass including verification.
9. Push to the same canonical claim branch.
10. Open/update one PR to `main` with `Closes #<issue-number>`.
11. Continue additional verified passes on the same branch/PR while that subgoal remains active.
12. Do not merge your own implementation PR.

Never bypass a claim by creating `agent/<subgoal-id>-2`, adding a worker name, timestamp, or using another branch prefix.

## Collision and stale-claim rules

- One subgoal ID = one canonical claim branch = one active implementation PR.
- Existing branch means another worker owns the claim unless Manager explicitly releases it.
- A worker that becomes blocked should document the blocker and select another eligible unclaimed issue rather than waiting idle.
- Manager may release an abandoned claim only after verifying there is no useful unmerged work that would be lost.
- Completed/merged subgoals are not re-claimed unless the roadmap explicitly reopens remaining work.

## PR claim gate

`.github/workflows/agent-claim-gate.yml` validates every agent PR:

- base branch is `main`;
- head branch is exactly `agent/<subgoal-id>`;
- subgoal exists in `roadmap/SUBGOAL-ISSUE-MANIFEST.json`;
- matching goal JSON exists and contains that subgoal;
- roadmap status is not complete/superseded;
- PR names the subgoal ID;
- PR contains `Closes #<issue-number>`;
- linked issue is open and owns the same subgoal ID;
- no other open PR claims the same subgoal.

On roadmap/control-plane changes, the same gate runs a self-test verifying all **55 goals** and all **568 manifest subgoals** resolve correctly.

## Manager loop

1. Review PR against current `main`, roadmap intent, architecture contracts and existing evidence.
2. Reject duplicate implementation, stale-base work, authority drift or attempts to bypass the canonical claim branch.
3. Require CI/evidence appropriate to the change.
4. Merge accepted PR to `main`.
5. Update/close the linked issue and compact roadmap state so later agents see only remaining work.
6. Release/remove stale claim branches only after preserving useful work/evidence.

## `work/claims.json`

`work/claims.json` is **coordination metadata only**, not the lock authority.

Live claim authority is the Git branch ref:

```text
agent/<subgoal-id>
```

This avoids concurrent workers racing to edit a central JSON file.

## Authority

- `main` = canonical Titan Zero code.
- Git commit SHA = exact version identity.
- `agent/<subgoal-id>` branch = atomic claim lock.
- GitHub Issues = claimable work records.
- Pull Requests = integration boundary.
- GitHub Actions = automated verification.
- Roadmap = remaining work and outcome intent.
- Architecture = product/system rules.


## Automated selector

Use:

```bash
AGENT_MESH_ACTOR=<worker-id> python3 .github/scripts/claim-next-subgoal.py --order asc
```

Selection behavior:

- `--order asc` = smallest goal/subgoal first.
- `--order desc` = largest goal/subgoal first.
- `--goal TZ-ROADMAP-XX` = restrict to one goal.
- `--dry-run` = show the next eligible queue without creating a claim.
- only roadmap status `TODO` is claimable automatically;
- issue must still be open;
- existing `agent/<subgoal-id>` branch means claimed;
- an open PR that already names/owns the subgoal means claimed;
- atomic branch creation resolves concurrent-worker races.

The selector posts the actor, branch and base `main` SHA back to the issue after a successful claim.


## Automatic safe claim release

Completed claims are cleaned by:

```text
.github/workflows/release-completed-agent-claims.yml
.github/scripts/release-safe-agent-claims.py
```

The release process is intentionally conservative.

A claim branch may be deleted automatically only when:

1. the matching roadmap issue is **closed**;
2. there is **no open PR** for the claim branch; and
3. either:
   - a **merged PR** exists for that exact claim branch, or
   - the branch is **0 commits ahead of `main`**.

The following are always preserved for Manager review:

- open issues;
- open PRs;
- missing/mismatched issues;
- invalid claim branches;
- closed issues whose claim branch still contains unmerged commits.

The cleanup runs after PR closure, once daily, and on demand. It must never be changed into a blind “delete closed issue branches” job.

The separate scheduled claim audit remains read-only and is responsible for surfacing stale/orphaned claims. Cleanup and audit are deliberately separate concerns.
