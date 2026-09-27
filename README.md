# Titan Zero Field Service Workforce

> A governed Advanced Intelligence workforce and field-service operating platform for real businesses.

Titan Zero Field Service Workforce is a full-stack TypeScript platform for coordinating intelligent digital workers across field-service operations while keeping business authority explicit, constrained, and auditable.

The repository combines a working field-service operating system with a broader platform layer covering workforce orchestration, decision intelligence, authority boundaries, offline operation, interface runtimes, connectors, business workflows, and deployment infrastructure.

## What it demonstrates

- Multi-tier intelligent workforce architecture
- Managers, supervisors, agents, and atomic workers
- Delegation envelopes and authority ceilings
- Approval gates and escalation chains
- Decision and intelligence runtimes
- Deterministic risk classification
- Signal prioritisation and Model Council recommendations
- Nexus orchestration
- Local/offline capabilities
- Provider and inference routing
- MCP and connector contracts
- Business operations and field-service workflows
- Full-stack TypeScript application architecture
- PostgreSQL, Redis, Docker, testing, and CI

## Why this project exists

Most AI applications stop at chat, recommendations, or isolated agents. Titan Zero explores the harder systems problem: how to coordinate multiple intelligent workers, tools, interfaces, business processes, and data while keeping authority explicit and auditable.

A central architectural rule is that intelligence is not authority. Predictions, recommendations, consensus, registration, and activation do not automatically grant permission to execute actions.

## Governed workforce

The workforce layer models a hierarchy of managers, supervisors, standalone agents, and atomic workers. It includes role routing, manager objectives and policies, supervisor coordination, agent bindings, worker task planning, delegation envelopes, escalation chains, approval gates, audit events, state snapshots, and knowledge-authority checks.

This allows intelligent workers to participate in business operations without silently acquiring unrestricted execution rights.

## Field-service operations

The operational application provides a concrete environment for the workforce architecture. Its domain includes capabilities such as customer and account management, property and service history, estimating and job workflows, scheduling and operational coordination, inventory, financial primitives, onboarding, notifications, revenue journeys, service operations, and background processing.

## Intelligence and decision systems

Reusable platform components include deterministic risk classification, signal normalisation and prioritisation, model/provider routing, multi-model council recommendations, Nexus orchestration, decision-engine envelopes, intelligence runtime contracts, and evidence-aware business decisions.

## Runtime and interface layer

Titan Zero includes runtime contracts for company-scoped execution, visual interfaces, interface discovery and registries, local state, capability negotiation, fallback planning, resource integrity, compatibility checks, and offline caching.

The platform also includes Prime runtime integration, Titan Builder components, connector contracts, MCP host negotiation, credential references, and inference-routing policies.

## Architecture

```text
Titan Zero Field Service Workforce
|
+-- apps/web                 Next.js operational web application
+-- services/worker          Background jobs and automation support
+-- packages/                Reusable domain, workforce and runtime capabilities
+-- db/migrations            SQL schema and migration history
+-- infra                    Docker/deployment configuration
+-- docs                     Architecture and implementation documentation
+-- ai                       Compact agent-facing project context
```

## Engineering principles

### Explicit authority
Prediction, recommendation, consensus, registration, and activation are not equivalent to permission. Execution authority is handled separately and constrained by runtime policy.

### One canonical company boundary
`company_id` is the canonical business boundary. Compatibility aliases may be normalised at boundaries, but downstream authorisation, storage, projection, decision, and execution operate on the canonical identifier.

### Contracts over hidden coupling
Platform capabilities expose explicit descriptors, schemas, policies, envelopes, and runtime contracts, making boundaries easier to test, audit, replace, and evolve.

### Evidence and recoverability
Audit events, provenance, state snapshots, decision evidence, and recovery paths are treated as architectural concerns rather than optional logging.

### Local/offline capability
The system includes offline packages, local-state handling, cache planning, capability degradation, and provider-routing mechanisms intended to reduce unnecessary dependence on always-online cloud execution.

## Technology

- Next.js / React
- Node.js
- TypeScript
- PostgreSQL
- Redis
- SQL migrations and row-level security patterns
- Docker Compose
- Background worker services
- Vitest and Playwright
- Zod/runtime schemas
- GitHub Actions

## Quick start

```bash
cp .env.example .env
pnpm install
docker compose -f infra/compose.dev.yml up -d postgres redis
pnpm db:migrate
pnpm dev:web
```

## Quality gates

```bash
pnpm gate
```

For faster static and unit feedback:

```bash
pnpm gate:fast
```

## Documentation hierarchy

1. Code and database migrations are the implemented truth.
2. `docs/canonical/` contains current product, domain, workflow, and application architecture documentation.
3. `docs/contracts/` and `docs/working/` contain supporting implementation material.
4. `ai/` provides compact agent-facing context.
5. `docs/archive/` and `docs/generated/` contain historical or generated evidence.

## Portfolio context

This repository demonstrates work across full-stack application development, TypeScript architecture, AI/agent orchestration, business-process modelling, governance and authority design, offline/local-first concepts, database design, testing, CI, and deployment infrastructure.

It is an evolving platform and research codebase rather than a packaged public SaaS release.

## Status

**Active development.**

Titan Zero Field Service Workforce is being progressively converged into a governed Advanced Intelligence workforce capable of supporting increasingly broad field-service business operations.
