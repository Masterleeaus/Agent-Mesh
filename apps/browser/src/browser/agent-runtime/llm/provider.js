/**
 * LLMProvider registry.
 *
 * Contract every provider fulfils:
 *
 *   id: "openrouter" | "builtin-ai" | "gemini" | "local"
 *   availability(opts?): Promise<{state, progress?, detail?}>
 *     state: "ready" | "needs-download" | "downloading" | "unsupported" | "no-key"
 *   call({messages, schema?, signal?, onToken?, onThought?, stream?,
 *         rawText?, thinking?, onParseFailure?}): Promise<object | string | null>
 *     thinking: { enabled: boolean, effort?: "low"|"medium"|"high", raw?: unknown }
 *     onThought: (cumulativeText) => void (separate channel for thinking trace)
 *     onParseFailure: ({raw, reason, truncated, finishReason, fatal?}) => void
 *       Fires when the provider received a response but parseContent could
 *       not produce an object (returned null), OR when the provider could
 *       not make the call at all in a way the consumer needs to know about
 *       (e.g. Built-in AI `create()` throwing QuotaExceededError because
 *       the input payload is structurally larger than Gemini Nano's context).
 *       `truncated` is true when the provider observed a token-limit cut
 *       (finish_reason "length", Gemini "MAX_TOKENS", Built-in AI
 *       QuotaExceededError, etc.); `finishReason` is the raw provider
 *       string for logging / classification.
 *       `fatal: true` signals an UNRECOVERABLE condition where retrying
 *       with the same payload would fail identically (e.g. input exceeds
 *       the provider's context window). The ReAct retry loop short-
 *       circuits on `fatal` — no corrective reminder is sent, the turn
 *       exits immediately with a provider-specific error message.
 *       Gating by `rawText`:
 *         - `fatal: true` callbacks fire REGARDLESS of `rawText` so raw-text
 *           consumers (e.g. Built-in AI chat-only mode) can render a
 *           classified error instead of a silent null return.
 *         - Non-fatal parse callbacks fire ONLY when `rawText` is falsy —
 *           raw-text consumers do their own parsing downstream and would
 *           not benefit from a parse-failure signal that doesn't apply.
 *   supportsModality(kind: "text"|"image"|"audio", modelId?): Promise<boolean>
 *   dispose(): void
 *
 * Thinking is provider-neutral: each adapter maps `effort` to its own
 * knob (Gemini thinkingBudget, OpenRouter `reasoning.effort`, etc.) or
 * ignores it. `raw` is an escape hatch for provider-specific config.
 * Providers that don't support thinking silently ignore both fields.
 */

import { createOpenRouterProvider } from "./openrouter-provider.js";
import { createBuiltInAIProvider } from "./builtin-ai-provider.js";
import { createGeminiProvider } from "./gemini-provider.js";
import { createLocalOpenAIProvider } from "./local-openai-provider.js";

const PROVIDER_IDS = ["openrouter", "builtin-ai", "gemini", "local"];

export function getProvider(id, config = {}) {
  switch (id) {
    case "openrouter":
      return createOpenRouterProvider(config);
    case "builtin-ai":
      return createBuiltInAIProvider(config);
    case "gemini":
      return createGeminiProvider(config);
    case "local":
      return createLocalOpenAIProvider(config);
    default:
      throw new Error(`Unknown LLM provider id: ${id}`);
  }
}

export function isKnownProvider(id) {
  return PROVIDER_IDS.includes(id);
}

export function listProviders() {
  return PROVIDER_IDS.slice();
}
