/**
 * `resolveUidToCoords` — uid → viewport coords for the action dispatcher.
 *
 * Extracted from content.js so Phase 3.x behavior (scroll-into-view,
 * coming later: post-action settle wait, stale-ref retry) can be
 * unit-tested in isolation. Refmap + bboxCenter + scrollIntoView are
 * injected so this module has no DOM / chrome-API dependency and
 * runs cleanly under jsdom.
 *
 * Phase 3.1 — scrolls the resolved element to viewport CENTER before
 * reading its bbox. Without this, CDP dispatches at the element's
 * raw `top + height/2` viewport coordinate, which is off-screen for
 * any below-the-fold target — the click then lands on whatever
 * happens to be at the viewport edge, or nothing.
 */

function defaultScrollIntoView(element) {
  if (typeof element.scrollIntoView !== "function") return;
  // {block:"center", inline:"center"} centers the bbox in the
  // viewport so the post-scroll bbox is fully on-screen even for
  // elements near page edges.
  // behavior:"instant" — smooth scroll would race CDP's dispatch
  // (we'd dispatch at the start position before the animation
  // completes; CDP doesn't await CSS transitions).
  element.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
}

export function resolveUidToCoords(uid, { refmap, bboxCenter, scrollIntoView } = {}) {
  if (typeof uid !== "string" || !uid) {
    return { error: "Action requires a 'uid' from the most recent take_snapshot." };
  }
  if (!refmap) {
    return { error: "No snapshot yet. Call take_snapshot before addressing elements by uid." };
  }
  const el = refmap.get(uid);
  if (!el) {
    return { error: `${uid} is stale or unknown. Call take_snapshot again.` };
  }
  // Phase 3.1 — scroll BEFORE bbox read. `null` opts out entirely;
  // `undefined` uses the default impl. A custom function lets future
  // dispatch flows pass their own scroll strategy without forking
  // the resolver.
  if (scrollIntoView !== null) {
    const impl = scrollIntoView ?? defaultScrollIntoView;
    impl(el);
  }
  const center = bboxCenter(el);
  if (!center) {
    return { error: `${uid} has no visible bounding rect (detached, hidden, or off-screen).` };
  }
  return center;
}
