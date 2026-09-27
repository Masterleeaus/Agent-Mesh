# Titan Interface Runtime v1.0 Implementation Plan

> **For agentic workers:** implement one cumulative pass at a time. Every pass must produce a freshly verified cumulative full-extension ZIP and a CODEE Artifact Protocol v2 footer before advancing.

**PLAN_ID:** `d55dfe16-0a2b-4357-bd5c-6c71d3aae4b9`

**Baseline:** `Titan-Extension-Blueprint-v4.1-Interface-Contribution-Contract-Cumulative.zip`

**Passes:** 20 total — 18 completed, 2 remaining.

**Goal:** Build Titan Interface Runtime as Titan Zero's universal, context-aware presentation and workspace layer without duplicating domain, workflow, Builder, Maps or governance authority.

**Architecture:** Extensions publish Interface Contribution Contract v1.1 sidecars; runtime discovery retains v1.0 compatibility. Titan Interface Runtime validates/discovers them into registries, resolves active context and permissions, and composes object/collection/global-work presentations through adapters to Titan Builder, Interaction Engine and authoritative domain/read services. All protected mutations remain governed and receipt-producing.

**Tech Stack:** Laravel/PHP, Blade/Alpine where appropriate, Titan Extension Blueprint v4.1, Interface Contribution Contract v1.1 (v1.0 compatible), existing Titan Builder component vocabulary, Titan Interaction Engine contracts, Titan governance/Command Bus contracts.

## Global Constraints

- Do not implement business-domain truth inside Titan Interface Runtime.
- Do not duplicate Interaction Engine wizard/journey state machines.
- Do not directly mutate authoritative business tables.
- Mutating actions resolve through governed capabilities or Interaction Engine references.
- Every tenant-scoped request resolves `tenant_company_id` before object/query composition.
- `hub` exposure requires `customer_safe=true` and runtime authorization.
- Offline operation never increases authority.
- Preserve existing CRUD/table screens as Data mode.
- Menus are projections of registries, not architectural authority.
- All passes are cumulative; never deliver a patch-only ZIP as the pass artifact.

---

## Pass 1 — Production Scaffold & Runtime Boundary

Create `app/Extensions/TitanInterfaceRuntime` from the Blueprint production baseline; current cumulative baseline is Manifest v2.2 / `ui-surface`. Define contracts for registry, context, presentation, authority adapters and receipts; publish no business-domain models or authoritative business migrations.

**Acceptance:** installation/boot/disable/uninstall tests pass; architecture test proves the extension does not import domain model internals or write business tables.

## Pass 2 — Contribution Discovery & Validation

Implement discovery of installed extensions with `interface_contribution.enabled=true`, load Interface Contribution v1.0 sidecars, validate schema/internal references, cache immutable normalized contribution descriptors, and degrade individual bad contributors without taking down Titan Zero.

**Acceptance:** valid, invalid, missing, duplicate and disabled contribution tests; contributor health is observable.

## Pass 3 — Context Spine

Implement canonical `InterfaceContext` resolution for tenant, branch, workspace, team, user, role/capabilities, device, product surface, domain, current object, conversation and journey. Context must be explicit and serializable for traces.

**Acceptance:** tenant-isolation negatives, missing-context fail-closed behavior and context propagation tests pass.

## Pass 4 — Domain & Intent Surface Registry

Build the domain registry and canonical intent surfaces: Home, Ask, Work, Do, Decide, Explore, Insights, Data. Add navigation projection so current Menu infrastructure can render registry state without becoming authority.

**Acceptance:** multi-extension domain ordering/collision tests and product-surface visibility tests pass.

## Pass 5 — Object & Relationship Registry

Normalize object declarations, data authority, tenant scope, product-surface visibility, lifecycle refs, facets, views, actions and relationships. Add safe object-reference parsing/resolution without direct domain model coupling.

**Acceptance:** cross-extension object key collision, unknown reference, forbidden tenant and unsupported-surface tests pass.

## Pass 6 — Facet Registry & Object Workspace

Build reusable object workspaces from declared facets: Summary, Activity, Relationships, Messages, Money, Evidence, Files, Notes, Audit, Automation, Recommendations, Approvals and Data. Support lazy facet loading and permission-aware facet omission.

**Acceptance:** one object can compose facets from multiple authorized contributors while unauthorized/customer-unsafe facets never render.

## Pass 7 — Presentation Model & Titan Builder Adapter

Introduce a stable presentation tree/DTO model and an adapter that maps renderer/component hints to Titan Builder's existing component vocabulary. Unknown components fall back safely; Builder remains presentation vocabulary, not interface authority.

**Acceptance:** deterministic serialization, responsive hints, fallback behavior and component-policy tests pass.

## Pass 8 — Read Authority & Legacy Data Adapter

Implement read adapters for capability/read-model/legacy-route sources. Add Data mode that can deep-link or embed existing Laravel/MagicAI CRUD/table surfaces without copying their data logic.

**Acceptance:** read authority provenance is attached to every payload; Data mode preserves existing expert/admin routes and authorization.

## Pass 9 — Interaction Engine Adapter

Consume Interaction Engine generated-UI, wizard session and journey state contracts. Render conversational, hybrid and structured interactions without reimplementing branching, validation, progress, checkpoints, offline drafts or completion governance.

**Acceptance:** the same Interaction Engine session can be rendered in chat/panel/full-workspace modes and resume correctly.

## Pass 10 — Global Work Trays

Implement Continue, Attention, Approvals, Inbox and Sync as cross-domain trays populated by registered providers. Trays aggregate references only; authoritative state remains in source engines.

**Acceptance:** deduplication, tenant filtering, prioritization, source health and empty/degraded-state tests pass.

## Pass 11 — Context Inspector & Command Surface

Add a universal contextual inspector/drawer for any registered object plus command/search hooks for navigation, ask, inspect and permitted actions. Opening an object should not require full-route navigation unless the user chooses the full workspace.

**Acceptance:** inspector respects product surface and permissions and can escalate to full object workspace without losing context.

## Pass 11R — Blueprint v2.2 / Host Certification Rebase (compatibility rebase; does not consume a functional pass)

Rebase the completed Pass 11 runtime onto Manifest v2.2, `ui-surface`, `titan.production.core.v1`, Interface Contract v1.1 with v1.0 compatibility, typed relationships, Hub-safe actions, exact-host authorization/menu adapters, flat-root installer packaging, liveness/readiness and the host certification ladder. Functional progress remains 11/20.

## Pass 12 — Collection View Switching

Implement common projections over one collection authority: Cards, Table, Board, Calendar, Timeline and Feed. Persist user preference where appropriate without changing underlying data semantics.

**Acceptance:** switching views does not refetch through a different authority or change record scope; pagination/filter state remains coherent.

## Pass 13 — Spatial Workspace

Add Map/Spatial workspace adapters for Titan Maps Intelligence: layers, candidates, routes, territories, traffic and object pins. Maps remains authoritative for spatial calculations; Interface Runtime owns composition around the map.

**Acceptance:** spatial actions resolve to declared capabilities/interactions, and non-map domains can opt into map projections through manifests only.

## Pass 14 — Decide & Scenario Workspace

Implement first-class Decide surfaces and Scenario presentations for recommendations, alternatives, financial options, scheduling choices and predicted outcomes. Separate observation, recommendation and executable choice.

**Acceptance:** scenarios show source/provenance, assumptions, permissions and action consequences; no recommendation auto-executes merely because it is rendered.

## Pass 15 — Trust, Governance, Receipts & Rollback UI

Render risk, assurance, autonomy, approval requirements, execution receipts, correlation IDs, change summaries and rollback/compensation availability as reusable components. Consume governance state; never calculate authority locally.

**Acceptance:** protected action lifecycle is visible from proposal through approval/execution/receipt/failure; rollback invokes authoritative governed capabilities.

## Pass 16 — Working Sets / Workspace Context

Implement mixed-object working sets using existing Titan workspace/project concepts so customers, jobs, invoices, photos, chats, assets and documents can share one context envelope for people and AI.

**Acceptance:** workspace membership does not transfer object authorization; removing an object from a working set never deletes authoritative data.

## Pass 17 — Configuration Lifecycle Workspace

Standardize Draft -> Preview -> Validate -> Publish -> History -> Rollback presentation for Builder/pages/themes/forms/automations/policies and other configuration authorities that expose lifecycle capabilities.

**Acceptance:** Interface Runtime stores presentation/session metadata only; configuration versions remain owned by their source extension.

## Pass 18 — Product Surface Policies

Harden Command, Go, Hub and Onboarding projections. Add customer-safe enforcement, field/mobile compact presentation, owner/manager views and onboarding-specific progressive disclosure.

**Acceptance:** automated matrix tests prove the same object/action cannot leak owner-only data/actions into Hub or worker-only contexts.

## Pass 19 — Offline, Sync, Accessibility & Performance

Render online/offline/local/sync/conflict states from source contracts, add conflict-resolution surfaces, keyboard/focus semantics, localization, responsive behavior, query/payload budgets and presentation caching.

**Acceptance:** WCAG 2.2 AA target checks, offline-authority tests, reconnect conflict tests and p95 presentation budgets pass.

## Pass 20 — Donor Rationalization, E2E Hardening & v1.0 Release

Deep-audit Menu, Focus Mode, Announcement, Onboarding Pro and Introductions against the completed runtime. Migrate only useful primitives: menu projection, workspace focus, HUD/attention and coachmark/tutorial guidance. Retire duplicated Introductions/wizard behavior where safe. Complete E2E flows across CRM/Work/Finance/Connect/Maps, observability, docs, migration guide, supply-chain verification and v1.0 cumulative release.

**Acceptance:** full production gate passes; no duplicate wizard/workflow authority exists; upgrade/disable/uninstall behavior is verified; final cumulative ZIP is installable and rollback-safe.

---

## Completion Definition

A pass is complete only when its cumulative ZIP exists, fresh verification has run, the CODEE v2 footer reports the exact artifact hash/size/test evidence, and the next pass can start from that ZIP without requiring any earlier delta.
