/**
 * SW ask-user — bridges an approval prompt across the worker-death-prone message
 * boundary. When the loop runs in the service worker and the action gate needs
 * approval, ask() sets the tab's pendingAsk (the side panel renders it) and
 * returns a promise that parks the turn; the background USER_ANSWER handler calls
 * resolveAnswer() when the user responds.
 *
 * The in-flight promise + resolver + timeout are worker-memory only, and MV3
 * evicts an idle worker (~30s) — destroying all three while the chip is still
 * shown. resolveAnswer therefore reports three outcomes so the caller can
 * recover gracefully: "resolved" (a live resolver matched), "stale" (a live
 * resolver exists but for a newer prompt — ignore this late answer), and
 * "orphaned" (no live resolver at all — the parked turn died with its worker).
 * For "orphaned":
 *   - a decline is consumed FAIL-CLOSED via expireOrphanedApproval(): clear the
 *     chip and tell the user to resend, never execute the approved action
 *     without its turn.
 *   - an "Allow" is consumed via adoptOrphanedApproval(): clear the chip, then
 *     register a ONE-SHOT grant for the exact (tabId, tool, args) the user
 *     approved, and the caller (background.js) triggers handleResume so the
 *     turn continues from the durable transcript. The grant is what lets the
 *     resumed turn's re-request of that SAME action proceed without asking
 *     twice — ask() consults grants before minting a new chip.
 *
 * Factory over setPendingAsk (DIP); tests pass a fake. clearPendingAsk is
 * optional and, when given, is invoked whenever a prompt settles — including on
 * a timeout, which is the one case with no USER_ANSWER message to clear the
 * panel's chip through the normal path. randomUUID is injectable for tests;
 * production uses crypto.randomUUID so ids are unique across worker lifetimes.
 * now/grantTtlMs are injectable for tests; production defaults to a real clock
 * and a short (2 min) grant window — the resumed turn re-requests within one
 * LLM round-trip, so a longer window is pure exposure.
 */
// The human-readable approval question. For open_tab, name the destination
// origin so the user sees which domain they're authorizing; fall back to a
// generic phrasing for any other tool or an unparseable URL (never throw).
function askQuestion(tool, args) {
  if (tool === "open_tab" && args?.url) {
    try {
      return `Allow the agent to open a new tab to ${new URL(args.url).origin}?`;
    } catch {
      /* fall through to the generic question */
    }
  }
  return `Allow the agent to run "${tool}" on this page?`;
}

export function createSwAskUser({
  setPendingAsk,
  clearPendingAsk,
  randomUUID = () => globalThis.crypto.randomUUID(),
  timeoutMs = 120_000,
  now = () => Date.now(),
  grantTtlMs = 2 * 60_000,
} = {}) {
  if (typeof setPendingAsk !== "function") {
    throw new Error("createSwAskUser: setPendingAsk is required");
  }

  const pending = new Map(); // tabId -> { id, finish }
  const grants = new Map(); // "tabId|tool|args" -> expiry ms

  // Exact match on the full args, not a fuzzy/normalized one: a resumed model
  // re-requesting a trivially different URL (path, query, trailing slash) must
  // re-prompt, never auto-allow — fail closed. The chip's question only ever
  // showed the origin (see askQuestion below), so binding the grant to the
  // exact args the user's approval was minted for is stricter than what they
  // saw, which is the safe direction to be stricter in.
  const grantKey = (tabId, tool, args) => `${tabId}|${tool}|${JSON.stringify(args ?? {})}`;

  function grantOnce(tabId, tool, args) {
    grants.set(grantKey(tabId, tool, args), now() + grantTtlMs);
  }

  function clearGrants(tabId) {
    const prefix = `${tabId}|`;
    for (const key of grants.keys()) {
      if (key.startsWith(prefix)) grants.delete(key);
    }
  }

  function ask(tabId, tool, args) {
    const key = grantKey(tabId, tool, args);
    if (grants.has(key)) {
      const expiry = grants.get(key);
      grants.delete(key); // one-shot even when expired — a grant is never reusable
      if (now() <= expiry) return Promise.resolve(true);
    }
    // A UUID, not a per-worker counter: an MV3 worker restart resets any local
    // sequence, so `approve-<tab>-1` could recur and let a stale answer settle a
    // NEW prompt with the same id. A UUID never collides across lifetimes, so the
    // id-match in resolveAnswer stays a real consent binding after a restart too.
    const id = `approve-${tabId}-${randomUUID()}`;
    setPendingAsk(tabId, {
      id,
      // Name the destination the user is consenting to. open_tab navigates to a
      // new, policy-gated domain; approving "run open_tab on this page" without
      // showing WHERE isn't informed consent. Origin only — the path/query can
      // carry sensitive tokens and isn't what the domain gate keys on.
      question: askQuestion(tool, args),
      tool,
      args,
      options: [
        { label: "Allow", value: "allow" },
        { label: "Don't allow", value: "deny" },
      ],
    }).catch(() => {});
    return new Promise((resolve) => {
      // Don't hang the turn (and the tab's run-slot) forever if the panel is
      // closed and no answer ever comes — time out as a denial.
      const timer = timeoutMs > 0 ? setTimeout(() => finish(false), timeoutMs) : null;
      function finish(approved) {
        if (timer) clearTimeout(timer);
        if (pending.get(tabId)?.finish === finish) pending.delete(tabId);
        clearPendingAsk?.(tabId)?.catch?.(() => {});
        resolve(approved === true);
      }
      pending.set(tabId, { id, finish });
    });
  }

  // Resolve by tabId alone — for a caller that isn't answering a specific prompt
  // (a timeout or a provider-switch cancel). For a USER_ANSWER, prefer
  // resolveAnswer so a stale answer can't resolve a since-replaced prompt.
  function resolve(tabId, approved) {
    pending.get(tabId)?.finish(approved);
  }

  // The sidebar answers with the option's LABEL text ("Allow"/"Don't allow") and
  // the prompt's id. Returns one of three outcomes (consent binds to the exact
  // prompt the user was shown):
  //   "resolved" — a live resolver for THIS id matched; the turn continues.
  //   "stale"    — a live resolver exists but for a DIFFERENT (newer) prompt;
  //                ignore this late answer, leave the newer prompt's chip alone.
  //   "orphaned" — no live resolver at all; the parked turn died with its worker.
  //                The caller must expire the persisted chip (see
  //                expireOrphanedApproval), not silently drop the answer.
  function resolveAnswer(tabId, id, answerText) {
    const entry = pending.get(tabId);
    if (!entry) return "orphaned";
    if (entry.id !== id) return "stale";
    entry.finish(answerText === "Allow");
    return "resolved";
  }

  return { ask, resolve, resolveAnswer, grantOnce, clearGrants };
}

/**
 * Fail-closed handling for an "orphaned" approval answer — one whose parked turn
 * died with its (evicted) worker, leaving only the persisted chip. Clears that
 * chip and notifies the user to resend, but ONLY when the still-persisted
 * pendingAsk is the exact prompt being answered — so a stale answer to a
 * since-replaced prompt can never wipe a newer, still-live one. Never executes
 * the approved action: the turn that would have run it is gone.
 *
 * `readState` is per-tab-state's `read` — it returns the FULL session record, so
 * the pendingAsk is nested (`record.pendingAsk`). Taking the whole record here
 * (rather than a pre-extracted pendingAsk) keeps the call site a direct
 * `readState: read` with no adapter to get subtly wrong, and lets these unit
 * tests exercise the real storage shape. Pure over injected deps (DIP);
 * background wires read / clearPendingAsk / notifySidebarError. Returns whether
 * it expired a chip.
 */
export async function expireOrphanedApproval(tabId, id, { readState, clearPendingAsk, notify } = {}) {
  const pendingAsk = (await readState(tabId))?.pendingAsk;
  if (pendingAsk?.id !== id) return false; // no persisted match, or a newer prompt — leave it
  await clearPendingAsk(tabId);
  notify(tabId, "This approval expired because the agent was interrupted. Resend your request to continue.");
  return true;
}

/**
 * The "Allow" counterpart to expireOrphanedApproval: the user answered Allow to
 * an approval whose parked turn already died with its worker. There's no live
 * resolver to settle (that turn is gone), so this can't resume it directly —
 * instead it clears the chip and registers a one-shot grant for the EXACT
 * (tool, args) the persisted prompt was for, so when the caller separately
 * triggers a resume (background.js does, via handleResume), the resumed turn's
 * own re-request of that same action sails through ask() without a second
 * prompt. Same id-matching discipline as expireOrphanedApproval: a stale
 * answer to a since-replaced prompt touches nothing.
 *
 * `readState`/`grantOnce` are injected (DIP); background wires per-tab-state's
 * `read` and this module's own `grantOnce`. Returns whether it adopted (cleared
 * + granted) the chip.
 */
export async function adoptOrphanedApproval(tabId, id, { readState, clearPendingAsk, grantOnce } = {}) {
  const pendingAsk = (await readState(tabId))?.pendingAsk;
  if (pendingAsk?.id !== id) return false; // no persisted match, or a newer prompt — leave it
  await clearPendingAsk(tabId);
  grantOnce(tabId, pendingAsk.tool, pendingAsk.args);
  return true;
}
