/**
 * Phase 3.3 — stale-ref recovery (in-band fresh snapshot).
 *
 * When a uid action fails because the snapshot moved on, the agent
 * today burns a full ReAct turn to recover (read error → call
 * take_snapshot → pick a new uid → re-issue the action). We can save
 * that turn without being unsafe: pre-emptively take a fresh snapshot
 * and attach it to the error response. The agent gets fresh refs in
 * the SAME turn — they pick a new uid and re-issue, no extra round-
 * trip with the LLM.
 *
 * Deliberately NOT auto-redispatching with a fuzzy-match: a "Buy Now"
 * button that's stale (e.g. cart updated) might now be a DIFFERENT
 * button (cancel? confirm purchase?). Auto-clicking by name match is
 * dangerous for state-mutating actions. Decision stays with the
 * agent; we just hand them fresh information.
 */

const STALE_REF_RE = /is stale or unknown/;

/**
 * True iff the error message looks like the canonical stale-ref
 * error from `resolveUidToCoords`. The wording is the contract — see
 * `resolve-uid.test.js` for the producer-side pin.
 */
export function isStaleRefError(error) {
  if (typeof error !== "string") return false;
  return STALE_REF_RE.test(error);
}

/**
 * If `result` is a stale-ref error, augment it with a fresh snapshot
 * fetched via `takeSnapshotFn`. Otherwise return `result` unchanged.
 *
 * Snapshot failures (returned `{error}` or thrown) are swallowed and
 * the ORIGINAL action error is returned — burying the action's error
 * under a snapshot error would obscure the more diagnostically useful
 * one.
 */
export async function withFreshSnapshotOnStale(result, takeSnapshotFn) {
  if (!result || typeof result !== "object") return result;
  if (!isStaleRefError(result.error)) return result;
  try {
    const fresh = await takeSnapshotFn();
    if (fresh && fresh.error) return result;
    return { ...result, fresh_snapshot: fresh };
  } catch {
    return result;
  }
}
