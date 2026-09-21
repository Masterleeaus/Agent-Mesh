/**
 * Chrome Built-in AI (Prompt API) provider adapter.
 *
 * Contract: see src/llm/provider.js.
 *
 * Lifecycle choices (from plan):
 *   - FRESH session per call. We pass the conversation as `initialPrompts`,
 *     let the caller's signal abort `create()` and `promptStreaming()`, and
 *     `destroy()` the session as soon as the JSON is parsed.
 *   - Streaming uses `promptStreaming()` which returns a ReadableStream<string>.
 *     Chrome's chunk shape is either cumulative or delta depending on the
 *     channel — we run a prefix detector so the accumulator stays correct
 *     without a Chrome version check.
 *
 * Availability state taxonomy (normalised across Chrome vocabularies):
 *   - "ready"           ← Chrome "available"
 *   - "needs-download"  ← Chrome "downloadable" / "after-download"
 *   - "downloading"     ← Chrome "downloading"
 *   - "unsupported"     ← Chrome "unavailable", or LanguageModel global missing
 */

import { normalizeForBuiltIn, hasMultimodal } from "./messages.js";
import { parseContent } from "./parse-content.js";

export function createBuiltInAIProvider(_config = {}) {
  async function availability(opts = {}) {
    if (!hasRuntime()) return { state: "unsupported" };
    try {
      const chromeState = await LanguageModel.availability(
        availabilityOpts(opts),
      );
      return { state: mapChromeAvailability(chromeState), chromeState };
    } catch (err) {
      return { state: "unsupported", detail: err?.message };
    }
  }

  // onParseFailure gating (see provider.js contract): fatal-true callbacks
  // fire regardless of rawText (e.g. create-time QuotaExceededError below);
  // non-fatal parse callbacks only fire when rawText is falsy because raw-
  // text consumers (chat-only mode) skip parseContent and have nothing to
  // do with a "couldn't parse" signal.
  async function call({ messages = [], schema, signal, onToken, stream = true, rawText = false, onParseFailure } = {}) {
    if (!hasRuntime()) return null;

    const wire = await toWireMessages(messages);

    let session;
    try {
      session = await LanguageModel.create({
        signal,
        initialPrompts: shapeInitialPrompts(wire),
        expectedInputs: deriveExpectedInputs(wire),
      });
    } catch (err) {
      if (err?.name === "AbortError") return null;
      console.error("[BuiltInAI] create() failed:", err);
      // QuotaExceededError at create() means the INPUT (system prompt +
      // tools + history) is larger than Gemini Nano's context window — a
      // structural mismatch, not transient. Retrying with the same payload
      // will fail identically, so we mark the failure `fatal: true` and the
      // retry loop short-circuits to a user-facing "switch providers"
      // message instead of burning 3 attempts on the same red wall.
      //
      // Distinct from QuotaExceededError thrown DURING streaming (handled
      // by `readCumulativeStream` below), which signals OUTPUT budget hit
      // and IS recoverable via the terseness retry reminder.
      if (err?.name === "QuotaExceededError") {
        onParseFailure?.({
          raw: "",
          reason: "input_too_large",
          truncated: true,
          finishReason: "QuotaExceededError",
          fatal: true,
        });
      }
      return null;
    }

    try {
      const promptArgs = extractPromptInput(wire);
      const promptOpts = {};
      if (schema) promptOpts.responseConstraint = schema;
      if (signal) promptOpts.signal = signal;

      if (stream && typeof session.promptStreaming === "function") {
        const result = await readCumulativeStream(
          session.promptStreaming(promptArgs, promptOpts),
          onToken,
        );
        if (!result || result.text == null) return null;
        return finalizeText(result.text, { rawText, errorName: result.errorName, onParseFailure });
      }

      try {
        const text = await session.prompt(promptArgs, promptOpts);
        return finalizeText(text ?? null, { rawText, errorName: null, onParseFailure });
      } catch (err) {
        if (err?.name === "AbortError") return null;
        // Surface the error name (QuotaExceededError, NotReadableError, etc.)
        // so the retry loop can classify a truncated response even on the
        // non-streaming path, if the API ever threw after emitting text.
        console.error("[BuiltInAI] prompt() failed:", err);
        return null;
      }
    } catch (err) {
      if (err?.name === "AbortError") return null;
      console.error("[BuiltInAI] prompt failed:", err);
      return null;
    } finally {
      // session may be undefined if create() threw — optional chain the whole path.
      try { session?.destroy?.(); } catch { /* ignore */ }
    }
  }

  function finalizeText(text, { rawText, errorName, onParseFailure }) {
    if (text == null) return null;
    if (rawText) return text;
    // Built-in AI doesn't expose finish_reason — we infer truncation from
    // the Chrome Prompt API error name when the output budget is hit.
    const truncated = errorName === "QuotaExceededError" || errorName === "NotReadableError";
    return parseContent(text, (failure) => {
      const { raw, reason } = failure;
      console.warn("[BuiltInAI] parse failed:", reason, "errorName:", errorName, "— raw:", String(raw).slice(0, 500));
      // Forward the parser's whole failure, then layer provider context on
      // top: rebuilding it by hand dropped fields it had deliberately
      // attached, such as the real length behind a bounded prefix.
      onParseFailure?.({ ...failure, truncated, finishReason: errorName });
    });
  }

  async function toWireMessages(messages) {
    if (!hasMultimodal(messages)) {
      const { messages: out } = await normalizeForBuiltIn(messages, {
        supports: { image: true, audio: true },
      });
      return out;
    }
    const [supportsImage, supportsAudio] = await Promise.all([
      supportsModality("image"),
      supportsModality("audio"),
    ]);
    const { messages: out } = await normalizeForBuiltIn(messages, {
      supports: { image: !!supportsImage, audio: !!supportsAudio },
    });
    return out;
  }

  async function supportsModality(kind, _modelId) {
    if (kind === "text") return true;
    if (!hasRuntime()) return false;
    try {
      const state = await LanguageModel.availability(
        availabilityOpts(
          kind === "image" ? { withImage: true } : { withAudio: true },
        ),
      );
      return state !== "unavailable";
    } catch {
      return false;
    }
  }

  function dispose() {
    /* stateless — every call spins its own session */
  }

  return {
    id: "builtin-ai",
    availability,
    call,
    supportsModality,
    dispose,
  };
}

function hasRuntime() {
  return typeof globalThis.LanguageModel !== "undefined";
}

/**
 * Normalise Chrome's availability vocabulary to our five-state taxonomy.
 * Exported so the sidebar's availability panel can share the exact same
 * mapping — a bug fix here applies to both contexts.
 */
export function mapChromeAvailability(chromeState) {
  switch (chromeState) {
    case "available":
      return "ready";
    case "downloadable":
    case "after-download":
      return "needs-download";
    case "downloading":
      return "downloading";
    case "unavailable":
    default:
      return "unsupported";
  }
}

function availabilityOpts({ withImage = false, withAudio = false } = {}) {
  const expectedInputs = [{ type: "text" }];
  if (withImage) expectedInputs.push({ type: "image" });
  if (withAudio) expectedInputs.push({ type: "audio" });
  return {
    expectedInputs,
    expectedOutputs: [{ type: "text" }],
  };
}

function deriveExpectedInputs(messages) {
  const kinds = new Set(["text"]);
  for (const m of messages) {
    if (!Array.isArray(m.content)) continue;
    for (const part of m.content) {
      if (part?.type === "image") kinds.add("image");
      if (part?.type === "audio") kinds.add("audio");
    }
  }
  return Array.from(kinds).map((t) => ({ type: t }));
}

/**
 * Everything except the final user turn becomes `initialPrompts`.
 * The final user turn is what we pass to `prompt()`.
 */
function shapeInitialPrompts(messages) {
  const lastUserIdx = findLastUserIndex(messages);
  if (lastUserIdx < 0) return messages.slice();
  return messages.slice(0, lastUserIdx);
}

function extractPromptInput(messages) {
  const lastUserIdx = findLastUserIndex(messages);
  if (lastUserIdx < 0) return "";
  const last = messages[lastUserIdx];
  // prompt() accepts a string for simple text, or an array of messages for
  // multimodal input. We always hand it one message so the array form stays
  // consistent across text-only and multimodal cases.
  if (typeof last.content === "string") return last.content;
  return [{ role: "user", content: last.content }];
}

function findLastUserIndex(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return i;
  }
  return -1;
}

/**
 * Chrome's promptStreaming() sometimes emits cumulative chunks and sometimes
 * deltas. Detect at runtime: if chunk N+1 starts with chunk N, we're in
 * cumulative mode; otherwise we concat as deltas.
 *
 * Returns `{ text, errorName }` where `errorName` is the caught error's
 * `name` if the stream aborted mid-flow (e.g. `"QuotaExceededError"` when
 * Chrome's output budget is exceeded) or null on clean end. Callers use
 * `errorName` to classify truncation for the retry reminder.
 */
async function readCumulativeStream(stream, onToken) {
  if (!stream || typeof stream.getReader !== "function") {
    let full = "";
    let prev = "";
    try {
      for await (const chunk of stream) {
        full = combine(full, prev, chunk);
        prev = chunk;
        onToken?.(full);
      }
      return { text: full || null, errorName: null };
    } catch (err) {
      return { text: full || null, errorName: err?.name ?? null };
    }
  }
  const reader = stream.getReader();
  let full = "";
  let prev = "";
  let errorName = null;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full = combine(full, prev, value);
      prev = value;
      onToken?.(full);
    }
  } catch (err) {
    errorName = err?.name ?? null;
  } finally {
    try {
      reader.releaseLock?.();
    } catch {
      /* ignore */
    }
  }
  return { text: full || null, errorName };
}

function combine(full, prev, chunk) {
  if (!full) return chunk;
  // Cumulative: next chunk is strictly longer than prev AND starts with it.
  // The strict-greater check matters: without it a stall-then-duplicate chunk
  // could be mis-classified as cumulative (two identical deltas would collapse
  // to one). The prefix coincidence risk for short JSON deltas is real, but
  // requiring strictly longer + exact-prefix makes it vanishingly unlikely in
  // practice (two independent deltas would have to share a growing prefix on
  // every tick).
  if (chunk.length > prev.length && chunk.startsWith(prev)) return chunk;
  // Delta: append
  return full + chunk;
}
