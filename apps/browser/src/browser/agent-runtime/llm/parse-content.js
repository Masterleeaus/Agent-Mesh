/**
 * Shared JSON extractor for LLM response text.
 *
 * Every provider returns a string payload that's supposed to be a JSON
 * object (the ReAct decision object). Models vary wildly in tidiness:
 * code fences with / without `json`, prose before or after, trailing
 * commas, smart quotes, JS-style comments, truncation from token
 * budgets, or a top-level array. This module walks the string with a
 * JSON-grammar-aware tokeniser and applies repair rules that never
 * touch content inside strings.
 *
 * Public:
 *   parseContent(content, onFailure?) → object | null
 *     - onFailure({raw, reason}) fires before returning null.
 *   extractFirstBlock(text)         → { block, truncated, inString, openers }
 *   parseStrict(text)               → object (throws)
 *
 * Reason strings are stable (see REASONS) so callers can classify for
 * logging / retry-reminder routing without pattern-matching freeform text.
 */

import { parseProviderJson, isJsonBudgetError } from "./http-failure.js";

// Enough to recognise the payload in a log, far short of carrying it.
const STRUCTURAL_DIAGNOSTIC_CHARS = 500;

export const REASONS = Object.freeze({
  EMPTY: "empty",
  NO_OBJECT: "no-object",
  SYNTAX_ERROR: "syntax-error",
  // We declined to inspect it, which is not the same as the model writing bad
  // JSON — and "fix your syntax" would send it back at the same size.
  TOO_STRUCTURAL: "too-structural",
});

/**
 * Strip code fences and a leading `json\n` bareword (a Built-in AI quirk
 * where Gemini Nano sometimes emits the word "json" on its own line before
 * the object). Leaves the inner content untouched.
 */
function stripFences(text) {
  let out = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "");
  // Leading bareword `json` followed by whitespace, but only if the next
  // non-whitespace is `{` or `[` — so we don't eat a legitimate `"json"`
  // string value (rare, but defensive).
  out = out.replace(/^\s*json\s+(?=[{[])/i, "");
  return out.trim();
}

export function parseStrict(text) {
  // Budgeted: this is model-controlled text, and the graph it builds is
  // retained as the decision. The envelope's own budget counted it as one
  // node, because in the envelope it is a string.
  return parseProviderJson(stripFences(String(text)));
}

/**
 * Balanced-bracket walker. Tracks string state (with `\\`-escapes) so `}`
 * or `]` inside a string literal don't close the outer structure, and
 * `\u007d` inside a string is treated as six string-content chars, not a
 * close brace. Returns the first complete top-level `{...}` OR `[...]`
 * block. On EOF-with-unclosed-stack, returns the remainder from `start`
 * plus context so `repairBlock` can try to close it.
 *
 * `startIdx` / `endIdx` are absolute offsets into `text`; callers use them
 * to inspect what (if anything) trailed the first block — e.g. the
 * multi-root guard in `parseContent` re-walks the trailing slice instead
 * of `indexOf`-searching, which could mis-locate when the block substring
 * also appears inside a preceding string literal.
 */
export function extractFirstBlock(text) {
  let start = -1;
  const stack = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = false; }
      continue;
    }

    if (ch === '"') { inString = true; continue; }

    if (ch === "{" || ch === "[") {
      if (start < 0) start = i;
      stack.push(ch);
      continue;
    }

    if (ch === "}" || ch === "]") {
      if (stack.length > 0) stack.pop();
      if (start >= 0 && stack.length === 0) {
        return {
          block: text.slice(start, i + 1),
          startIdx: start,
          endIdx: i + 1,
          truncated: false,
          inString: false,
          openers: [],
        };
      }
    }
  }

  if (start < 0) {
    return { block: null, startIdx: -1, endIdx: -1, truncated: false, inString: false, openers: [] };
  }

  return {
    block: text.slice(start),
    startIdx: start,
    endIdx: text.length,
    truncated: true,
    inString,
    openers: stack.slice(),
  };
}

/**
 * Build an index → bool map telling us which characters are inside a JSON
 * string. Used by repair rules so they never mutate string content (e.g.
 * a URL like "https://x" must not have its `//` stripped as a comment).
 */
function buildStringMask(text) {
  const mask = new Array(text.length).fill(false);
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    mask[i] = inString;
    const ch = text[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') inString = false;
    } else if (ch === '"') {
      inString = true;
    }
  }
  return mask;
}

/**
 * Replace smart/curly double-quotes with straight `"`. Single smart quotes
 * are left alone — JSON doesn't use single quotes for strings, so blindly
 * replacing them would risk corrupting contractions inside string values
 * ("don't" → `don"t`). If a model emits single-quoted keys we accept the
 * loss rather than that.
 */
function normalizeSmartQuotes(text) {
  return text.replace(/[\u201C\u201D\u2033]/g, '"');
}

/**
 * Strip `//…` (to end of line) and `/* … *\/` comments, skipping anything
 * inside a string literal. Models occasionally annotate fields: `// because`.
 */
function stripComments(text) {
  const out = [];
  let inString = false;
  let escape = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inString) {
      out.push(ch);
      if (escape) { escape = false; i++; continue; }
      if (ch === "\\") { escape = true; i++; continue; }
      if (ch === '"') inString = false;
      i++;
      continue;
    }
    if (ch === '"') { inString = true; out.push(ch); i++; continue; }
    if (ch === "/" && text[i + 1] === "/") {
      i += 2;
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length - 1 && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out.push(ch);
    i++;
  }
  return out.join("");
}

/**
 * Drop commas that sit (with only whitespace between) immediately before
 * `}` or `]`. String-aware so a literal `"a, ]b"` is untouched.
 */
function removeTrailingCommas(text) {
  const mask = buildStringMask(text);
  const skip = new Set();
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "," || mask[i]) continue;
    let j = i + 1;
    while (j < text.length && !mask[j] && /\s/.test(text[j])) j++;
    if (j < text.length && !mask[j] && (text[j] === "]" || text[j] === "}")) {
      skip.add(i);
    }
  }
  if (skip.size === 0) return text;
  let out = "";
  for (let i = 0; i < text.length; i++) if (!skip.has(i)) out += text[i];
  return out;
}

/**
 * Bright-line safety rule for ReAct decisions: structural repair is fine
 * (closing braces just declares "this object is done"), but synthesizing
 * string content is NOT — that's fabricating value bytes the model never
 * emitted. Example of the danger: stream cut mid-string at
 * `{"tool":"fill","args":{"text":"delete account` would otherwise be
 * "repaired" into a real `fill` call with a destructive partial value.
 *
 * Returns:
 *   - `text` unchanged when EOF is OUTSIDE a string (structural close
 *     handled by `appendMissingClosers` is allowed),
 *   - `null` when EOF is INSIDE a string — the orchestrator treats null as
 *     "repair refused, route to retry" rather than guessing the value.
 */
function closeUnterminatedString(text, ctx) {
  if (!ctx.truncated) return text;
  if (ctx.inString) return null;
  return text;
}

/**
 * Append missing `}` / `]` based on the walker's unclosed-opener stack.
 * Applied after closeUnterminatedString so the string closes before its
 * container does.
 */
function appendMissingClosers(text, ctx) {
  if (!ctx.truncated || ctx.openers.length === 0) return text;
  let closers = "";
  for (let i = ctx.openers.length - 1; i >= 0; i--) {
    closers += ctx.openers[i] === "{" ? "}" : "]";
  }
  return text + closers;
}

/**
 * Unwrap a single-element array whose element is an object. Small models
 * sometimes emit `[{"tool":"x"}]` when they meant `{"tool":"x"}`. Multi-
 * element arrays are NOT unwrapped — they're rejected by `isDecisionShape`
 * downstream so they route to retry instead of silently end-turning the
 * ReAct loop (which would happen otherwise because `decision.tool` is
 * undefined on an array).
 */
function unwrapSingleObjectArray(parsed) {
  if (Array.isArray(parsed) && parsed.length === 1 && parsed[0] && typeof parsed[0] === "object" && !Array.isArray(parsed[0])) {
    return parsed[0];
  }
  return parsed;
}

/**
 * A ReAct decision must be a non-null, non-array, non-primitive object.
 * Anything else (string, number, multi-element array, null) is rejected
 * so the orchestrator routes it through the parse-failure retry path
 * rather than treating it as a real decision (which would silently
 * end-turn or worse, execute on a guessed prefix).
 */
function isDecisionShape(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function tryParse(text) {
  try {
    return { ok: true, value: parseProviderJson(text) };
  } catch (err) {
    // "Too big to inspect" is not "not JSON". Collapsing the two let an
    // over-budget trailing root read as prose, so the multi-decision guard
    // stayed silent and the FIRST action was dispatched.
    return { ok: false, limitExceeded: isJsonBudgetError(err) };
  }
}

/**
 * Multi-root guard. After we've extracted the first balanced block, look
 * at the trailing slice and decide whether it's prose (safe to ignore) or
 * a SECOND JSON block attempt (suspicious — probably the model emitted
 * two decisions, possibly with the second one truncated by the token
 * budget).
 *
 * Two-arm check:
 *   1. If the first non-whitespace char of the trailing is `{` or `[`,
 *      treat it as an unambiguous second-root attempt and refuse —
 *      whether the second block is complete OR truncated. A truncated
 *      second root is the exact pattern we're trying to harden against:
 *      `{"tool":"click","args":{}}{"done":tr` would otherwise execute
 *      the click and silently drop the terminal signal.
 *   2. Otherwise we're in prose territory (`Sure! {"x":1}. Done.`).
 *      Only refuse when the prose actually contains a complete parseable
 *      JSON entity later, so that brace-shaped tokens in explanations
 *      (`{x:1}` as pseudocode) don't trigger false positives.
 */
function trailingHasJsonBlock(trailing) {
  const trimmed = trailing.trimStart();
  if (!trimmed) return false;
  if (trimmed[0] === "{" || trimmed[0] === "[") return true;
  const ctx = extractFirstBlock(trimmed);
  if (!ctx.block || ctx.truncated) return false;
  const parsed = tryParse(ctx.block);
  // A complete block we refused to inspect still counts as a second root.
  return parsed.ok || parsed.limitExceeded;
}

/**
 * Shared post-parse path: validate the shape, fire onFailure on rejection.
 * Centralised so every successful-parse branch (strict, block-as-is, each
 * repair step) goes through the same gate.
 */
function finalizeParsed(value, raw, onFailure) {
  const unwrapped = unwrapSingleObjectArray(value);
  if (!isDecisionShape(unwrapped)) {
    onFailure?.({ raw, reason: REASONS.SYNTAX_ERROR });
    return null;
  }
  return unwrapped;
}

export function parseContent(content, onFailure) {
  if (!content) {
    onFailure?.({ raw: "", reason: REASONS.EMPTY });
    return null;
  }

  const raw = String(content);
  const text = stripFences(raw);

  // 1. Strict parse. Even on success we validate shape — `JSON.parse` is
  //    happy to return strings, numbers, or multi-element arrays, none of
  //    which are valid ReAct decisions.
  //
  //    Its result is reused rather than re-derived: a separate structural
  //    preflight parsed the same text a second time, which on a near-limit
  //    payload is the most expensive work in the function done twice.
  const strict = tryParse(text);
  if (strict.ok) return finalizeParsed(strict.value, raw, onFailure);
  if (strict.limitExceeded) {
    // Reported before the repair path: every branch below would otherwise
    // call this a syntax error and ask for the same payload at the same size.
    // The raw text is bounded because the reminder never quotes it — carrying
    // megabytes across the worker boundary to be discarded is pure cost.
    onFailure?.({
      raw: raw.slice(0, STRUCTURAL_DIAGNOSTIC_CHARS),
      rawChars: raw.length,
      reason: REASONS.TOO_STRUCTURAL,
    });
    return null;
  }

  // 2. Extract first balanced block.
  const ctx = extractFirstBlock(text);
  if (!ctx.block) {
    onFailure?.({ raw, reason: REASONS.NO_OBJECT });
    return null;
  }

  // 2a. Multi-root guard — refuse to silently pick the first of N decisions
  //     (the prior implementation's behaviour, which was unsafe: the second
  //     decision could be a `done:true` overriding the first action).
  if (!ctx.truncated && trailingHasJsonBlock(text.slice(ctx.endIdx))) {
    onFailure?.({ raw, reason: REASONS.SYNTAX_ERROR });
    return null;
  }

  // 3. Parse the extracted block as-is.
  {
    const r = tryParse(ctx.block);
    if (r.ok) return finalizeParsed(r.value, raw, onFailure);
  }

  // 4. Apply repairs cumulatively; parse between each step. A step that
  //    returns `null` is a hard refusal (e.g. `closeUnterminatedString`
  //    when EOF lands inside a string — synthesizing string content for
  //    a ReAct decision is unsafe). Order matters:
  //      a. Close unterminated string (truncation) — refuses on EOF-in-string.
  //      b. Append missing closers (truncation, structural only).
  //      c. Normalize smart quotes.
  //      d. Strip JS comments.
  //      e. Remove trailing commas.
  const steps = [
    (t) => closeUnterminatedString(t, ctx),
    (t) => appendMissingClosers(t, ctx),
    normalizeSmartQuotes,
    stripComments,
    removeTrailingCommas,
  ];
  let candidate = ctx.block;
  for (const step of steps) {
    const next = step(candidate);
    if (next === null) {
      // Hard refusal — don't fall through to "last ditch" or accept a
      // partially-repaired payload; this is exactly the case where we
      // want to route to retry.
      onFailure?.({ raw, reason: REASONS.SYNTAX_ERROR });
      return null;
    }
    if (next === candidate) continue;
    candidate = next;
    const r = tryParse(candidate);
    if (r.ok) return finalizeParsed(r.value, raw, onFailure);
  }

  onFailure?.({ raw, reason: REASONS.SYNTAX_ERROR });
  return null;
}
