# Titan Zero Cleaning Marketing Site

This shared marketing app renders the Cleaning SaaS hub on `titanzero.io` and its Cleaning-specific menu and landing page on `cleaning.titanzero.io`. Cleaning is the only public vertical for this launch. Other vertical profiles remain in the internal catalogue for future releases.

The site leads with the Cleaning AI workforce and connected operating system. It includes a dedicated Titan Zero explainer, a six-role Cleaning workforce page, a system feature catalogue, Works Everywhere information, five separate WordPress plugins and five separate Chrome extensions for Bookings, Invoicing, Job Management, Quotes and CRM, each with AI Assist. Managed Service remains at `titanzero.io/fully-managed`. `titanzero.pro` remains reserved for the separate Cleaning franchise site.

## Local development

```bash
npm ci
npm run dev
```

Production build check:

```npm run check
```

For review-only builds, set account access off explicitly:

```bash
VITE_APP_ACCESS_AVAILABLE=false VITE_APP_SIGNUP_AVAILABLE=false VITE_APP_URL=https://app.titanzero.io npm run check
```

The production defaults point sign-in and sign-up to `app.titanzero.io/login` and `app.titanzero.io/signup`. Those app routes must be available before publishing the marketing build.

## Host behavior

- Hostname selects the Cleaning product hub, reserved app/PWA host, Cleaning-specific host or local preview through `src/config/siteContext.js`.
- Public launch routing uses the canonical Cleaning profile from `src/data/verticalCatalogue.js`; other verticals are not shown in the public industry directory.
- Legacy `/industries/cleaning` paths route visitors to the Cleaning host. Other legacy industry routes resolve to the public Cleaning home.
- The managed-service page stays on `titanzero.io/fully-managed`; it is not routed through `titanzero.pro`.
- Product copy describes the launch experience. Company setup and configured safety gates still determine which service scopes and actions can be enabled.
- Specialist work such as active construction sites, medical equipment and waste removal keeps its authorization, skills, equipment, procedure and evidence requirements.
- Sign-in and sign-up destinations are environment-configurable for review builds. Do not publish until account access, runtime routing, channel providers and downloadable product packages have passed their release checks.
- Typography retains the existing Inter family from Google Fonts with system sans-serif fallback. No self-hosted Inter font asset or license was found in the repository.
