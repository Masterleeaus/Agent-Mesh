# DirectAdmin authenticated session bridge — #1049

Status: PR #1204 remains an open draft and #1049 remains partial/non-closing. The branch incorporates current main `14163faa316ac6236e88167b7c8d8a5e95007c7e` (#1201, #1176 and #1179 ancestry). The SDK composes the canonical #302 DirectAdmin-to-Workforce/Zero exchange with the current #811 HTTP server and #812 RAW relay in disposable fixtures. The Workforce lifecycle owner still denies unsupported actions without effects, and no DirectAdmin host is commissioned.

## Canonical identity and browser boundary

`DirectAdminSessionBridge` delegates authentication, company switching, revocation and Workforce/Zero exchange to the canonical #302 `createSessionCredentialService`. It does not implement signature verification, issue keys, provision identities or create another registry. The verified provider must equal the configured DirectAdmin HTTPS issuer. The request origin, commissioned node and audience are fixed by trusted startup configuration.

The browser projection exposes only `company_ids: [current.company_id]`; switchable companies never become operation scope. Actor, company, device, session and revisions come from current canonical registry state. Caller IDs, company headers, a node token, DirectAdmin role and a session ID alone supply no Titan business authority.

The canonical context revision is an opaque registry snapshot string. The browser SDK sends a versioned `ctx1_` SHA-256 assertion over that value to fit the RAW relay's bounded URL-safe intent contract. It carries no authority: the SDK gateway compares it against the freshly authenticated canonical revision before accepting the intent. The authenticated revision remains unchanged in server-side owner context.

The host issues `__Host-titan-da-session` as Secure, HttpOnly, SameSite=Strict, Path=/ with no Domain. The browser sends the separate CSRF nonce only with same-origin requests; the bridge compares its digest to the verified canonical binding. POST requires exact Origin; Fetch Metadata, cookie and CSRF checks fail closed. Responses are no-store and redact owner/provider errors. Switch uses canonical revision rotation, gives the replacement only as an HttpOnly cookie, and invalidates all mounted plugin contexts. Logout revokes the durable session before clearing the cookie.

Failure status is separate from identity authority. A canonical `authentication-denied` (treated as session rejection) returns a generic 401 and clears its session cookie; a request rejected by the Origin/CSRF boundary returns the same generic 401 body without clearing a cookie. After a source has authenticated, exchange, company-switch and revocation failures trigger a fresh source-session read: a rejected source returns 401, while an operation failure with a still-current source returns a redacted 503 without a `Set-Cookie` header. A typed Workforce action-denial 403 preserves the shared browser context and its subscribers; 401 and context-conflict 409 still invalidate them. No exception details are included in responses.

The current #302 service intentionally collapses canonical authentication and registry errors to `authentication-denied`. When that same error is returned by the fresh source-session read, this adapter cannot distinguish a revoked source from a registry outage and fails closed as 401. Raw service failures remain 503. A typed canonical unavailable-versus-rejected error contract would remove this residual ambiguity without changing identity ownership.

## Workforce/Zero exchange and consumers

Only trusted Zero Core and Workforce intent owners receive the server-only `withWorkforceZeroSession(consume)` capability; Operations Hub and Brand Studio cannot exchange a Workforce/Zero child. The capability revalidates the DirectAdmin cookie, calls the canonical fixed-target exchange, checks child audience, selected company, actor, device, revisions and source-capped expiry, and supplies the child bearer only to the trusted server callback. The browser never receives it. The gateway returns only a bounded receipt ID and rejects JWT-shaped IDs. This callback is a request capability, not a queue credential; the downstream owner must retain the signed source proof and use current-session fencing at consequential effects.

Zero Core, Operations Hub and Brand Studio share one session, renderer and gateway. The same browser session now also consumes the additive Workforce projection and intent routes. Projections validate nested company identity, source, freshness and evidence shape; render untrusted values as text; isolate plugin failures; and show stale, unknown and incompatible data as read-only. These source consumers are not certified installed DirectAdmin role packages.

The SDK integration tests use the actual #302 service and registry. They reject the raw DirectAdmin credential as a Workforce credential, exercise only the configured fixed Workforce/Zero exchange, verify the signed source-session reference, and prove that source company switch and revocation invalidate the child. Caller/company headers cannot switch the selected company; bearer and CSRF values do not reach the response.

## Current owner handoffs

At #302/#1183 head `1158e68f6b2adf92db775a0469a32b84515979ba`, `exchangeWorkforceZero` fixes the child target to `workforce`/`zero`, binds the verified DirectAdmin source and selected identity, reuses deterministic child sessions idempotently, only tightens expiry, and does not recreate revoked children. A DirectAdmin-trusted signing service for the Workforce audience now requires that fixed exchange; generic `issue()` cannot create an unlinked Workforce session. Public-key-only Workforce verifiers remain allowed. `withCurrentSessionFence` rechecks the child and source under the identity-registry writer lock before a bounded effect callback. #1183 remains an open draft; fresh independent security review and consumer acceptance remain required. Its owner reports 123/123 credential/registry/exchange tests on Node 22 with production SQLite, plus 45/45 Workforce runtime and 11/11 recovery tests.

PR #1201, at head `25005f4f4d860e2ec1dddb9f0a2c4aa152fd0488`, is merged into main at `14163faa316ac6236e88167b7c8d8a5e95007c7e`. The merged Workforce verifier retains `source_session` and `credential_expires_at`; the identity registry starts its native SQLite acquisition deadline before queueing for the writer lock and propagates the same deadline into the bounded effect callback. The merged server rejects revoked source lineage before conversation input validation. No #811 server/bootstrap files or #1182/#1188 conversation transport files were edited here.

The #302/#1183 PR remains open at `1158e68f6b2adf92db775a0469a32b84515979ba` for independent review and consumer acceptance. Current main contains the merged absolute-deadline implementation, and the focused native identity/exchange suite exercises lock acquisition, source revocation, cancellation and timeout behavior. The composed HTTP probe still stops at no-input conversation validation or source-revocation rejection, so it does not demonstrate acceptance of a consequential Workforce action.

At #812/#1211 head `9ffef58d51f0c7a0a9cfcf0e619f6bc0440508ef` (relay code head `d09799720463cf7403aeb69ad95a181cfb27943c`), the fixed relay routes the DirectAdmin browser session and bounds DNS plus full upstream response time. Its intent validator accepts bounded URL-safe context assertions; it rejects the raw JSON snapshot form returned by #302. The SDK's `ctx1_` transport assertion closes that format mismatch while preserving canonical comparison in the SDK gateway.

A disposable composed HTTP probe used the #812 browser helper and actual `.raw` entrypoint at PR head `9ffef58d`, forwarded through the #811 server now merged in main at `14163faa`, and used the canonical identity/session code present in that tree. The shared browser session loaded the current-company Workforce projection. A real child credential reached `/v1/workforce/conversations`, which returned `400 conversation-input-required` because the probe intentionally omitted message text; the Workforce owner then returned its typed `403 directadmin-workforce-action-unsupported`. In a second request, the source was revoked after child verification and before hosted identity resolution: the conversation route returned `401 conversation-authentication-failed`, and the relay returned a sanitized `401 directadmin-session-rejected`. Work-order completion remained zero. This verifies cross-plugin authentication and source-revocation rejection only; no Workforce lifecycle action or business effect was accepted.

## Routes and diagnostics

- GET `/v1/directadmin/context`
- GET `/v1/directadmin/{titan_zero,titan_workforce,titan_operations,titan_web}/projection`
- POST `/v1/directadmin/{titan_zero,titan_workforce,titan_operations,titan_web}/intents`
- POST `/v1/directadmin/company` with `{ "company_id": "..." }`
- POST `/v1/directadmin/logout`

The Fetch gateway is not a listener, CLI or deployment. The launched #811/#812 host owns transport deadlines, rate limits and actual projection/intent owners. A successful SDK response reports `REQUESTED` only; the SDK does not authorize or execute business effects.

## Current verification

On the current continuation, after merging current main `14163faa`:

- Package TypeScript test compilation followed by `node --test tests/directadmin-*.test.mjs` — 94/94 passed, including SDK package contracts, fixed DA-to-Workforce handoff invalidation, typed-403 retention, and injected raw/canonical service-failure cases.
- `node --test tests/security-session-workforce-exchange.test.mjs tests/directadmin-*.test.mjs` after test compilation — 110/110 passed, including canonical child exchange and source switch/revocation coverage.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/titan-playwright-browsers node --test packages/titan-platform/tests/directadmin-browser.browser.mjs` — 1/1 passed in system Chromium, including browser Web Crypto revision encoding.
- `node ../../node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` — passed.
- A disposable end-to-end relay/SDK/#811 HTTP probe at merged main `14163faa` and relay PR head `9ffef58d` passed: Workforce projection returned for the selected company; the lifecycle owner returned 403; source revocation returned 401 before conversation input validation; work-order completion count stayed zero.
- Disposable #1183/#1049 integration at #1183 candidate `1158e68f` plus the revised #1049 handoff fixture passed TypeScript and 172/172 focused credential, exchange, bridge and consumer tests; the browser test passed 1/1. Its full package run had 1,054 passed, 72 failed and 2 skipped out of 1,128. The #1049-only full run had 1,052 passed, 72 failed and 2 skipped out of 1,126; failed test names were unchanged in the combined run.
- `git diff --check` — passed for the current source and documentation changes.
- The full `node --test --test-reporter=tap ./tests/*.test.mjs` package suite on this branch was attempted after the handoff fix: 1,052 passed, 72 failed and 2 skipped. The DirectAdmin-focused suite above passes; no full package test pass is claimed.
- Exact-head hosted checks must rerun after publishing the handoff fix. The preceding head `6289e084` passed Mission Closure Evidence Gate, Personal Zero Verification, Titan Zero Source Evidence Index and Titan Zero CI `validate`.

## Remaining acceptance work

Keep this PR draft and the issue open. The current Workforce owners intentionally deny all proposed lifecycle controls with a typed 403, so this composition has no accepted action or business-effect evidence. Although current main includes #1201's native acquisition deadline and restart-lineage checks, the end-to-end probe does not certify effect admission, duplicate requests, cancellation, or timeout/UNCERTAIN handling. A fresh independent high-impact authentication review and exact-head CI are required before merge.

Real DirectAdmin assertion issuance, approved actor/company/device mappings, secured browser and OS access, Evolution role-package installation, production reverse-proxy/HTML-header checks, registry commissioning, and a real-host smoke remain external prerequisites. No persistent credential, security setting, migration, server deployment or merge was performed.

Rollback withdraws the SDK bridge and consumers. It introduces no SDK identity store or persistence migration. Retain #302's separately owned session/revocation data and do not restore a weaker credential fallback.
