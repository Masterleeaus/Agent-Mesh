# Codee Browser Control Engine — Browser Policy & Permission Model

**Target:** Codee v2.2.0  
**Plan:** `1addbc8d-786a-4e49-8d4a-6bce69ff517e`  
**Pass:** 2 of 22 — Browser Policy & Permission Model

## Purpose

Pass 2 adds the authorization layer that must exist before any Chrome DevTools Protocol or browser-action implementation is admitted. It does not add browser execution authority.

The canonical policy sources are:

- `src/browser/browser-policy.js`
- `src/browser/browser-policy-store.js`
- `src/lib/browser-host-integration.js`

## Explicit per-tab states

A tab may move only through the governed state model:

`disconnected -> connected-read -> connected-interactive -> developer-evaluate-enabled`

`browser.evaluate` requires the final state and remains disabled by default.

## Permission mapping

- `tab_metadata`: does not require a connected target and is limited to metadata discovery.
- `page_read` / `page_diagnostics`: require `connected-read` or stronger.
- `page_navigation` / `page_interact`: require `connected-interactive` or stronger.
- `developer_execute`: requires `developer-evaluate-enabled`.
- `tab_session`: is limited to explicit connect/disconnect policy transitions.

## Grant lifetimes

Grants are temporary and bounded. Current defaults are:

- read: 30 minutes, maximum 4 hours
- interactive: 15 minutes, maximum 1 hour
- developer execution: 5 minutes, maximum 15 minutes

Expiry is fail-closed. If the read grant expires, effective tab state becomes disconnected. If an interactive or developer grant expires, the tab automatically downgrades to the strongest remaining valid state.

## Origin and target binding

A policy record is bound to both:

- Chrome tab ID
- exact HTTP(S) origin

A tab that navigates to a different origin cannot reuse the old authorization. Restricted schemes such as `chrome:`, `chrome-extension:`, `devtools:`, `file:` and `data:` are rejected. Chrome Web Store surfaces are also rejected.

Only HTTP(S) targets can be connected in this pass.

## Extension-owned state

Temporary grants are stored in `chrome.storage.session`, not provider-page Web Storage and not `chrome.storage.local`.

If `chrome.storage.session` is unavailable, Codee falls back to worker memory only. That fallback deliberately loses grants on worker restart rather than persisting them through a weaker storage path.

## Audit trail

Connect, grant, revoke, disconnect and privileged/denied authorization checks produce bounded policy audit records. The worker also records the user-facing policy transitions through Codee's existing diagnostics event stream.

## Least privilege

Pass 2 still does **not** request:

- `debugger`
- `scripting`
- `activeTab`
- `webRequest`
- `webNavigation`
- `<all_urls>`

There is no `CALL_BROWSER_CAPABILITY` endpoint. All 40 browser capabilities remain `contract_only`; the policy layer authorizes future execution but does not execute anything itself.

## Donor influence

This pass selectively adapts security concepts rather than donor runtime code:

- Kapture: exact-origin/pinned-control-plane thinking and per-tab JavaScript-execution opt-in.
- Playwriter: explicit user-connected tabs and least-privilege permission sequencing.
- Real Browser MCP: local-control security model concepts.

No donor runner, MCP transport, broad host permission set or browser execution implementation is imported by Pass 2.

## Next pass

Pass 3 builds the canonical Tab Registry on top of this policy layer. The registry will own tab lifecycle identity, navigation/close/replacement handling and the stable session metadata later required by the CDP Session Manager.
