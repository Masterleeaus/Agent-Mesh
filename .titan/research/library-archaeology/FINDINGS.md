# Library Archaeology Findings

## FINDING-LIB-001

### Finding
OnboardingPro v6.0.0-rc.4 is not merely an onboarding UI/app. It contains implemented longitudinal experience, anti-repeat learning, persistent Business Reality, continuous observation, governed reconfiguration, outcome measurement and rollback mechanisms.

### Why it matters
These mechanisms map directly into the new Titan Zero Personal Zero / Business Reality / Evolution architecture and can prevent rebuilding mature historical semantics.

### Evidence
- Library: /MASTER Software/Masters/Operations/OnboardingPro/OnboardingPro Master v6.0.0-rc.4.zip
- System/Learning/LongitudinalStrategyMemoryService.php
- System/Learning/AntiRepeatDecisionService.php
- System/Persistence/Models/StrategyMemory.php
- System/Execution/OutcomeMeasurementService.php
- System/Execution/RollbackDecisionService.php
- System/Observation/ContinuousBusinessObservationService.php
- System/RealityGraph/BusinessRealityGraphService.php
- System/RealityGraph/BusinessRealityFactService.php
- System/Reconfiguration/BusinessConfigurationDiffer.php
- System/Reconfiguration/BusinessReconfigurationService.php
- System/Discovery/Nexus/NexusReassessmentService.php
- related migrations and standalone tests

### Current Titan equivalent
#153 Business Memory; #31 business discovery; #759 observation/Nexus archaeology; Signal/Rewind/Trust/Assurance/Governance candidates; #767 convergence lane.

### Classification
SUPERIOR HISTORICAL / IMPLEMENTED / PARTIAL parity unknown.

### Confidence
HIGH.

### Related action
ACTION-LIB-001, ACTION-LIB-002.

---

## FINDING-LIB-002

### Finding
OnboardingPro's longitudinal strategy memory records intervention fingerprint, context, expected/actual outcome signals, delta/confidence, harm and future applicability/expiry; its anti-repeat logic can block materially similar failed/harmful interventions while permitting controlled retest after staleness or material context change.

### Why it matters
This is a concrete historical implementation of Experience Memory rather than generic RAG/chat memory.

### Evidence
Same archive as FINDING-LIB-001:
- System/Learning/LongitudinalStrategyMemoryService.php
- System/Learning/AntiRepeatDecisionService.php
- strategy-memory model/migration
- tests/standalone/test_v6_pass11_longitudinal_strategy_memory.php

### Current Titan equivalent
#153 canonical Business Memory / future Experience owner.

### Classification
SUPERIOR HISTORICAL / IMPLEMENTED.

### Confidence
HIGH.

### Related action
ACTION-LIB-001.

---

## FINDING-LIB-003

### Finding
OnboardingPro contains an implemented continuous business-evolution loop: observation scheduling/change detection → Reality Graph evidence → Nexus reassessment → semantic configuration diff → governed reconfiguration → verification → outcome/rollback evidence.

### Why it matters
This is a strong donor for the Evolution Engine concept and supports incremental reassessment instead of repeatedly rediscovering a business from scratch.

### Evidence
- OnboardingPro v6.0.0-rc.4 archive.
- ContinuousBusinessObservationService.php
- BusinessRealityGraphService.php
- BusinessConfigurationDiffer.php
- BusinessReconfigurationService.php
- NexusReassessmentService.php and Nexus provisioning/review/verification/reconciliation services.
- corresponding standalone observation/reconfiguration tests.

### Current Titan equivalent
#31, #759 and current governed execution components. Canonical ownership still requires convergence.

### Classification
SUPERIOR HISTORICAL / IMPLEMENTED / DUPLICATE-CANDIDATE.

### Confidence
HIGH.

### Related action
ACTION-LIB-002.

---

## FINDING-LIB-004

### Finding
Titan Model Council v1.0.0-rc.2 contains a governed deliberation runtime rather than only a council specification: provider preflight, risk assessment, selective activation, billing reservation/settlement, advisory-only execution authority, post-risk assessment and bounded hash-addressed decision receipts.

### Why it matters
Useful Council execution/evidence semantics should converge into current intelligence without creating a second authority path.

### Evidence
- Library: Titan Model Council Master v1.0.0-rc.2.zip
- System/Governed/GovernedDeliberationOrchestrator.php
- GovernedCouncilRuntime.php
- Services/ModelCouncilExecutionService.php
- Receipts/CouncilDecisionReceiptService.php

### Current Titan equivalent
#633 Decision/Intelligence convergence; current Model Council/Assurance/Governance.

### Classification
HISTORICAL / IMPLEMENTED / DUPLICATE-CANDIDATE.

### Confidence
HIGH.

### Related action
ACTION-LIB-003.

---

## FINDING-LIB-005

### Finding
Titan Knowledge Authority v0.12.0-alpha.4 implements authoritative source registry, immutable source-version lineage, scoped context resolution, applicability, contradiction detection and stale/fresh claim handling.

### Why it matters
These are reusable evidence semantics for Zero understanding, Business Reality and Decision context, but Knowledge Authority must remain informational and must not grant execution authority.

### Evidence
- Library: Titan Knowledge Authority Master v0.12.0-alpha.4.zip
- System/Services/KnowledgeAuthority.php
- KnowledgeContextService.php
- KnowledgeContradictionService.php
- source/version/claim/applicability domain models.

### Current Titan equivalent
Current Knowledge Authority / #633.

### Classification
HISTORICAL / IMPLEMENTED / DUPLICATE-CANDIDATE.

### Confidence
HIGH.

### Related action
ACTION-LIB-003.

---

## FINDING-LIB-006

### Finding
Titan Decision Engine Step 25 includes preference modelling, observation, context enrichment, evidence extraction, option discovery, objectives/constraints, comparison/ranking, explanation/confidence, persistent-state candidates and a learning-loop contract. It is therefore also a potential Personal Zero donor, not only a decision engine donor.

### Why it matters
Preference/observation/learning artifacts may provide reusable Personal Zero understanding and experience semantics while the canonical Decision Engine remains singular.

### Evidence
- Library: Titan Decision Engine Master Step 25 archive.
- Step-25 staged intelligence bundle and acceptance/test artifacts inspected in Pass 1.

### Current Titan equivalent
#633 Decision/Intelligence; #153 memory/experience; future Personal Zero owner.

### Classification
HISTORICAL / IMPLEMENTED+SPECIFICATION MIX / PARTIAL.

### Confidence
MEDIUM-HIGH pending file-by-file Personal Zero parity mapping.

### Related action
ACTION-LIB-003.

---

## FINDING-LIB-007

### Finding
An older Phase-10 intelligence upgrade plan specifies device-side working/episodic memory, preference models, confidence, retriever, policy cache, learning buffer and privacy filter, with server authority retained separately.

### Why it matters
This is directly aligned with Personal Zero's persistent/device-first intelligence and with the rule that device intelligence cannot bypass server authority.

### Evidence
- Library file: TitanZero_Phase10_Multi_Pass_Intelligence_Upgrade_Plan.md
- Pass 19 — Device Intelligence and Offline Cognitive Runtime.
- Proposed modules include device-event-store.ts, device-working-memory.ts, device-preference-model.ts, device-retriever.ts, device-confidence.ts, device-learning-buffer.ts and privacy-filter.ts.
- Exit criterion explicitly separates core personal assistance from server authority.

### Current Titan equivalent
Parity not yet verified against current Agent-Mesh.

### Classification
HISTORICAL / SPECIFICATION ONLY until code provenance is found.

### Confidence
HIGH for specification existence; LOW for implementation status.

### Related action
Further archaeology required before GitHub implementation action.


---

## FINDING-LIB-008

### Finding
The Personal Zero / LocalBrain lineage progressed beyond the 29-Jul Phase-10 specification. A later 03-Aug cumulative LocalBrain tree contains implemented cognitive-event, local-memory, preference/action persistence, offline cognitive outbox, causal sync/vector-clock, memory reranking and persona-drift components, plus explicit Phase-11 cognitive-event and Phase-14 authority build reports/changelogs.

### Why it matters
Personal Zero archaeology is not limited to design documents. There is later implemented donor code for persistent/device intelligence that should be inspected before any new Personal Zero memory/cognition runtime is designed.

### Evidence
- Library: Titan-Zero-Offline-LocalBrain-FLAT-file-map.csv
- Underlying tree: Titan-Zero-Offline-LocalBrain-FULL-2026-08-03/interaction-engine/
- CHANGELOG_PHASE11_COGNITIVE_EVENTS.md and PHASE11_BUILD_REPORT.md
- CHANGELOG_PHASE14_AUTHORITY_CONTROLS.md and PHASE14_BUILD_REPORT.md
- src/Models/CognitiveEvent.php
- src/Models/LocalIntelligenceMemory.php
- EloquentLocalIntelligenceMemoryStore.php
- WeightedMemoryReranker.php
- CausalSyncResolver.php and VectorClock.php
- episodic-memory, semantic-memory, user-actions and user-preferences migrations
- offline cognitive-event-outbox, memory-store, memory-reranker, persona-drift, IndexedDB, crypto and sync modules
- docs/ADAPTIVE_PERSONA_LOCALBRAIN_V2_SCAN.md and docs/LOCALBRAIN_V2.md

### Current Titan equivalent
Current Agent-Mesh default-branch exact-symbol search returned no CognitiveEvent, LocalBrain, MemoryTruthStatus, OutcomeLinker, InformationGainCalculator or device-preference-model matches. #763 is the existing archaeology mechanism scan; #153 is company-scoped Business Memory and must not silently become the Personal Zero owner.

### Classification
HISTORICAL / IMPLEMENTED / PARTIAL / POSSIBLE REGRESSION. Source-level inspection is still required before declaring any capability LOST.

### Confidence
HIGH that the Aug-03 implementation tree contains these components; MEDIUM on current functional gap until deeper TypeScript parity mapping is complete.

### Related action
ACTION-LIB-006.


---

## FINDING-LIB-009

### Finding
Source-level inspection of Titan Interaction Engine Master v10.12.0 verifies an implemented cognition/experience lineage: a company-scoped cognitive-event ledger, explicit user-correction/approval/rejection events, prediction-to-outcome linkage and scoring, persistent behavioural transition memory, adaptive prediction-error reweighting, user preference persistence, behavioural/persona drift signals and encrypted offline cognitive-event transport.

### Why it matters
This is the strongest Personal Zero donor found so far because it captures the actual learning loop rather than only storing text: observation -> inference/recommendation -> correction/decision/action -> outcome -> prediction score -> model/memory update. It maps naturally to separate Understanding Memory and Experience Memory while retaining provenance and chronology.

### Evidence
Library master: /MASTER Software/Masters/Mobile Apps/Titan Interaction Engine/Titan Interaction Engine Master v10.12.0.zip
- System/Cognition/Events/CognitiveEvent.php
- System/Cognition/Events/CognitiveEventType.php
- System/Cognition/Events/EloquentCognitiveEventStore.php
- System/Cognition/Outcome/OutcomeRecorder.php
- System/Cognition/Outcome/OutcomeLinker.php
- System/LocalIntelligence/Memory/BehavioralMemory.php
- System/LocalIntelligence/Learning/AdaptiveReweightingEngine.php
- System/Engines/Learning/Implementations/PreferenceLearningEngine.php
- System/LocalIntelligence/Persona/BehavioralDriftTracker.php
- resources/ts/offline/cognitive-event-outbox.ts
- resources/ts/offline/persona-drift.ts
- migrations for episodic/semantic memory, user actions and user preferences

### Current Titan equivalent
Current main exact-semantic searches found no prediction_scored, outcome_observed, user_corrected, memory_disputed, behavioral_transition, adaptive_weight, persona_snapshot_v2, Brier-score cognition, vector-clock or causal-sync matches. Equivalent differently named mechanisms still require exhaustion before LOST classification.

### Classification
SUPERIOR HISTORICAL / IMPLEMENTED / STRONG RECOVERY CANDIDATE / POSSIBLE REGRESSION.

### Confidence
HIGH on donor implementation. MEDIUM-HIGH on current gap.

### Architectural treatment
Recover the event/outcome/learning semantics into canonical TypeScript owners. Understanding Memory should consume observations, corrections, preferences and behavioural evidence. Experience Memory should consume recommendation/decision/action/outcome/prediction-score evidence. Inferred persona/drift is evidence, not authoritative human or Business Reality. Learning never grants authority.

### Related action
ACTION-LIB-006; GitHub #763.


---

## FINDING-LIB-010

### Finding
Current-main semantic-owner exhaustion shows the historical LocalBrain family is only partially regressed. Modern TypeScript owners already preserve device/local execution availability, model/provider locality routing, privacy/egress constraints, durable interaction state and conservative offline restart/recovery. The missing cluster is specifically cognition-to-learning/experience semantics.

### Why it matters
This prevents a damaging wholesale LocalBrain import. Titan Zero should recover only the missing cognitive-event/outcome/learning mechanisms and attach them to current canonical owners.

### Evidence
Current main:
- packages/titan-platform/src/intelligence-runtime/device-runtime.ts
- packages/titan-platform/src/intelligence-runtime/index.ts
- packages/titan-platform/src/intelligence.ts
- packages/runtime/interaction-engine/conversation-state-runtime.mjs
- packages/offline/README.md and current offline recovery package
Historical comparison:
- SOURCE-LIB-009 / Titan Interaction Engine Master v10.12.0

### Current Titan equivalent
Surviving owners:
- Intelligence Runtime: device/model/provider/locality availability and governed routing.
- Interaction Engine: conversation/session/context persistence.
- Offline runtime: checkpoint/recovery/replay evidence.
No current equivalent found for CognitiveEvent chronology, first-class correction events, prediction-to-outcome linkage/scoring, behavioural transition memory, adaptive prediction-error reweighting, user preference learning or persona-drift evidence.

### Classification
PARTIAL / REGRESSION for cognition-learning semantics; CURRENT for device/routing/offline/conversation responsibilities.

### Confidence
HIGH for inspected current owners; MEDIUM-HIGH that the listed learning semantics are absent after exact and semantic tree checks.

### Related action
ACTION-LIB-006. Do not import historical device/runtime/offline components that current owners already supersede.


---

## FINDING-LIB-011

### Finding
Issue and canonical-doc deduplication confirms there is no existing implementation issue or current canonical Personal Zero owner. #153 is explicitly company-scoped Business Memory; #763 is archaeology only; #633 is AI/Decision/Intelligence donor convergence; #767 is Business Reality/Evolution. Current canonical Production Intelligence independently reinforces the architectural rule that AI connects/calibrates authoritative sources but does not become the source of truth.

### Why it matters
Personal Zero needs its own narrowly defined Understanding + Experience contract rather than being hidden inside Business Memory, conversation state or AI routing.

### Evidence
- GitHub issue searches for Personal Zero, Understanding Memory, Experience Memory, cognition, preference memory, experience learning, user model and behavioural mechanisms.
- docs/canonical/PRODUCTION_INTELLIGENCE.md source-of-truth and historical-performance rules.
- Current owner evidence from FINDING-LIB-010.
- No other agent research workspace was present under .titan/research at this checkpoint.

### Classification
CURRENT GAP / ARCHITECTURAL OWNER MISSING.

### Confidence
HIGH for issue deduplication and owner separation.

### Related action
ACTION-LIB-008 / #768.
