# Titan Workforce package verification

This checklist verifies an artifact in a local workspace or disposable staging directory. It does not authorize copying it into DirectAdmin, enabling the plugin, creating credentials or changing a host.

## Build the SDK and package

Use the current canonical SDK published on #1049 / PR #1204. The recorded build uses exact owner head `6300a4eb54ef008b1742fa9dbf5897535c518305`; no shared SDK implementation is copied into the Workforce plugin. Node 22 or newer and the repository's locked dependencies are required.

```sh
work_area=/tmp/1050-sdk-source
mkdir -p "$work_area"
git archive 6300a4eb54ef008b1742fa9dbf5897535c518305 packages/titan-platform \
  | tar -xf - -C "$work_area"
ln -s "$PWD/packages/titan-platform/node_modules" \
  "$work_area/packages/titan-platform/node_modules"
node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/bin/esbuild \
  "$work_area/packages/titan-platform/src/directadmin-plugin.ts" \
  --bundle --format=esm --platform=browser --target=es2022 \
  --outfile=/tmp/1050-sdk/upstream-1049-current.mjs

node apps/directadmin/workforce/tools/package.mjs \
  --sdk-module /tmp/1050-sdk/upstream-1049-current.mjs \
  --output-dir /tmp/1050-package-final

sha256sum /tmp/1050-package-final/titan_workforce.tar.gz
cat /tmp/1050-package-final/titan_workforce.tar.gz.sha256
```

The builder rejects symlinks, requires canonical browser session and package-validator exports, includes an explicit 19-file allowlist, writes normalized ownership/time/modes, extracts and compares the result, invokes the shared SDK package validator and runs the install preflight in a temporary staging copy.

## Verify the final archive independently

```sh
set -eu
archive=/tmp/1050-package-final/titan_workforce.tar.gz
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
TITAN_COCKPIT_SDK_MODULE=/tmp/1050-sdk/current-sdk.mjs \
  node --test apps/directadmin/workforce/tests/*.test.mjs \
    apps/directadmin/workforce/tests/sdk-contract.integration.mjs \
    apps/directadmin/workforce/tests/hosted-sdk.integration.mjs
```

The hosted test exercises the real #302 fixture credential issuer/registry and #1049 bridge through a fixture-only Workforce owner. It proves transport and consumer behavior, not a deployed hosted API. Live DirectAdmin, commissioning, Evolution, production install/update/rollback and credential delivery require their separate owner contracts and approval.

## Current artifact record

For this continuation, the package builder consumed the exact #1049 SDK head above and produced 19 files for plugin version **0.1.4** at:

`/tmp/1050-package-final/titan_workforce.tar.gz`

SHA256: `b8bb62e0733ffe6b0ff2cd5a7c8e4ac762bb20077b3e2b5215fa9f2703d0b299`

The `.sha256` sidecar records the same value; rebuild and refresh this record after any source change.

## Approved host update and rollback procedure

This is a procedure for a later, separately approved deployment; it has not been run.

1. Retain the currently installed package archive and its verified SHA256 outside the plugin directory.
2. Verify the candidate version in `plugin.conf` and compare the archive against its `.sha256` sidecar. Stage and run the checks above.
3. After host authorization and live owner APIs are ready, update through DirectAdmin Plugin Manager and verify each role route in read-only/uncommissioned mode.
4. If the package fails, restore the retained archive through DirectAdmin Plugin Manager and repeat read-only checks.
5. Keep runtime state, company storage, credentials, revocations and evidence under their canonical owners throughout. Never use plugin rollback to restore or delete them.

The role executable does not read DirectAdmin CGI stdin/environment values. The package test supplies hostile POST stdin and DA request environment values and verifies they do not appear in the rendered page; this is an isolation test, not proof of a working DirectAdmin transport. Installed Dev Access 1.1.3 has a reported POST CSRF failure; #1048 must certify its own Developer Portal form path, while Workforce separately needs #812/#1049 route wiring and live DirectAdmin transport/session tests.

## Install readiness

**Can execute now:** package build, deterministic archive/checksum validation, staged install/update/uninstall preflight, and each role script as a CLI renderer. DirectAdmin's documented `pipe_post=yes` mode supplies `POST=stdin=true` and POST bytes on stdin; the packaged role process has been exercised with these values and ignores request data safely. Install/update scripts only preflight and do not mutate a host.

**Published on open draft PRs but not commissioned:** #811/#1201 contains the company-filtered read-only projection owner and optional `/v1/directadmin/*` Fetch mount. The current projection has `controls: []`; proposed lifecycle intents are denied without state, event or receipt writes. #1050 now imports the exact #812 helper path and sends it through the published RAW endpoint. A disposable extracted-package → RAW → #811 host run proved projection reads, company switch, invalid-CSRF and expiry denial. That run also found an owner-boundary mismatch: the #812 intent parser rejects the canonical #1049 `context_revision` before forwarding. The host owner independently denied the same valid context/action without writes when called directly. See the reproducible test and precise owner handoff below. Neither upstream PR is merged or live-certified. No Apache `443` shortcut is assumed, and no private token belongs in a URL.

### Disposable extracted relay-to-host integration

This test packages the exact pinned owner sources, extracts all three owner packages, and uses only temporary SQLite files, a generated localhost TLS certificate, and the actual #1049 signed identity test fixture. It is not live-host or production-session certification. The owner snapshots used for the recorded run were #1049 `6300a4eb54ef008b1742fa9dbf5897535c518305`, #811 `d5a84e40fafc4696c730334610e8f29703a5d1ff` and #812 `9ffef58d51f0c7a0a9cfcf0e619f6bc0440508ef`.

```sh
work_area=/tmp/1050-extracted-integration
mkdir -p "$work_area/host" "$work_area/server-node" "$work_area/sdk"
git archive d5a84e40fafc4696c730334610e8f29703a5d1ff \
  package.json services/workforce packages/storage packages/titan-platform \
  packages/runtime packages/tools db/sqlite | tar -xf - -C "$work_area/host"
git archive 9ffef58d51f0c7a0a9cfcf0e619f6bc0440508ef \
  apps/directadmin/server-node scripts/package-directadmin-plugin.mjs \
  | tar -xf - -C "$work_area/server-node"
git archive 6300a4eb54ef008b1742fa9dbf5897535c518305 packages/titan-platform \
  | tar -xf - -C "$work_area/sdk"
ln -s "$PWD/packages/titan-platform/node_modules" \
  "$work_area/sdk/packages/titan-platform/node_modules"

node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/bin/esbuild \
  "$work_area/sdk/packages/titan-platform/src/directadmin-plugin.ts" \
  --bundle --format=esm --platform=browser --target=es2022 \
  --outfile=/tmp/1050-sdk/upstream-1049-current.mjs

TITAN_WORKFORCE_HOST_ROOT="$work_area/host" \
TITAN_SERVER_NODE_SOURCE_ROOT="$work_area/server-node" \
TITAN_COCKPIT_SDK_MODULE=/tmp/1050-sdk/upstream-1049-current.mjs \
TITAN_HOST_SDK_MODULE=/tmp/1050-sdk/upstream-1049-current.mjs \
TITAN_BRIDGE_FIXTURE_MODULE="$work_area/sdk/packages/titan-platform/tests/fixtures/directadmin-bridge-fixture.mjs" \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
node --import ./node_modules/.pnpm/tsx@4.23.15/node_modules/tsx/dist/loader.mjs \
  apps/directadmin/workforce/tests/relay-host.integration.mjs
```

The extracted integration test passed: missing relay config returned sanitized 503 before reaching #811; actual Workforce package/helper/RAW route read company A's canonical workers, work and evidence with controls empty; invalid CSRF was rejected; company switch exposed only company B; expiry cleared the client projection. A governed pause proposal passed #812's `ctx1_` validation, reached the actual #811 owner and returned #1049's sanitized 403 denial. SQLite work/events remained unchanged. The test uses the #1049 signed identity/nonce fixture and inserts its CSRF meta value into the disposable panel HTML only to exercise transport; it does not prove the commissioned production HTML bootstrap, protected identity provisioning, cookie-port sharing or live DirectAdmin HEADERS path.

**Unavailable until owners commission and verify it:** the #302-backed #1049 production actor/company/CSRF bridge and trusted nonce bootstrap, approved audience-bound Workforce handoff, corrected #812 context-revision relay validation, and real DirectAdmin admin/reseller/user installation, POST, Evolution theme, update, rollback and session tests. The package never injects caller identity or CSRF data. The CGI CLI parser in #1048 Developer Portal is specific to that plugin and does not supply Workforce identity or routes.
