# Titan Zero Canonical Rules

These are guardrails for every agent and PR.

- `company_id` is Titan's canonical logical company identity and authorization/routing/evidence boundary. Legacy tenant identifiers may exist only as compatibility inputs and must normalize before canonical authorization/execution. Company-owned native operational persistence defaults to one physical database per Titan company behind a fail-closed storage mapping/resolver. Optional providers may add their own stricter physical isolation (for example a per-company Frappe site/database) without replacing `company_id`. Database selection never grants authority.
- Identity/bootstrap metadata required to resolve an authenticated actor to `company_id` and an approved storage placement belongs to a bounded GLOBAL_REGISTRY/control-plane store; it must not require opening an unknown company business database first. `account_id` and provider-local IDs map explicitly to `company_id` at compatibility ingress and never become implicit aliases.
- Global actor identity is distinct from company-local worker/staff operational records. Authentication credentials, principal identity, memberships and context revocation live in the bounded identity/bootstrap owner; company FSM databases may reference the stable actor/user ID and store local worker profile/assignment data, but cannot become the sole authentication or cross-company membership authority.
- Company provisioning precedes product onboarding. Provisioning owns durable company identity, storage placement, isolated native FSM database creation/migration/health, initial global membership and READY/FAILED lifecycle. Existing onboarding configures an already-provisioned company and must not create infrastructure or imply authority.
- Canonical product modes are `zero`, `go`, and `hub`. Titan PWA is one installable application with these three governed modes; native mobile follows the same one-app/three-mode model. `apps/web` is a separate full base web application, not the PWA.
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
- DirectAdmin is the Business Node meta-orchestrator. Titan's mature native FSM remains the default field-service implementation. Frappe Framework/selected ERPNext capabilities are an optional Extension Business Engine; Frappe may own provider-local state only for capabilities deliberately delegated/enabled through stable Titan Domain/Capability contracts.
- When Frappe is enabled, its tenancy defaults to shared versioned runtime/code with per-company site/database isolation; `company_id` remains the canonical cross-system identity/evidence boundary and provider site/database identity never grants authority.
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
