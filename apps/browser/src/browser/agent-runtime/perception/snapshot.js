/**
 * Snapshot walker (isolated world).
 *
 * Produces a compact text tree of interactive + optionally structural elements,
 * with every emitted element assigned a `ref_N` uid and paired with its DOM
 * Element in the returned refs list. Callers (content.js) register those pairs
 * in the per-turn refmap so downstream tools can resolve a uid to an Element.
 *
 * Scope of v1:
 *   - Role derivation from tag + type + explicit role attr.
 *   - Accessible name: aria-label → aria-labelledby → <label for> → placeholder
 *     → visible text → title → alt, capped at 80 chars and whitespace-collapsed.
 *   - Visibility (Phase 2.1): hidden attr, aria-hidden, and COMPUTED
 *     display/visibility via getComputedStyle. The v1 walker only saw
 *     inline styles, so any element hidden via a stylesheet rule
 *     (`.hidden { display: none }`, Tailwind-style utility classes,
 *     CSS-in-JS) leaked into the snapshot as a phantom uid. Display is
 *     checked as an ancestor chain (unconditional inheritance);
 *     visibility is checked element-local because descendants can
 *     override with `visibility: visible` per CSS spec.
 *     Bbox-area / off-screen / occlusion filters are deferred — they
 *     need real layout (jsdom returns zero bboxes) and belong in a
 *     Phase 2.1b follow-up when we can drive them via DI.
 *   - Occlusion (Phase 2.1b, gated): when an overlay covers an
 *     element's bbox center (cookie banner, modal, tooltip), the
 *     walker calls the injected `elementFromPoint` at that center
 *     and skips the element if the resolved node isn't self or a
 *     descendant. Gate defaults off in the walker; content.js turns
 *     it on in production so `document.elementFromPoint` is used.
 *   - Open shadow roots: walked.  Closed shadow roots: invisible (expected).
 *   - Same-origin iframes (Phase 2.2): walker descends through
 *     `contentDocument.body` with a shared uid counter, so a button
 *     inside a Stripe-style embed is just another ref to the agent.
 *     Cross-origin frames throw on `contentDocument` access — caught
 *     and replaced with a plain-text marker line (no uid) so the
 *     agent at least knows an opaque boundary is there.
 *   - Filter modes: "interactive" (default) and "all".
 *   - depth, maxChars caps enforced; truncation signaled.
 */

import { isCenterOccluded } from "./occlusion.js";

const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);

const LANDMARK_TAG_ROLES = {
  NAV: "navigation",
  MAIN: "main",
  HEADER: "banner",
  FOOTER: "contentinfo",
  ASIDE: "complementary",
  SECTION: "region",
  ARTICLE: "article",
  FORM: "form",
  SEARCH: "search",
};

// Explicit role for every <input> type we classify. The earlier code fell
// through to "textbox" for unknown types, which mis-labeled hidden fields,
// image-submit buttons, file pickers, color pickers, etc. Now:
//   - text-like types (typed content) → textbox
//   - button-like types (value/alt is the LABEL) → button
//   - specialised controls → their ARIA role
//   - "hidden" → null (form metadata; often carries CSRF tokens, session
//     ids, and other data that MUST NOT reach the LLM)
//   - unknown type → null (no silent textbox default; a future input type
//     we haven't classified is better omitted than misrepresented)
const INPUT_TYPE_ROLES = {
  // button-like
  submit: "button",
  button: "button",
  reset: "button",
  image: "button",
  file: "button",
  // toggles / selections
  checkbox: "checkbox",
  radio: "radio",
  range: "slider",
  // text-like
  text: "textbox",
  email: "textbox",
  url: "textbox",
  tel: "textbox",
  password: "textbox",
  search: "textbox",
  number: "textbox",
  date: "textbox",
  "datetime-local": "textbox",
  month: "textbox",
  week: "textbox",
  time: "textbox",
  // explicitly excluded from the snapshot
  hidden: null,
};

const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "textbox",
  "combobox",
  "checkbox",
  "radio",
  "slider",
  "switch",
  "tab",
  "menuitem",
  "option",
]);

const STRUCTURAL_ROLES = new Set(["heading", ...Object.values(LANDMARK_TAG_ROLES)]);

const NAME_CAP = 80;

// Normalise the `contenteditable` attribute to its enumerated state per
// WHATWG. The attribute is ASCII case-insensitive and has three editable
// states ("true", "", "plaintext-only") plus one non-editable state
// ("false"). Unknown values ("inherit", "malformed") fall through so the
// walk keeps looking at ancestors.
//
// Returns: "true" (element declares itself editable, any editable state),
//          "false" (element declares itself non-editable, blocks inheritance),
//          null    (attribute absent or an unrecognised value).
function contentEditableState(node) {
  const raw = node.getAttribute?.("contenteditable");
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase();
  if (value === "false") return "false";
  if (value === "" || value === "true" || value === "plaintext-only") return "true";
  return null;
}

// Return the editing-host ancestor (inclusive) for `element`, or null if it
// isn't in an editable context. The editing host is the nearest ancestor
// (or the element itself) whose normalised contenteditable state is "true".
// An ancestor's "false" overrides deeper "true" declarations, so the walk
// stops early on "false".
//
// Compare `editingHost(el) === el` to ask "is this the editor's root
// element?" — descendants share the edit context but only the host should
// carry role=textbox in the snapshot.
function editingHost(element) {
  let node = element;
  while (node && node.nodeType === 1) {
    const state = contentEditableState(node);
    if (state === "false") return null;
    if (state === "true") return node;
    node = node.parentElement;
  }
  return null;
}

export function deriveRole(element) {
  if (!element || element.nodeType !== 1) return null;

  const tag = element.tagName;

  // Type="hidden" fails CLOSED before anything else, including the explicit
  // role attribute below. A hostile or malformed page that tags a hidden
  // input with role="button" must not smuggle CSRF tokens / session ids
  // into the snapshot — the type classification wins over author-supplied
  // ARIA here. This is the one place where "omit-by-default" needs to beat
  // "authors know best".
  if (tag === "INPUT") {
    const type = (element.getAttribute("type") || "text").toLowerCase();
    if (type === "hidden") return null;
  }

  const explicit = element.getAttribute("role");
  if (explicit && explicit.trim()) return explicit.trim().split(/\s+/)[0];

  // Generic contenteditable editors (chat composers, WYSIWYG fields, Draft.js
  // shells) rarely carry role="textbox" — the page assumes assistive tech
  // will infer editability from the attribute alone. Without this branch the
  // advertised `take_snapshot → fill({uid})` workflow regresses on a common
  // editor class.
  //
  // Emission is scoped to the editing HOST so the snapshot carries one uid
  // per editor, not one per descendant. Marking every descendant as textbox
  // would bloat the snapshot and (worse) make fill({uid}) land on unstable
  // child nodes like the span inside <p> inside the editor. Embedded
  // buttons, links, and other interactive roles inside the editor also keep
  // their real roles because they fall through to the tag branches below.
  if (editingHost(element) === element) return "textbox";

  if (tag === "BUTTON") return "button";
  if (tag === "A") return element.hasAttribute("href") ? "link" : null;
  if (tag === "TEXTAREA") return "textbox";
  if (tag === "SELECT") return "combobox";
  if (tag === "IMG") return element.hasAttribute("alt") ? "img" : null;
  if (HEADING_TAGS.has(tag)) return "heading";
  if (LANDMARK_TAG_ROLES[tag]) return LANDMARK_TAG_ROLES[tag];

  if (tag === "INPUT") {
    const type = (element.getAttribute("type") || "text").toLowerCase();
    // `hasOwn` so an explicit `null` entry shadows the unknown-type default.
    // `||` would have fallen through on null.
    if (Object.prototype.hasOwnProperty.call(INPUT_TYPE_ROLES, type)) {
      return INPUT_TYPE_ROLES[type];
    }
    return null;
  }

  return null;
}

function collapseWhitespace(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function cap(s, max = NAME_CAP) {
  if (s.length <= max) return s;
  return s.slice(0, max);
}

function escapeForAttr(s) {
  // Minimal CSS.escape fallback for attribute-selector quoting — jsdom and
  // older Chrome don't expose CSS.escape globally.
  return String(s).replace(/(["\\])/g, "\\$1");
}

// Resolve id-based lookups (label[for], aria-labelledby) scoped to the element's
// closest root FIRST, then fall back to the owning document. Labels inside an
// open shadow root don't exist on the top document, so the ownerDocument-only
// lookup silently misses them even though the walker traverses those trees.
function querySelectorInScope(element, selector) {
  const root = typeof element.getRootNode === "function" ? element.getRootNode() : null;
  if (root && typeof root.querySelector === "function") {
    try {
      const found = root.querySelector(selector);
      if (found) return found;
    } catch { /* malformed selector — fall through */ }
  }
  const doc = element.ownerDocument;
  if (doc && root !== doc && typeof doc.querySelector === "function") {
    try {
      return doc.querySelector(selector);
    } catch { /* malformed selector */ }
  }
  return null;
}

function getElementByIdInScope(element, id) {
  const root = typeof element.getRootNode === "function" ? element.getRootNode() : null;
  if (root && typeof root.getElementById === "function") {
    const found = root.getElementById(id);
    if (found) return found;
  }
  const doc = element.ownerDocument;
  if (doc && root !== doc && typeof doc.getElementById === "function") {
    return doc.getElementById(id);
  }
  return null;
}

function associatedLabelText(element) {
  const id = element.id;
  if (!id) {
    let parent = element.parentElement;
    while (parent) {
      if (parent.tagName === "LABEL") return collapseWhitespace(parent.textContent);
      parent = parent.parentElement;
    }
    return "";
  }
  const forLabel = querySelectorInScope(element, `label[for="${escapeForAttr(id)}"]`);
  if (forLabel) return collapseWhitespace(forLabel.textContent);
  let parent = element.parentElement;
  while (parent) {
    if (parent.tagName === "LABEL") return collapseWhitespace(parent.textContent);
    parent = parent.parentElement;
  }
  return "";
}

export function accessibleName(element) {
  if (!element) return "";

  const ariaLabel = element.getAttribute && element.getAttribute("aria-label");
  if (ariaLabel && ariaLabel.trim()) return cap(collapseWhitespace(ariaLabel));

  const labelledby = element.getAttribute && element.getAttribute("aria-labelledby");
  if (labelledby) {
    // Resolve ids against the element's own root first (shadow root if any),
    // then the document — aria-labelledby targets often live in the same
    // shadow tree as the control.
    const parts = labelledby.split(/\s+/).filter(Boolean).map((id) => {
      const target = getElementByIdInScope(element, id);
      return target ? collapseWhitespace(target.textContent) : "";
    }).filter(Boolean);
    if (parts.length) return cap(parts.join(" "));
  }

  const tag = element.tagName;

  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    const label = associatedLabelText(element);
    if (label) return cap(label);
    const placeholder = element.getAttribute("placeholder");
    if (placeholder && placeholder.trim()) return cap(collapseWhitespace(placeholder));
    // Button-like input types use `value` as the visible LABEL, not user-typed
    // content — <input type="submit" value="Save"> is semantically a button
    // whose text is "Save". It's safe (and necessary) to expose that. The
    // PII guard below covers text/password/email/… where value = typed data.
    if (tag === "INPUT") {
      const inputType = (element.getAttribute("type") || "text").toLowerCase();
      if (inputType === "submit" || inputType === "button" || inputType === "reset") {
        const valueAttr = element.getAttribute("value");
        if (valueAttr && valueAttr.trim()) return cap(collapseWhitespace(valueAttr));
      }
      // <input type="image"> is a graphical submit button. The `alt`
      // attribute is the accessible label (per the HTML spec), analogous to
      // <img alt=…>, and `title` is the documented secondary fallback.
      // Without this chain an image button shows up as a bare "button".
      if (inputType === "image") {
        const alt = element.getAttribute("alt");
        if (alt && alt.trim()) return cap(collapseWhitespace(alt));
        const title = element.getAttribute("title");
        if (title && title.trim()) return cap(collapseWhitespace(title));
      }
      // F19: browser-default labels for inputs whose authors omitted any
      // value / alt / label. submit / reset / file render stable strings
      // in the browser's accessibility tree and would otherwise snapshot
      // as anonymous buttons. We use stable English fallbacks (matches the
      // English system prompt and the agent's reasoning vocabulary);
      // locale-correct strings sourced from the AX tree are a follow-up.
      if (inputType === "submit") return "Submit";
      if (inputType === "reset") return "Reset";
      if (inputType === "file") return "Choose File";
      // Note: inputType === "button" intentionally has NO default. HTML
      // gives it no browser label; authors are expected to supply `value`.
    }
    // Intentionally do NOT fall back to element.value for typed inputs —
    // the user may have entered a password, OTP, or PII. The snapshot text
    // is forwarded to the LLM provider; leaking `value` is a direct
    // data-exfiltration path. See the "NEVER returns element.value" test
    // in test/snapshot.test.js for the contract.
    return "";
  }

  if (tag === "IMG") {
    const alt = element.getAttribute("alt");
    return alt ? cap(collapseWhitespace(alt)) : "";
  }

  // Buttons, links, and anything else: visible text first, then title as fallback.
  const text = collapseWhitespace(element.textContent);
  if (text) return cap(text);

  const title = element.getAttribute && element.getAttribute("title");
  if (title && title.trim()) return cap(collapseWhitespace(title));

  return "";
}

// Resolve the computed style for an element, tolerating detached nodes
// and environments without a window (defensive — shouldn't happen in
// a live page, but a missing defaultView must not crash the walker).
// Returns null when we can't determine computed style so callers can
// fall back to the attribute / inline-style checks.
function computedStyleOf(element) {
  const view = element.ownerDocument?.defaultView;
  if (!view || typeof view.getComputedStyle !== "function") return null;
  try {
    return view.getComputedStyle(element);
  } catch {
    return null;
  }
}

// Hidden-state predicate for CSS `visibility`. `collapse` is the third
// hidden state: on table rows/columns it collapses layout; on non-
// table elements the spec says to treat it like `hidden`. Common
// real-world producers: DataTables' collapsed rows, react-virtualized
// items, accordion rows mid-transition (PR #37 F1).
function visibilityHides(value) {
  return value === "hidden" || value === "collapse";
}

// Resolve the effective INLINE visibility of an element by walking
// ancestors with descendant-override semantics. Used only on the
// getComputedStyle-unavailable fallback path (detached nodes, docs
// without a defaultView). v1 walked ancestors for inline visibility;
// the first Phase 2.1 pass regressed that to element-local only, so a
// `<div style="visibility:hidden"><button>` leaked the button as a
// phantom uid in the fallback path (PR #37 F2).
//
// Returns "visible" when a descendant explicitly re-reveals, a hidden
// state name when any ancestor hides without later override, or ""
// when no inline visibility is set anywhere in the chain.
function inlineVisibilityOf(element) {
  let node = element;
  while (node && node.nodeType === 1) {
    const value = node.style?.visibility;
    // Descendant override wins — short-circuit up.
    if (value === "visible") return "visible";
    if (visibilityHides(value)) return value;
    node = node.parentElement;
  }
  return "";
}

export function isVisible(element) {
  if (!element || element.nodeType !== 1) return false;

  // `visibility` is an inheritable CSS property BUT descendants can
  // override with `visibility: visible`. Checking it during the
  // ancestor walk (below) would incorrectly hide a revealed
  // descendant inside a `visibility: hidden` container. The
  // element's OWN computed visibility already incorporates the
  // inherited value, so the correct check is element-local.
  const ownComputed = computedStyleOf(element);
  if (ownComputed) {
    if (visibilityHides(ownComputed.visibility)) return false;
  } else if (visibilityHides(inlineVisibilityOf(element))) {
    return false;
  }

  // Walk ancestors for properties that hide UNCONDITIONALLY —
  // `display: none` removes the element AND its subtree from the box
  // tree; `hidden` attr and `aria-hidden="true"` propagate by spec.
  let node = element;
  while (node && node.nodeType === 1) {
    if (node.hasAttribute && node.hasAttribute("hidden")) return false;
    const aria = node.getAttribute && node.getAttribute("aria-hidden");
    if (aria === "true") return false;
    // Phase 2.1 — consult the COMPUTED style, not just inline. The prior
    // walker only saw `element.style.display`, which means any element
    // hidden via a stylesheet rule (`.hidden { display: none }`) or a
    // framework-generated class leaked into the snapshot as a phantom
    // uid. Fallback to inline when getComputedStyle isn't available
    // (detached node, no owner window).
    const computed = computedStyleOf(node);
    if (computed) {
      if (computed.display === "none") return false;
    } else if (node.style?.display === "none") {
      return false;
    }
    node = node.parentElement;
  }
  return true;
}

// ── Walker ───────────────────────────────────────────────────

function shouldEmit(role, filter) {
  if (!role) return false;
  if (filter === "all") return true;
  // "interactive" default keeps interactive roles. Headings/landmarks stay
  // out of the default snapshot because the agent doesn't act on them; they
  // come back with filter="all" when the agent asks for layout context.
  return INTERACTIVE_ROLES.has(role);
}

function formatLine(uid, role, name) {
  return name ? `${uid} ${role} "${name}"` : `${uid} ${role}`;
}

// Phase 2.2 — detect and traverse same-origin iframes. Access to
// `contentDocument` throws SecurityError on cross-origin frames per
// the same-origin policy; a try/catch is the standard way to decide
// traversable-vs-opaque. Returns the iframe's <body> element on
// success, null when the frame is cross-origin or has no document.
function sameOriginIframeBody(element) {
  if (!element || element.tagName !== "IFRAME") return null;
  try {
    return element.contentDocument?.body ?? null;
  } catch {
    return null;
  }
}

// PR #39 F2 — iframe labels reach the LLM via the snapshot text,
// so they inherit the snapshot's two hardening passes:
//   * collapseWhitespace neutralises newline-based line injection
//     (e.g. `title="\nref_0_99 button 'Fake'"` previously fabricated
//     what looked like a legitimate ref line).
//   * cap() keeps page-controlled strings from blowing the char
//     budget. 120 chars is looser than the 80-char NAME_CAP used for
//     element names — origin+pathname URLs are legitimately longer
//     than a button label.
const IFRAME_LABEL_CAP = 120;

function safeMarkerText(value) {
  return cap(collapseWhitespace(value || ""), IFRAME_LABEL_CAP);
}

// Sanitise a cross-origin iframe `src` into a label that preserves
// useful context (origin + pathname — the agent can still see
// "Stripe checkout is here") while stripping query string and
// fragment — the two places where credential material typically
// lives (OAuth codes, session tokens, access_token fragments).
// Non-http(s) schemes (blob:, data:, javascript:, filesystem:) get a
// bare scheme name because their full values are rarely informative
// and can be arbitrarily large.
function safeIframeSrcLabel(element) {
  const raw = element.getAttribute?.("src");
  if (!raw || !raw.trim()) return "";
  try {
    const url = new URL(raw, element.ownerDocument?.baseURI || undefined);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return `${url.origin}${url.pathname}`;
    }
    return `${url.protocol.replace(/:$/, "")} iframe`;
  } catch {
    return "";
  }
}

// Human-readable label for a cross-origin iframe the walker can't
// descend into. Prefers `title` (the spec-intended a11y name) which
// page authors curate, then `name`, then a sanitised `src` — src
// moved to last because it's the most likely carrier of credential
// material in its raw form. The label lands in the snapshot text so
// the agent can reason about "there's a payment form here" without
// having a uid to click.
function iframeLabel(element) {
  return (
    safeMarkerText(element.getAttribute?.("title")) ||
    safeMarkerText(element.getAttribute?.("name")) ||
    safeMarkerText(safeIframeSrcLabel(element)) ||
    "(unknown)"
  );
}

// Detect cross-origin without returning a body (for marker emission).
function isCrossOriginIframe(element) {
  if (!element || element.tagName !== "IFRAME") return false;
  try {
    // Touching contentDocument is enough — a cross-origin frame
    // throws here, a same-origin frame (even empty) returns a doc.
    return element.contentDocument == null && !!element.src;
  } catch {
    return true;
  }
}

function iterateChildren(element) {
  // Combines direct children + open shadow-root children + same-origin
  // iframe body. Iframes announce their content through `contentDocument`
  // rather than the DOM `children` list, so the walker has to reach
  // across the frame boundary explicitly.
  const out = [];
  if (element.shadowRoot) {
    for (const c of element.shadowRoot.children) out.push(c);
  }
  for (const c of element.children) out.push(c);
  const frameBody = sameOriginIframeBody(element);
  if (frameBody) out.push(frameBody);
  return out;
}

export function takeSnapshot(root, opts = {}) {
  const filter = opts.filter || "interactive";
  const maxDepth = opts.depth ?? 30;
  const maxChars = opts.maxChars ?? 8000;
  // version is baked into every uid so a stale ref from an earlier snapshot
  // can never collide with a newly minted one (see refmap.js F21 notes).
  // Production passes the version returned by refmap.bumpSeal; tests that
  // exercise the walker directly default to 0 ("unversioned / test").
  const version = Number.isFinite(opts.version) ? opts.version : 0;
  // Phase 2.3 — pagination. `offset` skips the first N emittable
  // elements (not every walked node; headings / landmarks we don't
  // emit under the "interactive" filter don't count). Ordinal numbering
  // continues globally: with offset=50, refs are `ref_V_51, ref_V_52…`
  // so page 1's uids never collide with page 2's. `startingRefId`
  // overrides when both are set (direct unit-test escape hatch).
  const offset = Number.isFinite(opts.offset) && opts.offset > 0 ? Math.floor(opts.offset) : 0;
  let skipRemaining = offset;
  let nextId = opts.startingRefId ?? offset + 1;

  // Phase 2.1b — occlusion filter. Gated because `elementFromPoint`
  // forces sync layout per call and jsdom can't run it. Production
  // passes `document.elementFromPoint.bind(document)` + gate on.
  // Direct walker tests default to off so they don't need to thread
  // an impl through every call.
  const filterOccluded = opts.filterOccluded === true;
  const elementFromPoint = typeof opts.elementFromPoint === "function"
    ? opts.elementFromPoint
    : null;

  const lines = [];
  const refs = [];
  let truncated = false;
  let charCount = 0;

  function append(line) {
    const added = (charCount === 0 ? 0 : 1) + line.length; // +1 for newline
    if (charCount + added > maxChars) {
      truncated = true;
      return false;
    }
    lines.push(line);
    charCount += added;
    return true;
  }

  function walk(node, depth) {
    if (truncated) return;
    if (!node || node.nodeType !== 1) return;
    if (!isVisible(node)) return;

    const role = deriveRole(node);
    if (shouldEmit(role, filter)) {
      // Phase 2.1b — occlusion check is the FINAL emittability gate.
      // Ordered before the pagination counter so an occluded element
      // is treated as if it didn't exist: it does NOT consume an
      // offset slot. Keeps offset math consistent across pages — an
      // agent on page 2 with offset=N lands on the same emittable
      // content regardless of overlay state.
      const occluded = filterOccluded && elementFromPoint &&
        typeof node.getBoundingClientRect === "function" &&
        isCenterOccluded(node, node.getBoundingClientRect(), { elementFromPoint });
      if (occluded) {
        // skip silently — phantom ref behind an overlay
      } else if (skipRemaining > 0) {
        // Count the skipped emittable element but do not register a
        // uid — page 1's ordinals must match what page 2 excludes.
        skipRemaining -= 1;
      } else {
        const uid = `ref_${version}_${nextId++}`;
        const name = accessibleName(node);
        const line = formatLine(uid, role, name);
        if (!append(line)) return;
        refs.push({ uid, element: node });
      }
    }

    // Phase 2.2 — cross-origin iframe marker. The walker can't see
    // inside, but the agent needs context ("Stripe checkout is
    // here"). No uid because the iframe element itself isn't a
    // sensible action target — markers are positional context, not
    // handles. Pagination-safe: markers don't advance skipRemaining
    // (they aren't refs) so offset math stays consistent.
    if (node.tagName === "IFRAME" && isCrossOriginIframe(node)) {
      if (!append(`[cross-origin iframe: ${iframeLabel(node)}]`)) return;
    }

    if (depth <= 0) return;
    for (const child of iterateChildren(node)) {
      walk(child, depth - 1);
      if (truncated) return;
    }
  }

  // The root itself is considered depth 0 for counting purposes: a depth=2 call
  // walks the root → its children → their children.
  if (root) {
    if (root.nodeType === 9 /* DOCUMENT_NODE */) {
      for (const child of root.documentElement ? [root.documentElement] : []) walk(child, maxDepth);
    } else {
      walk(root, maxDepth);
    }
  }

  // Phase 4.1 — snapshot context. Expose the document's URL + title
  // so the agent doesn't need `evaluate_script("location.href")` to
  // answer "what page am I on" after a navigate / redirect / click
  // that changed the page. Reachable on `root` when it's a Document
  // or via `ownerDocument` when it's an Element. URL is NOT
  // sanitised here — the agent needs honest positional context, and
  // redacting would mislead about where they actually are (the
  // iframe-label sanitisation covers the page-controlled-label
  // attack surface, which is different).
  const doc = root && (root.nodeType === 9 ? root : root.ownerDocument);
  const url = doc && typeof doc.URL === "string" ? doc.URL : "";
  const title = doc && typeof doc.title === "string" ? doc.title : "";

  // Phase 2.3 — pagination cursor. When truncation cut the walk
  // short, next_offset tells the agent how to resume without
  // re-walking from zero and without missing refs between pages.
  // null when the walk ran to completion — the "no more pages"
  // signal the agent reads to stop paginating.
  //
  // PR #38 F1 — page-overflow edge case: truncation with zero refs
  // emitted on this page means maxChars cannot fit even one line.
  // The old math (next_offset = offset + refs.length) returned the
  // input offset unchanged, so an agent following the documented
  // pagination protocol looped forever on the same empty page.
  // Break the loop with a null cursor + explicit `page_overflow`
  // flag so callers can translate it into an actionable error
  // ("raise max_chars") rather than silently stopping.
  if (truncated && refs.length === 0) {
    return { text: "", refs, url, title, truncated: true, next_offset: null, page_overflow: true };
  }
  const next_offset = truncated ? offset + refs.length : null;
  return { text: lines.join("\n"), refs, url, title, truncated, next_offset };
}
