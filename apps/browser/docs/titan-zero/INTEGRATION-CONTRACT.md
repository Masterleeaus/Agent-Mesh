# Titan Zero Developer Intelligence Mega Pack — Integration Contract

## Contract version

`1.0.0`

## Pack ownership

The pack owns read-only Titan Zero host-project intelligence:

- project/stack detection;
- schema/model/migration analysis;
- tenancy analysis;
- Laravel/PHP architecture analysis;
- route and route-consumer analysis;
- safe navigation metadata analysis;
- frontend/theme analysis;
- project graph and context selection;
- change impact and test-matrix recommendations;
- runtime diagnostic classification;
- Titan Zero facts, prompts, skills, and profile definitions.

## Receiver ownership

The base extension remains authoritative for:

- browser navigation and tabs;
- Runner execution;
- provider dispatch;
- multi-step plan storage and advancement;
- exact approved step text;
- repository/filesystem access;
- command execution;
- approval/governance;
- settings persistence;
- prompt and skill runtime behavior;
- profile/manager runtime behavior;
- diagnostics rendering;
- artifact/download completion;
- Chrome MV3 recovery lifecycle.

## Forbidden donor behavior

The integrated pack must not:

- create a second plan runner;
- advance or complete a Codee plan step;
- submit provider prompts;
- write repository files;
- execute shell/Artisan/Composer/npm/Git commands;
- create a second settings database;
- create a second Prompt Library or Skill runtime;
- create a new top-level Titan Zero tab;
- inspect `app/Extensions/*` in this pack;
- read `.env`;
- export secret values;
- parse arbitrary SQL INSERT values by default.

## Data safety

DDL/schema metadata may be analyzed. Credential-like column names and environment variable names may be retained as risk metadata. Credential values must not be read, persisted, exported, or sent to providers.

## Compatibility

The original Pack 1 globals remain present for compatibility:

- `CodeeTitanZeroCoreProfile`
- `CodeeTitanZeroSnapshotPolicy`
- `CodeeTitanZeroProjectDetector`
- `CodeeTitanZeroSqlAnalyzer`
- `CodeeTitanZeroRouteAnalyzer`
- `CodeeTitanZeroThemeAnalyzer`
- `CodeeTitanZeroContext`
- `CodeeTitanZeroDiagnostics`
- `CodeeTitanZeroPrompts`
- `CodeeTitanZeroSkills`
- `CodeeTitanZeroCorePack`

The preferred v1.0 API is `CodeeTitanZeroDeveloperPack`.

## Receiver adapter

`CodeeTitanZeroReceiverAdapter` is a semantic adapter example. If the receiver's canonical API names differ, map the behavior rather than introducing duplicate APIs solely to match the donor.
