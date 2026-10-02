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

For this continuation, the package builder produced 19 files for plugin version **0.1.3** at:

`/tmp/1050-package-final/titan_workforce.tar.gz`

SHA256: `7306d5db900d752da1ddbdbb9efce39916e15c35fb8cfbce9b6da567c5bd54f8`

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

**Published on open draft PRs but not commissioned:** #811/#1201 now contains the company-filtered read-only projection owner and optional `/v1/directadmin/*` Fetch mount. The current projection has `controls: []`; proposed lifecycle intents are denied without state, event or receipt writes. It is not merged to main or live-certified. #812 has assigned the official DirectAdmin RAW plugin ingress relay and strict `headers_to_env` / `pipe_post` parsing to existing PR #1211, with #1049 reviewing transport security. Await its exact path/header contract before changing this consumer's URL mapping. No Apache `443` shortcut is assumed, and no private token belongs in a URL.

**Unavailable until owners commission and verify it:** trusted DirectAdmin session-to-HTTP-Request adaptation, the #302-backed #1049 actor/company/CSRF bridge and nonce bootstrap, the approved audience-bound Workforce handoff, same-origin `/v1/directadmin/...` panel routing, and real DirectAdmin admin/reseller/user installation, POST, Evolution theme, update, rollback and session tests. The package never injects caller identity or CSRF data. The CGI CLI parser in #1048 Developer Portal is specific to that plugin and does not supply Workforce identity or routes.
