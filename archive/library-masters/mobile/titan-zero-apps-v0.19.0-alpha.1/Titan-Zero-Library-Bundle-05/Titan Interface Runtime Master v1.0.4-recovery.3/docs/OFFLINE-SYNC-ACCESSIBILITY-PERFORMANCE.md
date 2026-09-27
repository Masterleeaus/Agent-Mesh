# Offline, Sync, Accessibility & Performance

Pass 19 keeps offline and synchronization state authoritative in source engines while standardising how Titan Interface Runtime presents that state.

## Source authority

The canonical Sync tray is the presentation bridge. Providers may attach bounded `metadata` to a `GlobalWorkItemReference` with source-owned state such as `offline-local`, `pending-sync`, `syncing`, `synced`, `conflict`, `failed`, or `awaiting-online`. Interface Runtime never creates, mutates, replays, marks synced, or resolves an outbox record.

A soft adapter exposes the installed Interaction Engine `SyncEngine::getStatus(companyId)` through the Sync tray when that engine is available. Conflict resolution remains owned by Interaction Engine or another source extension. Resolution controls are exposed only when the source publishes action refs that are also present, visible, and authorized in the Interface Action Registry.

## Accessibility target

Generated presentation trees can be audited against a deterministic WCAG 2.2 AA target subset. Interactive nodes require an accessible name, keyboard operability, visible focus, and a minimum 24 CSS px target-size check. Positive tabindex is rejected. Live-region values are bounded to `off`, `polite`, or `assertive`.

Color contrast and keyboard-trap behavior remain responsibilities of the accessible component vocabulary and live E2E browser certification; the offline static auditor does not pretend to prove those runtime properties.

## Localization and responsive behavior

Localization is policy-driven with explicit supported/fallback locales and LTR/RTL projection. Mobile-first surfaces (`go`, `hub`, `onboarding`) reject fixed-only presentation mode. Translation strings remain owned by Laravel's translation layer rather than embedded in cached presentation state.

## Performance budgets

Default budgets are:

- presentation payload <= 512 KiB
- <= 2,000 presentation nodes
- maximum depth <= 16
- p95 presentation serialization <= 100 ms
- request-scoped presentation cache <= 128 entries

Presentation cache keys include tenant, user, product surface, domain, workspace, locale, and presentation fingerprint. No cache entry can be shared across tenants or locales.
