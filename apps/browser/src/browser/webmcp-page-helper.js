/**
 * Page helper — runs in the page's MAIN world at document_start, in every
 * frame. Install a spec-compliant WebMCP shim before any page script runs,
 * synthesize declarative tools from `<form toolname>` controls, and bridge
 * discover + execute to the ISOLATED-world content script via CustomEvent.
 *
 * This file inlines the same algorithms that live (and are tested) in
 * `src/webmcp-shim.js` and `src/webmcp-declarative.js`. Inlining is
 * required because MAIN-world content scripts at `document_start` can't
 * ES-import from the extension without losing the timing window we need.
 * If you change behavior, change all three files.
 *
 * The shim tracks the current WebMCP IDL: the getter moved from Navigator
 * to Document (`document.modelContext`), `ModelContext` is an `EventTarget`
 * that fires `toolchange` (with an `ontoolchange` handler), and there's an
 * async `getTools()` reader; `registerTool` returns `Promise<undefined>`
 * (validation still throws synchronously). It installs the same object on
 * `document` (canonical) and `navigator` (compat) and transparently wraps
 * a native implementation at either location when present. Kept in lockstep
 * with the source-of-truth `src/webmcp-shim.js` and its test suite.
 */

(() => {
  // Skip insecure contexts. Spec: `[SecureContext]`.
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return;
  }

  const TOOL_NAME_RE = /^[A-Za-z0-9._-]{1,128}$/;
  const SHIM_MARKER = "__autobrowser_webmcp_shim_v1";
  const TOOLFORM_ATTR = "toolname";
  const TOOLDESC_ATTR = "tooldescription";
  const TOOLPARAMDESC_ATTR = "toolparamdescription";
  const TOOLAUTOSUBMIT_ATTR = "toolautosubmit";

  // Guard: do nothing if the shim is already installed on either surface
  // (polyfill race, BFCache restore, duplicate injection). The current
  // spec lives at document.modelContext; we also mirror onto navigator
  // for the migration window, so check both.
  const alreadyInstalled =
    (document.modelContext && document.modelContext[SHIM_MARKER] === true && document.modelContext) ||
    (navigator.modelContext && navigator.modelContext[SHIM_MARKER] === true && navigator.modelContext);
  if (alreadyInstalled) {
    wireBridge(alreadyInstalled[SHIM_MARKER + "_handle"]);
    return;
  }

  const shim = installImperativeShim();
  const declarative = installDeclarative(shim);

  wireBridge(shim);

  console.log(
    "[AutoBrowser:Page] Helper loaded",
    shim.wrappingNative ? "(wrapped native modelContext)" : "(installed shim)",
    "on document.modelContext + navigator.modelContext — declarative forms:",
    declarative.currentNames().length,
  );

  // ── Imperative shim ──────────────────────────────────────────────
  // Mirrors src/webmcp-shim.js. The current WebMCP IDL moved the getter
  // from Navigator to Document and made ModelContext an EventTarget with
  // a `toolchange` event and an async `getTools()` reader; registerTool
  // now returns Promise<undefined>. We install the SAME ModelContext on
  // BOTH document (canonical) and navigator (compat) so pages using
  // either location — or `document.modelContext || navigator.modelContext`
  // — find our runtime. See that file for the full rationale.
  function installImperativeShim() {
    const tracked = new Map();
    const abortCleanup = new Map();
    const schemaByTool = new WeakMap(); // tool object → serialized inputSchema
    let modelContextRef = null;
    let pendingChange = false;
    // Native refs, captured at install time below. Declared up here so
    // `execute` can use them without a TDZ hazard — reading the globals at
    // call time would return our own shim, since we replace them.
    let origRegister = null;
    let origUnregister = null;
    let origExecuteTool = null;

    function scheduleContextChange() {
      if (pendingChange) return;
      pendingChange = true;
      queueMicrotaskSafe(() => {
        pendingChange = false;
        const names = Array.from(tracked.keys());
        // Spec event: `toolchange` fires on EVERY exposed document's
        // ModelContext. getTools() aggregates same-origin frames, so a change
        // here alters a sibling's result — notifying only ourselves would leave
        // those contexts holding a stale set.
        for (const ctx of reachableContexts()) {
          try { ctx.dispatchEvent(new Event("toolchange")); } catch { /* ignore */ }
        }
        // Extension bridge signal (non-spec) — drives the agent wakeup.
        try {
          document.dispatchEvent(new CustomEvent("webmcp:context-invalidated", {
            detail: {
              reason: "tools_changed",
              boundary: true,
              reminder: "WebMCP tool set changed — reassess which tools now cover the user's intent.",
              tools: names,
            },
          }));
        } catch { /* ignore */ }
      });
    }

    function emitToolEvent(type, toolName) {
      try {
        window.dispatchEvent(new CustomEvent(type, { detail: { toolName } }));
      } catch { /* ignore */ }
    }

    function validateTool(tool) {
      if (tool == null || typeof tool !== "object") throw new TypeError("registerTool: tool must be an object");
      if (typeof tool.name !== "string" || tool.name.length === 0) throw domException("InvalidStateError", "registerTool: tool.name is required");
      if (tool.name.length > 128) throw domException("InvalidStateError", `registerTool: tool.name too long (${tool.name.length})`);
      if (!TOOL_NAME_RE.test(tool.name)) throw domException("InvalidStateError", `registerTool: tool.name "${tool.name}" has invalid characters`);
      if (typeof tool.description !== "string" || tool.description.trim().length === 0) throw domException("InvalidStateError", "registerTool: tool.description is required");
      if (typeof tool.execute !== "function") throw domException("InvalidStateError", "registerTool: tool.execute must be a function");
    }

    // Serialized AT REGISTRATION per spec — lazy serialization would let a page
    // mutate its schema object afterwards and change what agents see.
    // JSON.stringify returns undefined (no throw) when toJSON yields undefined;
    // the spec makes that a TypeError rather than a silently-absent field.
    function serializeInputSchema(tool) {
      // Only an ABSENT member is omitted. IDL declares `object inputSchema`
      // (non-nullable), so null is a type error rather than "no schema", and
      // accepting a primitive would feed the agent a serialized string where a
      // JSON Schema belongs.
      if (tool.inputSchema === undefined) return undefined;
      const value = tool.inputSchema;
      if (value === null || (typeof value !== "object" && typeof value !== "function")) {
        throw new TypeError(`registerTool: tool.inputSchema must be an object (got ${value === null ? "null" : typeof value})`);
      }
      let s;
      try { s = JSON.stringify(value); }
      catch (e) {
        if (e instanceof TypeError) throw e;
        throw new TypeError(`registerTool: tool.inputSchema is not JSON-serializable (${e.message})`);
      }
      if (s === undefined) {
        throw new TypeError("registerTool: tool.inputSchema did not serialize to a JSON string (toJSON returned undefined)");
      }
      return s;
    }

    // Synchronous core — throws on error, returns true if tracked, false
    // if skipped (already-aborted signal). Internal callers (declarative,
    // eval-loop) use this via the handle for throw-on-error semantics.
    function registerToolSync(tool, options) {
      validateTool(tool);
      const schemaJSON = serializeInputSchema(tool);
      if (tracked.has(tool.name)) {
        throw domException("InvalidStateError", `registerTool: tool "${tool.name}" already registered — abort first`);
      }
      const signal = options && options.signal;
      if (signal && signal.aborted) {
        console.warn(`[WebMCP] registerTool("${tool.name}") skipped: signal already aborted`);
        return false;
      }
      tracked.set(tool.name, tool);
      // Keyed by tool object so the identity-guarded rollback stays correct.
      schemaByTool.set(tool, schemaJSON);
      if (signal && typeof signal.addEventListener === "function") {
        const onAbort = () => {
          if (tracked.delete(tool.name)) {
            emitToolEvent("toolcanceled", tool.name);
            scheduleContextChange();
          }
          const clean = abortCleanup.get(tool.name);
          if (clean) clean();
          abortCleanup.delete(tool.name);
        };
        signal.addEventListener("abort", onAbort, { once: true });
        abortCleanup.set(tool.name, () => { try { signal.removeEventListener("abort", onAbort); } catch {} });
      }
      emitToolEvent("toolactivated", tool.name);
      scheduleContextChange();
      return true;
    }

    // Guarded on IDENTITY, not name — a pending native registration can have
    // its signal aborted and the name re-registered with a different tool
    // before it rejects; deleting by name would evict that live registration.
    // Emits removal notifications because the async path may already have
    // published the tool to listeners. Mirrors src/webmcp-shim.js.
    function rollbackCapture(name, tool) {
      if (tracked.get(name) !== tool) return;
      tracked.delete(name);
      const clean = abortCleanup.get(name);
      if (clean) clean();
      abortCleanup.delete(name);
      emitToolEvent("toolcanceled", name);
      scheduleContextChange();
    }

    function unregisterToolSync(name) {
      if (typeof name !== "string" || !tracked.has(name)) return undefined;
      tracked.delete(name);
      const clean = abortCleanup.get(name);
      if (clean) clean();
      abortCleanup.delete(name);
      emitToolEvent("toolcanceled", name);
      scheduleContextChange();
      return undefined;
    }

    const defaultClient = {
      async requestUserInteraction(callback) {
        await Promise.resolve();
        if (typeof callback === "function") return callback();
        return undefined;
      },
    };

    function listTools() {
      return Array.from(tracked.values()).map(projectTool);
    }
    // Rows for THIS document only, no traversal — frames read each other
    // through this rather than getTools(), which would recurse mutually.
    function getOwnRegisteredTools() {
      const origin = (typeof location !== "undefined" && location.origin) || "";
      return Array.from(tracked.values()).map((t) => toRegisteredTool(t, window, origin, schemaByTool.get(t)));
    }

    // Spec reader: walks the traversable's inclusive descendant navigables and
    // collects every same-origin document's rows, sorted by name in code-unit
    // order. Exposure step 1 returns true for same-origin without `exposedTo`,
    // so only cross-origin documents are skipped here. Mirrors webmcp-shim.js.
    function getTools() {
      return Promise.resolve(collectSameOriginRows().sort(byToolName));
    }

    // Bounded BFS over the frame tree — shared by the reader and the change
    // notifier so both get identical cycle and cross-origin behaviour.
    function* sameOriginWindows() {
      const root = traversalRoot();
      if (!root) return;
      const seen = new Set();
      const queue = [root];
      while (queue.length) {
        const win = queue.shift();
        if (!win || seen.has(win)) continue;
        seen.add(win);
        // Children first, separately: `frames` stays readable cross-origin, so
        // a cross-origin frame must not hide same-origin descendants below it.
        try {
          const kids = win.frames;
          if (kids && typeof kids.length === "number") {
            for (let i = 0; i < kids.length; i++) queue.push(kids[i]);
          }
        } catch {}
        yield win;
      }
    }

    // Traversal order — the spec's example has the parent's toolchange always
    // firing before the child's. Seeding with our own context inverted that
    // whenever a child frame was the one registering.
    function reachableContexts() {
      const contexts = new Set();
      for (const win of sameOriginWindows()) {
        try {
          const mc = win.document && win.document.modelContext;
          if (mc && mc[SHIM_MARKER] === true) contexts.add(mc);
        } catch {}
      }
      // Fallback only — a non-Document host is invisible to the walk.
      if (modelContextRef) contexts.add(modelContextRef);
      return contexts;
    }

    function collectSameOriginRows() {
      const rows = getOwnRegisteredTools();
      for (const win of sameOriginWindows()) {
        try {
          const mc = win.document && win.document.modelContext;
          const h = mc && mc[SHIM_MARKER + "_handle"];
          if (h && h !== handle && typeof h.getOwnRegisteredTools === "function") {
            rows.push(...h.getOwnRegisteredTools());
          }
        } catch {}
      }
      return rows;
    }

    // Highest same-origin-reachable ancestor — a cross-origin ancestor is
    // opaque, so that is as far up as we can conform.
    function traversalRoot() {
      let win = typeof window !== "undefined" ? window : null;
      if (!win) return null;
      try {
        while (win.parent && win.parent !== win) {
          void win.parent.document;
          win = win.parent;
        }
      } catch {}
      return win;
    }
    async function execute(name, input, client) {
      // Centralised dispatch — used by both the CustomEvent bridge and
      // direct callers (eval-loop scripts via the shim handle).
      //
      // PR #12 review F3 — discriminate on ownership BEFORE invoking any
      // tool.execute. If the tool is shim-owned, run it and surface its
      // error as-is; do NOT fall back to legacy readers on error, that
      // would re-run a page-side mutating tool that has already had its
      // first execute() throw — duplicate-side-effect risk (the original bug).
      if (tracked.has(name)) {
        const tool = tracked.get(name);
        if (typeof tool.execute !== "function") throw new Error(`Tool "${name}" not found`);
        return tool.execute(input || {}, client || defaultClient);
      }
      // Not shim-owned — try legacy readers (polyfills that register via
      // their own getTools-returning registry, or expose modelContextTesting).
      // These tools are also merged into discovery (see wireBridge), so the
      // LLM may legitimately call them — including from inside an eval-loop.
      const testing = navigator.modelContextTesting;
      if (testing && typeof testing.executeTool === "function") {
        return testing.executeTool(name, input || {});
      }
      // Native executeTool, captured at install time. Re-reading the global
      // here would find our own shim — we replaced it.
      if (origExecuteTool) return origExecuteTool(name, input || {});
      throw new Error(`Tool "${name}" not found`);
    }

    // Detect a native/polyfilled implementation on either surface (prefer
    // document — the canonical location). Skip our own already-installed
    // shim.
    for (const mc of [document.modelContext, navigator.modelContext]) {
      if (mc && typeof mc.registerTool === "function" && mc[SHIM_MARKER] !== true) {
        origRegister = mc.registerTool.bind(mc);
        origUnregister = typeof mc.unregisterTool === "function" ? mc.unregisterTool.bind(mc) : null;
        origExecuteTool = typeof mc.executeTool === "function" ? mc.executeTool.bind(mc) : null;
        break;
      }
    }
    const wrappingNative = !!origRegister;

    // Public, spec-shaped registerTool: throws synchronously on validation
    // /duplicate (declarative + `await` both catch), returns Promise<undefined>
    // on success. When wrapping native, forwards original args and rolls
    // back our capture if native rejects.
    function registerTool(tool, options) {
      // WebIDL: promise-returning operations never throw synchronously. The
      // throwing core stays on the handle for the declarative synthesizer.
      let didRegister;
      try { didRegister = registerToolSync(tool, options); }
      catch (e) { return Promise.reject(e); }

      // Already-aborted signal: reject with the signal's reason, and do NOT
      // forward to native — nothing was registered here, so forwarding would
      // leave the registries disagreeing.
      if (!didRegister) {
        const signal = options && options.signal;
        return Promise.reject(signal ? signal.reason : domException("AbortError", "registerTool: aborted"));
      }

      if (origRegister) {
        let r;
        try { r = origRegister(tool, options); }
        catch (e) { rollbackCapture(tool.name, tool); return Promise.reject(e); }
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

    // Chrome's native ModelContext ships executeTool; we replace the whole
    // object, so omitting it would make a native method vanish when the
    // extension loads. Ownership first — declarative `<form toolname>` tools
    // live only in `tracked` and are never forwarded to native.
    function executeTool(name, input) {
      if (tracked.has(name)) return execute(name, input);
      if (origExecuteTool) return origExecuteTool(name, input);
      return Promise.reject(new Error(`Tool "${name}" not found`));
    }

    // Build the ModelContext (an EventTarget per the current IDL).
    const modelContext = new EventTarget();
    modelContextRef = modelContext;
    defineMethod(modelContext, "registerTool", registerTool);
    defineMethod(modelContext, "unregisterTool", unregisterTool);
    defineMethod(modelContext, "getTools", getTools);
    defineMethod(modelContext, "executeTool", executeTool);
    let ontoolchange = null;
    try {
      Object.defineProperty(modelContext, "ontoolchange", {
        get() { return ontoolchange; },
        set(fn) {
          if (ontoolchange) { try { modelContext.removeEventListener("toolchange", ontoolchange); } catch {} }
          ontoolchange = typeof fn === "function" ? fn : null;
          if (ontoolchange) { try { modelContext.addEventListener("toolchange", ontoolchange); } catch {} }
        },
        enumerable: true, configurable: true,
      });
    } catch {}

    function hasTool(name) { return typeof name === "string" && tracked.has(name); }
    // Handle exposes the SYNCHRONOUS register/unregister for internal
    // callers (declarative synthesizer, eval-loop) that want throw-on-error.
    const handle = { registerTool: registerToolSync, unregisterTool: unregisterToolSync, listTools, execute, getTools, getOwnRegisteredTools, hasTool, modelContext, wrappingNative };
    try {
      Object.defineProperty(modelContext, SHIM_MARKER, { value: true, configurable: false });
      Object.defineProperty(modelContext, SHIM_MARKER + "_handle", { value: handle, configurable: false, enumerable: false });
    } catch {}

    // Install the SAME modelContext on BOTH document (primary) and
    // navigator (compat window).
    installModelContext(document, modelContext);
    installModelContext(navigator, modelContext);

    return handle;
  }

  function installModelContext(target, modelContext) {
    try {
      Object.defineProperty(target, "modelContext", { value: modelContext, writable: true, configurable: true });
    } catch {
      try { target.modelContext = modelContext; }
      catch (err) { console.error("[AutoBrowser:Page] shim install failed — modelContext non-configurable:", err); }
    }
  }

  // ── Declarative synthesis ────────────────────────────────────────
  function installDeclarative(shim) {
    const registered = new Map();

    function registerForm(form) {
      const name = form.getAttribute(TOOLFORM_ATTR);
      if (!name || !TOOL_NAME_RE.test(name)) return;
      if (registered.has(name)) return;
      const description = form.getAttribute(TOOLDESC_ATTR) || `Submit the "${name}" form`;
      const inputSchema = synthesizeInputSchema(form);
      const ctrl = typeof AbortController === "function" ? new AbortController() : null;
      const tool = {
        name, description, inputSchema,
        execute: (input) => executeForm(form, input),
      };
      try {
        shim.registerTool(tool, ctrl ? { signal: ctrl.signal } : undefined);
        registered.set(name, { form, ctrl });
      } catch (err) {
        console.warn(`[AutoBrowser:declarative] could not register "${name}":`, err && err.message);
      }
    }
    function unregisterForm(name) {
      const entry = registered.get(name);
      if (!entry) return;
      registered.delete(name);
      if (entry.ctrl) try { entry.ctrl.abort(); } catch {}
      else try { shim.unregisterTool(name); } catch {}
    }
    function refreshForm(form, prevName) {
      const name = form.getAttribute(TOOLFORM_ATTR);
      if (prevName && prevName !== name) unregisterForm(prevName);
      if (!name) return;
      if (registered.has(name)) unregisterForm(name);
      registerForm(form);
    }

    // Initial scan (document_start: body may be empty; that's fine —
    // MutationObserver catches later insertions).
    try {
      for (const form of document.querySelectorAll(`form[${TOOLFORM_ATTR}]`)) registerForm(form);
    } catch {}

    let observer = null;
    if (typeof MutationObserver === "function") {
      observer = new MutationObserver((records) => {
        for (const rec of records) {
          if (rec.type === "childList") {
            for (const node of rec.addedNodes) scanAdded(node);
            for (const node of rec.removedNodes) scanRemoved(node);
          } else if (rec.type === "attributes" && rec.target instanceof Element) {
            const t = rec.target;
            if (rec.attributeName === TOOLFORM_ATTR && t.tagName === "FORM") refreshForm(t, rec.oldValue);
            else if (t.tagName === "FORM" && (rec.attributeName === TOOLDESC_ATTR || rec.attributeName === TOOLAUTOSUBMIT_ATTR)) refreshForm(t, t.getAttribute(TOOLFORM_ATTR));
            else if (rec.attributeName === TOOLPARAMDESC_ATTR || rec.attributeName === "name" || rec.attributeName === "required") {
              const parent = t.closest && t.closest(`form[${TOOLFORM_ATTR}]`);
              if (parent) refreshForm(parent, parent.getAttribute(TOOLFORM_ATTR));
            }
          }
        }
      });
      try {
        observer.observe(document, {
          childList: true, subtree: true, attributes: true, attributeOldValue: true,
          attributeFilter: [TOOLFORM_ATTR, TOOLDESC_ATTR, TOOLAUTOSUBMIT_ATTR, TOOLPARAMDESC_ATTR, "name", "required"],
        });
      } catch {}
    }

    function scanAdded(node) {
      if (!(node instanceof Element)) return;
      if (node.tagName === "FORM" && node.hasAttribute(TOOLFORM_ATTR)) registerForm(node);
      if (typeof node.querySelectorAll === "function") {
        for (const f of node.querySelectorAll(`form[${TOOLFORM_ATTR}]`)) registerForm(f);
      }
    }
    function scanRemoved(node) {
      if (!(node instanceof Element)) return;
      if (node.tagName === "FORM" && node.hasAttribute(TOOLFORM_ATTR)) unregisterForm(node.getAttribute(TOOLFORM_ATTR));
      if (typeof node.querySelectorAll === "function") {
        for (const f of node.querySelectorAll(`form[${TOOLFORM_ATTR}]`)) unregisterForm(f.getAttribute(TOOLFORM_ATTR));
      }
    }

    return { currentNames: () => Array.from(registered.keys()) };
  }

  // synthesizeInputSchema — mirrors src/webmcp-declarative.js. Groups
  // same-name controls FIRST so radio groups → string enum and checkbox
  // groups → array-of-enum. See that file's JSDoc for the PR #12 review
  // F4 rationale.
  function synthesizeInputSchema(form) {
    const properties = {};
    const required = [];
    if (!form || typeof form.querySelectorAll !== "function") return { type: "object", properties, required };
    const EXCLUDED = new Set(["submit","reset","button","hidden","image","file"]);
    const groups = new Map();
    for (const el of form.querySelectorAll("input[name], select[name], textarea[name]")) {
      if (!el.name) continue;
      const type = (el.getAttribute("type") || el.tagName).toLowerCase();
      if (EXCLUDED.has(type)) continue;
      if (!groups.has(el.name)) groups.set(el.name, []);
      groups.get(el.name).push(el);
    }
    for (const [name, controls] of groups) {
      const isInputOfType = (t) => (el) =>
        el.tagName === "INPUT" && (el.getAttribute("type") || "").toLowerCase() === t;
      const allRadio = controls.length > 1 && controls.every(isInputOfType("radio"));
      const allCheckbox = controls.length > 1 && controls.every(isInputOfType("checkbox"));
      let prop;
      if (allRadio) {
        const values = Array.from(new Set(controls.map((el) => el.value).filter((v) => v !== "" && v != null)));
        prop = { type: "string" };
        if (values.length) prop.enum = values;
      } else if (allCheckbox) {
        const values = Array.from(new Set(controls.map((el) => el.value).filter((v) => v !== "" && v != null)));
        const items = { type: "string" };
        if (values.length) items.enum = values;
        prop = { type: "array", items, uniqueItems: true };
      } else {
        const first = controls[0];
        const type = (first.getAttribute("type") || first.tagName).toLowerCase();
        prop = jsonSchemaForControl(first, type);
      }
      const descEl = controls.find((el) => el.hasAttribute(TOOLPARAMDESC_ATTR));
      if (descEl) prop.description = descEl.getAttribute(TOOLPARAMDESC_ATTR);
      properties[name] = prop;
      if (controls.some((el) => el.hasAttribute("required")) && !required.includes(name)) required.push(name);
    }
    return { type: "object", properties, required };
  }
  function jsonSchemaForControl(el, type) {
    if (el.tagName === "SELECT") {
      const dedup = Array.from(new Set(Array.from(el.options || []).map((o) => o.value).filter((v) => v !== "")));
      const schema = { type: "string" };
      if (dedup.length) schema.enum = dedup;
      return schema;
    }
    if (el.tagName === "TEXTAREA") return { type: "string" };
    if (type === "number" || type === "range") {
      const s = { type: "number" };
      const min = Number(el.getAttribute("min"));
      const max = Number(el.getAttribute("max"));
      if (Number.isFinite(min)) s.minimum = min;
      if (Number.isFinite(max)) s.maximum = max;
      return s;
    }
    if (type === "checkbox") return { type: "boolean" };
    if (type === "date") return { type: "string", description: "YYYY-MM-DD" };
    if (type === "datetime-local") return { type: "string", description: "YYYY-MM-DDTHH:MM" };
    if (type === "month") return { type: "string", description: "YYYY-MM" };
    if (type === "week") return { type: "string", description: "YYYY-Www" };
    if (type === "time") return { type: "string", description: "HH:MM (24-hour)" };
    if (type === "email") return { type: "string", format: "email" };
    if (type === "url") return { type: "string", format: "uri" };
    if (type === "tel") return { type: "string", description: "phone number" };
    return { type: "string" };
  }

  // executeForm — mirrors src/webmcp-declarative.js. EXACTLY ONE submit
  // event, decorated in place before dispatch so every listener sees
  // agentInvoked + respondWith regardless of when they were added. See
  // that file's JSDoc for the full rationale (PR #12 review F1 + the
  // capture-order follow-up).
  function executeForm(form, input) {
    return new Promise((resolve, reject) => {
      try { applyInputToForm(form, input || {}); }
      catch (err) { reject(err); return; }
      setToolActiveClasses(form, true);

      let respondWithCalled = false;
      let settled = false;

      const finish = (fn) => (v) => { if (settled) return; settled = true; setToolActiveClasses(form, false); fn(v); };
      const resolveOnce = finish(resolve);
      const rejectOnce = finish(reject);

      let evt;
      try { evt = new SubmitEvent("submit", { bubbles: true, cancelable: true, composed: true }); }
      catch { evt = new Event("submit", { bubbles: true, cancelable: true }); }
      try {
        Object.defineProperty(evt, "agentInvoked", { value: true, configurable: true });
        Object.defineProperty(evt, "respondWith", {
          value(promise) { respondWithCalled = true; Promise.resolve(promise).then(resolveOnce, rejectOnce); },
          configurable: true,
        });
        Object.defineProperty(evt, "submitter", { value: findSubmitter(form), configurable: true });
      } catch {}

      let dispatched;
      try { dispatched = form.dispatchEvent(evt); }
      catch (err) { rejectOnce(err); return; }

      if (settled) return;
      if (respondWithCalled) return;
      if (!dispatched || evt.defaultPrevented) {
        resolveOnce({ ok: true, submitted: false, note: "preventDefault without respondWith" });
        return;
      }
      resolveOnce({ ok: true, submitted: true, autosubmit: form.hasAttribute(TOOLAUTOSUBMIT_ATTR) });
    });
  }

  // applyInputToForm — mirrors src/webmcp-declarative.js. Handles
  // radio/checkbox groups by walking all same-name controls — see that
  // file's JSDoc for the PR #12 review F2 rationale.
  function applyInputToForm(form, input) {
    if (!form || !input || typeof input !== "object") return;
    for (const [key, value] of Object.entries(input)) {
      const controls = Array.from(form.querySelectorAll(`[name="${cssEscape(key)}"]`));
      if (controls.length === 0) continue;
      const allType = (t) => controls.length > 1 && controls.every((el) =>
        el.tagName === "INPUT" && (el.getAttribute("type") || "").toLowerCase() === t
      );
      if (allType("radio")) {
        for (const el of controls) {
          el.checked = String(el.value) === String(value);
          dispatchInputChange(el);
        }
        continue;
      }
      if (allType("checkbox")) {
        const wanted = new Set(Array.isArray(value) ? value.map(String) : [String(value)]);
        for (const el of controls) {
          el.checked = wanted.has(String(el.value));
          dispatchInputChange(el);
        }
        continue;
      }
      setControlValue(controls[0], value);
    }
  }
  function setControlValue(el, value) {
    const tag = el.tagName;
    const type = (el.getAttribute("type") || "").toLowerCase();
    if (tag === "SELECT") { el.value = String(value); dispatchInputChange(el); return; }
    if (type === "checkbox" || type === "radio") { el.checked = value === true || value === "true" || value === 1 || value === "1"; dispatchInputChange(el); return; }
    el.value = value == null ? "" : String(value);
    dispatchInputChange(el);
  }
  function dispatchInputChange(el) {
    try { el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); } catch {}
  }
  function findSubmitter(form) {
    try { return form.querySelector('button[type="submit"], input[type="submit"], button:not([type])'); } catch { return null; }
  }
  function setToolActiveClasses(form, active) {
    if (!form) return;
    const submitter = findSubmitter(form);
    if (active) { form.setAttribute("data-tool-form-active", ""); if (submitter) submitter.setAttribute("data-tool-submit-active", ""); }
    else { form.removeAttribute("data-tool-form-active"); if (submitter) submitter.removeAttribute("data-tool-submit-active"); }
  }

  // ── Bridge to the ISOLATED-world content script ──────────────────
  function wireBridge(handle) {
    document.addEventListener("__autobrowser_discover", () => {
      let tools = handle.listTools();
      // Merge in anything a legacy reader API reports (polyfills that
      // register through their OWN registry rather than our shim). Our
      // own getTools() is async and its tools are already in listTools(),
      // so skip it here — only rescue non-owned synchronous readers.
      try {
        const testing = navigator.modelContextTesting;
        if (testing && typeof testing.listTools === "function") {
          for (const t of testing.listTools()) {
            if (!tools.find((x) => x.name === t.name)) tools.push(t);
          }
        } else {
          const mc = document.modelContext || navigator.modelContext;
          if (mc && mc[SHIM_MARKER] !== true && typeof mc.getTools === "function") {
            const legacy = mc.getTools();
            if (Array.isArray(legacy)) {
              for (const t of legacy) {
                if (!tools.find((x) => x.name === t.name)) tools.push(projectTool(t));
              }
            }
          }
        }
      } catch (e) {
        console.error("[AutoBrowser:Page] reader fallback error:", e);
      }
      document.dispatchEvent(new CustomEvent("__autobrowser_tools", { detail: JSON.stringify(tools) }));
    });

    document.addEventListener("__autobrowser_execute", async (e) => {
      const { id, name, input } = JSON.parse(e.detail);
      try {
        // Centralised dispatch — handle.execute applies the PR #12 F3
        // ownership discrimination internally (see its definition above):
        // shim-owned tools never fall back to legacy readers on error.
        const raw = await handle.execute(name, input || {});
        // JSON-stringify the result carefully — page tools may return
        // non-JSON values (BigInt, Date, circulars). Wrap so the agent
        // gets a clear error instead of an opaque throw.
        let detailStr;
        try { detailStr = JSON.stringify({ id, result: raw }); }
        catch (serErr) {
          detailStr = JSON.stringify({ id, error: `Tool "${name}" returned a non-JSON-serializable value: ${serErr.message}` });
        }
        document.dispatchEvent(new CustomEvent("__autobrowser_result", { detail: detailStr }));
      } catch (err) {
        document.dispatchEvent(new CustomEvent("__autobrowser_result", {
          detail: JSON.stringify({ id, error: err && err.message ? err.message : String(err) }),
        }));
      }
    });
  }

  // ── helpers ──────────────────────────────────────────────────────
  function projectTool(t) {
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
  // RegisteredTool shape for the spec getTools() reader: window/origin
  // plus a SERIALIZED inputSchema (DOMString), distinct from the object
  // form on ModelContextTool.
  function toRegisteredTool(t, win, origin, schemaJSON) {
    const out = { name: t.name, description: t.description, window: win, origin };
    if (typeof t.title === "string" && t.title) out.title = t.title;
    // The string captured at registration, not a fresh serialization.
    if (schemaJSON !== undefined) out.inputSchema = schemaJSON;
    if (t.annotations && typeof t.annotations === "object") {
      out.annotations = {};
      if (t.annotations.readOnlyHint === true) out.annotations.readOnlyHint = true;
      if (t.annotations.untrustedContentHint === true) out.annotations.untrustedContentHint = true;
    }
    return out;
  }
  // Spec getTools() sorts ascending by name in code-unit order. Plain `<` IS a
  // code-unit comparison; localeCompare is not.
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
  function cssEscape(s) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(s);
    return String(s).replace(/["\\]/g, (m) => "\\" + m);
  }
  function queueMicrotaskSafe(fn) {
    if (typeof queueMicrotask === "function") { queueMicrotask(fn); return; }
    Promise.resolve().then(fn).catch(() => {});
  }
  function domException(name, message) {
    if (typeof DOMException === "function") { try { return new DOMException(message, name); } catch {} }
    const e = new Error(message); e.name = name; return e;
  }
})();