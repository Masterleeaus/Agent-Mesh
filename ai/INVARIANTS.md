# Operational invariants — current Titan Zero architecture

Read before auditing, changing infrastructure/persistence, or deploying.

Canonical architecture is defined by:
- `docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md`
- `docs/architecture/CANONICAL-RULES.md`
- `roadmap/PHASE-MAP-V3.md`
- root `AGENTS.md`
- current GitHub mission issues.

This file records operational guardrails only. Historical Dovetails/AI-FSM deployment facts must not override the canonical architecture.

## Source and coordination

Current `main` + current GitHub state are implemented truth. Implementation work is coordinated through GitHub mission issues and the exact claim branch `agent/issue-<issue-number>` as defined in root `AGENTS.md`.

Do **not** use the old `docs/backlog` task-ID process as an implementation claim/gating system. Historical backlog material may remain as planning/history only.

Before changing a live/deployed environment, identify the currently commissioned Server Node/deployment from current configuration/evidence. Do not assume a historical hostname, path or provider is production merely because it appears in archived scripts/docs.

## Current application topology

Keep these distinct:

- `apps/web` = the **full Titan base web application**.
- Titan PWA = **one installable PWA with Zero / Go / Hub governed modes**.
- Native mobile = **one application with Zero / Go / Hub governed modes**.
- DirectAdmin = first Business Node control-plane host with modular expert/operator plugins.
- Persistent TypeScript Titan Runtime/Workforce runs independently of open clients.
- Titan native FSM remains the default operational field-service implementation. Frappe Framework + selected ERPNext capabilities are an optional Extension Business Engine provider beneath Titan Domain APIs.

Do not collapse the PWA into `apps/web`, create three separate PWAs, or make a DirectAdmin plugin the canonical engine it observes/configures.

## Company identity and isolation

`company_id` is Titan's canonical **logical** company identity and authorization/routing/correlation/evidence key.

Legacy `account_id`, `tenant_company_id`, team/tenant IDs and similar fields are compatibility/provider inputs only unless a current canonical contract explicitly assigns them another bounded role. Normalize to canonical company context before authorization/execution.

For capabilities deliberately delegated to #1051, Frappe uses shared versioned application code with a **separate Frappe site/database per company** by default. Native Titan FSM domains remain Titan-owned unless an explicit provider contract delegates a capability. Physical Frappe isolation does not replace `company_id`.

Never assume historical PostgreSQL RLS or a DB role is the current Titan isolation model.

## Persistence ownership

There is no universal "one database" rule.

- Business Evidence Ledger / factual history: #913 canonical evidence owner.
- Runtime/control/recovery/local/offline state: use the canonical storage owner; SQLite is valid where #811/#646/#913 or another current owner defines it.
- Native CRM/jobs/work-orders/visits/quotes/invoices/materials and other mature FSM state remain Titan-owned by default. Only deliberately delegated extension capabilities use #1051 Frappe/ERPNext materialization.
- Surface/application code must consume Titan Domain/API/provider contracts rather than direct provider DB schemas or Frappe DocTypes.

Existing PostgreSQL/SQLite business-table implementations are migration/compatibility donors until their useful validation/lifecycle/idempotency behavior is extracted and provider parity is certified.

## Governed execution

Canonical consequential path:

`Intent → Decision → Risk → Assurance → Effective Authority → ExecutionGateway → Capability Provider → provider acknowledgement → observed verification → VERIFIED → accepted evidence`

Provider/HTTP/process acknowledgement is not completion. Host/root/admin, model, plugin, subscription, capability availability or provider identity never grants Titan business authority.

Retries/restarts/reconnects must preserve idempotency/correlation and revalidate current authority where required.

## Business Node / deployment

#812 defines DirectAdmin as the first Business Node control plane / meta-orchestration host. #322 owns generic deploy/release/rollback primitives. #1051 owns Business Engine provisioning/mapping.

Canonical deployment lifecycle is:

`Package → Install → Configure → Preview → Verify → Promote → Observe → Update/Rollback`

Do not assume the historical `garonhome`, `/opt/business/ai-fsm/repo`, `infra/compose.garonhome.yml`, `app.mydovetails.com`, Home Assistant rest_commands, or the old `scripts/deploy.sh` flow are current production architecture. They are legacy deployment evidence unless current production reachability is explicitly proven.

A deploy or migration that affects a real environment requires the authority/approval specified by the current mission and deployment policy.

## Legacy database/migration material

Historical `db/migrations/NNN_*.sql`, PostgreSQL helpers, `schema_migrations`, RLS conventions and `account_id` scoping may still be reachable compatibility code. Do not delete or rename applied migrations blindly.

When touching them:
1. establish current reachability and owner;
2. preserve migration history needed for compatibility;
3. extract useful business semantics before retirement;
4. migrate active business-domain access toward Titan Domain APIs/#1051;
5. do not create new architecture that depends on the legacy PostgreSQL model unless a current canonical owner explicitly requires it.

## Runtime networking and providers

Do not assume the historical web/worker asymmetric-egress topology is canonical. Determine current Server Node/runtime network policy from current deployment configuration.

External AI, email, push, webhooks, channels and SaaS systems are capability/providers. They must follow current secrets, egress, privacy, Cost Sovereignty, authority, idempotency and evidence contracts.

## Verification

Follow the risk tiers in root `AGENTS.md`.

For infrastructure/persistence/authority/security/evidence changes:
- run the relevant Tier 3 gates where supported;
- test negative cross-company access;
- test restart/replay/recovery where applicable;
- distinguish provider acknowledgement from observed verification;
- test logical `company_id` isolation and provider-site/database isolation where #1051 is involved;
- record exact commands/results and any environment blocker.

## Historical note

The previous garonhome/PostgreSQL/Home Assistant/Dovetails deployment taught useful lessons about deploy lag, migration immutability, direct-DB test requirements and production verification. Those lessons remain relevant when applicable, but their hostnames, database roles, account tenancy and deployment scripts are **not current architectural invariants**.
