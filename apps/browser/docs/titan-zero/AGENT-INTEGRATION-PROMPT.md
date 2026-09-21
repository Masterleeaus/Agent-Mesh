# Titan Zero Developer Intelligence — Current Codee Integration Contract

> **CURRENT CONTRACT.** The original Mega Pack 1 agent prompt has been archived at
> `docs/titan-zero/archive/MEGA-PACK-1-AGENT-INTEGRATION-PROMPT.md`. Its extension-exclusion
> rules are historical and **must not be applied** to current Codee.

## Runtime ownership

Titan Zero Developer Intelligence is an evidence/preflight capability pack inside Codee. It does not own plan advancement, artifact progression, repository mutation, command execution, MCP transport, Settings, Diagnostics, or a second Runner.

## Repository scope

Current Codee treats `app/Extensions/**` as first-class Titan and Repository intelligence. Specialized analyzers must recognize extension-owned routes, migrations, controllers, services, providers, middleware, models, policies, jobs, Livewire classes, Blade views, tests, and schema evidence.

The following remain excluded from source evidence/context where applicable:

- `.env` and `.env.*`
- credentials, secrets, private keys and secret values
- `.git/**`
- logs and runtime-generated sensitive output
- `vendor/**`
- `node_modules/**`
- donor/extracted build trees not part of the active application
- traversal, absolute, malformed or duplicate canonical paths

SQL DDL/schema metadata may be analyzed. SQL row values remain excluded from Titan context; `parseSqlRows` stays locked off.

## Settings invariants

- `enabled: true` by default
- `autoDetect: true` by default
- `includeExtensions: true` and locked
- `parseSqlRows: false` and locked
- analyzer toggles may disable their own evidence without creating false-positive risks

## Codee integration surfaces

Use the existing Codee capability registry and existing surfaces:

- Runner context/preflight
- multi-step plan preflight
- Prompts
- Skills
- Profiles
- Settings
- Diagnostics

Do not create duplicate stores or a second runtime.

## Mutation and execution boundary

Titan intelligence is read/evidence-oriented. Any actual repository/server mutation or command execution is delegated to Codee's governed host/MCP path. Mutating operations require effect classification and complete verified backups before execution. Unknown or incompletely described effects fail closed.

## Verification expectations

Current tests must prove extension-first-class analysis, secret/path exclusion, schema-only SQL handling, tenancy evidence, route/controller/consumer tracing, frontend analysis, migration analysis, impact/test selection, sanitized diagnostics/context, and no plan-advance/mutation authority in this pack.
