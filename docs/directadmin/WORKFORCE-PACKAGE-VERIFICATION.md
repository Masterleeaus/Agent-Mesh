# Titan Workforce package verification

This checklist verifies a **packaging candidate** in a local workspace or disposable staging directory. The archive is **not live-install-ready** and this checklist does not authorize copying it into DirectAdmin, enabling the plugin, creating credentials or changing a host.

The v0.1.4 record and the first v0.1.5 hash below are historical candidates.
The current v0.1.5 candidate was rebuilt from the app changes on the canonical
`agent/issue-1050` branch against current main
`d508a2695fccc36e039f18e60cb96adfbe318813` after #1243 updated the shared
session bridge. Current-source results and hashes are recorded at the end.

## Build the SDK and package

For the current candidate, use the exact canonical SDK source from main
`d508a2695fccc36e039f18e60cb96adfbe318813` (including #1243 session replacement
and registry-outage handling). No shared SDK implementation is copied into the
Workforce source. Node 22.23.3 and the repository's locked dependencies were used.

```sh
work_area=/tmp/1050-sdk-d508
source_area=/tmp/1050-workforce-source
rm -rf "$work_area" "$source_area" /tmp/1050-sdk-d508.mjs
mkdir -p "$work_area" "$source_area"
source_ref=$(git rev-parse HEAD)
git archive d508a2695fccc36e039f18e60cb96adfbe318813 packages/titan-platform \
  | tar -xf - -C "$work_area"
ln -s "$PWD/packages/titan-platform/node_modules" \
  "$work_area/packages/titan-platform/node_modules"
node_modules/.pnpm/esbuild@0.27.3/node_modules/esbuild/bin/esbuild \
  "$work_area/packages/titan-platform/src/directadmin-plugin.ts" \
  --bundle --format=esm --platform=browser --target=es2022 \
  --outfile=/tmp/1050-sdk-d508.mjs

git archive "$source_ref" apps/directadmin/workforce | tar -xf - -C "$source_area"
node apps/directadmin/workforce/tools/package.mjs \
  --source-dir "$source_area/apps/directadmin/workforce" \
  --sdk-module /tmp/1050-sdk-d508.mjs \
  --output-dir /tmp/1050-package-candidate

sha256sum /tmp/1050-package-candidate/titan_workforce.tar.gz
cat /tmp/1050-package-candidate/titan_workforce.tar.gz.sha256
```

The builder rejects symlinks, requires canonical browser session and package-validator exports, includes an explicit 19-file allowlist, writes normalized ownership/time/modes, extracts and compares the result, invokes the shared SDK package validator and runs the install preflight in a temporary staging copy.

## Verify the final archive independently

```sh
set -eu
archive=/tmp/1050-package-candidate/titan_workforce.tar.gz
expected=$(awk '{print $1}' "$archive.sha256")
actual=$(sha256sum "$archive" | awk '{print $1}')
test "$actual" = "$expected"
test "$(tar -tzf "$archive" | wc -l)" -eq 19
stage=$(mktemp -d /tmp/titan-workforce-stage.XXXXXX)
tar --same-permissions -xzf "$archive" -C "$stage"
"$stage/scripts/install.sh"
"$stage/scripts/update.sh"
"$stage/scripts/uninstall.sh"
test -x "$stage/admin/index.html"
test -x "$stage/reseller/index.html"
test -x "$stage/user/index.html"
rm -rf "$stage"
```

The package test suite also verifies deterministic bytes, checksum sidecar, exact file list/modes, rejection of missing/symlinked inputs, failure for unsupported Node and asset conditions, install/update preflight, uninstall preserving business state, and rejection of an SDK without the current browser session.

Run the integration suite against the compiled SDK:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
TITAN_COCKPIT_SDK_MODULE=/tmp/1050-sdk-d508.mjs \
  node --test apps/directadmin/workforce/tests/*.test.mjs \
    apps/directadmin/workforce/tests/sdk-contract.integration.mjs \
    apps/directadmin/workforce/tests/hosted-sdk.integration.mjs
```

The hosted test exercises the real #302 fixture credential issuer/registry and #1049 bridge through a fixture-only Workforce owner. It proves transport and consumer behavior, not a deployed hosted API. Live DirectAdmin, commissioning, Evolution, production install/update/rollback and credential delivery require their separate owner contracts and approval.

## Previous artifact record — v0.1.4

For this continuation, the package builder consumed the exact #1049 SDK source above and produced a 19-file **verification candidate** for plugin version **0.1.4** at:

`/tmp/1050-package-candidate/titan_workforce.tar.gz`

SHA256: `0ef7ce0d5b4d0a732d1869ec067ce117aae81879bf7fa123abc0fef6c23c0d8b`
The same archive is recorded as Library item `libfile_72615f7136108191a0a2eada84474dba`, version 3, with candidate-only/not-live-install-ready metadata.


Bundled SDK module SHA256: `c45d611fbdee263cd248e4c7f9736bbe64fa80d1b7cadb19c022e27fa970db95`.
That previous candidate was rebuilt twice byte-for-byte from the canonical #1050 branch source and its exact #1049 source. It is not certified for a live DirectAdmin install.

The `.sha256` sidecar records the same value; rebuild and refresh this record after any source change.

## Approved host update and rollback procedure

This is a procedure for a later, separately approved deployment; it has not been run.

1. Retain the currently installed package archive and its verified SHA256 outside the plugin directory.
2. Verify the candidate version in `plugin.conf` and compare the archive against its `.sha256` sidecar. Stage and run the checks above.
3. After host authorization and live owner APIs are ready, update through DirectAdmin Plugin Manager and verify each role route in read-only/uncommissioned mode.
4. If the package fails, restore the retained archive through DirectAdmin Plugin Manager and repeat read-only checks.
5. Keep runtime state, company storage, credentials, revocations and evidence under their canonical owners throughout. Never use plugin rollback to restore or delete them.

The role executable does not read DirectAdmin CGI stdin/environment values. The package test supplies hostile POST stdin and DA request environment values and verifies they do not appear in the rendered page; this is an isolation test, not proof of a working DirectAdmin transport. Installed Dev Access 1.1.3 has a reported POST CSRF failure; #1048 must certify its own Developer Portal form path, while Workforce separately needs #812/#1049 route wiring and live DirectAdmin transport/session tests.

## Candidate validation (not live-install readiness)

The owner-state paragraph immediately below is historical evidence from the
`ccf8010a` snapshot; its PR statuses are not current. The 2026-10-02 record at
the end reflects merged PR #1143, #1204 and #1211, main snapshot `468d42b1`
(the source tip at build time), and the latest extracted test. Live main is now
`23300c79`; its intervening changes do not touch the tested DirectAdmin Workforce,
Server Node, hosted-owner or SDK paths.

**Can execute now:** package build, deterministic archive/checksum validation, staged install/update/uninstall preflight, and each role script as a CLI renderer. DirectAdmin's documented `pipe_post=yes` mode supplies `POST=stdin=true` and POST bytes on stdin; the packaged role process has been exercised with these values and ignores request data safely. Install/update scripts only preflight and do not mutate a host. None of this makes the archive live-install-ready.

**Historical owner state at `ccf8010a` (not current):** #811/#1201 was in that main snapshot with the company-filtered read-only projection owner and optional `/v1/directadmin/*` Fetch mount. The current projection has `controls: []`; proposed lifecycle intents are denied without state, event or receipt writes. That snapshot also includes #1183 credential/current-company session work, #1240 company-placement contracts, and #1048/#1209 Developer Portal hardening, but no verified upstream credentials or protected Workforce provisioning have been commissioned. #1050 imports #812's helper path and sends through the RAW endpoint. The extracted-package → RAW → #811 host run used the `c883304a` host snapshot, #812 `8cae7034` and #1049 SDK source `e428b67b`; it passed `ctx1_` validation, projection reads, company switch, isolated invalid-CSRF denial and cookie clearing, typed action 403 while preserving the valid session, and expiry handling without work/event writes. The Workforce controller revalidates after an intent-route denial; post-acceptance read failures remain cleared and direct the operator to inspect canonical history. This is disposable integration evidence, not commissioning. That historical snapshot contains #812 commit `89ff2427` with experimental relay config v2 and an Apache `:443` cookie-boundary marker/template; this run predates that contract and does not test or attest the marker. Independent contract review and real disposable Apache/DirectAdmin testing are required before adoption. Do not treat the marker as proof of cookie isolation. #1049 was then an open draft; PR #1204 later merged at `75cc7f02`. #812/PR #1211 is merged but its live-host commissioning remains unverified. No private token belongs in a URL.

### Disposable extracted relay-to-host integration

This test packages the exact pinned owner sources, extracts all three owner packages, and uses only temporary SQLite files, a generated localhost TLS certificate, and the actual #1049 signed identity test fixture. It is not live-host or production-session certification. The owner snapshots used for the original extracted v0.1.4 run were #1049 SDK source `e428b67b34779e49f4dbc8d3e80b193e8737eb13`, #811 host/runtime/storage snapshot `c883304a662738fe480ec1e5d044fdeb0c4c879e` (projection owner reviewed at `25005f4f4d860e2ec1dddb9f0a2c4aa152fd0488`; snapshot includes #1183/#1240 storage/session changes), and pre-v2 #812 head `8cae7034f6d2ec7c9063ac0c3aba40c6f41b3d89`. PR #1204 later merged the SDK implementation to main at `75cc7f02`. After that historical run, main advanced through `ccf8010a`, #1197 portfolio packaging, and #1048/#1209 Developer Portal hardening; these commits do not change the tested Workforce host route paths. Current main also contains merged #812 commit `89ff2427` with experimental config v2 and an Apache cookie-boundary marker/template; this test does not validate that new contract.

```sh
work_area=/tmp/1050-extracted-integration
rm -rf "$work_area"
mkdir -p "$work_area/host" "$work_area/server-node" "$work_area/sdk"
git archive c883304a662738fe480ec1e5d044fdeb0c4c879e \
  package.json services/workforce packages/storage packages/titan-platform \
  packages/runtime packages/tools db/sqlite | tar -xf - -C "$work_area/host"
git archive 8cae7034f6d2ec7c9063ac0c3aba40c6f41b3d89 \
  apps/directadmin/server-node scripts/package-directadmin-plugin.mjs \
  | tar -xf - -C "$work_area/server-node"
git archive e428b67b34779e49f4dbc8d3e80b193e8737eb13 packages/titan-platform \
  | tar -xf - -C "$work_area/sdk"
ln -s "$PWD/packages/titan-platform/node_modules" \
  "$work_area/sdk/packages/titan-platform/node_modules"

node_modules/.pnpm/esbuild@0.27.3/node_modules/esbuild/bin/esbuild \
  "$work_area/sdk/packages/titan-platform/src/directadmin-plugin.ts" \
  --bundle --format=esm --platform=browser --target=es2022 \
  --outfile=/tmp/1050-sdk-e428.mjs

TITAN_WORKFORCE_HOST_ROOT="$work_area/host" \
TITAN_SERVER_NODE_SOURCE_ROOT="$work_area/server-node" \
TITAN_COCKPIT_SDK_MODULE=/tmp/1050-sdk-e428.mjs \
TITAN_HOST_SDK_MODULE=/tmp/1050-sdk-e428.mjs \
TITAN_BRIDGE_FIXTURE_MODULE="$work_area/sdk/packages/titan-platform/tests/fixtures/directadmin-bridge-fixture.mjs" \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
node --import ./node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/loader.mjs \
  apps/directadmin/workforce/tests/relay-host.integration.mjs
```

The extracted integration test passed using host/runtime/storage sources archived from main snapshot `c883304a` and the relay pinned to #812 `8cae7034`: missing relay config returned sanitized 503 before reaching #811; actual Workforce package/helper/RAW route read company A's canonical workers, work and evidence with controls empty; invalid CSRF was denied and cleared only the isolated test cookie; company switch exposed only company B; expiry cleared the client projection. A governed pause proposal passed #812's `ctx1_` validation, reached the actual #811 owner and returned #1049's sanitized 403 denial while preserving the valid browser session. SQLite work/events remained unchanged. Result: 14 RAW requests and 15 hosted routes. The test uses the #1049 signed identity/nonce fixture and inserts its CSRF meta value into disposable panel HTML only to exercise transport; the run includes #1183/#1240 host source but does not prove production issuer credentials, protected provisioning, the commissioned HTML bootstrap, cookie-port sharing or live DirectAdmin `HEADERS` path. Main later advanced to `ccf8010a`; the host integration was not rerun on that head. It predates merged #812 commit `89ff2427` and does not test that commit's config-v2/Apache cookie-boundary contract. The exact runtime setup used the official Node v22.23.3 tarball SHA256 `df450af89261115ef9f9e3830c3eeb2cc9213b63c720b1af623cb5dcbe2e02de`, the published `better-sqlite3@12.11.1` Node ABI 127 prebuild via `prebuild-install@7.1.3`, and a successful targeted `npm rebuild` reusing that prebuild; no node-gyp compile or supply-chain policy change was made.

**Unavailable until owners commission and verify it:** the #302-backed #1049 production actor/company/CSRF bridge and trusted nonce bootstrap, approved audience-bound Workforce handoff, and real DirectAdmin admin/reseller/user installation, POST, Evolution theme, update, rollback and session tests. The package never injects caller identity or CSRF data. The CGI CLI parser in #1048 Developer Portal is specific to that plugin and does not supply Workforce identity or routes.

## Previous candidate from main snapshot 468d42b1 — superseded

The exact main source snapshot was
`468d42b1a93401a2357f2da253f639694cb4a937`; live main now advances to
`23300c79185f6dc7f8c4b6ab3ae11ac8aa114906`, with only mobile and the generic
Titan CI workflow changed since the tested snapshot. The package builder consumed
the shared #1049 SDK compiled from `468d42b1`; bundled `images/sdk.mjs`
SHA256 is
`57d4776fdaee9359aa669d0b756392614772051cb023cce71d05c9bafc269077`.
The **candidate-only** v0.1.5 archive contains 19 files at
`/tmp/1050-package-candidate-015/titan_workforce.tar.gz`, SHA256
`0e7cdf5fae1bcb0b459c0aab2c557b442cbf6eb14ff6e9b1edbf70529e09ce31`.
Two independent builds produced byte-identical archives. Its manifest and
package report version 0.1.5. Independent extraction verified the checksum,
included SDK hash, executable role entrypoints and staged install/update/
uninstall preflight. Package source is not production data, and uninstall
preserves canonical Workforce state.

Against the SDK bundle from the tested main snapshot, the consumer/browser/
hosted/package test command in the integration record passed **39/39**, including
503 recovery without SDK
session invalidation versus revoked-session 401 invalidation, and the exact
read-only explanation/no-intent behavior for `controls: []`.

The extracted relay-to-host run used exact #811, #812 and #1049 source archives
from the tested main snapshot. It extracted Server Node **0.3.0**, configured its v2 parser
using a temporary synthetic test-only `cookie_boundary` marker, and passed the
company switch, projection/evidence, 401/403, expiry and no-write scenarios
(14 RAW requests, 15 hosted routes). The marker does not install or prove an
Apache filter and this run does not exercise a real Apache/DirectAdmin host.
The parent-confirmed duplicate physical `Cookie` header fail-open in #812's
experimental Apache `:443` filter remains a release blocker; `:2222` RAW parser
checks are a different boundary. Do not install or commission until #812 fixes
the fail-open and a disposable authorized Apache/DirectAdmin host verifies the
cookie-name-only isolation behavior.

Still unavailable are verified #302 production issuer credentials/protected
provisioning, trusted HTML CSRF bootstrap and the approved audience-bound
Workforce exchange; configured #811 production dependencies/private origin;
actual DirectAdmin CGI `HEADERS`, POST-stdin and `Set-Cookie` behavior; and a
supported host Node runtime. No credentials, live package, service, firewall,
DNS, or security setting was changed. This remains a package verification
candidate, not a commissioned plugin or mission completion claim.

## Historical current-source v0.1.5 candidate — main d508a269

The branch was fast-forwarded from its claimed base `c46774cc` to exact current
main `d508a2695fccc36e039f18e60cb96adfbe318813` after #1243. The exact shared
#1049 SDK source from `d508a269` was bundled using Node v22.23.3; the official
Node archive SHA256 is
`df450af89261115ef9f9e3830c3eeb2cc9213b63c720b1af623cb5dcbe2e02de` and bundled
`images/sdk.mjs` SHA256 is
`9d94cb80dbb0e7df15388efb1de2262e6c26af041f66a1c5d4944045fc491c9a`.

Two builds of the 19-file v0.1.5 verification candidate from the changed claim
branch source and this SDK produced byte-identical archives. Candidate path:
`/tmp/1050-package-current-a/titan_workforce.tar.gz`. Archive SHA256:
`cb3b5f0c46b53a12867db16972dfd8161dbb98fe53e7278999c5cb26b96ab132`. The
sidecar matches. Independent extraction verified the archive hash, 19-file
count, bundled SDK hash, executable admin/reseller/user routes and lifecycle
scripts, and staged install/update/uninstall preflight. Uninstall preserves
canonical hosted business state. No DirectAdmin server was modified.

The Node 22.23.3 Workforce command
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium TITAN_COCKPIT_SDK_MODULE=/tmp/1050-sdk-d508.mjs node --test apps/directadmin/workforce/tests/*.test.mjs apps/directadmin/workforce/tests/sdk-contract.integration.mjs apps/directadmin/workforce/tests/hosted-sdk.integration.mjs`
passed **39/39**. `packages/titan-platform/tests/directadmin-bridge.test.mjs`
passed **83/83** from the same main source, including #1243 rejected replacement
session versus registry outage handling. The extracted relay-to-host run from
exact main `d508a269` sources passed 14 relay-module requests / 15 hosted
routes. With no relay configuration, the extracted module's production default
returned sanitized 503 `relay_not_configured`; fixture forwarding injected a
fake config loader into the module in-process. It used no config file or CGI
environment setting to enable forwarding and did not spawn the production RAW
executable. The same test passed against the unmerged #812 draft PR #1245 source
at exact head `589658ef10cf4c66af5ebb574799f281b126ced5`, where the production
default returned sanitized 503 `cookie_boundary_unverified`. This is candidate
compatibility evidence only, not an Apache, DirectAdmin CGI, production
identity or commissioning proof.

Current main still contains the experimental Apache `:443` filter, which fails
open when the Titan cookie is split across duplicate physical `Cookie` headers.
Draft PR #1245 removes the filter and disables production forwarding; it is not
merged and offers no working production relay contract. The 39/39 cockpit
result is local evidence; the secretless Node 22 hosted CI job belongs with
active #1157 owner `agent/issue-1157` and was not edited here.


## Relay status after #1245 merge — 2026-10-02

#812 follow-up PR #1245 merged at `faab3c5c9bdfd90179d5d3bfee21c479dceb3613`.
It removed the experimental Apache `:443` cookie filter and disables production
RAW forwarding with sanitized `503 cookie_boundary_unverified`. The preceding
d508 candidate tests remain historical; the current #1050 follow-up rechecks its
package and extracted test seam against merged #1245. Neither the candidate nor
its test-only injection path is production-install-ready. Verify DirectAdmin CGI,
cookie isolation and the private Workforce transport on a commissioned disposable
host before enabling forwarding.
