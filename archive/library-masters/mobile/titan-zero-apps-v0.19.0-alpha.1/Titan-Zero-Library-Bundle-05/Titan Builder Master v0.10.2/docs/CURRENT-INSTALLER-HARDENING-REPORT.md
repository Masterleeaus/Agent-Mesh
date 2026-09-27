# Titan Builder v0.8.0 — Current Installer Hardening Report

## Result

Titan Builder v0.8.0 has been repackaged for the current Titan custom-extension installer without changing its CRM/TitanAI/four-PWA/onboarding runtime architecture.

## Installer contract

IMPLEMENTED:

- root `extension.json` uses `schema: titan-extension-v1`
- slug: `titan-builder`
- semantic version: `0.8.0`
- folder: `TitanBuilder`
- provider: `App\Extensions\TitanBuilder\System\TitanBuilderServiceProvider`
- migrations enabled
- PHP `>=8.2`
- MagicAI `>=10.91`
- Titan Platform `>=1.0`
- dependencies declared
- extension-specific publish tag: `titan-builder`
- generated SHA-256 integrity map
- provider file/namespace/class casing aligned for Linux
- `extension.manifest.json` retained as the richer lifecycle/capability sidecar

## ZIP contract

The release ZIP is intentionally flat at archive root. It contains `extension.json`, `System/`, `routes/`, `resources/`, `database/`, etc. directly. It is not wrapped in an extra `TitanBuilder/` directory.

The release excludes traversal entries and junk such as `__MACOSX`, `.DS_Store`, `.env`, `.git`, and `node_modules`.

## Publishing

The generic `extension` publish tag was removed from Titan Builder. The main install payload now publishes under `titan-builder`, with granular `titan-builder-resources` and `titan-builder-config` tags retained.

## Integrity and signing

The production manifest carries generated SHA-256 hashes for package files except `extension.json` itself and `PACKAGE-FILES.sha256`, avoiding recursive hashes. `PACKAGE-FILES.sha256` independently inventories the final package.

SIGNING: UNVERIFIED / NOT APPLIED. No Titan Ed25519 private publishing key was supplied to this environment, so no signature was fabricated.

## Verification

- standalone PHP suites: 20
- JavaScript test suites: 6
- PHP linted: 128 files
- JSON parsed: 325 files
- JavaScript syntax checked: 9 files
- active legacy tenant-boundary files: 0
- unsafe `eval` / `new Function` / `document.write` hits: 0
- junk filesystem entries: 0

Host runtime certification still requires installation into the real Titan/MagicAI environment.
