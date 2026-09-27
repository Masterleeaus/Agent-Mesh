# Codee Repository & Coding Intelligence — Integration Report

## Release

- Codee target: **v2.1.3**
- Donor pack: `Codee-Repository-Coding-Intelligence-Mega-Pack-v1.0.0`
- Integration PLAN_ID: `616df06d-6313-42c7-bdb9-beb386369a43`
- Pack authority: repository evidence/preflight and host-gated mutation orchestration only; **Codee core remains the sole plan-advance authority**.

## Integrated capability surface

- 28 repository/MCP capabilities
- 24 repository prompts
- 28 repository skills
- 10 repository specialist profiles
- Repository inventory/search/symbol/dependency graph
- Laravel route/controller tracing including extension routes
- Migration risk review including extension migrations
- Bounded line diff and change-impact analysis
- Change-set and rollback planning
- Mutation prepare/authorize envelopes
- Command classification and targeted test/verification planning
- Dependency, Git, log and error intelligence
- MCP consumer adapter and bounded/redacted remote evidence broker
- Host-owned write/delete/command adapter with mandatory backup governance

## Mega Pack 1 scope rebase

The historical Pack-1 `app/Extensions/**` exclusion is superseded. Current Codee includes extension code, routes, migrations and extension-owned schema evidence as first-class intelligence while preserving secret/generated/dependency/donor path exclusions and DDL-only SQL handling. Historical Pack-1 indexes are retained but explicitly labelled as historical host-only evidence.

## Write invariant

Every managed repository/server mutation follows:

`validate targets -> capture backup -> verify backup -> authorize -> execute write -> verify result -> audit -> preserve rollback metadata`

If backup capture or verification fails, the write does not execute. Approval failures preserve backup/rollback evidence and are audited. Rollback planning explicitly requires a fresh current-state backup before restoration.

## Runtime ownership boundaries

- Repository pack does **not** advance Codee plans.
- Repository pack does **not** create a second Runner, Settings store or Diagnostics application.
- Repository pack does **not** own MCP transport/auth/lifecycle. It consumes the separately owned `CodeeMcpRuntime` when installed.
- Privileged filesystem/process operations remain owned by the canonical `CodeeRepositoryHost`; without that host they return structured `unavailable` results.

## Additional hardening applied during integration

- Traversal/sensitive path rejection across snapshots, changed paths, change sets and rollback plans.
- Snapshot/file/task/query/diff/command/write-content bounds.
- Quoted and unquoted secret redaction, including JSON/config values.
- MCP evidence/error redaction and bounded/circular-safe serialization.
- Serialized bounded per-tab repository analysis cache.
- Scalable symbol/dependency/impact analysis ceilings.
- Stable regex path search.
- Extension-aware Laravel routes/migrations/test selection.
- Command catalogue precedence and generic package-script/Git-branch mutation safety.
- Audit data minimization: raw file content and secret-like metadata are not copied into mutation audit requests.
- Safe canonical Diagnostics callback replaces the donor raw-snapshot callback.

## Current privileged bridge status

The extension exposes the canonical repository capability APIs and host adapter contract. The actual privileged repository/filesystem/process bridge is intentionally external/host-owned. This preserves the backup gate and avoids inventing a second unsafe bridge inside the MV3 extension.


## v2.1.3 post-integration hardening

The follow-up deep scan added prototype-safe/bounded analyzers, receipt/audit evidence minimization, repository/Titan registry isolation, direct evidence redaction, concrete safe PHP syntax verification commands, and additional cross-pack runtime wiring checks. No Repository/MCP capability gained plan-advance authority, and privileged mutations remain mandatory-backup-gated.
