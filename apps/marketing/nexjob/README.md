# Titan Zero Cleaning Marketing Site

This shared static marketing app renders the Titan Zero Cleaning SaaS hub on `titanzero.io` and its Cleaning-specific context on `cleaning.titanzero.io`. Cleaning is the only vertical exposed for the initial launch. The full canonical vertical catalogue remains in source for future releases but is not routed or marketed here. This app is a marketing surface, never a runtime or backend dependency.

Titan Zero's managed-service offer remains an internal `titanzero.io/fully-managed` page. `titanzero.pro` is planned for a separate Cleaning franchise site and is not rendered by this app.

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

- The hostname selects the Cleaning product hub, reserved app/PWA host, Cleaning-specific host, or local preview through `src/config/siteContext.js`.
- Public launch routing uses the canonical Cleaning profile from `src/data/verticalCatalogue.js`. Other profiles stay in the internal catalogue and are not public industry sites in this launch.
- Legacy `/industries/cleaning` paths point to the Cleaning host. Other legacy industry paths no longer redirect to an industry host.
- The managed-service page stays on `titanzero.io/fully-managed`; do not route it through `titanzero.pro`.
- `titanzero.pro` is reserved for the separately planned Cleaning franchise site. The current marketing app does not serve that host or make claims about its availability.
- Product login links target the canonical app host. They remain disabled in the review build until the app workflow is confirmed. There is no public signup route in this build.
- Cleaning catalogue and blueprint source is substantial, but the Cleaning runtime remains in development. Source and tests do not certify a production company installation or published release.
- “Works Everywhere” surfaces (mobile app, PWA, Chrome, WordPress, ChatGPT, WhatsApp, Telegram and Facebook Messenger) show their evidence-based release states. No planned extension, plugin or channel is presented as published or live.
- Typography retains the existing Inter family from Google Fonts with system sans-serif fallback. No self-hosted Inter font asset/license was found in the repository.

## Review and release state

The current build is a `noindex` review preview. Do not enable indexing, change DNS, or publish until the Cleaning runtime, host routing, TLS, app access, channel integrations, package releases and deployment plan have been verified by their owners.
