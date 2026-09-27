# Titan Builder v0.3.0 MagicAI Hardening Implementation Plan

> **For agentic workers:** Execute task-by-task with tests before production changes.

**Goal:** Upgrade Titan Builder v0.2.0 to the hardened MagicAI Extension Blueprint v3.1 lifecycle and release contract without replacing its existing Builder runtime.

**Architecture:** Preserve the existing schema-driven Builder services, registries, persistence, surfaces and immutable publisher. Add the dual-manifest MagicAI package contract, marketplace lifecycle interfaces, shared publish tag, idempotent uninstall behavior, schema-safe migrations, and blueprint-aware verification around the existing implementation.

**Tech Stack:** PHP 8.2+/Laravel extension conventions, JSON manifests/resources, JavaScript runtime tests, standalone PHP verification, Blueprint v3.1 Python release validation.

## Global Constraints

- Keep install folder and namespace `TitanBuilder` / `App\\Extensions\\TitanBuilder`.
- Preserve all existing Builder contracts, resources, Customer/Field/Owner surfaces and immutable publishing behavior.
- Keep tenant data and tenant uploads on uninstall by default.
- Do not add Chatbot runtime ownership or donor autoloading.
- Do not claim host-runtime compatibility without a real MagicAI host test.
- Use Blueprint v3.1's exact five-field legacy `extension.json` plus `extension.manifest.json`.
- Publish package-owned config/static Builder resources under the shared `extension` tag using collision-safe destinations.
- Make migration `up()` schema-idempotent for package-owned tables.

---

### Task 1: Lock Blueprint package contract with regression tests
- Add a standalone Blueprint contract test covering manifests, lifecycle provider interfaces, registration key, publish tag, uninstall retention, owned tables and migration guards.
- Run it against v0.2.0 and confirm it fails for the missing Blueprint lifecycle pieces.

### Task 2: Add v3.1 manifests and marketplace lifecycle
- Replace `extension.json` with the exact five-field legacy shape at version `0.3.0`.
- Add `extension.manifest.json` describing native family, tenant key, routes, tables, capabilities, lifecycle and retained data policy.
- Implement marketplace register-key and uninstall interfaces in `TitanBuilderServiceProvider`.
- Publish config and Builder static resources with the shared `extension` tag while retaining package-specific tags for developer ergonomics.
- Make uninstall idempotently remove only published operational copies, never tenant database rows or uploaded assets.

### Task 3: Harden migrations and package verification
- Guard each package-owned table create with `Schema::hasTable()` so `up()` is safe when an owned table already exists.
- Update `tools/verify-package.php` for v0.3.0 dual-manifest/lifecycle assertions.
- Add an architecture PHPUnit test for host execution when a MagicAI test runtime is available.

### Task 4: Documentation and release verification
- Add Blueprint compliance and host-integration notes to README/development report.
- Run all standalone PHP and JS tests, all PHP lint, all JSON parsing, Blueprint v3.1 manifest/filesystem validation and package scanning.
- Package with Blueprint v3.1's hardened packager using the explicit unverified-host development override because no MagicAI host is supplied in this turn.
- Verify final ZIP integrity and record SHA-256.
