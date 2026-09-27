# Test Results

## Pass 1

No tests are recorded as passing yet.

The repository connector used for this pass can inspect and modify GitHub content but does not execute the checkout locally. Existing tests were inspected, including the SQLite RunStore isolation/recovery test, but inspection is not execution.

Next pass will use available repository CI/check results where possible and add/adjust integration coverage before any success claim.

## Pass 2 executed

- `node --test packages/runtime/agent-runtime/tests/agent-runtime.test.mjs packages/runtime/agent-runtime/sqlite-run-store.test.mjs`: **14 passed, 0 failed** after fixes; includes file reopen, approval/external waits, terminal exclusion and company isolation.
- `pnpm install --frozen-lockfile`: failed (root `better-sqlite3` missing from lockfile).
- `pnpm install --no-frozen-lockfile`: failed due ignored native build scripts; generated lockfile drift reverted.
- `pnpm exec tsc --noEmit -p services/workforce/tsconfig.json`: blocked by pnpm install policy before typechecking.

## Pass 3 executed

- `node --import ./services/workforce/node_modules/tsx/dist/loader.mjs --test services/workforce/src/index.test.ts services/workforce/src/sqlite-store.test.ts`: **4 passed, 0 failed**. Direct Node loader avoids the restricted `/tmp` IPC socket used by the tsx CLI.
- `services/workforce/node_modules/.bin/tsc --noEmit -p services/workforce/tsconfig.json`: passed.

## Pass 4 executed

- `node --import ./node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/loader.mjs --test apps/web/lib/db/sqlite-params.test.ts`: **2 passed, 0 failed** using Node's SQLite implementation for real binding behavior.
- Web `tsc --noEmit`: fails on existing workspace/domain module resolution and missing `better-sqlite3` declarations, among broader errors. No web typecheck success claimed.
- Pinned pnpm 9 offline lockfile resolution: failed due uncached `object-assign` metadata. Lockfile remains unchanged.
