// Offscreen document manager — refcounted lifecycle, DIP factory.
//
// Lifecycle (PR #51 review):
//   The doc is opened strictly to host the Blob-based overlay-render
//   pipeline. Each renderOverlayViaOffscreen call retains with a
//   unique key, sends the RENDER_OVERLAY message, and releases in a
//   `finally`. Concurrent renders share the same doc via the refcount.
//   No keepalive: an earlier iteration ran a 20 s ping interval as a
//   side effect of the doc's lifetime, but that blurred the BLOBS
//   reason — a CWS reviewer can't tell whether the doc exists for
//   Blob work or for keepalive abuse if it stays open across text-
//   only turns. Per-render scoping pairs each lifecycle 1:1 with
//   actual Blob work, leaving the SW's idle behaviour untouched.
//
// Why a refcount:
//   Concurrent renders (parallel screenshots across tabs, or close-
//   together captures within one turn) must share the doc; opening
//   and closing per overlapping render would race with the
//   "Only a single offscreen document" constraint. Each call uses a
//   unique key (renderCounter in background.js) so the manager's
//   Set-based dedup doesn't collapse them — the doc only closes
//   when the LAST retainer releases.
//
// Why internal state tracking instead of chrome.offscreen.hasDocument()
// (PR #30 review F2):
//   `chrome.offscreen.hasDocument()` has uneven availability across the
//   MV3 Chrome support range (109+). The recommended successor
//   `chrome.runtime.getContexts()` only landed in Chrome 116. Rather than
//   fork on Chrome version OR depend on `clients.matchAll()` (which isn't
//   in the test env and is awkward to mock), we track our own view of the
//   doc's lifecycle via the retainers set, and treat Chrome's two
//   well-known idempotence errors ("Only a single offscreen document"
//   on create, "No current offscreen document" on close) as success
//   signals. This makes the manager version-agnostic and testable without
//   any Chrome-specific probe.
//
// Why reasons: ["BLOBS"]:
//   The offscreen document hosts the screenshot overlay-rendering
//   pipeline (base64 → Blob → ImageBitmap → OffscreenCanvas → Blob →
//   base64) — see offscreen.js's RENDER_OVERLAY handler and
//   src/perception/overlay-render.js. Lifecycle is bound 1:1 to that
//   work via the per-render retain/release in background.js. If
//   overlay rendering is ever moved off this document, this reason
//   should be re-evaluated.
//
// Idempotence contract:
//   - First retain() from an empty set awaits createDocument; subsequent
//     retains (with new or duplicate keys) are synchronous Set inserts.
//   - Last release (set → 0) awaits closeDocument.
//   - A single in-flight create or close is serialized — a retain() that
//     arrives during close() waits for close to settle, then opens anew.
//   - When offscreenApi is absent (older Chrome, test harness), retain()
//     and release() are no-ops that resolve successfully — callers treat
//     this as "offscreen not available" and fall back to the SW-side
//     renderer rather than treating it as a hard error.

const DEFAULTS = {
  url: "offscreen.html",
  reasons: ["BLOBS"],
  justification:
    "Hosts the Blob-based perception pipeline that decodes captured screenshots, paints overlay labels via OffscreenCanvas, and re-encodes the result for the agent's perception step. Open only while a render is in flight; the SW closes the doc as soon as the response returns.",
};

const IDEMPOTENT_CREATE_RE =
  /single offscreen document|already exists|creation pending/i;
const IDEMPOTENT_CLOSE_RE =
  /no current offscreen document|no offscreen document/i;

export function createOffscreenManager({
  offscreenApi,
  url = DEFAULTS.url,
  reasons = DEFAULTS.reasons,
  justification = DEFAULTS.justification,
  onError = null,
} = {}) {
  const retainers = new Set();
  // One settle-chain serializes create and close so a retain racing a
  // release never interleaves half an open with half a close.
  let pending = null;

  async function runCreate() {
    try {
      await offscreenApi.createDocument({ url, reasons, justification });
    } catch (err) {
      if (!IDEMPOTENT_CREATE_RE.test(err?.message || "")) {
        if (typeof onError === "function") onError(err);
      }
    }
  }

  async function runClose() {
    try {
      await offscreenApi.closeDocument();
    } catch (err) {
      if (!IDEMPOTENT_CLOSE_RE.test(err?.message || "")) {
        if (typeof onError === "function") onError(err);
      }
    }
  }

  function enqueue(op) {
    const prev = pending || Promise.resolve();
    const next = prev.then(op, op).finally(() => {
      if (pending === next) pending = null;
    });
    pending = next;
    return next;
  }

  async function retain(key) {
    if (!offscreenApi?.createDocument) return;
    const wasEmpty = retainers.size === 0;
    retainers.add(key);
    if (wasEmpty) await enqueue(runCreate);
  }

  async function release(key) {
    if (!offscreenApi?.closeDocument) {
      retainers.delete(key);
      return;
    }
    if (!retainers.delete(key)) return;
    if (retainers.size === 0) await enqueue(runClose);
  }

  function isActive() {
    return retainers.size > 0;
  }

  // Test-only introspection; not part of the consumer contract.
  function _retainerCount() {
    return retainers.size;
  }

  return { retain, release, isActive, _retainerCount };
}
