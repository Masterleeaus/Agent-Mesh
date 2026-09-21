/**
 * Phase 2.4 — numbered-overlay screenshot (context-agnostic helpers).
 *
 * Companion module to `attach-screenshot.js`. When the agent opts into
 * `include_screenshot:true`, we can go one step further than "bare
 * pixel view" and draw each snapshotted ref's ordinal over the element
 * it points to. The model then sees the ordinal in BOTH the text
 * snapshot (`ref_1_5 button "Submit"`) and on the image (a small "5"
 * box over the Submit button), collapsing visual disambiguation from
 * "find the blue button" into "find the 5".
 *
 * Pipeline (top → bottom in this file):
 *   labelForUid          uid → short display label ("ref_1_5" → "5")
 *   computeLabelPlacement bbox + scale → image-space box + text anchor
 *   layoutOverlays       batch: filter off-screen / zero-area, label, place
 *   drawOverlayCommands  paint a batch onto any 2D-context-shaped target
 *
 * The draw helper takes a context object, not a real OffscreenCanvas,
 * so this whole module loads under jsdom without a renderer shim. The
 * service-worker glue plugs an actual OffscreenCanvas 2D context in.
 */

// ── Typography + palette ──────────────────────────────────────
//
// Tuned for a 1568-wide downscaled screenshot at ~28 px/token. Single
// digit labels sit in a ~17×18 box; triple-digit labels stay under
// ~35px wide. Constants live at module scope so a future renderer
// change (e.g. HiDPI bump or palette swap) has one place to edit.

const LABEL_FONT_PX = 14;
// 0.6em per glyph approximates a sans-serif digit advance. We can't
// use Canvas.measureText here — this module runs under jsdom in tests
// and must not depend on the renderer. Deliberately generous so
// rounded labels never clip the last glyph.
const GLYPH_ADVANCE = 0.6;
const LABEL_PAD_X = 4;
const LABEL_PAD_Y = 2;

// High-contrast defaults matching the Browser Use / OmniParser
// overlay convention: yellow fill, black glyphs.
const LABEL_BG = "rgba(255,215,0,0.9)";
const LABEL_FG = "#000";

// ── Label text ────────────────────────────────────────────────

/**
 * Short label drawn on the image for a snapshot uid.
 *
 * Snapshot uids are `ref_{version}_{ordinal}` — we draw only the
 * ordinal because the version is constant for every label in the same
 * image (so redundant), and the "ref_" prefix balloons the label box
 * so much it occludes the element it's supposed to annotate.
 */
export function labelForUid(uid) {
  const m = /^ref_\d+_(\d+)$/.exec(String(uid ?? ""));
  return m ? m[1] : String(uid ?? "");
}

// ── Placement (single bbox) ───────────────────────────────────

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map a viewport-space bbox to an image-space label placement.
 *
 * The label is anchored at the bbox's top-left corner — the common
 * convention in set-of-mark / indexed-DOM screenshots (OmniParser,
 * Browser Use, SeeAct) because corner placement avoids occluding the
 * element content the model is trying to see.
 *
 * Coordinates are in IMAGE pixels. Callers draw via OffscreenCanvas
 * already scaled to the captured image, so no extra transform is
 * needed at render time.
 *
 * When `imageWidth`/`imageHeight` are supplied, the label box is
 * clamped to stay fully inside the image — necessary for partially
 * visible edge elements (PR #36 F2). `isOnScreen` keeps them in the
 * draw list because their pixels ARE in the capture; clamping keeps
 * their labels in the capture too, so the text↔pixel ordinal
 * correspondence survives viewport-edge cases. Params are optional
 * for callers that don't know the image dimensions (direct unit
 * tests), who get the raw anchored box.
 */
export function computeLabelPlacement({ label, bbox, scale = 1, imageWidth, imageHeight } = {}) {
  const text = String(label ?? "");
  // Integer pixels — subpixel positions blur under canvas
  // antialiasing, especially on small labels where the blur is a
  // significant fraction of the glyph.
  const rawBoxX = Math.round(bbox.x * scale);
  const rawBoxY = Math.round(bbox.y * scale);
  const boxW = Math.ceil(text.length * LABEL_FONT_PX * GLYPH_ADVANCE) + 2 * LABEL_PAD_X;
  const boxH = LABEL_FONT_PX + 2 * LABEL_PAD_Y;
  const boxX = Number.isFinite(imageWidth)
    ? clamp(rawBoxX, 0, Math.max(0, imageWidth - boxW))
    : rawBoxX;
  const boxY = Number.isFinite(imageHeight)
    ? clamp(rawBoxY, 0, Math.max(0, imageHeight - boxH))
    : rawBoxY;
  // Text anchor points the renderer at ctx.fillText(label, textX, textY).
  // fillText draws upward from the baseline — so textY sits `fontPx`
  // below the box top (+ top padding), not at the box top.
  const textX = boxX + LABEL_PAD_X;
  const textY = boxY + LABEL_PAD_Y + LABEL_FONT_PX;
  return { boxX, boxY, boxW, boxH, textX, textY, fontPx: LABEL_FONT_PX };
}

// ── Content-script glue: refs → bboxes ───────────────────────

/**
 * Map `{uid, element}` refs from `takeSnapshot` to `{uid, bbox}`
 * entries ready for `layoutOverlays`. Runs in the content script
 * where the DOM is available.
 *
 * Silently drops refs whose element cannot report a bbox (detached
 * nodes, stubs without the API). Callers don't have to pre-validate
 * their refs — the walker emits elements it considers visible but
 * that doesn't guarantee a live DOM node at overlay time.
 */
// PR #39 F1 — `iframeChainOffset` now lives in `src/perception/coords.js`
// so the overlay path and the uid action dispatcher share the same
// top-document transform. Keeping two copies let clicks on iframe
// interiors drift from the labels drawn on top of them.
import { iframeChainOffset } from "./coords.js";

export function bboxesForRefs(refs) {
  if (!Array.isArray(refs) || refs.length === 0) return [];
  const out = [];
  for (const ref of refs) {
    if (!ref || typeof ref.element?.getBoundingClientRect !== "function") continue;
    const rect = ref.element.getBoundingClientRect();
    if (!rect) continue;
    const { dx, dy } = iframeChainOffset(ref.element);
    out.push({
      uid: ref.uid,
      bbox: {
        x: rect.x + dx,
        y: rect.y + dy,
        width: rect.width,
        height: rect.height,
      },
    });
  }
  return out;
}

// ── Layout (batch) ────────────────────────────────────────────

// A bbox is "on-screen" when it has positive area AND overlaps the
// captured viewport. Off-screen elements (scrolled, negative coords,
// or past the far edge) have no pixels in the image, so a label there
// would float over empty space. Zero-area bboxes come from detached
// or collapsed elements where drawing a label would mislead the model
// about what's actionable.
function isOnScreen(bbox, viewport) {
  if (!bbox) return false;
  const { x, y, width, height } = bbox;
  if (!(width > 0) || !(height > 0)) return false;
  if (x + width <= 0) return false;
  if (y + height <= 0) return false;
  if (x >= viewport.width) return false;
  if (y >= viewport.height) return false;
  return true;
}

/**
 * Batch API: map a snapshot's refs to overlay draw commands.
 *
 * Filters invisible / off-viewport items, strips the `ref_V_` prefix
 * to a short ordinal label, and computes image-space placement. The
 * returned list is ready for a plain `for (const p of out) draw(p)`
 * loop in the SW-side renderer.
 */
export function layoutOverlays({ items, viewport, scale = 1 } = {}) {
  if (!Array.isArray(items) || items.length === 0) return [];
  // Image dimensions in PIXELS = CSS viewport × scale (devicePixelRatio
  // in the current capture path; multiply in any post-capture downscale
  // here when we add one). Used to clamp edge labels inside the image.
  const imageWidth = Math.round(viewport.width * scale);
  const imageHeight = Math.round(viewport.height * scale);
  const out = [];
  for (const item of items) {
    if (!item || !isOnScreen(item.bbox, viewport)) continue;
    const label = labelForUid(item.uid);
    const placement = computeLabelPlacement({
      label,
      bbox: item.bbox,
      scale,
      imageWidth,
      imageHeight,
    });
    out.push({ uid: item.uid, label, ...placement });
  }
  return out;
}

// ── Renderer (any 2D-context-shaped target) ───────────────────

/**
 * Draw a batch of overlay placements onto a 2D context.
 *
 * Pure with respect to the context's pre-existing transform — we do
 * NOT save/restore, scale, or translate. Callers own the transform
 * (they've already drawn the screenshot bitmap into the canvas at
 * image-native coordinates). This keeps the draw helper free of
 * OffscreenCanvas-specific state and trivially testable against a
 * stub that records calls.
 *
 * Draw order per placement: background rect FIRST, text glyph
 * SECOND. Reversing these would hide the label under its own fill.
 */
export function drawOverlayCommands(ctx, placements) {
  if (!Array.isArray(placements) || placements.length === 0) return;
  for (const p of placements) {
    ctx.fillStyle = LABEL_BG;
    ctx.fillRect(p.boxX, p.boxY, p.boxW, p.boxH);
    ctx.fillStyle = LABEL_FG;
    ctx.font = `${p.fontPx}px sans-serif`;
    ctx.fillText(p.label, p.textX, p.textY);
  }
}
