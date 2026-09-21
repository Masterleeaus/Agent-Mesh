/**
 * Phase 2.1b — occlusion detection.
 *
 * Completes the Phase 2 perception loop: the walker's visibility
 * filter catches `display:none` / `visibility:hidden` / `collapse`,
 * but a visually-visible element can still be covered by a
 * z-indexed overlay (modal, cookie banner, tooltip, auth dialog).
 * Clicking at its bbox center then hits the overlay, not the button.
 *
 * The canonical browser technique is `document.elementFromPoint(x, y)`
 * at the element's center. If the point resolves to a different,
 * non-descendant element, the intended target is occluded.
 *
 * jsdom has no layout, so this module takes `elementFromPoint` via
 * DI. Production binds `document.elementFromPoint`; tests stub it to
 * simulate scenarios (descendant, overlay, null, missing impl).
 */

/**
 * Is the given element's bbox center covered by a different element?
 *
 * Returns true ONLY when we can affirmatively prove occlusion. Every
 * ambiguous case (no `elementFromPoint`, point off-screen, zero-area
 * bbox) returns false — we default to NOT filtering because a false
 * filter silently drops legitimate refs, while a missed filter falls
 * back to the existing click-lands-on-overlay failure (visible to
 * eval, recoverable by retry). Biased toward recall, not precision.
 *
 * The `elementFromPoint` impl receives `(x, y, element)` — the
 * element is passed so the impl can pick the right coordinate-space
 * authority. THREE boundary types where naive hit testing breaks
 * (PR #40 F1, both rounds):
 *   1. Same-origin iframes — bbox coords live in iframe-viewport
 *      space; top-doc hit tests return the iframe host.
 *   2. Open shadow roots — top-doc hit tests return the shadow HOST
 *      (don't pierce the shadow boundary), not the inner element.
 *   3. Top document — works correctly with any document root.
 * The canonical answer is `element.getRootNode()` — returns the
 * right `DocumentOrShadowRoot` in every case. See
 * `coords.js::hitTestRootFor` for the production resolver.
 *
 * Stubs that ignore the third arg work for scenarios where element
 * location is irrelevant (the unit-test simple cases).
 */
export function isCenterOccluded(element, bbox, { elementFromPoint } = {}) {
  if (typeof elementFromPoint !== "function") return false;
  if (!bbox || !(bbox.width > 0) || !(bbox.height > 0)) return false;

  const cx = bbox.left + bbox.width / 2;
  const cy = bbox.top + bbox.height / 2;
  const hit = elementFromPoint(cx, cy, element);

  // Point off-screen or document root empty — can't determine.
  if (!hit) return false;
  // Self-hit — not occluded.
  if (hit === element) return false;
  // Descendant hit — button's child <span> commonly sits at the
  // center; that's not occlusion, it's normal DOM composition.
  if (typeof element.contains === "function" && element.contains(hit)) return false;

  return true;
}
