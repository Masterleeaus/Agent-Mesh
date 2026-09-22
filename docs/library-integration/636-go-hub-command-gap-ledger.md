# #636 — Titan Go, Hub and Command application masters

## Pass 1 — canonical/donor topology audit

### Repository findings
- `apps/web` is the current web application package.
- No `apps/mobile` package exists at the expected path on the current branch.
- Titan platform descriptor exposes shared runtime/workforce/intelligence/business-ops facades; application projections must not become domain authority.
- No new app core was created in this pass.

### Verified Library donor/reference findings
- Titan Go Master v1.10.0 is a verified donor. Its presentation/navigation code projects field-worker state rather than owning business logic.
- Titan Hub Master v1.0.0-alpha.8 is a verified donor. It provides a customer-safe mobile shell, semantic cards, chat thread and governed intents.
- Titan Zero PWA checkpoint PWA17 contains the newer chat-first role shell, generated-UI envelope and three-card presentation pattern, but is checkpoint evidence rather than canonical authority.
- Interaction Engine and Interface Runtime remain the presentation-contract authorities; Go/Hub are projections.
- Library migration evidence conflicts with older standalone-Command packaging: the newer target architecture says base/Zero is the owner/Command experience, Hub and Go are the provisionable PWAs, and Command must not become a separate app core.

### Convergence rule
Use the repository's canonical surface/runtime authorities first. Import only missing Go/Hub/owner presentation/navigation semantics. Preserve maps. Do not recreate the PHP mobile suite, create a duplicate Command PWA, or let generated UI/navigation become business-state/execution authority.

### Next audit
Locate the actual current web/PWA surface implementation and navigation/component files in the repository, then compare them to Go/Hub/PWA17 semantics before changing code.

## Pass 2 — live-surface location and product-spec reconciliation

GitHub directory probes confirm `apps/web/app`, `apps/web/app/titan` and `apps/web/components` exist, while default-branch code search currently returns no indexed hits for the expected PWA17 filenames. This means absence from search is not evidence that the surface implementation is absent; direct-path/repository inspection must remain authoritative.

Library PWA build-plan evidence provides the expected canonical TypeScript layout:
- `app/titan/components/role-chat.tsx`
- `app/titan/components/generated-ui/*`
- `app/titan/runtime/surface-contract.mjs`
- `app/titan/components/role-details.tsx`
- `app/titan/components/role-secondary-surfaces.tsx`
- `app/titan/components/app-surfaces.tsx`
- `app/titan/components/workforce-surface.tsx`
- Go field runtime and schedule intelligence
- Hub service runtime
- Command decision runtime
- PWA identity/offline/sync runtime

The frozen navigation target in the PWA plan is:
- Go: Chat / Active / Schedule / Comms / Ready
- Hub: Chat / Service / Comms / Account
- Command(owner/base): Chat / Pending / Operations / Workforce / System

This is close to, but not identical with, later product wording. Navigation labels must therefore be reconciled against the current repository implementation before any donor copy is made. Maps remain explicitly preserved.

No code was copied from the PHP donors or the merge-pending PWA checkpoint in this pass.
