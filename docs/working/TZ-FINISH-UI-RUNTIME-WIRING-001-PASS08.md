# TZ-FINISH-UI-RUNTIME-WIRING-001 — Pass 8

## Outcome
Operational screens now reuse the existing AppShell-mounted `LiveRefresh` invalidation layer for background freshness. Existing `ops:refresh` mutation events are consumed immediately and propagated to sibling Titan Zero tabs through `BroadcastChannel`, with a `storage` event fallback. Visibility resume, window focus, network reconnect and bounded 30-second polling remain fallback invalidation sources for mutations originating from other users/channels.

## Authority boundary
This layer only invokes `router.refresh()` to re-read authoritative server components. It does not persist business state, replay mutations, grant permissions, execute commands, or replace the canonical offline queue/runtime.

## Safety
Refresh is skipped while offline, while the document is hidden, during recent text editing, or while an expanded menu/combobox is active. Bursty signals are coalesced to avoid redundant server refreshes.
