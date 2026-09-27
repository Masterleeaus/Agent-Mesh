# Pass 03 — Browser Intelligence Host

Implemented a single extension-level Codee intelligence host. It registers provider-neutral runtimes through the Pass 2 contract and serializes inference per runtime so one loaded browser model can serve many Codee conversations without duplicate GPU allocations.

## Invariants

- Sessions are isolated by `sessionId` plus plan/run/tab/conversation identity.
- Duplicate `requestId` values fail closed.
- A session cannot silently change plan/run/tab/conversation ownership.
- Requests are queued with a bounded queue and one active inference per runtime.
- Cancelled requests reject stale model responses and cannot advance consumers.
- The host exposes bounded request/session/health/history diagnostics.
- The host does not grant AI any execution authority; all contexts retain the advisory authority floor from Pass 2.

This pass deliberately does not load WebLLM yet. Model/runtime integration belongs to later passes; this establishes the shared lifecycle and concurrency boundary first.
