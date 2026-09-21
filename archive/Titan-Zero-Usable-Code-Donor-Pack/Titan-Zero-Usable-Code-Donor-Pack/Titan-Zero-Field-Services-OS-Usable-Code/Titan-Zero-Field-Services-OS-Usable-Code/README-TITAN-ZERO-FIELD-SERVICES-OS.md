# Titan Zero — Field Services OS donor extraction

Deep scan: 337 files in source archive; 184 API route handlers found.
Clean extraction: 290 files.

## High-value Titan Zero capabilities
- Command/admin surfaces: jobs, customers, leads, scheduler, field, photos, estimates, inspections, claims, subcontractors, call center, reviews, notifications and analytics.
- Finance/operations: revenue, finance, cashflow, invoices, expenses, accounting, tax, campaign costs and line items.
- Documents/evidence: document packets, reports, signatures, PDFs, inspections and photos.
- Communications/growth: SMS, email, outreach, business outreach, funnel/prospects/leads.
- Integrations/adapters: Stripe, Plaid, EagleView, mail, SMS, Telegram and AI adapter patterns.
- Vertical donor logic: storm lead generation/backfill, parcel checks, material products and inspection sections.
- Public/marketing surface: app/page.tsx + layout/globals exist, but the strongest value of this repository is the operational product rather than a large standalone marketing site.

## Titan integration constraints
- Normalize all tenant/account boundaries to canonical `company_id`.
- Rebrand and map UI into Zero/Command, Go and Hub rather than importing the admin IA unchanged.
- Provider-specific services remain adapters; do not make them Titan runtime requirements.
- Review license/provenance before production redistribution.
- Secrets, env files, dependency/build directories and lockfiles were excluded.
