// Eval harness — pure library.
//
// Phase 0.2 from the SOTA adoption plan: a local, offline, fast scorecard for
// tool-call accuracy on a fixed task set. The harness is a regression
// detector, not a prompt-faithful replayer of production — replicating the
// full 220-line production system prompt would drift the moment content.js
// changes. Instead we pin a compact, eval-specific prompt that's stable
// across runs so score deltas between runs are attributable to model /
// provider / wire-format changes, not harness noise.
//
// The scorecard produced here gates every subsequent capability PR —
// Phase 1.1 (native tool-use) must show a measurable pass-rate lift on this
// same harness vs JSON-in-text baseline, and every later PR runs the harness
// to confirm no regression.
//
// Public surface:
//   buildEvalMessages({task, toolManifest, systemPrompt?}) → Array<InternalMessage>
//   matchesExpected(decision, expected) → {pass, reason}
//   scoreResult({id, decision, expected, parseFailureReason?, latencyMs?, error?}) → TaskResult
//   aggregate(results) → Scorecard
//   formatHumanSummary(scorecard, results?) → string

const DEFAULT_SYSTEM_PROMPT = `You are a browser-automation agent under evaluation.

Given a page snapshot and the user's instruction, choose EXACTLY ONE next action and emit it as a single JSON object. No prose before or after.

OUTPUT SHAPES (pick one):
  1. Tool call:   {"tool":"<name>","args":{...},"narration":"<≤15 words>"}
  2. End turn:    {"done":true,"narration":"<≤15 words>"}   (OMIT "tool" — do not emit "tool":null)
  3. Terminal:    {"done":true,"task_complete":true,"final_answer":"<prose answer>","narration":"<≤15 words>"}

TOOLS (these are the ONLY valid tool names — never invent others):
{{TOOL_LIST}}

PRINCIPLES:
- On an unfamiliar page with no uids, the first action is usually take_snapshot.
- uid-based actions require uids from the most recent take_snapshot. Never pass uids from an empty / stale snapshot.
- Use ask_user when the user's request has a genuine choice they did not specify (e.g. "pick a seat" with multiple seats).
- evaluate_script is always gated by user approval — use only when no other tool fits.
- When the answer to the user's question is already visible in the snapshot, finish with {"done":true,"task_complete":true,"final_answer":"..."}.`;

export function buildEvalMessages({ task, toolManifest, systemPrompt = DEFAULT_SYSTEM_PROMPT }) {
  if (!task || typeof task !== "object") throw new Error("buildEvalMessages: task required");
  if (!Array.isArray(toolManifest)) throw new Error("buildEvalMessages: toolManifest must be an array");

  const toolList = toolManifest
    .map((t) => `- ${t.name}(${formatParams(t.params)}): ${t.description}`)
    .join("\n");
  const system = systemPrompt.replace("{{TOOL_LIST}}", toolList);

  const envParts = [`- URL: ${task.url || "about:blank"}`];
  if (task.title) envParts.push(`- Title: ${task.title}`);
  const envBlock = `Environment:\n${envParts.join("\n")}\n\nSnapshot:\n${task.snapshot || "(empty)"}`;

  const messages = [
    { role: "system", content: system },
    { role: "user", content: envBlock },
    { role: "user", content: `Task: ${task.userMessage}` },
  ];
  if (Array.isArray(task.history)) messages.push(...task.history);
  return messages;
}

function formatParams(params) {
  if (!params) return "";
  if (typeof params === "string") return params;
  if (Array.isArray(params)) return params.join(", ");
  return Object.keys(params).join(", ");
}

// ----------------------------------------------------------------------------
// Matcher — decision vs expected.
//
// DSL:
//   { tool: "click" }                     exact tool name
//   { toolIsOneOf: ["click","fill"] }     any of
//   { noTool: true, done: true }          must NOT call a tool; must end turn
//   { argsInclude: { uid: "ref_1_5" } }   subset match on args (exact values,
//                                         or nested {regex} / {anyOfValues})
//   { done: true }                        decision.done must be true
//   { taskComplete: true }                decision.task_complete must be true
//   { finalAnswerIncludes: "iOS 19" }     substring check (case-insensitive)
//   { anyOf: [exp, exp] }                 disjunction of expectations

export function matchesExpected(decision, expected) {
  if (!expected || typeof expected !== "object") return { pass: false, reason: "no-expectation" };
  if (!decision || typeof decision !== "object") return { pass: false, reason: "no-decision" };

  if (Array.isArray(expected.anyOf)) {
    for (const alt of expected.anyOf) {
      if (matchesExpected(decision, alt).pass) return { pass: true, reason: null };
    }
    return { pass: false, reason: "no-anyof-match" };
  }

  if (expected.noTool === true) {
    // Check KEY presence, not value truthiness. The eval prompt explicitly
    // says "OMIT 'tool' — do not emit 'tool':null" for an end-of-turn
    // decision; crediting {tool:null} or {tool:""} against noTool would
    // silently accept responses that violate the exact rule this task is
    // measuring (PR #31 review F4).
    if (Object.prototype.hasOwnProperty.call(decision, "tool")) {
      const shown = decision.tool === null ? "null" : JSON.stringify(decision.tool);
      return { pass: false, reason: `unexpected-tool:${shown}` };
    }
  } else {
    if (expected.tool && decision.tool !== expected.tool) {
      return { pass: false, reason: `tool-mismatch:expected=${expected.tool},got=${decision.tool || "none"}` };
    }
    if (Array.isArray(expected.toolIsOneOf) && !expected.toolIsOneOf.includes(decision.tool)) {
      return { pass: false, reason: `tool-not-in-set:${decision.tool || "none"}` };
    }
  }

  if (expected.argsInclude && typeof expected.argsInclude === "object") {
    const args = decision.args || {};
    for (const [k, v] of Object.entries(expected.argsInclude)) {
      if (!argsValueMatches(args[k], v)) {
        return { pass: false, reason: `arg-mismatch:${k}` };
      }
    }
  }

  if (expected.done === true && !decision.done) return { pass: false, reason: "not-done" };
  if (expected.taskComplete === true && !decision.task_complete) return { pass: false, reason: "not-task-complete" };

  if (typeof expected.finalAnswerIncludes === "string") {
    const fa = typeof decision.final_answer === "string" ? decision.final_answer : "";
    if (!fa.toLowerCase().includes(expected.finalAnswerIncludes.toLowerCase())) {
      return { pass: false, reason: `final-answer-missing:${expected.finalAnswerIncludes}` };
    }
  }

  return { pass: true, reason: null };
}

function argsValueMatches(actual, matcher) {
  if (matcher && typeof matcher === "object" && !Array.isArray(matcher)) {
    if (Array.isArray(matcher.anyOfValues)) return matcher.anyOfValues.includes(actual);
    if (typeof matcher.regex === "string") {
      // JS RegExp takes flags as a separate argument — it does NOT understand
      // Perl/Python-style inline `(?i)` syntax inside the pattern. Callers
      // pass flags explicitly via `matcher.flags` (e.g. "i", "im").
      if (typeof actual !== "string") return false;
      try {
        return new RegExp(matcher.regex, matcher.flags || "").test(actual);
      } catch {
        return false;
      }
    }
    // Nested-object subset: every key in matcher must pass.
    if (actual === null || typeof actual !== "object") return false;
    for (const [k, v] of Object.entries(matcher)) {
      if (!argsValueMatches(actual[k], v)) return false;
    }
    return true;
  }
  return actual === matcher;
}

// ----------------------------------------------------------------------------
// Per-task result + aggregation.

export function scoreResult({ id, decision, expected, parseFailureReason = null, latencyMs = null, error = null }) {
  if (error) {
    return {
      id,
      status: "error",
      reason: String(error?.message || error),
      tool_used: null,
      parse_failure_reason: null,
      latency_ms: latencyMs,
    };
  }
  if (parseFailureReason) {
    return {
      id,
      status: "parse_failure",
      reason: parseFailureReason,
      tool_used: null,
      parse_failure_reason: parseFailureReason,
      latency_ms: latencyMs,
    };
  }
  if (decision == null) {
    return {
      id,
      status: "error",
      reason: "no-decision (null)",
      tool_used: null,
      parse_failure_reason: null,
      latency_ms: latencyMs,
    };
  }
  const match = matchesExpected(decision, expected);
  return {
    id,
    status: match.pass ? "pass" : "fail",
    reason: match.pass ? null : match.reason,
    tool_used: decision.tool || null,
    parse_failure_reason: null,
    latency_ms: latencyMs,
  };
}

export function aggregate(results) {
  const totals = { passed: 0, failed: 0, parse_failures: 0, errors: 0 };
  const toolUsage = {};
  const parseReasons = {};
  let totalLatency = 0;
  let latencyCount = 0;

  for (const r of results) {
    if (r.status === "pass") totals.passed++;
    else if (r.status === "fail") totals.failed++;
    else if (r.status === "parse_failure") totals.parse_failures++;
    else if (r.status === "error") totals.errors++;

    if (r.tool_used) toolUsage[r.tool_used] = (toolUsage[r.tool_used] || 0) + 1;
    if (r.parse_failure_reason) {
      parseReasons[r.parse_failure_reason] = (parseReasons[r.parse_failure_reason] || 0) + 1;
    }
    if (typeof r.latency_ms === "number") {
      totalLatency += r.latency_ms;
      latencyCount++;
    }
  }

  const total = results.length;
  return {
    totals,
    pass_rate: total > 0 ? totals.passed / total : 0,
    tool_usage: toolUsage,
    parse_failure_reasons: parseReasons,
    avg_latency_ms: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : null,
  };
}

export function formatHumanSummary(scorecard, results = null) {
  const { totals, pass_rate, tool_usage, parse_failure_reasons, avg_latency_ms } = scorecard;
  const total = Object.values(totals).reduce((s, n) => s + n, 0);
  const lines = [];
  lines.push("");
  lines.push("=== Eval Scorecard ===");
  lines.push(`Total:          ${total}`);
  lines.push(`Pass:           ${totals.passed}`);
  lines.push(`Fail:           ${totals.failed}`);
  lines.push(`Parse failures: ${totals.parse_failures}`);
  lines.push(`Errors:         ${totals.errors}`);
  lines.push(`Pass rate:      ${(pass_rate * 100).toFixed(1)}%`);
  if (avg_latency_ms !== null) lines.push(`Avg latency:    ${avg_latency_ms} ms`);

  if (Object.keys(tool_usage).length) {
    lines.push("");
    lines.push("Tool usage:");
    for (const [tool, n] of Object.entries(tool_usage).sort((a, b) => b[1] - a[1])) {
      lines.push(`  ${tool.padEnd(22)} ${n}`);
    }
  }

  if (Object.keys(parse_failure_reasons).length) {
    lines.push("");
    lines.push("Parse failure reasons:");
    for (const [reason, n] of Object.entries(parse_failure_reasons).sort((a, b) => b[1] - a[1])) {
      lines.push(`  ${reason.padEnd(22)} ${n}`);
    }
  }

  if (Array.isArray(results) && results.length) {
    lines.push("");
    lines.push("Tasks:");
    for (const r of results) {
      const icon =
        r.status === "pass" ? "PASS" :
        r.status === "fail" ? "FAIL" :
        r.status === "parse_failure" ? "PARSE" : "ERR ";
      const tail = r.status === "pass" ? "" : ` — ${r.reason || "unknown"}`;
      lines.push(`  [${icon}] ${r.id}${tail}`);
    }
  }

  return lines.join("\n");
}
