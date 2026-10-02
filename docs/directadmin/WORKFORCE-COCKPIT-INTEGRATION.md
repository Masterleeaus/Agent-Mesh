# Workforce cockpit continuation evidence — #1050

This is implementation evidence and a dependency handoff, not mission completion.
Canonical claim: `agent/issue-1050`; existing draft PR #1143. Old bounded payload
was accepted through #1145. History is retained without force-push or deletion.

## Sources inspected

- Current main `987728413bfdae855dba1a0796a686efb53e8805`, root/apps/packages AGENTS, ai/INVARIANTS,
  Blueprint v3, Canonical Rules, phase map and DirectAdmin development guide.
- #1050 current issue and claim comments, #1143 and accepted #1145.
- #1049 current draft PR #1204 head `12261fd020e41d5cc4580b4ccd3d8faf63d84cf4` and canonical #302 credential service.
- #811 draft PR #1201 exact head `aa4345c58a00078fa4065fee0224195639dcf8c6`, including the earlier `9bbe7a90` DirectAdmin gateway mount;
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

The browser calls the shared #1049 `DirectAdminCockpitSession`. The only direct SDK
changes add `titan_workforce` to existing plugin type/gateway/browser allowlists. No
identity, issuance, CSRF, authority or revalidation behavior is forked. The consumer
validates and presents the published #811 projection source, freshness and evidence
references. Lifecycle proposals remain gated by host-published controls and shared
intent ingress; an acknowledgement is never upgraded to a verified outcome.

The published #811 projection data schema `titan.workforce-cockpit.v1` contains
`discovery: {company_id, workers, controls: []}` and `status: {company_id, work}`.
Its owner reads canonical company-filtered Workforce/run records. The contract is
published on an open draft PR, not merged to main or live-certified. Controls are
explicitly empty and do not confer execution authority. Production never uses
fixture data or grants authority from a control descriptor.

## Concrete integration blockers

| Owner | Observed published behavior | Needed for functioning cockpit |
|---|---|---|
| #1049 / #1204 | Draft head `12261fd0` contains the shared DirectAdmin session/SDK bridge; it still needs a trusted commissioning bootstrap for the CSRF meta and a separately authenticated DirectAdmin-to-Workforce audience handoff. The plugin reads `meta[name="titan-directadmin-csrf"]`; it does not create a nonce or take caller identity from CGI, environment, query or form data. | #1049 must commission/prove that bootstrap and audience-bound current company/session. DirectAdmin credentials cannot be relabelled as the hosted Worker's fixed `audience=workforce,surface=zero`. Do not inject caller-supplied identity or CSRF values. |
| #811 / #1201 | Draft head `aa4345c5` publishes `services/workforce/src/directadmin-workforce-owners.ts` and a configured `/v1/directadmin/*` Fetch-handler mount. The owner reads company-filtered canonical `SqliteWorkforceStore` workers/work plus `SqliteRunStore.findByWork`. Outer projection is `{company_id,source,freshness,evidence_refs,data}`; `data` is `{schema:'titan.workforce-cockpit.v1',company_id,discovery,status}`. Worker records include `company_id,worker_id,kind,active,capabilities` and optional manager/team; work records include `company_id,work_id,state,context_refs,evidence_refs` and optional assignee/run. `status` has `{company_id,work}`. `discovery.controls` is explicitly `[]`. `requestIntent` validates/revalidates context, then throws `DirectAdminWorkforceActionDenied` with status 403; it writes no state/event/evidence and fabricates no receipt. The shared gateway currently redacts owner exceptions as generic HTTP 503 `directadmin-context-or-owner-unavailable`. | This changes the previous “no owner exists” blocker: the read-only projection contract is published on an open draft PR, not merged to main or live-certified. Its `/v1/directadmin/*` handler requires configured operator dependencies and pinned HTTPS `publicOrigin`; it forwards only an allowlist of cookie/origin/fetch/CSRF/content headers. #1050 consumes the exact projection and renders explicit read-only state; it must send no intent while controls are empty. The generic 503 remains fail-closed, but a surfaced action denial would look unavailable until #1049 maps the safe denial code to 403. No authority-capable lifecycle endpoint or successful receipt exists. |
| #1182 / #1188 | Conversation request/response preserves company/actor/device/session/context/conversation/operation/correlation/trace/idempotency and events | Shared gateway consumer integration; canonical conversation context and consequential requests through governance. Do not create a plugin-local conversation ledger. |
| #302 / #1183 | Current-session resolver is published | Cryptographically verified credentials and protected provisioning on commissioned infrastructure remain upstream. |
| #812 / #1211 | Relay implementation is now assigned on the existing PR #1211. It owns official DirectAdmin RAW plugin ingress and strict `headers_to_env` / `pipe_post` parsing into the canonical gateway; #1049 reviews transport security. The published host-side Fetch mount does not itself prove a DirectAdmin same-origin panel route, and there is no Apache `443` shortcut. | Await the exact public path/header contract before changing the consumer URL mapping. Preserve fail-closed nonce/bootstrap and never put a private token in a URL. Host CSP/Evolution and live verification remain outstanding. |
| #1084 / #1179 | Open draft PR #1179 is at head `444072f3` on base main `98772841`; its tree contains the shared parser repairs in `packages/titan-platform/src/index.ts` and `tsconfig.json`, including the convergence ancestry noted by the owner. Current main still has the malformed literal `\\n` terminators; these fixes are not merged. | Do not claim current main is repaired or import the broad draft convergence tree into #1050. The typecheck used a temporary exact-source normalization of those two files, then restored them byte-for-byte and removed `.test-dist`. Full gate worker lint debt remains upstream; no competing compiler/lock/Maps fixes here. |

Coordination requests are recorded on #1204 and #1201. The current bounded
request and candidate file path are recorded on #1201. They are real missing
upstream connections, not permission requests to recreate their owners.

## Verification

- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium TITAN_COCKPIT_SDK_MODULE=/tmp/1050-sdk/current-sdk.mjs node --test apps/directadmin/workforce/tests/*.test.mjs apps/directadmin/workforce/tests/sdk-contract.integration.mjs apps/directadmin/workforce/tests/hosted-sdk.integration.mjs`: 34 tests passed; package/SDK and HTTP-owner behavior use explicit fixtures.
- The real Chromium package test boots the extracted role entrypoint and actual bundled SDK against a controlled localhost host. Its body matches the #811 projection record fields but the server responses, context, cookie, session and CSRF nonce are test-only fixtures. It checks source/freshness display, an empty controls list causing explicit read-only rendering with no intent POST, company isolation, logout/denial, REQUESTED-only receipt display, a late response across actual page navigation, full reload, synthetic lifecycle events, and local expiry clearing a visible receipt without an HTTP 401. This is consumer acceptance, not a live #811 route or production-session certification.
- Hosted SDK integration now uses the actual #302 signed issuance service, registry, DirectAdmin session bridge and context switch cookie rotation. It asserts and forwards the exact SDK `X-Titan-CSRF` nonce. Only projection/intent owners remain explicit fixtures; no actual hosted endpoint is claimed. It tests company A to B isolation, duplicate in-flight intent suppression, cancellation ingress, revoked credential rejection and `COMPLETED` remaining unverified.
- `node --test apps/directadmin/workforce/tests/sdk-contract.integration.mjs`: 4 tests verify shared package/contribution acceptance, fail-closed executable roles without commissioned CSRF, and packaged UI lifecycle behavior in Chromium.
- `node --test packages/titan-platform/tests/directadmin-bridge.test.mjs packages/titan-platform/tests/directadmin-plugin.test.mjs packages/titan-platform/tests/security-boundary.test.mjs packages/titan-platform/tests/security-session-registry.test.mjs packages/titan-platform/tests/security-session-credentials.test.mjs`: 194 shared bridge/SDK/security tests passed.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/1050-playwright node --test packages/titan-platform/tests/directadmin-browser.browser.mjs`: 1 browser suite passed in system Chromium via a temporary Playwright executable path. The temporary browser path did not change system trust or server settings.
- Independent review verified malformed `run_id` coercion and CSRF header forwarding; it passed the focused controller/browser suite and independently reran the canonical hosted integration 1/1. Earlier fixes cover false VERIFIED fallback, stale refresh after revocation and malformed evidence refs.
- An independent security review of the exact #811 owner/mount found no new origin, identity or company-boundary defect. The owner’s typed 403 denial is currently normalized by the shared gateway to generic 503; this remains fail-closed but should be mapped to a safe denial response before controls are exposed.
- `node_modules/.bin/tsc -p packages/titan-platform/tsconfig.json --noEmit false --outDir packages/titan-platform/.test-dist --module NodeNext --moduleResolution NodeNext --isolatedModules false`: passed after a temporary local normalization of the two malformed trailing literal `\\n` sequences in the current-main `src/index.ts` and `tsconfig.json`; both original files were restored byte-for-byte and `.test-dist` was removed. The typecheck used locked `jose@6.1.3` unpacked under `/tmp` and an ignored local node_modules link because that exact version was absent from this workspace cache; the already-declared storage/tsx workspace links were also restored locally. No package/lock/compiler repair was made.
- Browser SDK bundle built using existing esbuild0.28.2: `node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/bin/esbuild packages/titan-platform/src/directadmin-plugin.ts --bundle --format=esm --platform=browser --target=es2022 --outfile=/tmp/1050-sdk/current-sdk.mjs`.
- Package builder produces flat `titan_workforce.tar.gz`, SHA256 sidecar and verifies extracted modes/content/shared SDK validation/staging preflight. Extracted role entrypoints execute.
- `pnpm gate:fast` and `pnpm gate`: both now pass worker and web lint, then fail the existing migration-prefix uniqueness check. Collisions are 151 (business pricing / field completion evidence), 152 (booking routing / field service acknowledgements), and 177–183 (existing workflow/outbox, login, visit, workforce skills, field templates, RLS and vehicle migrations). No applied migration was renumbered. Commands used temporary writable XDG paths and existing installed dependencies; no dependency policy or repository settings changed.

The consumer validates the outer source/freshness/evidence contract and shows those fields under Health. The host's current `controls: []` is rendered as read-only. It does not inject its own caller/CSRF bootstrap. Company-switch, logout, real navigation with a late acknowledgement, full reload and BFCache handler tests clear receipts; the local SDK expiry test clears a populated receipt at/after `expires_at` without HTTP 401. The 19-file version 0.1.3 archive candidate and checksum are recorded in [WORKFORCE-PACKAGE-VERIFICATION.md](WORKFORCE-PACKAGE-VERIFICATION.md). No server install occurred.

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
