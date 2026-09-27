/**
 * Action-intent journal — write-ahead log that makes the orchestrator's actions
 * safe to resume after the service worker dies mid-turn.
 *
 * MV3 kills the background worker after 30s idle and can terminate it mid-task.
 * If an action is dispatched to CDP but the worker dies before its result is
 * persisted, a naive replay on resume would execute it TWICE (a second click /
 * purchase / submit). So every action is bracketed: `begin()` writes a
 * "dispatched" intent BEFORE the CDP call, `complete()` clears it AFTER the
 * result lands. On worker boot, any intent still pending is an action whose
 * outcome is unknown — the orchestrator must NOT replay it; it should
 * re-perceive and let the model decide from the fresh page state.
 *
 * Storage-backed (not just in-memory) so an intent written microseconds before
 * termination survives into the next worker. Factory over chrome.storage.local
 * (DIP); tests inject a fake store.
 */

export const ACTION_JOURNAL_KEY = "action_journal";

export function createActionJournal({
  storage,
  now = () => Date.now(),
  randomUUID = () => globalThis.crypto.randomUUID(),
} = {}) {
  if (!storage) {
    throw new Error("createActionJournal: storage is required (pass chrome.storage.local or a fake)");
  }

  let chain = Promise.resolve();

  async function readAll() {
    const data = await storage.get(ACTION_JOURNAL_KEY);
    return data?.[ACTION_JOURNAL_KEY] ?? {};
  }

  // Serialize read-modify-writes on the single journal key so concurrent
  // begin/complete calls can't clobber each other's entries.
  function mutate(fn) {
    const next = chain.then(async () => {
      const journal = await readAll();
      const result = fn(journal);
      await storage.set({ [ACTION_JOURNAL_KEY]: journal });
      return result;
    });
    chain = next.catch(() => {});
    return next;
  }

  function begin({ sessionId, tabId, action }) {
    // A globally-unique key (not a per-instance counter) is essential: a journal
    // booting after a worker death must never re-mint a key that an earlier
    // worker left pending, or its write would overwrite — and silently lose —
    // that unknown-outcome intent.
    const key = randomUUID();
    return mutate((journal) => {
      journal[key] = { key, sessionId, tabId, action, status: "dispatched", ts: now() };
      return key;
    });
  }

  function complete(key) {
    return mutate((journal) => {
      delete journal[key];
    });
  }

  // Explicitly abandon an UNKNOWN-outcome intent only after the resumed turn
  // has re-perceived and completed. This is deliberately separate from
  // complete(): complete means the original dispatch returned; abandon means
  // recovery established a fresh state boundary without replaying the action.
  function abandon(key) {
    return mutate((journal) => {
      delete journal[key];
    });
  }

  function clearSession(sessionId) {
    return mutate((journal) => {
      for (const [key, intent] of Object.entries(journal)) {
        if (intent.sessionId === sessionId) delete journal[key];
      }
    });
  }

  async function pendingFor(sessionId) {
    const journal = await readAll();
    return Object.values(journal).filter((intent) => intent.sessionId === sessionId);
  }

  return { begin, complete, abandon, clearSession, pendingFor };
}
