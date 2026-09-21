# AGENT BUILD / INTEGRATION PROMPT — CODEE MANAGERS & AI WORKFORCE

You are integrating the supplied `Codee-Managers-AI-Workforce-Mega-Pack-v1.0.0` into the current cumulative Codee Chrome extension.

## Mission
Add a specialist manager/workforce layer that helps Codee understand work, choose tools/context, coordinate specialist analysis, prepare initial plans, and return evidence-backed recommendations. Preserve all current Codee functionality.

## Non-negotiable architecture
1. **Do not create another plan runner.** The existing Codee deterministic plan state machine is the sole authority for plan step advancement, completion, retries, conversation binding, artifacts, and durable save transitions.
2. Managers may create/prepare a **new plan draft** only. They may not advance an existing plan or mark steps complete.
3. **Do not rebuild MCP.** Another agent is building Codee MCP from dedicated Chrome-extension donors. Integrate through the thin capability contracts in this pack.
4. `app/Extensions/**` is fully in scope. Do not revive any temporary extension exclusion from older packs.
5. Managers must never mutate repository/server/database state directly. Route mutation requests through existing privileged adapters / Titan Zero MCP.
6. For every server/repository/database/command mutation enforce: validate/authenticate → authorize → identify affected state → capture backup/snapshot → verify backup → perform mutation → verify mutation → audit → preserve rollback metadata. If backup or backup verification fails, abort.
7. Never expose passwords, API keys, cookies, OAuth tokens, session secrets, `.env` secret values, or browser credentials to manager prompts or external AI providers.
8. External AI results are advisory until Codee verifies/accepts them through its normal execution path.

## Managers to integrate
Architecture, Laravel, Database, Extension, Frontend, Runtime, Security, Testing, Release, Integration, Repository, Planning, Documentation, Governance.

## UI placement
- Runner: show selected primary manager, supporting managers, evidence requests and current handoffs.
- Multi-Step Plans: add manager preflight and **Create Plan Draft** support only; never let manager UI advance steps.
- Prompts: register the workforce prompt category.
- Skills: register the workforce skill category.
- Diagnostics: add manager health/readiness, missing capabilities, MCP dependency health and recent routing decisions.
- Settings: add manager enablement, max managers per task, advisory-AI toggle; `planAdvanceAuthority=false` must be locked.
- If the current Codee shell already has/plans a Managers workspace page, populate it. Do not force a new top-level page if the shell does not expose that surface yet.

## Integration sequence
1. Deep scan current Codee and identify actual receiver APIs and the MCP agent's interfaces.
2. Map this pack's receiver adapter onto existing APIs instead of replacing working systems.
3. Register all manager definitions and workforce manifest.
4. Wire task classification/router into Runner preflight.
5. Wire repository capability calls to Mega Pack 2.
6. Wire MCP requests to the separately supplied MCP runtime.
7. Wire `workforce.ai.request` to the provider gateway only if that gateway exists; otherwise preserve it as queued/advisory evidence.
8. Wire governed mutation requests to the privileged mutation pipeline; enforce verified backup receipts before actual writes.
9. Add diagnostics/settings/UI affordances without breaking existing six core pages.
10. Add regression coverage proving authority boundaries, routing, manager handoffs, backup gating, restart-safe persisted work orders if persistence is added, and no duplicate MCP runtime.
11. Run the full existing Codee test suite plus this pack's tests.
12. Produce a cumulative Codee ZIP and fresh CODEE artifact footer.

## Acceptance tests
- 14 managers register exactly once.
- A Laravel runtime error routes to Laravel + Runtime managers.
- An extension task can discover/use `app/Extensions/**` evidence.
- A planning request can create a plan draft but cannot advance it.
- A manager direct `plan.advance` attempt is rejected.
- A manager direct repository/server mutation attempt is rejected.
- Governed mutation requests explicitly require verified backup-before-write.
- AI-assistance results do not execute themselves.
- MCP runtime is consumed, not duplicated.
- Existing Codee Runner/Plans/Prompts/Skills/Settings/Diagnostics remain functional.
