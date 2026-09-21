/**
 * runReactLoop — the agent's per-turn ReAct control loop, extracted from
 * content.js's `reactLoop` so the SAME control flow can run in the content
 * script today and in the service worker after the relocation.
 *
 * The loop body never touches the DOM or chrome.* directly — every external
 * effect goes through the injected `host`, and every cross-turn flag through
 * `host` getters/setters. That is what lets one implementation run in both
 * contexts: in the content script `host` is built from the existing in-process
 * functions; in the SW it is built from RPCs to the content script + the merged
 * dispatch/journal/persist modules.
 *
 * This is a behavior-preserving extraction of an intricate, previously-untested
 * loop, so it ships with characterization tests (test/react-loop.test.js) that
 * pin the observable control flow: parse-failure retry/fatal/cap, done vs
 * task_complete, unknown-tool and duplicate-call course-correction, the
 * working-memory advisory gate, post-action snapshot invalidation, and the
 * validator→phase/recovery routing.
 *
 * @param {object} host  external effects + state access (see HOST CONTRACT below)
 * @param {object} config { maxSteps, maxParseFailures, exitReasons, helpers... }
 *
 * HOST CONTRACT (all the loop knows about the outside world):
 *   isStopped(): boolean            markTaskComplete(): void
 *   stop(): void                    markDisengaged(): void
 *   emitStatus(s): void             callLLM({tools, phase}): Promise<decision|null>
 *   lastParseFailureInfo(): info    persistAssistant(decision): void
 *   pushAssistantMessage(text): void
 *   dispatchTool(tool, args): Promise<result>   (may throw)
 *   advisory(tool, args): Promise<string|null>
 *   recordMemory(tool, args, result, isError): Promise<void>
 *   pushToolResult(tool, result): void
 *   invalidateSnapshot(reason): void
 *   runValidator({decision, preState, toolMutated, resultIsError}): Promise<verdict|null>
 *   runRecovery(trigger): Promise<{replanSteps?:string[], abortReason?:string}|null>
 *   queueReminder(text, opts): void          flushReminders(): void
 *   discoverTools(): Promise<tool[]>         preState(): {url, title}
 *   endTurn(reason, mutated): void           settle(): Promise<void>
 *   isReadOnly(tool): boolean                isWebMCP(tool): boolean
 *   refreshToolsForNextPoll(): Promise<void> maybeSummarizeHistory(): Promise<void>
 *
 * Contract obligations the loop relies on (so adapters in CS and SW match the
 * original reactLoop exactly):
 *   - callLLM MUST reset the parse-failure capture and thread the provider's
 *     onParseFailure internally, so lastParseFailureInfo() returns *this* call's
 *     info and the parse-failure diagnostic (RECORD_DIAG) still fires.
 *   - persistAssistant MUST reproduce the original's thought handling (strip
 *     decision.thought, prepend the captured <thinking> block).
 *   - stop() MUST do what the original's `stopped=true; activeLoop=false;
 *     stopPolling()` did; markDisengaged() MUST emit a {state:"disengaged"} status.
 *   - runRecovery returns camelCase {replanSteps}; the adapter maps the
 *     underlying snake_case replan_steps.
 *   - endTurn only emits a turn-end status (+ latches lastTurnMutated); it does
 *     NOT itself end the loop — the loop returns explicitly.
 */

import {
  buildParseFailureReminder as defaultParseFailureReminder,
  fatalFailureMessage as defaultFatalFailureMessage,
  providerUnavailableMessage as defaultProviderUnavailableMessage,
} from "./failure-messages.js";

// Hard ceiling on how long the loop will park waiting to retry. This loop is
// the SW-resident one by default, and a service worker parked on a long idle
// timer is a candidate for eviction mid-turn. If the provider asks for longer
// than this, we stop and say so rather than sleeping through it or — worse —
// ignoring Retry-After and hammering a service that just rate-limited us.
const MAX_TRANSIENT_WAIT_MS = 2000;

function transientWaitMs(info, attempt) {
  const asked = Number(info?.retryAfterMs) || 0;
  if (asked > MAX_TRANSIENT_WAIT_MS) return null; // can't honour it — don't retry
  return asked || Math.min(500 * (2 ** attempt), MAX_TRANSIENT_WAIT_MS);
}

export async function runReactLoop(host, config = {}) {
  const {
    maxSteps = 50,
    maxParseFailures = 3,
    exitReasons: exitReasonOverrides,
    // Real implementations, not stubs. The SW loop is the default route and
    // background.js builds its runtime with `config: {}`, so a placeholder here
    // silently becomes production copy — a rejected request rendered "The agent
    // couldn't continue." and a retry got the bare reason string.
    buildParseFailureReminder = defaultParseFailureReminder,
    fatalFailureMessage = defaultFatalFailureMessage,
    providerUnavailableMessage = defaultProviderUnavailableMessage,
    maxTransientRetries = 2,
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    readDecisionPhase = (d) => d?.phase,
    readDecisionLabel = (d) => d?.narration || d?.reasoning,
    stableStringify = (v) => JSON.stringify(v),
    initialTools = null,
  } = config;

  // MERGE, don't replace. Callers pass their own map — content.js's has extra
  // reasons of its own (ABORTED, MAX_WAKEUPS, RECOVERY_BAILED) — and replacing
  // meant any reason the caller hadn't heard of resolved to `undefined`.
  // endTurn(undefined) then lands in the sidebar's unknown-reason fallback and
  // the diagnosis is lost, silently. Merging keeps caller values authoritative
  // while guaranteeing every reason this loop can emit has a string.
  const exitReasons = { ...DEFAULT_EXIT_REASONS, ...exitReasonOverrides };

  // Use the caller's already-discovered tool set for the first step when given
  // (the content-script path discovers before invoking); otherwise discover now.
  let tools = initialTools ?? (await host.discoverTools());

  let lastCallKey = null;
  let duplicateRejects = 0;
  let advisoryRejects = 0;
  let parseFailures = 0;
  let transientRetries = 0;
  let mutatedState = false;
  // Broader than mutatedState (read-only tools set it too) — gates the
  // post-turn prevToolNames refresh in the finally so we only clobber the
  // poll baseline when WE caused the tool-set change.
  let toolExecuted = false;
  let nextPhase = "act";
  let lastEmittedPhase = null;
  let consecutiveAmbiguous = 0;
  let consecutiveFailedValidatorKey = null;
  let consecutiveFailedValidatorCount = 0;
  let recoveryTriggered = false;

  // Single entry point for every bail signal: try one-shot recovery, else end.
  // Returns "continue" (recovery replanned) or "terminal" (caller must return).
  async function bailOrRecover(trigger, terminalExit) {
    if (recoveryTriggered) {
      host.endTurn(terminalExit, mutatedState);
      return "terminal";
    }
    recoveryTriggered = true;
    host.emitStatus({ state: "phase_change", phase: "recover" });
    lastEmittedPhase = "recover";
    const out = await host.runRecovery(trigger);
    if (out && Array.isArray(out.replanSteps) && out.replanSteps.length > 0) {
      const bullet = out.replanSteps.map((s, i) => `${i + 1}. ${s}`).join("\n");
      host.queueReminder(`Recovery plan — try this instead:\n${bullet}`);
      host.flushReminders();
      host.pushAssistantMessage(
        JSON.stringify({ phase: "recover", narration: "Replanning", replan_steps: out.replanSteps }),
      );
      advisoryRejects = 0;
      duplicateRejects = 0;
      consecutiveAmbiguous = 0;
      consecutiveFailedValidatorCount = 0;
      consecutiveFailedValidatorKey = null;
      nextPhase = "act";
      host.emitStatus({ state: "agent_advisory", text: `Recovery: replanning (${trigger}).` });
      return "continue";
    }
    host.emitStatus({
      state: "agent_advisory",
      text: out?.abortReason ? `Recovery: ${out.abortReason}` : `Recovery: unable to replan (${trigger}).`,
    });
    host.endTurn(terminalExit, mutatedState);
    return "terminal";
  }

  try {
  for (let step = 0; step < maxSteps; step++) {
    if (host.isStopped()) return;
    if (step === 0) host.flushReminders();

    host.emitStatus({ state: "thinking" });
    const decision = await host.callLLM({ tools, phase: nextPhase });
    if (host.isStopped()) return;

    const decisionPhase = readDecisionPhase(decision) || nextPhase || "act";
    if (decisionPhase !== lastEmittedPhase) {
      host.emitStatus({ state: "phase_change", phase: decisionPhase });
      lastEmittedPhase = decisionPhase;
    }

    // PARSE FAILURE — null means unparseable output, NOT an intentional
    // turn-end. Retry with a corrective reminder; bail only after the cap.
    if (decision === null) {
      const info = host.lastParseFailureInfo();

      // Transient provider failure (429 / 5xx). The model produced NOTHING, so
      // this is not a parse failure: queueing "your previous response could not
      // be parsed as JSON" would put a false statement in the history, and
      // spending the parse-failure budget on it ends the turn reporting
      // unparseable output for what was really a server error. Own budget, no
      // reminder, brief backoff.
      if (info?.retryable && !info?.fatal) {
        const waitMs = transientWaitMs(info, transientRetries);
        if (waitMs === null || transientRetries >= maxTransientRetries) {
          host.emitStatus({ state: "error", message: providerUnavailableMessage(info) });
          host.endTurn(exitReasons.PROVIDER_UNAVAILABLE, mutatedState);
          return;
        }
        transientRetries++;
        await wait(waitMs);
        continue;
      }

      parseFailures++;
      if (info?.fatal) {
        host.emitStatus({ state: "error", message: fatalFailureMessage(info) });
        host.endTurn(exitReasons.PARSE_FAILURE, mutatedState);
        host.stop();
        host.markDisengaged();
        return;
      }
      if (parseFailures >= maxParseFailures) {
        host.emitStatus({
          state: "error",
          message: `LLM produced unparseable output ${maxParseFailures} times — ending turn.`,
        });
        host.endTurn(exitReasons.PARSE_FAILURE, mutatedState);
        return;
      }
      host.queueReminder(buildParseFailureReminder(info), { dedupe: false });
      host.flushReminders();
      continue;
    }
    // Both budgets are CONSECUTIVE, not per-turn quotas: a decision arrived, so
    // the model is producing parseable output and the provider is reachable.
    // Leaving transientRetries latched meant one blip early in a long turn
    // disarmed the retry path for the rest of it — a step-40 outage would end
    // the turn immediately because a step-2 outage had already recovered.
    // Resetting the counter also restarts the backoff ramp, which is right: a
    // fresh outage should begin at the short delay, not continue an old climb.
    parseFailures = 0;
    transientRetries = 0;

    // Intentional turn-end: explicit done, legacy wait, or no tool field.
    if (decision.done === true || decision.tool === "wait" || !decision.tool) {
      const label = readDecisionLabel(decision);
      if (label) host.emitStatus({ state: "decided", reasoning: label });
      const finalAnswer =
        decision.task_complete === true && typeof decision.final_answer === "string"
          ? decision.final_answer.trim()
          : "";
      if (finalAnswer) host.emitStatus({ state: "final_answer", text: finalAnswer });
      host.persistAssistant(decision);
      if (decision.done === true && decision.task_complete === true) {
        host.markTaskComplete();
      }
      host.endTurn(
        decision.task_complete === true ? exitReasons.TASK_COMPLETE : exitReasons.WAITING_FOR_ENV,
        mutatedState,
      );
      return;
    }

    const stepLabel = readDecisionLabel(decision);
    if (stepLabel) host.emitStatus({ state: "decided", reasoning: stepLabel });
    host.persistAssistant(decision);

    // Unknown tool — recoverable course-correction, loop continues.
    if (!tools.some((t) => t.name === decision.tool)) {
      const errMsg = `Tool "${decision.tool}" does not exist. Available tools: ${tools.map((t) => t.name).join(", ")}.`;
      host.emitStatus({ state: "error", message: errMsg, recoverable: true });
      host.queueReminder(`${errMsg} Pick a tool from the list, or end your turn with {"done": true}.`);
      host.flushReminders();
      continue;
    }

    // Reject an exact duplicate of the previous executed call; two in a row → recover.
    const callKey = `${decision.tool}:${stableStringify(decision.args || {})}`;
    if (callKey === lastCallKey) {
      duplicateRejects++;
      const errMsg = `Duplicate call: ${decision.tool} was just called with these exact args and returned a result. Use that result, pick a different tool, or end your turn.`;
      host.emitStatus({ state: "error", message: errMsg, recoverable: true });
      host.queueReminder(errMsg);
      host.flushReminders();
      if (duplicateRejects >= 2) {
        const res = await bailOrRecover(`duplicate call repeated (${decision.tool})`, exitReasons.DUPLICATE_SPAM);
        if (res === "terminal") return;
      }
      continue;
    }
    duplicateRejects = 0;
    lastCallKey = callKey;

    // Working-memory advisory gate (no-progress / repeated-error); three → recover.
    const advisory = await host.advisory(decision.tool, decision.args || {});
    if (advisory) {
      advisoryRejects++;
      host.emitStatus({ state: "agent_advisory", text: advisory });
      host.queueReminder(advisory);
      host.flushReminders();
      if (advisoryRejects >= 3) {
        const res = await bailOrRecover(
          "3 consecutive working-memory advisories (no-progress/repeated-error)",
          exitReasons.OSCILLATION,
        );
        if (res === "terminal") return;
      }
      continue;
    }
    advisoryRejects = 0;

    host.emitStatus({
      state: "tool_call",
      tool: decision.tool,
      args: decision.args || {},
      webmcp: host.isWebMCP(decision.tool),
    });

    // await: the CS host returns {url,title} synchronously; the SW host fetches
    // it over RPC (a Promise). awaiting a plain value is a harmless no-op.
    const preState = await host.preState();

    let result;
    let isErr = false;
    try {
      result = await host.dispatchTool(decision.tool, decision.args || {});
    } catch (err) {
      result = { error: err.message };
      isErr = true;
    }
    if (host.isStopped()) return;

    host.emitStatus({ state: "tool_result", tool: decision.tool, result, isError: isErr });
    toolExecuted = true;
    const toolMutated = !host.isReadOnly(decision.tool);
    if (toolMutated) mutatedState = true;
    const resultIsError = isErr || (result && typeof result === "object" && typeof result.error === "string");

    await host.recordMemory(decision.tool, decision.args || {}, result, resultIsError);
    host.pushToolResult(decision.tool, result);

    // Post-mutation staleness guarantee: a successful non-read-only tool rotates
    // the snapshot seal so stale uids fail deterministically next call. Errors
    // don't invalidate — the action didn't take effect.
    if (toolMutated && !resultIsError) {
      host.invalidateSnapshot(`tool:${decision.tool}`);
    }

    const validatorVerdict = await host.runValidator({ decision, preState, toolMutated, resultIsError });
    if (host.isStopped()) return;

    let validatorOverridePhase = null;
    let validatorRecoveryTrigger = null;
    if (validatorVerdict) {
      if (validatorVerdict.verdict === "failed") {
        consecutiveAmbiguous = 0;
        const hint = validatorVerdict.retry_hint ? ` Suggested fix: ${validatorVerdict.retry_hint}` : "";
        host.queueReminder(`Validator: the previous action did NOT commit. ${validatorVerdict.evidence}${hint}`);
        validatorOverridePhase = "recover";
        if (consecutiveFailedValidatorKey === callKey) {
          consecutiveFailedValidatorCount += 1;
        } else {
          consecutiveFailedValidatorKey = callKey;
          consecutiveFailedValidatorCount = 1;
        }
        if (consecutiveFailedValidatorCount >= 2) {
          validatorRecoveryTrigger = `validator failed twice on ${decision.tool} (${validatorVerdict.evidence})`;
        }
      } else if (validatorVerdict.verdict === "ambiguous") {
        consecutiveAmbiguous++;
        consecutiveFailedValidatorCount = 0;
        consecutiveFailedValidatorKey = null;
        if (consecutiveAmbiguous >= 2) {
          host.queueReminder(
            `Validator: two consecutive ambiguous verdicts (${validatorVerdict.evidence}). Re-plan a different approach.`,
          );
          validatorOverridePhase = "recover";
          consecutiveAmbiguous = 0;
        }
      } else if (validatorVerdict.verdict === "committed") {
        consecutiveAmbiguous = 0;
        consecutiveFailedValidatorCount = 0;
        consecutiveFailedValidatorKey = null;
      }
    }

    // Phase advice for the NEXT call (the model's own decision.phase still wins).
    if (validatorOverridePhase) {
      nextPhase = validatorOverridePhase;
    } else if (resultIsError && toolMutated) {
      nextPhase = "recover";
    } else if (toolMutated && !resultIsError) {
      nextPhase = validatorVerdict?.verdict === "committed" ? "act" : "verify";
    } else {
      nextPhase = "act";
    }

    if (validatorRecoveryTrigger) {
      const res = await bailOrRecover(validatorRecoveryTrigger, exitReasons.VERIFICATION_FAILED);
      if (res === "terminal") return;
      // Only continue-path that runs AFTER a mutation, so the tool set may have
      // changed — refresh before the recovery's next step plans.
      try {
        tools = await host.discoverTools();
      } catch {
        /* tool refresh is best-effort */
      }
      continue;
    }

    await host.settle();
    if (host.isStopped()) return;
    tools = await host.discoverTools();
  }

  // Budget exhausted without an explicit end.
  host.endTurn(exitReasons.MAX_STEPS, mutatedState);
  } finally {
    // Runs on EVERY exit (each return, the fatal branch, MAX_STEPS, an
    // exception). Only refresh the poll baseline when WE executed a tool —
    // otherwise we'd erase evidence that the tool set changed during a "wait"
    // decision and the next poll wouldn't re-fire. Compaction runs here, in the
    // idle window after the turn, so it never adds latency to the hot decision
    // path; skipped when stopped (the user wants out, not more LLM work).
    if (toolExecuted) await host.refreshToolsForNextPoll();
    if (!host.isStopped()) {
      try {
        await host.maybeSummarizeHistory();
      } catch {
        /* post-turn compaction is best-effort */
      }
    }
  }
}

export const DEFAULT_EXIT_REASONS = Object.freeze({
  TASK_COMPLETE: "task_complete",
  WAITING_FOR_ENV: "waiting_for_env",
  PARSE_FAILURE: "parse_failure",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  DUPLICATE_SPAM: "duplicate_spam",
  OSCILLATION: "oscillation",
  VERIFICATION_FAILED: "verification_failed",
  MAX_STEPS: "max_steps",
});
