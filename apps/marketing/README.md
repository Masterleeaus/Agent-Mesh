# Titan Zero Marketing Network

This repository prepares a shared marketing codebase for a product hub, a separate managed-service site, and industry-specific host contexts. This file records source selection and the proposed host map; it does not authorize DNS changes, server changes, indexing, or public release.

## Proposed host map

| Surface | Proposed host | Source / owner | Current boundary |
|---|---|---|---|
| Product hub | `titanzero.io` | `marketing/nexjob` | Shared product story and directory; review preview remains `noindex`. |
| Managed services | `titanzero.pro` | Personal Services source `marketing/trydrafted`; separate managed-site claim | Multi-page site work is isolated from this shared hub/vertical UI. No second product, identity system, or data store. |
| Canonical business application | `app.titanzero.io` | `apps/web` and its active owners | One shared application/backend. Marketing login links must target its canonical `/login` route when available. |
| Dedicated PWA | `pwa.titanzero.io` | `apps/pwa`, issue #1171 / PR #1176 owner | Separate Zero/Go/Hub shell; not `apps/web`'s web manifest. Release readiness is tracked by its owner. |
| Industry pages | `<slug>.titanzero.io` | Shared `marketing/nexjob` host-aware build using `src/data/verticalCatalogue.js` | Twenty catalogue-driven contexts; each has a distinct canonical host but shares the same static app and single backend. |

The site remains a noindex review candidate until the parent confirms the final deployment plan. Hostnames and links in the source are planning values, not configured DNS or live services.

## Source selection

- `marketing/nexjob` is the shared Titan Zero marketing master. Its current Field Services site is the base for the `.io` hub and the host-aware implementation.
- `marketing/tradepilot` is a **layout donor** for the industry home-page composition. Reuse only its page structure and adapt it to the existing NexJob font, color and component tokens. Its claims, synthetic metrics, forms, external login/signup links, and media with unresolved provenance are not publishable as-is.
- `marketing/trydrafted/index.html` is the existing Titan Zero Personal Services preview source for the separate `.pro` managed-service work. It is a static one-page donor, not the finished multi-page `.pro` site. Its customer names, case-study figures, tracking, external booking/contact/payment paths, and live form behavior are not approved for reuse without verification.
- `marketing/fieldops` is retired from the proposed public preview. Its repository source/history is retained for provenance; do not add it to public routing or a host map.
- `marketing/fieldcrew` and the remaining legacy donor pages are not part of this host plan.

## Shared-site boundaries

- The 20-profile catalogue in `marketing/nexjob/src/data/verticalCatalogue.js` is the source for vertical names, workflows, canonical hosts, and availability evidence. Do not create a second industry registry in the UI.
- Every marketing login link resolves to the one canonical app host. Never place bearer credentials in a URL or share cookies across `.io` and `.pro`.
- Marketing copy describes planned or verified capabilities according to the catalogue's evidence. No fabricated forms, demo results, metrics, testimonials, integrations, or install links.
- `app.titanzero.io` and `pwa.titanzero.io` are reserved surfaces, not marketing host contexts.
- Keep preview `noindex` and `robots` restrictions. Production activation needs host-specific sitemap/robots behavior, verified TLS/DNS, and an approved deployment plan.
