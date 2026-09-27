# TZ-FINISH-UI-RUNTIME-WIRING-001 — Pass 05

Completed standalone route-state closure without replacing the existing visual system or authority model.

- Added `SurfaceState` for loading, empty, error, permission and offline semantics.
- Added app-level loading and error boundaries.
- Added passive connection status to AppShell; it never queues or executes commands.
- Added missing loading boundaries for Schedule, Invoices, Settings, Dispatch and Work Orders.
- Added explicit empty states for Schedule, Dispatch and missing company Settings.
- Protected Estimates and Invoices now show an explicit permission-denied surface to technicians while retaining the same access denial.
- Generated core surface state coverage evidence.

Verification: changed TS/TSX syntax transpile 16/16 PASS; static state assertions 18/18 PASS. Full web typecheck is unavailable in the reconstructed canonical because installed web dependencies / `@types/node` are not present.
