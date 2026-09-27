/**
 * Bridge script — runs in the ISOLATED world (has chrome.runtime access).
 *
 * Relays messages between:
 *   - content.js (MAIN world, has document.modelContext) via window.postMessage
 *   - background.js / sidebar via chrome.runtime messaging
 */

console.log("[AutoBrowser:Bridge] Bridge loaded (ISOLATED world)");

// ── MAIN world → Chrome runtime ──────────────────────────────

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.direction !== "from-main-world") return;

  const msg = event.data.message;
  console.log("[AutoBrowser:Bridge] ← from MAIN:", msg.type);

  if (msg.type === "STATUS_UPDATE") {
    try {
      chrome.runtime.sendMessage(msg);
    } catch (e) {
      console.warn("[AutoBrowser:Bridge] Failed to relay STATUS_UPDATE:", e.message);
    }
  }

  if (msg.type === "GET_CONFIG") {
    console.log("[AutoBrowser:Bridge] Fetching config from storage...");
    chrome.runtime.sendMessage({ type: "GET_CONFIG" }, (res) => {
      console.log("[AutoBrowser:Bridge] Got config:", { hasApiKey: !!res?.apiKey, engaged: res?.engaged, model: res?.model });
      window.postMessage(
        {
          direction: "from-isolated-world",
          message: { type: "GET_CONFIG_RESPONSE", payload: res },
        },
        "*",
      );
    });
  }

  if (msg.type === "SET_CONFIG") {
    chrome.runtime.sendMessage(msg);
  }
});

// ── Chrome runtime → MAIN world ──────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "CONFIG_UPDATED") {
    console.log("[AutoBrowser:Bridge] → to MAIN: CONFIG_UPDATED", { engaged: msg.payload?.engaged });
    window.postMessage(
      { direction: "from-isolated-world", message: msg },
      "*",
    );
  }
});
