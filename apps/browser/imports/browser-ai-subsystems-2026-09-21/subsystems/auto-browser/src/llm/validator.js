/**
 * Post-action validator (Phase 2 — Surfer-2-style four-role refactor).
 *
 * Runs after a submit-shaped mutating tool. Returns one of three verdicts:
 *
 *   { verdict: "committed",   evidence: "<one-line>" }
 *   { verdict: "ambiguous",   evidence: "<one-line>" }
 *   { verdict: "failed",      evidence: "<one-line>", retry_hint?: string }
 *
 * Two-tier design (Manus's "don't burn the cache on every step"):
 *
 *   1. CHEAP PRE-PASS — deterministic checks, no LLM. Catches the common
 *      case (URL changed after a real submit; title changed; expected text
 *      appeared; network settled). When any of these returns `committed`,
 *      the LLM call is skipped entirely.
 *   2. LLM VERDICT — only when the cheap pre-pass is ambiguous. The LLM is
 *      asked a tightly-scoped question against bounded inputs (intent,
 *      tool, args, pre/post URL+title, last N console errors, snapshot diff)
 *      and returns the canonical {verdict, evidence, retry_hint?} shape.
 *
 * Invariants:
 *   - Validator is read-only: it never dispatches a mutating action. The
 *     drift gate is unaffected because the validator has no expectedOrigin
 *     to capture; only later mutations re-check.
 *   - Single-in-flight LLM constraint preserved: the validator's LLM call
 *     reuses the parent turn's AbortController via the `signal` parameter.
 *     The caller (content.js) is responsible for serialising this with the
 *     next Navigator call.
 *   - Pure orchestration: deps (`waitForNetworkIdle`, `takeSnapshot`,
 *     `readConsoleMessages`, `provider`, `now`) are injected so this module
 *     is fully unit-testable without hitting the SW or the network.
 *
 * Failure routing happens IN THE CALLER (content.js):
 *   - `failed`    → queue a <system-reminder> with evidence + retry_hint;
 *                   force phase:"recover" on the next Navigator call.
 *   - `ambiguous` → render an "Couldn't verify — proceeding cautiously"
 *                   note; two consecutive ambiguous verdicts force recover.
 *   - `committed` → no extra action; the agent continues normally.
 */

import { parseContent } from "./parse-content.js";

const VALIDATOR_LLM_MAX_TOKENS_HINT = 200; // not enforced here, advisory only

const VALIDATOR_PROMPT = `You are a post-action validator for a browser-automation agent.

A mutating action JUST executed. Your job: decide whether it actually committed on the page.

You receive:
  - intent:      one-line description of what the agent was trying to do
  - tool/args:   the action that ran
  - pre_state:   url + title + (optional) console_errors + (optional) snapshot_excerpt BEFORE the action
  - post_state:  url + title + (optional) console_errors + (optional) snapshot_excerpt AFTER the action

Output ONE JSON object only — no prose:
  {"verdict":"committed","evidence":"<≤20-word reason>"}
  {"verdict":"ambiguous","evidence":"<≤20-word reason>"}
  {"verdict":"failed","evidence":"<≤20-word reason>","retry_hint":"<≤20-word fix to try>"}

Rules:
  - "committed" requires positive evidence (URL changed to a confirmation, success message visible, expected element appeared, console-clean network success, etc.). Default-positive on bare {ok:true} is FORBIDDEN.
  - "failed" requires negative evidence (validation error text, red error in console, page unchanged with disabled button, etc.). When you say "failed", give a concrete retry_hint.
  - "ambiguous" is the honest answer when neither side is clear. The orchestrator will treat it as "proceed cautiously" the first time and as "trigger recovery" on a repeat.
  - Be terse. Evidence must point at WHY you decided what you decided.`;

/**
 * @param {object} input
 * @param {string} input.intent          — one-line description of the agent's intent
 * @param {string} input.tool            — name of the tool that just executed
 * @param {object} input.args            — args the tool was called with
 * @param {object} input.preState        — { url, title, snapshotExcerpt?, consoleCount? }
 * @param {object} input.postState       — { url, title, snapshotExcerpt?, consoleErrors?, networkIdleOk? }
 * @param {string} [input.expectedText]  — optional: text the agent expected to appear after the action
 * @param {object} input.deps            — { waitForNetworkIdle, readConsoleErrors, takeSnapshot, callLLM }
 * @returns {Promise<{verdict: "committed"|"ambiguous"|"failed", evidence: string, retry_hint?: string, llmCalled: boolean}>}
 */
export async function runValidator(input) {
  const {
    intent = "",
    tool = "",
    args = {},
    preState = {},
    expectedText = "",
    deps = {},
  } = input || {};

  // ── Step 1: cheap pre-pass ─────────────────────────────────────
  // Order matters — try the cheapest check first. wait_for_network_idle is
  // the most expensive (involves a SW round-trip with up to 3s wait), so it
  // runs last. Each check returns null when it doesn't apply, so we cascade.
  const postState = await collectPostState({ preState, expectedText, deps });

  const cheap = cheapPrePass({ preState, postState, expectedText });
  if (cheap) {
    return { ...cheap, llmCalled: false };
  }

  // ── Step 2: LLM fallback when ambiguous ────────────────────────
  if (typeof deps.callLLM !== "function") {
    // No LLM dep — return ambiguous so the caller can decide.
    return {
      verdict: "ambiguous",
      evidence: "No deterministic signal and no validator LLM available.",
      llmCalled: false,
    };
  }

  const llmVerdict = await runLLMValidator({
    intent,
    tool,
    args,
    preState,
    postState,
    expectedText,
    callLLM: deps.callLLM,
  });
  return { ...llmVerdict, llmCalled: true };
}

/**
 * Run all the read-only collectors in parallel to build the post-action state
 * snapshot. Each collector is optional; missing deps degrade gracefully.
 */
async function collectPostState({ preState, expectedText, deps }) {
  const post = {};

  // URL + title are read directly off the deps.now() reader (cheap, sync
  // call into the page).
  if (typeof deps.now === "function") {
    try {
      const cur = deps.now();
      if (cur && typeof cur === "object") {
        post.url = typeof cur.url === "string" ? cur.url : "";
        post.title = typeof cur.title === "string" ? cur.title : "";
      }
    } catch { /* leave blank */ }
  }

  // Run network idle + expected-text + console-error fetches in parallel.
  const tasks = [];
  if (typeof deps.waitForNetworkIdle === "function") {
    tasks.push(
      deps
        .waitForNetworkIdle({ idle_ms: 500, timeout_ms: 3000 })
        .then((res) => {
          // {ok:true} → settled; {timeout:true} or error → not settled.
          post.networkIdleOk = !!(res && (res.ok === true || res.idle === true));
        })
        .catch(() => { post.networkIdleOk = false; }),
    );
  }
  if (expectedText && typeof deps.waitForText === "function") {
    tasks.push(
      deps
        .waitForText({ text: expectedText, timeout_ms: 1500 })
        .then((res) => {
          post.expectedTextFound = !!(res && (res.ok === true || res.found === true));
        })
        .catch(() => { post.expectedTextFound = false; }),
    );
  }
  if (typeof deps.readConsoleErrors === "function") {
    tasks.push(
      deps
        .readConsoleErrors()
        .then((errs) => {
          post.consoleErrors = Array.isArray(errs) ? errs : [];
        })
        .catch(() => { post.consoleErrors = []; }),
    );
  }
  await Promise.all(tasks);

  return post;
}

/**
 * Deterministic check. Returns one of:
 *   { verdict: "committed", evidence }
 *   { verdict: "failed",    evidence, retry_hint }
 *   null  → not enough signal; caller falls through to LLM
 *
 * "ambiguous" is NOT a cheap-pass verdict — if the deterministic checks are
 * inconclusive, we let the LLM weigh in. (Returning ambiguous from the
 * cheap pre-pass would skip the LLM and miss real failures.)
 */
export function cheapPrePass({ preState = {}, postState = {}, expectedText = "" }) {
  // 1. URL change → strong commit signal.
  if (preState.url && postState.url && preState.url !== postState.url) {
    return {
      verdict: "committed",
      evidence: `URL changed: ${stripQuery(preState.url)} → ${stripQuery(postState.url)}`,
    };
  }

  // 2. Title change → strong commit signal (SPA flows often update title
  //    without changing URL, e.g. checkout step transitions).
  if (preState.title && postState.title && preState.title !== postState.title) {
    return {
      verdict: "committed",
      evidence: `Title changed: "${preState.title}" → "${postState.title}"`,
    };
  }

  // 3. Expected text matched → caller-specified commit signal.
  if (expectedText && postState.expectedTextFound === true) {
    return {
      verdict: "committed",
      evidence: `Expected text appeared on page: "${truncate(expectedText, 60)}"`,
    };
  }

  // 4. Console error landed AND nothing else changed → likely failure.
  //    Conservative: only fire when there are NO commit signals AND there
  //    are fresh console errors mentioning common validation/error words.
  if (Array.isArray(postState.consoleErrors) && postState.consoleErrors.length > 0) {
    const blame = looksLikeValidationError(postState.consoleErrors);
    if (blame) {
      return {
        verdict: "failed",
        evidence: `Console error after action: ${truncate(blame, 80)}`,
        retry_hint: "Re-read the page and fix the input that triggered the error before re-submitting.",
      };
    }
  }

  // No signal — let the LLM decide.
  return null;
}

async function runLLMValidator({ intent, tool, args, preState, postState, expectedText, callLLM }) {
  const userMsg = buildLLMValidatorMessage({ intent, tool, args, preState, postState, expectedText });
  let parsed = null;
  try {
    parsed = await callLLM([
      { role: "system", content: VALIDATOR_PROMPT },
      { role: "user", content: userMsg },
    ]);
  } catch {
    return {
      verdict: "ambiguous",
      evidence: "Validator LLM call failed — proceeding cautiously.",
    };
  }

  // callLLM can return either a parsed object (when caller already parsed)
  // or a raw string (when caller passes rawText). Normalize.
  const obj = normalizeValidatorResponse(parsed);
  if (!obj) {
    return {
      verdict: "ambiguous",
      evidence: "Validator returned unparseable response — proceeding cautiously.",
    };
  }
  return obj;
}

export function buildLLMValidatorMessage({ intent, tool, args, preState, postState, expectedText }) {
  const lines = [];
  if (intent) lines.push(`intent: ${intent}`);
  lines.push(`tool: ${tool}`);
  lines.push(`args: ${safeStringify(args, 240)}`);
  lines.push("");
  lines.push("pre_state:");
  if (preState.url) lines.push(`  url: ${preState.url}`);
  if (preState.title) lines.push(`  title: ${preState.title}`);
  if (preState.snapshotExcerpt) {
    lines.push(`  snapshot_excerpt:\n${indent(preState.snapshotExcerpt, "    ")}`);
  }
  lines.push("");
  lines.push("post_state:");
  if (postState.url) lines.push(`  url: ${postState.url}`);
  if (postState.title) lines.push(`  title: ${postState.title}`);
  if (typeof postState.networkIdleOk === "boolean") {
    lines.push(`  network_settled: ${postState.networkIdleOk}`);
  }
  if (expectedText) {
    lines.push(`  expected_text: "${expectedText}"`);
    if (typeof postState.expectedTextFound === "boolean") {
      lines.push(`  expected_text_found: ${postState.expectedTextFound}`);
    }
  }
  if (Array.isArray(postState.consoleErrors) && postState.consoleErrors.length > 0) {
    lines.push("  console_errors:");
    for (const e of postState.consoleErrors.slice(0, 5)) {
      lines.push(`    - ${truncate(typeof e === "string" ? e : safeStringify(e, 200), 200)}`);
    }
  }
  if (postState.snapshotExcerpt) {
    lines.push(`  snapshot_excerpt:\n${indent(postState.snapshotExcerpt, "    ")}`);
  }
  return lines.join("\n");
}

/**
 * Normalise an LLM response into the canonical {verdict, evidence, retry_hint?}
 * shape. Returns null when the response is unrecognisable.
 *
 * Accepts:
 *   - parsed object with {verdict, evidence} (preferred)
 *   - raw string containing JSON (parses via parseContent)
 */
export function normalizeValidatorResponse(value) {
  let obj = value;
  if (typeof value === "string") {
    obj = parseContent(value);
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
  const verdict = typeof obj.verdict === "string" ? obj.verdict.toLowerCase() : "";
  if (verdict !== "committed" && verdict !== "ambiguous" && verdict !== "failed") {
    return null;
  }
  const evidence =
    typeof obj.evidence === "string" && obj.evidence
      ? truncate(obj.evidence, 200)
      : verdict === "committed"
        ? "Validator: committed."
        : verdict === "failed"
          ? "Validator: action did not commit."
          : "Validator: insufficient signal to verify.";
  const out = { verdict, evidence };
  if (verdict === "failed" && typeof obj.retry_hint === "string" && obj.retry_hint) {
    out.retry_hint = truncate(obj.retry_hint, 200);
  }
  return out;
}

// ── Helpers ───────────────────────────────────────────────────────

function stripQuery(url) {
  if (typeof url !== "string") return "";
  const i = url.indexOf("?");
  const j = url.indexOf("#");
  let cut = url.length;
  if (i >= 0) cut = Math.min(cut, i);
  if (j >= 0) cut = Math.min(cut, j);
  return url.slice(0, cut);
}

function truncate(s, max) {
  if (typeof s !== "string") return "";
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function indent(s, prefix) {
  return String(s)
    .split("\n")
    .map((l) => prefix + l)
    .join("\n");
}

function safeStringify(value, max) {
  try {
    const s = JSON.stringify(value);
    return s ? truncate(s, max) : "";
  } catch {
    return "";
  }
}

function looksLikeValidationError(errs) {
  // Pull the first error-text-looking thing we recognise. Conservative
  // pattern — common validation / form-error / HTTP-failure phrases.
  const PAT = /(error|failed|invalid|required|missing|reject(ed)?|not\s+found|404|500|forbidden|unauthorized|please\s+(enter|select|choose|provide))/i;
  for (const e of errs) {
    const text = typeof e === "string" ? e : (e && typeof e.text === "string" ? e.text : "");
    if (text && PAT.test(text)) return text;
  }
  return null;
}
