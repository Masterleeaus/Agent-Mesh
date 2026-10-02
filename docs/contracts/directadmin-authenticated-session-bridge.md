# DirectAdmin authenticated session bridge — #1049

Status: PR #1204 remains an open draft and #1049 remains partial/non-closing. The current local branch head is `0c449dfc2601256af8e2033a508b01ceb3201df7`, based on merged main `df52782d26e0387608351b254c785911f99a20e9` (#1179). The SDK now exercises the real canonical #302 DirectAdmin-to-Workforce/Zero exchange, but the current #811 host does not yet preserve the source proof through hosted revalidation or effect admission. No DirectAdmin host is commissioned.

## Canonical identity and browser boundary

`DirectAdminSessionBridge` delegates authentication, company switching, revocation and Workforce/Zero exchange to the canonical #302 `createSessionCredentialService`. It does not implement signature verification, issue keys, provision identities or create another registry. The verified provider must equal the configured DirectAdmin HTTPS issuer. The request origin, commissioned node and audience are fixed by trusted startup configuration.

The browser projection exposes only `company_ids: [current.company_id]`; switchable companies never become operation scope. Actor, company, device, session and revisions come from current canonical registry state. Caller IDs, company headers, a node token, DirectAdmin role and a session ID alone supply no Titan business authority.

The host issues `__Host-titan-da-session` as Secure, HttpOnly, SameSite=Strict, Path=/ with no Domain. The browser sends the separate CSRF nonce only with same-origin requests; the bridge compares its digest to the verified canonical binding. POST requires exact Origin; Fetch Metadata, cookie and CSRF checks fail closed. Responses are no-store and redact owner/provider errors. Switch uses canonical revision rotation, gives the replacement only as an HttpOnly cookie, and invalidates all mounted plugin contexts. Logout revokes the durable session before clearing the cookie.

## Workforce/Zero exchange and consumers

`requestIntent` receives a server-only `withWorkforceZeroSession(consume)` capability. It revalidates the DirectAdmin cookie, calls the fixed canonical exchange, checks child audience, selected company, actor, device, revisions and source-capped expiry, and supplies the child bearer only to the trusted server callback. The browser never receives it. The gateway returns only a bounded receipt ID and rejects JWT-shaped IDs. This callback is a request capability, not a queue credential; the downstream owner must retain the signed source proof and use current-session fencing at consequential effects.

The three SDK consumers—Zero Core, Operations Hub and Brand Studio—share one session, renderer and gateway. Their projections validate nested company identity, source, freshness and evidence shape; render untrusted values as text; isolate plugin failures; and show stale, unknown and incompatible data as read-only. These source consumers are not certified installed DirectAdmin role packages.

The SDK integration test uses the actual #302 service and registry. It verifies the exchanged child with the canonical Workforce verifier, proves caller/company headers cannot switch its selected company, checks that bearer and CSRF values do not reach the response, and verifies that a source-company switch invalidates the child.

## Current owner handoffs

At #302/#1183 head `9bfc15f69613493761b4ae53a484004957c14dec`, `exchangeWorkforceZero` fixes the child target to `workforce`/`zero`, binds the verified DirectAdmin source and selected identity, reuses deterministic child sessions idempotently, only tightens expiry, and does not recreate revoked children. `withCurrentSessionFence` rechecks the child and source under the identity-registry writer lock before a bounded effect callback. #1183 is still an open draft and has not merged; an independent security review and exact-head CI remain required. The owner reports 137/137 identity/session tests on Node 22 with production SQLite and separate child-process connections. A separate local Node 24 run found that changing only unused Base64url signature tail bits does not change the decoded signature; this test-fixture edge case was reported on #1183 and is not changed by #1049.

At #811/#1201 head `aa4345c58a00078fa4065fee0224195639dcf8c6`, the Workforce verifier drops `source_session` and `credential_expires_at`, and hosted runtime rebuilds a reduced proof before `resolveCurrentSession`. The current host also does not use #302's effect fence. No #811 server/bootstrap files or #1182/#1188 conversation transport files were edited here.

A disposable real-HTTP probe composed the canonical exchange/verifier with the current #811 server. It revoked the DirectAdmin source immediately after child authentication and before hosted identity resolution. The actual `POST /v1/workforce/conversations` route returned `400 conversation-input-required`, showing authentication passed after source revocation because the published adapter omitted lineage. The request had no text, so dispatch and business-effect counters remained zero. This is a negative compatibility probe, not successful Workforce consumption or effect-fence acceptance. Details are recorded on [#1201](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1201#issuecomment-5945925884).

## Routes and diagnostics

- GET `/v1/directadmin/context`
- GET `/v1/directadmin/{titan_zero,titan_operations,titan_web}/projection`
- POST `/v1/directadmin/{titan_zero,titan_operations,titan_web}/intents`
- POST `/v1/directadmin/company` with `{ "company_id": "..." }`
- POST `/v1/directadmin/logout`

The Fetch gateway is not a listener, CLI or deployment. The launched #811/#812 host owns transport deadlines, rate limits and actual projection/intent owners. A successful SDK response reports `REQUESTED` only; the SDK does not authorize or execute business effects.

## Current verification

On the current branch after merging main `df52782d`:

- `node --test packages/titan-platform/tests/directadmin-bridge.test.mjs packages/titan-platform/tests/directadmin-workforce-handoff.test.mjs` — 68/68 passed.
- `node --test packages/titan-platform/tests/directadmin-*.test.mjs` after compiling the package test artifacts — 80/80 passed, including the standalone package contract tests.
- `node_modules/.bin/tsc -p packages/titan-platform/tsconfig.json --noEmit` — passed. The malformed-newline/export blocker from the previous main snapshot is resolved by merged #1179 and is not a current blocker.
- Strict changed-gateway compilation and `git diff --check` — passed before the main merge; rerun on the published head.
- The full `tests/*.test.mjs` package suite was attempted, but the shared `tsconfig.test.json` emits only its selected build inputs and leaves modules imported by many unrelated tests absent from `.test-dist`. The DirectAdmin-focused suite above passes; no full package test pass is claimed.
- Per the #1179 handoff, all seven hosted checks passed on reviewed commit `b9bc071b` before it merged to main. This does not replace exact-head #1049 CI, which must run after publishing this continuation.

## Remaining acceptance work

Keep this PR draft and the issue open. The #811 owner must preserve the verified child source proof and expiry through authentication, current-session resolution and durable run identity, then call `withCurrentSessionFence` before consequential effects. The completed composition still needs adversarial HTTP coverage for source revoke/switch at effect admission, duplicate requests, cancellation and timeout/UNCERTAIN handling. Independent high-impact authentication review and exact-head CI are required before merge.

Real DirectAdmin assertion issuance, approved actor/company/device mappings, secured browser and OS access, Evolution role-package installation, production reverse-proxy/HTML-header checks, registry commissioning, and a real-host smoke remain external prerequisites. No persistent credential, security setting, migration, server deployment or merge was performed.

Rollback withdraws the SDK bridge and consumers. It introduces no SDK identity store or persistence migration. Retain #302's separately owned session/revocation data and do not restore a weaker credential fallback.
