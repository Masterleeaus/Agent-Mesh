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

- The hostname selects a product hub, managed-service context, reserved host, industry page, or local preview through `src/config/siteContext.js`.
- Industry profiles and canonical URLs come from `src/data/verticalCatalogue.js`; do not fork content or application state per host.
- Legacy `/industries/:slug` paths redirect to the matching industry host in `.htaccess`. Both `handyman` and `property-maintenance` remain aliases for their single combined profile.
- Managed-service links go to `https://titanzero.pro/`; pricing links target its `#pricing` section.
- Product login links target the one canonical app contract, `https://app.titanzero.io/login`. They are disabled in the current review build until the app workflow is confirmed. There is no public signup route in this build.
- Industry page structure borrows from the Tradepilot layout donor while using this app's existing visual tokens. It does not reuse donor claims, screenshots, forms, or external integration references.

## Release state

The current build is a `noindex` review preview. It does not certify industry runtime packs, product availability, per-vertical installations, auth, or backend workflows. Do not enable indexing until a host-specific sitemap/robots strategy, DNS/TLS, server routing and the final deployment plan are confirmed by the parent.
