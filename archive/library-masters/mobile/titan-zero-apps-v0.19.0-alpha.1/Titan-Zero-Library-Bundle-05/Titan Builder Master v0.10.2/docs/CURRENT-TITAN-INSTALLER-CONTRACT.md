# Current Titan Installer Contract — Titan Builder v0.9.0

Titan Builder packages for the current Titan installer use a two-layer manifest model.

## Installation manifest

`extension.json` is authoritative for installation and deployment. Titan Builder declares:

- schema: `titan-extension-v1`
- slug: `titan-builder`
- folder: `TitanBuilder`
- provider: `App\Extensions\TitanBuilder\System\TitanBuilderServiceProvider`
- migrations: enabled
- PHP: `>=8.2`
- MagicAI: `>=10.91`
- Titan platform: `>=1.0`
- extension-specific publish tag: `titan-builder`
- SHA-256 integrity map for package files

The distributable ZIP is flat at archive root: `extension.json`, `System/`, `routes/`, `resources/`, `database/`, etc. It must not be wrapped in a `TitanBuilder/` directory.

After extraction the installer places these files in `app/Extensions/TitanBuilder/`, so the manifest provider resolves to:

`app/Extensions/TitanBuilder/System/TitanBuilderServiceProvider.php`

## Lifecycle sidecar

`extension.manifest.json` remains the richer Titan/Blueprint lifecycle document. It describes capabilities, optional integrations, company tenancy, route profile, owned tables, uninstall policy and test classes. It is not used as a substitute for the installer manifest.

## Publishing

The provider publishes the install payload under the extension-specific `titan-builder` tag. It does not use the generic `extension` tag. Granular `titan-builder-resources` and `titan-builder-config` tags remain available for development/operations.

## Integrity

`tools/build-installer-manifest.php` rebuilds the `extension.json` integrity map. The manifest deliberately excludes itself and `PACKAGE-FILES.sha256` to avoid recursive hashes. `PACKAGE-FILES.sha256` independently inventories the final package.

## Signing

This package is unsigned unless a trusted Titan Ed25519 publishing key is supplied by the release environment. Do not fabricate a signature for local/manual packages.
