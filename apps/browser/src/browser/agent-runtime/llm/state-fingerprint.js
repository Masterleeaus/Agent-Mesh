/**
 * Environment fingerprint (Phase 3 — working-memory generalisation).
 *
 * The existing working-memory state-key derivation (explicitStateKey in
 * working-memory.js) is keyed off positional fields — x/y, roomId,
 * location, etc. Those were designed for WebMCP games (mazes, puzzles)
 * where every tool result carries a world-coordinate. On a generic web
 * page, none of those fields exist, so the state-key collapses to null
 * and the whole no-progress / oscillation detector silently degrades —
 * the very signal it's meant to catch on a stuck CDP submit never fires.
 *
 * This module fills that gap with a deterministic fingerprint derived
 * from observable page state:
 *
 *   fingerprintEnvironment({url, a11ySnapshotText, webmcpToolNames}) →
 *     { key: "env:<hash>", summary: {url, pathname, snapshotHash, toolCount} }
 *
 * Three ingredients go into the hash:
 *   1. URL pathname (NOT query+fragment — query strings vary across
 *      otherwise-identical states, e.g. session ids, tracking params).
 *   2. Normalised a11y snapshot — sort the lines, drop uid prefixes,
 *      drop value-bearing input markers. This keeps role + name + state,
 *      which is what identifies the page.
 *   3. Sorted list of WebMCP tool names — a tool-set change is a page
 *      state change even without URL/DOM change (e.g. a game round
 *      flipping between "draw" and "play" tool sets).
 *
 * Invariants:
 *   - Deterministic: same inputs → same key across ticks/runs.
 *   - Distinct: different URL path, different snapshot, or different
 *     tool set → different key.
 *   - Opaque: the key is a hash — pages cannot reverse-engineer it.
 *
 * Pure module. No DOM, no storage, no side effects. Unit-testable.
 */

// Same hash function as working-memory.js hashString. Copied intentionally
// rather than imported — working-memory.js keeps its hashString private
// (not exported), and a shared dependency between the two would be one
// more import seam. Both implementations are trivial and must agree on
// output for the same input (they do — identical algorithm).
function hashString(input) {
  const str = typeof input === "string" ? input : String(input ?? "");
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h = (h ^ str.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * Strip a URL down to its site-stable path. Drops query + fragment.
 * Keeps protocol + host + pathname. On parse failure, returns the input
 * unchanged (still deterministic).
 */
export function canonicalUrl(url) {
  if (typeof url !== "string" || !url) return "";
  try {
    const u = new URL(url);
    // Pathname always ends without trailing slash for stability, except
    // for the bare root ("/" stays "/").
    let path = u.pathname || "/";
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return `${u.protocol}//${u.host}${path}`;
  } catch {
    return url;
  }
}

/**
 * Normalise an a11y snapshot for fingerprinting.
 * Snapshot lines follow `ref_{v}_{n} {role} [{state}...] "{name}"` from
 * src/perception/snapshot.js formatLine.
 *
 * Transformations:
 *   - Strip `ref_N_M ` uid prefixes (uids change between snapshots even
 *     when the page is identical).
 *   - Strip value-bearing input markers like `value="…"` — we're
 *     interested in role+name, not the transient typed text.
 *   - Sort the resulting lines so minor ordering differences between
 *     snapshots don't produce different fingerprints.
 *   - Collapse multiple whitespace runs to single spaces.
 *
 * Output is a single string ready to be hashed.
 */
export function normalizeSnapshotText(text) {
  if (typeof text !== "string" || !text) return "";
  const lines = text.split("\n");
  const normalised = [];
  for (const raw of lines) {
    let line = raw.trim();
    if (!line) continue;
    // Strip "ref_{v}_{n}" prefix (version-qualified uids from
    // perception/snapshot.js).
    line = line.replace(/^ref_\d+_\d+\s+/, "");
    // Strip value="..." markers (transient input state).
    line = line.replace(/\s+value="[^"]*"/g, "");
    line = line.replace(/\s+valuePresent:\s*true/g, "");
    // Collapse whitespace runs.
    line = line.replace(/\s+/g, " ");
    normalised.push(line);
  }
  normalised.sort();
  return normalised.join("\n");
}

/**
 * Build an environment fingerprint suitable for working-memory's state
 * key fallback.
 *
 * @param {{url?: string, a11ySnapshotText?: string, webmcpToolNames?: Iterable<string>}} env
 * @returns {{key: string, summary: {url: string, pathname: string, snapshotHash: string, toolCount: number}} | null}
 *   Returns null when every ingredient is absent (no URL, no snapshot,
 *   no tools) — no signal to fingerprint against. Null is the "don't
 *   record an observation" signal the caller needs.
 */
export function fingerprintEnvironment(env) {
  if (!env || typeof env !== "object") return null;

  const url = canonicalUrl(env.url || "");
  const snap = normalizeSnapshotText(env.a11ySnapshotText || "");
  const tools = toSortedToolList(env.webmcpToolNames);

  // All three empty → no fingerprint. (Startup, fresh panel, etc.)
  if (!url && !snap && tools.length === 0) return null;

  const snapshotHash = snap ? hashString(snap) : "";
  const toolsHash = tools.length ? hashString(tools.join("\n")) : "";
  const payload = `${url}|${snapshotHash}|${toolsHash}`;
  const key = `env:${hashString(payload)}`;

  let pathname = "";
  try {
    pathname = url ? new URL(url).pathname : "";
  } catch { /* leave blank */ }

  return {
    key,
    summary: {
      url,
      pathname,
      snapshotHash,
      toolCount: tools.length,
    },
  };
}

function toSortedToolList(source) {
  if (!source) return [];
  let names;
  if (source instanceof Set) {
    names = Array.from(source);
  } else if (Array.isArray(source)) {
    names = source.slice();
  } else if (typeof source[Symbol.iterator] === "function") {
    names = Array.from(source);
  } else {
    return [];
  }
  return names.filter((n) => typeof n === "string" && n).sort();
}

// Exposed for tests that want to assert the hash behaviour without
// re-implementing it.
export { hashString };
