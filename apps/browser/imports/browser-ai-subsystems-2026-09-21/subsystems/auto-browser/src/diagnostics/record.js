// Glue between the raw collector and the service-worker message handlers.
// Two small helpers, kept pure + dependency-injected so background.js stays
// easy to trace and both behaviours are unit-testable without a Chrome stub.
//
// Why these live here, not inline in background.js:
//   - Percentile integrity depends on NOT recording instant-failure samples.
//     computer() returns `{error}` for validation failures, unknown actions,
//     and driver throws (see src/actions/computer.js outer try/catch) — so
//     "skip on exception" is insufficient. Recording is gated on the result
//     shape, which is a tiny but load-bearing predicate that deserves a test.
//   - Incognito isolation is a first-class invariant in this codebase
//     (PR #15 audit #2 — chrome.storage.local is shared across normal and
//     incognito modes, so every persist path is gated by shouldPersist()).
//     Runtime diagnostics carry strictly less sensitive data (action names,
//     millisecond timings, parse-failure reason strings) but surfacing them
//     across modes still signals "this extension peeks between tabs", which
//     conflicts with the PR's "never leaves the device" framing. Two
//     collectors keyed on the existing `incognitoTabs` set match the same
//     boundary without introducing a new gating primitive.

/**
 * Record a tool's latency ONLY when the result is a success payload. Used
 * by background.js around CDP dispatches (computer / future nav / evaluate)
 * whose functions normalize all failure modes into `{error: string}`.
 */
export function recordToolLatencyIfOk(collector, category, elapsedMs, result) {
  if (!result || result.error) return;
  collector.recordLatency(category, elapsedMs);
}

/**
 * Pick the collector for a given tab. Incognito tabs route to their own
 * in-memory collector so a normal-window Diagnostics card never surfaces
 * activity that happened in a private session — matching the persist-gate
 * boundary established in PR #15 audit #2.
 *
 * Falls back to the normal collector when tabId is missing or non-integer
 * (unknown sender → treat as normal; we don't drop events silently on the
 * floor, and we don't route-by-accident to incognito).
 */
export function selectCollectorForTab({ tabId, incognitoTabs, collectors }) {
  if (!Number.isInteger(tabId)) return collectors.normal;
  return incognitoTabs.has(tabId) ? collectors.incognito : collectors.normal;
}
