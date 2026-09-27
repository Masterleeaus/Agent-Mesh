# Titan Builder v0.7 Premium Application Patterns Design

## Goal

Convert the remaining high-value Mobilekit page structures into reusable Titan-native application components, blocks, and vertical-ready mobile templates without importing Mobilekit's global application runtime.

## Approved scope

The user's `Next` continues the v0.6 roadmap already proposed: authentication/profile UX, invoice/commerce flows, messaging UI, content/blog layouts, richer media treatment, error/maintenance states, and configurable vertical app templates.

## Architecture

Titan Builder remains presentation-only. Mobilekit page structures become declarative Builder resources and browser renderer registrations. Operational actions remain intents routed through Titan contracts; no component performs direct business writes. `company_id` remains the only active tenancy boundary.

### New application components

1. `auth-panel`
2. `profile-hero`
3. `profile-stat-grid`
4. `chat-thread`
5. `chat-message`
6. `chat-composer`
7. `invoice-header`
8. `invoice-party`
9. `invoice-line-items`
10. `invoice-total`
11. `cart-item`
12. `product-detail`
13. `rating-summary`
14. `article-header`
15. `article-body`
16. `social-links`
17. `system-state`

### New reusable blocks

1. `premium-auth-flow`
2. `premium-profile-overview`
3. `premium-messaging-conversation`
4. `premium-invoice-document`
5. `premium-cart-checkout`
6. `premium-product-commerce`
7. `premium-article-story`
8. `premium-contact-business`
9. `premium-system-state`

### New app templates

1. `premium-customer-app`
2. `premium-field-app`
3. `premium-commerce-app`
4. `premium-booking-app`
5. `premium-membership-app`
6. `premium-service-app`

These are template metadata/composition contracts, not new runtimes. Customer/Field/Owner remain the authoritative product surfaces.

## Data and action flow

- Components consume props and local/message state only.
- Operational data is supplied through registered read-only data sources.
- Buttons emit approved action intents only.
- Chat composer emits `communications.message.send` or local preview state intents; it never sends directly.
- Checkout/invoice controls emit TitanMoney/ZeroPay intents only.
- No raw HTML or script props are accepted.

## Error and empty states

`system-state` provides maintenance, under-construction, empty, offline, permission-denied, and generic-error presentations. It is presentation-only and supports a single approved recovery/navigation intent.

## Styling

Extend `titan-mobilekit-premium.css` with scoped `tpm-*` application pattern classes. Existing dark/RTL/reduced-motion foundations must cover every new class. No unscoped Bootstrap/Mobilekit global selectors are imported.

## Runtime

Extend `titan-generative-ui.js` with safe DOM renderers for all 17 types. Extend the Premium helper only where stateful presentation behavior is genuinely needed; no service worker, fetch, storage, user-agent sniffing, eval, or innerHTML.

## Testing

- Red/green standalone contract for all resources, counts, blocks, templates, and version metadata.
- Red/green browser registry test for all 17 component types.
- Server-side Generative UI validation for representative specs using every new type.
- Full existing v0.6 regression suite.
- PHP lint, JSON parse, company-boundary scan, forbidden-runtime-token scan.
- Blueprint v3.1 validation/security scan.
- Exact final ZIP extraction and repeat verification.

## Version target

`0.7.0` — Premium Application Patterns.
