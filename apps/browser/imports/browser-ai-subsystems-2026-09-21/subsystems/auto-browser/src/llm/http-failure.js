/**
 * Shared HTTP-failure classification for LLM providers.
 *
 * Every adapter used to `return null` on a non-OK response. The ReAct loop
 * reads null as "the model emitted unparseable output", so a 401, a 429 and a
 * genuinely empty stream were indistinguishable: the loop queued a
 * JSON-correction reminder for a response that never existed, retried
 * immediately, and ended the turn blaming the model for a server error.
 * openrouter-provider.js's own `logHttpFailure` comment has said as much for a
 * while — it added logging, which explains the failure to a developer reading
 * DevTools but changes nothing about what the loop or the user sees.
 *
 * Classification lives here rather than per-provider so a fix for one adapter
 * is a fix for all of them. Consumers: react-loop's fatal short-circuit and its
 * transient-retry branch, both keyed on `reason === "provider_http_error"`.
 *
 * IMPORTANT for adapters with deliberate degradation paths: only call this
 * where the provider is actually giving up. local-openai-provider returns
 * `undefined` to fall back (tool-use → JSON-in-text, streaming → non-streaming)
 * and recovers on its own; classifying those would report a failure that the
 * provider is about to handle.
 */

// The only client errors an unchanged retry can clear: a server-side timeout,
// "too early", and rate limiting. Everything else in 4xx means the request
// itself is wrong, so retrying it identically is defined not to help.
const RETRYABLE_CLIENT_STATUSES = new Set([408, 425, 429]);

// Bound the provider's text before it can reach a chat bubble.
const DETAIL_MAX = 200;

// Matches the stream driver's bound, so a body cannot bypass by not streaming.
const DEFAULT_MAX_BODY_BYTES = 32_000_000;

/**
 * A byte bound does not bound the object graph. `[{},{},{}...]` is three bytes
 * per node, so a permitted body can still be millions of live objects by the
 * time JSON.parse returns — the validators never get the chance to reject it.
 *
 * Sized well above any real response: the largest legitimate body here is the
 * OpenRouter model catalog at a few tens of thousands of nodes.
 */
const DEFAULT_MAX_JSON_NODES = 200_000;
const DEFAULT_MAX_JSON_DEPTH = 100;

/**
 * Cumulative allowance for ONE response.
 *
 * Per-document limits bound each parse, and frames are dropped as soon as they
 * are handled — but "unreachable" is not "not allocated". A stream of frames
 * each well inside the per-frame limit still allocated millions of objects in
 * one drain loop, and peak RSS grew because allocation outran collection.
 *
 * Sized against the worst legitimate stream: an output ceiling of ~65k tokens
 * at roughly a dozen nodes per frame is under a million, so this leaves several
 * times that in headroom.
 */
const DEFAULT_MAX_RESPONSE_NODES = 4_000_000;

class JsonBudgetError extends Error {}

export function isJsonBudgetError(error) {
  return error instanceof JsonBudgetError;
}

/** A response-scoped budget: per-document limits plus a cumulative allowance. */
export function createJsonBudget({
  maxNodes = DEFAULT_MAX_JSON_NODES,
  maxDepth = DEFAULT_MAX_JSON_DEPTH,
  maxResponseNodes = DEFAULT_MAX_RESPONSE_NODES,
} = {}) {
  for (const [name, value] of [["maxNodes", maxNodes], ["maxDepth", maxDepth], ["maxResponseNodes", maxResponseNodes]]) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new RangeError(`${name} must be a positive safe integer, received ${String(value)}`);
    }
  }
  return { maxNodes, maxDepth, remaining: maxResponseNodes };
}

function assertJsonBudget(text, { maxNodes = DEFAULT_MAX_JSON_NODES, maxDepth = DEFAULT_MAX_JSON_DEPTH } = {}) {
  let quoted = false, escaped = false, depth = 0, nodes = 1;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charCodeAt(i);
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === 92) escaped = true;      // backslash
      else if (ch === 34) quoted = false;      // quote
      continue;
    }
    if (ch === 34) { quoted = true; continue; }
    if (ch === 123 || ch === 91) { depth += 1; nodes += 1; }   // { [
    else if (ch === 125 || ch === 93) depth -= 1;              // } ]
    else if (ch === 44) nodes += 1;                            // ,
    else continue;
    if (depth > maxDepth || nodes > maxNodes) throw new JsonBudgetError();
  }
  return nodes;
}

/**
 * Parse only what fits the structural budget.
 *
 * A shared `budget` also draws down a cumulative allowance, so every document
 * in one response is charged against the same total.
 */
export function parseProviderJson(text, budget) {
  // Validated HERE, not only in the factory: an object that merely looks like a
  // budget disabled the checks it appears to configure, and a caller holding one
  // has no way to tell. Undefined means "use the defaults", which is bounded.
  // A budget must be COMPLETE, not merely plausible. Checking only the fields
  // that happen to be present let a mutated factory budget lose one and
  // silently fall back to the generic default — and a missing `remaining`
  // turned off cumulative accounting altogether.
  if (budget !== undefined) {
    if (!isPlainObject(budget)) {
      throw new RangeError("budget must be created by createJsonBudget()");
    }
    for (const name of ["maxNodes", "maxDepth", "remaining"]) {
      if (!Object.hasOwn(budget, name)) {
        throw new RangeError(`budget is missing ${name}; use createJsonBudget()`);
      }
      const value = budget[name];
      const floor = name === "remaining" ? 0 : 1;
      if (!Number.isSafeInteger(value) || value < floor) {
        throw new RangeError(`${name} must be a safe integer >= ${floor}, received ${String(value)}`);
      }
    }
  }
  const nodes = assertJsonBudget(text, budget);
  if (budget) {
    budget.remaining -= nodes;
    if (budget.remaining < 0) throw new JsonBudgetError();
  }
  return JSON.parse(text);
}

/**
 * The one place any of these reporters reaches `onParseFailure`.
 *
 * provider.js is explicit: `fatal: true` callbacks fire REGARDLESS of `rawText`,
 * and non-fatal ones fire ONLY when `rawText` is falsy — a raw-text caller does
 * its own parsing and has no use for a parse-failure signal, but still needs to
 * know when retrying is pointless.
 *
 * Centralised because the alternative had already failed: `reportProviderEmptyCompletion`
 * gated correctly while the other three did not, leaving one module with two
 * behaviours and no way to tell which you were getting. Routing every reporter
 * through here means the rule is applied once instead of remembered four times.
 */
function notifyFailure(onParseFailure, info, rawText) {
  if (rawText && !info.fatal) return;
  onParseFailure?.(info);
}

/**
 * OpenRouter reports upstream failures IN BAND under HTTP 200: a top-level
 * `error` (mid-stream, alongside `finish_reason: "error"`), or an `error` on
 * `choices[0]` for a non-streaming provider failure.
 *
 * Ignoring it is the worst failure in this file's history. A generation the
 * provider marked failed can still carry partial content, and partial content
 * that happens to parse is dispatched as a real tool call — so a failed
 * generation becomes a click, a form submit, a navigation. Every other class
 * here is a misleading message; this one takes an action.
 *
 * Classified through the same status matrix as a real HTTP failure, since the
 * in-band error carries the upstream's own code.
 */
function ownField(object, key) {
  return isPlainObject(object) && Object.hasOwn(object, key)
    ? { present: true, value: object[key] }
    : { present: false, value: null };
}

/**
 * Presence of the reserved `error` field, not its truthiness.
 *
 * `error: 0`, `false` or `""` read as absent under a truthiness test, so a
 * response that reserved the field to report a failure was treated as a clean
 * one and its sibling content dispatched.
 */
export function extractInBandError(data) {
  const top = ownField(data, "error");
  if (top.present) return top;
  return ownField(data?.choices?.[0], "error");
}

export function reportInBandError(error, { provider, where, rawText = false, onParseFailure }) {
  const status = Number(error?.code);
  const { fatal, retryable } = classifyHttpStatus(status);
  const message = String(error?.message || "").slice(0, DETAIL_MAX);
  if (typeof console !== "undefined" && console.error) {
    console.error(`[${provider}] ${where}: upstream reported an error (code ${error?.code}) — ${message}`);
  }
  notifyFailure(onParseFailure, {
    raw: "",
    // An unclassifiable code still must not be read as model output, so an
    // in-band error defaults to retryable rather than falling through silently.
    reason: "provider_http_error",
    finishReason: Number.isInteger(status) ? `HTTP_${status}` : "ERROR",
    truncated: false,
    fatal,
    retryable: retryable || !fatal,
    retryAfterMs: 0,
    status: Number.isInteger(status) ? status : null,
    provider,
    providerMessage: message,
  }, rawText);
  return null;
}

/**
 * Does a decoded 200 body actually look like this provider's response?
 *
 * A sign-in portal or proxy can answer with perfectly valid JSON —
 * `{"message":"Sign in to Wi-Fi"}` — which decodes fine, so the SyntaxError
 * discriminator never fires. It then yields no text, `finalizeText(undefined)`
 * returns null WITHOUT reporting, and the loop spends its parse-failure budget
 * correcting a model that never saw the request.
 *
 * Checks the ENVELOPE, not the content. A present-but-empty `choices` array is
 * a real provider response — and `content: null` is legitimate for a
 * tool-call-only reply — so neither may be confused with an unrelated payload.
 */
export function hasChoicesEnvelope(data) {
  return !!data && typeof data === "object" && Array.isArray(data.choices);
}

export function hasCandidatesEnvelope(data) {
  return !!data && typeof data === "object" && Array.isArray(data.candidates);
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Returned instead of a body when it could not be read; the caller must bail. */
export const PROTOCOL_FAILURE = Symbol("provider-protocol-failure");

function cancelAndRelease(reader) {
  try {
    // Not awaited: the result is already decided, and a cancel that never
    // settles must not hold it hostage.
    Promise.resolve(reader.cancel()).catch(() => {});
  } catch {
    // Already closed or errored.
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // A read is still pending.
    }
  }
}

/**
 * Consume a body against a byte bound, batching what it decodes.
 *
 * Batching matters as much as the byte bound: one decoded string per transport
 * chunk means a peer chooses how many objects we retain, and a valid 1 MB body
 * delivered a byte at a time held a million of them. Bounding bytes alone does
 * not bound that.
 *
 * `truncate` is for diagnostics, which want a prefix rather than a failure.
 * Reads are deliberately OUTSIDE the decode/parse handling: a socket reset or
 * an abort is the caller's to classify, not a protocol fault of ours.
 */
const DECODE_BATCH_CHARS = 64 * 1024;
const DECODE_BATCH_ENTRIES = 1024;

async function readBoundedBody(response, { maxBytes, truncate = false, fatal = true }) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal });
  const blocks = [];
  let batch = [];
  let batchChars = 0;
  let total = 0;

  const append = (text) => {
    batch.push(text);
    batchChars += text.length;
    if (batchChars >= DECODE_BATCH_CHARS || batch.length >= DECODE_BATCH_ENTRIES) {
      blocks.push(batch.join(""));
      batch = [];
      batchChars = 0;
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      // Compared by subtraction so the boundary holds if the bound grows.
      if (value.byteLength > maxBytes - total) {
        if (!truncate) return { overflow: true };
        append(decoder.decode(value.subarray(0, maxBytes - total), { stream: true }));
        break;
      }
      total += value.byteLength;
      append(decoder.decode(value, { stream: true }));
      if (truncate && total >= maxBytes) break;
    }
    append(decoder.decode());
    if (batch.length) blocks.push(batch.join(""));
    return { text: blocks.join("") };
  } finally {
    cancelAndRelease(reader);
  }
}

/**
 * Read a JSON body strictly, and report rather than guess when it is unreadable.
 *
 * `response.json()` decodes UTF-8 in replacement mode, so a corrupt byte inside
 * a selector or URL becomes U+FFFD and we go on to dispatch the rewritten
 * action. The stream path already refuses those bytes; a body handed to us in
 * one piece deserves the same treatment.
 */
export async function readProviderJson(response, context, { maxBodyBytes = DEFAULT_MAX_BODY_BYTES } = {}) {
  // Validated before the body is touched, for the fourth time in this file's
  // history: a bound that silently stops bounding is worse than none.
  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes <= 0) {
    throw new RangeError(`maxBodyBytes must be a positive safe integer, received ${String(maxBodyBytes)}`);
  }
  const ctx = { ...context, status: response.status };
  // A 200 with no body is not a completion, and getReader() would throw here
  // and be misread by the caller's catch as a transport outage.
  if (!response.body) {
    reportProviderStreamFailure("malformed_json", ctx);
    return PROTOCOL_FAILURE;
  }

  let read;
  try {
    read = await readBoundedBody(response, { maxBytes: maxBodyBytes });
  } catch (err) {
    // Invalid bytes are ours to classify. Anything else — a socket reset, an
    // abort — belongs to the caller's transport handling, so it propagates.
    if (err instanceof TypeError && /decode|UTF-8/i.test(err.message || "")) {
      reportProviderStreamFailure("invalid_utf8", ctx);
      return PROTOCOL_FAILURE;
    }
    throw err;
  }
  if (read.overflow) {
    reportProviderStreamFailure("stream_limit", ctx);
    return PROTOCOL_FAILURE;
  }
  try {
    return parseProviderJson(read.text);
  } catch (err) {
    reportProviderStreamFailure(err instanceof JsonBudgetError ? "stream_limit" : "malformed_json", ctx);
    return PROTOCOL_FAILURE;
  }
}

/**
 * A short prefix of a body, for diagnostics only.
 *
 * Error and probe bodies were read whole with `.text()`, so a hostile or broken
 * endpoint could grow memory without bound just to yield a 200-character
 * message. Replacement decoding is fine here — this text is shown, never acted
 * on — and the read stops and cancels at the cap.
 */
export async function readDiagnosticText(response, { maxBytes = 4096 } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new RangeError(`maxBytes must be a positive safe integer, received ${String(maxBytes)}`);
  }
  if (!response?.body) return "";
  try {
    const { text } = await readBoundedBody(response, { maxBytes, truncate: true, fatal: false });
    return text ?? "";
  } catch (err) {
    // A cancellation is the user pressing Stop, not a diagnostic we failed to
    // read. Swallowing it made the caller report a provider failure during
    // teardown; every other read failure is genuinely not worth reporting.
    if (err?.name === "AbortError") throw err;
    return "";
  }
}

const GEMINI_SUCCESS_REASONS = new Set(["STOP"]);

// Every documented way a generation can stop early, grouped by what would
// actually help next. `failure-messages.js` is given this classification rather
// than re-deriving it from the raw string, so a provider adding a policy reason
// does not silently fall through to "your JSON was malformed".
const TOKEN_LIMIT_REASONS = new Set(["length", "MAX_TOKENS"]);
const POLICY_REASONS = new Set([
  "content_filter", "SAFETY", "RECITATION", "LANGUAGE",
  "PROHIBITED_CONTENT", "IMAGE_PROHIBITED_CONTENT", "IMAGE_RECITATION",
  "ESCALATION", "BLOCKLIST", "SPII", "IMAGE_SAFETY",
]);

// Reasons that genuinely mean the model produced a structurally wrong decision.
// Everything else unrecognised is left unclassified rather than assumed to be a
// formatting fault — a provider adding an enum member must not silently turn
// into "your JSON was malformed" advice.
const FORMAT_REASONS = new Set(["MALFORMED_FUNCTION_CALL", "UNEXPECTED_TOOL_CALL"]);
// The provider aborted its own generation; nothing about the request was wrong.
const TRANSIENT_REASONS = new Set(["error"]);

export function classifyFinishRecovery(finishReason) {
  if (finishReason == null || TRANSIENT_REASONS.has(finishReason)) return "transient";
  if (TOKEN_LIMIT_REASONS.has(finishReason)) return "token_limit";
  if (POLICY_REASONS.has(finishReason)) return "policy";
  if (FORMAT_REASONS.has(finishReason)) return "generation_format";
  return "unclassified";
}

/**
 * Did a COMPLETE JSON body report a generation that finished?
 *
 * Returns null when it did, or the detail to report when it did not.
 *
 * A terminal state is REQUIRED by default. A complete body proves the transport
 * finished, not that the model did, and Gemini documents an absent reason as
 * "still generating". `allowMissingReason` exists only for the Local adapter,
 * whose whole purpose is absorbing the variance of self-hosted OpenAI-compatible
 * servers; scoping the concession there keeps hosted providers strict instead of
 * weakening everyone to accommodate them.
 */
export function jsonCompletionFailure(data, { gemini = false, allowMissingReason = false } = {}) {
  const blocked = gemini ? data?.promptFeedback?.blockReason : null;
  if (blocked) return { finishReason: blocked, truncated: false };

  // "Did the generation finish" only applies when there is one. An envelope with
  // an empty array carries no content to dispatch, and the empty-completion
  // check gives the user a more precise answer than "it stopped early".
  const slot = gemini ? data?.candidates?.[0] : data?.choices?.[0];
  if (slot == null) return null;

  const reason = gemini ? slot.finishReason : slot.finish_reason;

  if (reason == null) {
    return allowMissingReason ? null : { finishReason: null, truncated: false };
  }
  if (gemini) {
    return GEMINI_SUCCESS_REASONS.has(reason)
      ? null
      : { finishReason: reason, truncated: reason === "MAX_TOKENS" };
  }
  // `tool_calls` ends a native tool decision as legitimately as `stop` ends a
  // text one. The pairing is NOT enforced against the message shape: servers in
  // Local's compatibility range disagree about which of the two they send with
  // a tool call, and rejecting the mismatch would break working tool-use for no
  // safety gain — a truncated or filtered tool call already fails on its own
  // reason, which is the case that can actually dispatch something wrong.
  if (reason === "stop" || reason === "tool_calls") return null;
  return { finishReason: reason, truncated: reason === "length" };
}

/**
 * THE RESPONSE GATE.
 *
 * Every provider response — streamed frame or whole body, text or native tool —
 * passes through this one function, and every caller consumes its verdict.
 *
 * It exists because the alternative failed repeatedly. Validation used to be a
 * chain each call site assembled for itself: extract the in-band error, test an
 * envelope predicate, check a terminal reason, then parse. Each site assembled a
 * slightly different chain, so a shape closed in one mode stayed open in
 * another, and a validator that returned a rich verdict was tested for
 * truthiness at six call sites — which let a refusal shipped beside an action
 * dispatch the action.
 *
 * So the verdict is deliberately NOT boolean-shaped. There is nothing here a
 * caller can `if (...)` and accidentally get right; `ok` must be read, and the
 * payload is only reachable through it.
 *
 *   { ok: true,  kind: "choice" | "candidate" | "metadata", choice|candidate }
 *   { ok: false, failure: { type, ... } }   -> reportGateFailure()
 */
const PROTOCOLS = new Set(["openai", "gemini"]);

export function gateProviderResponse(data, {
  protocol,
  // "stream" frames have no terminal state of their own — the driver tracks it
  // across frames — so the completion check is the caller's after the drain.
  mode = "text",
  allowMissingReason = false,
  allowToolCallsWithStop = false,
} = {}) {
  // The closed check belongs here, not inside one provider's validator: a
  // misspelt mode reached the Gemini branch unexamined, and an unrecognised
  // protocol silently selected OpenAI semantics.
  if (!PROTOCOLS.has(protocol) || !RESPONSE_MODES.has(mode)) {
    return { ok: false, failure: { type: "envelope" } };
  }
  const gemini = protocol === "gemini";

  const inBand = extractInBandError(data);
  if (inBand.present && inBand.value != null) {
    // A reserved field holding something that is not an error envelope is
    // itself a reason not to trust the body.
    if (!isPlainObject(inBand.value)) return { ok: false, failure: { type: "envelope" } };
    return { ok: false, failure: { type: "in_band", error: inBand.value } };
  }

  if (gemini) {
    const blockReason = data?.promptFeedback?.blockReason;
    if (blockReason) {
      // Blocked by ORIGIN, whatever the enum spelling — the field's presence
      // says so more reliably than the reason table can.
      return { ok: false, failure: { type: "finish", finishReason: blockReason, recovery: "policy" } };
    }
  }

  const validated = gemini
    ? validateGeminiResponse(data, { allowFunctionCalls: mode === "native-tool" })
    : validateOpenAICompletion(data, { mode, allowToolCallsWithStop });
  if (!validated) return { ok: false, failure: { type: "envelope" } };
  if (validated.kind === "metadata") return { ok: true, kind: "metadata" };
  if (validated.kind === "refusal") {
    return { ok: false, failure: { type: "refusal", refusal: validated.refusal } };
  }

  if (mode !== "stream") {
    const finish = jsonCompletionFailure(data, { gemini, allowMissingReason });
    if (finish) return { ok: false, failure: { type: "finish", ...finish } };
  }
  return { ok: true, ...validated };
}

/** The one dispatch from a gate verdict to a reporter. Always returns null. */
export function reportGateFailure(failure, context) {
  switch (failure.type) {
    case "in_band":
      return reportInBandError(failure.error, context);
    case "refusal":
      return reportProviderFinishFailure({
        finishReason: "refusal", truncated: false, recovery: "policy", ...context,
      });
    case "finish":
      return reportProviderFinishFailure({
        finishReason: failure.finishReason ?? null,
        truncated: !!failure.truncated,
        recovery: failure.recovery,
        ...context,
      });
    default:
      return reportProviderEnvelopeFailure(context);
  }
}

const nullableString = (v) => v == null || typeof v === "string";
const nullableObject = (v) => v == null || isPlainObject(v);

/**
 * One positive schema boundary per provider, shared by every response mode.
 *
 * Validation used to be scattered across a reason allowlist, an envelope
 * predicate, the tool parser and a shallow frame check — so each round closed
 * the specific shape that had been reported and left the next one open. These
 * validate what the adapters actually consume, for both streaming and whole
 * bodies, and return null for anything they cannot vouch for.
 *
 * Unknown TOP-LEVEL keys are rejected: a frame carrying fields this protocol
 * does not define is something other than the model answering. Unknown keys
 * INSIDE a part or delta are allowed, because providers ship new content types
 * routinely and rejecting those would break on the next release; their declared
 * fields are type-checked instead.
 */
const OPENAI_TOP_LEVEL = new Set([
  "id", "object", "created", "model", "choices", "usage",
  "system_fingerprint", "service_tier", "provider", "citations",
]);

function validOpenAIToolCall(call) {
  if (!isPlainObject(call)) return false;
  if (call.type !== undefined && call.type !== "function") return false;
  const fn = call.function;
  if (!isPlainObject(fn)) return false;
  if (typeof fn.name !== "string" || !fn.name) return false;
  return fn.arguments === undefined || typeof fn.arguments === "string";
}

/**
 * @param streaming  read `delta` (stream) rather than `message` (whole body)
 * @param allowReasonMismatch  Local only: self-hosted servers disagree about
 *   which success reason accompanies a tool call, and rejecting the mismatch
 *   would break working tool-use on servers that answered correctly.
 */
const RESPONSE_MODES = new Set(["stream", "text", "native-tool"]);

export function validateOpenAICompletion(data, { mode = "text", allowToolCallsWithStop = false } = {}) {
  // A mode we do not recognise must not fall through to whole-body semantics.
  if (!RESPONSE_MODES.has(mode)) return null;
  const streaming = mode === "stream";
  if (!isPlainObject(data) || !Array.isArray(data.choices)) return null;
  // Unknown top-level keys are only disqualifying on a frame that carries no
  // members — that is the shape a portal or proxy uses to masquerade as
  // metadata. Rejecting them on a frame whose members all validate would fail
  // closed on every field a provider adds, which is a regression, not a guard.
  if (data.choices.length === 0
      && !Object.keys(data).every((k) => OPENAI_TOP_LEVEL.has(k))) return null;
  // Checked as a TYPE, not just a name: `usage: "Sign in to Wi-Fi"` satisfied a
  // key-name allowlist and rode along on an otherwise empty frame.
  if (!nullableObject(data.usage)) return null;
  if (data.choices.length === 0) return { kind: "metadata" };

  // EVERY member, not just the one we read: a malformed sibling means the frame
  // is not what we think it is, whichever element we happen to consume.
  for (const choice of data.choices) {
    if (!isPlainObject(choice)) return null;
    if (!nullableString(choice.finish_reason)) return null;
    // Symmetric: a whole body carrying a `delta`, or a frame carrying a
    // `message`, means we are not reading what we think we are reading. The
    // asymmetric version let a sibling `message` action ride along beside a
    // `delta.refusal` that nothing inspected.
    if ((streaming ? choice.message : choice.delta) !== undefined) return null;
    const payload = streaming ? choice.delta : choice.message;
    if (payload === undefined) {
      // Only a STREAM frame may carry a terminal reason and nothing else.
      // Accepting that shape in a whole body let a sole `{finish_reason}`
      // choice pass the gate with no message at all, and let a malformed
      // sibling sit beside a real one without invalidating it.
      if (!streaming || choice.finish_reason == null) return null;
      continue;
    }
    if (!isPlainObject(payload)) return null;
    if (!nullableString(payload.content)) return null;
    if (!nullableString(payload.reasoning)) return null;
    if (!nullableString(payload.refusal)) return null;
    const details = payload.reasoning_details;
    if (details !== undefined) {
      if (!Array.isArray(details)) return null;
      if (!details.every((d) => isPlainObject(d) && nullableString(d.text))) return null;
    }
    // The deprecated single-call field. We never send it, so a reply carrying
    // one is answering a request we did not make.
    if (payload.function_call !== undefined) return null;

    const calls = payload.tool_calls;
    if (Array.isArray(calls) && calls.length > 0 && mode !== "native-tool") {
      // Native calls in a mode whose parser cannot consume them. We only offer
      // tools on the native path, so a text-mode reply carrying calls is either
      // a different request's answer or a proxy inventing one; either way the
      // text beside them is not a decision we should act on.
      return null;
    }
    if (mode === "native-tool" && Array.isArray(calls)) {
      // The contract the downstream parser actually requires. Rejecting here
      // reports the mismatch instead of returning null from the parser later.
      if (!calls.every((c) => c?.type === "function" && isPlainObject(c?.function))) return null;
    }
    if (calls !== undefined) {
      // An EMPTY array is unambiguous — the model made no calls — so it is not
      // malformed. It carries nothing to dispatch, and the empty-completion
      // check gives a more precise answer than a protocol error would.
      if (!Array.isArray(calls)) return null;
      if (!calls.every(validOpenAIToolCall)) return null;
    }
    if (!streaming) {
      // A SUCCESS reason is only trustworthy when it agrees with the shape it
      // arrived with. Checked for EVERY member, so acceptance cannot depend on
      // which one we happen to read.
      //
      // Deliberately limited to the success pair: `length` or a policy stop is
      // a well-formed envelope reporting an unsuccessful generation, and that
      // is the completion gate's answer to give.
      const hasCalls = Array.isArray(calls) && calls.length > 0;
      if (choice.finish_reason === "tool_calls" && !hasCalls) return null;
      // The one documented Local compatibility case: self-hosted servers
      // disagree about which success reason accompanies a tool call. Narrowed
      // to that direction only — the reverse (a reason claiming calls that are
      // not there) is never legitimate anywhere.
      if (choice.finish_reason === "stop" && hasCalls && !allowToolCallsWithStop) return null;
    }
  }

  const first = data.choices[0];
  const payload = streaming ? first.delta : first.message;
  if (typeof payload?.refusal === "string" && payload.refusal) {
    return { kind: "refusal", refusal: payload.refusal, choice: first };
  }
  return { kind: "choice", choice: first };
}

const GEMINI_TOP_LEVEL = new Set([
  "candidates", "usageMetadata", "modelVersion", "responseId", "promptFeedback",
  "modelStatus",
]);

function validGeminiPart(part, allowFunctionCalls) {
  if (!isPlainObject(part)) return false;
  if (!nullableString(part.text)) return false;
  // A string "false" is truthy, so a loose check let a thought part be read as
  // answer text — or the reverse.
  if (part.thought !== undefined && typeof part.thought !== "boolean") return false;
  if (part.functionCall !== undefined) {
    if (!allowFunctionCalls || !isPlainObject(part.functionCall)) return false;
    const { name, args } = part.functionCall;
    if (typeof name !== "string" || !name) return false;
    if (!nullableObject(args)) return false;
  }
  return true;
}

/** @param allowFunctionCalls native-tool mode only */
export function validateGeminiResponse(data, { allowFunctionCalls = false } = {}) {
  if (!isPlainObject(data)) return null;
  if (!nullableObject(data.usageMetadata)) return null;
  if (!nullableObject(data.promptFeedback)) return null;
  if (!nullableObject(data.modelStatus)) return null;
  // As above: the allowlist guards the member-less shape only.
  const known = Object.keys(data).every((k) => GEMINI_TOP_LEVEL.has(k));
  if (!Array.isArray(data.candidates)) {
    return known && isPlainObject(data.usageMetadata) ? { kind: "metadata" } : null;
  }
  if (data.candidates.length === 0) return known ? { kind: "metadata" } : null;

  for (const candidate of data.candidates) {
    if (!isPlainObject(candidate)) return null;
    if (!nullableString(candidate.finishReason)) return null;
    if (candidate.content !== undefined) {
      if (!isPlainObject(candidate.content)) return null;
      const { parts } = candidate.content;
      if (parts !== undefined) {
        if (!Array.isArray(parts)) return null;
        if (!parts.every((part) => validGeminiPart(part, allowFunctionCalls))) return null;
      }
    }
  }
  return { kind: "candidate", candidate: data.candidates[0] };
}

export function reportProviderEnvelopeFailure({ provider, where, status, rawText = false, onParseFailure }) {
  if (typeof console !== "undefined" && console.error) {
    console.error(`[${provider}] ${where}: response body is not a completion (HTTP ${status}).`);
  }
  notifyFailure(onParseFailure, {
    raw: "",
    reason: "provider_protocol_error",
    finishReason: null,
    truncated: false,
    fatal: false,
    retryable: true,
    retryAfterMs: 0,
    status: status ?? null,
    provider,
    providerMessage: "The response did not contain a completion.",
  }, rawText);
  return null;
}

/**
 * A stream we cannot trust as a whole — cut short, unreadable, or past its
 * bounds. Same class as a body that isn't a completion, since in every case the
 * provider never committed what we hold, so they share `provider_protocol_error`
 * and differ only in what they tell the user.
 *
 * The point is what they prevent: accumulated text from a broken stream can
 * parse cleanly and would then be dispatched as a decision the model never
 * finished making.
 */
const STREAM_FAILURES = {
  truncated: ["stream ended mid-event", "The response stream ended before the model finished."],
  malformed_json: ["stream carried an unreadable frame", "The response stream was corrupted."],
  invalid_utf8: ["stream was not valid UTF-8", "The response stream was corrupted."],
  stream_limit: ["stream exceeded its size bound", "The response was too large to read safely."],
  idle_timeout: ["stream stalled", "The provider stopped responding."],
};

export function reportProviderStreamFailure(kind, { provider, where, status, rawText = false, onParseFailure }) {
  const [log, userMessage] = STREAM_FAILURES[kind] ?? STREAM_FAILURES.truncated;
  if (typeof console !== "undefined" && console.error) {
    console.error(`[${provider}] ${where}: ${log} (HTTP ${status}).`);
  }
  notifyFailure(onParseFailure, {
    raw: "",
    reason: "provider_protocol_error",
    finishReason: null,
    // Only a cut stream is "truncated" in the sense the loop retries on; the
    // others are corruption, and saying otherwise would mislead its heuristics.
    truncated: kind === "truncated",
    fatal: false,
    retryable: true,
    retryAfterMs: 0,
    status: status ?? null,
    provider,
    providerMessage: userMessage,
  }, rawText);
  return null;
}

/**
 * The model stopped for a reason that is not success — a token ceiling, a
 * safety block, an explicit error — or never said it stopped at all.
 *
 * Partial output from such a generation regularly parses: a model that emits a
 * complete tool call and then hits its token ceiling leaves behind something
 * that looks exactly like a finished decision. Reading the terminal state is
 * the only way to tell the two apart, so it is checked before the content is
 * ever finalized rather than only when parsing happens to fail.
 */
/**
 * WE refused the response, on size or shape — the generation itself completed.
 *
 * Reported separately from an incomplete generation because the two need
 * different things: this one keeps the provider's real terminal reason and
 * routes to the size/depth reminder, rather than inventing a finish reason and
 * asking the model to fix a generation that was never the problem.
 */
export function reportProviderStructuralFailure({ finishReason = null, responseMode = null, provider, where, status, rawText = false, onParseFailure }) {
  if (typeof console !== "undefined" && console.error) {
    console.error(`[${provider}] ${where}: response was too large or deeply nested to inspect.`);
  }
  notifyFailure(onParseFailure, {
    raw: "",
    reason: "too-structural",
    responseMode,
    finishReason,
    truncated: false,
    fatal: false,
    // Deterministic: the same request returns the same oversized payload.
    retryable: false,
    retryAfterMs: 0,
    status: status ?? null,
    provider,
    providerMessage: "The response was too large to read safely.",
  }, rawText);
  return null;
}

export function reportProviderFinishFailure({ finishReason, truncated, raw = "", recovery: recoveryOverride, responseMode = null, provider, where, status, rawText = false, onParseFailure }) {
  const stated = finishReason ? String(finishReason) : "no terminal state";
  if (typeof console !== "undefined" && console.error) {
    console.error(`[${provider}] ${where}: generation did not complete (${stated}).`);
  }
  // Classified by MEANING, not by whether a reason was present. A boolean
  // collapsed three different recoveries into one: `error` is the provider
  // aborting itself (retry may clear it), a token ceiling needs a terser
  // answer, and a policy stop needs different phrasing. Sending them all down
  // one branch produced a "your JSON was malformed" reminder for none of them.
  // A caller that knows the ORIGIN outranks the enum: promptFeedback means a
  // blocked prompt even when the reason is spelled "OTHER", which the table
  // would otherwise classify as a formatting problem.
  const recovery = recoveryOverride ?? classifyFinishRecovery(finishReason);
  notifyFailure(onParseFailure, {
    raw,
    reason: "provider_incomplete_generation",
    responseMode,
    finishReason: finishReason ?? null,
    truncated: !!truncated || recovery === "token_limit",
    recovery,
    fatal: false,
    // Only a provider-side abort is worth repeating verbatim; the rest are
    // deterministic and need the model to do something different.
    retryable: recovery === "transient",
    retryAfterMs: 0,
    status: status ?? null,
    provider,
    providerMessage: recovery === "token_limit"
      ? "The model ran out of room before finishing."
      : recovery === "policy"
        ? "The provider blocked this response."
        : "The model stopped before finishing its answer.",
  }, rawText);
  return null;
}

/**
 * A rejected fetch — DNS failure, TLS error, connection reset, offline, CORS.
 * No response object exists, so there's no status to classify, but the loop
 * needs to know as much as it does for a 503: without this it reads the null as
 * malformed model output, queues a JSON-correction reminder for a request that
 * never reached a server, and spends the parse-failure budget on it.
 *
 * Always retryable, never fatal — transport failures are transient by nature,
 * and the loop's own budget bounds how long it keeps trying.
 *
 * ONLY call this from a TERMINAL catch. Adapters catch-and-fall-back at several
 * points (OpenRouter and Gemini stream → non-stream; Local additionally
 * tool-use → JSON-in-text), and reporting from an intermediate catch would
 * announce a failure the provider is about to recover from. AbortError must be
 * filtered by the caller first — that is the user pressing Stop, not an outage.
 */
export function reportProviderCallFailure(error, { provider, where, rawText = false, onParseFailure }) {
  const decode = isBodyDecodeError(error);
  if (typeof console !== "undefined" && console.error) {
    console.error(`[${provider}] ${where} failed:`, error);
  }
  notifyFailure(onParseFailure, {
    raw: "",
    // Two different failures with two different user actions. A request that
    // never arrived is a connection problem; a response that arrived and could
    // not be decoded is usually something sitting between us and the provider —
    // captive portal, corporate proxy — and telling that user to check their
    // connection sends them to the wrong place.
    reason: decode ? "provider_protocol_error" : "provider_transport_error",
    finishReason: null,
    truncated: false,
    fatal: false,
    retryable: true,
    retryAfterMs: 0,
    // No response object reaches this catch. For the decode case the status is
    // necessarily 2xx anyway — every response.json() in the adapters sits after
    // the !response.ok check — so it carries almost no diagnostic value.
    status: null,
    provider,
    providerMessage: error instanceof Error ? String(error.message).slice(0, DETAIL_MAX) : "",
  }, rawText);
  return null;
}

/**
 * A SyntaxError arriving at a terminal catch can only be a response-body decode.
 * Verified rather than assumed, because misreading a model's malformed tool
 * arguments as an infrastructure fault would be the same wrong-actor mistake
 * this whole path exists to correct:
 *   - every `response.json()` in the adapters sits AFTER the `!response.ok`
 *     check, so reaching it means the request succeeded;
 *   - the SSE `JSON.parse` sites each catch their own failure and continue;
 *   - `tool-use.js` parses `function.arguments` inside its own try/catch and
 *     falls back to `{}`;
 *   - the OpenRouter model-catalog fetch is wrapped in its own catch.
 */
function isBodyDecodeError(error) {
  return error?.name === "SyntaxError";
}

/**
 * Classifies by FAMILY with a retryable allowlist, not by an enumerated list of
 * known-bad statuses. Enumerating meant anything unlisted — 405, 413, 415, 422 —
 * fell through unclassified and the loop blamed the model for it. 413 is the one
 * that makes this concrete: an oversized history is a request the user can
 * actually fix, and "the model produced unparseable output" tells them nothing.
 */
export function classifyHttpStatus(status) {
  if (!Number.isInteger(status)) return { fatal: false, retryable: false };
  const retryable = RETRYABLE_CLIENT_STATUSES.has(status) || (status >= 500 && status < 600);
  const clientError = status >= 400 && status < 500;
  return { fatal: clientError && !retryable, retryable };
}

/**
 * The provider answered, in its own shape, with nothing to act on: an empty
 * `choices`/`candidates` array, a valid envelope whose message carries no
 * content and no tool call, or an SSE stream that opened and closed without a
 * token.
 *
 * Distinct from `provider_protocol_error` on purpose. That one means something
 * that isn't the provider answered — a portal, a proxy — and points the user at
 * their network. This one means the provider itself produced no completion,
 * where the network is fine and there is nothing for the user to fix. Collapsing
 * them would hand out confidently wrong advice, which is the failure this whole
 * sequence of rounds has been correcting.
 *
 * Retryable: an empty completion is usually a transient provider hiccup.
 * `rawText` callers (compaction) are skipped per the provider contract — they
 * handle a null return themselves and don't consume parse-failure semantics.
 */
/**
 * Is there actually something to decide on?
 *
 * `text == null` was too narrow: `content: ""` — and whitespace-only content —
 * is a valid envelope carrying no decision, but it slipped through to
 * parseContent and came back as a generic `{reason:"empty"}` parse failure, so
 * the loop sent a JSON-correction reminder to a model that produced nothing.
 *
 * `rawText` callers are exempt from the emptiness rule, not from the null one:
 * compaction previously received `""` verbatim from finalizeText and handles it
 * itself. Tightening that would be an unrelated behaviour change.
 */
export function hasUsableCompletion(text, rawText) {
  if (text == null) return false;
  if (rawText) return true;
  return typeof text === "string" && text.trim().length > 0;
}

export function reportProviderEmptyCompletion({ provider, where, status, rawText, onParseFailure }) {
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[${provider}] ${where}: response contained no completion (HTTP ${status}).`);
  }
  notifyFailure(onParseFailure, {
    raw: "",
    reason: "provider_empty_completion",
    finishReason: null,
    truncated: false,
    fatal: false,
    retryable: true,
    retryAfterMs: 0,
    status: status ?? null,
    provider,
    providerMessage: "The provider returned no completion.",
  }, rawText);
  return null;
}

/**
 * `Retry-After` is either delta-seconds or an HTTP-date. Returns 0 when absent
 * or unparseable, leaving the backoff choice to the caller.
 */
export function parseRetryAfterMs(response) {
  let header = null;
  try { header = response?.headers?.get?.("retry-after") ?? null; } catch { /* no headers */ }
  if (!header) return 0;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const at = Date.parse(header);
  if (Number.isFinite(at)) return Math.max(0, at - Date.now());
  return 0;
}

/**
 * Read the provider's own diagnosis. Prefers the OpenAI/Gemini-shaped
 * `{error:{message}}`, falls back to raw text, and never throws — the body may
 * be HTML from a proxy, or already consumed.
 */
export async function readErrorDetail(response) {
  try {
    const text = await readDiagnosticText(response);
    if (!text) return "";
    try {
      const parsed = JSON.parse(text);
      const message = parsed?.error?.message ?? parsed?.message;
      if (typeof message === "string" && message) return message.slice(0, DETAIL_MAX);
    } catch { /* not JSON — use the raw text */ }
    return text.slice(0, DETAIL_MAX);
  } catch (err) {
    // A cancellation is the user pressing Stop. Swallowing it here made the
    // caller report a provider failure for a turn that was being torn down.
    if (err?.name === "AbortError") throw err;
    return "";
  }
}

/**
 * Log the failure and, when the status is classifiable, report it through
 * `onParseFailure` so the loop can tell a dead request from bad model output.
 * Always returns null — that stays every caller's contract.
 */
export async function reportProviderHttpFailure(response, { provider, where, rawText = false, onParseFailure }) {
  const status = response?.status;
  const detail = await readErrorDetail(response);
  if (typeof console !== "undefined" && console.error) {
    console.error(`[${provider}] ${where} failed: HTTP ${status}${detail ? ` — ${detail}` : ""}`);
  }
  const { fatal, retryable } = classifyHttpStatus(status);
  if (fatal || retryable) {
    notifyFailure(onParseFailure, {
      raw: "",
      reason: "provider_http_error",
      finishReason: `HTTP_${status}`,
      truncated: false,
      fatal,
      retryable,
      retryAfterMs: retryable ? parseRetryAfterMs(response) : 0,
      status,
      provider,
      providerMessage: detail,
    }, rawText);
  }
  return null;
}
