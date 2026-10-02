# Titan Web / Portal (Brand Studio) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete GitHub issue #1044 by delivering a secure DirectAdmin-managed Titan web/portal renderer and publisher integrated with canonical Builder, Interface/Visual/Interaction, Surface, authority, deployment, domain, channel, and evidence owners, with every issue acceptance item verified.

**Architecture:** DirectAdmin remains an adapter/cockpit; Microweber and connected WordPress are renderer/provider adapters. Titan Builder authors declarative surfaces, Interface/Visual/Interaction contracts render governed experiences, canonical capability owners provide business state and actions, #322/#812 own deployment and host lifecycle, and #1059 inventories resulting surfaces. No new business authority, identity, domain database, deployment engine, or evidence store is introduced.

**Tech Stack:** Existing TypeScript/Node Titan monorepo, DirectAdmin plugin packaging scripts, current Builder/Interface Runtime/Surface Manager contracts, canonical Titan capability clients, Microweber and WordPress provider adapters, Node test runner and repository gates.

**Spec:** `docs/superpowers/specs/2026-10-02-brand-studio-design.md`; granular, authoritative checklist and required donor scans are GitHub issue #1044.

## Global Constraints

- `company_id` remains mandatory at every tenant-scoped read/write boundary; missing or unresolved actor/company context fails closed.
- DirectAdmin role/root privilege never implies Titan business authority.
- Titan Builder owns authoring; Interface Runtime owns governed context/actions/receipts; Visual Runtime owns presentation; Interaction owns interaction intent; #1059 owns surface lifecycle/topology/health; #812/#322 own host/deployment lifecycle.
- Microweber/WordPress are renderer/provider adapters, not Titan CRM, commerce, booking, workforce, identity, authority, or evidence owners.
- Consequential actions pass through canonical capability, authority, execution, verification, and Business Evidence paths; provider ACK alone is never success.
- Never generate executable PHP/SQL/routes from AI; use typed, versioned, schema-validated commands and immutable draft/publication versions.
- Public/guest links use high-entropy scoped tokens or canonical signed sessions with expiry, revocation, rate limits, and audit; no raw sequential IDs.
- Plugin package install/update/uninstall changes only plugin-owned assets/config and preserves customer sites, content, data, and credentials by default.
- No secrets in browser output, logs, diagnostics, generated assets, or package archives; resolve secret references only through canonical secret owners.
- Preserve unrelated dirty workspace files; do not close #1044 until all issue checklist and Done-condition evidence is complete.

## Review Focus

- Tenant/actor spoofing, DirectAdmin admin/reseller context, missing mapping, cross-company object IDs, and public-link replay must deny data/actions; exercise in adapter and route tests.
- Microweber/WordPress provider error or ACK without observed state must stay pending/degraded; exercise publish, update, rollback, and health tests.
- Stale Builder draft, changed selected block, expired offer, incompatible capability, or stale approval must block scheduled/publication execution; exercise version/fingerprint tests.
- Malicious template/archive, symlink/path traversal, unsafe MIME, SSRF/redirect, generated executable content, and credential-bearing diagnostics must be rejected/redacted; exercise import/package security tests.
- Plugin install/update/uninstall and temporary Mission retirement failure must preserve live sites and canonical data, revoke temporary credentials safely, and leave evidence/history; exercise failure-injection lifecycle tests.

---

## File and subsystem map

Exact new filenames for a subsystem are chosen only after its current canonical owner and donor implementation are inspected; never create parallel owners. Existing known seams:

- `apps/directadmin/` — DirectAdmin plugin source and control-plane adapter; inspect existing `server-node/` and `dev-access/` before adding the Brand Studio package.
- `packages/titan-platform/src/surface-manager.ts` — existing projection/lifecycle-intent contract; consume, do not add deployment authority here.
- `packages/titan-platform/src/directadmin-plugin.ts` — package contract; extend only if canonical package requirements are genuinely missing.
- `apps/web/lib/titan/interface-runtime/` — context/receipt/action presentation contract; integration consumer only.
- `apps/web/lib/titan/builder-projection-executors.ts` and related Builder files — compatibility/preview seam; replace legacy direct domain reads with existing canonical Domain/Business Reality projection providers where issue acceptance requires it.
- `scripts/package-directadmin-plugin.mjs`, `scripts/validate-directadmin-plugin.mjs` — current server-node-specific package/validator seams; generalize only with tests and preserve existing package behavior.
- `docs/directadmin/`, `docs/architecture/`, focused `packages/*/tests/`, focused `apps/*/tests/` — ownership, operations, test evidence, and runbooks.

## Task 1: Complete donor and live-branch audit

**Files:**
- Create: `docs/directadmin/BRAND-STUDIO-SOURCE-ASSIGNMENT.md`
- Test: documentation/source-assignment validation already used by repository gates

- [ ] Inspect every required donor group in issue #1044 (Builder; Interface/Visual/Interaction; Zero/Hub/Go; VoxelSite/BlogPilot/SEO/social/marketing; chat/ecommerce/booking/review/voice/share/onboarding/checkout/discount; Canvas/Creative Suite/Content Manager; Quotes/Configurator/Cockpit). Record source/revision, verified behavior reused, behavior rejected, canonical owner, and why.
- [ ] Inspect current main and open branches/PRs for #812, #322, #1049, #1059, #1060, #1063, #1229 and all named Builder/runtime/web/portal donors. Record integration contracts and no duplicate active claim.
- [ ] Run repository searches for Microweber, WordPress, marketing-site duplicates, package/lifecycle scripts, current SurfaceDescriptor publication facts, and direct legacy DB clients. Record discovered active systems and migration/preservation requirement.
- [ ] Run the documentation gate and review the source-assignment table for every issue-required donor; no uninspected donor is represented as verified.
- [ ] Commit the audit before implementation tasks.

## Task 2: Define contract and acceptance fixtures

**Files:**
- Modify only canonical owner files selected by Task 1; likely `packages/titan-platform/src/` integration exports
- Create: focused contract tests beside the chosen canonical package tests
- Test: targeted Node tests, then `pnpm gate:fast`

- [x] Write failing tests for company-scoped authored surface snapshot → provider projection → Surface Manager descriptor and provenance/version/hash.
- [x] Write failing tests for typed action bindings that carry capability, context, entitlement, authority/risk class, offline/public behavior, fallback, accessibility, and evidence requirements without granting authority.
- [ ] Write failing tests for provider ACK vs observed verification, stale snapshot conflict, idempotency, rollback target, and unavailable-owner degradation.
- [x] Define/adapt a versioned adapter contract at the canonical interface owner discovered in Task 1; include exact schema/version and reject unknown versions/fields.
- [ ] Run targeted tests red, implement the minimal adapter contract/projection, rerun green, and run `pnpm gate:fast`.
- [ ] Commit the contract/fixture slice.

## Task 3: Safe DirectAdmin package and host lifecycle

**Files:**
- Create: `apps/directadmin/<verified-plugin-id>/**` using existing package layout
- Modify: `scripts/package-directadmin-plugin.mjs`, `scripts/validate-directadmin-plugin.mjs` only if shared multi-plugin support is proven necessary
- Create: package lifecycle/security tests and DirectAdmin operator runbook
- Test: package build, extraction revalidation, modes, traversal/symlink rejection, lifecycle failure injection

- [ ] Add failing package tests for flat archive root, stable ID, required role entrypoints/hooks/SDK, executable modes, path/symlink rejection, secret exclusion, and deterministic archive manifest.
- [ ] Implement plugin-owned install/update/uninstall with self-resolving staging path, dependency preflight, credential separation, atomic activation where supported, rollback, and no customer-site deletion.
- [ ] Add clean-install, failed-install, failed-update, uninstall, and reinstall tests proving site/data/config preservation and explicit cleanup boundaries.
- [ ] Add host capability detection for DirectAdmin version, supported Microweber/WordPress/runtime/PHP layout; fail closed and expose read-only diagnostics if dependencies are absent.
- [ ] Build and extract the package in a clean temporary directory; rerun validator and verify permissions/hash.
- [ ] Commit the package/lifecycle slice.

## Task 4: Company-scoped site inventory and operations

**Files:**
- Create: focused DirectAdmin inventory/provider adapter modules and tests
- Modify: canonical #812/#1059 client integration only through stable contracts
- Create: operations/recovery runbook
- Test: adapter tests plus supported-host integration checks

- [ ] Add failing fixtures for modern DirectAdmin domain roots, Microweber/WordPress installations, owner/domain/version/runtime/PHP health, ambiguous paths, symlinks, and cross-company ownership.
- [ ] Implement read-only inventory, readiness, SSL/domain, disk/resource, maintenance, diagnostics, template/module inventory, and explicit capability-degraded states.
- [ ] Route cache clear, migrations/repair, install/provision, update, backup/restore, and recovery only through #812/#322/storage owner typed operations; no shell interpolation or plugin-local backup authority.
- [ ] Require preflight and previous-known-good version; verify observed site state after operations and report ACK separately.
- [ ] Add restore/update/rollback and preservation tests, including provider timeout/partial mutation.
- [ ] Commit inventory/operations slice.

## Task 5: Builder-to-renderer publishing and Surface Manager reconciliation

**Files:**
- Create: normalized Builder snapshot → Microweber/WordPress adapter and focused tests
- Modify: current Builder projection/publisher seam and #1059 consumer integration only as needed
- Create: publish workflow docs
- Test: publish/preview/update/rollback integration tests

- [ ] Add failing tests for website, marketing/landing, service/location, product/category, blog/content, booking/contact/quote, customer/project portal, temporary Mission, store/catalogue, and public payment/QR presentation output mappings.
- [ ] Adapt the verified Builder donor to typed declarative commands; keep arbitrary PHP/SQL/routes impossible. Preserve source snapshot, content hash, version, actor, provenance, routes, and rollback reference.
- [ ] Implement isolated draft/preview, semantic diff, claim/SEO/a11y/security checks, approval fingerprint, immutable published version, promotion, scheduled publish revalidation, and rollback as a new governed intent.
- [ ] Reconcile every publication with #1059 SurfaceDescriptor/publication facts: company, domain/route, audience, version, renderer, health, provenance; Surface Manager owns topology/lifecycle.
- [ ] Test ACK-without-observation, wrong route/version, stale approval, expired offer, degraded channel/capability, rollback and idempotent retries.
- [ ] Prove one existing marketing site is imported/preserved and published preview→live→rollback without duplicate business truth.
- [ ] Commit the publishing slice.

## Task 6: Governed Titan module/component bridge

**Files:**
- Create: versioned module schemas/registry adapter and focused tests at canonical component owner
- Create: Microweber component bridge modules only for capabilities confirmed by donor/owner audit
- Test: schema, permission, data-minimization, fallback, and action-intent tests

- [ ] Add schema tests for assistant, booking, quote, customer portal, project, jobs, evidence, catalogue/cart/checkout/payment, messages/reviews/assets/workforce status/form/approval/progress module families required by issue #1044.
- [ ] For each module declare schema version, data source/capability, allowed actions, identity/context, entitlement, authority/risk class, offline/public rules, error/fallback, evidence, responsive and accessibility behavior.
- [ ] Adapt InterfaceContext/Resolver/Receipt, governed component vocabulary, action registry, Interaction intent and Visual contribution contracts; Visual presentation cannot grant actions.
- [ ] Route actions through canonical Domain APIs, Interaction/authority/ExecutionGateway; preserve company/provenance continuity; suppress private fields in Hub-safe customer projections.
- [ ] Test capability absent/degraded (e.g. booking routes to Configurator), unauthorized actions, offline preview, synthetic customer personas, and no direct legacy DB imports.
- [ ] Commit module bridge slice.

## Task 7: Portal factory, public sessions, and temporary Mission lifecycle

**Files:**
- Create: portal blueprint/session/lifecycle adapters and focused tests
- Modify: canonical #812/#322/#1059 integrations only through stable lifecycle contracts
- Create: portal/Mission operations guide
- Test: isolation, expiry, revocation, retirement, rollback, and failure injection

- [ ] Add tests for each required portal blueprint: booking, customer, quote/approval, project, property/site, subcontractor, onboarding, tender/document room, maintenance/recall, incident/emergency, asset/QR, supplier, training/SOP, proposal, customer dashboard.
- [ ] Add secure guest-session tests for hashed high-entropy token, company/surface/allowed-action scope, expiry, revocation, rate limit, audit, no raw record IDs, and cross-customer isolation.
- [ ] Add time-bounded Mission identity/start/end/capability/secrets/runtime tests; retirement delegates to #812/#322/#1059 and revokes temporary authority/credentials while preserving evidence/business updates.
- [ ] Test failed provision, expiry scheduler, route removal, credential revoke, and rollback do not orphan public endpoints or destroy canonical data.
- [ ] Commit portal lifecycle slice.

## Task 8: DirectAdmin cockpit projection and authenticated action journey

**Files:**
- Create: Brand Studio DirectAdmin role entrypoints and projection components
- Consume: #1049 shared SDK, Interface Runtime, canonical actor/company resolver
- Create: route/session/CSRF/CSP/CORS tests and supported-Evolution runbook
- Test: unit/API tests plus real DirectAdmin Evolution validation

- [ ] Add failing tests for Admin/Reseller/User presentation routes, explicit actor→company mapping, multi-company reseller allowlist, short-lived session-bound bridge, CSRF/origin/frame controls, and unresolved mapping read-only state.
- [ ] Implement Today/Needs Attention/Approvals/Daily Brief and web/site operations projections, with business concepts first and infrastructure progressively disclosed.
- [ ] Use SDK shell/theme/navigation/diagnostics and do not duplicate identity/session/CSRF logic. Show only authorized company projections and safe deep links.
- [ ] Add end-to-end DirectAdmin login → Titan identity/company resolution → Needs Attention/workforce/site health → one permitted governed action → execution/evidence → refreshed verified outcome.
- [ ] Validate actual DirectAdmin CGI/Evolution route, POST/session, permissions, CSRF, install/update and theme behavior on a supported host; record environment/version and outputs.
- [ ] Commit cockpit slice.

## Task 9: Safe template/theme ingestion and brand governance

**Files:**
- Create: import staging/validation service and tests under canonical Foundry/Builder integration boundary
- Create: brand token/template governance adapters and tests
- Test: malicious archive, schema and tenant-scope fixtures

- [ ] Add failing tests for archives/path traversal/symlink/zip bombs, unsafe MIME/SVG/HTML/script, embedded credentials, executable PHP/SQL, remote asset SSRF, and cross-company template references.
- [ ] Implement safe preview-only staging, provenance/licence metadata, schema validation, sanitization, malware/content checks, human approval, and explicit publish handoff; no install/import directly to live site.
- [ ] Adapt typed generated editable assets/templates; require human approval and retain source/version/rollback. Preserve approved template asset/license provenance.
- [ ] Implement master brand tokens/assets/templates, region/location inheritance, locked/override fields, local variation review, campaign versioning, branch publication, compliance checks and rollback through canonical governance approval.
- [ ] Test signed/unsigned provenance, denial of unsafe import, tenant isolation, inherited lock override, approval invalidation after material edit.
- [ ] Commit ingestion/governance slice.

## Task 10: Web content, SEO, campaigns, channels, commerce, and service intake

**Files:**
- Create: focused adapters in the existing canonical content/SEO/channel/domain owners
- Modify: Brand Studio UI only to consume owner outputs
- Test: contract tests with canonical provider fakes

- [ ] Adapt BlogPilot editorial buffers/cadence, scheduling, image provenance, publication history/refresh through consent, approval, and evidence owners.
- [ ] Adapt SEO/search-intent/PAA/technical/local/schema/canonical/internal-link checks; unavailable evidence must report incomplete, never fake score/ranking/service-area facts.
- [ ] Adapt campaign and social publishing/approval queues, comment-to-DM/support/lead intent and performance feedback through #1060/Omni; publication never authorizes a separate email/SMS send.
- [ ] Adapt chatbot, voice, human support, booking, reviews, onboarding, checkout, discount and public sharing interactions through canonical identity/channel/commerce/booking/CRM/finance owners; no provider secrets or duplicate business records.
- [ ] Add commerce tests for products/variants/cart/price/inventory/coupon/shipping/tax/checkout/payment/refund/rental handoff; authoritative mutations go through canonical Commerce/Pay/finance execution.
- [ ] Add conversational Web intent/plan schema and tests for no invented offer/claims, stale selected-block rejection, draft-only undo, exact draft selection for publish, scheduled dependency revalidation, bulk-operation preview, and evidence/provenance continuity.
- [ ] Coordinate #1229 standalone vs connected WordPress mode; provision/attach one vertical product and verify connected mode uses canonical Titan mappings while standalone remains independent.
- [ ] Commit content/channel/domain adapter slice.

## Task 11: Full security, regression, live-host, and release acceptance

**Files:**
- Modify focused tests/runbooks only for acceptance gaps
- Create: `docs/directadmin/BRAND-STUDIO-OPERATIONS.md` and issue acceptance evidence summary
- Test: all relevant security/unit/integration/repository and supported-host gates

- [ ] Run adversarial Tier 3 tests: company isolation, actor mapping, entitlement vs authority, CSRF, XSS/output sanitization, SSRF, traversal/symlinks, malicious templates, MIME, secret redaction, signed webhooks/replay, idempotency, session expiry/revoke, embed/CORS/CSP, command injection, TLS, least privilege, rollback/recovery.
- [ ] Run clean-host package install, one complete real publish/update/rollback, channel/form governed interaction, portal expiry/retirement, restore, and uninstall preservation journey; capture exact commands/results/environment.
- [ ] Run focused package/contract/integration tests, `pnpm gate:fast`, and full `pnpm gate`; investigate/fix every failure introduced by this branch.
- [ ] Review every unchecked issue #1044 checklist line and map it to test/artifact/host evidence; explicitly list any unsupported item—do not close if any requirement remains unverified.
- [ ] Request independent branch review, address findings, re-run verification, then create PR targeting main.
- [ ] Merge only after all required checks/review pass; verify main contains merge commit and issue acceptance evidence; only then close #1044 as completed.

## Self-review

- Every issue requirement group has an owning task: donor audit; package/install; inventory/provision/operations; Builder outputs/publish/version/rollback; component bridge; portal factory; DirectAdmin cockpit; identity/security; templates/brand governance; SEO/content/social/conversational/commerce/service; temporary Mission; #1059/#1060/#1229 integration; and Tier 3 completion evidence.
- All actions are test-first, with red→green verification and bounded commits; full-site and live-host claims are explicitly tied to observable evidence.
- Canonical ownership and company scoping are global constraints and appear in adapter, cockpit, portal, publishing, and acceptance tests.
- Remaining unknown exact files/signatures are intentionally deferred to Task 1 owner/donor census; introducing those before inspection would violate the issue's “search before adding abstractions” requirement.
- This plan is deliberately staged because #1044 spans several integrated subsystems; no intermediate slice authorizes issue closure.
