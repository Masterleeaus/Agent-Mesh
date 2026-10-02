# Titan Workforce — DirectAdmin consumer

Mission [#1050](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/issues/1050).
This package is the operator cockpit for the canonical hosted Workforce. It has
no database, queue, agent executor, identity mapping, credentials or authority engine.
Native Titan FSM remains the default; Frappe is optional.

## Integration status

The executable role routes render the same company-scoped cockpit. The browser
must use the shared #1049 session/company/CSRF bridge and #811 hosted API. Missing
bridge, denied identity, invalid company data or unavailable host fail closed.
The current implementation is **not certified complete or ready for production**.
A fixture-based passing test does not prove a commissioned host or identity bridge.

The UI displays canonical roster/worker identity, hierarchy relationships, work
states, permitted lifecycle intent submission and receipt/evidence references.
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

The builder produces a flat `titan_workforce.tar.gz` and SHA256 sidecar, applies
executable modes, extracts the final tarball, compares contents/modes and runs
staging-location preflight. Tests and development fixtures are excluded.

Install/update only checks package/runtime prerequisites. It does not provision
users, secrets, server processes, reverse proxies, permissions or databases.
Uninstall never deletes Workforce/business data. DirectAdmin Plugin Manager owns
code activation/removal. Production installation requires separately approved
commissioning and live certification; no deployment is performed by this work.

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

The browser executable override is optional when Playwright's matching browser
is installed. Controller and browser tests use explicitly marked fixtures,
including malicious cross-company payloads, expired/revoked sessions,
out-of-order responses, duplicate clicks, false verification and hostile text.

## Ownership and reuse

- #1049: shared SDK, authenticated DA session bridge, current company, CSRF,
  handoff/revocation, navigation and contribution infrastructure.
- #811: independently hosted Workforce, canonical registry/work/runs, governed
  control API and recovery; #1182: conversation transport.
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
