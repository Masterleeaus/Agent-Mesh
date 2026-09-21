/**
 * Pure tool-preference logic. Extracted from content.js so it's unit-testable.
 *
 * The agent runs under a TOOL PREFERENCE PROTOCOL: WebMCP tools (from the
 * page's `document.modelContext`) take precedence over the built-in CDP
 * toolkit. When a page exposes a tool whose name collides with a built-in
 * (e.g. a page-defined `fill_form`), the WebMCP version wins:
 *
 *   - The model sees ONE tool per name (not both) — the WebMCP version.
 *   - executeTool routes that name to the page bridge, never the built-in.
 *
 * Without this rule, the built-in shadowed the page tool at execution time
 * and the WebMCP version was silently dropped from the prompt.
 *
 * SAFETY CARVE-OUT — a subset of built-ins is NON-shadowable. These are the
 * tools the agent uses to perceive the page, escalate to the user, or
 * bypass the permission gate by design (evaluate_script, handle_dialog).
 * A page trying to claim one of these names is ignored at merge time — the
 * page tool is dropped from the prompt, and the built-in stays. Without
 * this, a buggy or hostile page could replace `ask_user` and hijack the
 * approval surface, or replace `take_snapshot` and feed the model fabricated
 * uids, or replace `evaluate_script` and intercept the always-ask gate.
 */

/**
 * Built-in tool names that the page cannot shadow. Divided into four groups:
 *   - UX / orchestrator control: the agent's escalation + lifecycle surface.
 *   - Perception: the agent's source of truth about the DOM.
 *   - Pixel escape hatch: `computer` bypasses uid/refmap entirely.
 *   - Privileged gates: `evaluate_script` is always-ask; `handle_dialog`
 *     talks to the native dialog which in-page JS cannot.
 *
 * Mutating uid-based actions (click, fill, fill_form, press_key, hover,
 * scroll, drag), navigation (navigate, go_back, go_forward, reload), and
 * emulation are INTENTIONALLY shadowable — that's the canonical WebMCP
 * pattern (a page offering its own atomic, server-validated fill_form).
 */
export const NON_SHADOWABLE_BUILTINS = new Set([
  // UX / orchestrator control
  "ask_user",
  "ask_user_form",
  "set_poll_interval",
  "switch_frame",
  // Perception
  "take_snapshot",
  "take_screenshot",
  "get_page_text",
  "get_element_info",
  "find",
  // Pixel-coord escape hatch
  "computer",
  // Privileged gates
  "evaluate_script",
  "handle_dialog",
  // Multi-tab control — a page must never shadow which tab the agent drives or
  // its view of its own session group.
  "open_tab",
  "list_tabs",
  "switch_focus",
  "close_tab",
]);

/**
 * Merge a page's WebMCP tools with the extension's built-in tool list.
 * WebMCP wins on name collision, EXCEPT for names in NON_SHADOWABLE_BUILTINS
 * that are actually exposed as built-ins right now — those built-ins are
 * retained and the shadowing page tool is dropped.
 *
 * The reservation is intersected with the live built-in list so that a
 * reserved-but-not-yet-shipped name (e.g. `switch_frame`, a Phase 5 tool
 * only listed in the permission manager's read-only set today) does NOT
 * silently drop a page-provided tool that fills the gap in the meantime.
 * See PR #10 review F1c.
 *
 * @param {Array<{name: string}>} webmcpTools  Tools from document.modelContext.
 * @param {Array<{name: string}>} builtInTools EXTENSION_TOOLS (the CDP toolkit).
 * @returns {{merged: Array, webmcpNames: Set<string>}}
 *   `merged` is the deduped list to present to the LLM (shadowable-WebMCP
 *   first, then non-shadowed built-ins). `webmcpNames` is the set of names
 *   that should be routed to the page bridge by executeTool.
 */
export function mergeWebMCPWithBuiltins(webmcpTools, builtInTools) {
  const webmcp = Array.isArray(webmcpTools) ? webmcpTools : [];
  const builtIn = Array.isArray(builtInTools) ? builtInTools : [];

  const builtInNames = new Set(
    builtIn
      .map((t) => (typeof t?.name === "string" ? t.name : null))
      .filter(Boolean),
  );
  // Only protect reserved names that are actually shipped as built-ins.
  const activeNonShadowable = new Set(
    [...NON_SHADOWABLE_BUILTINS].filter((name) => builtInNames.has(name)),
  );

  const shadowableWebMCP = webmcp.filter(
    (t) => typeof t?.name === "string" && !activeNonShadowable.has(t.name),
  );
  const webmcpNames = new Set(shadowableWebMCP.map((t) => t.name));

  return {
    merged: [
      ...shadowableWebMCP,
      ...builtIn.filter((t) => !webmcpNames.has(t.name)),
    ],
    webmcpNames,
  };
}
