# Titan Zero Roadmap v3 — Eight-Phase Convergence Map

This file does not replace `roadmap/goals/*`. It groups the existing executable 55-goal roadmap beneath the accepted Titan Zero Blueprint v3 architecture so future compaction and issue convergence move toward one target rather than a second roadmap.

## Phase 1 — Evidence & Isolation Foundation

Primary owners / convergence targets:
- TZ-ROADMAP-30 — Compliance, Audit & Governance: invert evidence from audit-output to primary factual ledger.
- TZ-ROADMAP-18 — security identity/session/credentials.
- TZ-ROADMAP-17 — reliability/resilience/DR.
- TZ-ROADMAP-50 — Storage Fabric.
- P0 #811 — persistent Titan Runtime/Workforce, native FSM + runtime/control/evidence persistence convergence, restart/idempotency; Frappe/#1051 remains optional extension-provider storage where deliberately enabled.
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
- TZ-ROADMAP-04 #163 — Mission/objective lifecycle consumes Reality without becoming another business-state owner.

Required delta:
- Business Reality becomes explicit projection/fold layer over factual evidence;
- `REQUESTED → AUTHORIZED → EXECUTING → PROVIDER_ACKNOWLEDGED → VERIFYING → VERIFIED` or equivalent is canonical;
- observed-state verification closes execution;
- projection lineage reaches source evidence and projection version;
- provider acknowledgements can never directly update verified reality;
- Business Reality exposes capability-gap evidence so Titan can distinguish KEEP/CONNECT/AUGMENT/BUILD/REPLACE/RETIRE without treating inferred need as authority.

Exit gate:
Representative business action reconstructs end-to-end from intent and authority through execution, observed verification, ledger evidence and updated Reality projection.

## Cross-phase productization owner

- **#1042 — Product portfolio, tier entitlements & upgrade-path convergence** owns the commercial packaging contract across phases.
- It packages existing canonical owners into Solo, Team, Business and Sovereign; it must not create duplicate surfaces, runtimes, capability registries, authority or business state.
- Surface/channel owners (#542 and #644), Foundry/Missions (#413/#163), Intelligence locality (#647), Server Node (#812), communications/web-presence owners and billing/entitlement implementation must consume the same versioned entitlement contract.
- Product entitlement is evaluated before capability exposure, while effective authority is still evaluated independently at execution time.
- Pricing/user-count defaults remain configurable commercial policy rather than roadmap architecture.

## Phase 3 — Workforce, One/Zero & Continuous Operation

Primary owners:
- TZ-ROADMAP-41 #639 workforce identity/hierarchy.
- TZ-ROADMAP-42 #640 earned Trust/Autonomy.
- #768 Personal Zero.
- #153 Business Memory.
- #542 One installable PWA + one native mobile app, each with governed Zero/Go/Hub modes; `apps/web` remains the separate full base web application.
- #725 identity/context continuity.
- #811 24/7 hosted runtime.
- TZ-ROADMAP-04 #163 Mission runtime for ephemeral, campaign, standing and crisis work.

Required delta:
- explicit One / Personal Zero / Business Reality / Business Memory / Workforce separation;
- establish the shared product entitlement contract from #1042 so Zero/Go/Hub and external channels expose tier-appropriate capabilities without creating separate cores or authority paths;
- portable Zero identity across company relationships;
- continuous workforce remains active without clients open;
- all surface state is projection of evidence-backed hosted state;
- learning and memory remain authority-neutral;
- Missions are first-class outcome scopes over canonical business entities, with temporary workspaces/interfaces/workforce/integrations/permissions rather than duplicated customer, asset, job or financial truth;
- Mission completion is evidence-backed and machine-verifiable; closure promotes required permanent state, archives evidence, revokes temporary authority and retires ephemeral resources.

Exit gate:
One can disconnect/reconnect through Zero/Go/Hub while ongoing governed work survives, resumes without duplication and projects truthful current state with provenance.

## Phase 4 — Business Node Control Plane, Business Engine & Capability Fabric

Primary owners:
- P0 #812 DirectAdmin Business Node control plane / Server Node.
- P1 #1051 optional Frappe/ERPNext Extension Business Engine provider.
- P1 #1049 shared DirectAdmin Cockpit SDK.
- P1 #1044–#1062 Business Node cockpits/plugins, including Surfaces, Channels, Interaction and Decision.
- P1 #1053 Communications, #1054 Finance & Commerce, #1055 Intelligence, #1056 Governance & Assurance.
- P2 #1057 Sprout / vertical-pack cockpit.
- TZ-ROADMAP-20 #322 deployment/release.
- TZ-ROADMAP-28 #403 connectors.
- TZ-ROADMAP-31 #7 capability/tool registry.
- TZ-ROADMAP-32 #432 MCP.
- TZ-ROADMAP-45 #643 Browser Node.
- TZ-ROADMAP-49/#645 Edge Fabric.
- TZ-ROADMAP-29 #413 — governed Developer Platform / AI App Foundry.

Required delta:
- consume #1042 tier/locality entitlements so Team/Business/Sovereign packaging can expose Server Node, Foundry, Mission and web-presence capabilities without letting subscription state become execution authority;
- establish DirectAdmin as the first **Titan Business Node control plane / meta-orchestration engine**, sitting at the server and managing the business's complete digital system estate;
- persistent TypeScript/Node workforce runtime coordinated through the Business Node control plane;
- install/manage bounded DA/API/MCP capabilities for applications/sites, WordPress/Microweber, Git, Node/PHP, domains/DNS/TLS, email/Rspamd, DB/Redis, security, backup/restore, services, devices/nodes, diagnostics and governed terminal;
- optionally install/manage **Frappe Framework + selected ERPNext extension capabilities**, behind stable Titan Domain APIs and per-company provider site/database isolation, without replacing mature native Titan FSM capabilities by default;
- DirectAdmin orchestrates Business Engine provisioning, health, migrations, backup/restore, reconciliation and upgrades; Frappe does not become Titan authority, Workforce, Evidence Ledger or customer-facing UI;
- DirectAdmin Business Node cockpits coordinate Zero, Workforce, Operations, Foundry, Web/Portal and Dev as one expert/operator meta-layer over canonical Titan systems;
- capability discovery never creates authority;
- `Deploy → Preview → Verify → Promote` commissioning lifecycle;
- atomic update/rollback and host-replaceability proof;
- external DA projects are donors/providers, never canonical control planes;
- App Foundry resolves business capability requirements against existing Titan capabilities before external discovery or generation;
- imported/adapted/generated software becomes a versioned Titan Package with source provenance, licence/SBOM, declared capabilities, permissions, runtime, health, backup, update and rollback contracts before deployment;
- software supply may include Titan modules, verified repositories, package/container registries, customer software, APIs or generated micro-apps, but no supply source becomes a trust/authority boundary;
- composite apps prefer canonical capability/event/API composition over source-tree mashups, while generated Mission micro-apps remain thin surfaces over canonical business state;
- Foundry builds run in isolated sandboxes with licence, dependency, security, compatibility, migration and test gates before governed deploy/preview/verify/promote;
- software-intelligence and Foundry Recipe metadata preserve reusable understanding of capabilities, APIs, schemas, tenancy, dependencies, integrations, tests, provenance and upstream maintenance history.

Exit gate:
A clean DirectAdmin VPS can install, run, upgrade, recover and verify the canonical Titan Business Node control plane, hosted Workforce and native FSM; when enabled, isolated Frappe Extension Business Engine tenancy. The control plane can manage domains, email, sites, applications, data services, backups, security, nodes/devices and deployments from one governed operations environment. The same business identity/evidence/authority semantics remain portable without DirectAdmin or Frappe, and the Node can materialize/retire verified Titan Packages and Mission workspaces without creating parallel factual truth or authority.

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
- constitutional downgrade/revocation always fails closed;
- plain-language business policy may compile into versioned machine-enforced approval/limit rules, but compiled policy cannot exceed Constitution or effective-authority ceilings and must retain source, version, approval and evidence lineage.

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
- outcome learning can modify recommendations/policies only through bounded governed paths and never self-grant authority;
- completed Missions feed reusable outcome/exception/cost evidence so Titan can improve future Mission templates, Foundry Recipes and capability recommendations without silently changing business truth or authority.

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
- make Business → Sovereign a portable deployment/locality transition over the same evidence-backed business identity, with entitlement and locality changes recorded independently from authority;
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
11. Missions, generated micro-apps and temporary portals reference canonical business state; they never create a parallel customer/job/asset/finance source of truth.
12. Imported/generated packages, repositories, models and installers are software supply/providers only; discovery, installation or technical privilege never grants Titan business authority.
13. Commercial tier/product entitlement controls capability exposure only; it never grants execution authority, rewrites business identity, or creates a parallel truth store.
14. Upgrade/downgrade preserves factual history and business identity; unavailable paid capabilities fail safely without destructive data loss.
