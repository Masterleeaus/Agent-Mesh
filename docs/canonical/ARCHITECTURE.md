# Titan Zero Architecture

Status: canonical product architecture. For the full runtime and evidence model, see [Titan Zero Blueprint v3](../architecture/TITAN-ZERO-BLUEPRINT-V3.md) and [Canonical Rules](../architecture/CANONICAL-RULES.md).

## Product shape

Titan Zero is a governed workforce and field-service operating platform in a TypeScript monorepo. The full TypeScript application in `apps/web` is the native Titan field-service product. It must install and operate without Frappe.

The separate Titan PWA and Flutter mobile app expose entitled Zero, Go, and Hub modes over the hosted Titan runtime. They are not replacements for `apps/web`. DirectAdmin is the Business Node operations and infrastructure control plane; it is not a customer business surface or authority source.

## Runtime ownership

| Component | Canonical role |
| --- | --- |
| `apps/web` | Complete native Titan FSM web product and user interface. |
| Titan Workforce/runtime | Persistent governed execution and business operation runtime. |
| Company database | Native company-owned operational persistence, physically isolated per company and resolved through canonical `company_id`. |
| Business Evidence Ledger | Append-only factual history; current state is derived and verified against evidence. |
| Frappe/ERPNext | Optional provider for explicitly delegated extensions or missing/deeper capabilities. It is not required for base installation and does not replace mature native FSM ownership by default. |
| DirectAdmin Business Node | Provisions and manages hosts, services, applications, optional Frappe sites, and deployment lifecycle through governed capabilities. It does not own Titan business semantics or grant business authority. |

Frappe enablement is a deliberate per-company configuration. If selected, provision an isolated site/database for that company, register provider mappings behind stable Titan contracts, and verify authority, sync, conflict handling, idempotency, evidence, health, backup, upgrade, disablement, and rollback. Titan application surfaces use Titan APIs and provider contracts; they do not access provider databases directly.

## Onboarding, verticals, and generated applications

Company provisioning creates company identity, native storage placement, and initial membership before product onboarding. Onboarding configures an already provisioned company: it discovers needs, guides setup, gathers evidence and approvals, and prepares typed configuration intents. It does not create infrastructure, grant authority, or own vertical definitions.

Versioned vertical packs define industry terminology, workflows, standards, capability bundles, and optional provider extensions. The vertical compiler validates and resolves a pack before installation. Titan Sprout manages pack discovery, configuration, versioning, staged rollout, upgrade, and retirement. Core business facts remain with their canonical native or explicitly delegated domain owners.

Nexus may coordinate discovery, recommendations, and proposed configuration or deployment work. Proposals must resolve to versioned capabilities, packs, and typed intents, then pass normal policy, authority, execution, verification, and evidence checks. Nexus is not a second customer/job/finance store and cannot silently promote generated output to factual configuration.

Foundry generates, validates, previews, stages, deploys, and retires application packages, including temporary Mission apps. DirectAdmin supplies managed infrastructure and application lifecycle operations for those packages. Temporary applications receive bounded company and capability scope, expiry/retirement behavior, and verified cleanup of runtime resources and credentials; required evidence and approved business outcomes remain.

## Consequential execution

Use the canonical flow:

`Intent → Decision → Risk → Assurance → Effective Authority → ExecutionGateway → Provider effect → Observed-state verification → Verified outcome → Business Evidence Ledger`

Provider acknowledgements are not verified outcomes. UI state, model recommendations, plugin roles, host privileges, and installed software do not create Titan business authority.

## Historical Dovetails documentation

Older Dovetails FSM and PostgreSQL deployment notes describe a previous product/repository state. They are historical context only and must not override the Titan Zero architecture, Blueprint v3, or Canonical Rules. Do not use account-scoped legacy persistence or the old local deployment target as the current Titan production contract.
