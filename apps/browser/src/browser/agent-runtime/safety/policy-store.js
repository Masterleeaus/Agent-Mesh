/**
 * chrome.storage.local adapter for the safety policy. Reads merge over defaults
 * so a partial stored object never loses blocklist/mode fields; writes merge
 * the incoming partial over the current persisted state.
 *
 * DEFAULT_POLICY is the single source of truth for the shape and shipped
 * defaults. The blocklist comes from src/safety/blocklist.js so neither the
 * doc nor this file duplicates that list.
 */
import { DEFAULT_BLOCKLIST } from "./blocklist.js";

const STORAGE_KEY = "safety";

export const DEFAULT_POLICY = Object.freeze({
  mode: "ask",                    // "ask" | "plan" | "skip"
  domainAllowlist: [],
  domainBlocklist: DEFAULT_BLOCKLIST,
  rememberGrantsForTurn: true,
  // Power-user escape hatch for ALWAYS_ASK_TOOLS (evaluate_script). Separate
  // from `mode` on purpose: "auto-approve everything" is about routine actions,
  // whereas this surrenders the one checkpoint on arbitrary code execution, so
  // it must be chosen deliberately rather than inherited from a broader toggle.
  // The domain blocklist still wins — see permission-manager.decide().
  allowScriptsWithoutPrompt: false,
});

function freshDefaults() {
  return {
    mode: DEFAULT_POLICY.mode,
    domainAllowlist: [...DEFAULT_POLICY.domainAllowlist],
    domainBlocklist: [...DEFAULT_POLICY.domainBlocklist],
    rememberGrantsForTurn: DEFAULT_POLICY.rememberGrantsForTurn,
    allowScriptsWithoutPrompt: DEFAULT_POLICY.allowScriptsWithoutPrompt,
  };
}

export async function getPolicy() {
  const data = await chrome.storage.local.get([STORAGE_KEY]);
  return { ...freshDefaults(), ...(data[STORAGE_KEY] || {}) };
}

// Serializes the read-modify-write below. Concurrent patches would otherwise
// both read the pre-change policy and the slower write would win, so a rapid
// enable→disable could leave storage enabled while the control reads disabled.
// That fails OPEN on `allowScriptsWithoutPrompt`: the user believes they
// restored the confirmation prompt and scripts keep running unprompted.
//
// Single-context only. Today the sidebar is the sole writer (the SW and content
// script read but never call setPolicy), so this is sufficient; a second
// writing context would need the write funnelled through one owner.
let writeQueue = Promise.resolve();

export async function setPolicy(partial) {
  const write = writeQueue.then(async () => {
    const current = await getPolicy();
    const next = { ...current, ...partial };
    await chrome.storage.local.set({ [STORAGE_KEY]: next });
    return next;
  });
  // Swallow on the CHAIN only — a failed write must not poison later patches.
  // The returned promise still rejects for the caller.
  writeQueue = write.then(
    () => {},
    () => {},
  );
  return write;
}
