# Codee Repository & Coding Intelligence Mega Pack v1.0.0

A large additive capability pack for Codee's repository-development layer.

## Purpose

This pack makes Codee substantially better at understanding and changing code without turning repository analysis, MCP transport or AI providers into competing plan runners.

It is designed for the current Codee architecture where Runner/Multi-Step Plans/Prompts/Skills/Settings/Diagnostics already exist and a separate agent is building the Codee MCP subsystem.

## Included capability families

- Repository policy, inventory and bounded search.
- PHP/JavaScript symbol discovery.
- Dependency/reference graphing.
- Laravel route/controller/service/model tracing.
- First-class `app/Extensions/**` analysis.
- Migration safety and tenancy-boundary risk detection.
- Line diff and exact-replacement planning.
- Change-impact ranking.
- Composer/npm dependency analysis.
- Git status/diff interpretation.
- Laravel/runtime log analysis and redaction.
- Error classification.
- Change-set and rollback planning.
- Mandatory backup-gated mutation envelopes.
- Privileged repository host adapter implementing backup → verify → mutate → verify → audit sequencing.
- Command read/mutate/destructive classification.
- Targeted test/build verification selection.
- Thin MCP consumer adapter (no duplicate MCP runtime).
- Bounded/provenance-labelled remote context broker.
- 24 prompts, 28 skills and 10 profiles.

## Real Titan Zero reference verification

Against `Website1408(3).zip`, the pack's default scope policy recognizes 7,786 repository files as eligible for analysis after default generated/secret filtering. Of those, 4,768 are under `app/Extensions/**`, spanning 58 extension directories. Extensions are intentionally included.

See `reference/titan-zero-repository-inventory.json` for the exact precomputed inventory.

## Parent/baseline artifacts

See `reference/integration-baseline.json` for hashes of:

- Codee v1.1.4 r5 restart-recovery baseline;
- Titan Zero Developer Intelligence Mega Pack 1;
- Titan Zero MCP Server Agent Handoff;
- current Titan Zero website snapshot used for reference analysis.

## Important ownership boundaries

- Codee core owns plan step advancement.
- Dedicated MCP agent owns MCP transport/runtime/auth/connection lifecycle.
- This pack owns deterministic repository/coding intelligence and adapter contracts.
- Privileged filesystem/process/server operations are host-owned and governed.

## Backup invariant

Every managed mutation is backup-gated. A verified backup receipt covering the affected targets is required before execution can be authorized. Rollback is also backup-gated.

## Runtime style

Plain JavaScript, global namespace/IIFE modules, Chrome MV3 compatible, no third-party runtime dependencies. Node is used only for the included verification tests/tools.

## Test

```bash
node --test tests/*.test.js
node tools/verify-pack.js
```

No npm install is required.

## Integration

Start with `AGENT-INTEGRATION-PROMPT.md` and `INTEGRATION-CONTRACT.md`.
