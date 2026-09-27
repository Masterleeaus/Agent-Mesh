# Titan Builder v0.8.0 CRM Cutover Implementation Plan

> **For agentic workers:** implement test-first and preserve the v0.7 package as the baseline.

**Goal:** Cut Titan Builder v0.7 over from WorkCore to CRM/TitanAI/four-PWA provisioning without rewriting its existing Builder or Premium Mobilekit architecture.

**Architecture:** Reuse Builder projects/pages/version snapshots as application-definition persistence. Add capability-aware integration contracts and provisioning/readiness/mobile-definition services around the existing registries, validator and publisher.

**Tech Stack:** PHP 8.2, Laravel 10 conventions, JSON declarative resources, existing Titan Generative UI JavaScript.

## Global Constraints
- `company_id` only; fail closed.
- CRM authoritative; no direct CRM models.
- TitanAI external; fallback unavailable adapter preserved.
- Presentation-only Builder.
- Four runtimes remain external/configuration-driven.
- Existing 125 components / 26 blocks / 10 templates / 29 pages / 25 specs preserved or increased, never reduced.
- Additive migrations only; no new provisioning persistence table.

### Task 1 — Baseline and WorkCore cutover
Write failing static contract tests, classify WorkCore references, convert active resources/runtime to CRM/generic contracts, preserve sentinel/history references only.

### Task 2 — CRM catalogs and capability discovery
Add DTO/provider/discovery contracts and CRM read-model definitions with required-capability metadata.

### Task 3 — TitanAI adapter
Add host-bound TitanAI gateway adapter and fail-closed service-provider selection. Ensure generated specs are validated before use.

### Task 4 — Four surfaces
Update customer/field/owner identities and connectivity profiles; add onboarding surface/template/page/spec using existing registered components.

### Task 5 — Application provisioning
Add application-definition DTO, company-scoped provisioning gateway, readiness service, mobile-definition publisher and authenticated/capability-checked APIs.

### Task 6 — Vertical alignment and migration
Convert all ten vertical packs to `crm_capabilities`, `read_models`, `action_intents`, `ui_hints`; add deterministic WorkCore-era spec migrator with review markers for ambiguous mappings.

### Task 7 — Governance and audit
Add actor capability authorization and structured audit context. Source surface remains audit-only, never authority.

### Task 8 — Documentation and package verification
Create required integration/upgrade/removal docs, update manifests/version metadata, run PHP/JSON/JS/static/Blueprint/security scans, package, extract and re-run exact-artifact checks.
