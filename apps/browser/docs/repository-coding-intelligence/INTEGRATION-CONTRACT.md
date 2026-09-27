# Codee Repository & Coding Intelligence — Integration Contract

## Ownership

This pack owns deterministic repository analysis, safe mutation preparation, verification planning, repository-host normalization and MCP-consumer normalization.

Codee core continues to own:

- authoritative multi-step plan state and advancement;
- provider dispatch and website automation;
- session/restart/exactly-once behavior;
- UI shell and persistence;
- artifact/download lifecycle;
- approvals/governance runtime unless explicitly delegated;
- the actual privileged filesystem/process bridge.

The dedicated Codee MCP agent owns:

- MCP transports;
- MCP server/client connection lifecycle;
- OAuth/authentication;
- MCP tool/resource/prompt registration/discovery transport;
- browser/Chrome MCP integration and UI/status.

This pack consumes that MCP subsystem through `CodeeMcpIntegrationAdapter`. It MUST NOT grow a parallel MCP runtime.

## Repository scope

`app/Extensions/**` is first-class in-scope repository code. There is no extension exclusion rule in this pack.

Generated/dependency trees such as `vendor/**` and `node_modules/**` are skipped by default for search economy, but the host may explicitly supply them for dependency/debug tasks. Secret-bearing paths such as `.env`, private keys, credential/secrets directories and session/token files remain blocked from AI context.

## Privileged mutation contract

For every managed write/delete/mutating command:

1. validate the request and affected targets;
2. capture a backup/snapshot covering every affected target;
3. verify the backup and checksum/manifest;
4. authorize the mutation using the verified backup receipt;
5. execute the host-owned mutation;
6. verify the post-mutation state;
7. audit the operation;
8. preserve backup/rollback metadata;
9. return evidence to Codee core;
10. never advance the plan from this pack.

If backup creation or verification fails, execution fails closed.

Rollback is also a mutation. Capture and verify a fresh backup of current state before restoring an older backup.

## Receiver APIs

The presentation host must expose:

- `registerRepositoryCapability(descriptor)`
- `registerPrompts(prompts)`
- `registerSkills(skills)`
- `registerProfiles(profiles)`
- `registerDiagnosticsSection(section)`
- `registerSettingsSection(section)`
- `registerContextProvider(provider)`

The integrating agent may adapt these names to the real Codee registries, but must preserve semantics and zero plan-advance authority.

## Privileged repository host APIs

`CodeeRepositoryHostAdapter` can consume a host with:

- `createBackup(request)`
- `verifyBackup(receipt)`
- `writeFile(path, content, metadata)`
- `deleteFile(path, metadata)`
- `runCommand(command, options)`
- `verifyMutation(request)` **required for every write-capable host**
- `auditMutation(request)` **required for every write-capable host**
- `requestApproval(request)` **required for mutating/destructive command execution**

A read-only host may omit mutation-only functions. A write-capable host MUST implement verified backup capture, backup verification, post-write verification and auditing. If any required write-governance function is unavailable, the mutation must fail closed rather than degrading to a weaker path.

## MCP host APIs

`CodeeMcpIntegrationAdapter` expects the separate MCP runtime to expose:

- `listConnections()`
- `discover(connectionId)`
- `callTool(connectionId, toolName, args)`
- `readResource(connectionId, uri)`
- `getPrompt(connectionId, promptName, args)`
- `health(connectionId)`

The adapter reports `implementsTransport: false` and `ownsMcpRuntime: false` by design.

## UI placement

Do not add a competing top-level tab in this pack. Integrate into the current Codee surfaces:

- Runner: repository context, impact, live evidence, verification plan.
- Multi-Step Plans: preflight impact, affected file set, backup scope, test/evidence requirements.
- Prompts: Repository & Coding Intelligence category.
- Skills: Repository & Coding Intelligence category.
- Settings: Repository & Coding section; MCP connection UI remains owned by the MCP implementation/UI plan.
- Diagnostics: Repository & MCP section with capability/health/backup-policy evidence.

A future unified UI pack may create Repository/Changes/Verification pages without changing this capability contract.
