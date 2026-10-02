# Workforce cockpit continuation evidence — #1050

This is implementation evidence and a dependency handoff, not mission completion.
Canonical claim: `agent/issue-1050`; existing draft PR #1143. Old bounded payload
was accepted through #1145. History is retained without force-push or deletion.

## Sources inspected

- Current main 05298dc8, then 45bcd75c and 8a889c10, root/apps/packages AGENTS, ai/INVARIANTS,
  Blueprint v3, Canonical Rules, phase map and DirectAdmin development guide.
- #1050 current issue and claim comments, #1143 and accepted #1145.
- #1049 current published SDK PR head 9fbcdc5720e7287da0e3e57c7f77da8c8c1680dd and merged canonical #302 credential service; both merged with provenance.
- #811 published host PR head 26be7b4a278dcfa27ea91af91a23a25f86802d0a;
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

The browser now calls the actual current #1049 `DirectAdminCockpitSession`, replacing the
temporary factory. The only direct SDK changes add `titan_workforce` to the existing
plugin type/gateway/browser allowlists. No identity, issuance, CSRF, authority or
revalidation behavior is forked. The consumer sends capability/operation/correlation
plus bounded control input to the shared intent ingress, which returns REQUESTED.

The proposed projection data schema `titan.workforce-cockpit.v1` contains
`discovery: {company_id, workers, controls: [{action, capability_id}]}` and
`status: {company_id, work}`. These consumer expectations are **not a claim that
the canonical host already implements this API**. Owner confirmation/composition
is requested on #1201. It remains unavailable without the actual owner. Production
never uses fixture data or grants authority from a control descriptor.

## Concrete integration blockers

| Owner | Observed published behavior | Needed for functioning cockpit |
|---|---|---|
| #1049 / #1204 | Current 9fbcdc57 bridge delegates to canonical #302 issuer and session service; browser context/projection/intent routes and SDK plugin type/allowlists still accept `titan_zero`, `titan_operations`, `titan_web` only. #1050 adds the same bounded allowlist registration for `titan_workforce`. | Commissioned issuer/CSRF HTML bootstrap and launched gateway owners; provide a separately authenticated Workforce audience handoff. DirectAdmin credentials cannot be relabelled as the hosted Worker's fixed `audience=workforce,surface=zero`. Browser never carries upstream credentials. |
| #811 / #1201 | At26be7b4a, `server.ts` still routes only POST `/v1/workforce/conversations`, GET `/health`, GET `/ready`. No DirectAdmin projection/intent owners are mounted. | SDK request paths are GET `/v1/directadmin/titan_workforce/projection` and POST `/v1/directadmin/titan_workforce/intents`. Gateway requires outer projection `{company_id,source,freshness,evidence_refs,data}` and `data.company_id` plus `data.schema`; governed receipt is `{status:'REQUESTED',receipt_id,correlation_id}`. #1050 proposes new isolated `services/workforce/src/directadmin-workforce-owners.ts` as the #811-owned adapter for canonical workforce/run projections and governed ingress, composed only by the #811 owner after contract review. The proposal is not implemented or treated as an endpoint. No surface DB reads. |
| #1182 / #1188 | Conversation request/response preserves company/actor/device/session/context/conversation/operation/correlation/trace/idempotency and events | Shared gateway consumer integration; canonical conversation context and consequential requests through governance. Do not create a plugin-local conversation ledger. |
| #302 / #1183 | Current-session resolver is published | Cryptographically verified credentials and protected provisioning on commissioned infrastructure remain upstream. |
| #812 / #1211 | Server Node runtime hardening separately owned | Commissioned lifecycle/gateway installation, host CSP/Evolution and approved live verification. |
| #1084 / #1179 | Shared build repair prerequisite imported | Full gate worker lint debt remains upstream; no competing compiler/lock/Maps fixes here. |

Coordination requests are recorded on #1204 and #1201. The current bounded
request and candidate file path are recorded on #1201. They are real missing
upstream connections, not permission requests to recreate their owners.

## Verification

- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium TITAN_COCKPIT_SDK_MODULE=/tmp/1050-sdk/current-sdk.mjs node --test apps/directadmin/workforce/tests/*.test.mjs apps/directadmin/workforce/tests/sdk-contract.integration.mjs apps/directadmin/workforce/tests/hosted-sdk.integration.mjs`: 32 tests passed against SDK 9fbcdc57 and canonical #302 issuance.
- The real Chromium package test boots the extracted role entrypoint and actual bundled SDK against a controlled localhost host. It proves unavailable-owner and expired-session responses clear state; rapid repeated cancel submission reaches the host once and stays `REQUESTED`; the receipt appears in Evidence and clears with company switching, pagehide/BFCache reconnect, full reload and shared SDK logout; and the SDK's local `expires_at` timer clears the real cockpit. The HTTP owner, context, cookie and nonce are test-only fixtures, so this is consumer acceptance, not hosted-route or production-session certification.
- Hosted SDK integration now uses the actual #302 signed issuance service, registry, DirectAdmin session bridge and context switch cookie rotation. It asserts and forwards the exact SDK `X-Titan-CSRF` nonce. Only projection/intent owners remain explicit fixtures; no actual hosted endpoint is claimed. It tests company A to B isolation, duplicate in-flight intent suppression, cancellation ingress, revoked credential rejection and `COMPLETED` remaining unverified.
- `node --test apps/directadmin/workforce/tests/sdk-contract.integration.mjs`: 4 tests verify shared package/contribution acceptance, fail-closed executable roles without commissioned CSRF, and packaged UI lifecycle behavior in Chromium.
- `node --test packages/titan-platform/tests/directadmin-bridge.test.mjs packages/titan-platform/tests/directadmin-plugin.test.mjs packages/titan-platform/tests/security-boundary.test.mjs packages/titan-platform/tests/security-session-registry.test.mjs packages/titan-platform/tests/security-session-credentials.test.mjs`: 194 shared bridge/SDK/security tests passed.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/1050-playwright node --test packages/titan-platform/tests/directadmin-browser.browser.mjs`: 1 browser suite passed in system Chromium via a temporary Playwright executable path. The temporary browser path did not change system trust or server settings.
- Independent review verified malformed `run_id` coercion and CSRF header forwarding; it passed the focused controller/browser suite and independently reran the canonical hosted integration 1/1. Earlier fixes cover false VERIFIED fallback, stale refresh after revocation and malformed evidence refs.
- `node_modules/.bin/tsc -p packages/titan-platform/tsconfig.json --noEmit false --outDir packages/titan-platform/.test-dist --module NodeNext --moduleResolution NodeNext --isolatedModules false`: passed. The typecheck used locked `jose@6.1.3` unpacked under `/tmp` and an ignored local node_modules link because that exact version was absent from this workspace cache; the already-declared storage/tsx workspace links were also restored locally. No package/lock/compiler repair was made.
- Browser SDK bundle built using existing esbuild0.28.2: `node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/bin/esbuild packages/titan-platform/src/directadmin-plugin.ts --bundle --format=esm --platform=browser --target=es2022 --outfile=/tmp/1050-sdk/current-sdk.mjs`.
- Package builder produces flat `titan_workforce.tar.gz`, SHA256 sidecar and verifies extracted modes/content/shared SDK validation/staging preflight. Extracted role entrypoints execute.
- `pnpm gate:fast` and `pnpm gate`: both now pass worker and web lint, then fail the existing migration-prefix uniqueness check. Collisions are 151 (business pricing / field completion evidence), 152 (booking routing / field service acknowledgements), and 177–183 (existing workflow/outbox, login, visit, workforce skills, field templates, RLS and vehicle migrations). No applied migration was renumbered. Commands used temporary writable XDG paths and existing installed dependencies; no dependency policy or repository settings changed.

Follow-up continuation also rejects malformed optional capability/control/context/evidence collections before any view renders, clears prior receipts on malformed post-submit refresh, and verifies company-switch/pagehide/BFCache reconnect behavior in Chromium. The unchanged 19-file version 0.1.2 archive candidate has SHA256 `b702ce34e083e458c9d2cf231ebc47d5389d8ed63cace919a56d71469ca44ecd`. The independent local staging checklist passed checksum, extraction, install/update preflight and state-preserving uninstall. Reproduction steps are in [WORKFORCE-PACKAGE-VERIFICATION.md](WORKFORCE-PACKAGE-VERIFICATION.md).

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
