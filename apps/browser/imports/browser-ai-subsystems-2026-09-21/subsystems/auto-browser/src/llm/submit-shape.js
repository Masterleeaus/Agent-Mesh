/**
 * Submit-shape detector (Phase 2 — enforced post-action validator).
 *
 * Pure classifier. Given (toolName, args, accessibleName), decides whether
 * the just-executed tool action is "submit-shaped" — i.e. likely to commit
 * state on the page in a way that warrants a post-action verification step.
 *
 * Conservative on purpose: the validator is only invoked when this returns
 * true, so over-firing wastes a verification call but under-firing silently
 * lets a hallucinated "task_complete" through. We bias toward over-firing
 * for the well-known commit verbs and trust the cheap pre-pass (URL/title/
 * network-idle) to return verdict:committed quickly when the action really
 * did something obvious.
 *
 * Used by src/content.js reactLoop:
 *   if (isSubmitShaped(decision.tool, decision.args, accessibleNameForUid)
 *       || decision.verification_required) {
 *     await runValidator(...)
 *   }
 */

// Conservative regex over accessible names. Matches the accessible name as a
// whole word — "Submit", "Submit order", "Place order", "Sign in", "Continue".
// Case-insensitive. Hyphenated and multi-word variants are caught via the
// leading-word check below; we don't want to match every button containing
// "submit" anywhere (e.g. "Submission history").
const COMMIT_VERB_PATTERN = /^(submit|book|buy|order|place|confirm|pay|send|sign[\s-]*in|sign[\s-]*up|log[\s-]*in|register|continue|next|complete|finish|checkout|purchase|publish|post|save|create|update|delete|remove|apply)\b/i;

/**
 * Mutating tool names that ALWAYS qualify as submit-shaped regardless of
 * accessible name, because they navigate (and any navigation is a state
 * commit by definition).
 */
const ALWAYS_SUBMIT_SHAPED = new Set([
  "navigate",
  "go_back",
  "go_forward",
  "reload",
]);

/**
 * Return true if the (toolName, args, accessibleName) combination warrants a
 * post-action verification call. accessibleName may be empty when the tool
 * doesn't target a specific element (navigation, dialog handling).
 */
export function isSubmitShaped(toolName, args, accessibleName) {
  if (typeof toolName !== "string" || !toolName) return false;

  // Navigation always commits state.
  if (ALWAYS_SUBMIT_SHAPED.has(toolName)) return true;

  // press_key "Enter" / "Return" — keyboard submit on the focused element.
  if (toolName === "press_key") {
    const key = readArgString(args, "key");
    if (isEnterKey(key)) return true;
    return false;
  }

  // fill with press_enter:true — the trailing Enter is itself the submit.
  // Without press_enter, plain `fill` is just typing into an input, NOT a
  // commit.
  //
  // PR #20 review fix: previously we ALSO matched commit verbs in the
  // field's accessible name, but field labels describe what you type INTO
  // ("Confirm password", "Apply code", "Order number") — they don't
  // describe the commit action. Verb-name matching belongs on `click`
  // where the name labels a button. The previous over-firing meant the
  // validator ran on every signup/checkout form and two consecutive
  // ambiguous verdicts could escalate the loop into recover.
  //
  // Rare composite-fill controls (the "fill commits on blur" pattern)
  // can opt in via the schema's `verification_required: true` self-flag
  // — the model has the page semantics, the field label doesn't.
  if (toolName === "fill") {
    return !!(args && args.press_enter === true);
  }

  // fill_form with any entry that has press_enter — same logic across the
  // batch.
  if (toolName === "fill_form") {
    const entries = args && Array.isArray(args.entries) ? args.entries : [];
    if (entries.some((e) => e && e.press_enter === true)) return true;
    return false;
  }

  // click on an element whose accessible name reads as a commit verb.
  if (toolName === "click") {
    return matchesCommitVerb(accessibleName);
  }

  // handle_dialog with accept:true — the user confirmed a JS dialog (alert,
  // confirm, prompt). Confirming a confirm() is a commit; cancelling is not.
  if (toolName === "handle_dialog") {
    return args && args.accept === true;
  }

  // computer pixel-coord escape hatch — we can't introspect what was clicked
  // without DOM context, so be conservative: only flag when the model self-
  // declares verification_required (handled at the call site) OR when the
  // action is "type" with a trailing Enter character. The latter mirrors the
  // fill+Enter case for raw computer use.
  if (toolName === "computer") {
    if (args && args.action === "type" && typeof args.text === "string") {
      if (/[\r\n]$/.test(args.text)) return true;
    }
    return false;
  }

  // evaluate_script — always-ask gate plus arbitrary side effects. The model
  // self-flag is the right signal here; we don't try to parse the JS to
  // detect submits.
  if (toolName === "evaluate_script") return false;

  // Anything else (read-only tools, hover, scroll, drag, set_viewport,
  // ask_user, ask_user_form, take_*, get_*, list_*, find, …) is not
  // submit-shaped.
  return false;
}

function readArgString(args, key) {
  if (!args || typeof args !== "object") return "";
  const v = args[key];
  return typeof v === "string" ? v : "";
}

function isEnterKey(key) {
  if (typeof key !== "string" || !key) return false;
  // Bare "\n" / "\r" / "\r\n" some prompts use as the "submit" key. Check
  // BEFORE trim() — trim() collapses these to "".
  if (key === "\n" || key === "\r" || key === "\r\n") return true;
  // Accept "Enter", "Return", chords like "Ctrl+Enter" / "Cmd+Return".
  const k = key.trim();
  if (/(^|\+)(Enter|Return)$/i.test(k)) return true;
  return false;
}

function matchesCommitVerb(accessibleName) {
  if (typeof accessibleName !== "string" || !accessibleName) return false;
  return COMMIT_VERB_PATTERN.test(accessibleName.trim());
}

/**
 * Helper: extract the accessible name of a uid from the cached snapshot text.
 * Snapshot lines have the shape `ref_{v}_{n} {role} "{name}"` (per
 * src/perception/snapshot.js formatLine). Returns "" when the uid isn't
 * found or has no name (button-with-no-label, etc.).
 *
 * Exported so the content-script reactLoop can pass the same value into
 * isSubmitShaped without each caller having to duplicate the regex.
 */
export function accessibleNameForUid(snapshotText, uid) {
  if (typeof snapshotText !== "string" || !snapshotText) return "";
  if (typeof uid !== "string" || !uid) return "";
  // Match the line that starts with the uid, then grab the quoted name.
  // ref_2_5 button "Submit order"  → "Submit order"
  // Escape the uid (it's user-controlled in the schema sense — defensive).
  const escaped = uid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escaped}\\s+\\S+\\s+"([^"]*)"`, "m");
  const m = snapshotText.match(re);
  return m ? m[1] : "";
}

export const SUBMIT_SHAPE_VERBS = COMMIT_VERB_PATTERN;
