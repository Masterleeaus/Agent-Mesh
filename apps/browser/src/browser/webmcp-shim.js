/**
 * WebMCP shim — spec-compliant imperative registry + reader.
 *
 * Implements the current WebMCP IDL, which moved the getter from the
 * Navigator interface to the Document interface (tools are per-Document):
 *
 *   partial interface Document {
 *     [SecureContext, SameObject] readonly attribute ModelContext modelContext;
 *   };
 *   [Exposed=Window, SecureContext]
 *   interface ModelContext : EventTarget {
 *     Promise<undefined> registerTool(ModelContextTool tool,
 *                          optional ModelContextRegisterToolOptions options = {});
 *     Promise<sequence<RegisteredTool>> getTools(
 *                          optional ModelContextGetToolOptions options = {});
 *     attribute EventHandler ontoolchange;
 *   };
 *
 * Chrome deprecated `navigator.modelContext` in 150 and removed it in 152,
 * but not every page has migrated. So this shim installs the SAME
 * ModelContext on BOTH `document` (primary, canonical) and `navigator`
 * (compat) — a page using either location, or the recommended
 * `document.modelContext || navigator.modelContext` fallback, finds our
 * runtime. It transparently wraps the native implementation at either
 * location — Chrome ships one from 149 (origin trial), where
 * `document.modelContext` is a real `ModelContext` exposing
 * `registerTool` / `getTools` / `executeTool` / `ontoolchange`.
 *
 * Deliberate deviations from a pure WebIDL binding, and why:
 *   - `registerTool` validates and throws SYNCHRONOUSLY on developer
 *     errors (bad name, duplicate, non-serializable schema) rather than
 *     returning a rejected promise. `await registerTool()` inside a
 *     try/catch — the pattern every current demo uses — catches both,
 *     and the declarative synthesizer relies on the synchronous throw.
 *     The SUCCESS path returns `Promise<undefined>` as the IDL requires.
 *   - `execute(input, client)` is still passed a 2nd `ModelContextClient`
 *     argument. The client was dropped from the current IDL (`execute`
 *     is single-arg now); we keep passing it as a harmless superset so
 *     tools written against older drafts keep working.
 *   - `unregisterTool(name)` is non-spec (the spec unregisters via
 *     `AbortSignal`) but kept for Chromium-shim parity and as the
 *     declarative synthesizer's teardown path.
 *
 * This is the source of truth for shim behavior. `src/page-helper.js`
 * mirrors the install path inline (MAIN-world content scripts at
 * document_start can't ES-import). If you change one, change the other.
 */

// Name constraint from the spec: 1..128 chars of ASCII alphanum + `_`, `-`, `.`.
const TOOL_NAME_RE = /^[A-Za-z0-9._-]{1,128}$/;

// Marker so we can detect our own shim on re-entry and avoid double-wrapping
// (polyfill race, SPA re-navigation in the same Window, etc.).
const SHIM_MARKER = "__autobrowser_webmcp_shim_v1";

/**
 * Install a spec-compliant WebMCP shim on `host` (normally `document`).
 *
 * @param {object} host                 Primary host object (document in
 *   production; a plain object in unit tests). Gets a `modelContext`.
 * @param {object} [opts]
 * @param {object[]} [opts.alsoInstallOn] Additional hosts to receive the
 *   SAME ModelContext object (production: `[navigator]` for back-compat).
 * @param {EventTarget} [opts.eventTarget] Where to dispatch toolactivated
 *   events (default: `globalThis` if present, else a new EventTarget).
 * @param {Document}   [opts.document]     Document on which to dispatch
 *   `webmcp:context-invalidated` for the extension bridge. Default:
 *   `globalThis.document` if present.
 * @param {Window}     [opts.window]       Window recorded on RegisteredTool
 *   rows from `getTools()`. Default: `globalThis.window` || `globalThis`.
 * @param {string}     [opts.origin]       Origin recorded on RegisteredTool
 *   rows. Default: `globalThis.location.origin`.
 * @param {(reason, toolNames) => void} [opts.onContextChange]
 *   Test hook fired with the cumulative change reason and the current
 *   tool-name list. Debounced to microtask.
 * @returns {{
 *   listTools: () => Array,
 *   execute:   (name: string, input: object, client?: object) => Promise<any>,
 *   registerTool: (tool, options?) => boolean,
 *   unregisterTool: (name) => void,
 *   getTools: () => Promise<Array>,
 *   modelContext: object,
 *   getCapturedTool: (name) => object | undefined,
 *   hasTool: (name) => boolean,
 *   isShim: true,
 * }}
 */
export function installWebMCPShim(host, opts = {}) {
  const tracked = new Map(); // name → full tool object
  const abortCleanup = new Map(); // name → () => void
  const schemaByTool = new WeakMap(); // tool object → serialized inputSchema
  const eventTarget = opts.eventTarget || (typeof globalThis !== "undefined" ? globalThis : null);
  const targetDoc = opts.document || (typeof globalThis !== "undefined" ? globalThis.document : null);
  const onContextChange = typeof opts.onContextChange === "function" ? opts.onContextChange : null;
  const toolWindow = opts.window
    || (typeof globalThis !== "undefined" ? (globalThis.window || globalThis) : null);
  const toolOrigin = opts.origin
    || (typeof globalThis !== "undefined" && globalThis.location && globalThis.location.origin) || "";

  // Install targets: `host` is primary (document in production);
  // `alsoInstallOn` mirrors the SAME object onto navigator for the
  // migration window. Both surfaces share one registry and one handle.
  const extraTargets = Array.isArray(opts.alsoInstallOn) ? opts.alsoInstallOn.filter(Boolean) : [];
  const targets = [host, ...extraTargets].filter(Boolean);

  // Re-entry — somebody already installed our shim on one of these
  // hosts. Hand back the existing registry so we don't fragment state.
  for (const t of targets) {
    const mc = t && t.modelContext;
    if (mc && mc[SHIM_MARKER] === true) return mc[SHIM_MARKER + "_handle"];
  }

  // Late-bound so `scheduleContextChange` (defined before the object
  // exists) can dispatch the spec `toolchange` event on it.
  let modelContextRef = null;

  // Debounce aggregate change notifications to a single microtask so a
  // state transition that unregisters N and registers M doesn't fire
  // N+M + 1 boundary events. We still fire toolactivated/toolcanceled
  // per-change (demo precedent) for page-side observers.
  let pendingChange = null; // { reason }
  function scheduleContextChange(reason) {
    if (pendingChange) return;
    pendingChange = { reason };
    queueMicrotaskSafe(() => {
      const { reason: r } = pendingChange;
      pendingChange = null;
      const names = Array.from(tracked.keys());
      if (onContextChange) {
        try { onContextChange(r, names); } catch { /* ignore */ }
      }
      // Spec event: `toolchange` fires on EVERY exposed document's
      // ModelContext, not just the one that changed. Since getTools() now
      // aggregates same-origin frames, a registration here changes what a
      // sibling's getTools() returns — notifying only ourselves would leave
      // those contexts caching a stale set.
      for (const ctx of reachableContexts()) {
        if (typeof ctx.dispatchEvent !== "function") continue;
        try { ctx.dispatchEvent(new Event("toolchange")); } catch { /* ignore */ }
      }
      // Extension bridge signal (non-spec): drives the agent's re-assess
      // wakeup. Kept separate from `toolchange` so page listeners and the
      // content script don't cross wires.
      if (targetDoc && typeof targetDoc.dispatchEvent === "function") {
        try {
          targetDoc.dispatchEvent(new CustomEvent("webmcp:context-invalidated", {
            detail: {
              reason: "tools_changed",
              boundary: true,
              reminder: "WebMCP tool set changed — reassess which tools now cover the user's intent.",
              change: r,
              tools: names,
            },
          }));
        } catch { /* ignore */ }
      }
    });
  }

  function emitToolEvent(type, toolName) {
    if (!eventTarget || typeof eventTarget.dispatchEvent !== "function") return;
    try {
      eventTarget.dispatchEvent(new CustomEvent(type, { detail: { toolName } }));
    } catch { /* ignore */ }
  }

  // ── Spec-required validation ────────────────────────────────────────
  function validateTool(tool) {
    if (tool == null || typeof tool !== "object") {
      throw new TypeError("registerTool: tool must be an object");
    }
    if (typeof tool.name !== "string" || tool.name.length === 0) {
      throw domException("InvalidStateError", "registerTool: tool.name is required and must be a non-empty string");
    }
    if (tool.name.length > 128) {
      throw domException("InvalidStateError", `registerTool: tool.name is too long (${tool.name.length} > 128)`);
    }
    if (!TOOL_NAME_RE.test(tool.name)) {
      throw domException("InvalidStateError", `registerTool: tool.name "${tool.name}" contains invalid characters (allowed: ASCII alphanum plus _, -, .)`);
    }
    if (typeof tool.description !== "string" || tool.description.trim().length === 0) {
      throw domException("InvalidStateError", "registerTool: tool.description is required and must be a non-empty string");
    }
    if (typeof tool.execute !== "function") {
      throw domException("InvalidStateError", 'registerTool: tool.execute is required and must be a function');
    }
  }

  // Spec: "set stringified input schema to the result of serializing a
  // JavaScript value to a JSON string, given tool's inputSchema" — AT
  // REGISTRATION. Serializing lazily in the reader would let a page mutate its
  // schema object after registering and silently change what agents see.
  // `JSON.stringify` returns undefined (without throwing) for a value whose
  // `toJSON()` yields undefined; the spec makes that a TypeError rather than a
  // silently-absent field.
  function serializeInputSchema(tool) {
    // Only an ABSENT member is omitted. IDL declares `object inputSchema` —
    // non-nullable — so `null` is a type error, not a way to say "no schema",
    // and a primitive is worse than an error if accepted: we would hand the
    // agent a serialized string where a JSON Schema belongs, and it would
    // dutifully try to conform to it.
    if (tool.inputSchema === undefined) return undefined;
    const value = tool.inputSchema;
    if (value === null || (typeof value !== "object" && typeof value !== "function")) {
      throw new TypeError(`registerTool: tool.inputSchema must be an object (got ${value === null ? "null" : typeof value})`);
    }
    let serialized;
    try {
      serialized = JSON.stringify(value);
    } catch (e) {
      if (e instanceof TypeError) throw e;
      throw new TypeError(`registerTool: tool.inputSchema is not JSON-serializable (${e.message})`);
    }
    if (serialized === undefined) {
      throw new TypeError("registerTool: tool.inputSchema did not serialize to a JSON string (toJSON returned undefined)");
    }
    return serialized;
  }

  // ── Synchronous core registration — throws on error. Returns true if
  //    the tool was tracked, false if skipped (already-aborted signal). ─
  function registerToolSync(tool, options) {
    validateTool(tool);
    // Serialize before the duplicate check so schema errors are reported ahead
    // of collisions, matching the previous ordering.
    const schemaJSON = serializeInputSchema(tool);

    if (tracked.has(tool.name)) {
      throw domException("InvalidStateError", `registerTool: a tool with name "${tool.name}" is already registered. Abort the existing registration before re-registering.`);
    }

    const signal = options && options.signal;
    // If the signal is already aborted, the spec says "the tool is not
    // registered" and the UA may warn. No throw.
    if (signal && signal.aborted) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(`[WebMCP] registerTool("${tool.name}"): signal already aborted; skipping registration.`);
      }
      return false;
    }

    tracked.set(tool.name, tool);
    // Keyed by the tool object, not the name, so the identity-guarded rollback
    // stays correct and no explicit cleanup is needed.
    schemaByTool.set(tool, schemaJSON);

    if (signal && typeof signal.addEventListener === "function") {
      const onAbort = () => {
        // Run the spec's "unregister a tool" steps atomically.
        if (tracked.delete(tool.name)) {
          emitToolEvent("toolcanceled", tool.name);
          scheduleContextChange(`aborted:${tool.name}`);
        }
        const cleanup = abortCleanup.get(tool.name);
        if (cleanup) cleanup();
        abortCleanup.delete(tool.name);
      };
      signal.addEventListener("abort", onAbort, { once: true });
      abortCleanup.set(tool.name, () => {
        try { signal.removeEventListener("abort", onAbort); } catch { /* ignore */ }
      });
    }

    emitToolEvent("toolactivated", tool.name);
    scheduleContextChange(`registered:${tool.name}`);
    return true;
  }

  // Undo a capture after the native implementation rejected.
  //
  // Guarded on IDENTITY, not name: a native registration can still be pending
  // when its signal aborts and the same name is re-registered with a different
  // tool. Deleting by name alone would evict that second, live registration.
  //
  // Emits the removal notifications because the async path may already have
  // published the tool — `registerToolSync` schedules a context change on a
  // microtask, so by the time a native promise rejects, consumers can have seen
  // and cached the tool. Silently dropping it would leave them with a tool that
  // no longer exists and no event saying so. On the synchronous-throw path the
  // scheduled change has not fired yet and simply coalesces.
  function rollbackCapture(name, tool) {
    if (tracked.get(name) !== tool) return;
    tracked.delete(name);
    const cleanup = abortCleanup.get(name);
    if (cleanup) cleanup();
    abortCleanup.delete(name);
    emitToolEvent("toolcanceled", name);
    scheduleContextChange(`rollback:${name}`);
  }

  // ── unregisterTool: non-spec parity with the Chromium shim. Returns
  //     undefined synchronously. A no-op for unknown names.
  function unregisterToolSync(name) {
    if (typeof name !== "string" || !tracked.has(name)) return undefined;
    tracked.delete(name);
    const cleanup = abortCleanup.get(name);
    if (cleanup) cleanup();
    abortCleanup.delete(name);
    emitToolEvent("toolcanceled", name);
    scheduleContextChange(`unregistered:${name}`);
    return undefined;
  }

  // ── listTools / getTools / execute ────────────────────────────────
  function listTools() {
    return Array.from(tracked.values()).map(projectTool);
  }

  // Rows for THIS document only, no traversal. Frames read each other through
  // this rather than through getTools(), which would recurse mutually forever.
  function getOwnRegisteredTools() {
    return Array.from(tracked.values()).map(toRegisteredTool);
  }

  // Spec reader: `Promise<sequence<RegisteredTool>>`. RegisteredTool carries
  // `window` + `origin` and a SERIALIZED `inputSchema` (DOMString), distinct
  // from the object form on ModelContextTool.
  //
  // Walks the traversable's inclusive descendant navigables (getTools step 9.2)
  // and collects every same-origin document's rows. Exposure step 1 is "If tool
  // owner origin is same origin with accessing origin, then return true" — so
  // same-origin tools are exposed WITHOUT `exposedTo`; that list only widens
  // access to cross-origin callers. Cross-origin documents are therefore the
  // only ones skipped here, pending `exposedTo` / `fromOrigins` support.
  function getTools() {
    return Promise.resolve(collectSameOriginRows().sort(byToolName));
  }

  // Bounded BFS over the frame tree from the traversal root. Shared by the
  // reader and the change notifier so both get the same cycle protection and
  // the same cross-origin behaviour.
  function* sameOriginWindows() {
    const root = traversalRoot();
    if (!root) return;
    const seen = new Set();
    const queue = [root];
    while (queue.length) {
      const win = queue.shift();
      if (!win || seen.has(win)) continue;
      seen.add(win);
      // Enumerate children FIRST, in their own try: `frames` stays readable
      // across origins, so a cross-origin frame must not hide same-origin
      // descendants nested beneath it.
      try {
        const kids = win.frames;
        if (kids && typeof kids.length === "number") {
          for (let i = 0; i < kids.length; i++) queue.push(kids[i]);
        }
      } catch { /* subtree unreachable */ }
      yield win;
    }
  }

  // Every reachable same-origin shim ModelContext, including our own.
  // Traversal order, NOT registration-site-first: the spec queues toolchange
  // per navigable walking the traversable, and its example states the parent
  // always fires before the child. Seeding with our own context inverted that
  // whenever a child frame was the one registering.
  function reachableContexts() {
    const contexts = new Set();
    for (const win of sameOriginWindows()) {
      try {
        const mc = win.document && win.document.modelContext;
        if (mc && mc[SHIM_MARKER] === true) contexts.add(mc);
      } catch { /* cross-origin */ }
    }
    // Fallback only — a non-Document host (unit tests install on a plain
    // object) is invisible to the walk. No-op when already discovered above.
    if (modelContextRef) contexts.add(modelContextRef);
    return contexts;
  }

  function collectSameOriginRows() {
    // Seed with our own rows: `host` is not necessarily a Document (unit tests
    // install on a plain object), so the walk cannot be relied on to
    // rediscover us.
    const rows = getOwnRegisteredTools();
    for (const win of sameOriginWindows()) {
      try {
        const mc = win.document && win.document.modelContext;
        const h = mc && mc[SHIM_MARKER + "_handle"];
        // `h !== handle` — our own rows are already seeded above.
        if (h && h !== handle && typeof h.getOwnRegisteredTools === "function") {
          rows.push(...h.getOwnRegisteredTools());
        }
      } catch { /* cross-origin: needs exposedTo / fromOrigins */ }
    }
    return rows;
  }

  // Highest same-origin-reachable ancestor. The spec roots this at the
  // traversable navigable, but a cross-origin ancestor is opaque to us, so this
  // is as far up as conformance can reach.
  function traversalRoot() {
    let win = toolWindow;
    if (!win) return null;
    try {
      while (win.parent && win.parent !== win) {
        void win.parent.document; // throws when the ancestor is cross-origin
        win = win.parent;
      }
    } catch { /* stop at the highest reachable ancestor */ }
    return win;
  }
  function toRegisteredTool(t) {
    const out = { name: t.name, description: t.description, window: toolWindow, origin: toolOrigin };
    if (typeof t.title === "string" && t.title) out.title = t.title;
    // The string captured at registration — NOT a fresh serialization, so
    // post-registration mutation of the page's schema object can't leak through.
    const schemaJSON = schemaByTool.get(t);
    if (schemaJSON !== undefined) out.inputSchema = schemaJSON;
    if (t.annotations && typeof t.annotations === "object") {
      out.annotations = {};
      if (t.annotations.readOnlyHint === true) out.annotations.readOnlyHint = true;
      if (t.annotations.untrustedContentHint === true) out.annotations.untrustedContentHint = true;
    }
    return out;
  }

  function getCapturedTool(name) {
    return tracked.get(name);
  }

  // Consumers (the page-helper bridge) need to distinguish "not our
  // tool → maybe fall back to a legacy reader API" from "our tool
  // whose execute() just threw → surface the error". Using the presence
  // of a captured object is the cleanest gate.
  function hasTool(name) {
    return typeof name === "string" && tracked.has(name);
  }

  // ModelContextClient — dropped from the current IDL, kept as a harmless
  // superset. `requestUserInteraction(callback)` returns the callback's
  // resolved value after a microtask so any paint the page queued before
  // the callback has a chance to land.
  const defaultClient = {
    async requestUserInteraction(callback) {
      await Promise.resolve();
      if (typeof callback === "function") {
        return callback();
      }
      return undefined;
    },
  };

  async function execute(name, input, client) {
    const tool = tracked.get(name);
    if (!tool || typeof tool.execute !== "function") {
      throw new Error(`Tool "${name}" not found`);
    }
    return tool.execute(input || {}, client || defaultClient);
  }

  // ── Detect a native/polyfilled implementation on any target ─────────
  let origRegister = null;
  let origUnregister = null;
  let origExecuteTool = null;
  for (const t of targets) {
    const mc = t && t.modelContext;
    if (mc && typeof mc.registerTool === "function" && mc[SHIM_MARKER] !== true) {
      origRegister = mc.registerTool.bind(mc);
      origUnregister = typeof mc.unregisterTool === "function" ? mc.unregisterTool.bind(mc) : null;
      origExecuteTool = typeof mc.executeTool === "function" ? mc.executeTool.bind(mc) : null;
      break;
    }
  }

  // ── Public, spec-shaped surface ─────────────────────────────────────
  // registerTool: throws SYNCHRONOUSLY on validation/duplicate (so the
  // declarative synthesizer's try/catch works and `await` still catches),
  // returns Promise<undefined> on success. When wrapping native, forwards
  // the ORIGINAL args and rolls our capture back if native rejects.
  function registerTool(tool, options) {
    // WebIDL: a promise-returning operation NEVER throws synchronously — every
    // failure becomes a rejected promise, so `registerTool(bad).catch(...)` has
    // something to attach to. The throwing core stays available internally via
    // the handle for the declarative synthesizer, which wants it.
    let didRegister;
    try {
      didRegister = registerToolSync(tool, options);
    } catch (e) {
      return Promise.reject(e);
    }

    // Already-aborted signal: spec says "return a promise rejected with
    // signal's abort reason". Nothing was registered locally, so it must not be
    // forwarded to native either — that would leave the two registries
    // disagreeing about whether the tool exists.
    if (!didRegister) {
      const signal = options && options.signal;
      return Promise.reject(signal ? signal.reason : domException("AbortError", "registerTool: aborted"));
    }

    if (origRegister) {
      let r;
      try {
        r = origRegister(tool, options);
      } catch (e) {
        // Native rejected synchronously (stricter validation) — roll back.
        rollbackCapture(tool.name, tool);
        return Promise.reject(e);
      }
      return Promise.resolve(r).then(() => undefined, (e) => {
        rollbackCapture(tool.name, tool);
        throw e;
      });
    }
    return Promise.resolve(undefined);
  }

  function unregisterTool(name) {
    unregisterToolSync(name);
    if (origUnregister) return origUnregister(name);
    return undefined;
  }

  // Chrome's native ModelContext ships `executeTool` alongside registerTool /
  // getTools / ontoolchange. We replace the whole object, so omitting it would
  // make an existing native method vanish the moment the extension loads and
  // break any in-page caller.
  //
  // Ownership first, then delegate: declaratively synthesized `<form toolname>`
  // tools live only in `tracked` and are never forwarded to native, so blind
  // delegation would fail to find them.
  function executeTool(name, input) {
    if (tracked.has(name)) return execute(name, input);
    if (origExecuteTool) return origExecuteTool(name, input);
    return Promise.reject(new Error(`Tool "${name}" not found`));
  }

  // ── Build the ModelContext (an EventTarget per the current IDL) ──────
  const modelContext = (typeof EventTarget === "function") ? new EventTarget() : {};
  modelContextRef = modelContext;
  defineMethod(modelContext, "registerTool", registerTool);
  defineMethod(modelContext, "unregisterTool", unregisterTool);
  defineMethod(modelContext, "getTools", getTools);
  defineMethod(modelContext, "executeTool", executeTool);

  // ontoolchange EventHandler attribute — mirror addEventListener/remove.
  let ontoolchange = null;
  try {
    Object.defineProperty(modelContext, "ontoolchange", {
      get() { return ontoolchange; },
      set(fn) {
        if (ontoolchange) {
          try { modelContext.removeEventListener("toolchange", ontoolchange); } catch { /* ignore */ }
        }
        ontoolchange = typeof fn === "function" ? fn : null;
        if (ontoolchange) {
          try { modelContext.addEventListener("toolchange", ontoolchange); } catch { /* ignore */ }
        }
      },
      enumerable: true,
      configurable: true,
    });
  } catch { /* ignore — ontoolchange is best-effort on exotic hosts */ }

  // Mark and handle — re-entry detection on future installs. The handle
  // exposes the SYNCHRONOUS register/unregister for internal callers
  // (declarative synthesizer, eval-loop) that want throw-on-error.
  const handle = {
    listTools, execute, registerTool: registerToolSync, unregisterTool: unregisterToolSync,
    getTools, getOwnRegisteredTools, modelContext, getCapturedTool, hasTool, isShim: true,
  };
  try {
    Object.defineProperty(modelContext, SHIM_MARKER, { value: true, configurable: false });
    Object.defineProperty(modelContext, SHIM_MARKER + "_handle", { value: handle, configurable: false, enumerable: false });
  } catch { /* ignore — marker is best-effort */ }

  // ── Install the SAME modelContext on every target ───────────────────
  // Full replace via defineProperty covers a writable property AND a
  // read-only WebIDL [SameObject] property whose descriptor is still
  // configurable. If the descriptor is non-configurable we fall back to
  // direct assignment (silent no-op on non-writable) and log.
  for (const t of targets) {
    if (!t) continue;
    try {
      Object.defineProperty(t, "modelContext", {
        value: modelContext,
        writable: true,
        configurable: true,
      });
    } catch {
      try {
        t.modelContext = modelContext;
      } catch (err) {
        if (typeof console !== "undefined" && console.error) {
          console.error("[WebMCP] shim install failed — modelContext is non-configurable:", err);
        }
      }
    }
  }

  return handle;
}

/**
 * Project a tool object to the agent-facing shape. Includes spec fields
 * that earlier versions dropped (`title`, `annotations`) so the agent
 * can prefer `title` in prompts, skip the permission gate on
 * `readOnlyHint` tools, and treat `untrustedContentHint` outputs as
 * non-authoritative.
 */
export function projectTool(t) {
  const out = { name: t.name, description: t.description };
  if (typeof t.title === "string" && t.title) out.title = t.title;
  if (t.inputSchema !== undefined) out.inputSchema = t.inputSchema;
  if (t.annotations && typeof t.annotations === "object") {
    out.annotations = {};
    if (t.annotations.readOnlyHint === true) out.annotations.readOnlyHint = true;
    if (t.annotations.untrustedContentHint === true) out.annotations.untrustedContentHint = true;
  }
  return out;
}

// ── internals ────────────────────────────────────────────────────────

// Spec getTools() step: "Sort in ascending order tools, with a being less than
// b if a["name"] is code unit less than b["name"]." Plain `<` on strings IS a
// code-unit comparison — `localeCompare` is not, it applies locale collation
// and would order e.g. "a" before "B" on some locales.
function byToolName(a, b) {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

function defineMethod(obj, name, fn) {
  try {
    Object.defineProperty(obj, name, { value: fn, writable: false, enumerable: true, configurable: true });
  } catch {
    try { obj[name] = fn; } catch { /* ignore */ }
  }
}

function domException(name, message) {
  if (typeof DOMException === "function") {
    try { return new DOMException(message, name); } catch { /* fall through */ }
  }
  const err = new Error(message);
  err.name = name;
  return err;
}

function queueMicrotaskSafe(fn) {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(fn);
    return;
  }
  Promise.resolve().then(fn).catch(() => { /* ignore */ });
}