/**
 * Browser emulation: viewport size + user agent override.
 *
 * setViewport()    — Emulation.setDeviceMetricsOverride. Default
 *                    deviceScaleFactor=1, mobile=false. Overrides persist for
 *                    the tab until clearEmulation or tab close — they do NOT
 *                    auto-reset on navigation.
 *
 * setUserAgent()   — Emulation.setUserAgentOverride. Overrides also persist
 *                    until cleared or tab close.
 *
 * clearEmulation() — restores the tab to its default viewport + UA.
 *                    Sends both clear commands; the CDP layer no-ops them
 *                    when no override was set, so this is always safe to call.
 */

function widthError() { return { error: "set_viewport: 'width' must be a positive finite number." }; }
function heightError() { return { error: "set_viewport: 'height' must be a positive finite number." }; }
function uaError() { return { error: "set_user_agent: 'userAgent' must be a non-empty string." }; }

export async function setViewport(driver, tabId, params = {}) {
  const { width, height, deviceScaleFactor = 1, mobile = false } = params;
  if (!Number.isFinite(width) || width <= 0) return widthError();
  if (!Number.isFinite(height) || height <= 0) return heightError();
  try {
    await driver.send(tabId, "Emulation.setDeviceMetricsOverride", {
      width, height, deviceScaleFactor, mobile,
    });
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function setUserAgent(driver, tabId, params = {}) {
  const ua = typeof params.userAgent === "string" ? params.userAgent.trim() : "";
  if (!ua) return uaError();
  try {
    const cdpParams = { userAgent: ua };
    if (typeof params.acceptLanguage === "string" && params.acceptLanguage) {
      cdpParams.acceptLanguage = params.acceptLanguage;
    }
    if (typeof params.platform === "string" && params.platform) {
      cdpParams.platform = params.platform;
    }
    await driver.send(tabId, "Emulation.setUserAgentOverride", cdpParams);
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function clearEmulation(driver, tabId) {
  try {
    await driver.send(tabId, "Emulation.clearDeviceMetricsOverride", {});
    // CDP doesn't have an explicit "clear UA override" — passing an empty
    // string restores the browser default.
    await driver.send(tabId, "Emulation.setUserAgentOverride", { userAgent: "" });
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}
