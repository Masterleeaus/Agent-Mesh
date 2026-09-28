# Titan Zero repository guidance

This is an entry point for Claude Code and other agents. The execution contract is [`AGENTS.md`](AGENTS.md); subtree `AGENTS.md` files add local rules. Historical Dovetails instructions do not override the current architecture.

## Read before work

1. Current code, migrations, tests and live GitHub issue/PR state establish what is implemented.
2. [`docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md`](docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md) and [`docs/architecture/CANONICAL-RULES.md`](docs/architecture/CANONICAL-RULES.md) define target ownership and invariants.
3. [`roadmap/PHASE-MAP-V3.md`](roadmap/PHASE-MAP-V3.md) defines convergence order. Live GitHub mission issues are the execution queue; the exact claim branch is `agent/issue-<number>`.
4. [`ai/INVARIANTS.md`](ai/INVARIANTS.md) is required before architecture, infrastructure, persistence, runtime or deployment changes.
5. `docs/canonical/` supplies product/domain detail where consistent with Blueprint v3. Some Dovetails pages are explicitly historical. `docs/contracts/` supplies active cross-component contracts where not marked historical.

## Current platform boundaries

- `company_id` is Titan's canonical logical company and evidence boundary. Legacy `account_id` and other tenant fields are compatibility inputs; normalize before authorization and execution.
- Accepted Business Evidence Ledger entries are factual history. Operational records are owner-served materialized/projection state with provenance. Provider acknowledgement is not a verified outcome.
- Consequential work follows Decision → Risk/Assurance → effective authority → ExecutionGateway/Command Bus → provider → observed verification → evidence. Model, host, plugin and subscription identity do not grant authority.
- DirectAdmin is the first Business Node control plane and meta-orchestrator. Mature native field-service behavior remains in the TypeScript base application and must operate without Frappe. Frappe/selected ERPNext is an optional extension provider behind Titan Domain APIs, with separate company sites/databases when enabled. Neither owns Titan authority or the factual ledger.
- `apps/web` is the **full base web application**, not the PWA. Titan has one separate installable PWA and one native mobile app, each with governed Zero/Go/Hub modes. The inherited `apps/web` manifest and service worker are migration inputs, not proof that this separation is complete.
- The persistent Workforce/runtime belongs in canonical services/packages and continues without a client open. DirectAdmin plugins manage or project it; they do not duplicate it.
- SQLite remains valid for owner-defined local/runtime persistence. Reachable PostgreSQL native FSM code and migrations may be active product implementation. Classify by reachability and supported deployment before retirement; preserve working field-service behavior. Do not delete applied history blindly.

## Repository layout and commands

`apps/` contains distinct surfaces and adapters; `services/` contains persistent workers; `packages/` contains reusable canonical capabilities; `infra/` and `scripts/` contain host/build/compatibility tooling. Read local `AGENTS.md` files before editing.

Current package names and scripts come from `package.json`, not historical notes. Typical commands are:

```bash
pnpm dev:web
pnpm dev:worker
pnpm test:unit
pnpm gate:fast
pnpm gate
```

`pnpm --filter @titan-zero/web ...` selects the web workspace. `pnpm db:migrate` currently invokes `scripts/sqlite-migrate.mjs`; it is not a universal Frappe migration command. Use the risk-tier verification contract in `AGENTS.md` and record exact results.

## Historical compatibility

The historical Dovetails naming and deployment, `docs/backlog/`, PostgreSQL compose profiles, `infra/compose.garonhome.yml`, `scripts/deploy-garonhome.sh`, and Dovetails-specific schema are inherited implementation and donor evidence. They may still be reachable, so preserve working behavior during migration. They do not define the new product identity, active issue process, universal persistence model or current production target. Identify a live commissioned host before any deployment.

`docs/archive/`, `docs/generated/`, top-level `archive/`, and prior ADRs are evidence/history unless current production reachability is established. Do not treat a former scope freeze, single-business premise or old skill-routing instruction as current authority.
