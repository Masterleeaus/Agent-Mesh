/**
 * Network observer. Subscribes to the four lifecycle events for an HTTP
 * request — requestWillBeSent → responseReceived → (loadingFinished |
 * loadingFailed) — and aggregates each round-trip into a single ring-buffer
 * entry.
 *
 * One row per request is the agent-friendly shape: after a click that fires
 * a few XHRs, list_network_requests should return ~3 rows, each with
 * method/url/status/timing — not 12 stream entries the agent has to stitch
 * back together.
 *
 * Out-of-order events (response/finished without a known requestId) are
 * silently dropped. They typically indicate Network.enable was toggled
 * mid-flight or events arrived from before the observer attached — neither
 * is actionable for the agent.
 */
import { RingBuffer } from "../cdp/events.js";

export function createNetworkObserver(driver, tabId, { capacity = 200 } = {}) {
  const buffer = new RingBuffer(capacity);
  const pending = new Map(); // requestId → in-progress aggregate

  function flush(requestId) {
    const entry = pending.get(requestId);
    if (!entry) return;
    pending.delete(requestId);
    buffer.push(entry);
  }

  const offReq = driver.onForTab(tabId, "Network.requestWillBeSent", (params) => {
    pending.set(params.requestId, {
      requestId: params.requestId,
      method: params.request?.method,
      url: params.request?.url,
      startedAt: params.timestamp,
      status: null,
      mimeType: null,
      finishedAt: null,
      encodedDataLength: null,
      error: null,
    });
  });

  const offRes = driver.onForTab(tabId, "Network.responseReceived", (params) => {
    const entry = pending.get(params.requestId);
    if (!entry) return;
    entry.status = params.response?.status ?? null;
    entry.mimeType = params.response?.mimeType ?? null;
  });

  const offFin = driver.onForTab(tabId, "Network.loadingFinished", (params) => {
    const entry = pending.get(params.requestId);
    if (!entry) return;
    entry.finishedAt = params.timestamp ?? null;
    entry.encodedDataLength = params.encodedDataLength ?? null;
    flush(params.requestId);
  });

  const offFail = driver.onForTab(tabId, "Network.loadingFailed", (params) => {
    const entry = pending.get(params.requestId);
    if (!entry) return;
    entry.finishedAt = params.timestamp ?? null;
    entry.error = params.errorText ?? "unknown";
    flush(params.requestId);
  });

  function attach() {
    return driver.send(tabId, "Network.enable", {});
  }

  function detach() {
    offReq();
    offRes();
    offFin();
    offFail();
  }

  return {
    attach,
    detach,
    list: (opts) => buffer.list(opts),
    get: (id) => buffer.get(id),
  };
}
