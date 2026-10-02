# Titan Zero Blueprint v3 — Evidence-First Sovereign Business Architecture

Status: canonical architectural direction for roadmap convergence
Date: 2026-09-28

## 1. Executive definition

Titan Zero is a managed Advanced Intelligence Workforce for existing businesses. It does not replace working systems by default. It discovers the business, connects what already works, improves what is inadequate, builds only what is missing, commissions a governed workforce, and then continuously operates and improves that workforce.

The canonical human relationship is:

`ONE → ZERO → WORKFORCE → GOVERNED EXECUTION → EVIDENCE → VERIFIED REALITY → ZERO`

One is the human principal. Zero is One's persistent digital working intelligence. The Company Model is the business reality model. Workforce agents are canonical business actors with durable agent identity. Models, providers, devices, hosts, plugins and interfaces are capability/execution substrates, never business authority.

## 2. Primary architectural inversion: Evidence is the source of truth

Titan Zero is evidence-first, not database-first.

Old framing:

`mutable state → decisions/actions → audit evidence`

Canonical framing:

`append-only Business Evidence Ledger → deterministic folds/projections → current state views`

No consequential business state may exist without provenance to ledger evidence. Material state projections must be reconstructable from accepted ledger entries plus declared deterministic projection logic.

The evidence ledger is not merely a compliance log. It is the primary factual history of the business system.

### Ledger invariants

- `company_id` remains the only canonical company boundary.
- Ledger entries are append-only and immutable after acceptance.
- Corrections, supersession, rollback and compensation create new evidence; they never rewrite factual history.
- Provider acknowledgement is not a verified outcome.
- A projection/cache/database row is not canonical truth merely because it is current.
- Generated UI, models, agents, plugins, host panels and provider APIs may propose or project state but cannot silently manufacture factual history.
- Every consequential mutation must produce correlation, authority, execution and verification evidence.
- Simulated/counterfactual history can never become factual history without a separately governed real-world action and verified evidence.

## 3. Canonical truth layers

### 3.1 Business Evidence Ledger
Immutable event/evidence chain containing observations, claims, decisions, approvals, commands, execution receipts, provider acknowledgements, verification evidence, corrections, reversals, outcomes and governance events.

### 3.2 Business Reality projections
Derived current-state views folded from factual evidence. These support CRM/service state, schedules, finance, inventory, workforce state, decisions and operational views while retaining reverse provenance to source evidence.

### 3.3 Personal Zero
One's persistent digital working intelligence. It maintains provenance-preserving understanding and experience but is not allowed to silently rewrite Business Reality or create authority.

### 3.4 Business Memory / Knowledge
Company-scoped knowledge and memory derived from permitted evidence and sources. Informational and advisory; never authority-bearing by itself.

### 3.5 Counterfactual branches
Explicit alternate histories and scenario branches for planning, simulation, diagnostics and forecasting. Counterfactuals are isolated from factual history and carry parent evidence references, assumptions and branch identity.

## 4. Governed execution

Canonical flow:

`Intent → Decision → Risk → Assurance → Effective Authority → Command Bus / ExecutionGateway → Capability Provider → Provider acknowledgement → Observed-state verification → Verified Outcome → Business Evidence Ledger`

Consequential execution must distinguish at least:

`REQUESTED → AUTHORIZED → EXECUTING → PROVIDER_ACKNOWLEDGED → VERIFYING → VERIFIED`

or an equivalent canonical lifecycle.

Execution authority is never created by intelligence, discovery, capability availability, model confidence, host privilege, subscription tier or plugin installation.

## 5. Titan Constitution

Titan Constitution is the machine-enforced policy layer that defines invariants which no agent, host, plugin, provider or interface may override.

The Constitution includes at minimum:

- company isolation;
- evidence/provenance requirements;
- One/Zero/business identity separation;
- authority construction and ceilings;
- irreversible/high-consequence handling;
- privacy, consent, locality and data-egress boundaries;
- Cost Sovereignty;
- provider/model/device/host neutrality;
- factual vs simulated history separation;
- recovery/rollback/compensation rules;
- cross-company/federation boundaries.

Constitution policy is versioned and itself evidenced. A policy change does not rewrite prior history.

## 6. One and Zero

One is the human principal/account holder, not necessarily the business owner.

Zero is One's persistent digital working intelligence across explicitly permitted contexts. Owner/manager, worker, customer and future personal contexts are governed projections/capability scopes of the same Personal Zero architecture, not separate Zero engines.

Business/company context is a relationship. Ending a company relationship removes company-owned context, capabilities and authority without automatically destroying unrelated personal Zero state.

## 7. Workforce

Titan Workforce is a canonical company-scoped organisational/control layer built from actual pain points and desired verified outcomes.

Agent identity is separate from model/provider/device/host identity.

Hierarchy remains:

`Worker → Specialist → Manager → Orchestrator`

Predictive capability is earned behaviour, not a fifth identity tier.

Trust/Autonomy progression remains capability/operation specific and cannot silently increase authority.

## 8. Titan Business Node Control Plane / Server Node

DirectAdmin is the first deployment beachhead for the Titan Server Node **and the primary Business Node control plane / meta-orchestration system**.

The DirectAdmin layer is not merely a hosting plugin. It is the business operations cockpit and orchestration plane that supervises, composes and governs the customer's digital operating environment: workforce runtimes, applications, websites, data services, communications, integrations, deployments, devices/nodes, backups, security, health and recovery.

DirectAdmin therefore acts as the **physical/operational management layer of the Business Node** while Zero remains the intelligence interface and the Business Evidence Ledger remains the factual history.

It is not required to own canonical business truth itself, and DirectAdmin/root/admin privilege never becomes Titan business authority. But it is intentionally the place where the business's systems are installed, discovered, coordinated, monitored, repaired, upgraded and lifecycle-managed.

Canonical Zero/Go/Hub remain the main business interaction surfaces; DirectAdmin is the expert/operator Business Node cockpit and meta-layer that manages the systems underneath them.

### Server Node / Business Node control-plane responsibilities

- install and supervise the canonical Titan Workforce Host and its dependent business runtimes;
- maintain persistent Node/TypeScript runtime(s);
- expose bounded DirectAdmin/API/MCP capabilities;
- manage the complete business application estate, including WordPress, static/TypeScript, Node, PHP, Git deployments, approved containers, generated/temporary apps and connected systems;
- DNS, SSL, mail, database, Redis and service capabilities;
- security capability integration such as CSF/BFM/ModSecurity/ClamAV where available;
- backup/restore integration and verification;
- deployment preview, health verification, promotion and rollback;
- governed terminal/command capabilities;
- business-wide system discovery, resource/health observation, drift detection and coordinated remediation;
- evidence collection for host/application execution.

### 8.0 Physical native company isolation

Titan's mature native FSM remains the default field-service implementation. `company_id` is the canonical logical identity, while company-owned operational persistence defaults to **one physical database per Titan company** behind a fail-closed company storage resolver/mapping. The resolver is a placement boundary, not authority. Shared runtime/control/evidence stores are allowed only for explicit canonical owners and must not become a shared operational business database. Initial deployments may use isolated SQLite company databases where supported; future placement may use another certified database without changing Titan domain contracts. Backup, restore, migration and upgrade operate company-by-company.

### 8.1 Extension Business Engine — Frappe/ERPNext

DirectAdmin is the Business Node **meta-orchestration/control plane**; it does not need to reimplement mature CRM/ERP/domain primitives itself.

**Titan's mature native TypeScript FSM is the default operational field-service product.** Frappe Framework with selected ERPNext capabilities is an optional **Extension Business Engine** managed from the DirectAdmin Business Node control plane.

The intended layering is:

```
ONE / ZERO
    ↓
Titan Workforce + Governance
    ↓
Titan Domain / Capability contracts
    ↓
DirectAdmin Business Node Control Plane
    ├─ Business Engine (Frappe/ERPNext)
    ├─ Websites / WordPress / Microweber
    ├─ Domains / DNS / TLS
    ├─ Email / Rspamd
    ├─ Databases / Redis
    ├─ Applications / Node / PHP / Git
    ├─ Devices / Nodes / Sync
    ├─ Backups / Recovery
    ├─ Security / Diagnostics
    └─ Foundry / temporary Mission apps
    ↓
Verification → Business Evidence Ledger
```

Frappe/ERPNext provides optional deeper ERP/HR/payroll/procurement/warehousing/manufacturing/custom-module capabilities and may provide a deliberately selected implementation for a domain facet. Titan consumes it through a **Titan Domain API / anti-corruption layer** rather than binding surfaces directly to Frappe DocTypes or Desk UI. Existing mature Titan FSM capabilities remain native unless explicitly delegated.

When Frappe is enabled, its default tenancy is **shared versioned application/runtime code with per-company Frappe site/database isolation**. Titan `company_id` remains the cross-system business identity and evidence boundary; the provider site/database is an additional physical isolation boundary, not a replacement identity.

Frappe/ERPNext is therefore an optional extension/provider engine beneath Titan for enabled/delegated capabilities. It does not replace:
- the Business Evidence Ledger as factual history;
- Titan Constitution / Trust / Authority;
- Titan Workforce identity/runtime;
- the canonical capability graph;
- Zero/Go/Hub presentation contracts.

DirectAdmin owns the orchestration and lifecycle of the Business Engine: provision, configure, inspect, migrate, back up, restore, reconcile, upgrade, health-check and retire it through governed capabilities.

### Server Node governance

Host/root privilege never becomes Titan business authority.

Curated capability execution is preferred over arbitrary shell execution. Emergency shell/elevated execution requires explicit stronger authority and complete evidence.

External DirectAdmin implementations such as MCP/API layers are execution/capability providers **inside the Titan Business Node control plane**. They may extend operational reach, but they do not replace Titan's canonical authority, evidence, workforce or capability ownership.

Canonical deployment lifecycle:

`Package → Install → Configure → Preview → Verify → Promote → Observe → Update/Rollback`

No deployment is considered commissioned merely because a process started or API call succeeded.

## 9. Surfaces and channels

Canonical product surface identities remain:

- `zero` — owner/manager mode;
- `go` — worker/field mode;
- `hub` — customer mode.

Titan has **one canonical PWA application with three governed modes: Zero, Go and Hub**. Native mobile follows the same one-application / three-mode model. The modes share the canonical Titan Runtime, company identity, capability graph, Workforce, Interaction/Decision contracts and evidence-backed business state while enforcing mode-specific audience, privacy, entitlement and offline behavior.

**The PWA is not `apps/web`.** The TypeScript `apps/web` application is the separate **full Titan base web application**. It may contain the complete browser-based business application experience while preserving its mature native AI-FSM field-service capabilities and progressively converging duplicated Titan runtime mechanisms behind canonical contracts. Frappe is optional extension infrastructure, not the default replacement for native FSM persistence. Do not collapse the base web app into the PWA, and do not treat the PWA as merely a route/mode inside `apps/web`.

Canonical deployment distinction:

```
Titan Base Web App (apps/web)
  = full server-hosted browser application

Titan PWA
  = one installable PWA
      ├─ Zero mode
      ├─ Go mode
      └─ Hub mode

Titan Native Mobile
  = one native application
      ├─ Zero mode
      ├─ Go mode
      └─ Hub mode
```

Browser Node, ChatGPT/MCP/external assistants, voice, messaging and future channels are additional adapters/projections over the same hosted Workforce and evidence-backed state.

Interfaces and modes do not own business truth, authority or Workforce runtime. Titan Surfaces manages deployment/lifecycle/health of interface endpoints; canonical runtime/contracts remain singular.

## 9.1 Commercial product portfolio and entitlement architecture

Titan is one platform packaged through multiple customer-facing entry products and four commercial tiers. Commercial packaging must never redefine canonical runtime ownership.

### Customer-facing portfolio

The customer-facing portfolio is:

- **Titan Zero** — owner/manager experience over canonical `zero`;
- **Titan Go** — field/worker experience over canonical `go`;
- **Titan Hub** — customer self-service experience over canonical `hub`;
- **Titan in external AI hosts** — ChatGPT, Claude and future assistants as authenticated adapters over canonical Titan capabilities;
- **Titan for WordPress / Web Presence** — website and CMS adapters that turn an existing site into an operational front door without creating another CRM or business core;
- **Titan Omni** — messaging/voice/channel projections sharing Interaction, identity, conversation and governed execution contracts.

Foundry, Missions, Compliance/Policy packs, Private/Sovereign Intelligence and Server Node controls are platform capabilities/deployment profiles exposed by commercial entitlement. They are not additional business truth stores or canonical surfaces.

### Commercial tiers

| Tier | Intended operating profile | Commercial capability envelope |
| --- | --- | --- |
| **Titan Solo** | Solo operators and micro-businesses, typically 1–3 people | Zero with a deliberately small operational envelope, external-AI-host access, limited Omni/channel use and core booking/quote/invoice/customer workflows. |
| **Titan Team** | Small service teams, typically 4–10 people | Full Zero, Go, basic Hub, external AI hosts, broader Omni, WordPress/Web Presence integration, field/offline/evidence workflows and baseline compliance. |
| **Titan Business** | Mid-market/multi-team businesses | Team plus Foundry, Missions, stronger compliance/policy controls, capability-gap detection/digital-twin style analysis and governed composite/temporary applications. |
| **Titan Sovereign** | Enterprise, regulated or customer-controlled infrastructure | Business plus Private/Sovereign Intelligence deployment profiles, Server Node/control-plane capabilities, locality/data-residency controls, advanced workforce/audit/recovery and contractual operational guarantees. |

User-count ranges and prices are commercial defaults, not architecture invariants. They must be configurable without changing identity, evidence, authority, data ownership or business-state schemas.

### Entitlement separation

Titan must maintain a versioned entitlement model separating:

1. commercial plan/tier;
2. customer-facing product/channel availability;
3. capability entitlement;
4. metered usage/quota/funding;
5. runtime locality/provider eligibility;
6. user membership and role;
7. effective business execution authority.

Entitlement answers **what the subscription exposes**. Authority answers **what this actor may execute now**. A paid tier, add-on, provider subscription, host privilege or product installation can never grant business authority by itself.

Entitlement decisions and changes must be auditable. Upgrades and downgrades must preserve business identity and factual history. Solo → Team → Business is an entitlement expansion over the same business state, not a data migration between product cores. Business → Sovereign is a governed deployment/locality transition, not a fork.

Downgrade semantics must define retention/read-only/grace behavior for no-longer-entitled capabilities, preserve historical evidence, avoid destructive data loss, and revoke capability exposure without silently changing prior facts or widening authority.

### Upgrade signals

Titan may recommend an upgrade when evidence shows a meaningful need, such as:

- user/headcount growth requiring Go/team coordination;
- a Mission-shaped project/campaign/crisis;
- compliance/assurance requirements;
- multi-location/complex integration needs;
- data-residency, security-review or customer-controlled-infrastructure requirements.

These are Signal/recommendation inputs only. They cannot self-purchase, self-upgrade or self-expand authority.

### Commercial supersession rule

Historical packaging such as **Titan Nano**, **Titan Pro**, or assumptions that a free tier includes unrestricted/full cloud AI is donor/history unless explicitly re-adopted by the current commercial entitlement contract. Current architecture uses **Solo → Team → Business → Sovereign** as the commercial tier model while preserving provider neutrality and Cost Sovereignty.

## 10. Capability architecture

Titan follows reuse-first capability composition:

`KEEP → CONNECT → AUGMENT → BUILD → REPLACE → RETIRE`

Capability discovery is authority-neutral. Every active capability has a canonical capability ID, owner, provider binding, permission/authority contract, failure modes, version/compatibility metadata, verification contract and evidence output.

DirectAdmin, MCP, Browser Node, mobile device capabilities and external SaaS systems project into this same capability graph.

## 11. Rewind, recovery and sovereign snapshots

Rewind is evidence-driven recovery/reconstruction, not a competing execution engine.

A correction, rollback, compensation or restore is always a new governed action correlated to immutable historical evidence.

Titan must support deterministic reconstruction of:

- decisions and authority state;
- work/runtime state;
- factual Business Reality projections;
- configuration/deployment state;
- Personal Zero permitted state;
- evidence chain integrity.

## 12. Titan Capsule

A Titan Capsule is a sovereign, portable, verifiable package sufficient to rehydrate a Titan business/Zero environment without depending on the current host/provider.

A Capsule includes the required signed/versioned subset of:

- evidence ledger and integrity metadata;
- schemas and projection versions;
- company/workforce/configuration manifests;
- authority/governance/Constitution versions;
- required durable state and encrypted secrets references/restore procedures;
- application/runtime/deployment manifests;
- provider/capability bindings;
- compatibility/provenance metadata.

A Capsule is not merely a backup archive. It is a rehydratable system identity and history package.

## 13. Zero Recovery

Zero Recovery is the capability to rebuild or relocate Titan from a valid Capsule plus supported execution/storage substrates.

Required scenarios include:

- server loss;
- DirectAdmin replacement;
- provider failure;
- migration to another VPS/control panel;
- controlled clone/test environment;
- disaster recovery;
- future local/edge/customer-hosted rehydration.

Recovery must preserve identity/history while revalidating current authority, credentials and external provider state.

## 14. Federation

Federation is a late-stage capability permitting independently sovereign Titan nodes/companies/Ones to cooperate without merging their canonical truth stores or authority domains.

Federated exchange must use explicit contracts for:

- identity and relationship;
- data/evidence sharing scope;
- capability offers/requests;
- authority ceilings;
- privacy/consent;
- provenance;
- settlement/value attribution where applicable;
- revocation and expiration.

Federation must never weaken `company_id` isolation or permit one node to mutate another node's truth without governed, accepted evidence at the receiving boundary.

## 15. Eight-phase roadmap architecture

### Phase 1 — Evidence & Isolation Foundation
Make append-only Business Evidence Ledger and `company_id` isolation load-bearing. Certify all consequential state has provenance and canonical runtime persists/reconstructs from evidence-compatible storage.

### Phase 2 — Reality Projections & Governed Execution
Converge Business Reality projections, canonical execution lifecycle, observed-state verification, idempotency, recovery and evidence-backed outcomes.

### Phase 3 — Workforce, One/Zero & Continuous Operation
Complete durable workforce identity/runtime, Personal Zero boundaries, Business Memory/Reality integration and continuous 24/7 server-hosted operation across disconnected interfaces.

### Phase 4 — Titan Server Node & Capability Fabric
Commission DirectAdmin as first Titan Server Node; integrate application/site/runtime/security/backup/terminal capabilities through canonical capability registry, governance and evidence. Prove host replaceability.

### Phase 5 — Constitution & Earned Autonomy
Make the Titan Constitution machine-enforced across every execution substrate. Complete Trust/Autonomy handshakes, operation-specific limits, policy versioning, downgrade/revocation and constitutional certification.

### Phase 6 — Counterfactuals, Rewind & Continuous Improvement
Add isolated counterfactual branches, deterministic reconstruction, evidence-backed scenario comparison, recovery/compensation, outcome learning and bounded optimisation.

### Phase 7 — Capsule, Sovereignty & Zero Recovery
Implement signed portable Titan Capsules, pause/rehydrate/clone workflows, full Zero Recovery and restore onto a second execution/storage substrate with verified semantic equivalence.

### Phase 8 — Federation
Implement explicit federation contracts between sovereign Titan nodes/companies/Ones while preserving isolation, consent, evidence provenance and authority boundaries.

## 16. Architectural invariants

1. `company_id` is the only canonical company boundary.
2. No consequential state without provenance.
3. Evidence history is append-only; correction creates new evidence.
4. Provider acknowledgement is not verified outcome.
5. Capability/intelligence/simulation never creates authority.
6. Host/root/provider/model/device/surface identity never creates business authority.
7. Infrastructure materializes Titan but never defines Business Node identity or truth.
8. Simulated/counterfactual history never silently becomes factual history.
9. One, Personal Zero, Business Reality, Business Memory and Workforce are distinct concerns.
10. Surfaces/channels/plugins are projections/adapters, never independent business cores.
11. Reuse/converge before creating new engines, registries or runtimes.
12. Titan Code is private development tooling and never a production dependency.
13. Recovery preserves immutable history and revalidates present authority.
14. A Titan Capsule must permit rehydration without the original host/provider.
15. Federation cannot weaken sovereignty or company isolation.

## 17. Donor/reference strategy

For DirectAdmin/Titan Server Node implementation, treat external projects as donors/providers, not architectural owners. Current priority references include DirectAdmin MCP/API control-plane implementations, Node application manager patterns, Borg-style secure restore/deployment patterns, Poralix DirectAdmin operational utilities, CSF/BFM/security integrations, Redis/SSH management and remote backup transports.

Adoption rule: COPY only compatible bounded implementation; ADAPT reusable semantics; REWRITE where language/security/architecture requires; REJECT duplicate business authority/control planes.

## 18. Roadmap convergence rule

The existing 55-goal roadmap remains the executable work inventory until compacted. It must now be mapped beneath these eight phases. Existing goal/subgoal IDs should remain stable where practical; change their objectives/acceptance only where needed to satisfy this blueprint. Do not create another competing roadmap authority.
