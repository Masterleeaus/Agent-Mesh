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
- DB includes SQLite plus legacy/compatibility SQL material. Current target preserves the native Titan FSM while routing company-owned operational business state to one physical database per company; SQLite remains valid for native company databases and explicit runtime/control/evidence owners where supported. Frappe is optional extension infrastructure.

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

1. apps/web — COMPLETE at architecture/ownership level across all 1,480 tracked paths (Passes 6A–6C). Exact substantial migration work is recorded in #811/#14/#183/#263/#343/#353/#542/#639/#648. Future Codex missions still perform implementation-level edits/tests inside those paths.
2. apps/browser — IN PROGRESS. Pass 7A–7B classified all 1,066 files and active entry/runtime architecture; production service-worker reachability and private Codex-supervisor split mapped. Remaining: browser mechanics/security/local-intelligence modules + tests/import provenance closure.
3. apps/mobile — every Dart/native/release file; production transport, offline authority contraction, Zero/Go/Hub modes.
4. apps/llm-plugin + desktop + marketing — thin adapter/marketing isolation.
5. packages/runtime + titan-runtime — canonical runtime ownership and duplicate convergence.
6. packages/workforce + services/workforce — identity/hierarchy/runtime/host activation.
7. packages/tools/connectors/MCP/capability registry.
8. packages/domain/business-services/money/inventory/revenue/onboarding.
9. packages/storage/offline/provenance/observability/settings/log.
10. packages/titan-platform active source vs ported/generated/donor trees.
11. services/worker all automations and business-state mutation paths.
12. db every migration/seed/script, native FSM portability, physical database-per-company isolation, and explicit runtime/control/evidence ownership.
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
- `apps/web/lib/db.ts` is PostgreSQL-only and assumes shared/account-scoped connectivity; reachable consumers are a production portability/isolation risk. Preserve their native FSM behavior while converging them behind supported company-database resolution/portable storage.
- Domain/business logic is heavily concentrated in web libs (estimates/invoices/expenses/jobs/visits/work-orders etc.) and requires ownership extraction/classification under #183/#263/#353/#648.
- Web AGENTS boundary was corrected to Blueprint v3, canonical Zero/Go/Hub IDs and hosted Workforce semantics.
- Small hygiene fixes: removed committed `apps/web/tsconfig.tsbuildinfo` and `apps/web/marketing-source/tradepilot/app/page.tsx.bak`.

Mission evidence: #811, #14, #183, #263, #353, #542, #648.


### Pass 6B — apps/web API/domain ownership
Status: IN PROGRESS

API family inventory (233 route.ts endpoints): estimates 19, visits 17, invoices 16, jobs 13, activities 9, expenses 9, titan 9, work-orders 9, sessions 8, booking-requests/properties/time-clock 6 each, attention/dispatch/materials/vehicles 5 each, plus smaller families.

Verified findings:
- Material ordinary domain routes still mutate business state directly in the web surface (dispatch, jobs, work orders, payments, provider webhooks, automations and others).
- Six `workforce-native` adapters use a better transitional pattern: non-GET execution fails closed with `CANONICAL_EXECUTION_AUTHORITY_REQUIRED`. Preserve that fail-closed behavior and replace internal HTTP mutation with the canonical hosted Workforce/execution envelope.
- `lib/estimates/db.ts` remains PostgreSQL-only while `lib/invoices/db.ts` has already moved to portable transactions; converge on the existing portable boundary.
- `lib/automations/service.ts` is PostgreSQL-specific (`PoolClient`, `SET LOCAL`) and cannot satisfy the current portable database-per-company production contract as-is.
- Payment and Square webhook code has useful signature/idempotency/company checks but currently turns provider events directly into financial rows/status; Finance must distinguish provider event receipt from verified Titan financial outcome.
- Estimate send route combines pricing, state transition, email/PDF delivery and audit/cascade orchestration in the surface; Sales/Quote canonical owner should absorb material behavior.
- No further obvious backup/build-artifact files remain in apps/web after Pass 6A cleanup.

Mission evidence: #811, #14, #183, #263, #343, #353, #648.


### Pass 6C — apps/web libraries + surface topology
Status: COMPLETE (architecture/ownership coverage for apps/web)

All 317 lib paths were inventoried by functional owner and the 367 app/page paths were classified as office/field/customer/auth/public/compatibility UI.

Findings:
- Current product topology remains office dashboard + field workspace + separate customer portal, not yet one canonical Zero/Go/Hub PWA.
- `/app/zero` correctly refuses to fabricate Workforce state but currently shows zero pulse until hosted projections are wired.
- `/app/my-work` is the current Go-equivalent and still contains PostgreSQL-only projection queries through `queryForSession`.
- `/portal/**` is the current Hub-equivalent but uses separate portal routes/session and PostgreSQL-specific query helpers; preserve its customer privacy semantics while converging to Hub projection.
- Desired zero/go/hub navigation contracts already exist under `lib/titan/interface-runtime/host.ts`, ahead of actual page topology.
- Workforce hierarchy/context modules in web are largely re-exports/adapters; ensure persistent state/runtime remains server-owned.
- Business-workflow and revenue web modules still re-export some `packages/titan-platform/src/ported/**` owners and require #648 convergence.
- No remaining obvious .bak/.tsbuildinfo artifacts were found after cleanup.

apps/web is now considered scanned for Blueprint architecture/ownership. Implementation missions retain the exact substantial work.

Mission evidence: #811, #14, #183, #263, #343, #353, #542, #639, #648.


### Pass 6C — apps/web libraries + Zero/Go/Hub topology
Status: COMPLETE for architectural/reachability scan of apps/web

Coverage:
- 537 lib files classified by owner cluster.
- 380 non-API app/page/style files classified.
- Surface/runtime named paths and canonical interaction/Workforce seams inspected.

Findings:
- Zero page exists but chat UI is not wired to its interaction transport; current form is GET-only and Workforce pulse values are hard-coded zero.
- Main owner `/app` remains a large SQL-derived operational dashboard and current practical owner home.
- Go behavior is primarily legacy `/app/my-work`; it still uses PostgreSQL-only session queries/SQL and is not certified against the current company-storage resolver/database-per-company contract.
- Hub behavior remains separate `/portal/**` pages rather than one-PWA canonical Hub mode.
- Existing `TitanInteractionClient` correctly normalizes aliases to canonical zero/go/hub, which is a useful convergence primitive.
- `ZeroWorkforceDispatcher` is already designed as a thin adapter to a cross-process canonical Workforce port; preserve it and bind it to the persistent hosted Workforce from #811.
- Web workforce hierarchy runtime files largely re-export canonical titan-platform Workforce owners rather than reimplementing them; preserve thin projections while resolving broader ported/canonical ownership in #648.
- Marketing/product presentation may use Command/Go/Hub names, but runtime identity must remain zero/go/hub.

apps/web disposition: no further architecture-discovery pass is required before Codex missions execute. Future audit revisits web only for mission verification, regression or final certification.

Mission evidence: #542, #811, #14, #183, #263, #343, #353, #648, #913.


### Pass 6C — apps/web libraries + Zero/Go/Hub modes
Status: COMPLETE for repository architecture/ownership scan

Findings:
- Zero is the closest canonical mode but still lacks live authoritative Workforce pulse/projection wiring.
- Go is presently represented mainly by legacy field/my-work pages rather than a unified interaction mode; portions still use PostgreSQL-only DB helpers.
- Hub is presently a separate customer portal architecture; portal session/pages use PostgreSQL-only helpers and SQL constructs, so Hub is not certified against the current portable company-database production path.
- Owner Office-vs-Field routing is a useful presentation preference but must not become a fourth/fifth canonical surface identity.
- Native service bindings retain transitional `existing_api_route` command-authority labels for several domains; `execution_permitted:false` is good fail-closed behavior, but consequential command ownership must converge on hosted Workforce/effective authority/ExecutionGateway.
- Generated UI validation correctly limits actions to navigation or prepared intent rather than direct mutation.
- The only demo-named active web runtime file found is `demo-presentation-intent.ts`; it produces authority-neutral presentation intents. It must remain development/test-only or be replaced by real projections before production UI certification.

apps/web architecture scan disposition:
- substantial convergence → #811, #14, #183, #263, #343, #353, #542, #648;
- no additional standalone mission required.
- web subtree can now move from discovery to mission execution/certification.


### Pass 6C — apps/web libraries and canonical surfaces
Status: COMPLETE for architecture/ownership scan

Findings:
- Nested recount: 537 files under apps/web/lib/**. Largest clusters: estimates 58, invoices 51, titan 39, expenses 29, jobs 26, navigation/visits/work-orders 21 each.
- Zero: dedicated /app/zero + canonical interaction client/HTTP transport exists. It intentionally shows zero Workforce pulse values until authoritative hosted projections arrive.
- Go: mature field UX exists under /app/my-work, but it still uses PostgreSQL-only queryForSession and PostgreSQL SQL syntax, blocking portable database-per-company production parity.
- Hub: mature customer portal exists under /portal/**, but its main customer page still uses PostgreSQL-only query/queryOne.
- Owner /app remains a dashboard-heavy direct projection over business tables; preserve mature UX while converging canonical owner interaction into Zero mode rather than inventing another surface.
- /app/my-day redirects to /app/my-work, so that duplicate field root is already being collapsed.
- workforce-native planning adapters are fail-closed for consequential non-GET actions until canonical execution authority is supplied; preserve this safety property.
- No additional obvious committed .bak/.old/.tsbuildinfo artifacts remained after Pass 6A cleanup.

Conclusion: apps/web is feature-rich but not yet a thin canonical Zero/Go/Hub projection layer. Its principal remaining debts are direct domain mutation ownership, PostgreSQL-only persistence seams, hosted Workforce projection/command wiring and surface convergence. Exact implementation work is now recorded in existing missions rather than new duplicate issues.

Mission evidence: #811, #14, #183, #263, #343, #353, #542, #648.


### Pass 6C — apps/web libraries + Zero/Go/Hub surface convergence
Status: COMPLETE for architecture/ownership scan

Findings:
- Zero page is intentionally truthful/fail-safe but currently hard-codes Workforce pulse counts to zero because authoritative hosted-runtime projection is not wired.
- Go is currently represented largely by `/app/my-work`; it directly consumes PostgreSQL-only `queryForSession` and PG-specific SQL, so it is not yet certified for the canonical company-storage resolver/database-per-company model.
- Hub is currently represented by legacy `/portal/**`; its customer page directly consumes pg-only `query/queryOne` and PG-specific JSON/FILTER/cast SQL. Hub must converge onto canonical customer projection/gateway semantics.
- Legacy Office/Field workspace routing remains in responsive/post-login logic. It can remain a UX compatibility concept but canonical surface identity must be zero/go/hub.
- The owner dashboard at `/app` performs many portable direct reads; it is a useful current projection but should increasingly consume canonical Business Reality/Workforce projections rather than accumulate new domain ownership.
- workforce-native adapters correctly fail closed for consequential operations pending canonical execution authority. Preserve this behavior and connect them to hosted Workforce/#14 instead of relaxing the guard.

apps/web architecture scan disposition:
- small hygiene/instruction defects fixed directly;
- substantial persistence, mutation, runtime and surface convergence recorded in owning Codex missions;
- no additional independent mission required.

Mission evidence: #811, #14, #183, #263, #343, #353, #542, #648, #725.


### Pass 7A–7B — apps/browser topology and production reachability
Status: IN PROGRESS

Complete subtree census:
- 1,066 files total
- tests 488
- active src 319
- imports/donor snapshots 159
- docs 81
- active src: browser 96, titan-zero 68, intelligence 34, workforce 23, repository 20, ai 17, lib 17, interaction-engine 16, integration 13, remainder catalog/managers/sidebar/content/provider.

Critical findings:
- Browser Node documentation correctly defines the extension as a bounded execution node, but the production service worker actively imports a large Codee/Titan Code mini-platform: local capability/AI/model/provider registries, repository mutation/developer stack, Titan repository analyzers, personal Workforce, managers/orchestrator, local risk/delegation, plans, MCP, deployment console and coding workflows.
- `titan-bridge-client.js` is a localhost development bridge exposing repository/file/shell/Codex/Agent-Mesh operations; it is not an appropriate customer Titan Server Node transport.
- ChatGPT/Claude `content-script.js` is primarily Codee coding-plan/ZIP artifact/step-token/nudging machinery. This is valuable private Codex Supervisor functionality but not Titan Zero customer Browser Node runtime.
- MCP governance code contains reusable safety mechanics: bounded args, classification, prepare/approval/commit, backup verification, post-write verification and audit.
- Titan MCP runtime provides a useful configurable server connection seam but currently owns Codee-local storage/approval/receipt identities that must become canonical projections.

Convergence decision:
**Split rather than delete.** Preserve private coding/Codex/Agent-Mesh supervisor capability outside Titan Zero production reachability. Customer Browser Node keeps browser/CDP mechanics, bounded local intelligence, canonical Titan server/MCP/Workforce adapter, local safety floors, verification and evidence capture.

Mission evidence: #643, #648, #812, #432, #7, #639, #640.


### Pass 7A — apps/browser active production boundary
Status: IN PROGRESS

Findings:
- MV3 manifest is correctly branded Titan Zero Browser Node and has bounded core permissions plus optional broader host permissions.
- Active service worker still loads a large Codee/Titan Code private-development platform: repository intelligence/mutation, Agent Mesh/Codex bridge, plan runner, manager orchestration, deployment workforce console, developer pack, local canonical-like capability registry and browser-owned MCP state.
- Strong reusable mechanics exist: browser/CDP interaction, perception/observability, local intelligence, privacy/cost routing, redaction, MCP protocol transport, mutation classification, preapproval backup verification, evidence/artifact verification and fail-closed delegation.
- Browser local capability registry must become a projection/cache/provider descriptor layer beneath canonical #7, not a second registry authority.
- Browser AI routing should become an adapter/projection of #647 while preserving local-first/privacy/cost behavior.
- Customer production Browser Node must be split from private Titan Code/Agent Mesh/repository-coding tooling; donor provenance can remain in docs/imports/tests/archive.

Mission evidence: #643, #648, #7, #647.


### Architecture correction — native FSM and physical company isolation
Status: ACTIVE / SUPERSEDES EARLIER STORAGE ASSUMPTIONS

The mature TypeScript AI-FSM in `apps/web` remains Titan's default native field-service product and must remain independently installable without Frappe. Frappe/ERPNext is an optional extension provider for missing/deeper or deliberately delegated capabilities.

`company_id` remains the canonical logical identity, while company-owned native operational persistence defaults to one physical database per company behind a fail-closed Company Storage Resolver/mapping. Runtime/control/evidence storage remains owner-specific and must not silently become a shared operational business database. Optional Frappe keeps separate site/database isolation per enabled company. Future audit passes must interpret older "SQLite-first" findings as portability evidence, not as a requirement for one shared business SQLite database.
