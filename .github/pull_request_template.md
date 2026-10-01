## Titan Zero Agent / Codex PR

> Required mission claim: exactly `agent/issue-<issue-number>`. One mission, one branch through review and merge.

**Linked issue:** Refs #
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
Start non-closing. Keep `Refs` while any mission requirement or required check is
unproven. For a complete mission candidate, change the linked relationship to
`Closes`, set `mode` to `complete`, and map every current issue requirement.
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

For each criterion, use an object with `criterion`, `implementation` (path array),
and `checks` (check ID array). Each check has `id`, `command`, `result`, `evidence`,
`required` (boolean), and `kind`. Copy exact current issue text; record actual
commands and outcomes, never assumed passes. Required/unrun/live-host checks keep
the mission open. Link independently substantial follow-ups without dropping any
original acceptance requirement.

Human reviewer: compare evidence with the full current issue and Done condition.
A green format check or checkbox alone cannot prove semantic completion and does
not authorize closure. Confirm actual implementation, executed verification,
justified live-host applicability, residual risks and current scope before approval.

### Risk / compatibility / rollback
Describe migrations, compatibility implications, rollback path, security/privacy/cost impact, and any separately tracked follow-up.

> GitHub refs, commits, checks, PRs, merge state, and issue state are lifecycle authority. Agent prose is not.
