# Services agent boundary

Inherits the root `AGENTS.md`.

## Purpose
`services/` owns long-running worker/workforce orchestration and runtime integration, not parallel domain truth.

## Rules
- Reuse canonical packages for persistence, domain rules, authority, execution, evidence, memory/context, and identities.
- Preserve `company_id` on queue, job, runtime, retry, recovery, and evidence paths.
- Durable work must be idempotent across retry/restart where the contract requires it.
- Never treat transport/provider acknowledgement as verified outcome.
- No hidden egress or direct consequential provider calls that bypass the governed execution path.
- Runtime/recovery changes require restart/retry/failure-path tests where applicable.
- Changes to workforce/worker execution, authority, evidence, persistence, or tenancy are Tier 3 unless demonstrably documentation-only.
