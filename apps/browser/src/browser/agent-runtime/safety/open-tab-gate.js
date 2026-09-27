/**
 * open_tab URL gate (service-worker side). open_tab navigates via
 * chrome.tabs.create with no content-script gate on the load, so its URL must be
 * screened to the SAME standard as navigate. This is the pure decision; the SW
 * keeps the safety policy hot in memory and passes it (+ a readiness flag) in.
 *
 * Fails CLOSED: before the real policy has loaded (`policyReady === false`) the
 * gate DENIES anything that isn't an outright allow under the strict defaults —
 * a policy cache miss must never permit, or even interactively PROMPT for, a
 * host the user's ask/allowlist-only policy would gate (an approval prompt for a
 * domain we can't yet classify defeats fail-closed just as much as auto-allowing
 * it would). An "ask" verdict is reserved for once the real policy is loaded and
 * genuinely says "ask" — tab-tools.js turns that into an interactive approval
 * prompt (or, with no approval UI wired, a refusal — see its `askUser` dep).
 */
import { decide } from "./permission-manager.js";
import { DEFAULT_POLICY } from "./policy-store.js";

const NO_GRANTS = new Map(); // open_tab doesn't share the content script's per-call grants

/**
 * @returns {{decision: "allow"|"ask"|"deny", reason: string}} reason is "" for allow.
 */
export function screenOpenTabUrl(url, { policy = DEFAULT_POLICY, policyReady = false } = {}) {
  let domain;
  try {
    domain = new URL(url).hostname;
  } catch {
    return { decision: "deny", reason: "is not a valid URL" };
  }
  const decision = decide("open_tab", {}, { domain, toolUseId: "open_tab", policy, grants: NO_GRANTS });
  if (decision === "deny") return { decision: "deny", reason: "is on the Auto Browser blocklist" };
  if (!policyReady) {
    return { decision: "deny", reason: "isn't approved yet — the safety policy hasn't finished loading" };
  }
  if (decision === "ask") {
    return {
      decision: "ask",
      reason: "isn't approved for this session — add it to your allowlist (or navigate to it on an existing tab) before opening it in a new tab",
    };
  }
  return { decision: "allow", reason: "" };
}
