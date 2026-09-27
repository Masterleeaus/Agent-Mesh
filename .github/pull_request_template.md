## Agent Mesh PR

> Preferred creation path: `python3 .github/scripts/open-agent-pr.py` from the canonical `agent/<subgoal-id>` branch.

**Linked issue:** Closes #
**Subgoal ID:** `TZ-...`
**Goal ID:** `TZ-...`
**Claim branch:** `agent/TZ-...`
**Base main SHA:** `...`

> The claim branch must be exactly `agent/<subgoal-id>`. Do not add worker names, suffixes or timestamps.

### Objective

Describe the remaining roadmap outcome completed by this PR.

### Files changed

- 

### Verification

Commands/checks run:

```text

```

Results:

- [ ] Agent Claim Gate passes
- [ ] Targeted tests pass
- [ ] Relevant type/build/lint checks pass or gaps are explicitly documented
- [ ] No unexplained regression introduced

### Architecture / authority check

- [ ] `company_id` remains the canonical company boundary
- [ ] No duplicate surface/adapter business logic introduced
- [ ] Command Bus/governed authority boundaries preserved where applicable
- [ ] Device/privacy/Cost Sovereignty behavior preserved
- [ ] No Titan Code production runtime dependency introduced
- [ ] Existing capability/workforce contracts reused before adding parallel definitions

### Completion / remaining work

State why this subgoal/pass is complete, or list only the verified remaining work.

### Evidence / risk / rollback

Describe evidence, migration/compatibility implications, rollback path, and any security/privacy/cost impact.


> **Automatic handoff note:** Agent PRs are normally created/refreshed by `.github/workflows/agent-pr-handoff.yml`. Builders should enrich verification/completion/risk evidence when the automatic text is insufficient; Manager review remains mandatory.
