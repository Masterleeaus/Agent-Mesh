# Workforce consumer to hosted-owner integration — #1050

This evidence records a bounded consumer integration run against the exact open
PR heads current at the time of execution. It is not a claim that those PRs are
merged, that the full hosted runtime is certified on `main`, or that #1050 is
complete.

## Pinned source and artifact

| Component | Source |
|---|---|
| Workforce SQLite owner, #1253 / `agent/issue-640` | `f6710e9d723e47d5dbda035309f9b8cd1de0cf4e` |
| Extracted owner source tree digest (sorted path, type, content; dependencies excluded) | `a998aa751d059de466b2dcefeb11e2282d19b67e4432e73b890f858da3fd67d1` |
| Shared DirectAdmin SDK and gateway, #1252 / `agent/issue-1049` | `aff115212281fb555d0c7bc804635e88713f2ec5` |
| Compiled, minified SDK bundle used by the test | SHA256 `f8ac44484b2285293cffe74903053d607414e12d3e6b428045ac42092ec84961` |

`tests/actual-owner.integration.mjs` requires both recorded commit IDs and
checks the extracted owner source tree digest and compiled SDK bundle hash
before it runs. It composes the actual
`createWorkforceServer`, SQLite workforce store, company placement/store
adapters, #302 identity registry and signed session credential APIs, #1049
gateway, and this cockpit's API/controller. The SQLite files, signing keys,
identities, workers, work, scoped grant, approval, and evidence are generated
only inside a disposable temporary directory for the test.

The test exercises:

- current company context and the actual owner projection's
  `required_capabilities` field;
- a governed reassignment submitted through the compiled shared SDK and actual
  server route, with a signed #302-derived Workforce child session;
- distinct `REQUESTED` ingress receipt and refreshed canonical `VERIFIED`
  evidence read from the SQLite ledger, including company, actor, work, and
  child-session lineage;
- replay of the same operation without a second event or evidence record;
- access revocation after projection but before submission, mapped by the
  shared SDK to a sanitized 403 with no effect;
- an actual SQLite stale-assignee compare-and-set race with no overwrite or
  accepted evidence; and
- company switching that clears company A state and reads only company B data,
  with no inherited control or authority.

It does not provision production identities or credentials, call a live
DirectAdmin host, modify security settings, or deploy a server. The test
currently does not assert end-to-end `AbortSignal` cancellation. #1252's latest
source forwards cancellation to owners, but that path needs its own integration
assertion before it is marked verified here.

## Reproduction

Run from a checkout with the repository's Node dependencies installed, Node
22.23.3, and the two PR refs resolving to the pinned commits. If either PR has
advanced, stop and update the evidence and pin deliberately instead of testing
an unrecorded source combination.

```sh
owner_head=f6710e9d723e47d5dbda035309f9b8cd1de0cf4e
sdk_head=aff115212281fb555d0c7bc804635e88713f2ec5
git fetch origin refs/pull/1253/head:refs/1050/pr-1253
test "$(git rev-parse refs/1050/pr-1253)" = "$owner_head"
git fetch origin refs/pull/1252/head:refs/1050/pr-1252
test "$(git rev-parse refs/1050/pr-1252)" = "$sdk_head"

work_area=/tmp/1050-owner-e2e
owner_root="$work_area/owner"
sdk_root="$work_area/sdk"
mkdir -p "$owner_root" "$sdk_root"
git archive "$owner_head" package.json packages/titan-platform packages/storage \
  pnpm-workspace.yaml packages/runtime packages/tools db/sqlite services/workforce \
  | tar -xf - -C "$owner_root"
git archive "$sdk_head" packages/titan-platform | tar -xf - -C "$sdk_root"
ln -s "$PWD/packages/titan-platform/node_modules" \
  "$owner_root/packages/titan-platform/node_modules"
ln -s "$PWD/packages/storage/node_modules" "$owner_root/packages/storage/node_modules"
ln -s "$PWD/services/workforce/node_modules" "$owner_root/services/workforce/node_modules"
ln -s "$PWD/packages/titan-platform/node_modules" \
  "$sdk_root/packages/titan-platform/node_modules"

sdk_module="$work_area/directadmin-sdk.mjs"
node_modules/.pnpm/esbuild@0.27.3/node_modules/esbuild/bin/esbuild \
  "$sdk_root/packages/titan-platform/src/directadmin-plugin.ts" \
  --bundle --format=esm --platform=browser --target=es2022 --minify --outfile="$sdk_module"
test "$(sha256sum "$sdk_module" | cut -d' ' -f1)" = \
  f8ac44484b2285293cffe74903053d607414e12d3e6b428045ac42092ec84961

TITAN_WORKFORCE_OWNER_ROOT="$owner_root" \
TITAN_WORKFORCE_OWNER_COMMIT="$owner_head" \
TITAN_COCKPIT_SDK_MODULE="$sdk_module" \
TITAN_COCKPIT_SDK_COMMIT="$sdk_head" \
node --import ./node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/loader.mjs \
  --test apps/directadmin/workforce/tests/actual-owner.integration.mjs
```

The focused consumer and browser regression command uses the same compiled SDK
bundle:

```sh
TITAN_COCKPIT_SDK_MODULE="$sdk_module" \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
node --test apps/directadmin/workforce/tests/api.test.mjs \
  apps/directadmin/workforce/tests/controller.test.mjs \
  apps/directadmin/workforce/tests/browser.test.mjs \
  apps/directadmin/workforce/tests/sdk-contract.integration.mjs
```

The package candidate was also built with this SDK bundle. The archive contains
19 files, its manifest version is `0.1.5`, and its SHA256 is
`72cae867b1dc49fb1e9652daf5b896a280db05cdbcd9a605052f892c71fd095a`.
The sidecar checksum and extracted package/staging preflight passed. This is
package contract evidence; it does not replace installation and recovery tests
on an authorized DirectAdmin host.

## Results and boundaries

- Actual-owner integration: **6/6 passed**, including the parent test and five
  nested scenarios.
- API, controller, browser and compiled shared-SDK contract suite:
  **39/39 passed**. `sdk-contract.integration.mjs` uses explicit controlled
  owner/bridge fixtures and is not a substitute for the actual-owner test.
- The exact #1252 and #1253 sources are separate open draft branches. This
  disposable test composition proves the consumer contract against those
  source heads; it does not establish a published `main` composition or live
  runtime certification.
- Live identity provisioning, protected credential storage, commissioning,
  full #811 hosted runtime composition, DirectAdmin host installation, and the
  remaining #1050 acceptance scope are still outstanding. Keep #1050 open and
  this PR draft until those criteria are independently proved.
