/**
 * One-shot recovery planner — fired when the loop would otherwise bail silently
 * (3-strike advisory, repeated validator-failed verdict, duplicate-spam). The
 * model gets ONE chance to either propose 1-3 replan steps that break the loop,
 * or surrender with an abort reason.
 *
 * Extracted from content.js so the content-script loop and the relocated
 * service-worker loop run the IDENTICAL build/parse logic over their own history
 * + LLM primitive (injected `fetchLLM`). Returns the loop-shaped result the
 * runReactLoop host contract consumes:
 *   { replanSteps: string[] }  — loop continues
 *   { abortReason: string }    — terminal exit (caller picks the EXIT_REASON)
 *   null                       — LLM failure / no usable plan; caller falls back
 *
 * Uses fetchLLM's `caller:"recovery"` branch (nested: suppresses stream noise,
 * does not clobber the navigator's captured thought). In the content-script loop
 * this also shares the turn's AbortController so a STOP aborts it; in the SW loop
 * the call arrives over the FETCH_LLM RPC and isn't tied to the SW turn's abort —
 * the SW loop's between-step isStopped check bounds it instead (the call is short).
 */

export const RECOVERY_SYSTEM_PROMPT = `You are a recovery planner for a browser-automation agent that is STUCK.

A signal (repeated advisory, failed verification, or duplicate action) says the current approach isn't working. You get ONE response.

Return ONE JSON object only — no prose:

  {"replan_steps": ["<step 1>", "<step 2>", "<step 3>"]}
    Propose 1-3 concrete next steps that break the loop. Each step is ≤15 words.
    Only use this when you genuinely see a different tactic — e.g. take_snapshot
    to see what changed, navigate to a different page, use a WebMCP tool instead
    of CDP clicks, ask_user for missing info.

  {"abort_reason": "<one short sentence explaining why you're giving up>"}
    Surrender honestly when you don't see a productive next step. The user will
    be told the agent stopped and why — don't hallucinate a plan you don't have.

Do NOT return a tool call. Do NOT return {done:true}. Only one of the two shapes above.`;

/**
 * @param {object} input
 * @param {Array<{role,content}>} input.history  — the stuck conversation
 * @param {string} input.trigger                 — why recovery fired (surfaced to the model)
 * @param {(messages, opts) => Promise<any>} input.fetchLLM — raw LLM primitive
 * @returns {Promise<{replanSteps: string[]} | {abortReason: string} | null>}
 */
export async function planRecovery({ history = [], trigger = "", fetchLLM } = {}) {
  if (typeof fetchLLM !== "function") return null;

  const recoveryReminder = `<system-reminder>Recovery trigger: ${trigger}. You are now in the RECOVERY phase — propose replan_steps OR set abort_reason.</system-reminder>`;
  const messages = [
    { role: "system", content: RECOVERY_SYSTEM_PROMPT },
    ...history,
    { role: "user", content: recoveryReminder },
  ];

  let result;
  try {
    result = await fetchLLM(messages, {
      schema: undefined,
      rawText: false,
      thinkingMode: { native: false, schemaThoughtRequested: false },
      caller: "recovery",
    });
  } catch {
    return null;
  }
  if (!result || typeof result !== "object" || Array.isArray(result)) return null;

  if (Array.isArray(result.replan_steps) && result.replan_steps.length > 0) {
    const steps = result.replan_steps
      .filter((s) => typeof s === "string" && s.trim())
      .map((s) => s.trim().slice(0, 200))
      .slice(0, 3);
    if (steps.length > 0) return { replanSteps: steps };
  }
  if (typeof result.abort_reason === "string" && result.abort_reason.trim()) {
    return { abortReason: result.abort_reason.trim().slice(0, 300) };
  }
  return null;
}
