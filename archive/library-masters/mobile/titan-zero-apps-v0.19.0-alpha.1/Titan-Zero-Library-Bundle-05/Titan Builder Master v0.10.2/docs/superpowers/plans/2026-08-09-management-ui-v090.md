# Titan Builder v0.9 Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete Super Admin and company/user management UI to the installer-ready Titan Builder v0.8 package.

**Architecture:** Native Blade/web routes plus a small extension-owned management JS/CSS layer. Existing Builder APIs/services remain authoritative for application provisioning, preview, publishing and AI; one additive settings table supports Builder-specific company/global preferences.

**Tech Stack:** PHP 8.2+, Laravel 10, Blade, vanilla JavaScript/CSS, existing Titan Builder services/registries.

## Global Constraints
- `company_id` remains the only tenant boundary.
- CRM/TitanAI/Titan Mobile/Interaction Engine/Chatbot/Titan Connect boundaries are unchanged.
- Current `titan-extension-v1` installer contract and flat ZIP root are preserved.
- No copied MagicAI core views/files.
- No generic `extension` publish tag.

---

### Task 1: Lock management UI package contract
**Files:** Create `tests/standalone/management_ui_v090.php`.
**Produces:** A failing contract asserting routes, views, provider wiring, assets, settings migration/model/service, admin/company pages and v0.9 metadata.
- [ ] Write the contract.
- [ ] Run it and confirm failure is due to absent v0.9 UI.

### Task 2: Add scoped settings persistence
**Files:** Create migration, `BuilderSetting`, `BuilderSettingsRepository`; modify provider.
**Produces:** `companySettings`, `updateCompanySettings`, `platformSettings`, `updatePlatformSettings` with explicit scope/authorization boundaries.
- [ ] Add model/migration/service.
- [ ] Add standalone settings assertions.
- [ ] Run contract.

### Task 3: Add management data services and controllers
**Files:** Create `ManagementDashboardService`, `CompanyManagementController`, `AdminManagementController`, `ManagementSettingsController`.
**Produces:** Company dashboard/project/editor/app/assets/brand/integration/settings/permissions pages and admin dashboard/integration/registry/vertical/permissions/diagnostics/settings pages.
- [ ] Add company-scoped data queries.
- [ ] Add admin-only capability/registry diagnostics.
- [ ] Add validated settings updates.
- [ ] Run PHP lint and contract.

### Task 4: Add web routes and Blade shell/pages
**Files:** Create `routes/web.php`, layout/partials/company/admin Blade views.
**Produces:** Fully navigable management UI.
- [ ] Add routes with configured middleware and controller ability checks.
- [ ] Add responsive shell/nav/flash/error UI.
- [ ] Add all company and admin pages.
- [ ] Run view/static contract.

### Task 5: Add functional management frontend
**Files:** Create `resources/assets/js/titan-builder-management.js` and `resources/assets/css/titan-builder-management.css`; modify provider publishing.
**Produces:** API-backed project creation/editor, app configuration actions, asset upload, preview, validation, AI proposal, publish/rollback and settings interactions.
- [ ] Implement safe fetch helper with CSRF.
- [ ] Implement page/editor/app interactions.
- [ ] Add visible error/success state.
- [ ] Syntax-check JS and run contract.

### Task 6: Version, manifests, docs and regression
**Files:** Modify manifests/config/provider/verifier/README; create `docs/MANAGEMENT-UI.md`, `docs/DEVELOPMENT_REPORT-v0.9.0.md`, `CHANGELOG-v0.9.0.md`.
**Produces:** Installer-ready v0.9 metadata and documentation.
- [ ] Bump to `0.9.0`.
- [ ] Add management capabilities/routes/owned table metadata.
- [ ] Update verifier expectations.
- [ ] Run all standalone, JS, PHP lint, JSON parse, unsafe/tenant scans.

### Task 7: Rebuild integrity map and exact ZIP verification
**Files:** Regenerate `extension.json` integrity and `PACKAGE-FILES.sha256`; package flat-root ZIP.
**Produces:** `/mnt/data/Titan-Builder-v0.9.0-management-ui.zip`.
- [ ] Rebuild installer manifest/integrity.
- [ ] Build flat-root archive.
- [ ] Extract exact ZIP into clean directory.
- [ ] Rerun full verification against extracted artifact.
