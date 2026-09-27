# Titan Zero usable-code donor pack — Round 2

Deep-scanned sources:
- FieldCraft React Native: reusable offline/mobile field-service patterns.
- glint: small Next.js web application; retain as a UI/web donor, not a Titan runtime dependency.
- n8n-nodes-vh3ai: reusable n8n connector/node patterns, API credentials, email ingest and case/job/team actions.
- tradepilot-waitlist: complete Next.js public/waitlist marketing-site donor including support/privacy/terms surfaces.
- Titan Zero Usable Code Donor Pack: preserved prior curated field-service/FieldOps donor material.
- marketing-sites-extracted: preserved extracted FieldCrew and FieldOps marketing sites.

High-value Titan destinations:
1. Titan Go: FieldCraft offline repositories/sync, field tasks/materials/photos/notifications.
2. Titan Connect / integrations: n8n node + credential + request-helper patterns.
3. Titan Zero marketing: TradePilot waitlist site plus FieldCrew/FieldOps marketing donors.
4. Command / operations: prior FieldOps control-tower, capacity, repair-order, technician, service-recovery and optimizer code.
5. Service-business capabilities: prior field-services donor integrations and operational flows.

Integration rules:
- Normalize tenant/organization concepts to canonical company_id before authorization/data access.
- Rebrand donor UI/content; do not retain donor product identity.
- Treat provider integrations as adapters, not mandatory Titan dependencies.
- Do not merge secrets, .env files, debug signing material, generated build output or dependency folders.
- Review licenses/provenance before production redistribution.
- Titan Code remains separate; this pack is for Titan Zero product evaluation/integration.

Marketing-site result:
- tradepilot-waitlist is a real source-level Next.js marketing/waitlist site.
- marketing-sites-extracted contains FieldOps source-level marketing code and a FieldCrew compiled/static marketing site.
- the prior FieldOps donor also contains landing-page components/styles.
