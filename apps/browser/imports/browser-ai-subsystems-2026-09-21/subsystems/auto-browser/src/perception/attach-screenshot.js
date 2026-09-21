/**
 * Screenshot-in-prompt — trigger policy + pure merge.
 *
 * Phase 1.2 from the SOTA adoption plan. Visual disambiguation ("click
 * the blue button," canvas UIs, repeated-text elements) is where text-
 * only baselines collapse on WebVoyager, so we support pairing a JPEG
 * viewport with the accessibility-tree text when the agent asks for it.
 *
 * WebMCP-first positioning shapes the trigger policy: `take_snapshot`
 * fires on MOST ReAct turns (orientation + WebMCP-gap filling), so
 * always-pair would add ~1500 image tokens to nearly every turn and
 * destroy the "fast and token-efficient" pitch. Policy is therefore
 * opt-in per call — the agent sets `include_screenshot: true` when the
 * task semantics warrant a pixel view (see `shouldAttachScreenshot`).
 *
 * This module owns ONLY the policy decision and the pure merge. The
 * screenshot is captured upstream (content.js handleTakeScreenshot →
 * background.js → CDP); we take both results as inputs and return a
 * combined result. Zero DOM / chrome mocks required to test.
 */

/**
 * Trigger policy — returns true when a `take_snapshot` call should ALSO
 * capture a screenshot and attach it via the side-channel.
 *
 * Policy (WebMCP-first, token-efficient by default):
 *   - Opt-IN. Agent must set `input.include_screenshot: true`. Absent or
 *     explicit false ⇒ text-only snapshot. Routine uid-refresh turns and
 *     semantic-orient turns stay cheap.
 *   - System can HARD-BLOCK via `config.screenshotInPrompt: false`.
 *     Privacy / cost-capped runs must be able to override the agent.
 */
export function shouldAttachScreenshot({ input, config } = {}) {
  if (!input || input.include_screenshot !== true) return false;
  if (config && config.screenshotInPrompt === false) return false;
  return true;
}

export function attachScreenshotToSnapshot(snapshotResult, screenshotResult) {
  if (!snapshotResult || snapshotResult.error) {
    // Snapshot itself failed — surface the error cleanly. Adding a
    // pixel view to an error result would mislead the model into
    // reasoning about the image instead of the failure.
    return snapshotResult;
  }
  if (!screenshotResult || screenshotResult.error || !screenshotResult.__image) {
    // Screenshot capture failed — return snapshot untouched. Partial
    // merges would mislead the model (missing __image with a truthy
    // screenshot_attached flag, etc.) and the text snapshot alone is
    // still a valid turn.
    return snapshotResult;
  }
  return {
    ...snapshotResult,
    screenshot_attached: true,
    screenshot_bytes: screenshotResult.size_bytes,
    __image: screenshotResult.__image,
  };
}
