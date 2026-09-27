# Titan Builder Canonical Runtime Implementation Plan

**Goal:** Turn the extracted TitanBuilder package into a bootable, tenant-safe, schema-driven Builder extension without absorbing Chatbot, WorkCore, TitanAI, Interaction Engine, or mobile-runtime authority.

**Architecture:** Preserve the extracted declarative UI runtime and resource catalogue. Put stable contracts in front of component/template/theme/action/data/AI/preview/publish behavior, add additive Titan Builder persistence, and make publish artifacts immutable. Customer, field, and owner are surface templates; verticals are overlays, not duplicated engines.

**Tech Stack:** PHP 8.2+/Laravel extension conventions, JSON declarative resources, browser JavaScript renderer, PHPUnit-compatible tests plus standalone package verification.

## Global Constraints

- Preserve folder `TitanBuilder`, namespace `App\\Extensions\\TitanBuilder`, provider `TitanBuilderServiceProvider`, slug `titan-builder`.
- Generated UI remains `presentation-only`; no eval, arbitrary HTML/Blade/JavaScript/PHP/SQL, secrets, direct writes, or authority escalation.
- Persisted objects are tenant scoped; missing tenant context fails closed.
- Donor Chatbot models/migrations/views remain reference-only and are never auto-loaded.
- WorkCore is authoritative for business records; TitanAI proposes specs only; Interaction Engine supplies action/tool catalogs through adapters.
- Publish artifacts are immutable and rollback activates a prior immutable snapshot.
- Customer, field, owner are the first three surfaces.

---

### Task 1: Lock package contracts and safety expectations
- Add standalone package assertions for identity, provider bindings, additive migrations, three surfaces, ten field/home overlays, no active Chatbot namespace/config coupling, valid JSON, and preserved donor isolation.
- Add standalone validator tests for unknown components/actions, raw HTML/script props, invalid pointers, cycle/depth limits, and safe valid specs.
- Run tests and confirm they fail before implementation.

### Task 2: Introduce stable Builder contracts and registries
- Add `ComponentRegistry`, `TemplateRegistry`, `ThemeRegistry`, `PageRepository`, `PreviewRenderer`, `Publisher`, `ActionCatalog`, `DataSourceCatalog`, `AiUiGenerator`, `SurfaceRegistry`, and `VerticalContextProvider` contracts.
- Implement JSON-backed component/template/theme/surface/data-source registries, manifest-backed action catalogue, and a fail-closed AI generator fallback.
- Convert the extracted registry/validator path to framework-light PHP where practical so it is independently testable.

### Task 3: Remove active Chatbot coupling
- Move generative UI settings from `chatbot.generative_ui` to `titan-builder.generative_ui`.
- Replace `TemplateSchema` dependency on Chatbot `TitanRegistry` with Titan Builder template resources.
- Generalize shell builder JavaScript from `activeChatbot` to `activeApplication`, with a read-only compatibility fallback for donor hosts.
- Remove Chatbot host wording from the active manifest/runtime rules.

### Task 4: Add tenant-safe persistence
- Add additive migrations for projects, versions, pages, page specs, themes, templates, assets, publish snapshots, and AI generation jobs.
- Add tenant-scoped Eloquent models and a reusable tenant scope trait.
- Add `TenantContext` that resolves only authenticated/middleware-established tenant identity and fails closed otherwise.
- Add page repository implementation that always requires tenant identity.

### Task 5: Add validation, preview, publish, rollback, and import services
- Add validated preview renderer with mobile/tablet/desktop, surface, online/offline, and theme state.
- Add immutable publisher that validates all page specs, snapshots publish payloads, increments versions transactionally, activates snapshots, and can reactivate an older same-tenant snapshot.
- Add explicit donor Chatbot import adapter that transforms supplied legacy arrays but never reads donor tables automatically.

### Task 6: Add three surfaces and field/home overlays
- Add Customer, Field (Titan Go), and Owner surface contracts/templates.
- Add Cleaning, Plumbing, Electrical, HVAC, Handyman/Property Maintenance, Landscaping/Gardening, Pest Control, Locksmith/Security, Roofing/Guttering, and Appliance/Equipment Repair as small configuration overlays.
- Add registered read-only data source descriptors and keep action intents declarative.

### Task 7: Boot extension and expose safe endpoints
- Bind all contracts in the service provider, load additive migrations/routes/views/config, and publish Builder resources.
- Add authenticated/tenant-context API endpoints for validate/repair, preview, publish, and rollback.
- Ensure donor paths are never loaded.

### Task 8: Verification and report
- Run PHP syntax lint across all PHP files.
- Parse every JSON resource.
- Run standalone package and validator tests.
- Run JavaScript runtime/shell tests.
- Run package verifier.
- Record implemented/scaffolded/partial/unverified status and exact test results in `docs/DEVELOPMENT_REPORT.md`.
