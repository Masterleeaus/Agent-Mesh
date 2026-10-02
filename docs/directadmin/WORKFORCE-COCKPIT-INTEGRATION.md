# Workforce cockpit continuation evidence — #1050

This is implementation evidence and a dependency handoff, not mission completion.
Canonical claim: `agent/issue-1050`; existing draft PR #1143. Old bounded payload
was accepted through #1145. History is retained without force-push or deletion.

## Sources inspected

- Current main `14163faa316ac6236e88167b7c8d8a5e95007c7e`, root/apps/packages AGENTS, ai/INVARIANTS,
  Blueprint v3, Canonical Rules, phase map and DirectAdmin development guide.
- #1050 current issue and claim comments, #1143 and accepted #1145.
- #1049 current draft PR #1204 head `495bfb6a876473eb6d52302993457fa34024be5d` and canonical #302 credential service.
- #811 / PR #1201 merged at exact head `25005f4f4d860e2ec1dddb9f0a2c4aa152fd0488`, including the optional DirectAdmin gateway mount;
  #812 draft PR #1211 exact head `9ffef58d51f0c7a0a9cfcf0e619f6bc0440508ef`, including its RAW adapter and README contract;
  #1182 conversation transport; shared identity owner #302.
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

The #811 projection data schema `titan.workforce-cockpit.v1` now merged to main contains
`discovery: {company_id, workers, controls: []}` and `status: {company_id, work}`.
Its owner reads canonical company-filtered Workforce/run records. The contract is
merged to main at `14163faa`, but is not live-certified. Controls are explicitly
empty and do not confer execution authority. Production never uses fixture data
or grants authority from a control descriptor.

## Concrete integration blockers

| Owner | Observed published behavior | Needed for functioning cockpit |
|---|---|---|
| #1049 / #1204 | Latest draft head `495bfb6a` consumes the canonical #302 session issuer/registry, publishes trusted browser session context and a separate server-only Workforce/Zero exchange. The browser SDK hashes the opaque context revision to the relay's bounded `ctx1_` assertion; the gateway checks it against current #302 state. Typed unsupported Workforce actions map to a sanitized 403. The latest SDK preserves valid sibling session state on 403 and invalidates on authentication/context failure; bridge failures now distinguish rejected request/session from owner outages. The plugin reads the CSRF meta element supplied by the trusted host and never creates identity/CSRF from CGI, environment, query or form data. | Workforce tags a 403 only when the shared SDK's governed-intent route rejects, then revalidates before restoring data. A stale response cannot recover a cleared company view. A 403 during post-acceptance projection refresh clears the view and tells the operator to inspect canonical history. Submit stays disabled after a denial until manual refresh. Production issuer/identity provisioning, trusted DirectAdmin HTML CSRF bootstrap, source credential verification and host/cookie-port commissioning remain unverified. |
| #811 / #1201 | Merged to main `14163faa` from reviewed head `25005f4f`; it contains `services/workforce/src/directadmin-workforce-owners.ts` and the optional `/v1/directadmin/*` Fetch-handler mount. The owner reads company-filtered canonical `SqliteWorkforceStore` workers/work plus `SqliteRunStore.findByWork`. Outer projection is `{company_id,source,freshness,evidence_refs,data}`; `data` is `{schema:'titan.workforce-cockpit.v1',company_id,discovery,status}`. Worker/work records are company-bound; `discovery.controls` is explicitly `[]`. `requestIntent` validates/revalidates context then denies with a typed 403; it writes no state/event/evidence and fabricates no receipt. | The implementation is in main, but not live-certified. Its Fetch handler needs configured operator dependencies and pinned HTTPS `publicOrigin`. The earlier exact extracted host run passed `ctx1_` validation and mapped typed denial to a safe 403 with no writes. The consumer revalidates after an intent-route 403; a denied refresh after accepted ingress is never called an action denial. The host exposes no authorized lifecycle control or successful action receipt, so the cockpit honestly renders read-only. Current main advances the tested host snapshot; native SQLite is unavailable after the sandbox package refresh, so that composed host scenario was not rerun against merged main. |
| #1182 / #1188 | Conversation request/response preserves company/actor/device/session/context/conversation/operation/correlation/trace/idempotency and events | Shared gateway consumer integration; canonical conversation context and consequential requests through governance. Do not create a plugin-local conversation ledger. |
| #302 / #1183 | Current-session resolver is published | Cryptographically verified credentials and protected provisioning on commissioned infrastructure remain upstream. |
| #812 / #1211 | Draft head `9ffef58d` publishes the RAW endpoint `/CMD_PLUGINS/titan-server-node/directadmin-gateway.raw` and fetch adapter `/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs`. #1050 imports that exact helper; no parser/proxy is duplicated. The latest extracted owner passes the `ctx1_` assertion through to #811. | Exact CGI `HEADERS`, port-2222 session/cookie isolation, protected relay config, actual Server Node/DirectAdmin host and #811 operator dependencies still need commissioning. Use loopback Workforce only on the same host or privately authenticated HTTPS. Never place credentials in URLs or assume an Apache 443 shortcut. |
| #1084 / #1179 | Current main `14163faa316ac6236e88167b7c8d8a5e95007c7e` includes #1201, reviewed #1179 convergence and parser repairs. | This branch merges current main without copying shared parser fixes. `gate:fast` and full `gate` stop at the existing TASK-128 duplicate migration prefixes 151, 152 and 177–183, before later phases. No migrations were renumbered. |

Coordination requests are recorded on #1204 and #1201. The current bounded
request and candidate file path are recorded on #1201. They are real missing
upstream connections, not permission requests to recreate their owners.

## Verification

- Before the sandbox dependency refresh, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium TITAN_COCKPIT_SDK_MODULE=/tmp/1050-sdk/upstream-1049-current.mjs TITAN_BRIDGE_FIXTURE_MODULE=... node --test apps/directadmin/workforce/tests/*.test.mjs apps/directadmin/workforce/tests/sdk-contract.integration.mjs apps/directadmin/workforce/tests/hosted-sdk.integration.mjs`: 39/39 passed against #1049 head `580ba617` and its signed fixture.
- Against latest #1049 head `495bfb6a876473eb6d52302993457fa34024be5d`, rebuilt `directadmin-plugin.ts` to `/tmp/1050-sdk-latest/upstream-1049-495bfb.mjs`; `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium TITAN_COCKPIT_SDK_MODULE=... node --test apps/directadmin/workforce/tests/*.test.mjs apps/directadmin/workforce/tests/sdk-contract.integration.mjs`: 38/38 passed. This latest-head run includes the no-invalidation 403 contract, intent-route-only revalidation, stale 403 refusal, accepted-ingress/read-403 handling, browser UI, package contract and package tests. The separate hosted SDK fixture was not rerun after package-manager dependency refresh because its SQLite native binding build is disabled by the environment's supply-chain policy.
- `TITAN_WORKFORCE_HOST_ROOT=... TITAN_SERVER_NODE_SOURCE_ROOT=... TITAN_COCKPIT_SDK_MODULE=... TITAN_HOST_SDK_MODULE=... TITAN_BRIDGE_FIXTURE_MODULE=... PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node --import ./node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/loader.mjs apps/directadmin/workforce/tests/relay-host.integration.mjs`: passed against exact extracted #811 `85c6de1c`, #812 `9ffef58d` and #1049 `580ba617` before the sandbox dependency refresh. It exercised missing-config 503, company-filtered read projection/evidence, empty-controls read-only, CSRF 401, cross-company switch, expiry clearing, and a governed action request reaching the host and receiving a sanitized 403; the denied action changed no work/events. The signed #1049 session and nonce are canonical test fixtures; synthetic HTML meta insertion is test-only, not the commissioned production bootstrap. Rerunning this host composition against merged #811 head `25005f4f` / latest #1049 `495bfb6a` is blocked by the missing native SQLite binding; no package build script was approved or executed.
- The real Chromium package test boots the extracted role entrypoint and actual bundled SDK against a controlled localhost host. Its body matches the #811 projection record fields but the server responses, context, cookie, session and CSRF nonce are test-only fixtures. It checks source/freshness display, an empty controls list causing explicit read-only rendering with no intent POST, company isolation, logout/denial, REQUESTED-only receipt display, a late response across actual page navigation, full reload, synthetic lifecycle events, and local expiry clearing a visible receipt without an HTTP 401. This is consumer acceptance, not a live #811 route or production-session certification.
- Hosted SDK integration now uses the actual #302 signed issuance service, registry, DirectAdmin session bridge and context switch cookie rotation. It asserts and forwards the exact SDK `X-Titan-CSRF` nonce. Only projection/intent owners remain explicit fixtures; no actual hosted endpoint is claimed. It tests company A to B isolation, duplicate in-flight intent suppression, cancellation ingress, revoked credential rejection and `COMPLETED` remaining unverified.
- `node --test apps/directadmin/workforce/tests/sdk-contract.integration.mjs`: 4 tests verify shared package/contribution acceptance, fail-closed executable roles without commissioned CSRF, and packaged UI lifecycle behavior in Chromium.
- `node --test packages/titan-platform/tests/directadmin-bridge.test.mjs packages/titan-platform/tests/directadmin-plugin.test.mjs packages/titan-platform/tests/security-boundary.test.mjs packages/titan-platform/tests/security-session-registry.test.mjs packages/titan-platform/tests/security-session-credentials.test.mjs`: 194 shared bridge/SDK/security tests passed.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/1050-playwright node --test packages/titan-platform/tests/directadmin-browser.browser.mjs`: 1 browser suite passed in system Chromium via a temporary Playwright executable path. The temporary browser path did not change system trust or server settings.
- Independent review verified malformed `run_id` coercion and CSRF header forwarding; it passed the focused controller/browser suite and independently reran the canonical hosted integration 1/1. Earlier fixes cover false VERIFIED fallback, stale refresh after revocation and malformed evidence refs.
- The independent consumer review found and the current diff fixes two recovery hazards: stale 403 responses could have restored invalidated company state, and post-acceptance read denial could have been mislabeled as action denial. #811's typed denial maps to 403 in the exact extracted relay-to-host run and writes no business state or events.
- A final independent security review against #1049 head `495bfb6a` found no remaining concrete issue in the consumer recovery flow and independently passed its 24 focused API/controller checks. The latest #1049 SDK's 403 behavior is included in the 38-test latest-head consumer/browser run above.
- `node_modules/.bin/tsc -p packages/titan-platform/tsconfig.json --noEmit false --outDir packages/titan-platform/.test-dist --module NodeNext --moduleResolution NodeNext --isolatedModules false`: passed after a temporary local normalization of the two malformed trailing literal `\\n` sequences in the current-main `src/index.ts` and `tsconfig.json`; both original files were restored byte-for-byte and `.test-dist` was removed. The typecheck used locked `jose@6.1.3` unpacked under `/tmp` and an ignored local node_modules link because that exact version was absent from this workspace cache; the already-declared storage/tsx workspace links were also restored locally. No package/lock/compiler repair was made.
- Browser SDK bundle rebuilt from #1049 head `495bfb6a` using the locked workspace esbuild 0.27.3: `node_modules/.pnpm/esbuild@0.27.3/node_modules/esbuild/bin/esbuild packages/titan-platform/src/directadmin-plugin.ts --bundle --format=esm --platform=browser --target=es2022 --outfile=/tmp/1050-sdk-latest/upstream-1049-495bfb.mjs`.
- Package builder produces flat `titan_workforce.tar.gz`, SHA256 sidecar and verifies extracted modes/content/shared SDK validation/staging preflight. Extracted role entrypoints execute.
- On current merged main `14163faa`, `PATH=/tmp/1050-pnpm-bin:$PATH PNPM_HOME=/tmp/1050-pnpm-home XDG_DATA_HOME=/tmp/1050-xdg-data bash scripts/gate.sh --fast` and the full `bash scripts/gate.sh` both pass lint, then stop at the existing TASK-128 duplicate migration prefixes 151, 152 and 177–183 before RLS, typecheck, build, tests, integration or E2E. No migration files were changed.

The consumer validates the outer source/freshness/evidence contract and shows those fields under Health. The host's current `controls: []` is rendered as read-only. It does not inject its own caller/CSRF bootstrap. Company-switch, logout, real navigation with a late acknowledgement, full reload and BFCache handler tests clear receipts. Intent-route 403 revalidation restores current data only while the same action remains current and fresh session resolution succeeds; 401/revocation clears it. A 403 after accepted ingress keeps the view cleared and requires history inspection. The local SDK expiry test clears a populated receipt at/after `expires_at` without HTTP 401. The 19-file version 0.1.4 archive candidate and checksum are recorded in [WORKFORCE-PACKAGE-VERIFICATION.md](WORKFORCE-PACKAGE-VERIFICATION.md). No server install occurred.

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
