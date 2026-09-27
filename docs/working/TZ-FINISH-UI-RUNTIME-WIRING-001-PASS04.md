# TZ-FINISH-UI-RUNTIME-WIRING-001 — Pass 4

Pass 4 closes compatibility/duplicate-entry drift without removing retained deep links.

- Added one canonical standalone compatibility-route registry.
- `/app/my-day` remains reachable but resolves to canonical `/app/my-work` from the shared registry.
- Standalone navigation consumes the same registry instead of maintaining a second alias table.
- Removed redundant `/app/my-day` AppShell active-prefix and floating-action checks because the compatibility route redirects before rendering the canonical shell.
- Preserved existing visual system and all business/runtime authority boundaries.
