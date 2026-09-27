# Issue #720 — field-services-os donor convergence matrix

Status: working evidence for GitHub issue #720. This file records donor disposition; it is not canonical product authority.

## Governing rules

- Titan Zero code and canonical docs remain authoritative.
- `company_id` is the only canonical tenant boundary.
- Donor auth, Prisma/database ownership, `/admin` runtime, branding, secrets and direct consequential writes are not imported.
- Existing Titan capability wins unless the donor has a demonstrably superior/missing primitive.
- Intelligence, recommendations, predictions, templates or model output never confer execution authority.
- New domains remain subject to the canonical roadmap/scope gate.

## Capability matrix

| Donor family | Disposition | Canonical convergence / preserved semantics |
|---|---|---|
| Accounting | Reject duplicate runtime | Preserve missing-cost visibility; Titan job P&L/ledger owns truth |
| Analytics | Reject duplicate runtime | Preserve period deltas, margins and conversion read-model semantics |
| Business outreach | Reject runtime | Preserve DNC, edit-before-send, template preview, per-recipient results |
| Call center | Reject runtime/provider binding | Preserve business-hours routing, warm-transfer configuration and call-flow UX |
| Campaign costs | Reject ledger/provider assumptions | Preserve provider-neutral attributable cost and cost-per-interaction/lead |
| Cashflow / Finance / Expenses | Reject duplicate persistence | Titan canonical finance/expense authority; preserve reporting/read-model UX |
| Claims | **Deferred** | Genuinely missing durable domain, but not authorized under current roadmap scope freeze |
| Customers | Reject duplicate CRUD | Titan clients/properties own canonical customer data |
| Dashboard | Reject duplicate dashboard | Command remains action-first; optional KPI/goal widgets must be read models |
| Docs | Reject donor storage | Use canonical document links / Knowledge Authority; preserve provenance/filter/preview concepts |
| Document packets | Reject persistence/direct send | Preserve lifecycle stage, taxonomy, ordered composition and immutable delivery history |
| Estimates | Reject duplicate CRUD/lifecycle | Titan estimating owns truth; claims fields deferred; destructive actions use canonical delete/governance |
| Field / Jobs | Reject direct lifecycle mutation | Titan visits/jobs/workflows own transitions and closeout |
| Funnel / Leads / Prospects | Reject persistence/campaign authority | Preserve verified-before-promote, DNC/hard-no, conversion views and manual confirmation |
| Guide | Reject donor documentation authority | Contextual help may derive from canonical Knowledge Authority and implementation evidence |
| Inspections | Reject duplicate assessment model | Titan site-visit assessment owns truth; donor photo preparation primitive adopted |
| Line items | Reject duplicate catalog | Titan PriceBookSelector/ScopeBuilder own pricing/scope |
| Login | Reject entirely | Never import donor auth or create second tenant/auth boundary |
| Manual invoices | Reject standalone invoice authority | Ad-hoc billing must still use canonical invoice contracts |
| Mileage | Reject duplicate domain | Titan mileage/GPS/odometer/claim-mile system is stronger |
| Notifications | Reject persistence | Preserve unread/read/contextual navigation UX over canonical communications/events |
| Outreach templates | Reject parallel template authority | Preserve preview/edit-before-send; templates never grant send authority |
| Photos | Reject storage/API | Canonical visit media owns truth; cross-job gallery may be a read model |
| Quick estimate | Reject vertical pricing authority | Vertical overlays may feed canonical pricing/scope contracts |
| Revenue | Reject financial authority | Preserve source-aware/period read models |
| Reviews | Reject persistence/API | Preserve completed-work review queue, channel choice and delivery outcomes |
| RWCR parent-company | Reject alternate hierarchy/tenant model | Future portfolio views aggregate explicitly authorized companies without replacing `company_id` |
| Scheduler | Reject donor automation runtime | Preserve pause/resume, caps, cooldowns, queue depth and run-history UX |
| Settings | Reject donor settings store/defaults | Use canonical company-scoped/provider configuration |
| SMS | Reject direct provider/runtime | Preserve unified conversation-thread UX through canonical communications |
| Storm targeting/canvass/operations | Reject regional/roofing runtime | Preserve generic event → area → candidates → governed enrichment → authorized campaign pattern |
| Storm playbook | Reject business-strategy authority | Optional evidence-backed vertical playbooks belong in Knowledge Authority |
| Storm pro-forma | Reject static assumptions/vendor ranking | Preserve scenario modeling with explicit assumptions/provenance |
| EagleView batch | Reject vendor runtime | Preserve cost preview + explicit authorization + governed paid provider execution + result accounting |
| DFW data | Reject regional dataset/runtime | Regional data belongs in optional capability packs with provenance/licensing |
| Storm ROI | Reject duplicate attribution API | Preserve estimated-vs-actual labeling and source/cost provenance |
| Subcontractors | Reject parallel workforce/vendor authority | Preserve compliance expiry/document provenance and cost linkage concepts |
| Tax | Reject US-specific tax authority | Jurisdictional overlays may consume canonical finance data; no hard-coded W-9/1099/IRS core |
| AI chat widget | Reject provider/action authority | Chat/voice/TTS are presentation; governed actions remain separate |

## Adopted code

### Assessment photo preparation

Adopted only the donor's useful browser-side image preparation concept into Titan canonical assessment upload flow:

- `apps/web/lib/media/prepare-assessment-photo.ts`
- `apps/web/app/app/visits/[id]/assessment/AssessmentForm.tsx`
- `apps/web/lib/media/__tests__/prepare-assessment-photo.test.ts`

Behavior:
- JPEG/PNG/WebP can be resized to a 1400px longest edge and encoded as JPEG at quality 0.82.
- No upscaling.
- Converted output is used only when smaller.
- Unsupported formats, decode failures or encode failures fall back to the original file.
- Upload still uses Titan's canonical multipart visit-media endpoint and `visit_media` persistence.

No donor API, auth, Prisma model, database table or storage authority was adopted.

## Security/governance findings

- Donor scheduler exposed a cron secret through browser-accessible configuration/query-string flow; rejected.
- Donor prospects can directly dispatch email/SMS/voice/IVR and convert prospects into customers/jobs; rejected in favor of governed canonical paths.
- Donor estimate UI supports direct permanent deletion; rejected as alternate destructive authority.
- Paid enrichment/order patterns are only reusable when cost is previewed and execution is explicitly authorized/governed.
- Estimated/modelled revenue must remain visibly distinct from actual linked job/invoice/collection truth.
- Multi-company aggregation must never become an alternate tenant boundary.

## Deletion gate

Do not remove the donor tree until:
1. adopted code has gate evidence,
2. this matrix and issue comments account for the donor capabilities,
3. no additional superior primitive remains unclassified,
4. the branch/PR diff is reviewed for accidental donor runtime dependencies.

After those checks, the consumed `field-services-os` donor tree can be deleted from the archive branch.
