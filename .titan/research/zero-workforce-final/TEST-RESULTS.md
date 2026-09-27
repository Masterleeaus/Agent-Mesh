# Test results

- `git diff --check`: passed.
- `node --test packages/runtime/agent-runtime/tests/agent-runtime.test.mjs services/workforce/src/index.test.ts`: failed (9 passed, 4 failed). Runtime failures: multi-turn tool test reads an undefined result; `InMemoryRunStore.recoverable` passes `structuredClone` directly to `map`, which receives an invalid second argument; unverified outcome throws instead of returning the test's expected failed run. Workforce TypeScript source test imports a nonbuilt `index.js`, so it requires its package build/test runner.
- Web typecheck and integration test unavailable in this checkout because workspace dependencies are not installed. Database-backed pulse query requires a configured web DB to verify live behavior.

These failures predate this pass and are not proof of a complete end-to-end loop.
