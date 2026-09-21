// Runtime diagnostics collector — pure, in-memory.
//
// Phase 0.3 from the SOTA adoption plan: surface timing and failure data
// that already flows through the service worker and content script, so the
// user (and we, during development) can see WHY a turn feels slow without
// shipping telemetry off the device.
//
// Scope discipline:
//   - In-memory only. Never writes to chrome.storage — the data is ephemeral
//     and resets with the service worker (which is fine: MV3 SW lifetime is
//     naturally scoped to "recent activity" anyway).
//   - Bounded. Each latency category retains at most `maxSamplesPerCategory`
//     samples (default 500) on a FIFO basis. Percentiles are computed on
//     read against the current window.
//   - Pure. No chrome.*, no fetch, no DOM, no Date.now() — the constructor
//     takes a `now()` dependency so tests can deterministically inject time.
//
// Public:
//   createDiagnosticsCollector({now?, maxSamplesPerCategory?}) → {
//     recordLatency(category, ms),
//     recordParseFailure(reason),
//     recordLLMAttempt(provider),
//     snapshot(),
//     reset(),
//   }
//
// Snapshot shape (what the sidebar renders):
//   {
//     started_at_ms:          number,
//     uptime_ms:              number,
//     latency: {
//       "computer:click": { count, p50_ms, p95_ms, max_ms },
//       ...
//     },
//     parse_failures:         { "syntax-error": n, ... },
//     parse_failure_total:    number,
//     llm_attempts:           { "openrouter": n, "gemini": m, ... },
//     llm_attempt_total:      number,
//     parse_failure_rate:     number   // 0..1, parse_failure_total / llm_attempt_total
//                                       // (or 0 when llm_attempt_total === 0)
//   }
//
// `parse_failure_rate` is the §5.2 SOTA-roadmap metric: % of decision-
// expecting LLM calls that produced unparseable output. Native tool-use
// short-circuits parseContent on tool_call responses (no parse needed),
// so the rate trends down as the tool-use default takes hold. The
// denominator counts every LLM call where a parse was *expected* —
// rawText calls (compaction / summarization) don't increment it.

const DEFAULT_MAX_SAMPLES = 500;

export function createDiagnosticsCollector({
  now = () => Date.now(),
  maxSamplesPerCategory = DEFAULT_MAX_SAMPLES,
} = {}) {
  // latency: Map<category, number[]>  — each array is a sample window.
  let latency = new Map();
  // parse_failures: Map<reason, count>
  let parseFailures = new Map();
  // llm_attempts: Map<provider, count>  — denominator for parse_failure_rate
  let llmAttempts = new Map();
  let startedAt = now();

  function recordLatency(category, ms) {
    if (typeof category !== "string" || !category) return;
    if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return;
    const bucket = latency.get(category) || [];
    bucket.push(ms);
    if (bucket.length > maxSamplesPerCategory) {
      // FIFO drop — oldest sample leaves first so we keep "recent" latency,
      // not a static early slice. O(n) shift is fine for n ≤ 500.
      bucket.shift();
    }
    latency.set(category, bucket);
  }

  function recordParseFailure(reason) {
    const key = typeof reason === "string" && reason ? reason : "unknown";
    parseFailures.set(key, (parseFailures.get(key) || 0) + 1);
  }

  // Increment the denominator for parse_failure_rate. Called by the
  // content-script bridge once per LLM call where a structured decision
  // is expected (i.e. NOT for rawText compaction / summarization). The
  // provider id is the only dimension we slice on at this layer; the
  // eval harness (§5.1) is welcome to track finer (mode, model, role)
  // breakdowns in its own per-trajectory log without changing the
  // collector contract.
  function recordLLMAttempt(provider) {
    const key = typeof provider === "string" && provider ? provider : "unknown";
    llmAttempts.set(key, (llmAttempts.get(key) || 0) + 1);
  }

  function snapshot() {
    const ts = now();
    const latencyOut = {};
    // Stable key ordering so the sidebar renders the same layout across
    // consecutive polls — Object.keys enumerates in insertion order, and
    // Map iteration preserves that.
    for (const [category, samples] of latency.entries()) {
      if (samples.length === 0) continue;
      const sorted = samples.slice().sort((a, b) => a - b);
      latencyOut[category] = {
        count: samples.length,
        p50_ms: percentile(sorted, 0.5),
        p95_ms: percentile(sorted, 0.95),
        max_ms: sorted[sorted.length - 1],
      };
    }
    const parseFailureTotal = Array.from(parseFailures.values()).reduce(
      (s, n) => s + n,
      0,
    );
    const llmAttemptTotal = Array.from(llmAttempts.values()).reduce(
      (s, n) => s + n,
      0,
    );
    // Rate is undefined when there are no attempts; report 0 to keep the
    // shape stable for consumers (sidebar UI, eval reports). The total
    // is reported alongside so consumers can distinguish "0% across 1000
    // calls" from "0% across 0 calls".
    const parseFailureRate =
      llmAttemptTotal > 0 ? parseFailureTotal / llmAttemptTotal : 0;
    return {
      started_at_ms: startedAt,
      uptime_ms: Math.max(0, ts - startedAt),
      latency: latencyOut,
      parse_failures: Object.fromEntries(parseFailures),
      parse_failure_total: parseFailureTotal,
      llm_attempts: Object.fromEntries(llmAttempts),
      llm_attempt_total: llmAttemptTotal,
      parse_failure_rate: parseFailureRate,
    };
  }

  function reset() {
    latency = new Map();
    parseFailures = new Map();
    llmAttempts = new Map();
    startedAt = now();
  }

  return { recordLatency, recordParseFailure, recordLLMAttempt, snapshot, reset };
}

/**
 * Inclusive-index percentile over a pre-sorted ascending array. For the
 * tiny windows we deal with (≤ 500 samples), nearest-rank is plenty —
 * interpolation adds noise without adding signal.
 */
function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return 0;
  const clamped = Math.min(Math.max(p, 0), 1);
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.ceil(clamped * sortedAsc.length) - 1),
  );
  return sortedAsc[idx];
}
