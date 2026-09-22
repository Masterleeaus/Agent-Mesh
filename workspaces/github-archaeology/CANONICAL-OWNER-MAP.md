# Canonical Owner Map — Pass 5

## Purpose

Map the pivot-critical recovered semantics to existing Titan Zero owners before creating any new architecture or convergence issue.

## Owner map

| Concern | Existing canonical owner/evidence | Archaeology treatment |
|---|---|---|
| Trust / delegated authority / autonomy | #640 Earned Trust & Autonomy; #36 authority limits; #147 entitlement→authority separation; #761 architecture recovery | Reuse. Never create a second trust model. Historical confirmation/risk/revision evidence may feed these owners but cannot grant authority. |
| Decision lifecycle | #59 canonical DecisionPacket runtime, persistent decision state and temporal re-evaluation; #50 outcome-loop certification | Reuse. Historical context hashes, stale-proposal rejection and recomposition can be compared directly to #59. |
| Knowledge / business memory | #153 canonical company-scoped Business Memory & Knowledge runtime using Knowledge Authority | Primary owner for recovered provenance, correction/supersession and experience semantics. |
| Verified outcome learning | #153 plus #50 and #642 | Reuse verified-outcome paths. Learning remains informational and cannot increase authority by itself. |
| Intelligence / Model Council | #633 Library AI/Decision/Intelligence convergence; #642 MVP engine convergence; #80 Intelligence Runtime integration | Reuse. Models/providers remain advisory. |
| Recovery / Rewind | #293 Reliability, Recovery & Self-Healing; #642 governed MVP handoff | Reuse. Historical rollback/revision mechanisms must converge here rather than form a separate recovery system. |
| Governed execution | #642 canonical MVP engine path; provider router #43 | Reuse Command Bus/Risk/Assurance/Governance path. |
| company_id tenancy | #72 records company_id-only enforcement as existing architectural invariant; historical #182/#304 also targeted isolation | Do not create new tenancy abstraction. Verify active-code defects only. |
| Cross-surface persistent agent state | #725 identity, agent state & cross-surface continuity | Candidate owner for persistent Zero working-state references, but not necessarily Personal Zero understanding semantics. |
| Reality / general business-state understanding | No dedicated canonical owner located in this pass. #763 is archaeology only, not implementation ownership. | Genuine ownership gap to investigate before creating action. |
| Personal Zero understanding | No dedicated canonical owner located. | Pivot ownership gap. |
| Understanding Memory | #153 is the closest canonical memory owner, but currently framed as Business Memory/Knowledge rather than Personal Zero understanding. | Extend/partition existing memory contracts if appropriate; do not create parallel memory runtime. |
| Experience Memory | #153 already explicitly calls for episodic memory from verified outcomes and includes donor longitudinal strategy memory semantics. | Strong existing owner. New pivot should specialize/clarify semantics rather than create another memory engine. |
| Evolution Engine | No dedicated owner located. Decision #59 has temporal re-evaluation; #153 has correction/supersession; neither alone owns continuous business + Zero reassessment. | Cross-owner orchestration gap requiring architecture comparison, not immediate implementation. |

## Major correction to Pass 4

Pass 4's concern that `account_id` documentation might imply an unresolved canonical tenancy model was based on the current Dovetails canonical docs. Issue archaeology shows that the broader Titan Zero roadmap already explicitly defines **`company_id` as the architectural invariant** and #72 is scoped only to remaining active-code enforcement defects.

Therefore:

- `account_id` is legacy/current Dovetails implementation evidence;
- it is **not** the target Titan Zero tenancy architecture;
- no new tenancy issue should be created from this archaeology work.

## Important discovery: Experience Memory already has an owner

Issue #153 is much closer to the new pivot than the current Dovetails canonical docs suggested. It already requires:

- company-scoped canonical memory records;
- provenance, freshness, confidence, retention and access metadata;
- episodic memory from verified outcomes;
- procedural memory for SOPs/playbooks/preferences;
- correction, supersession and forgetting/retention;
- stale/conflicting-source handling;
- privacy/access controls;
- explicit rule that memory never grants execution authority.

It also already contains a donor-recovery plan for longitudinal strategy memory built from:

- verified intervention outcomes,
- action fingerprints,
- context,
- delta,
- confidence,
- harm,
- applicability,
- expiry,
- anti-repeat behavior after failure/harm,
- controlled retest when evidence is stale or context materially changes.

This means **Experience Memory must not be implemented as a separate new memory subsystem.** The architectural pivot should map the Experience Memory concept onto/through this canonical owner and strengthen its schema/contracts where necessary.

## Historical donor mapping from Pass 3

### Revision-aware recomposition
Best fit: #59 + #153.

- #59 owns temporal re-evaluation of decisions when evidence/conditions change.
- #153 owns memory correction/supersession and outcome-derived episodic knowledge.
- Historical `WizardAnswerChanged` semantics can inform a generic evidence/change event without importing the wizard architecture.

### Per-value provenance
Best fit: #153 + canonical provenance/evidence contracts referenced by #59/#642.

Historical fields worth comparing:
- source
- source type
- confidence
- confirmed
- risk
- revision

### Stale context rejection
Best fit: #59 Decision lifecycle and #725 continuity/session revalidation.

Historical context hashing is potentially reusable as a concurrency/staleness guard, but authority must still be revalidated server-side.

### AI proposal separation
Already strongly covered by #642/#50/#153:
- models/providers advisory;
- no AI/model identity grants authority;
- knowledge/memory informational;
- consequential state changes follow governed execution.

Do not create a new action for this unless implementation evidence shows a concrete bypass.

## Remaining architecture gaps after owner reconciliation

Only three pivot areas currently appear to lack a clear single owner:

1. **Personal Zero understanding model** — persistent model of role, responsibilities, goals, priorities, preferences, working/decision patterns, relationships and exceptions.
2. **Business Reality model** — general authoritative business reality distinct from inferred Personal Zero understanding.
3. **Evolution Engine orchestration** — continuous reassessment across both models while preserving their separation and existing Decision/Knowledge/Trust authority boundaries.

These are not necessarily three new engines. The next archaeology work must determine whether they can be expressed as orchestration/contracts over existing Knowledge Authority, Decision Engine, Signal, Trust/Authority and business-domain state.

## Action discipline

No new implementation issue was created in this pass because:
- #153 already owns most memory/experience work;
- #59 already owns temporal decision re-evaluation;
- #640/#761 own trust/authority;
- #293 owns Rewind/recovery;
- #642 owns governed engine convergence;
- #72 owns remaining company_id enforcement.

Creating overlapping issues now would violate the no-parallel-system rule.

## Next pass

Deep-scan historical repositories/branches specifically for **Personal Zero precursors, Business Reality/reality-model mechanisms and continuous evolution/reassessment orchestration**, then compare those mechanisms against #153/#59/#642 before deciding whether an ownership/convergence action is actually missing.
