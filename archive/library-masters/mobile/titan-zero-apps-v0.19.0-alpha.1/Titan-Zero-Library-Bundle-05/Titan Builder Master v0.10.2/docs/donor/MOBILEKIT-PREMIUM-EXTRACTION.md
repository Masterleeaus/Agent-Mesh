# Mobilekit → Titan Builder Premium extraction

Source: Mobilekit v2.9.1 supplied by the user. The user confirmed the complete kit is MIT licensed for this work.

## Extracted into Titan-native runtime

- application shell and safe-area layout
- app header and tab header
- bottom navigation and floating action button
- action sheet
- mobile, nested and sticky list views
- story strip
- form wizard and mobile input treatment
- chips and comment threads
- network/offline presentation state
- install prompt presentation
- local upload preview
- 18 page presets: login, register, recovery, SMS verification, lockscreen, profile, chat, product, cart, invoice, contact, FAQ, about, blog, slider, maintenance, under-construction and blank
- theme token model including dark-mode tokens

## Intentionally not imported

TitanMobileCore remains authoritative for service-worker/PWA/offline execution. Mobilekit's global `base.js`, service worker, localStorage ownership, broad hash-link interception, test mode and user-agent OS branching are not imported. Titan's existing Generative UI renderer owns rendering and state; business writes remain declarative intents only.

All runtime classes are prefixed `tpm-*` to prevent collisions with MagicAI, Bootstrap and Titan core styles.

## v0.7 application-pattern extraction

The third extraction wave converts Mobilekit page structures into reusable application primitives rather than static HTML clones. Added authentication, profile, messaging, invoice, commerce, article/contact and system-state primitives; nine reusable blocks; and six app composition templates. Existing Premium presets now consume these primitives where they materially improve the screen.
