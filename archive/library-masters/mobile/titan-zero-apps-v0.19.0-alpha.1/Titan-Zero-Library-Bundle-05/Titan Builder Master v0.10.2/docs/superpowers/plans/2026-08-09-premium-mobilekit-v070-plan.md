# Titan Builder v0.7 Premium Application Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reusable Mobilekit-derived application patterns, blocks, and vertical-ready mobile templates to Titan Builder.

**Architecture:** Add declarative JSON resources and safe browser renderers on top of the existing v0.6 Generative UI registry. Keep all Premium behavior presentation-only and leave operational authority with WorkCore/TitanMoney/ZeroPay/Communications. Preserve `company_id` as the only tenant boundary.

**Tech Stack:** PHP/Laravel extension resources, JSON Generative UI descriptors, vanilla JavaScript DOM renderer, scoped CSS, standalone PHP/Node/Python verification.

## Global Constraints

- Version target: `0.7.0`.
- `company_id` is the only tenant boundary.
- No direct business writes from Premium UI.
- No raw HTML rendering or executable props.
- No service-worker ownership, fetch/XHR, browser storage, eval, or UA sniffing in Premium runtime.
- Existing 108 registered UI types must remain valid.
- New components must be registered in both server catalogue resources and the browser Generative UI runtime.

---

### Task 1: Application component contract

**Files:**
- Create: `tests/standalone/premium_mobilekit_v070_contract.php`
- Create: `tests/js/titan-mobilekit-v070.test.js`

**Interfaces:**
- Produces: required component IDs, block IDs, template IDs, version/count expectations.

- [ ] Write the standalone contract asserting all 17 components, 9 blocks, 6 templates, `0.7.0`, company boundary, and Premium metadata.
- [ ] Run it and verify it fails because v0.7 resources do not exist.
- [ ] Write the browser registry test asserting all 17 new types are registered.
- [ ] Run it and verify it fails because the renderer lacks the new types.

### Task 2: Declarative application resources

**Files:**
- Create: `resources/builder/components/<17 application component files>.json`
- Create: `resources/builder/blocks/<9 premium block files>.json`
- Create: `resources/builder/templates/<6 premium app template files>.json`
- Modify: `resources/builder/manifest.json`
- Modify: `extension.json`
- Modify: `extension.manifest.json`

**Interfaces:**
- Produces: server-catalogue component/block/template descriptors.

- [ ] Add the 17 component descriptors with presentation-only authority and explicit props/actions.
- [ ] Add the 9 block descriptors as composable application-pattern metadata.
- [ ] Add the 6 template descriptors referencing existing Customer/Field/Owner surfaces rather than defining new runtimes.
- [ ] Set version/count/feature metadata to v0.7.0.
- [ ] Run the standalone contract until the resource portion is green.

### Task 3: Browser renderer integration

**Files:**
- Modify: `resources/assets/js/titan-generative-ui.js`
- Modify: `resources/assets/js/titan-mobilekit-premium.js`

**Interfaces:**
- Consumes: v0.7 component descriptors.
- Produces: safe DOM renderers for all 17 types.

- [ ] Register each new component using DOM creation and `safeUrl` for media.
- [ ] Keep chat/invoice/commerce interactions declarative; emit no network calls.
- [ ] Add only minimal Premium helper functions required for presentation state.
- [ ] Run the v0.7 browser registry test and existing JS suites.

### Task 4: Scoped Premium styling

**Files:**
- Modify: `resources/assets/css/titan-mobilekit-premium.css`

**Interfaces:**
- Produces: scoped `tpm-*` styles for application patterns.

- [ ] Add auth/profile/chat/invoice/cart/product/article/social/system-state styles.
- [ ] Add dark/RTL/reduced-motion variants using the existing Premium token system.
- [ ] Verify no unscoped donor selectors or remote asset imports are introduced.

### Task 5: Representative renderable specs

**Files:**
- Create: `resources/builder/specs/premium-application-patterns.json`
- Create: `resources/builder/pages/premium-application-patterns.json`
- Modify selected existing mobile presets only where using the new components materially improves composition.

**Interfaces:**
- Produces: one validator-backed showcase exercising every new type.

- [ ] Build a flat-map Generative UI spec containing all 17 new types.
- [ ] Validate it with the server-side standalone Generative UI validator.
- [ ] Ensure `meta.company_boundary` is `company_id`.

### Task 6: Documentation and full regression

**Files:**
- Create: `docs/CHANGELOG-v0.7.0.md`
- Create: `docs/DEVELOPMENT_REPORT-v0.7.0.md`
- Modify: `README.md`
- Modify: `docs/donor/MOBILEKIT-PREMIUM-EXTRACTION.md`

**Interfaces:**
- Produces: release documentation and verification evidence.

- [ ] Run every standalone PHP suite.
- [ ] Run every Node suite and integration verifier.
- [ ] PHP-lint all PHP files and parse all JSON files.
- [ ] Scan active runtime for legacy tenant tokens and forbidden Premium runtime APIs.
- [ ] Run Blueprint v3.1 manifest/filesystem/security validation.
- [ ] Package with hardened Blueprint tooling.
- [ ] Extract the exact ZIP and repeat all critical verification against the packaged artifact.
