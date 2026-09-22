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
