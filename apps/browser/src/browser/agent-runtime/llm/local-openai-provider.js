/**
 * Local OpenAI-compatible provider adapter.
 *
 * Covers Ollama (`/v1`), LM Studio, vLLM, llama.cpp server, text-generation-
 * webui, and any other server that speaks OpenAI's `/v1/chat/completions`.
 * Wire shape is identical to OpenRouter's with two differences:
 *   1. We DO NOT send `response_format: {type: "json_object"}` — not every
 *      local server accepts it, and some models crash on it. JSON output
 *      comes from prompt conventions + parseContent's regex fallback.
 *   2. Authorization is optional (most local servers run keyless).
 *
 * Modality: local models vary wildly in whether they support vision; we
 * can't probe reliably, so default to text-only. Users who know their
 * model does vision add the model id to `config.vision[]` via the
 * sidebar settings.
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
  readDiagnosticText,
} from "./http-failure.js";
import { drainSseStream, stopWith, endStream } from "./sse-stream.js";
import {
  canonicalizeToolManifest,
  toOpenAIToolsWire,
  parseOpenAIToolUseResponse,
  TOOL_PARSE_REFUSED,
  aliasToolDecision,
} from "./tool-use.js";

const AVAILABILITY_TIMEOUT_MS = 2000;

// Failures the JSON-in-text fallback cannot help with: it hits the same auth
// wall, or adds pressure to the same rate limit. Shared by the HTTP-status and
// in-band-code checks so the two readings of "hard stop" stay identical.
const HARD_STOP_STATUSES = new Set([401, 403, 429]);

export function createLocalOpenAIProvider(config = {}) {
  const baseUrl = stripTrailingSlash(config.baseUrl || "");
  const kind = config.kind || "custom";
  const vision = Array.isArray(config.vision) ? config.vision : [];

  async function availability() {
    if (!baseUrl) return { state: "unsupported", detail: "No baseUrl configured" };
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), AVAILABILITY_TIMEOUT_MS);
    try {
      const res = await fetch(`${baseUrl}/models`, { signal: ctl.signal });
      clearTimeout(timer);
      if (res.ok) return { state: "ready" };
      const snippet = await safeReadText(res);
      return {
        state: "unsupported",
        detail: `HTTP ${res.status}${snippet ? `: ${snippet}` : ""}`,
      };
    } catch (err) {
      clearTimeout(timer);
      return { state: "unsupported", detail: unreachableDetail(err, kind) };
    }
  }

  async function call({
    messages = [],
    schema, // unused — kept for contract parity
    signal,
    onToken,
    onThought,
    stream = true,
    rawText = false,
    thinking, // unused — locals don't forward reasoning hints
    onParseFailure,
    toolUse = null,
  } = {}) {
    if (!baseUrl) return null;
    if (messages.length === 0) return null;

    const wire = await toWireMessages(messages);

    // Native tool-use branch (Phase 1.2 — Make native tool-use the default,
    // §5.2 of the SOTA roadmap). Local OpenAI-compat servers (Ollama
    // ≥0.4, LM Studio ≥0.3, vLLM, llama.cpp tool-use builds) accept the
    // OpenAI `tools[]` / `tool_choice` shape; older servers and
    // unsupported models return 4xx, on which we silently fall through
    // to JSON-in-text. No capability probe — local `/v1/models` does
    // not surface `supported_parameters` the way OpenRouter does, so we
    // probe by request and let the response speak.
    //
    // Skipped when the caller passed no manifest OR an empty one OR the
    // caller wants rawText (compaction / summarization want prose, not
    // a tool-call decision).
    if (!rawText && Array.isArray(toolUse?.tools) && toolUse.tools.length > 0) {
      try {
        const tu = await fetchToolUse({
          messages: wire,
          tools: toolUse.tools,
          signal,
          onThought,
          onParseFailure,
        });
        if (tu !== undefined) return tu;
        // undefined → server did not support tool-use; fall through.
      } catch (err) {
        if (err?.name === "AbortError") return null;
        console.warn("[Local] tool-use failed, falling back to JSON-in-text:", err?.message);
        // Network / parsing exceptions also fall through — local
        // servers misbehave in surprising ways and the JSON-in-text
        // path is a safe second try.
      }
    }

    if (stream) {
      try {
        const streamed = await fetchStreaming({ messages: wire, signal, onToken, onThought, rawText, onParseFailure });
        if (streamed !== undefined) return streamed;
      } catch (err) {
        if (err?.name === "AbortError") return null;
        console.warn("[Local] streaming failed, falling back:", err?.message);
      }
    }

    try {
      return await fetchNonStreaming({ messages: wire, signal, onThought, rawText, onParseFailure });
    } catch (err) {
      if (err?.name === "AbortError") return null;
      return reportProviderCallFailure(err, {
        provider: "Local", where: "call", rawText, onParseFailure,
      });
    }
  }

  async function toWireMessages(messages) {
    if (!hasMultimodal(messages)) {
      const { messages: out } = await normalizeForOpenRouter(messages, {
        supports: { image: true, audio: true },
      });
      return out;
    }
    const supportsImage = await supportsModality("image", config.model);
    const supportsAudio = await supportsModality("audio", config.model);
    const { messages: out } = await normalizeForOpenRouter(messages, {
      supports: { image: !!supportsImage, audio: !!supportsAudio },
    });
    return out;
  }

  // Native tool-use POST (non-streaming by design — streaming tool_calls
  // require accumulating per-delta arguments fragments, no benefit for our
  // one-shot ReAct decisions; matches OpenRouter's choice).
  //
  // Return contract:
  //   - {tool, args}   on a successful function-call response.
  //   - parsed JSON    when the model emits text (end-turn decisions like
  //                    {done:true} that don't map to any function in the
  //                    manifest). parseContent + onParseFailure as usual.
  //   - undefined      on most non-ok responses (4xx misc, 5xx) → caller
  //                    falls through to JSON-in-text. The local server
  //                    may have crashed on the unknown `tools[]` field
  //                    (some older Ollama / vLLM / llama.cpp / proxy
  //                    builds 5xx instead of 4xx on it), returned a
  //                    400/501/etc., or be transiently stalled. We let
  //                    the JSON-in-text path try before surrendering;
  //                    if the server is actually broken, that path
  //                    will also fail and bubble null naturally.
  //   - null           on AUTH / rate-limit failures (401, 403, 429),
  //                    where the JSON-in-text fallback can't help — it
  //                    would hit the same auth wall or worsen rate-limit
  //                    pressure. Also on empty content or AbortError.
  async function fetchToolUse({ messages, tools, signal, onThought, onParseFailure }) {
    const canonical = canonicalizeToolManifest(tools);
    const wireTools = toOpenAIToolsWire(canonical);
    const body = {
      model: config.model,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
      tools: wireTools,
      tool_choice: "auto",
      // No response_format — local servers don't universally support it
      // AND tool-use supersedes JSON-mode anyway.
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
      signal,
    });

    // PR #45 review fix: discriminator is "would the JSON-in-text retry
    // help us?" not "is this 4xx vs 5xx?". Older OpenAI-compat servers
    // (Ollama < 0.4, some vLLM / llama.cpp / proxy builds) crash on
    // unknown `tools[]` and return 5xx — those callers had a working
    // JSON-in-text setup before this PR; we must not regress them.
    //
    // Hard-stop ONLY when the fallback cannot help:
    //   - 401/403  auth misconfig — same fallback hits same wall
    //   - 429      rate limit     — retry just worsens pressure
    if (HARD_STOP_STATUSES.has(response.status)) {
      // Terminal for tool-use: the JSON-in-text fallback below hits the same
      // auth wall / rate limit, so classify instead of degrading.
      return reportProviderHttpFailure(response, {
        provider: "Local", where: "tool-use", rawText: false, onParseFailure,
      });
    }
    if (!response.ok) {
      const snippet = await safeReadText(response);
      console.warn(
        `[Local] tool-use HTTP ${response.status}; falling back to JSON-in-text${snippet ? `: ${snippet}` : ""}`,
      );
      return undefined;
    }

    let data;
    try {
      data = await readProviderJson(response, {
        provider: "Local", where: "tool-use", rawText: false, onParseFailure,
      });
    } catch (err) {
      // Caught HERE rather than by the caller's catch: the server accepted the
      // request and started answering, so a socket reset mid-body is a
      // transport failure on an accepted call — not evidence that it cannot
      // handle `tools[]`. Letting it reach the outer catch made it look like
      // one, and the fallback's content got dispatched.
      if (err?.name === "AbortError") throw err;
      return reportProviderCallFailure(err, {
        provider: "Local", where: "tool-use body", rawText: false, onParseFailure,
      });
    }
    // A body we could not decode is not evidence about `tools[]` support.
    if (data === PROTOCOL_FAILURE) return null;

    const gate = gateProviderResponse(data, {
      protocol: "openai", mode: "native-tool", allowMissingReason: true, allowToolCallsWithStop: true,
    });
    if (!gate.ok) {
      // Capability detection is the NON-OK path above: a server that cannot
      // handle `tools[]` rejects the request. A 200 whose body we cannot read
      // is a broken or intercepted response, and asking again without tools
      // returns the same broken thing — while the fallback's content gets
      // dispatched in the meantime.
      //
      // Only a retryable in-band error still degrades: that is the upstream
      // asking us to try again, and the second attempt is a different request.
      if (gate.failure.type === "in_band"
          && !HARD_STOP_STATUSES.has(Number(gate.failure.error?.code))) {
        return undefined;
      }
      return reportGateFailure(gate.failure, {
        provider: "Local", where: "tool-use", status: response.status,
        responseMode: "native-tool", rawText: false, onParseFailure,
      });
    }

    const message = data.choices?.[0]?.message;
    const reasoningText = extractReasoningFromMessage(message);
    if (reasoningText) onThought?.(reasoningText);

    const toolDecision = parseOpenAIToolUseResponse(data);
    // Terminal, and NOT a compatibility fallback: the server understood the
    // tool request and answered it. Falling through would issue a second
    // request whose text is then dispatched instead.
    if (toolDecision === TOOL_PARSE_REFUSED) {
      return reportProviderStructuralFailure({
        // The provider's OWN terminal reason is preserved: it completed
        // normally, and saying otherwise sends the wrong correction.
        finishReason: data.choices?.[0]?.finish_reason ?? null,
        responseMode: "native-tool", provider: "Local", where: "tool-use",
        status: response.status, rawText: false, onParseFailure,
      });
    }
    if (toolDecision) return aliasToolDecision(toolDecision, canonical);

    // No tool_call — the model chose text. Either an end-turn decision or
    // (more commonly with locals) the server silently ignored `tools[]`
    // and gave us a normal chat completion. Either way, parse as JSON-in-
    // text — finalizeText calls parseContent which strips fences, walks
    // braces, and reports parse-failure on garbage.
    const text = message?.content;
    const finishReason = data.choices?.[0]?.finish_reason ?? null;
    // Fall through rather than report, exactly as the bad-envelope case above
    // does: this branch's whole purpose is to degrade to JSON-in-text, and the
    // retry either recovers or reports the empty completion once, terminally.
    if (!hasUsableCompletion(text, false)) return undefined;
    return finalizeText(text, { rawText: false, finishReason, onParseFailure });
  }

  async function fetchNonStreaming({ messages, signal, onThought, rawText, onParseFailure }) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(buildBody({ messages, stream: false })),
      signal,
    });
    if (!response.ok) {
      return reportProviderHttpFailure(response, {
        provider: "Local", where: "non-streaming", rawText, onParseFailure,
      });
    }
    const data = await readProviderJson(response, { provider: "Local", where: "call", rawText: rawText, onParseFailure: onParseFailure });
    if (data === PROTOCOL_FAILURE) return null;
    const gate = gateProviderResponse(data, { protocol: "openai", mode: "text", allowMissingReason: true });
    if (!gate.ok) {
      reportGateFailure(gate.failure, {
        provider: "Local", where: "call", status: response.status, responseMode: "text", rawText: rawText, onParseFailure: onParseFailure,
      });
      return null;
    }
    const message = data.choices?.[0]?.message;
    const text = message?.content;
    const finishReason = data.choices?.[0]?.finish_reason ?? null;
    const reasoningText = extractReasoningFromMessage(message);
    if (reasoningText) onThought?.(reasoningText);
    if (!hasUsableCompletion(text, rawText)) {
      return reportProviderEmptyCompletion({
        provider: "Local", where: "call", status: response.status, rawText, onParseFailure,
      });
    }
    return finalizeText(text, { rawText, finishReason, onParseFailure });
  }

  async function fetchStreaming({ messages, signal, onToken, onThought, rawText, onParseFailure }) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(buildBody({ messages, stream: true })),
      signal,
    });

    // Return the `undefined` sentinel (NOT null) so `call()` falls through
    // to the non-streaming retry. Many local servers — proxies, early
    // OpenAI-compat implementations, some llama.cpp builds — 400/404 on
    // `stream:true` but answer the same prompt fine without it.
    if (!response.ok) return undefined;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) {
      const data = await readProviderJson(response, { provider: "Local", where: "streaming call", rawText: rawText, onParseFailure: onParseFailure });
      if (data === PROTOCOL_FAILURE) return null;
      const gate = gateProviderResponse(data, { protocol: "openai", mode: "text", allowMissingReason: true });
      if (!gate.ok) {
        reportGateFailure(gate.failure, {
          provider: "Local", where: "streaming call", status: response.status, responseMode: "text", rawText: rawText, onParseFailure: onParseFailure,
        });
        return null;
      }
      const message = data.choices?.[0]?.message;
      const text = message?.content;
      const finishReason = data.choices?.[0]?.finish_reason ?? null;
      const reasoningText = extractReasoningFromMessage(message);
      if (reasoningText) onThought?.(reasoningText);
      if (!hasUsableCompletion(text, rawText)) {
      return reportProviderEmptyCompletion({
        provider: "Local", where: "call", status: response.status, rawText, onParseFailure,
      });
    }
    return finalizeText(text, { rawText, finishReason, onParseFailure });
    }

    let full = "";
    let thoughtFull = "";
    let finishReason = null;

    const streamCtx = {
      provider: "Local", where: "streaming call", status: response.status, rawText, onParseFailure,
    };
    const drained = await drainSseStream(response, {
      onPayload(parsed) {
        // A self-hosted server is no more trustworthy a narrator of its own
        // failures than a hosted one, and llama.cpp/LM Studio/Ollama all
        // forward upstream error frames verbatim.
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
        // DeepSeek R1 (and llama.cpp servers running R1 / QwQ) emit
        // reasoning tokens on `delta.reasoning` (string). LM Studio +
        // Ollama with reasoning-tuned models follow the same shape.
        if (typeof delta.reasoning === "string" && delta.reasoning) {
          thoughtFull += delta.reasoning;
          onThought?.(thoughtFull);
        }
        // Some OpenAI-compat proxies forward the Anthropic-style
        // reasoning_details array verbatim.
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
        provider: "Local", where: "streaming call", status: response.status, rawText, onParseFailure,
      });
    }
    return finalizeText(full, { rawText, finishReason, onParseFailure });
  }

  function finalizeText(text, { rawText, finishReason, onParseFailure }) {
    if (text == null) return null;
    if (rawText) return text;
    const truncated = finishReason === "length";
    return parseContent(text, (failure) => {
      const { raw, reason } = failure;
      console.warn("[Local] parse failed:", reason, "finish_reason:", finishReason, "— raw:", String(raw).slice(0, 500));
      // Forward the parser's whole failure, then layer provider context on
      // top: rebuilding it by hand dropped fields it had deliberately
      // attached, such as the real length behind a bounded prefix.
      onParseFailure?.({ ...failure, truncated, finishReason });
    });
  }

  // Pull reasoning out of a non-stream message — same shape as OpenRouter.
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

  function buildHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
    return headers;
  }

  function buildBody({ messages, stream }) {
    // No response_format — local servers don't universally support it.
    const body = {
      model: config.model,
      messages,
      temperature: 0.3,
      // Bumped from 800 → 2048 to match OpenRouter / Gemini. Truncation at
      // the token limit was the dominant cause of unparseable-output errors.
      max_tokens: 2048,
    };
    if (stream) body.stream = true;
    return body;
  }

  async function supportsModality(kind, modelId) {
    if (kind === "text") return true;
    if (kind === "image") {
      const id = modelId || config.model || "";
      return vision.includes(id);
    }
    return false;
  }

  function dispose() {
    /* stateless */
  }

  return {
    id: "local",
    availability,
    call,
    supportsModality,
    dispose,
  };
}

function stripTrailingSlash(s) {
  if (!s) return s;
  return s.replace(/\/+$/, "");
}

async function safeReadText(res) {
  try {
    const t = await readDiagnosticText(res);
    return t.slice(0, 120);
  } catch (err) {
    // A cancellation must not be turned into an empty diagnostic: the fallback
    // chain above would carry on issuing requests for a turn the user stopped.
    if (err?.name === "AbortError") throw err;
    return "";
  }
}

function unreachableDetail(err, kind) {
  const base = "Server unreachable — is it running?";
  if (kind === "ollama") {
    return `${base} If Ollama, set OLLAMA_ORIGINS=chrome-extension://* and restart.`;
  }
  return `${base} (${err?.message || err?.name || "fetch error"})`;
}
