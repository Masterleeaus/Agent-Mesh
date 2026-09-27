# Findings

- `packages/tools/execution-gateway.mjs` previously accepted `raw.verified === true` without independent observation; its in-memory completed map did not suppress concurrent duplicate calls.
- `mcp-provider-contract.mjs` accepted tool-reported `verified`; `browser-node-contract.mjs` accepted executor-reported `verified`.
- These modules are referenced by their tests only in current main. They are contracts, not evidence that Zero or business services invoke real providers.
- A persistent idempotency store can now be injected but is not supplied by a production composition root. Persistence and recovery need Agent 1 coordination.
