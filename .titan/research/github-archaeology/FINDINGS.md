> Canonical shared multi-agent coordination copy. Detailed archaeology reports remain in `workspaces/github-archaeology/` until final consolidation.

# GitHub Archaeology Findings

## FINDING-GH-001

### Finding
The accessible GitHub account inventory contains 40 repositories, including multiple substantial Titan/Zero generations and related business/AI systems.

### Why it matters
Current default-branch inspection alone cannot represent roughly two years of development history.

### Evidence
- Repository owner: `Masterleeaus`
- Inventory artifact: `workspaces/github-archaeology/REPOSITORY-LEDGER.md`
- Notable repositories include `Titan-BOS`, `Titan-Zero`, `zero`, `TitanPro`, `Titancore`, `Titanzero`, `Titan-Builder`, `Interaction-engine`, `AI-Coding-Studio`, `Ai-extensions`, `clean`, `cleanly`, and `Agent-Mesh`.

### Current Titan equivalent
`Masterleeaus/Agent-Mesh` main is the current comparison baseline.

### Classification
HISTORICAL / PARTIAL

### Confidence
HIGH

### Related action
Continue staged repository → branch → history → capability archaeology under #765.

---

## FINDING-GH-002

### Finding
High-value historical repositories contain extensive branch-only development surfaces; several have dozens to 100+ branches.

### Why it matters
Important capabilities may never have reached repository default branches.

### Evidence
- Artifact: `workspaces/github-archaeology/BRANCH-LEDGER.md`
- `TitanPro`: 100+ observed
- `Ai-extensions`: 100+ observed
- `Titan-Builder`: 82 observed
- `Titancore`: 29
- `cleanly`: 29
- `Worksuite-Saas---Project-Management-System_Laravel`: 20
- `zero`: 18
- `Titan-BOS`: 18
- `AI-Coding-Studio`: 17

### Current Titan equivalent
No single equivalent; branch archaeology is evidence recovery.

### Classification
HISTORICAL / UNMERGED potential

### Confidence
HIGH

### Related action
#765.

---

## FINDING-GH-003

### Finding
Historical `Ai-extensions` branch `feature/wizard-answer-recomposition` implements revision-aware recomposition with explicit change events, answer revision checks, affected sections, source/confidence/risk/confirmation metadata, deterministic proposals and stale-context rejection.

### Why it matters
The mechanism is a strong precursor for Evolution-style change → reassess → propose → validate behavior without granting learning authority.

### Evidence
Repository: `Masterleeaus/Ai-extensions`
Branch: `feature/wizard-answer-recomposition`
Structural comparison at inspection: 26 commits ahead / 243 behind main.
Paths inspected:
- `app/extensions/WorkCore_Platform/packages/workcore-business-network/src/Domains/WorkCore/System/Modules/Wizards/Events/WizardAnswerChanged.php`
- `.../Services/WizardAnswerRecompositionService.php`
Related repository/contracts/tests recorded in `CAPABILITY-RECOVERY-MATRIX.md`.

### Current Titan equivalent
Partial overlap: #59 owns Decision temporal re-evaluation; #153 owns memory correction/supersession. No justification for a parallel wizard/evolution engine.

### Classification
HISTORICAL / PARTIAL / UNMERGED

### Confidence
HIGH

### Related action
Compare/converge missing semantics through #59/#153 rather than create a new subsystem.

---

## FINDING-GH-004

### Finding
Historical `Ai-extensions` branch `feature/titan-vertical-context-composer` contains layered context resolution with value-level provenance.

### Why it matters
It can inform the new requirement to keep authoritative Business Reality separate from inferred Personal Zero understanding and preserve source/confidence/confirmation/risk/revision.

### Evidence
Repository: `Masterleeaus/Ai-extensions`
Branch: `feature/titan-vertical-context-composer`
Structural comparison at inspection: 17 commits ahead / 266 behind main.
Paths inspected:
- `packages/titan-interaction-engine/src/Vertical/VerticalContextComposer.php`
- `packages/titan-interaction-engine/src/Vertical/DTO/ContextValueProvenance.php`

### Current Titan equivalent
#153 Business Memory/Knowledge and shared provenance/evidence contracts are the closest canonical owners; current Production Intelligence also has source-authority principles.

### Classification
SUPERIOR HISTORICAL semantics / PARTIAL current equivalent

### Confidence
HIGH

### Related action
Selective semantic comparison/port through existing canonical owners only.

---

## FINDING-GH-005

### Finding
Historical `feature/vertical-ai-proposal-bridge` explicitly treats model output as proposals, validates/sanitizes output, records model/provider and hashes, bounds attempts, and prevents AI output from claiming state application.

### Why it matters
It independently demonstrates an older implementation of the current invariant that intelligence does not create authority.

### Evidence
Repository: `Masterleeaus/Ai-extensions`
Branch: `feature/vertical-ai-proposal-bridge`
Structural comparison at inspection: 28 commits ahead / 244 behind main.
Path inspected:
- `packages/titan-interaction-engine/src/Vertical/AI/VerticalAIProposalBridge.php`

### Current Titan equivalent
Already covered architecturally by #642/#50/#153 and current AI/authority boundaries.

### Classification
HISTORICAL / DUPLICATE-PARTIAL

### Confidence
HIGH

### Related action
No new issue unless a concrete current implementation bypass is proven.

---

## FINDING-GH-006

### Finding
Experience Memory already has a strong canonical destination in current issue #153 rather than requiring a new parallel memory engine.

### Why it matters
#153 already specifies episodic memory from verified outcomes, provenance, freshness, confidence, correction/supersession, retention, privacy, anti-repeat behavior, harm/outcome learning, applicability and the rule that memory never grants authority.

### Evidence
Repository: `Masterleeaus/Agent-Mesh`
Issue: #153 — canonical company-scoped Business Memory & Knowledge runtime.
Related issues: #50, #59, #642.
Owner analysis: `CANONICAL-OWNER-MAP.md`.

### Current Titan equivalent
#153.

### Classification
CURRENT / SPECIFICATION ONLY or PARTIAL implementation pending issue evidence

### Confidence
HIGH for ownership; implementation completeness not asserted.

### Related action
Support #153; do not create duplicate Experience Memory issue.

---

## FINDING-GH-007

### Finding
The remaining pivot concepts without a clear single canonical owner are Personal Zero understanding, a general Business Reality model, and Evolution Engine orchestration.

### Why it matters
These are the areas where historical archaeology can still reveal missing reusable mechanisms without duplicating already-owned Trust, Decision, Memory, Rewind or Intelligence systems.

### Evidence
Open/closed issue searches plus owner reconciliation in `CANONICAL-OWNER-MAP.md`.
Existing owners found for adjacent concerns: #640/#761 Trust, #59 Decision, #153 Memory/Knowledge, #293 Rewind, #642 governed convergence, #725 continuity, #72 tenancy.

### Current Titan equivalent
Partial adjacent owners only.

### Classification
UNKNOWN / PARTIAL

### Confidence
MEDIUM-HIGH; further historical and current-code comparison required.

### Related action
Current archaeology phase under #765.


---

## FINDING-GH-010

### Finding
The historical `zero` repository contains a concrete canonical TitanMemory implementation wired to Signal and Rewind, with company-scoped store/recall/forget/summarize/snapshot/context hydration and MCP memory tools.

### Why it matters
This is stronger implementation evidence than branch-name archaeology and is a direct historical precursor to persistent Zero context. It should be compared with #153 rather than resurrected as a second memory system.

### Evidence
Repository: `Masterleeaus/zero`
Commit: `61db48c38d990de010587144cfe601a4b487dd03`
Commit title: `feat: TitanMemory + Process/Signal Contracts + Rewind-Compatible AI Context (Prompt 3)`
Implementation visible in commit diff:
- `App\Titan\Core\TitanMemoryService`
- `VectorMemoryAdapter`
- `MemoryRecallTool`
- `MemoryStoreTool`
- `ProcessContract`
- `SignalContract`
The service explicitly scopes operations by `company_id`, integrates MemoryManager, KnowledgeManager, SessionHandoff, Rewind and audit trail.

### Current Titan equivalent
#153 is the canonical Business Memory/Knowledge owner; #293 owns Rewind/recovery; #642 owns governed engine convergence.

### Classification
HISTORICAL / IMPLEMENTED / PARTIAL

### Confidence
HIGH

### Related action
Support #153 comparison; do not create a parallel TitanMemory runtime.

---

## FINDING-GH-011

### Finding
The historical `zero` repository contains durable business-reality building blocks for premises/site state: structured hazards, site access profiles, occupancy, facilities/assets, inspection history, service events, meter readings/anomaly state and recurring service plans.

### Why it matters
This is concrete evidence that a Business Reality model should probably compose authoritative domain state rather than become a monolithic new “Reality Engine.” The historical implementation shows reality as typed, company-scoped domain records with lifecycle/history.

### Evidence
Repository: `Masterleeaus/zero`
Commit: `70e21c70ddb07ff69571bf616bfa19070c817e4c`
Commit title: `feat: implement facility+asset+inspection+service plan extraction (Stages A-I)`
Verified diff includes:
- `SiteAsset` with lifecycle/condition/service relationships;
- `AssetServiceEvent` history;
- `InspectionInstance`, items/responses/events;
- structured hazard/site-access memory;
- meter thresholds/readings/anomaly flags;
- service plans and generated service visits/jobs;
- pervasive `company_id` scoping in inspected models.

### Current Titan equivalent
Current Dovetails domain/property history is a narrower current reality source. General Titan Zero Business Reality ownership remains unresolved, but this evidence argues for composition over canonical domain/event sources.

### Classification
HISTORICAL / IMPLEMENTED / PARTIAL

### Confidence
HIGH

### Related action
ACTION-GH-001 / ongoing Business Reality owner-resolution scan.


---

## FINDING-GH-008

### Finding
Historical `Masterleeaus/zero` contains an AIOX Memory Intelligence System donor with episodic, semantic, procedural and reflective cognitive sectors, progressive retrieval, attention scoring, privacy scoping and planned correction/outcome learning.

### Why it matters
It is useful evidence for separating what happened, what is true, how work is done and what was learned. Those distinctions can inform canonical Understanding/Experience semantics without creating another memory engine.

### Evidence
Repository: `Masterleeaus/zero`
Branch: `main`
Path: `CodeToUse/AI/AICores/aiox-core-main/docs/guides/MEMORY-INTEGRATION.md`
Document identifies MIS-6 and describes integration with UnifiedActivationPipeline plus future MIS-5 self-learning.

### Current Titan equivalent
#153 canonical Business Memory & Knowledge runtime.

### Classification
HISTORICAL / PARTIAL; likely external AIOX donor lineage requiring provenance/license verification.

### Confidence
HIGH for documented semantics; MEDIUM for Titan-origin lineage.

### Related action
Compare against #153; harvest only superior/licensable semantics.

---

## FINDING-GH-009

### Finding
The same historical AIOX donor specifies a remember → learn → evolve/adapt lifecycle with contextual preferences/rules, saved insights, fitness metrics and rollback points.

### Why it matters
This is a concrete historical mechanism precursor to continuous evolution, while also showing why Evolution must remain separate from authority.

### Evidence
Repository: `Masterleeaus/zero`
Branch: `main`
Path: `CodeToUse/AI/AICores/aiox-core-main/docs/meta-agent-commands.md`
Commands inspected: `remember`, `learn`, `evolve`, `adapt`.

### Current Titan equivalent
Pieces are owned by #153 memory, #59 decision re-evaluation and #293 recovery; no single Evolution orchestration owner has yet been verified.

### Classification
HISTORICAL / SPECIFICATION ONLY or PARTIAL

### Confidence
HIGH for documented design; LOW-MEDIUM for runtime implementation until code/tests are inspected.

### Related action
Use as architecture evidence; do not create a parallel self-modifying engine.


---

## FINDING-GH-010

### Finding
`TitanPro` contains a substantially closer historical precursor to Personal Zero than the AIOX donor: a Titan memory architecture separating session, working, user, company, site and job memory, with explicit conditioning from repeated corrections, approvals and patterns.

### Why it matters
The historical design distinguishes facts from learned operating style. User memory stores preferences/habits/vocabulary/interaction patterns, while conditioning represents learned behavior such as autonomy tolerance, draft preference, review detail and workflow naming. This is directly relevant to Personal Zero understanding.

### Evidence
Repository: `Masterleeaus/TitanPro`
Branch: `main`
Commit/file SHA inspected: `de042fb1a29ebe68054cd58a398dadcf3eb53ea3`
Path: `docs/04-AI/memory-architecture.md`
Sections inspected: Memory Layers; Verified vs inferred memory; Conditioning vs memory; Storage and retrieval; Memory and evaluation; retention/contradiction handling.

### Current Titan equivalent
#153 is the canonical memory/knowledge owner. The new Personal Zero concept is broader than this historical memory architecture and must not become a duplicate memory store.

### Classification
HISTORICAL / SUPERIOR HISTORICAL semantics / PARTIAL precursor

### Confidence
HIGH

### Related action
ACTION-GH-005: compare user/company conditioning semantics against #153 and future Personal Zero projection/orchestration.

---

## FINDING-GH-011

### Finding
The historical Titan memory design explicitly separates verified, inferred, stale and contradicted memory and evaluates recalled context against actual outcomes.

### Why it matters
This is strong Titan-origin evidence for the pivot rule that inferred Personal Zero understanding must not silently rewrite authoritative Business Reality. It also provides an evolution feedback mechanism: recalled context → actual outcome → stale/contradiction detection → refinement.

### Evidence
Repository: `Masterleeaus/TitanPro`
Branch: `main`
Path: `docs/04-AI/memory-architecture.md`
Direct statements include verified/inferred/stale/contradicted categories, replay of recalled memory, comparison to actual outcomes, stale-memory detection and contradiction tracking.

### Current Titan equivalent
#153 provenance/correction/supersession; #50 verified outcome loops; #59 re-evaluation.

### Classification
HISTORICAL / PARTIAL / SUPERIOR HISTORICAL semantics

### Confidence
HIGH

### Related action
Support existing #153/#50/#59 rather than create a parallel learning engine.

---

## FINDING-GH-012

### Finding
Worksuite TitanDocs contains a Titan Operational Memory Model with user, company, site, customer, job and channel scopes plus preference/instruction/relationship/exception/learned-pattern/user-correction categories and explicit verification levels.

### Why it matters
This provides a concrete earlier schema precursor for Personal Zero inputs and business-context memory. It explicitly states that operational memory may influence proposals/defaults/routing but must not silently bypass approvals, permissions, financial controls or compliance rules.

### Evidence
Repository: `Masterleeaus/Worksuite-Saas---Project-Management-System_Laravel`
Branch: `main`
File SHA: `4e0877109bf614a455781804622a6492091cea04`
Path: `TitanDocs/docs/10-reference-architecture/Titan_Operational_Memory_Model.md`

### Current Titan equivalent
#153 is the canonical destination. Historical `tenant_id` is legacy and must normalize to canonical `company_id`; it must not be preserved as a new boundary.

### Classification
HISTORICAL / SPECIFICATION ONLY / PARTIAL precursor

### Confidence
HIGH

### Related action
Compare schema semantics with #153; never import legacy tenancy unchanged.


---

## FINDING-GH-013

### Finding
Cross-agent issue evidence now resolves the previously unknown Business Reality/Evolution ownership gap: issue #767 already defines the canonical convergence target using verified OnboardingPro v6 donor components.

### Why it matters
GitHub archaeology must not create a competing Reality Graph, observation engine, reconfiguration engine or Evolution runtime. Historical GitHub evidence should now be evaluated as supporting/rejecting donor evidence for #767.

### Evidence
Repository: `Masterleeaus/Agent-Mesh`
Issues inspected: #767, #759, #753.
#767 identifies implemented donor components including `ContinuousBusinessObservationService`, `BusinessRealityGraphService`, `BusinessRealityFactService`, `BusinessConfigurationDiffer`, `BusinessReconfigurationService`, Nexus reassessment/provisioning services, consent, outcome measurement and rollback decision services.

### Current Titan equivalent
Canonical convergence action: #767. Read-only trigger/evidence mapping: #759.

### Classification
CURRENT ACTION / HISTORICAL DONOR VERIFIED BY OTHER AGENT

### Confidence
HIGH for issue ownership; donor implementation evidence is attributed to Library archaeology rather than independently recounted as GitHub proof.

### Related action
Support #767 with GitHub lineage evidence only; do not duplicate.

---

## FINDING-GH-014

### Finding
Cross-agent issue evidence resolves the Personal Zero ownership gap: #768 already defines the canonical Understanding + Experience contract convergence target.

### Why it matters
The TitanPro/Worksuite historical conditioning and operational-memory evidence recovered by this GitHub archaeology should support #768 rather than produce a new Personal Zero subsystem or issue.

### Evidence
Repository: `Masterleeaus/Agent-Mesh`
Issue inspected: #768.
Adjacent owners recorded there: Interaction Engine, Intelligence Runtime, #153 Business Memory, #767 Business Reality/Evolution, and Trust/Assurance/Governance/Autonomy/Command Bus.

### Current Titan equivalent
#768 Personal Zero Understanding & Experience contracts.

### Classification
CURRENT ACTION / PARTIAL architecture convergence

### Confidence
HIGH

### Related action
Support #768 with FINDING-GH-010 through FINDING-GH-012.


---

## FINDING-GH-015

### Finding
Historical `Titancore` V1.9 contains a concrete provider-neutral AI gateway and provider registry with local inference support, failover, health checks and usage/cost telemetry.

### Evidence
Repository: `Masterleeaus/Titancore`
Branch: `main`
Paths:
- `TitanCore_V1.9/AI/Providers/provider.json` (SHA `c08a7d54639203d138776afca3e5422df785078e`)
- `TitanCore_V1.9/Services/TitanCoreModelGateway.php` (SHA `f76ae50e96a3ace6ff02932557ccb47c6fc84a67`)

Verified mechanisms:
- registry for OpenAI, Anthropic, Local/Ollama-compatible, TitanAI/MagicAI proxy and null providers;
- local adapter explicitly supports Ollama, LM Studio and llama.cpp without API key;
- explicit provider override/default/failover routing;
- chat + embedding failover chains;
- configurable failure statuses, backoff and circuit breaker;
- provider/model/token/latency usage logging;
- context includes `company_id`, user, agent and feature;
- safe null providers when no usable provider is configured.

### Current Titan equivalent
#647 owns Device/Distributed Intelligence Runtime and Cost Sovereignty; #80 owns final integration/certification.

### Classification
HISTORICAL / IMPLEMENTED DONOR / PARTIAL CURRENT EQUIVALENT

### Confidence
HIGH

### Recovery judgment
Do not resurrect TitanCore's PHP gateway. Compare its proven failover/circuit-breaker/local-provider/null-provider/usage-receipt semantics against #647. Port only missing semantics into canonical TypeScript provider routing.

---

## FINDING-GH-016

### Finding
The historical TitanCore provider manifest is an early concrete Cost Sovereignty precursor, but its routing policy is weaker than current Titan Zero policy.

### Evidence
The local provider has no API-key requirement and cost tracking disabled, while cloud providers support cost tracking and failover. The gateway records provider/model/token/latency metadata.

### Current comparison
#647 is materially stronger: privacy/egress filtering precedes provider selection and mandates the order on-device → local/customer-hosted → BYO → customer service → Titan-managed entitled → explicit metered add-on.

### Classification
HISTORICAL / ALREADY SURPASSED IN POLICY / USEFUL IMPLEMENTATION DONOR

### Confidence
HIGH

### Recovery judgment
Harvest implementation techniques only. Do not downgrade #647's current privacy/cost/authority policy to the older gateway model.


---

## FINDING-GH-017

### Finding
`TitanPro` documents an AEGIS governance precursor with explicit policy/risk/capability/confirmation gates, safe modes, cross-domain contradiction checks, auditable allow/draft/confirm/deny outcomes, and provider-route governance.

### Evidence
Repository: `Masterleeaus/TitanPro`
Branch: `main`
Path: `docs/04-AI/aegis-core.md`
SHA: `8eeda3623ba7e65e8e8220950755a5da344220a1`
Status in source: Draft v1.

### Important recovered semantics
- undeclared capabilities fail closed;
- role, company/tenant, channel, confirmation and cross-domain consistency are checked before execution;
- safe modes include draft-only, explanation-only, no-external-provider, no-customer-comms, no-financial-action and review-all;
- ambiguity biases toward constrained output/confirmation rather than silent execution;
- governance records approvals, denials, escalations, overrides and conflicts.

### Current Titan equivalent
Current Governance/Risk/Assurance/Trust/Autonomy/Command Bus architecture supersedes AEGIS as a standalone authority. Existing Trust convergence includes #640/#761; security identity #302.

### Classification
HISTORICAL / SPECIFICATION / SEMANTIC DONOR

### Confidence
HIGH for documented design; no runtime implementation claim from this file.

### Recovery judgment
Do not resurrect AEGIS as another governance engine. Preserve any missing fail-closed safe-mode, contradiction and explicit denial-reason semantics in canonical governance owners.

---

## FINDING-GH-018

### Finding
Historical `cleanly` architecture already specified a governed signal/backfeed pattern that keeps intelligence informed without giving read-model or advisory systems hidden write authority.

### Evidence
Repository: `Masterleeaus/cleanly`
Branch: `main`
Path: `docs/01-PWA/18-signal-envelope-and-event-backfeed-contract.md`
SHA: `6dc757c77112efb9db5533915f08c8e0e428c33a`

### Important recovered semantics
- offline PWA/outbox replay and idempotency;
- direct/review/deny/stage/split decision classes;
- backfeed enriches read models/intelligence rather than mutating source-of-truth tables;
- AI emits proposals/critiques/summaries/prioritization/anomaly hints, not silent operational writes;
- replay, audit and approval are mandatory;
- execution outcomes become new signals/learning evidence.

### Current Titan equivalent
Signal/Command Bus plus #645 Edge/offline lifecycle and canonical authority engines.

### Classification
HISTORICAL / SPECIFICATION / PARTIAL CURRENT EQUIVALENT

### Confidence
HIGH

### Recovery judgment
Use as lineage evidence for Signal/backfeed/offline semantics; do not create a second event bus.

---

## FINDING-GH-019

### Finding
Historical `cleanly` security architecture contains a detailed device-trust and identity precursor aligned with current Edge Fabric direction.

### Evidence
Repository: `Masterleeaus/cleanly`
Branch: `main`
Path: `docs/01-PWA/24-security-identity-device-trust-and-tenant-boundary.md`
SHA: `8bf4e285832d00295f25bf4ddd2672147f238e20`

### Important recovered semantics
- explicit `company_id` tenant boundary and user_id as actor rather than tenant;
- first-class device identity with key fingerprint, trust, handshake/sync, revocation and risk state;
- device trust states untrusted/registered/verified/high_trust/restricted/revoked;
- high-risk actions may require recent re-authentication, high-trust device or human approval;
- AI/system identities must remain auditable rather than silently impersonating users;
- revocation, token rotation, risky-action re-authentication and replay after restoration without widened access.

### Current Titan equivalent
#645 Edge Fabric and #302 security identity/session/credential hardening.

### Classification
HISTORICAL / SPECIFICATION / CURRENTLY CONVERGING

### Confidence
HIGH

### Recovery judgment
No new issue. Compare these historical trust-state/revocation/re-authentication semantics against #645/#302 and retain only missing details.


---

## FINDING-GH-020

### Finding
Historical `TitanPro` contains concrete vertical configuration evidence for environmental-adjacent field-service capabilities, but not a complete Environmental Intelligence system.

### Evidence
Repository: `Masterleeaus/TitanPro`
Branch: `main`
Path: `config/titan_verticals.php`
SHA: `627c0a60cf06e147677e4a1aa6d9254dfba61d22`

Verified examples include:
- biohazard cleaning: hazard classification, PPE enforcement, chain-of-custody logging, waste-disposal certification and incident documentation;
- pool maintenance: water chemistry, chemical logging and compliance tracking;
- pressure cleaning: chemical-selection logging, water-usage estimation and before/after evidence;
- solar cleaning: weather-gated scheduling and efficiency tracking.

### Current Titan equivalent
#769 owns the canonical Environmental Intelligence capability pack.

### Classification
HISTORICAL / PARTIAL DOMAIN PRECURSOR

### Confidence
HIGH

### Recovery judgment
This evidence strengthens #769's vertical lineage but does not justify a separate environmental engine. Recover useful domain vocabulary/checklist/evidence semantics through canonical Business Reality, Knowledge Authority, Risk, Decision, Workforce and evidence contracts.

---

## FINDING-GH-021

### Finding
Historical `zero` contains a ComplianceIQ donor with immutable evidence digests, tamper verification, RBAC, report review/sign-off, AI summaries and anomaly analysis.

### Evidence
Repository: `Masterleeaus/zero`
Branch: `main`
Paths:
- `CodeToUse/Tenancy/compliance-auditing/ComplianceIQ/README.md` SHA `c7deda650b12783ff902a5372042b6638624ae3b`
- `CodeToUse/Tenancy/compliance-auditing/ComplianceIQ/WORKFLOWS.md` SHA `1fd1083d0785b1edede191a1ae545b946b48ac2f`

Lifecycle: Capture → Evidence Log → Filter → Report → Review → Sign-off.
It stores immutable digests, recomputes hashes for tamper checks, records authorized sign-off, supports read-only Auditor access, and treats AI summary/anomaly analysis as enrichment.

### Current Titan equivalent
#423 owns canonical Compliance/Audit/Governance workforce capability; #430 owns end-to-end certification.

### Classification
HISTORICAL / IMPLEMENTED OR PARTIAL DONOR

### Confidence
HIGH for documented donor behavior; deeper implementation audit remains required before code reuse.

### Recovery judgment
Do not resurrect ComplianceIQ as a parallel audit ledger. Compare tamper-check, sign-off and evidence-digest mechanics against #423's canonical immutable evidence/provenance contracts.

---

## FINDING-GH-022

### Finding
Historical Worksuite contains implemented staff-compliance status logic for verified, expired, expiring and missing mandatory documents.

### Evidence
Repository: `Masterleeaus/Worksuite-Saas---Project-Management-System_Laravel`
Branch: `main`
Path: `Modules/StaffCompliance/Services/ComplianceDashboardService.php`
SHA: `d76dd5581361789ccb509b6b13917ec49a5863e3`

Verified logic computes per-worker expired/expiring/missing document sets and red/orange/yellow/green status.

### Current Titan equivalent
#423 is the broader canonical compliance workforce owner.

### Classification
HISTORICAL / IMPLEMENTED VERTICAL-OPERATIONS DONOR

### Confidence
HIGH

### Recovery judgment
Treat as a narrow operational donor for workforce credential/compliance evidence, not as a governance authority. Any adoption must add canonical `company_id` isolation and current evidence/provenance/authority contracts.


---

## FINDING-GH-023

### Finding
Historical `TitanPro` contains a detailed canonical Unified Inbox design that preserves one cross-channel operational thread while retaining source-channel truth.

### Evidence
Repository: `Masterleeaus/TitanPro`
Branch: `main`
Path: `docs/09-communications/Titan_Unified_Inbox.md`
SHA: `02546d5021ce302043901c4f22a020dead3996b3`

Recovered semantics include:
- `company_id` scoped canonical thread/message models;
- participant identity resolution across customer email/SMS/WhatsApp;
- human, team, AI-triage and approval queues;
- workflow-aware waiting/approval/resolved states;
- AI drafts/suggestions that cannot bypass permissions or approval;
- SLA timers, audit records and Signal events;
- channel engines retain send ownership while inbox owns operator conversation operations.

### Current Titan equivalent
#234 canonical provider-neutral Communications & Channels runtime; #240 certification.

### Classification
HISTORICAL / SPECIFICATION / STRONG SEMANTIC DONOR

### Confidence
HIGH

### Recovery judgment
No separate inbox engine. Compare thread state, assignment/SLA, source-fidelity and audit semantics against #234.

---

## FINDING-GH-024

### Finding
Historical Titan communications architecture already specified purpose-separated consent, policy-driven channel selection, delivery receipts, idempotency, dead-letter handling and provider fallback.

### Evidence
Repository: `Masterleeaus/TitanPro`
Branch: `main`
Path: `docs/01-PWA/21-communications-voice-and-consent-architecture.md`
SHA: `58cac4abb9c3fa76497f6ab626468a3698b8e809`
Corroborating Worksuite document: `TitanDocs/docs/09-communications/Titan_Communications_Orchestration_and_Fallback_Model.md`.

Important semantics:
- separate operational vs marketing consent states;
- consent states unknown/granted/denied/revoked/pending/provider-suppressed;
- policy inputs include customer preference, consent, urgency, cost ceiling, time windows and failure fallback;
- AI may draft/classify/summarize but cannot silently send;
- queue-first delivery, retry, idempotency, dead-letter queue, duplicate suppression, receipt reconciliation and provider health;
- voice session state remains distinct from stateless speech-provider execution.

### Current Titan equivalent
#234/#240 already cover consent, opt-out, quiet hours, provider-neutral routing, voice seams, receipts, retry/dedupe/fallback and Cost Sovereignty.

### Classification
HISTORICAL / SPECIFICATION / CURRENTLY CONVERGING

### Confidence
HIGH

### Recovery judgment
Support #234; do not revive old app ownership names as parallel runtime boundaries.

---

## FINDING-GH-025

### Finding
Historical Titan product architecture contains a customer-continuity capability cluster that is broader than ordinary messaging: intent-to-work routing, complaint/warranty recovery, cross-channel conversation continuity, pre-dispatch readiness, satisfaction prediction and recovery workflow triggering.

### Evidence
Repository: `Masterleeaus/TitanPro`
Branch: `main`
Path: `resources/reference/titan/titan_bos_expanded_script.md`
SHA: `7260a681ac7d9d3a498883bb4729f60743db9d3e`

Examples:
- intent detection for quote, urgent service, repeat booking, complaint recovery and warranty claims;
- conversation continuation across SMS → email → portal → voice;
- pre-dispatch access/pet/electricity/handover readiness;
- satisfaction prediction intended to trigger recovery workflows;
- evidence delivery streams and expectation alignment for relationship continuity.

### Current Titan equivalent
Communications mechanics map to #234. The broader customer relationship/recovery semantics do not yet have a dedicated open issue located in this pass.

### Classification
HISTORICAL / PRODUCT SPECIFICATION / POSSIBLE PARTIAL GAP

### Confidence
HIGH that the capability was specified; LOW-MEDIUM on implementation status.

### Recovery judgment
Do not create an issue yet. Next archaeology should search current Interaction, Hub/customer, Workflow, Workforce and Business Memory owners for semantic equivalence before declaring a lost capability.


---

## FINDING-GH-026

### Finding
The apparent customer-continuity gap in FINDING-GH-025 is not a lost subsystem. Current Agent-Mesh already has a canonical Customer Care, Retention & Rebooking convergence owner.

### Evidence
Repository: `Masterleeaus/Agent-Mesh`
Open issues inspected:
- #363 — canonical Customer Care, Retention & Rebooking workforce capability;
- #370 — end-to-end certification;
- #234 — Communications & Channels;
- #183 — CRM/service lifecycle (referenced by #363);
- #641 — Hub surface delivery;
- #768 — Personal Zero, including Customer Zero context.

#363 explicitly owns callback recovery, expectation updates, complaint intake, service recovery, rebooking, approved retention, churn/rebooking prevention, complaint escalation, repeat-contact prevention and verified customer outcome evidence.

### Historical-to-current mapping
- complaint recovery → #363;
- cross-channel continuity → #234;
- customer/service lifecycle → #183;
- Hub support projection → #641;
- personal customer preferences/appointments/support/approvals → #768 Customer Zero context;
- compensation/refund/discount authority → Finance + canonical effective-authority path.

### Classification
CURRENT EQUIVALENT FOUND / NOT LOST

### Confidence
HIGH

### Recovery judgment
Do not create a customer-continuity runtime or new issue. Historical Titan Hello/Zero Fuss semantics should be treated as product/capability provenance feeding existing owners.

---

## FINDING-GH-027

### Finding
The historical customer-continuity architecture is now demonstrably decomposed into canonical current owners rather than preserved as old application boundaries.

### Why it matters
Old names such as Titan Hello and Zero Fuss described useful operational moments, but reviving those application ownership boundaries would conflict with current architecture. The capability survives through Communications, Interaction/CRM, Workforce Customer Care, Hub and Personal Zero.

### Classification
ARCHITECTURAL CONVERGENCE / HISTORICAL APP BOUNDARIES RETIRED

### Confidence
HIGH

### Recovery judgment
Preserve the capability chain and outcome semantics; retire historical runtime ownership assumptions.


---

## FINDING-GH-028

### Finding
Historical `zero` contains implemented prediction→outcome feedback event semantics, directly supporting the current Personal Zero Experience Memory requirement for prediction calibration.

### Evidence
Repository: `Masterleeaus/zero`
Branch: `main`
Path: `app/Events/Predict/PredictionFeedbackRecorded.php`
SHA: `c08b691fbf788af791055b3a75eebd3a8165e335`

The event explicitly binds a `Prediction` to a `PredictionOutcome`, proving this was represented as a runtime concept rather than only product prose.

### Current Titan equivalent
#768 explicitly requires prediction→outcome linkage/scoring, prediction calibration and Experience Memory. Decision runtime remains adjacent.

### Classification
HISTORICAL / IMPLEMENTED SEMANTIC DONOR / CURRENTLY CONVERGING

### Confidence
HIGH

### Recovery judgment
Recover the typed linkage/calibration semantics into #768/current Decision/Experience contracts. Do not import the old Laravel prediction subsystem wholesale.

---

## FINDING-GH-029

### Finding
Historical `zero` contains an installed ExecutionTimeGraph subsystem providing ordered causal execution history, checkpoints, replay and timing-anomaly analysis.

### Evidence
Repository: `Masterleeaus/zero`
Branch: `main`
Path: `docs/modules/MODULE_06_ExecutionTimeGraph_report.md`
SHA: `109f06369f86e82f7d8679a873479d83ab9d518d`
Source status: Installed.

Verified documented implementation includes:
- persistent ordered execution graphs;
- events for stage transitions, signals, user actions, AI decisions and system triggers;
- parent-linked causal chains;
- named checkpoints;
- replay to a selected time;
- timing-anomaly detection;
- unit and feature tests.

### Current Titan equivalent
#293 owns Reliability/Recovery/Self-Healing and Rewind-related recovery semantics; #768 owns cognitive/experience chronology. Current Signal/Decision paths are adjacent.

### Classification
HISTORICAL / IMPLEMENTED DONOR / STRONG RECOVERY CANDIDATE

### Confidence
HIGH

### Recovery judgment
This is stronger than a generic audit log and deserves semantic comparison against current Rewind/Signal/Decision chronology before retirement. Recover causal-parent, checkpoint and replay semantics if current TypeScript lacks equivalents; never resurrect a parallel TimeGraph authority.

---

## FINDING-GH-030

### Finding
Historical `TitanPro` has implemented company-aware cashflow forecasting, while broader growth/churn intelligence appears at least partially represented as a module.

### Evidence
Repository: `Masterleeaus/TitanPro`
Branch: `main`
Paths:
- `Modules/Accountings/Services/CashflowForecastService.php` SHA `18f5f2b85082b146d84354fdaf6a5fab38fa1545`;
- `Modules/NexusGrowth/module.json` SHA `0a71690619c94807ced047ee34acd396a81c536c`.

Cashflow implementation combines budget inflow/outflow, normalized recurring expenses, outstanding receivables and payables into monthly forecasts and filters company-aware invoice/expense data where `company_id` is available.
NexusGrowth declares funnel analytics, CLV modelling, churn prediction, A/B result views, expansion scoring and ROI reporting.

### Classification
HISTORICAL / IMPLEMENTED FINANCE DONOR + PARTIAL GROWTH CAPABILITY

### Confidence
HIGH for cashflow implementation; MEDIUM for depth of NexusGrowth implementation.

### Recovery judgment
Do not declare these lost yet. Next pass should map finance forecasting and growth/churn analytics against current Finance/Marketing/Decision/Signal owners and only create convergence action for genuinely absent semantics.
