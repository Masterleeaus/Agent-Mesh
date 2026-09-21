/**
 * CDP driver — owns chrome.debugger.attach lifecycle per tab.
 *
 * All chrome.debugger.sendCommand calls in the codebase funnel through here so
 * we can:
 *   - attach lazily (Chrome's "being debugged" banner shows once per turn)
 *   - refcount concurrent callers so we don't detach mid-turn
 *   - idle-detach after IDLE_DETACH_MS of inactivity
 *   - honor external detaches (user hits Cancel on the banner, tab closes)
 *
 * Architecture: factory over chrome.debugger (DIP). Production code uses the
 * default singleton `driver` which wraps the real chrome.debugger; tests build
 * their own via createDriver({ debuggerApi: fake }) with a recorded fake.
 */

const PROTOCOL = "1.3";
const DEFAULT_IDLE_DETACH_MS = 5000;

/**
 * @param {object} opts
 * @param {object} opts.debuggerApi   Must expose attach/sendCommand/detach and
 *                                    optionally onDetach.addListener.
 * @param {number} [opts.idleDetachMs] Milliseconds of inactivity before auto-detach.
 * @returns {{ send, detach, detachAll }}
 */
export function createDriver({ debuggerApi, idleDetachMs = DEFAULT_IDLE_DETACH_MS } = {}) {
  if (!debuggerApi) {
    throw new Error("createDriver: debuggerApi is required (pass chrome.debugger or a fake)");
  }

  // tabId -> { refcount, pins, idleTimer }
  // refcount: in-flight send() count (incremented in ensureAttached, decremented
  //   in scheduleIdleDetach).
  // pins:     long-lived holds taken via retain() — observers, waits, the
  //   frameNavigated bumpSeal hook. Idle-detach only fires when BOTH refcount
  //   AND pins are zero. (PR #8 review F1.)
  const attached = new Map();
  // tabId -> in-flight attach Promise — coalesces concurrent first-callers
  const attaching = new Map();

  function clearIdleTimer(state) {
    if (state.idleTimer) {
      clearTimeout(state.idleTimer);
      state.idleTimer = null;
    }
  }

  // Bare attach + state seed. Does NOT touch refcount / pins — callers do that
  // after this resolves so the two callers (ensureAttached, retain) can apply
  // their own counters.
  async function ensureAttachedRaw(tabId) {
    if (attached.has(tabId)) return;
    let pending = attaching.get(tabId);
    if (!pending) {
      pending = (async () => {
        await debuggerApi.attach({ tabId }, PROTOCOL);
        attached.set(tabId, { refcount: 0, pins: 0, idleTimer: null });
      })();
      attaching.set(tabId, pending);
    }
    try {
      await pending;
    } finally {
      attaching.delete(tabId);
    }
  }

  async function ensureAttached(tabId) {
    await ensureAttachedRaw(tabId);
    const state = attached.get(tabId);
    state.refcount++;
    clearIdleTimer(state);
  }

  function scheduleIdleDetach(tabId) {
    const state = attached.get(tabId);
    if (!state) return;
    state.refcount--;
    if (state.refcount > 0) return;
    if (state.pins > 0) return; // long-lived hold — keep alive
    clearIdleTimer(state);
    state.idleTimer = setTimeout(() => {
      detach(tabId).catch(() => {});
    }, idleDetachMs);
  }

  async function send(tabId, method, params) {
    await ensureAttached(tabId);
    try {
      return await debuggerApi.sendCommand({ tabId }, method, params);
    } finally {
      scheduleIdleDetach(tabId);
    }
  }

  async function detach(tabId) {
    const state = attached.get(tabId);
    if (!state) return;
    clearIdleTimer(state);
    attached.delete(tabId);
    await debuggerApi.detach({ tabId });
  }

  async function detachAll() {
    await Promise.all([...attached.keys()].map((t) => detach(t)));
  }

  // External detach — e.g. user clicks Cancel on the debugger banner or the
  // tab closes. Clear state so we don't double-detach.
  if (debuggerApi.onDetach?.addListener) {
    debuggerApi.onDetach.addListener((source) => {
      const state = attached.get(source.tabId);
      if (!state) return;
      clearIdleTimer(state);
      attached.delete(source.tabId);
    });
  }

  // CDP event fan-out. method -> Set<handler>. Caller registers via on()
  // and gets an off() back to unsubscribe. A single chrome.debugger.onEvent
  // listener (registered once at construction) routes each event to the
  // matching method's handlers. Throwing handlers are isolated so one bad
  // observer never silences siblings.
  const eventHandlers = new Map(); // method -> Set<handler>
  function on(method, handler) {
    let set = eventHandlers.get(method);
    if (!set) {
      set = new Set();
      eventHandlers.set(method, set);
    }
    set.add(handler);
    return function off() {
      set.delete(handler);
    };
  }
  if (debuggerApi.onEvent?.addListener) {
    debuggerApi.onEvent.addListener((source, method, params) => {
      const set = eventHandlers.get(method);
      if (!set) return;
      for (const handler of set) {
        try {
          handler(params, source);
        } catch (err) {
          // Defensive: log and continue. Phase 3 observers are advisory; we
          // never want a buggy network/console observer to take down the
          // whole event pipeline.
          console.warn(`[AutoBrowser:driver] handler for ${method} threw:`, err);
        }
      }
    });
  }

  // Per-tab event subscription. Filters at the source so a network/console
  // observer for tab A never sees tab B's events. Use this in preference to
  // raw on() for any handler that's logically scoped to a single tab —
  // observers, waits, frame-navigated hooks. (PR #8 review F2: cross-tab
  // event leak.)
  function onForTab(tabId, method, handler) {
    return on(method, (params, source) => {
      if (source?.tabId !== tabId) return;
      handler(params, source);
    });
  }

  // Pin the chrome.debugger attach for this tab past the send-driven idle
  // window. Long-lived event consumers (observers, waitForNetworkIdle,
  // background.js's frameNavigated hook) call retain() so onEvent keeps
  // flowing even when no send() has happened recently. Returns an idempotent
  // release(); the Nth release with refcount=0 schedules the idle detach.
  // (PR #8 review F1: observers go silent after idle window.)
  async function retain(tabId) {
    await ensureAttachedRaw(tabId);
    const state = attached.get(tabId);
    state.pins++;
    clearIdleTimer(state);
    let released = false;
    return function release() {
      if (released) return;
      released = true;
      // detach() may have been called externally; the state is gone.
      const current = attached.get(tabId);
      if (!current) return;
      if (current.pins > 0) current.pins--;
      if (current.refcount > 0 || current.pins > 0) return;
      clearIdleTimer(current);
      current.idleTimer = setTimeout(() => {
        detach(tabId).catch(() => {});
      }, idleDetachMs);
    };
  }

  return { send, detach, detachAll, on, onForTab, retain };
}

// Default singleton wired to the real chrome.debugger. Production code imports
// `driver`; tests build their own via createDriver({ debuggerApi: fake }).
export const driver = typeof chrome !== "undefined" && chrome.debugger
  ? createDriver({ debuggerApi: chrome.debugger })
  : null;
