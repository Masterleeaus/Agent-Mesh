# DirectAdmin authenticated session bridge — #1049

Status: PR #1204 remains an open draft and #1049 remains partial/non-closing. The branch incorporates current main `c063a96dd9e2f6b73a2f199882ab6a710ff6c7d9` (#1176, with #1179 ancestry). The SDK composes the canonical #302 DirectAdmin-to-Workforce/Zero exchange with the current #811 HTTP server and #812 RAW relay in disposable fixtures. The Workforce lifecycle owner still denies unsupported actions without effects, and no DirectAdmin host is commissioned.

## Canonical identity and browser boundary

`DirectAdminSessionBridge` delegates authentication, company switching, revocation and Workforce/Zero exchange to the canonical #302 `createSessionCredentialService`. It does not implement signature verification, issue keys, provision identities or create another registry. The verified provider must equal the configured DirectAdmin HTTPS issuer. The request origin, commissioned node and audience are fixed by trusted startup configuration.

The browser projection exposes only `company_ids: [current.company_id]`; switchable companies never become operation scope. Actor, company, device, session and revisions come from current canonical registry state. Caller IDs, company headers, a node token, DirectAdmin role and a session ID alone supply no Titan business authority.

The canonical context revision is an opaque registry snapshot string. The browser SDK sends a versioned `ctx1_` SHA-256 assertion over that value to fit the RAW relay's bounded URL-safe intent contract. It carries no authority: the SDK gateway compares it against the freshly authenticated canonical revision before accepting the intent. The authenticated revision remains unchanged in server-side owner context.

The host issues `__Host-titan-da-session` as Secure, HttpOnly, SameSite=Strict, Path=/ with no Domain. The browser sends the separate CSRF nonce only with same-origin requests; the bridge compares its digest to the verified canonical binding. POST requires exact Origin; Fetch Metadata, cookie and CSRF checks fail closed. Responses are no-store and redact owner/provider errors. Switch uses canonical revision rotation, gives the replacement only as an HttpOnly cookie, and invalidates all mounted plugin contexts. Logout revokes the durable session before clearing the cookie.

## Workforce/Zero exchange and consumers

Only trusted Zero Core and Workforce intent owners receive the server-only `withWorkforceZeroSession(consume)` capability; Operations Hub and Brand Studio cannot exchange a Workforce/Zero child. The capability revalidates the DirectAdmin cookie, calls the canonical fixed-target exchange, checks child audience, selected company, actor, device, revisions and source-capped expiry, and supplies the child bearer only to the trusted server callback. The browser never receives it. The gateway returns only a bounded receipt ID and rejects JWT-shaped IDs. This callback is a request capability, not a queue credential; the downstream owner must retain the signed source proof and use current-session fencing at consequential effects.

Zero Core, Operations Hub and Brand Studio share one session, renderer and gateway. The same browser session now also consumes the additive Workforce projection and intent routes. Projections validate nested company identity, source, freshness and evidence shape; render untrusted values as text; isolate plugin failures; and show stale, unknown and incompatible data as read-only. These source consumers are not certified installed DirectAdmin role packages.

The SDK integration test uses the actual #302 service and registry. It verifies the exchanged child with the canonical Workforce verifier, proves caller/company headers cannot switch its selected company, checks that bearer and CSRF values do not reach the response, and verifies that a source-company switch invalidates the child.

## Current owner handoffs

At #302/#1183 head `ea9b3e941abd09fa0424f344e18931a31f969d90`, `exchangeWorkforceZero` fixes the child target to `workforce`/`zero`, binds the verified DirectAdmin source and selected identity, reuses deterministic child sessions idempotently, only tightens expiry, and does not recreate revoked children. `withCurrentSessionFence` rechecks the child and source under the identity-registry writer lock before a bounded effect callback. #1183 remains an open draft; independent security review and consumer acceptance remain required. Its owner reports 137/137 identity/session tests on Node 22 with production SQLite and separate child-process connections.

At #811/#1201 head `d5a84e40fafc4696c730334610e8f29703a5d1ff`, the Workforce verifier retains `source_session` and `credential_expires_at`, and the branch adds a native SQLite lock-acquisition deadline API plus restart-lineage tests. The latest server composition rejects revoked source lineage before conversation input validation. No #811 server/bootstrap files or #1182/#1188 conversation transport files were edited here.

The #302/#1183 head is still `ea9b3e941abd09fa0424f344e18931a31f969d90`; its published registry fence still starts its 500 ms timer only after `storage.transaction` acquires the writer lock. The #811 branch provides the native acquisition-deadline option, but #302 has not wired it into this fence yet. This remains owner-coordinated integration work. The SDK probe stops at no-input conversation validation or source-revocation rejection, so it does not claim effect-fence deadline acceptance.

At #812/#1211 head `49dd5c97a7106b0a1e4abbede9209b13071988c0` (relay code head `d09799720463cf7403aeb69ad95a181cfb27943c`), the fixed relay routes the DirectAdmin browser session and bounds DNS plus full upstream response time. Its intent validator accepts bounded URL-safe context assertions; it rejects the raw JSON snapshot form returned by #302. The SDK's `ctx1_` transport assertion closes that format mismatch while preserving canonical comparison in the SDK gateway.

A disposable composed HTTP probe used the #812 browser helper and actual `.raw` entrypoint, forwarded through the relay to the actual #811 server at `e993a7ee`, and used the current #302 service/verifier. The shared browser session loaded the current-company Workforce projection. A real child credential reached `/v1/workforce/conversations`, which returned `400 conversation-input-required` because the probe intentionally omitted message text; the actual #811 owner then returned its typed `403 directadmin-workforce-action-unsupported`. In a second request, the source was revoked after child verification and before hosted identity resolution: the conversation route returned `401 conversation-authentication-failed`, and the relay returned a sanitized `401 directadmin-session-rejected`. Work-order completion remained zero. This verifies cross-plugin authentication and source-revocation rejection only; no Workforce lifecycle action or business effect was accepted.

## Routes and diagnostics

- GET `/v1/directadmin/context`
- GET `/v1/directadmin/{titan_zero,titan_workforce,titan_operations,titan_web}/projection`
- POST `/v1/directadmin/{titan_zero,titan_workforce,titan_operations,titan_web}/intents`
- POST `/v1/directadmin/company` with `{ "company_id": "..." }`
- POST `/v1/directadmin/logout`

The Fetch gateway is not a listener, CLI or deployment. The launched #811/#812 host owns transport deadlines, rate limits and actual projection/intent owners. A successful SDK response reports `REQUESTED` only; the SDK does not authorize or execute business effects.

## Current verification

On the current continuation, after merging main `c063a96d`:

- Package TypeScript test compilation followed by `node --test packages/titan-platform/tests/directadmin-*.test.mjs` — 84/84 passed, including SDK package contracts.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/titan-playwright-browsers node --test packages/titan-platform/tests/directadmin-browser.browser.mjs` — 1/1 passed in system Chromium, including browser Web Crypto revision encoding.
- `node_modules/.bin/tsc -p packages/titan-platform/tsconfig.json --noEmit` — passed.
- A disposable end-to-end relay/SDK/#811 HTTP probe at server `d5a84e40` and relay `49dd5c97` passed: Workforce projection returned for the selected company; the lifecycle owner returned 403; source revocation returned 401 before conversation input validation; work-order completion count stayed zero.
- `git diff --check` — passed for the current source and documentation changes.
- The full `tests/*.test.mjs` package suite was attempted, but the shared `tsconfig.test.json` emits only its selected build inputs and leaves modules imported by many unrelated tests absent from `.test-dist`. The DirectAdmin-focused suite above passes; no full package test pass is claimed.
- Exact-head #1049 hosted checks must run after publishing this continuation.

## Remaining acceptance work

Keep this PR draft and the issue open. The current Workforce owners intentionally deny all proposed lifecycle controls with a typed 403, so this composition has no accepted action or business-effect evidence. #811 still has recovery/fence edge cases under review; the end-to-end probe does not certify duplicate requests, cancellation, or timeout/UNCERTAIN handling. Independent high-impact authentication review and exact-head CI are required before merge.

Real DirectAdmin assertion issuance, approved actor/company/device mappings, secured browser and OS access, Evolution role-package installation, production reverse-proxy/HTML-header checks, registry commissioning, and a real-host smoke remain external prerequisites. No persistent credential, security setting, migration, server deployment or merge was performed.

Rollback withdraws the SDK bridge and consumers. It introduces no SDK identity store or persistence migration. Retain #302's separately owned session/revocation data and do not restore a weaker credential fallback.
