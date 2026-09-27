/**
 * Phase 2.4 — service-worker overlay renderer.
 *
 * Orchestrates the OffscreenCanvas pipeline that paints the overlay
 * placements (produced by overlay.js::layoutOverlays) onto a captured
 * screenshot.
 *
 * Pipeline:
 *   base64 → Blob → ImageBitmap → OffscreenCanvas(ctx.drawImage) →
 *   drawOverlayCommands → convertToBlob → base64
 *
 * All platform APIs are INJECTABLE so this module loads under jsdom
 * for tests. Production call passes the global implementations.
 *
 * Why this isn't folded into overlay.js: that file is imported from
 * the content script (loaded via dynamic import). OffscreenCanvas is
 * available there too, but binding the canvas/bitmap APIs to a
 * separate module keeps the pure math free of DOM adapters and
 * localizes the "impure" surface for mocking.
 */
import { drawOverlayCommands } from "./overlay.js";

// Built-in base64 ↔ bytes converters — the service worker has `atob`
// and `btoa`. These stay non-exported because they're plumbing; we
// inject an alternative `blobToBase64Impl` in tests when we want a
// deterministic sentinel.
function base64ToBlob(base64, mime) {
  const bytes = atob(base64);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new Blob([buf], { type: mime });
}

async function defaultBlobToBase64(blob) {
  // Chunked btoa to avoid stack overflow on large images — a 1568-wide
  // PNG can run to ~1MB; String.fromCharCode(...bytes) blows the argv
  // limit once you cross ~100k chars.
  const buf = new Uint8Array(await blob.arrayBuffer());
  const CHUNK = 0x8000;
  let bin = "";
  for (let i = 0; i < buf.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, buf.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/**
 * Render a screenshot with overlay labels burned into the pixels.
 *
 * Returns `{data, mime}` on success or `{error, mime}` on failure.
 * Matches the shape `takeScreenshot` returns so the background-side
 * caller can forward either directly.
 *
 * When `placements` is empty, skips the entire canvas pipeline and
 * returns the input unchanged — a no-op re-encode would burn CPU
 * and potentially change file size for no visual gain.
 */
export async function renderOverlayedScreenshot({
  base64Data,
  mime,
  placements,
  // Injected platform APIs (override in tests).
  createImageBitmapImpl = globalThis.createImageBitmap,
  OffscreenCanvasImpl = globalThis.OffscreenCanvas,
  blobToBase64Impl = defaultBlobToBase64,
} = {}) {
  if (!Array.isArray(placements) || placements.length === 0) {
    return { data: base64Data, mime };
  }

  let bitmap;
  try {
    const srcBlob = base64ToBlob(base64Data, mime);
    bitmap = await createImageBitmapImpl(srcBlob);
  } catch (err) {
    return { error: err.message, mime };
  }

  try {
    const canvas = new OffscreenCanvasImpl(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    // Base image first, labels second — reversing would hide the
    // labels under the screenshot.
    ctx.drawImage(bitmap, 0, 0);
    drawOverlayCommands(ctx, placements);
    const outBlob = await canvas.convertToBlob({
      type: mime,
      // JPEG quality 0.85 — slightly above Chrome's default (0.92 is
      // the spec default for web canvas, but CDP captures at 60 in our
      // flow; we re-encode at 0.85 to avoid a perceptible quality cliff
      // while not inflating the file).
      ...(mime === "image/jpeg" ? { quality: 0.85 } : {}),
    });
    const data = await blobToBase64Impl(outBlob);
    return { data, mime };
  } catch (err) {
    // PR #36 F1 — honor the {error,mime} contract end-to-end. A
    // thrown failure here (missing OffscreenCanvas, getContext
    // returning null and .drawImage throwing on null, convertToBlob
    // rejecting, …) would otherwise escape up to background.js's
    // async IIFE and strand the content script on its 15s timer.
    return { error: err.message, mime };
  } finally {
    bitmap.close?.();
  }
}
