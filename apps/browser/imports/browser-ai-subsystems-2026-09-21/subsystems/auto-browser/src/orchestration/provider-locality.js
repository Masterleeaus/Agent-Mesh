/**
 * Provider locality — which LLM providers can run inside the service worker.
 *
 * When the agent loop relocates into the SW, the LLM call moves with it — but
 * the built-in-AI provider (Chrome's on-device Gemini Nano) reaches the
 * `LanguageModel` global, which the extension instantiates only from a page
 * context (src/llm/builtin-ai-provider.js). The three fetch-based providers
 * (OpenRouter / Gemini / local OpenAI-compatible) have no DOM/page dependency
 * and run anywhere.
 *
 * So `callLLM` is bifurcated: fetch providers run in the SW; built-in-AI is
 * routed back to the content script. DO NOT move built-in-AI into the SW path
 * without first proving `self.LanguageModel` is available and functional there.
 */

export const PAGE_BOUND_PROVIDERS = Object.freeze(["builtin-ai"]);

// Only the explicitly page-bound providers route to the content script; anything
// else is assumed fetch-based and SW-safe (a new fetch provider shouldn't have
// to edit this list to work).
export function isProviderServiceWorkerSafe(providerId) {
  return !PAGE_BOUND_PROVIDERS.includes(providerId);
}

// Pick the transport for an LLM call by provider locality. Returns the chosen
// thunk; the caller invokes it with the actual messages/opts.
export function routeLlmCall(providerId, { runInServiceWorker, runViaContentScript }) {
  return isProviderServiceWorkerSafe(providerId) ? runInServiceWorker : runViaContentScript;
}
