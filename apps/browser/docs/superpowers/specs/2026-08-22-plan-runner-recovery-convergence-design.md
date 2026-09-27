# Plan Runner Recovery Convergence Design

## Goal
Port the stronger Codee v2.0.20 Plan Runner recovery/composer-watchdog behavior into the current v2.8.0 governed platform without downgrading Titan MCP 1.5, strict artifact verification, navigation, dashboard, connections, capability registry, repository intelligence, workforce, or least-privilege browser policy.

## Root cause of off-screen stalls
The v2.8.0 one-minute recovery sweep discovers ChatGPT/Claude tabs but sends `CHECK_FOR_ZIP`, `GET_PAGE_STATE`, and `SEND_PROMPT` directly with `chrome.tabs.sendMessage`. It does not first account for `tab.frozen`, `tab.discarded`, background-only composer mounting, or a missing/invalidated content-script receiver. `dispatchCurrentStep()` likewise uses direct content messaging. A background/discarded conversation therefore fails at content reachability or composer detection, moves into retry/backoff, and remains stalled until foreground activation makes the tab runnable again.

## Architecture
Introduce a recovery boundary around content operations. It may temporarily activate the exact bound conversation, disable auto-discard for active Codee plans, wait for discarded/reloading tabs to become runnable, probe the composer, optionally perform a targeted reload when the provider is idle, then restore the user's previously active tab. It never substitutes another conversation and never grants plan advancement authority.

Restore parser behavior for Pass-style plans and add generated 10-pass Debugging Plan mode. Preserve v2.8 strict Artifact Protocol v2: legacy ZIP candidates may aid diagnostics/reconciliation but may not advance a strict plan without independent verification.

## Security / authority constraints
- No `scripting` or debugger permission is added in this convergence.
- No content-script reinjection; targeted reload relies on manifest content-script remount.
- Exact bound conversation identity is revalidated after wake/reload.
- Never reload while provider diagnostics indicate generation/busy state.
- Recovery operations do not rotate step tokens or bypass exactly-once submission receipts.
- AI/model output cannot self-authorize plan advancement.
- Strict signature-v2 plans require verified artifact receipts.
- Previous active tab is restored after a temporary recovery focus pulse.

## Deliverables
1. Pass/numbered-plan parser restoration with regression coverage.
2. Background-tab wake/focus/auto-discard prevention and composer watchdog around content messaging.
3. Recovery sweep integration for pending sends and awaiting-artifact plans.
4. Optional five-minute Next nudger that never overwrites drafts or advances plan state.
5. Recovery settings/diagnostics UI and generated 10-pass Debugging Plan action.
6. Strict artifact compatibility guard preventing legacy ZIP fallback from advancing signature-v2 plans.
7. Release as v2.8.1 recovery convergence hotfix; master remains 7/32.
