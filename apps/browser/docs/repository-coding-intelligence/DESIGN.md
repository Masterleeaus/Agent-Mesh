# Codee Repository & Coding Intelligence Mega Pack Design

## Goal

Add a presentation-neutral repository/coding intelligence layer to Codee that can inspect, trace, plan, safely request mutations, select verification, and consume an independently built MCP runtime without creating a second MCP implementation or competing plan runner.

## Architecture

The pack is plain JavaScript suitable for Chrome MV3 and testable in Node without dependencies. It is split into pure analyzers (repository inventory, symbols, dependencies, Laravel tracing, migrations, diffs, impact, logs), policy/planning modules (sensitive paths, command classification, backup-gated mutation envelopes, change sets, rollback and verification), a thin MCP adapter contract, and a receiver adapter that integrates into Codee's existing Runner, Multi-Step Plans, Prompts, Skills, Settings and Diagnostics surfaces.

The pack never owns transport, filesystem privileges, command execution, Git mutation, MCP transport, provider dispatch, or plan advancement. Those actions are delegated to host capabilities. Mutation envelopes require a verified backup receipt before the host may execute them.

## Core components

1. Repository inventory and framework/language detection.
2. Text and symbol search over supplied repository snapshots.
3. PHP/JavaScript symbol indexing and dependency/reference tracing.
4. Laravel route/controller/service/model and migration safety analysis.
5. Line-oriented diff and exact-replacement patch planning.
6. Change-impact and targeted-test selection.
7. Composer/npm dependency and runtime-log analysis.
8. Git status/diff intelligence and change-set tracking.
9. Backup-gated mutation envelopes and rollback metadata.
10. MCP integration adapter that consumes the MCP subsystem being built by the dedicated Codee MCP agent.
11. Remote-context broker for Titan Zero MCP / Laravel Docs MCP evidence.
12. Prompts, skills and specialist profiles for repository work.

## Security and authority

- `app/Extensions/**` is fully in scope; it is not excluded.
- `.env`, private keys, credential/secrets directories and browser/session credentials are blocked from AI context by default.
- Reads are separated from writes and commands.
- Local/remote mutations require declared affected state and a verified backup receipt.
- Destructive command classes require explicit host approval.
- No model receives API keys, cookies, auth tokens or secret values.
- Pack code never calls `eval`, shell APIs, Chrome storage, network APIs or filesystem APIs directly.
- Multi-Step Plans remains the sole plan-advancement authority.

## MCP boundary

The MCP adapter expects a host implementation exposing connection discovery, tool/resource/prompt discovery, health and calls. It does not implement Streamable HTTP, stdio, OAuth, tool transport, or server registration. This avoids conflict with the separate Codee MCP build.

## Testing

Node-only regression suites verify repository scope, sensitive-path policy, symbol/dependency analysis, diff/impact behavior, backup-gated mutation envelopes, MCP adapter contracts, Laravel tracing, test selection, catalogue registration and authority boundaries.
