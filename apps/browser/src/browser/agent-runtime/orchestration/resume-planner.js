/**
 * Resume planner — decides how a session resumes after the service worker dies
 * mid-turn, without ever double-executing.
 *
 * MV3 can terminate the worker in three windows the review (M4) called out, and
 * each has a distinct correct response:
 *   1. an action was dispatched to CDP but its result never persisted (the
 *      action-journal holds a "dispatched, not completed" intent) → the outcome
 *      is UNKNOWN, so we must NOT replay it; re-perceive and let the model decide
 *      from the fresh page state.
 *   2. the turn was parked on a user question (pendingAsk) → there's nothing to
 *      re-run; wait for the answer to arrive and resume from there.
 *   3. the worker died mid-think (an in-flight turn, no journaled action) →
 *      re-perceive and re-decide; nothing committed.
 *
 * Pure decision function over inputs the orchestrator gathers on wake
 * (journal.pendingFor + the session record). No side effects.
 */
export function planResume({ pendingIntents = [], pendingAsk = null, hasActiveTurn = false } = {}) {
  // An unknown-outcome action takes precedence over everything: resolving it
  // (by re-perceiving rather than replaying) is the safety-critical case.
  if (pendingIntents.length > 0) {
    return {
      action: "re-perceive",
      reason:
        "An action was dispatched but its outcome wasn't recorded before the worker died — " +
        "re-perceive instead of replaying so it can't double-execute.",
      unreplayable: pendingIntents,
    };
  }
  if (pendingAsk) {
    return {
      action: "await-answer",
      reason: "The turn was parked on a user question; resume when the answer arrives.",
    };
  }
  if (hasActiveTurn) {
    return {
      action: "re-perceive",
      reason: "Interrupted mid-decision with nothing committed — re-perceive and re-decide.",
    };
  }
  return { action: "idle", reason: "No interrupted work to resume." };
}
