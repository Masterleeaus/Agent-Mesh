/**
 * Status persister — turns a ReAct status event into a durable
 * session_state_${tabId} entry (the user-facing transcript the side panel
 * renders).
 *
 * Extracted verbatim from background.js so that, once the agent loop relocates
 * into the service worker, the orchestrator's `emitStatus` reuses the SAME logic
 * rather than a raw `append`. That matters: this is where the incognito no-trace
 * gate, the clear-truncate swallow window, the streaming-thought upsert, and the
 * per-kind shaping live — dropping to a bare append would regress privacy,
 * reopen the post-CLEAR_SESSION contamination race, and explode the transcript
 * with one row per streamed token.
 *
 * Factory over its writers (DIP); both background.js (real per-tab-state +
 * incognito gate) and the SW orchestrator construct it with their own deps.
 */
export function createStatusPersister({
  appendSession,
  upsertThought,
  clearPendingAsk,
  shouldPersist,
  clearingTabs,
} = {}) {
  if (typeof appendSession !== "function") throw new Error("createStatusPersister: appendSession is required");
  if (typeof upsertThought !== "function") throw new Error("createStatusPersister: upsertThought is required");
  if (typeof clearPendingAsk !== "function") throw new Error("createStatusPersister: clearPendingAsk is required");
  // The incognito no-trace gate and the clear-truncate swallow window are safety
  // collaborators — fail fast rather than silently default them permissive.
  if (typeof shouldPersist !== "function") throw new Error("createStatusPersister: shouldPersist is required");
  if (!clearingTabs || typeof clearingTabs.has !== "function" || typeof clearingTabs.delete !== "function") {
    throw new Error("createStatusPersister: clearingTabs (a Set) is required");
  }

  function persist(tabId, s) {
    // Incognito gate: chrome.storage.local is shared across normal/incognito, so
    // persisting an incognito turn would violate "leaves no trace". The panel
    // still renders live events via runtime broadcast; they just don't survive.
    if (!shouldPersist(tabId)) return;
    if (!s || !s.state) return;
    const state = s.state;

    // Clear-truncate swallow window: after CLEAR_SESSION, drop in-flight events
    // from the old turn until it quiesces. Release only on the turn's TERMINAL
    // event — a recoverable error is non-terminal (the loop continues past it),
    // so releasing there would let later events from the cleared turn leak in.
    if (clearingTabs.has(tabId)) {
      if (
        state === "turn_ended" ||
        state === "disengaged" ||
        (state === "error" && s.recoverable !== true)
      ) {
        clearingTabs.delete(tabId);
      }
      return;
    }

    // Ephemeral ticks drive the typing indicator only — never persisted, so the
    // replay path can't resurrect a stale cursor.
    if (state === "thinking" || state === "stream_start" || state === "stream_token"
      || state === "stream_thought_tail" || state === "stream_end") {
      return;
    }
    if (state === "validator_running") return; // transient spinner; verdict is the durable record

    if (state === "stream_thought") {
      // Cumulative reasoning trace — supersede the turn's thought record each tick.
      upsertThought(tabId, s.text || "", { totalChars: s.totalChars }).catch(() => {});
      return;
    }
    if (state === "turn_ended") {
      clearPendingAsk(tabId).catch(() => {});
      appendSession(tabId, { kind: "turn_ended", reason: s.reason, mutated: !!s.mutated }).catch(() => {});
      return;
    }
    if (state === "decided" && s.reasoning) {
      appendSession(tabId, { kind: "agent", text: s.reasoning }).catch(() => {});
      return;
    }
    if (state === "final_answer" && s.text) {
      appendSession(tabId, { kind: "final_answer", text: s.text }).catch(() => {});
      return;
    }
    if (state === "tool_call") {
      appendSession(tabId, {
        kind: "tool_call",
        tool: s.tool,
        args: s.args,
        ...(s.webmcp === true ? { webmcp: true } : {}),
      }).catch(() => {});
      return;
    }
    if (state === "tool_result") {
      appendSession(tabId, {
        kind: "tool_result",
        tool: s.tool,
        result: s.result,
        isError: !!s.isError,
      }).catch(() => {});
      return;
    }
    if (state === "error") {
      appendSession(tabId, {
        kind: "error",
        message: s.message || "Unknown error",
        ...(s.recoverable === true ? { recoverable: true } : {}),
      }).catch(() => {});
      return;
    }
    if (state === "agent_message") {
      appendSession(tabId, { kind: "agent", text: s.text }).catch(() => {});
      return;
    }
    if (state === "agent_advisory") {
      appendSession(tabId, { kind: "agent_advisory", text: s.text }).catch(() => {});
      return;
    }
    if (state === "phase_change") {
      appendSession(tabId, { kind: "phase_change", phase: s.phase || "act" }).catch(() => {});
      return;
    }
    if (state === "validator_verdict") {
      appendSession(tabId, {
        kind: "validator_verdict",
        tool: s.tool || "",
        verdict: s.verdict || "ambiguous",
        evidence: s.evidence || "",
        retry_hint: s.retry_hint || "",
      }).catch(() => {});
      return;
    }
    if (state === "disengaged") {
      appendSession(tabId, { kind: "disengaged" }).catch(() => {});
    }
  }

  return { persist };
}
