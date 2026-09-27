# Titan Zero Roadmap v3 — Eight-Phase Convergence Map

This file does not replace `roadmap/goals/*`. It groups the existing executable 55-goal roadmap beneath the accepted Titan Zero Blueprint v3 architecture so future compaction and issue convergence move toward one target rather than a second roadmap.

## Phase 1 — Evidence & Isolation Foundation

Primary owners / convergence targets:
- TZ-ROADMAP-30 — Compliance, Audit & Governance: invert evidence from audit-output to primary factual ledger.
- TZ-ROADMAP-18 — security identity/session/credentials.
- TZ-ROADMAP-17 — reliability/resilience/DR.
- TZ-ROADMAP-50 — Storage Fabric.
- P0 #811 — canonical SQLite persistence, restart/idempotency.
- repository-wide `company_id` enforcement under TZ-ROADMAP-52.

Required architectural delta:
- define Business Evidence Ledger canonical event/evidence contract;
- append-only acceptance and integrity semantics;
- all consequential facts link to provenance;
- projection rows are derived/materialized views, not primary truth;
- corrections/supersession are new events;
- isolation certification covers both projection stores and evidence ledger.

Exit gate:
A company-scoped factual history can be integrity-verified and the required operational projections can be reconstructed from accepted evidence plus deterministic projection versions.

## Phase 2 — Reality Projections & Governed Execution

Primary owners:
- TZ-ROADMAP-01 — governed execution/recovery/Rewind.
- TZ-ROADMAP-52 Decision Runtime issues #58/#59 and engine integration #642.
- TZ-ROADMAP-06 and other canonical domain lifecycles.
- #767 Business Reality/evolution.

Required delta:
- Business Reality becomes explicit projection/fold layer over factual evidence;
- `REQUESTED → AUTHORIZED → EXECUTING → PROVIDER_ACKNOWLEDGED → VERIFYING → VERIFIED` or equivalent is canonical;
- observed-state verification closes execution;
- projection lineage reaches source evidence and projection version;
- provider acknowledgements can never directly update verified reality.

Exit gate:
Representative business action reconstructs end-to-end from intent and authority through execution, observed verification, ledger evidence and updated Reality projection.

## Phase 3 — Workforce, One/Zero & Continuous Operation

Primary owners:
- TZ-ROADMAP-41 #639 workforce identity/hierarchy.
- TZ-ROADMAP-42 #640 earned Trust/Autonomy.
- #768 Personal Zero.
- #153 Business Memory.
- #542/#869 One PWA Zero/Go/Hub.
- #725 identity/context continuity.
- #811 24/7 hosted runtime.

Required delta:
- explicit One / Personal Zero / Business Reality / Business Memory / Workforce separation;
- portable Zero identity across company relationships;
- continuous workforce remains active without clients open;
- all surface state is projection of evidence-backed hosted state;
- learning and memory remain authority-neutral.

Exit gate:
One can disconnect/reconnect through Zero/Go/Hub while ongoing governed work survives, resumes without duplication and projects truthful current state with provenance.

## Phase 4 — Titan Server Node & Capability Fabric

Primary owners:
- P0 #812 DirectAdmin.
- TZ-ROADMAP-20 #322 deployment/release.
- TZ-ROADMAP-28 #403 connectors.
- TZ-ROADMAP-31 #7 capability/tool registry.
- TZ-ROADMAP-32 #432 MCP.
- TZ-ROADMAP-45 #643 Browser Node.
- TZ-ROADMAP-49/#645 Edge Fabric.

Required delta:
- rename architectural target from DirectAdmin host plugin to **Titan Server Node**, with DirectAdmin as first deployment/control-plane adapter;
- persistent TypeScript/Node workforce runtime;
- bounded DA/API/MCP capabilities for applications/sites, WordPress, Git, Node/PHP, DNS/SSL/mail, DB/Redis, security, backup/restore, services and governed terminal;
- capability discovery never creates authority;
- `Deploy → Preview → Verify → Promote` commissioning lifecycle;
- atomic update/rollback and host-replaceability proof;
- external DA projects are donors/providers, never canonical control planes.

Exit gate:
A clean DirectAdmin VPS can install, run, upgrade, recover and verify the canonical Titan Server Node, while the same business/runtime semantics remain deployable without DirectAdmin.

## Phase 5 — Constitution & Earned Autonomy

Primary owners:
- TZ-ROADMAP-42 #640.
- TZ-ROADMAP-30 #423.
- TZ-ROADMAP-18 security.
- canonical Governance/Risk/Assurance/Trust owners.

Required delta:
- machine-enforced Titan Constitution version and policy contracts;
- company isolation, evidence requirements, identity separation, authority construction, privacy/egress, Cost Sovereignty, irreversible action, factual/simulated separation and recovery rules become constitutional invariants;
- policy changes are versioned/evidenced;
- recursive handshake remains system eligibility + human delegation + downstream acceptance;
- constitutional downgrade/revocation always fails closed.

Exit gate:
Every consequential execution substrate is demonstrably unable to bypass constitutional invariants, including host/root/admin and provider-specific paths.

## Phase 6 — Counterfactuals, Rewind & Continuous Improvement

Primary owners:
- TZ-ROADMAP-01 #14 Rewind/recovery.
- TZ-ROADMAP-04 planning.
- TZ-ROADMAP-27 analytics/decision intelligence.
- #37 predictive/outcome learning.
- #638 value attribution.

Required delta:
- isolated counterfactual branch identity and parent evidence references;
- scenario/counterfactual histories cannot enter factual ledger by projection or merge;
- deterministic reconstruction by evidence/projection/Constitution versions;
- corrections, compensation and rollback are new governed factual events;
- outcome learning can modify recommendations/policies only through bounded governed paths and never self-grant authority.

Exit gate:
Titan can compare factual history against multiple counterfactual branches, execute an approved intervention, verify its real outcome, preserve the original history and learn without conflating simulation with fact.

## Phase 7 — Capsule, Sovereignty & Zero Recovery

Primary owners:
- TZ-ROADMAP-20 deployment/distribution.
- TZ-ROADMAP-17 reliability/DR.
- TZ-ROADMAP-50 Storage Fabric.
- TZ-ROADMAP-37 #718 compatibility/propagation.
- TZ-ROADMAP-38 #717 cross-host certification.

Required delta:
- versioned/signed Titan Capsule format;
- portable evidence, schemas/projection versions, company/workforce manifests, Constitution/governance versions, runtime/deployment manifests, capability/provider bindings and encrypted restore metadata;
- pause, snapshot, rehydrate, controlled clone and relocation workflows;
- Zero Recovery onto a second supported substrate;
- current authority/credential/provider state is revalidated after recovery.

Exit gate:
A Titan business can be reconstructed on a second substrate after loss of the original server/provider with semantic equivalence, immutable history preserved and no hidden dependency on DirectAdmin.

## Phase 8 — Federation

Primary owners / future convergence:
- distributed architecture TZ-ROADMAP-48 #572;
- Edge/Storage/Intelligence fabrics;
- connector/capability ecosystem;
- identity/continuity and governance owners.

Required delta:
- sovereign node/company/One relationship contracts;
- explicit evidence/data sharing scope and revocation;
- capability offer/request contracts;
- authority and consent at both sending and receiving boundaries;
- provenance-preserving federated evidence acceptance;
- no shared mutable truth store and no erosion of `company_id` isolation.

Exit gate:
Two independently recoverable Titan nodes can cooperate on an explicitly authorised workflow while each preserves its own factual ledger, authority domain and sovereign recovery path.

## Global phase invariants

Every phase must preserve:
1. `company_id` canonical isolation.
2. Evidence before verified state.
3. No provider/model/device/host/surface identity → authority implication.
4. Capability discovery and simulation remain authority-neutral.
5. Provider acknowledgement != verified outcome.
6. Infrastructure can materialize a Business Node but never define its identity/truth.
7. Factual and simulated histories cannot silently mix.
8. One/Zero/Business Reality/Memory/Workforce remain separate concerns.
9. No duplicate engines, registries or host-private business cores.
10. Titan Code remains private development-only.
