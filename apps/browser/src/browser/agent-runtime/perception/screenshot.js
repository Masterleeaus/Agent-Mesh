/**
 * Screenshot capture and target-size math.
 *
 * v1 scope:
 *  - `fitWithinMaxEdge` — pure, deterministic sizing. Used to pick a post-capture
 *    downscale factor so the image's longest edge ≤ maxEdge, preserving aspect.
 *  - `takeScreenshot` — thin CDP wrapper. Calls Page.captureScreenshot via the
 *    injected driver and returns {data, format} on success or {error, format}
 *    on failure.
 *
 * Out of scope here: the actual pixel downscale happens in the service worker
 * using OffscreenCanvas (createImageBitmap → drawImage on a sized canvas →
 * convertToBlob). OffscreenCanvas isn't available in jsdom, so that bit is
 * verified manually. Keeping the math separate makes the behavior reviewable.
 *
 * Default `maxEdge` of 1568 comes from Claude for Chrome's token-optimised
 * screenshot: at pxPerToken=28, a 1568×896 image encodes to ~1793 vision
 * tokens — the sweet spot between detail and cost.
 */
import { screenshotParams } from "../cdp/wire.js";

export const DEFAULT_MAX_EDGE = 1568;

export function fitWithinMaxEdge({ width, height }, maxEdge = DEFAULT_MAX_EDGE) {
  if (!Number.isFinite(width) || width <= 0 ||
      !Number.isFinite(height) || height <= 0 ||
      !Number.isFinite(maxEdge) || maxEdge <= 0) {
    throw new Error("fitWithinMaxEdge: width, height, and maxEdge must be positive finite numbers");
  }
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height, scale: 1 };
  }
  const scale = maxEdge / longest;
  // Clamp each scaled edge to at least 1 pixel. A naive Math.floor can
  // collapse the minor edge of a very skinny capture (e.g. 1×10000 scaled
  // to fit 100) to 0, which would throw in the downstream canvas path or
  // produce a blank image. One-pixel-wide is the honest minimum.
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    scale,
  };
}

export async function takeScreenshot(driver, tabId, opts = {}) {
  const params = screenshotParams(opts);
  const format = params.format;
  try {
    const result = await driver.send(tabId, "Page.captureScreenshot", params);
    return { data: result.data, format };
  } catch (err) {
    return { error: err.message, format };
  }
}
