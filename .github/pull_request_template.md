## Titan Zero Agent / Codex PR

> Link the issue being delivered. Use a short-lived branch; branch names are coordination aids.

**Linked issue:** Refs #
**Subgoal ID:** <optional roadmap traceability; not a claim>
**Branch / base SHA:** <optional>

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
**Required tier:** 0 / 1 / 2 / 3

Exact commands executed:
```text

```

Results:
- [ ] Targeted tests passed
- [ ] Relevant lint/typecheck/build passed
- [ ] Integration checks passed when cross-boundary
- [ ] Focused checks for changed behavior passed
- [ ] Broad product/release checks are tracked for the completed sub-product milestone
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
- [ ] Current `main` and changed files were re-read before finalization
- [ ] Reachable work was preserved while resolving any conflicts
- [ ] Focused verification invalidated by conflict resolution was rerun

### Product gate

**Subproduct gate:** defer / run

Set this to `run` only when this PR completes the full linked subproduct and should
run the broad Titan CI suite. Ordinary implementation slices leave it at `defer`.

### Slice evidence

For a partial PR, keep `Refs #<parent>` and provide:
- Observable slice outcome
- Focused commands and actual results
- Remaining product-level checks and their tracking issue

A slice does not need a full parent-criteria map, live-host report or
`mission-evidence` JSON record. Merge it after focused checks pass and review
finds no concrete changed-scope regression. Keep the parent issue open.

For a PR that closes an issue, use `Closes #<issue>`, include one
`mission-evidence` JSON record, and map every current acceptance/Done requirement
to implementation paths and executed checks. The closure gate validates this
record; a human reviewer confirms that it proves the outcome.

See [the evidence format and review contract](../docs/agent/MISSION_CLOSURE_EVIDENCE.md).

### Risk / compatibility / rollback
Describe migrations, compatibility implications, rollback path, security/privacy/cost impact, and any separately tracked follow-up.

> GitHub refs, commits, checks, PRs, merge state, and issue state are lifecycle authority. Agent prose is not.
