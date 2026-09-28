# Architecture

> **Historical Dovetails implementation snapshot.** This document describes reachable legacy code and its former deployment, not the target Titan Zero platform architecture. For current ownership and invariants use `docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md`, `docs/architecture/CANONICAL-RULES.md`, `roadmap/PHASE-MAP-V3.md`, and `ai/INVARIANTS.md`. In particular, PostgreSQL/account scoping below is legacy compatibility work; Titan uses canonical `company_id`, an evidence ledger for factual history, per-company Frappe sites for mapped operational domains, and owner-defined runtime storage. `apps/web` is the full base application, separate from the single three-mode PWA and native mobile app. Do not use the historical garonhome deployment as a current production target without live evidence.

## System Shape

Dovetails FSM is a pnpm monorepo with a Next.js web app, shared domain package, PostgreSQL database, PostgreSQL-backed worker queues, SQL migrations, and Docker Compose deployment profiles.

## Runtime Components

| Component | Path | Purpose |
|---|---|---|
| Web app | `apps/web` | Owner/admin/tech UI and API routes. |
| Worker | `services/worker` | Background notification, queue, and automation processing. |
| Domain package | `packages/domain` | Shared schemas, constants, status labels, and Dovetails-specific domain helpers. |
| Database migrations | `db/migrations` | SQL schema, policies, and additive migrations. |
| Infrastructure | `infra` | Local, production, and garonhome Docker Compose profiles. |

## Data Model

PostgreSQL is the source of persistence. The application uses raw SQL and row-level security rather than an ORM. Tables are account-scoped for tenant isolation even though the current Dovetails deployment is single-business.

The canonical product model is defined in `docs/canonical/DOMAIN_MODEL.md`. Technical status contracts may live in working documentation, but product direction comes from canonical docs.

## Deployment

The active production target is garonhome.local using `infra/compose.garonhome.yml` and a deploy root under `/opt/business/ai-fsm`.

Development uses local Compose service for PostgreSQL.

## Quality Gates

The primary validation command is:

```bash
pnpm gate
```

For faster static/unit feedback:

```bash
pnpm gate:fast
```

## Architectural Guardrails

- Keep product vocabulary aligned with canonical docs.
- Prefer derived views over new stored workflow objects.
- Keep migrations additive unless a deliberate migration plan exists.
- Keep pricing and workflow rules centralized in shared domain or focused server helpers.
- Do not let deployment, agent, or historical phase documents define product scope.
