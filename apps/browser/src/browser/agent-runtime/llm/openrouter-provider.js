/**
 * OpenRouter LLM provider adapter.
 *
 * Ported from the inline `fetchLLM*` / `parseLLMContent` in content.js.
 * Streaming path reads SSE deltas and surfaces cumulative text via onToken;
 * falls through to non-streaming if the server returns a JSON body.
 *
 * Multimodal contract: callers pass our INTERNAL message shape (see messages.js);
 * `call()` runs `normalizeForOpenRouter` so every wire request is in OpenAI-
 * compatible format. Providers own their own wire shape — callers never have to.
 */

import { normalizeForOpenRouter, hasMultimodal } from "./messages.js";
import { parseContent } from "./parse-content.js";
import {
  reportProviderHttpFailure,
  reportProviderCallFailure,
  reportProviderEnvelopeFailure,
  validateOpenAICompletion,
  reportProviderEmptyCompletion,
  hasUsableCompletion,
  gateProviderResponse,
  reportGateFailure,
  readProviderJson,
  PROTOCOL_FAILURE,
  reportInBandError,
  reportProviderStreamFailure,
  reportProviderFinishFailure,
  reportProviderStructuralFailure,
} from "./http-failure.js";
import { drainSseStream, stopWith, endStream } from "./sse-stream.js";
import {
  canonicalizeToolManifest,
  toOpenAIToolsWire,
  parseOpenAIToolUseResponse,
  TOOL_PARSE_REFUSED,
  supportsOpenAIToolUse,
  aliasToolDecision,
} from "./tool-use.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS_URL = "https://openrouter.ai/api/v1/models";
const DEFAULT_HEADERS = {
  "HTTP-Referer": "https://webmcp.dev",
  "X-Title": "Auto Browser",
};
const MODEL_CATALOG_TTL_MS = 60 * 60 * 1000;
const MODEL_CATALOG_FAIL_TTL_MS = 60 * 1000; // shorter retry on network error

// Module-scoped catalog cache. The previous design held this per-provider
// instance, but `fetchLLM()` in content.js calls `getProvider()` every turn
// — a fresh closure each time — so an instance-local cache was effectively
// no cache at all: every tool-use decision paid an extra `/api/v1/models`
// round-trip before the actual chat completion. Hoisting to module scope
// means all provider instances in a tab share one cache (the data is
// immutable per TTL, so sharing is safe). `catalogPromise` dedupes
// concurrent in-flight fetches so a burst of turns doesn't stampede.
let sharedCatalog = null;
let catalogPromise = null;

// Reset helper for tests. Production code never calls this — the TTL
// governs refresh in real runs. Tests reset in `beforeEach` to keep
// fetch-mock expectations predictable across the suite.
export function __resetCatalogForTests() {
  sharedCatalog = null;
  catalogPromise = null;
}

async function loadCatalog() {
  const now = Date.now();
  if (sharedCatalog) {
    const ttl = sharedCatalog.map ? MODEL_CATALOG_TTL_MS : MODEL_CATALOG_FAIL_TTL_MS;
    if (now - sharedCatalog.at < ttl) return sharedCatalog.map;
  }
  if (catalogPromise) return catalogPromise;

  catalogPromise = (async () => {
    try {
      const res = await fetch(MODELS_URL);
      if (!res.ok) {
        console.warn("[OpenRouter] model catalog HTTP", res.status);
        sharedCatalog = { at: Date.now(), map: null };
        return null;
      }
      // Bounded like every other body: the catalog is fetched from the same
      // network path and had no limit at all.
      const data = await readProviderJson(res, {
        provider: "OpenRouter", where: "model catalog", rawText: true, onParseFailure: undefined,
      });
      if (data === PROTOCOL_FAILURE) {
        sharedCatalog = { at: Date.now(), map: null };
        return null;
      }
      const map = new Map();
      for (const m of data.data || []) {
        const inputs = m.architecture?.input_modalities || ["text"];
        map.set(m.id, {
          inputs,
          supportsToolUse: supportsOpenAIToolUse(m),
        });
      }
      sharedCatalog = { at: Date.now(), map };
      return map;
    } catch (err) {
      console.warn("[OpenRouter] model catalog fetch failed:", err?.message);
      sharedCatalog = { at: Date.now(), map: null };
      return null;
    } finally {
      catalogPromise = null;
    }
  })();

  return catalogPromise;
}

export function createOpenRouterProvider(config = {}) {

  async function availability() {
    if (!config.apiKey) return { state: "no-key" };
    return { state: "ready" };
  }

  async function call({ messages, schema, signal, onToken, onThought, stream = true, rawText = false, thinking, onParseFailure, toolUse = null } = {}) {
    if (!config.apiKey) return null;

    const wire = await toWireMessages(messages);

    // Native tool-use branch (Phase 1.1). Data-driven capability probe —
    // skipped when the caller passed no manifest OR the manifest is empty
    // OR the caller wants rawText (compaction / summarization paths want
    // prose, not decisions). Fail-closed on unknown/unsupported models:
    // we silently route to the JSON-in-text path below rather than issue
    // a request the server will reject with a 400. See src/llm/tool-use.js
    // for the shape helpers.
    if (!rawText && Array.isArray(toolUse?.tools) && toolUse.tools.length > 0) {
      const modelId = config.model || "";
      const capable = await supportsToolUseForModel(modelId);
      if (capable) {
        try {
          return await fetchToolUse({
            messages: wire,
            tools: toolUse.tools,
            signal,
            onThought,
            onParseFailure,
            // Phase 1.1 review fix: forward `thinking` so reasoning-capable
            // models (Anthropic, DeepSeek-R1, o-series) don't silently lose
            // their configured effort when the caller opts into tool-use.
            thinking,
          });
        } catch (err) {
          if (err?.name === "AbortError") return null;
          return reportProviderCallFailure(err, {
            provider: "OpenRouter", where: "tool-use call", rawText, onParseFailure,
          });
        }
      }
    }

    if (stream) {
      try {
        const streamed = await fetchStreaming({ messages: wire, schema, signal, onToken, onThought, rawText, thinking, onParseFailure });
        if (streamed !== undefined) return streamed;
      } catch (err) {
        if (err?.name === "AbortError") return null;
        console.warn("[OpenRouter] streaming failed, falling back:", err?.message);
      }
    }

    try {
      return await fetchNonStreaming({ messages: wire, schema, signal, onThought, rawText, thinking, onParseFailure });
    } catch (err) {
      if (err?.name === "AbortError") return null;
      return reportProviderCallFailure(err, {
        provider: "OpenRouter", where: "call", rawText, onParseFailure,
      });
    }
  }

  async function toWireMessages(messages) {
    // Fast path: if no message has multimodal parts, skip the capability probe
    // (saves a /models fetch on text-only traffic).
    if (!hasMultimodal(messages)) {
      const { messages: out } = await normalizeForOpenRouter(messages, {
        supports: { image: true, audio: true },
      });
      return out;
    }
    const modelId = config.model || "";
    const [supportsImage, supportsAudio] = await Promise.all([
      supportsModality("image", modelId),
      supportsModality("audio", modelId),
    ]);
    const { messages: out } = await normalizeForOpenRouter(messages, {
      supports: { image: !!supportsImage, audio: !!supportsAudio },
    });
    return out;
  }

  async function fetchStreaming({ messages, schema, signal, onToken, onThought, rawText, thinking, onParseFailure }) {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...DEFAULT_HEADERS,
      },
      body: JSON.stringify(buildBody({ messages, schema, stream: true, thinking })),
      signal,
    });

    if (!response.ok) {
      return reportProviderHttpFailure(response, {
        provider: "OpenRouter", where: "streaming", rawText, onParseFailure,
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) {
      const data = await readProviderJson(response, { provider: "OpenRouter", where: "streaming call", rawText: rawText, onParseFailure: onParseFailure });
      if (data === PROTOCOL_FAILURE) return null;
      const gate = gateProviderResponse(data, { protocol: "openai", mode: "text" });
      if (!gate.ok) {
        reportGateFailure(gate.failure, {
          provider: "OpenRouter", where: "call", status: response.status, responseMode: "text", rawText: rawText, onParseFailure: onParseFailure,
        });
        return null;
      }
      const text = data.choices?.[0]?.message?.content;
      const finishReason = data.choices?.[0]?.finish_reason ?? null;
      const reasoningText = extractReasoningFromMessage(data.choices?.[0]?.message);
      if (reasoningText) onThought?.(reasoningText);
      if (!hasUsableCompletion(text, rawText)) {
      return reportProviderEmptyCompletion({
        provider: "OpenRouter", where: "call", status: response.status, rawText, onParseFailure,
      });
    }
    return finalizeText(text, { rawText, finishReason, onParseFailure });
    }

    let full = "";
    let thoughtFull = "";
    let finishReason = null;

    const streamCtx = {
      provider: "OpenRouter", where: "streaming call", status: response.status, rawText, onParseFailure,
    };
    const drained = await drainSseStream(response, {
      onPayload(parsed) {
        // Same gate as every other response mode. A stream frame carries no
        // terminal state of its own — the driver tracks that across frames — so
        // only the completion check is deferred to after the drain.
        const gate = gateProviderResponse(parsed, { protocol: "openai", mode: "stream" });
        if (!gate.ok) return stopWith(reportGateFailure(gate.failure, streamCtx));
        if (gate.kind === "metadata") return undefined;
        const { choice } = gate;
        // First terminal reason wins. Letting a later frame overwrite it means
        // a `length` generation followed by `stop` reads as a clean turn.
        const terminal = choice.finish_reason ?? null;
        if (terminal != null && finishReason == null) finishReason = terminal;
        const delta = choice.delta;
        if (!delta) return terminal != null ? endStream() : undefined;
        if (typeof delta.content === "string" && delta.content) {
          full += delta.content;
          onToken?.(full);
        }
        // Anthropic-thinking + DeepSeek R1 + others: cumulative reasoning
        // text on `delta.reasoning` (string). Some o-series models also use
        // this shape via OpenRouter's normalisation.
        if (typeof delta.reasoning === "string" && delta.reasoning) {
          thoughtFull += delta.reasoning;
          onThought?.(thoughtFull);
        }
        // Anthropic-thinking via OpenRouter often uses reasoning_details
        // (array of {type, text, signature?}). Concatenate every text part.
        if (Array.isArray(delta.reasoning_details)) {
          for (const d of delta.reasoning_details) {
            if (d && typeof d.text === "string" && d.text) {
              thoughtFull += d.text;
              onThought?.(thoughtFull);
            }
          }
        }
        // Stop at the terminal frame: anything after it can only append to — or
        // corrupt — a decision the model already finished.
        return terminal != null ? endStream() : undefined;
      },
    });
    if (drained.stopped) return drained.result;
    if (drained.failure) return reportProviderStreamFailure(drained.failure, streamCtx);
    // A committed event says the frame arrived, not that the turn finished.
    // OpenAI-compatible streams state that as `stop`; servers that omit it
    // entirely are trusted only on their closing marker. Anything else — a
    // token ceiling, a content filter, or a socket that simply ended — leaves
    // content that may parse but was never a finished decision.
    if (!(finishReason === "stop" || (finishReason == null && drained.termination === "done"))) {
      return reportProviderFinishFailure({
        finishReason, truncated: finishReason === "length", ...streamCtx,
      });
    }

    if (!hasUsableCompletion(full, rawText)) {
      return reportProviderEmptyCompletion({
        provider: "OpenRouter", where: "streaming call", status: response.status, rawText, onParseFailure,
      });
    }
    return finalizeText(full, { rawText, finishReason, onParseFailure });
  }

  // Native tool-use POST (non-streaming by design — streaming tool_calls
  // require accumulating per-delta arguments fragments, which adds
  // complexity for no Phase 1.1 benefit since ReAct turns are one-shot
  // decisions anyway).
  //
  // Decision precedence on the response:
  //   1. message.tool_calls present → parse first call → return {tool, args}.
  //   2. message.content present    → parse as JSON-in-text (covers end-
  //                                    turn decisions like {done:true,
  //                                    task_complete:true, final_answer}).
  //   3. neither                     → null.
  async function fetchToolUse({ messages, tools, signal, onThought, onParseFailure, thinking }) {
    const canonical = canonicalizeToolManifest(tools);
    const wireTools = toOpenAIToolsWire(canonical);
    const body = {
      model: config.model || "anthropic/claude-sonnet-4-20250514",
      messages,
      temperature: 0.3,
      max_tokens: 2048,
      tools: wireTools,
      tool_choice: "auto",
      // response_format:json_object is omitted — tool-use supersedes it.
      // Models that support tools will emit either a tool_call or plain
      // text; either is fine for our ReAct loop.
    };
    // Mirror buildBody's thinking handling so the tool-use path doesn't
    // silently drop reasoning effort on capable models (review F3).
    if (thinking?.enabled && thinking?.effort) {
      body.reasoning = { effort: thinking.effort };
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...DEFAULT_HEADERS,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      // Surface the failure rather than silently degrading to JSON-in-text
      // — if tool-use is misconfigured we want the ReAct loop to see a
      // null, not a different response shape. Classified so the loop can
      // tell a dead request from bad model output.
      return reportProviderHttpFailure(response, {
        provider: "OpenRouter", where: "tool-use", rawText: false, onParseFailure,
      });
    }

    const data = await readProviderJson(response, { provider: "OpenRouter", where: "tool-use call", rawText: false, onParseFailure: onParseFailure });
    if (data === PROTOCOL_FAILURE) return null;
    const gate = gateProviderResponse(data, { protocol: "openai", mode: "native-tool" });
    if (!gate.ok) {
      reportGateFailure(gate.failure, {
        provider: "OpenRouter", where: "tool-use call", status: response.status, responseMode: "native-tool", rawText: false, onParseFailure: onParseFailure,
      });
      return null;
    }
    const reasoningText = extractReasoningFromMessage(data.choices?.[0]?.message);
    if (reasoningText) onThought?.(reasoningText);

    const toolDecision = parseOpenAIToolUseResponse(data);
    // A refusal is terminal. Falling through would parse the sibling `content`
    // as a decision and dispatch THAT — the action we declined to read the
    // arguments for arrives anyway, by another route.
    if (toolDecision === TOOL_PARSE_REFUSED) {
      return reportProviderStructuralFailure({
        // The provider's OWN terminal reason is preserved: it completed
        // normally, and saying otherwise sends the wrong correction.
        finishReason: data.choices?.[0]?.finish_reason ?? null,
        responseMode: "native-tool", provider: "OpenRouter", where: "tool-use call",
        status: response.status, rawText: false, onParseFailure,
      });
    }
    // Map the provider-safe name back to the original WebMCP name when
    // canonicalization renamed it (e.g. `calendar_create_event` →
    // `calendar.create_event`). No-op when names match (review F1).
    if (toolDecision) return aliasToolDecision(toolDecision, canonical);

    // No tool_call — the model chose text. This is legitimate for
    // "end-turn" responses (no tool in our manifest represents {done:true}
    // or {task_complete, final_answer}). Parse as JSON-in-text.
    const text = data.choices?.[0]?.message?.content;
    const finishReason = data.choices?.[0]?.finish_reason ?? null;
    // `rawText` is not in scope here — this branch always parses a decision.
    if (!hasUsableCompletion(text, false)) {
      return reportProviderEmptyCompletion({
        provider: "OpenRouter", where: "tool-use call", status: response.status, rawText: false, onParseFailure,
      });
    }
    return finalizeText(text, { rawText: false, finishReason, onParseFailure });
  }

  async function fetchNonStreaming({ messages, schema, signal, onThought, rawText, thinking, onParseFailure }) {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...DEFAULT_HEADERS,
      },
      body: JSON.stringify(buildBody({ messages, schema, stream: false, thinking })),
      signal,
    });

    if (!response.ok) {
      return reportProviderHttpFailure(response, {
        provider: "OpenRouter", where: "non-streaming", rawText, onParseFailure,
      });
    }
    const data = await readProviderJson(response, { provider: "OpenRouter", where: "call", rawText: rawText, onParseFailure: onParseFailure });
    if (data === PROTOCOL_FAILURE) return null;
    const gate = gateProviderResponse(data, { protocol: "openai", mode: "text" });
    if (!gate.ok) {
      reportGateFailure(gate.failure, {
        provider: "OpenRouter", where: "call", status: response.status, responseMode: "text", rawText: rawText, onParseFailure: onParseFailure,
      });
      return null;
    }
    const text = data.choices?.[0]?.message?.content;
    const finishReason = data.choices?.[0]?.finish_reason ?? null;
    const reasoningText = extractReasoningFromMessage(data.choices?.[0]?.message);
    if (reasoningText) onThought?.(reasoningText);
    if (!hasUsableCompletion(text, rawText)) {
      return reportProviderEmptyCompletion({
        provider: "OpenRouter", where: "call", status: response.status, rawText, onParseFailure,
      });
    }
    return finalizeText(text, { rawText, finishReason, onParseFailure });
  }

  function finalizeText(text, { rawText, finishReason, onParseFailure }) {
    if (text == null) return null;
    if (rawText) return text;
    const truncated = finishReason === "length";
    const parsed = parseContent(text, (failure) => {
      const { raw, reason } = failure;
      console.warn("[OpenRouter] parse failed:", reason, "finish_reason:", finishReason, "— raw:", String(raw).slice(0, 500));
      // Forward the parser's whole failure, then layer provider context on
      // top: rebuilding it by hand dropped fields it had deliberately
      // attached, such as the real length behind a bounded prefix.
      onParseFailure?.({ ...failure, truncated, finishReason });
    });
    return parsed;
  }

  // Pull reasoning out of a non-stream message. Models expose it in either:
  //   - message.reasoning (string)         — DeepSeek R1, some o-series
  //   - message.reasoning_details[].text   — Anthropic-thinking via OpenRouter
  // Return concatenated text or "" when none present.
  function extractReasoningFromMessage(msg) {
    if (!msg || typeof msg !== "object") return "";
    let out = "";
    if (typeof msg.reasoning === "string") out += msg.reasoning;
    if (Array.isArray(msg.reasoning_details)) {
      for (const d of msg.reasoning_details) {
        if (d && typeof d.text === "string") out += d.text;
      }
    }
    return out;
  }

  function buildBody({ messages, stream, thinking }) {
    const body = {
      model: config.model || "anthropic/claude-sonnet-4-20250514",
      messages,
      temperature: 0.3,
      // Bumped from 800 → 2048: the ReAct decision JSON plus any `reasoning`
      // field routinely hit 800 on complex tasks, which cut the stream
      // mid-JSON (finish_reason: "length") and produced unparseable output.
      max_tokens: 2048,
      // json_object is broadly supported across OpenRouter-proxied models;
      // json_schema is not. We keep the schema param for provider-interface
      // parity with Built-in AI (which uses it for responseConstraint) but
      // don't wire it into the OpenRouter request.
      response_format: { type: "json_object" },
    };
    if (stream) body.stream = true;
    if (thinking?.enabled && thinking?.effort) {
      body.reasoning = { effort: thinking.effort };
    }
    return body;
  }

  async function supportsModality(kind, modelId) {
    if (kind === "text") return true;
    if (!modelId) return false;
    const catalog = await loadCatalog();
    if (!catalog) return false;
    const entry = catalog.get(modelId);
    if (!entry) return false;
    return entry.inputs.includes(kind);
  }

  // Tool-use capability probe — fail-closed. Phase 1.1 from the adoption
  // plan: no hand-maintained per-model spreadsheet; we read
  // `supported_parameters` from the cached /api/v1/models catalog.
  async function supportsToolUseForModel(modelId) {
    if (!modelId) return false;
    const catalog = await loadCatalog();
    if (!catalog) return false;
    const entry = catalog.get(modelId);
    if (!entry) return false;
    return entry.supportsToolUse;
  }

  function dispose() {
    // No-op: the catalog is module-scoped (shared across provider instances
    // in a tab) and governed by a TTL. Clearing it on a single instance's
    // disposal would waste the shared cache for every other instance.
  }

  return {
    id: "openrouter",
    availability,
    call,
    supportsModality,
    dispose,
  };
}

export { parseContent } from "./parse-content.js";
