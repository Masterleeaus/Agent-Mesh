# TZ-FINISH-UI-RUNTIME-WIRING-001 — Pass 03

## Outcome

Bound the standalone Business, Workforce, Customers, Jobs, Quotes, Scheduling, Invoices, Marketplace and Settings surfaces to their existing native service/runtime owners without replacing the current UI or creating a second command plane.

## Changes

- Added `titan.ui.native-service-binding.v1` with explicit company-scoped, non-authoritative bindings for all nine Pass 3 surfaces.
- Added a generated reachability matrix proving every declared page, native module and API route currently exists.
- Added binding calls to the existing server-rendered pages after session validation so each surface declares its native owner at runtime.
- Wired Settings Workforce Lifecycle to a read-only projection of the canonical starter-agent registry using the native lifecycle health/compatibility contracts.
- Preserved governed workforce command authority and marketplace ownership outside Settings; the new bindings never grant execution authority.
- Preserved the current visual system and all existing page/query behavior.
- Forward-reconciled from Merge55 onto Manager Merge56, including the three Manager retriever tombstones, before applying Pass 2 + Pass 3 lane work.

## Verification

- Native service reachability: 9/9 surfaces ready; no missing declared page/module/API targets.
- Native binding runtime assertions: 29/29 PASS.
- Surface wiring assertions: 12/12 PASS.
- Focused TypeScript compile for the new binding + lifecycle projection: PASS.
- Broad `apps/web` TypeScript compile could not run in this reconstructed artifact because installed web dependencies / `@types/node` are not included in the canonical ZIP; this is an environment limitation, not treated as a code pass.

## Authority

Bindings are descriptive and company-scoped only. Identity is not authority. Workforce execution remains behind the governed workforce command gateway. Marketplace lifecycle ownership remains with the marketplace/module owner. Settings is inspection/configuration UI only.
