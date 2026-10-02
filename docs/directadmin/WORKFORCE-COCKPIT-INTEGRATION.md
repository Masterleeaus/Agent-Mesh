# Workforce cockpit continuation evidence — #1050

This is implementation evidence and a dependency handoff, not mission completion.
Canonical claim: `agent/issue-1050`; existing draft PR #1143. Old bounded payload
was accepted through #1145. History is retained without force-push or deletion.

## Sources inspected

- Current main45bcd75c, then8a889c10, root/apps/packages AGENTS, ai/INVARIANTS,
  Blueprint v3, Canonical Rules, phase map and DirectAdmin development guide.
- #1050 current issue and claim comments, #1143 and accepted #1145.
- #1049 published SDK42233a2110e1caa387ccaefcd1f0136791760c5c.
- #811 published host99cd1bf86fa75c4c0a4e2ec45b39e9baccbe16fd;
  #1182 conversation transport; shared identity owner #302.
- #1179 prerequisitead43d010d50ba262c02beaf0ed892b656174ff58 merged with provenance.
- No repository `.agents/skills` directory exists; executor `.agents` is empty.

## What this continuation implements

`apps/directadmin/workforce` owns an executable Node shell for all DA roles,
company-bound ephemeral consumer state, roster/hierarchy/work/control/receipt/
evidence/health presentation, explicit unavailable states, native-theme fallbacks,
fixed Operations deep links, SDK-compatible summary shape and real archive/
staging install/update/uninstall contracts. It introduces no business store,
identity/auth resolver, authority engine, agent runtime or provider execution.

The `WorkforceController` transport methods and the temporary browser factory
probe are **private consumer test seams, not a published API or completed SDK
integration**. Production remains fail-closed with the currently published SDK.
The real #1049 bridge must replace this probe using its actual exported contract.
Do not install a fixture or claim that an injected method proves integration.

## Concrete integration blockers

| Owner | Observed published behavior | Needed for functioning cockpit |
|---|---|---|
| #1049 / #1204 | `DirectAdminTitanApiClient`, injected context resolver and contribution/package contracts; no browser session bridge at42233a21 | Concrete current-context bootstrap, session-bound/CSRF-protected same-origin transport, revalidation and company-switch invalidation. Browser must never carry upstream provider credentials. |
| #811 / #1201 | At99cd1bf8, `server.ts` routes only POST `/v1/workforce/conversations`, GET `/health`, GET `/ready` | Authenticated canonical roster/discover and work/run/evidence status projections; bounded governed lifecycle controls with operation/idempotency/correlation and receipts. Reuse `SqliteWorkforceStore.listWorkers/list` and canonical runtime/governance owners server-side; no surface DB reads. |
| #1182 / #1188 | Conversation request/response preserves company/actor/device/session/context/conversation/operation/correlation/trace/idempotency and events | Shared gateway consumer integration; canonical conversation context and consequential requests through governance. Do not create a plugin-local conversation ledger. |
| #302 / #1183 | Current-session resolver is published | Cryptographically verified credentials and protected provisioning on commissioned infrastructure remain upstream. |
| #812 / #1211 | Server Node runtime hardening separately owned | Commissioned lifecycle/gateway installation, host CSP/Evolution and approved live verification. |
| #1084 / #1179 | Shared build repair prerequisite imported | Full gate worker lint debt remains upstream; no competing compiler/lock/Maps fixes here. |

Coordination requests are recorded on #1204 and #1201. They are real missing
upstream connections, not permission requests to recreate their owners.

## Verification

- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node --test apps/directadmin/workforce/tests/*.test.mjs`: 17 tests.
- `TITAN_COCKPIT_SDK_MODULE=/tmp/1050-sdk/sdk.mjs PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node --test apps/directadmin/workforce/tests/sdk-contract.integration.mjs`: 3 tests against compiled canonical SDK42233a21. Proves shared package/contribution acceptance and fail-closed real entrypoints when its browser bridge is missing; **does not prove hosted integration**.
- `node_modules/.bin/tsc -p packages/titan-platform/tsconfig.json --noEmit`: passed after merging main8a889c10.
- Package builder produces flat `titan_workforce.tar.gz`, SHA256 sidecar and verifies extracted modes/content/staging preflight. Extracted user entrypoint executes.
- `pnpm gate:fast` and `pnpm gate`: fail at existing worker lint: booking-confirmed:113, client-reactivation:102, estimate-followup:96, invoice-followup:65, review-request:71 (`no-unused-expressions`). Initially pnpm could not create its home store; retry used `XDG_DATA_HOME=/tmp/1050-pnpm-data XDG_CACHE_HOME=/tmp/1050-pnpm-cache pnpm_config_manage_package_manager_versions=false pnpm_config_verify_deps_before_run=false`. No repository dependency/settings mutation.
- Independent security review reproduced false VERIFIED fallback and stale refresh following revocation. Both fixed; regression coverage added. Real owner integration still requires another review.

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
