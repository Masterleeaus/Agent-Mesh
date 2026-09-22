# FINDINGS

## FINDING-GH-001

### Finding
The repository's canonical execution contract establishes code/database migrations as implemented truth and `docs/canonical/` as authoritative product/architecture documentation; archive/generated material is evidence only.

### Why it matters
Mechanism-first archaeology must distinguish implemented evidence from historical donors and must not let historical planning documents silently become product instructions.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: main
- Path: `AGENTS.md`
- Section: Documentation Hierarchy / Non-Negotiable Rules

### Current Titan equivalent
Repository governance via AGENTS.md and canonical documentation hierarchy.

### Classification
CURRENT

### Confidence
HIGH

### Related action
#763

---

## FINDING-GH-002

### Finding
No canonical `.titan/research/` directory or equivalent research workspace was found in the initial inspected repository paths, so this isolated specialist workspace was created rather than using another agent's workspace.

### Why it matters
The shared evidence workspace must remain isolated and durable so other agents can consume findings without relying on this chat.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: main
- Inspected paths: `.titan`, `.titan/research`, `research`, `workspace`
- All were absent in the initial direct path inspection.

### Current Titan equivalent
N/A — coordination infrastructure.

### Classification
IMPLEMENTED

### Confidence
HIGH

### Related action
#763

---

## FINDING-GH-003

### Finding
The new archaeology lens explicitly treats mechanisms—not project names—as the primary discovery unit. Relevant mechanisms include personal understanding, behavioural understanding, experience memory, learning governors, decision support, persistent state, revision/rollback, observation, trust, reasoning, authority separation, reality understanding, and continuous evolution.

### Why it matters
A repository does not need to contain the word “Zero” to contain a valuable component for the persistent digital working intelligence.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Governing pivot supplied for this mission
- Required lens: “Could any part of this historical system contribute to the intelligence, memory, experience, learning, evolution, trust, reasoning, authority, reality understanding or operational capability of a person's Zero?”
- Pivot sections: mechanism-first archaeological question; do not overfit the search to “Zero”.

### Current Titan equivalent
The target future ownership model is Zero / Understanding Memory / Experience Memory / Learning Governor / Decision Intelligence / Persistent State / Rewind, plus Reality, Trust, Authority, and Evolution Engine.

### Classification
SPECIFICATION ONLY

### Confidence
HIGH

### Related action
#763

---

## FINDING-GH-004

### Finding
The pivot requires a strict separation between understanding, learning, recommendation, decision, and authority. Repeated behaviour must not silently become permission.

### Why it matters
Historical donor code that combines learning and authority requires architectural review even if its behaviour appears useful.

### Evidence
- Pivot supplied for this mission.
- Sections “LEARNING MUST NOT CREATE AUTHORITY” and “TRUST IS PART OF ZERO'S EVOLUTION”.
- Required distinction: Zero can learn that it normally approves a request; it must not infer authorization from that pattern.

### Current Titan equivalent
Titan Trust, Authority, Assurance, Governance and Command Bus remain separate authority controls.

### Classification
SPECIFICATION ONLY

### Confidence
HIGH

### Related action
#763; #761/#762

---

## FINDING-GH-005

### Finding
The archaeology Action is now implemented as a read-only GitHub workflow and searches current source plus reachable Git history by mechanism rather than by the word “Zero”.

### Why it matters
This turns the new pivot into a repeatable evidence-generation process and gives the final convergence agent a durable artifact rather than relying on chat context.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: agent/763
- Path: `.github/workflows/titan-zero-mechanism-archaeology.yml`
- Commit: 0fec891a78279048c789aa6beaf5eaa486bf65ad
- PR: #764

### Current Titan equivalent
Read-only archaeology/evidence pipeline.

### Classification
IMPLEMENTED

### Confidence
HIGH

### Related action
#763

---

## FINDING-GH-006

### Finding
The current archaeology workflow explicitly flags implementations where learning/behaviour mechanisms and authority-separation mechanisms appear together for manual review.

### Why it matters
This is a targeted guard against the prohibited architectural shortcut in which learned behaviour becomes authority.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: agent/763
- Path: `.github/workflows/titan-zero-mechanism-archaeology.yml`
- Logic: `learning_authority` review candidates.

### Current Titan equivalent
Titan Trust / Authority / Assurance / Governance boundary.

### Classification
IMPLEMENTED

### Confidence
HIGH

### Related action
#763

---

## UNVERIFIED / PROVISIONAL

The Action's heuristic output has not yet been inspected and promoted into source-level findings. Until source paths, symbols, revisions, and behaviour are manually verified, generated candidate rankings remain discovery evidence rather than architectural conclusions.


---

## FINDING-GH-007

### Finding
A separate open GitHub archaeology issue (#765) identifies `workspaces/github-archaeology/` as the workspace for a broader GitHub archaeology/convergence investigation. This specialist workspace remains intentionally separate because the workflow update prohibits taking over another agent's workspace.

### Why it matters
The repository now contains an explicit cross-agent workspace convention. The specialist mechanism archaeology work should remain isolated while referencing the broader archaeology workspace as supporting context rather than modifying it.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Issue: #765 — ARCHAELOGY: GitHub development history recovery workspace
- Issue text specifies: `workspaces/github-archaeology/`.
- Issue is separate from #763 and has a broader archaeology scope.

### Current Titan equivalent
Cross-agent research coordination boundary.

### Classification
CURRENT

### Confidence
HIGH

### Related action
#763

### Cross-agent note
Supports separation of specialist mechanism archaeology from the broader GitHub archaeology assignment. Do not modify #765's workspace unless its owner explicitly establishes a collaboration convention.

---

## FINDING-GH-008

### Finding
Issue #767 records verified OnboardingPro v6 donor components for Continuous Business Observation, Business Reality Graph, reconfiguration, Nexus reassessment/provisioning, discovery consent, outcome measurement and rollback/learning tests. These are relevant supporting evidence but belong to the Evolution/Reality convergence assignment rather than this mechanism-only implementation claim.

### Why it matters
It corroborates that the repository's active convergence backlog already contains concrete donor evidence and prevents this specialist issue from creating duplicate implementation work for those capabilities.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Issue: #767 — [LIBRARY] Recover OnboardingPro Evolution and Reality capabilities
- Issue text names concrete donor paths and required convergence tests.

### Current Titan equivalent
Evolution Engine / Reality / Nexus ownership under existing convergence work.

### Classification
HISTORICAL

### Confidence
MEDIUM

### Related action
#759; #767

### Cross-agent note
Use as supporting evidence only. Do not duplicate the implementation assignment owned by #767.

---

## SUPERSESSION NOTE

FINDING-GH-002 remains accurate for the exact initial paths inspected, but it is superseded for repository-wide workspace discovery by FINDING-GH-007. A broader canonical archaeology workspace is now known to exist through issue #765; it is another agent's assigned workspace and therefore is not adopted here.


---

## FINDING-GH-009

### Finding
PR #764 is currently blocked by a mismatch between the written AGENTS.md issue-number claim protocol and the active Agent Claim Gate implementation. The live gate rejects `agent/763` and requires a roadmap-style subgoal identifier such as `agent/TZ-ROADMAP-31-SG-01`.

### Why it matters
The research branch followed the documented issue claim pattern used for #763, but repository automation currently enforces a narrower branch-name contract. This is a workflow/governance mismatch, not evidence that another agent owns #763.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- PR: #764
- Workflow run: 35720805322 — Agent Claim Gate
- Job: 106723001131
- Failure: `CLAIM-GATE ERROR: claim branch must be exactly agent/<subgoal-id>, for example agent/TZ-ROADMAP-31-SG-01`
- Canonical branch still exists: `agent/763`.

### Current Titan equivalent
Agent Mesh claim governance.

### Classification
REGRESSION

### Confidence
HIGH

### Related action
Requires Manager/convergence review of documentation vs validator contract; no competing claim branch created.

---

## FINDING-GH-010

### Finding
The PR's general Titan Zero CI failure is outside this research change. Typechecking reaches the worker package and fails on unresolved package/module dependencies and workflow-events test/export mismatches.

### Why it matters
The read-only archaeology files do not modify these worker sources. The failure must not be misreported as validation failure of the archaeology logic.

### Evidence
- PR: #764
- Workflow run: 35720805235 — Titan Zero CI
- Job: 106723095303
- Failing step: Strict non-web typecheck
- Examples: missing `@ai-fsm/email-templates`, `mysql2/promise`, `@ai-fsm/log`, `@ai-fsm/domain/promise-capture`; `workflowEventOutboxInternals` export mismatch.

### Current Titan equivalent
Repository dependency/typecheck convergence debt.

### Classification
CURRENT

### Confidence
HIGH

### Related action
Do not create a duplicate issue from this specialist workspace unless deduplication confirms no existing dependency-closure work.


---

## FINDING-GH-011

### Finding
The active roadmap already defines one canonical company-scoped Business Memory & Knowledge runtime in issue #153, and that issue explicitly incorporates verified OnboardingPro v6 donor semantics for longitudinal strategy/experience memory and anti-repeat decisions. A separate Zero-specific memory implementation would therefore risk becoming a parallel memory engine.

### Why it matters
Mechanism archaeology has identified a concrete canonical convergence owner for a major part of the future Zero's experience-memory capability. The correct architectural question is how Personal Zero experience/understanding projects onto or consumes canonical memory contracts—not whether to build another generic memory store.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Issue: #153 — [TZ-ROADMAP-03] Finish canonical company-scoped Business Memory & Knowledge runtime
- Issue requires one company-scoped memory/knowledge runtime and explicitly says not to create parallel memory systems per agent or surface.
- Verified donor components recorded in #153:
  - `System/Learning/LongitudinalStrategyMemoryService.php`
  - `System/Learning/AntiRepeatDecisionService.php`
  - `System/Persistence/Models/StrategyMemory.php`
  - strategy-memory migration
  - `System/Execution/OutcomeMeasurementService.php`
  - `System/Execution/RollbackDecisionService.php`
  - longitudinal strategy-memory and related learning tests.
- Donor source identified by #153: OnboardingPro Master v6.0.0-rc.4.zip in Titan Zero Library.

### Current Titan equivalent
Canonical Business Memory & Knowledge runtime / Knowledge Authority contracts (#153), with Decision/Experience integration.

### Classification
PARTIAL

### Confidence
HIGH for ownership/convergence direction; MEDIUM for donor implementation details until the donor source is independently inspected in this specialist mission.

### Related action
SUPPORTED EXISTING ACTION #153. Do not create a duplicate memory runtime.

---

## FINDING-GH-012

### Finding
The verified donor description in #153 distinguishes useful experience-learning semantics from authority: failed or harmful interventions can inform anti-repeat behavior, while stale evidence or materially changed context can permit a controlled retest. The same issue explicitly prohibits learned behavior from elevating authority.

### Why it matters
This is a strong candidate semantic foundation for Zero Experience Memory: remember what was tried, in what context, what happened, confidence/applicability/expiry, and avoid repeating materially similar harmful actions—without converting learned patterns into permission.

### Evidence
- Issue #153 donor recovery section.
- `LongitudinalStrategyMemoryService.php`: verified intervention outcomes, action fingerprints, context, delta, confidence, harm, applicability, expiry.
- `AntiRepeatDecisionService.php`: blocks materially similar failed/harmful interventions; permits controlled retest when evidence is stale or business context materially changes.
- Required verification in #153 includes context-sensitive anti-repeat, stale-memory retest, outcome classification, confidence/applicability expiry, correction/supersession/retention, and no authority elevation from learned behavior.

### Current Titan equivalent
Business Memory / Experience contracts; prospective Personal Zero Experience Memory consumer/projection.

### Classification
SUPERIOR HISTORICAL

### Confidence
MEDIUM until direct source inspection confirms the issue's donor summary.

### Related action
#153; #763 archaeology verification.

---

## FINDING-GH-013

### Finding
Predictive/outcome learning already has a canonical bounded implementation/certification lane in issue #37. It requires verified action/outcome evidence to feed policy adaptation and predictive triggers while explicitly preventing predictive/learned behavior from bypassing Trust/Autonomy, Risk/Assurance or Command Bus authority.

### Why it matters
A future Zero Learning Governor should converge with this bounded learning lane rather than invent an independent self-expanding autonomy mechanism.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Issue: #37 — [TZ-ROADMAP-02] Finish bounded predictive triggers, outcome learning & autonomy-safety certification
- Issue requires verified outcomes, bounded policy adaptation, calibration measurement, rollback/compensation, refusal/escalation, and proof that learning cannot expand authority/spend/communications/provider cost/company scope.

### Current Titan equivalent
Canonical predictive/outcome learning and autonomy-safety lane (#37).

### Classification
CURRENT

### Confidence
HIGH

### Related action
SUPPORTED EXISTING ACTION #37. Zero Learning Governor must preserve these authority ceilings.


---

## FINDING-GH-014

### Finding
Issue #725 already owns canonical identity, working-state persistence and cross-surface continuity semantics. It persists canonical agent working state by reference to existing owners and carries goals/plans, policies, working state, history/events and verified performance/outcome references across hosts/surfaces while revalidating authority on every resume.

### Why it matters
This is a strong existing infrastructure owner for the persistent-state and continuity substrate needed by a person's Zero. A future Personal Zero state model should reuse these continuation/correlation/state contracts rather than creating a second session or cross-surface state authority.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Issue: #725 — [TZ-ROADMAP-34] Consolidated identity, agent state & cross-surface continuity
- Explicit flow includes canonical session/context, persistent working state, goals/plans, history/events, cross-host continuation, correlation, stale-state handling, privacy-minimised projection and server-side authority revalidation.
- #725 explicitly prohibits second Workforce/trust ledgers and per-host agent clones.

### Current Titan equivalent
Goal 34 continuity orchestration, consuming Workforce #639, Trust/Autonomy #640, durable context/handoff #21, surfaces #542/#641, host transport #644 and offline/Edge #645.

### Classification
CURRENT

### Confidence
HIGH

### Related action
SUPPORTED EXISTING ACTION #725. Reuse as persistent-state/continuity substrate; do not treat it as the Personal Zero understanding model itself.

---

## FINDING-GH-015

### Finding
The issue inventory does not currently expose a clear canonical implementation owner for the semantic Personal Understanding model itself: a durable model of the human's goals, preferences, responsibilities, relationships, working style and behavioural patterns. Existing #725 covers continuity/working state, #153 covers company-scoped business memory/knowledge, and #639 covers Workforce identity/hierarchy; none of those issue descriptions claims ownership of this human-understanding semantic layer.

### Why it matters
This appears to be a genuine architectural gap or an as-yet-undiscovered implementation, and it is central to HUMAN=ONE / DIGITAL WORKING INTELLIGENCE=ZERO. It must be deep-scanned before any new implementation issue is created.

### Evidence
- Repository issue searches performed for: user profile/preferences/goals/relationships, personalization memory, behavioural/behavioral model, working context/user model, identity/preferences/goals.
- Relevant owners found: #725 continuity, #153 business memory, #639 Workforce, #763 archaeology.
- No issue result inspected in this pass explicitly owns a Personal Zero understanding/behaviour semantic model.
- GitHub code search for these terms is unavailable/unindexed in this repository, so absence from code is NOT established.

### Current Titan equivalent
UNKNOWN / potentially distributed across continuity, memory, interaction and historical donors.

### Classification
UNKNOWN

### Confidence
MEDIUM

### Related action
Continue #763 archaeology. Do not create a new implementation issue until current code, historical Git and donor evidence are directly inspected.

---

## FINDING-GH-016

### Finding
Persistent Zero state must remain distinct from authority state. #725 explicitly requires current company/actor authority and delegation to be revalidated server-side on every resume/transition; client/session history cannot refresh authority.

### Why it matters
A Zero may persist understanding, context, plans and learned experience across devices and hosts, but persistence cannot make expired/revoked authority durable. This directly supports the architecture rule that memory/learning/prediction do not create authority.

### Evidence
- Issue #725, implementation flow steps 5–8.
- Revalidation covers company_id, actor, current authority/delegation, entitlement/policy and relevant state.
- Stale sessions, revoked delegation and reduced authority fail closed through revalidation/reconciliation.

### Current Titan equivalent
Goal 34 continuity + Trust/Autonomy/Authority owners.

### Classification
CURRENT

### Confidence
HIGH

### Related action
#725; #761/#762 Trust/Authority evidence recovery.
