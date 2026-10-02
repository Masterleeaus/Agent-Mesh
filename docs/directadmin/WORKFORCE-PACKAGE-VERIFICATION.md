# Titan Workforce package verification

This checklist verifies an artifact in a local workspace or disposable staging directory. It does not authorize copying it into DirectAdmin, enabling the plugin, creating credentials or changing a host.

## Build the SDK and package

Use the current canonical SDK source already integrated on `agent/issue-1050`. Node 22 or newer and the repository's locked dependencies are required.

```sh
node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/bin/esbuild \
  packages/titan-platform/src/directadmin-plugin.ts \
  --bundle --format=esm --platform=browser --target=es2022 \
  --outfile=/tmp/1050-sdk/current-sdk.mjs

node apps/directadmin/workforce/tools/package.mjs \
  --sdk-module /tmp/1050-sdk/current-sdk.mjs \
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

For this continuation, the package builder produced 19 files for plugin version **0.1.1** at:

`/tmp/1050-package-final/titan_workforce.tar.gz`

SHA256: `8fad0ede774ec0d6dc863384fbebf8b65f3000fc31b49f3b88c892ba237707c8`

The generated `.sha256` sidecar records the same value. Rebuild and refresh this record after any source change.

## Approved host update and rollback procedure

This is a procedure for a later, separately approved deployment; it has not been run.

1. Retain the currently installed package archive and its verified SHA256 outside the plugin directory.
2. Verify the candidate version in `plugin.conf` and compare the archive against its `.sha256` sidecar. Stage and run the checks above.
3. After host authorization and live owner APIs are ready, update through DirectAdmin Plugin Manager and verify each role route in read-only/uncommissioned mode.
4. If the package fails, restore the retained archive through DirectAdmin Plugin Manager and repeat read-only checks.
5. Keep runtime state, company storage, credentials, revocations and evidence under their canonical owners throughout. Never use plugin rollback to restore or delete them.

The role executable does not read DirectAdmin CGI stdin/environment values. The package test supplies hostile POST-like stdin and environment values and verifies they do not appear in the rendered page; this is an isolation test, not proof of a working DirectAdmin transport. Installed Dev Access 1.1.3 has a reported POST CSRF failure, and #1048 must verify the actual environment/stdin bridge before session bootstrap and POST intents can be commissioned.
