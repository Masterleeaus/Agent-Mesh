> **Historical evidence note:** These findings were generated before the Mega Pack 2 extension-scope rebase. Any stated `app/Extensions/**` exclusions describe that historical scan only; current Codee includes extension repository/schema evidence.

# Real Titan Zero Host Scan — Mega Pack v1.0.0

This pack was exercised against the user-supplied `Website1408(3).zip` and `admin_titan_1786730755(4).sql` while deliberately excluding `app/Extensions/*` and arbitrary SQL row values.

These findings are **developer intelligence**, not automatically actionable defects. Regex/static analyzers can produce candidates that require repository-level verification before edits.

## Project recognition

- Titan Zero recognition confidence: 100% on the supplied host snapshot.
- PHP requirement: `^8.2`.
- Laravel: `^10.0`.
- Livewire: `^3.5`.
- React dependency: `^19.2.5`.
- Alpine dependency: `^3.15.8`.
- Vite: `^7.1.3`.
- Tailwind: `^3.4.15`.
- PHP test framework detected from Composer: Pest.
- Root npm build scripts include lint/dev/build/clean/watch.

## Safe core snapshot

The verification runner loaded 2,044 host files selected from root manifests/config, routes, core `app/`, Blade/JS resources, and tests. `app/Extensions/*`, vendor, node_modules, storage/logs, and Git metadata were not loaded.

## Core schema index

From the supplied SQL dump using the current configured extension-owned table-prefix exclusions:

- 129 core tables analyzed.
- 253 prefixed tables excluded from this host-only pack.
- 1,639 columns indexed.
- 271 indexes indexed.
- 53 foreign keys indexed.

The index retains credential-like **column names as risk metadata** but does not ingest arbitrary row values.

## Tenancy signals

Within the current host-only table scope:

- 9 tables expose `company_id`.
- 42 tables expose `user_id`.
- no `tenant_company_id` tables remain in the current host-only prefix-filtered schema set.

This does **not** establish that `company_id` is globally authoritative. The pack intentionally retains a rule requiring per-domain ownership resolution because excluded extension-owned schemas can use different tenancy contracts.

## PHP/Laravel architecture

Core class inventory in the selected snapshot:

- 131 controllers.
- 104 models.
- 90 services.
- 11 service providers.
- 27 middleware classes.
- 11 jobs.
- 11 Livewire component classes.
- 1 policy.
- 4 explicit container bindings detected by the conservative binding parser.

## Routes

- 645 core route macro calls.
- 472 named-route declarations.
- 461 controller-route statements parsed.
- 104 candidate duplicate named-route declarations.

Duplicate-name findings require review. Route groups/macros and repeated conditional definitions can cause conservative static parsing to over-report, so these are diagnostics candidates rather than automatic edits.

## Frontend

- 796 Blade files.
- 11 Livewire component classes.
- 215 Blade files with Alpine interaction signals.
- major view families detected include `default`, `titan-field-classic`, `modern`, `marketing-bot`, `marketing-bot-dashboard`, `social-media-agent-dashboard`, `bolt`, and `classic`.

The root package declares React 19, although the selected `resources/js` scan did not identify React source files under the current conservative file classifier. Treat dependency presence and source usage as separate facts.

## Model/schema drift candidates

- 104 core models analyzed.
- 58 candidate model/schema drift findings.
- 16 models map to tables absent from the current host-only schema scope.

These findings are intentionally not auto-fixed. Missing-table results can reflect table-prefix filtering, custom runtime table selection, nonstandard pluralization, package-owned tables, or a genuinely stale model/schema relationship.

## Configuration risk metadata

- 47 core config PHP files indexed.
- 235 unique `env(...)` key names detected.
- 26 key names classified as credential-sensitive.

Only names are retained. Environment values are not read by the pack.

## Project graph

The generated safe host graph contains approximately:

- 2,098 nodes.
- 2,278 edges.

Node types include tables, PHP classes/files, controllers, models, services, providers, routes, Blade route consumers, and tests. Edges include model-to-table, route-to-controller, route-consumer, constructor dependency, service-container binding, and foreign-key relationships.

## Core migration caveat

The supplied website archive does not contain a root `database/migrations/` directory, so real-project verification reports zero core migration files. The migration analyzer is nevertheless included and is covered by synthetic tests for identifier-length, destructive-operation, raw-SQL, strict timestamp, and restartability findings.

## How the receiving agent should use these findings

Use the precomputed indexes as bootstrap context and regression fixtures. Regenerate live analysis from the current repository whenever possible. Do not treat static candidates as permission to edit. For each task:

1. select a bounded relevant graph slice;
2. confirm ownership and actual current source;
3. calculate change impact;
4. review risk findings;
5. select targeted tests;
6. only then allow the base extension's governed mutation tools to act.
