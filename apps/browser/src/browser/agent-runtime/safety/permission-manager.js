/**
 * Permission decision for mutating tool calls.
 *
 * Pure: no I/O, no async. The caller is responsible for reading the policy
 * (see policy-store.js) and the per-turn grant map. This module only answers
 * the question: "given the policy, should this call proceed?"
 *
 * Precedence (high → low):
 *   1. Read-only tool           → allow
 *   2. Blocklist                → deny            (beats everything else)
 *   3. Always-ask tool          → ask
 *   4. mode = "skip"            → allow
 *   5. Allowlist                → allow
 *   6. Matching per-turn grant  → allow
 *   7. Otherwise                → ask             (default for unknown tools;
 *                                                  prevents a future mutating
 *                                                  tool missing from
 *                                                  READ_ONLY_TOOLS from
 *                                                  silently bypassing the gate)
 */
import { isBlocked } from "./blocklist.js";

// Canonical agent-facing tools that cannot mutate page or extension state.
// Read-only tools skip the gate entirely. ANY tool not in this set is treated
// as potentially mutating — decide() falls through to the policy flow, with
// "ask" as the default. Ask-by-default means an engineer forgetting to
// classify a new tool fails visibly (user sees a prompt) instead of silently
// opening a bypass.
export const READ_ONLY_TOOLS = new Set([
  // Perception
  "take_snapshot",
  "take_screenshot",
  "get_page_text",
  "get_element_info",
  "find",
  "read_console_messages",
  "list_network_requests",
  "get_network_request",
  // Waits
  "wait_for",
  "wait_for_network_idle",
  // Navigation helpers that don't leave the tab
  "switch_frame",
  // Pointer-only interactions with no state change
  "hover",
  "scroll",
  // Sidebar / lifecycle
  "ask_user",
  "ask_user_form",
  "set_poll_interval",
  // Multi-tab: reading the member list / moving focus don't mutate any page.
  "list_tabs",
  "switch_focus",
]);

// Agent-facing tools that DO mutate. Kept explicit (rather than "everything
// not read-only") because the list doubles as the approval-chip copy surface
// — the sidebar renders one permission-type badge per tool, and needs to know
// which tools warrant a "Click / Type / Navigate / …" badge vs just "Run".
export const MUTATING_TOOLS = new Set([
  "click",
  "fill",
  "fill_form",
  "press_key",
  "drag",
  "upload_file",
  "computer",
  // Phase 4 — emulation overrides change tab-wide state (UA spoofing,
  // viewport size); handle_dialog accepts/dismisses a real OS-style dialog.
  // All four are user-visible and should pass through the approval gate.
  "set_viewport",
  "set_user_agent",
  "clear_emulation",
  "handle_dialog",
  "navigate",
  "go_back",
  "go_forward",
  "reload",
  "evaluate_script",
  // Multi-tab: open_tab creates a tab (domain-gated like navigate); close_tab
  // destroys one. Both mutate the tab set.
  "open_tab",
  "close_tab",
]);

// Tools that must always prompt the user, regardless of mode or grants.
// evaluate_script is arbitrary JS eval — too powerful to auto-allow.
export const ALWAYS_ASK_TOOLS = new Set(["evaluate_script"]);

/**
 * @param {string} tool     Tool name.
 * @param {object} _input   Tool arguments (reserved for future content-aware checks).
 * @param {object} ctx
 * @param {string} ctx.domain      Current page hostname.
 * @param {string} ctx.toolUseId   Stable id per tool call; grant scope.
 * @param {object} ctx.policy      From policy-store.getPolicy().
 * @param {Map}    ctx.grants      Map<toolUseId, {domain, expiresAt?}>.
 *                                 If expiresAt is set, the grant is valid
 *                                 only while ctx.now < expiresAt. Use
 *                                 expiresAt for session-scoped or
 *                                 time-boxed approvals.
 * @param {number} [ctx.now]       Epoch-ms clock, injectable for tests.
 *                                 Defaults to Date.now().
 * @returns {"allow" | "ask" | "deny"}
 */
export function decide(tool, _input, ctx) {
  const { domain, toolUseId, policy, grants, now = Date.now() } = ctx;

  if (READ_ONLY_TOOLS.has(tool)) return "allow";
  if (isBlocked(domain, policy.domainBlocklist)) return "deny";
  // Arbitrary code execution is gated independently of `mode`. It can reach
  // every capability the other gates protect, so auto-approving it as a side
  // effect of "auto-approve routine actions" would make those gates
  // decorative. Only the dedicated opt-out releases it — and never past the
  // blocklist, which is checked above.
  if (ALWAYS_ASK_TOOLS.has(tool)) {
    return policy.allowScriptsWithoutPrompt === true ? "allow" : "ask";
  }
  if (policy.mode === "skip") return "allow";
  if (isAllowed(domain, policy.domainAllowlist)) return "allow";
  if (grantMatches(grants, toolUseId, domain, now)) return "allow";
  return "ask";
}

function isAllowed(domain, allowlist) {
  if (!Array.isArray(allowlist) || allowlist.length === 0) return false;
  const d = String(domain).toLowerCase();
  for (const pattern of allowlist) {
    const p = String(pattern).toLowerCase();
    if (d === p) return true;
    if (d.endsWith("." + p)) return true;
  }
  return false;
}

function grantMatches(grants, toolUseId, domain, now) {
  if (!grants) return false;
  const g = grants.get(toolUseId);
  if (!g) return false;
  if (g.domain !== domain) return false;
  // Inclusive expiry: a grant issued with `expiresAt === now` is treated as
  // just expired. Callers that want indefinite grants simply omit expiresAt.
  if (g.expiresAt != null && g.expiresAt <= now) return false;
  return true;
}
