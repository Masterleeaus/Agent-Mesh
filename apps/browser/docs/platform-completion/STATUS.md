# Codee v3.0 Production Platform Completion — Status

- Master PLAN_ID: `5936f03e-03cf-4a37-bc08-b6127a69e761`
- Current Codee version: `2.7.0`
- Master progress: **6/32 completed**, **26 remaining**
- Completed: Pass 1 — Canonical Navigation Registry
- Completed: Pass 2 — Rebuild Sidebar Information Architecture
- Completed: Pass 3 — Dashboard Foundation
- Completed: Pass 4 — Capability Registry UI
- Completed: Pass 5 — Canonical Connection Registry
- Completed: Pass 6 — Connections Workspace
- Next: Pass 7 — MCP Inspector
- Browser Engine subordinate plan: **2/22 completed**, **20 remaining**
- Onboard AI subordinate plan: **1/32 completed**, **31 remaining**

## Pass 1 invariants

- The service worker owns the canonical navigation registry.
- Sidebar navigation markup is generated from registry data.
- Malformed registry data fails closed to Runner.
- Browser remains `CONTRACT_ONLY`; no execution permission is implied.
- No additional Chrome permissions or host permissions were introduced.

## Pass 2 information architecture

- Workspace: Dashboard, Runner, Active Plans, History, Artifacts.
- Intelligence: Intelligence, AI Workforce, Repository, Titan Zero, Browser.
- Infrastructure: Connections, MCP, Repository Host.
- Knowledge: Prompts, Skills, Knowledge.
- System: Diagnostics, Settings, About.
- Existing working pages are `AVAILABLE`; future product workspaces are `COMING_NEXT`; Browser remains `CONTRACT_ONLY`.
- Registry readiness is authoritative; disabled future destinations cannot be opened by sidebar navigation.

## Pass 5 canonical connection health

- Canonical states: `CONNECTED`, `DEGRADED`, `MISSING`, `AUTH_FAILED`, `DISABLED`, `RATE_LIMITED`, `UNAVAILABLE`.
- AI provider health comes from provider-contract `health()` probes.
- Titan MCP health comes from `CodeeMcpRuntime.health()` for enabled saved connections.
- Repository/Artifact host presence alone is not healthy; explicit health or trusted verification receipt evidence is required.
- Browser registration alone is not healthy; contract-only execution remains `UNAVAILABLE`.
- Connection output is bounded and excludes tokens, raw host payloads and receipt identifiers.
- Dashboard consumes the canonical registry instead of independently guessing connection health.

## Pass 6 Connections workspace

- Infrastructure → Connections is now `AVAILABLE`.
- Seven sections: Free AI, Local AI, Premium/BYO, Titan MCP, Repository Host, Artifact Verification Host and Browser.
- Test/Reconnect force fresh canonical probes.
- Configure routes only to a subsystem-owned trusted configuration surface.
- Unsupported Disable actions remain visibly unavailable instead of creating a second configuration authority.
- Connection rendering excludes secrets, token metadata, raw host payloads and artifact receipt identifiers.
