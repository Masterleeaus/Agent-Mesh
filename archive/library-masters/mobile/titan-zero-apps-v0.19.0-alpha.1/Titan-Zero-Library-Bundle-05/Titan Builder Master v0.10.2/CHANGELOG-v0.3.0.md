# Titan Builder v0.3.0 Changelog

## MagicAI Extension Blueprint v3.1 hardening

- Replaced the legacy manifest with the exact five-field MagicAI `extension.json` shape.
- Added authoritative `extension.manifest.json` with native-family identity, capabilities, authenticated route profile, owned tables, tenant key, retained-data policy and lifecycle declarations.
- Added `ExtensionRegisterKeyProviderInterface` and `UninstallExtensionServiceProviderInterface` to `TitanBuilderServiceProvider`.
- Added `registerKey(): string` returning `titan-builder`.
- Added static idempotent `uninstall()` that removes only published operational copies and retains tenant database rows/uploads.
- Added the shared MagicAI `extension` publish tag for config, Builder resources and collision-safe public renderer assets.
- Retained package-specific publish tags for developer use.
- Made each owned table create path schema-idempotent with `Schema::hasTable()` guards.
- Added Blueprint v3.1 standalone regression coverage and a host-executable architecture PHPUnit test.
- Upgraded the internal package verifier to validate the dual-manifest/lifecycle contract.
- Added explicit MagicAI provider-map/discovery and host-integration documentation.

## Preserved behavior

- No Builder contracts, registries, schemas, surfaces, vertical overlays or immutable publish/rollback semantics were removed.
- No Chatbot runtime ownership was reintroduced.
- No WorkCore, TitanAI, Interaction Engine or TitanMobileCore implementation was embedded into Titan Builder.

## Verification boundary

The source package was verified without a full MagicAI Laravel host. The final release ZIP is therefore packaged with Blueprint v3.1's explicit `--allow-unverified-host` development override. Production release still requires the target MagicAI host to verify provider discovery/map wiring, lifecycle interfaces, middleware, migrations, storage and Laravel tests.
