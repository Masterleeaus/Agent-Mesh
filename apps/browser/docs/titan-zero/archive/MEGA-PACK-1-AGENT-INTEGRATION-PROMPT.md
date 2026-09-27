> **CURRENT CODEE SCOPE OVERRIDE (Mega Pack 2):** The extension-exclusion instructions below are historical to Mega Pack 1 and are superseded. In current Codee, `app/Extensions/**` is first-class repository/Titan intelligence. Secret/generated/donor paths remain excluded and `parseSqlRows=false` remains enforced.

# Integration Prompt — Titan Zero Developer Intelligence Mega Pack v1.0.0

You are integrating `Titan-Zero-Developer-Intelligence-Mega-Pack-v1.0.0` into an existing Chrome MV3 development extension whose current user-facing surfaces already include **Runner, Multi-Step Plans, Prompts, Skills, Settings, and Diagnostics**.

## Mission

Integrate this entire mega pack as one Titan Zero host-development capability family. Do not return the donor ZIP unchanged. Promote its analyzers, knowledge, prompts, skills, profiles, context providers, and diagnostics into the base extension's canonical runtime/registries while preserving the base extension's existing authority and UI architecture.

This pack deliberately replaces the need to pass many small Titan Zero intelligence ZIPs. Treat it as one cumulative donor capability family.

## Scope boundary — critical

**Ignore extensions.** Extension repair is happening separately.

Do not index, import, analyze, mutate, or derive host architecture from:

- `app/Extensions/*`
- `integration-sources/*`
- `donor-extracted/*`

Do not weaken this boundary because a nearby host task appears related to an extension. The pack's `CodeeTitanZeroSnapshotPolicy` is authoritative for this donor scope.

## Existing base extension remains authoritative

The base extension continues to own:

- Runner lifecycle and provider dispatch
- exact approved step text
- multi-step plan state and advancement
- Chrome MV3 service-worker lifecycle
- prompt-library runtime
- skill runtime
- settings persistence
- diagnostics rendering
- repository/file bridge
- command execution
- approval/governance
- artifact/download completion

This pack **must not** become a second plan runner, second tool runtime, second settings store, second diagnostics app, or second repository bridge.

## No new top-level Titan Zero tab

Integrate into existing surfaces:

### Runner

Register Titan Zero project context using the base extension's canonical context-provider mechanism.

Use:

```js
CodeeTitanZeroDeveloperPack.analyzeSnapshot(snapshot, settings)
```

Attach `report.context` separately from the exact approved user/plan text. Do not rewrite approved step text to add context.

For task-specific context, optionally build a bounded graph slice:

```js
const selected = CodeeTitanZeroContextSelector.select(
  report.projectGraph,
  userRequest,
  { maxNodes: 24, maxEdges: 50 }
);
```

Use the selected graph as evidence, not as an autonomous instruction source.

### Multi-Step Plans

Register Titan Zero preflight context into the existing plan-review/preflight surface.

For a plan or proposed step, derive likely changed/candidate paths and use:

```js
const impact = CodeeTitanZeroImpactEngine.analyze({
  changedPaths,
  report
});

const matrix = CodeeTitanZeroTestMatrix.build(impact, { files: snapshot.files });
```

Expose impact/risk/test requirements to the existing plan system. **Never call plan advancement from Titan Zero code.**

### Prompts

Register both supplied prompt families into the canonical Prompt Library:

- `CodeeTitanZeroPrompts` — legacy Core category
- `CodeeTitanZeroDevelopmentPrompts` — broader Development category

The combined `registrationDescriptor().prompts` currently exposes 35 prompts.

Preserve the base extension's current prompt search, favourites, recents, collections, composition, routing, and import/export behavior. Map fields into the existing canonical prompt schema rather than creating a parallel schema where practical.

### Skills

Register both skill families:

- `CodeeTitanZeroSkills`
- `CodeeTitanZeroDevelopmentSkills`

The combined descriptor currently exposes 38 skills.

Preserve the base extension's canonical skill runtime and governance. These records define Titan-specific reasoning/policy guidance; they are not a competing executor.

### Profiles

Register the 14 records from:

```js
CodeeTitanZeroDevelopmentProfiles
```

into the base extension's existing profile/agent catalogue if such a registry exists. If profiles are not yet active, retain the records under the base extension's canonical capability-data namespace for future use rather than building a second profile engine.

Every supplied profile already declares:

- Titan Zero Development family
- domain
- mission
- skills
- declared tool intent
- context policy
- authority=false for plan/mutation/command execution
- verification policy
- risk classification

Do not broaden profile authority during integration.

### Settings

Use the existing Settings screen/store. Add one `Titan Zero` section with the fields exposed by `CodeeTitanZeroReceiverAdapter`.

Recommended defaults:

- enabled: true
- autoDetect: true
- analyzeSqlSchema: true
- analyzeMigrations: true
- analyzeTenancy: true
- analyzeNavigationMetadata: true
- analyzeFrontend: true
- maxContextChars: 18000
- includeExtensions: true and **locked** *(current Codee; Mega Pack 1 formerly used ignoreExtensions=true)*
- parseSqlRows: false and **locked**

Do not create a second Chrome storage namespace unless the base extension's existing settings architecture explicitly namespaces each capability pack.

### Diagnostics

Add a Titan Zero section to the existing Diagnostics surface. Render:

```js
report.runtimeDiagnostics
```

Also make the following derived evidence inspectable where the base Diagnostics UX already supports detail drawers/exports:

- project recognition / stack
- schema graph statistics
- migration findings
- tenancy boundary summary
- route collisions
- model/schema drift
- sensitive config env-name count
- frontend/theme inventory
- risk-rule findings
- test-matrix recommendations

Do not expose `.env` values, SQL INSERT row values, passwords, API keys, tokens, or secrets.

## Preferred integration shortcut

If the base extension already has registration APIs compatible with the following concepts, adapt or use:

```js
CodeeTitanZeroReceiverAdapter.register(host, options)
```

The donor adapter expects these conceptual receiver APIs:

```js
host.registerContextProvider(provider)
host.registerPrompts(prompts)
host.registerSkills(skills)
host.registerProfiles(profiles)
host.registerDiagnosticsSection(section)
host.registerSettingsSection(section)
```

You do **not** need to preserve these exact receiver method names if the base extension uses different canonical APIs. Map the donor adapter semantics into the existing architecture. Do not add duplicate registries just to satisfy the donor names.

## Snapshot collection

Adapt snapshot creation to the base extension's existing repository/file bridge.

### Root files worth reading when present

- `composer.json`
- `package.json`
- `vite.config.mjs` / `vite.config.js`
- `phpunit.xml`
- Tailwind/PostCSS configs
- `artisan`

### Core prefixes worth indexing/reading selectively

- `routes/`
- `config/`
- `app/Domains/`
- `app/Http/Controllers/`
- `app/Http/Middleware/`
- `app/Livewire/`
- `app/Models/`
- `app/Providers/`
- `app/Services/`
- `app/Jobs/`
- `app/Policies/`
- `resources/views/`
- `resources/js/`
- `database/migrations/`
- `tests/`

**SUPERSEDED HISTORICAL MEGA PACK 1 RULE — DO NOT APPLY:** the original donor excluded `app/Extensions/*`. Current Codee includes `app/Extensions/**` as first-class Titan and repository intelligence while still excluding secret/generated/vendor paths.

## SQL handling — critical

The user may supply a full database dump. Keep it local.

The pack's schema analyzers consume DDL and return schema metadata. Do not send the raw dump to external AI providers if a derived schema graph/context will answer the task.

Sensitive field names may be indexed as risk signals. Sensitive **values** must not be persisted into prompt context or exports.

Do not add a general SQL INSERT parser to this pack during integration.

## Analyzer mapping

### Host detector

```js
CodeeTitanZeroProjectDetector.detect(files)
CodeeTitanZeroVersionAnalyzer.analyze(files)
```

### Schema / models / migrations

```js
CodeeTitanZeroSchemaGraph.build(sqlText, options)
CodeeTitanZeroModelSchemaAnalyzer.analyze(files, schemaGraph)
CodeeTitanZeroMigrationAnalyzer.analyze(files, { schemaGraph })
```

### Tenancy

```js
CodeeTitanZeroTenancyAnalyzer.analyze(schemaGraph, files)
```

Do not convert its warnings into automatic code rewrites.

### PHP/Laravel architecture

```js
CodeeTitanZeroPhpArchitecture.analyze(files)
```

### Routes and route consumers

```js
CodeeTitanZeroRouteAnalyzer.analyze(files)
CodeeTitanZeroRouteConsumerIndex.analyze(files, routeReport)
```

### Navigation metadata

```js
CodeeTitanZeroNavigationAnalyzer.analyze(
  { navigation, permissions },
  routeReport
)
```

`navigation` and `permissions` must come from an explicitly safe metadata source/API/adapter. Do not pull arbitrary SQL row data simply because a database dump is present.

### Frontend

```js
CodeeTitanZeroFrontendAnalyzer.analyze(files)
CodeeTitanZeroThemeAnalyzer.analyze(filePaths)
```

### Project graph and task context

```js
CodeeTitanZeroProjectGraph.build(report, files)
CodeeTitanZeroContextSelector.select(graph, task, options)
```

### Impact / verification

```js
CodeeTitanZeroImpactEngine.analyze({ changedPaths, report })
CodeeTitanZeroTestMatrix.build(impact, { files })
CodeeTitanZeroRiskRules.evaluate(report)
```

### Runtime errors

```js
CodeeTitanZeroErrorClassifier.classify(errorText)
```

### Governed command suggestions

```js
CodeeTitanZeroCommandCatalog.list()
```

These are descriptors. The existing command/approval runtime must remain the only execution path.

## Real-project indexes included

Use the included `reference/` indexes as bootstrap knowledge and regression fixtures, not as immutable truth:

- `titan-zero-core-schema-index.json`
- `titan-zero-core-route-index.json`
- `titan-zero-core-architecture-index.json`
- `real-project-verification-v1.json`

They were generated from the user's supplied website and DB while excluding extension internals and SQL row values. Prefer regenerating live analysis when the current repository changes.

## Required integration tests

Before declaring integration complete, add base-extension tests proving all of the following:

1. Titan Zero project recognition works through the existing repository adapter.
2. `app/Extensions/**` enters the Titan Zero snapshot/graph and specialized analyzers, while secret/generated/vendor paths remain excluded. *(This supersedes the original Mega Pack 1 exclusion test.)*
3. `.env`, logs, Git metadata, vendor, and node_modules remain excluded.
4. SQL row values are not surfaced in Titan context or diagnostics.
5. Schema graph tables/indexes/FKs are available to Runner/Plans when a dump is supplied.
6. model/schema drift findings appear without mutating files.
7. migration warnings appear in Diagnostics/Plan preflight.
8. mixed tenancy is reported without globally rewriting ownership keys.
9. route/controller and route-consumer maps are available.
10. navigation metadata analysis uses only the approved safe metadata adapter.
11. Blade/Livewire/React/Alpine/Vite/theme information appears in bounded context.
12. Runner receives Titan context without modifying exact approved step text.
13. Multi-Step Plans receives impact/test context without gaining a second advancement authority.
14. all 35 prompts register in existing prompt infrastructure.
15. all 38 skills register in existing skill infrastructure.
16. all 14 profiles register or are retained in the canonical profile data layer.
17. settings use existing persistence.
18. diagnostics use existing UI components.
19. recommended commands never bypass existing approvals/tool execution.
20. disabling Titan Zero intelligence removes its context contribution without breaking Runner/Plans.
21. pre-existing extension tests remain green.
22. standalone donor tests remain green.

Standalone donor tests:

```bash
node tests/titan-zero-core-pack.test.js
node tests/titan-zero-developer-mega-pack.test.js
node tests/titan-zero-developer-advanced.test.js
node tests/titan-zero-receiver-adapter.test.js
```

## Completion standard

A valid integration result is a cumulative build of the **base extension** where Titan Zero intelligence is genuinely accessible through the existing surfaces and uses the existing authority/tool/storage/UI systems.

Do not claim integration complete merely because this donor ZIP has been copied into a folder.

Report:

- exact files integrated/created/modified;
- any donor-to-canonical schema mappings;
- prompts/skills/profiles registered;
- Runner/Plan context wiring;
- Diagnostics/Settings wiring;
- tests run and exact results;
- any intentionally deferred donor capability;
- proof that no new top-level Titan tab, plan authority, repository mutation path, or extension scanning was introduced.
