/**
 * WebMCP declarative-API support.
 *
 * Implements the form-attribute flow described in
 * `spec/declarative-api-explainer.md`:
 *
 *   <form toolname="submit_reservation"
 *         tooldescription="Creates a confirmed reservation"
 *         toolautosubmit>
 *     <input name="date" type="date"
 *            toolparamdescription="Reservation date (YYYY-MM-DD)" required>
 *     …
 *   </form>
 *
 * Behavior:
 *   - Every `<form>` with a `toolname` attribute synthesizes a
 *     `ModelContextTool` whose `name` / `description` / `inputSchema`
 *     come from the attributes and the form's control set, and whose
 *     `execute(input)` populates the controls, dispatches a submit
 *     event with `agentInvoked: true` and a `respondWith()` method,
 *     and resolves with whatever the page passes to `respondWith` —
 *     or (fallback) an `{ok:true, submitted:true}` shape if the page
 *     chooses the default submit path.
 *   - Forms are (re)synthesized on attribute change / insertion /
 *     removal via a `MutationObserver`; the shim is the authoritative
 *     registry.
 *   - `:tool-form-active` / `:tool-submit-active` — the spec's CSS
 *     pseudo-classes are UA-only; we approximate with the attribute
 *     classes `data-tool-form-active` / `data-tool-submit-active` on
 *     the form and its submit button so pages can style them today.
 *   - Preserves spec precedence: declarative tools share the
 *     namespace with imperative tools, so a duplicate name collides
 *     with `InvalidStateError` at the imperative register step.
 *
 * This module is a pure ES module. `src/page-helper.js` loads it via
 * dynamic import or inlines an equivalent bootstrap — see page-helper
 * for the installation contract.
 */

const TOOLFORM_ATTR = "toolname";
const TOOLDESC_ATTR = "tooldescription";
const TOOLPARAMDESC_ATTR = "toolparamdescription";
const TOOLAUTOSUBMIT_ATTR = "toolautosubmit";

// Name constraint mirrors webmcp-shim.js (spec `index.bs:121-123`).
const TOOL_NAME_RE = /^[A-Za-z0-9._-]{1,128}$/;

/**
 * Scan the document for declarative tool forms and register each with
 * the supplied shim. Returns a stop function + a snapshot list.
 *
 * @param {Document} doc
 * @param {{ registerTool: Function, unregisterTool: Function }} shim
 *   The shim's INTERNAL handle, whose `registerTool` throws synchronously —
 *   not the public `ModelContext`, which returns a promise and rejects. The
 *   collision path below depends on the synchronous throw to know a form was
 *   refused; handed the public API it would mark the form registered and leak
 *   an unhandled rejection.
 * @returns {{ stop: () => void, currentNames: () => string[] }}
 */
export function installDeclarativeTools(doc, shim) {
  if (!doc || typeof doc.querySelectorAll !== "function") {
    return { stop: () => {}, currentNames: () => [] };
  }

  // name → { form, abortController }
  const registered = new Map();

  function registerForm(form) {
    const name = form.getAttribute(TOOLFORM_ATTR);
    if (!name || !TOOL_NAME_RE.test(name)) return;
    if (registered.has(name)) return; // Idempotent.

    const description = form.getAttribute(TOOLDESC_ATTR)
      || `Submit the "${name}" form`;
    const inputSchema = synthesizeInputSchema(form);
    const tool = {
      name,
      description,
      inputSchema,
      execute: (input) => executeForm(form, input),
    };

    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    try {
      shim.registerTool(tool, ctrl ? { signal: ctrl.signal } : undefined);
      registered.set(name, { form, ctrl });
    } catch (err) {
      // Most likely InvalidStateError (collision with imperative).
      // Leave it to the imperative side and log so the developer knows.
      if (typeof console !== "undefined" && console.warn) {
        console.warn(`[WebMCP:declarative] Could not register form "${name}":`, err && err.message);
      }
    }
  }

  function unregisterForm(name) {
    const entry = registered.get(name);
    if (!entry) return;
    registered.delete(name);
    if (entry.ctrl) {
      try { entry.ctrl.abort(); } catch { /* ignore */ }
    } else {
      try { shim.unregisterTool(name); } catch { /* ignore */ }
    }
  }

  function refreshForm(form, prevName) {
    // Re-register if name or schema-affecting attribute changed.
    const name = form.getAttribute(TOOLFORM_ATTR);
    if (prevName && prevName !== name) {
      unregisterForm(prevName);
    }
    if (!name) return;
    if (registered.has(name)) {
      // Re-synthesize with current DOM — simplest: unregister then
      // register. The abort event schedules a context-change, and the
      // subsequent register schedules another; they debounce into a
      // single webmcp:context-invalidated tick per microtask boundary.
      unregisterForm(name);
    }
    registerForm(form);
  }

  // Initial scan — document may already have forms at document_idle
  // OR our observer catches them when they insert later.
  for (const form of doc.querySelectorAll(`form[${TOOLFORM_ATTR}]`)) {
    registerForm(form);
  }

  // Observe insertions/removals and attribute changes across the
  // relevant set. `MutationObserver` may not exist in minimal test
  // environments — degrade to "initial scan only".
  let observer = null;
  if (typeof MutationObserver === "function") {
    observer = new MutationObserver((records) => {
      for (const rec of records) {
        if (rec.type === "childList") {
          for (const node of rec.addedNodes) scanAdded(node);
          for (const node of rec.removedNodes) scanRemoved(node);
        } else if (rec.type === "attributes") {
          const target = rec.target;
          if (!(target instanceof Element)) continue;
          if (rec.attributeName === TOOLFORM_ATTR && target.tagName === "FORM") {
            refreshForm(target, rec.oldValue);
          } else if (
            target.tagName === "FORM" &&
            (rec.attributeName === TOOLDESC_ATTR ||
             rec.attributeName === TOOLAUTOSUBMIT_ATTR)
          ) {
            refreshForm(target, target.getAttribute(TOOLFORM_ATTR));
          } else if (
            rec.attributeName === TOOLPARAMDESC_ATTR ||
            rec.attributeName === "name" ||
            rec.attributeName === "required"
          ) {
            // Find the containing tool-form and re-synthesize.
            const parent = target.closest && target.closest(`form[${TOOLFORM_ATTR}]`);
            if (parent) refreshForm(parent, parent.getAttribute(TOOLFORM_ATTR));
          }
        }
      }
    });
    try {
      observer.observe(doc, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: [
          TOOLFORM_ATTR,
          TOOLDESC_ATTR,
          TOOLAUTOSUBMIT_ATTR,
          TOOLPARAMDESC_ATTR,
          "name",
          "required",
        ],
      });
    } catch { /* ignore — fall through to initial-scan-only */ }
  }

  function scanAdded(node) {
    if (!(node instanceof Element)) return;
    if (node.tagName === "FORM" && node.hasAttribute(TOOLFORM_ATTR)) {
      registerForm(node);
    }
    if (typeof node.querySelectorAll === "function") {
      for (const f of node.querySelectorAll(`form[${TOOLFORM_ATTR}]`)) {
        registerForm(f);
      }
    }
  }

  function scanRemoved(node) {
    if (!(node instanceof Element)) return;
    if (node.tagName === "FORM" && node.hasAttribute(TOOLFORM_ATTR)) {
      unregisterForm(node.getAttribute(TOOLFORM_ATTR));
    }
    if (typeof node.querySelectorAll === "function") {
      for (const f of node.querySelectorAll(`form[${TOOLFORM_ATTR}]`)) {
        unregisterForm(f.getAttribute(TOOLFORM_ATTR));
      }
    }
  }

  return {
    stop() {
      if (observer) try { observer.disconnect(); } catch { /* ignore */ }
      for (const name of Array.from(registered.keys())) unregisterForm(name);
    },
    currentNames() { return Array.from(registered.keys()); },
  };
}

/**
 * Derive a JSON-Schema-2020-12 object from a form's controls.
 * Exported for testing; not part of the shim API.
 *
 * Correctness note (PR #12 review F4): earlier revisions iterated
 * per-control, so a radio group of three `<input type=radio name=x>`
 * controls synthesized `properties.x = {type:"string"}` (no enum)
 * and a same-name checkbox group synthesized `{type:"boolean"}` as
 * if it were a single checkbox. That diverged from `applyInputToForm`,
 * which now correctly routes radio groups by value and checkbox groups
 * by set-membership — the discovered schema told the model a different
 * contract than the execution accepted. Now groups controls by name
 * FIRST, then emits per-group schemas: radio groups → `{type:"string",
 * enum:[...]}`, checkbox groups → `{type:"array", items:{type:"string",
 * enum:[...]}, uniqueItems:true}`, single controls → existing per-type
 * mapping.
 */
export function synthesizeInputSchema(form) {
  const properties = {};
  const required = [];
  if (!form || typeof form.querySelectorAll !== "function") {
    return { type: "object", properties, required };
  }
  const SELECTOR = "input[name], select[name], textarea[name]";
  const EXCLUDED_TYPES = new Set(["submit", "reset", "button", "hidden", "image", "file"]);

  // Group controls by their `name` attribute.
  const groups = new Map();
  for (const el of form.querySelectorAll(SELECTOR)) {
    if (!el.name) continue;
    const type = (el.getAttribute("type") || el.tagName).toLowerCase();
    if (EXCLUDED_TYPES.has(type)) continue;
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
      const values = Array.from(new Set(
        controls.map((el) => el.value).filter((v) => v !== "" && v != null)
      ));
      prop = { type: "string" };
      if (values.length) prop.enum = values;
    } else if (allCheckbox) {
      const values = Array.from(new Set(
        controls.map((el) => el.value).filter((v) => v !== "" && v != null)
      ));
      const items = { type: "string" };
      if (values.length) items.enum = values;
      prop = { type: "array", items, uniqueItems: true };
    } else {
      const first = controls[0];
      const type = (first.getAttribute("type") || first.tagName).toLowerCase();
      prop = jsonSchemaForControl(first, type);
    }

    // Use the first control's toolparamdescription as the property
    // description. If multiple controls in a group have different
    // descriptions (unusual), prefer the earliest in document order.
    const descEl = controls.find((el) => el.hasAttribute(TOOLPARAMDESC_ATTR));
    if (descEl) prop.description = descEl.getAttribute(TOOLPARAMDESC_ATTR);

    properties[name] = prop;

    // Required if ANY control in the group is required — matches the
    // browser's behavior for radio groups (required on any group member
    // marks the group required).
    if (controls.some((el) => el.hasAttribute("required")) && !required.includes(name)) {
      required.push(name);
    }
  }
  return { type: "object", properties, required };
}

function jsonSchemaForControl(el, type) {
  const tag = el.tagName;
  if (tag === "SELECT") {
    const opts = Array.from(el.options || []).map((o) => o.value);
    const dedup = Array.from(new Set(opts.filter((v) => v !== "")));
    const schema = { type: "string" };
    if (dedup.length) schema.enum = dedup;
    return schema;
  }
  if (tag === "TEXTAREA") {
    return { type: "string" };
  }
  // <input>
  if (type === "number" || type === "range") {
    const schema = { type: "number" };
    if (el.hasAttribute("min")) {
      const min = Number(el.getAttribute("min"));
      if (Number.isFinite(min)) schema.minimum = min;
    }
    if (el.hasAttribute("max")) {
      const max = Number(el.getAttribute("max"));
      if (Number.isFinite(max)) schema.maximum = max;
    }
    return schema;
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
  // text, password, search, color, anything else: string.
  return { type: "string" };
}

/**
 * Fill form fields from `input` and dispatch EXACTLY ONE submit event,
 * pre-decorated with `agentInvoked: true` and `respondWith(promise)`
 * before dispatch so every listener (including target-phase listeners
 * added by the page) sees them. Resolves with the value the page
 * passes to `respondWith`, or a documented fallback shape if the page
 * silently lets the submit default-path through.
 *
 * Correctness history:
 *
 * - The FIRST revision dispatched a synthetic submit AND called
 *   requestSubmit() — fired the page's handler twice (PR #12 review
 *   F1 — double-post risk on forms with side effects).
 *
 * - The SECOND revision attached a capture-phase listener to the form
 *   and called requestSubmit(). That still fires exactly one submit,
 *   but per the DOM spec, listeners attached to the target fire in
 *   order-of-addition at AT_TARGET phase REGARDLESS of capture vs.
 *   bubble. If the page registered its handler before executeForm
 *   was invoked (the common case in tests and in real pages that set
 *   up their listeners at load), the page's handler ran BEFORE ours
 *   — meaning the page's `e.respondWith(...)` call hit an undecorated
 *   event and threw "respondWith is not a function", silently caught
 *   by the event loop. The outer promise then resolved with the
 *   default fallback shape instead of the page's response. This is
 *   what broke the "respondsWith errors" test.
 *
 * - The CURRENT revision decorates the event BEFORE dispatch and uses
 *   `form.dispatchEvent(new SubmitEvent(...))` to deliver it. Exactly
 *   one submit event; guaranteed decoration visible to every listener;
 *   no unwanted navigation (dispatchEvent on a form doesn't trigger
 *   the default submit action the way requestSubmit would, which is
 *   desirable for an in-session agent). Browser-native HTML5 form
 *   validation is deliberately bypassed on this agent-driven path —
 *   the page's submit handler still runs its own validateForm() and
 *   can respondWith structured errors.
 */
function executeForm(form, input) {
  return new Promise((resolve, reject) => {
    try {
      applyInputToForm(form, input || {});
    } catch (err) {
      reject(err);
      return;
    }

    setToolActiveClasses(form, true);

    let respondWithCalled = false;
    let settled = false;

    const finish = (fn) => (value) => {
      if (settled) return;
      settled = true;
      setToolActiveClasses(form, false);
      fn(value);
    };
    const resolveOnce = finish(resolve);
    const rejectOnce = finish(reject);

    let evt;
    try {
      evt = new SubmitEvent("submit", { bubbles: true, cancelable: true, composed: true });
    } catch {
      // jsdom without SubmitEvent — synthesize via base Event.
      evt = new Event("submit", { bubbles: true, cancelable: true });
    }
    // Decorate BEFORE dispatch so every listener sees agentInvoked +
    // respondWith, regardless of where or when the listener was added.
    try {
      Object.defineProperty(evt, "agentInvoked", { value: true, configurable: true });
      Object.defineProperty(evt, "respondWith", {
        value(promise) {
          respondWithCalled = true;
          Promise.resolve(promise).then(resolveOnce, rejectOnce);
        },
        configurable: true,
      });
      Object.defineProperty(evt, "submitter", { value: findSubmitter(form), configurable: true });
    } catch { /* decoration is best-effort */ }

    let dispatched;
    try {
      dispatched = form.dispatchEvent(evt);
    } catch (err) {
      rejectOnce(err);
      return;
    }

    // After dispatch, all synchronous listeners have run.
    if (settled) return;              // respondWith resolved/rejected synchronously
    if (respondWithCalled) return;    // respondWith promise pending — outer Promise settles on it
    if (!dispatched || evt.defaultPrevented) {
      resolveOnce({ ok: true, submitted: false, note: "preventDefault without respondWith" });
      return;
    }
    // Neither respondWith nor preventDefault. In a real browser the
    // default submit would now run (potentially navigating). We don't
    // invoke requestSubmit() here — that would fire a SECOND submit
    // event (the PR #12 review F1 regression). We surface best-effort
    // success instead; declarative tools that don't respondWith are a
    // footgun the spec itself (#135) is actively redesigning.
    resolveOnce({ ok: true, submitted: true, autosubmit: form.hasAttribute(TOOLAUTOSUBMIT_ATTR) });
  });
}

/**
 * Populate form controls from an input object. Exported for testing.
 *
 * Correctness note (PR #12 review F2): `form.querySelector('[name=x]')`
 * returns only the FIRST control, which made radio groups unreachable
 * (value coerced to boolean → wrong option checked) and checkbox groups
 * only ever toggle the first checkbox. Now resolves ALL matching
 * controls and routes by group type:
 *   - radio group: check the one whose `value` matches the input (as
 *     string), uncheck siblings.
 *   - checkbox group: treat input as a set (array or single value);
 *     check each control whose `value` is in the set, uncheck others.
 *   - single control (or a mixed / single-element match): write the
 *     value via `setControlValue`.
 */
export function applyInputToForm(form, input) {
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
      const wanted = new Set(
        Array.isArray(value) ? value.map(String) : [String(value)],
      );
      for (const el of controls) {
        el.checked = wanted.has(String(el.value));
        dispatchInputChange(el);
      }
      continue;
    }
    // Single control (or a 1-element match that happens to be a radio
    // or checkbox — handled by setControlValue's boolean coercion).
    setControlValue(controls[0], value);
  }
}

function setControlValue(el, value) {
  const tag = el.tagName;
  const type = (el.getAttribute("type") || "").toLowerCase();
  if (tag === "SELECT") {
    el.value = String(value);
    dispatchInputChange(el);
    return;
  }
  if (type === "checkbox" || type === "radio") {
    // Single checkbox/radio: boolean interpretation.
    el.checked = value === true || value === "true" || value === 1 || value === "1";
    dispatchInputChange(el);
    return;
  }
  if (type === "number" || type === "range") {
    el.value = String(value);
  } else {
    el.value = value == null ? "" : String(value);
  }
  dispatchInputChange(el);
}

function dispatchInputChange(el) {
  try {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  } catch { /* ignore */ }
}

function findSubmitter(form) {
  try {
    return form.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
  } catch {
    return null;
  }
}

function setToolActiveClasses(form, active) {
  if (!form || typeof form.setAttribute !== "function") return;
  const submitter = findSubmitter(form);
  if (active) {
    form.setAttribute("data-tool-form-active", "");
    if (submitter) submitter.setAttribute("data-tool-submit-active", "");
  } else {
    form.removeAttribute("data-tool-form-active");
    if (submitter) submitter.removeAttribute("data-tool-submit-active");
  }
}

function cssEscape(s) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(s);
  return String(s).replace(/["\\]/g, (m) => "\\" + m);
}

function queueMicrotaskSafe(fn) {
  if (typeof queueMicrotask === "function") { queueMicrotask(fn); return; }
  Promise.resolve().then(fn).catch(() => { /* ignore */ });
}
