/**
 * Wait primitives. Both calls take an injected `clock` ({now, sleep}) so tests
 * can drive time deterministically without real setTimeout.
 *
 *   waitForText        — polls Runtime.evaluate against
 *                        document.body.innerText.includes(<text>)
 *                        until match or timeout.
 *
 *   waitForNetworkIdle — subscribes to Network.* events on the driver, tracks
 *                        in-flight count, returns ok when count==0 has held
 *                        for `idle_ms` continuously.
 *
 * The injected text in waitForText is JSON-escaped before splicing into the
 * evaluate expression — never raw-interpolated. Closes the obvious
 * "wait_for({text: ';alert(1);//'})" → arbitrary script execution loophole.
 */

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_POLL_MS = 100;
const DEFAULT_NETWORK_IDLE_MS = 500;
const DEFAULT_NETWORK_TIMEOUT_MS = 10_000;

const realClock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
};

export async function waitForText(driver, tabId, params = {}, clock = realClock) {
  const text = typeof params.text === "string" ? params.text : "";
  if (!text.trim()) {
    return { error: "wait_for: 'text' is required (non-empty string)." };
  }
  const timeoutMs = Number.isFinite(params.timeout_ms) && params.timeout_ms > 0 ? params.timeout_ms : DEFAULT_TIMEOUT_MS;
  const pollMs = Number.isFinite(params.poll_ms) && params.poll_ms > 0 ? params.poll_ms : DEFAULT_POLL_MS;

  // JSON.stringify is the right escape: it produces a valid JS string literal
  // for any input, including embedded quotes, backslashes, and newlines.
  const expr = `!!document.body && !!document.body.innerText && document.body.innerText.includes(${JSON.stringify(text)})`;

  const deadline = clock.now() + timeoutMs;
  while (clock.now() < deadline) {
    try {
      const res = await driver.send(tabId, "Runtime.evaluate", {
        expression: expr,
        returnByValue: true,
      });
      if (res?.result?.value === true) return { ok: true };
    } catch (err) {
      return { error: `wait_for: ${err.message}` };
    }
    await clock.sleep(pollMs);
  }
  return { error: `wait_for: text ${JSON.stringify(text)} did not appear within ${timeoutMs}ms.` };
}

export async function waitForNetworkIdle(driver, tabId, params = {}, clock = realClock) {
  const idleMs = Number.isFinite(params.idle_ms) && params.idle_ms > 0 ? params.idle_ms : DEFAULT_NETWORK_IDLE_MS;
  const timeoutMs = Number.isFinite(params.timeout_ms) && params.timeout_ms > 0 ? params.timeout_ms : DEFAULT_NETWORK_TIMEOUT_MS;
  const pollMs = Number.isFinite(params.poll_ms) && params.poll_ms > 0 ? params.poll_ms : 25;

  let inFlight = 0;
  let lastChange = clock.now();

  // Pin the chrome.debugger attach for the duration of the wait. The poll
  // loop issues no send() calls, so without a pin the driver's idle-detach
  // timer fires after ~5s and Network.* events silently stop reaching us
  // (PR #8 review F1).
  const release = typeof driver.retain === "function" ? await driver.retain(tabId) : null;

  const offReq = driver.onForTab(tabId, "Network.requestWillBeSent", () => {
    inFlight++;
    lastChange = clock.now();
  });
  const offFin = driver.onForTab(tabId, "Network.loadingFinished", () => {
    if (inFlight > 0) inFlight--;
    lastChange = clock.now();
  });
  const offFail = driver.onForTab(tabId, "Network.loadingFailed", () => {
    if (inFlight > 0) inFlight--;
    lastChange = clock.now();
  });

  function cleanup() {
    offReq();
    offFin();
    offFail();
    release?.();
  }

  try {
    await driver.send(tabId, "Network.enable", {});
  } catch (err) {
    cleanup();
    return { error: `wait_for_network_idle: ${err.message}` };
  }

  const deadline = clock.now() + timeoutMs;
  try {
    while (clock.now() < deadline) {
      if (inFlight === 0 && (clock.now() - lastChange) >= idleMs) {
        return { ok: true };
      }
      await clock.sleep(pollMs);
    }
    return {
      error: `wait_for_network_idle: ${inFlight} request(s) still in flight after ${timeoutMs}ms (idle_ms=${idleMs}).`,
    };
  } finally {
    cleanup();
  }
}
