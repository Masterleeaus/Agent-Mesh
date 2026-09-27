/**
 * Read-only tool classifier — the single source of truth for "did this tool
 * mutate the page?", used by the ReAct loop to decide post-tool snapshot-seal
 * rotation (a mutating tool invalidates the snapshot so stale uids fail closed).
 *
 * Shared by the content-script loop (cs-host's isReadOnly) and the relocated
 * service-worker loop (background.js's isReadOnly) so the two NEVER diverge — a
 * narrower SW copy previously misclassified take_snapshot as mutating, which
 * invalidated the snapshot the agent had just taken (its seal went stale before
 * the next uid-based action).
 *
 * Conservative contract: when in doubt, treat as MUTATING (return false). Prefix
 * families that are conventionally read-only across the ecosystem are matched;
 * `take_` is deliberately EXCLUDED because WebMCP pages define their own
 * take_seat/take_action/take_bet tools that are squarely mutating — the two
 * legitimate take_* read-only tools (take_snapshot, take_screenshot) are
 * enumerated by name instead.
 */
export const READ_ONLY_TOOL_PATTERN = /^(get_|find_|read_|list_|inspect_|peek_|query_|fetch_|describe_|view_|show_|search_)/;

export const READ_ONLY_TOOL_NAMES = new Set([
  "auth_status",
  "ask_user",
  "ask_user_form",
  "set_poll_interval",
  "get_element_info",
  "find",
  "take_snapshot",
  "take_screenshot",
]);

export function isReadOnlyTool(name) {
  return READ_ONLY_TOOL_NAMES.has(name) || READ_ONLY_TOOL_PATTERN.test(name);
}
