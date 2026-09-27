# Implementation Backlog

Items flagged for future work, in rough priority order.

---

## High Priority

### Real testimonials
- Need at least one from a solo/early-stage operator (Ethan ICP)
- Need at least one from an established crew-based contractor (Jim ICP)
- Testimonials section is currently populated with real assessment examples, not quotes
- When collected: update the testimonials section in Home.tsx

### 15-minute discovery call — separate Calendly link
- Currently uses same link as the $497 assessment
- Create a dedicated 15-min Calendly event type
- Update DISCOVERY_URL constant in Home.tsx (marked with comment)

### Contact form server endpoint
- Form at /contact posts to /api/contact
- Endpoint is not yet wired to a server
- Josh has an existing server to connect it to
- Update when going live

### /privacy canonical and og:image
- og:image placeholder in index.html points to https://fieldcrewai.com/og-image.jpg
- This image needs to be created and uploaded
- Canonical tag is set to https://fieldcrewai.com/ — confirm domain is correct at launch

---

## Medium Priority

### Kathy-specific landing page
- A /operations-audit page targeting $2M+ contractors
- Separate from homepage, with Kathy-specific messaging
- Not needed until the Operations Audit offer is more defined

### Stripe Checkout integration
- Payment for $497 assessment currently flows through Calendly only
- A Stripe Checkout link can replace or supplement Calendly
- Comment in code: "Replace this href with Stripe Checkout or the final payment link when ready"

### Case study content
- A documented before/after from a real assessment
- Would significantly improve conversions for Jim and Kathy
- Add to /blog when available

### Google review schema
- Add AggregateRating schema once real reviews are collected
- Currently no review schema in index.html

---

## Low Priority / Future

### Blog internal linking
- /blog posts link externally to fieldcrewai.com
- If content is eventually published directly on this site, update links

### Location-specific landing pages
- /roofing-contractors-calgary, /hvac-contractors-saskatoon, etc.
- High SEO value for local search, medium effort

### FAQ schema update
- FAQ schema in index.html covers 7 questions
- Update when FAQ is expanded

---

## Changelog
- 2026-05-03: Initial backlog created from persona review and implementation session
