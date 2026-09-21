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


## Claim-to-PR handoff helper

Use `.github/scripts/open-agent-pr.py` after a builder has pushed real implementation commits.

Example:

```bash
python3 .github/scripts/open-agent-pr.py \
  --verification "pnpm --filter <package> test — pass" \
  --completion "Completed the verified remaining work for this pass." \
  --risk "Rollback by reverting the PR; no new provider/runtime dependency."
```

Safety behavior:

- exact canonical claim branch required;
- matching open roadmap issue required;
- branch must be ahead of `main`;
- changed files and merge-base SHA are derived from GitHub;
- an existing open PR for the claim branch is updated instead of duplicated;
- PR always targets canonical `main`;
- the matching issue is linked with `Closes #<issue-number>`;
- Agent Claim Gate and Titan Zero CI remain the enforcement boundary.

A builder should not create an empty PR just to mark activity. The issue claim comment and claim branch already provide that coordination signal.


## Manager review readiness

After a builder opens the canonical agent PR, the repository continuously evaluates whether it is ready for Manager review.

The readiness evaluator checks:

1. canonical `agent/<subgoal-id>` branch;
2. matching open roadmap issue linked with `Closes #<issue>`;
3. populated Objective, Files changed, Verification, Completion/remaining work, and Evidence/risk/rollback sections;
4. targeted verification evidence rather than template-only text;
5. no merge conflicts;
6. exact-head **Titan Zero CI** success;
7. exact-head **Agent Claim Gate** success;
8. PR is no longer draft.

It publishes `Agent Mesh / Manager Review Readiness` as success/pending/failure.

This is a review-readiness signal only. It must never be treated as permission for automatic merge.


## Automated PR handoff

When a builder has useful commits ahead of `main`, create/update the canonical PR with:

```bash
python3 .github/scripts/open-agent-pr.py \
  --verification "<targeted check and result>" \
  --completion "<verified completion or only remaining work>" \
  --risk "<rollback / compatibility / security / privacy / cost impact>"
```

Behavior:

- current branch must be exactly `agent/<subgoal-id>`;
- matching roadmap issue must still be open;
- branch must contain at least one commit ahead of `main`;
- existing open PR for that branch is updated instead of duplicated;
- issue linkage is emitted as `Closes #<issue>`;
- changed files and branch comparison are derived from GitHub;
- generic verification placeholders are allowed for initial draft handoff, but Manager must require targeted evidence before merge where CI is insufficient.

Use `--draft` for an intentionally incomplete review handoff and `--dry-run --json` to inspect the generated metadata/body without creating a PR.


## Merged-subgoal roadmap reconciliation

Closing an issue is not the canonical roadmap mutation by itself. After Manager merge of the one canonical agent PR, `finalize-merged-agent-subgoal.yml` updates the durable roadmap and issue manifest.

The finalizer is derivative automation:

```text
Manager reviews PR
      ↓
Manager merges to main
      ↓
merged PR = completion decision
      ↓
finalizer marks roadmap subgoal COMPLETE
      ↓
issue-sync / safe claim-release workflows observe the completed state
```

Safety rules:

- only merged PRs targeting `main`;
- only exact `agent/<subgoal-id>` heads;
- PR must identify the subgoal and contain `Closes/Fixes/Resolves #<issue>`;
- subgoal must exist exactly once in both the manifest and matching goal file;
- superseded work cannot be finalized as complete;
- duplicate workflow delivery is idempotent;
- multiple merge finalizations are serialized;
- concurrent `main` movement causes a fresh retry rather than force-push.

The completion receipt is retained in the goal JSON so later agents can prove why the status changed without relying on chat history.


## Main integration guard

`.github/workflows/canonical-main-integrity.yml` checks pushes to canonical `main`.

Because the connected GitHub integration does not expose repository-admin ruleset writes, this is a **CI fallback**, not hard branch protection.

Policy:

- product/runtime/release changes require an associated merged PR;
- Agent Mesh control-plane metadata may be maintained directly by Manager;
- direct product pushes cause the Canonical Main Integrity check to fail visibly;
- when GitHub ruleset administration becomes available, require PRs and status checks at the repository layer and keep this check as defense-in-depth.


## Manager review queue

Manager review visibility is generated by:

```text
.github/scripts/manager-review-queue.py
.github/workflows/manager-review-queue.yml
```

The queue is read-only and never merges automatically.

It combines:

- Manager Review Readiness results for all open agent PRs;
- roadmap priority and goal/subgoal ordering;
- matching issue identity;
- active claim branches with no PR yet;
- stale/orphan/releasable claim problems from the claim audit.

Review ordering is:

1. **READY** PRs;
2. **BLOCKED** PRs that need Manager/agent attention;
3. **WAITING** PRs still awaiting CI/draft completion.

Within each state, P0 work is shown before P1/P2/P3, then lower goal/subgoal IDs first.

The workflow runs after readiness/audit updates, on relevant PR changes, hourly, and on demand. Its GitHub Actions summary is the Manager's live queue view.

A READY result is not permission to auto-merge. Manager remains the integration authority.


## Guarded Manager merge execution

The review queue and readiness status are advisory inputs to a **manual Manager decision**. Integration is performed through:

```text
.github/scripts/manager-merge.py
.github/workflows/manager-merge.yml
```

Merge prerequisites are re-checked immediately before GitHub receives the merge request:

- PR is open and not draft;
- base is canonical `main`;
- head is exactly `agent/<subgoal-id>`;
- PR and linked open issue own the same subgoal;
- no merge conflict is present;
- `Agent Mesh / Manager Review Readiness` is success on the exact head;
- latest exact-head Titan Zero CI is success;
- latest exact-head Agent Claim Gate is success;
- supplied `--expected-head-sha` equals the current PR head.

Normal Manager operation should pin the reviewed SHA. The helper's `--allow-current-head` escape hatch exists only for deliberate interactive use and must not be used by the GitHub workflow.

Default merge method is **squash**. Successful merge then hands control to the existing post-merge finalizer and safe claim cleanup. There is no automatic merge path.


## PR handoff permission fallback

GitHub currently reports:

```text
GitHub Actions is not permitted to create or approve pull requests
```

The Agent PR Handoff workflow treats only this exact repository-policy denial as a recoverable condition.

When it occurs:

- the workflow remains successful after recording the problem;
- `.github/scripts/record-pr-handoff-pending.py` creates or updates one marker comment on the roadmap issue;
- the comment records subgoal, claim branch, head SHA, merge base, ahead/behind counts and changed files;
- the claim remains active;
- no alternate branch is created;
- an authenticated Agent/Manager context can create the canonical draft PR from the existing claim branch.

Any different failure in `open-agent-pr.py` still fails the workflow and requires investigation.
