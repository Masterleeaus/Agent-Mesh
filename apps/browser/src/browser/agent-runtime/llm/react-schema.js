/**
 * JSON Schema for the ReAct decision object the orchestrator expects from
 * every LLM call. Used by the Built-in AI provider as `responseConstraint`,
 * and by `matchesReactSchema()` as a lightweight post-parse sanity check
 * for the OpenRouter / Gemini / Local paths where json_object doesn't
 * enforce a shape.
 *
 * V2 (Phase 1) — adds optional fields without breaking the V1 5-field shape:
 *
 *   { phase:           "plan"|"analyze"|"act"|"verify"|"recover",
 *     narration:       "<≤15 words, user-facing step label>",  // alias of legacy `reasoning`
 *     thought:         "<long-form reasoning>",                 // optional; gated by thinking-mode.js
 *     tool:            "<name>" | null,
 *     args:            { ... },
 *     todo_update:     { add?: [...], complete?: [...], fail?: [...] },  // Phase 4
 *     verification_required: true,                              // Phase 2 self-flag
 *     done:            true,
 *     task_complete:   true,
 *     exit_reason:     "<canonical EXIT_REASONS string>",       // optional; Phase 3
 *     reasoning:       "<legacy alias for narration>" }         // V1 back-compat
 *
 * `phase`, `narration`, and `thought` are all OPTIONAL at the schema level.
 * Whether the model is *expected* to emit them is enforced via prompt wording
 * (see src/llm/thinking-mode.js → buildPhasePromptBlock) — the schema stays
 * permissive so legacy V1 responses still validate.
 */

const PHASE_ENUM = ["plan", "analyze", "act", "verify", "recover"];

export const REACT_SCHEMA = {
  type: "object",
  properties: {
    phase: { type: "string", enum: PHASE_ENUM },
    narration: { type: "string" },
    thought: { type: "string" },
    tool: { type: ["string", "null"] },
    args: { type: "object" },
    todo_update: { type: "object" },
    verification_required: { type: "boolean" },
    done: { type: "boolean" },
    task_complete: { type: "boolean" },
    exit_reason: { type: "string" },
    // Final user-facing answer on task_complete:true turns. Unlike
    // `narration` (≤15-word step-row title), `final_answer` carries the
    // actual response the user is waiting for — summary prose, analysis,
    // the result of the work. Renders as a distinct agent bubble after
    // the step trail (matches the Manus / Do Browser pattern). Optional
    // on non-task-complete turns.
    final_answer: { type: "string" },
    // Legacy V1 alias for `narration` — accepted on input, never required.
    reasoning: { type: "string" },
  },
  additionalProperties: true,
};

export function matchesReactSchema(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  if ("tool" in value && value.tool !== null && typeof value.tool !== "string") {
    return false;
  }
  if ("args" in value && (typeof value.args !== "object" || value.args === null || Array.isArray(value.args))) {
    return false;
  }
  if ("reasoning" in value && typeof value.reasoning !== "string") {
    return false;
  }
  if ("narration" in value && typeof value.narration !== "string") {
    return false;
  }
  if ("thought" in value && typeof value.thought !== "string") {
    return false;
  }
  if ("phase" in value && (typeof value.phase !== "string" || !PHASE_ENUM.includes(value.phase))) {
    return false;
  }
  if ("todo_update" in value && (typeof value.todo_update !== "object" || value.todo_update === null || Array.isArray(value.todo_update))) {
    return false;
  }
  if ("verification_required" in value && typeof value.verification_required !== "boolean") {
    return false;
  }
  if ("done" in value && typeof value.done !== "boolean") {
    return false;
  }
  if ("task_complete" in value && typeof value.task_complete !== "boolean") {
    return false;
  }
  if ("exit_reason" in value && typeof value.exit_reason !== "string") {
    return false;
  }
  if ("final_answer" in value && typeof value.final_answer !== "string") {
    return false;
  }
  return true;
}

/**
 * Read the user-facing step label from a decision object, preferring V2
 * `narration` over V1 `reasoning`. Always returns a string (possibly empty)
 * so callers can do `if (label)` without null checks.
 */
export function readNarration(decision) {
  if (!decision || typeof decision !== "object") return "";
  if (typeof decision.narration === "string" && decision.narration) return decision.narration;
  if (typeof decision.reasoning === "string" && decision.reasoning) return decision.reasoning;
  return "";
}

/**
 * Read the long-form thought (V2 only). Returns "" when absent — callers
 * should check truthiness, not presence.
 */
export function readThought(decision) {
  if (!decision || typeof decision !== "object") return "";
  if (typeof decision.thought === "string") return decision.thought;
  return "";
}

/**
 * Read the final_answer (task_complete prose) if present. Returns ""
 * when absent or wrong type.
 */
export function readFinalAnswer(decision) {
  if (!decision || typeof decision !== "object") return "";
  if (typeof decision.final_answer === "string") return decision.final_answer;
  return "";
}

/**
 * Read the phase enum (V2). Returns null when missing or invalid so the
 * caller can decide a default (typically "act").
 */
export function readPhase(decision) {
  if (!decision || typeof decision !== "object") return null;
  if (typeof decision.phase !== "string") return null;
  return PHASE_ENUM.includes(decision.phase) ? decision.phase : null;
}

export const REACT_SCHEMA_PHASES = PHASE_ENUM.slice();
