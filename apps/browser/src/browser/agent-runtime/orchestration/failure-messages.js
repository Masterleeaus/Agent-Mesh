/**
 * User- and model-facing copy for a turn that could not produce a decision.
 *
 * These live here, and are react-loop's DEFAULTS, because they were previously
 * local to content.js and passed in as loop config. That worked for the
 * content-script loop and silently degraded everywhere else: the service-worker
 * loop is the default route and background.js constructs its runtime with
 * `config: {}`, so the loop fell back to placeholder stubs — a rejected API
 * request rendered "The agent couldn't continue." and a parse-failure retry got
 * the bare reason string instead of corrective guidance.
 *
 * Wiring them as defaults rather than passing them at each entry point is
 * deliberate: a formatter that must be threaded through every call site is one
 * a future call site will forget, and the failure is invisible — the loop still
 * runs, it just stops explaining itself. Callers may still override.
 */

const BLOCKED_FINISH_REASONS = new Set(["content_filter", "SAFETY", "RECITATION"]);

/**
 * Copy for an UNRECOVERABLE failure — the loop exits immediately rather than
 * retrying, so this is the only thing the user gets. It has to say what to
 * change, not just that something broke.
 */
export function fatalFailureMessage(info) {
  // The provider rejected the request outright (bad parameter, bad key, unknown
  // model). Status-specific rather than a raw dump: the rule elsewhere is
  // cause→DevTools, action→user. The 400 branch bends it and appends a bounded
  // slice of the provider's own text, because with a free-form model field
  // "check Settings" does not say WHICH setting is wrong.
  if (info?.reason === "provider_http_error") {
    const who = info.provider || "The model provider";
    if (info.status === 401 || info.status === 403) {
      return `${who} rejected the API key. Check it in Settings.`;
    }
    if (info.status === 404) {
      return `${who} doesn't recognise that model. Check the model name in Settings.`;
    }
    const detail = info.providerMessage ? ` ${info.providerMessage}` : "";
    return `${who} rejected this request — check the model and thinking settings.${detail}`;
  }
  if (info?.finishReason === "QuotaExceededError") {
    // The underlying cause (Gemini Nano's context window is smaller than the
    // ReAct system prompt + tool manifest) is for DevTools. The banner above
    // the chat already frames the limitation; this just needs to say "do X".
    return "Built-in AI can't handle this request. Switch to a cloud provider in Settings.";
  }
  return "The agent couldn't continue. Check Settings or try again later.";
}

/**
 * Copy for a transient provider failure that outlived its retry budget. Kept
 * distinct from fatalFailureMessage because the action differs: nothing is
 * misconfigured, the service is just unavailable right now.
 */
export function providerUnavailableMessage(info) {
  const who = info?.provider || "The model provider";
  // The request never reached a server — different action from a server that
  // answered badly, so don't tell the user to wait when the fix is their
  // connection (or, for Local, a server that isn't running).
  if (info?.reason === "provider_transport_error") {
    return `Couldn't reach ${who}. Check your connection and try again.`;
  }
  // A response DID arrive, it just wasn't readable — overwhelmingly a captive
  // portal or proxy answering on the provider's behalf. "Check your connection"
  // would be wrong here: the connection is working, something is intercepting it.
  // The provider itself answered with nothing. The network is fine and there is
  // nothing for the user to fix, so this must NOT borrow the proxy copy below.
  if (info?.reason === "provider_empty_completion") {
    // Reached only after the retry budget is spent, at which point the loop
    // ends the turn — so this must not promise a retry it will not perform.
    return `${who} returned an empty response. Try again shortly.`;
  }
  if (info?.reason === "provider_protocol_error") {
    return `${who} sent a response that couldn't be read. A proxy or sign-in portal may be intercepting the request.`;
  }
  if (info?.status === 429) {
    return `${who} is rate-limiting requests. Wait a moment and try again.`;
  }
  const status = info?.status ? ` (HTTP ${info.status})` : "";
  return `${who} is temporarily unavailable${status}. Try again shortly.`;
}

/**
 * Per-branch retry reminder for a RECOVERABLE parse failure — enough for the
 * model to self-correct on the next attempt.
 */
// The corrective instruction has to name the interface the request actually
// used. Derived once so every branch stays consistent with it.
function responseInstruction(info, { compact = false } = {}) {
  if (info?.responseMode === "native-tool") {
    // Both outcomes are valid on this path: the adapters take a tool call for
    // an action, and JSON text for an end-turn decision. There is no terminal
    // tool, so naming only the call would make finishing unrepresentable.
    return compact
      ? "For an action invoke exactly one supplied tool; to finish, return one compact JSON end-turn decision."
      : "For an action invoke exactly one supplied tool; to finish, return one JSON end-turn decision.";
  }
  return compact
    ? "Respond with ONLY one compact JSON object."
    : "Respond with ONLY a single JSON object matching the schema — no prose, no markdown fences.";
}

export function buildParseFailureReminder(info) {
  const { raw, reason, truncated, finishReason, recovery } = info ?? {};
  // The provider adapters classify the terminal state; trust that over
  // re-deriving it here from a shorter list, which is how policy reasons the
  // set below does not name ended up getting JSON-correction advice.
  if (recovery === "policy" || (finishReason && BLOCKED_FINISH_REASONS.has(finishReason))) {
    // Deliberately does NOT echo the raw text — re-sending content the
    // platform just blocked invites the same block.
    return `Your previous response was blocked by the provider's policy. Try a different phrasing. ${responseInstruction(info)}`;
  }
  if (recovery === "generation_format") {
    // The model produced a structurally wrong decision, not unparseable text —
    // telling it "your JSON was malformed" describes a different problem. And
    // the corrective form depends on the interface the request actually used:
    // demanding a JSON object from a native tool-call request steers the model
    // away from the interface it was given.
    return `Your previous response stopped in a state the provider could not complete. ${responseInstruction(info)}`;
  }
  if (recovery === "unclassified") {
    // A terminal state we do not recognise. Say what happened rather than
    // guessing that the output was malformed.
    return `The provider stopped the previous response before it finished. ${responseInstruction(info, { compact: true })}`;
  }
  if (recovery === "token_limit" || truncated) {
    return `Your previous response was cut off at the token limit. Be much more terse — keep 'narration' to ≤15 words, omit 'thought' unless the environment block asked for it, and avoid long 'final_answer' text unless you are ending the task. ${responseInstruction(info, { compact: true })}`;
  }
  if (reason === "too-structural") {
    return `Your previous response was too large or deeply nested to inspect safely. ${responseInstruction(info, { compact: true })}`;
  }
  if (!raw) {
    return 'Your previous response could not be parsed as JSON. Respond with ONLY a single JSON object like {"phase":"act","narration":"...","tool":"<name>","args":{...}} or {"phase":"verify","narration":"...","done":true}. No markdown, no prose outside the object.';
  }
  const truncatedRaw = truncateMiddle(String(raw), 1400, 400);
  return [
    "Your previous response could not be parsed as JSON.",
    reason ? `Failure: ${reason}.` : "",
    "Your raw output was:",
    "<<<BEGIN_RAW",
    truncatedRaw,
    ">>>END_RAW",
    'Respond with ONLY one JSON object like {"phase":"act","narration":"...","tool":"<name>","args":{...}} or {"phase":"verify","narration":"...","done":true}. No markdown, no prose outside the object.',
  ].filter(Boolean).join("\n");
}

export function truncateMiddle(s, headN, tailN) {
  if (typeof s !== "string") return "";
  if (s.length <= headN + tailN + 20) return s;
  const omitted = s.length - headN - tailN;
  return `${s.slice(0, headN)}\n…[${omitted} chars truncated]…\n${s.slice(-tailN)}`;
}
