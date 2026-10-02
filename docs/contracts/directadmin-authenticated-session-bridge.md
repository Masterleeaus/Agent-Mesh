# DirectAdmin authenticated session bridge — #1049

Status: the DirectAdmin browser bridge and three SDK consumers pass focused local tests; the newly published #302 Workforce/Zero exchange is **not yet consumed through the hosted HTTP path**, and no DirectAdmin host is commissioned. PR #1204 remains draft/non-closing. #302 / open draft PR #1183 is currently at `9bfc15f69613493761b4ae53a484004957c14dec`; it has not merged to `main`. This SDK does not copy or reimplement its identity/credential logic.

The latest security review correction is addressed: the bridge now requires the verified canonical `provider` to equal `directAdminIssuer(config.origin)` before projection, retained revalidation, and post-switch use. Adversarial tests reject both a valid credential issued in another DirectAdmin host namespace and a valid credential presented to a bridge configured for another host. This is a host/service wiring defense; no live exploit was reported.

## Canonical owner and API

`packages/titan-platform/src/directadmin-session-bridge.ts` imports only the canonical credential API types and the host-issuer helper from `security-boundary.ts`. The earlier hand-written `titan-da-session+jwt` verifier has been removed. There are no SDK signing keys, signature parsers, credential issuers, identity stores or registry provisioning methods. Browser requests use only #302's `titan-session+jwt` credentials; upstream login assertions, the provisional token type and legacy credentials are rejected.

The trusted host supplies:

```ts
const bridge = new DirectAdminSessionBridge({
  origin: 'https://panel.example:2222',
  audience: 'titan-directadmin:node-1',
  node_id: 'node-1',
  sessions, // canonical createSessionCredentialService(config), commissioned separately
});
const handle = createDirectAdminGateway(bridge, owners);
```

`bridge.authenticate(request)` returns selected-company `context`, `revalidate()`, `switchCompany(company_id)` and `logout()`. It calls `sessions.authenticate(cookie)` and validates the canonical result's audience and signed DirectAdmin node/CSRF binding. Retained revalidation calls `sessions.authenticate(cookie, expected)` again with the original company/device/actor/context revision. Switch and logout call the canonical `switchCompany` and `revoke` methods, never raw registry mutation.

#302 owns verification of issuer/provider, subject, session/device/revision, exact audience, expiry and current actor/company/membership/external binding. It also owns durable one-time login assertion exchange and signed DirectAdmin node/role/CSRF metadata. See [Authenticated session credentials](authenticated-session-credentials.md) for the sole credential format and key policy. DA role is descriptive presentation context, not Titan authority. No fixture identity or automatic membership backfill is a production prerequisite substitute.

The bridge projects `company_ids: [current.company_id]` only. Canonical `allowed_company_ids` are switch choices and never become operation scope. No Frappe/provider mapping is required for native Titan FSM. The deprecated `resolveDirectAdminTitanContext` remains presentation compatibility only, and also exposes selected-company-only scope.

## Browser/session protections

The commissioned issuer must deliver the canonical credential using `__Host-titan-da-session` with **Secure; HttpOnly; SameSite=Strict; Path=/** and no Domain. Its separately authenticated bootstrap supplies the CSRF nonce to `DirectAdminCockpitSession`; credentials never belong in JavaScript, browser storage, URLs or diagnostics. #302 signs the nonce's SHA-256 binding. No real keys or credentials are created by this SDK.

Every gateway request requires the cookie, `X-Titan-CSRF`, `Sec-Fetch-Site: same-origin`, and the configured HTTPS request origin. POST requires exact Origin. GET may use an exact same-origin Referer when Origin is absent. The SDK hashes the nonce and compares it to the **verified** canonical binding. Missing/invalid browser metadata fails closed. No Host/forwarded/company/caller header changes identity or the configured node/audience.

API responses are no-store JSON with nosniff, no-referrer, same-origin framing and restrictive CSP. HTML entrypoints must independently apply their corresponding Evolution-compatible headers; API headers do not protect a parent HTML document. Bodies are limited to 64 KiB/five seconds; at most 32 concurrent requests are admitted. Browser fetches time out at ten seconds. The launched host still owns total request/header deadlines, connection limits and rate limiting.

POST `/v1/directadmin/company` verifies the old credential and calls canonical switching, which atomically increments the persisted revision. The bridge verifies the returned replacement through the canonical service, then gives the gateway a server-only Set-Cookie value with Secure/HttpOnly/Strict/Path=/ and a lifetime bounded by the unchanged canonical expiry. JSON contains only `context-changed`. All plugins stay cleared until they refresh under the new credential; old credentials fail. The SDK neither mints a replacement nor exposes one in JSON or JavaScript. Failed post-switch delivery remains fail-closed and requires fresh upstream authentication; it never rolls back a revision. Logout revokes the durable session then clears the cookie. Signing-disabled canonical service configurations can read but fail closed on switching.

Every mounted consumer shares one `DirectAdminCockpitSession`. Switch/logout invalidate immediately, even on failure; expiry clears context; in-flight completions cannot repopulate it. An origin-local BroadcastChannel propagates invalidation only, never company/authority values. A projection cannot silently select a different company or restore an intent context. Default fetch wrappers preserve native browser invocation semantics.

The browser uses the canonical **persisted session** expiry supplied by #302. Each server call additionally re-verifies credential expiry. If #302 supports a credential expiring earlier than its persisted session, it should expose verified credential expiry so the UI can retire context at that earlier instant without decoding credentials. The current bridge does not decode a token to infer this value.

## Gateway and execution ownership

`directadmin-gateway.ts` is a Fetch Request/Response handler, not a listener, CLI or deployment. The launched #811/#812 composition supplies canonical projection owners and governed-intent ingress. The adapter revalidates before and after reads and checks both the projection envelope and nested canonical data company. Source/freshness/evidence metadata must be structurally valid; one unavailable plugin degrades locally.

`requestIntent` receives a revalidation function and a server-only `withWorkforceZeroSession` capability. For a Workforce intent, the SDK revalidates the DirectAdmin cookie, invokes the fixed #302 exchange with the canonical selected context, checks child audience/company/actor/device and source-capped expiry, then supplies the opaque child bearer only inside the trusted owner callback. The gateway accepts only a bounded receipt ID and never serializes the child token. This callback is not a durable queue credential. The downstream owner must revalidate at authorization/effect boundaries and preserve the source proof for queued work. The SDK neither grants effective authority nor executes providers; 202 means `REQUESTED`, not authorized or verified. Canonical execution remains responsible for idempotency, replay protection and accepted evidence.

At current #302 / #1183 head `9bfc15f69613493761b4ae53a484004957c14dec`, the canonical credential service offers `exchangeWorkforceZero(verifiedDaCredential, optionalExpectation)`. It fixes target audience/surface to `workforce`/`zero`; the signed child binds its DirectAdmin source issuer, provider/subject, session and context revisions, actor/company/device, source expiry, configured node and CSRF hash. A deterministic child is reused on retry, can only have its expiry tightened, and cannot be recreated after revocation. The new `withCurrentSessionFence` rechecks child and source under the registry writer lock before its bounded effect callback. The owner reports 137/137 identity/session tests on Node 22 with its production `@titan-zero/storage` / `better-sqlite3` wrapper and separate child-process SQLite connections; exact-head GitHub validation is still pending ([evidence comment](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1183#issuecomment-5945589876)).

The published #811 / #1201 head `aa4345c58a00078fa4065fee0224195639dcf8c6` is not yet a compatible consumer of that child. Its `createWorkforceSessionCredentialVerifier` currently drops `source_session` and `credential_expires_at` returned by canonical authentication, then `hosted-runtime.ts` rebuilds a smaller proof without them before `resolveCurrentSession` and durable run revalidation. The derived child therefore cannot complete current-session resolution through the hosted conversation verifier, and the current runtime does not consume the new effect-fence API. I posted a targeted consumer-only request on PR #1201 comment [#5945586745](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1201#issuecomment-5945586745). No #811 server/bootstrap files were edited here.

The existing file-backed `directadmin-workforce-handoff.test.mjs` is historical evidence for the pre-exchange boundary only: it confirms a DirectAdmin-audience credential is rejected by a Workforce verifier and that a separate Workforce login is not linked to the DA session. It is not evidence that the new exchange works through #811 HTTP. Do not treat #302 source tests or the API handoff as that acceptance.

The SDK exchange is now exercised with the real #302 service and registry behind its Fetch gateway: the test verifies the Workforce child, proves caller/company headers cannot change its selected company, ensures bearer/CSRF material is absent from the response, and confirms a source-company switch invalidates the child. This is still not a composed #811 HTTP conversation or effect-fence acceptance. #811/#812 plus the conversation-transport owner must preserve the verified child proof through `POST /v1/workforce/conversations` and revalidate it at the effect fence. The remaining adversarial HTTP test must cover source switch/revocation before effect admission, duplicate requests, cancellation, and UNCERTAIN timeout behavior with disposable SQLite state. DirectAdmin credential issuance, registry commissioning, final CI/smoke, and real-host browser/OS commissioning remain separate prerequisites.

## Actual consumers and routes

`apps/directadmin/{zero-core,operations-hub,brand-studio}/cockpit.mjs` execute the same SDK renderer and session, using canonical `titan.zero-cockpit.v1`, `titan.operations-health.v1` and `titan.brand-publication.v1` projections. They render source/freshness/evidence using textContent, expose keyboard-operable Refresh and a live status region, and share explicit loading/ready/read-only/unavailable/incompatible/stale/unknown states. Unknown or more-than-five-minute-old freshness is visibly read-only, without presenting a fresh business summary. These modules remain sources for owning plugin bundlers/entrypoints, not certified installed DirectAdmin packages.

Routes:

- GET `/v1/directadmin/context`
- GET `/v1/directadmin/{titan_zero,titan_operations,titan_web}/projection`
- POST `/v1/directadmin/{titan_zero,titan_operations,titan_web}/intents`
- POST `/v1/directadmin/company` with `{ "company_id": "..." }`
- POST `/v1/directadmin/logout`

## Latest continuation verification

After current `main` advanced to `987728413bfdae855dba1a0796a686efb53e8805`, the focused bridge and handoff tests were run directly from TypeScript sources:

```sh
node --test packages/titan-platform/tests/directadmin-bridge.test.mjs packages/titan-platform/tests/directadmin-workforce-handoff.test.mjs
```

Result: **64/64 pass**. This includes the two cross-host issuer regressions, CSRF/origin/session and revocation tests, three real consumers through disposable HTTP, and a file-backed temporary SQLite/real-Ed25519-key test proving the Workforce verifier rejects a DirectAdmin-audience credential. The separately issued Workforce session is independent: it has another session ID and remains on company A after the DirectAdmin session switches to B. That is deliberately not represented as an exchange or combined Workforce HTTP effect-fence test.

The changed bridge and its imported source typecheck with:

```sh
node_modules/.bin/tsc --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext --lib ES2022,DOM packages/titan-platform/src/directadmin-session-bridge.ts
```

`git diff --check` passes. The package project typecheck is currently blocked by inherited malformed literal `\\n` text in `packages/titan-platform/src/index.ts` and `packages/titan-platform/tsconfig.json` from current main/#1225: `tsc -p packages/titan-platform/tsconfig.json --noEmit` reports TS1127/TS1005 and TS5092. This shared Nexus/export/config defect is owned by #1084; this branch leaves those files untouched. On exact head `e131eb44bc389d6f22468b31f4ef247df44e3b2f`, [Production Convergence](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36957374651), [Canonical Workforce](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36957374515), [Source Evidence Index](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36957374622) and [Browser Node CI](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36957374659) pass. [Titan Zero CI](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36957374577) and [Personal Zero](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36957374588) fail at that same platform typecheck with TS1127/TS1005/TS5092; subsequent checks are skipped. The #1084 owner was notified with exact diagnostics and run links. No fresh local workspace-wide build/gate or Chromium test was run on the merged head.

## Earlier integration evidence

The cumulative package/browser evidence below was executed on the prior published head `9fbcdc5720e7287da0e3e57c7f77da8c8c1680dd`. It remains historical evidence for those features, not a claim that the malformed current package config passes on the latest merged head.

```sh
node_modules/.bin/tsc -p packages/titan-platform/tsconfig.json --noEmit
node_modules/.bin/tsc -p packages/titan-platform/tsconfig.json --noEmit false --outDir packages/titan-platform/.test-dist --module NodeNext --moduleResolution NodeNext --isolatedModules false
node --test packages/titan-platform/tests/directadmin-bridge.test.mjs packages/titan-platform/tests/directadmin-plugin.test.mjs packages/titan-platform/tests/security-boundary.test.mjs packages/titan-platform/tests/security-session-registry.test.mjs packages/titan-platform/tests/security-session-credentials.test.mjs scripts/package-directadmin-plugin.test.mjs scripts/validate-directadmin-plugin.test.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/titan-playwright-browsers node --test packages/titan-platform/tests/directadmin-browser.browser.mjs
```

198 Node tests pass: 61 bridge/consumer cases, 12 SDK cases, 61 canonical security/session cases, 60 canonical credential cases, and 4 package cases. Fixtures use ephemeral keys, actual canonical issuance and SQLite. The three real consumer modules run through a disposable HTTP gateway in Node integration tests.

One additional Chromium integration test passes over disposable loopback HTTPS. It exercises all three consumers, actual browser Origin/Fetch Metadata/CSRF headers, HttpOnly/Strict cookie handling, keyboard refresh, text-only injection-safe rendering, incompatible versions, cross-tab company invalidation, secure cookie rotation, reconnect to company B and logout cookie deletion. Its temporary self-signed key/certificate and isolated browser trust exception exist only for the fixture; cleanup removes them. No system trust setting or user server was changed. This is real-browser SDK evidence, not DirectAdmin Evolution host certification.

The initial independent review found a microtask invalidation race; fixed and all four regression variants pass. Follow-up probes verified redacted exceptions, concurrency recovery and stalled-body cancellation. A fresh independent review of canonical delegation found the switch-delivery gap; it was fixed by delivering the canonical replacement only as an HttpOnly cookie. The reviewer reran the focused bridge/typecheck and Chromium switch/reconnect/logout checks successfully and found no remaining API mismatch. Required PR review remains independent of local test evidence.

On published head `51b22e92569b2d76ce97078fe3975ce7be091590`, corrected template/linkage passed Claim Gate run `36952805244`. Workforce, Production Convergence, Personal Zero, Browser Node and Source Evidence passed. General CI failed the worker regression gate (35 failures vs baseline 24); VPS smoke failed compose `TZ_ENV_FILE` handling. Shared worker/VPS fixes later inherited from their owners are not independent SDK edits. #302/#1183 remains open draft and must be coordinated before merging this dependent slice.

Local `pnpm gate:fast` / `pnpm gate` were attempted and retried with writable XDG/store paths. They remain blocked before execution by `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` for locked `resend@6.32.0` (published `2026-10-01T20:28:20Z`). No safety policy, baseline or lockfile repair was invented by the SDK. Direct compilation/Node/Chromium commands above ran. Repository-wide lint/build/integration/E2E are not claimed passed.

## Residual commissioning and rollback

Still required: real DA authentication and trusted #302 issuer configuration; approved stable membership/device mapping; OS and secured browser access; production reverse proxy and HTML headers; installed role entrypoint packaging/migration; launched #811/#812 routes; commissioned audience/surface handoff; downstream authorization/effect and durable queue recovery; real Evolution coexistence/theme/accessibility; live install/upgrade/rollback and the remaining broad #1049 criteria. PHP is absent. No real credential provisioning, TLS/security changes, deployment or merge was performed or implied.

Rollback withdraws the SDK gateway/consumer modules. It adds no SDK persistence migration or credential store. Retain separately owned #302 registry data and revocations; never restore weaker legacy fallback or revert shared prerequisite repairs as SDK rollback.
