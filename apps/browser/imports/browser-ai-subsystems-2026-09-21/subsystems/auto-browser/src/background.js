/**
 * Background service worker.
 * - Binds a per-tab side panel on chrome.action.onClicked (setPanelBehavior
 *   disables the global open-on-click so each tab gets its own panel
 *   instance via setOptions({tabId, path, enabled:true}) then open()).
 * - Persists agent events into session_state_${tabId} in chrome.storage.local
 *   so closed-then-reopened panels replay their history, and garbage-collects
 *   the record on chrome.tabs.onRemoved. purgeGhosts() runs on SW boot to
 *   clean up tabs that closed while the worker was dead.
 * - Relays sidebar → content-script messages for the specific tab the panel
 *   is bound to (sidebar stamps tabId into every payload; no "active tab"
 *   fallback — the bound tab may not be the focused one).
 * - Auto-injects content script if not present on the tab.
 * - Owns the chrome.debugger CDP driver and routes the agent's CDP-backed
 *   message types (COMPUTER_ACTION, NAV_ACTION, EVALUATE_SCRIPT, WAIT_*,
 *   LIST_NETWORK / READ_CONSOLE, EMULATION_*, HANDLE_DIALOG, TAKE_SCREENSHOT)
 *   into the right action / observer / wait module.
 * - Maintains per-tab observer instances (network + console) and a per-tab
 *   page-domain-enabled set; cleans both up on chrome.tabs.onRemoved.
 * - Subscribes to Page.frameNavigated and forwards FRAME_NAVIGATED to the
 *   content script so it can bump the refmap seal.
 */
import { driver } from "./cdp/driver.js";
import { takeScreenshot } from "./perception/screenshot.js";
import { layoutOverlays } from "./perception/overlay.js";
import { renderOverlayedScreenshot } from "./perception/overlay-render.js";
import { computer } from "./actions/computer.js";
import { navigate, goBack, goForward, reload } from "./actions/nav.js";
import { evaluateScript } from "./actions/evaluate.js";
import { waitForText, waitForNetworkIdle } from "./actions/waits.js";
import { setViewport, setUserAgent, clearEmulation } from "./actions/emulation.js";
import { handleDialog } from "./actions/dialog.js";
import { createNetworkObserver } from "./observers/network.js";
import { createConsoleObserver } from "./observers/console.js";
import {
  append as appendSession,
  read as readTabState,
  setPendingAsk,
  clearPendingAsk,
  clearMessages as clearSessionMessages,
  deleteTab as deleteTabSession,
  moveTabState,
  purgeGhosts,
  upsertThought,
  setBootstrapReady,
  buildChatAppendEntry,
} from "./session/per-tab-state.js";
import { createOffscreenManager } from "./offscreen-manager.js";
import { createStatusPersister } from "./orchestration/persist-status.js";
// SW loop (default ON — see swLoopEnabled). Relocates the ReAct loop into the
// worker; {swLoop:false} in chrome.storage.local is the opt-out kill-switch.
import { createSwLoopRuntime } from "./orchestration/sw-loop-runtime.js";
import { runReactLoop } from "./orchestration/react-loop.js";
import { createSessionStore } from "./session/session-state.js";
import { createActionJournal } from "./orchestration/action-journal.js";
// Multi-tab — the "Auto Browser" tab group + agent tab tools. The group
// authority is module-scope (see the tabGroup const below) so boot-reconcile and
// tab-close cleanup can reach it even before the SW loop (getSwRuntime) has
// ever run a turn.
import { createTabGroupManager, GROUP_STORAGE_KEY } from "./orchestration/tab-group.js";
import { createTabTools } from "./orchestration/tab-tools.js";
import { createTabController } from "./orchestration/tab-controller.js";
import { createSwAskUser, expireOrphanedApproval, adoptOrphanedApproval } from "./orchestration/sw-ask-user.js";
import { createSwLoopRouter } from "./orchestration/sw-loop-router.js";
import { createRetryingSendToTab } from "./orchestration/rpc-transport.js";
import { createGroupNavSweep } from "./orchestration/group-nav-sweep.js";
import { getPolicy, DEFAULT_POLICY } from "./safety/policy-store.js";
import { screenOpenTabUrl } from "./safety/open-tab-gate.js";
import { isBlocked } from "./safety/blocklist.js";
import { createWorkingMemory, getWorkingMemoryAdvisory, recordToolUse } from "./llm/working-memory.js";
import { isReadOnlyTool } from "./llm/read-only-tools.js";
import { createDiagnosticsCollector } from "./diagnostics/collector.js";
import {
  recordToolLatencyIfOk,
  selectCollectorForTab,
} from "./diagnostics/record.js";

// Per-tab observer instances. Created lazily on first read; kept alive for the
// tab's lifetime; cleaned up on tab close. Both observers + the Page-domain
// frameNavigated tracking pin the chrome.debugger attach via driver.retain()
// so onEvent keeps flowing past the send-driven idle window. Without the
// retains, observers fall silent ~5s after the last send (PR #8 review F1).
const networkObservers = new Map();
const consoleObservers = new Map();
const pageDomainEnabled = new Map(); // tabId -> release() returned by retain
const observerReleases = new Map();  // tabId -> { network?, console? } release fns

// Offscreen document — scoped strictly to the overlay-rendering pipeline.
// The manager refcounts retainers so concurrent renders share a single
// doc; see ./offscreen-manager.js for the lifecycle contract. PR #51
// review: the doc no longer opens on USER_MESSAGE / closes on terminal
// STATUS_UPDATE — that earlier scope kept the doc alive for text-only
// turns whose only observable behavior was SW keepalive, which is the
// pattern Chrome Web Store reviewers flag. The retain/release now
// lives strictly inside renderOverlayViaOffscreen so every offscreen
// lifecycle pairs 1:1 with actual Blob work.
const offscreen = createOffscreenManager({
  offscreenApi: chrome.offscreen,
  onError: (err) =>
    console.warn("[AutoBrowser:BG] offscreen error:", err?.message || err),
});

// Monotonic counter so concurrent renderOverlayViaOffscreen calls retain
// with distinct keys. The manager's Set-based refcount dedupes by key —
// if both calls used the same key, the first release would close the
// doc out from under the second still-in-flight render. Uniqueness per
// call eliminates the race without changing the manager.
let renderCounter = 0;

// Open the offscreen doc, send an overlay-render request, close. The
// SW-side renderer is kept as a fallback for environments where the
// offscreen doc can't be opened (chrome.offscreen unsupported, or
// createDocument rejects for any reason) — losing labels would degrade
// the whole include_screenshot path.
async function renderOverlayViaOffscreen(base64Data, mime, placements) {
  const retainKey = `render-${++renderCounter}`;
  let retained = false;
  try {
    await offscreen.retain(retainKey);
    retained = true;
    const reply = await chrome.runtime.sendMessage({
      target: "offscreen",
      type: "RENDER_OVERLAY",
      payload: { base64Data, mime, placements },
    });
    if (reply && (reply.data || reply.error)) return reply;
    // Offscreen returned undefined — no listener picked the message up.
    // Fall through to inline render.
  } catch {
    // retain rejected (chrome.offscreen unsupported) OR sendMessage
    // threw "Could not establish connection. Receiving end does not
    // exist." Fall through to the inline renderer.
  } finally {
    if (retained) offscreen.release(retainKey).catch(() => {});
  }
  return renderOverlayedScreenshot({ base64Data, mime, placements });
}

// Returns a complete per-provider config shape with sensible defaults.
// Missing provider sub-objects are filled with empty defaults so callers
// don't have to null-check `providers.gemini` before reading `.apiKey`.
function normalizeProvidersConfig(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    openrouter: {
      apiKey: src.openrouter?.apiKey || "",
      model: src.openrouter?.model || "",
      // Phase 1 — thinking-mode toggle (defaults to false). thinkingEffort
      // is meaningful only when thinking is true; clamped to the three
      // canonical values so a malformed seed can't reach the wire.
      thinking: !!src.openrouter?.thinking,
      thinkingEffort: normalizeEffort(src.openrouter?.thinkingEffort),
    },
    "builtin-ai": {
      // Phase 1 — Built-in AI defaults thinking-on (it's the only
      // reasoning surface for that provider; users opt OUT explicitly).
      thinking: src["builtin-ai"]?.thinking !== false,
    },
    gemini: {
      apiKey: src.gemini?.apiKey || "",
      model: src.gemini?.model || "",
      thinking: !!src.gemini?.thinking,
      // Gemini maps effort → thinkingBudget (see gemini-provider buildThinkingConfig).
      // Persisted so the inline composer effort control round-trips across restarts.
      thinkingEffort: normalizeEffort(src.gemini?.thinkingEffort),
    },
    local: {
      baseUrl: src.local?.baseUrl || "",
      apiKey: src.local?.apiKey || "",
      model: src.local?.model || "",
      kind: src.local?.kind || "custom",
      vision: Array.isArray(src.local?.vision) ? src.local.vision : [],
      // Phase 1 — opt-in per-model native-reasoning list (mirrors `vision`).
      // Models listed here are assumed to emit `delta.reasoning` over the
      // SSE stream (DeepSeek R1, QwQ, etc.). Models not listed fall back
      // to schema-thought even when `thinking` is true.
      reasoning: Array.isArray(src.local?.reasoning) ? src.local.reasoning : [],
      thinking: !!src.local?.thinking,
      // URL-scoped consent: stored as the normalized approved URL, or ""
      // when nothing is approved. A boolean here (from a pre-PR-17-review
      // dev install) collapses to "" and forces a fresh prompt.
      acknowledgedNonLocal:
        typeof src.local?.acknowledgedNonLocal === "string"
          ? src.local.acknowledgedNonLocal
          : "",
    },
  };
}

// Clamp thinkingEffort to the three values our providers + thinking-mode.js
// understand. Anything else collapses to "medium" (the safe default).
function normalizeEffort(v) {
  return v === "low" || v === "medium" || v === "high" ? v : "medium";
}

async function getNetworkObserver(tabId) {
  const existing = networkObservers.get(tabId);
  if (existing) return existing;
  // Cache + release-record happen ONLY after attach succeeds. Otherwise a
  // failed Network.enable would poison the cache with an inert observer
  // (later list_network_requests reads return empty buffers as if no
  // requests occurred) and leak the retain pin (PR #8 review F6).
  const release = await driver.retain(tabId);
  const obs = createNetworkObserver(driver, tabId);
  try {
    await obs.attach();
  } catch (err) {
    obs.detach();
    release();
    throw new Error(`network observer attach failed: ${err.message}`);
  }
  networkObservers.set(tabId, obs);
  const releases = observerReleases.get(tabId) || {};
  releases.network = release;
  observerReleases.set(tabId, releases);
  return obs;
}

async function getConsoleObserver(tabId) {
  const existing = consoleObservers.get(tabId);
  if (existing) return existing;
  const release = await driver.retain(tabId);
  const obs = createConsoleObserver(driver, tabId);
  try {
    await obs.attach();
  } catch (err) {
    obs.detach();
    release();
    throw new Error(`console observer attach failed: ${err.message}`);
  }
  consoleObservers.set(tabId, obs);
  const releases = observerReleases.get(tabId) || {};
  releases.console = release;
  observerReleases.set(tabId, releases);
  return obs;
}

async function ensurePageEnabled(tabId) {
  if (pageDomainEnabled.has(tabId)) return;
  // Release the retain pin if Page.enable fails — otherwise a transient
  // failure leaves the debugger session pinned for the lifetime of the
  // tab/worker (PR #8 review F7).
  let release = null;
  try {
    release = await driver.retain(tabId);
    await driver.send(tabId, "Page.enable", {});
    pageDomainEnabled.set(tabId, release);
  } catch (err) {
    release?.();
    throw new Error(`Page.enable failed: ${err.message}`);
  }
}

/**
 * Origin-drift gate shared by every mutating SW route. CS captures
 * location.origin at approval time and ships it as `expectedOrigin`; if the
 * live tab URL has drifted to a different origin between approval and
 * dispatch, abort with the canonical drift error.
 *
 * Returns `true` when drift was detected and `sendResponse` has already been
 * called — callers MUST short-circuit. Returns `false` to proceed. A nullish
 * `expectedOrigin` skips the check (read-only paths flow through cleanly).
 *
 * Used by EMULATION_* and HANDLE_DIALOG (PR #9 review F1). COMPUTER_ACTION
 * and EVALUATE_SCRIPT predate this helper and inline the same logic; folding
 * them in is a separate refactor.
 */
async function driftCheck(tabId, expectedOrigin, sendResponse) {
  if (!expectedOrigin) return false;
  const tab = await chrome.tabs.get(tabId);
  const actualUrl = tab?.url;
  if (hasDrifted(expectedOrigin, actualUrl)) {
    sendResponse(driftError(expectedOrigin, actualUrl || "about:blank"));
    return true;
  }
  return false;
}

// Single source of truth for tearing down all per-tab CDP-state we cached on
// behalf of `tabId`. Called on chrome.tabs.onRemoved AND on external
// chrome.debugger.onDetach (banner-cancel, target crash, …) so we never
// reuse stale observers/release handles after the underlying debugger
// session has gone away (PR #8 review F8).
function clearTabCdpState(tabId) {
  networkObservers.get(tabId)?.detach();
  networkObservers.delete(tabId);
  consoleObservers.get(tabId)?.detach();
  consoleObservers.delete(tabId);
  const releases = observerReleases.get(tabId);
  if (releases) {
    releases.network?.();
    releases.console?.();
    observerReleases.delete(tabId);
  }
  pageDomainEnabled.get(tabId)?.();
  pageDomainEnabled.delete(tabId);
}

// Main-frame navigation invalidates every uid the agent's still holding.
// Notify the content script so it can bump its refmap seal — any subsequent
// uid-based tool call gets a stale-snapshot error pointing at take_snapshot,
// instead of silently resolving to a wrong element on the new page.
driver.on?.("Page.frameNavigated", (params, source) => {
  // Subframe navs don't invalidate the whole refmap; only main-frame counts.
  if (params?.frame?.parentId) return;
  chrome.tabs.sendMessage(source.tabId, {
    type: "FRAME_NAVIGATED",
    payload: { url: params?.frame?.url },
  }).catch(() => {});
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearTabCdpState(tabId);
  incognitoTabs.delete(tabId);
  // Garbage-collect the per-tab session record so closed tabs don't leak
  // chat history + pendingAsk state into chrome.storage.local forever.
  // Safe to call even for incognito tabs (no-op if no record exists; the
  // tombstone it sets is also harmless for tabs that never wrote state).
  deleteTabSession(tabId).catch(() => {});
  // A one-shot open_tab approval grant (see sw-ask-user.js) must not survive
  // its tab — harmless no-op if this tabId never held one.
  swAskUser.clearGrants(tabId);
  // SW-loop session cleanup (only if the SW loop has been instantiated): drop the
  // UUID session record + action-journal intents so they don't leak. When the SW
  // loop has never run a turn (_swRuntime still null) but a group exists anyway —
  // e.g. re-adopted by tabGroup.hydrate() on boot, before any USER_MESSAGE — fall
  // back to the hoisted tabGroup/tabController directly so a re-adopted-but-idle
  // group doesn't dangle forever.
  if (_swRuntime) {
    _swRuntime.onTabRemoved(tabId).catch(() => {});
  } else {
    const sessionId = tabGroup.findGroupByTab(tabId);
    if (sessionId) {
      const isAnchor = tabGroup.getRecord(sessionId)?.anchorTabId === tabId;
      const cleanup = isAnchor ? tabController.teardownSession(sessionId) : tabController.forgetClosedMember(tabId);
      cleanup.catch(() => {});
    }
  }
});

// Prerender commit: Chrome swaps a foreground tab for a prerendered one and
// reassigns the tabId. Three things have to move in lockstep or the live
// panel is silently orphaned (PR #15 review F3):
//   1. The session_state_${tabId} record — otherwise hydration on reopen
//      misses the new tab's history.
//   2. The sidePanel binding — re-bind setOptions to the added tabId so
//      Chrome keeps showing the panel on the replacement tab.
//   3. The panel's in-memory ownTabId — broadcast TAB_REBOUND so the open
//      panel updates its filter/send target and re-hydrates against the
//      new key. Without this, outgoing USER_MESSAGE / STOP_AGENT sends
//      target a dead tabId and inbound events are filtered as "wrong tab".
chrome.tabs.onReplaced?.addListener(async (addedTabId, removedTabId) => {
  try {
    // Serialize the move through the fromTabId write chain. An inline
    // read/set/remove here would race with any queued appendSession or
    // setPendingAsk for the outgoing tab: the migration would either
    // snapshot stale data OR the in-flight task would recreate
    // session_state_${removedTabId} after our remove(). moveTabState runs
    // inside enqueue(fromTabId), so pending tasks drain first.
    await moveTabState(removedTabId, addedTabId);
    // SW-loop binding must follow the reassigned tabId too, or the relocated
    // loop's UUID session + per-tab sub-state (lastSeal/expectedOrigin) orphan.
    if (_swRuntime) await _swRuntime.onTabReplaced(removedTabId, addedTabId).catch(() => {});
    try {
      await chrome.sidePanel.setOptions({
        tabId: addedTabId,
        path: "sidebar/sidebar.html",
        enabled: true,
      });
    } catch {
      // Tab may not have had per-tab options set (panel never opened on it);
      // that's fine — nothing to re-bind.
    }
    chrome.runtime
      .sendMessage({ type: "TAB_REBOUND", payload: { from: removedTabId, to: addedTabId } })
      .catch(() => {});
  } catch (err) {
    console.warn("[AutoBrowser:BG] onReplaced session migration failed:", err.message);
  }
});

// External detach (user clicks Cancel on the debugger banner, target crashes,
// extension reloaded mid-session). The driver clears its OWN attached state
// via the same event; this listener clears the BG-side caches so the next
// observer read or nav doesn't reuse a dead instance / skip Page.enable.
if (chrome.debugger?.onDetach) {
  chrome.debugger.onDetach.addListener((source) => {
    if (source?.tabId != null) clearTabCdpState(source.tabId);
  });
}
import { hasDrifted, driftError } from "./safety/url-drift.js";

// Disable the "open panel on action click" default so our onClicked handler
// owns the per-tab bind. Per-tab isolation (rebind on tab switch) happens
// inside the side panel itself via chrome.tabs.onActivated → rebindToTab.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: false })
  .catch(() => {});

// Bind the panel to the tab the user clicked on and open it.
//
// ORDER IS LOad-BEARING: chrome.sidePanel.open() requires a live
// user-gesture token. ANY `await` before the open() call drops the gesture
// and the promise rejects with "sidePanel.open() may only be called in
// response to a user gesture" — silently, because we catch. Keep open()
// as the first call in the handler (no await, no prior work). setOptions
// doesn't require a gesture, so it runs alongside / after.
chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  chrome.sidePanel
    .open({ tabId: tab.id, windowId: tab.windowId })
    .catch((err) =>
      console.warn("[AutoBrowser:BG] sidePanel.open failed:", err.message),
    );
  chrome.sidePanel
    .setOptions({
      tabId: tab.id,
      path: "sidebar/sidebar.html",
      enabled: true,
    })
    .catch((err) =>
      console.warn("[AutoBrowser:BG] sidePanel.setOptions failed:", err.message),
    );
});

// Track incognito tabs so we skip storage writes for them (PR #15 audit #2).
// chrome.storage.local is shared across normal and incognito modes; persisting
// a chat from an incognito tab violates the user's "leaves no trace" expectation.
const incognitoTabs = new Set();

// Runtime diagnostics (Phase 0.3). Two collectors, one per browsing mode,
// so an incognito tab's activity never surfaces in a normal-window
// Diagnostics card — matching the same mode boundary that PR #15 audit #2
// established for chrome.storage writes (PR #32 review F2). Routing goes
// through selectCollectorForTab against `incognitoTabs` membership; each
// handler below picks the right collector via pickDiagnostics().
const diagnosticsByMode = {
  normal: createDiagnosticsCollector(),
  incognito: createDiagnosticsCollector(),
};
function pickDiagnostics(tabId) {
  return selectCollectorForTab({
    tabId,
    incognitoTabs,
    collectors: diagnosticsByMode,
  });
}

// Bootstrap sequence on SW wake (PR #15 audit #1):
//   1. purgeGhosts — sweep session_state_* for tabIds no longer alive
//      (critical: Chrome resets the tabId counter across restarts, so a
//      previous session's session_state_5 could otherwise leak into a fresh
//      tab that happens to get tabId 5 in the new Chrome session).
//   2. Seed incognitoTabs from chrome.tabs.query so the first write after
//      SW wake already knows to skip incognito tabs.
//
// Every storage write awaits this promise inside per-tab-state.js, and the
// CLAIM_TAB handler below gates the sidebar's hydrate on it — so the panel
// never reads session_state until stale records are gone.
const bootstrapReady = (async () => {
  try {
    await purgeGhosts();
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      if (t.id != null && t.incognito) incognitoTabs.add(t.id);
    }
  } catch (err) {
    console.warn("[AutoBrowser:BG] bootstrap failed:", err.message);
  }
})();
setBootstrapReady(bootstrapReady);

chrome.runtime.onStartup?.addListener(() => {
  purgeGhosts().catch(() => {});
  // Redundant belt-and-suspenders: the browserLifetimeReady gate (below the
  // tabGroup declaration) already drops a stale cross-browser-lifetime snapshot
  // BEFORE hydrate reads it, deterministically. This extra clear covers only the
  // case where that gate itself failed (e.g. chrome.storage.session unavailable);
  // it must NOT be relied on for ordering — onStartup delivery can race hydrate's
  // read, which is exactly why the deterministic gate exists.
  chrome.storage.local.remove(GROUP_STORAGE_KEY).catch(() => {});
});
chrome.runtime.onInstalled?.addListener(() => {
  purgeGhosts().catch(() => {});
});

// Keep incognitoTabs current through the SW's lifetime.
chrome.tabs.onCreated?.addListener((tab) => {
  if (tab?.id != null && tab.incognito) incognitoTabs.add(tab.id);
});

// Guarded write helpers: incognito tabs get no persistence, period.
// bootstrapReady gating lives inside per-tab-state.js so cross-caller
// correctness doesn't depend on every call site remembering to await.
function shouldPersist(tabId) {
  return !incognitoTabs.has(tabId);
}

// Tabs mid-truncate. When the sidebar triggers CLEAR_SESSION while the
// agent is busy, we relay STOP_AGENT and enqueue the truncate — but
// STOP_AGENT takes effect at the next ReAct step boundary, so a tool_result
// or agent_message can still be in flight from the content script after we
// truncate. Those lands as persistStatusUpdate calls which would repopulate
// the freshly-cleared record. Drop them here until the tab quiesces.
// (PR #16 review: "the conversation can repopulate immediately after the
// user confirms deletion").
const clearingTabs = new Set();
const CLEAR_SWALLOW_MS = 5000;
function openClearWindow(tabId) {
  clearingTabs.add(tabId);
  // Backstop: if turn_ended / disengaged / a new user action never arrives
  // (content script crash, network hang), release the window so future
  // legitimate events aren't silently dropped forever.
  setTimeout(() => clearingTabs.delete(tabId), CLEAR_SWALLOW_MS);
}

/**
 * Inject the content script (and page-helper) into a tab if not already present.
 * Returns true if injection succeeded or script was already there.
 */
async function ensureContentScript(tabId) {
  try {
    // Check if content script is already alive
    await chrome.tabs.sendMessage(tabId, { type: "PING" });
    return true; // content script responded
  } catch {
    // Not injected yet — inject it now. The MAIN-world page helper is a
    // separate executeScript call with { world: "MAIN" } so it bypasses page
    // CSP (the equivalent manifest entry handles the first-load case; this
    // branch covers re-injection into a tab whose DOMContentLoaded already
    // fired, e.g. after a service-worker restart).
    console.log("[AutoBrowser:BG] Injecting content script into tab", tabId);
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["src/content.js"],
      });
      await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        files: ["src/page-helper.js"],
      });
      // Give it a moment to initialize
      await new Promise((r) => setTimeout(r, 300));
      return true;
    } catch (err) {
      console.warn("[AutoBrowser:BG] Failed to inject:", err.message);
      return false;
    }
  }
}

/**
 * Relay a message to the content script on a specific tab. The caller
 * supplies the tabId explicitly — with per-tab panels, each panel addresses
 * its own tab via the `tabId` field in the message payload, so there is no
 * global "active tab" fallback here (that fallback was load-bearing in the
 * single-panel model and silently wrong in the multi-panel one).
 */
async function relayToTab(tabId, msg) {
  if (!Number.isInteger(tabId)) {
    console.warn("[AutoBrowser:BG] relayToTab called without tabId");
    notifySidebarError(null, "Panel not bound to a tab. Reopen the side panel.");
    return;
  }

  const injected = await ensureContentScript(tabId);
  if (!injected) {
    notifySidebarError(tabId, "Cannot run on this page (browser internal page or protected site).");
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, msg);
  } catch (err) {
    console.warn("[AutoBrowser:BG] Failed to relay to tab", tabId, err.message);
    notifySidebarError(tabId, "Could not reach the page. Try refreshing the page.");
  }
}

// Single source of truth for turning a STATUS_UPDATE into a persisted
// session_state_${tabId} entry — shared with the relocated SW orchestrator's
// emitStatus so both honor the incognito gate, the clear-truncate swallow
// window, the streaming-thought upsert, and the per-kind shaping. The branch
// logic lives in src/orchestration/persist-status.js.
const { persist: persistStatusUpdate } = createStatusPersister({
  appendSession,
  upsertThought,
  clearPendingAsk,
  shouldPersist,
  clearingTabs,
});

// ── SW loop runtime (default ON; {swLoop:false} is the kill-switch) ────────
// USER_MESSAGE runs the relocated ReAct loop IN the service worker (via
// createSwLoopRuntime) instead of relaying to the content-script loop, unless
// the `swLoop` storage flag is explicitly set to false. Every tool dispatches
// through the content script's existing executeTool (EXECUTE_TOOL RPC) — the
// complete, tested action path (gate + approval + seal); the SW only
// orchestrates the loop and routes the LLM call to the CS's callReActLLM
// (CALL_LLM RPC). Post-action validation, recovery, and history summarization
// route to the CS's tested implementations over RPC too (VALIDATE_ACTION /
// FETCH_LLM). Incognito tabs stay on the CS loop (the SW session store isn't
// no-trace), and so does any turn with image/audio attachments (see the
// USER_MESSAGE branch below) — the CS loop and its RPC handlers stay live for
// both, not dead code.
let swLoopEnabled = true;
// The routing decision (SW loop vs content-script loop) must wait for this to
// settle, or a message in the cold-worker window — before storage resolves —
// would take the default-true SW path even for a {swLoop:false} user, and their
// Stop would be swallowed by the empty SW runtime instead of reaching the CS
// loop. Gated below via swLoopReady; the kill-switch stays deterministic.
const swLoopReady = chrome.storage.local
  .get("swLoop")
  .then((r) => { swLoopEnabled = r?.swLoop !== false; })
  .catch(() => { swLoopEnabled = true; });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.swLoop) swLoopEnabled = changes.swLoop.newValue !== false;
});

// SW-side gate for open_tab (the decision lives in safety/open-tab-gate.js;
// background owns the hot policy cache it reads). tab-tools calls checkUrl
// synchronously, so the policy is kept in memory and refreshed on change. Start
// from the strict defaults (mode:"ask", empty allowlist) + a not-ready flag so
// the gate fails CLOSED before the real policy loads — a cache miss must never
// permit a host the user's ask/allowlist-only policy would gate.
let swPolicy = DEFAULT_POLICY;
let swPolicyReady = false;
function refreshSwPolicy() {
  return getPolicy()
    .then((p) => { swPolicy = p; swPolicyReady = true; })
    .catch(() => { swPolicy = DEFAULT_POLICY; swPolicyReady = false; });
}
refreshSwPolicy();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.safety) refreshSwPolicy(); // policy-store STORAGE_KEY = "safety"
});
function checkOpenTabUrl(url) {
  return screenOpenTabUrl(url, { policy: swPolicy, policyReady: swPolicyReady });
}

// Multi-tab subsystems: the membership authority + agent tab tools, composed into
// the controller the SW host/runtime consume. Hoisted to MODULE scope (not built
// lazily inside getSwRuntime) so boot-time reconciliation (tabGroup.hydrate — see
// bootstrapReady below) and tab-close cleanup can reach the group authority even
// before the SW loop has ever run a turn (getSwRuntime/_swRuntime is still null
// at that point). Group metadata is in-memory + storage-mirrored; incognito
// sessions stay in-memory only (handled inside tab-group.js).
const tabGroup = createTabGroupManager({
  tabsApi: chrome.tabs,
  tabGroupsApi: chrome.tabGroups,
  storage: chrome.storage.local,
  // Ping every open panel on any membership/focus/working-state/lifecycle change
  // so it can re-query GET_SESSION_GROUP and refresh its tab strip. Bare ping,
  // no payload — self-healing (a panel that misses one just re-renders stale
  // until the next change) and keeps tab-group.js ignorant of chrome.runtime.
  onChange: () => chrome.runtime.sendMessage({ type: "GROUP_UPDATED" }).catch(() => {}),
});
// Re-adopt any tab groups that survived a service-worker restart (the browser
// itself keeps running; only the SW was evicted) — without this, a session whose
// SW died mid-turn leaves its "Auto Browser" group and chrome.storage record
// dangling forever, since nothing else re-associates them. Chained after
// bootstrapReady (declared earlier in the file) rather than folded into its IIFE,
// so this doesn't depend on tabGroup being declared before it; the extra
// chrome.tabs.query({}) call is a one-time, negligible cost at boot.
// Distinguish a worker restart (re-adopt the persisted groups) from a genuine
// browser restart (tab/group ids are reused, so the snapshot is stale and must
// NOT be re-adopted — a coincidental id match would pull a user's own tab into
// an agent group). chrome.storage.session survives worker eviction but is empty
// after a browser restart, so its emptiness IS the "new browser lifetime" signal
// — deterministic, unlike onStartup's delivery timing racing hydrate's read.
const BROWSER_LIFETIME_KEY = "auto_browser_lifetime";
const browserLifetimeReady = chrome.storage.session
  .get(BROWSER_LIFETIME_KEY)
  .then(async (r) => {
    if (!r?.[BROWSER_LIFETIME_KEY]) {
      // New browser lifetime → drop the stale group snapshot BEFORE hydrate reads
      // it, so hydrate can never adopt a reused id as agent-owned.
      await chrome.storage.local.remove(GROUP_STORAGE_KEY);
    }
    await chrome.storage.session.set({ [BROWSER_LIFETIME_KEY]: true });
  })
  .catch(() => {});

// Resolves once the tab-group authority has re-adopted any surviving groups, so
// the first SW-loop message after a restart can wait for it and recover its
// session (see recoverSession + the SW dispatch gate below). Ordered AFTER the
// browser-lifetime gate so a cold-start snapshot is cleared before it's read.
// Never rejects — a hydrate failure resolves to nothing (recovery finds no group).
const groupHydrated = Promise.all([bootstrapReady, browserLifetimeReady])
  .then(() => chrome.tabs.query({}))
  .then((tabs) => tabGroup.hydrate(tabs))
  .catch((err) => console.warn("[AutoBrowser:BG] tab-group hydrate failed:", err.message));

// Re-adopt the orchestrator session whose group survived a worker restart:
// map the anchor tab back to the group's sessionId so the SW loop reuses the
// durable transcript and re-uses the existing group instead of minting a new
// UUID (which would strand the old group + its members and lose context). Only
// the ANCHOR of a live group recovers — a member tab or a stale id returns
// undefined, so the registry mints fresh. Reads the hydrated in-memory authority
// (the SW dispatch gate below awaits groupHydrated first), so it stays sync + O(1).
function recoverSession(tabId) {
  const sessionId = tabGroup.findGroupByTab(tabId);
  if (!sessionId) return undefined;
  return tabGroup.getRecord(sessionId)?.anchorTabId === tabId ? sessionId : undefined;
}
// Interactive open_tab approval: an "ask" verdict from checkOpenTabUrl prompts
// through the same pendingAsk chip the content-script action gate uses, rather
// than refusing outright.
const swAskUser = createSwAskUser({ setPendingAsk, clearPendingAsk });
const tabTools = createTabTools({
  tabGroup,
  tabsApi: chrome.tabs,
  checkUrl: checkOpenTabUrl,
  askUser: swAskUser.ask,
});
const tabController = createTabController({ tabGroup, tabTools });

// The SW-loop routing decisions + their swLoopReady/groupHydrated gating (the
// "thin edge"), pulled out of the onMessage handler into a tested factory. Deps
// that are function declarations below (getSwRuntime, relayToTab,
// notifySidebarError, shouldPersist) are hoisted, so referencing them here — at
// module-eval time, before their textual definition — is safe; the router only
// CALLS them later, at message time. isSwLoopEnabled is a getter over the
// mutable swLoop flag.
const swLoopRouter = createSwLoopRouter({
  swLoopReady,
  groupHydrated,
  isSwLoopEnabled: () => swLoopEnabled,
  shouldPersist,
  getRuntime: getSwRuntime,
  relayToTab,
  readTabState,
  clearPendingAsk,
  notifyError: notifySidebarError,
  resolveApprovalAnswer: swAskUser.resolveAnswer,
  grantOnce: swAskUser.grantOnce,
  clearGrants: swAskUser.clearGrants,
  adoptOrphanedApproval,
  expireOrphanedApproval,
});

// Belt-and-suspenders blocklist defense: the CS-side per-action gate only
// fires on a mutating tool call, so a BACKGROUND member tab (agent-opened via
// open_tab but not currently focused) could sit on a blocked domain
// indefinitely without ever tripping it. This sweeps every tab's navigation
// and pauses the whole session — via the anchor, since runningHosts is
// anchor-keyed — the moment ANY member lands on a blocked host.
const groupNavSweep = createGroupNavSweep({
  findGroupByTab: tabGroup.findGroupByTab,
  getRecord: tabGroup.getRecord,
  isBlockedHost: (hostname) => isBlocked(hostname, swPolicy.domainBlocklist),
  stopSession: (anchorTabId) => { if (_swRuntime) _swRuntime.stopTab(anchorTabId); },
  notify: notifySidebarError,
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) groupNavSweep.handleNavigation(tabId, changeInfo.url);
});

const ensureSessionGroup = async (sessionId, anchorTabId) => {
  const tab = await chrome.tabs.get(anchorTabId);
  return tabController.ensureSessionGroup(sessionId, {
    anchorTabId,
    windowId: tab.windowId,
    // The swLoop branch is gated on shouldPersist (non-incognito), so this is
    // always false on this path; passed through defensively for when the SW
    // loop is allowed to drive incognito (the manager keeps it in-memory only).
    incognito: !!tab.incognito,
  });
};

let _swRuntime = null;
function getSwRuntime() {
  if (_swRuntime) return _swRuntime;
  // Every SW-loop page RPC funnels through here. Wrapped in the retry gate so a
  // "no receiver" failure (a freshly open_tab'd tab whose content script hasn't
  // registered yet, one lost to a SW restart, or the open_tab→switch_focus→
  // perceive race) triggers one ensureContentScript + retry instead of failing
  // the turn outright.
  const sendToTab = createRetryingSendToTab({
    send: (tabId, msg) => chrome.tabs.sendMessage(tabId, msg),
    ensureReady: ensureContentScript,
  });
  _swRuntime = createSwLoopRuntime({
    sendToTab,
    // Return the full { decision, parseInfo } envelope; sw-host unwraps the
    // decision and routes parseInfo to lastParseFailureInfo so fatal parse
    // failures terminate instead of being downgraded to retries.
    callLLM: ({ tabId, tools, phase, history }) =>
      sendToTab(tabId, "CALL_LLM", { tools, phase, history }).then((r) => r ?? null),
    // Raw LLM call routed to the content script's fetchLLM (FETCH_LLM RPC) for the
    // SW loop's validator / recovery / summarization, which build their own
    // prompts. THROWS on error (matching the in-page fetchLLM, which rejects) so
    // callers hit their catch paths identically — notably so compaction preserves
    // the prior memorySummary on LLM failure instead of discarding it.
    fetchLLM: (tabId, messages, options) =>
      sendToTab(tabId, "FETCH_LLM", { messages, options }).then((r) => {
        if (r?.error) throw new Error(r.error);
        return r?.result ?? null;
      }),
    statusPersister: { persist: persistStatusUpdate },
    sessionStore: createSessionStore({ storage: chrome.storage.local }),
    journal: createActionJournal({ storage: chrome.storage.local }),
    makeWorkingMemory: () => {
      const wm = createWorkingMemory();
      return {
        advisory: (tool, args) => getWorkingMemoryAdvisory(wm, tool, args),
        record: (tool, args, result, isError) => recordToolUse(wm, tool, args, result, { isError }),
      };
    },
    // Post-action validation routes to the content script's existing adapter
    // (VALIDATE_ACTION RPC), which owns the applicability gate, validator deps,
    // LLM call, and status emission. Returns the verdict or null.
    runValidator: (tabId, input) =>
      sendToTab(tabId, "VALIDATE_ACTION", input).then((r) => r?.verdict ?? null),
    // Read-only w.r.t. the focused PAGE → no seal rotation, no post-action
    // validation. The page classifier is the one shared with the content-script
    // loop (read-only-tools.js, #55 — fixes take_snapshot being treated as
    // mutating); the tab tools are layered on because they manage tabs/focus and
    // never mutate the focused DOM. Crucially open_tab must NOT invalidate the
    // current page's snapshot (the agent is still mid-flow on it).
    isReadOnly: (tool) => isReadOnlyTool(tool) || tabController.isTabTool(tool),
    runLoop: runReactLoop,
    config: {},
    // Multi-tab: the focus/tab-tool controller (host routing) + the group-form
    // hook (orchestrator, session start). Absent → single-tab behavior.
    tabController,
    ensureSessionGroup,
    // Re-adopt a session whose group survived a worker restart before minting a
    // fresh UUID (see the SW dispatch gate on groupHydrated, which guarantees the
    // group authority is re-populated before the first message resolves).
    recoverSession,
    // gatherResumeInputs reads the persisted pendingAsk chip (per-tab-state's
    // full record — see per-tab-state.js) to know when a resume should wait for
    // a human instead of re-perceiving.
    readTabState,
    // Best-effort panel notice when a wake/orphaned-Allow resume actually starts
    // a re-perceive turn. agent_advisory (not notifySidebarError) is the correct
    // surface — this isn't a failure, it's the agent picking back up.
    onResumeStart: (tabId) =>
      persistStatusUpdate(tabId, { state: "agent_advisory", text: "Resuming the task that was interrupted…" }),
    // A turn that fails outside the loop's own status reporting (durable-history
    // hydration or an unexpected runLoop throw) must not vanish silently — surface
    // it to the panel + transcript the same way the other SW-level failures do.
    onError: (tabId, err) =>
      notifySidebarError(tabId, err?.message || "Service-worker agent failed."),
  });
  return _swRuntime;
}

// Wake-time auto-resume: once the group authority has re-adopted any surviving
// sessions AND the kill-switch flag has settled, offer each anchor to
// handleResume (the per-anchor gating + the resume itself live in the router).
// Runs once per worker life (module-eval time); the SW wakes on almost any tab
// event (see the onUpdated listener above), so this fires promptly after an
// eviction. getSwRuntime() (inside the router) constructs the runtime here if a
// message hasn't already — intended: a wake is exactly when resume needs to run.
Promise.all([groupHydrated, swLoopReady])
  .then(([adopted]) => swLoopRouter.runWakeResumeSweep(adopted))
  .catch(() => {});

// tabId in the payload lets the panel filter out errors meant for another
// tab; null means a generic worker-level error (broadcast to all panels).
function notifySidebarError(tabId, message) {
  const payload = tabId != null
    ? { state: "error", message, tabId }
    : { state: "error", message };
  chrome.runtime.sendMessage({ type: "STATUS_UPDATE", payload }).catch(() => {});
  // Incognito gate (PR #16 review): a relay / injection failure on an
  // incognito tab must NOT create session_state_${tabId} — the rest of
  // the persist paths honor shouldPersist, this one was the hole.
  if (tabId != null && shouldPersist(tabId)) {
    appendSession(tabId, { kind: "error", message }).catch(() => {});
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Runtime diagnostics (Phase 0.3). Local-only; never leaves the device.
  // GET + RESET are mode-scoped (sidebar stamps its ownTabId into msg.tabId
  // so the SW routes to the incognito collector for incognito sidebars and
  // the normal collector for normal sidebars). RECORD routes on the sender
  // tab's own mode — parse failures from an incognito tab land in the
  // incognito collector.
  if (msg?.type === "GET_DIAGNOSTICS") {
    sendResponse({ ok: true, snapshot: pickDiagnostics(msg.tabId).snapshot() });
    return true;
  }
  if (msg?.type === "RESET_DIAGNOSTICS") {
    pickDiagnostics(msg.tabId).reset();
    sendResponse({ ok: true });
    return true;
  }
  if (msg?.type === "RECORD_DIAG") {
    const { kind, reason, provider } = msg.payload || {};
    if (kind === "parse_failure") {
      pickDiagnostics(sender.tab?.id).recordParseFailure(reason);
    } else if (kind === "llm_attempt") {
      // §5.2 — denominator for parse_failure_rate. Fired by the content
      // script after every parseable fetchLLM call (rawText:false),
      // regardless of outcome. See `recordLLMAttempt` in the collector.
      pickDiagnostics(sender.tab?.id).recordLLMAttempt(provider);
    }
    return;
  }

  // Persist per-tab panel events from content scripts into
  // session_state_${tabId} so open panels see them via storage.onChanged,
  // and closed-then-reopened panels can replay history. This runs as a
  // side-effect; the original runtime broadcast still reaches every panel
  // in parallel (panels filter to their own tabId).
  if (sender.tab?.id != null) {
    const fromTabId = sender.tab.id;
    // Incognito gate — same reasoning as persistStatusUpdate (audit #2).
    // persistStatusUpdate does its own shouldPersist check; the ASK_USER
    // branches need theirs inlined here before setPendingAsk.
    if (msg?.type === "STATUS_UPDATE") {
      persistStatusUpdate(fromTabId, msg.payload || {});
    } else if (msg?.type === "ASK_USER" && shouldPersist(fromTabId)) {
      setPendingAsk(fromTabId, {
        id: msg.payload?.id,
        question: msg.payload?.question,
        options: msg.payload?.options ?? null,
        allow_free_text: !!msg.payload?.allow_free_text,
      }).catch(() => {});
    } else if (msg?.type === "ASK_USER_FORM" && shouldPersist(fromTabId)) {
      setPendingAsk(fromTabId, {
        id: msg.payload?.id,
        title: msg.payload?.title || "",
        fields: msg.payload?.fields || [],
        form: true,
      }).catch(() => {});
    }
  }

  // Screenshot request from content script. The content script already checks
  // that this is a read-only call; no permission gate here. Returns raw base64;
  // post-capture downscale is a Phase 4 polish item.
  //
  // Phase 2.4 — when the payload includes an `overlays` list (built on the
  // CS side from the snapshot's refs + getBoundingClientRect), we run the
  // captured bytes through the overlay renderer to burn numbered labels
  // onto the image before returning. OffscreenCanvas + createImageBitmap
  // live in the SW (not the CS) so this stays close to the capture site.
  // Overlay failures degrade to the raw screenshot — losing label pixels
  // is strictly worse than no pixels AND text, and the snapshot text
  // still carries the full uids.
  if (msg.type === "TAKE_SCREENSHOT") {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ error: "No tab to capture" });
      return true;
    }
    const { overlays, viewport, scale, ...captureOpts } = msg.payload || {};
    (async () => {
      const raw = await takeScreenshot(driver, tabId, captureOpts);
      if (raw.error || !Array.isArray(overlays) || overlays.length === 0) {
        sendResponse(raw);
        return;
      }
      // PR #36 F1 — belt-and-suspenders try/catch around the overlay
      // branch. renderOverlayedScreenshot has its own structured
      // {error} return, but layoutOverlays runs BEFORE it (outside
      // its catch) and a malformed viewport / scale from the CS
      // payload would throw here. An uncaught throw leaves the async
      // IIFE's promise rejected with no sendResponse, which strands
      // the CS on its 15s timer instead of falling back to raw bytes.
      try {
        const mime = raw.format === "jpeg" ? "image/jpeg" : "image/png";
        const placements = layoutOverlays({ items: overlays, viewport, scale });
        if (placements.length === 0) {
          sendResponse(raw);
          return;
        }
        // Delegate the Blob/canvas pipeline to the offscreen document.
        // renderOverlayViaOffscreen opens the doc per render and falls
        // back to the SW-side renderer if chrome.offscreen is
        // unavailable, so perception still works — losing labels would
        // degrade the whole include_screenshot path.
        const overlayed = await renderOverlayViaOffscreen(raw.data, mime, placements);
        sendResponse(overlayed.error ? raw : { data: overlayed.data, format: raw.format });
      } catch (err) {
        // Losing labels is a visual regression; returning nothing
        // would break the whole include_screenshot path. Warn so the
        // failure is visible in the console, not silent.
        console.warn("[AutoBrowser] Overlay render failed, returning raw screenshot:", err);
        sendResponse(raw);
      }
    })();
    return true;
  }

  // Pixel-coordinate action request. The content script asks the user and
  // runs decide(); by the time the message lands here, the action has been
  // authorized for `expectedOrigin`. Before dispatching, we re-check the
  // tab's live URL against that origin — a redirect / login handoff between
  // approval and dispatch would otherwise route the action to a different
  // site than the user agreed to.
  if (msg.type === "COMPUTER_ACTION") {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ error: "No tab to dispatch to" });
      return true;
    }
    const { action, params, expectedOrigin } = msg.payload || {};
    (async () => {
      const startedAt = Date.now();
      try {
        const tab = await chrome.tabs.get(tabId);
        const actualUrl = tab?.url;
        if (expectedOrigin && hasDrifted(expectedOrigin, actualUrl)) {
          sendResponse(driftError(expectedOrigin, actualUrl || "about:blank"));
          return;
        }
        const result = await computer(driver, tabId, action, params || {});
        // Record latency only when computer() returned a success payload.
        // computer() normalizes every failure mode (validation, unknown
        // action, driver throws) into `{error: ...}` (src/actions/computer.js
        // outer try/catch), so "no exception propagated" is insufficient —
        // that would fold instant-failure samples into the p50/p95 and lie
        // about how fast the tool actually is. Recording is scoped to the
        // sender tab's mode via pickDiagnostics so incognito timings don't
        // surface in a normal window's Diagnostics card (PR #32 review F2).
        recordToolLatencyIfOk(
          pickDiagnostics(tabId),
          `computer:${action || "unknown"}`,
          Date.now() - startedAt,
          result,
        );
        sendResponse(result);
      } catch (err) {
        sendResponse({ error: `computer: ${err.message}` });
      }
    })();
    return true;
  }

  // Phase 3 — Navigation actions. CS does the permission gate; SW dispatches
  // through the corresponding nav.js function. Page.enable runs on first nav
  // call so the frameNavigated bumpSeal hook actually receives events.
  if (msg.type === "NAV_ACTION") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: "No tab to navigate" }); return true; }
    const { action, params } = msg.payload || {};
    const fn = { navigate, go_back: goBack, go_forward: goForward, reload }[action];
    if (!fn) {
      sendResponse({ error: `NAV_ACTION: unknown action "${action}".` });
      return true;
    }
    (async () => {
      try {
        await ensurePageEnabled(tabId);
        sendResponse(await fn(driver, tabId, params || {}));
      } catch (err) {
        sendResponse({ error: `${action}: ${err.message}` });
      }
    })();
    return true;
  }

  // Always-ask gate is enforced CS-side; SW re-checks origin drift before
  // execution. CS captures location.origin at approval time and ships it as
  // expectedOrigin; if the live tab URL has drifted to a different origin
  // (redirect, login handoff, auto-navigation between approval and dispatch),
  // we abort with the same drift error shape COMPUTER_ACTION uses (PR #8
  // review F3).
  if (msg.type === "EVALUATE_SCRIPT") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: "No tab to evaluate in" }); return true; }
    const { expectedOrigin, ...payload } = msg.payload || {};
    (async () => {
      try {
        if (expectedOrigin) {
          const tab = await chrome.tabs.get(tabId);
          const actualUrl = tab?.url;
          if (hasDrifted(expectedOrigin, actualUrl)) {
            sendResponse(driftError(expectedOrigin, actualUrl || "about:blank"));
            return;
          }
        }
        sendResponse(await evaluateScript(driver, tabId, payload));
      } catch (err) {
        sendResponse({ error: `evaluate_script: ${err.message}` });
      }
    })();
    return true;
  }

  // Wait primitives. Runtime is always available; waitForNetworkIdle handles
  // its own Network.enable lazily.
  if (msg.type === "WAIT_FOR_TEXT") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: "No tab to wait in" }); return true; }
    waitForText(driver, tabId, msg.payload || {}).then(sendResponse);
    return true;
  }
  if (msg.type === "WAIT_FOR_NETWORK_IDLE") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: "No tab to wait in" }); return true; }
    waitForNetworkIdle(driver, tabId, msg.payload || {}).then(sendResponse);
    return true;
  }

  // Observer reads. Lazily creates one observer per tab; cleaned up on
  // chrome.tabs.onRemoved AND on chrome.debugger.onDetach via
  // clearTabCdpState. The getters now throw on attach failure (PR #8 review
  // F6 — previously cached an inert observer + leaked the retain pin), so
  // these handlers wrap in try/catch to surface the failure to the agent.
  if (msg.type === "LIST_NETWORK") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: "No tab to read network from" }); return true; }
    (async () => {
      try {
        const obs = await getNetworkObserver(tabId);
        sendResponse(obs.list(msg.payload || {}));
      } catch (err) {
        sendResponse({ error: `list_network_requests: ${err.message}` });
      }
    })();
    return true;
  }
  if (msg.type === "GET_NETWORK_REQUEST") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: "No tab to read network from" }); return true; }
    (async () => {
      try {
        const obs = await getNetworkObserver(tabId);
        const entry = obs.get(msg.payload?.id);
        sendResponse(entry || { error: `get_network_request: id "${msg.payload?.id}" not found.` });
      } catch (err) {
        sendResponse({ error: `get_network_request: ${err.message}` });
      }
    })();
    return true;
  }
  if (msg.type === "READ_CONSOLE") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: "No tab to read console from" }); return true; }
    (async () => {
      try {
        const obs = await getConsoleObserver(tabId);
        sendResponse(obs.list(msg.payload || {}));
      } catch (err) {
        sendResponse({ error: `read_console_messages: ${err.message}` });
      }
    })();
    return true;
  }

  // Phase 4 — emulation + dialog handling. CS gates and captures
  // location.origin at approval time; SW re-validates URL drift before
  // running the action so a redirect / login handoff between approval and
  // dispatch can't silently apply UA / viewport overrides or accept a
  // dialog on a different origin than the user agreed to (PR #9 review F1).
  // The async/try-catch wrap also closes the silent-rejection gap that an
  // ensurePageEnabled / Page.enable failure would otherwise create
  // (PR #9 review F2).
  if (msg.type === "EMULATION_SET_VIEWPORT") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: "No tab to emulate in" }); return true; }
    const { expectedOrigin, ...payload } = msg.payload || {};
    (async () => {
      try {
        if (await driftCheck(tabId, expectedOrigin, sendResponse)) return;
        sendResponse(await setViewport(driver, tabId, payload));
      } catch (err) {
        sendResponse({ error: `set_viewport: ${err.message}` });
      }
    })();
    return true;
  }
  if (msg.type === "EMULATION_SET_USER_AGENT") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: "No tab to emulate in" }); return true; }
    const { expectedOrigin, ...payload } = msg.payload || {};
    (async () => {
      try {
        if (await driftCheck(tabId, expectedOrigin, sendResponse)) return;
        sendResponse(await setUserAgent(driver, tabId, payload));
      } catch (err) {
        sendResponse({ error: `set_user_agent: ${err.message}` });
      }
    })();
    return true;
  }
  if (msg.type === "EMULATION_CLEAR") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: "No tab to clear" }); return true; }
    const { expectedOrigin } = msg.payload || {};
    (async () => {
      try {
        if (await driftCheck(tabId, expectedOrigin, sendResponse)) return;
        sendResponse(await clearEmulation(driver, tabId));
      } catch (err) {
        sendResponse({ error: `clear_emulation: ${err.message}` });
      }
    })();
    return true;
  }
  if (msg.type === "HANDLE_DIALOG") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ error: "No tab to handle dialog in" }); return true; }
    const { expectedOrigin, ...payload } = msg.payload || {};
    (async () => {
      try {
        if (await driftCheck(tabId, expectedOrigin, sendResponse)) return;
        await ensurePageEnabled(tabId);
        sendResponse(await handleDialog(driver, tabId, payload));
      } catch (err) {
        sendResponse({ error: `handle_dialog: ${err.message}` });
      }
    })();
    return true;
  }

  if (msg.type === "GET_CONFIG") {
    chrome.storage.local.get(
      ["provider", "providers", "maxSteps", "screenshotInPrompt", "systemPrompt"],
      (data) => {
        // Silently drop legacy systemPrompt on read — the chat UI replaced it.
        if (data.systemPrompt !== undefined) {
          chrome.storage.local.remove("systemPrompt");
        }
        sendResponse({
          provider: data.provider || "openrouter",
          providers: normalizeProvidersConfig(data.providers),
          maxSteps: Number.isFinite(data.maxSteps) ? data.maxSteps : 50,
          // Phase 1.2: system-level screenshot hard-block. Default true
          // (agent opt-in via `include_screenshot` still controls per-call).
          // Explicit `false` in storage disables the attach even when the
          // agent opts in — privacy / cost-cap override.
          screenshotInPrompt: data.screenshotInPrompt !== false,
        });
      },
    );
    return true;
  }

  if (msg.type === "SET_CONFIG") {
    // Strip legacy systemPrompt from both the incoming payload AND any value
    // left over in storage (in case the user hasn't opened the sidebar since
    // upgrading). Two steps are necessary: `storage.set` merges; it doesn't
    // delete keys absent from the payload.
    const { systemPrompt: _drop, ...payload } = msg.payload || {};
    chrome.storage.local.remove("systemPrompt", () => {
      chrome.storage.local.set(payload, () => {
        // Config is a global knob — broadcast CONFIG_UPDATED to every tab
        // that has a running content script. Silent-fail on tabs without
        // one (chrome:// pages, etc.) — sendMessage rejects and we drop.
        chrome.tabs.query({}).then((tabs) => {
          for (const t of tabs) {
            if (t?.id == null) continue;
            chrome.tabs.sendMessage(t.id, { type: "CONFIG_UPDATED", payload }).catch(() => {});
          }
        });
        sendResponse({ ok: true });
      });
    });
    return true;
  }

  // CHAT_APPEND: persist a chat-only mode user/agent turn for the tab.
  // Built-in AI chat-only mode runs entirely inside the sidebar (it talks to
  // window.LanguageModel directly), so the content script never sees these
  // turns and we deliberately do NOT relay. clearingTabs / pendingAsk are
  // ReAct-loop concerns — chat-only never triggers either, so this branch
  // is intentionally minimal.
  if (msg.type === "CHAT_APPEND" && Number.isInteger(msg.tabId) && shouldPersist(msg.tabId)) {
    const entry = buildChatAppendEntry(msg.payload);
    if (entry) appendSession(msg.tabId, entry).catch(() => {});
    return;
  }

  // CLEAR_PENDING_ASK: sidebar fires this when the user switches to a
  // provider that can't answer the in-flight ReAct question (e.g. switching
  // to Built-in AI chat-only mid-ask). Two parts:
  //   1. Wipe persisted pendingAsk so a panel reload doesn't resurrect the
  //      orphan question (gated on shouldPersist for incognito).
  //   2. Relay CANCEL_PENDING_ASK to the content script so its in-memory
  //      askUser/askUserForm Promise resolves immediately instead of
  //      hanging up to 120 s on the timeout — without this, `acting`
  //      stays true and a later USER_MESSAGE won't start a fresh ReAct
  //      loop. The relay is unconditional (incognito too): it's a control
  //      signal, not persistence.
  if (msg.type === "CLEAR_PENDING_ASK" && Number.isInteger(msg.tabId)) {
    if (shouldPersist(msg.tabId)) clearPendingAsk(msg.tabId).catch(() => {});
    relayToTab(msg.tabId, { type: "CANCEL_PENDING_ASK", tabId: msg.tabId });
    return;
  }

  // Relay sidebar → content script for the specific tab the panel is bound
  // to. The sidebar stamps `tabId` into the payload on every send; we use
  // it verbatim (never fall back to "active tab" — the panel's tab might
  // not be the active one when the user types into it).
  //
  // Background is the SOLE writer to session_state_${tabId} (PR #15 review
  // F1): the sidebar no longer calls appendSession directly. Because every
  // mutation enqueues on the same per-tab promise chain in this worker,
  // the user-append and pendingAsk-clear on USER_ANSWER can never race with
  // persistStatusUpdate writes for the same tab — the cross-context
  // lost-update window is closed.
  if (msg.type === "USER_MESSAGE" || msg.type === "STOP_AGENT" || msg.type === "USER_ANSWER") {
    const targetTabId = msg.tabId;
    // SW-side open_tab approval prompts (id "approve-<tabId>-<seq>", minted by
    // sw-ask-user.js) are answered by swAskUser directly — they never went
    // through the content script's askUser, so there's nothing to relay to.
    // Routed FIRST, before the generic pending-ask clear below: a stale answer
    // (its id no longer matches the prompt now pending) must be dropped WITHOUT
    // wiping the active prompt's chip or appending to the transcript. For a
    // matched answer, sw-ask-user's finish() owns clearPendingAsk. CS-originated
    // prompts use "ask_N" ids and fall through to the generic handling + relay.
    if (msg.type === "USER_ANSWER" && Number.isInteger(targetTabId) && msg.payload?.id?.startsWith("approve-")) {
      // Resolve the SW-side approval (live resolver / stale / orphaned) and, for
      // an orphaned answer, adopt+resume (Allow) or fail-closed expire (decline)
      // — all in the router (tested); the whole flow is fire-and-forget here.
      swLoopRouter.routeApproveAnswer(targetTabId, msg.payload.id, msg.payload?.answer || "");
      return;
    }
    if (msg.type === "USER_MESSAGE" && Number.isInteger(targetTabId) && shouldPersist(targetTabId)) {
      const text = msg.payload?.displayText || msg.payload?.text || "";
      const attachments = (msg.payload?.attachments || []).map((a) => ({
        kind: a.kind, name: a.name, mime: a.mime,
      }));
      appendSession(targetTabId, { kind: "user", text, attachments }).catch(() => {});
    }
    if (msg.type === "USER_ANSWER" && Number.isInteger(targetTabId) && shouldPersist(targetTabId)) {
      const text = msg.payload?.displayText || "";
      if (text) {
        appendSession(targetTabId, { kind: "user", text }).catch(() => {});
      }
      clearPendingAsk(targetTabId).catch(() => {});
    }
    // NOTE: we deliberately do NOT release clearingTabs here. Releasing on
    // the next USER_MESSAGE / USER_ANSWER would reopen the contamination
    // race — a late tool_result from the cleared turn could land AFTER
    // the new turn starts and append stale events into the fresh session
    // (PR #16 second-pass review). The swallow window only closes on the
    // old turn's terminal event (turn_ended / disengaged / error) or the
    // 5s backstop. The sidebar locks its composer during the same window
    // so the user can't start a new turn until the cleared one quiesces.

    // Route USER_MESSAGE / STOP_AGENT to the SW loop (persisted tabs) or the
    // content-script loop — the SW-vs-CS decision + its swLoopReady/groupHydrated
    // gating live in the router (tested). It returns false for a non-persisted
    // (e.g. incognito) tab, in which case — like USER_ANSWER and everything
    // else — we relay to the content script.
    if ((msg.type === "USER_MESSAGE" || msg.type === "STOP_AGENT") && swLoopRouter.routeUserMessageOrStop(msg, targetTabId)) {
      return;
    }
    relayToTab(targetTabId, msg);
  }

  // Mid-run arming of "Auto-approve this task" from the composer. Pure relay to
  // the panel's tab — no persistence, because the per-turn flag is transient
  // content-script state (the authoritative per-turn value rides on the next
  // USER_MESSAGE payload). Sent only while the agent is busy; before sending,
  // the composer just carries the flag on USER_MESSAGE instead.
  if (msg.type === "SET_TURN_AUTO_APPROVE" && Number.isInteger(msg.tabId)) {
    relayToTab(msg.tabId, msg);
  }

  // Clear conversation — sidebar eraser button. If the agent was mid-turn,
  // we relay STOP_AGENT here (moved from the sidebar's side so the stop
  // and the truncate are owned by the same site — previously the sidebar
  // fire-and-forgot STOP_AGENT before CLEAR_SESSION, and in-flight agent
  // events lost the race with the truncate). The clearingTabs window
  // further guards against any event the content script already queued
  // before STOP_AGENT landed.
  if (msg.type === "CLEAR_SESSION" && Number.isInteger(msg.tabId) && shouldPersist(msg.tabId)) {
    const tabId = msg.tabId;
    if (msg.stopAgent) openClearWindow(tabId);
    // Always relay CLEAR_SESSION (and any STOP_AGENT) to the content script — its
    // in-memory persistentHistory / memorySummary are what the model actually
    // sees. Without this, a clear after a completed turn leaves the model's
    // conversation intact even though the sidebar and storage are wiped.
    if (msg.stopAgent) relayToTab(tabId, { type: "STOP_AGENT", tabId });
    relayToTab(tabId, { type: "CLEAR_SESSION", tabId });
    clearSessionMessages(tabId).catch((err) =>
      console.warn("[AutoBrowser:BG] CLEAR_SESSION failed:", err.message),
    );
    // A one-shot open_tab approval grant must not survive its session — a
    // cleared session must never let a stale grant auto-allow a future turn.
    swAskUser.clearGrants(tabId);
    // SW loop: stop the live loop and drop the durable session (transcript +
    // journal + tab→session mapping) so the cleared conversation can't be
    // resurrected. The router's swLoopReady/groupHydrated gating is what makes
    // onTabRemoved's recoverSession see the re-adopted group and tear it down
    // even when the clear lands before any message this worker life.
    swLoopRouter.routeClearSessionTeardown(tabId, msg.stopAgent);
  }

  // CLAIM_TAB: sidebar sends this on mount and awaits the reply before
  // calling readSession. The reply is gated on bootstrapReady (purgeGhosts
  // + incognito discovery), so by the time the sidebar hydrates, any stale
  // session_state from a previous Chrome session has already been swept.
  // Reply also tells the sidebar whether this tab is incognito, so it can
  // display a "not persisted" banner and skip sending CLEAR_SESSION etc.
  if (msg.type === "CLAIM_TAB" && Number.isInteger(msg.tabId)) {
    const tabId = msg.tabId;
    bootstrapReady.then(() => {
      sendResponse({ ok: true, incognito: incognitoTabs.has(tabId) });
    });
    return true; // keep the sendResponse channel open for the async reply
  }

  // GET_SESSION_GROUP: the sidebar's tab strip asks "is my tab in a group, and
  // who else is in it" — on mount and again whenever it receives a GROUP_UPDATED
  // broadcast (ping-then-pull; see tabGroup's onChange wiring above). Mirrors
  // CLAIM_TAB's request/response shape. Purely an in-memory lookup (no
  // bootstrapReady gate needed) — null when the tab isn't a member of any
  // session, including every incognito tab (tabGroup never persists those, and
  // the SW loop never forms a group for one in the first place).
  if (msg.type === "GET_SESSION_GROUP" && Number.isInteger(msg.tabId)) {
    const sessionId = tabGroup.findGroupByTab(msg.tabId);
    const record = sessionId ? tabGroup.getRecord(sessionId) : undefined;
    sendResponse({
      group: record
        ? {
            sessionId: record.sessionId,
            anchorTabId: record.anchorTabId,
            focusedTabId: record.focusedTabId,
            memberTabIds: record.memberTabIds,
            working: record.working,
            color: record.color,
          }
        : null,
    });
    return; // synchronous reply — no async channel to keep open
  }
});
