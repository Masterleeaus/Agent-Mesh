/**
 * Navigation actions backed by CDP Page.* commands.
 *
 * Pure CDP wire-up — all I/O is the injected driver. The tools that mutate
 * tab state (navigate / go_back / go_forward / reload) live behind the
 * permission gate; switch_frame is content-script-side because it changes
 * the refmap context, not the tab.
 *
 * Wait semantics intentionally NOT bundled with navigate: the agent calls
 * navigate, then can call wait_for / wait_for_network_idle as a separate
 * step. Decoupling keeps each action's responsibility crisp and lets the
 * agent skip the wait when it has a faster signal (e.g. a WebMCP tool that
 * returns success synchronously).
 */

function urlError(reason) {
  return { error: `navigate: 'url' is required (${reason}).` };
}

export async function navigate(driver, tabId, params = {}) {
  const url = typeof params.url === "string" ? params.url.trim() : "";
  if (!url) return urlError("missing or empty");
  // Block javascript: URLs at the dispatcher boundary. They're a XSS vector
  // (the agent could be tricked into running arbitrary script via a navigate
  // call that bypasses the evaluate_script always-ask gate). Block early so
  // the request never reaches Chrome.
  if (/^javascript:/i.test(url)) {
    return { error: "navigate: javascript: URLs are not allowed. Use evaluate_script for in-page execution (always-ask gated)." };
  }
  try {
    const result = await driver.send(tabId, "Page.navigate", { url });
    // Page.navigate can resolve with errorText set instead of throwing — the
    // request reached Chrome but Chrome refused to navigate (CSP, blocked-by-
    // client, X-Frame-Options, network down, …). Returning ok:true here
    // would silently advance the agent past a failed nav.
    if (result?.errorText) {
      return { error: `navigate: ${result.errorText}` };
    }
    return {
      ok: true,
      ...(result?.frameId ? { frameId: result.frameId } : {}),
      ...(result?.loaderId ? { loaderId: result.loaderId } : {}),
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function navigateHistory(driver, tabId, delta, missingMessage) {
  try {
    const history = await driver.send(tabId, "Page.getNavigationHistory");
    const idx = history?.currentIndex ?? 0;
    const targetIdx = idx + delta;
    const entries = history?.entries || [];
    if (targetIdx < 0 || targetIdx >= entries.length) {
      return { error: missingMessage };
    }
    await driver.send(tabId, "Page.navigateToHistoryEntry", { entryId: entries[targetIdx].id });
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}

export function goBack(driver, tabId, _params = {}) {
  return navigateHistory(driver, tabId, -1, "go_back: no previous entry in history.");
}

export function goForward(driver, tabId, _params = {}) {
  return navigateHistory(driver, tabId, +1, "go_forward: no next entry in history.");
}

export async function reload(driver, tabId, params = {}) {
  try {
    const cdpParams = params.hard ? { ignoreCache: true } : {};
    await driver.send(tabId, "Page.reload", cdpParams);
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}
