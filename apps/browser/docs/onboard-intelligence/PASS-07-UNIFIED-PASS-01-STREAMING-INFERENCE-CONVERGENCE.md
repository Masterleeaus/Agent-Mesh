# Pass 07 / Unified Plan Pass 01 — Streaming Inference Convergence

## Goal

Extend the existing Pass 06 inference RPC/offscreen stack into real bounded incremental streaming without introducing a parallel transport or host.

## Implemented

- Added `src/intelligence/streaming.js` as the single bounded stream normalizer.
- Accepts async iterables, WHATWG `ReadableStream`, sync iterables, strings and byte chunks.
- Adds incremental SSE framing with `[DONE]`, malformed-frame and truncated-tail handling.
- Enforces byte, chunk-count and per-chunk bounds.
- Offscreen `stream` operations emit `INTELLIGENCE_STREAM_EVENT` messages while retaining the original final RPC response.
- Stream events carry exact `requestId`, `sessionId`, chunk index and total-byte metadata.
- `createChromeClient().stream(..., {onChunk})` filters events by exact request/session identity and removes the listener in `finally`.
- No keepalive timer, duplicate scheduler, new authority surface or plan-advance capability was introduced.

## Donor-first reuse

The bounded stream/SSE safety model is adapted from Auto Browser v1.4.2 `sse-stream.js` and `sse.js`; the existing Pass 06 single-funnel RPC pattern remains canonical.

## Authority

Streaming model output remains advisory. This pass transports output only and does not authorize tools, mutations, plan advancement, canonical promotion, Supervisor verdicts or Librarian decisions.
