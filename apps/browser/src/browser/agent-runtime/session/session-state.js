/**
 * Multi-tab session state — the conversation record for one agent task that may
 * span several tabs.
 *
 * Unlike src/session/per-tab-state.js (keyed by chrome.tabs.Tab.id, one record
 * per tab, used by the single-tab flow), a multi-tab session is keyed by a
 * minted UUID. tab ids are NOT durable — Chrome reuses them across restarts — so
 * a session that outlives its tabs (or re-adopts them after a service-worker
 * restart) needs an identity independent of any tab. Tab MEMBERSHIP lives in
 * src/orchestration/tab-group.js; this store owns only the shared transcript and
 * the sparse per-tab sub-state (pendingAsk / lastSeal / expectedOrigin).
 *
 * Reads-modify-writes funnel through a per-session promise chain so concurrent
 * appends in the same frame serialize instead of clobbering — the same
 * discipline as per-tab-state's enqueue(); kept separate (not yet extracted)
 * because the two stores key and shape their records differently.
 *
 * Factory over chrome.storage.local (DIP); tests inject a fake store + uuid.
 */

export const SESSION_KEY_PREFIX = "session_v2_";
export const SCHEMA_VERSION = 2;

export function sessionKeyFor(sessionId) {
  return `${SESSION_KEY_PREFIX}${sessionId}`;
}

export function createSessionStore({
  storage,
  now = () => Date.now(),
  randomUUID = () => globalThis.crypto.randomUUID(),
} = {}) {
  if (!storage) {
    throw new Error("createSessionStore: storage is required (pass chrome.storage.local or a fake)");
  }

  const writeChains = new Map(); // sessionId -> tail Promise
  const tombstones = new Set(); // sessionIds deleted this worker lifetime

  function enqueue(sessionId, task) {
    const prev = writeChains.get(sessionId) ?? Promise.resolve();
    const next = prev.then(task, task);
    writeChains.set(sessionId, next.catch(() => {}));
    return next;
  }

  function emptySession(sessionId) {
    const ts = now();
    return {
      schemaVersion: SCHEMA_VERSION,
      sessionId,
      createdAt: ts,
      updatedAt: ts,
      transcript: [],
      perTab: {},
    };
  }

  async function read(sessionId) {
    const data = await storage.get(sessionKeyFor(sessionId));
    return data?.[sessionKeyFor(sessionId)] ?? null;
  }

  // Run a read-modify-write against the live record inside the session's chain.
  // `mutate` receives the record and may mutate it in place. Tombstoned sessions
  // are no-ops so a late write can't resurrect a deleted record.
  function update(sessionId, mutate) {
    if (tombstones.has(sessionId)) return Promise.resolve(null);
    return enqueue(sessionId, async () => {
      if (tombstones.has(sessionId)) return null;
      const record = (await read(sessionId)) ?? emptySession(sessionId);
      mutate(record);
      record.updatedAt = now();
      await storage.set({ [sessionKeyFor(sessionId)]: record });
      return record;
    });
  }

  async function createSession() {
    const sessionId = randomUUID();
    await update(sessionId, () => {});
    return sessionId;
  }

  function appendTurn(sessionId, entry) {
    if (!entry) return Promise.resolve(null);
    return update(sessionId, (record) => {
      record.transcript.push({ ...entry, ts: entry.ts ?? now() });
    });
  }

  function setPerTab(sessionId, tabId, patch) {
    return update(sessionId, (record) => {
      record.perTab[tabId] = { ...(record.perTab[tabId] ?? {}), ...patch };
    });
  }

  async function getPerTab(sessionId, tabId) {
    const record = await read(sessionId);
    return record?.perTab?.[tabId] ?? {};
  }

  function removeTab(sessionId, tabId) {
    return update(sessionId, (record) => {
      delete record.perTab[tabId];
    });
  }

  function deleteSession(sessionId) {
    return enqueue(sessionId, async () => {
      await storage.remove(sessionKeyFor(sessionId));
      tombstones.add(sessionId);
      writeChains.delete(sessionId);
      return null;
    });
  }

  return {
    createSession,
    read,
    appendTurn,
    update, // read-modify-write a record inside its write chain (used by SW history compaction)
    setPerTab,
    getPerTab,
    removeTab,
    deleteSession,
  };
}
