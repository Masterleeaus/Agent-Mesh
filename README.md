# Titan Zero Platform

> Advanced Intelligence workforce and business operating platform with governed multi-agent execution, decision intelligence, offline capabilities, and full-stack operational workflows.

Titan Zero is an experimental full-stack platform for exploring how intelligent software workforces can operate inside real businesses without treating model output as execution authority.

The repository combines a production-oriented field-service application with a broader TypeScript platform layer covering workforce orchestration, decision and intelligence runtimes, authority boundaries, offline operation, interface runtimes, connectors, and business operations.

The current field-service implementation is **Dovetails FSM**: a residential handyman and home-maintenance operating system built around property history, customer relationships, estimating, job execution, and durable service records.

## Why this project exists

Most AI applications stop at chat, recommendations, or isolated agents. Titan Zero explores the harder systems problem: how to coordinate multiple intelligent workers, tools, interfaces, business processes, and data while keeping authority explicit and auditable.

Core design concerns include:

- separating intelligence and recommendations from execution authority;
- enforcing a canonical `company_id` business boundary;
- coordinating managers, supervisors, agents, and atomic workers;
- delegating work through constrained authority envelopes;
- escalating decisions through approval gates;
- retaining audit and state-recovery evidence;
- routing work across local and external intelligence providers;
- supporting offline and device-aware operation;
- exposing business capabilities through reusable platform contracts.

## Platform capabilities

### Governed intelligent workforce

The workforce layer models a hierarchy of managers, supervisors, standalone agents, and atomic workers. It includes role routing, manager objectives and policies, supervisor coordination, agent bindings, worker task planning, delegation envelopes, escalation chains, approval gates, audit events, state snapshots, and knowledge-authority checks.

A key invariant is that registering or activating an intelligent worker does **not** automatically grant it execution authority.

### Intelligence and decision systems

The platform contains reusable intelligence/runtime components for:

- deterministic risk classification;
- signal normalisation and prioritisation;
- model/provider routing;
- multi-model council recommendations;
- Nexus orchestration;
- decision-engine envelopes;
- intelligence runtime contracts;
- evidence-aware business decisions.

These systems are designed so that intelligence can inform action without silently becoming permission to act.

### Runtime and interface layer

Titan Zero includes runtime contracts for company-scoped execution, visual interfaces, interface discovery and registries, local state, capability negotiation, fallback planning, resource integrity, compatibility checks, and offline caching.

The platform also contains Prime runtime integration, Titan Builder components, connector contracts, MCP host negotiation, credential references, and inference-routing policies.

### Cost and deployment sovereignty

The architecture supports routing intelligence work according to capability and cost policy rather than assuming a single model provider. This provides a foundation for local models, customer-controlled providers, and external services to coexist behind explicit contracts.

### Business operations

The repository is not only an AI orchestration experiment. It contains a working business application and supporting domain packages for operational workflows such as customers, properties, estimates, jobs, inventory, money, onboarding, revenue journeys, notifications, and service operations.

## Dovetails FSM

Dovetails FSM is the current field-service application implemented in this repository. It focuses on residential handyman and home-maintenance workflows and provides a concrete operational environment in which the broader Titan Zero architecture can be exercised.

Its canonical product documentation remains under `docs/canonical/` and should be treated as the source of truth for Dovetails-specific behaviour.

## Architecture at a glance

```text
Titan Zero Platform
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
+-- docs                     Canonical and supporting documentation
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

The `packages/titan-platform` package is the clearest entry point for the broader Titan Zero architecture. It exports workforce, intelligence, business-operation, runtime, offline, builder, connector, MCP, and cost-sovereignty capabilities.

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

Because this repository contains both active implementation and a substantial research/convergence history, documentation has an explicit authority order:

1. Code and database migrations are the implemented truth.
2. `docs/canonical/` is authoritative for the current Dovetails product, domain, workflow, and application architecture.
3. `docs/contracts/` and `docs/working/` contain supporting implementation material.
4. `ai/` provides compact agent-facing context.
5. `docs/archive/` and `docs/generated/` contain historical or generated evidence and are not active product instructions.

Canonical Dovetails documents:

- [Product Vision](docs/canonical/PRODUCT_VISION.md)
- [Domain Model](docs/canonical/DOMAIN_MODEL.md)
- [Workflow](docs/canonical/WORKFLOW.md)
- [Architecture](docs/canonical/ARCHITECTURE.md)
- [Roadmap](docs/canonical/ROADMAP.md)

## Portfolio context

This repository demonstrates work across full-stack application development, TypeScript architecture, AI/agent orchestration, business-process modelling, governance and authority design, offline/local-first concepts, database design, testing, CI, and deployment infrastructure.

It is an evolving platform and research codebase rather than a packaged public SaaS release. Some directories preserve migration, convergence, and historical implementation evidence as the architecture has developed.

## Status

**Active development.**

The repository is being progressively converged around the Titan Zero platform architecture while Dovetails FSM remains the current concrete field-service implementation.
