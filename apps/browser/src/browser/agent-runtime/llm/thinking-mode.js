/**
 * Thinking-channel unification (Phase 1).
 *
 * Three reasoning surfaces exist in the wild and would otherwise overlap:
 *   1. Provider-native thinking stream (Gemini thought parts, OpenRouter
 *      delta.reasoning + delta.reasoning_details, Local delta.reasoning).
 *   2. Schema `thought` field — long-form reasoning emitted inside the JSON
 *      decision. Available on every model regardless of native channel.
 *   3. Schema `narration` field — ≤15-word user-facing step label.
 *
 * `resolveThinkingMode` returns one of three states (mutually exclusive,
 * exhaustive) so the rest of the loop never has to branch on
 * (provider, model, toggle) tuples directly:
 *
 *   { native: true,  schemaThoughtRequested: false }  // thinking on, native channel
 *   { native: false, schemaThoughtRequested: true  }  // thinking on, no native channel
 *   { native: false, schemaThoughtRequested: false }  // thinking OFF — respect the user
 *
 * `buildPhasePromptBlock` returns the per-call prompt text describing the
 * current phase + how to format `thought` for that mode. The static system
 * prefix stays cacheable per (provider, mode-key, phase) tuple — the same
 * three modes produce the same three prompt variants, hashable by
 * `modeKey(mode)` for prefix-cache discipline.
 *
 * "Thinking off" is a first-class mode, not the absence of one — when the
 * user disables thinking we DO NOT request a `thought` field in the schema
 * and we do NOT route any native reasoning into onThought. Phase + narration
 * + tool/done still work; structural metadata is not reasoning.
 */

export const PHASES = Object.freeze([
  "plan",
  "analyze",
  "act",
  "verify",
  "recover",
]);

export function isValidPhase(phase) {
  return typeof phase === "string" && PHASES.includes(phase);
}

/**
 * Models on each provider that emit native reasoning tokens we can capture.
 * Lists are conservative — when uncertain, return false and the loop falls
 * back to the schema-thought path (still works, just not as fluid).
 *
 * For OpenRouter the prefix matches the provider/family; for Local the
 * decision rests on whether the user's server actually emits `delta.reasoning`
 * (we can't probe ahead of time, so we trust the per-model `vision`-style
 * opt-in pattern via `config.reasoning` array if present, or default false).
 */
export function openRouterModelHasNativeReasoning(modelId) {
  if (!modelId || typeof modelId !== "string") return false;
  const id = modelId.toLowerCase();
  // Anthropic Claude reasoning models — Sonnet 4.x with extended thinking,
  // Opus 4.x. The `thinking` model variant suffix may also appear.
  if (/^anthropic\//.test(id)) {
    if (/sonnet-4|opus-4|haiku-4/.test(id) && /thinking|reason/.test(id)) return true;
    if (/claude-(sonnet|opus|haiku)-4/.test(id)) return true;
    if (/claude-3\.7-sonnet/.test(id)) return true;
    return false;
  }
  // OpenAI o-series: o1, o1-mini, o1-preview, o3, o3-mini, o4 family.
  if (/^openai\//.test(id)) {
    return /\bo[1-9](?:-|$|\.)/.test(id);
  }
  // DeepSeek R1 family.
  if (/^deepseek\//.test(id) && /r1/.test(id)) return true;
  // Generic: model id contains "thinking" or "reasoning".
  if (/(thinking|reasoning|-r1\b)/.test(id)) return true;
  return false;
}

/**
 * Decide which thinking mode is active for this call.
 *
 * Inputs:
 *   - provider: provider id ("openrouter" | "builtin-ai" | "gemini" | "local")
 *   - config:   the per-provider config sub-object (model, thinking, etc.)
 *
 * Output (always returns one of three exhaustive shapes):
 *   { native: bool, schemaThoughtRequested: bool, effort?: "low"|"medium"|"high" }
 *
 * Invariant: if `native:true`, `schemaThoughtRequested:false` (no double-source).
 * Invariant: if both flags false, the user has disabled thinking — respect it.
 */
export function resolveThinkingMode({ provider, config } = {}) {
  const cfg = config || {};
  const thinkingEnabled = isThinkingEnabled(provider, cfg);

  if (!thinkingEnabled) {
    return { native: false, schemaThoughtRequested: false };
  }

  switch (provider) {
    case "gemini":
      // Gemini emits `thought:true` parts when thinkingConfig.includeThoughts
      // is set — already wired in gemini-provider.js. Native always when on.
      return { native: true, schemaThoughtRequested: false, effort: deriveEffort(cfg) };

    case "openrouter":
      // Reasoning effort only meaningful for reasoning-capable models. For
      // non-reasoning models, requesting effort is a no-op on the wire and
      // we fall back to schema thought.
      if (openRouterModelHasNativeReasoning(cfg.model)) {
        return { native: true, schemaThoughtRequested: false, effort: deriveEffort(cfg) };
      }
      return { native: false, schemaThoughtRequested: true };

    case "local":
      // Locals vary wildly. The user opts in per-model via config.reasoning[]
      // (mirrors the existing config.vision[] pattern). When the model is
      // listed, we read delta.reasoning from the SSE stream; otherwise we
      // request a schema-`thought` field.
      if (Array.isArray(cfg.reasoning) && cfg.model && cfg.reasoning.includes(cfg.model)) {
        return { native: true, schemaThoughtRequested: false };
      }
      return { native: false, schemaThoughtRequested: true };

    case "builtin-ai":
      // Gemini Nano via Chrome's Prompt API has no thought channel exposed
      // through `promptStreaming()`. We ask for a schema-`thought` instead.
      return { native: false, schemaThoughtRequested: true };

    default:
      // Unknown provider — fail closed: no thought surface at all.
      return { native: false, schemaThoughtRequested: false };
  }
}

function isThinkingEnabled(provider, cfg) {
  // Per-provider toggle conventions:
  //   gemini.thinking: boolean (already in use)
  //   openrouter.thinking: boolean (Phase 1 — opt-in)
  //   local.thinking:    boolean (Phase 1 — opt-in)
  //   builtin-ai:        no toggle; treat as enabled by default so the schema
  //                      thought renders (the user has no other reasoning
  //                      surface on this provider).
  if (provider === "builtin-ai") return cfg.thinking !== false;
  return !!cfg.thinking;
}

function deriveEffort(cfg) {
  const v = cfg.thinkingEffort;
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

/**
 * Stable key used for prompt-cache partitioning. Same mode → same key →
 * same static prefix → cache hits across calls.
 */
export function modeKey(mode) {
  if (!mode) return "off";
  if (mode.native) return "native";
  if (mode.schemaThoughtRequested) return "schema-thought";
  return "off";
}

/**
 * Per-phase prompt block (returns ONE phase's block, not the whole prefix).
 * The caller (content.js) composes the static system prefix from the
 * combined phase blocks at module-init time, partitioned by `modeKey(mode)`.
 *
 * The content shape is identical across phases except for the OUTPUT FORMAT
 * thought-instruction sentence, which is mode-specific:
 *
 *   native:                    "Your reasoning is captured natively by the
 *                               platform — do NOT include a `thought` field
 *                               in the JSON; that would duplicate it."
 *   schemaThoughtRequested:    "Include your reasoning under `thought`
 *                               (1-3 sentences) — the UI surfaces it under
 *                               each step."
 *   off:                       "Emit concise JSON decisions; do NOT include
 *                               a `thought` field — the user has disabled
 *                               reasoning visibility."
 */
export function buildPhasePromptBlock({ mode, phase }) {
  if (!isValidPhase(phase)) phase = "act";
  const thoughtRule = thoughtRuleFor(mode);
  const description = PHASE_DESCRIPTIONS[phase];
  return [
    `PHASE: ${phase} — ${description}`,
    thoughtRule,
  ].join("\n");
}

const PHASE_DESCRIPTIONS = {
  plan: "Decompose the user's goal into the next 1-3 concrete steps. Emit `tool: null` if you only want to think; emit a tool call if the next step is obvious.",
  analyze: "Read the current state (snapshot, page text, prior tool results) and identify what to do next. May emit `tool: null` for a pure cognitive beat.",
  act: "Execute the next concrete step. Pick the right tool from WEBMCP first, then BUILT-IN.",
  verify: "Check that the previous mutating action took effect. Use a read-only tool (snapshot, page text, network, console) or end the turn.",
  recover: "The previous attempt did not work. Diagnose the failure mode and either propose a different approach (1-3 steps) or end the turn with a clear reason.",
};

function thoughtRuleFor(mode) {
  if (!mode) return THOUGHT_RULE_OFF;
  if (mode.native) return THOUGHT_RULE_NATIVE;
  if (mode.schemaThoughtRequested) return THOUGHT_RULE_SCHEMA;
  return THOUGHT_RULE_OFF;
}

const THOUGHT_RULE_NATIVE =
  "Your reasoning is captured natively by the platform — do NOT include a `thought` field in the JSON; that would duplicate it. Always include `narration` (≤15 words, user-facing label) and `phase`.";

const THOUGHT_RULE_SCHEMA =
  "Include your reasoning under `thought` (1-3 sentences, plain text — no markdown). The UI surfaces it under each step. Always include `narration` (≤15 words, user-facing label) and `phase`.";

const THOUGHT_RULE_OFF =
  "Emit concise JSON decisions; do NOT include a `thought` field — the user has disabled reasoning visibility. Always include `narration` (≤15 words, user-facing label) and `phase`.";
