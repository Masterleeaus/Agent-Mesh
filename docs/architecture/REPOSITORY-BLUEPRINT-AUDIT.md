# Titan Zero Blueprint v3 — Whole-Repository Audit Ledger

Status: ACTIVE / INCOMPLETE  
Baseline main tree SHA: `31f172f0a75c46020045e40c23d39b1ce5047763`  
Started: 2026-09-28

This ledger tracks exhaustive repository inspection against `TITAN-ZERO-BLUEPRINT-V3.md`. It is evidence of scan coverage, not a second roadmap or issue queue. Substantial implementation work belongs in the existing Codex mission owner. Small unambiguous defects are fixed directly.

## Baseline inventory

GitHub recursive tree returned `truncated: false`.

- Tree entries: 19,416
- Files: 15,570
- Directories: 3,846
- archive/: 8,285 files
- apps/: 3,173 files
- packages/: 2,843 files
- docs/: 297 files
- db/: 240 files
- tests/: 233 files
- .github/: 80 files
- services/: 69 files
- scripts/: 35 files
- workforce/: 7 files
- infra/: 6 files
- ai/: 2 files

Production/donor distinction: `archive/`, `docs/archive/`, generated evidence and donor/import trees are scanned for provenance/reachability but are not assumed production-active.

## Pass ledger

### Pass 1 — complete tree inventory
Status: COMPLETE

Findings:
- Complete recursive inventory captured.
- Archive is larger than active apps/packages combined and requires explicit reachability discipline.
- 66 GitHub workflow files exist, many apparently one-off migration/reconciliation/retirement workflows.

Mission evidence: #648.

### Pass 2 — top-level architecture topology
Status: COMPLETE

Findings:
- apps/web: 1,480 files
- apps/browser: 1,066
- apps/mobile: 334
- apps/marketing: 250
- apps/llm-plugin: 40
- packages/titan-platform: 2,028
- packages/titan-runtime: 199
- packages/workforce: 172
- packages/runtime: 140
- packages/domain: 115
- services/worker: 57
- services/workforce: 11
- No `apps/directadmin/` subtree exists on baseline main.
- DB includes SQLite plus legacy/compatibility MySQL material; production boot must remain SQLite-first.

Mission evidence: #812, #648.

### Pass 3 — VPS/runtime activation and CI
Status: COMPLETE

Files inspected include root execution/package contracts, VPS compose/installers, web/worker Dockerfiles, Workforce production bootstrap/dispatcher/store, CI and production convergence workflow.

Critical finding:
- `infra/compose.vps.yml` starts Redis + web + automation worker only.
- It does not start `services/workforce`, although that service owns `TitanAgentRuntime` + `WorkforceService` + `ZeroWorkforceRuntimeDispatcher` production composition.
- `services/worker` is automation/notification polling, not the canonical hosted Workforce.
- CI/Docker builds use `pnpm install --no-frozen-lockfile`; production convergence workflow explicitly records stale lockfile debt.
- CI tolerates baseline web/worker/titan-platform failures and omits strict web build.

Small fixes applied:
- Root AGENTS.md aligned to Blueprint v3 and issue-mission execution.
- Mission template branch identity changed to `agent/issue-<issue-number>`.

Mission evidence: #811, #812, #648.

### Pass 4 — surface/channel wiring
Status: COMPLETE for architectural seams; deeper file-by-file surface audit remains OPEN.

Findings:
- Zero HTTP interaction derives company scope from authenticated server session and calls a runtime dispatch seam.
- Web has a parallel workforce-command gateway that risk-plans then directly fetches app-local business-op routes; consequential commands require convergence through hosted Workforce/canonical governed execution.
- Native mobile production `SurfaceSdkTitanGateway.converse()` throws `production-conversation-transport-required`; only local/demo conversation is implemented.
- Browser active source still emits Titan Code/Codee identity in Workforce host/gateway contracts.
- LLM plugin is comparatively thin and resolves server context before invoking Titan, but requires deeper gateway/receipt verification.
- Web owns hundreds of API routes across business domains; each requires ownership classification.

Mission evidence: #542, #643, #14, #648.

### Pass 5 — canonical package ownership / Blueprint primitives
Status: COMPLETE for package-name/owner topology; implementation-level package audit remains OPEN.

Findings:
- Strong canonical authority primitives exist under `packages/runtime/authority`.
- Governed execution owner exists at `packages/tools/execution-gateway.mjs`.
- Storage/reconstruction/backup primitives are substantial.
- Evidence is fragmented across multiple evidence/ledger/value/restart/domain mechanisms; #913 must converge roles/ownership rather than create another competing ledger.
- `packages/titan-platform/src/ported/**` overlaps canonical runtime/authority/workforce/storage implementations and requires reachability classification.
- No active canonical Constitution package was found.
- No active Capsule implementation was found.
- No active Federation implementation was found.

Mission evidence: #913, #914, #915, #917, #648.

## Exhaustive scan remaining

The audit is not complete until all tracked files have been classified/inspected. Remaining passes include at minimum:

1. apps/web — IN PROGRESS. Pass 6 inventory classified all 1,480 files: 235 API, 317 libs, 367 app/pages, 75 components, 280 tests, 187 marketing-source, 12 config, 4 assets, 3 other. Mutation/runtime seams are being audited file-by-file; 234 route.ts endpoints require ownership classification.
2. apps/browser — active source vs imports/donor/generated; canonical Browser Node identity and hosted Workforce wiring.
3. apps/mobile — every Dart/native/release file; production transport, offline authority contraction, Zero/Go/Hub modes.
4. apps/llm-plugin + desktop + marketing — thin adapter/marketing isolation.
5. packages/runtime + titan-runtime — canonical runtime ownership and duplicate convergence.
6. packages/workforce + services/workforce — identity/hierarchy/runtime/host activation.
7. packages/tools/connectors/MCP/capability registry.
8. packages/domain/business-services/money/inventory/revenue/onboarding.
9. packages/storage/offline/provenance/observability/settings/log.
10. packages/titan-platform active source vs ported/generated/donor trees.
11. services/worker all automations and business-state mutation paths.
12. db every migration/seed/script, SQLite portability and company isolation.
13. infra/scripts all install/update/backup/restore/release paths.
14. .github every workflow/script/baseline; active vs obsolete mutation workflows.
15. tests/e2e full architecture coverage map.
16. docs/canonical/contracts/working/backlog/archive consistency against Blueprint v3.
17. archive/donor/library masters — provenance and production reachability only.
18. root/workspaces/tools/.titan historical research — production reachability and obsolete coordination machinery.
19. final cross-reference: every Blueprint invariant → implementation owner → tests → mission or PASS.
20. final clean build/install/restart/DirectAdmin Server Node/surface E2E certification.

## Completion rule

Do not mark this audit complete until every tracked path is covered by a recorded pass and every Blueprint v3 invariant has either:
- verified implementation + tests,
- a small fix committed directly, or
- exact file-level evidence added to the substantial canonical Codex mission that owns the remaining work.


### Pass 6 — apps/web exhaustive surface audit (part A)
Status: IN PROGRESS

Coverage/classification of all 1,480 paths:
- API: 235 files / 234 route.ts endpoints
- libs: 317
- app/pages: 367
- components: 75
- tests: 280
- marketing-source: 187
- config: 12
- assets: 4
- other: 3

Findings so far:
- Zero interaction route correctly derives company scope from authenticated server session, but its dispatcher is process-local registration and must bind to the persistent hosted Workforce composition from #811.
- Web workforce command gateway directly fetches app-local business-op routes after role/risk planning; consequential commands need #14 convergence.
- Representative dispatch/job/work-order/automation routes directly mutate business tables inside the surface.
- `apps/web/lib/db.ts` is PostgreSQL-only while canonical VPS is SQLite-first; reachable consumers are a production portability risk.
- Domain/business logic is heavily concentrated in web libs (estimates/invoices/expenses/jobs/visits/work-orders etc.) and requires ownership extraction/classification under #183/#263/#353/#648.
- Web AGENTS boundary was corrected to Blueprint v3, canonical Zero/Go/Hub IDs and hosted Workforce semantics.
- Small hygiene fixes: removed committed `apps/web/tsconfig.tsbuildinfo` and `apps/web/marketing-source/tradepilot/app/page.tsx.bak`.

Mission evidence: #811, #14, #183, #263, #353, #542, #648.
