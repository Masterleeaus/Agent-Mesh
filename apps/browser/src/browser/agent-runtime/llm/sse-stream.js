/**
 * Drives an SSE response body through the event decoder.
 *
 * The provider adapters differ only in the envelope they read out of each
 * event. Everything around that — reader lifecycle, framing, termination, and
 * the rules for refusing to finalize — lives here once, so the providers cannot
 * drift into three subtly different behaviours under a hostile stream. That
 * drift is exactly what let a terminal error frame slip past one adapter's
 * guard while the other two had no guard at all.
 *
 * Kept apart from `sse.js` so the grammar there stays pure and synchronous;
 * this module is the part that owns I/O.
 *
 * The driver reports HOW the stream ended but never decides whether the model
 * turn succeeded — that is the provider's envelope to read. It only guarantees
 * that anything it hands back was framed, decoded, and terminated cleanly.
 */

import { createSseDecoder } from "./sse.js";
import { parseProviderJson, createJsonBudget, isJsonBudgetError } from "./http-failure.js";

/**
 * Bounds the whole stream, not one event: a peer can otherwise emit unlimited
 * valid sub-cap events. Counted in RAW BYTES, because every other unit leaves
 * a free channel — comments, `id:`, `event:`, unknown fields, delimiters and
 * empty `data` events all cost nothing to a payload-character count while
 * still costing us network and decoder work.
 *
 * Sized well above a real completion: the largest output windows here are tens
 * of thousands of tokens, and even with per-event JSON envelope overhead that
 * stays an order of magnitude below this.
 */
const DEFAULT_MAX_STREAM_BYTES = 32_000_000;

/**
 * A stream silent this long is stuck, not thinking. Generous on purpose:
 * time-to-first-token on a reasoning model is genuinely minutes, and a false
 * timeout would kill working turns. Without any bound an unattended agent waits
 * forever, because fetch has no application deadline.
 */
const DEFAULT_IDLE_TIMEOUT_MS = 180_000;

/**
 * Decode a chunk in slices of this size.
 *
 * `push()` returns every event in what it is given, so one large chunk of tiny
 * events materializes them all before the driver looks at the first — a valid
 * 7 MB body of empty `data:` frames became a million live objects, well under
 * the byte bound. Slicing bounds that fan-out without capping how many events a
 * legitimate long generation may emit.
 */
const DECODE_SLICE_BYTES = 64 * 1024;

/**
 * Structural limits for a STREAM, which are far tighter than a whole body's.
 *
 * Measured against the real worst case rather than guessed: a Gemini frame is
 * 12 nodes and an OpenAI-compatible one 11, so the largest output ceiling here
 * (65,536 tokens) is ~0.79M nodes for a complete legitimate response. The
 * cumulative allowance sits above that with room to spare; the per-frame one is
 * still ~800x a real frame while making a single-frame bomb impossible.
 *
 * A whole body keeps the looser document limit — the model catalog is one
 * legitimate response in the tens of thousands of nodes.
 */
const SSE_JSON_LIMITS = { maxNodes: 10_000, maxResponseNodes: 1_250_000 };

function isPlainOptions(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Providers return this from `onPayload` to end the stream with a result. */
export function stopWith(result) {
  return { stop: true, result };
}

/**
 * Providers return this once the envelope states the generation stopped, for
 * protocols with no closing marker of their own. Reading on past that point
 * lets anything a server appends afterwards concatenate onto — and corrupt — a
 * decision that was already complete.
 */
export function endStream() {
  return { halt: true };
}

async function readWithIdleTimeout(reader, idleTimeoutMs) {
  if (!(idleTimeoutMs > 0)) return reader.read();
  let timer;
  try {
    return await Promise.race([
      reader.read(),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve({ idleTimeout: true }), idleTimeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Drain `response.body`, handing each committed event's parsed JSON to
 * `onPayload`. Returning `stopWith(x)` from it ends the stream early and
 * surfaces `x`; returning nothing continues.
 *
 * Resolves to `{ stopped, result, termination, failure }`.
 *
 * `failure` non-null means the stream itself was untrustworthy and the caller
 * must report rather than finalize. `termination` distinguishes a protocol
 * closing marker from a bare EOF, which callers need because an EOF alone does
 * not say the model finished — only that the socket did.
 */
export async function drainSseStream(response, {
  onPayload,
  maxEventChars,
  maxStreamBytes = DEFAULT_MAX_STREAM_BYTES,
  jsonLimits,
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
}) {
  // Validated before the lock is taken, for the same reason the decoder is:
  // a bound that silently stops bounding is worse than no bound, because the
  // caller believes it is protected. NaN and Infinity make every comparison
  // false; a non-number disables the timer outright.
  if (!Number.isSafeInteger(maxStreamBytes) || maxStreamBytes <= 0) {
    throw new RangeError(
      `maxStreamBytes must be a positive safe integer, received ${String(maxStreamBytes)}`,
    );
  }
  // 0 is the explicit "no deadline" sentinel; anything else must be a real
  // delay a timer can hold without clamping.
  if (!Number.isInteger(idleTimeoutMs) || idleTimeoutMs < 0 || idleTimeoutMs > 2_147_483_647) {
    throw new RangeError(
      `idleTimeoutMs must be an integer in 0..2147483647, received ${String(idleTimeoutMs)}`,
    );
  }
  const sse = createSseDecoder(maxEventChars === undefined ? undefined : { maxEventChars });
  // One allowance for the whole response: per-frame limits bound each parse,
  // but not how much a stream of individually-legal frames allocates.
  // Per-property defaults, not a spread: `{maxNodes: undefined}` under a
  // spread overwrites the tuned value with undefined and restores the generic
  // whole-body limits, which is the opposite of what passing it looks like.
  if (jsonLimits !== undefined && !isPlainOptions(jsonLimits)) {
    throw new RangeError(`jsonLimits must be an object, received ${String(jsonLimits)}`);
  }
  const {
    maxNodes = SSE_JSON_LIMITS.maxNodes,
    maxDepth,
    maxResponseNodes = SSE_JSON_LIMITS.maxResponseNodes,
  } = jsonLimits ?? {};
  const jsonBudget = createJsonBudget({ maxNodes, maxDepth, maxResponseNodes });
  // Fatal, because the alternative is silent substitution. A replacement
  // character lands inside a selector or a URL and we dispatch the rewritten
  // action without ever knowing the bytes were wrong.
  const textDecoder = new TextDecoder("utf-8", { fatal: true });
  const reader = response.body.getReader();

  const failed = (failure) => ({ stopped: false, result: null, termination: null, failure });
  const ended = (termination) => ({ stopped: false, result: null, termination, failure: null });
  let streamBytes = 0;

  try {
    for (;;) {
      const next = await readWithIdleTimeout(reader, idleTimeoutMs);
      if (next.idleTimeout) return failed("idle_timeout");
      const { done, value } = next;
      if (!done) {
        // Charged before decoding, so protocol scaffolding counts too.
        streamBytes += value?.byteLength ?? 0;
        if (streamBytes > maxStreamBytes) return failed("stream_limit");
      }

      // Flushing at EOF is what surfaces a truncated multi-byte sequence. Left
      // unflushed, the dangling bytes simply vanish and a cut stream reads as
      // cleanly finished. Decoded in slices so one chunk of tiny events cannot
      // fan out into an unbounded number of live event objects.
      const slices = [];
      try {
        if (done) {
          slices.push(textDecoder.decode());
        } else {
          for (let at = 0; at < value.byteLength; at += DECODE_SLICE_BYTES) {
            const end = Math.min(at + DECODE_SLICE_BYTES, value.byteLength);
            slices.push(textDecoder.decode(value.subarray(at, end), { stream: true }));
          }
        }
      } catch {
        return failed("invalid_utf8");
      }

      for (const text of slices) {
        for (const event of sse.push(text)) {
          if (event.overflowed) return failed("truncated");

          const payload = event.data.trim();
          if (!payload) continue;
          // The closing marker ends the turn. Skipping it instead leaves us
          // parked in read() against a server that has nothing left to send
          // and may never close the socket.
          if (payload === "[DONE]") return ended("done");

          let parsed;
          try {
            parsed = parseProviderJson(payload, jsonBudget);
          } catch (err) {
            // A structural limit is a size failure, not a corrupt frame.
            if (isJsonBudgetError(err)) return failed("stream_limit");
            // Every non-marker frame these endpoints define is JSON. One we
            // cannot read may be the terminal error itself, so it must not be
            // skipped while accumulated content stays eligible to dispatch.
            return failed("malformed_json");
          }

          const outcome = onPayload(parsed);
          if (outcome?.stop) return { stopped: true, result: outcome.result, termination: null, failure: null };
          if (outcome?.halt) return ended("halted");
        }
      }

      if (done) return sse.hasIncompleteTail() ? failed("truncated") : ended("eof");
    }
  } finally {
    try {
      // Deliberately not awaited. The result is already decided, and a cancel
      // promise that never settles must not hold it hostage.
      Promise.resolve(reader.cancel()).catch(() => {});
    } catch {
      // cancel() can throw synchronously on an already-errored stream.
    } finally {
      // cancel() does NOT release the lock; only this does.
      try {
        reader.releaseLock();
      } catch {
        // A read is still pending (idle timeout) — the body is being cancelled.
      }
    }
  }
}
