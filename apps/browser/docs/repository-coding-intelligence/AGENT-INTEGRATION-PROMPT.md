# AGENT PROMPT — Integrate Codee Repository & Coding Intelligence Mega Pack v1.0.0

You are integrating a substantial capability pack into the CURRENT Codee Chrome extension. This is an existing production-oriented extension with important deterministic behavior. Deep-scan the current receiver before changing it.

## Inputs

1. The current Codee cumulative ZIP/source supplied by the user.
2. This `Codee-Repository-Coding-Intelligence-Mega-Pack-v1.0.0` pack.
3. If available, the other agent's current Codee MCP implementation/handoff.
4. If available, `Titan-Zero-Developer-Intelligence-Mega-Pack-v1.0.0`.
5. Titan Zero MCP connection details only when the user supplies them; do not invent endpoints/credentials.

## Mission

Integrate repository/coding intelligence into Codee so it can understand a large Laravel/Titan repository, trace implementation paths, prepare and execute governed repository operations through host capabilities, select targeted verification, consume MCP evidence, and return structured evidence to Codee core.

Do NOT replace Codee's plan runner, provider automation, exactly-once dispatch, artifact lifecycle or restart recovery.

## Non-negotiable authority rule

Codee's existing authoritative plan state machine is the ONLY component allowed to advance a multi-step plan.

This pack may produce:

- context;
- proposed file sets;
- impacts;
- mutation requests;
- backup receipts;
- diffs;
- command/test plans;
- execution results;
- verification evidence;
- rollback metadata.

It MUST NOT mark a step complete or select the next step.

## MCP ownership rule

Another agent is building Codee MCP from multiple Chrome/MCP extensions. Do NOT build a second MCP server/client transport here.

Integrate `src/integration/mcp-adapter.js` against the real MCP agent API. If that implementation is not yet present, keep the adapter boundary and tests, and leave transport ownership unresolved rather than creating a substitute.

The MCP runtime owns transport/auth/connection lifecycle. This pack owns only deterministic use of discovered connections/tools/resources/prompts.

## Extension scope correction

The historical Mega Pack 1 documentation says `app/Extensions/**` is excluded. That was temporary and is now superseded.

During integration:

- include `app/Extensions/**` in project/repository intelligence;
- remove/override any locked `ignoreExtensions=true` behavior from Pack 1 integration;
- inspect extension providers/routes/controllers/services/models/migrations/views/manifests like core code;
- retain secret/path redaction rules;
- do not flatten Titan's different tenancy models into one guessed global convention.

See `compat/MEGA-PACK-1-EXTENSION-SCOPE-REBASE.md`.

## Backup-before-write invariant

Every managed server/repository mutation MUST follow this order:

`validate/authenticate -> declare affected state -> capture backup -> verify backup -> perform write -> verify write -> audit -> preserve rollback metadata`

If backup capture OR backup verification fails, the write MUST NOT happen.

Apply this to:

- file create/replace/delete;
- database/server mutations routed through MCP;
- mutating Artisan/development commands;
- Git operations that alter tracked state where the host policy treats them as managed mutations;
- rollback itself (fresh backup current state before restore).

Never fake a backup receipt. Never treat `verified:false` as sufficient.

## Source modules to integrate

### Repository intelligence

- `repository-policy.js`
- `repository-inventory.js`
- `repository-search.js`
- `symbol-index.js`
- `dependency-graph.js`
- `laravel-tracer.js`
- `migration-guard.js`
- `diff-engine.js`
- `impact-engine.js`
- `dependency-analyzer.js`
- `git-intelligence.js`
- `log-analyzer.js`
- `error-classifier.js`

### Change / governance support

- `change-set.js`
- `rollback-planner.js`
- `mutation-envelope.js`
- `command-policy.js`
- `test-selector.js`
- `verification-planner.js`
- `repository-host-adapter.js`

### MCP/host integration

- `host-capabilities.js`
- `mcp-adapter.js`
- `remote-context-broker.js`
- `receiver-adapter.js`

### Intelligence catalogues

- 24 repository/coding prompts
- 28 skills
- 10 specialist profiles

Do not collapse these into one enormous file unless the real Codee architecture requires a generated bundle. Preserve focused source modules even if a build step creates a runtime bundle.

## Required behavior

### Repository understanding

Codee should be able to ingest a host-supplied snapshot/evidence set and provide:

- inventory by language/domain;
- first-class extension coverage;
- bounded text search;
- PHP/JS symbols;
- reference/dependency edges;
- Laravel named-route tracing;
- migration safety risks;
- dependency metadata;
- change-impact ranking;
- targeted verification.

### Mutations

Wire actual local/server mutation execution only through approved host capabilities. Prefer `CodeeRepositoryHostAdapter` or preserve its exact sequencing semantics.

A model/provider is never allowed to bypass the backup gate by calling a lower-level write primitive directly.

### MCP evidence

When Codee needs live Titan Zero facts, prefer Titan Zero MCP over stale snapshots where appropriate. Label provenance. Bound context size. If MCP is disconnected, fall back to local/static evidence and state that the live evidence was unavailable.

Useful future Titan MCP classes include project info, schema, routes, models, extensions, logs, runtime health and governed mutation tools. Discover the actual tool names; do not hard-code guesses into authoritative runtime logic.

## Existing Codee surfaces

Do not create a new top-level page in this integration pass unless the current receiver already has a suitable Repository/Changes/Verification page.

Wire into:

- Runner
- Multi-Step Plans
- Prompts
- Skills
- Settings
- Diagnostics

### Runner

Show selected repository context, affected files, impact/risk, current mutation/backup state, verification commands/results and MCP evidence provenance.

### Multi-Step Plans

For each step, attach preflight evidence:

- likely affected files;
- change impact;
- backup scope;
- required approval class;
- targeted test matrix;
- expected evidence required for Codee core to decide completion.

Again: the pack does not decide completion.

### Diagnostics

Surface at least:

- repository capability health;
- filesystem/bridge availability;
- Git availability;
- backup provider availability;
- backup verification capability;
- mutation verification capability;
- MCP runtime detected/not detected;
- MCP connections/health when available;
- secret protection policy;
- extension inclusion state.

## Security requirements

Do not expose to provider context:

- `.env` contents;
- API keys;
- passwords;
- OAuth/access/refresh tokens;
- browser cookies/session tokens;
- SSH/private signing keys;
- credential vault contents.

Do not use `eval`, `new Function`, arbitrary shell strings, command chaining/redirection or path traversal.

Unknown commands are not automatically executable. Classify them and require a governed path.

## Suggested implementation passes

1. Deep-scan the receiver and map existing repository/local bridge/MCP APIs.
2. Rebase historical Pack 1 extension exclusion in the integrated receiver.
3. Integrate policy, inventory, search and symbol discovery.
4. Integrate dependency/Laravel/migration/impact analysis.
5. Integrate diff/change-set/rollback/mutation-envelope logic.
6. Wire privileged repository host adapter with mandatory backups.
7. Integrate targeted testing, Git and runtime diagnostics.
8. Bind the thin MCP adapter to the other agent's actual MCP implementation.
9. Register prompts/skills/profiles and existing UI surfaces.
10. Run regression, stress/restart, security and exact-artifact verification; produce a fresh cumulative ZIP.

## Acceptance criteria

- Existing Codee tests remain green.
- New pack tests remain green after integration or are faithfully adapted.
- `app/Extensions/**` is discoverable and analyzable.
- Sensitive paths remain blocked/redacted.
- No write can execute without a verified backup receipt.
- Backup failure provably blocks the underlying write.
- Rollback requires a fresh current-state backup.
- MCP transport/runtime exists in only one subsystem.
- No new plan advancement authority exists.
- Repository/MCP evidence is provenance-labelled.
- Targeted verification is generated from changed files.
- UI uses existing Codee surfaces and does not duplicate the plan runner.
- Exact final cumulative ZIP is freshly extracted and verified before claiming completion.

## Output

Return a cumulative Codee ZIP, not a source-only delta, unless the user explicitly asks for a delta. Include an integration report, tests, verification evidence, changed-file list and CODEE artifact footer using the user's protocol.
