# Titan Code v2.11.0 — Deep Runner Diagnostics + Silent Recovery

## Purpose
This pass hardens Titan Code plan/Next Runner diagnosis and removes intrusive focus pulses from the default recovery path.

## Root cause addressed
The prior runtime could report a timer as enabled while delivery was degraded, and diagnostics did not surface enough state to distinguish plan binding, standalone Next Runner state, receiver reachability, recovery cooldown, or recent failure causes. Older recovery logic could also focus the provider window/tab and then restore the user's previous window, producing visible browser lift/drop behavior.

## Changes
- Default `focusPulse` is OFF.
- Content transport is silent-first: direct background send before any tab activation.
- Background/frozen/discarded target tabs may be activated only when needed for execution, without focusing the browser window by default.
- Window focus pulse remains an explicit optional recovery mode.
- Targeted reload remains bounded and last-resort only.
- Deep diagnostics now include standalone Next Runner state/alarm/counts, active plan inventory/binding/orphans, receiver/recovery state, reload cooldown, failure summaries and last success/failure evidence.
- Diagnostics health fails when an enabled Next Runner is degraded or when active plans exist but the diagnosed tab owns none.
- Copy All Diagnostics includes the new deep runner section and uses Titan Code branding.

## Regression gates
- Initial/standalone Next Runner receiver recovery.
- Silent recovery default does not focus browser windows.
- Optional focus-pulse behavior remains testable when explicitly enabled.
- Frozen/discarded/background plan dispatch and next nudges remain functional.
- Provider-busy does not trigger focus or reload.
- Targeted reload remains a last fallback.
- Deep diagnostics expose plan inventory, runner state, recovery state and failure summary.

## Verification
Run `npm test` from the extracted extension root. Final packaged-byte verification is recorded in the release response and SHA file.
