# Cross-System Audit Findings

## FINDING-CSA-001

### Finding
The current Agent-Mesh implementation already contains a substantial Titan platform layer; Titan Zero should not be treated as greenfield.

### Why it matters
Creating new parallel engines would duplicate current runtime, intelligence, workforce, builder and connector responsibilities.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch inspected: main
- Paths:
  - packages/titan-platform/src/runtime.ts
  - packages/titan-platform/src/intelligence.ts
  - packages/titan-platform/src/workforce.ts
  - packages/titan-platform/src/business-ops.ts
  - packages/titan-platform/src/titan-builder/index.ts
  - packages/titan-platform/src/descriptor.ts
- Functions/contracts include createCompanyExecutionContext, classifyRisk, buildModelCouncilRecommendation, createNexusOrchestration, workforce hierarchy/delegation exports, Business Ops command registry and Titan Builder runtime/command handoff.

### Current Titan equivalent
This is the current Titan platform implementation.

### Classification
CURRENT / IMPLEMENTED

### Confidence
HIGH

### Related action
ACTION-CSA-001

---

## FINDING-CSA-002

### Finding
The main unresolved architectural problem is loop closure between persistent Zero understanding/experience/learning, Business Reality, Trust/Authority, execution and measured outcomes.

### Why it matters
The current repository has many component systems, but package existence is not proof of a coherent working-intelligence loop.

### Evidence
- Current titan-platform exports verified in FINDING-CSA-001.
- Required pivot loop: persistent understanding, experience, learning, evolution, Reality and authority separation.
- Detailed map: TITAN-ZERO-MASTER-CAPABILITY-MAP.md.

### Current Titan equivalent
Partial implementations exist across Zero/persistent intelligence, Decision Engine, Knowledge Authority, Workforce, Business Ops and runtime.

### Classification
PARTIAL

### Confidence
HIGH for the integration gap; MEDIUM for individual missing sub-capabilities pending deeper specialist scans.

### Related action
ACTION-CSA-002

---

## FINDING-CSA-003

### Finding
Historical zero contains concrete local-first sync/rewind donor semantics: change logs, inbox/outbox, conflicts, tombstones, rewind snapshots and restores.

### Why it matters
This is stronger evidence than merely finding a historical subsystem name and is a candidate for IMPORT + HARDEN / CONVERGE rather than rebuilding rewind.

### Evidence
- Repository: Masterleeaus/zero
- Branch: main
- Documents:
  - WORKCORE_SYNC_AND_REWIND_NOTES.md
  - WORKCORE_SCHEMA_ALIGNMENT_NOTES.md
  - WORKCORE_MERGE.md
- Historical donor areas include CodeToUse/WorkCore.

### Current Titan equivalent
Current titan-platform contains decision-history/rewind semantics and persistence primitives.

### Classification
HISTORICAL / PARTIAL / UNMERGED

### Confidence
HIGH that the historical mechanism exists; MEDIUM on superiority until direct implementation comparison.

### Related action
ACTION-CSA-003

---

## FINDING-CSA-004

### Finding
Historical zero also contains donor areas for Nexus, Signal, TitanCommand, TitanGo, TitanPortal, TitanOmni and Voice.

### Why it matters
These are high-value archaeology targets for current Zero/Go/Hub/Command and orchestration lineage, but copies must not be counted as independent evidence.

### Evidence
- Repository: Masterleeaus/zero
- Branch: main
- Paths:
  - CodeToUse/Nexus/zero_core
  - CodeToUse/Signals/titan_signal
  - CodeToUse/Mobile/TitanCommand
  - CodeToUse/Mobile/TitanGo
  - CodeToUse/Mobile/TitanPortal
  - CodeToUse/Omni/TitanOmni
  - CodeToUse/Voice/

### Current Titan equivalent
Current Signal/Nexus exports exist; Builder surface contract recognizes zero/hub/go.

### Classification
HISTORICAL / DUPLICATE OR SUPERIOR-HISTORICAL UNKNOWN

### Confidence
HIGH for existence; LOW/MEDIUM for comparative quality pending direct source comparison.

### Related action
ACTION-CSA-004

---

## FINDING-CSA-005

### Finding
Titan Runtime uses company_id as its canonical execution boundary and explicitly treats tenant_id / tenant_company_id as compatibility inputs.

### Why it matters
This directly supports the current architectural rule that company_id is the sole canonical tenant boundary.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: main
- Path: packages/titan-platform/src/runtime.ts
- Functions: createCompanyExecutionContext, normalizeCompatibilityCompanyInput, assertCompanyBoundaryMatch, bindCompanyBoundary.

### Current Titan equivalent
Titan Runtime.

### Classification
CURRENT / IMPLEMENTED

### Confidence
HIGH

### Related action
ACTION-CSA-005

---

## FINDING-CSA-006

### Finding
Current operational invariants/canonical Dovetails material still describe account_id-based operational tenancy while Titan Runtime is company_id-based.

### Why it matters
These must not be silently assumed equivalent. Authorization, storage, projection, decision and execution boundaries require explicit reconciliation.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: main
- AGENTS.md points to ai/INVARIANTS.md as operational authority.
- Titan Runtime source in packages/titan-platform/src/runtime.ts uses company_id.
- First-pass audit recorded the documentation/runtime mismatch.

### Current Titan equivalent
Runtime plus active operational database/domain layer.

### Classification
SUPERSEDED AS ARCHITECTURAL-GAP CLAIM

### Confidence
HIGH that legacy/current Dovetails account_id evidence exists. Cross-agent archaeology plus issue #72/#648 confirms company_id is already the Titan Zero architectural invariant, so this is an active-code enforcement/migration concern rather than an unresolved target-tenancy design.

### Related action
ACTION-CSA-005

### Superseded by
FINDING-CSA-009

---

## FINDING-CSA-007

### Finding
The root/package implementation identity is Titan Zero while the current canonical architecture/product documents still substantially describe Dovetails FSM.

### Why it matters
Different agents can receive conflicting architecture instructions depending on whether they follow package implementation or canonical documents.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: main
- package.json / titan-platform package identity.
- docs/canonical/ARCHITECTURE.md, DOMAIN_MODEL.md, WORKFLOW.md, ROADMAP.md and related Dovetails material.
- AGENTS.md says code/migrations are implemented truth and docs/canonical is product/architecture truth.

### Current Titan equivalent
Current documentation hierarchy.

### Classification
CURRENT / PARTIAL / REGRESSION-RISK

### Confidence
HIGH

### Related action
ACTION-CSA-006

---

## FINDING-CSA-008

### Finding
GitHub archaeology issue #765 has verified a broad historical repository universe but its capability-level recovery work is not complete enough to treat every historical capability claim as verified.

### Why it matters
The convergence audit must distinguish inspected source from repository names, reports or agent claims.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch/workspace inspected: agent/765, workspaces/github-archaeology/
- Artifact inspected: REPOSITORY-LEDGER.md
- Related issue: #765.

### Current Titan equivalent
Cross-agent archaeology evidence source.

### Classification
PARTIAL

### Confidence
HIGH

### Related action
ACTION-CSA-007


---

## FINDING-CSA-009

### Finding
company_id is already the broader Titan Zero architectural invariant; remaining legacy/account_id concerns belong to active-code enforcement rather than creation of a new tenancy model.

### Why it matters
This corrects FINDING-CSA-006's provisional framing and prevents duplicate tenancy architecture.

### Evidence
- Cross-agent support: FINDING-GH-006/007 owner analysis in agent/765.
- Repository: Masterleeaus/Agent-Mesh
- Issue #72: explicitly states company_id is already the architectural invariant and scopes work to active-code enforcement defects.
- Issue #648 absorbs the remaining repository-wide company_id normalization/enforcement work.
- Current source: packages/titan-platform/src/runtime.ts.

### Current Titan equivalent
Titan Runtime plus issue #648 repository convergence lane.

### Classification
CURRENT / IMPLEMENTED INVARIANT / PARTIAL ENFORCEMENT

### Confidence
HIGH

### Related action
ACTION-CSA-005

---

## FINDING-CSA-010

### Finding
Experience Memory already has a strong canonical destination in issue #153; a separate Experience Memory engine would duplicate current ownership.

### Why it matters
#153 explicitly covers company-scoped canonical memory, provenance, freshness, confidence, episodic memory from verified outcomes, correction/supersession, retention, privacy, anti-repeat behavior and the rule that memory never grants authority.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Issue #153: Finish canonical company-scoped Business Memory & Knowledge runtime.
- Donor recovery already recorded in #153 from OnboardingPro v6.0.0-rc.4:
  - LongitudinalStrategyMemoryService.php
  - AntiRepeatDecisionService.php
  - StrategyMemory model/migration
  - OutcomeMeasurementService.php
  - RollbackDecisionService.php
- Cross-agent support: FINDING-GH-006 and CANONICAL-OWNER-MAP.md on agent/765.

### Current Titan equivalent
Issue #153 / Knowledge Authority memory runtime.

### Classification
CURRENT OWNER / PARTIAL OR SPECIFICATION-ONLY PENDING IMPLEMENTATION EVIDENCE

### Confidence
HIGH for ownership; implementation completeness not asserted.

### Related action
ACTION-CSA-008

---

## FINDING-CSA-011

### Finding
A dedicated convergence action now exists for OnboardingPro Evolution and Business Reality recovery: issue #767.

### Why it matters
This removes the need for this cross-system audit to create a competing Evolution/Reality implementation issue and provides a canonical place for the strongest Library donor mechanisms.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Issue #767: Recover OnboardingPro Evolution and Reality capabilities.
- Verified donor components listed by #767 include ContinuousBusinessObservationService, BusinessRealityGraphService, BusinessRealityFactService, BusinessConfigurationDiffer, BusinessReconfigurationService, Nexus reassessment/configuration/provisioning/verification/reconciliation services, DiscoveryConsentService, OutcomeMeasurementService and RollbackDecisionService.
- Required lifecycle: DISCOVER → CONFIGURE → OBSERVE → DETECT CHANGE → REASSESS → DIAGNOSE → PROPOSE → APPROVE WHERE REQUIRED → RECONFIGURE → VERIFY → MEASURE → LEARN → REPEAT.

### Current Titan equivalent
Issue #767 convergence lane, dependent on #31, #759, #153 and #633.

### Classification
CURRENT ACTION / HISTORICAL DONOR RECOVERY

### Confidence
HIGH that the action and donor inventory exist; implementation status not asserted.

### Related action
ACTION-CSA-009

---

## FINDING-CSA-012

### Finding
GitHub archaeology recovered superior historical semantics for revision-aware recomposition and per-value provenance from diverged Ai-extensions branches.

### Why it matters
These mechanisms directly support Zero/Evolution without granting authority and can strengthen existing Decision/Memory owners rather than becoming a new wizard/context engine.

### Evidence
Cross-agent evidence from agent/765:
- FINDING-GH-003: Masterleeaus/Ai-extensions branch feature/wizard-answer-recomposition; WizardAnswerChanged.php and WizardAnswerRecompositionService.php; stale revision/context rejection and affected-section recomposition.
- FINDING-GH-004: branch feature/titan-vertical-context-composer; VerticalContextComposer.php and ContextValueProvenance.php; per-value source/confidence/confirmed/risk/revision metadata.
- FINDING-GH-005: feature/vertical-ai-proposal-bridge; AI proposals are validated/sanitized and cannot claim state application.

### Current Titan equivalent
#59 Decision runtime + #153 Business Memory/Knowledge + #642 governed convergence.

### Classification
SUPERIOR HISTORICAL SEMANTICS / PARTIAL CURRENT EQUIVALENT

### Confidence
HIGH based on specialist source inspection; this audit treats the specialist workspace as supporting evidence and has not duplicated its full branch archaeology.

### Related action
ACTION-CSA-010


---

## FINDING-CSA-013

### Finding
The current authority runtime directly proves that persistent/recalled execution context cannot create authority and that governed execution revalidates authority against the current company-bound decision.

### Why it matters
This closes an important P0/P1 evidence question independently of archaeology summaries: Personal Zero memory, behavioural learning and continuity can inform context but cannot grant, widen or refresh execution permission.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: main
- packages/runtime/authority/execution-boundary.mjs
  - assertCurrentExecutionContextBinding returns identity_confers_authority:false and current_context_only:true.
  - prepareGovernedCommandEnvelope validates the authority decision, emits execution_transport:'titan-command-bus', direct_mutation:false, requires_authoritative_receipt:true and authority_effect:false.
  - assertCommandAuthorityCurrentAt checks company, actor/capability/operation/action bindings and supersession before execution.
  - assertAuthoritativeExecutionReceipt and continuity checks bind successful execution evidence to company/action/authority/replay context.
- packages/runtime/authority/company-boundary.mjs
  - company_id is required.
  - tenant_id, tenant_company_id and related legacy tenant fields are recursively rejected from authority payloads.

### Current Titan equivalent
Authority execution boundary / Command Bus governed envelope.

### Classification
CURRENT / IMPLEMENTED

### Confidence
HIGH

### Related action
Preserve and use as a hard invariant for Personal Zero, Experience, Learning, Evolution and continuity convergence.

---

## FINDING-CSA-014

### Finding
The newly discovered Zero Mechanism Archaeology workspace independently converges on existing owners for Business Memory (#153), bounded learning (#37), durable context (#21) and continuity (#725), while still finding no verified canonical owner for the semantic Personal Zero human-understanding/behaviour model.

### Why it matters
This narrows the genuine missing-capability question. The likely gap is not another generic memory store; it is a governed semantic model of the human that composes with existing memory/context/continuity owners.

### Evidence
- Cross-agent workspace: agent/763 .titan/research/zero-mechanism-archaeology/
- Source agent is IN PROGRESS.
- Relevant source findings include its #153/#37/#725/#21 ownership analysis and Personal Understanding searches.
- Important source-quality note: the source artifact currently reuses FINDING-GH-014, FINDING-GH-015 and FINDING-GH-016 IDs for different findings. This audit therefore references the evidence by content until corrected.

### Current Titan equivalent
Composition candidates: #153 Business Memory/Knowledge + #21 durable context/handoff + #725 continuity + #37 bounded learning. Complete Personal Understanding owner remains UNKNOWN.

### Classification
UNKNOWN / LIKELY GAP PENDING FINAL ARCHAEOLOGY

### Confidence
MEDIUM

### Related action
Do not create an implementation issue yet. Continue ownership/source archaeology and package the capability only after Blueprint, GitHub and Library final evidence is reconciled.


---

## FINDING-CSA-015

### Finding
The Personal Zero ownership gap identified in FINDING-CSA-014 now has an existing architecture action: issue #768, Define Personal Zero Understanding & Experience contracts.

### Why it matters
A new Personal Zero implementation issue would now be duplicate work. #768 explicitly preserves the boundaries this audit requires: Personal Zero is not Business Memory, Business Reality, Interaction persistence, Intelligence routing or an authority engine.

### Evidence
- Issue #768, open.
- Defines Understanding Memory, Experience Memory and Cognitive Event contracts.
- Requires one canonical owner after inspecting existing storage/evidence/provenance contracts.
- Requires provenance/confidence/freshness/correction/supersession and prediction calibration.
- Explicitly states learning/recommendation/prediction/confidence/consensus never creates authority.
- Coordinates with #153, #633, #767 and Trust/Assurance/Governance/Autonomy/Command Bus.

### Classification
EXISTING ACTION / READY FOR ARCHITECTURE CONVERGENCE, NOT YET IMPLEMENTED

### Confidence
HIGH

### Related action
SUPPORT EXISTING #768. Do not create a competing Personal Zero memory/model issue.

---

## FINDING-CSA-016

### Finding
The user's three-way/recursive trust handshake is not merely an undocumented concept: open issue #640 is the consolidated implementation owner and defines effective authority as the bounded intersection of earned trust, explicit delegation/approval, entitlement, class ceiling, current Risk/Governance/Assurance and downstream acceptance.

### Why it matters
This resolves canonical action ownership for Trust progression while preserving #761 as evidence recovery/audit rather than a second Trust implementation.

### Evidence
- #640 consolidated Goal42 implementation.
- Recursive handshake = system readiness + explicit user delegation + required downstream agent acceptance, accumulating through hierarchy.
- Starts all workforce roles reactive/bounded; hierarchy is a ceiling, not starting authority.
- Includes refusal/pause/revocation/regression, plan-lock separation and path-scoped trust.
- #761 separately owns recovery of Trust handshake and Authority Continuance evidence and explicitly says not to implement a new trust system.

### Classification
PARTIAL / EXISTING IMPLEMENTATION ACTION

### Confidence
HIGH

### Related action
#640 implementation; #761 evidence recovery; #540 final certification.
