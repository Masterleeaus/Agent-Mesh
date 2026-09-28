# Titan Zero Canonical Rules

These are guardrails for every agent and PR.

- `company_id` is Titan's canonical logical company identity and remains mandatory in authorization, routing, API/event context, evidence and correlation. Legacy tenant fields may exist only as compatibility inputs and must normalize before authorization, storage or execution. Canonical business-domain provider state is additionally isolated by a dedicated Frappe site/database per company by default.
- Canonical product surfaces are `zero`, `go`, and `hub`. Aliases are compatibility/branding only.
- Commercial portfolio labels, channels and plans do not create additional canonical surfaces. External AI hosts, WordPress/Web Presence and Omni are adapters/projections over canonical capabilities.
- Commercial entitlement, user role, capability availability and effective execution authority are separate concerns. A paid plan, add-on, host privilege or installed plugin never grants business authority by itself.
- The canonical commercial tier progression is Solo → Team → Business → Sovereign. Prices and user-count thresholds are configurable business policy, not architecture invariants.
- Upgrade/downgrade changes capability exposure over the same business identity/evidence history; they must not require migration between competing business cores or silently destroy historical data.
- Shared capability and business logic belongs in Core/shared runtimes, not duplicated in surface adapters.
- The Business Evidence Ledger is the primary factual history for consequential business state. Material current-state views are deterministic projections/folds with provenance to accepted evidence; databases/caches/UI projections are not truth merely because they are current.
- Evidence history is append-only after acceptance. Correction, supersession, rollback, compensation and recovery create new evidence; they never rewrite factual history.
- Provider acknowledgement is not a verified outcome. Consequential execution must reach observed-state verification before Titan records a verified business outcome.
- Command Bus / ExecutionGateway remains the mutation authority for consequential governed execution.
- Identity, capability, intelligence, infrastructure privilege and authority are separate concerns. Host/root/admin, provider, model, node, device, surface or agent identity alone never grants business authority.
- Capability discovery, simulation/counterfactuals, recommendations, predictions, consensus and registration/activation never create execution authority.
- Factual and counterfactual histories are strictly separated; simulated history cannot silently become factual history.
- One, Personal Zero, Business Reality, Business Memory/Knowledge and Workforce are distinct architectural concerns and must not be collapsed into each other.
- DirectAdmin is the first Titan Server Node and the primary Business Node **operations/control-plane and meta-orchestration layer**. It installs, discovers, coordinates, monitors and lifecycle-manages the business's systems, applications, infrastructure and hosted workforce. It remains separate from canonical factual truth and business authority: DirectAdmin/root/admin privilege never grants Titan execution authority, and Zero/Go/Hub remain the canonical business interaction surfaces.
- Infrastructure materializes Titan but never defines Business Node identity or factual history. Titan must remain recoverable onto another supported substrate.
- DirectAdmin is the Business Node meta-orchestrator; Frappe Framework/selected ERPNext capabilities are the first operational Business Engine substrate beneath it. Frappe may own provider-local transactional/materialized state, but Titan surfaces consume stable Titan Domain/Capability contracts and factual history remains evidence-backed.
- Business Engine tenancy defaults to shared versioned runtime/code with per-company Frappe site/database isolation; `company_id` remains mandatory logical identity/auth/routing/evidence context and provider site/database identity never grants authority.
- DirectAdmin account creation does not automatically create a Titan company or Frappe site. Business Engine provisioning is an explicit governed Titan action with actor, company, entitlement, authority, idempotency, verification and evidence.
- Titan Domain/API/provider contracts remain company-scoped even when provider storage is physically isolated. Surfaces and agents never receive raw provider database credentials or depend directly on Frappe/ERPNext schema names.
- #913 Business Evidence Ledger remains the canonical factual history. Frappe/ERPNext databases are operational/materialized domain state unless an explicit canonical contract says otherwise.
- Device-first, privacy-first and Cost Sovereignty ordering must be preserved.
- Reuse or extend canonical capabilities, workforce identities and contracts before creating new ones.
- Titan Constitution invariants must fail closed and cannot be overridden by plugins, hosts, providers, interfaces or workforce agents.
- Rewind/recovery is evidence-driven reconstruction/compensation, not a parallel execution engine.
- A Titan Capsule is a portable, versioned, verifiable rehydration package; recovery must preserve immutable history while revalidating present authority and credentials.
- Federation may coordinate sovereign Titan nodes only through explicit identity, consent, evidence and authority contracts; it must never weaken `company_id` isolation.
- Titan Code is private development/operations tooling and must never become a Titan Zero customer runtime dependency.
- Architecture/workforce specifications are referenced by the roadmap; large duplicate copies do not belong inside roadmap subgoals.
- Completed work is evidence, not future work. Roadmap entries and issues should describe what remains.

Canonical architecture target: `docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md`.
Roadmap phase convergence map: `roadmap/PHASE-MAP-V3.md`.
