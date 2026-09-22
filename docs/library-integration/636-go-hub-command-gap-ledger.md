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
