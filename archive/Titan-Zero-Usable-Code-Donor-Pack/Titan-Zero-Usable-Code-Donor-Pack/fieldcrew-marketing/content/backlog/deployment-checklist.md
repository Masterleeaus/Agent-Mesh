# Deployment Checklist — Field Crew AI

Checklist for the deployment agent (or Josh) to complete before the site is fully production-ready. Items are in rough priority order.

Last updated: 2026-05-03

---

## 0. 2026-05-03 Production Fix Checklist

- [x] Confirm the contact page route loads as static HTML at `/contact`
- [x] Confirm the checklist page route loads as static HTML at `/checklist`
- [x] Identify every production form currently collecting visitor details
- [x] Add visible SMS consent language to the contact form before submission
- [x] Wire the checklist lead magnet form to HubSpot through `/api/lead-magnet`, without requiring a fake phone number
- [x] Preserve the printable checklist page as a direct `/checklist` resource
- [x] Add canonical image filenames for the three newest blog posts
- [x] Rebuild the React bundle after the form changes
- [x] Deploy the updated static bundle and blog image assets
- [x] Submit one marked test contact to HubSpot
- [x] Submit one marked test checklist lead to HubSpot
- [x] Verify the three newest blog post images return `200 image/jpeg` in production
- [x] Verify production `/contact`, `/checklist`, `/blog`, and the three newest blog posts after deploy

---

## 1. Domain and DNS

- [ ] Point `fieldcrewai.com` to the production host (Replit or your own infrastructure)
- [ ] Confirm `www.fieldcrewai.com` redirects to `fieldcrewai.com` (no-www canonical)
- [ ] Verify SSL certificate is active and auto-renewing
- [ ] Test that all pages load over HTTPS with no mixed-content warnings

**Replit path:** Set the custom domain in Replit Deployments settings. SSL is handled automatically.

**Self-hosted path:** Configure DNS A record → server IP. Set up nginx/Caddy with Let's Encrypt.

---

## 2. Environment Variables and Secrets

The following secrets must be set in the production environment:

| Secret | Description | Where used |
|---|---|---|
| `SESSION_SECRET` | Express session signing key | API server |

When the following features are wired:

| Future Secret | Description |
|---|---|
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | For sending contact form and lead magnet confirmation emails |
| `CRM_API_KEY` | For pushing lead magnet captures into your CRM or email tool |
| `STRIPE_SECRET_KEY` | If Stripe Checkout replaces Calendly for $497 payment |
| `STRIPE_WEBHOOK_SECRET` | For Stripe webhook verification |

**Replit path:** Set secrets in Replit Secrets panel. They are available as `process.env.*` in the API server.

**Self-hosted path:** Use `.env` file on server (never commit to git) or a secrets manager.

---

## 3. API Server Endpoints to Wire

The following endpoints exist in the frontend code but are not yet implemented in the API server:

### `POST /api/contact`
**Used by:** `/contact` page (contact form)
**Payload:** `{ name, email, phone, trade, message }`
**Required behavior:**
- Validate all fields (name, email, message required)
- Send email notification to Josh@fieldcrewai.com
- Optionally: store in database, push to CRM
- Return `{ ok: true }` on success

### `POST /api/lead-magnet`
**Used by:** Homepage checklist email capture form
**Payload:** `{ name, email }`
**Required behavior:**
- Validate name and email
- Store the lead (database or CRM)
- Optionally: send a follow-up email with the checklist URL
- Return `{ ok: true }` on success

**Note:** Both endpoints currently fail silently — the frontend shows success regardless of API response. This means the site works for visitors even before the API is wired, but leads are not captured. Wire these before driving significant traffic.

---

## 4. Calendly Configuration

- [ ] Confirm `https://calendly.com/josh-fieldcrewai/strategy` is the correct booking URL
- [ ] Confirm Stripe Payment Link redirects to the Calendly assessment booking page after successful payment
- [ ] Confirm the free 15-minute Google Calendar booking link works: `https://calendar.app.google/TMH9qe1HEjaXDLDF7`
- [ ] Set Calendly notification emails to the correct address
- [ ] Confirm Google Calendar notifications route to the correct inbox

---

## 5. Payment

**Current state:** Paid assessment CTAs go to Stripe first. After successful payment, Stripe should redirect to the Calendly assessment booking page.

**Production links:**

- Paid assessment Stripe link: `https://buy.stripe.com/dRmfZa3yL4hzdiTdHB8so01`
- Assessment booking after payment: `https://calendly.com/josh-fieldcrewai/strategy`
- Free 15-minute fit call: `https://calendar.app.google/TMH9qe1HEjaXDLDF7`

---

## 6. OG Image

- [ ] Create `og-image.jpg` (1200x630px) for social sharing previews
- [ ] The file must be accessible at `https://fieldcrewai.com/og-image.jpg`
- [ ] Current placeholder in `index.html` references this path
- [ ] Suggested design: dark navy background, Field Crew AI logo or wordmark, tagline "Stop Letting Good Jobs Fall Through the Cracks."

**Replit path:** Drop the file into `artifacts/field-crew-ai/public/` and it will be served at `/og-image.jpg`.

---

## 7. Analytics

- [ ] Add Google Analytics 4 or Plausible tracking to `index.html`
- [ ] Track these key events:
  - `button-hero-primary` click (Book the $497 Assessment)
  - `button-hero-secondary` click (Free 15-minute fit call)
  - `button-checkout-cta` click (Pay $497 and book)
  - Lead magnet form submission
  - Contact form submission
- [ ] All interactive elements have `data-testid` attributes that can be used as event selectors

**To add GA4:** Insert the GA4 script into `artifacts/field-crew-ai/index.html` `<head>` before `</head>`.

---

## 8. Sitemap and Search Console

- [ ] Sitemap is live at: `https://fieldcrewai.com/sitemap.xml`
- [ ] robots.txt is live at: `https://fieldcrewai.com/robots.txt`
- [ ] Submit sitemap to Google Search Console: `https://search.google.com/search-console`
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Verify ownership of `fieldcrewai.com` in Google Search Console

---

## 9. Email

- [ ] Set up `Josh@fieldcrewai.com` as a real inbox (not just a display address)
- [ ] Confirm all mailto links work and route to the correct inbox
- [ ] Consider setting up `hello@fieldcrewai.com` or `assess@fieldcrewai.com` for form submissions so Josh's personal inbox stays clean

---

## 10. Privacy and Compliance

- [ ] SMS disclaimer on the privacy page links to the correct opt-in flow when SMS is active
- [ ] If collecting emails via lead magnet, ensure CAN-SPAM / CASL compliance:
  - Unsubscribe link in all email communications
  - Physical mailing address in email footer
- [ ] GDPR notice if serving EU visitors (low priority for now given CA/US focus)

---

## 11. Performance and Monitoring

- [ ] Run Lighthouse audit after domain is live (target: 90+ performance, 100 SEO)
- [ ] Set up uptime monitoring (UptimeRobot free tier is sufficient)
- [ ] Set up error alerting — if the API server returns 5xx, Josh should know

---

## 12. Pre-Launch Smoke Test

Run through these manually before announcing:

- [ ] Home page loads at `https://fieldcrewai.com/`
- [ ] "Book the $497 Assessment" buttons open the Stripe payment link
- [ ] Stripe Payment Link redirects to Calendly after successful payment
- [ ] Free 15-minute fit call button opens the Google Calendar booking link
- [ ] Lead magnet form submits and shows success state
- [ ] Checklist page loads at `/checklist` and prints correctly
- [ ] Contact form submits and shows success state
- [ ] Blog page loads with all 12 posts
- [ ] Privacy page loads
- [ ] Mobile navigation works (open/close menu, all links)
- [ ] Site loads correctly on iOS Safari and Chrome Android
- [ ] All external links open in new tabs where expected

---

## Infrastructure Option Summary

See `deployment-infrastructure-options.md` for the Replit vs self-hosted comparison.
