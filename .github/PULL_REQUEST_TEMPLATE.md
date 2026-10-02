## Titan Zero Agent / Codex PR

> Required mission claim: exactly `agent/issue-<issue-number>`. One mission, one branch through review and merge.

**Linked issue:** Refs #
**Parent issue:** Refs #<parent, or none>
**Delivery scope:** child slice / subproduct completion
**Subproduct gate:** defer / run
**Subgoal ID:** <optional roadmap traceability; not a claim>
**Claim branch:** `agent/issue-<issue-number>`
**Base main SHA:** `...`

### Outcome
State the observable outcome completed by this PR.

### Scope and boundaries
Changed boundaries:
- [ ] apps
- [ ] services
- [ ] packages
- [ ] persistence/migrations
- [ ] authority/execution/evidence/security
- [ ] infra/deployment
- [ ] docs/tooling only

Why each checked boundary had to change:

### Canonical owners reused
List the existing packages/services/contracts reused. If a new abstraction was added, explain why no canonical owner already existed.

### Files changed
-

### Verification
**Slice verification tier:** 0 / 1 / 2 / 3
**Parent-level checks deferred:** <list or none>

Exact commands executed:
```text

```

Results:
- [ ] Targeted tests passed
- [ ] Relevant lint/typecheck/build passed
- [ ] Integration checks passed when cross-boundary
- [ ] Slice-level compile/build/smoke passed
- [ ] Focused negative/migration check passed when a protected boundary changed
- [ ] Full `pnpm gate:fast` / `pnpm gate` run only when `Subproduct gate: run` or required by this slice's risk
- [ ] Failure/negative paths were tested where relevant
- [ ] Any unrun required check is documented below with exact blocker and residual risk

Unrun/blocked checks and residual risk:

### Architecture / authority
- [ ] `company_id` remains the canonical company boundary
- [ ] No duplicate surface/adapter business logic introduced
- [ ] Existing canonical capability/workforce/runtime contracts were reused before adding new definitions
- [ ] Consequential actions preserve governed decision/authority/execution
- [ ] Provider acknowledgement is not represented as verified outcome
- [ ] Evidence/provenance, privacy, idempotency, and Cost Sovereignty are preserved where applicable
- [ ] No Titan Code/Codex development tooling became a production runtime dependency

### Concurrency / branch discipline
- [ ] Work remained on the single canonical claim branch
- [ ] Changed files/current `main` were re-read before finalization
- [ ] Conflicts were resolved on this branch, not by creating a replacement branch
- [ ] Verification invalidated by conflict resolution was rerun

### Completion evidence
Start with `Refs`. A completed child slice may change this to `Closes #child` and `mode: complete` when all child criteria pass; keep the parent under `Parent issue: Refs #parent`. This closes only the child. A parent PR may close the parent only after the full subproduct gate passes. Use `Subproduct gate: run` to invoke broad Titan CI. Record checks actually run and list deferred parent checks without claiming they passed.
See [the evidence format and review contract](../docs/agent/MISSION_CLOSURE_EVIDENCE.md).

```mission-evidence
{
  "version": 1,
  "issue": 0,
  "mode": "partial",
  "issue_body_sha256": "<digest of the entire current issue body>",
  "criteria": [],
  "checks": [],
  "live_host": {
    "status": "unknown",
    "reason": "<which live checks are needed, or why they are not required>"
  },
  "remaining_work": ["<unmet mission criteria and blocked checks>"],
  "human_review_required": true
}
```

For each criterion, use an object with `criterion`, `implementation` (path array), and `checks` (check ID array). Each check has `id`, `command`, `result`, `evidence`, `required` and `kind`. Map the linked child issue for a slice or the full parent issue for a subproduct completion. Record commands and outcomes actually observed. Parent-level tests may be listed as deferred on a child PR; never claim they passed.

Review the linked scope. A green format check cannot prove semantic completion. Confirm implementation, required slice checks, deferred parent checks, risk and compatibility before approval.
### Risk / compatibility / rollback
Describe migrations, compatibility implications, rollback path, security/privacy/cost impact, and any separately tracked follow-up.

> GitHub refs, commits, checks, PRs, merge state, and issue state are lifecycle authority. Agent prose is not.
