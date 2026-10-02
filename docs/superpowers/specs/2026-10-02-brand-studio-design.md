# Titan Web / Portal (Brand Studio) — design

Date: 2026-10-02
Issue: [#1044 — Titan Web / Portal (Brand Studio)](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/issues/1044)
Status: conversational direction approved; this written design requires review before implementation planning.

## Problem and outcome

DirectAdmin-hosted Titan businesses need a governed way to discover, build, publish, operate, and retire websites and portals—including temporary project portals—without turning the plugin into a second web runtime, deployment engine, authority system, or evidence ledger. A business operator should be able to see the company's declared and observed surface estate, safely change a site through an authorized deployment path, and distinguish a provider acknowledgement from verified live state.

The completed issue outcome is a Microweber-backed renderer/provider integrated with Titan's existing surface, deployment, identity, authority, and evidence contracts. A company-scoped cockpit projects health and provenance; safe publishing, updates, rollback, temporary-surface expiry, and retirement preserve existing customer sites and data. Unsupported or unmapped context fails closed and degrades to read-only rather than guessing.

## Architectural decisions

1. **DirectAdmin plugin is an adapter and cockpit.** It renders operator workflows and sends typed, correlated intents. It does not own website truth, company identity, authorization, deployment state, provider secrets, or evidence.
2. **Microweber is a renderer/provider, not a Titan authority.** Site content, templates, and rendering are consumed through a narrow versioned adapter. Provider state is an observation; it never alone proves a Titan operation succeeded.
3. **Existing canonical owners remain authoritative.** `SurfaceDescriptor`/`projectSurfaceEstate` provide the surface projection contract; surface lifecycle intents remain delegated to the deployment owner. Identity/company mapping and effective authority remain canonical. `Business Evidence Ledger` records the resulting decision/execution/verification chain.
4. **Company scope is mandatory at every boundary.** Every descriptor, lookup, intent, provider mapping, and returned projection carries `company_id`. Cross-company identifiers, unresolved actor mapping, absent company context, and ambiguous ownership are denied; no global fallback query is allowed.
5. **Only verified observations become success.** Workflow is intent → policy/authority decision → deployment execution → provider acknowledgement → observed-state verification → evidence receipt. The UI distinguishes pending, acknowledged, verified, degraded, failed, and unknown states.
6. **Capabilities are explicit and degradable.** Unavailable canonical owners or optional provider features are marked unavailable/read-only. The plugin cannot synthesize a success state or silently substitute a different owner.
7. **Package/lifecycle behavior is reversible and non-destructive.** Install/update/uninstall may manage plugin-owned files/config only. Existing sites, customer content, domains, databases, and canonical business data survive plugin removal and failed upgrades. Updates stage, validate, activate atomically where supported, and retain a tested rollback path.

## User-facing workflow

- **Discover:** enumerate only surfaces visible to the resolved actor and company; show renderer/version, route, lifecycle state, last verified observation, health, and provenance. Stale/missing observations are visibly stale or unknown.
- **Build and preview:** create/edit a draft through the supported Microweber integration; sanitize and validate imported templates/assets; preview in an isolated non-live version. No publish side effect occurs during preview.
- **Publish/update:** submit a typed deployment intent with company, actor, target surface, immutable content/version reference, expected current version, idempotency key, correlation ID, and provenance. The canonical deployment owner performs authorization and execution. Conflicts require refresh/review; retries use the same idempotency key.
- **Verify/rollback:** compare observed route/version/health with the requested release. Show provider acknowledgement separately from verification. Rollback is a new governed deployment intent to a retained known-good version, followed by the same verification flow.
- **Temporary portal:** represent expiry and end-condition on the canonical surface descriptor. Expiry schedules/requests retirement through the owner; it is not permission for plugin-local deletion. Expired portals become non-publishable and remain visible in history until canonical retirement is verified.
- **Retire/uninstall:** retirement is a governed surface lifecycle action preserving evidence and business content per policy. Plugin uninstall removes only plugin-owned integration assets/config and never implicitly retires or deletes sites.
- **Operator cockpit:** show company-scoped estate, deployment status, capability availability, diagnostics, evidence/provenance references, and safe deep links. Missing actor/company mapping yields a clear no-data/read-only diagnostic view.

## Contract boundaries and data flow

```text
DirectAdmin session
  -> shared Cockpit SDK (#1049): role/context, actor mapping, CSRF/origin, shell
  -> Titan Web adapter: company-scoped surface projection + typed intent
  -> canonical policy/authority and deployment owner
  -> Microweber adapter/provider (versioned release/content reference)
  -> observed-state verifier
  -> Business Evidence Ledger receipt
  -> read-only cockpit projection
```

The plugin accepts only validated identifiers and typed fields; it never accepts shell fragments, arbitrary filesystem paths, provider credentials, or client-asserted authority. Provider credentials remain server-side and secret references are resolved by their canonical owner. Requests and diagnostics redact secrets and unnecessary customer PII. Data returned from Microweber is treated as untrusted content and is escaped/sanitized for its output context.

The first implementation must map each existing repository capability before adding a new abstraction. Reuse the shared #1049 SDK when available; until then, the plugin remains a non-production adapter/projection and must not fork session, identity, CSRF, or authorization implementations. Missing #1049 or deployment-owner contracts are integration gates, not justification to duplicate them.

## Security and failure behavior

- Fail closed on missing/invalid actor-to-company mapping, entitlement, capability, CSRF/origin/session checks, stale expected version, or cross-company reference.
- Enforce server-side authorization on every read and write; UI visibility is not authorization. DirectAdmin admin/reseller/user role is not Titan business authority.
- Prevent SSRF by using configured provider origins and allowlisted destinations; reject arbitrary URLs, redirects to untrusted/private targets, and unsafe webhook destinations.
- Reject path traversal, symlinks, archive expansion outside staging, unsafe MIME/content, executable template payloads, and command interpolation. Never invoke a shell with user-controlled arguments.
- Protect public/guest/temporary portals with explicit audience/expiry, least privilege, session revocation, secure headers, CSP/CORS allowlists, and no embedded secrets. Public routes expose only intentionally published content.
- Require signed webhook verification where used, bounded body/timeouts, replay/idempotency protections, and redacted audit diagnostics.
- Treat unavailable provider/verification/evidence services as pending, degraded, or failed—not success. Preserve the prior live version on failed validation/activation and record recovery outcomes.
- Validate install/update/uninstall/package archives against traversal, symlink, file-type, executable-mode, unexpected-file, and identity constraints; never overwrite unrelated DirectAdmin files.

## Delivery slices (within this issue)

1. **Contract discovery and fixture layer:** map canonical owners, document versioned adapter requests/responses and state machine; add fixtures/tests for company isolation, lifecycle projection, stale/unknown state, and acknowledgement-vs-verification.
2. **Read-only cockpit and package skeleton:** DirectAdmin package using the shared SDK seam, scoped estate/health/provenance projection, safe diagnostics, package validation, and no mutation path until owner contracts are usable.
3. **Draft/preview and governed publish:** Microweber adapter for immutable version references and preview; typed deployment intents, idempotency/conflict behavior, verified outcome projection, evidence references.
4. **Temporary portals and lifecycle recovery:** scoped audience/expiry, canonical retirement, rollback/recovery, failure injection, and end-to-end verification.
5. **Hardening and release evidence:** adversarial security tests, real DirectAdmin Evolution validation where an environment is available, package install/update/uninstall preservation tests, upgrade/rollback documentation, and acceptance matrix against every issue requirement.

Slices are sequencing, not permission to close the issue early. Any missing canonical owner or unavailable real DirectAdmin environment must be recorded precisely with evidence; the issue remains open until the complete acceptance contract is met or the user explicitly reprioritizes it.

## Acceptance / verification matrix

| Requirement group | Proof required before issue completion |
| --- | --- |
| Install and discovery | Clean supported DirectAdmin install/package; discovered company surfaces and health are correctly scoped and stale/unknown states explicit |
| Build and publish | Versioned Microweber preview/publish; conflict/idempotency handling; verified observed live version; provider ACK alone is not success |
| Canonical authority/evidence | Every consequential action delegates to canonical authority/deployment and produces decision/execution/verification evidence references |
| Tenant and actor isolation | Missing/unmapped identity fails closed; cross-company reads/writes denied in API and UI tests |
| Portals | Safe guest/public access, explicit audience, temporary expiry, canonical retirement and retained history |
| Operations | Rollback to known-good version verified; update/uninstall preserve sites and customer/business data |
| Input and supply-chain safety | SSRF, traversal/symlinks, malicious templates, MIME, secrets, webhook signatures, replay, session/CSRF, CORS/CSP, command injection and package tampering tests pass |
| Product integration | Cockpit projection/deep links, entitlement/capability degradation, safe template import, diagnostics and evidence metadata are demonstrated |
| Release confidence | Relevant unit/integration/security gates pass; package is reproducible and revalidated after extraction; deployment and recovery are documented |

The checklist in issue #1044 is the authoritative, more granular acceptance source; this matrix groups it for test planning and does not waive any item.

## Risks and open integration questions

- Exact Microweber API/plugin capabilities and safe import/export semantics must be confirmed against the selected supported version before adapter contracts are finalized.
- #1049 Cockpit SDK, #812 Business Node, #1049 shared plugin mechanics, #1154/#1155 lifecycle owners, and canonical deployment/authority/evidence services may not yet expose the required interfaces. Integration must consume their actual stable contracts; no local shadow owner should be introduced.
- A production DirectAdmin Evolution host and representative Microweber installation may be needed for CGI/session/CSRF, package lifecycle, routing, and permission verification. Unit tests cannot substitute for those acceptance checks.
- The issue is intentionally broad. Delivery slices reduce integration risk while retaining a single complete acceptance gate; they do not mark partially delivered behavior complete.

## Self-review

- Preserves the Blueprint, Canonical Rules, DirectAdmin development guide, and portfolio source assignment: cockpit/adapter only; canonical owners retain identity, authority, deployment, evidence, and business truth.
- Makes company scoping, fail-closed behavior, provider-ACK distinction, idempotency, rollback, package safety, and uninstall preservation explicit.
- Uses the current Surface Manager types as a projection contract without silently adding lifecycle authority to that package.
- Calls out unavailable shared owners/environments as integration gates, not blockers that authorize duplicated implementations.
- Keeps every granular issue requirement in force; implementation slices cannot be mistaken for closure.
