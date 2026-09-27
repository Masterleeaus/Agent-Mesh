/**
 * Fuzzy element lookup over a snapshot text form.
 *
 * The agent calls `find("the blue Submit button")` when `take_snapshot` alone
 * doesn't give it enough signal to pick a uid. This module parses the
 * snapshot's `ref_N role "name"` lines, scores each against the query, and
 * returns the top-N candidates so the outer ReAct loop can pick one.
 *
 * v1 scoring (intentionally simple):
 *   - Exact name match (case-insensitive, trimmed)           → 1.00
 *   - Query substring contains / is contained in name        → 0.70
 *   - Token-overlap score on name ∪ role                      → up to 0.60
 *   - Role hint in query (e.g. "button submit") adds         → +0.20 bonus
 *                                                              (capped at 1.0)
 *
 * This is enough for v1. A semantic re-ranker (nested LLM call) is scoped
 * behind a user setting and lives in a separate module; this one stays pure
 * and deterministic.
 */

const LINE_RE = /^(\S+)\s+(\S+)(?:\s+"(.*)")?$/;

const KNOWN_ROLES = new Set([
  "button", "link", "textbox", "combobox", "checkbox", "radio", "slider",
  "switch", "tab", "menuitem", "option", "img", "heading",
  "navigation", "main", "banner", "contentinfo", "complementary", "region",
  "article", "form", "search",
]);

function parseSnapshot(text) {
  if (!text) return [];
  const entries = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = LINE_RE.exec(line);
    if (!m) continue;
    const [, uid, role, name = ""] = m;
    entries.push({ uid, role, name, snippet: line });
  }
  return entries;
}

function tokenize(s) {
  return String(s).toLowerCase().split(/\s+/).filter(Boolean);
}

function score(entry, queryTokens, roleHint) {
  const name = entry.name.toLowerCase();
  const role = entry.role.toLowerCase();
  const queryJoined = queryTokens.join(" ");

  let base = 0;
  if (name && queryJoined === name) {
    base = 1.0;
  } else if (name && (name.includes(queryJoined) || queryJoined.includes(name))) {
    base = 0.7;
  } else {
    const nameTokens = new Set(tokenize(name));
    nameTokens.add(role);
    let overlap = 0;
    for (const t of queryTokens) if (nameTokens.has(t)) overlap++;
    if (overlap > 0 && queryTokens.length > 0) {
      base = 0.6 * (overlap / queryTokens.length);
    }
  }

  if (base === 0) return 0;
  if (roleHint && roleHint === role) base = Math.min(1, base + 0.2);
  return base;
}

export function find(snapshotText, description, { limit = 5 } = {}) {
  if (typeof description !== "string" || !description.trim()) return [];
  const queryTokens = tokenize(description);
  // Pull a role hint if the user prefixed or mixed it in ("button submit")
  let roleHint = null;
  const roleTokens = queryTokens.filter((t) => KNOWN_ROLES.has(t));
  if (roleTokens.length === 1) roleHint = roleTokens[0];
  const nonRoleTokens = queryTokens.filter((t) => !KNOWN_ROLES.has(t));
  const effectiveTokens = nonRoleTokens.length ? nonRoleTokens : queryTokens;

  const entries = parseSnapshot(snapshotText);
  const scored = [];
  for (const entry of entries) {
    const s = score(entry, effectiveTokens, roleHint);
    if (s > 0) scored.push({ ...entry, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
