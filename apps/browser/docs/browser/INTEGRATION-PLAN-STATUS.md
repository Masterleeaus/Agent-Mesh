# Codee v2.2.0 Browser Control Engine + MCP Foundation — Plan Status

- PLAN_ID: `1addbc8d-786a-4e49-8d4a-6bce69ff517e`
- Total passes: 22
- Completed: 2
- Remaining: 20
- Current completed pass: **Pass 2 — Browser Policy & Permission Model**
- Next pass: **Pass 3 — Canonical Tab Registry**

## Pass 1 — complete

Forty canonical `browser.*` capability contracts are defined and registered with schemas, risk/permission/audit metadata and strict authority boundaries.

## Pass 2 — complete

Codee now has an explicit per-tab policy model with these states:

`disconnected -> connected-read -> connected-interactive -> developer-evaluate-enabled`

The policy is exact-origin bound, rejects restricted browser targets, uses temporary bounded grants, stores grant state in extension-owned `chrome.storage.session`, fails closed to worker-memory-only when session storage is unavailable, and exposes bounded audit/diagnostic evidence.

Browser execution remains disabled. No CDP attachment or broad Chrome/browser permission has been enabled yet.

Pass 3 will add canonical tab lifecycle/identity state without attaching the debugger.
