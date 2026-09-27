/**
 * Coordinate math shared by the overlay (screenshot label) path and
 * the uid action dispatcher (click / fill / scroll / drag).
 *
 * PR #39 F1: before this module, `iframeChainOffset` lived in
 * overlay.js and `bboxCenterOf` lived in content.js — the two paths
 * couldn't be kept in lockstep. The overlay path translated iframe
 * coords into top-document space; the action path did NOT, so
 * uid-targeted clicks inside a same-origin iframe dispatched to the
 * wrong top-page coordinates. One shared module forces both paths
 * through the same transform.
 *
 * Everything here is sync and DOM-API-only so it loads under jsdom
 * without shims. Pure with respect to inputs; no module state.
 */

/**
 * Sum the `getBoundingClientRect` offsets of every frame element in
 * the chain from an element up to the top document.
 *
 * Returns `{dx: 0, dy: 0}` for elements in the top document (the
 * `frameElement` is null), so callers can always add the offset
 * unconditionally.
 *
 * Cross-origin frames: `ownerDocument.defaultView.frameElement`
 * access throws a SecurityError per same-origin policy, which would
 * never happen from OUR side (we only ever hold refs to elements in
 * frames we could walk into — same-origin by construction). Still
 * tolerates a missing getBoundingClientRect defensively.
 */
export function iframeChainOffset(element) {
  let dx = 0;
  let dy = 0;
  let frame = element?.ownerDocument?.defaultView?.frameElement;
  while (frame && typeof frame.getBoundingClientRect === "function") {
    const rect = frame.getBoundingClientRect();
    if (rect) {
      dx += rect.x || 0;
      dy += rect.y || 0;
    }
    frame = frame.ownerDocument?.defaultView?.frameElement;
  }
  return { dx, dy };
}

/**
 * Resolve the correct hit-test authority for an element.
 *
 * Hit testing (`elementFromPoint`) is NOT a single-doc concern. An
 * element's coordinate-space root depends on where it lives:
 *   - top document          → `document.elementFromPoint`
 *   - same-origin iframe    → that iframe's `Document.elementFromPoint`
 *   - open shadow root      → `shadowRoot.elementFromPoint`
 *     (top-doc hit tests return the shadow HOST, not the inner
 *      element, because they don't pierce the shadow boundary)
 *
 * `element.getRootNode()` is the universal answer — per the WHATWG
 * DOM spec it returns whichever `DocumentOrShadowRoot` the element
 * lives in. Falls back to `ownerDocument` only when `getRootNode`
 * isn't available or its result lacks `elementFromPoint` (exotic
 * detached fragments). Returns `null` when no hit test is possible —
 * callers MUST treat this as "cannot determine" rather than
 * "occluded" to avoid silently dropping refs (PR #40 F1).
 */
export function hitTestRootFor(element) {
  if (!element) return null;
  if (typeof element.getRootNode === "function") {
    const root = element.getRootNode();
    if (root && typeof root.elementFromPoint === "function") return root;
  }
  const ownerDoc = element.ownerDocument;
  if (ownerDoc && typeof ownerDoc.elementFromPoint === "function") return ownerDoc;
  return null;
}

/**
 * Compute the rounded pixel center of an element in TOP-document
 * coordinates. CDP `Input.dispatchMouseEvent` uses top-frame viewport
 * space, so the iframe chain offset must be summed in or clicks on
 * iframe-interior elements land on the wrong top-page pixel.
 *
 * Returns null when the element has no bounding rect API, no rect,
 * or a zero-area rect (the caller's error path distinguishes between
 * stale-ref and not-visible-enough).
 */
export function bboxCenter(element) {
  if (!element || typeof element.getBoundingClientRect !== "function") return null;
  const r = element.getBoundingClientRect();
  if (!r) return null;
  if (r.width === 0 && r.height === 0) return null;
  const { dx, dy } = iframeChainOffset(element);
  return {
    x: Math.round(r.left + dx + r.width / 2),
    y: Math.round(r.top + dy + r.height / 2),
  };
}
