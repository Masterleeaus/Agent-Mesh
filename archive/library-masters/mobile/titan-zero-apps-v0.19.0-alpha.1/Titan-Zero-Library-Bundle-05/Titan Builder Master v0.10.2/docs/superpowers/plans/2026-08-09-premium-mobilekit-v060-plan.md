# Titan Builder Premium Mobilekit v0.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add the second Mobilekit premium extraction layer while preserving v0.5 behavior, company isolation, and presentation-only runtime ownership.

**Architecture:** Add declarative component JSON and scoped CSS/runtime helpers only. Reuse Titan's existing Generative UI registry and validator; do not import Mobilekit global runtime or introduce persistence/database changes.

**Tech Stack:** PHP/Laravel extension packaging, JSON component descriptors, vanilla JavaScript, scoped CSS, Blueprint v3.1 Python/PHP validators.

## Global Constraints
- `company_id` is the only active tenant boundary.
- Premium Mobilekit authority remains `presentation-only`.
- Source provenance remains `Mobilekit-v2.9.1-MIT`.
- No raw HTML templating, `innerHTML`, `eval`, direct fetch/XHR, localStorage/sessionStorage, service-worker ownership, or user-agent sniffing.
- Existing 17 premium components and 18 page presets remain compatible.
- No database migrations are required for v0.6.

---

### Task 1: Red contract for second Premium component wave

**Files:**
- Create: `tests/standalone/premium_mobilekit_v060_contract.php`
- Modify: `tests/js/titan-mobilekit-premium.test.js`

**Interfaces:**
- Consumes: component JSON under `resources/builder/components`, Premium CSS/JS assets, Builder manifest.
- Produces: executable regression gates for 20 new components, dark/RTL CSS, runtime safety, and total counts.

- [x] **Step 1: Add the failing PHP contract** that requires all 20 exact component IDs, Premium provenance/authority, `company_id`-safe props, manifest total `37`, and dark/RTL CSS markers.
- [x] **Step 2: Run `php tests/standalone/premium_mobilekit_v060_contract.php`** and verify it fails because the new resources are absent.
- [x] **Step 3: Extend the JS test** to require `setDisclosure`, `setPresentationMode`, and `setProgress`, and reject forbidden runtime tokens.
- [x] **Step 4: Run `node tests/js/titan-mobilekit-premium.test.js`** and verify it fails on the missing APIs.

### Task 2: Add declarative component descriptors

**Files:**
- Create: `resources/builder/components/{mobile-checkbox,mobile-radio,mobile-toggle,mobile-stepper,mobile-search,form-validation-summary,mobile-accordion,mobile-dialog,mobile-notification,mobile-alert,mobile-tooltip,mobile-progress,mobile-preloader,mobile-pagination,go-to-top,product-card,price-summary,media-carousel,image-gallery,mobile-badge}.json`

**Interfaces:**
- Consumes: existing BuilderRegistry auto-discovery and Generative UI descriptor conventions.
- Produces: 20 validated Premium components with explicit prop/action lists.

- [x] **Step 1: Create the 20 descriptors** using only JSON-safe declarative props/actions and no tenant/user identity props.
- [x] **Step 2: Run the Premium v0.6 contract** and confirm component/provenance checks pass while asset/count checks remain red.

### Task 3: Extract and scope donor styles

**Files:**
- Modify: `resources/assets/css/titan-mobilekit-premium.css`
- Modify: `resources/builder/themes/mobilekit-premium.json`

**Interfaces:**
- Consumes: Mobilekit accordion/dialog/notification/forms/progress/e-commerce/carousel/image/badge/dark/RTL patterns.
- Produces: scoped `.tpm-*` classes plus semantic dark and RTL behavior.

- [x] **Step 1: Add scoped styles** for all new components; preserve existing v0.5 selectors.
- [x] **Step 2: Add `[data-tpm-theme="dark"]` and `[dir="rtl"]` rules** without global `body/html` ownership.
- [x] **Step 3: Extend theme tokens** with dark surface/text/border and direction defaults.
- [x] **Step 4: Run the Premium v0.6 contract** and confirm CSS/theme checks pass.

### Task 4: Add safe presentation runtime helpers

**Files:**
- Modify: `resources/assets/js/titan-mobilekit-premium.js`
- Test: `tests/js/titan-mobilekit-premium.test.js`

**Interfaces:**
- Produces: `setDisclosure(root, id, open)`, `setPresentationMode(root, {theme, direction})`, `setProgress(root, value)`.

- [x] **Step 1: Implement the three small helpers** using dataset/attribute/style APIs only.
- [x] **Step 2: Run the JS test** and confirm helper behavior and forbidden-token scan pass.

### Task 5: Registry/manifest/version integration

**Files:**
- Modify: `resources/builder/manifest.json`
- Modify: `extension.json`
- Modify: `extension.manifest.json`
- Create: `docs/CHANGELOG-v0.6.0.md`

**Interfaces:**
- Produces: package version `0.6.0`, Premium component count `37`, unchanged page preset count `18`.

- [x] **Step 1: Update manifest/version metadata** without changing company tenancy or runtime ownership declarations.
- [x] **Step 2: Add changelog/provenance notes** describing the second extraction wave and excluded global donor runtime.
- [x] **Step 3: Run `php tests/standalone/premium_mobilekit_contract.php` and `php tests/standalone/premium_mobilekit_v060_contract.php`** and confirm both pass.

### Task 6: Full regression and hardened package

**Files:**
- Modify/create: `docs/DEVELOPMENT_REPORT-v0.6.0.md`
- Generate: final ZIP and `PACKAGE-FILES.sha256`

**Interfaces:**
- Consumes: complete v0.6 extension and Blueprint v3.1 tooling.
- Produces: independently verified distributable archive.

- [x] **Step 1: Lint every PHP file and parse every JSON file.**
- [x] **Step 2: Run every standalone PHP and JavaScript suite.**
- [x] **Step 3: Run active-runtime scans for legacy tenant tokens and forbidden Premium runtime features.**
- [x] **Step 4: Run Blueprint v3.1 manifest/filesystem/security validation.**
- [x] **Step 5: Package using the hardened packager (local host override only because a real MagicAI host is not supplied).**
- [x] **Step 6: Extract the exact ZIP and rerun integrity, SHA inventory, component count, company-boundary, and Blueprint checks.**
