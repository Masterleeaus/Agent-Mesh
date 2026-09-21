/**
 * SW loop state — the conversation history, reminders, and control flags the
 * relocated ReAct loop needs, owned in the service worker rather than the page.
 *
 * Working-memory (advisory/recordMemory) and the post-action validator stay as
 * injected collaborators (background.js wires their SW-reachable deps). Recovery
 * and history compaction run HERE — they own the loop's live history, so they
 * call the shared planRecovery / compactHistory modules over an injected raw-LLM
 * primitive (the FETCH_LLM RPC); compaction also persists the bounded transcript
 * + summary so the next turn hydrates the compacted version. This module owns
 * what is genuinely worker-resident: the history array, the compacted
 * memorySummary, the pending-reminder queue, and stopped/taskCompleted state.
 * It plugs into runReactLoop via sw-host's `loopState`.
 *
 * Factory over injected collaborators (DIP); tests pass fakes.
 */
import { planRecovery } from "./recovery.js";
import { compactHistory } from "./history-compaction.js";

const REQUIRED = [
  "emitStatus", "persistTurn", "advisory", "recordMemory", "runValidator",
  "fetchLLM", "isReadOnly", "isWebMCP", "persistCompaction", "refreshPollBaseline",
];

// Mirror content.js persistAssistantTurn so the SW history matches the original
// reactLoop exactly (react-loop.js contract): ALWAYS strip decision.thought from
// the JSON (else schema-thought text doubles in history), and re-feed the single
// canonical thought as a capped <thinking> block. The captured thought rides the
// CALL_LLM envelope (sw-host), since the SW can't see content.js's stream.
const HISTORY_THOUGHT_CAP = 4000;
function assistantEntry(decision, thoughtText = "") {
  const payload =
    decision && typeof decision === "object" && !Array.isArray(decision) ? { ...decision } : decision;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) delete payload.thought;
  const json = JSON.stringify(payload);
  if (!thoughtText) return { role: "assistant", content: json };
  const t =
    thoughtText.length > HISTORY_THOUGHT_CAP ? thoughtText.slice(0, HISTORY_THOUGHT_CAP) + "\n…[truncated]" : thoughtText;
  return { role: "assistant", content: `<thinking>\n${t}\n</thinking>\n${json}` };
}

export function createSwLoopState({ initialHistory = [], initialMemorySummary = "", ...deps } = {}) {
  for (const name of REQUIRED) {
    if (typeof deps[name] !== "function") throw new Error(`createSwLoopState: ${name} is required`);
  }

  // Seed from the durable session transcript so a follow-up turn / resume after
  // worker death continues with the prior user instructions, decisions, and tool
  // results instead of starting blank. Strip the storage `ts` back to wire shape.
  const history = initialHistory.map(({ role, content }) => ({ role, content }));
  // Compacted memory of older interactions (hydrated from the session record).
  // Surfaced to the model as a leading message via getHistory — the SW analogue
  // of content.js prepending memorySummary to the environment block.
  let memorySummary = initialMemorySummary;
  let reminders = [];
  let stopped = false;
  let taskCompleted = false;

  // Every history mutation persists the same entry to the session transcript, so
  // the durable record always matches the in-memory LLM history (resumability).
  function pushHistory(entry) {
    history.push(entry);
    deps.persistTurn(entry);
  }

  function flushReminders() {
    if (reminders.length === 0) return;
    const text = reminders.join("\n");
    reminders = [];
    pushHistory({ role: "user", content: `<system-reminder>\n${text}\n</system-reminder>` });
  }

  return {
    // control flags
    isStopped: () => stopped,
    stop: () => {
      stopped = true;
    },
    markTaskComplete: () => {
      taskCompleted = true;
      reminders = []; // stale: they described the finished task's transitions
    },
    // Lets the orchestrator ask, after the turn ends, whether the model reached
    // done:true + task_complete:true — the trigger for dissolving the tab group.
    isTaskComplete: () => taskCompleted,
    markDisengaged: () => deps.emitStatus({ state: "disengaged" }),
    endTurn: (reason, mutated) => deps.emitStatus({ state: "turn_ended", reason, mutated }),

    // history + reminders
    // Prepend the compacted memory as a leading user message so the prompt (built
    // CS-side from this history) carries it. Recovery uses the raw `history`
    // (closure) — matching content.js, where the summary rides the prompt, not
    // the recovery messages.
    getHistory: () =>
      memorySummary
        ? [{ role: "user", content: `Memory (summary of earlier interactions): ${memorySummary}` }, ...history]
        : history,
    // Mirror the content-script pushUserMessage: pending reminders flush ahead of
    // the new instruction so the model sees them as context for it.
    pushUserMessage: (text) => {
      flushReminders();
      pushHistory({ role: "user", content: String(text ?? "") });
    },
    persistAssistant: (decision, thoughtText = "") => pushHistory(assistantEntry(decision, thoughtText)),
    pushAssistantMessage: (text) => pushHistory({ role: "assistant", content: text }),
    pushToolResult: (tool, result) =>
      pushHistory({ role: "user", content: `Result of ${tool}: ${JSON.stringify(result)}` }),
    queueReminder: (text) => {
      if (text) reminders.push(text);
    },
    flushReminders,

    // injected DOM-free collaborators
    advisory: deps.advisory,
    recordMemory: deps.recordMemory,
    runValidator: deps.runValidator,
    // Recovery owns the loop's live history, so it runs here over the shared
    // planRecovery module + the injected raw-LLM primitive (FETCH_LLM RPC).
    runRecovery: (trigger) => planRecovery({ history, trigger, fetchLLM: deps.fetchLLM }),
    isReadOnly: deps.isReadOnly,
    isWebMCP: deps.isWebMCP,
    // Compact the live history when it grows past budget (shared compactHistory),
    // then persist the compacted transcript + summary so the NEXT turn hydrates
    // the bounded version — otherwise the durable transcript (append-only) would
    // re-load uncompacted and the savings would be lost. Runs post-turn (finally),
    // off the hot path.
    maybeSummarizeHistory: async () => {
      const out = await compactHistory({ history, memorySummary, fetchLLM: deps.fetchLLM });
      if (!out) return;
      history.length = 0;
      history.push(...out.history);
      memorySummary = out.memorySummary;
      await deps.persistCompaction(history.slice(), memorySummary);
    },
    refreshToolsForNextPoll: deps.refreshPollBaseline,
    lastParseFailureInfo: () => null, // the SW callLLM owns its own capture (sw-host)
  };
}
