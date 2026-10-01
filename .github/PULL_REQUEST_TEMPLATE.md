## Titan Zero Agent / Codex PR

> Preferred agent branch: exactly `agent/<subgoal-id>`. One subgoal, one branch, through merge.

**Linked issue:** Closes #
**Subgoal ID:** `TZ-...`
**Claim branch:** `agent/TZ-...`
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
**Required tier:** 0 / 1 / 2 / 3

Exact commands executed:
```text

```

Results:
- [ ] Targeted tests passed
- [ ] Relevant lint/typecheck/build passed
- [ ] Integration checks passed when cross-boundary
- [ ] `pnpm gate:fast` passed when required/supported
- [ ] `pnpm gate` passed when Tier 3 and supported
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
**Issue relationship:** [ ] Closes the full mission (all criteria proven)  [ ] Refs a partial slice (mission remains open)

For a closing PR, map every issue acceptance criterion to implementation and executed evidence:

| Issue acceptance criterion | Implementation path(s) | Exact verification/evidence | Result |
|---|---|---|---|
| <criterion> | <paths> | <command or observable result> | <pass / blocked> |

List any unrun required/live-host checks, residual risk, and follow-up issue. Reviewers must compare this evidence against the full issue's current acceptance criteria and Done condition; checklist presence alone is not proof.

### Risk / compatibility / rollback
Describe migrations, compatibility implications, rollback path, security/privacy/cost impact, and any separately tracked follow-up.

> GitHub refs, commits, checks, PRs, merge state, and issue state are lifecycle authority. Agent prose is not.
