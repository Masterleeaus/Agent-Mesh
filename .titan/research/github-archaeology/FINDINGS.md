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


---

## FINDING-GH-031

### Finding
The historical TitanPro cashflow-forecast capability from FINDING-GH-030 is not a lost standalone subsystem. Current #263 is the canonical Finance/Invoicing/Payments + money-flow owner and explicitly includes cashflow, AR/AP, Cash Control/Cash Position and Cashflow Guardian semantics.

### Historical donor value
`CashflowForecastService` remains useful implementation evidence because it demonstrates a concrete calculation path:
budget inflow/outflow + normalized recurring expenses + outstanding receivables + outstanding payables → monthly forecast.

### Current owner
#263, with #270 certification and #638 Business Value Attribution/ROI adjacent.

### Classification
CURRENT EQUIVALENT FOUND / IMPLEMENTATION DONOR

### Confidence
HIGH

### Recovery judgment
Support #263 with the historical calculation/data-source semantics if current TypeScript forecasting is weaker. Do not recreate the Accountings module.

---

## FINDING-GH-032

### Finding
The historical NexusGrowth capability cluster is substantially covered by current canonical Sales, Customer Care, Marketing and ROI owners rather than requiring a revived NexusGrowth analytics application.

### Mapping
- churn/rebooking prevention → #363 and #716;
- demand/campaign/reputation/attribution → #373;
- pipeline/opportunity/revenue growth → #343;
- verified ROI/value attribution → #638;
- finance/cashflow evidence → #263.

Historical NexusGrowth still provides provenance for funnel visualisation, conversion analytics, CLV modelling, churn prediction, A/B results, expansion scoring and ROI reporting.

### Classification
CURRENT EQUIVALENTS FOUND / HISTORICAL PRODUCT BOUNDARY RETIRED

### Confidence
HIGH for ownership mapping; MEDIUM on exact parity of every historical analytic.

### Recovery judgment
Do not resurrect NexusGrowth. During implementation/certification of #343/#363/#373/#638, compare exact historical analytics and recover any missing metric or prediction semantics into those owners.

---

## FINDING-GH-033

### Finding
The current roadmap already expresses predictive workforce behavior as governed capability progression rather than a separate prediction authority.

### Evidence
#343, #363 and #373 require proactive/autonomous/predictive behavior to remain inside Goal42 trust/autonomy and authority ceilings. #716 registers churn prevention, missed-revenue recovery, Cashflow Guardian and other innovation capabilities through the canonical Workforce/capability registry.

### Classification
CURRENT ARCHITECTURE / CONVERGENCE CONFIRMED

### Confidence
HIGH

### Recovery judgment
Historical prediction modules are evidence/algorithm donors. Prediction confidence never grants execution authority; consequential actions still require canonical effective authority, Risk/Assurance/Governance and Command Bus.


---

## FINDING-GH-034

### Finding
Titan Builder contains a modern TypeScript transactional file-operation implementation with precondition hashes, rollback snapshots, backup journals and automatic rollback on partial failure.

### Evidence
Repository: `Masterleeaus/Titan-Builder`
Branch: `main`
Path: `src/operations/index.ts`
Current search revision: `3163e9724cd6640e1b39a913d883f5aad139ba40`

Verified implementation includes:
- stateful operation planning against virtual snapshots;
- hash/kind preconditions checked immediately before mutation;
- transaction journals with prepared/applying/committed/rolling_back/rolled_back/rollback_failed states;
- per-target and parent snapshots;
- file backups;
- automatic rollback after operation failure;
- rollback failure evidence;
- project-root/path/symlink safety checks;
- explicit tracking of possible external effects.

### Current Titan equivalent
#14 owns canonical governed execution graph, failure/retry and idempotent compensation; #293 owns shared reliability/recovery/Rewind. Titan Builder is private development tooling and must not become a production dependency.

### Classification
CURRENT PRIVATE DEVELOPMENT IMPLEMENTATION / SEMANTIC DONOR

### Confidence
HIGH

### Recovery judgment
Harvest transactional invariants and test patterns only where production TypeScript execution lacks them. Do not connect Titan Builder runtime to Titan Zero production.

---

## FINDING-GH-035

### Finding
Historical TitanCore implemented two distinct rollback patterns: per-tool compensating rollback and pre-upgrade DB/file snapshot restoration.

### Evidence
Repository: `Masterleeaus/TitanPro`
Branch: `main`
Paths:
- `Modules/TitanCore/Contracts/AI/ToolRollbackContract.php` SHA `0e41792ff3e73ccb0c91baf66832dc49dfccf8de`;
- `Modules/TitanCore/Services/Upgrade/UpgradeRollbackRunner.php` SHA `8870d4d5168a66514a9c25b438a26c7e9a223503`.

The tool contract receives original parameters plus execution result to locate/reverse a specific side effect. Upgrade rollback restores snapshotted DB rows and source files.

### Current Titan equivalent
#14 explicitly owns idempotent compensation for reversible actions and terminal handling for irreversible failures. #293/#300 own shared recovery, backup/restore verification and certification. #330 covers deployment/upgrade/rollback runbook certification.

### Classification
HISTORICAL / IMPLEMENTED DONOR / CURRENT EQUIVALENT FOUND

### Confidence
HIGH

### Recovery judgment
Compare compensation metadata and snapshot-restore receipts against #14/#293. Do not revive PHP rollback authority.

---

## FINDING-GH-036

### Finding
Historical `zero` process configuration explicitly linked lifecycle state, approval checkpoints, audit-on-every-transition and memory snapshots to Rewind eligibility.

### Evidence
Repository: `Masterleeaus/zero`
Branch: `main`
Path: `config/titan_process.php`
SHA: `91fe151b0b94cd8704b3cd0933001dbabb4bf7ba`

Verified semantics:
- canonical tenant key was already `company_id`;
- processed state can enter rewinding;
- approval checkpoints are explicit lifecycle states;
- every transition can emit Signal and audit evidence;
- process completion can create a TitanMemory snapshot specifically for rewind-compatible checkpoints.

### Current Titan equivalent
#14 execution graph/compensation, #293 Rewind/recovery, #642 governed engine convergence and #560 E2E certification.

### Classification
HISTORICAL / STRONG REWIND LINEAGE

### Confidence
HIGH

### Recovery judgment
Preserve the relationship between governed lifecycle transitions, evidence, checkpoints and rewind. Current architecture should keep memory/knowledge ownership separate from recovery snapshots; a recovery checkpoint must not become a second memory authority.


---

## FINDING-GH-037

### Finding
The historical `clean` Phase 2/3/4 branches are not stranded branch-only work: their implementation is present on `clean/main`, and the repository's own completion record marks all three phases merged to main.

### Evidence
Repository: `Masterleeaus/clean`
Branch: `main`
Completion record: `.titan/documentation/status/phase-completion.md` SHA `baca0717fde6dacd1a4c20c6bfc83b2310762341`.

Verified main-tree implementations include:
- Phase 2 Knowledge: `KnowledgeGraphBuilder`, `ConstitutionEnforcer`, `ArchitecturalDriftDetector`;
- Phase 3 Execution: `AgentTeamManager`, `OwnershipLockManager`, `BranchWorkflowManager`;
- Phase 4 Safety: `ResourceLimitManager`, `SecurityPolicyEnforcer`, `AuditLogger`, `RateLimiter`, `RecoveryManager`.

### Classification
MERGED HISTORICAL IMPLEMENTATION / NOT LOST

### Confidence
HIGH

### Recovery judgment
Do not recover the phase branches themselves. Treat `clean/main` as the donor source when a current Titan Zero owner has a verified implementation gap.

---

## FINDING-GH-038

### Finding
`clean/main` contains a durable execution/checkpoint precursor with integrity hashes, execution traces, task evidence and checkpoint selection for rollback.

### Evidence
Repository: `Masterleeaus/clean`
Path: `app/TitanOS/Foundation/DurableExecution/DurableExecutor.php`
SHA: `f1a79251758382c4432fb33178307727c8d4152c`.

Verified semantics:
- checkpoint IDs and execution IDs;
- state + evidence captured together;
- SHA-256 integrity verification before restore;
- per-execution checkpoint trace;
- completed-task evidence;
- rollback target selection and rollback audit record.

Important limitation: its `rollback()` records the target checkpoint but does not itself restore business side effects. It is therefore evidence/checkpoint lineage, not sufficient production Rewind authority.

### Current Titan equivalent
#14 owns persisted/resumable execution and compensation; #293 owns canonical recovery/Rewind; #560 certifies end-to-end recovery.

### Classification
HISTORICAL / IMPLEMENTED DONOR / PARTIAL REWIND PRECURSOR

### Confidence
HIGH

### Recovery judgment
Harvest checkpoint integrity/evidence/trace tests where missing. Do not port its rollback semantics as complete Rewind.

---

## FINDING-GH-039

### Finding
`clean/main` also contains an implemented savepoint/recovery strategy manager covering timeout, deadlock, constraint violation, resource exhaustion and unknown failures.

### Evidence
Repository: `Masterleeaus/clean`
Path: `app/TitanOS/Safety/Recovery/RecoveryManager.php`
SHA: `812924be803669b56b670b3fed57e42bb10a22a4`.

It provides savepoint creation/commit/rollback plus scenario-specific recommended actions such as release locks, rollback, retry with backoff, validate state, notify operator, cleanup and throttle.

### Current Titan equivalent
#293 already owns shared failure classification, retry/backoff, containment, dead-letter/recovery, self-healing and Rewind. #14 owns action compensation.

### Classification
HISTORICAL / IMPLEMENTED RECOVERY DONOR / CURRENT OWNER EXISTS

### Confidence
HIGH

### Recovery judgment
Compare failure taxonomy and deterministic recovery-strategy tests against #293. Do not revive `RecoveryManager` as a parallel runtime.

---

## FINDING-GH-040

### Finding
The `clean` Execution Control implementation is also lineage for today's Agent Mesh claim/isolation workflow: it implemented per-agent ownership locks and branch-per-agent coordination before the current GitHub issue-claim system.

### Evidence
Repository: `Masterleeaus/clean`
Paths include:
- `app/TitanOS/Execution/OwnershipLocks/OwnershipLockManager.php` SHA `78dd5b8e9c8a32bc1aa35bfd64d881042343bd25`;
- `app/TitanOS/Execution/BranchWorkflows/BranchWorkflowManager.php`;
- Phase 3 completion evidence in `.titan/documentation/status/phase-completion.md`.

Verified lock semantics include holder identity, TTL/expiry, renewal, conflict detection and force release.

### Classification
HISTORICAL DEVELOPMENT-ORCHESTRATION LINEAGE / NOT TITAN ZERO BUSINESS RUNTIME

### Confidence
HIGH

### Recovery judgment
Keep this separate from Titan Zero production Workforce/authority. It may inform Agent Mesh development coordination only; it must not be imported as customer runtime authority.


---

## FINDING-GH-041

### Finding
The long-unresolved Worksuite branch `copilot/integrate-aichatpromemory-v1-2` is confirmed as a highly stale donor branch (1 commit ahead / 559 behind main), and its visible AIChatProMemory payload is a small MagicAI personal-instructions extension rather than a sophisticated longitudinal memory engine.

### Evidence
Repository: `Masterleeaus/Worksuite-Saas---Project-Management-System_Laravel`
Branch: `copilot/integrate-aichatpromemory-v1-2`
Compare against main:
- status: diverged;
- ahead: 1;
- behind: 559;
- merge base: `e1d359c49e3893dc7546eef8af46e1cad5fc6289`.

Direct donor files inspected:
- `extension.json` SHA `dab88ad24cf2c46762b4caa9a63c7678a44e9094`;
- `AIChatProMemoryServiceProvider.php` SHA `3b4e2c78ef06e3f3dffeb378ef94614069cff36d`;
- `AIChatProMemoryController.php` SHA `0700cf8f412ad17bb91e51fd5ba23ad9e9ac157f`;
- `UserChatInstruction.php` SHA `e620791dd505a0a8c8cd01a39eaae7787f808af4`;
- migration SHA `ffcdcd3484ccad6e14b7d8ba0684689ee5f5e2e6`.

### Verified capability
The extension stores a per-user/per-chat-category free-text instruction override, exposes get/save/clear routes, falls back to category/admin instructions, supports unauthenticated guest state keyed by IP, and deletes old guest instructions after 90 days.

### Security/architecture concerns
- no `company_id` boundary;
- guest identity is IP-address based;
- no provenance/confidence/freshness/supersession model;
- no Experience Memory tuple;
- no outcome learning;
- no authority separation beyond chat ownership check;
- tied to MagicAI chat/category models.

### Classification
STALE BRANCH / LIMITED DONOR / NOT A LOST PERSONAL ZERO MEMORY ENGINE

### Confidence
HIGH

### Recovery judgment
Do not merge or directly import this branch. The only useful semantic is explicit user-controlled instruction/preference override with clear/reset behavior. That is already conceptually covered by Personal Zero Understanding Memory (#768) and should be implemented through current TypeScript identity/privacy/company-context contracts rather than this extension.

---

## FINDING-GH-042

### Finding
The historical name “AIChatProMemory” materially overstates the donor's actual capability: it is instruction persistence, not memory learning.

### Why it matters
Archaeology must classify mechanisms by implemented behavior rather than repository/branch names. Treating this extension as a memory engine would introduce false lineage and could incorrectly justify a parallel Personal Zero memory subsystem.

### Classification
ARCHAEOLOGY CORRECTION / FALSE-POSITIVE ELIMINATED

### Confidence
HIGH


---

## FINDING-GH-043

### Finding
The available GitHub connector does not expose a tag/release enumeration endpoint, so release archaeology cannot safely infer repository tags from commit-message searches. However, first-party version/changelog artifacts inside several repositories provide recoverable release-line evidence and should be treated as secondary release evidence, not as proof that a Git tag exists.

### Verified release-line evidence
- Titan Builder main package/bridge/extension identify version `0.5.0`.
- AI Coding Studio's authoritative changelog records Pass 02 as version `2.1.0`.
- TitanPro contains module-level release histories including TitanNexus `0.19.0`, Dispatch versions through `1.1.0` plus hardening passes, and CallingAgent through `1.0.12`.

### Classification
RELEASE ARCHAEOLOGY / PARTIAL EVIDENCE

### Confidence
HIGH for file-declared versions; UNKNOWN for corresponding Git tags/releases.

### Recovery judgment
Do not fabricate tag history. Continue using version manifests/changelogs and strategic commits as evidence until an actual refs/releases endpoint or independent repository checkout is available.

---

## FINDING-GH-044

### Finding
TitanPro module changelogs preserve useful capability milestones that are easy to miss when scanning only current source names.

### Evidence
`Modules/TitanNexus/CHANGELOG.md` SHA `3180f19f92813ed8dd5aa44cb3be844c84b9a228`:
- version 0.19.0;
- MarketingAgent nativeized with invoice, payment and job tools;
- production manifests, migrations, mail templates, workflows and control-panel convergence.

`Modules/Dispatch/CHANGELOG.md` SHA `c74ac901abdba98ac22e5e86b7a2b490e4da9862`:
- technician schedule conflict validation;
- rescheduling;
- dispatch KPI summary;
- standalone work orders/appointments;
- route recalculation;
- guarded assignment transitions;
- SLA policies/checklists/exceptions and breach sweep.

`Modules/CallingAgent/CHANGELOG.md` SHA `6dd31999e7686767cd6cc8a7734574ba0e39082e`:
- provider abstraction for telephony/STT/TTS/realtime voice/channels;
- realtime sessions/turn-taking/media relay;
- receptionist pipeline;
- caller memory;
- structured outcome extraction;
- persona resolver;
- transfer trees;
- missed-call recovery;
- calendar federation;
- SIP bridge;
- provider failover/full-duplex helpers.

### Classification
HISTORICAL RELEASE-LINE CAPABILITY EVIDENCE

### Confidence
HIGH

### Recovery judgment
These are high-value inputs for later Workforce/Field Ops/Communications passes. Changelog claims must still be verified against implementation before classifying a capability as recoverable code.

---

## FINDING-GH-045

### Finding
AI Coding Studio's own release history confirms the intended architectural boundary now used for Titan Code: private/local development orchestration over mature tools, with a fail-closed approval policy and versioned Local Bridge, rather than a Titan Zero production runtime.

### Evidence
Repository: `Masterleeaus/AI-Coding-Studio`
Path: `CHANGELOG.md`
SHA: `3ee7ea91220d27a569cd2777a16a3d3aacf2434d`.

Pass 02 records:
- removal of disconnected module-wrapper architecture;
- production-imported Runtime Kernel;
- structured command results;
- fail-closed approval;
- versioned Local Bridge protocol;
- allowlisted command catalog;
- timeout/cancellation/unavailable-state behavior;
- tool registry for Git/GitHub CLI/VS Code/PowerShell/Node/npm/PHP/Composer/Python/Docker/7-Zip/ripgrep/Playwright/MySQL;
- repository-runtime delegation and workflow definitions;
- version 2.1.0.

### Classification
CURRENT PRIVATE DEVELOPMENT LINEAGE / TITAN CODE BOUNDARY CONFIRMED

### Confidence
HIGH

### Recovery judgment
Use this later when converging Titan Code itself, but never make Titan Zero Base App depend on AI Coding Studio/Titan Code runtime.


---

## FINDING-GH-046

### Finding
TitanPro CallingAgent 1.0.12 release claims are backed by real implementation files, but several are lightweight precursors rather than production-complete subsystems.

### Direct implementation verified
Repository: `Masterleeaus/TitanPro`, `Modules/CallingAgent`.

- `CallerProfileMemory.php` SHA `9fb66fd85f68daaa6ca28b82dbf2d55b0c5245c9`: in-memory caller profile recall keyed by phone/email, last outcome and tags.
- `OutcomeExtractionPipeline.php` SHA `15c7f48dccbc98e9d5a3c1af96f30386623d8f3a`: deterministic transcript classification for intent, urgency, lead quality, handoff, sentiment, entities and next actions.
- `MissedCallRecoveryPipeline.php` SHA `13a5668c5713cd42745fc474e4f36240670ef665`: builds SMS, callback and voicemail-summary recovery steps.
- `ProviderFailoverManager.php` SHA `dd57494445424d177281a6709c528d1aeeb17b33`: chooses preferred/healthy/quota-available provider per layer.
- `SipBridgeService.php` SHA `aadb5947843d84e3e49889ea0ff3e39e21183cf5`: normalizes SIP destination and builds credential-aware bridge plans.
- `PersonaResolver.php` SHA `829346ed56ab97b069f2156d288df24328763f05`: resolves industry receptionist persona and returning-caller greeting.
- `CalendarProviderManager.php` SHA `7ddb43cf0339782d9a42199fa9ee2023a50a7850`: Google/Outlook/CalDAV provider selection for availability and booking.

### Limitations
The caller-memory implementation shown here is process-local memory, not durable governed Personal Zero/Business Memory. The outcome extractor is heuristic/rule-based. Provider failover lacks the full current Cost Sovereignty/privacy/egress/authority decision envelope. SIP returns a bridge plan rather than proving end-to-end telephony execution.

### Classification
IMPLEMENTED HISTORICAL DONOR / MIXED MATURITY

### Confidence
HIGH

---

## FINDING-GH-047

### Finding
CallingAgent's strongest recoverable value is not its old module boundary; it is a set of concrete communications/reception mechanisms that map into current canonical owners.

### Current owner mapping
- voice/channel/provider/SIP/failover mechanics → #234 Communications & Channels;
- receptionist persona, transfer routing and customer access → #333 Reception & Customer Access;
- missed-call callback/recovery → #333 and #363 Customer Care/Retention;
- sales/lead outcome signals → #343 Sales & Revenue Growth;
- caller preferences/history must converge through #153 Business Memory and/or #768 Personal Zero where appropriate, rather than a CallingAgent-owned memory silo;
- provider selection must respect #647 Cost Sovereignty/device/provider routing where AI/provider choice is involved.

### Classification
CONVERGE / DO NOT RESTORE CALLINGAGENT AS PARALLEL AUTHORITY

### Confidence
HIGH

### Recovery judgment
Directly port/harden only superior missing mechanisms behind current TypeScript contracts. Preserve `company_id`, consent, communication authority, privacy/egress, idempotency and audit. Do not import legacy `TenantContext` as a second tenancy boundary.

---

## FINDING-GH-048

### Finding
The historical missed-call recovery mechanism is a particularly reusable workflow seed: unanswered/busy/failed calls can produce bounded recovery steps for SMS, callback scheduling and voicemail summarisation.

### Why it matters
This closes a practical operational loop between Reception, Communications and Customer Care without requiring a separate CallingAgent product/runtime.

### Current owners
#234, #333, #363.

### Classification
RECOVER/HARDEN SEMANTICS INTO EXISTING OWNERS

### Confidence
HIGH


---

## FINDING-GH-049

### Finding
TitanPro Dispatch release-line claims are backed by real scheduling, rescheduling, KPI and SLA/checklist/exception implementation, making Dispatch a verified donor rather than documentation-only history.

### Direct implementation verified
Repository: `Masterleeaus/TitanPro`, `Modules/Dispatch`.

- `Actions/Update/RescheduleDispatchAppointmentAction.php` SHA `cd7d6b19135a5591964d71d649740e50afb1cc7c`: rebuilds a schedule window, validates the target technician/window, updates appointment + work order and emits `WorkOrderScheduled`.
- `Services/Analytics/DispatchKpiService.php` SHA `a91252721abe6be8147a392b7f397bc33579f15b`: reports work-order and appointment counts/statuses over a date window.
- `Database/Migrations/2026_05_13_000700_create_dispatch_quality_and_sla_tables.php` SHA `f7c957e336fc9b1dc5ad6f1cbd99a367fa69c2d9`: company-aware SLA policies, work-order checklists/items and dispatch exceptions.
- API routes expose technician recommendations, schedule, appointment reschedule, assignment status, route build and route resequence.

### Classification
IMPLEMENTED HISTORICAL DONOR / CURRENT OWNER EXISTS

### Confidence
HIGH

---

## FINDING-GH-050

### Finding
The canonical current owner for historical Dispatch capability is #353 Scheduling, Dispatch & Capacity, with #360 certification and #183 service-execution lifecycle adjacent. Therefore the old Dispatch module boundary should be retired while superior mechanics are compared and converged.

### Capability mapping
- schedule conflict/window validation → #353;
- reschedule + work-order state update → #353 + #183;
- technician recommendation/assignment → #353;
- route build/resequence/recalculation → #353;
- capacity/KPI signals → #353 and current intelligence/signal paths;
- SLA policies/exceptions → #353 plus canonical Risk/Assurance/Governance where consequential;
- field checklist projection → service lifecycle / Go surface rather than Dispatch-owned UI.

### Classification
CONVERGE / DO NOT RESTORE DISPATCH AS PARALLEL DOMAIN

### Confidence
HIGH

### Recovery judgment
Compare the donor implementation against current TypeScript #353 before deletion. Recover only missing/superior mechanics behind canonical schedule/job/worker contracts.

---

## FINDING-GH-051

### Finding
The historical Dispatch schema already used `company_id` for SLA/checklist/exception records, but allowed it to be nullable. Current Titan Zero must harden this lineage: business-scoped dispatch state requires the canonical `company_id` boundary and must fail closed rather than silently become global.

### Classification
HARDEN DURING CONVERGENCE

### Confidence
HIGH


---

## FINDING-GH-052

### Finding
TitanPro contains a coherent historical precursor for today's Model Council: selective specialist participation, sequential/parallel/hybrid reasoning, explicit context-sensitive weighting, structured critique, convergence detection, disagreement exposure and escalation.

### Evidence
Repository: `Masterleeaus/TitanPro`, branch `main`.

`docs/04-AI/orchestration.md` SHA `f0acf3476a6edb171181f39b733938007e092c62` defines:
- selective specialist participation rather than invoking every core;
- sequential, parallel and hybrid orchestration;
- context-dependent weights;
- bounded critique;
- convergence/non-convergence conditions;
- escalation to confirmation, draft-only, human review, denial, more context or expanded participation;
- audit of participants, sequence, weights, critiques, convergence and fallback;
- explicit cost/latency discipline.

`docs/04-AI/weighting-and-consensus.md` SHA `bda664184804597402412007d1d8cc85f1cc01a5` defines:
- action, risk, confidence, evidence and presentation consensus;
- risk-dependent consensus thresholds;
- dominant/supporting cores, critique summary, agreement strength and unresolved conflicts;
- replayability from the same context, participants, weights, critique flow and governance state.

### Classification
HISTORICAL ARCHITECTURE / STRONG MODEL COUNCIL SEMANTIC DONOR

### Confidence
HIGH

---

## FINDING-GH-053

### Finding
The historical multi-core design already contains the key separation required by the current Titan Zero pivot: consensus is reasoning alignment, not permission, and specialist/model confidence must never create execution authority.

### Evidence
The weighting/consensus design explicitly states that governance may still require review, draft-only mode, denial or capability blocking even when consensus is strong. Specialist cores reason; governance governs; provider routing remains separate.

### Current owner
Current Agent-Mesh issues #642 and #80 explicitly include Model Council in canonical engine/intelligence convergence. #633 is the Library AI/Decision/Intelligence convergence owner.

### Classification
CURRENT PRINCIPLE CONFIRMED / CONVERGE INTO EXISTING MODEL COUNCIL

### Confidence
HIGH

### Recovery judgment
Do not recreate historical Logic/Finance/Creator/Entropy cores as separate authorities. Recover their useful roles as council lenses/participants only where the current Model Council lacks equivalent challenge, domain weighting or uncertainty semantics.

---

## FINDING-GH-054

### Finding
TitanPro's historical Evaluation design provides a strong feedback loop for Model Council refinement without violating the rule that learning is not authority.

### Evidence
`docs/04-AI/evaluation.md` SHA `c3b72fd0b538ec3fe7463a508e3b83957e4dafd6` evaluates:
- reasoning/factual/governance/routing/consensus/outcome quality;
- hallucination and consistency risk;
- accepted/edited/rejected/rework/business outcome signals;
- whether core weighting correlated with good or bad outcomes;
- whether disagreements predicted real review needs;
- refinement suggestions for routing, weighting, memory and governance thresholds.

### Classification
HISTORICAL EVALUATION / EXPERIENCE-LEARNING DONOR

### Confidence
HIGH

### Recovery judgment
Outcome evidence may refine future council participation/weights, but changes must remain governed, explainable and reversible. Evaluation cannot grant authority.

---

## FINDING-GH-055

### Finding
Historical Model Routing already separated cognitive participation from provider/model execution and anticipated privacy-first local/server/external routing, redaction, fallback and cost/latency policy.

### Evidence
`docs/04-AI/model-routing.md` SHA `04a4a2cabdee5eebb54074b2e6cb94d2e1cc55bf`.

It describes private/client node → server node → approved external frontier routes, privacy constraints, cost envelopes, latency/channel fit, redaction/minimisation, traceable fallback and provider execution remaining in Titan Core.

### Current owner
#647 now provides the stronger canonical Cost Sovereignty/device/provider routing direction.

### Classification
HISTORICAL PRECURSOR / CURRENT OWNER STRONGER

### Confidence
HIGH


---

## FINDING-GH-056

### Finding
AI Coding Studio contains a strong security-contract precursor for the private Titan Code Local Bridge, including a versioned JSON protocol, authoritative command/risk catalogue, repository scoping, trusted host approval verification, bounded execution and secret filtering.

### Evidence
`Masterleeaus/AI-Coding-Studio`, `docs/agents/agent-2-local-bridge-report.md`, SHA `50e8efe6f69abd891b9a523a94627161efc541e9`.

Verified reported implementation under `src/runtime/local-bridge/` includes:
- browser-safe protocol/catalogue/registry;
- READ / SAFE_EXECUTION / WRITE / DESTRUCTIVE / PUBLISH risk classes;
- no shell fallback;
- caller cannot downgrade registered risk;
- non-read commands fail closed without trusted host approval verification;
- repository IDs instead of caller-provided absolute paths;
- Windows/POSIX path containment;
- timeout/cancellation/output limits;
- bounded redacted operation logs;
- secret-file ingestion filtering.

The report also explicitly records that transport/process adapters were deliberately deferred at that pass and that some earlier terminal/tool runtimes simulated success.

### Classification
PRIVATE DEVELOPMENT SECURITY/LOCAL-BRIDGE DONOR

### Confidence
HIGH

### Boundary
This is Titan Code development lineage only. It must not become a Titan Zero Base App runtime dependency.

---

## FINDING-GH-057

### Finding
Titan Builder/OpenBrowser has a more mature browser-to-local development architecture that uses browser AI subscriptions as an interaction/provider surface while retaining filesystem and execution authority in a local Node runtime.

### Evidence
`Masterleeaus/Titan-Builder`, `pid.md`, SHA `410f437b09ca268f813268d0db4016a8a4576023`.

The architecture provides:
- Chrome extension provider adapters for ChatGPT, Claude, Gemini, DeepSeek and others;
- local Fastify/SSE bridge;
- project context and @file/folder attachments;
- structured AI response parsing;
- diff preview before file operations;
- local filesystem execution;
- project memory/history;
- long-prompt attachment fallback;
- local-first/no proprietary API-key requirement for browser AI interaction.

Current Titan Builder source/search evidence further shows an authenticated loopback bridge, separate browser/control credentials, one-time operation approvals, operation precondition hashes and rollback journals.

### Classification
CURRENT PRIVATE DEVELOPMENT IMPLEMENTATION / STRONG TITAN CODE DONOR

### Confidence
HIGH

---

## FINDING-GH-058

### Finding
The strongest convergence path for Titan Code is not to merge AI Coding Studio and Titan Builder wholesale. AI Coding Studio contributes hardened command/approval/repository-ingestion contracts; Titan Builder contributes the more complete browser/local execution workflow.

### Convergence rule
Use one private Titan Code authority:
- browser extension: provider interaction, prompt delivery/response capture, thin UI;
- local runtime: repository/filesystem/tool/process authority;
- authenticated loopback boundary;
- explicit risk catalogue + one-time/trusted approvals;
- project containment and realpath/symlink checks;
- transactional preview/apply/rollback;
- secret/context filtering;
- provider adapters replaceable independently.

### Classification
PRIVATE DEVELOPMENT CONVERGENCE

### Confidence
HIGH

### Boundary
Do not connect this private development authority directly to Titan Zero production. A future Titan Browser Node must expose only hardened production contracts through Command Bus/node protocol.

---

## FINDING-GH-059

### Finding
Historical browser-AI integration demonstrates a practical no-API development path, but this is not equivalent to local-model execution.

### Evidence
Titan Builder's OpenBrowser architecture sends project context through supported browser AI sites and captures their responses. AI Coding Studio also has browser adapters and Local Bridge contracts. This can reduce direct API dependence for the owner's development workflow.

### Important distinction
“Local Bridge” means local tool/filesystem execution and transport. It does not itself prove that the reasoning model is local. Local Ollama/model execution must be verified separately.

### Classification
CAPABILITY DISTINCTION / FALSE-CONFLATION PREVENTION

### Confidence
HIGH


---

## FINDING-GH-060

### Finding
A targeted archaeology pass does **not** verify a working Ollama/LM Studio/local-inference adapter inside current AI Coding Studio or Titan Builder/OpenBrowser. Their implemented “local” capability is primarily local tool/filesystem/bridge execution while reasoning is routed through browser AI providers.

### Evidence
- AI Coding Studio searches for Ollama/local inference yielded no concrete Ollama/LM Studio runtime adapter; its Local Bridge report describes local command/tool contracts rather than model inference.
- Titan Builder provider UI/runtime currently enumerates browser providers such as ChatGPT, Claude, Gemini, DeepSeek, Perplexity, GLM and Grok.
- Titan Builder architecture explicitly describes the extension sending work to browser AI pages while the local Node runtime retains project/tool authority.

### Classification
VERIFIED GAP / TERMINOLOGY CORRECTION

### Confidence
HIGH

---

## FINDING-GH-061

### Finding
Local-model execution remains a canonical Titan Zero capability, but its current ownership is outside the private browser bridge implementation.

### Evidence
Current Agent-Mesh issues:
- #647 Consolidated Device / Distributed Intelligence Runtime includes Ollama/local-model and Cost Sovereignty direction.
- #80 integrates/tests Intelligence Runtime and Local Bridge concerns.
- #645 Edge Fabric provides adjacent device/node ownership.
- #649 owns Titan Code browser convergence/personal AI workforce.

Historical TitanPro product material also explicitly names BYO providers, Ollama and local models, but this is product/architecture evidence rather than proof of the Titan Code local-inference implementation.

### Classification
CURRENT OWNER EXISTS / IMPLEMENTATION PARITY REQUIRES SEPARATE CHECK

### Confidence
HIGH

---

## FINDING-GH-062

### Finding
Titan Code should support two distinct reasoning routes without conflating their trust/cost/privacy properties:

1. **Browser-provider route** — ChatGPT/Claude/Gemini/etc. through the hardened browser bridge.
2. **Local-model route** — Ollama/other approved customer/owner-hosted inference through an explicit local model adapter.

Both may share project-context preparation and governed tool execution, but provider/model routing must remain separable from tool authority.

### Classification
PRIVATE DEVELOPMENT ARCHITECTURE GAP / CONVERGENCE REQUIREMENT

### Confidence
HIGH

### Boundary
For Titan Zero production, the corresponding provider choice belongs to canonical Intelligence Router/Cost Sovereignty (#647), not Titan Code.


---

## FINDING-GH-063

### Finding
TitanNexus 0.19.0 genuinely contains a broad MarketingAgent capability catalogue, but direct handler inspection shows mixed maturity: several finance/job tools are declarative or draft-stage wrappers rather than complete business integrations.

### Verified capability surface
`Modules/TitanNexus/Agents/MarketingAgent/agent.manifest.json` SHA `c54f5dc98a8a91e36bc132c611e6f69fdd76fd3e` owns target discovery, lead enrichment, campaign strategy, outreach generation, follow-up sequencing, qualification and booking handoff, with explicit human approval for sending email/SMS, launching campaigns and booking handoff.

`Modules/TitanNexus/module.json` SHA `3cbe78954ed770d80bb2cf203adaed035687559c` additionally advertises late-invoice follow-up, payment assist, job assist and omnichannel orchestration.

### Direct handler reality
- InvoiceFollowupTool SHA `4fd787b5b87217402fbab99a5e865007ec578676`: returns input plus description/approval flag; no demonstrated invoice-system mutation.
- PaymentLinkTool SHA `84b60320afc57d0376d0f18994a8e57e54e43e68`: returns input plus description/approval flag; no demonstrated payment-provider call.
- PaymentPlanTool SHA `7e43816e3831f051921819701afe60d77982a279`: human-approvable draft wrapper.
- JobStatusAssistTool SHA `4c6957e23d35ab4802f976ce54ebd1318f1e5983`: draft message wrapper.
- LeadScoringTool SHA `293faed545562e78bdf23932a409f8e4d0fb4117`: returns draft/approval-required envelope rather than a demonstrated scoring algorithm.

### Classification
MIXED-MATURITY DONOR / DO NOT EQUATE MANIFEST WITH IMPLEMENTATION

### Confidence
HIGH

---

## FINDING-GH-064

### Finding
TitanNexus's strongest recoverable semantics are workflow boundaries and approval-aware tool contracts, not the thin handler implementations.

Useful semantics include:
- discovery → enrichment → scoring/qualification → outreach → follow-up → booking handoff;
- explicit approval before external communications/campaign launch/booking handoff;
- overdue-invoice follow-up as a staged/draft action;
- payment-plan suggestion separate from payment execution;
- job-status communication derived from the canonical job source of truth.

### Current owner mapping
- lead discovery/scoring/qualification → #343 Sales & Revenue Growth;
- campaigns/outreach → #373 Marketing;
- booking/service handoff → #183 service lifecycle and relevant scheduling/reception owners;
- invoice/payment follow-up → #263 Finance/Invoicing/Payments;
- customer/job communications → #234 Communications and #363 Customer Care;
- ROI/value attribution → #638.

### Classification
CONVERGE SEMANTICS / RETIRE TITANNEXUS DOMAIN OWNERSHIP

### Confidence
HIGH

---

## FINDING-GH-065

### Finding
TitanNexus's historical payment/job memory schema is not suitable as a canonical memory store.

### Evidence
`payment-memory.schema.json` SHA `ef43e9f28d5ac8eafc6765fe0198c7c95fcabc7f` stores invoice outcomes, payment preferences and job-update patterns using legacy `tenant_id`, with no provenance/confidence/freshness/supersession/governance semantics visible in the schema.

### Recovery judgment
Normalize useful facts into canonical `company_id` Business Memory/Personal Zero structures where appropriate; do not import this as a parallel memory database. Payment outcomes belong primarily to authoritative finance/business records, with memory retaining derived experience/preferences only where justified.

### Classification
RETIRE STORE / MIGRATE SEMANTICS ONLY

### Confidence
HIGH


---

## FINDING-GH-066

### Finding
The cleanly lineage contains a substantial PWA/edge-node architecture donor that closely anticipates current Titan Zero Go/Hub/Command delivery: role-specific surfaces over one canonical backend, offline queues, replay/idempotency, device identity/trust, staged evidence, conflict handling and revocation.

### Direct evidence
`docs/01-PWA/17-edge-node-and-pwa-runtime-contract.md` SHA `244abc24da9556ecdb103b22280f23ed52efe7ca` defines:
- device shell, surface runtime, domain adapters, signal/runtime and trust/identity layers;
- durable device registry with `company_id`, actor, device UUID, trust, capabilities and sync state;
- bootstrap handshake and surface profiles;
- outbox/inflight/inbox/dead-letter/replay queues;
- idempotency keys, cursors and conflict markers;
- staged camera/media evidence;
- device revocation, trust downgrade and local wipe;
- explicit rule that device trust never replaces authorization.

### Classification
STRONG HISTORICAL PWA/EDGE DONOR / CURRENT OWNER EXISTS

### Confidence
HIGH

---

## FINDING-GH-067

### Finding
The old nine-node product taxonomy is superseded, but several implementation semantics remain valuable. Current canonical user surfaces are `zero`, `go`, `hub`; `command` is an alias/owner-facing label that normalizes to `zero`.

### Historical taxonomy
cleanly docs used Titan Pro, Ground Zero, Titan Go, Zero Fuss, Titan Zero, ZeroPay, Titan Studio, Titan Solo and Titan Hello as separate named nodes/surfaces.

### Current owner evidence
Agent-Mesh #641 owns consolidated Go/Hub/Command PWA delivery; #690 explicitly owns Zero/Go/Hub canonical surface normalization and legacy Command/BOS alias containment; #636 owns Library Go/Hub/Command masters.

### Recovery judgment
Do not restore the nine-node navigation/product model. Map useful field/customer/owner/mobile/offline behaviors into canonical surfaces and shared engines.

### Classification
PRODUCT TAXONOMY RETIRED / SEMANTICS CONVERGE

### Confidence
HIGH

---

## FINDING-GH-068

### Finding
Historical Titan Go is a strong field-execution semantic donor.

### Evidence
`docs/dashboards/titan-go.md` SHA `35b8326bf5326ae6a1fdf2a3075203780332b29b` specifies:
- offline daily jobs and job cards;
- access instructions;
- checklists;
- before/after photo evidence;
- GPS/QR arrival/check-in;
- notes/issues;
- service-worker/background sync;
- PPE/hazard/SWMS/compliance gates;
- contextual AI guidance.

### Current mapping
These semantics belong to canonical `go`, #641/#636/#542, with business state remaining in canonical job/site/checklist/evidence/safety owners.

### Classification
RECOVER/COMPARE FIELD UX SEMANTICS

### Confidence
HIGH

---

## FINDING-GH-069

### Finding
The cleanly PWA data model reinforces an important convergence rule: surfaces must not invent private business objects. Go/Hub/Zero should project canonical company/customer/work/finance/signal objects and use surface-specific subsets.

### Evidence
`docs/01-PWA/09-canonical-data-model.md` SHA `1bf7a96325fa9fe38350651597fe23229a77b1c4` separates transactional truth, operational metadata, AI context and event/signal layers, and states `company_id` is the tenant boundary while `user_id` is actor/ownership context.

### Classification
CURRENT ARCHITECTURE CONFIRMED

### Confidence
HIGH


---

## FINDING-GH-070

### Finding
cleanly contains a strong historical security-fabric design that already separates principal identity, tenant scope, capability, environmental/device trust and approval. This is highly compatible with current Titan Trust/Authority doctrine and should be treated as a semantic donor rather than a new security subsystem.

### Evidence
`docs/01-PWA/24-security-identity-device-trust-and-tenant-boundary.md` SHA `8bf4e285832d00295f25bf4ddd2672147f238e20` explicitly defines:
- `company_id` as tenant boundary and `user_id` as actor/owner context;
- human, device, system/AI and integration identities as separate principal domains;
- device registration/trust/revocation;
- separate browser sessions, API/device tokens, short-lived high-risk action tokens and webhook/channel verification;
- database/query/route/action/UI/job tenant-boundary enforcement;
- package/module entitlement as capability input;
- approval/risk gating above ordinary permission;
- audit attribution for actor, company, surface, device, workflow, AI involvement and policy result.

### Classification
STRONG SECURITY/IDENTITY SEMANTIC DONOR / CURRENT OWNERS EXIST

### Confidence
HIGH

---

## FINDING-GH-071

### Finding
The historical security design contains an important anti-impersonation rule: Titan Zero/AI/system actors must not silently impersonate ordinary users.

### Recovery value
Canonical audit/execution identity should distinguish:
- human initiation;
- Zero/system proposal;
- human approval;
- workforce/tool execution;
- integration/device origin.

This preserves accountability across chat, voice, PWA, automation and API surfaces.

### Current owner mapping
#302 security/identity/session hardening, #725 identity/cross-surface continuity, #574 distributed identity authority certification, and current Trust/Authority owners.

### Classification
RECOVER/HARDEN ACTOR ATTRIBUTION

### Confidence
HIGH

---

## FINDING-GH-072

### Finding
cleanly's workflow guard architecture is a strong reusable precursor for deterministic pre-execution policy evaluation.

### Evidence
`docs/07-workflows/guards.md` SHA `2ec6dc1a6341aa88304db237d1c0e8a7e0c41192` defines first-class transition, step-entry and execution-mode guards with structured outcomes:
- allow;
- deny;
- reroute_for_approval;
- reroute_for_recovery.

It defines deterministic evaluation across tenant boundary, entitlement, permission, dependency, scheduling, finance/compliance, evidence and execution mode; guards perform no side effect themselves; replay/recovery must re-evaluate against current truth.

### Architecture fit
This maps naturally to current effective-authority/Authority Continuance behavior. It should not become a second Authority engine. Guards are deterministic enforcement adapters consuming canonical authority/governance decisions.

### Classification
STRONG EXECUTION-GUARD DONOR / CONVERGE

### Confidence
HIGH

---

## FINDING-GH-073

### Finding
Historical device trust tiers/states are environmental assurance signals, not authority tiers.

### Evidence
cleanly security docs define registered/verified/high-trust/restricted/revoked devices and explicitly state device trust affects what offline/delegated behavior is possible while authorization remains separate.

### Current owner
#574 explicitly certifies distributed identity never grants business authority; #645/#302/#725 own adjacent runtime/identity mechanics.

### Classification
CURRENT PRINCIPLE CONFIRMED / TERMINOLOGY HARDENING

### Confidence
HIGH


---

## FINDING-GH-074

### Finding
AI Coding Studio contains a documented critical-security defect history that is valuable as a negative donor/test corpus for Titan Code convergence, not as production code to import blindly.

### Evidence
`docs/audits/AI-Coding-Studio-Architecture-Runtime-Audit-Pass1.md` SHA `2d7b59c134eb10d6ad56afd223682cbd33372cb0` verified historical defects including:
- privileged arbitrary cross-origin request proxy with broad host access;
- unsanitized model/imported Markdown rendered as HTML;
- host-page events able to mutate persisted remote configuration;
- unauthenticated/wildcard sandbox and preview message channels;
- repository/archive ingestion without aggregate safety budgets and with secret-file exposure risk;
- no-op/simulated runtime modules that could report false success.

### Recovery judgment
Preserve these failure modes as explicit regression tests and threat-model cases. Do not recover the insecure mechanisms.

### Classification
NEGATIVE DONOR / SECURITY REGRESSION CORPUS

### Confidence
HIGH

---

## FINDING-GH-075

### Finding
Titan Builder's later deep-audit lineage demonstrates that several browser/local execution risks were subsequently hardened with concrete controls, providing a stronger donor than the earlier AI Coding Studio runtime.

### Verified repair evidence
Titan Builder's deep-audit ledger records:
- canonical project containment using realpath/lstat and pre-mutation revalidation;
- operation-order preservation;
- SHA-256 execution preconditions;
- durable transaction journal and before-state backups;
- automatic rollback;
- exact attachment correlation;
- distinct browser/control credentials;
- exact origin allowlisting or authenticated first-use pinning;
- one-time short-lived apply capabilities bound to canonical project + approved preview;
- hashed approval capability storage with replay/expiry/mismatch rejection.

### Classification
HARDENED PRIVATE-DEVELOPMENT DONOR

### Confidence
HIGH

---

## FINDING-GH-076

### Finding
The historical `zero` security integration implemented tenant-aware security audit records but explicitly left the older `tz_audit_log` without `company_id`. This is a concrete historical tenancy gap that must not survive convergence.

### Evidence
`docs/SECURITY_TENANCY_ALIGNMENT.md` SHA `b93d0b410ca6a832b6c61723513518bdd96d9152` states:
- `SecurityAuditEvent` is company-scoped;
- node trust fingerprints include `company_id`;
- `tz_audit_log` was not yet tenant-scoped and was deferred.

`docs/SECURITY_PASS_IMPLEMENTATION_REPORT.md` SHA `1bf390f4982d915f0c5eee29f1506f9a5ab14ccd` confirms the security pass deliberately created a separate tenant-aware audit service rather than fixing the older AI/signal audit table in that pass.

### Classification
HISTORICAL REGRESSION/GAP / VERIFY CURRENT TYPESCRIPT CLOSED

### Confidence
HIGH

---

## FINDING-GH-077

### Finding
Security archaeology supports a single audit/evidence doctrine rather than separate security, AI, signal, device and workflow audit authorities.

### Recovery judgment
Canonical audit evidence should consistently carry at minimum:
- `company_id`;
- actor/principal identity and type;
- Zero/system/AI involvement;
- device/channel/integration origin where applicable;
- target capability/entity;
- authority/policy/guard result;
- approval provenance;
- execution/result/rollback references.

Domain-specific event stores may exist, but cross-domain accountability cannot depend on a tenantless legacy audit stream.

### Classification
CONVERGENCE REQUIREMENT

### Confidence
HIGH


---

## FINDING-GH-078

### Finding
A direct current-repository search did not expose a clearly identifiable canonical TypeScript audit-record implementation by expected audit/signal/evidence symbols. Therefore the historical `tz_audit_log` tenancy defect cannot yet be marked closed from code evidence.

### Verification performed
Targeted Agent-Mesh code searches included:
- `tz_audit_log`;
- `company_id audit`;
- `AuditRecord`, `auditEvent`, `audit_event`, `AuditService`;
- signal/evidence/execution/governance receipt terminology.

The repository search interface returned no implementation hits for these expected symbols. This is not proof the implementation is absent: it may use different names, live in generated/package paths not indexed by search, or remain roadmap work.

### Current roadmap ownership
Issue search confirms:
- #423 Compliance, Audit & Governance workforce;
- #430 its end-to-end certification;
- #63 security/privacy/secrets and replay/recovery certification;
- #642 consolidated MVP engine convergence.

### Classification
CURRENT IMPLEMENTATION NOT YET PROVEN / DO NOT CLAIM HISTORICAL GAP CLOSED

### Confidence
HIGH on search result; MEDIUM on implementation-state inference.

---

## FINDING-GH-079

### Finding
The correct archaeological treatment of the old `tz_audit_log` defect is a mandatory certification invariant rather than restoration of the old Laravel audit subsystem.

### Required invariant
Any tenant-owned event/evidence/receipt in current Titan Zero must either:
1. carry canonical `company_id` directly; or
2. be provably bound to a canonical parent object whose company scope is validated before persistence/query/replay.

Pre-auth/global security telemetry may be company-null only where tenant context genuinely does not yet exist and must remain explicitly system-scoped.

### Classification
P0 CERTIFICATION INVARIANT

### Confidence
HIGH

---

## FINDING-GH-080

### Finding
Audit convergence must distinguish business audit evidence from system-wide pre-auth security telemetry.

### Reason
The historical security pass correctly allowed some pre-auth records to exist without a company because IP/email/login-edge decisions can occur before tenant resolution. That exception must not leak into business AI, Signal, Decision, Workforce, finance, customer, job or approval evidence.

### Classification
SECURITY/TENANCY BOUNDARY CLARIFICATION

### Confidence
HIGH


---

## FINDING-GH-081

### Finding
The current `main` branch has undergone major product/canonical-document drift: repository identity and canonical docs describe **Dovetails FSM**, not the Titan Zero architecture tracked by the Agent Mesh roadmap and archaeology workspace.

### Direct evidence
- root `package.json` still names the package `titan-zero` and describes a Titan Zero Advanced Intelligence workforce/field-service operating system;
- root `README.md` SHA `f650b1fad560ee78f9c9ecb68e645bb3a538b2f2` declares **Dovetails FSM** and makes `docs/canonical/*` authoritative;
- `AGENTS.md` SHA `cac042dc94ccdd5855351dd82c5989478bab27a2` likewise instructs agents that Dovetails canonical docs control product direction;
- `docs/canonical/ARCHITECTURE.md` SHA `bf6a891f0097332ecb14f8f0a2310b1b14269631` defines a Dovetails Next.js/Postgres system;
- `docs/canonical/DOMAIN_MODEL.md` SHA `074def8446dd2a7753e75929061456f4739db144` defines Client → Property → Estimate → Job → Work Order → Visit → Invoice rather than the broader Titan Zero canonical architecture.

### Archaeological significance
This explains why expected Titan Zero audit/Signal/Decision/Workforce symbols were not discoverable in Pass 29. The current main branch being searched is not a clean representation of the Titan Zero baseline assumed by the roadmap issues.

### Classification
CRITICAL REPOSITORY/CANONICAL-BASELINE DRIFT

### Confidence
VERY HIGH

---

## FINDING-GH-082

### Finding
Current main also uses `account_id` as its tenant isolation vocabulary, conflicting with the Titan Zero invariant that `company_id` is the only canonical tenant boundary.

### Evidence
`docs/canonical/ARCHITECTURE.md` states tables are account-scoped. `ai/INVARIANTS.md` SHA `f12b418b269137a9e77cae4a97559f2f9cc6c442` states the application sets `app.current_account_id` and every query scopes by `account_id`; it also warns the DB role is superuser/bypass-RLS so row-level security is not currently an effective isolation backstop.

### Recovery judgment
Do not reinterpret `account_id` as an independent Titan Zero tenant authority. If Dovetails code is to be converged into Titan Zero, its tenant identifier must enter through a compatibility adapter and normalize to canonical `company_id` before authorization/data/storage/execution.

### Classification
P0 TENANCY/CANONICAL-BOUNDARY DRIFT

### Confidence
VERY HIGH

---

## FINDING-GH-083

### Finding
Because the current main branch's own `AGENTS.md` declares code/database migrations first and Dovetails canonical docs second, archaeology must not silently treat roadmap issue titles as proof that Titan Zero runtime code exists on main.

### Consequence
Future current-baseline comparisons require first resolving which branch/ref/tree is the actual Titan Zero implementation baseline. Until then:
- historical donor findings remain valid evidence;
- issue ownership remains coordination evidence;
- implementation-presence claims on Agent-Mesh main must be treated cautiously;
- absence of Titan symbols on main is now explained by baseline drift rather than assumed missing implementation.

### Classification
ARCHAEOLOGY METHODOLOGY CORRECTION

### Confidence
HIGH

---

## FINDING-GH-084

### Finding
The Dovetails main branch contains useful field-service implementation lineage but must be treated as a donor/descendant product branch, not allowed to redefine Titan Zero's canonical architecture by accident.

### Evidence
Its canonical model preserves client/property/job/work-order/visit/invoice, assessment/production intelligence, PostgreSQL worker/runtime and operational deployment details. These may be useful to field-service convergence, but they do not replace Zero/Go/Hub, AI Core, Decision, Model Council, Trust/Authority, Workforce, Business Reality, Personal Zero or canonical `company_id` doctrine.

### Classification
DONOR VALUE PRESENT / PRODUCT AUTHORITY CONFLICT

### Confidence
HIGH


---

## FINDING-GH-085

### Finding
The exact canonical-baseline pivot has been identified. Commit `09c72e357784fb5a588c33f912aba60a5fa8ce42` explicitly changed Agent-Mesh from the Titan Zero Agent Mesh baseline to Dovetails as the root base app.

### Commit evidence
Commit message:
`Make Dovetails the base app; archive previous Titan system under titan/`

GitHub compare resolves its immediate parent/base as:
`3063eb6306879e54888e35fddad9e07596c41c2a`.

At that parent:
- `AGENTS.md` is explicitly `Titan Zero Agent Mesh V3 Execution Contract`;
- `README.md` says the repository is the canonical Titan Zero source and that Merge84 source is on `main`;
- `roadmap/INDEX.json` is authoritative Titan Zero roadmap state and explicitly defines one canonical TypeScript platform;
- Titan Zero non-negotiables include canonical `company_id`, Zero/Go/Hub, Cost Sovereignty and Titan Code separation.

### Classification
LAST VERIFIED PRE-PIVOT TITAN ZERO BASELINE IDENTIFIED

### Baseline ref
`3063eb6306879e54888e35fddad9e07596c41c2a`

### Confidence
VERY HIGH

---

## FINDING-GH-086

### Finding
The Dovetails pivot was deliberate repository surgery, not an unexplained gradual branding drift.

### Evidence
The pivot commit replaced root authority text, including approximately 307 deleted lines from the prior Titan Zero `AGENTS.md`, and imported/changed a very large field-service application surface. Follow-on commits explicitly say:
- migrate Titan platform package into Dovetails workspace;
- migrate Titan core runtime folders into Dovetails workspace;
- migrate Titan capability folders into Dovetails workspace;
- merge unique/additive Titan app changes into Dovetails;
- wire Titan platform and portable MySQL runtime into Dovetails web app.

### Interpretation
The intended strategy appears to have been **Dovetails as a new base shell with Titan capability convergence**, followed shortly afterward by rebranding the resulting shell back to Titan Zero. However, root/canonical documentation was not fully reconciled back to Titan Zero authority.

### Classification
INTENTIONAL BASE-APP TRANSPLANT / INCOMPLETE CANONICAL RECONCILIATION

### Confidence
HIGH

---

## FINDING-GH-087

### Finding
Subsequent commits prove that the product was already being moved back toward Titan Zero branding after the Dovetails transplant, while Dovetails canonical docs remained at root.

### Evidence
Examples:
- `d21e6d242aa2cf4b7f75737add707b21e66b2899` — merge donor marketing sites into Titan Zero web app and rebrand homepage;
- `ce8286669314541a70bc2ed078ed55aeeb5bde8e` — rebrand PWA metadata and harden Titan Zero public indexing;
- `dcb1db5c650facb296eea8394a1d49329bf2b508` — remove visible Dovetails branding from Titan Zero web shell;
- `69b5e30b00cc72a1488fc6f3fb5a52bd94fe0acf` — rebrand Titan Zero login and product identity;
- `9dd1042ec1a1435895e6cbebd4cf9045aa7af186` — remove legacy Dovetails identity from web design tokens.

Direct inspection of `dcb1db5...` shows Dovetails UI branding changed to `T0` / `Titan Zero`.

### Classification
REBRAND-BACK EVIDENCE / DOC-AUTHORITY LAG

### Confidence
VERY HIGH

---

## FINDING-GH-088

### Finding
For archaeology purposes, the correct two-tree comparison is now known:
1. **Titan Zero pre-pivot implementation baseline:** `3063eb6306879e54888e35fddad9e07596c41c2a`.
2. **Post-transplant current lineage:** current `main`, beginning with pivot `09c72e357784fb5a588c33f912aba60a5fa8ce42`.

### Recovery rule
Do not simply revert to the pre-pivot tree: substantial useful Dovetails field-service code and subsequent Titan integrations would be lost. Instead, use the pre-pivot ref as architecture/capability comparison evidence and converge missing Titan Zero systems into the stronger post-transplant application where appropriate.

### Classification
CANONICAL ARCHAEOLOGY BASELINE RESOLVED

### Confidence
VERY HIGH


---

## FINDING-GH-089

### Finding
The first capability-loss matrix slice shows that the Dovetails transplant did **not** permanently erase the Titan platform. Major Titan runtime families were subsequently copied back into the new root as first-class packages and app bindings.

### Direct implementation evidence on current main
- `packages/titan-platform/src/intelligence.ts` exports deterministic risk classification, AI provider registry, Signal, Model Council and Nexus.
- `packages/titan-platform/src/distributed/authority.ts` implements company-bound authority ceilings, the full Observe→Predictive authority-band vocabulary, explicit identity/trust neutrality, and trust eligibility that cannot itself grant authority.
- `packages/titan-platform/src/interface-runtime.ts` enforces `company_id`, canonical `zero|go|hub` surfaces and presentation-only/no-authority semantics.
- `packages/settings/control-plane/ai-cost-routing-settings.mjs` implements the Cost Sovereignty route order DEVICE_LOCAL → CUSTOMER_LOCAL → BYO_API → BYO_SERVICE → TITAN_ENTITLED → TITAN_METERED_ADDON, rejects legacy company-boundary aliases and prevents settings from granting authority or silent Titan spend.
- `apps/web/lib/titan/interface-runtime/host.ts` projects current Zero/Go/Hub navigation.
- `apps/web/lib/titan/workforce-hierarchy/delegation-envelope.ts` binds web runtime to canonical Titan workforce delegation contracts.

### Classification
RETAINED / MIGRATED / CURRENTLY REACHABLE

### Confidence
VERY HIGH

---

## FINDING-GH-090

### Finding
The strongest immediate regression exposed by the transplant is a **tenant-boundary adapter mismatch**, not wholesale loss of Titan authority semantics.

### Evidence
Current `apps/web/lib/titan/workforce-command-gateway.ts` passes Dovetails session `accountId` into Titan as:
- `companyId: session.accountId`
- `companyBoundary: session.accountId`
- HTTP header `x-titan-company-id: session.accountId`.

Meanwhile canonical Titan packages require `company_id` and the settings control plane explicitly rejects legacy aliases before routing.

### Interpretation
This is an adapter-normalization problem at the Dovetails/Titan seam. `accountId` may be a host/session identifier, but it must not silently become an independent canonical tenant boundary. The host must resolve/normalize it to the authoritative Titan `company_id` before authorization, data access, projection, storage or execution.

### Classification
P0 TENANT-BOUNDARY CONVERGENCE GAP

### Confidence
VERY HIGH

---

## FINDING-GH-091

### Finding
The migration sequence demonstrates that Titan's high-value intelligence, authority, workforce, interface and operational capabilities were restored in staged layers rather than in the original pivot commit.

### Migration evidence
- `76a7c8c...` migrated `packages/titan-platform`, including intelligence, distributed authority/execution, interface runtime, offline resilience, workforce and extensive Titan intelligence/runtime verification.
- `94568b3...` established migration automation for Titan core runtime folders.
- `02ca896...` migrated business services, inventory, revenue journey, settings/control-plane and tool capability folders.
- `3fce403...` merged Titan web routes/runtime bindings including dispatch, Builder, workforce commands, native agents, interface runtime, workforce context/hierarchy and operational repair.
- `44d2cad...` wired Titan platform and portable MySQL runtime into the Dovetails web app.

### Classification
STAGED CAPABILITY RECOVERY CONFIRMED

### Confidence
VERY HIGH

---

## FINDING-GH-092

### Finding
The capability-loss matrix must therefore distinguish three different states that previously looked like one problem:
1. **Titan capability genuinely absent/lost after transplant**;
2. **Titan capability migrated and reachable, but host adapters still use Dovetails-era identity/schema terminology**;
3. **Titan capability migrated, while root product/canonical documentation remained Dovetails-derived**.

Treating all three as “missing Titan Zero” would cause duplicate implementation.

### Classification
CONVERGENCE MODEL CORRECTION

### Confidence
VERY HIGH


---

## FINDING-GH-093

### Finding
Direct file verification uncovered a packaging-integrity problem in the migrated Titan intelligence facade: `packages/titan-platform/src/intelligence.ts` imports/exports modules under `./ported/titan-intelligence/*` and `./ported/titan-ai-core/*`, but those expected implementation paths were not present in the migration commit inventory and direct current-main fetches return 404.

### Evidence
Current facade SHA `8320eef651c334789a950163ed277238bd8311f6` references:
- `./ported/titan-intelligence/core/risk-classification.js`
- `./ported/titan-ai-core/provider-registry.js`
- `./ported/titan-intelligence/signal/index.js`
- `./ported/titan-intelligence/model-council/index.js`
- `./ported/titan-intelligence/nexus/index.js`

Direct fetches for the named Model Council, Signal, Nexus and provider-registry paths on current main return NOT_FOUND. The `76a7c8c...` migration inventory contains intelligence tests and the facade, but no corresponding `ported/titan-intelligence` or `ported/titan-ai-core` implementation paths.

### Classification
P0/P1 MIGRATION PACKAGING REGRESSION / FACADE PRESENT, DEPENDENCY IMPLEMENTATION UNPROVEN

### Confidence
VERY HIGH

---

## FINDING-GH-094

### Finding
Pass 32's classification of Model Council/Signal/Nexus as “currently reachable” must be corrected: their **facade exports are present**, but reachability is not proven until the missing referenced modules are restored or the facade is rebound to their actual canonical implementation paths.

### Archaeology rule
An export statement or migration test name is not implementation proof. A capability is only “reachable” when its dependency chain resolves from the current package/build graph.

### Classification
CORRECTION / IMPLEMENTATION VERIFICATION HARDENING

### Confidence
VERY HIGH

---

## FINDING-GH-095

### Finding
Not all Titan runtime families suffered this problem. Several directly verified current TypeScript implementations are intact:
- distributed authority/trust neutrality: `src/distributed/authority.ts`;
- Interface Runtime and Zero/Go/Hub company-bound projection: `src/interface-runtime.ts`;
- web workforce command/hierarchy bindings;
- settings Cost Sovereignty controls.

Therefore the transplant produced a **mixed migration state**, not a total package failure.

### Classification
MIXED RETENTION: DIRECT IMPLEMENTATION + BROKEN/UNPROVEN FACADES

### Confidence
VERY HIGH

---

## FINDING-GH-096

### Finding
The migration commit preserved a large Titan intelligence regression-test corpus even where the corresponding implementation files are currently unproven. Tests include convergence/divergence, consequence intelligence, evidence independence, high-risk agreement challenge, receiving-domain acceptance, risk classification and Zero synthesis authority.

### Recovery value
These tests are strong recovery specifications. They should be used to locate the original implementation in pre-pivot/archive/branch history or to validate a canonical rebind. They must not be satisfied by creating a parallel replacement engine without first finding existing code.

### Classification
RECOVERABLE TEST ORACLE / IMPLEMENTATION LOCATION REQUIRED

### Confidence
HIGH


---

## FINDING-GH-097

### Finding
The intelligence dependency gap from Pass 33 was a **file-extension resolution mistake in archaeology, not missing current implementation**. The facade imports `.js` specifiers while the TypeScript source files exist as `.ts`, which is normal for ESM TypeScript builds that emit JavaScript.

### Direct current implementation verified
- Model Council: `packages/titan-platform/src/ported/titan-intelligence/model-council/index.ts` SHA `f989f8ba7e39ba0e807251dc625edc2c2d2672c2`;
- Signal: `.../signal/index.ts` SHA `847a14df1b68278330971a97c05d679d0f606e15`;
- Nexus: `.../nexus/index.ts` SHA `f7936d44dcf30fd9cb0d091af0efbc10fbcd501a`;
- AI Core provider registry: `.../titan-ai-core/provider-registry.ts` SHA `7e5d9f996c9225672ca0c5973ace97376210b07f`;
- deterministic risk classification: `.../core/risk-classification.ts` SHA `c604b81cbd5a614b7ee3d6d6fefab9608528195a`.

### Classification
PASS-33 FALSE POSITIVE CORRECTED / IMPLEMENTATION PRESENT

### Confidence
VERY HIGH

---

## FINDING-GH-098

### Finding
Commit history shows these intelligence implementations were actively hardened on 22 Sep 2026 after the transplant, rather than merely copied as stale archive code.

### Evidence
Model Council commits:
- `2a9b662...` add canonical recommendation convergence;
- `6394463...` harden consensus authority boundary;
- `364bbaa...` enforce company boundary on votes;
- `71c3842...` add company-isolation/authority tests.

AI provider registry commits include:
- `647ae85...` canonical provider locality registry;
- `1179072...` reject legacy tenant authority;
- `10ebc1f...` harden company/authority boundaries.

### Classification
CURRENT ACTIVE CONVERGENCE / NOT LOST

### Confidence
VERY HIGH

---

## FINDING-GH-099

### Finding
The current Model Council implementation is real and correctly authority-neutral, but it is materially thinner than the strongest historical TitanPro council semantics recovered in FINDING-GH-052–055.

### Current implementation
It provides:
- company-bound votes;
- deterministic ordering;
- recommendation grouping;
- count + summed-confidence consensus;
- explicit `consensus_is_authority:false` and no execution authority.

### Historical semantics not directly evidenced in this implementation
- selective specialist participation;
- sequential/parallel/hybrid council topology;
- explicit contextual participant weighting;
- bounded critique/challenge rounds;
- convergence/non-convergence criteria beyond winning recommendation grouping;
- disagreement exposure/severity;
- escalation outcomes;
- outcome-driven refinement of participation/weights.

### Classification
IMPLEMENTED CURRENT CORE / HISTORICAL SEMANTIC DEEPENING AVAILABLE

### Confidence
HIGH

---

## FINDING-GH-100

### Finding
Signal, Nexus, provider registry and risk classification also preserve the key Titan Zero architectural boundary: intelligence can classify, prioritize, recommend, orchestrate or route, but cannot manufacture business authority.

### Evidence
Current modules explicitly expose authority-neutral/no-execution-authority policy. Risk classification is deterministic and company-bound; provider routing is locality-aware and company-scoped; Signal rejects cross-company prioritization; Nexus is company/correlation-bound.

### Classification
CURRENT CANONICAL SEMANTICS CONFIRMED

### Confidence
VERY HIGH


---

## FINDING-GH-101

### Finding
Current Titan Zero has a real company-bound DecisionPacket contract, but direct evidence in this pass proves the **packet schema**, not yet the full persistent Decision Object/watch/trigger/reevaluation lifecycle described by current issue #59.

### Direct evidence
`packages/titan-platform/src/ported/titan-runtime/contracts/schemas/DecisionPacket.schema.json` SHA `1f482e924f4f799b852c903df78b8ace326b66d7` requires:
- packet_id and company_id;
- domain/subject/observation;
- evidence and evidence_state;
- recommended_actions;
- risk and urgency;
- source_provider/source_revision;
- generated_at;
- authority_neutral=true;
- execution_authority=false;
- recommendation_is_authority=false.

Commit `40a5db11...` explicitly locked DecisionPacket recommendations to a no-authority schema.

### Classification
CURRENT CONTRACT IMPLEMENTED / FULL DECISION LIFECYCLE NOT YET PROVEN IN THIS PASS

### Confidence
VERY HIGH

---

## FINDING-GH-102

### Finding
Knowledge Authority is no longer merely roadmap/spec work. Current main exports a converged Workforce Knowledge Authority capability through `packages/titan-platform/src/workforce.ts`.

### Evidence
Current workforce facade SHA `98f77554d22f76aa1131a257a171c803bfa43979` exports:
- `buildWorkforceKnowledgeAuthorityPacket`;
- `evaluateWorkforceKnowledgeUse`;
- `buildWorkforceKnowledgeUseReceipt`;
- `summarizeWorkforceKnowledgeAuthority`.

Commit lineage:
- `3a27e462...` harden Knowledge Authority source identity;
- `0767213...` add Library parity regressions;
- `389d864...` update #633 convergence ledger;
- `ab436cf...` export converged Knowledge Authority capability.

### Classification
CURRENT IMPLEMENTATION / ACTIVE CONVERGENCE CONFIRMED

### Confidence
VERY HIGH

---

## FINDING-GH-103

### Finding
The current Workforce implementation contains a substantial governed business-discovery → installation-planning → commissioning lineage that survived/converged through the transplant and aligns strongly with Titan Zero's managed-service operating model.

### Direct evidence
`investigation-installation-handover.ts` SHA `415ee5647bed8a54b60d4e18ee628c67316d97ee` implements:
- evidence-backed investigation findings/recommendations;
- unresolved risk ownership;
- required capabilities;
- commissioning gates;
- deterministic Business Discovery compilation across processes, people, systems, devices, documents, objectives and risks;
- installation specification generation;
- deterministic installation DAG planning;
- policy/authority review;
- capability/workforce/integration/device/data preparation;
- test/verification;
- rollback preparation;
- commissioning review.

It rejects legacy tenant aliases and requires `company_id`. It repeatedly asserts that discovery, handover, readiness, installation planning and recommendations do not grant authority or automatically provision/activate workforce.

### Classification
STRONG CURRENT MANAGED-SERVICE IMPLEMENTATION / RETAIN

### Confidence
VERY HIGH

---

## FINDING-GH-104

### Finding
This business-discovery/installation pipeline is a concrete current implementation of the product direction “implement an AI workforce into an existing business architecture, fill gaps, verify, then commission,” rather than a generic SaaS onboarding flow.

### Architecture fit
The runtime explicitly inventories existing systems/devices/documents/processes, compiles required capabilities, plans integrations and workforce setup, requires governed execution/rollback and verifies commissioning gates. This should remain a canonical deployment/evolution input rather than being replaced by a dashboard-first onboarding subsystem.

### Classification
CURRENT PRODUCT-DIRECTION ALIGNMENT CONFIRMED

### Confidence
VERY HIGH


---

## FINDING-GH-105

### Finding
The Decision lifecycle trace confirms that current Agent-Mesh does **not yet expose a verified persistent Decision Object/watch/temporal re-evaluation implementation** beyond the DecisionPacket contract. This is consistent with open issue #59, whose “Remaining work only” explicitly lists persistence, lifecycle state and watch/trigger/temporal re-evaluation.

### Evidence
Repository searches for DecisionObject, decision lifecycle/watch/trigger/reevaluation/supersession/outcome runtime did not identify a current canonical implementation. Issue #59 remains open and names these exact gaps while instructing reuse of existing decision-rights, authority, provenance and Interaction Engine foundations.

### Classification
CURRENT GAP CONFIRMED / ROADMAP OWNER ALREADY EXISTS

### Confidence
HIGH

---

## FINDING-GH-106

### Finding
TitanPro contains a strong historical **decision-envelope + durable runtime-state + trigger/recovery** semantic donor that maps directly to the missing portions of #59 without requiring restoration of the old Laravel automation stack.

### Donor semantics
`docs/06-automation/decision-envelopes.md` defines a bounded durable decision object with:
- company_id;
- source entity/signal refs;
- decision type/outcome;
- readiness separate from decision;
- risk/confidence;
- required approvals/policy gates;
- context hash;
- evidence refs;
- idempotency key;
- permitted/blocked next actions;
- freshness/expiry;
- derived envelope lineage after approval/policy change;
- ProcessRecord current/prior envelope linkage;
- replay comparison and recovery distinction between retrying same decision vs regenerating changed intent.

`runtime-state-store.md` adds current-state + append-only transition history, correlation IDs, approval pause/resume, retries, escalation, recovery, next_run_at and duplicate suppression.

`worked-engine-examples.md` adds temporal/suppression behavior: scheduled follow-up at +3 days, watcher for `complaint.opened`, cancellation if suppression arrives, replay with linked causation and reconstructed decision envelope.

### Classification
HISTORICAL SEMANTIC DONOR / DIRECT FIT FOR #59

### Confidence
VERY HIGH

---

## FINDING-GH-107

### Finding
Historical TitanPro correctly separates **decision** from **execution readiness**. This is especially important for the current architecture: a recommendation may remain valid while execution is blocked by approval, changed evidence, expiry, policy, dependency or authority.

### Convergence implication
The future persistent Decision Object should not use one status field that conflates “what should happen” with “whether it may happen now.” Preserve:
- decision/proposal state;
- evidence/context revision;
- readiness/authority state;
- lifecycle/supersession state;
- execution/outcome linkage.

This strengthens the existing rule that learning, recommendation and consensus do not grant authority.

### Classification
RECOVER/HARDEN SEMANTIC

### Confidence
VERY HIGH

---

## FINDING-GH-108

### Finding
Historical stuck-state/watch semantics are useful for Decision re-evaluation, but workflow truth must remain separate from Decision truth.

### Evidence
TitanPro `stuck-state-detection.md` supports real-time, scheduled and event-driven reevaluation when approvals, prerequisite signals, retries or downstream handoffs change. It explicitly says Titan Zero may explain/propose recovery but must not mutate workflow state outside legal transitions.

### Convergence implication
Decision watchers should subscribe to changed evidence/conditions and trigger reevaluation of the same decision lineage; they must not become a second workflow engine or mutate business reality directly.

### Classification
CONVERGE INTO #59 WATCH/TRIGGER LAYER / NO PARALLEL WORKFLOW AUTHORITY

### Confidence
VERY HIGH


---

## FINDING-GH-109

### Finding
Current implementation archaeology confirms that **Personal Zero Understanding/Experience is not yet a verified production runtime on main**. Issue #768 is the deliberate canonical owner-selection/convergence point, not a duplicate of an already-proven Personal Zero package.

### Evidence
Current repository searches did not expose canonical implementation symbols for Personal Zero, Understanding Memory/Understanding Evidence, Experience Memory/Experience Record or Cognitive Event. Commit history around Personal Zero is dominated by architecture/research checkpoints and marketing alignment, including explicit archaeology commit `3f7c3f8...` “confirm Personal Zero owner gap.”

Issue #768 remains open and explicitly requires selection of one canonical package/module owner after inspecting existing storage/evidence/provenance contracts.

### Classification
CURRENT ARCHITECTURE/IMPLEMENTATION GAP CONFIRMED / OWNER EXISTS

### Confidence
HIGH

---

## FINDING-GH-110

### Finding
Business Memory, Business Reality/Evolution and Personal Zero are now cleanly separated in current issue ownership, which prevents a major historical convergence failure: treating all memory/learning/reality as one store.

### Current owners
- #153: company-scoped Business Memory & Knowledge;
- #767: Business Reality, observation, change detection, reassessment/reconfiguration/evolution;
- #768: One's Personal Zero Understanding + Experience, portable across company relationships.

### Critical boundary
A person/account principal is not the company tenant. Business-scoped records use canonical `company_id`; genuinely personal Zero state belongs to One/principal and company relationships determine which business context/data/capabilities/authority are available.

### Classification
CANONICAL OWNERSHIP RESOLUTION / RETAIN

### Confidence
VERY HIGH

---

## FINDING-GH-111

### Finding
Issue #768 contains an important architectural recovery not present in older “owner assistant” framings: **One means the human/account principal, not the owner of the business**, and one Personal Zero may operate across owner/manager, worker, customer and future personal contexts.

### Archaeology consequence
Historical user/company/customer memory donors must be decomposed by ownership and provenance before convergence:
- company standards/SOPs/outcomes → Business Memory;
- authoritative business facts/configuration → Business Reality;
- personal preferences/corrections/decision patterns/experience → Personal Zero;
- conversation/session state → Interaction Engine;
- role/company membership → relationship/context contract, not identity ownership.

### Classification
IDENTITY/OWNERSHIP CORRECTION / MIGRATION RULE

### Confidence
VERY HIGH

---

## FINDING-GH-112

### Finding
The current Personal Zero issue already incorporates the strongest previously recovered donor lineages rather than requiring another archaeology-created owner:
- Interaction Engine LocalBrain cognitive chronology/prediction-outcome/corrections;
- Phase10 device intelligence working/episodic/preference/local learning;
- OnboardingPro longitudinal strategy/outcome evidence;
- Decision Engine Step25 preference/observation/learning candidates.

Therefore GitHub archaeology should support #768 with donor provenance and implementation comparisons, not create a new Personal Zero issue.

### Classification
NO NEW OWNER / SUPPORT EXISTING #768

### Confidence
VERY HIGH


---

## FINDING-GH-113

### Finding
Direct current-main archaeology did not find the OnboardingPro-named continuous Business Reality/Evolution services (`BusinessRealityGraphService`, `ContinuousBusinessObservationService`, `BusinessReconfigurationService`, `NexusReassessmentService`, `OutcomeMeasurementService`, `RollbackDecisionService`) as production TypeScript implementations.

### Classification
#767 RECOVERY TARGET REMAINS OPEN / DONOR NOT YET CONVERGED UNDER THOSE MECHANISMS

### Confidence
HIGH

---

## FINDING-GH-114

### Finding
Current Titan Zero nevertheless already has a **strong adjacent initial-state discovery/install/commissioning implementation** that #767 must extend rather than duplicate.

### Current implementation boundary
`investigation-installation-handover.ts` provides evidence-backed investigation, Business Discovery compilation, installation specification, deterministic installation planning and commissioning gates. It inventories processes, people, systems, devices, documents, objectives, risks and required capabilities and explicitly routes governed changes through Command Bus/authoritative receipts.

### Missing evolution dimension
The verified code is strongest at initial investigation/install/commissioning. It does not by itself prove the continuous post-commission lifecycle:
OBSERVE → DETECT CHANGE → REASSESS → semantic diff → PROPOSE → governed RECONFIGURE → VERIFY → MEASURE → LEARN → REPEAT.

### Classification
CURRENT FOUNDATION + CONTINUOUS-EVOLUTION GAP

### Confidence
VERY HIGH

---

## FINDING-GH-115

### Finding
The current installation runtime is marked as a **ported/quarantined browser-adaptation bundle** (`@ts-nocheck`; “QUARANTINE: not exported to standalone runtime until browser/DOM dependencies are adapted”), even though its semantics are substantial.

### Convergence implication
#767 should not blindly make this file the Business Reality authority. Its discovery/install contracts are valuable inputs, but continuous Reality/Evolution needs a canonical production owner with typed contracts, tests and storage/provenance integration. Browser-extension adaptation code must not become an accidental second source of business truth.

### Classification
IMPLEMENTED SEMANTICS / PRODUCTION-OWNERSHIP HARDENING REQUIRED

### Confidence
VERY HIGH

---

## FINDING-GH-116

### Finding
The cleanest convergence architecture is now visible:
- current Business Discovery/installation pipeline establishes an evidence-backed initial business configuration and commissioning baseline;
- #767 Business Reality/Evolution should observe changes against that baseline and authoritative business sources;
- semantic reconfiguration proposals return through the same governed installation/change mechanisms where practical;
- verified outcomes feed #153 Business Memory/Experience and Signal/Rewind without allowing Reality inference or learning to self-authorize changes.

This reuses existing installation machinery while keeping Business Reality, Personal Zero and Business Memory separate.

### Classification
CONVERGENCE PATH IDENTIFIED / NO PARALLEL DISCOVERY ENGINE

### Confidence
HIGH
