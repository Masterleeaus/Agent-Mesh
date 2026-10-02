# Titan Workforce package verification

This checklist verifies a **packaging candidate** in a local workspace or disposable staging directory. The archive is **not live-install-ready** and this checklist does not authorize copying it into DirectAdmin, enabling the plugin, creating credentials or changing a host.

## Build the SDK and package

Use the canonical SDK source from #1049 implementation head `e428b67b34779e49f4dbc8d3e80b193e8737eb13`. Current PR #1204 head `2e41044b9760b8c3c85e34009f353c2f2876f7ce` merges main; that merge changes only the root README, not `packages/titan-platform`. No shared SDK implementation is copied into the Workforce source. Node 22 or newer and the repository's locked dependencies are required.

```sh
work_area=/tmp/1050-sdk-e428
source_area=/tmp/1050-workforce-source
rm -rf "$work_area" "$source_area" /tmp/1050-sdk-e428.mjs
mkdir -p "$work_area" "$source_area"
git archive e428b67b34779e49f4dbc8d3e80b193e8737eb13 packages/titan-platform \
  | tar -xf - -C "$work_area"
ln -s "$PWD/packages/titan-platform/node_modules" \
  "$work_area/packages/titan-platform/node_modules"
node_modules/.pnpm/esbuild@0.27.3/node_modules/esbuild/bin/esbuild \
  "$work_area/packages/titan-platform/src/directadmin-plugin.ts" \
  --bundle --format=esm --platform=browser --target=es2022 \
  --outfile=/tmp/1050-sdk-e428.mjs

git archive HEAD apps/directadmin/workforce | tar -xf - -C "$source_area"
node apps/directadmin/workforce/tools/package.mjs \
  --source-dir "$source_area/apps/directadmin/workforce" \
  --sdk-module /tmp/1050-sdk-e428.mjs \
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
TITAN_COCKPIT_SDK_MODULE=/tmp/1050-sdk-e428.mjs \
  node --test apps/directadmin/workforce/tests/*.test.mjs \
    apps/directadmin/workforce/tests/sdk-contract.integration.mjs \
    apps/directadmin/workforce/tests/hosted-sdk.integration.mjs
```

The hosted test exercises the real #302 fixture credential issuer/registry and #1049 bridge through a fixture-only Workforce owner. It proves transport and consumer behavior, not a deployed hosted API. Live DirectAdmin, commissioning, Evolution, production install/update/rollback and credential delivery require their separate owner contracts and approval.

## Current artifact record

For this continuation, the package builder consumed the exact #1049 SDK source above and produced a 19-file **verification candidate** for plugin version **0.1.4** at:

`/tmp/1050-package-candidate/titan_workforce.tar.gz`

SHA256: `5a1661b443980025d204c77becde2bcf30fd544d81a8c47d6cb3973a2b8c5c8b`

Bundled SDK module SHA256: `c45d611fbdee263cd248e4c7f9736bbe64fa80d1b7cadb19c022e27fa970db95`.
The final candidate is rebuilt twice byte-for-byte from the canonical #1050 branch source and this exact #1049 source. The archive contains the compiled SDK module with the same SHA256 shown above. It is not certified for a live DirectAdmin install.

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

**Can execute now:** package build, deterministic archive/checksum validation, staged install/update/uninstall preflight, and each role script as a CLI renderer. DirectAdmin's documented `pipe_post=yes` mode supplies `POST=stdin=true` and POST bytes on stdin; the packaged role process has been exercised with these values and ignores request data safely. Install/update scripts only preflight and do not mutate a host. None of this makes the archive live-install-ready.

**Merged but not commissioned:** #811/#1201 is in current main `3193441f` with the company-filtered read-only projection owner and optional `/v1/directadmin/*` Fetch mount. The current projection has `controls: []`; proposed lifecycle intents are denied without state, event or receipt writes. #1050 imports #812's helper path and sends through the RAW endpoint. The extracted-package → RAW → #811 host run used #812 `8cae7034` and #1049 SDK source `e428b67b`; it passed `ctx1_` validation, projection reads, company switch, isolated invalid-CSRF denial and cookie clearing, typed action 403 while preserving the valid session, and expiry handling without work/event writes. The Workforce controller revalidates after an intent-route denial; post-acceptance read failures remain cleared and direct the operator to inspect canonical history. This is disposable integration evidence, not commissioning. Current main contains #812 commit `89ff2427` with experimental relay config v2 and an Apache `:443` cookie-boundary marker/template; this run predates that contract and does not test or attest the marker. Independent contract review and real disposable Apache/DirectAdmin testing are required before adoption. Do not treat the marker as proof of cookie isolation. #1049 remains an open draft; #812/PR #1211 is merged but its live-host commissioning remains unverified. No private token belongs in a URL.

### Disposable extracted relay-to-host integration

This test packages the exact pinned owner sources, extracts all three owner packages, and uses only temporary SQLite files, a generated localhost TLS certificate, and the actual #1049 signed identity test fixture. It is not live-host or production-session certification. The owner snapshots used for the current recorded run are #1049 SDK source `e428b67b34779e49f4dbc8d3e80b193e8737eb13` (current PR head `2e41044` is a merge that only changes the root README), #811 merged code baseline `14163faa316ac6236e88167b7c8d8a5e95007c7e` (reviewed source head `25005f4f4d860e2ec1dddb9f0a2c4aa152fd0488`), and #812 tested head `8cae7034f6d2ec7c9063ac0c3aba40c6f41b3d89`. Current main contains merged #812 commit `89ff2427` with experimental config v2 and an Apache cookie-boundary marker/template; this test does not validate that new contract.

```sh
work_area=/tmp/1050-extracted-integration
rm -rf "$work_area"
mkdir -p "$work_area/host" "$work_area/server-node" "$work_area/sdk"
git archive 14163faa316ac6236e88167b7c8d8a5e95007c7e \
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

The extracted integration test passed: missing relay config returned sanitized 503 before reaching #811; actual Workforce package/helper/RAW route read company A's canonical workers, work and evidence with controls empty; invalid CSRF was denied and cleared only the isolated test cookie; company switch exposed only company B; expiry cleared the client projection. A governed pause proposal passed #812's `ctx1_` validation, reached the actual #811 owner and returned #1049's sanitized 403 denial while preserving the valid browser session. SQLite work/events remained unchanged. Result: 14 RAW requests and 15 hosted routes. The test uses the #1049 signed identity/nonce fixture and inserts its CSRF meta value into disposable panel HTML only to exercise transport; it does not prove the commissioned production HTML bootstrap, protected identity provisioning, cookie-port sharing or live DirectAdmin `HEADERS` path. It predates merged #812 commit `89ff2427` and does not test that commit's config-v2/Apache cookie-boundary contract. The exact runtime setup used the official Node v22.23.3 tarball SHA256 `df450af89261115ef9f9e3830c3eeb2cc9213b63c720b1af623cb5dcbe2e02de`, the published `better-sqlite3@12.11.1` Node ABI 127 prebuild via `prebuild-install@7.1.3`, and a successful targeted `npm rebuild` reusing that prebuild; no node-gyp compile or supply-chain policy change was made.

**Unavailable until owners commission and verify it:** the #302-backed #1049 production actor/company/CSRF bridge and trusted nonce bootstrap, approved audience-bound Workforce handoff, and real DirectAdmin admin/reseller/user installation, POST, Evolution theme, update, rollback and session tests. The package never injects caller identity or CSRF data. The CGI CLI parser in #1048 Developer Portal is specific to that plugin and does not supply Workforce identity or routes.
