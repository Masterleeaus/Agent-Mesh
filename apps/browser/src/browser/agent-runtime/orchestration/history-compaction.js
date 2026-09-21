/**
 * History compaction — when the running transcript grows past a char budget,
 * summarize the oldest entries into a compact memory string and keep only the
 * recent tail verbatim. Modeled on Claude Code's structured-compaction approach:
 * the rigid <analysis>/<summary> schema stops the compactor from echoing the
 * stream of prior decisions (which is how "wait" loops get reinforced).
 *
 * Extracted from content.js so the content-script loop and the relocated SW loop
 * run identical logic over their own history + injected LLM primitive. Pure +
 * unit-testable: returns { history: toKeep, memorySummary } when it compacts, or
 * null when below budget / there's nothing old enough to summarize.
 */

export const DEFAULT_HISTORY_BUDGET_CHARS = 48000;
export const DEFAULT_HISTORY_KEEP_CHARS = 24000;

export const COMPACT_SYSTEM_PROMPT = `CRITICAL: Respond with TEXT ONLY. Do NOT call any tools. Do NOT output JSON or tool-call syntax. Tool calls will be rejected.

You are compacting an AI agent's conversation history for continuation in a later turn. Your output must have two parts, in this exact order:

<analysis>
Think step-by-step through the transcript before writing the summary. Cover:
- Every distinct user instruction, in the order they appeared — including any refinements or corrections.
- A chronological walk through significant actions: which tool, which args, what the result was, whether it succeeded.
- Errors or surprises encountered and how the agent responded.
- What's true about the page/app right now (identity, location, balances, phase, open modals, etc.) based on the most recent evidence.
- What's still unfinished relative to the user's goal.
Be thorough here — this is your scratchpad. It will be discarded after you produce the summary.
</analysis>

<summary>
1. User's goal: [original request and any refinements]
2. Actions taken: [significant tool calls and their outcomes, grouped chronologically]
3. Current state: [what's known about the page/app now — identity, location, balance, game phase, etc.]
4. Failures & recoveries: [errors hit and how handled — most valuable for avoiding repeat mistakes]
5. Pending: [what remains to be done]

Be concrete: include tool names, key argument values, key result values. Omit filler. Target 150-300 words. Omit any numbered section that has nothing to report.
</summary>

Bad (rejected):
<summary>
The agent decided to wait for its turn. Then the tool set changed, so it decided to wait again. Then a new hand started, so it decided to wait. The agent considered whether to act but chose to wait...
</summary>
(Do not echo prior DECISIONS. Summarize what HAPPENED in the world and what's true NOW — stream-of-decisions summaries get the next turn stuck repeating the same "wait" loop.)`;

function historyCharCount(history) {
  let n = 0;
  for (const m of history) {
    if (typeof m?.content === "string") n += m.content.length;
  }
  return n;
}

/**
 * @param {object} input
 * @param {Array<{role,content}>} input.history
 * @param {string} [input.memorySummary]   — prior summary to fold in
 * @param {number} [input.budgetChars]     — compact when total chars exceed this
 * @param {number} [input.keepChars]       — keep this many recent chars verbatim
 * @param {(messages, opts) => Promise<any>} input.fetchLLM
 * @returns {Promise<{history: Array, memorySummary: string} | null>}
 */
export async function compactHistory({
  history = [],
  memorySummary = "",
  budgetChars = DEFAULT_HISTORY_BUDGET_CHARS,
  keepChars = DEFAULT_HISTORY_KEEP_CHARS,
  fetchLLM,
} = {}) {
  if (typeof fetchLLM !== "function") return null;
  if (historyCharCount(history) <= budgetChars) return null;

  // Walk backward; once we've gathered keepChars of recent content, everything
  // earlier gets summarized.
  let kept = 0;
  let splitIdx = history.length;
  for (let i = history.length - 1; i >= 0; i--) {
    const c = history[i]?.content;
    kept += typeof c === "string" ? c.length : 0;
    if (kept >= keepChars) {
      splitIdx = i;
      break;
    }
  }
  if (splitIdx <= 0) return null; // nothing old enough to summarize

  const toSummarize = history.slice(0, splitIdx);
  const toKeep = history.slice(splitIdx);
  const priorSummary = memorySummary ? `Earlier summary to incorporate:\n${memorySummary}\n\n` : "";
  const transcript = toSummarize.map((m) => `${m.role}: ${m.content}`).join("\n");

  let summary;
  try {
    const result = await fetchLLM(
      [
        { role: "system", content: COMPACT_SYSTEM_PROMPT },
        { role: "user", content: priorSummary + `Transcript to compact:\n${transcript}` },
      ],
      { rawText: true },
    );

    // fetchLLM may have parsed JSON if the model emitted a blob despite the
    // instruction — recover a string form either way, stripping any stale
    // decision keys so we don't re-inject a tool call.
    let raw;
    if (typeof result === "string") {
      raw = result;
    } else if (result && typeof result === "object") {
      const clean = { ...result };
      delete clean.tool;
      delete clean.args;
      delete clean.done;
      raw = JSON.stringify(clean);
    } else {
      raw = "";
    }

    const summaryMatch = raw.match(/<summary>([\s\S]*?)<\/summary>/i);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    } else if (raw) {
      summary = raw.replace(/<analysis>[\s\S]*?<\/analysis>/gi, "").trim();
    } else {
      summary = "";
    }
    if (!summary) {
      summary = `[${toSummarize.length} older interactions compacted — summary unavailable]`;
    }
  } catch {
    // Best-effort: drop the old entries but leave a breadcrumb so the next turn
    // knows context was trimmed rather than silently lost.
    summary = (memorySummary ? memorySummary + " " : "") + `[${toSummarize.length} older interactions trimmed]`;
  }

  return { history: toKeep, memorySummary: summary };
}
