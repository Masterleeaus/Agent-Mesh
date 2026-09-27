# Titan Builder Premium Mobilekit v0.6 Design

## Goal
Expand Titan Builder's Mobilekit-derived premium layer from the v0.5 shell/preset foundation into a reusable interaction system for advanced forms, feedback, commerce/media, and bidirectional/dark presentation without changing runtime ownership or the `company_id` tenancy model.

## Architecture
The Premium layer remains presentation-only and declarative. Mobilekit donor CSS/interaction patterns are normalized into Titan Builder component descriptors and scoped `tpm-*` assets. Interactive actions are expressed through the existing validated Generative UI state/action model; no raw HTML templating, direct API writes, service-worker ownership, or tenant resolution is introduced.

## Components
Add 20 premium component descriptors in four bounded groups:

1. Advanced forms: `mobile-checkbox`, `mobile-radio`, `mobile-toggle`, `mobile-stepper`, `mobile-search`, `form-validation-summary`.
2. Disclosure/feedback: `mobile-accordion`, `mobile-dialog`, `mobile-notification`, `mobile-alert`, `mobile-tooltip`.
3. Progress/system: `mobile-progress`, `mobile-preloader`, `mobile-pagination`, `go-to-top`.
4. Commerce/media: `product-card`, `price-summary`, `media-carousel`, `image-gallery`, `mobile-badge`.

All are `premium: true`, `source: Mobilekit-v2.9.1-MIT`, `authority: presentation-only`, and contain no tenant identity props.

## Theme and directionality
Extend the existing `mobilekit-premium` theme and CSS with semantic light/dark tokens plus `[dir="rtl"]` rules. Direction is presentation configuration only; it does not alter stored data or business logic.

## Runtime helpers
Extend `titan-mobilekit-premium.js` with small, dependency-free presentation helpers for disclosure state, reduced-motion-aware progress animation, and direction/theme markers. Helpers operate only on caller-provided DOM roots and never use storage, network requests, innerHTML, eval, user-agent sniffing, or service-worker APIs.

## Data flow and security
Builder registry -> validated component descriptor/spec -> renderer -> scoped Premium CSS/runtime helpers. All persistence, assets, publishing, and version ownership remain under the existing `company_id` boundary. Premium descriptors must not accept `company_id`, `tenant_id`, `user_id`, or arbitrary HTML/script props.

## Compatibility
Existing 17 v0.5 Premium components and 18 page presets remain unchanged and valid. The v0.6 manifest increments Premium component counts and package version only; no database schema changes are required.

## Testing
TDD contract checks must fail before implementation and pass afterward. Final verification covers PHP lint, JSON parse, all existing standalone/JS suites, 37 total Premium components, 18 renderable page presets, dark/RTL CSS contracts, runtime safety string scans, `company_id` boundary regression, Blueprint v3.1 manifest/filesystem/security validation, and final ZIP SHA inventory.
