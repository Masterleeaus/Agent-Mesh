# Titan Zero Marketing Hub and Industry Sites

This shared static marketing app renders the Titan Zero product hub on `titanzero.io` and industry-specific pages on hosts derived from the canonical 20-profile catalogue. The former NexJob / Field Services master is the source base; industry contexts share its fonts, colors, components, and build. This app is a marketing surface, never a runtime or backend dependency.

## Local development

```bash
npm ci
npm run dev
```

Production build for review:

```bash
VITE_APP_ACCESS_AVAILABLE=false VITE_APP_URL=https://app.titanzero.io npm run check
```

## Host behavior

- The hostname selects a product hub, reserved app/PWA host, industry page, or local preview through `src/config/siteContext.js`. This app does not render `.pro` hosts or managed-service pages.
- Industry profiles and canonical URLs come from `src/data/verticalCatalogue.js`; do not fork content or application state per host.
- Legacy `/industries/:slug` paths redirect to the matching industry host in `.htaccess`. Both `handyman` and `property-maintenance` remain aliases for their single combined profile.
- Keep managed-service sales routes and links out of the main navigation. Preserve the existing contextual links from the Personal Services hub, the legacy industry page and the unconfigured-host fallback to `https://titanzero.pro/`; the separate host/content owner remains issue #1238. Do not render `.pro` host context or copy managed-service sales pages into this app.
- Product login links target the one canonical app contract, `https://app.titanzero.io/login`. They are disabled in the current review build until the app workflow is confirmed. There is no public signup route in this build.
- Industry page structure borrows from the Tradepilot layout donor while using this app's existing visual tokens. It does not reuse donor claims, screenshots, forms, or external integration references.
- Typography retains the existing Inter family from `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap`, with system sans-serif fallback. No self-hosted Inter font asset/license was found in the repository, so the existing Google Fonts request is documented; this change adds no tracking.

## Release state

The current build is a `noindex` review preview. It does not certify industry runtime packs, product availability, per-vertical installations, auth, or backend workflows. Do not enable indexing until a host-specific sitemap/robots strategy, DNS/TLS, server routing and the final deployment plan are confirmed by the parent.
