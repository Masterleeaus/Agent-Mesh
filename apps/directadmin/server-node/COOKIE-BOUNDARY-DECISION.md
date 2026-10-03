# #812 DirectAdmin cookie boundary decision

**Decision:** use the existing DirectAdmin hostname candidate `server-216-219-85-159.da.direct` as the sole public DirectAdmin origin, with canonical origin `https://server-216-219-85-159.da.direct:2222`. Keep the Titan public site on `https://titanzero.io`. Do not serve the Titan app or another less-trusted application on the DirectAdmin hostname at any port.

This selects the separate-host boundary already recorded as a candidate in the #812 README. It is a source and integration decision only. It does not certify DNS, the live TLS certificate, routing, the contents of port 443, or the Workforce listener, and it does not authorize a live change. If the selected hostname cannot pass the acceptance checks below, keep #812 production forwarding disabled and resolve the hostname/ownership contract before enabling it.

## Why this boundary

Cookie scope is host based, not port based. A `Secure`, host-only cookie set by `titanzero.io:2222` is also sent to `titanzero.io:443`; changing the port does not isolate it. RFC 6265 explicitly describes cookies as shared across all ports on a host. Chromium reproduced that behavior with a synthetic `__Host-` cookie. A different hostname prevents the browser from automatically sending the host-only cookie to `titanzero.io`.

Keep the Titan session cookie named `__Host-titan-da-session` with `Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age<=300` and no `Domain` attribute. The `__Host-` prefix is material: the Chromium fixture rejected a `Domain` attribute and retained the host-only cookie. Do not try to create this boundary with Apache `RequestHeader` cookie stripping. The existing disposable Apache 2.4.68 test recorded in the current #812 README found order-dependent duplicate-Cookie filtering and an earlier module observing the cookie before a late filter.

## Owner flow contract

| Component | Contract |
| --- | --- |
| DirectAdmin browser/plugin page | Open under `https://server-216-219-85-159.da.direct:2222`; request role-local RAW paths as same-origin POSTs. |
| #1395 / #1405 bootstrap RAW | Use the role-mapped `/CMD_PLUGINS_ADMIN/titan_workforce/…`, `/CMD_PLUGINS_RESELLER/titan_workforce/…`, or `/CMD_PLUGINS/titan_workforce/…` path for `bootstrap-nonce.raw` and `bootstrap.raw`, with exactly `headers_to_env=yes&pipe_post=yes`. Validate exact Origin/Host equality, `Sec-Fetch-Site: same-origin`, one copy of each parsed header, allowlisted cookies, and reject caller target/identity additions. |
| #811 Workforce gateway | Require `directAdmin.publicOrigin` and the issuer/provider origin to equal `https://server-216-219-85-159.da.direct:2222`. The current RAW producer sends only the fixed `127.0.0.1:3010` loopback target and fixed `/v1/directadmin/bootstrap-nonce` or `/v1/directadmin/bootstrap` path. This assumes DirectAdmin and #811 are co-resident; if that is false, stop and design a protected private transport with the #811 owner. Do not use a caller URL or expose 3010/3015 publicly. |
| #1049 / #302 | Align the session/CSRF public origin and registered DirectAdmin provider with the same exact origin; preserve their identity, CSRF, and signed-source-credential ownership. |
| #1050 browser/client | Serve the Workforce plugin page from the DirectAdmin origin and keep bootstrap fetches same-origin with credentials. Do not route the browser through `titanzero.io` to carry the DirectAdmin session. |
| #812 generic Server Node relay | Keep the production RAW loader fail-closed at sanitized 503 until the origin is owner-approved, private transport is verified, source is reviewed, and the exact production package passes acceptance. The current #812 generic relay is distinct from the role-local #1395/#1405 bootstrap path; do not duplicate either architecture. |

Reserve the entire DirectAdmin hostname as a trusted panel boundary, not only port 2222. In particular, verify that `:443` does not host or forward to the Titan site/Workforce app and does not log Cookie values. If a service on that hostname is not part of the DirectAdmin trust boundary, the selected hostname is not safe until that service is removed or a different dedicated hostname is approved.

## Runnable local evidence

The disposable Chromium fixture is [`tests/fixtures/cookie-origin-isolation-prototype.mjs`](tests/fixtures/cookie-origin-isolation-prototype.mjs), SHA-256 `e75625b849463bb9ede7388aca39771b16a9756e893c1ba989910f29e2db2cf5`. From the repository root, run:

```sh
node apps/directadmin/server-node/tests/fixtures/cookie-origin-isolation-prototype.mjs
```

It generates a short-lived self-signed certificate, binds only to `127.0.0.1` (preferring ports 2222, 8443, and 8444), and uses only synthetic cookie values. It produced these results on Chromium 151:

- The browser sent the DirectAdmin host-only cookie from `panel.titan.test:2222` to the same hostname on `:8443`.
- The browser omitted it from `marketing.titan.test:8444`.
- A `Domain=titan.test` attempt to overwrite the `__Host-` cookie was rejected; JavaScript could not read the HttpOnly cookie.
- Duplicate raw `Cookie` fields were preserved by the receiving HTTP stack and rejected in both orders (unrelated then Titan; Titan then unrelated). A combined Titan cookie and wrong Host were also rejected. None reached the protected fixture handler.

The test exercises browser cookie scoping and an explicit duplicate-header gate. It does not exercise DirectAdmin CGI serialization or the real port 443 listener.

The extracted role package was also tested on both current draft heads, PR [#1395](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1395) at `d706ed5ef2c216e5972bb15aac35ed3d44987e74` and PR [#1405](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1405) at `433902270dc6a58a5e70ae16ae541b4d9de49883`. On each exact head, run:

```sh
node --test apps/directadmin/workforce/tests/bootstrap-raw.test.mjs
```

Both runs passed 4/4. They package and extract admin/reseller/user RAW entrypoints, assert executable modes, exercise fixed loopback routes and separate session `Set-Cookie` handling, and verify malformed/duplicate headers, identity fields, foreign cookies, invalid methods/body/query flags, malformed upstream replies, stalled input, and timeout failures are denied without a fake-upstream call. The only configurable upstream port is a test-only numeric file under `tmpdir`; production code fixes the host to loopback and does not read a caller target. The producer files are byte-identical across those heads. Both PRs were still open drafts when these tests ran; this is not a Library release or production install.

The role-local #1395/#1405 bootstrap RAW path is separate from the generic #812 `directadmin-gateway.raw` path. The current #812 README records that its latest #1050 extracted integration reached bootstrap with an existing Titan cookie, received `401 directadmin-session-rejected`, and did not record the expected hosted-gateway observation. It also records that the integration's CGI fixture omits `X-Titan-DA-Bootstrap-CSRF`. These are unresolved cross-owner integration/lifecycle issues; cookie-host separation and the standalone package tests do not resolve them. Keep the generic #812 relay's production 503 until #1049/#1050/#811/#1300 owners fix and rerun the integrated path without broadening cookie forwarding or trusting CGI identity.

## Exact remaining acceptance before #812 forwarding can be enabled

1. On an authorized disposable DirectAdmin 1.711 panel, verify that the selected hostname resolves to the intended panel and presents a valid matching certificate on `:2222`; exercise each role route and confirm there is no redirect to `titanzero.io`.
2. Inspect the same selected hostname on `:443`. Confirm it serves no Titan/Workforce app, does not forward to one, and does not record Cookie values. Verify every other service/port on this hostname belongs to the DirectAdmin trust boundary.
3. With synthetic values only, submit raw duplicate Cookie fields in both orders through the actual DirectAdmin listener. Confirm the official `HEADERS` value preserves enough information for the role RAW parser to reject duplicates before loopback. Do not log or retain cookie contents.
4. Verify the real panel's `headers_to_env=yes` URL encoding, `pipe_post=yes`/`POST=stdin=true`, request/response limits, timeout behavior, and separate `Set-Cookie` handling. Official DirectAdmin docs describe these facilities, but do not define the exact duplicate-header serialization needed here.
5. Confirm #811 is co-resident and bound only to loopback `127.0.0.1:3010`, or obtain an owner-approved protected private transport. Confirm no public listener/firewall route to 3010/3015.
6. Resolve and rerun the integrated #1049/#1050/#811/#1300 bootstrap/session lifecycle described above, including the required nonce header, existing-Titan-cookie renewal, revocation and denial cases.
7. Have #1049, #302, #811, and #1050 owners confirm the exact public-origin/provider string above; then independently review and test the source change that enables #812. Until all pass, the production relay remains 503 and the existing lifecycle package remains unapproved for installation.

No live DNS, TLS, permission, credential, firewall, or production configuration was changed for this decision or fixture.
