# Workforce cockpit continuation evidence — #1050

This is implementation evidence and a dependency handoff, not mission completion.
Canonical claim: `agent/issue-1050`; existing draft PR #1143. Old bounded payload
was accepted through #1145. History is retained without force-push or deletion.

## Sources inspected

- Current main `3193441fa137b78d3f5cb7c1a84212af588599f5`, including merged #812 commit
  `89ff2427339a6f216281c970376be4634ee9fb9f`; the tested relay integration remains
  intentionally pinned to pre-change #812 head `8cae7034f6d2ec7c9063ac0c3aba40c6f41b3d89`, root/apps/packages AGENTS, ai/INVARIANTS,
  Blueprint v3, Canonical Rules, phase map and DirectAdmin development guide.
- #1050 current issue and claim comments, #1143 and accepted #1145.
- #1049 current draft PR #1204 head `2e41044b9760b8c3c85e34009f353c2f2876f7ce`; its merge from main only changes the root README after SDK implementation head `e428b67b34779e49f4dbc8d3e80b193e8737eb13`, which supplies the packaged/tested SDK source and contribution-version compatibility handling.
- #811 / PR #1201 merged at exact head `25005f4f4d860e2ec1dddb9f0a2c4aa152fd0488`, including the optional DirectAdmin gateway mount;
  #812 / PR #1211 integration pinned to `8cae7034f6d2ec7c9063ac0c3aba40c6f41b3d89`; current main includes #812 commit `89ff2427339a6f216281c970376be4634ee9fb9f` with experimental config-v2/Apache-cookie-boundary behavior, which is not adopted or verified here;
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

The #811 projection data schema `titan.workforce-cockpit.v1` merged to main at `14163faa`
and remains present in current main `3193441f`. The schema contains
`discovery: {company_id, workers, controls: []}` and `status: {company_id, work}`.
Its owner reads canonical company-filtered Workforce/run records. The contract is
merged to main, but is not live-certified. Controls are explicitly
empty and do not confer execution authority. Production never uses fixture data
or grants authority from a control descriptor.

## Concrete integration blockers

| Owner | Observed published behavior | Needed for functioning cockpit |
|---|---|---|
| #1049 / #1204 | Current PR head `2e41044b` merges main into SDK implementation head `e428b67b`; the intervening merge only changes root README, so the tested/package SDK source remains `e428b67b`. It consumes the canonical #302 session issuer/registry, publishes trusted browser session context and a separate server-only Workforce/Zero exchange. The browser SDK hashes the opaque context revision to the relay's bounded `ctx1_` assertion; the gateway checks it against current #302 state. Typed unsupported Workforce actions map to a sanitized 403. The SDK preserves valid sibling session state on 403 and invalidates on authentication/context failure; bridge failures distinguish rejected request/session from owner outages. The host contribution registry supports SDK compatibility `1.0.0` and degrades an incompatible major independently. The plugin reads trusted host CSRF metadata and never creates identity/CSRF from CGI, environment, query or form data. | Workforce tags a 403 only when the shared SDK's governed-intent route rejects, then revalidates before restoring data. A stale response cannot recover a cleared company view. A 403 during post-acceptance projection refresh clears the view and tells the operator to inspect canonical history. Submit stays disabled after a denial until manual refresh. Production issuer/identity provisioning, trusted DirectAdmin HTML CSRF bootstrap, source credential verification and host/cookie-port commissioning remain unverified. |
| #811 / #1201 | Merged to main at `14163faa` from reviewed head `25005f4f`; current main `9dcd75dd` adds only later README/image commits and still contains `services/workforce/src/directadmin-workforce-owners.ts` plus the optional `/v1/directadmin/*` Fetch-handler mount. The owner reads company-filtered canonical `SqliteWorkforceStore` workers/work plus `SqliteRunStore.findByWork`. Outer projection is `{company_id,source,freshness,evidence_refs,data}`; `data` is `{schema:'titan.workforce-cockpit.v1',company_id,discovery,status}`. Worker/work records are company-bound; `discovery.controls` is explicitly `[]`. `requestIntent` validates/revalidates context then denies with a typed 403; it writes no state/event/evidence and fabricates no receipt. | The implementation is in main, but not live-certified. Its Fetch handler needs configured operator dependencies and pinned HTTPS `publicOrigin`. The latest exact extracted host run against #812 `8cae7034` and #1049 SDK source `e428b67b` passed `ctx1_` validation and mapped typed denial to a safe 403 with no writes. The consumer revalidates after an intent-route 403; a denied refresh after accepted ingress is never called an action denial. The host exposes no authorized lifecycle control or successful action receipt, so the cockpit honestly renders read-only. |
| #1182 / #1188 | Conversation request/response preserves company/actor/device/session/context/conversation/operation/correlation/trace/idempotency and events | Shared gateway consumer integration; canonical conversation context and consequential requests through governance. Do not create a plugin-local conversation ledger. |
| #302 / #1183 | Current-session resolver is published | Cryptographically verified credentials and protected provisioning on commissioned infrastructure remain upstream. |
| #812 / #1211 | The recorded tested head `8cae7034` publishes the RAW endpoint `/CMD_PLUGINS/titan-server-node/directadmin-gateway.raw` and fetch adapter `/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs`. #1050 imports that helper; no parser/proxy is duplicated. Current main includes #812 commit `89ff2427`, with experimental config-v2 and an Apache `:443` cookie-boundary marker/template; this integration intentionally remains pinned to `8cae7034` and does not consume or attest the new marker. | Independent review of the new contract and testing on a real disposable Apache/DirectAdmin host are required before adoption. The marker is deployment intent, not proof that Apache strips cookies. Exact CGI `HEADERS`, port-2222 session/cookie isolation, protected relay config, actual host and #811 operator dependencies remain uncommissioned. Use same-host loopback or privately authenticated HTTPS; never place credentials in URLs or assume a `:443` rule affects DirectAdmin `:2222`. |
| #648 / current reproducibility | Current main `3193441fa137b78d3f5cb7c1a84212af588599f5` includes #1201, #812 and current shared package/portfolio changes. | `gate:fast` and full `gate` results recorded below were run on code baseline `14163faa316ac6236e88167b7c8d8a5e95007c7e`, before this main advance. The known TASK-128 duplicate migration prefixes 151, 152 and 177–183 belong to #648's convergence scope; verify them on current main before using that as a current gate result. #1084 / #1179 owns shared web/index/CI repairs, not migration ownership. No migrations were renumbered here. |

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
- Current extracted relay-to-host integration passed against #811 code merged at main baseline `14163faa316ac6236e88167b7c8d8a5e95007c7e`, #812 tested head `8cae7034f6d2ec7c9063ac0c3aba40c6f41b3d89`, and #1049 SDK source `e428b67b34779e49f4dbc8d3e80b193e8737eb13`. It covered missing-config 503, company-filtered read/evidence, read-only controls, isolated invalid-CSRF 401/cookie clearing, typed action 403/preserved valid session, company switch, and upstream expiry. No work/event writes occurred; 14 RAW requests and 15 hosted routes were observed. The signed identity/nonce and injected HTML meta are disposable fixtures, not production commissioning. This run predates #812's current `89ff2427` config-v2/Apache-cookie-boundary change; it proves nothing about that configuration or real Apache cookie isolation.
- Exact runtime recovery for the composed host test: official Node v22.23.3 tarball SHA256 `df450af89261115ef9f9e3830c3eeb2cc9213b63c720b1af623cb5dcbe2e02de`; official `better-sqlite3@12.11.1` Node ABI 127 prebuild installed with `prebuild-install@7.1.3`; targeted `npm rebuild` succeeded using the existing prebuild under Node 22/npm 10.9.9. No node-gyp compilation, PNPM security setting or repository dependency was changed.
- Independent security review at #1049 head `6289e084` found no concrete consumer recovery regression and passed 28/28 focused tests. That review preceded the later SDK compatibility-major addition in `e428b67b`; the exact e428 source's 112 focused tests and the consumer/relay suites pass as recorded here.
- On code baseline main `14163faa`, `PATH=/tmp/1050-pnpm-bin:$PATH PNPM_HOME=/tmp/1050-pnpm-home XDG_DATA_HOME=/tmp/1050-xdg-data bash scripts/gate.sh --fast` and full `bash scripts/gate.sh` passed lint then stopped at the recorded TASK-128 duplicate migration prefixes 151, 152 and 177–183. Current main advanced to `3193441f` with #812, distribution-gateway and DirectAdmin portfolio changes after that run; the historical gate has not been rerun on current main. Migration convergence remains with #648; #1084/#1179 owns shared web/index/CI repairs. No migrations were changed here.

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
