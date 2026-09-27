# Payload Performance Pass 02 — Retained vs Optional Classification

Manager directive TZ-MGR-DONOR-SLIM-M42-001 is applied against Merge 42.

## Retired now
- `monica-content.js` — exact duplicate of `content.js`; no live entrypoint/import/resource target.
- `monica-content.css` — exact duplicate of retained CSS equivalents; no live runtime target.
- `monica-background.js` — legacy donor copy; active compatibility boundary uses `titan-zero-chat-background.compat.js`.
- `TITAN-ZERO-LINEAGE-EVIDENCE.zip` — nested non-runtime evidence archive; provenance belongs in Agent Mesh/Manager archive, not extension payload.

## Protected now
Titan compatibility bundles, current routes, permission-hardening behavior, `compatibility/monica/background-runtime-boundary.mjs`, and `retriever-background.iife.js` remain retained. Phase-2 donor retirement remains blocked until Runtime Adapters is Manager-converged and a fresh reachability/equivalence scan passes.

This pass intentionally does not rewire `content.js`, `content.css`, popup donor bundles, or Retriever.
