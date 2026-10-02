# Titan Zero / Go / Hub PWA

This is the repository-owned, separately installable PWA shell. It is not `apps/web`, the native Flutter app, or a DirectAdmin plugin. It provides one install identity with canonical `zero`, `go`, and `hub` modes.

## Current status

The installable shell and its safe client boundaries are implemented. The PWA intentionally shows no sample company records and does not claim a production connection. It has no business API bootstrap yet, no durable private offline database, no encrypted evidence staging, no command submission/replay, and no deployed DirectAdmin endpoint. The service worker caches only the public application shell; it never caches API or company routes. Do not represent this package as production-ready until the dependent hosted services and evidence in #1171 exist.

The build derives a shell cache identifier from every public shell asset, so an app-only release changes the service-worker script and replaces the old shell cache. The header reports browser connectivity only; it does not probe Workforce availability or authenticate a session. Until a hosted API is commissioned, every mode reports Workforce as not configured.

The manifest includes 192×192 and 512×512 PNG icons plus an 180×180 Apple touch icon; the scalable SVG remains the browser favicon. Reduced-motion preferences disable mode-button transitions. The visible keyboard focus ring and mode pressed states are covered in the browser checks.

## Invariants

- A verified server session resolves `company_id`; client-supplied company identifiers never grant membership or authority.
- The client projection helper is GET-only, same-origin, `no-store`, and checks returned `company_id` against the context resolved by the host application.
- Local projections are currently held in a bounded in-memory working set only. Company, actor, device, mode, customer-audience, context-revision, or session-revision rotation clears it. It is not durable and creates no authority.
- No mutation, offline outbox, sensitive cache, browser encryption scheme, API endpoint or DirectAdmin URL is invented here. These require the canonical owners/contracts and real deployed host.
- Frappe remains an optional provider below Titan domain contracts; native Titan FSM remains the default.

## Commands

From the repository root: `pnpm install --filter @titan-zero/pwa`, `pnpm --filter @titan-zero/pwa exec playwright install chromium`, then `pnpm --filter @titan-zero/pwa typecheck`, `pnpm --filter @titan-zero/pwa build`, and `pnpm --filter @titan-zero/pwa test`. The test suite includes Chromium checks for the platform icon sizes, reduced motion, keyboard focus and mode selection, unsupported-mode fallback, interrupted updates, offline reload, mode URL persistence, and private-route cache exclusion.

## Remaining #1171 gates

Implement and verify the current server-issued auth/company bootstrap and hosted projection/action APIs; company DB placement and storage owner integration; encrypted, bounded offline working set and attachment staging with key lifecycle; governed commands and server revalidation/reconciliation; Zero/Go/Hub base-FSM capability parity; DirectAdmin deployment and runtime continuity; and physical iOS/Android plus multi-company hosted end-to-end certification. Keep production status blocked until these pass.
