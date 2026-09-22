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


---

## FINDING-GH-014

### Finding
Canonical durable context ownership has already been consolidated into issue #21; former issue #19 is explicitly absorbed. The repository states that the retired top-level `memory/` tree must not be restored.

### Why it matters
Persistent Zero state should not be implemented as another generic memory tree. Zero needs a personal/intelligence state model that composes with the canonical durable context contract rather than duplicating storage, handoff or authority semantics.

### Evidence
- Issue #21 — Invocation context, durable memory & cross-agent handoff completion.
- Former #19 is explicitly absorbed into #21.
- #21 requires one canonical durable agent context/memory owner, company-scoped provenance, actor/source identity, freshness/revision and retention metadata.
- #21 requires context references in handoff rather than copying authority state.
- #19 records current implementation evidence in `packages/runtime/authority/execution-boundary.mjs` and `packages/runtime/authority/company-boundary.mjs` and states the old top-level `memory/` tree is gone.

### Current Titan equivalent
Canonical invocation/durable-context/handoff contract (#21).

### Classification
CURRENT

### Confidence
HIGH

### Related action
SUPPORTED EXISTING ACTION #21. Do not restore the retired memory tree.

---

## FINDING-GH-015

### Finding
Issue #725 already owns canonical identity, working state and cross-surface continuity. Its state model includes agent identity, goals/plans, policies, working state, history/events and verified performance/outcome references, while authority remains referenced from existing Trust/Autonomy owners and is revalidated on resume/transition.

### Why it matters
This is a strong existing substrate for persistent Zero working state and continuity. A future Personal Zero state model should distinguish human-understanding/behavioural state from agent/session continuity, but should reuse this continuity orchestration instead of creating per-surface Zero clones.

### Evidence
- Issue #725 — Consolidated identity, agent state & cross-surface continuity.
- Explicit ownership references: #639 Workforce identity, #640 Trust/Autonomy, #21 durable context/handoff, #542/#641 surfaces, #644 host transport, #645 offline/Edge.
- #725 requires same canonical agent/task across zero/Command, go, hub, mobile/PWA, browser and supported LLM hosts.
- It explicitly prohibits client/session history from refreshing authority.

### Current Titan equivalent
Goal34 continuity orchestration and canonical working-state projection.

### Classification
PARTIAL

### Confidence
HIGH

### Related action
SUPPORTED EXISTING ACTION #725.

---

## FINDING-GH-016

### Finding
Current roadmap coverage for “preferences” is business/procedural rather than a complete Personal Zero human-understanding model. Issue #153/#156 cover SOPs, playbooks and preferences in canonical Business Memory, while the issue inventory inspected in this pass did not reveal an explicit canonical owner for a versioned model of the human's goals, priorities, relationships, communication patterns, decision patterns and evolving personal working context.

### Why it matters
The new Zero model requires more than generic business memory or session continuity. This appears to be a genuine architecture gap/candidate missing layer: a governed Personal Understanding/Behavioural Model that references canonical memory/context/state owners without becoming a second generic memory engine.

### Evidence
- #153: procedural memory includes SOPs/playbooks/preferences and is company-scoped Business Memory & Knowledge.
- #156: procedural memory for SOPs/playbooks/preferences.
- #21: durable context/handoff, not a full human-understanding model.
- #725: agent/session working state and continuity, not a full human-understanding model.
- Mechanism-specific issue searches in this pass for user profile/preferences/behavioural model/persistent profile state/personalization memory produced no explicit canonical Personal Zero owner beyond #763 archaeology and the above generic owners.

### Current Titan equivalent
No explicit complete equivalent verified in this pass. Likely requires composition over #153, #21 and #725 rather than duplication.

### Classification
UNKNOWN

### Confidence
MEDIUM

### Related action
Continue archaeology before proposing a new implementation issue. Search historical donors and other agents' evidence for prior human/user modelling mechanisms.

---

## FINDING-GH-017

### Finding
The existing authority boundary already encodes the correct rule for recalled/persistent context: identity/context has no authority effect and current authority must be evaluated separately.

### Why it matters
This provides a concrete architectural invariant for Personal Zero: remembered preferences, historical approvals, behavioural patterns, inferred intent and prior identity context can inform understanding but cannot grant, widen or refresh authority.

### Evidence
- Issue #19 current-code audit records `packages/runtime/authority/execution-boundary.mjs` returning `identity_confers_authority:false`, `current_context_only:true`, and execution context with `authority_effect:false`.
- #19/#21 require negative tests for recalled approval/authority claims, stale context and revoked authority after recall.

### Current Titan equivalent
Canonical execution-context/authority boundary.

### Classification
IMPLEMENTED

### Confidence
HIGH based on current-code evidence recorded in the roadmap issue; direct file inspection remains a later source-verification step.

### Related action
#21; #763.


---

## FINDING-GH-018

### Finding
The Personal Understanding/Behavioural Model gap identified in FINDING-GH-016 now has a dedicated convergence action: issue #768, `[ARCHITECTURE] Define Personal Zero Understanding & Experience contracts`. It explicitly defines Personal Zero as a distinct production contract layer rather than another AI router, conversation store, Business Memory runtime, Business Reality graph or authority engine.

### Why it matters
This resolves the immediate ownership/action gap without this specialist creating a duplicate issue. The final architecture can compose Personal Zero over existing canonical storage/context/evidence owners while preserving separation from Business Memory, Business Reality, Interaction persistence and authority.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Issue: #768
- No branch matching #768 was found in the branch search performed during this pass.
- #768 coordinates with #763, #153, #633, #767 and existing Trust/Assurance/Governance/Autonomy/Command Bus contracts.

### Current Titan equivalent
Proposed canonical Personal Zero Understanding & Experience contract layer (#768).

### Classification
SPECIFICATION ONLY

### Confidence
HIGH

### Related action
SUPPORTED EXISTING ACTION #768. Do not create a competing Personal Zero architecture issue.

### Supersedes
FINDING-GH-016 only with respect to the absence of an explicit action/owner candidate. FINDING-GH-016 remains historically valid as the gap that prompted further archaeology.

---

## FINDING-GH-019

### Finding
Issue #768 records four concrete historical donor families for Personal Zero mechanisms: Titan Interaction Engine Master v10.12.0 LocalBrain; TitanZero Phase10 Device Intelligence; OnboardingPro v6; and Decision Engine Step25.

### Why it matters
This gives the mechanism archaeology a focused historical verification set rather than relying on repository/project names or broad keyword scans.

### Evidence
Issue #768 donor provenance records:
- Titan Interaction Engine Master v10.12.0 LocalBrain: CognitiveEvent chronology, prediction/outcome linkage, correction events, preference/behavioural learning, prediction-error adaptation.
- TitanZero Phase10 Device Intelligence: working/episodic memory, preference model, learning buffer, local correction, information-gain questions.
- OnboardingPro v6: longitudinal strategy memory, anti-repeat decisions, outcome measurement/rollback evidence.
- Decision Engine Step25: preference model, observation, learning loop, persistent-state candidates.

### Current Titan equivalent
No donor is automatically canonical. #768 requires recovery of missing semantics into current TypeScript architecture.

### Classification
HISTORICAL

### Confidence
MEDIUM until this specialist independently inspects the named donor sources; HIGH that #768 records these as its donor provenance.

### Related action
#768; #763.

---

## FINDING-GH-020

### Finding
The Personal Zero contract proposed by #768 includes a useful promotion boundary: raw observation → candidate understanding → accepted/superseded understanding. Corrections update future understanding while preserving provenance rather than silently erasing history.

### Why it matters
This provides the missing epistemic control between observation and “what Zero believes about One.” It prevents a single observation, inferred pattern or model output from silently becoming durable personal truth.

### Evidence
- Issue #768 Required architecture: versioned Understanding Evidence/State, Experience Record and Cognitive Event contracts; provenance/confidence/freshness/correction/supersession/expiry/retention/deletion; raw observation → candidate understanding → accepted/superseded understanding promotion.
- Acceptance requires correction to affect future understanding without deleting lineage.

### Current Titan equivalent
Personal Zero Understanding & Experience contracts proposed in #768, reusing existing evidence/provenance infrastructure where possible.

### Classification
SPECIFICATION ONLY

### Confidence
HIGH

### Related action
#768.

---

## FINDING-GH-021

### Finding
Issue #768 explicitly preserves a three-way data-model separation: Personal Zero is not Business Memory; Personal Zero is not Business Reality; Interaction Engine conversation persistence is evidence but is not itself the personal model.

### Why it matters
This prevents three likely duplicate/conflated architectures: treating chat history as the person, treating business knowledge as the person, or allowing inferred personal understanding to rewrite authoritative business facts.

### Evidence
- Issue #768 Boundaries 1–3.
- #768 also requires verified business outcomes to feed experience without merging Personal Zero and Business Reality.

### Current Titan equivalent
Personal Zero (#768) composed with Business Memory (#153), Business Reality/Evolution (#767), and Interaction Engine persistence as separate owners.

### Classification
SPECIFICATION ONLY

### Confidence
HIGH

### Related action
#768; #153; #767.


---

## FINDING-GH-022

### Finding
Direct inspection of the Library master `Titan Interaction Engine Master v10.12.0.zip` independently verifies that LocalBrain contains implemented Personal Zero donor mechanisms rather than specification-only placeholders.

### Verified source evidence
Library artifact:
`/MASTER Software/Masters/Mobile Apps/Titan Interaction Engine/Titan Interaction Engine Master v10.12.0.zip`
SHA-256 recorded in Library evidence: `481c4fce6292a623d1cad265093593a2c0b7a0fd50d049d8a4ce770b818a6219`.

Directly inspected implementation paths include:
- `System/Cognition/Events/CognitiveEvent.php`
- `System/Cognition/Events/CognitiveEventType.php`
- `System/Cognition/Decision/DecisionRecorder.php`
- `System/Cognition/Outcome/OutcomeRecorder.php`
- `System/Cognition/Outcome/OutcomeLinker.php`
- `System/LocalIntelligence/Memory/BehavioralMemory.php`
- `System/LocalIntelligence/Persona/BehavioralDriftTracker.php`
- `System/Engines/Learning/Implementations/BehaviourLearningEngine.php`
- `System/Engines/Learning/Implementations/PreferenceLearningEngine.php`
- `System/LocalIntelligence/LocalBrain.php`.

### Mechanisms verified
- company-scoped cognitive-event envelopes;
- user/device/team/subject/run context;
- confidence and evidence references;
- model version, correlation/parent event IDs, privacy classification and sequence;
- explicit observation/inference/recommendation/correction/approval/rejection/outcome/prediction/memory/model-update event vocabulary;
- behavioural transition memory;
- behavioural drift/persona observation;
- preference/behaviour learning implementations;
- recommendation recording separated from confirmed user action.

### Current Titan equivalent
Historical donor for Personal Zero Understanding/Experience contracts (#768), not a canonical runtime owner.

### Classification
SUPERIOR HISTORICAL

### Confidence
HIGH — source inspected directly from the Library master.

### Related action
#768; #763.

---

## FINDING-GH-023

### Finding
LocalBrain's cognitive event model has a strong epistemic separation useful for Personal Zero. It distinguishes `recommendation_created`, `user_corrected`, `user_approved`, `user_rejected`, `outcome_observed`, `prediction_scored`, `memory_created`, `memory_disputed`, and `model_updated` as separate event types.

### Why it matters
This directly supports the new Zero rule that inference/recommendation is not human confirmation and that corrections/disputes must remain first-class evidence. It provides a reusable chronology vocabulary for “what Zero thought, what One said/did, and what actually happened.”

### Evidence
Direct source: `System/Cognition/Events/CognitiveEventType.php` in Interaction Engine v10.12.0.

### Current Titan equivalent
Candidate donor vocabulary for #768 Cognitive Event / Understanding Evidence contracts.

### Classification
SUPERIOR HISTORICAL

### Confidence
HIGH

### Related action
#768.

---

## FINDING-GH-024

### Finding
LocalBrain implements prediction-to-outcome calibration rather than merely storing predictions. `OutcomeLinker::linkAndScore()` requires prediction and outcome events in the same company context and calculates a Brier score before writing a `prediction_scored` cognitive event.

### Why it matters
This is a concrete donor for Zero learning from prediction error. Future Zero can measure whether its expectations were accurate and adjust confidence/understanding without treating prediction confidence as authority.

### Evidence
Direct source: `System/Cognition/Outcome/OutcomeLinker.php`.
- resolves prediction and outcome within company scope;
- rejects missing/cross-context pairings;
- computes `(probability - observed)^2`;
- records `brier_score` in a `PredictionScored` event.

### Current Titan equivalent
Candidate Personal Zero Experience/calibration donor; bounded predictive learning also belongs with canonical #37.

### Classification
SUPERIOR HISTORICAL

### Confidence
HIGH

### Related action
#768; #37.

---

## FINDING-GH-025

### Finding
The inspected LocalBrain process path correctly avoids learning its own recommendation as confirmed user behaviour. `process()` records a recommendation; behavioural memory is updated separately through `confirmAction()`, which records the actual user decision.

### Why it matters
This is a critical anti-self-reinforcement safeguard for Zero. Otherwise Zero could recommend something, observe its own recommendation, and falsely learn that the human prefers that behaviour.

### Evidence
Direct source: `System/LocalIntelligence/LocalBrain.php`.
- `process()` calls `recordRecommendation(...)`.
- `confirmAction()` separately calls behavioural `recordAction(...)` and `recordUserDecision(... approved: true)`.

### Current Titan equivalent
Candidate invariant for #768 raw observation/candidate understanding/accepted understanding promotion.

### Classification
SUPERIOR HISTORICAL

### Confidence
HIGH

### Related action
#768.

---

## FINDING-GH-026

### Finding
The historical LocalBrain cognitive envelope is already `company_id` based, but it also carries team/user/device scope and personal privacy classes. This is compatible with the Titan Zero company boundary provided these subordinate identities remain context/scope rather than alternate tenant boundaries.

### Evidence
Direct source: `System/Cognition/Events/CognitiveEvent.php` requires non-empty `companyId` and stores `teamId`, `userId`, `deviceId`, subject identity, privacy class and evidence separately.

### Current Titan equivalent
Potential contract donor for #768 subject/user identity and company-context rules.

### Classification
SUPERIOR HISTORICAL

### Confidence
HIGH

### Related action
#768; canonical `company_id` invariant.


---

## FINDING-GH-027

### Finding
The Phase10 Device Intelligence material is a mixed donor: the Phase10 upgrade plan contains strong architecture/specification for Personal Zero device intelligence, while the separately verified Interaction Engine v10.12.0 contains implementation of several prerequisite cognition mechanisms. This pass did not locate a separate Phase10 cumulative source archive proving that all Pass18/19 TypeScript device modules were implemented.

### Why it matters
Do not promote planned Phase10 device modules to implemented truth. Recover the semantics, but require source evidence before direct import claims.

### Evidence
Library source: `TitanZero_Phase10_Multi_Pass_Intelligence_Upgrade_Plan.md`.
The plan explicitly describes Pass18 Outcome-Based and Active Learning and Pass19 Device Intelligence, including proposed TypeScript files `device-event-store.ts`, `device-working-memory.ts`, `device-preference-model.ts`, `device-learning-buffer.ts` and related modules. Library searches for these exact implementation paths returned the plan, not a separate implementation archive.

### Current Titan equivalent
#768 Personal Zero contracts plus current offline/device runtime; implementation ownership still requires convergence.

### Classification
SPECIFICATION ONLY for Pass18/19 device modules; donor semantics remain valuable.

### Confidence
HIGH

### Related action
#768; do not claim direct import until source archive is found.

---

## FINDING-GH-028

### Finding
Phase10 defines a particularly strong Personal Zero memory truth lifecycle: working, episodic, semantic and procedural memory are separated, with truth states `observed`, `confirmed`, `inferred`, `predicted`, `disputed`, `superseded`, `expired`, and `deleted`.

### Why it matters
This is directly compatible with #768's observation → candidate understanding → accepted/superseded understanding model and provides useful donor vocabulary for preventing inferred or stale personal information from becoming durable truth.

### Evidence
Library plan Pass12 — Memory Architecture and Truth Lifecycle. Required metadata includes source/evidence, confidence, first-observed/last-confirmed, expiry/decay, contradiction references, sensitivity, consent basis, model/rule version and visibility scope.

### Current Titan equivalent
Candidate semantics for Personal Zero Understanding Evidence/State; generic Business Memory remains #153.

### Classification
SUPERIOR HISTORICAL SPECIFICATION

### Confidence
HIGH

### Related action
#768.

---

## FINDING-GH-029

### Finding
Phase10 specifies explicit privacy/scope levels for personal intelligence: device-private, user-private, team, tenant/company and collective-safe, with local personal adaptation separated from business/team learning and global contribution.

### Why it matters
This gives Personal Zero a useful locality/privacy model without inventing a second tenant boundary. Canonical business tenancy must still normalize to `company_id`; user/device scope is subordinate visibility/locality context.

### Evidence
Phase10 Pass12 scope states and Pass19/20 device/collective responsibilities. Pass20 defaults global contribution to explicit opt-in and prohibits raw conversations, credentials and sensitive fields from global contribution.

### Current Titan equivalent
Candidate privacy/locality semantics for #768 plus Local Bridge/device-private state.

### Classification
SUPERIOR HISTORICAL SPECIFICATION

### Confidence
HIGH

### Related action
#768.

---

## FINDING-GH-030

### Finding
Phase10's Learning Governor design explicitly moves beyond pattern imitation: corrections and real downstream outcomes become learning signals, model updates require minimum evidence, updates are versioned/reversible, exceptional events must not dominate, and active learning asks the question expected to reduce uncertainty most.

### Why it matters
These are strong semantics for Zero's Learning Governor and for a proactive Zero that knows what it does not know. They also prevent one correction from silently becoming a universal rule.

### Evidence
Phase10 Pass18 — Outcome-Based and Active Learning. Proposed components include CorrectionSignal, OutcomeSignal, PredictionScorer, FeatureWeightUpdater, InformationGainCalculator, QuestionRanker, DriftDetector, ModelVersion/Registry/Rollback. Tests require prediction error reduction, exceptional-event resistance, local preference correction before tenant model, rollback and uncertainty reduction.

### Current Titan equivalent
#37 bounded predictive/outcome learning + #768 Personal Zero understanding/experience.

### Classification
SUPERIOR HISTORICAL SPECIFICATION

### Confidence
HIGH

### Related action
#37; #768.

---

## FINDING-GH-031

### Finding
Phase10 states the correct device/server authority split for Personal Zero: devices may hold personal preferences, recent working/episodic memory, drafts, local retrieval and personal model adjustments, while authoritative business records, permissions/approval, business memory, team learning, outcome evaluation, model registry/signing and shared orchestration remain server responsibilities.

### Why it matters
This supports device-first/private Zero without allowing offline intelligence to become an authority bypass.

### Evidence
Phase10 Pass19 explicitly requires “Core personal assistance works offline” and “Device intelligence cannot bypass server authority.” Its broader upgrade strategy states learning permission, visibility permission, recommendation permission, execution permission and approval authority are distinct.

### Current Titan equivalent
Candidate convergence semantics for #768 + canonical offline/Trust/Authority owners.

### Classification
SUPERIOR HISTORICAL SPECIFICATION

### Confidence
HIGH

### Related action
#768; #21; #725; Trust/Authority owners.


---

## FINDING-GH-032

### Finding
Direct inspection of `Titan Decision Engine Master Step 25.zip` verifies implemented TypeScript donors for observation, actor/company preferences, revisioned decision history and verified-outcome learning. These mechanisms are real source code, not only architecture prose.

### Evidence
Library master: `/MASTER Software/Masters/Platform/Titan Decision Engine/Titan Decision Engine Master Step 25.zip`
Recorded SHA-256: `3bda451db30aea3bd51fe1205a89ff68ef93e3cbde00f92c1b2810986836a70a`.
Directly inspected:
- `10-observation-engine/runtime/observationEngine.ts`
- `17-preference-model/runtime/preferenceModel.ts`
- `24-decision-history/runtime/decisionHistory.ts`
- `25-learning-loop/runtime/learningLoop.ts`
- `04-capability-deobfuscation/PERSISTENT-STATE-CANDIDATES.json`.

### Classification
SUPERIOR HISTORICAL / IMPLEMENTED

### Confidence
HIGH

### Related action
#633; #768.

---

## FINDING-GH-033

### Finding
Step25's preference model is a strong Personal Zero donor because it explicitly separates company preferences from actor preferences and resolves effective preferences without giving them authority effect.

### Evidence
`17-preference-model/runtime/preferenceModel.ts` builds company/actor-scoped preference sets, rejects cross-company preference sets, resolves active preferences using scope/source/confidence/strength, and returns `authority_effect: "none"`.

### Why it matters
This is a concrete pattern for Personal Zero preferences: actor-specific understanding can override/shadow company defaults for recommendation/ranking purposes while remaining company-scoped and authority-neutral.

### Classification
SUPERIOR HISTORICAL / IMPLEMENTED

### Confidence
HIGH

### Related action
#768; #633.

---

## FINDING-GH-034

### Finding
Step25's learning loop only learns from verified outcomes with verification references, preserves historical evidence/decisions, produces revisioned learning state, and explicitly has no authority effect.

### Evidence
`25-learning-loop/runtime/learningLoop.ts`:
- rejects cross-company learning;
- requires `outcome.verified`;
- requires `verification_refs`;
- calculates forecast error/bias, assumption reliability, recommendation success and Brier calibration;
- increments a learning revision;
- reports `historical_evidence_rewritten:false`, `historical_decision_rewritten:false`, `authority_effect:"none"`.

### Why it matters
This is an unusually clean donor for Zero's Learning Governor: learning updates future calibration rather than rewriting history or creating authority.

### Classification
SUPERIOR HISTORICAL / IMPLEMENTED

### Confidence
HIGH

### Related action
#37; #633; #768.

---

## FINDING-GH-035

### Finding
Step25's decision history provides immutable-style revision lineage: each snapshot is hashed, revisions supersede prior history IDs, cross-company history is rejected, and chain integrity can be verified.

### Evidence
`24-decision-history/runtime/decisionHistory.ts`.

### Why it matters
The mechanism is useful for Personal Zero understanding/experience revisions: corrected understanding should supersede prior state without deleting the historical chain.

### Classification
SUPERIOR HISTORICAL / IMPLEMENTED

### Confidence
HIGH

### Related action
#768; Rewind/provenance owners.

---

## FINDING-GH-036

### Finding
The Step25 persistent-state candidate inventory is archaeology evidence, not a ready Personal Zero state model. It mostly identifies storage keys in the historical Phia-derived donor such as onboarding flags, recently viewed items, muted sites, whitelist state and identifiers.

### Why it matters
Do not import this storage model wholesale. Its value is evidence that persistent behavioural/product state existed; Personal Zero should use canonical #21/#725 persistence and only recover semantically useful state after privacy/ownership review.

### Classification
HISTORICAL DONOR / RESEARCH ARTIFACT

### Confidence
HIGH

### Related action
#21; #725; #768.
