// Native tool-use — pure wire-shape library.
//
// Phase 1.1 from the SOTA adoption plan. Providers that expose native
// tool-calling (OpenAI-compatible `tools[]`, Gemini `functionDeclarations`,
// Anthropic `tool_use`) let the model emit a typed tool call that the
// provider itself parses — strictly higher accuracy than JSON-in-text
// because there is no JSON to parse at all on our end.
//
// This module owns ONLY wire-shape translation. No network, no capability
// negotiation, no routing. Providers call into it; the ReAct loop calls
// into providers.
//
// Built incrementally, test-first (Phase 1.1 PR). Behaviors land in this
// order so reviewers can trace the TDD log against the diff:
//   1. canonicalizeToolManifest()  — internal shape → canonical.
//   2. toOpenAIToolsWire()         — canonical → OpenAI tools[] shape.
//   3. toGeminiFunctionDeclarations() — canonical → Gemini shape.
//   4. parseOpenAIToolUseResponse()   — response → {tool, args}.
//   5. parseGeminiToolUseResponse()   — response → {tool, args}.
//   6. supportsOpenAIToolUse()     — /api/v1/models capability probe.

const OPENAI_TOOL_NAME_RE = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_DESCRIPTION_LEN = 1000;
const EMPTY_OBJECT_SCHEMA = { type: "object", properties: {} };

// WebMCP allows `[A-Za-z0-9._-]{1,128}` (see webmcp-shim.js), but OpenAI's
// function-name pattern is stricter at `[A-Za-z0-9_-]{1,64}`. Rather than
// dropping valid WebMCP tools (e.g. `calendar.create_event`) from the
// native manifest — which would leave them listed in the prompt but
// uncallable — we sanitize: replace disallowed chars with `_` and truncate
// to 64. If sanitization yields an empty string or a collision with an
// already-accepted tool, we fall back to `tool_<index>` so every valid
// WebMCP entry gets SOME provider-safe name. The canonical entry records
// both the safe name AND the original; aliasToolDecision() maps the
// response back when the model emits a call.
function toProviderSafeName(name, index, seen) {
  // Fast path: already provider-safe AND not a duplicate of an earlier
  // entry. Collision check applies here too — two WebMCP tools both
  // named "click", or a safe name that collides with an earlier
  // sanitized name, must disambiguate.
  if (OPENAI_TOOL_NAME_RE.test(name) && !seen.has(name)) return name;
  const replaced = name.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 64);
  if (!replaced || seen.has(replaced)) return `tool_${index}`;
  return replaced;
}

/**
 * Normalize an array of internal-shape tools to `{name, originalName, description, parameters}`.
 *
 * Entries are dropped only when structurally unusable:
 *   - Non-object entries.
 *   - Non-string or empty names.
 *
 * Names that would violate the provider regex (e.g. WebMCP dotted names
 * like `calendar.create_event`, or names > 64 chars) are RENAMED, not
 * dropped — see `toProviderSafeName`. The original name is preserved in
 * `originalName` so providers can map responses back before handing them
 * to the ReAct loop.
 *
 * Overly-long descriptions (OpenAI 1024-char soft limit) are truncated at
 * 1000 chars with an ellipsis. Missing `inputSchema` becomes a canonical
 * empty object schema so downstream wire conversions don't have to null-check.
 */

import { parseProviderJson, isJsonBudgetError } from "./http-failure.js";
export function canonicalizeToolManifest(tools) {
  if (!Array.isArray(tools)) return [];
  const out = [];
  const seen = new Set();
  tools.forEach((t, index) => {
    if (!t || typeof t !== "object") return;
    if (typeof t.name !== "string" || !t.name) return;

    const providerName = toProviderSafeName(t.name, index, seen);
    seen.add(providerName);

    const description = typeof t.description === "string" ? t.description : "";
    const truncated =
      description.length > MAX_DESCRIPTION_LEN
        ? `${description.slice(0, MAX_DESCRIPTION_LEN)}…`
        : description;

    const parameters =
      t.inputSchema && typeof t.inputSchema === "object"
        ? t.inputSchema
        : EMPTY_OBJECT_SCHEMA;

    out.push({
      name: providerName,
      originalName: t.name,
      description: truncated,
      parameters,
    });
  });
  return out;
}

/**
 * Map a provider-native decision (`{tool, args}`) from the provider-safe
 * name back to the original WebMCP name, when they differ.
 *
 * When `canonicalizeToolManifest` renames `calendar.create_event` →
 * `calendar_create_event` (or `tool_3`), the model emits the renamed
 * version; the ReAct loop and WebMCP dispatcher expect the original. This
 * helper is the one-line translation layer. No-op when no rename occurred.
 *
 * Returns the decision unchanged when:
 *   - decision is null/undefined (pass-through).
 *   - decision.tool doesn't match any canonical entry (e.g. a built-in
 *     name or an unexpected tool — let the dispatcher's own validation
 *     reject it rather than silently rewriting).
 */
export function aliasToolDecision(decision, canonicalManifest) {
  if (!decision || typeof decision !== "object") return decision;
  if (typeof decision.tool !== "string") return decision;
  if (!Array.isArray(canonicalManifest)) return decision;
  for (const entry of canonicalManifest) {
    if (entry?.name === decision.tool && entry.originalName && entry.originalName !== entry.name) {
      return { ...decision, tool: entry.originalName };
    }
  }
  return decision;
}

/**
 * OpenAI/OpenRouter `tools[]` wire shape.
 *
 * One shape covers OpenAI direct, OpenRouter (OpenAI-compat), Anthropic
 * via OpenRouter, Gemini via OpenRouter, and the Local OpenAI-compat
 * provider (Ollama, LM Studio, vLLM, llama.cpp). Providers that speak
 * their own native shape (Gemini direct, Anthropic direct) use their
 * own helper.
 *
 * Phase 1.2 (§5.2 — make tool-use the default): tool parameter schemas
 * are tightened with `additionalProperties: false` recursively on every
 * nested object schema. This is the canonical "strict schema" constraint
 * OpenAI's tools API expects — the model is told NOT to invent extra
 * fields beyond what the tool declares. Cuts hallucinated-argument
 * failures (e.g. the model adding `confirm:true` to a click) on capable
 * models. The constraint is purely additive: schemas that already
 * declare `additionalProperties` (true, false, or sub-schema) pass
 * through unchanged so authorial intent isn't clobbered. Schemas that
 * aren't `type: "object"` are skipped — `additionalProperties` only has
 * meaning for objects.
 */
export function toOpenAIToolsWire(canonicalManifest) {
  if (!Array.isArray(canonicalManifest)) return [];
  return canonicalManifest.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: withStrictParameters(t.parameters),
    },
  }));
}

/**
 * Recursively add `additionalProperties: false` to every `type:"object"`
 * schema in the given tree. Pure function — never mutates the input.
 *
 * Skipped at any node when:
 *   - The node is not a plain object (handles arrays, null, primitives).
 *   - The node already has an `additionalProperties` key (any value).
 *     Prevents overriding e.g. `{additionalProperties: {type:"string"}}`
 *     for a map-shaped argument.
 *   - The node's `type` is not the literal string `"object"`. Union
 *     types (`type: ["object","null"]`) and non-object primitives are
 *     passed through.
 *   - The node composes its allowed keys via `oneOf`/`anyOf`/`allOf`.
 *     PR #45 review fix: under draft-07 / OpenAI strict semantics,
 *     `additionalProperties:false` at the parent considers ONLY the
 *     parent's direct `properties` — keys defined inside combinator
 *     branches are rejected as extras, making the schema unsatisfiable.
 *     Each branch can still get its own strictness when recursed below.
 *
 * Recursion descends into:
 *   - `properties.<name>` — each property's schema.
 *   - `items`             — array element schema (the array itself
 *                            isn't `object`, but its items might be).
 *   - `oneOf` / `anyOf` / `allOf` — each branch may be an object schema.
 *
 * NOT exported — internal-only, used by `toOpenAIToolsWire`. Gemini's
 * `functionDeclarations` path deliberately omits this:
 * `additionalProperties:false` has historically been rejected by some
 * Gemini schema validators (see `geminiSchemaCompat` in gemini-provider.js).
 * Lifting it to Gemini's tool path would require empirical verification
 * across gemini-1.5/2.x versions, which is out of scope for §5.2.
 */
function withStrictParameters(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return node;
  const next = { ...node };
  // Detect whether this node composes its allowed keys via combinator.
  // When it does, we MUST NOT stamp `additionalProperties:false` here:
  // draft-07 / OpenAI strict mode ignore combinator-pulled keys when
  // evaluating `additionalProperties`, so doing so would reject every
  // property defined only via the branch and break the schema.
  const hasCombinator = ["oneOf", "anyOf", "allOf"].some((key) =>
    Array.isArray(next[key]),
  );
  if (
    next.type === "object" &&
    !hasCombinator &&
    !Object.hasOwn(next, "additionalProperties")
  ) {
    next.additionalProperties = false;
  }
  if (next.properties && typeof next.properties === "object" && !Array.isArray(next.properties)) {
    const props = {};
    for (const [k, v] of Object.entries(next.properties)) {
      props[k] = withStrictParameters(v);
    }
    next.properties = props;
  }
  if (next.items) {
    next.items = withStrictParameters(next.items);
  }
  for (const key of ["oneOf", "anyOf", "allOf"]) {
    if (Array.isArray(next[key])) {
      next[key] = next[key].map((s) => withStrictParameters(s));
    }
  }
  return next;
}

/**
 * Gemini `functionDeclarations` wire shape (inner array). Provider adapters
 * wrap this as `tools: [{ functionDeclarations: [...] }]` on the request.
 */
export function toGeminiFunctionDeclarations(canonicalManifest) {
  if (!Array.isArray(canonicalManifest)) return [];
  return canonicalManifest.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));
}

/**
 * OpenAI chat-completions response → our internal {tool, args} decision.
 *
 * Expected response.choices[0].message shape:
 *   { role: "assistant", content: null | string,
 *     tool_calls: [{id, type: "function", function: {name, arguments: "<json>"}}] }
 *
 * MVP: takes the FIRST tool call. Parallel tool calls in one response are
 * ignored — listed as a future extension in the Phase 1 notes of the
 * adoption plan. Malformed `arguments` JSON degrades to `args: {}` rather
 * than dropping the decision entirely; the dispatcher's own arg validation
 * catches downstream.
 */
/**
 * A structural refusal, distinct from "this response carries no tool call".
 * Callers must treat it as terminal rather than as permission to try text.
 */
export const TOOL_PARSE_REFUSED = Symbol("tool-parse-refused");

export function parseOpenAIToolUseResponse(response) {
  const choice = response?.choices?.[0];
  if (!choice) return null;
  const calls = choice.message?.tool_calls;
  if (!Array.isArray(calls) || calls.length === 0) return null;
  const first = calls[0];
  if (!first || first.type !== "function" || !first.function) return null;
  const name = first.function.name;
  if (typeof name !== "string" || !name) return null;
  let args = {};
  const raw = first.function.arguments;
  if (typeof raw === "string" && raw.length > 0) {
    try {
      // Budgeted like every other model-controlled parse: arguments arrive as
      // a string, so the envelope's budget counted them as one node.
      const parsed = parseProviderJson(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        args = parsed;
      }
    } catch (err) {
      // Syntax-only compatibility. A structural refusal is not a model writing
      // bad JSON — substituting {} would turn "we declined to read this" into
      // an executable no-argument call.
      // Distinct from "no call": returning null here let the caller fall
      // through to sibling content or another request and dispatch that
      // instead, which is the outcome refusing the arguments was meant to stop.
      if (isJsonBudgetError(err)) return TOOL_PARSE_REFUSED;
      args = {};
    }
  }
  return { tool: name, args };
}

/**
 * Gemini generateContent response → internal {tool, args}.
 *
 * Expected:
 *   response.candidates[0].content.parts: [{text?, functionCall?: {name, args}}]
 *
 * MVP: first functionCall part only. Text parts are skipped — in tool-use
 * mode Gemini usually emits one or the other, but models sometimes mix.
 * Returns null when no functionCall part exists so callers can fall
 * through to JSON-in-text parsing on the text content.
 */
export function parseGeminiToolUseResponse(response) {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    const fc = part?.functionCall;
    if (!fc || typeof fc.name !== "string" || !fc.name) continue;
    const args =
      fc.args && typeof fc.args === "object" && !Array.isArray(fc.args)
        ? fc.args
        : {};
    return { tool: fc.name, args };
  }
  return null;
}

/**
 * Capability probe against an OpenRouter `/api/v1/models` catalog entry.
 *
 * OpenRouter surfaces `supported_parameters: string[]` per model. Tool-use
 * capability is signalled by either `"tools"` (OpenAI-style) or
 * `"tool_choice"` in that list — we accept either to be resilient to
 * catalog wording drift.
 *
 * Returns false for unknown / missing / non-array `supported_parameters`
 * — i.e. "fail closed into JSON-in-text" when we're uncertain, since
 * misdirecting a non-tool-use model into the tools path produces 400s.
 */
export function supportsOpenAIToolUse(modelEntry) {
  const params = modelEntry?.supported_parameters;
  if (!Array.isArray(params)) return false;
  return params.includes("tools") || params.includes("tool_choice");
}
