/**
 * Google Gemini (AI Studio) provider adapter.
 *
 * Contract: see src/llm/provider.js.
 *
 * Wire shape differs from OpenAI-compat in three ways:
 *   1. Roles: "user" | "model" (assistant → model) and `system` is
 *      out-of-band in `systemInstruction`.
 *   2. Parts: `inlineData: {mimeType, data(base64)}` for images/audio
 *      instead of `image_url` / `input_audio`.
 *   3. Config: `generationConfig` holds responseMimeType/Schema and
 *      thinkingConfig — all provider-level, not message-level.
 *
 * Thinking passthrough: `thinking.effort` maps to thinkingConfig.
 * thought parts arrive in stream chunks flagged `{thought: true, text}`;
 * the provider routes them to `onThought` while answer text goes to
 * `onToken` — two independent accumulators.
 *
 * Schema handling: Gemini's `responseSchema` takes an OpenAPI subset
 * (no union types, no $ref, no oneOf). REACT_SCHEMA has a union type
 * for `tool`, so we skip `responseSchema` entirely when the schema
 * fails the compat check and rely on `responseMimeType:"application/json"`
 * + parseContent's regex fallback. `geminiSchemaCompat` is exported for
 * direct testing.
 */

import { normalizeForGemini, hasMultimodal } from "./messages.js";
import { parseContent } from "./parse-content.js";
import {
  reportProviderHttpFailure,
  reportProviderCallFailure,
  reportProviderEnvelopeFailure,
  validateGeminiResponse,
  reportProviderEmptyCompletion,
  hasUsableCompletion,
  gateProviderResponse,
  reportGateFailure,
  readProviderJson,
  PROTOCOL_FAILURE,
  reportInBandError,
  reportProviderStreamFailure,
  reportProviderFinishFailure,
} from "./http-failure.js";
import { drainSseStream, stopWith, endStream } from "./sse-stream.js";
import {
  canonicalizeToolManifest,
  toGeminiFunctionDeclarations,
  parseGeminiToolUseResponse,
  aliasToolDecision,
} from "./tool-use.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Gemini 2.5 takes a numeric `thinkingBudget`; Gemini 3+ replaced it with a
// `thinkingLevel` enum. The two are alternatives — 3.x still ACCEPTS a budget
// "for backwards compatibility", but Google warns it "may result in unexpected
// performance", i.e. it does not reliably bound thinking. That is worse than an
// outright rejection for us: we size maxOutputTokens from the budget, so an
// unbounded thinker silently overruns the ceiling and truncates the decision
// JSON — surfacing as intermittent unparseable output.
const EFFORT_TO_BUDGET = { low: 1024, medium: 4096, high: 16384 };
const EFFORT_TO_LEVEL = { low: "low", medium: "medium", high: "high" };

// Headroom reserved for the decision JSON itself, on top of any thinking
// allowance. Sized to match the other providers' max_tokens.
const ANSWER_TOKENS = 2048;
// Gemini never requests beyond this many output tokens.
const MAX_OUTPUT_TOKENS_CAP = 65536;

// One conservative provider-wide ceiling for the 2.5 family: 2.5 Flash accepts
// 0..24,576 and 2.5 Pro 128..32,768, so 24,576 is valid for both. Deliberately
// NOT a per-model limits table — see the PR discussion; that pattern is already
// rejected in openrouter-provider.js and rots on every model release.
const MAX_THINKING_BUDGET = 24576;
// `thinkingBudget: -1` asks Gemini to choose, so there is no number to add.
const DYNAMIC_THINKING_RESERVE = MAX_THINKING_BUDGET;

// `thinkingLevel` gives no token number, so reserve per level. A ceiling costs
// nothing when unused — Gemini bills tokens actually produced, not the limit —
// so these err generous rather than risk truncation.
const LEVEL_RESERVE = { minimal: 2048, low: 8192, medium: 24576, high: 49152 };

// Version-family check, not a limits table: "gemini-3.6-flash" → 3. Google's
// guidance is thinkingLevel for 3 "and onwards", so newer majors follow it too.
function usesThinkingLevel(modelId) {
  const m = /^gemini-(\d+)/.exec(String(modelId || ""));
  return m ? Number(m[1]) >= 3 : false;
}

/**
 * Gemini draws thinking tokens FROM `maxOutputTokens` — `MAX_TOKENS` fires when
 * `thoughts_token_count + output_token_count` exceeds it, despite the docs
 * describing them as separate. So the thinking allowance and the ceiling must
 * be resolved together or they drift, and the answer gets starved.
 *
 * Returns the thinkingConfig to send and the ceiling to send with it.
 */
function resolveThinking(modelId, thinkingConfig) {
  if (!thinkingConfig) return { thinkingConfig, maxOutputTokens: ANSWER_TOKENS };
  // Dispatch on the MODEL FAMILY, never on which fields happen to be present.
  // `thinking.raw` is passed through by buildThinkingConfig before any model
  // check, so a raw `{thinkingBudget}` on a 3.x model would otherwise pick the
  // numeric path and re-enter the unbounded-thinking truncation this file
  // exists to prevent — and a raw `{thinkingLevel}` on 2.5 would send a
  // parameter that family does not accept.
  return usesThinkingLevel(modelId)
    ? resolveLevelConfig(thinkingConfig)
    : resolveBudgetConfig(thinkingConfig);
}

// Gemini 3+: level enum, no numeric budget. Reserve output headroom per level.
function resolveLevelConfig(cfg) {
  const { thinkingBudget, ...rest } = cfg;
  if (thinkingBudget !== undefined) {
    warn(`Gemini 3+ takes thinkingLevel, not thinkingBudget — ignoring thinkingBudget ${thinkingBudget}.`);
  }
  // A raw config that supplied only a budget still needs a level; "medium"
  // matches gemini-3.6-flash's own default rather than guessing one from the
  // discarded number.
  const level = typeof rest.thinkingLevel === "string" ? rest.thinkingLevel : "medium";
  const reserve = LEVEL_RESERVE[level] ?? LEVEL_RESERVE.medium;
  return {
    thinkingConfig: { ...rest, thinkingLevel: level },
    maxOutputTokens: Math.min(ANSWER_TOKENS + reserve, MAX_OUTPUT_TOKENS_CAP),
  };
}

// Gemini 2.5: numeric budget, clamped to a value the family accepts.
function resolveBudgetConfig(cfg) {
  const { thinkingLevel, ...rest } = cfg;
  if (thinkingLevel !== undefined) {
    warn(`Gemini 2.5 takes thinkingBudget, not thinkingLevel — ignoring thinkingLevel "${thinkingLevel}".`);
  }
  const requested = Number(rest.thinkingBudget);
  // Absent or -1 ("you decide") — no number to add, so reserve generously.
  if (!Number.isFinite(requested) || requested < 0) {
    return { thinkingConfig: rest, maxOutputTokens: ANSWER_TOKENS + DYNAMIC_THINKING_RESERVE };
  }
  const budget = Math.min(requested, MAX_THINKING_BUDGET);
  if (budget !== requested) {
    warn(`thinkingBudget ${requested} exceeds the supported maximum; clamping to ${budget}.`);
  }
  return {
    // Send the CLAMPED budget, not the requested one.
    thinkingConfig: budget === requested ? rest : { ...rest, thinkingBudget: budget },
    maxOutputTokens: ANSWER_TOKENS + budget,
  };
}

function warn(msg) {
  if (typeof console !== "undefined" && console.warn) console.warn(`[Gemini] ${msg}`);
}

/**
 * A non-OK Gemini response carries Google's own diagnosis in the body
 * (`{error:{code,status,message}}`) — "maxOutputTokens value is out of the
 * supported range", "Unsupported thinkingLevel", "model not found". The
 * free-form model field makes this a real failure mode: the provider cannot
 * know the limits of a model the user typed in.
 *
 * Classification is shared with the other adapters (see llm/http-failure.js) —
 * a 4xx that no retry can fix short-circuits the turn, a 429/5xx routes to the
 * loop's transient-retry branch, and neither is reported as bad model output.
 */
function reportApiError(response, where, rawText, onParseFailure) {
  return reportProviderHttpFailure(response, { provider: "Gemini", where, rawText, onParseFailure });
}

export function createGeminiProvider(config = {}) {
  async function availability() {
    if (!config.apiKey) return { state: "no-key" };
    return { state: "ready" };
  }

  async function call({
    messages = [],
    schema,
    signal,
    onToken,
    onThought,
    stream = true,
    rawText = false,
    thinking,
    onParseFailure,
    toolUse = null,
  } = {}) {
    if (!config.apiKey) return null;
    if (messages.length === 0) return null;

    const { body: wireBody } = await toWireBody(messages);

    // Native tool-use branch (Phase 1.1). All current gemini-* models
    // support functionDeclarations — no per-model capability probe needed,
    // unlike OpenRouter. Skipped when the caller passed no manifest OR an
    // empty one OR the caller wants rawText (compaction / summarization
    // paths want prose). Non-streaming by design (see OpenRouter comment).
    if (!rawText && Array.isArray(toolUse?.tools) && toolUse.tools.length > 0) {
      try {
        return await fetchToolUse({
          wireBody,
          tools: toolUse.tools,
          thinking,
          signal,
          onThought,
          onParseFailure,
        });
      } catch (err) {
        if (err?.name === "AbortError") return null;
        return reportProviderCallFailure(err, {
          provider: "Gemini", where: "tool-use call", rawText: false, onParseFailure,
        });
      }
    }

    const body = {
      ...wireBody,
      generationConfig: buildGenerationConfig({ schema, thinking, rawText }),
    };

    if (stream) {
      try {
        const streamed = await fetchStreaming({ body, signal, onToken, onThought, rawText, onParseFailure });
        if (streamed !== undefined) return streamed;
      } catch (err) {
        if (err?.name === "AbortError") return null;
        console.warn("[Gemini] streaming failed, falling back:", err?.message);
      }
    }

    try {
      return await fetchNonStreaming({ body, signal, rawText, onParseFailure });
    } catch (err) {
      if (err?.name === "AbortError") return null;
      return reportProviderCallFailure(err, {
        provider: "Gemini", where: "call", rawText, onParseFailure,
      });
    }
  }

  async function toWireBody(messages) {
    if (!hasMultimodal(messages)) {
      return normalizeForGemini(messages, { supports: { image: true, audio: true } });
    }
    const [supportsImage, supportsAudio] = await Promise.all([
      supportsModality("image", config.model),
      supportsModality("audio", config.model),
    ]);
    return normalizeForGemini(messages, {
      supports: { image: !!supportsImage, audio: !!supportsAudio },
    });
  }

  function buildGenerationConfig({ schema, thinking, rawText }) {
    const gc = { temperature: 0.3 };
    // ReAct path wants JSON; compaction (rawText:true) wants prose. Forcing
    // `application/json` on rawText calls coerces the compactor's
    // <analysis>/<summary> output into JSON and pushes long conversations
    // into the "summary unavailable" fallback.
    if (!rawText) {
      gc.responseMimeType = "application/json";
      const compat = geminiSchemaCompat(schema);
      if (compat) gc.responseSchema = compat;
    }
    // Budget and ceiling are resolved together so they can never disagree.
    const resolved = resolveThinking(config.model, buildThinkingConfig(thinking));
    if (resolved.thinkingConfig) gc.thinkingConfig = resolved.thinkingConfig;
    gc.maxOutputTokens = resolved.maxOutputTokens;
    return gc;
  }

  function buildThinkingConfig(thinking) {
    if (!thinking?.enabled) return null;
    if (thinking.raw && typeof thinking.raw === "object") return thinking.raw;
    if (!thinking.effort) return null;
    // Gemini 3+ wants a level; 2.5 wants a numeric budget. Sending a budget to
    // a 3.x model is accepted but does not reliably bound thinking, which
    // silently breaks the ceiling we compute from it.
    if (usesThinkingLevel(config.model)) {
      const level = EFFORT_TO_LEVEL[thinking.effort];
      return level ? { thinkingLevel: level, includeThoughts: true } : null;
    }
    const budget = EFFORT_TO_BUDGET[thinking.effort];
    if (!budget) return null;
    return { thinkingBudget: budget, includeThoughts: true };
  }

  // Native tool-use POST.
  //
  // Decision precedence on the response:
  //   1. candidate.content.parts[].functionCall → parse first → {tool,args}.
  //   2. candidate.content.parts[].text         → parse as JSON-in-text
  //                                                (end-turn decisions).
  //   3. neither                                 → null.
  //
  // responseMimeType / responseSchema / thinkingConfig on generationConfig
  // are OMITTED in the tool-use body — Gemini's tool-use mode replaces the
  // JSON-mode contract. Thinking passthrough is still supplied if requested,
  // because thinking and tool-use compose on Gemini (parts array can mix
  // thought parts and functionCall parts).
  async function fetchToolUse({ wireBody, tools, thinking, signal, onThought, onParseFailure }) {
    const canonical = canonicalizeToolManifest(tools);
    const functionDeclarations = toGeminiFunctionDeclarations(canonical);

    const resolved = resolveThinking(config.model, buildThinkingConfig(thinking));
    const generationConfig = {
      temperature: 0.3,
      maxOutputTokens: resolved.maxOutputTokens,
    };
    if (resolved.thinkingConfig) generationConfig.thinkingConfig = resolved.thinkingConfig;

    const body = {
      ...wireBody,
      tools: [{ functionDeclarations }],
      generationConfig,
    };

    const url = `${GEMINI_BASE}/${encodeURIComponent(config.model)}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) return reportApiError(response, "tool-use call", false, onParseFailure);

    const data = await readProviderJson(response, { provider: "Gemini", where: "tool-use call", rawText: false, onParseFailure: onParseFailure });
    if (data === PROTOCOL_FAILURE) return null;
    const gate = gateProviderResponse(data, { protocol: "gemini", mode: "native-tool" });
    if (!gate.ok) {
      reportGateFailure(gate.failure, {
        provider: "Gemini", where: "tool-use call", status: response.status, responseMode: "native-tool", rawText: false, onParseFailure: onParseFailure,
      });
      return null;
    }
    const candidate = data?.candidates?.[0];

    // Surface any thought parts to onThought (Gemini thinking is compatible
    // with tool-use mode — parts array can contain both thought and
    // functionCall).
    const parts = candidate?.content?.parts;
    if (Array.isArray(parts)) {
      let thoughtAcc = "";
      for (const p of parts) {
        if (p?.thought && typeof p.text === "string") thoughtAcc += p.text;
      }
      if (thoughtAcc) onThought?.(thoughtAcc);
    }

    const toolDecision = parseGeminiToolUseResponse(data);
    // Map provider-safe → original WebMCP name when canonicalization
    // renamed it. No-op when names match (review F1).
    if (toolDecision) return aliasToolDecision(toolDecision, canonical);

    // No functionCall — fall back to text content parsed as JSON-in-text.
    const text = extractAnswerText(parts);
    const finishReason = candidate?.finishReason ?? null;
    // Terminal: unlike Local, this branch has no JSON-in-text retry to fall to.
    if (!hasUsableCompletion(text, false)) {
      return reportProviderEmptyCompletion({
        provider: "Gemini", where: "tool-use call", status: response.status, rawText: false, onParseFailure,
      });
    }
    return finalizeText(text, { rawText: false, finishReason, onParseFailure });
  }

  async function fetchNonStreaming({ body, signal, rawText, onParseFailure }) {
    const url = `${GEMINI_BASE}/${encodeURIComponent(config.model)}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) return reportApiError(response, "call", rawText, onParseFailure);
    const data = await readProviderJson(response, { provider: "Gemini", where: "call", rawText: rawText, onParseFailure: onParseFailure });
    if (data === PROTOCOL_FAILURE) return null;
    const gate = gateProviderResponse(data, { protocol: "gemini", mode: "text" });
    if (!gate.ok) {
      reportGateFailure(gate.failure, {
        provider: "Gemini", where: "call", status: response.status, responseMode: "text", rawText: rawText, onParseFailure: onParseFailure,
      });
      return null;
    }
    const candidate = data?.candidates?.[0];
    const text = extractAnswerText(candidate?.content?.parts);
    const finishReason = candidate?.finishReason ?? null;
    if (!hasUsableCompletion(text, rawText)) {
      return reportProviderEmptyCompletion({
        provider: "Gemini", where: "call", status: response.status, rawText, onParseFailure,
      });
    }
    return finalizeText(text, { rawText, finishReason, onParseFailure });
  }

  async function fetchStreaming({ body, signal, onToken, onThought, rawText, onParseFailure }) {
    const url = `${GEMINI_BASE}/${encodeURIComponent(config.model)}:streamGenerateContent?alt=sse`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) return reportApiError(response, "streaming call", rawText, onParseFailure);

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) {
      const data = await readProviderJson(response, { provider: "Gemini", where: "streaming call", rawText: rawText, onParseFailure: onParseFailure });
      if (data === PROTOCOL_FAILURE) return null;
      const gate = gateProviderResponse(data, { protocol: "gemini", mode: "text" });
      if (!gate.ok) {
        reportGateFailure(gate.failure, {
          provider: "Gemini", where: "streaming call", status: response.status, responseMode: "text", rawText: rawText, onParseFailure: onParseFailure,
        });
        return null;
      }
      const candidate = data?.candidates?.[0];
      const text = extractAnswerText(candidate?.content?.parts);
      const finishReason = candidate?.finishReason ?? null;
      if (!hasUsableCompletion(text, rawText)) {
        return reportProviderEmptyCompletion({
          provider: "Gemini", where: "streaming call", status: response.status, rawText, onParseFailure,
        });
      }
      if (!hasUsableCompletion(text, rawText)) {
      return reportProviderEmptyCompletion({
        provider: "Gemini", where: "call", status: response.status, rawText, onParseFailure,
      });
    }
    return finalizeText(text, { rawText, finishReason, onParseFailure });
    }

    let answerFull = "";
    let thoughtFull = "";
    let finishReason = null;

    const streamCtx = {
      provider: "Gemini", where: "streaming call", status: response.status, rawText, onParseFailure,
    };
    const drained = await drainSseStream(response, {
      onPayload(parsed) {
        // Gemini reports a mid-stream failure as a terminal `error` frame. With
        // no guard here, that frame was read as an unremarkable event while
        // partial text kept accumulating into a dispatchable decision.
        // Same gate as every other response mode. A stream frame carries no
        // terminal state of its own — the driver tracks that across frames — so
        // only the completion check is deferred to after the drain.
        const gate = gateProviderResponse(parsed, { protocol: "gemini", mode: "stream" });
        if (!gate.ok) return stopWith(reportGateFailure(gate.failure, streamCtx));
        if (gate.kind === "metadata") return undefined;
        const { candidate } = gate;
        // First terminal reason wins, so a later frame cannot overwrite a
        // MAX_TOKENS or SAFETY stop with something that reads as clean.
        if (candidate.finishReason && !finishReason) finishReason = candidate.finishReason;
        const parts = candidate.content?.parts;
        if (!Array.isArray(parts)) return candidate.finishReason ? endStream() : undefined;
        for (const part of parts) {
          const text = typeof part?.text === "string" ? part.text : "";
          if (!text) continue;
          if (part.thought) {
            thoughtFull += text;
            onThought?.(thoughtFull);
          } else {
            answerFull += text;
            onToken?.(answerFull);
          }
        }
        return candidate.finishReason ? endStream() : undefined;
      },
    });
    if (drained.stopped) return drained.result;
    if (drained.failure) return reportProviderStreamFailure(drained.failure, streamCtx);
    // Gemini has no closing marker, so the terminal state is the only signal
    // that generation stopped. Its API is explicit that an absent finishReason
    // means it has not — so an EOF without STOP is a cut stream, and MAX_TOKENS
    // or SAFETY is the model telling us this output was never finished.
    if (finishReason !== "STOP") {
      return reportProviderFinishFailure({
        finishReason, truncated: finishReason === "MAX_TOKENS", ...streamCtx,
      });
    }

    if (!hasUsableCompletion(answerFull, rawText)) {
      return reportProviderEmptyCompletion({
        provider: "Gemini", where: "streaming call", status: response.status, rawText, onParseFailure,
      });
    }
    return finalizeText(answerFull, { rawText, finishReason, onParseFailure });
  }

  function finalizeText(text, { rawText, finishReason, onParseFailure }) {
    if (text == null) return null;
    if (rawText) return text;
    const truncated = finishReason === "MAX_TOKENS";
    return parseContent(text, (failure) => {
      const { raw, reason } = failure;
      console.warn("[Gemini] parse failed:", reason, "finishReason:", finishReason, "— raw:", String(raw).slice(0, 500));
      // Forward the parser's whole failure, then layer provider context on
      // top: rebuilding it by hand dropped fields it had deliberately
      // attached, such as the real length behind a bounded prefix.
      onParseFailure?.({ ...failure, truncated, finishReason });
    });
  }

  async function supportsModality(kind, modelId) {
    if (kind === "text") return true;
    const id = modelId || config.model || "";
    if (!id.startsWith("gemini-")) return false;
    if (kind === "image") return true;
    if (kind === "audio") return /(audio|live|native-audio)/i.test(id);
    return false;
  }

  function dispose() {
    /* stateless — every call builds its own body, no resources held */
  }

  return {
    id: "gemini",
    availability,
    call,
    supportsModality,
    dispose,
  };
}

function extractAnswerText(parts) {
  if (!Array.isArray(parts)) return null;
  let out = "";
  for (const p of parts) {
    if (!p) continue;
    if (p.thought) continue; // ignore thought parts in non-stream answer extraction
    if (typeof p.text === "string") out += p.text;
  }
  return out || null;
}

/**
 * Check whether a JSON Schema uses only features that Gemini's
 * `responseSchema` (OpenAPI 3.0 subset) accepts. Returns the schema
 * unchanged if safe, or null if any unsupported feature is detected.
 *
 * Incompatibilities:
 *   - Union `type: [...]` arrays (including `["x", "null"]` — use
 *     `nullable: true` instead, but REACT_SCHEMA predates that).
 *   - `$ref`, `oneOf`, `anyOf`, `allOf`.
 *   - `additionalProperties: false` is accepted by some versions but
 *     rejected by others; we're conservative.
 */
export function geminiSchemaCompat(schema) {
  if (!schema || typeof schema !== "object") return null;
  if (!isCompat(schema)) return null;
  return schema;
}

function isCompat(node) {
  if (node === null || typeof node !== "object") return true;
  if (Array.isArray(node)) return node.every(isCompat);
  for (const key of Object.keys(node)) {
    if (key === "$ref" || key === "oneOf" || key === "anyOf" || key === "allOf") {
      return false;
    }
    if (key === "type" && Array.isArray(node[key])) return false;
    if (key === "additionalProperties" && node[key] === false) return false;
    if (!isCompat(node[key])) return false;
  }
  return true;
}
