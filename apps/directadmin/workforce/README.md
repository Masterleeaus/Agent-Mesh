# Titan Workforce — DirectAdmin consumer

Mission [#1050](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/issues/1050).
This package is the operator cockpit for the canonical hosted Workforce. It has
no database, queue, agent executor, identity mapping, credentials or authority engine.
Native Titan FSM remains the default; Frappe is optional.

## Integration status

The executable role routes render the same company-scoped cockpit. The browser
uses the actual shared #1049 `DirectAdminCockpitSession` and its context/projection/intent routes.
Open draft PR #1201 now contains the #811 canonical company-filtered read-only projection
owner and an optional `/v1/directadmin/*` Fetch-handler mount. Its published controls list
is empty and lifecycle proposals are explicitly denied pending canonical caller-management
authority. This code is not merged to main or live-certified. Missing commissioned
session/CSRF bootstrap, denied identity, invalid company data or unavailable host fail closed.
The current implementation is **not certified complete or ready for production**.
Authenticated host HTML must supply `<meta name="titan-directadmin-csrf" content="…">`
with the separately bound nonce; the plugin never creates this nonce or an identity
from DirectAdmin environment/role. The credential remains an HttpOnly cookie.
A fixture-based passing test does not prove a commissioned host or identity bridge.
DirectAdmin role executables emit the HTML document only. They do not consume CGI
POST stdin, PHP superglobals, query parameters, or host environment variables as
identity/CSRF inputs. The browser SDK makes same-origin API requests; the direct
DirectAdmin POST/environment bridge is not assumed to work. Installed Dev Access
1.1.3 has a reported CSRF failure and #1048 is repairing and verifying that bridge.
Until the host request owner proves it, session bootstrap and governed POSTs remain
uncommissioned and the cockpit stays unavailable/denied.
DirectAdmin documents role entrypoints as executable scripts receiving request data
through process environment; `pipe_post=yes` sets `POST=stdin=true` and delivers the
POST body on stdin. The Workforce test now launches the packaged role executable as
a real CLI child process with that transport and hostile identity/CSRF fields; it
confirms the renderer ignores them. This checks the executable boundary, not a live
DirectAdmin server or a functioning API route.

The shared #1049 browser client requests same-origin `/v1/directadmin/...` routes.
The #811 host's optional Fetch mount accepts a configured HTTPS public origin, checks
the forwarded Host/origin and forwards an allowlist of cookie, origin, fetch-site and
CSRF headers. The plugin's role route remains only an HTML renderer; it does not
translate DirectAdmin CGI input into caller identity or a CSRF nonce. #1048's Developer
Portal parser is plugin-specific and cannot commission Workforce. #812 now owns the
official DirectAdmin RAW plugin ingress relay and strict `headers_to_env` / `pipe_post`
parsing under existing PR #1211, with #1049 reviewing transport security. Keep this
consumer's route mapping unchanged until #812 publishes the exact path/header contract.
Do not put a private token in a URL or infer a nonce/caller from CGI values. No Apache
443 shortcut is assumed. See the install-readiness checklist in
`docs/directadmin/WORKFORCE-PACKAGE-VERIFICATION.md`.

The UI displays canonical roster/worker identity, hierarchy relationships, work
states, owner-provided source/freshness/evidence and receipt references. It only
renders lifecycle submission when the current host publishes a supported control;
the current #811 projection explicitly publishes none and is read-only.
It preserves human versus digital identity and never promotes model/provider
identity or DirectAdmin role to execution authority. A provider acknowledgement
or completed agent run is not a verified business outcome.

Unsupported host facets are labelled unavailable, including detailed trust,
autonomy, knowledge, capacity/value, Mission and staffing projections. No sample
roster or fabricated metrics appear in production. Company changes/revocation
clear view state; in-flight responses are discarded. Work persists solely on the
host when the browser closes. The client does not automatically retry mutations.

## Package

Node 22 or later is required on the DirectAdmin host. Compile the canonical #1049
browser SDK to a self-contained ESM module; do not substitute a fixture.

```sh
node apps/directadmin/workforce/tools/package.mjs \
  --sdk-module /path/to/canonical-sdk.mjs \
  --output-dir /tmp/titan-workforce-dist
```

The builder requires the current canonical browser session and package-validator exports,
and runs the shared validator on the extracted final package. It produces a flat `titan_workforce.tar.gz` and SHA256 sidecar, applies
executable modes, extracts the final tarball, compares contents/modes and runs
staging-location preflight. The manifest controls the artifact version (currently
0.1.3). Tests and development fixtures are excluded.

Install/update only checks package/runtime prerequisites. It does not provision
users, secrets, server processes, reverse proxies, permissions or databases.
Uninstall never deletes Workforce/business data. DirectAdmin Plugin Manager owns
code activation/removal. Production installation requires separately approved
commissioning and live certification; no deployment is performed by this work.
For a future approved update, retain the currently installed verified archive and
its SHA256, verify the candidate sidecar, and use DirectAdmin Plugin Manager to
update. Smoke-test the role pages in read-only/uncommissioned state. Roll back by
restoring that retained archive through the manager; plugin rollback must never
restore or delete canonical runtime state, company storage, credentials, revocations,
or evidence. This repository has not performed those host operations.

Role routes: `/CMD_PLUGINS_ADMIN/titan_workforce`,
`/CMD_PLUGINS_RESELLER/titan_workforce`, `/CMD_PLUGINS/titan_workforce`.
Evolution wrappers must preserve the shared gateway's session/origin checks and
allow packaged modules under the host CSP; verify this on a disposable host.

## Verification

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
  node --test apps/directadmin/workforce/tests/*.test.mjs
pnpm gate:fast
pnpm gate
```

The integration checks also use the compiled canonical SDK and real signed bridge/SQLite
identity registry with explicitly fixture projection/intent owners. See
`docs/directadmin/WORKFORCE-COCKPIT-INTEGRATION.md` for exact commands and remaining dependencies.

The browser executable override is optional when Playwright's matching browser
is installed. Controller and browser tests use explicitly marked fixtures,
including malicious cross-company payloads, expired/revoked sessions,
out-of-order responses, duplicate clicks, false verification and hostile text.

## Ownership and reuse

- #1049: shared SDK, authenticated DA session bridge, current company, CSRF,
  handoff/revocation, navigation and contribution infrastructure.
- #811: independently hosted Workforce, canonical registry/work/runs, read-only
  DirectAdmin projection and explicit denial of lifecycle proposals until caller
  management authority exists; #1182: conversation transport.
- #302: global actor/company relationship resolver. Protected provisioning and
  credential verification remain upstream requirements.
- #14/#640: execution/authority; #913: evidence and verified outcome provenance.
- #1045: infrastructure health (linked by role route); #1046: Zero summary.
- #1084/#1179: shared build/index/lock repair. This branch merges that prerequisite
  with provenance instead of implementing competing repairs.

Useful donor semantics are retained at canonical owners: WorkforceService and
SqliteWorkforceStore provide identity/work, runtime dispatcher preserves run and
conversation continuity, native workforce command routes preserve native FSM.
The existing `apps/web/app/workforce/page.tsx` is a marketing page, not a cockpit
runtime donor. Browser Codee Workforce tooling is development infrastructure,
not a production registry. Neither is copied into this package. The old #1143
agent/team contract was already accepted through #1145; existing history is
preserved by a non-rewriting merge on `agent/issue-1050`.

## Remaining mission acceptance

Keep #1050 open. Its complete criteria still require actual hosted integration,
all six native agents certified end-to-end, governed conversation/handoff,
verified provider rebinding continuity, full hierarchy/team/Mission/approval and
trust/autonomy projections, bounded knowledge, attributable value/capacity and
staffing evidence, external competency/credential revocation, Zero SDK summary,
and real DirectAdmin install/update/uninstall/reinstall/theme/session certification.
The issue's later Time Attendance delta (clock entry lifecycle, review, policies,
QR/IP/geofence/device evidence, offline replay, overlap, corrections/void and
accepted-entry payroll export) remains preserved in #1050; this bounded cockpit
continuation does not declare those outcomes delivered or close the issue.
