# Workforce cockpit continuation evidence — #1050

This is implementation evidence and a dependency handoff, not mission completion.
PR #1143 was merged to main as `468d42b1a93401a2357f2da253f639694cb4a937` after
its last recorded draft update; its remote branch was deleted by that merge. The
accepted #1145 history is preserved in main. A Jason-directed bounded follow-up
now owns the same canonical `agent/issue-1050` ref, initially recreated at
`c46774cc007a324ec618ecdfdfe5a04acd44780f` and normally fast-forwarded to current
main `d508a2695fccc36e039f18e60cb96adfbe318813` after #1243. Issue #1050 remains
open. Earlier records below are historical snapshots; current v0.1.5 evidence is
recorded at the end.

## Sources inspected

- Historical initial run: main `ccf8010a35292caa17bac393214b43b1a8209e2a`, including #812 commit
  `89ff2427339a6f216281c970376be4634ee9fb9f`; that first extracted relay integration was
  intentionally pinned to pre-change #812 head `8cae7034f6d2ec7c9063ac0c3aba40c6f41b3d89`. The tested-main snapshot
  rerun and synthetic v2 config evidence are recorded below. Root/apps/packages AGENTS, ai/INVARIANTS,
  Blueprint v3, Canonical Rules, phase map and DirectAdmin development guide.
  That snapshot also includes #1048/#1209 Developer Portal hardening; it does not
  replace Workforce's canonical owner or relay contracts.
- #1050 current issue and claim comments, #1143 and accepted #1145.
- #1049 remains an open SDK mission; PR #1204 merged to main at `75cc7f02` from head `5b1275df`. The tested SDK implementation source `e428b67b34779e49f4dbc8d3e80b193e8737eb13` supplies the package bundle and contribution-version compatibility handling.
- #811 / PR #1201 merged at exact head `25005f4f4d860e2ec1dddb9f0a2c4aa152fd0488`, including the optional DirectAdmin gateway mount. #812 / PR #1211 merged to main at `8199494e` from source head `89ff2427339a6f216281c970376be4634ee9fb9f`. The initial extracted run was pinned to pre-v2 `8cae7034`; the later 0.1.5 run used the merged 0.3.0 relay and a synthetic test-only v2 marker, not Apache verification.
- #1182 owns conversation transport; PR #1188's hosted conversation lifecycle is merged, but the Workforce panel does not integrate the transport. #302 remains the shared identity owner.
- #1179 prerequisite ad43d010d50ba262c02beaf0ed892b656174ff58 merged with provenance.
- No repository `.agents/skills` directory exists; executor `.agents` is empty.

## What this continuation implements

`apps/directadmin/workforce` owns an executable Node shell for all DA roles,
company-bound ephemeral consumer state, roster/hierarchy/work/control/receipt/
evidence/health presentation, explicit unavailable states, native-theme fallbacks,
fixed Operations deep links, SDK-compatible summary shape and real archive/
staging install/update/uninstall contracts. It introduces no business store,
identity/auth resolver, authority engine, agent runtime or provider execution.

The browser calls the shared #1049 `DirectAdminCockpitSession` through #812's published
`createDirectAdminRelayFetch` module. The only direct SDK changes add `titan_workforce`
to existing plugin type/gateway/browser allowlists. No identity, issuance, CSRF,
authority or revalidation behavior is forked. The consumer validates and presents the
published #811 projection source, freshness and evidence references. Lifecycle
proposals remain gated by host-published controls and shared intent ingress; an
acknowledgement is never upgraded to a verified outcome.

The #811 projection data schema `titan.workforce-cockpit.v1` merged to main at
`14163faa` and remains present in current main `d508a269`. The earlier record
was checked at `ccf8010a`; the main-snapshot `468d42b1` rerun is recorded below.
The schema contains
`discovery: {company_id, workers, controls: []}` and `status: {company_id, work}`.
Its owner reads canonical company-filtered Workforce/run records. The contract is
merged to main, but is not live-certified. Controls are explicitly
empty and do not confer execution authority. Production never uses fixture data
or grants authority from a control descriptor.

## Concrete integration blockers

| Owner | Observed published behavior | Needed for functioning cockpit |
|---|---|---|
| #1049 / #1204 | PR #1204 merged to main at `75cc7f02` from head `5b1275df`; the tested SDK implementation source remains `e428b67b`. It consumes the canonical #302 session issuer/registry, publishes trusted browser session context and a separate server-only Workforce/Zero exchange. The browser SDK hashes the opaque context revision to the relay's bounded `ctx1_` assertion; the gateway checks it against current #302 state. Typed unsupported Workforce actions map to a sanitized 403. The SDK preserves valid sibling session state on 403 and invalidates on authentication/context failure; bridge failures distinguish rejected request/session from owner outages. The host contribution registry supports SDK compatibility `1.0.0` and degrades an incompatible major independently. The plugin reads trusted host CSRF metadata and never creates identity/CSRF from CGI, environment, query or form data. | Workforce tags a 403 only when the shared SDK's governed-intent route rejects, then revalidates before restoring data. A stale response cannot recover a cleared company view. A 403 during post-acceptance projection refresh clears the view and tells the operator to inspect canonical history. Submit stays disabled after a denial until manual refresh. Production issuer/identity provisioning, trusted DirectAdmin HTML CSRF bootstrap, source credential verification and host/cookie-port commissioning remain unverified. |
| #811 / #1201 | Merged to main at `14163faa` from reviewed head `25005f4f`; live main `23300c79` still contains `services/workforce/src/directadmin-workforce-owners.ts` plus the optional `/v1/directadmin/*` Fetch-handler mount. The owner reads company-filtered canonical `SqliteWorkforceStore` workers/work plus `SqliteRunStore.findByWork`. Outer projection is `{company_id,source,freshness,evidence_refs,data}`; `data` is `{schema:'titan.workforce-cockpit.v1',company_id,discovery,status}`. Worker/work records are company-bound; `discovery.controls` is explicitly `[]`. `requestIntent` validates/revalidates context then denies with a typed 403; it writes no state/event/evidence and fabricates no receipt. | The implementation is in main, but not live-certified. Its Fetch handler needs configured operator dependencies and pinned HTTPS `publicOrigin`. The exact extracted host run used the #811 host/runtime/storage snapshot archived at `c883304a662738fe480ec1e5d044fdeb0c4c879e`, #812 `8cae7034` and #1049 SDK source `e428b67b`; it passed `ctx1_` validation and mapped typed denial to a safe 403 with no writes. The tested host snapshot remains `c883304a`; live main later incorporated #1188, portfolio packaging, #1048/#1209 and #1196 without changing the Workforce owner/route paths. The consumer revalidates after an intent-route 403; a denied refresh after accepted ingress is never called an action denial. The host exposes no authorized lifecycle control or successful action receipt, so the cockpit honestly renders read-only. |
| #1182 / #1188 | PR #1188 merged the hosted conversation retry-identity fix at `ae6db36d`; the owner contract preserves company/actor/device/session/context/conversation/operation/correlation/trace/idempotency and events. | The Workforce panel still does not integrate conversation transport. Add it through the shared gateway consumer when #1182 publishes its usable contract; preserve canonical conversation context and route consequential requests through governance. Do not create a plugin-local conversation ledger. |
| #302 / #1183 / #1240 | Live main `23300c79` includes credential verification and durable current-company session work (`ae0d2c8e`), plus company-placement/storage contracts. The shared resolver head `68e4804f594503f3a205d2caefdb2f9f75701ee4` has 61 security and 63 web regression tests recorded by its owner. | This is implementation and regression evidence, not proof that upstream credentials are verified or protected provisioning is commissioned. Production issuer credentials, protected provisioning, trusted DirectAdmin CSRF bootstrap, approved audience-bound Workforce handoff, and real host/session commissioning remain upstream. |
| #812 / #1211 | The recorded tested head `8cae7034` publishes the RAW endpoint `/CMD_PLUGINS/titan-server-node/directadmin-gateway.raw` and fetch adapter `/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs`. #1050 imports that helper; no parser/proxy is duplicated. Live main `23300c79` includes #812 commit `89ff2427`, with experimental config-v2 and an Apache `:443` cookie-boundary marker/template; the earlier integration was pinned to pre-v2 `8cae7034`; the supplemental 0.1.5 run exercises the v2 parser only in a synthetic fixture and does not attest an Apache filter. | Independent review of the new contract and testing on a real disposable Apache/DirectAdmin host are required before adoption. The marker is deployment intent, not proof that Apache strips cookies. Exact CGI `HEADERS`, port-2222 session/cookie isolation, protected relay config, actual host and #811 operator dependencies remain uncommissioned. Use same-host loopback or privately authenticated HTTPS; never place credentials in URLs or assume a `:443` rule affects DirectAdmin `:2222`. |
| #648 / current reproducibility | Live main `23300c79185f6dc7f8c4b6ab3ae11ac8aa114906` includes #1201, #812, #1183/#1240, portfolio packaging, and the latest #1048/#1209 Developer Portal work. | `gate:fast` and full `gate` results recorded below were run on code baseline `14163faa316ac6236e88167b7c8d8a5e95007c7e`, before this main advance. The known TASK-128 duplicate migration prefixes 151, 152 and 177–183 belong to #648's convergence scope; verify them on current main before using that as a current gate result. #1084 / #1179 owns shared web/index/CI repairs, not migration ownership. No migrations were renumbered here. |

Coordination requests are recorded on #1204 and #1201. The current bounded
request and candidate file path are recorded on #1201. They are real missing
upstream connections, not permission requests to recreate their owners.

## Verification

- The real Chromium package test boots the extracted role entrypoint and actual bundled SDK against a controlled localhost host. Its body matches the #811 projection record fields but the server responses, context, cookie, session and CSRF nonce are test-only fixtures. It checks source/freshness display, an empty controls list causing explicit read-only rendering with no intent POST, company isolation, logout/denial, REQUESTED-only receipt display, a late response across actual page navigation, full reload, synthetic lifecycle events, and local expiry clearing a visible receipt without an HTTP 401. This is consumer acceptance, not a live #811 route or production-session certification.
- Hosted SDK integration now uses the actual #302 signed issuance service, registry, DirectAdmin session bridge and context switch cookie rotation. It asserts and forwards the exact SDK `X-Titan-CSRF` nonce. Only projection/intent owners remain explicit fixtures; no actual hosted endpoint is claimed. It tests company A to B isolation, duplicate in-flight intent suppression, cancellation ingress, revoked credential rejection and `COMPLETED` remaining unverified.
- `node --test apps/directadmin/workforce/tests/sdk-contract.integration.mjs`: 4 tests verify shared package/contribution acceptance, fail-closed executable roles without commissioned CSRF, and packaged UI lifecycle behavior in Chromium.
- `node --test packages/titan-platform/tests/directadmin-bridge.test.mjs packages/titan-platform/tests/directadmin-plugin.test.mjs packages/titan-platform/tests/security-boundary.test.mjs packages/titan-platform/tests/security-session-registry.test.mjs packages/titan-platform/tests/security-session-credentials.test.mjs`: 194 shared bridge/SDK/security tests passed.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/1050-playwright node --test packages/titan-platform/tests/directadmin-browser.browser.mjs`: 1 browser suite passed in system Chromium via a temporary Playwright executable path. The temporary browser path did not change system trust or server settings.
- Independent review verified malformed `run_id` coercion and CSRF header forwarding; it passed the focused controller/browser suite and independently reran the canonical hosted integration 1/1. Earlier fixes cover false VERIFIED fallback, stale refresh after revocation and malformed evidence refs.
- The independent consumer review found and the current diff fixes two recovery hazards: stale 403 responses could have restored invalidated company state, and post-acceptance read denial could have been mislabeled as action denial. #811's typed denial maps to 403 in the exact extracted relay-to-host run and writes no business state or events.
- `node_modules/.bin/tsc -p packages/titan-platform/tsconfig.json --noEmit false --outDir packages/titan-platform/.test-dist --module NodeNext --moduleResolution NodeNext --isolatedModules false`: passed after a temporary local normalization of the two malformed trailing literal `\\n` sequences in the current-main `src/index.ts` and `tsconfig.json`; both original files were restored byte-for-byte and `.test-dist` was removed. The typecheck used locked `jose@6.1.3` unpacked under `/tmp` and an ignored local node_modules link because that exact version was absent from this workspace cache; the already-declared storage/tsx workspace links were also restored locally. No package/lock/compiler repair was made.
- Package builder produces flat `titan_workforce.tar.gz`, SHA256 sidecar and verifies extracted modes/content/shared SDK validation/staging preflight. Extracted role entrypoints execute.
- Complete consumer/browser/hosted SDK suite, using the SDK source from #1049 implementation head `e428b67b` (current PR head `2e41044` only merges the main README; bundle SHA256 `c45d611fbdee263cd248e4c7f9736bbe64fa80d1b7cadb19c022e27fa970db95`): `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium TITAN_COCKPIT_SDK_MODULE=/tmp/1050-sdk-e428.mjs TITAN_BRIDGE_FIXTURE_MODULE=/tmp/1050-sdk-e428/packages/titan-platform/tests/fixtures/directadmin-bridge-fixture.mjs node --test apps/directadmin/workforce/tests/*.test.mjs apps/directadmin/workforce/tests/sdk-contract.integration.mjs apps/directadmin/workforce/tests/hosted-sdk.integration.mjs`: **39/39 passed**.
- The exact #1049 e428 DirectAdmin and Workforce-exchange focused suites passed **112/112**; the current #812 Server Node suite passed **101/101**. SDK compatibility-major degradation/recovery passes for Workforce's declared `sdk_compatibility: 1.0.0`.
- On host/identity source snapshot `c883304a662738fe480ec1e5d044fdeb0c4c879e`, the #302 credential/registry/Workforce-exchange suites passed **125/125** under Node 22.23.3; current-company web session regressions passed **27/27**; #1240 company-placement and storage resolver tests passed **21/21**. The package test TypeScript compile passed. These focused checks complement, but do not replace, the repository gate or upstream credential/provisioning commissioning. Main later advanced to `ccf8010a`; these counts are recorded against the archived snapshot, not claimed as rerun on that newer head.
- The extracted relay-to-host integration passed against #811 host/runtime/storage sources archived from main `c883304a662738fe480ec1e5d044fdeb0c4c879e`, #812 tested head `8cae7034f6d2ec7c9063ac0c3aba40c6f41b3d89`, and #1049 SDK source `e428b67b34779e49f4dbc8d3e80b193e8737eb13`. It covered missing-config 503, company-filtered read/evidence, read-only controls, isolated invalid-CSRF 401/cookie clearing, typed action 403/preserved valid session, company switch, and upstream expiry. No work/event writes occurred; 14 RAW requests and 15 hosted routes were observed. The signed identity/nonce and injected HTML meta remain the #1049 disposable fixture; this is not production credential/provisioning commissioning. Main later advanced to `ccf8010a` through `ae6db36d`, #1197 portfolio packaging, and #1048/#1209 Developer Portal hardening; these commits do not alter the tested host/Workforce route paths. This run predates #812's current `89ff2427` config-v2/Apache-cookie-boundary change; it proves nothing about that configuration or real Apache cookie isolation.
- Exact runtime recovery for the composed host test: official Node v22.23.3 tarball SHA256 `df450af89261115ef9f9e3830c3eeb2cc9213b63c720b1af623cb5dcbe2e02de`; official `better-sqlite3@12.11.1` Node ABI 127 prebuild installed with `prebuild-install@7.1.3`; targeted `npm rebuild` succeeded using the existing prebuild under Node 22/npm 10.9.9. No node-gyp compilation, PNPM security setting or repository dependency was changed.
- Independent security review at #1049 head `6289e084` found no concrete consumer recovery regression and passed 28/28 focused tests. That review preceded the later SDK compatibility-major addition in `e428b67b`; the exact e428 source's 112 focused tests and the consumer/relay suites pass as recorded here.
- On code baseline main `14163faa`, `PATH=/tmp/1050-pnpm-bin:$PATH PNPM_HOME=/tmp/1050-pnpm-home XDG_DATA_HOME=/tmp/1050-xdg-data bash scripts/gate.sh --fast` and full `bash scripts/gate.sh` passed lint then stopped at the recorded TASK-128 duplicate migration prefixes 151, 152 and 177–183. Current main advanced to `ccf8010a` with #812, distribution-gateway, #1197 portfolio packaging, #1183 credential/session, #1240 company-placement, and #1048/#1209 Developer Portal changes after that run; the historical gate has not been rerun on current main. Migration convergence remains with #648; #1084/#1179 owns shared web/index/CI repairs. No migrations were changed here.
- On main snapshot `ccf8010a` after the merge, DirectAdmin portfolio packaging tests passed **7/7**, Developer Portal owner tests passed **7/7**, the Server Node package manifest validator passed, and lifecycle shell scripts passed `bash -n`. These checks do not change or certify the separate Workforce package contract.

The consumer validates the outer source/freshness/evidence contract and shows those fields under Health. The host's current `controls: []` is rendered as read-only. It does not inject its own caller/CSRF bootstrap. Company-switch, logout, real navigation with a late acknowledgement, full reload and BFCache handler tests clear receipts. Intent-route 403 revalidation restores current data only while the same action remains current and fresh session resolution succeeds; 401/revocation clears it. A 403 after accepted ingress keeps the view cleared and requires history inspection. The local SDK expiry test clears a populated receipt at/after `expires_at` without HTTP 401. The earlier version 0.1.4 archive is historical; the current version 0.1.5 candidate and checksum are recorded in [WORKFORCE-PACKAGE-VERIFICATION.md](WORKFORCE-PACKAGE-VERIFICATION.md). No server install occurred.

No production/server deployment or credentials/security-setting changes occurred.
No live DirectAdmin/VPS certification has run. Package test fixtures are excluded
from the install archive; native runtime/server tests belong to their owners.

## Mission scope retained

All 28 numbered acceptance criteria, implementation checklist and subsequent
Time Attendance/credential deltas remain in open #1050. Consumer safety tests
partially support company isolation, identity/authority separation, evidence
labelling and truthful reconnect; they do not certify current canonical roster,
persistent runtime independence, six native-agent journeys, governed conversations,
provider rebinding, hierarchy/teams/Missions/approvals, trust/autonomy/credentials,
capacity/value/staffing, knowledge scopes, Zero contribution or live installation.
The later attendance lifecycle/offline/overlap/correction/payroll requirements are
not implemented by this cockpit slice and have not been administratively closed.

Rollback is a revert of the cockpit commits. No customer/business state or
migration exists in the plugin. Shared prerequisite history remains owned by
its original missions.

## Previous main-snapshot continuation run — 468d42b1

The exact main snapshot used for these checks is
`468d42b1a93401a2357f2da253f639694cb4a937`; it merged PR #1143 from branch head
`f2f750e434f9f82d964920351ebc80245bd680f3`. Live main has since advanced to
`23300c79185f6dc7f8c4b6ab3ae11ac8aa114906` through #1196. The intervening diff
touches mobile and `.github/workflows/titan-ci.yml`, not the tested DirectAdmin
Workforce, Server Node, host or SDK source paths. The old #1143 head remains an
ancestor of live main, but the `agent/issue-1050` remote ref was deleted after
merge. This local verification does not recreate the branch, push, or open a
replacement PR; #1050 remains open.

The #1049 SDK was compiled from the exact main snapshot above; bundled
module SHA256 is
`57d4776fdaee9359aa669d0b756392614772051cb023cce71d05c9bafc269077`. The new
Workforce package candidate is version **0.1.5**, with 19 files and archive
SHA256
`0e7cdf5fae1bcb0b459c0aab2c557b442cbf6eb14ff6e9b1edbf70529e09ce31`.
The staged install/update/uninstall scripts and role executables passed local
preflight only; nothing was installed into DirectAdmin.

On the current SDK candidate, the Workforce consumer, browser, hosted-session,
and package suite passed **39/39**. The hosted-session regression drives the
actual #302 fixture issuer/registry and current #1049 SDK: an owner-unavailable
503 clears the company projection but does not invalidate the still-valid
DirectAdmin session, retry recovers the same company, and a revoked-session 401
invalidates the session and leaves the cockpit denied. The browser test for
canonical `controls: []` confirms the exact read-only explanation and no intent
submission. Company-switch, revocation, stale response, denial, evidence and
receipt checks remain in the suite.

The extracted host integration was rerun from exact archives at the tested main
snapshot for #811 Workforce/storage, #812 Server Node and the #1049 SDK. It extracted the
Workforce 0.1.5 and Server Node 0.3.0 packages, exercised the actual host routes,
and passed 14 RAW requests / 15 hosted routes, including company A/B isolation,
missing-config 503, CSRF denial, typed lifecycle denial with no work/event
writes, and expiry clearing. The relay config used the v2 shape only as a
temporary `NODE_ENV=test` fixture; its `cookie_boundary` marker was synthetic.
This is not Apache, DirectAdmin CGI, cookie-port isolation, production issuer, or
host commissioning evidence. `controls: []` still means the host publishes no
authorized lifecycle action or successful governed receipt.

**Known commissioning blocker:** the parent confirmed that #812's experimental
Apache `:443` cookie filter fails open when the Titan cookie is split across
duplicate physical `Cookie` headers. The v2 marker cannot prove the filter is
installed or correct, and a duplicate-header check in the `:2222` RAW parser
does not test or close the separate `:443` boundary. Do not commission or install
until #812 closes that failure and the filter is independently verified on an
authorized disposable Apache/DirectAdmin host using cookie-name-only evidence.

Other exact host inputs still missing are verified #302 production issuer
credentials and protected provisioning; a trusted HTML CSRF bootstrap and
approved audience-bound DirectAdmin-to-Workforce handoff; configured #811
operator dependencies and private `publicOrigin` reachability; actual DirectAdmin
`HEADERS`, POST-stdin and separate `Set-Cookie` behavior; and a host runtime that
meets the Server Node prerequisite. The prior operator-supplied host report
listed Node 16.20.2, below the required version, and is not independently verified.
No credential, host, service, firewall, DNS, package or security setting was
changed. Full roster/detail, conversations, hierarchy/Missions, trust/autonomy,
capacity/value, and evidence journeys remain outside this bounded consumer
slice, so #1050 stays open.

## Hosted CI coverage audit

The merged PR #1143 head `f2f750e434f9f82d964920351ebc80245bd680f3` has three
relevant build/test workflow runs: DirectAdmin plugin portfolio `36997716622`,
Titan Zero CI `36997716686`, and source evidence index `36997716733`. The
separate Agent Claim Gate had four attempts on that head: final run
`36997847921` succeeded, one earlier run failed, and two were cancelled. The
build/test job steps cover portfolio packaging, Dev Access, Server Node
package/lifecycle checks, general type/build/regression gates and source
indexing. None executes
`apps/directadmin/workforce/tests/*.test.mjs`,
`sdk-contract.integration.mjs`, `hosted-sdk.integration.mjs`, or
`relay-host.integration.mjs`. `workforce-verification.yml` is scoped to
`services/workforce/**` and `packages/workforce/**`; it does not trigger on the
DirectAdmin plugin. The live-main workflows were inspected after #1196 and
refreshed against `d508a269` after #1243; the DirectAdmin portfolio workflow
still has no Workforce consumer test step, and the generic Workforce workflow
still filters out
`apps/directadmin/workforce/**`. Therefore the 39/39 consumer result and the
extracted host run above are local verification evidence, not hosted CI coverage.

Ownership check: #1084 is closed and its #1179 CI convergence PR is merged. The
open DirectAdmin portfolio certification issue #1157 has an active
`agent/issue-1157` branch at `b7882d66019c94084a0324a8e1a8ce44290ff50f`; its
acceptance requires a CI/live-host verification record, although its current
diff does not change workflows. The bounded CI follow-up belongs with #1157:
add a secretless Node 22 job that builds the canonical SDK bundle from the
checked-out source, runs the Workforce consumer/browser/hosted-session/package
suite, and runs the extracted relay-to-host fixture with the synthetic v2 config.
Keep the Apache boundary and production commissioning explicitly outside that
fixture. No workflow or separate claim was added here; until the #1157-owned job
actually executes these paths, do not report hosted cockpit test coverage.

## Current-source continuation run — 2026-10-02

Current main is `d508a2695fccc36e039f18e60cb96adfbe318813` (#1243). Its only
changes since the claimed `c46774cc` base are the canonical session bridge,
bridge tests, session contract documentation, and an unrelated package test
fixture. The DirectAdmin Workforce app and #811/#812 host inputs are unchanged.
The claim branch was fast-forwarded normally, preserving the single canonical
branch and all merged #1143/#1145 history. The `agent/issue-1157` CI owner remains
at `b7882d66019c94084a0324a8e1a8ce44290ff50f`; no workflow was changed here.

The current #1049 SDK browser module was bundled from exact #1243 source at
`d508a269` using Node v22.23.3; tarball SHA256 was
`df450af89261115ef9f9e3830c3eeb2cc9213b63c720b1af623cb5dcbe2e02de` and bundle
SHA256 is `9d94cb80dbb0e7df15388efb1de2262e6c26af041f66a1c5d4944045fc491c9a`.
The SDK bridge owner regression file passed **83/83**, including replacement
session rejection (401) versus registry outage (503) behavior. The Workforce
consumer/browser/hosted-session/package command also passed **39/39** against
that exact bundle. The new owner-recovery regression proves an owner 503 clears
the projection without invalidating the authenticated DirectAdmin session and
that retry recovers the selected company; a revoked-session 401 invalidates the
session and leaves the panel denied.

Two independent package builds from the claim branch source and current SDK
produced the same 19-file v0.1.5 archive SHA256
`dba818f4a2988fbeeee676933029732a2876577fca2cb48ea244b79e7a77766f`; its
bundled SDK hash matches the value above. Independent extraction checked the
sidecar, file count, SDK hash, role and lifecycle entrypoint modes, and staged
install/update/uninstall preflight. These are candidate checks only; nothing was
installed in DirectAdmin.

The extracted relay-to-host integration archived #811 Workforce/storage/runtime,
#812 Server Node, and the #1049 bridge fixture from exact `d508a269` source. It
passed **14 RAW requests / 15 hosted routes** for company A/B isolation, missing
config 503, CSRF denial, evidence projection, typed governed-action denial with
no work/event writes, and expiry clearing. It used the Server Node **0.3.0** v2
config parser only with a synthetic `NODE_ENV=test` `cookie_boundary` marker.
This did not run Apache, DirectAdmin CGI, production credentials, or host
commissioning. `controls: []` still means no published authorized lifecycle
action or successful receipt.

**Production relay failure remains open:** the parent-confirmed experimental
Apache `:443` filter fails open when the Titan cookie is split across duplicate
physical `Cookie` headers. The v2 test marker and the separate `:2222` RAW parser
do not test or close that boundary. Do not commission or install until #812 fixes
the filter and it is independently verified on an authorized disposable
Apache/DirectAdmin host using cookie-name-only evidence.

Other missing integration inputs remain verified #302 production issuer
credentials/protected provisioning; trusted DirectAdmin HTML CSRF bootstrap and
approved audience-bound Workforce handoff; configured #811 operator dependencies
and private `publicOrigin`; actual DirectAdmin CGI `HEADERS`, POST-stdin and
separate `Set-Cookie` behavior; and a supported host Node runtime. Full #1050
roster/detail, conversations, hierarchy/Missions, trust/autonomy, capacity/value,
attendance, department pack, earned autonomy, and evidence journeys are not
proved by this bounded consumer/package work. #1050 remains open.
