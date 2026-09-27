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

The operational application provides a concrete environment for the workforce architecture. Its domain includes capabilities such as:

- customer and account management;
- property and service history;
- estimating and job workflows;
- scheduling and operational coordination;
- inventory;
- financial and money-domain primitives;
- onboarding;
- notifications;
- revenue journeys;
- service operations;
- background processing and automation support.

## Intelligence and decision systems

Reusable platform components include:

- deterministic risk classification;
- signal normalisation and prioritisation;
- model/provider routing;
- multi-model council recommendations;
- Nexus orchestration;
- decision-engine envelopes;
- intelligence runtime contracts;
- evidence-aware business decisions.

These systems are designed so intelligence can inform action without becoming implicit permission to act.

## Runtime and interface layer

Titan Zero includes runtime contracts for company-scoped execution, visual interfaces, interface discovery and registries, local state, capability negotiation, fallback planning, resource integrity, compatibility checks, and offline caching.

The platform also includes Prime runtime integration, Titan Builder components, connector contracts, MCP host negotiation, credential references, and inference-routing policies.

## Cost and deployment sovereignty

The architecture supports routing intelligence work according to capability and cost policy rather than assuming a single model provider. This provides a foundation for local models, customer-controlled providers, and external services to coexist behind explicit contracts.

## Architecture

```text
Titan Zero Field Service Workforce
|
+-- apps/web                 Next.js operational web application
+-- services/worker          Background jobs and automation support
+-- packages/
|   +-- titan-platform       Intelligence, workforce and platform contracts
|   +-- titan-runtime        Runtime capabilities
|   +-- domain               Shared domain schemas and helpers
|   +-- business-services    Business service capabilities
|   +-- offline              Offline support
|   +-- observability        Operational visibility
|   +-- inventory            Inventory capabilities
|   +-- money                Financial/domain primitives
|   +-- onboarding           Onboarding capabilities
|   +-- provenance           Provenance/evidence support
|   +-- revenue-journey      Revenue lifecycle capabilities
|   +-- tools                Shared tools
|   +-- ...                  Additional bounded capability packages
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

Platform capabilities expose explicit descriptors, schemas, policies, envelopes, and runtime contracts. This makes boundaries easier to test, audit, replace, and evolve.

### Evidence and recoverability

Audit events, provenance, state snapshots, decision evidence, and recovery paths are treated as architectural concerns rather than optional logging.

### Local/offline capability

The system includes offline packages, local-state handling, cache planning, capability degradation, and provider-routing mechanisms intended to reduce unnecessary dependence on always-online cloud execution.

## Technology

The repository is primarily TypeScript and uses a modern full-stack toolchain including:

- Next.js / React
- Node.js
- TypeScript
- PostgreSQL
- Redis
- SQL migrations and row-level security patterns
- Docker Compose
- background worker services
- Vitest and Playwright
- Zod/runtime schemas
- GitHub Actions

## Repository structure

The codebase is organised as a monorepo. Application surfaces live under `apps/`, asynchronous processing under `services/`, reusable capabilities under `packages/`, persistence under `db/`, and deployment infrastructure under `infra/`.

`packages/titan-platform` is a central entry point for the Titan Zero architecture. It exposes workforce, intelligence, business-operation, runtime, offline, builder, connector, MCP, and cost-sovereignty capabilities.

## Quick start

### Prerequisites

- Node.js
- pnpm
- Docker / Docker Compose

### Development

```bash
cp .env.example .env
pnpm install
docker compose -f infra/compose.dev.yml up -d postgres redis
pnpm db:migrate
pnpm dev:web
```

## Quality gates

Run the full repository quality gate with:

```bash
pnpm gate
```

For faster static and unit feedback:

```bash
pnpm gate:fast
```

The repository also contains CI workflows and baseline checks for the web application, worker, platform package, integration integrity, and agent-development workflow.

## Documentation hierarchy

Because the repository contains active implementation alongside substantial research and convergence history, documentation has an explicit authority order:

1. Code and database migrations are the implemented truth.
2. `docs/canonical/` contains current product, domain, workflow, and application architecture documentation.
3. `docs/contracts/` and `docs/working/` contain supporting implementation material.
4. `ai/` provides compact agent-facing context.
5. `docs/archive/` and `docs/generated/` contain historical or generated evidence.

## Portfolio context

This repository demonstrates work across full-stack application development, TypeScript architecture, AI/agent orchestration, business-process modelling, governance and authority design, offline/local-first concepts, database design, testing, CI, and deployment infrastructure.

It is an evolving platform and research codebase rather than a packaged public SaaS release. Some directories preserve migration, convergence, and historical implementation evidence as the architecture has developed.

## Status

**Active development.**

Titan Zero Field Service Workforce is being progressively converged into a governed Advanced Intelligence workforce capable of supporting increasingly broad field-service business operations.
