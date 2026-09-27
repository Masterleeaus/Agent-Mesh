# Codee Browser Control Engine — Canonical Capability Contract

**Target:** Codee v2.2.0  
**Plan:** `1addbc8d-786a-4e49-8d4a-6bce69ff517e`  
**Pass:** 1 of 22 — Canonical Browser Capability Contract

## Purpose

This pass defines the single browser API that all later browser-control implementations must satisfy. No donor project owns a parallel browser API, runner, plan state machine, settings system, diagnostics system, or MCP transport.

The canonical source is `src/browser/browser-capability-contract.js`.

## Invariants

- Stable capability IDs use the `browser.*` namespace.
- Every capability declares object input/output schemas.
- Every capability declares a permission class, operation class, read-only flag, audit policy, risk level, timeout and future Chrome permissions.
- Every capability explicitly denies plan advancement, plan completion/skipping, repository/server mutation and MCP-runtime ownership.
- Pass 1 capabilities are `contract_only`; there is no browser execution path yet.
- No donor browser implementation may be integrated unless it maps to this contract.
- Chrome manifest permissions remain unchanged in Pass 1. In particular, `debugger`, `scripting`, `activeTab`, `webRequest` and `<all_urls>` are not enabled.

## Canonical capability groups

### Session and tab metadata
`browser.tabs`, `browser.connect`, `browser.disconnect`

### Semantic page evidence
`browser.snapshot`, `browser.page_markdown`, `browser.find`, `browser.text`, `browser.screenshot`

### Navigation and viewport
`browser.navigate`, `browser.back`, `browser.forward`, `browser.reload`, `browser.viewport.set`, `browser.viewport.reset`

### Interaction
`browser.click`, `browser.double_click`, `browser.hover`, `browser.focus`, `browser.type`, `browser.insert_text`, `browser.clear`, `browser.press_key`, `browser.select`, `browser.scroll`, `browser.drag`, `browser.fill_form`

### Dialogs
`browser.dialog.current`, `browser.dialog.accept`, `browser.dialog.dismiss`

### Console and network diagnostics
`browser.console.latest`, `browser.console.errors`, `browser.console.clear`, `browser.network.list`, `browser.network.errors`, `browser.network.request`, `browser.network.response_body`

### Developer intelligence and orchestration
`browser.react_source`, `browser.styles`, `browser.compose`, `browser.evaluate`

`browser.evaluate` is deliberately classified as critical, privileged, developer execution. It remains contract-only and must stay disabled by default when implementation arrives.

## Donor mapping gate

The approved donor roles remain:

- Kapture: CDP lifecycle/input/console/network/dialog/screenshot/compose patterns.
- Playwriter: ARIA/ref snapshots, page Markdown, React-source and style-inspection algorithms.
- Real Browser MCP: local bridge/request-correlation/reconnect patterns for the separate MCP Companion.
- BrowserMCP: readable `element + ref` tool schema and fresh-post-action snapshot concepts.
- CodingBaby Browser MCP: responsive viewport ideas only.

No donor code is imported by Pass 1.
