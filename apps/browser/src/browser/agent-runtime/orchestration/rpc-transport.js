/**
 * Retrying RPC transport — the SW loop's single funnel for every page-targeted
 * message (PERCEIVE / EXECUTE_TOOL / CALL_LLM / FETCH_LLM / VALIDATE_ACTION, all
 * routed through build-sw-host's `rpc`). One connection-error gate here covers
 * three otherwise-distinct causes uniformly: a freshly open_tab-created tab whose
 * content script hasn't registered yet, a content script lost to a service-worker
 * restart, and the open_tab → switch_focus → perceive race — all three surface as
 * the same "no receiver" rejection from chrome.tabs.sendMessage.
 *
 * On that failure ONLY, ensureReady (background.js's ensureContentScript — PING,
 * then inject-and-settle) is consulted and the send is retried once. A page
 * ensureReady can't fix (chrome:// / a protected page) throws a shaped,
 * agent-readable error instead of retrying forever. Any other error — a real
 * RPC-level failure, or a closed response port (unknown outcome — see the
 * pattern below) — propagates immediately; this gate only ever second-guesses
 * the "is anyone listening" failure mode, never one where the receiver may have
 * already run.
 *
 * Factory over the raw transport + readiness probe (DIP); background.js supplies
 * chrome.tabs.sendMessage and the real ensureContentScript.
 */

// Chrome's wording for "no content script is listening on this tab" varies by
// version/timing but always contains one of these phrases. DELIBERATELY excludes
// "message port closed": that error does NOT prove the receiver never ran — it
// commonly means the content script handled the message (possibly committing a
// click / key / navigation) but its async response channel disappeared. Since
// this transport funnels EXECUTE_TOOL, retrying a closed port could re-apply an
// already-committed mutation. Only a definite "no receiving end" is safe to
// retry; a closed port propagates so the loop re-perceives instead.
const CONNECTION_ERROR_PATTERN = /Could not establish connection|Receiving end does not exist/i;

function isConnectionError(err) {
  return CONNECTION_ERROR_PATTERN.test(err?.message || "");
}

export function createRetryingSendToTab({ send, ensureReady } = {}) {
  if (typeof send !== "function") {
    throw new Error("createRetryingSendToTab: send is required (pass chrome.tabs.sendMessage or a fake)");
  }
  if (typeof ensureReady !== "function") {
    throw new Error("createRetryingSendToTab: ensureReady is required (pass ensureContentScript or a fake)");
  }

  return async function sendToTab(tabId, type, payload = {}) {
    try {
      return await send(tabId, { type, payload });
    } catch (err) {
      if (!isConnectionError(err)) throw err;

      const ready = await ensureReady(tabId);
      if (!ready) {
        throw new Error(
          "This page can't be automated (browser-internal or protected page). Switch focus to a normal web page.",
        );
      }
      // Retry exactly once. A second failure propagates as-is — no loop, no
      // swallowing; the caller (the loop's error handling) decides what to do.
      return await send(tabId, { type, payload });
    }
  };
}
