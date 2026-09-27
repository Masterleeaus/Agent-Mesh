/**
 * Per-tab session state — namespaced chrome.storage.local helpers.
 *
 * State is keyed strictly by chrome.tabs.Tab.id (NEVER by URL) so the agent's
 * context survives navigation across URLs within the same tab. Each tab owns
 * a single `session_state_${tabId}` record in chrome.storage.local.
 *
 * All writes flow through append() / setPendingAsk() / clearPendingAsk() so
 * concurrent bursts (tool_call + tool_result landing in the same frame)
 * serialize cleanly — without the per-tab promise chain, parallel
 * read-modify-writes would drop entries.
 *
 * Entry shape uses a `kind` discriminator: "user" | "agent" | "tool_call" |
 * "tool_result" | "thought" | "phase_change" | "validator_verdict" |
 * "turn_ended" | "disengaged" | "error" | "agent_advisory" | "final_answer".
 * `kind: "user" | "agent"` entries optionally carry an `origin` tag:
 *   - `origin: "chat"`  → produced by Built-in AI chat-only mode.
 *   - `origin: "react"` (or absent — backfill-friendly) → produced by the
 *     ReAct agent loop. The chat-only history rebuilder filters strictly
 *     to `origin === "chat"` so the two modes never contaminate each other.
 */
export const KEY_PREFIX = "session_state_";
export const SCHEMA_VERSION = 1;

export function keyFor(tabId) {
  return `${KEY_PREFIX}${tabId}`;
}

export function emptyState(tabId) {
  const now = Date.now();
  return {
    schemaVersion: SCHEMA_VERSION,
    tabId,
    createdAt: now,
    updatedAt: now,
    messages: [],
    pendingAsk: null,
  };
}

export async function read(tabId) {
  const key = keyFor(tabId);
  const data = await chrome.storage.local.get(key);
  return data?.[key] ?? null;
}

// Bootstrap gate — set by the background worker to a promise that resolves
// after purgeGhosts() finishes on SW wake. Every write awaits this inside
// its queued task so a first-boot panel can't read/write session_state
// for a tabId whose record might be stale from a previous Chrome session
// (the tabId counter resets across Chrome restarts — see PR #15 audit #1).
// Defaults to a resolved promise so tests and direct callers don't deadlock.
let bootstrapReady = Promise.resolve();
export function setBootstrapReady(promise) {
  bootstrapReady = promise ?? Promise.resolve();
}

// Per-tab promise chains keep concurrent read-modify-writes from clobbering
// each other within a single worker. Cross-worker writes (panel + background
// both writing) are rare in practice and would still resolve to a consistent
// tail because storage.onChanged replays the final state to every reader.
const writeChains = new Map();

// Tombstones: short-lived "this tab is gone, don't resurrect it" markers set
// by deleteTab / moveTabState. Without them, a late appendSession arriving
// just after tab close (e.g. a STATUS_UPDATE already in-flight through
// chrome.runtime, or a queued task starting a fresh writeChains entry after
// the delete completed) would read emptyState → write → recreate
// session_state_${tabId}. The TTL is generous vs. any realistic in-flight
// window; purgeGhosts() sweeps anything that slips through on SW boot.
const TOMBSTONE_TTL_MS = 30_000;
const tombstones = new Map(); // tabId -> expiry epoch ms

function isTombstoned(tabId) {
  const expiry = tombstones.get(tabId);
  if (!expiry) return false;
  if (Date.now() < expiry) return true;
  tombstones.delete(tabId);
  return false;
}

function seal(tabId) {
  tombstones.set(tabId, Date.now() + TOMBSTONE_TTL_MS);
}

function enqueue(tabId, task) {
  const prev = writeChains.get(tabId) ?? Promise.resolve();
  const next = prev.then(task, task); // run regardless of prior outcome
  writeChains.set(tabId, next.catch(() => {}));
  return next;
}

export function append(tabId, entry) {
  if (!entry) return Promise.resolve(null);
  if (isTombstoned(tabId)) return Promise.resolve(null);
  return enqueue(tabId, async () => {
    await bootstrapReady;
    // Re-check inside the queue — the seal may have landed while this task
    // sat in the chain behind a prior write. Skipping here is what prevents
    // the "enqueued-before-delete" task from resurrecting the key.
    if (isTombstoned(tabId)) return null;
    const key = keyFor(tabId);
    const existing = await read(tabId);
    const state = existing ?? emptyState(tabId);
    state.messages.push({ ...entry, ts: entry.ts ?? Date.now() });
    state.updatedAt = Date.now();
    await chrome.storage.local.set({ [key]: state });
    return state;
  });
}

/**
 * Upsert a live-streaming thought entry. Because `stream_thought` carries
 * cumulative text on every tick, we either REPLACE the tail `thought`
 * message (if the current tail is a thought — we're mid-stream) or APPEND
 * a new one (first tick of a fresh turn). Text is hard-capped so a very
 * chatty reasoning model can't grow the per-tab record unbounded.
 */
export const THOUGHT_TEXT_CAP = 5000;
export function upsertThought(tabId, text, { totalChars } = {}) {
  if (isTombstoned(tabId)) return Promise.resolve(null);
  return enqueue(tabId, async () => {
    await bootstrapReady;
    if (isTombstoned(tabId)) return null;
    const key = keyFor(tabId);
    const existing = await read(tabId);
    const state = existing ?? emptyState(tabId);
    const capped = capThoughtText(String(text ?? ""), totalChars);
    const tail = state.messages[state.messages.length - 1];
    if (tail && tail.kind === "thought") {
      tail.text = capped;
      tail.ts = Date.now();
    } else {
      state.messages.push({ kind: "thought", text: capped, ts: Date.now() });
    }
    state.updatedAt = Date.now();
    await chrome.storage.local.set({ [key]: state });
    return state;
  });
}

/**
 * The single thought-display policy, used by storage AND by the live view.
 *
 * `originalChars` is what the producer held BEFORE its own transport bound.
 * Without it the marker measures only what survived the wire and understates
 * the omission by whatever was dropped in transit.
 *
 * Exported because the sidebar renders the same value: two copies agreed today
 * and would diverge on the next change to either the cap or the marker.
 */
export function formatThoughtText(value, originalChars) {
  const text = String(value ?? "");
  const total = Number.isSafeInteger(originalChars) && originalChars > text.length
    ? originalChars
    : text.length;
  if (total <= THOUGHT_TEXT_CAP) return text;
  return `${text.slice(0, THOUGHT_TEXT_CAP)}…[truncated ${total - THOUGHT_TEXT_CAP} chars]`;
}

const capThoughtText = formatThoughtText;

export function setPendingAsk(tabId, ask) {
  if (isTombstoned(tabId)) return Promise.resolve(null);
  return enqueue(tabId, async () => {
    await bootstrapReady;
    if (isTombstoned(tabId)) return null;
    const key = keyFor(tabId);
    const existing = await read(tabId);
    const state = existing ?? emptyState(tabId);
    state.pendingAsk = ask ?? null;
    state.updatedAt = Date.now();
    await chrome.storage.local.set({ [key]: state });
    return state;
  });
}

export function clearPendingAsk(tabId) {
  return setPendingAsk(tabId, null);
}

/**
 * Truncate a tab's chat history + pendingAsk while keeping the record
 * alive, so the user can start a fresh conversation on the same tab
 * without re-opening the panel. Runs inside the per-tab write chain to
 * preserve ordering vs. any queued appendSession. Does NOT tombstone —
 * the user may immediately send a new message after clearing, and a
 * tombstone would turn that append into a no-op.
 */
export function clearMessages(tabId) {
  return enqueue(tabId, async () => {
    await bootstrapReady;
    if (isTombstoned(tabId)) return null;
    const key = keyFor(tabId);
    const existing = await read(tabId);
    if (!existing) return null;
    existing.messages = [];
    existing.pendingAsk = null;
    existing.updatedAt = Date.now();
    await chrome.storage.local.set({ [key]: existing });
    return existing;
  });
}

/**
 * Delete a tab's session record. Runs inside the per-tab write chain so
 * any queued appendSession / setPendingAsk drains before the remove, and
 * seals the tabId afterward so late enqueues (that would otherwise create
 * a fresh writeChains entry and read emptyState) become no-ops (PR #15
 * third-pass review).
 */
export function deleteTab(tabId) {
  return enqueue(tabId, async () => {
    await bootstrapReady;
    await chrome.storage.local.remove(keyFor(tabId));
    seal(tabId);
    writeChains.delete(tabId);
    return null;
  });
}

/**
 * Migrate the session record from one tabId to another — used on
 * chrome.tabs.onReplaced (prerender commit) where Chrome swaps the
 * foreground tab and reassigns the id.
 *
 * Runs inside the fromTabId write chain so any appendSession() /
 * setPendingAsk() queued for the outgoing tab completes BEFORE we snapshot
 * — without this the migration would grab stale data while the in-flight
 * task later resurrects the removed-tab key after our remove() (PR #15
 * second-pass review).
 */
export function moveTabState(fromTabId, toTabId) {
  return enqueue(fromTabId, async () => {
    await bootstrapReady;
    const existing = await read(fromTabId);
    if (!existing) {
      seal(fromTabId);
      writeChains.delete(fromTabId);
      return null;
    }
    // Defensive (PR #15 audit #3): if the destination key already exists,
    // we'd be silently clobbering data that wasn't supposed to be there
    // (onReplaced's addedTabId is supposed to be a newly-created tab id).
    // Log it loudly so any regression in onReplaced's contract shows up.
    const preexisting = await read(toTabId);
    if (preexisting) {
      console.warn(
        `[per-tab-state] moveTabState(${fromTabId}→${toTabId}): destination ` +
        `key already existed; overwriting. Check onReplaced semantics.`,
      );
    }
    const next = {
      ...existing,
      tabId: toTabId,
      updatedAt: Date.now(),
    };
    await chrome.storage.local.set({ [keyFor(toTabId)]: next });
    await chrome.storage.local.remove(keyFor(fromTabId));
    // Seal fromTabId on the same grounds as deleteTab: without a tombstone,
    // a stray USER_MESSAGE / STATUS_UPDATE that still carries the old tabId
    // (panel hasn't processed TAB_REBOUND yet) would create a ghost record
    // at session_state_${fromTabId}.
    seal(fromTabId);
    writeChains.delete(fromTabId);
    return next;
  });
}

/**
 * Convert a CHAT_APPEND payload (from sidebar/chat-mode.js) into the entry
 * shape `append()` expects. Strips `dataUrl` from attachments so storage
 * stays small (Blobs are reconstructed in-memory by the sidebar for the
 * active turn only — see buildChatMessages in sidebar/chat-mode.js).
 *
 * Returns null for unknown roles so the background handler can no-op
 * defensively without spreading the validation across the call site.
 */
export function buildChatAppendEntry(payload) {
  const role = payload?.role;
  if (role !== "user" && role !== "agent") return null;
  return {
    kind: role,
    origin: "chat",
    text: String(payload?.text ?? ""),
    attachments: (payload?.attachments ?? []).map((a) => ({
      kind: a.kind,
      name: a.name,
      mime: a.mime,
    })),
  };
}

/**
 * Purge session_state_* keys whose tabId no longer matches an open tab.
 * Runs on service-worker boot to catch tabs closed while the worker was dead
 * (chrome.tabs.onRemoved only fires to a live worker).
 */
export async function purgeGhosts() {
  const [tabs, all] = await Promise.all([
    chrome.tabs.query({}),
    chrome.storage.local.get(null),
  ]);
  const aliveIds = new Set(tabs.map((t) => t.id));
  const stale = [];
  for (const key of Object.keys(all)) {
    if (!key.startsWith(KEY_PREFIX)) continue;
    const idStr = key.slice(KEY_PREFIX.length);
    const id = Number(idStr);
    if (!Number.isInteger(id) || !aliveIds.has(id)) stale.push(key);
  }
  if (stale.length) {
    writeChains.clear();
    await chrome.storage.local.remove(stale);
  }
  return stale.length;
}
